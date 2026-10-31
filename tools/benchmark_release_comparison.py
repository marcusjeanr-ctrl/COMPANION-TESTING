#!/usr/bin/env python3
"""Serial CPU/wall comparisons; main-relative gate, historical source informational."""
import argparse, hashlib, json, math, os, pathlib, statistics, subprocess, tempfile, time
ROOT = pathlib.Path(__file__).resolve().parents[1]
HISTORICAL = '540df20f602bd475b9149c1ab28aa705e391f72d'
METRICS = ('coldMs', 'coldCpuMs', 'medianMs', 'cpuMedianMs')

def summary(values):
    if len(values) < 2 or not all(math.isfinite(x) and x >= 0 for x in values):
        raise ValueError('At least two finite, nonnegative observations required')
    q = statistics.quantiles(values, n=4, method='inclusive')
    median = statistics.median(values)
    return dict(median=median, min=min(values), q1=q[0], q3=q[2], max=max(values),
                iqr=q[2]-q[0], spread=max(values)-min(values),
                mad=statistics.median(abs(x-median) for x in values), count=len(values))

def comparison(records, baseline, candidate, count):
    result = {}
    for metric in METRICS:
        data = {name:[r[metric] for r in records if r['messages']==count and r['source']==name]
                for name in (baseline,candidate)}
        stats = {name:summary(values) for name,values in data.items()}
        a,b = stats[baseline]['median'],stats[candidate]['median']
        if a <= 0: raise ValueError('Baseline median must be positive')
        result[metric] = {'baseline':stats[baseline], 'candidate':stats[candidate],
                          'absoluteChangeMs':b-a, 'percentChange':(b/a-1)*100,
                          'pairedPercentMedian':statistics.median((b/a-1)*100 for a,b in zip(data[baseline],data[candidate]))}
    # Pool baseline warm observations across all runs, separately in wall/CPU units.
    result['baselinePooledRuns'] = {name:result[metric]['baseline'] for name,metric in [('wall','medianMs'),('cpu','cpuMedianMs')]}
    result['baselinePooledWarm'] = {
        metric:summary([s[field] for r in records if r['source']==baseline and r['messages']==count for s in r['warmSamples']])
        for metric,field in [('wall','wallMs'),('cpu','cpuMs')]}
    return result

def gate(result):
    if '2000' not in result:
        return {'status':'inconclusive','passed':False,'continueAllowed':False,'reason':'Missing required 2000-message case'}
    r=result['2000']; checks={}
    for name,metric in [('wall','medianMs'),('cpu','cpuMedianMs')]:
        change=r[metric]; noise=r['baselinePooledRuns'][name]['iqr']
        checks[name]={'percentChange':change['percentChange'],'absoluteChangeMs':change['absoluteChangeMs'],
                      'baselinePooledIqrMs':noise,'exceedsFivePercent':change['percentChange']>5,
                      'exceedsBaselineNoise':change['absoluteChangeMs']>noise}
    over=[v['exceedsFivePercent'] for v in checks.values()]
    status='pass' if not any(over) else 'fail' if all(over) and all(v['exceedsBaselineNoise'] for v in checks.values()) else 'inconclusive'
    return {'status':status,'passed':status=='pass','continueAllowed':status!='fail','thresholdPercent':5,
            'checks':checks,'rule':'Fail only if both warm wall and CPU medians exceed +5% and both absolute differences exceed their respective pooled baseline run-median IQRs.'}

def git(*args): return subprocess.check_output(['git',*args],cwd=ROOT)

def active_workloads():
    ancestors={os.getpid()};pid=os.getppid()
    while pid>1 and pid not in ancestors:
        ancestors.add(pid)
        try: pid=int(pathlib.Path(f'/proc/{pid}/stat').read_text().split(') ',1)[1].split()[1])
        except (OSError,ValueError,IndexError):break
    found=[]
    for proc in pathlib.Path('/proc').iterdir():
        if not proc.name.isdigit() or int(proc.name) in ancestors:continue
        try:command=(proc/'cmdline').read_bytes().replace(b'\0',b' ').decode(errors='replace')
        except OSError:continue
        if any(t in command for t in ['benchmark_panel_reads.cjs','benchmark_tracking_pipeline.cjs','benchmark_release_comparison.py','tools/run_tests.cjs','tools/test_ui_browser.py','tools/test_visibility_browser.py']): found.append(int(proc.name))
    return found

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline-ref',default='origin/main',help='Pin main as it stood at this phase start')
    parser.add_argument('--candidate-ref',default='HEAD',help='Revision or WORKTREE')
    parser.add_argument('--reference-ref',default=HISTORICAL,help='Historical informational comparison only')
    parser.add_argument('--pairs',type=int,default=20)
    parser.add_argument('--cases',type=int,nargs='+',default=[600,2000])
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    if args.pairs<20 or any(n not in (600,2000) for n in args.cases):parser.error('At least twenty alternating pairs per case; cases must be 600 and/or 2000')
    node=subprocess.check_output(['node','--version'],text=True).strip()
    if not node.startswith('v22.'):raise SystemExit('Node 22 required')
    if active_workloads():raise SystemExit('Other local tests/benchmarks active; run on an idle container')
    refs={'baseline':args.baseline_ref,'candidate':args.candidate_ref,'reference':args.reference_ref}
    sources={name:(ROOT/'dist/backend.js').read_bytes() if ref=='WORKTREE' else git('show',ref+':dist/backend.js') for name,ref in refs.items()}
    report={'schemaVersion':2,'refs':refs,'resolvedRefs':{name:git('rev-parse',ref+'^{commit}').decode().strip() if ref!='WORKTREE' else 'WORKTREE' for name,ref in refs.items()},
            'checkoutHead':git('rev-parse','HEAD').decode().strip(),'node':node,'pairsPerCase':args.pairs,
            'sourceHashes':{name:hashlib.sha256(b).hexdigest() for name,b in sources.items()},'records':[],'results':{},'comparisons':{},
            'method':f'{args.pairs} observations per source/case; ABC then CBA orders alternate, producing {args.pairs} alternating pairs for each pairwise comparison. Fresh Node process per source/run, cold first projection, three warmups and ten measured warm projections. CPU is process.cpuUsage user+system delta over the same projection interval. Whole-process CPU/wall also recorded. No concurrent local tests; cotenant scheduling uncontrolled.',
            'noiseDefinition':'Pool baseline warm run medians across runs; compute wall and CPU IQR independently. Per-read warm IQR is retained as additional information. Compare like-unit median differences to run-median IQRs.',
            'hostLoadStart':os.getloadavg(),'status':'running'}
    output=pathlib.Path(args.output);started=time.monotonic()
    def save():output.write_text(json.dumps(report,indent=2)+'\n')
    env=os.environ.copy()
    for key in ['COMPANION_CARD','COMPANION_BENCH_ASSESSMENTS','COMPANION_BENCH_GROUPED']:env.pop(key,None)
    env['COMPANION_BIND_READINGS']='1'
    try:
        with tempfile.TemporaryDirectory(prefix='companion-cpu-comparison-') as directory:
            files={name:pathlib.Path(directory)/(name+'.js') for name in sources}
            for name,b in sources.items():files[name].write_bytes(b)
            for count in args.cases:
                env['COMPANION_BENCH_REPLIES']=str(count//2)
                for pair in range(args.pairs):
                    if active_workloads():raise RuntimeError('Concurrent local workload detected; measurement invalid')
                    order=['baseline','candidate','reference'] if pair%2==0 else ['reference','candidate','baseline']
                    for position,name in enumerate(order):
                        row=json.loads(subprocess.check_output(['node',str(ROOT/'tools/benchmark_panel_reads.cjs'),str(files[name])],cwd=ROOT,env=env,text=True).strip());row.pop('file')
                        if row['warnings'] or row['messages']!=count or len(row['warmSamples'])!=10:raise RuntimeError('Invalid fixture/warnings/sample count')
                        report['records'].append({'source':name,'pair':pair,'position':position,**row})
                    save();print(f'{count} messages: balanced pair {pair+1}/{args.pairs} complete',flush=True)
                report['results'][str(count)]=comparison(report['records'],'baseline','candidate',count)
            for a,b in [('baseline','candidate'),('reference','baseline'),('reference','candidate')]:
                result={str(n):comparison(report['records'],a,b,n) for n in args.cases}
                report['comparisons'][f'{a}_to_{b}']={'baseline':a,'candidate':b,'informational':(a,b)!=('baseline','candidate'),'results':result,'gatePreview':gate(result)}
        if args.candidate_ref=='WORKTREE' and (ROOT/'dist/backend.js').read_bytes()!=sources['candidate']:raise RuntimeError('Candidate source changed during measurement')
        report.update(status='completed',elapsedSeconds=time.monotonic()-started,hostLoadEnd=os.getloadavg(),mergeGate=gate(report['results']))
        save();print(json.dumps({'mergeGate':report['mergeGate'],'comparisons':{k:v['gatePreview']['status'] for k,v in report['comparisons'].items()}},indent=2))
        return 0 if report['mergeGate']['continueAllowed'] else 2
    except Exception as e:
        report.update(status='aborted',error=str(e),elapsedSeconds=time.monotonic()-started);save();raise

if __name__=='__main__':raise SystemExit(main())
