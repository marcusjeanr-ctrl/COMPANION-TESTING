#!/usr/bin/env python3
"""Lossless card inventory + conservative entry coverage; no model/network calls.
Usage: python tools/build_tracking_coverage_2_9_13.py CARD OUTPUT_DIRECTORY
The pre-existing full entry fixture is reused; no duplicate lorebook is shipped.
"""
import copy
import csv
import gzip
import hashlib
import json
import pathlib
import subprocess
import sys

ROOT=pathlib.Path(__file__).resolve().parents[1]
PROFILE={
 'identity':('characters; family; relations; minds; learned','normalizeCharacters; famRead; relReconcile; simFold','Characters / Family / Relationships / Internal States'),
 'magic':('survival.spells/learned/mastered/study/abilities; source-bound per-swipe metadata','abilityEvidenceNormalize; spellStoryFoldUncached; spellResolveState; spellKnown; spellListPanel','Magic / Techniques'),
 'combat':('survival study/abilities; HUD ranks/resources; immersive encounter state','techCatalog; techListPanel; immRequest','Techniques / World / Combat'),
 'geography':('authoritative HUD date/location; cached Atlas references; stored room/map records','parseHud; mtCalendar; atlasFor; hmsMapPanel','World / Atlas / Buildings'),
 'ownership':('gear; survival.got/lost; money; holdings; factions','gearRead; pocketsNow; moneyRead; holdRead; factionRead','Inventory / Equipment / Money / Holdings / Factions'),
 'branch':('plot.canonEvents; objectives; agenda; HUD active paths/canon references','plotNormalize; mtEventLedger; agendaRead; mtSaga','World / Plot / Agenda / Quests / raw HUD'),
 'system':('HUD; source-bound per-swipe reports; chat-local manual state','companionTurnPurpose; companionResumeHud; hmsHandleReply; getSwipeData','World / all applicable tracking panels'),
 'lore':('reference context only; no automatic campaign transaction','loreNormEntry; loreEntryHits; buildLoreBlock','Reference lore where relevant; no automatic tracker'),
 'disabled':('none: explicitly disabled entries excluded','loreNormEntry','None'),
}
def sha(data): return hashlib.sha256(data).hexdigest()
def write_gzip(path,value): path.write_bytes(gzip.compress(json.dumps(value,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
def main():
 source,out=map(pathlib.Path,sys.argv[1:]);raw=source.read_bytes();card=json.loads(raw)
 entries=card['data']['character_book']['entries'];assert len(entries)==1296 and sum(e['enabled'] for e in entries)==1273
 fixture=json.loads(gzip.decompress((ROOT/'tools/updated_six_sided_fixture.json.gz').read_bytes()))
 assert fixture['entries']==entries,'The original full entry fixture must match the supplied unchanged card'
 old=json.loads(gzip.decompress((ROOT/'docs/compatibility/six-sided-coverage.json.gz').read_bytes()))
 assert old['card_sha256']==sha(raw)
 core=copy.deepcopy(card);core['data']['character_book'].pop('entries')
 mirror=core['data']['extensions']['character_book'].pop('entries');by_content={e['content']:e for e in entries}
 deltas=[]
 for e in mirror:
  base=by_content[e['content']]
  deltas.append({'original_entry_id':base['id'],'changes':{k:v for k,v in e.items() if base.get(k)!=v},'removed':[k for k in base if k not in e]})
 inventory={'source_sha256':sha(raw),'root_without_entries':core,'primary_entries_fixture':'tools/updated_six_sided_fixture.json.gz:entries','extension_book_deltas':deltas}
 # Prove this decomposition retains every supplied field/value, including both books.
 reconstructed=copy.deepcopy(core);reconstructed['data']['character_book']['entries']=fixture['entries'];ix={e['id']:e for e in entries}
 rebuilt=[]
 for delta in deltas:
  entry=copy.deepcopy(ix[delta['original_entry_id']]);entry.update(delta['changes'])
  for key in delta['removed']:entry.pop(key)
  rebuilt.append(entry)
 reconstructed['data']['extensions']['character_book']['entries']=rebuilt
 assert reconstructed==card
 write_gzip(ROOT/'tools/six_sided_core_inventory.json.gz',inventory)
 probe=json.loads(subprocess.check_output(['node',str(ROOT/'tools/probe_six_sided_card.cjs'),str(source)],text=True))
 direct={e['id'] for e in probe['entries'] if e['directSpellSource'] or e['directTechniqueSource']}
 # A source-specific catalog/reference assertion is only partial integration.
 # Normalization alone never earns a gameplay-support classification.
 partial=direct|{959,705,1116,1168,1169,1170,1195,1196,1199,1200,1201,1202,1203,1205,1206,1229,1230,1231}|set(range(1207,1229))
 backend=(ROOT/'dist/backend.js').read_text();register=[]
 for e in old['entries']:
  e=copy.deepcopy(e);family=e['family'];store,funcs,ui=PROFILE[family]
  e.pop('classification',None)  # superseded by this task's stricter six-status contract
  e.update(status='Not applicable' if family in ['disabled','lore'] else 'Partially supported' if e['id'] in partial else 'Untested',
   expected_evidence='Accepted current HUD/narration or attributed historical record, not a catalog grant or hypothetical event',
   expected_transition='Reference only; no automatic state mutation' if family in ['disabled','lore'] else 'Update only the established owner/record; preserve chronology, omitted passive facts and separate occurrences',
   persistent_representation=store,normalization_reconciliation=funcs,ui_destination=ui,
   new_regressions=['test_tracking_evidence_2_9_13.cjs','test_tracking_cross_system_2_9_13.cjs'] if family in ['magic','combat','branch','system','ownership','identity'] else [],
   content_location=f'tools/updated_six_sided_fixture.json.gz:entries[id={e["id"]}]',
   semantic_verification='Family-level deterministic coverage only; individual narrative effects and live provider extraction not certified')
  e['source_refs']=[]
  for fn in funcs.split('; '):
   marker='function '+fn+'(';at=backend.find(marker);assert at>=0,fn
   e['source_refs'].append('dist/backend.js:'+str(backend[:at].count('\n')+1)+':'+fn)
  register.append(e)
 statuses=['Verified supported','Partially supported','Unsupported','Defective','Untested','Not applicable']
 result={'source_sha256':sha(raw),'baseline_commit':'7a98c1c18070972f3e8201fffe5bbc6955f547da','counting_unit':'Original lorebook entry ID, not a verified gameplay mechanic. No semantic percentage is inferred from entry counts.',
  'counts':{s:sum(e['status']==s for e in register) for s in statuses},'full_content_fixture':'tools/updated_six_sided_fixture.json.gz','lossless_core_inventory':'tools/six_sided_core_inventory.json.gz',
  'lossless_card_reconstruction_verified':True,'entries':register}
 out.mkdir(parents=True,exist_ok=True);write_gzip(out/'entry-coverage.json.gz',result)
 with (out/'entry-coverage.csv').open('w',newline='') as f:
  keys=['id','enabled','label','keys','status','family','expected_evidence','expected_transition','persistent_representation','normalization_reconciliation','ui_destination','source_refs','family_test_files','new_regressions','direct_result','semantic_verification','limitations']
  writer=csv.DictWriter(f,keys,lineterminator='\n');writer.writeheader()
  for row in register:writer.writerow({k:'; '.join(row[k]) if isinstance(row[k],list) else row[k] for k in keys})
 (out/'inventory.json').write_text(json.dumps({k:v for k,v in result.items() if k!='entries'},indent=2)+'\n')
 probe.pop('entries');(out/'full-card-probe.json').write_text(json.dumps(probe,indent=2)+'\n')
 print(json.dumps({'entries':len(register),'enabled':1273,'disabled':23,'counts':result['counts'],'losslessReconstruction':True,'fullCardProbe':probe}))
if __name__=='__main__':main()
