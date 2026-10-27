#!/usr/bin/env python3
"""Full-card inventory and traceability, not a gameplay certification.
Usage: python3 tools/build_living_world_coverage.py OUTPUT_DIRECTORY [ORIGINAL_CARD]
The optional original is compared for exact parsed equality with the lossless fixture.
"""
import collections
import csv
import gzip
import hashlib
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = pathlib.Path(sys.argv[1])
fixture = ROOT / 'tools/living_world_fixture.json.gz'
card = json.loads(gzip.decompress(fixture.read_bytes()))
original_sha = '21918f9b3f02ec9edbb4cc44565256078863d3b93eb7ab0fe5cbb708c4d33e1f'
if len(sys.argv) > 2:
    raw = pathlib.Path(sys.argv[2]).read_bytes()
    assert json.loads(raw) == card
    assert hashlib.sha256(raw).hexdigest() == original_sha
data = card['data']
entries = data['character_book']['entries']
assert len(entries) == 1004 and sum(e['enabled'] for e in entries) == 998
probe = json.loads(subprocess.check_output(['node', str(ROOT/'tools/audit_living_world.cjs')], text=True))
source = (ROOT/'dist/backend.js').read_text()
def refs(*functions):
    result = []
    for name in functions:
        pos = source.find('function '+name+'(')
        assert pos >= 0, name
        result.append('dist/backend.js:'+str(source[:pos].count('\n')+1)+':'+name)
    return result

profiles = {
 'magic': ('buildCompanionInstructionRead; parseCompanion; spellsFromEntry; spellStoryFoldUncached; spellListPanel',
           'survival.spells/learned/mastered/study/abilities; source-bound active swipe; manual spell state', 'Magic / Techniques / World',
           ['test_living_world_compatibility.cjs', 'test_tracking_evidence_2_9_13.cjs', 'test_reading_and_magic.cjs']),
 'martial': ('techsFromEntry; techStanding; techListPanel; spellStoryFoldUncached',
             'HUD martial ranks and Touki; shared source-bound ability metadata', 'Sword techniques / World',
             ['test_living_world_compatibility.cjs', 'test_visual_rank_integrity.cjs']),
 'identity': ('buildCompanionInstructionRead; parseCompanion; famRead; simFold; relReconcile',
              'characters/family/relations/minds/learned per swipe and manual party identities', 'Characters / Family / Bonds / Internal States',
              ['test_living_world_compatibility.cjs','test_reconciliation_integrity.cjs','test_tracking_continuation_accuracy.cjs']),
 'geography': ('parseHud; atlasFor; hmsMapPanel; hmsTimelineUncached',
               'authoritative HUD location/time; cached reference Atlas; chat-local rooms', 'World / Atlas / Buildings',
               ['test_atlas_references.cjs','test_six_sided_repairs.cjs','test_living_world_compatibility.cjs']),
 'history': ('getSwipeData; companionTurnPurpose; statesReading; mtEventLedger',
             'reference only until an accepted campaign observation; continuation snapshots display-only', 'World / Plot / Internal States when established',
             ['test_save_continue_boundary.cjs','test_living_world_compatibility.cjs']),
 'hud': ('parseHud; worldMushoku; hmsReadSystems; messageHud',
         'narrator-owned HUD text; existing per-swipe tracking metadata; no rule simulation', 'World / Body / HUD / applicable panels',
         ['test_living_world_compatibility.cjs','test_universal_card_matrix.cjs','test_six_sided_integration.cjs']),
 'ownership': ('parseCompanion; gearRead; holdRead; moneyRead; factionRead',
               'observed gear, holdings, money, factions; no acquisition from catalogs', 'Inventory / Holdings / Money / Factions',
               ['test_living_world_compatibility.cjs','test_tracking_cross_system_2_9_13.cjs']),
 'branch': ('agendaRead; questDetailsLatest; mtSaga; mtEventLedger; companionTurnPurpose',
            'HUD personal arc, scheduled Agenda, quests/objectives and established events; no automatic canon outcome', 'World / Agenda / Quests / Plot',
            ['test_living_world_compatibility.cjs','test_agenda_occurrence_2_9_11.cjs','test_quest_identity_2_9_2.cjs']),
}
def family(e):
    label = e['comment'].lower()
    if label.startswith('[arc memory]'): return 'history'
    if label.startswith('[arcs]') or 'start handler' in label or 'central control' in label: return 'branch'
    if label.startswith('[hud]'): return 'hud'
    if 'sword styles' in label: return 'martial'
    if label.startswith('[magic') or label.startswith('[magic core]'): return 'magic'
    if 'locations' in label: return 'geography'
    if label.startswith('[character') or 'races]' in label or 'monsters]' in label: return 'identity'
    if any(x in label for x in ['guild','organization','coin','equipment','sword:','tools','staves','noble','family','house ','trade']): return 'ownership'
    return 'hud'

duplicates = collections.defaultdict(list)
for e in entries: duplicates[hashlib.sha256(e['content'].encode()).hexdigest()].append(e['id'])
probe_by_id = {r['id']:r for r in probe['entries']}
register = []
for e in entries:
    f = family(e)
    functions, storage, ui, tests = profiles[f]
    p = probe_by_id[e['id']]
    rules = [{'line':i,'text':line.strip()} for i,line in enumerate(e['content'].splitlines(),1)
             if re.search(r'\b(?:HARD|FORMAT|WHEN|IF|NEVER|ONLY|TRIGGER|STAGE|RULE|CLEARED WHEN|LEADS TO|Year:|Birth:|Time:|Tier:|School:|Status:)\b',line,re.I)]
    # Entire entries include untested narrative behavior: catalog visibility does not certify it.
    status = 'not applicable' if not e['enabled'] else 'partially supported'
    register.append({'id':e['id'],'enabled':e['enabled'],'label':e['comment'],'keys':e['keys'],'family':f,'status':status,
      'content_sha256':p['contentSha256'],'content_chars':len(e['content']),'metadata':{k:v for k,v in e.items() if k!='content'},
      'content_location':f'tools/living_world_fixture.json.gz:data.character_book.entries[id={e["id"]}]',
      'duplicate_content_ids':duplicates[p['contentSha256']], 'mechanic_clauses':rules,
      'extraction_processing_refs':refs(*functions.split('; ')), 'storage':storage,'refresh':'Existing source-bound chronological folds and caches; source edits and swipes invalidate observations',
      'display':ui,'tests':tests,'direct_runtime_evidence':p,
      'evidence':'All enabled content read/normalized losslessly; direct catalog output shown separately. Named family contracts are synthetic, not individual entry semantic tests.',
      'limitations':'No live provider or playthrough verification. Narrative physics, inferred ownership, NPC secrets and future/possible events are not automatically asserted as campaign state.'})
core = []
for key,value in data.items():
    if key=='character_book': continue
    rendered = value if isinstance(value,str) else json.dumps(value,ensure_ascii=False)
    core.append({'field':'data.'+key,'type':type(value).__name__,'characters':len(rendered),'sha256':hashlib.sha256(rendered.encode()).hexdigest(),
      'status':'not applicable' if key in ['name','creator','creator_notes','tags','description'] or not value else 'partially supported',
      'coverage':'Catalogue greetings tested as non-state; personality rules mapped to mechanic register; original prose/metadata retained exactly in fixture',
      'tests':['test_living_world_compatibility.cjs'],'source_location':'tools/living_world_fixture.json.gz:data.'+key})
result={'card_source_sha256':original_sha,'baseline':'601e98e140227fbfa3ffd3066e4fd46417d1ddd0','counting_unit':'Original entry ID, not a verified gameplay mechanic',
 'counts':dict(collections.Counter(e['status'] for e in register)),'root_metadata':{k:v for k,v in card.items() if k!='data'},'book_metadata':{k:v for k,v in data['character_book'].items() if k!='entries'},'core_fields':core,'core_mechanic_clauses':[{'line':i,'text':line.strip(),'status':'partially supported','handling':'Observe accepted HUD/report state; narrator owns simulation','refs':refs('parseHud','buildCompanionInstructionRead','worldMushoku'),'tests':['test_living_world_compatibility.cjs']} for i,line in enumerate(data['personality'].splitlines(),1) if re.search(r'\b(?:HARD|FORMAT|NEVER|ONLY|WHEN|TRIGGER|GATE|RULE|SLOT)\b',line,re.I)],'entries':register,
 'duplicate_content_groups':[ids for ids in duplicates.values() if len(ids)>1],
 'limits':'Partial includes untested individual mechanics. Supported observational contracts are listed separately; no full-card compatibility percentage.'}
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'entry-coverage.json.gz').write_bytes(gzip.compress(json.dumps(result,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
fields=['id','enabled','label','family','status','content_sha256','duplicate_content_ids','content_location','extraction_processing_refs','storage','refresh','display','tests','evidence','limitations']
with (OUT/'entry-coverage.csv').open('w',newline='') as stream:
    writer=csv.DictWriter(stream,fields,lineterminator='\n');writer.writeheader()
    for row in register: writer.writerow({k:'; '.join(map(str,row[k])) if isinstance(row[k],list) else row[k] for k in fields})
(OUT/'inventory.json').write_text(json.dumps({k:v for k,v in result.items() if k!='entries'},indent=2)+'\n')
(OUT/'full-card-probe.json').write_text(json.dumps(probe,indent=2)+'\n')
print(json.dumps({'entries':len(entries),'enabled':998,'disabled':6,'counts':result['counts'],'duplicate_content_groups':len(result['duplicate_content_groups']),'spells':probe['spells'],'techniques':probe['techniques'],'lossless_fixture_equality':len(sys.argv)>2}))
