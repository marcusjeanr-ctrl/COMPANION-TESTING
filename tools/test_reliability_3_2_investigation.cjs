// Investigation only: asserts current behavior, not a desired progression rule.
const assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib');
const {runtime,hud}=require('./test_panel_tracking.cjs');
const card=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/six_sided_world_fixture.json.gz'))).data;
const examples=[
 {name:'Diagonal Step/Counter',quote:'I reinforce my movement with Touki and burst diagonally.'},
 {name:'Touki (Battle Aura)',quote:'I deliberately withdraw my Touki.'},
 {name:'Sword God countercut',quote:'You deliver one clean countercut.'},
 {name:'Compact diagonal cut',quote:'You deliver one clean diagonal cut.'}
];
const summaries=[];
for(const loaded of [false,true])for(const sample of examples){
 const r=runtime(),c=r.ctx;if(loaded)c.setLorePool('investigation',card.character_book.entries);
 r.run("settings.hmsSystems.abilities={enabled:true,vocabulary:'Martial: Touki (Battle Aura), Touki\\nMagic: Mana Capacity, Magic Tiers'}");
 const content=hud()+'\n'+sample.quote;
 const data=c.parseCompanion('<rpg_companion>'+JSON.stringify({you:{abilities:[{name:sample.name,owner:'you',state:'reliable',historical:false,evidence:sample.quote}]}})+'</rpg_companion>');
 const msg={id:'single',role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:{...data,survival:data.you}},sources:{0:c.readingSource(content)}}}};
 const original=JSON.stringify(msg),chat=[msg],st=c.emptyChatState();
 const rows=c.abilityEvidenceRows(msg,c.getSwipeData(msg),'Marcus');assert.equal(rows[0].state,'reliable');
 const key=c.spellKey(sample.name),fold=c.spellStoryFold(chat,'investigation');
 assert.equal(fold.learned.get(key).state,'reliable');assert.equal(fold.learned.get(key).newlyLearned,false);assert(!fold.mastered.has(key));
 const p=c.hmsPanelState('investigation',chat,st);
 const martial=(p.systems?.abilities||[]).filter(g=>g.category==='Martial').flatMap(g=>g.items).map(x=>({name:x.name,state:x.state,label:x.label}));
 const spells=(p.magic?.spellbook||[]).map(x=>x.name);
 const domain=c.spellResolver('investigation').domain(sample.name);
 if(sample.name==='Touki (Battle Aura)'){
  assert.equal(domain,'martial');assert(!spells.includes(sample.name));assert(martial.some(x=>x.label==='Touki (Battle Aura)'&&x.name==='Active'));
  assert(!martial.some(x=>x.state==='Reliable'&&x.name===sample.name));
 }else if(sample.name==='Compact diagonal cut'){
  assert.equal(domain,'martial');assert(martial.some(x=>x.name===sample.name&&x.state==='Reliable'));assert(!spells.includes(sample.name));
 }else{
  assert.equal(domain,'magic');assert(spells.includes(sample.name));
  assert(!(p.techniques?.schools||[]).flatMap(x=>x.spells||[]).some(x=>x.name===sample.name&&['known','mastered'].includes(x.status)));
 }

 summaries.push({loadedLore:loaded,name:sample.name,acceptedState:rows[0].state,domain:c.spellResolver('investigation').domain(sample.name),martial,magicSpellbook:spells});
 assert.equal(JSON.stringify(msg),original);assert.equal(r.writes.length,0);
}
console.log(JSON.stringify(summaries));
console.log('Investigation only: one exact action quote accepts a reported reliable assessment without mastery; no runtime rules or stored reports changed');
