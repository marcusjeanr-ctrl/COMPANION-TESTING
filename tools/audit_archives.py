#!/usr/bin/env python3
"""Inspect historical ZIPs without extracting or executing their contents.
Usage: python3 tools/audit_archives.py /private/archive.zip [...]
Prints public-code fingerprints and static evidence, never private chat data.
Static evidence is not a behavioral compatibility verdict.
"""
import hashlib
import json
import pathlib
import re
import sys
import zipfile

FEATURES = {
    'hud': 'parseHud', 'reports': 'parseCompanion', 'quest_identity': 'questMatch',
    'quest_details': 'questDetailsLatest', 'agenda': 'agendaRead',
    'minds': 'simFold', 'internal_states': 'statesPanelHtml',
    'relationships': 'relRead', 'magic': 'spellKnown', 'gear': 'gearRead',
    'family': 'familyRead', 'combat': 'combatRolls', 'atlas': 'atlasBuild',
    'chronicle': 'chronOf', 'chapters': 'chaptersOf', 'persistence': 'setSwipeData',
    'save_continue': 'companionMarkTurnPurposes', 'reporter_slot': 'rpgcSlotRequest',
}

def sha(data):
    return hashlib.sha256(data).hexdigest()


def inspect(filename):
    p = pathlib.Path(filename)
    result = {'file': p.name, 'sha256': sha(p.read_bytes()), 'builds': []}
    with zipfile.ZipFile(p) as z:
        for name in z.namelist():
            if pathlib.PurePosixPath(name).name != 'spindle.json':
                continue
            manifest = json.loads(z.read(name))
            prefix = name[:-len('spindle.json')]
            build = {'manifest': name, 'version': manifest.get('version'),
                     'permissions': manifest.get('permissions'),
                     'minimum_lumiverse_version': manifest.get('minimum_lumiverse_version'),
                     'bundles': {}, 'static_evidence': {}}
            for part in ['backend', 'frontend']:
                content = z.read(prefix + 'dist/' + part + '.js')
                build['bundles'][part] = {'bytes': len(content), 'sha256': sha(content)}
                if part == 'backend':
                    source = content.decode()
                    for feature, function in FEATURES.items():
                        match = re.search(r'\bfunction\s+' + function + r'\s*\(', source)
                        build['static_evidence'][feature] = None if not match else {
                            'function': function, 'line': source.count('\n', 0, match.start()) + 1,
                            'references': len(re.findall(r'\b' + function + r'\s*\(', source))}
            result['builds'].append(build)
    return result


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    print(json.dumps([inspect(p) for p in sys.argv[1:]], indent=2))
