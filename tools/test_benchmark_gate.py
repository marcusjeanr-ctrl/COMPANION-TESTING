import unittest,subprocess,json,os,pathlib
from benchmark_release_comparison import gate,summary,comparison

def result(wall,cpu,wall_noise=2,cpu_noise=2):
    return {'2000':{'medianMs':{'percentChange':wall,'absoluteChangeMs':wall},
        'cpuMedianMs':{'percentChange':cpu,'absoluteChangeMs':cpu},
        'baselinePooledRuns':{'wall':{'iqr':wall_noise},'cpu':{'iqr':cpu_noise}}}}
class Gate(unittest.TestCase):
    def test_both_above_and_above_noise_fail(self):self.assertEqual(gate(result(8,9))['status'],'fail')
    def test_only_wall_is_inconclusive(self):self.assertEqual(gate(result(9,1))['status'],'inconclusive')
    def test_only_cpu_is_inconclusive(self):self.assertEqual(gate(result(1,9))['status'],'inconclusive')
    def test_both_above_inside_noise_is_inconclusive(self):self.assertEqual(gate(result(9,9,10,10))['status'],'inconclusive')
    def test_one_noisy_is_inconclusive(self):self.assertEqual(gate(result(9,9,2,10))['status'],'inconclusive')
    def test_five_boundary_passes(self):self.assertEqual(gate(result(5,5))['status'],'pass')
    def test_iqr_boundary_is_not_larger(self):self.assertEqual(gate(result(9,9,9,9))['status'],'inconclusive')
    def test_missing_case_cannot_continue(self):self.assertFalse(gate({})['continueAllowed'])
    def test_child_records_cpu_components_and_wall(self):
        root=pathlib.Path(__file__).resolve().parents[1]
        env={**os.environ,'COMPANION_BENCH_REPLIES':'1','COMPANION_BIND_READINGS':'1'}
        row=json.loads(subprocess.check_output(['node',str(root/'tools/benchmark_panel_reads.cjs')],cwd=root,env=env,text=True))
        self.assertEqual(len(row['warmSamples']),10)
        for sample in row['warmSamples']:
            self.assertGreater(sample['wallMs'],0);self.assertGreater(sample['cpuMs'],0)
            self.assertAlmostEqual(sample['cpuMs'],sample['userCpuMs']+sample['systemCpuMs'])
        self.assertAlmostEqual(row['processCpu']['totalMs'],row['processCpu']['userMs']+row['processCpu']['systemMs'])
        self.assertGreater(row['processWallMs'],0)
    def test_rejects_fewer_than_twenty_pairs(self):
        p=subprocess.run(['python3',str(pathlib.Path(__file__).with_name('benchmark_release_comparison.py')),'--pairs','19','--output','unused.json'],capture_output=True,text=True)
        self.assertNotEqual(p.returncode,0);self.assertIn('twenty',p.stderr)
    def test_summary_spread(self):
        s=summary([1,2,3,4]);self.assertEqual(s['median'],2.5);self.assertEqual(s['spread'],3);self.assertEqual(s['iqr'],1.5)
    def test_pooled_samples_are_separate_from_run_spread(self):
        rows=[]
        for source,offset in [('baseline',0),('candidate',10)]:
            for i in range(20):rows.append(dict(source=source,messages=2000,coldMs=100+offset,coldCpuMs=95+offset,medianMs=100+offset,cpuMedianMs=95+offset,warmSamples=[dict(wallMs=v+offset,cpuMs=v-5+offset) for v in [90,110]]))
        c=comparison(rows,'baseline','candidate',2000)
        self.assertEqual(c['medianMs']['baseline']['spread'],0);self.assertEqual(c['baselinePooledWarm']['wall']['iqr'],20)
        self.assertEqual(c['baselinePooledRuns']['wall']['iqr'],0);self.assertEqual(gate({'2000':c})['status'],'fail')
if __name__=='__main__':unittest.main()
