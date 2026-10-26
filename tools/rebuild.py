#!/usr/bin/env python3
"""Reproduce the shipped bundles from the exact original archive and reviewed overlays."""
import argparse
import hashlib
import json
import pathlib
import re
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / 'tools' / 'rebuild'
BASE_SHA = 'ba61d8f188871d0bd5bda67760fbdf028d3750c88f3193b48a5318934a023a38'


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Rebuild anchor changed: ' + old[:100])
    return text.replace(old, new, 1)


def generate():
    archive = (DATA / 'baseline_2.8.1.zip').read_bytes()
    if hashlib.sha256(archive).hexdigest() != BASE_SHA:
        raise ValueError('The implementation baseline does not match the supplied archive')
    overlays = []
    for file in sorted(DATA.glob('0[1-6]-*.json')):
        overlays.extend(json.loads(file.read_text())['changes'])
    output = {}
    with zipfile.ZipFile(DATA / 'baseline_2.8.1.zip') as z:
        for filename in ['dist/backend.js', 'dist/frontend.js']:
            lines = z.read('rpg_companion_hms/' + filename).decode().splitlines(keepends=True)
            changes = sorted((row for row in overlays if row['file'] == filename), key=lambda row: row['start'], reverse=True)
            previous = len(lines) + 1
            for row in changes:
                start, end = row['start'], row['end']
                if end > previous or ''.join(lines[start:end]) != row['before']:
                    raise ValueError('Overlapping or mismatched region: ' + row['id'])
                lines[start:end] = row['after'].splitlines(keepends=True)
                previous = start
            output[filename] = ''.join(lines)
    backend = output['dist/backend.js']
    helpers = (DATA / 'shared_tracking.js').read_text()
    backend = replace_once(backend, 'function partyLevel(v) {', helpers + '\nfunction partyLevel(v) {')
    backend = replace_once(backend, "const sn = y.sanity === null || y.sanity === undefined || y.sanity === '' ? NaN : Number(y.sanity), xp = Number(y.xp);", 'const sn = reportNumber(y.sanity), xp = Number(y.xp);')
    backend = replace_once(backend, "const n = x.progress === null || x.progress === undefined || x.progress === '' ? NaN : Number(x.progress);", 'const n = reportNumber(x.progress);')
    backend = replace_once(backend, "const raw = e[b.id];\n            const v = typeof raw === 'number' || (typeof raw === 'string' && raw.trim()) ? Number(raw) : NaN;", 'const v = reportNumber(e[b.id]);')
    backend = replace_once(backend, "const raw = q.progress;\n        const pr = typeof raw === 'number' || (typeof raw === 'string' && raw.trim()) ? Number(raw) : NaN;", 'const pr = reportNumber(q.progress);')
    backend = replace_once(backend, r"if (/\b(?:offered|presented|held out|proposed|planned|not (?:yet )?(?:taken|accepted|equipped|held|worn))\b/i.test(s)) return null;", 'if (gearPendingState(s, true)) return null;')
    backend = replace_once(backend, r"if (/\b(?:offered|presented|held out|proposed|planned|not (?:yet )?(?:taken|accepted))\b/i.test(String(e.state ?? e.status ?? e.how ?? ''))) continue;", 'if (gearPendingState(e.state ?? e.status ?? e.how)) continue;')
    a = backend.index('function mushokuLocationSegments(segments) {')
    b = backend.index('\n}\n', a) + 2
    backend = backend[:a] + "function mushokuLocationSegments(segments) {\n    return Array.isArray(segments) ? segments.flatMap(segment => hmsSplitTop(segment, /,/g)) : [];\n}" + backend[b:]
    backend = re.sub(r"const RPGC_VERSION = '[^']+';", "const RPGC_VERSION = '2.8.2';", backend, count=1)
    for replacement in json.loads((DATA / 'prompt_compaction.json').read_text()):
        backend = replace_once(backend, replacement['before'], replacement['after'])
    for replacement in json.loads((DATA / 'cache_consolidation.json').read_text()):
        backend = replace_once(backend, replacement['before'], replacement['after'])
    output['dist/backend.js'] = backend
    frontend = output['dist/frontend.js']
    if frontend.count("'RPG Companion HMS Edition 2.1 beta'") != 2:
        raise ValueError('Baseline release-title anchors changed')
    frontend = frontend.replace("'RPG Companion HMS Edition 2.1 beta'", "'RPG Companion HMS Edition 2.8.2 — Clean Compatibility Rebuild'")
    # Only the two independently reviewed lifecycle labels augment the baseline dictionaries.
    additions = json.loads((DATA / 'translation_additions.json').read_text())
    tables = {code: json.loads((ROOT / 'i18n' / (lang + '.json')).read_text()) for code, lang in {'pt': 'pt-BR', 'es': 'es', 'ru': 'ru', 'tr': 'tr'}.items()}
    for code, values in additions.items():
        tables[code].update(values)
    keys = sorted({key for values in tables.values() for key in values})
    table = {'langs': list(tables), 't': {key: [values.get(key, '') for values in tables.values()] for key in keys}}
    blob = json.dumps(table, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    frontend = re.sub(r'/\* I18N:BEGIN \*/.*?/\* I18N:END \*/', lambda _: '/* I18N:BEGIN */ ' + blob + ' /* I18N:END */', frontend, count=1, flags=re.S)
    output['dist/frontend.js'] = frontend
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for filename, text in generate().items():
        target = ROOT / filename
        data = text.encode()
        if args.check:
            if target.read_bytes() != data:
                raise SystemExit(filename + ' is not reproducible')
        else:
            target.write_bytes(data)
        print(filename + ': ' + hashlib.sha256(data).hexdigest())


if __name__ == '__main__':
    main()
