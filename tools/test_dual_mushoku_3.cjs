// Both complete cards; synthetic campaigns and accepted observations, no live provider.
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const {runtime,hud}=require('./test_panel_tracking.cjs');const r=runtime(process.env.COMPANION_TASK2_BASELINE),c=r.ctx;
const cards={living:JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz'))).data,six:JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/six_sided_world_fixture.json.gz'))).data};
for(const[id,card]of Object.entries(cards))c.setLorePool(id,card.character_book.entries);r.run(`userNameCache.set('six','Pilot Vale'); userNameCache.set('living','Pilot Vale')`);
const cases=[],test=(n,f)=>cases.push([n,f]);
function msg(id,fields={},body='A confirmed scene.',header=hud('Hall','08:00',true)){const content=header+'\n'+body;return {id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:fields},sources:{0:c.readingSource(content)}}}};}
const list=`**SPELL LIST — Pilot Vale**
*(All spells below may be cast silently; costs shown per cast.)*
**WATER — Advanced (strongest school)**
- Water Ball *(Beginner · 10)* — a water sphere; not a second spell.
- Squall *(Advanced · 250)* — a drenching rain.
- *Next tier — Saint:* Cumulonimbus *(Saint · 1,000)* — **Known but not yet mastered.** Control remains weak.
**MELDED — known theory, weak practice**
- Deep Mist *(Advanced+)* — an observed demonstration only.
**HEALING — Beginner (book-taught, rarely practiced)**
- Healing *(Beginner · 10)* — heals a scratch.
***
- Unrelated after-list bullet`;
test('Owned spell-list format retains individual names, numeric rank annotations and incomplete mastery',()=>{
 const known=c.spellKnown([msg('list',{},list)],{},null,'six');for(const name of ['Water Ball','Squall','Cumulonimbus','Healing'])assert(known.has(c.spellResolver('six')(name).key),name);assert.equal(known.size,4);assert(!known.get('cumulonimbus').mastered);assert.match(known.get('cumulonimbus').note,/not mastered/);assert(!known.has('deep mist'));
});
test('NPC, unowned, hypothetical, quoted, hidden and continuation spell lists never grant player knowledge',()=>{
 for(const body of [list.replace('Pilot Vale','Another Caster'),list.replace(' — Pilot Vale',''),'> '+list.replace(/\n/g,'\n> '),'```\n'+list+'\n```'])assert.equal(c.spellKnown([msg('bad',{},body)],{},null,'six').size,0);
 for(const flag of ['hidden','continue']){const m=msg(flag,{},list);if(flag==='hidden')m.hidden=true;else m._rpgcPurpose=flag;assert.equal(c.spellKnown([m],{},null,'six').size,0);}
});
test('Unique short family references reuse full identities while ambiguous names and manual hiding remain isolated',()=>{
 const data={family:[{name:'Alden Vale',relation:'father',status:'alive',where:'Library',known:'told'}],characters:[{name:'Alden'}],relations:[{key:'alden',name:'Alden',bond:'Father and tutor'}]};
 const members=c.famRead([msg('family',data)],{}).members;assert.equal(members.length,1);assert.equal(members[0].name,'Alden Vale');assert.equal(members[0].where,'Library');
 const shorter={family:[{name:'Alden',relation:'father',where:'Harbor',known:'seen'}]};assert.equal(c.famRead([msg('full',data),msg('short',shorter)],{}).members[0].name,'Alden Vale');
 assert.equal(c.famRead([msg('family',data)],{family:{hidden:['alden vale']}}).members.length,0);
 const ambiguous={...data,family:[...data.family,{name:'Alden North',relation:'uncle',status:'alive',where:'Harbor',known:'seen'}]};assert(c.famRead([msg('two',ambiguous)],{}).members.filter(x=>x.name.includes(' ')).every(x=>['Library','Harbor'].includes(x.where)));
});
test('Agenda place abbreviation requires the same observed parent and preserves separate yards and conditions',()=>{
 const base={key:'training lesson',what:'Training lesson',with:'Tutor',where:'Training yard',when:'now, this morning',state:'in_progress',kind:'errand'};
 const h=hud('Vale Hall, training yard','08:00',true);let chat=[msg('a',{agenda:[base]},'',h),msg('b',{agenda:[{...base,where:'Vale Hall, training yard',when:'this morning'}]},'',h)];assert.equal(c.agendaRead(chat,{}).items.length,1);
 chat=[chat[0],msg('other',{agenda:[{...base,where:'North Hall, training yard',when:'this morning'}]},'',hud('North Hall, training yard','08:00',true))];assert.equal(c.agendaRead(chat,{}).items.length,2);
});
test('Both complete cards preserve all enabled contents and references without automatic skills or NPCs',()=>{
 for(const[id,card]of Object.entries(cards)){for(const e of card.character_book.entries){const n=c.loreNormEntry(e);assert.equal(!!n,e.enabled!==false&&e.disabled!==true);if(n)assert.equal(n.content,e.content.trim());}assert.equal(c.spellKnown([],{},null,id).size,0);assert.equal(c.simFold([],c.emptyChatState()).minds.size,0);}
 assert.equal(c.getLorePool('six').length,1273);assert.equal(c.getLorePool('living').length,998);
});
test('Both cards preserve explicit childhood-to-old-age observations without inventing income, descendants or death',()=>{
 for(const id of ['six','living']){
  const history=[];
  for(const [i,age]of [13,22,42,85].entries()){
   const year=404+age;
   const head=id==='six'?`### WORLD STATE ###\nArmored Dragon Calendar: K${year}, Month 2, Day 10 | Time: 08:00 (Morning)\n◆ Central Continent → Vale Estate\nRace: Human | Origin: Native | Age: ${age} (born K404, Month 2)\nSandbox: Vale Estate — K${year}\nMana Capacity: Vast | Reserve: Full\nMagic Tiers: Water (Advanced)\nTouki (Battle Aura): Inactive\nGuild: B\nInjuries: Left hand — Permanent\nNarrative Mode: Strict Agency\n***`:hud('Vale Estate','08:00',true).replace(/K\.?417/,'K'+year).replace('Age: 13','Age: '+age).replace('***','Injuries: Left hand — Permanent\n***');
   const fields=i===0?{family:[{name:'Alden Vale',relation:'father',status:'alive',where:'Library',known:'seen'}],survival:{spells:['Waterball']}}:i===1?{family:[{name:'Mira Vale',relation:'wife',status:'alive',where:'Estate',known:'seen'}],holdings:c.holdNormalize([{name:'Vale Workshop',kind:'business',state:'gained'},{name:'Baron of Northbridge',kind:'title',state:'gained'}]),money:c.moneyNormalize([{amount:50,currency:'gold',kind:'debt',dir:'in',with:'Guild'}]),factions:c.factionNormalize([{name:'Adventurer Guild',standing:'member',rank:'B'}])}:i===2?{family:[{name:'Lina Vale',relation:'daughter',status:'alive',where:'Estate',known:'seen'}]}:{};
   history.push(msg('life'+id+i,fields,'Only the explicitly recorded changes occur.',head));
   const world=c.worldMushoku(id,c.worldLines(c.parseHud(head)),c.emptyChatState());assert.equal(world.age,age);assert.equal(world.year,year);assert(c.hmsReadSystems(c.parseHud(head)).wounds.some(x=>x.tag==='Permanent'));
  }
  const restored=JSON.parse(JSON.stringify(history));assert.equal(c.famRead(restored,{}).members.length,3);assert(c.famRead(restored,{}).members.every(x=>x.status==='alive'));assert.equal(c.holdRead(restored,{}).items.filter(x=>!x.lost).length,2);assert.equal(c.moneyRead(restored,{}).list.length,1);assert.equal(c.moneyRead(restored,{}).open[0].left,50);assert(c.spellKnown(restored,{},null,id).has(c.spellResolver(id)('Waterball').key));assert.equal(c.questDetailsLatest(restored).length,0);
 }
});
test('Both continuation handlers preserve valid snapshots without replaying copied transactions',()=>{
 for(const command of ['MUSHOKU_TENSEI_START_CONTINUER','Mushoku_Continue_Handler']){
  const m=msg('restore',{money:c.moneyNormalize([{amount:99,currency:'gold',kind:'income'}]),survival:{got:['Copied heirloom']},minds:[{name:'Tutor',feel:{p:'joy'}}]});const chat=[{id:'continue',role:'user',content:command+'\n'+hud()},m];c.companionMarkTurnPurposes(chat);assert.equal(m._rpgcPurpose,'continue');assert.equal(c.moneyRead(chat,{}).list.length,0);assert.equal(c.getSwipeData(m),null);c.statesFill('restore'+command,chat);assert(c.statesReading(m));
 }
});
test('Proposed inheritance and uncertain property never become owned holdings',()=>{
 for(const entry of [{name:'Northern Estate',kind:'property',state:'offered'},{name:'Northern Estate',state:'gained',accepted:false},{name:'Northern Estate',uncertain:true}])assert.equal(c.holdNormalize([entry]),null);
 const data={holdings:[{key:'estate',name:'Estate',kind:'property',state:'gained',uncertain:true}]};assert.equal(c.holdRead([msg('unconfirmed',data)],{}).items.length,0);
});
test('Six-Sided birthday/calendar rollover and Living World extended days retain distinct chronology',()=>{
 const before=hud().replace('Thawmoon (Month 2), Day 8','Month 1, Day 30').replace('Age: 13','Age: 12');const after=hud().replace('Thawmoon (Month 2), Day 8','Month 2, Day 1').replace('Age: 13','Age: 13 🎂');
 const a=c.parseHud(before),b=c.parseHud(after);assert.equal(c.hmsClock(b).minutes-c.hmsClock(a).minutes,1440);assert.equal(c.worldMushoku('six',c.worldLines(a),{}).age,12);assert.equal(c.worldMushoku('six',c.worldLines(b),{}).age,13);
 const early=c.parseHud(hud('Hall','08:00',true).replace('Day: 8','Day: 721')),late=c.parseHud(hud('Hall','08:00',true).replace('Day: 8','Day: 722'));assert.equal(c.hmsClock(late).minutes-c.hmsClock(early).minutes,1440);assert.equal(c.worldMushoku('living',c.worldLines(late),{}).day,722);
});
(async()=>{let failed=0;for(const[n,f]of cases){try{await f();console.log('PASS '+n)}catch(e){failed++;console.error('FAIL '+n+': '+e.message)}}console.log(`${cases.length-failed}/${cases.length} dual-card contracts passed`);if(failed)process.exitCode=1})();
