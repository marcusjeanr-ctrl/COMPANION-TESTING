const assert=require('node:assert/strict');
const fs=require('node:fs');
const {runtime,seed,hud,reading}=require('./test_panel_tracking.cjs');
const tests=[],test=(name,fn)=>tests.push([name,fn]);
const baseline=process.env.COMPANION_ADDITIONAL_BASELINE;
const bond='Trusted friend and workshop collaborator who knows the northern roads, without any romantic relationship.';
const note='Standing beside the workshop window, watching the sealed instrument case without touching or opening it.';
function reply(r,id,data,content=hud()) {return {id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:data},sources:{0:r.ctx.readingSource(content)}}}};}
test('Automatic bonds and position notes preserve useful clauses and visibly bound oversized reports',async()=>{
 const r=runtime(baseline),c=r.ctx;
 const data=c.parseCompanion('<rpg_companion>'+JSON.stringify({relations:[{name:'Rin Vale',bond}],pos:[{name:'Rin Vale',x:1,y:1,side:'ally',note}]})+'</rpg_companion>');
 assert.equal(data.relations[0].bond,bond,'Stored relationship bond was cut');assert.equal(data.pos[0].note,note,'Stored position note was cut');
 for(const value of [c.relNormalize([{name:'Rin Vale',bond:'meaningful words '.repeat(30)}])[0].bond,c.posNormalize([{name:'Rin Vale',x:1,y:1,note:'meaningful words '.repeat(30)}],null)[0].note]) {
  assert(value.length<=240);assert(value.endsWith('…'),'An intentional storage bound must be visible');assert(/words…$|meaningful…$/.test(value));
 }
 seed(r);let calls=0;r.quiet(()=>{calls++});r.response({relations:[{name:'Rin Vale',bond}],pos:[{name:'Rin Vale',x:1,y:1,side:'ally',note}]});
 await c.runSeparateUpdate('test');const saved=c.getSwipeData(r.messages.at(-1));
 assert.equal(saved.relations[0].bond,bond);assert.equal(saved.pos[0].note,note);assert.equal(calls,1);
});
test('Inference/evidence is not automatically certain; witnessed and reported provenance remain distinct',()=>{
 const r=runtime(baseline),c=r.ctx;
 for(const how of ['evidence','deduced','clue']) {
  for(const sure of [undefined,'certain'])assert.notEqual(c.simLearnedNormalize([{who:'Rin',fact:'Someone is sorting papers out of view',how,sure}])[0].sure,'certain',how+' became certain');
 }
 const data=c.simLearnedNormalize([
  {who:'Rin',fact:'The seal is blue',how:'saw',sure:'certain'},
  {who:'Rin',fact:'The clerk reports a blue seal',how:'told',from:'Tess',sure:'certain'},
  {who:'Rin',fact:'A guess',how:'inferred',sure:'certain'},
  {who:'Rin',fact:'A rumor',how:'gossip',sure:'certain'},
  {who:'Rin',fact:'An incorrect deduction',how:'evidence',sure:'wrong'},
  {who:'Rin',fact:'Uncertain evidence',how:'evidence',sure:'unsure'}]);
 assert.equal(data[0].how,'saw');assert.equal(data[0].sure,'certain');assert.equal(data[1].how,'told');assert.equal(data[1].from,'Tess');assert.equal(data[1].sure,'certain');
 assert.equal(data[2].sure,'unsure');assert.equal(data[3].sure,'partly');assert.equal(data[4].sure,'wrong');assert.equal(data[5].sure,'unsure');
 const knows=new Map(),event={clock:0,msg:{id:'first'}};
 c.simLearn(knows,{who:'Rin',fact:'The seal is blue',how:'evidence',sure:'certain'},0,event,x=>x);
 assert.equal(knows.get('Rin').facts[0].sure,'partly');
 c.simLearn(knows,{who:'Rin',fact:'The seal is blue',how:'told',from:'Tess',sure:'certain'},1,{clock:1,msg:{id:'confirmation'}},x=>x);
 assert.equal(knows.get('Rin').facts.length,1);assert.equal(knows.get('Rin').facts[0].how,'told');assert.equal(knows.get('Rin').facts[0].from,'Tess');assert.equal(knows.get('Rin').facts[0].sure,'certain');
});
test('Legacy evidence reports use the same certainty guard in folds and attached HTML without mutation',()=>{
 const r=runtime(baseline),c=r.ctx,data={learned:[{who:'Rin Vale',fact:'Someone may be sorting papers out of view',how:'evidence',sure:'certain'}]};
 const m=reply(r,'legacy',data),before=JSON.stringify(m);
 const fold=c.simFold([m],c.emptyChatState());assert.notEqual([...fold.knows.values()][0].facts[0].sure,'certain');
 const html=c.simStatesHtml(data,()=> '').scene;assert(!html.includes('certain'),'Attached HTML bypassed knowledge guard');assert(html.includes('partly')||html.includes('unsure'));
 assert.equal(JSON.stringify(m),before);
 const legacyText='An established observation '.repeat(12)+'END_OF_LEGACY_FACT';
 assert(c.simStatesHtml({learned:[{who:'Rin Vale',fact:legacyText,how:'evidence',sure:'certain'}]},()=> '').scene.includes('END_OF_LEGACY_FACT'),'Certainty rendering truncated legacy text');
});
test('Sparse new transaction preserves earlier records and commits no invented transactions',async()=>{
 const r=runtime(baseline),c=r.ctx;seed(r);await c.runSeparateUpdate('test');
 const prefix=r.messages.slice(),oldMoney=JSON.stringify(c.moneyRead(prefix,{}).totals),oldQuest=JSON.stringify(c.questDetailsLatest(prefix)),oldAgenda=c.agendaRead(prefix,{}).items.map(x=>[x.key,x.state]);
 const m={id:'sparse-latest',role:'assistant',swipe_id:0,content:hud('Training Yard','08:45')};r.messages.push({id:'next-user',role:'user',content:'I look around.'},m);
 let modelCalls=0;r.quiet(()=>{modelCalls++});r.run("settings.catchUp=false;settings.generationMode='together'");
 await c.hmsHandleReply('test',r.messages,m,'normal');assert(c.getSwipeData(m),'HUD transaction did not commit');
 assert.equal(c.getSwipeData(m).survival,null);assert.equal(c.getSwipeData(m).relations,null);assert.equal(modelCalls,0);
 assert.equal(JSON.stringify(c.moneyRead(r.messages,{}).totals),oldMoney);assert.equal(JSON.stringify(c.questDetailsLatest(r.messages)),oldQuest);
 assert.deepEqual(c.agendaRead(r.messages,{}).items.map(x=>[x.key,x.state]),oldAgenda);
 assert.equal(c.famRead(r.messages,{}).members.length,c.famRead(prefix,{}).members.length);assert.equal(c.simFold(r.messages,c.emptyChatState()).minds.size,c.simFold(prefix,c.emptyChatState()).minds.size);
 assert((await c.collectCommitted('test',r.messages)).data.characters?.length,'Sparse character fields erased previous committed data');
});
if(process.argv[2])test('Actual 08:45 sparse report preserves prior identities, Agenda, family and knowledge',async()=>{
 const bytes=fs.readFileSync(process.argv[2]),data=JSON.parse(bytes),r=runtime(baseline),c=r.ctx;
 const chat=data.messages.map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')}));c.companionMarkTurnPurposes(chat);const before=JSON.stringify(chat),last=chat.at(-1),d=c.getSwipeData(last);
 assert(d&&d.infoBox&&d.hudGuard);assert.equal(d.relations,null);assert.equal(d.survival,null);assert.equal(d.learned,null);
 const prefix=chat.slice(0,-1);assert.deepEqual(c.agendaRead(chat,{}).items.map(x=>[x.key,x.state]),c.agendaRead(prefix,{}).items.map(x=>[x.key,x.state]));
 assert.equal(c.famRead(chat,{}).members.length,c.famRead(prefix,{}).members.length);assert(c.famRead(chat,{}).members.length>0);
 const fold=c.simFold(chat,c.emptyChatState()),previous=c.simFold(prefix,c.emptyChatState());assert.equal(fold.minds.size,previous.minds.size);assert.equal(fold.knows.size,previous.knows.size);
 const indirect=[...fold.knows.values()].flatMap(x=>x.facts).filter(x=>x.how==='evidence');assert(indirect.length>0);assert(indirect.every(x=>x.sure!=='certain'));
 assert.equal(JSON.stringify(chat),before);assert(bytes.equals(fs.readFileSync(process.argv[2])));
});
(async()=>{let failed=0;for(const[name,run]of tests){try{await run();console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+': '+e.message)}}console.log(`${tests.length-failed}/${tests.length} additional tracking groups passed`);if(failed)process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
