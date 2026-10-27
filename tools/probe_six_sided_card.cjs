// Read-only evidence from a complete, locally supplied card; never calls a model.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {runtime} = require('./test_panel_tracking.cjs');
const card = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).data;
const c = runtime().ctx, entries = card.character_book.entries;
const normalized = entries.map(e => c.loreNormEntry(e));
for (let i=0;i<entries.length;i++) {
    const e=entries[i], n=normalized[i];
    assert.equal(!!n, e.enabled !== false && e.disabled !== true);
    if(n) { assert.equal(n.id,String(e.id)); assert.equal(n.content,e.content.trim()); }
}
c.setLorePool('card-audit',entries);
const pool=c.getLorePool('card-audit');
assert.equal(pool.length,entries.filter(e=>e.enabled!==false && e.disabled!==true).length);
assert.equal(c.spellKnown([],c.emptyChatState(),null,'card-audit').size,0,'Book grants no player spells');
assert.equal(c.simFold([],c.emptyChatState()).minds.size,0,'Book creates no campaign NPCs');
const spells=c.spellCatalog('card-audit'), techniques=c.techCatalog('card-audit');
const evidence=entries.map((e,i)=>({id:e.id,normalization:'pass',enabled:!!normalized[i],
    directSpellSource:spells.some(s=>String(s.src)===String(e.id)),
    directTechniqueSource:techniques.some(s=>String(s.src)===String(e.id)),
    // Catalog provenance is reference availability, never proof of narrative mastery.
    spellNames:spells.filter(s=>e.content.includes(s.name)).map(s=>s.name),
    techniqueNames:techniques.filter(s=>e.content.includes(s.name)).map(s=>s.name)}));
console.log(JSON.stringify({entries:evidence,poolCount:pool.length,spellCount:spells.length,
    chantCount:spells.filter(s=>s.chant).length,techniqueCount:techniques.length,
    arcCount:c.mtArcList('card-audit').length,scheduleCount:c.mtCanonSchedule('card-audit').length,
    noAutomaticKnowledge:true,noAutomaticNpcs:true}));
