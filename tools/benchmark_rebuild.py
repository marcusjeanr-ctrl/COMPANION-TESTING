#!/usr/bin/env python3
"""Compare the rebuild with the supplied baseline and a pinned reference bundle."""
import argparse
import json
import os
import pathlib
import statistics
import subprocess
import tempfile
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
POLICY = json.loads((ROOT / 'tools/rebuild/performance_policy.json').read_text())


def run(script, files, env=None):
    result = subprocess.run(['node', str(ROOT / 'tools' / script), *map(str, files)], capture_output=True, text=True, check=True, env=env)
    return [json.loads(line) for line in result.stdout.splitlines() if line.strip()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--reference', required=True, type=pathlib.Path)
    parser.add_argument('--output', default=str(ROOT / 'tools/BENCHMARK_2_8_2.json'), type=pathlib.Path)
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='rpgc-original-') as folder:
        baseline = pathlib.Path(folder) / 'backend.js'
        with zipfile.ZipFile(ROOT / 'tools/rebuild/baseline_2.8.1.zip') as z:
            baseline.write_bytes(z.read('rpg_companion_hms/dist/backend.js'))
        variants = {'2.8.1': baseline, '2.8.21': args.reference.resolve(), '2.8.2': ROOT / 'dist/backend.js'}
        reverse = {str(value): key for key, value in variants.items()}
        raw = []
        for round_no in range(POLICY['runs']):
            ordered = list(variants.values())
            ordered = ordered[round_no % len(ordered):] + ordered[:round_no % len(ordered)]
            for messages in POLICY['panel_histories']:
                env = dict(os.environ, COMPANION_BENCH_REPLIES=str(messages // 2))
                for row in run('benchmark_panel_reads.cjs', ordered, env):
                    row.update(version=reverse[row['file']], benchmark='panels', round=round_no + 1)
                    row.pop('file')
                    raw.append(row)
            for row in run('benchmark_tracking_pipeline.cjs', ordered):
                row.update(version=reverse[row.pop('file')], benchmark='pipeline', round=round_no + 1)
                raw.append(row)
        operations = []
        for row in run('measure_rebuild_operations.cjs', list(variants.values())):
            row['version'] = reverse[row.pop('file')]
            operations.append(row)
    medians, failures = {}, []
    for version in variants:
        values = {}
        for messages in POLICY['panel_histories']:
            rows = [r for r in raw if r['version'] == version and r['benchmark'] == 'panels' and r['messages'] == messages]
            for key in ['coldMs', 'medianMs']:
                values[f'{messages}:{key}'] = statistics.median(r[key] for r in rows)
        rows = [r for r in raw if r['version'] == version and r['benchmark'] == 'pipeline']
        for key in ['parseReportMedianMs', 'processResponseMedianMs', 'promptConstructMedianMs', 'promptCharacters', 'populatedPromptCharacters']:
            values[key] = statistics.median(r[key] for r in rows)
        medians[version] = values
    for comparator in ['2.8.1', '2.8.21']:
        for key, base in medians[comparator].items():
            limit = 0 if key.endswith('Characters') else max(POLICY['absolute_slowdown_limit_ms'], base * POLICY['relative_slowdown_limit'])
            if medians['2.8.2'][key] > base + limit:
                failures.append({'comparator': comparator, 'metric': key, 'baseline': base, 'rebuild': medians['2.8.2'][key], 'permitted_increase': limit})
    output = {'policy': POLICY, 'medians': medians, 'operations': operations, 'failures': failures, 'passed': not failures, 'runs': raw}
    args.output.write_text(json.dumps(output, indent=2) + '\n')
    print(json.dumps({key: output[key] for key in ['medians', 'failures', 'passed']}, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == '__main__':
    main()
