#!/usr/bin/env python3
"""Full Six-Sided audit using original IDs, current runtime and lossless fixture.
Usage: python3 tools/build_six_sided_3_coverage.py OUTPUT_DIRECTORY
"""
import collections,csv,gzip,hashlib,importlib.util,json,pathlib,re,subprocess,sys,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
raw=gzip.decompress((ROOT/'tools/six_sided_world_fixture.json.gz').read_bytes());j=json.loads(raw);card=j['data'];entries=card['character_book']['entries'];assert len(entries)==1296 and sum(e.get('enabled',True) for e in entries)==1273
old=json.loads(gzip.decompress((ROOT/'docs/compatibility/six-sided-coverage.json.gz').read_bytes()));assert hashlib.sha256(raw).hexdigest()==old['card_sha256'];prior={x['id']:x for x in old['entries']}
spec=importlib.util.spec_from_file_location('six_audit',ROOT/'tools/audit_six_sided.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as folder:
 path=pathlib.Path(folder)/'card.json';path.write_bytes(raw);probe=json.loads(subprocess.check_output(['node',str(ROOT/'tools/probe_six_sided_card.cjs'),str(path)],text=True))
source=(ROOT/'dist/backend.js').read_text();rows=[]
for e in entries:
 p=prior[e['id']];assert p['label']==e['comment'];assert p['content_sha256']==hashlib.sha256(e['content'].encode()).hexdigest();assert bool(p['enabled'])==bool(e['enabled'])
 family=module.family(e);status,functions,tests,limit=module.PROFILES[family];refs=[]
 for name in functions.split('; '):
  m=re.search(r'function '+re.escape(name)+r'\(',source);assert m;refs.append('dist/backend.js:'+str(source[:m.start()].count('\n')+1)+':'+name)
 # Point to complete source clauses, rather than selectively quoting narrative examples.
 clauses=[{'line':n,'terms':sorted(set(re.findall(r'\b(?:must|never|only|when|if|format|trigger|effect|mechanic|cost|cooldown|drain|activation|birthday|age|inheritance|guild|renown|property)\b',line,re.I)))} for n,line in enumerate(e['content'].splitlines(),1) if re.search(r'\b(?:must|never|only|when|if|format|trigger|effect|mechanic|cost|cooldown|drain|activation|birthday|age|inheritance|guild|renown|property)\b',line,re.I)]
 rows.append({'id':e['id'],'enabled':e['enabled'],'label':e['comment'],'family':family,'classification':status,'contentSha256':hashlib.sha256(e['content'].encode()).hexdigest(),'source':f'tools/six_sided_world_fixture.json.gz:data.character_book.entries[id={e["id"]}]','activation':{k:v for k,v in e.items() if k not in ['content']},'mechanicClauseReferences':clauses,'functions':refs,'tests':tests.split('; ')+['test_dual_mushoku_3.cjs'],'runtimeProbe':'All enabled flags, IDs, contents normalized; no automatic skills/NPCs','limits':limit+' Individual clause execution and live extraction remain unverified; examples are not automatically campaign facts.'})
summary={'checkpoint':'31e44daef9966cce9b4f05eecd31c259aa8db6e5','cardSha256':hashlib.sha256(raw).hexdigest(),'entries':len(rows),'enabled':1273,'disabled':23,'classifications':dict(collections.Counter(x['classification'] for x in rows)),'families':dict(collections.Counter(x['family'] for x in rows)),'coreFields':{k:{'characters':len(v),'sha256':hashlib.sha256(v.encode()).hexdigest()} for k,v in card.items() if isinstance(v,str)},'alternateGreetings':len(card['alternate_greetings']),'runtimeSummary':{k:v for k,v in probe.items() if k!='entries'},'mirror':old['mirror'],'limits':'Full source reading/inventory and deterministic contracts; no individual lore-rule or live-playthrough certification.'}
(OUT/'six-sided-inventory.json').write_text(json.dumps(summary,indent=2)+'\n');(OUT/'six-sided-coverage.json.gz').write_bytes(gzip.compress(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
with (OUT/'six-sided-coverage.csv').open('w',newline='') as stream:
 fields=['id','enabled','label','family','classification','functions','tests','limits'];writer=csv.DictWriter(stream,fields,lineterminator='\n');writer.writeheader()
 for row in rows:writer.writerow({k:'; '.join(row[k]) if isinstance(row[k],list) else row[k] for k in fields})
print(json.dumps({'entries':len(rows),'enabled':1273,'spells':probe['spellCount'],'techniques':probe['techniqueCount'],'families':summary['families']}))
