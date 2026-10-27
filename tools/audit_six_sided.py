#!/usr/bin/env python3
"""Read the entire supplied card and CSV; emit an ID-preserving coverage register.
Usage: python tools/audit_six_sided.py CARD INVENTORY_CSV OUTPUT_DIRECTORY
No source/card mutation, network, dependencies or model calls. Result classifications
are conservative mechanic-family evaluations, not per-entry live certification.
"""
import collections
import csv
import hashlib
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROFILES = {
    'identity': ('Dependent on narrator output', 'normalizeCharacters; simKeyer; simFold; famRead; relReconcile', 'test_six_sided_integration.cjs; test_tracking_continuation_accuracy.cjs', 'Player/roster exclusion; persistent NPC/family identity; no automatic population from dossiers. Individual biographies and aliases need accepted campaign evidence.'),
    'magic': ('Partially supported', 'loreNormEntry; spellCatalog; spellKnown; spellStudyActive; worldMushoku', 'test_six_sided_integration.cjs; test_reading_and_magic.cjs; test_visual_rank_integrity.cjs', 'Reference catalog, rank vs known/study/mastery boundaries; no execution of every spell, ritual, cost or rank law.'),
    'combat': ('Dependent on narrator output', 'techCatalog; techListPanel; worldMushoku; immRequest', 'test_visual_rank_integrity.cjs; test_six_sided_integration.cjs', 'Read literal ranks/Touki and evidence-backed techniques; physical outcomes and legal advancement remain narrator-owned.'),
    'geography': ('Partially supported', 'parseHud; atlasFor; atlasMushokuReferences; atlasCalamityState', 'test_atlas_references.cjs; test_six_sided_repairs.cjs; test_six_sided_integration.cjs', 'Dynamic hierarchy and temporal reference tests; individual location routes, travel durations and all map geometry are not certified.'),
    'ownership': ('Dependent on narrator output', 'gearRead; pocketsNow; moneyRead; holdRead; factionRead', 'test_tracking_source_integrity.cjs; test_tracking_2_9_3.cjs', 'Established ownership/payment vs promise/nearby boundaries; artifact effects, prices and all regional exchange rules are narrator-owned.'),
    'branch': ('Dependent on narrator output', 'worldMushoku; mtSaga; mtEventLedger; plotNormalize; agendaRead', 'test_six_sided_repairs.cjs; test_tracking_continuation_accuracy.cjs; test_six_sided_integration.cjs', 'Actual event ledger distinct from forecasts; no independent simulation of every alternate timeline, checkpoint or causality chain.'),
    'system': ('Partially supported', 'parseHud; worldMushoku; companionTurnPurpose; companionResumeHud; hmsHandleReply', 'test_save_continue_boundary.cjs; test_six_sided_integration.cjs; test_universal_six_sided_matrix.cjs', 'Generic HUD/state contracts tested; exact rule engine, UI optional slots and live narrator output are only partially verified.'),
    'lore': ('Compatible by design with no special tracking required', 'loreNormEntry; loreEntryHits; buildLoreBlock', 'test_universal_integrity.cjs', 'Background definition/history is reference context, not an automatic campaign state transition. If established in play, use the relevant existing tracker; no automatic grants or events.'),
    'disabled': ('Not applicable to Companion', 'loreNormEntry', 'test_six_sided_integration.cjs', 'Disabled source entry stays excluded. No crossover mechanics are enabled by this integration.'),
}
CORE = {**{i:'system' for i in [1166,1167,1168,1169,1170,1171,1173,1174,1195,1196,1199,1200,1201,1202,1203,1204,1205,1206,1229,1230,1231]}, **{i:'branch' for i in range(1207,1229)}}
ASSERTION_TERMS = {'identity':r'key\(|minds|family|members|where', 'magic':r'spell|learn|master|progress|chant|known',
    'combat':r'martial|tech|touki|style', 'geography':r'atlas|nodes|location|continent|clock|month',
    'ownership':r'gear|pocket|money|hold|faction|owned|permission', 'branch':r'canon|saga|event|arc|agenda|quest',
    'system':r'purpose|continue|hud|restored|save', 'lore':r'lore|pool|selective|disabled', 'disabled':r'loreNormEntry'}

def family(e):
    if e.get('enabled') is False or e.get('disabled') is True:
        return 'disabled'
    if e['id'] == 82: return 'branch'
    if e['id'] == 874: return 'combat'
    if e['id'] in CORE:
        return CORE[e['id']]
    label=e.get('comment','')
    # Inspect the actual entry header as well as its label/category; the preliminary
    # CSV groups are deliberately not used to decide compatibility.
    header=label+' '+e['content'].split('\n')[0]
    if re.search(r'\[(?:System|Mode|Start Card)\b',header,re.I): return 'system'
    if re.search(r'Divergence|Romance Ripple|\[World State|\[Arc\]|Canon Details|Mana Calamity',header,re.I): return 'branch'
    if re.search(r'\[(?:Character|Race|Curse|Blessing)|Dossier|Miko',header,re.I): return 'identity'
    if re.search(r'\[(?:Magic|Spell|Fan Skill)|spell mechanics|magic theory',header,re.I): return 'magic'
    if re.search(r'\[(?:Combat|Technique|Monster)|martial art|sword technique',header,re.I): return 'combat'
    if re.search(r'\[(?:Item|Weapon|Artifact|Culture & Economy|Faction|Organization)|guild|econom',header,re.I): return 'ownership'
    if re.search(r'\[(?:Location|Geography)|geograph|landmark|continent',header,re.I): return 'geography'
    # A prose entry with conditional mechanics must not be dismissed as only lore.
    if re.search(r'\b(?:HUD|FORMAT|Condition|Trigger|Effect|Mechanic|Cost|Cooldown|Drain|Activation)\s*:',e['content'],re.I): return 'system'
    return 'lore'

def main():
    source, inventory, output = map(pathlib.Path,sys.argv[1:])
    backend=(ROOT/'dist/backend.js').read_text()
    for _, functions, _, _ in PROFILES.values():
        for fn in functions.split('; '):
            assert re.search(r'function '+re.escape(fn)+r'\(',backend),fn
    raw=source.read_bytes(); card=json.loads(raw)['data']; entries=card['character_book']['entries']
    rows=list(csv.DictReader(inventory.open(newline='')))
    assert len(entries)==len(rows)==1296
    by_id={e['id']:e for e in entries}; assert len(by_id)==len(entries)
    probe=json.loads(subprocess.check_output(['node',str(ROOT/'tools/probe_six_sided_card.cjs'),str(source)],text=True))
    probe_ids={e['id']:e for e in probe['entries']}
    register=[]
    for r in rows:
        e=by_id[int(r['id'])]
        for key,value in [('enabled',str(e['enabled'])),('label',e['comment']),('keys',' | '.join(e['keys'])),('content_chars',str(len(e['content']))),('category',e.get('extensions',{}).get('category') or '[uncategorized]')]:
            assert r[key]==value,(e['id'],key)
        f=family(e); status,functions,tests,limit=PROFILES[f]
        ext=e.get('extensions',{})
        # Record actual condition/output/cost sentences for traceability, without
        # copying the full card or converting every prose rule into a new feature.
        candidates=[line.strip() for line in e['content'].splitlines() if re.search(r'\b(?:HUD|FORMAT|Condition|Trigger|Effect|Mechanic|Cost|Cooldown|Drain|Activation|WHEN|IF)\b',line,re.I)]
        register.append({**r,'id':e['id'],'enabled':e['enabled'],'family':f,'classification':status,
            'source_pointer':f'/data/character_book/entries/{entries.index(e)}/content',
            'content_sha256':hashlib.sha256(e['content'].encode()).hexdigest(),
            'activation':{k:e.get(k) for k in ['keys','secondary_keys','constant','selective','case_sensitive','match_whole_words','position','depth','insertion_order']},
            'activation_extensions':{k:ext.get(k) for k in ['priority','selective_logic','use_regex','probability','sticky','cooldown','delay','scan_depth','prevent_recursion','exclude_recursion']},
            'rule_evidence':[s[:240] for s in candidates[:4]],'handling_functions':functions.split('; '),'family_test_files':tests.split('; '),
            'source_refs':['dist/backend.js:'+str(backend[:re.search(r'function '+re.escape(fn)+r'\(',backend).start()].count('\n')+1)+':'+fn for fn in functions.split('; ')],
            'assertion_refs':['probe_six_sided_card.cjs:10-11: enabled flag, original ID and unchanged content assertions'] + [name+':'+str(i)+':'+line.strip()[:180] for name in tests.split('; ') for i,line in enumerate((ROOT/'tools'/name).read_text().splitlines(),1) if 'assert.' in line and re.search(ASSERTION_TERMS[f],line,re.I)][:8],
            'direct_assertion':'probe_six_sided_card.cjs: per-entry normalization/disabled flag/ID/content invariants',
            'direct_result':probe_ids[e['id']]['normalization'],'family_assertion_scope':limit,
            'individual_mechanics_result':'Not individually simulated; family tests do not certify every narrative transition',
            'live_result':'Requires live Lumiverse verification' if f!='disabled' else 'Not applicable',
            'limitations':limit})
    mirror=card['extensions']['character_book']['entries']; mirror_by_content={e['content']:e for e in mirror}
    differences=collections.Counter()
    for e in entries:
        m=mirror_by_content[e['content']]
        for k in set(e)|set(m):
            if e.get(k)!=m.get(k): differences[k]+=1
    fields={k:{'chars':len(v),'sha256':hashlib.sha256(v.encode()).hexdigest()} for k,v in card.items() if isinstance(v,str)}
    greetings=[{'index':i,'chars':len(v),'sha256':hashlib.sha256(v.encode()).hexdigest(),'headings':re.findall(r'^#{1,4}\s+(.+)$',v,re.M)} for i,v in enumerate(card['alternate_greetings'])]
    result={'card_sha256':hashlib.sha256(raw).hexdigest(),'inventory_sha256':hashlib.sha256(inventory.read_bytes()).hexdigest(),'baseline_commit':'8d54bc65cfe965291329d812b8dfcec64ed6148a',
        'method':'Complete JSON/CSV cross-check and per-entry actual runtime normalization. Mechanic-family mapping is conservative; individual semantics are not exhaustively simulated.',
        'fields':fields,'greetings':greetings,'mirror':{'entries':len(mirror),'same_content_entries':len(mirror_by_content),'differences':dict(differences),'authority':'Use original data.character_book IDs; extension mirror has distinct IDs and labels, not another 1296 mechanics.'},
        'counts':dict(collections.Counter(r['classification'] for r in register)),'probe_summary':{k:v for k,v in probe.items() if k!='entries'},'entries':register}
    output.mkdir(parents=True,exist_ok=True)
    (output/'coverage-register.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    with (output/'coverage-register.csv').open('w',newline='') as stream:
        keys=['id','enabled','label','keys','family','classification','source_pointer','content_sha256','source_refs','family_test_files','assertion_refs','direct_assertion','direct_result','individual_mechanics_result','limitations']
        writer=csv.DictWriter(stream,keys,lineterminator='\n');writer.writeheader()
        for r in register: writer.writerow({k:'; '.join(r[k]) if isinstance(r[k],list) else r[k] for k in keys})
    print(json.dumps({'entries':len(register),'enabled':sum(e['enabled'] for e in entries),'classifications':result['counts'],'probe':result['probe_summary']}))

if __name__=='__main__': main()
