"""Guard tests use temporary fake roots; historical generation never touches dist/."""
import importlib.util,json,os,pathlib,sys,tempfile,unittest
from unittest.mock import patch
SPEC=importlib.util.spec_from_file_location('historical_rebuild',pathlib.Path(os.environ.get('COMPANION_REBUILD_SCRIPT',pathlib.Path(__file__).with_name('rebuild.py'))))
module=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(module)
class RebuildSafety(unittest.TestCase):
 def test_refusal_and_explicit_output(self):
  with tempfile.TemporaryDirectory() as tmp:
   base=pathlib.Path(tmp);repo=base/'checkout';repo.mkdir();(repo/'dist').mkdir();manifest=repo/'spindle.json';manifest.write_text(json.dumps({'version':'2.9.9'}));backend=repo/'dist/backend.js';backend.write_text('modern baseline')
   def call(*args):
    with patch.object(module,'ROOT',repo),patch.object(sys,'argv',['rebuild.py',*map(str,args)]):module.main()
   with patch.object(module,'generate',return_value={'dist/backend.js':'historical bytes'}) as generate:
    for args in [[],['--check'],['--output',repo],['--output',repo/'nested']]:
     with self.assertRaises(SystemExit):call(*args)
     self.assertEqual(backend.read_text(),'modern baseline')
    generate.assert_not_called()
    out=base/'historical';call('--output',out);self.assertEqual((out/'dist/backend.js').read_text(),'historical bytes');call('--check','--output',out)
    linked=base/'linked';linked.mkdir();(linked/'dist').symlink_to(repo/'dist',target_is_directory=True)
    with self.assertRaises(SystemExit):call('--output',linked)
    self.assertEqual(backend.read_text(),'modern baseline')
if __name__=='__main__':unittest.main()
