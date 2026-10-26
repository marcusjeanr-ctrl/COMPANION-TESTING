const assert=require('node:assert/strict');
const fs=require('node:fs');
const {runtime,hud}=require('./test_panel_tracking.cjs');
const tests=[];const test=(name,fn)=>tests.push([name,fn]);
function make(rt,id,report,content=hud()) {
    const c=rt.ctx,d=c.parseCompanion(`<rpg_companion>${JSON.stringify(report)}</rpg_companion>`);
    return {id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:{...d,survival:d.you}},sources:{0:c.readingSource(content)}}}};
}

test('Agenda conditions and explicit moves retain a stable key without merging separate occurrences',()=>{
    const rt=runtime(),c=rt.ctx;
    const base={with:'Rin Vale',where:'North Hall',when:'08:30',kind:'meeting',state:'open'};
    const titles=['Mana calibration in the hall after breakfast','Mana calibration in the hall, under sustained draw','Mana calibration in the hall — walk over with reserves full'];
    const chat=titles.map((what,i)=>make(rt,'a'+i,{agenda:[{...base,what}]}));
    const firstKey=c.agendaRead(chat.slice(0,1),{}).items[0].key;
    let items=c.agendaRead(chat,{}).items;
    assert.equal(items.length,1,'Appended conditions created a duplicate');
    assert.equal(items[0].key,firstKey);assert.equal(items[0].what,titles.at(-1),'Description stayed stale');
    chat.push(make(rt,'moved',{agenda:[{...base,what:titles[0],with:'Tess Vale',where:'West Hall',when:'09:00',state:'moved'}]}));
    items=c.agendaRead(chat,{}).items;
    assert.equal(items.length,1,'Explicit move lost appointment identity');
    assert.equal(items[0].key,firstKey);assert.equal(items[0].with,'Tess Vale');
    assert.equal(c.agendaSame('Inspect bridge — north supports','Inspect bridge — south supports'),false,'Essential task suffixes were discarded');
    const unrelated=make(rt,'separate',{agenda:[{...base,what:titles[0],with:'Other tutor'},{...base,what:titles[0],where:'Another Hall'},{...base,what:titles[0],when:'11:00'}]});
    assert.equal(c.agendaRead([...chat,unrelated],{}).items.length,4,'Distinct contexts collapsed');
    const recurrence=[make(rt,'done',{agenda:[{...base,what:'Daily calibration',when:'Day 8, 08:30',state:'kept'}]}),make(rt,'tomorrow',{agenda:[{...base,what:'Daily calibration',when:'Day 9, 08:30'}]})];
    items=c.agendaRead(recurrence,{}).items;assert.equal(items.length,2);assert.equal(items[0].state,'kept');
});

test('Quest renames preserve keys, rewards and legitimate progress/stage resets',()=>{
    const rt=runtime(),c=rt.ctx;
    const q={name:'Bridge restoration',objective:'Repair the north bridge',where:'Old Keep',progress:30,reward:'Travel permit'};
    const chat=[make(rt,'q1',{quests:[q]}),make(rt,'q2',{quests:[{...q,name:'Northern repairs',objective:'Fix north bridge',progress:100,reward:null}]}),make(rt,'q3',{quests:[{...q,name:'Northern repairs',objective:'Inspect the repaired supports',progress:0,reward:null}]})];
    const before=JSON.stringify(chat);const rows=c.questDetailsLatest(chat);
    assert.equal(rows.length,1);assert.equal(rows[0].key,c.lockKey(q.name),'Renaming changed the stable quest key');
    assert.equal(rows[0].progress,0,'A real next-stage reset was clamped upward');
    assert.equal(rows[0].reward,q.reward);assert(rows[0].questAliases.includes(q.name));
    assert.equal(JSON.stringify(chat),before,'Reconciliation rewrote historical stages');
    assert.equal(c.questUnique([{...q,cls:'done'},{...q,name:'Northern repairs',objective:'Fix north bridge',cls:'active'}]).length,2,'Completed stage/history merged into an active occurrence');
    const different=[
        {name:'The Roa Bargain',objective:'Make a cut Aurelius cannot read beforehand'},
        {name:'The Roa Visit',objective:"Secure Aurelius's permission and letter for the trip to Roa"},
        {name:'The Roa Journey',objective:"Secure Aurelius's permission and prepare for the road to Roa"},
        {name:'Friendship with the Boy Genius',objective:'Travel to Roa and meet Rudeus Greyrat'}
    ].map(x=>({...x,where:'House King Estate'}));
    assert.equal(c.questDetailsLatest([make(rt,'roa',{quests:different})]).length,4,'Shared destination erased distinct objectives');
});

test('Off-scene family survives, and a relationship report cannot override a reliable location',()=>{
    const rt=runtime(),c=rt.ctx;
    const family={name:'Rin Vale',relation:'mother',status:'alive',where:'North Hall',known:'seen'};
    const relation={name:'Rin Vale',bond:'mother',standing:'Friendly'};
    const chat=[make(rt,'present',{characters:[{name:'Rin Vale'}],family:[family],relations:[relation]}),make(rt,'left',{characters:[{name:'Tess Vale'}],family:[{...family,where:'Stables',known:'told'}],relations:[relation]})];
    let members=c.hmsFamilyPanel(chat,{}).members;
    assert.equal(members.length,1);assert.equal(members[0].where,'Stables','Off-scene relative was moved back into the active room');
    assert.equal(members[0].present,false);assert.equal(members[0].known,'told');
    assert.equal(c.hmsRelationsPanel(chat,{}).people.find(p=>p.key==='rin vale').present,false,'Off-scene relationship card claimed the NPC was present');
    chat.push(make(rt,'absent',{characters:[],family:[],relations:[]}));
    members=c.hmsFamilyPanel(chat,{}).members;assert.equal(members[0].status,'alive');assert.equal(members[0].where,'Stables');
    chat.push(make(rt,'returned',{characters:[{name:'Rin Vale'}],family:[{...family,name:'RIN VALE',where:'Library',known:'seen'}],relations:[relation]}));
    members=c.hmsFamilyPanel(chat,{}).members;assert.equal(members.length,1);assert.equal(members[0].where,'Library');assert(members[0].present);
});

test('Source-bound continuation reports render and retain passive facts without replaying transactions',async()=>{
    const rt=runtime(),c=rt.ctx;
    const reply=make(rt,'resumed',{characters:[{name:'Rin Vale'}],minds:[{name:'Rin Vale',feel:'pride'}],family:[{name:'Rin Vale',relation:'mother',where:'Library',known:'seen',status:'alive'}],quests:[{name:'Restored objective',objective:'Repair the north bridge',where:'Old Keep',progress:30}],you:{got:['Do not replay this receipt'],xp:500},money:[{amount:50,currency:'gold',kind:'income',what:'Do not replay'}]});
    // Export representation, not the live metadata field.
    reply.extra={spindle_metadata:reply.metadata};delete reply.metadata;
    rt.messages.push({id:'restore',role:'user',content:'Mushoku_Continue_Handler\n'+hud()},reply);
    c.companionMarkTurnPurposes(rt.messages);
    assert.equal(c.getSwipeData(reply),null,'Continuation replayed transaction metadata');
    const report=c.getSwipeData(reply,true);assert(report?.minds?.length,'Source-bound continuation snapshot unavailable');
    const sp=await c.getStatesFor('test',reply.id);assert(sp,'Continuation Internal States were hidden');
    assert(c.statesPanelHtml(sp,c.parseHud(reply.content),reply.id).includes('Internal states'));
    assert.equal(c.famRead(rt.messages,{}).members.length,1);
    assert.equal(c.questDetailsLatest(rt.messages).length,1);
    assert.equal(c.youReadings(rt.messages).length,0,'XP/inventory snapshot treated as a new story transaction');
    const diagnostic=await c.hmsDiagnostics('test',false);
    assert.equal(diagnostic.chat.trackingMetadata.selected,true,'Diagnostics hid the available continuation report');
    assert.equal(diagnostic.chat.trackingMetadata.transactionSelected,false);
    assert.equal(diagnostic.chat.trackingMetadata.continuationSnapshot,true);
    const expectedSource=reply.extra.spindle_metadata.rpg_companion.sources[0];
    delete reply.extra.spindle_metadata.rpg_companion.sources[0];assert.equal(c.getSwipeData(reply,true),null,'Unsigned snapshot trusted');
    reply.extra.spindle_metadata.rpg_companion.sources[0]=expectedSource;
    reply.swipe_id=1;assert.equal(c.getSwipeData(reply,true),null,'Different swipe reused old snapshot');reply.swipe_id=0;
    reply.content+=' Edited';assert.equal(c.getSwipeData(reply,true),null,'Edited snapshot reused stale report');
    assert.equal(c.statesReading(reply),null,'Display bypassed the stale snapshot source check');
    assert.equal(rt.writes.length,0);
});

test('New continuation report uses the existing render cache without model calls or storage writes',async()=>{
    const rt=runtime(),c=rt.ctx;let calls=0,loads=0;rt.quiet(()=>{calls++;});
    const getMessages=c.spindle.chat.getMessages;c.spindle.chat.getMessages=async(...args)=>{loads++;return getMessages(...args);};
    const body=hud()+'\nThe public scene continues.';
    const raw='<rpg_companion>'+JSON.stringify({characters:[{name:'Rin Vale',thoughts:{content:'PRIVATE_TEST_REFLECTION'}}],minds:[{name:'Rin Vale',feel:'pride'}]})+'</rpg_companion>';
    const reply={id:'inline-resume',role:'assistant',swipe_id:0,content:body+'\n'+raw};
    rt.messages.push({id:'restore',role:'user',content:'Mushoku_Continue_Handler\n'+hud()},reply);
    c.companionMarkTurnPurposes(rt.messages);
    const before=JSON.stringify(rt.messages);
    const processor=rt.processors.find(p=>p.priority===50).handler;
    const rendered=await processor({origin:'render',isUser:false,content:reply.content,chatId:'test',messageId:reply.id});
    assert(rendered?.content.includes('Internal states'),'Newly emitted continuation block was not rendered');
    assert(!rendered.content.includes('<rpg_companion>'),'Raw private report escaped into narrative');
    assert(rendered.content.includes('PRIVATE_TEST_REFLECTION'),'Thought disappeared from its private panel');
    assert(!rendered.content.split('<div class="rs not-island-prose"')[0].includes('PRIVATE_TEST_REFLECTION'),'Private thought entered the RP prose');
    await c.getStatesFor('test',reply.id);assert.equal(loads,1,'Cached render loaded history again');
    assert.equal(calls,0);assert.equal(rt.writes.length,0);assert.equal(JSON.stringify(rt.messages),before);
    reply.content=body;c.statesDrop('test');assert.equal(await c.getStatesFor('test',reply.id),null,'Missing data was invented');
    reply.content=body+'\n```text\n'+raw+'\n```';c.statesDrop('test');
    assert.equal(await c.getStatesFor('test',reply.id),null,'Quoted historical block was treated as a fresh report');
});

if(process.argv[2])test('Supplied export: duplicate appointment, off-scene location and first continuation panel',async()=>{
    const bytes=fs.readFileSync(process.argv[2]);const rt=runtime(),c=rt.ctx;
    const exported=JSON.parse(bytes);rt.messages.push(...exported.messages.map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')})));
    c.companionMarkTurnPurposes(rt.messages);
    const before=JSON.stringify(rt.messages);
    assert.equal(c.agendaRead(rt.messages,{}).items.filter(x=>/mana measurement in the magic hall/i.test(x.what)).length,1);
    const left=c.hmsFamilyPanel(rt.messages.slice(0,9),{}).members.find(x=>x.name==='Cassian King');
    assert(left?.where?.includes('stables'));assert.equal(left.present,false);
    assert.equal(c.hmsRelationsPanel(rt.messages.slice(0,9),{}).people.find(p=>p.name==='Cassian King').present,false);
    assert.equal(c.hmsFamilyPanel(rt.messages,{}).members.length,5);
    const restored=rt.messages.find(m=>m.role==='assistant'&&m._rpgcPurpose==='continue');
    assert(await c.getStatesFor('actual-export',restored.id));
    const rendered=await rt.processors.find(p=>p.priority===50).handler({origin:'render',isUser:false,content:restored.content,chatId:'actual-export',messageId:restored.id});
    assert(rendered?.content.includes('Internal states'),'Actual continuation renderer omitted the stored panel');
    assert.equal(c.questDetailsLatest(rt.messages).length,5,'Source-bound continuation quest was lost');
    assert.equal(JSON.stringify(rt.messages),before);assert(bytes.equals(fs.readFileSync(process.argv[2])));
});
(async()=>{let failed=0;for(const[name,fn]of tests){try{await fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}}console.log(`${tests.length-failed}/${tests.length} tracking/continuation groups passed`);if(failed)process.exitCode=1;})();
