#!/usr/bin/env python3
"""Explicit manual RC publication. Never triggered by validation or normal pushes."""
import argparse
import hashlib
import json
import os
import pathlib
import re
import subprocess
import tempfile

ROOT = pathlib.Path(os.environ.get('COMPANION_RELEASE_CHECKOUT', pathlib.Path(__file__).resolve().parents[1])).resolve()
REPO = 'marcusjeanr-ctrl/COMPANION-TESTING'


def api(method, path, data=None):
    command = ['gh', 'api', '--method', method, f'repos/{REPO}/{path}']
    if data is not None:
        command += ['--input', '-']
    return json.loads(subprocess.check_output(command, input=json.dumps(data) if data is not None else None, text=True))


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def validate_inputs(mode, commit, sha256, version):
    require(mode in {'stage', 'publish'}, 'Only explicit stage/publish modes are supported')
    require(re.fullmatch(r'[0-9a-f]{40}', commit), 'Require an exact commit SHA')
    require(re.fullmatch(r'[0-9a-f]{64}', sha256), 'Require the tested ZIP SHA-256')
    require(re.fullmatch(r'\d+\.\d+\.\d+', version), 'Require a numeric manifest version')
    require(os.environ.get('GITHUB_REPOSITORY', REPO) == REPO, 'Wrong release repository')


def require_ci(commit):
    runs = api('GET', f'actions/runs?head_sha={commit}&per_page=100')['workflow_runs']
    candidates = [r for r in runs if r['head_sha'] == commit
                  and r['path'] == '.github/workflows/validate.yml'
                  and r.get('head_repository', {}).get('full_name') == REPO]
    require(candidates, 'No trusted validation run for this commit')
    latest = max(candidates, key=lambda r: r['id'])
    require(latest['status'] == 'completed' and latest['conclusion'] == 'success', 'Latest validation must pass')
    jobs = api('GET', f'actions/runs/{latest["id"]}/jobs')['jobs']
    for name in ['validate']:
        require(any(j['name'] == name and j['status'] == 'completed' and j['conclusion'] == 'success' for j in jobs),
                f'Required {name} job did not pass')
    return latest['html_url']


def require_main(mode, commit):
    if mode == 'publish':
        require(api('GET', 'commits/main')['sha'] == commit, 'Publication requires the current main commit')


def verify_hash(path, expected):
    require(hashlib.sha256(path.read_bytes()).hexdigest() == expected, 'Artifact hash mismatch; publication refused')


def download_and_verify(tag, archive, report, expected):
    with tempfile.TemporaryDirectory(prefix='companion-download-') as folder:
        for name in [archive.name, archive.with_suffix('.checksums.json').name]:
            subprocess.run(['gh', 'release', 'download', tag, '--repo', REPO, '--pattern', name, '--dir', folder], check=True)
        verify_hash(pathlib.Path(folder) / archive.name, expected)
        downloaded = json.loads((pathlib.Path(folder) / archive.with_suffix('.checksums.json').name).read_text())
        require(downloaded == report, 'Downloaded checksum report differs from the verified checkout')


def release(mode, commit, expected, version):
    validate_inputs(mode, commit, expected, version)
    require(subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == commit, 'Checkout differs from reviewed commit')
    manifest = json.loads((ROOT / 'spindle.json').read_text())
    require(manifest['version'] == version and manifest['identifier'] == 'rpg_companion_hms', 'Release identity mismatch')
    ci_url = require_ci(commit)
    require_main(mode, commit)
    tag = f'v{version}-rc.1'
    releases = api('GET', 'releases?per_page=100')
    matches = [r for r in releases if r['tag_name'] == tag]
    require(len(matches) <= 1, 'Ambiguous release tag')
    require(not matches or matches[0]['draft'], 'Refusing to overwrite an already published release')
    with tempfile.TemporaryDirectory(prefix='companion-release-', dir=os.environ.get('RUNNER_TEMP')) as folder:
        archive = pathlib.Path(folder) / f'RPG_Companion_HMS_{version}_RC.zip'
        package_env = {k: v for k, v in os.environ.items() if k not in {'GH_TOKEN', 'GITHUB_TOKEN'}}
        subprocess.run(['python3', str(ROOT / 'tools/package_rc.py'), str(archive)], cwd=ROOT, env=package_env, check=True)
        verify_hash(archive, expected)
        report = json.loads(archive.with_suffix('.checksums.json').read_text())
        sections = re.split(r'(?m)^## ', (ROOT / 'CHANGELOG.md').read_text())
        section = next((s for s in sections if s.startswith(version + ' RC ')), None)
        require(section, 'Missing version-specific release notes')
        body = '## ' + section.strip() + f'\n\nCommit: {commit}\nValidation: {ci_url}\nZIP SHA-256: `{expected}`\n\nRelease candidate; live Lumiverse install/update/reload acceptance remains unverified.'
        payload = {'tag_name': tag, 'target_commitish': commit, 'name': f'RPG Companion HMS {version} RC',
                   'body': body, 'draft': True, 'prerelease': True}
        record = api('PATCH', f'releases/{matches[0]["id"]}', payload) if matches else api('POST', 'releases', payload)
        subprocess.run(['gh', 'release', 'upload', tag, str(archive), str(archive.with_suffix('.checksums.json')),
                        '--repo', REPO, '--clobber'], check=True)
        download_and_verify(tag, archive, report, expected)
        if mode == 'publish':
            # Recheck immediately before publication; stage never makes a public release.
            require_main(mode, commit)
            refs = api('GET', 'git/matching-refs/tags/' + tag)
            if refs:
                require(len(refs) == 1 and refs[0]['ref'] == 'refs/tags/' + tag, 'Ambiguous existing tag')
                require(api('GET', 'commits/' + tag)['sha'] == commit, 'Existing tag points to another commit')
            payload['draft'] = False
            record = api('PATCH', f'releases/{record["id"]}', payload)
            require(not record['draft'] and record['prerelease'], 'GitHub did not publish the prerelease')
        print(json.dumps({'mode': mode, 'commit': commit, 'sha256': expected, 'draft': record['draft'],
                          'url': record['html_url'], 'assetsVerified': True}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', required=True)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--sha256', required=True)
    parser.add_argument('--version', required=True)
    args = parser.parse_args()
    release(args.mode, args.commit, args.sha256, args.version)
