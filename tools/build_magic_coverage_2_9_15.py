#!/usr/bin/env python3
"""Regenerate Magic reference/behavior/source registers; no provider or private data.
Usage: python3 tools/build_magic_coverage_2_9_15.py OUTPUT_DIRECTORY
"""
import csv
import gzip
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
out = pathlib.Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
data = json.loads(subprocess.check_output(['node', str(ROOT/'tools/audit_magic_catalogue.cjs')], text=True))
assert len(data['entries']) == 345 and len(data['spells']) == 348
assert all(row['sourceEntryIds'] for row in data['spells'])
(out/'magic-coverage.json.gz').write_bytes(gzip.compress(json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode(), mtime=0))
fields = ['name', 'key', 'school', 'alsoSchools', 'rank', 'step', 'kind', 'needs', 'fan', 'sourceEntryIds', 'effect', 'testedContract', 'liveProviderStatus']
with (out/'spell-coverage.csv').open('w', newline='') as stream:
    writer = csv.DictWriter(stream, fields, lineterminator='\n')
    writer.writeheader()
    for row in data['spells']:
        writer.writerow({key: '; '.join(map(str, row[key])) if isinstance(row.get(key), list) else row.get(key) for key in fields})
(out/'inventory.json').write_text(json.dumps({k: v for k, v in data.items() if k not in ['entries', 'spells']}, indent=2)+'\n')
source = (ROOT/'tools/test_magic_identity_progression.cjs').read_text()
cases = list(re.finditer(r"test\('([^']+)'", source))
contracts = []
for i, match in enumerate(cases):
    start = source[:match.start()].count('\n')+1
    body = source[match.start():cases[i+1].start() if i+1 < len(cases) else len(source)]
    contracts.append({'contract': match[1], 'test': 'tools/test_magic_identity_progression.cjs:'+str(start),
        'assertions': [{'line': start+n, 'text': line.strip()} for n, line in enumerate(body.splitlines()) if 'assert' in line],
        'scope': 'Deterministic accepted reports and runtime behavior; not live provider extraction'})
(out/'behavioral-coverage.json').write_text(json.dumps({'count': len(contracts), 'contracts': contracts}, indent=2)+'\n')
backend = (ROOT/'dist/backend.js').read_text()
names = ['buildCompanionInstructionRead', 'spellResolver', 'spellResolveState', 'spellStoryFoldUncached', 'spellKnown',
         'spellOngoingPractice', 'spellStudyActive', 'spellListPanel', 'hmsMagicPanel', 'rankedLoreBullets', 'spellsFromEntry']
refs = {name: 'dist/backend.js:'+str(backend[:backend.index('function '+name+'(')].count('\n')+1) for name in names}
(out/'source-references.json').write_text(json.dumps(refs, indent=2)+'\n')
print(json.dumps({'magicEntries': 345, 'canonicalSpells': 348, 'behavioralContracts': len(contracts)}))
