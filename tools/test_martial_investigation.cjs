// Investigation fixtures only: document current behaviour without changing it.
const assert=require('node:assert/strict');
const {runtime,hud}=require('./test_panel_tracking.cjs');
const {sheet}=require('./test_sheet_followup.cjs');
const names=['Sword God countercut','Diagonal Step/Counter','Touki (Battle Aura)'];
const view={hms:{systems:{abilities:[{category:'Martial',items:names.map(name=>({name,state:'Practicing'}))}]}}};
for(const name of names)assert(sheet()(view).includes(name),'Serializer does not deliberately exclude accepted Martial rows');
const catalogue={hms:{techniques:{schools:[{spells:[{name:'Training counter',status:'study',rank:'Beginner'},{name:'Established counter',status:'known',rank:'Beginner'}]}]}}};
const text=sheet()(catalogue);assert(!text.includes('Training counter'));assert(text.includes('Established counter'));
function scene(quote,state='reliable',evidence=quote){
 const r=runtime(),c=r.ctx,content=hud()+'\n'+quote;
 const data=c.parseCompanion('<rpg_companion>'+JSON.stringify({you:{abilities:[{name:'Sword God countercut',owner:'you',state,historical:false,evidence}]}})+'</rpg_companion>');
 r.messages.push({id:'strike',role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:{...data,survival:data.you}},sources:{0:c.readingSource(content)}}}});
 return {r,c,msg:r.messages[0],data:{...data,survival:data.you}};
}
const single=scene('You deliver one clean countercut.');
assert.equal(single.c.abilityEvidenceRows(single.msg,single.data,'Marcus')[0].state,'reliable');
const key=single.c.spellKey('Sword God countercut'),fold=single.c.spellStoryFold(single.r.messages,'test');
assert.equal(fold.learned.get(key).state,'reliable');assert.equal(fold.learned.get(key).newlyLearned,false);assert.equal(fold.mastered.has(key),false);
assert.equal(single.c.spellResolver('test').domain('Sword God countercut'),'magic','Document empty-lore fallback gap, not desired classification');
assert.equal(single.c.spellResolver('test').domain('Diagonal Step/Counter'),'magic');
assert.equal(single.c.spellResolver('test').domain('Touki (Battle Aura)'),'martial');
for(const quote of ['You try the countercut and fail.','You watch the instructor demonstrate a countercut.']){
 const x=scene(quote);assert.equal(x.c.abilityEvidenceRows(x.msg,x.data,'Marcus')[0].state,'unverified');
}
const mismatch=scene('You deliver one clean countercut.','reliable','You reliably countercut the opponent.');
assert.equal(mismatch.c.abilityEvidenceRows(mismatch.msg,mismatch.data,'Marcus').length,0);
assert.equal(single.r.writes.length,0);assert.equal(mismatch.r.writes.length,0);
console.log('Investigation: accepted Martial rows export; catalogue study is excluded; exact single-strike reliable assessment survives current guards and enters known collection without mastery/new-learning flag. Failed/demonstrated/mismatched evidence is excluded. Empty-lore naming gaps reproduced.');
