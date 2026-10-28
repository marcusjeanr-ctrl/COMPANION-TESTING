#!/usr/bin/env python3
"""Reproducible repository/system/card register, not live gameplay certification.
Usage: python3 tools/build_tracking_3_coverage.py OUTPUT_DIRECTORY [ORIGINAL_CARD]
Reuses the existing lossless full-card fixture and original-ID coverage builder.
"""
import collections,csv,gzip,hashlib,json,pathlib,re,subprocess,sys,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=pathlib.Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
baseline='0d84f371fe19c69a81f7e31f307c8099bc3763a6'
source=(ROOT/'dist/backend.js').read_text();frontend=(ROOT/'dist/frontend.js').read_text()
profiles=[
('HUD, pins and guards','parseHud hmsReadSystems messageHud','test_universal_card_matrix test_living_world_compatibility'),
('Classic user stats and RPG attributes','parseResponse collectCommitted','test_panel_tracking test_universal_card_matrix'),
('Info, date, weather and location','parseHud hmsTimeline','test_panel_tracking test_six_sided_repairs'),
('Body, conditions, vitals and danger','hmsReadVitals hmsReadWounds hmsReadConditions','test_living_world_compatibility test_visual_rank_integrity'),
('Persistent injuries and recovery','injNormalize injuryReadState injPanel','test_tracking_cross_system_2_9_13 test_tracking_2_9_3'),
('Player XP, mood and survival','hmsYouPanel hmsSurvival','test_panel_tracking test_tracking_cross_system_2_9_13'),
('Magic reference, ownership and progression','spellResolver spellStoryFoldUncached spellListPanel','test_magic_identity_progression test_reading_and_magic'),
('Sword techniques, ranks and Touki','techCatalog techStanding techListPanel','test_living_world_compatibility test_visual_rank_integrity'),
('Quest identity, objectives and lifecycle','questMatch questDetailsLatest questReportedState','test_tracking_engine_3 test_quest_identity_2_9_2'),
('Agenda appointments and rescheduling','agendaRead agendaNormalize','test_agenda_occurrence_2_9_11 test_tracking_evidence_2_9_13'),
('Plot threads and personal objectives','plotPanel objectivesNormalize','test_tracking_cross_system_2_9_13 test_tracking_engine_3'),
('Canon events, Sandbox and branching','mtEventLedger mtSaga worldMushoku','test_living_world_compatibility test_universal_six_sided_matrix'),
('Characters, identity, party and relationships','partyMatch relReconcile hmsRelationsPanel','test_reconciliation_integrity test_tracking_continuation_accuracy'),
('Family location, status and history','famRead famNormalize','test_stabilization_continuity test_living_world_compatibility'),
('NPC feelings, bonds and routines','simFold simPanel','test_reconciliation_integrity test_universal_integrity'),
('Owner-specific knowledge and secrets','simLearnedNormalize secretRead partyMatch','test_tracking_engine_3 test_tracking_cross_system_2_9_13'),
('Internal States under replies','statesFill statesPanelHtml','test_internal_states_export_2_9_5 test_tracking_continuation_accuracy'),
('Chekhov promises and unresolved clues','simChekhovNormalize simFold','test_panel_tracking test_reconciliation_integrity'),
('Inventory, equipment and carried items','gearRead gearNormalize','test_tracking_source_integrity test_additional_tracking_2_9_11'),
('Property and holdings','holdRead holdNormalize','test_living_world_compatibility test_panel_tracking'),
('Currency, debts and transactions','moneyRead moneyNormalize','test_tracking_engine_3 test_tracking_cross_system_2_9_13'),
('Organizations and affiliations','factionRead factionNormalize','test_living_world_compatibility test_panel_tracking'),
('World references, systems and contracts','worldPanel worldMushoku','test_universal_card_matrix test_living_world_compatibility'),
('Atlas, travel and geographic references','atlasFor hmsTimeline','test_atlas_references test_six_sided_repairs'),
('Scene maps, saved rooms and buildings','hmsMapPanel hmsBuildingsPanel posNormalize','test_panel_tracking test_reconciliation_integrity'),
('Communications, contacts and devices','hmsCommsPanel','test_panel_tracking test_universal_integrity'),
('Chapters, summaries and Chronicle','chaptersPanel chronicleBuild','test_universal_integrity test_long_chat_stability'),
('Engine fights, encounters and DND','immPanel dndRound','test_startup_and_render test_universal_integrity'),
('Save, continuation and restore','companionTurnPurpose getSwipeData','test_save_continue_boundary test_living_world_compatibility'),
('Metadata, swipes, edits and refresh','setSwipeData getSwipeData runSeparateUpdate','test_metadata_read_cost test_recovery_reliability test_tracking_engine_3'),
('Lore, memories and context injection','buildLoreBlock buildMemoryBlock buildCompanionInstructionRead','test_reading_and_magic test_universal_integrity'),
('Presets, settings, guards and recovery','emptyChatState hmsCfg','test_startup_and_render test_recovery_reliability'),
('UI, popout, float, localization and controls','pushState','test_frontend_chat_isolation test_startup_and_render'),
('Release, packaging and retired rebuild safeguards','hmsDiagnostics','test_publish_rc test_rebuild_safety')]
def ref(name):
 m=re.search(r'\bfunction '+re.escape(name)+r'\(',source);assert m,name
 return 'dist/backend.js:'+str(source[:m.start()].count('\n')+1)+':'+name
systems=[]
for name,functions,tests in profiles:
 testpaths=['tools/'+t+'.cjs' for t in tests.split()]
 for t in testpaths:assert (ROOT/t).exists(),t
 systems.append({'system':name,'source':[ref(f) for f in functions.split()],'tests':testpaths,
 'processing':'Existing accepted HUD/report → active-swipe metadata → chronological read pass → panel; original stores retained',
 'status':'Deterministic contracts covered; narrative/provider/live behavior partial',
 'measurement':'Export counts where observations exist; synthetic regressions otherwise, no invented accuracy rate'})
(OUT/'systems.json').write_text(json.dumps(systems,indent=2)+'\n')
with tempfile.TemporaryDirectory(prefix='companion-card-register-') as folder:
 cmd=['python3',str(ROOT/'tools/build_living_world_coverage.py'),folder]+sys.argv[2:]
 subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL)
 original=json.loads(gzip.decompress((pathlib.Path(folder)/'entry-coverage.json.gz').read_bytes()))
 inv=json.loads((pathlib.Path(folder)/'inventory.json').read_text());inv['baseline']=baseline
 # Preserve original IDs and verified references. Narrative rules remain partial.
 register=original if isinstance(original,list) else original.get('entries',original.get('register'))
 assert isinstance(register,list) and len(register)==1004
 for row in register:
  if row['family']=='magic':row['tests']+=['test_magic_identity_progression.cjs']
  if row['family'] in ['branch','identity','ownership']:row['tests']+=['test_tracking_engine_3.cjs']
  row['currentBaseline']=baseline
 (OUT/'living-world-coverage.json.gz').write_bytes(gzip.compress(json.dumps(register,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
 with (OUT/'living-world-coverage.csv').open('w',newline='') as stream:
  writer=csv.writer(stream,lineterminator='\n');writer.writerow(['id','enabled','label','family','status','source','tests','limitations'])
  for row in register:writer.writerow([row['id'],row['enabled'],row['label'],row['family'],row['status'],'; '.join(row['extraction_processing_refs']),'; '.join(row['tests']),row['limitations']])
 (OUT/'card-inventory.json').write_text(json.dumps(inv,indent=2)+'\n')
# Complete static function/renderer and file inventory. Counts do not imply reachability.
files=[]
for name in subprocess.check_output(['git','ls-tree','-r','--name-only',baseline],cwd=ROOT,text=True).splitlines():
 b=subprocess.check_output(['git','show',baseline+':'+name],cwd=ROOT);files.append({'path':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
functions=[]
for name,text in [('dist/backend.js',source),('dist/frontend.js',frontend)]:
 for m in re.finditer(r'\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',text):
  functions.append({'name':m[1],'file':name,'line':text[:m.start()].count('\n')+1,'lexicalReferences':len(re.findall(r'\b'+re.escape(m[1])+r'\b',text))})
obj={'baseline':baseline,'files':files,'candidateFunctions':functions,'frontendRenderers':[x for x in functions if x['file']=='dist/frontend.js' and x['name'].startswith('render')],
 'note':'Static inventory plus targeted semantic review; lexical counts do not prove dead code. No runtime removal based on counts. Enabled entry content and core rules read by existing complete-card audit.'}
(OUT/'architecture-inventory.json.gz').write_bytes(gzip.compress(json.dumps(obj,separators=(',',':')).encode(),mtime=0))
print(json.dumps({'systems':len(systems),'entries':len(register),'baselineFiles':len(files),'functions':len(functions),'renderers':len(obj['frontendRenderers'])}))
