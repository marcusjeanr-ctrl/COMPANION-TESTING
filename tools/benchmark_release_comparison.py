#!/usr/bin/env python3
"""Serial alternating comparison of frozen backend revisions. No provider calls."""
import argparse, hashlib, json, os, pathlib, statistics, subprocess, tempfile, time

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--baseline-ref', default='540df20f602bd475b9149c1ab28aa705e391f72d')
parser.add_argument('--candidate-ref', default='HEAD', help='Git revision or WORKTREE for a proposed fix')
parser.add_argument('--pairs', type=int, default=10)
parser.add_argument('--cases', type=int, nargs='+', default=[600, 2000])
parser.add_argument('--output', required=True)
args = parser.parse_args()
if args.pairs < 10 or any(n not in (600, 2000) for n in args.cases):
    parser.error('At least ten pairs; cases must be 600 and/or 2000 messages')

def git(*cmd):
    return subprocess.check_output(['git', *cmd], cwd=ROOT)

def active_workloads():
    ancestors = {os.getpid()}
    pid = os.getppid()
    while pid > 1 and pid not in ancestors:
        ancestors.add(pid)
        try: pid = int(pathlib.Path(f'/proc/{pid}/stat').read_text().split(') ', 1)[1].split()[1])
        except (OSError, ValueError, IndexError): break
    found = []
    for proc in pathlib.Path('/proc').iterdir():
        if not proc.name.isdigit() or int(proc.name) in ancestors: continue
        try: command = (proc/'cmdline').read_bytes().replace(b'\0', b' ').decode(errors='replace')
        except OSError: continue
        if any(token in command for token in ['benchmark_panel_reads.cjs', 'benchmark_tracking_pipeline.cjs', 'benchmark_release_comparison.py', 'tools/run_tests.cjs', 'tools/test_ui_browser.py', 'tools/test_visibility_browser.py']):
            found.append(int(proc.name))
    return found

def summary(values):
    q = statistics.quantiles(values, n=4, method='inclusive')
    return dict(median=statistics.median(values), min=min(values), q1=q[0], q3=q[2], max=max(values))

node = subprocess.check_output(['node', '--version'], text=True).strip()
if not node.startswith('v22.'): raise SystemExit('Node 22 required')
if active_workloads(): raise SystemExit('Other test/benchmark workloads are active; run on an idle container')
baseline = git('show', f'{args.baseline_ref}:dist/backend.js')
candidate = (ROOT/'dist/backend.js').read_bytes() if args.candidate_ref == 'WORKTREE' else git('show', f'{args.candidate_ref}:dist/backend.js')
head = git('rev-parse', 'HEAD').decode().strip()
report = {'baselineRef': args.baseline_ref, 'candidateRef': args.candidate_ref, 'checkoutHead': head, 'node': node,
          'pairsPerCase': args.pairs, 'sourceHashes': {'baseline': hashlib.sha256(baseline).hexdigest(), 'candidate': hashlib.sha256(candidate).hexdigest()},
          'method': 'Fresh process per source/run; AB then BA pair order; cold first panel read, 3 warmups, median of 10 warm reads. Ten runs per source per case. No concurrent local test/benchmark workload. Host/cotenant scheduling cannot be controlled.',
          'records': [], 'results': {}, 'hostLoadStart': os.getloadavg()}
env = os.environ.copy()
for key in ['COMPANION_CARD', 'COMPANION_BENCH_ASSESSMENTS', 'COMPANION_BENCH_GROUPED']:
    env.pop(key, None)
env['COMPANION_BIND_READINGS'] = '1'
started = time.monotonic()
with tempfile.TemporaryDirectory(prefix='companion-frozen-comparison-') as directory:
    files = {}
    for name, source in [('baseline', baseline), ('candidate', candidate)]:
        files[name] = pathlib.Path(directory)/(name+'.js'); files[name].write_bytes(source)
    for count in args.cases:
        env['COMPANION_BENCH_REPLIES'] = str(count//2)
        for pair in range(args.pairs):
            if active_workloads(): raise SystemExit('Concurrent workload detected; invalidate and rerun comparison')
            order = ['baseline', 'candidate'] if pair % 2 == 0 else ['candidate', 'baseline']
            for index, name in enumerate(order):
                output = subprocess.check_output(['node', str(ROOT/'tools/benchmark_panel_reads.cjs'), str(files[name])], cwd=ROOT, env=env, text=True)
                row = json.loads(output.strip()); row.pop('file')
                if row['warnings'] or row['messages'] != count: raise SystemExit('Invalid benchmark fixture/warnings')
                report['records'].append({'source': name, 'pair': pair, 'position': index, **row})
            print(f'{count} messages: pair {pair+1}/{args.pairs} complete', flush=True)
        result = {}
        for metric in ['coldMs', 'medianMs']:
            by_source = {name: [r[metric] for r in report['records'] if r['messages']==count and r['source']==name] for name in files}
            stats = {name: summary(values) for name, values in by_source.items()}
            stats['percentChange'] = (stats['candidate']['median']/stats['baseline']['median']-1)*100
            stats['pairedPercentMedian'] = statistics.median((b/a-1)*100 for a,b in zip(by_source['baseline'],by_source['candidate']))
            result[metric] = stats
        report['results'][str(count)] = result
report['elapsedSeconds'] = time.monotonic()-started
report['hostLoadEnd'] = os.getloadavg()
if args.candidate_ref == 'WORKTREE' and (ROOT/'dist/backend.js').read_bytes() != candidate:
    raise SystemExit('Candidate source changed during measurement')
report['mergeGate'] = {'thresholdPercent': 5, 'metric':'ratio of medians of the ten 2000-message warm medians',
                       'passed': '2000' in report['results'] and report['results']['2000']['medianMs']['percentChange'] <= 5}
pathlib.Path(args.output).write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'results':report['results'],'mergeGate':report['mergeGate']}, indent=2))
raise SystemExit(0 if report['mergeGate']['passed'] else 2)
