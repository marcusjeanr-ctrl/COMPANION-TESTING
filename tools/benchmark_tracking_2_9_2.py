import subprocess,os,json,statistics,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[1]
os.chdir(root)
if len(sys.argv)!=2: raise SystemExit("usage: python3 tools/benchmark_tracking_2_9_2.py /path/to/original/backend.js")
baseline=str(pathlib.Path(sys.argv[1]).resolve());patched=str(pathlib.Path('dist/backend.js').resolve());raw=[]
for run in range(5):
 for replies in [300,1000]:
  files=[baseline,patched] if run%2==0 else [patched,baseline]
  env=dict(os.environ,COMPANION_BENCH_REPLIES=str(replies),COMPANION_BIND_READINGS='1')
  p=subprocess.run(['node','tools/benchmark_panel_reads.cjs',*files],env=env,capture_output=True,text=True,check=True)
  for line in p.stdout.splitlines():raw.append(dict(json.loads(line),run=run,kind='panel'))
 files=[baseline,patched] if run%2==0 else [patched,baseline]
 p=subprocess.run(['node','tools/benchmark_tracking_pipeline.cjs',*files],capture_output=True,text=True,check=True)
 for line in p.stdout.splitlines():raw.append(dict(json.loads(line),run=run,kind='pipeline'))
 print('round',run+1,'done',flush=True)
summary=[]
for messages in [600,2000]:
 for metric in ['coldMs','medianMs']:
  a=statistics.median(x[metric] for x in raw if x['file']==baseline and x.get('messages')==messages)
  b=statistics.median(x[metric] for x in raw if x['file']==patched and x.get('messages')==messages)
  summary.append(dict(metric=metric,messages=messages,baseline=a,patched=b,passed=b<=a+max(a*.05,1)))
for metric in ['parseReportMedianMs','processResponseMedianMs','promptConstructMedianMs','promptCharacters','populatedPromptCharacters']:
 a=statistics.median(x[metric] for x in raw if x['file']==baseline and x['kind']=='pipeline');b=statistics.median(x[metric] for x in raw if x['file']==patched and x['kind']=='pipeline')
 summary.append(dict(metric=metric,baseline=a,patched=b,passed=b<=a+(0 if 'Characters' in metric else max(a*.05,1))))
out=dict(policy=json.load(open('tools/PERFORMANCE_POLICY_2_9_2.json')),raw=raw,summary=summary,passed=all(x['passed'] for x in summary))
pathlib.Path('tools/BENCHMARK_2_9_2.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'passed':out['passed'],'summary':summary},indent=2))
