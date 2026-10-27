// Complete supplied card; deterministic accepted reports are not live model tests.
const assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
const {runtime,seed,hud}=require('./test_panel_tracking.cjs');
const r=runtime(process.env.COMPANION_LIVING_BASELINE),c=r.ctx;
const card=JSON.parse(zlib.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz'))).data;
c.setLorePool('living',card.character_book.entries);
const base=()=>hud('Courtyard','07:15',true).replace('Current Arc: Sandbox','Current Arc: Sandbox — Build a workshop');
const tests=[],test=(name,fn)=>tests.push([name,fn]);
test('Full card normalizes every enabled entry without granting abilities or NPCs',()=>{
 assert.equal(card.character_book.entries.length,1004);assert.equal(c.getLorePool('living').length,998);
 for(const e of card.character_book.entries){const n=c.loreNormEntry(e);assert.equal(!!n,e.enabled!==false);if(n)assert.equal(n.content,e.content.trim());}
 assert.equal(c.spellKnown([],{},null,'living').size,0);assert.equal(c.simFold([],c.emptyChatState()).minds.size,0);
});
test('All ten catalogue greetings stay reference-only and extended campaign days retain their date',()=>{
 for(const text of [card.first_mes,...card.alternate_greetings])assert.equal(c.parseHud(text),null,'A catalogue example became current state');
 const text=base().replace('Day: 8','Day: 721');const w=c.worldMushoku('living',c.worldLines(c.parseHud(text)),c.emptyChatState());assert.equal(w.day,721);assert.equal(w.year,417);
 const before=c.hmsClock(c.parseHud(base().replace('Day: 8','Day: 720'))).minutes;assert.equal(c.hmsClock(c.parseHud(text)).minutes-before,1440);
});
test('Every explicit field-based spell retains name, school, tier and fan status',()=>{
 const cat=c.spellCatalog('living');let count=0;
 for(const e of card.character_book.entries){if(!/^Tier:/m.test(e.content)||!/^School:/m.test(e.content))continue;
  const title=e.comment.match(/Spell:\s*(.+)$/);if(!title)continue;count++;
  const row=cat.find(x=>x.key===c.spellKey(title[1]));assert(row,'Missing spell '+e.id);
  const first=card.character_book.entries.find(x=>x.content===e.content);assert.equal(row.src,String(first.id),'Missing dedicated source '+e.id);assert(row.effect,'Missing effect '+e.id);
  assert.equal(row.fan,/^Status: Fan-extension/m.test(e.content),'Fan status '+e.id);
  if(/School: Healing Branch \(Detoxification\)/.test(e.content))assert.equal(row.school,'Detoxification');
 }
 assert.equal(count,244);assert(!cat.some(x=>x.name.includes('|')||/fan-extension spells/i.test(x.school)));
});
test('Markdown school/rank spell lists and detailed sword techniques are usable references',()=>{
 const cat=c.spellCatalog('living'),tech=c.techCatalog('living');
 assert.equal(cat.find(x=>x.key==='waterball').school,'Water');
 assert(cat.find(x=>x.key==='waterball').effect);assert(cat.find(x=>x.key==='quagmire').kind==='melded');
 for(const name of ['Arm Chop','Longsword of Silence','Longsword of Light','Light Reversal','Flow','Deprivation Sword Kingdom','Four Legged Form','Hazy Cross','Teardrop Bullet'])assert(tech.some(x=>x.key===c.spellKey(name)),name);
 assert.equal(tech.find(x=>x.key==='longsword of light').step,3);assert.equal(tech.find(x=>x.key==='teardrop bullet').step,null);
 assert(!tech.some(x=>/measure:|proof:|, three mastered/i.test(x.name)));assert(tech.some(x=>x.fan));assert(tech.find(x=>x.key==='longsword of light').effect);
 assert.equal(c.spellKnown([],{},null,'living').size,0);
});
test('Living continuation command respects snapshot and active-swipe Internal States boundaries',()=>{
 const msg={id:'restore',role:'assistant',swipe_id:0,content:base(),metadata:{rpg_companion:{swipes:{0:{survival:{got:['Copied reward']},minds:[{name:'Tutor',feel:{p:'calm'}}]}}}}};
 msg.metadata.rpg_companion.sources={0:c.readingSource(msg.content)};
 const chat=[{id:'resume',role:'user',content:'MUSHOKU_TENSEI_START_CONTINUER\nResume\n'+base()},msg];c.companionMarkTurnPurposes(chat);
 assert.equal(msg._rpgcPurpose,'continue');assert(c.messageHud(msg));assert.equal(c.getSwipeData(msg),null);
 c.statesFill('living-resume',chat);assert(c.statesReading(msg).minds.length);msg.swipe_id=1;assert.equal(c.statesReading(msg),null);
 assert.equal(c.companionTurnPurpose('MUSHOKU_TENSEI_START_CONTINUER\nResume without a HUD'),'continue');
 assert.equal(c.companionTurnPurpose('MUSHOKU_TENSEI_START_HANDLER\nStart at Arc 1'),'story');
});
test('Sandbox and explicit divergence do not acquire a clock-selected personal arc',()=>{
 const st=c.emptyChatState();let w=c.worldMushoku('living',c.worldLines(c.parseHud(base())),st);
 assert.equal(w.saga.current,null);assert.equal(w.saga.next,null);assert.equal(w.saga.participation,'personal');
 w=c.worldMushoku('living',c.worldLines(c.parseHud(base().replace('Sandbox — Build a workshop','Arc 3 DIVERGENCE: The Road West'))),st);
 assert.equal(w.saga.current,3);assert.equal(w.saga.participation,'explicit');assert.equal(w.saga.partName,'The Road West');
 w=c.worldMushoku('living',c.worldLines(c.parseHud(base().replace('Sandbox — Build a workshop','Arc 23: Conclusion'))),st);assert.equal(w.saga.current,23);assert.equal(w.saga.next,null);assert.equal(w.saga.personalArc,'Arc 23: Conclusion');
});
test('Canonical summoning pacts and alternate Drain Syndrome output reach existing World rows',()=>{
 const text=base().replace('***','[SUMMON PACT: Lantern | RANK: Spirit]\n[SPIRIT: Watcher]\nCondition: Drain Syndrome (Year 3 of 10)\n***');
 const w=c.worldMushoku('living',c.worldLines(c.parseHud(text)),c.emptyChatState());
 assert.match(w.contracts,/Lantern/);assert.match(w.contracts,/Watcher/);assert.match(w.drain.stage,/Year 3 of 10/);
 assert.equal(c.worldMushoku('living',c.worldLines(c.parseHud(base())),c.emptyChatState()).contracts,null);
 assert.equal(c.worldMushoku('living',c.worldLines(c.parseHud(base())),c.emptyChatState()).drain,null);
});
test('Raw/Treated/Permanent wounds, conditions, curses, eyes and item blocks remain narrator-owned',()=>{
 for(const tag of ['Raw','Treated','Magic-Healed','Permanent']){
  const text=base().replace('***',`Injuries: Left hand — ${tag}\nCondition: Exhaustion (Severe)\nBlessing: Strength — Miko (Always-On)\n[DEMON EYE: Foresight — Right]\n***`);
  const h=c.parseHud(text),sys=c.hmsReadSystems(h);assert.equal(sys.wounds[0].tag,tag);assert(sys.conditions.length);
  assert.equal(c.hudToBlock(h),text.split('***')[0]+'***');assert.equal(c.worldMushoku('living',c.worldLines(h),c.emptyChatState()).marks.length,1);
 }
 const object=base().replace('***','Game Mode: Item Mode\nForm: Sentient staff\nBearer: None\nPowers: Stores one light spell\nBond: Unaware\n***');assert(c.hudToBlock(c.parseHud(object)).includes('Bearer: None'));
});
test('Multi-turn practice, learning, mastery, rescheduling and NPC absence preserve separate states',async()=>{
 const rt=runtime();seed(rt,true);rt.messages.length=0;let calls=0;rt.quiet(()=>calls++);
 async function turn(id,scene,report){rt.messages.push({id:'u'+id,role:'user',content:'Continue.'},{id,role:'assistant',swipe_id:0,content:base().replace('Courtyard',id==='b'?'Market':'Courtyard')+'\n'+scene});rt.response(report);await rt.ctx.runSeparateUpdate('test',id);}
 const agenda={what:'Workshop lesson',with:'Tutor',where:'Courtyard',when:'tomorrow morning',state:'open'};
 await turn('a','The lesson is agreed; you practice unsuccessfully.',{you:{study:[{spell:'Waterball',progress:25}]},agenda:[agenda],family:[{name:'Tutor',relation:'father',status:'alive',where:'Courtyard',known:'seen'}],learned:[{who:'Tutor',fact:'The student attempted Waterball',how:'saw',sure:'certain'}]});
 assert.equal(rt.ctx.spellKnown(rt.messages,{}).size,0);
 await turn('b','The lesson moves to evening. You cast Waterball cleanly for the first time. Tutor leaves for the market.',{you:{learned:['Waterball']},agenda:[{...agenda,when:'tomorrow evening',state:'moved'}],family:[{name:'Tutor',where:'Market',known:'seen'}]});
 assert.equal(rt.ctx.agendaRead(rt.messages,{}).items.length,1);assert(rt.ctx.spellKnown(rt.messages,{}).has('waterball'));assert(!rt.ctx.spellKnown(rt.messages,{}).get('waterball').mastered);
 await turn('c','You have explicitly mastered Waterball. The merchant does not know your training history.',{you:{mastered:['Waterball']},minds:[{name:'Merchant',feel:'calm'}]});
 assert(rt.ctx.spellKnown(rt.messages,{}).get('waterball').mastered);assert.equal(rt.ctx.famRead(rt.messages,{}).members.length,1);
 const fold=rt.ctx.simFold(rt.messages,rt.ctx.emptyChatState());assert(!fold.knows.has(fold.keyOf('Merchant')));
 assert.equal(rt.ctx.famRead(rt.messages,{}).members[0].where,'Market');
 await turn('d','Tutor returns to the courtyard.',{family:[{name:'Tutor',where:'Courtyard',known:'seen'}]});
 assert.equal(rt.ctx.famRead(rt.messages,{}).members.length,1);assert.equal(rt.ctx.famRead(rt.messages,{}).members[0].where,'Courtyard');
 const restart=runtime();restart.messages.push(...JSON.parse(JSON.stringify(rt.messages)));assert(restart.ctx.spellKnown(restart.messages,{}).get('waterball').mastered);assert.equal(restart.ctx.agendaRead(restart.messages,{}).items.length,1);
 assert.equal(calls,4);
});
test('Observed ownership, currency, organizations and quest resets survive sparse turns',async()=>{
 const rt=runtime();seed(rt,true);rt.messages.length=0;
 async function turn(id,report){rt.messages.push({id:'u'+id,role:'user',content:'Continue.'},{id,role:'assistant',swipe_id:0,content:base()});rt.response(report);await rt.ctx.runSeparateUpdate('test',id);}
 await turn('a',{gear:[{name:'Workshop key',state:'stowed',where:'Satchel'}],holdings:[{name:'Workshop',kind:'property',state:'owned',where:'Rikarisu'}],money:[{amount:5,currency:'copper',kind:'income',what:'Completed repair'}],factions:[{name:'Artisans guild',role:'member',standing:'friendly'}],quests:[{name:'Workshop commission',objective:'Repair the furnace',progress:100,reward:'Five copper'}]});
 await turn('b',{you:{mood:'calm'},quests:[{name:'Workshop commission',objective:'Stage 2: install the new bellows',progress:0,stage:'Stage 2',reset:true}]});
 assert(rt.ctx.gearRead(rt.messages,{}).items.some(x=>x.name==='Workshop key'),'gear');assert(rt.ctx.holdRead(rt.messages,{}).items.some(x=>x.name==='Workshop'),'holdings');assert.equal(rt.ctx.moneyRead(rt.messages,{}).list.length,1);
 assert(rt.ctx.factionRead(rt.messages,{}).items.some(x=>x.name==='Artisans guild'),'factions');assert.equal(rt.ctx.questDetailsLatest(rt.messages).length,1);
 const q=rt.ctx.questDetailsLatest(rt.messages)[0];assert.equal(q.progress,0);assert.match(q.objective,/bellows/);
});
(async()=>{let failed=0;for(const[n,fn]of tests){try{await fn();console.log('PASS '+n)}catch(e){failed++;console.error('FAIL '+n+': '+e.message)}}if(failed)process.exitCode=1})();
