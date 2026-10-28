// Complete magic-reference inventory. No model/network call and no private chat.
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto');
const {runtime}=require('./test_panel_tracking.cjs');
const data=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz'))).data;
const c=runtime().ctx;c.setLorePool('magic-audit',data.character_book.entries);
const catalog=c.spellCatalog('magic-audit'),resolve=c.spellResolver('magic-audit');
const sources=new Map(catalog.map(row=>[row.key,new Set()])),entries=[];
for(const e of data.character_book.entries){
 if(!/^\[(?:Magic [12]|magic core)\]/i.test(e.comment))continue;
 const n=c.loreNormEntry(e),rows=[];if(n){c.spellsFromEntry(n,rows);c.spellsFromIndex(n,rows);}
 const keys=[...new Set(rows.map(row=>resolve(row.name).key))];
 for(const key of keys)if(sources.has(key))sources.get(key).add(e.id);
 entries.push({id:e.id,label:e.comment,enabled:!!n,contentSha256:crypto.createHash('sha256').update(e.content).digest('hex'),
  shape:/^Tier:/m.test(e.content)?'typed individual spell':c.rankedLoreBullets(n||{}).length?'ranked school list':/Master Spell Index/.test(e.comment)?'master index':'magic rule/reference',
  canonicalSpellKeys:keys,contentLocation:`tools/living_world_fixture.json.gz:data.character_book.entries[id=${e.id}]`,
  coverage:keys.length?'Literal definitions normalized; individual owned-state contracts tested separately':'Reference/narrative rule; observe accepted HUD and reports, no independent magic simulator'});
}
const master=c.worldSpellIndex('magic-audit');
for(const list of Object.values(master||{}))for(const row of list)for(const name of row.spells){
 const key=resolve(String(name).replace(/\s*\([^)]*\)\s*$/,'').trim()).key;if(sources.has(key))sources.get(key).add(476);
}
const result={baseline:'415392cd3decefbae260ff898c0a94792656695f',cardSha256:'21918f9b3f02ec9edbb4cc44565256078863d3b93eb7ab0fe5cbb708c4d33e1f',
 countingUnit:'Original magic entry ID plus distinct canonical spell; not a live spell-effect certification',
 entries,spells:catalog.map(row=>({...row,sourceEntryIds:[...sources.get(row.key)].sort((a,b)=>a-b),
  testedContract:'test_magic_identity_progression.cjs: every canonical reference individually Known; no rank grants; grouped/owner/swipe/retraction/refresh cases',
  liveProviderStatus:'Unverified; no live Lumiverse instance',effectExecution:'Narrator-owned; Companion records accepted observations'})),
 counts:{magicEntries:entries.length,typedIndividualEntries:entries.filter(x=>x.shape==='typed individual spell').length,
 rankedListEntries:entries.filter(x=>x.shape==='ranked school list').length,canonicalSpells:catalog.length,
 schools:[...new Set(catalog.map(x=>x.school))],emptyHistoryKnown:c.spellKnown([],{},null,'magic-audit').size}};
console.log(JSON.stringify(result));
