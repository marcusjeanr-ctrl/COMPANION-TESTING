const assert=require('node:assert/strict');
const {runtime,hud,seed}=require('./test_panel_tracking.cjs');
const cases=[],test=(name,run)=>cases.push([name,run]);
const setup=()=>runtime(process.env.COMPANION_BELL_BASELINE);
const exact={what:'Spar with Cassian in the yard',with:'Cassian Veyrath',where:'Veyrath Hall courtyard',when:'09:00',kind:'promise',state:'open'};
const vague={...exact,where:'courtyard',when:'when the bell rings at nine',kind:'meeting'};
function msg(c,id,rows,{time='08:45',day=8,place=exact.where,body='',raw=false}={}){
 const content=hud(place,time).replace('Day 8','Day '+day)+'\n'+body;
 const data=raw?{agenda:structuredClone(rows)}:c.parseCompanion('<rpg_companion>'+JSON.stringify({agenda:rows})+'</rpg_companion>');
 return{id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:data},sources:{0:c.readingSource(content)}}}};
}
const read=(c,chat,state={})=>c.agendaRead(chat,state).items;
test('Exact screenshot: explicit 09:00 and bell-at-nine with full/short courtyard are one appointment',()=>{
 for(const reversed of [false,true]){
  const c=setup().ctx,rows=reversed?[vague,exact]:[exact,vague],chat=rows.map((r,i)=>msg(c,'m'+i,[r]));
  const key=read(c,chat.slice(0,1))[0].key,items=read(c,chat);
  assert.equal(items.length,1);assert.equal(items[0].key,key);assert.equal(items[0].where,exact.where);assert.equal(items[0].when,'09:00');assert.equal(items[0].state,'open');assert.equal(items[0].dueAt%1440,540);
 }
});
test('The same extraction packet and raw restored legacy duplicate rows fold without rewriting input',()=>{
 for(const raw of [false,true]){
  const c=setup().ctx,rows=[{...exact,key:exact.what.toLowerCase()},{...vague,key:vague.what.toLowerCase()}];
  const chat=JSON.parse(JSON.stringify([msg(c,'saved',rows,{raw})])),before=JSON.stringify(chat),items=read(c,chat);
  assert.equal(items.length,1);assert.equal(items[0].when,'09:00');assert.equal(items[0].where,exact.where);assert.equal(JSON.stringify(chat),before);
  const oldKey=exact.what.toLowerCase()+' :: cassian veyrath :: courtyard :: when the bell rings at nine';
  assert.equal(read(c,chat,{agenda:{edits:{[oldKey]:{state:'kept',after:'saved'}}}})[0].state,'kept');
 }
});
test('A future appointment can be agreed/refined indoors without already standing in its courtyard',()=>{
 for(const reversed of [false,true]){
  const c=setup().ctx,rows=reversed?[vague,exact]:[exact,vague];
  const chat=rows.map((row,i)=>msg(c,'indoor'+i,[row],{place:row.where==='courtyard'?'Veyrath Hall dining hall':'Other Town guest room'}));
  const items=read(c,chat);assert.equal(items.length,1);assert.equal(items[0].where,exact.where);assert.equal(items[0].when,'09:00');
 }
 const c=setup().ctx,chat=[msg(c,'east',[vague],{place:'East Hall dining hall'}),msg(c,'west',[exact],{place:'Veyrath Hall dining hall'})];
 assert.equal(read(c,chat).length,2,'A short courtyard in a different established venue is not the same destination');
});
test('Same-location control already merges the exact/vague pair without fabricating a vague-only due time',()=>{
 const c=setup().ctx,chat=[msg(c,'a',[{...vague,where:exact.where}]),msg(c,'b',[exact])];
 assert.equal(read(c,chat).length,1);assert.equal(read(c,chat.slice(0,1))[0].dueAt,null);
});
test('A vague appointment refined after nine stays on its established day rather than rolling tomorrow',()=>{
 const c=setup().ctx,chat=[msg(c,'a',[{...vague,where:exact.where}],{time:'08:45'}),msg(c,'b',[exact],{time:'09:05',body:'The same sparring appointment remains at 09:00 today.'})];
 const items=read(c,chat);assert.equal(items.length,1);assert.equal(items[0].scheduleDay,read(c,chat.slice(0,1))[0].scheduleDay);assert.equal(items[0].dueAt%1440,540);assert.equal(items[0].state,'open');
});
test('Known conflicting bell hours and before/after conditions are not an exact-time refinement',()=>{
 for(const when of ['when the bell rings at ten','before the nine o’clock bell','after the nine o’clock bell','around nine when the bell rings']){
  const c=setup().ctx,chat=[msg(c,'a',[exact]),msg(c,'b',[{...vague,where:exact.where,when}])];
  assert.equal(read(c,chat).length,2,when);
 }
});
test('Different full places, missing source place evidence, people and recurring days stay distinct',()=>{
 for(const options of [{place:'East Hall courtyard',where:'East Hall courtyard'},{place:'East Hall courtyard',where:'courtyard'},{with:'Rin Vale'},{day:9}]){
  const c=setup().ctx,chat=[msg(c,'a',[exact]),msg(c,'b',[{...vague,where:options.where||exact.where,...(options.with?{with:options.with}:{})}],options)];
  assert.equal(read(c,chat).length,2,JSON.stringify(options));
 }
 const c=setup().ctx,chat=[msg(c,'a',[{...vague,where:exact.where}]),msg(c,'b',[exact],{time:'09:05',body:'A second sparring appointment is scheduled for tomorrow.'})];assert.equal(read(c,chat).length,2);
 const late=[msg(c,'late',[{...vague,where:exact.where}],{time:'21:00'}),msg(c,'next',[exact],{time:'21:05',body:'The appointment is at 09:00.'})];
 assert.equal(read(c,late).length,2,'An unanchored late-night bell cannot pull a new future clock into the past');
 const nextBell=[msg(c,'old',[{...vague,where:exact.where}]),msg(c,'future',[exact],{time:'21:05',body:'The next bell for the appointment is at 09:00.'})];
 assert.equal(read(c,nextBell).length,2,'A next-bell future occurrence is not an overdue same-day refinement');
});
test('Reliable terminal state, history and manually set status survive a vague duplicate',()=>{
 const c=setup().ctx,chat=[msg(c,'a',[{...exact,state:'kept'}],{time:'09:00'}),msg(c,'b',[vague],{time:'09:00'})],items=read(c,chat);
 assert.equal(items.length,1);assert.equal(items[0].state,'kept');assert(items[0].history.some(h=>h.to==='kept'));
});
test('Partial Separate re-extraction preserves a completed outcome from duplicate packet observations',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;
 r.messages.push(msg(c,'done',[{...exact,state:'kept'},exact],{time:'09:15',body:'The same spar with Cassian in the yard finished at 09:00.'}));
 assert.equal(read(c,r.messages)[0].state,'kept');r.response({characters:[],agenda:[vague]});await c.runSeparateUpdate('test','done');
 const items=read(c,r.messages);assert.equal(items.length,1);assert.equal(items[0].state,'kept');assert.equal(items[0].where,exact.where);assert.equal(items[0].dueAt%1440,540);
});
test('Repeated Separate-mode automatic updates retain one original identity and confirmed precision',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;
 r.messages.push(msg(c,'agreed',[{...vague,where:exact.where}],{time:'08:30'}),{id:'reply',role:'assistant',swipe_id:0,content:hud(exact.where,'08:45')+'\nThe sparring appointment with Cassian is at 09:00 in Veyrath Hall courtyard.'});
 const original=read(c,r.messages.slice(0,1))[0].key,source=r.messages[1].content;let calls=0;r.quiet(()=>calls++);
 for(const rows of [[exact],[vague],[exact,vague],[vague]]){
  r.response({characters:[],agenda:rows});await c.runSeparateUpdate('test','reply');
  const panel=r.events.filter(e=>e.type==='state'&&e.hms?.agenda).at(-1).hms.agenda.items;
  assert.equal(panel.length,1);assert.equal(panel[0].key,original);assert.equal(panel[0].state,'open');assert.equal(panel[0].where,exact.where);assert.equal(panel[0].dueIn,15,JSON.stringify({rows,stored:c.getSwipeData(r.messages[1]).agenda}));
  assert.equal(r.messages[1].content,source);
 }
 assert.equal(calls,4,'Exactly the four existing mocked Separate updates, no added generation');
 const restored=JSON.parse(JSON.stringify(r.messages));assert.equal(read(c,restored).length,1);assert.equal(read(c,restored)[0].dueAt%1440,540);
});
test('Actual automatic generation-ended events keep the appointment stable across new replies',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;r.messages.push(msg(c,'agreed',[{...vague,where:exact.where}],{time:'08:30'}));
 const original=read(c,r.messages)[0].key,ended=r.run('rpgcGenEnded');let calls=0;r.quiet(()=>calls++);
 for(let i=0;i<3;i++){
  const id='automatic-'+i;r.messages.push({id,role:'assistant',swipe_id:0,content:hud(exact.where,'08:45')+'\nThe sparring appointment with Cassian remains at 09:00.'});
  r.response({characters:[],agenda:[i===0?exact:vague]});await ended({chatId:'test',messageId:id,generationType:'normal'});
  const items=read(c,r.messages);assert.equal(items.length,1);assert.equal(items[0].key,original);assert.equal(items[0].when,'09:00');assert.equal(items[0].where,exact.where);
 }
 assert.equal(calls,3,'One existing Separate call per automatic reply event');
});
test('Separate refresh never carries precision from an edited source or another swipe',async()=>{
 for(const mode of ['edit','swipe']){
  const r=setup(),c=r.ctx;seed(r);r.messages.length=0;r.messages.push(msg(c,'reply',[exact]));
  if(mode==='edit')r.messages[0].content+=' Changed source.';else r.messages[0].swipe_id=1;
  assert.equal(c.getSwipeData(r.messages[0]),null);r.response({characters:[],agenda:[vague]});await c.runSeparateUpdate('test','reply');
  assert.equal(c.getSwipeData(r.messages[0]).agenda[0].when,vague.when,mode);
  if(mode==='swipe')assert.equal(r.messages[0].metadata.rpg_companion.swipes[0].agenda[0].when,'09:00');
 }
});
test('A newly dated occurrence cannot inherit an undated completed outcome during Separate refresh',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;
 r.messages.push(msg(c,'reply',[{...exact,state:'kept'}],{body:'The earlier spar with Cassian in the yard finished early. A separate appointment is scheduled tomorrow.'}));
 r.response({characters:[],agenda:[{...exact,due:'Day 9, 09:00'}]});await c.runSeparateUpdate('test','reply');
 const stored=c.getSwipeData(r.messages[0]).agenda[0];assert.equal(stored.state,'open');assert.equal(stored.due,'Day 9, 09:00');
});
test('The same partial-refresh protection works for non-HMS cards without inventing calendar dates',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.run("settings.hmsMode='off';");r.messages.length=0;
 r.messages.push({id:'plain',role:'assistant',swipe_id:0,content:'The appointment with Nia is at 09:00 in the briefing room.'});
 const plain={...exact,what:'Review the supply contract',with:'Nia Vale',where:'briefing room'};
 for(const when of ['09:00','when the bell rings at nine','when the bell rings at nine']){
  r.response({characters:[],agenda:[{...plain,when}]});await c.runSeparateUpdate('test','plain');
  assert.equal(c.getSwipeData(r.messages[0]).agenda[0].when,'09:00');assert.equal(read(c,r.messages)[0].dueAt,null);
 }
});
test('An ignored malformed legacy row cannot block a valid Separate refresh',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;r.messages.push(msg(c,'legacy',[exact]));
 c.getSwipeData(r.messages[0]).agenda.unshift(null);r.response({characters:[],agenda:[{...vague,state:'kept'}]});
 const writes=r.writes.length;await c.runSeparateUpdate('test','legacy');assert.equal(r.writes.length,writes+1);
 const stored=c.getSwipeData(r.messages[0]).agenda[0];assert.equal(stored.state,'kept');assert.equal(stored.when,'09:00');
});
test('A partial refresh retains an established reschedule and the original appointment key',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;
 r.messages.push(msg(c,'original',[exact],{time:'08:30'}),msg(c,'moved',[{...exact,state:'moved',due:'Day 9, 09:00'}],{body:'The spar with Cassian in the yard is rescheduled to Day 9 at 09:00.'}));
 const original=read(c,r.messages)[0].key;r.response({characters:[],agenda:[vague]});await c.runSeparateUpdate('test','moved');
 const items=read(c,r.messages);assert.equal(items.length,1);assert.equal(items[0].key,original);assert.equal(items[0].state,'open');assert.equal(c.getSwipeData(r.messages[1]).agenda[0].moved,true);
});
if(process.argv.includes('--browser-fixture')){
 const c=setup().ctx;console.log(JSON.stringify(c.hmsPanelState('test',[msg(c,'a',[exact]),msg(c,'b',[vague])],{})));
}else(async()=>{let failed=0;for(const[name,run]of cases){try{await run();console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+': '+e.message)}}console.log(`${cases.length-failed}/${cases.length} exact bell-refinement groups passed`);if(failed)process.exitCode=1;})();
