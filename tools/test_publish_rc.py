import importlib.util
import hashlib
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('publisher', pathlib.Path(__file__).with_name('publish_rc.py'))
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)
COMMIT = 'a' * 40


class PublisherSafety(unittest.TestCase):
    def test_inputs_reject_unpinned_or_invalid_requests(self):
        for mode, commit, sha, version in [('auto', COMMIT, 'b'*64, '2.9.11'), ('stage', 'main', 'b'*64, '2.9.11'),
                                           ('stage', COMMIT, 'bad', '2.9.11'), ('publish', COMMIT, 'b'*64, '2.9.11;echo')]:
            with self.assertRaises(RuntimeError):
                publisher.validate_inputs(mode, commit, sha, version)

    def test_hash_mismatch_refuses_artifact(self):
        with tempfile.TemporaryDirectory() as folder:
            file = pathlib.Path(folder) / 'test.zip'
            file.write_bytes(b'changed artifact')
            with self.assertRaises(RuntimeError):
                publisher.verify_hash(file, '0'*64)

    def test_publication_requires_current_main_but_staging_does_not(self):
        with patch.object(publisher, 'api', return_value={'sha': 'c'*40}) as api:
            publisher.require_main('stage', COMMIT)
            api.assert_not_called()
            with self.assertRaises(RuntimeError):
                publisher.require_main('publish', COMMIT)

    def test_validation_requires_exact_trusted_commit_and_both_jobs(self):
        run = {'id': 1, 'head_sha': COMMIT, 'path': '.github/workflows/validate.yml',
               'head_repository': {'full_name': publisher.REPO}, 'status': 'completed', 'conclusion': 'success', 'html_url': 'test-ci'}
        jobs = [{'name': n, 'status': 'completed', 'conclusion': 'success'} for n in ['validate', 'browser']]
        with patch.object(publisher, 'api', side_effect=[{'workflow_runs': [run]}, {'jobs': jobs}]):
            self.assertEqual(publisher.require_ci(COMMIT), 'test-ci')
        for field, value in [('head_sha', 'c'*40), ('conclusion', 'failure'), ('head_repository', {'full_name': 'other/repo'})]:
            with patch.object(publisher, 'api', return_value={'workflow_runs': [{**run, field: value}]}):
                with self.assertRaises(RuntimeError):
                    publisher.require_ci(COMMIT)
        with patch.object(publisher, 'api', side_effect=[{'workflow_runs': [run]}, {'jobs': jobs[:1]}]):
            with self.assertRaises(RuntimeError):
                publisher.require_ci(COMMIT)


    def test_failed_download_never_publishes(self):
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            (root / 'spindle.json').write_text(json.dumps({'version':'2.9.11','identifier':'rpg_companion_hms'}))
            (root / 'CHANGELOG.md').write_text('## 2.9.11 RC — maintenance\nVerified fixes.\n')
            digest = hashlib.sha256(b'verified').hexdigest()
            def package(command, **kwargs):
                if command[0] == 'python3':
                    archive = pathlib.Path(command[-1])
                    archive.write_bytes(b'verified')
                    archive.with_suffix('.checksums.json').write_text(json.dumps({'sha256':digest}))
            with patch.object(publisher,'ROOT',root), patch.object(publisher,'require_ci',return_value='test-ci'), \
                 patch.object(publisher,'require_main'), patch.object(publisher.subprocess,'check_output',return_value=COMMIT), \
                 patch.object(publisher.subprocess,'run',side_effect=package), \
                 patch.object(publisher,'api',side_effect=[[],{'id':1,'draft':True}]) as api, \
                 patch.object(publisher,'download_and_verify',side_effect=RuntimeError('corrupt download')):
                with self.assertRaises(RuntimeError):
                    publisher.release('publish',COMMIT,digest,'2.9.11')
                writes = [call for call in api.call_args_list if call.args[0] in {'POST','PATCH'}]
                self.assertEqual(len(writes),1)
                self.assertTrue(writes[0].args[2]['draft'])


if __name__ == '__main__':
    unittest.main()
