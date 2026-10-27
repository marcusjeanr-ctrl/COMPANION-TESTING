// Synthetic accepted narrator reports exercise the real persistence/panel pipeline.
// They do not certify live model extraction or implement the card's rule engine.
const assert=require('node:assert/strict');
const {runtime,seed,hud}=require('./test_panel_tracking.cjs');
const tests=[],test=(name,fn)=>tests.push([name,fn]);
async function turn(r,id,content,report) {
 r.messages.push({id:'u-'+id,role:'user',content:'Continue the established scene.'},{id,role:'assistant',swipe_id:0,content});
 r.response({characters:[],...report});await r.ctx.runSeparateUpdate('test',id);
 return r.ctx.getSwipeData(r.messages.at(-1));
}
function fresh(){const r=runtime();seed(r);r.messages.length=0;return r;}
test('Casting, Demon Eye drain and rest change reserve without capacity or ability grants',async()=>{
 const r=fresh(),c=r.ctx;
 for(const [i,reserve,scene]of [[0,'Full','You have rested.'],[1,'Low','The active Demon Eye drains the reserve.'],[2,'Half','A short rest restores part of the reserve.']]) {
  await turn(r,'r'+i,hud().replace('Reserve: Full','Reserve: '+reserve).replace('***',`[DEMON EYE: Foresight (${i===1?'Active':'Sealed'})]\n***`)+'\n'+scene,{you:{rested:i===2}});
  const state=r.events.filter(x=>x.type==='state').at(-1);assert.equal(state.world.mana,'Vast');assert.equal(state.world.reserve,reserve);
  assert.match(state.world.eyes[0].text,i===1?/Active/:/Sealed/);
  assert.equal(c.spellKnown(r.messages,{}).size,0);
 }
});
test('Training, study and explicit new learning do not auto-promote a school or imply mastery',async()=>{
 const r=fresh(),c=r.ctx,quote='You perform Ember Veil cleanly for the first time.';
 await turn(r,'practice',hud()+'\nYou deliberately practice Ember Veil but it fails.',{you:{study:[{spell:'Ember Veil',progress:null,note:'Deliberate practice; failed attempt.'}]}});
 assert.equal(c.spellKnown(r.messages,{}).size,0);assert.equal(c.spellStudyActive(r.messages,{}).length,1);
 await turn(r,'success',hud()+'\n'+quote,{you:{learned:['Ember Veil'],abilities:[{name:'Ember Veil',owner:'you',historical:false,state:'known',evidence:quote}]}});
 const fold=c.spellStoryFold(r.messages);assert.equal(fold.learned.get('ember veil').newlyLearned,true);
 assert(c.spellKnown(r.messages,{}).has('ember veil'));assert(!c.spellKnown(r.messages,{}).get('ember veil').mastered);
 const world=r.events.filter(x=>x.type==='state').at(-1).world;assert.equal(world.magic[0].rank,'Intermediate');
});
test('Offered vs received/stored gear, completed rewards and cancelled objectives stay distinct',async()=>{
 const r=fresh(),c=r.ctx;
 const d=await turn(r,'offer',hud()+'\nA clerk offers an inspection toolkit, which you have not accepted.',{gear:[{name:'Inspection toolkit',state:'offered'}],you:{got:['Inspection toolkit (offered)']},objectives:[{text:'Deliver the toolkit',state:'cancelled'}]});
 assert.equal((d.gear||[]).length,0);assert.equal(d.survival.got.length,0);assert.equal(d.objectives[0].state,'abandoned');
 await turn(r,'paid',hud()+'\nThe inspection is completed. The clerk pays five copper and you accept the toolkit into storage.',{quests:[{name:'Inspection',objective:'Inspect the bridge',progress:100,reward:'Five copper'}],money:[{amount:5,currency:'copper',kind:'income',what:'Completed inspection'}],gear:[{name:'Inspection toolkit',state:'stowed',where:'Workshop'}]});
 const before=JSON.stringify(c.moneyRead(r.messages,{}));assert.equal(c.moneyRead(r.messages,{}).list.length,1);assert.equal(c.questDetailsLatest(r.messages)[0].progress,100);
 assert.equal(c.gearRead(r.messages,{}).items.find(x=>x.name==='Inspection toolkit').state,'stowed');
 await r.ctx.runSeparateUpdate('test','paid');assert.equal(JSON.stringify(c.moneyRead(r.messages,{})),before);
});
test('Travel and birthdays update current HUD without rewriting skill history or creating forecast events',async()=>{
 const r=fresh(),c=r.ctx,quote='You know Signal Weaving.';
 await turn(r,'old',hud()+'\n'+quote,{you:{abilities:[{name:'Signal Weaving',owner:'you',state:'known',historical:false,evidence:quote}]}});
 const later=hud().replace('K417,','K418,').replace('Age: 13','Age: 14').replace('Central Continent → Asura Kingdom, Fittoa Region → House King Estate, Training Yard','Demon Continent → New Port → Guest House')+'\nCanon reference: a possible future event.';
 await turn(r,'travel',later,{plot:{canonEvents:[]}});
 const w=r.events.filter(x=>x.type==='state').at(-1).world;assert.equal(w.year,418);assert.equal(w.age,14);
 assert(c.spellKnown(r.messages,{}).has('signal weaving'));assert.equal(c.mtEventLedger(r.messages).length,0);
 assert.equal(c.spellStoryFold(r.messages).abilityEvidence.get('signal weaving').msgId,'old');
 const prior=JSON.stringify(c.getSwipeData(r.messages.find(m=>m.id==='old')));
 await turn(r,'divergence',later,{plot:{canonEvents:[{name:'Bridge opening',state:'prevented',detail:'The approach flooded before the opening',arc:2}]}});
 assert.equal(c.mtEventLedger(r.messages)[0].state,'prevented');assert.equal(JSON.stringify(c.getSwipeData(r.messages.find(m=>m.id==='old'))),prior);
});
test('Combat damage and temporary conditions reach the HUD panel without invented acquisitions',async()=>{
 const r=fresh(),c=r.ctx;
 const text=hud().replace('Equipment: Training sword, signet ring','Equipment: Training sword (chipped), signet ring').replace('***','Injuries: Bruised left arm\nCondition: Winded\n***');
 await turn(r,'combat',text+'\nA blow bruises your arm and chips the training blade.',{you:{got:[]}});
 const systems=c.hmsReadSystems(c.parseHud(r.messages.at(-1).content));assert(systems.wounds.some(x=>/Bruised left arm/i.test(x.name)));
 assert(systems.conditions.some(x=>/Winded/i.test(x.text)));assert(c.hudToBlock(c.parseHud(text)).includes('Training sword (chipped)'));
 assert.equal(c.getSwipeData(r.messages.at(-1)).survival.got.length,0);
});
test('Hidden power and narrator-private facts do not spread knowledge between unrelated NPCs',async()=>{
 const r=fresh(),c=r.ctx;
 await turn(r,'private',hud().replace('Mana Capacity: Vast','Mana Capacity: Shown: Small | True: Vast')+'\nOnly Pilot witnesses the opened seal.',{learned:[{who:'Pilot',fact:'The seal conceals a larger reserve',how:'saw',sure:'certain'}],minds:[{name:'Pilot',feel:'surprise'},{name:'Merchant',feel:'joy'}]});
 const fold=c.simFold(r.messages,c.emptyChatState());assert(fold.knows.has(fold.keyOf('Pilot')));assert(!fold.knows.has(fold.keyOf('Merchant')));
 assert.equal(fold.knows.get(fold.keyOf('Pilot')).facts.length,1);
});
test('Quest deadlines and related appointments change only from their own accepted reports',async()=>{
 const r=fresh(),c=r.ctx,quest={name:'Bridge inspection',objective:'Inspect the bridge',progress:20,deadline:'Day 9'},event={what:'Bridge inspection meeting',with:'Inspector',where:'North Bridge',when:'Day 9, 08:00',kind:'meeting',state:'open'};
 await turn(r,'set',hud(),{quests:[quest],agenda:[event]});
 const key=c.agendaRead(r.messages,{}).items[0].key;
 await turn(r,'move',hud()+'\nThe inspector moves the appointment to Day 10, 08:00 and extends the inspection deadline.',{quests:[{...quest,deadline:'Day 10'}],agenda:[{...event,when:'Day 10, 08:00',state:'moved'}]});
 assert.equal(c.agendaRead(r.messages,{}).items.length,1);assert.equal(c.agendaRead(r.messages,{}).items[0].key,key);assert.equal(c.questDetailsLatest(r.messages)[0].deadline,'Day 10');
 await turn(r,'intent',hud()+'\nYou might ask for another extension, but have not agreed one.',{quests:[],agenda:[],objectives:[{text:'Proposed extension',accepted:false}]});
 assert.equal(c.questDetailsLatest(r.messages)[0].deadline,'Day 10');assert.match(c.agendaRead(r.messages,{}).items[0].when,/Day 10/);
});
test('Source edits invalidate stored event/ability projections and JSON-restored histories stay idempotent',async()=>{
 const r=fresh(),c=r.ctx,quote='You know Precision Joinery.';
 await turn(r,'acquired',hud()+'\n'+quote,{you:{abilities:[{name:'Precision Joinery',owner:'you',state:'known',historical:false,evidence:quote}]},agenda:[{what:'Workshop appointment',with:'Tutor',where:'Workshop',when:'tomorrow',kind:'meeting',state:'open'}]});
 const restart=runtime();restart.messages.push(...JSON.parse(JSON.stringify(r.messages)));
 assert.equal(restart.ctx.spellKnown(restart.messages,{}).size,1);assert.equal(restart.ctx.agendaRead(restart.messages,{}).items.length,1);
 restart.messages.at(-1).content+=' An edited branch.';assert.equal(restart.ctx.spellKnown(restart.messages,{}).size,0);assert.equal(restart.ctx.agendaRead(restart.messages,{}).items.length,0);
});
(async()=>{let failures=0;for(const[name,fn]of tests){try{await fn();console.log('PASS '+name)}catch(e){failures++;console.error('FAIL '+name+': '+e.message)}}if(failures)process.exitCode=1})();
