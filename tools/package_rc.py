#!/usr/bin/env python3
"""Package tracked public extension assets without changing source or saved data.
Usage: python3 tools/package_rc.py /outside/checkout/Companion-RC.zip
Requires a clean tested checkout; emits a verified ZIP and file hashes.
"""
import hashlib
import json
import pathlib
import subprocess
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    output = pathlib.Path(sys.argv[1]).resolve()
    if output.is_relative_to(ROOT):
        raise SystemExit('Keep release artifacts outside the checkout')
    if subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT).strip():
        raise SystemExit('Commit and validate changes before packaging a clean checkout')
    subprocess.run(['node', 'tools/check_release.cjs'], cwd=ROOT, check=True)
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    files = sorted(f for f in tracked if f and (
        f in {'spindle.json', 'README.md', 'CHANGELOG.md', 'LICENSE'}
        or (f.startswith('GUIDE') and f.endswith('.md'))
        or f.startswith(('dist/', 'i18n/', 'preset/', 'docs/'))))
    manifest = json.loads((ROOT / 'spindle.json').read_text())
    assert all(f in files for f in [manifest['entry_backend'], manifest['entry_frontend'], 'spindle.json'])
    assert output.suffix == '.zip'
    contents = {}
    for name in files:
        path = ROOT / name
        if path.is_symlink() or not path.resolve().is_relative_to(ROOT):
            raise SystemExit('Rejecting non-regular release asset: ' + name)
        contents[name] = path.read_bytes()
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in contents.items():
            info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, data, compresslevel=9)
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        assert archive.namelist() == files
        for name, data in contents.items():
            assert archive.read(name) == data, name
    report = {'version': manifest['version'], 'candidate': True,
              'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'archive': output.name, 'sha256': sha(output.read_bytes()),
              'files': {name: sha(data) for name, data in contents.items()}}
    output.with_suffix('.checksums.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'archive': str(output), 'files': len(files), 'sha256': report['sha256']}))


if __name__ == '__main__':
    main()
