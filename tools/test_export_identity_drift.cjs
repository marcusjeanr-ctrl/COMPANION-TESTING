const assert=require('node:assert/strict');
const {runtime,hud,seed}=require('./test_panel_tracking.cjs');
const tests=[],test=(name,fn)=>tests.push([name,fn]);
const setup=()=>runtime(process.env.COMPANION_IDENTITY_BASELINE);
const appointment={what:'Spar with Cassian in the yard',with:'Cassian Veyrath',where:'the courtyard',when:'when the bell rings at nine',kind:'event',state:'open'};
const assignment={name:'Prove Yourself Against Cassian',objective:'Defeat Cassian or force him to acknowledge Marcus as an equal',giver:'Aurelius Veyrath',where:'Veyrath Hall courtyard',deadline:'when the bell rings at nine',reward:"A meeting with Paul Greyrat's son",category:'personal',state:'active',progress:20};
const variant={...assignment,name:'Meeting the Greyrat prodigy',objective:'Defeat or match Cassian in the yard',deadline:null,reward:"An arranged meeting with Paul Greyrat's son",progress:null};
const final={...variant,name:"The Father's Condition",objective:'Win or draw the spar against Cassian',where:'Veyrath Hall Courtyard',reward:"Meeting with Paul Greyrat's son",progress:40};
function msg(c,id,agenda=[],quests=[],{time='08:30',day=8,place='Veyrath Hall',body='The agreed challenge remains pending.'}={}) {
 const content=hud(place,time).replace('Day 8','Day '+day)+'\n'+body;
 const data=c.parseCompanion('<rpg_companion>'+JSON.stringify({agenda,quests})+'</rpg_companion>');
 return {id,role:'assistant',swipe_id:0,content,extra:{spindle_metadata:{rpg_companion:{swipes:{0:data},sources:{0:c.readingSource(content)}}}}};
}
function history(c){return [msg(c,'a',[appointment]),msg(c,'b',[{...appointment,where:'courtyard'}],[assignment],{time:'08:40'}),msg(c,'c',[{...appointment,where:'Veyrath Hall courtyard',when:'the bell rings at nine',kind:'meeting',state:'in_progress'}],[variant],{time:'08:45',place:'Veyrath Hall Courtyard'}),msg(c,'d',[{...appointment,where:'Veyrath Hall courtyard',when:'Morning',kind:'promise',state:'in_progress'}],[final],{time:'08:50',place:'Veyrath Hall Courtyard'})];}
test('Exact exported progression retains one original Agenda and one original Quest identity',()=>{
 const c=setup().ctx,chat=history(c),before=JSON.stringify(chat),first=c.agendaRead(chat.slice(0,1),{}).items[0].key;
 for(let n=1;n<=chat.length;n++){
  const items=c.agendaRead(chat.slice(0,n),{}).items;assert.equal(items.length,1,'Agenda prefix '+n);assert.equal(items[0].key,first);
  if(n>1)assert.equal(c.questDetailsLatest(chat.slice(0,n)).length,1,'Quest prefix '+n);
 }
 const items=c.agendaRead(chat,{}).items,q=c.questDetailsLatest(chat)[0];
 assert.equal(c.agendaTimeKey(items[0].when),c.agendaTimeKey(appointment.when));assert.equal(items[0].dueAt,null);assert.equal(items[0].state,'in_progress');assert.equal(items[0].where,'Veyrath Hall courtyard');
 assert.equal(q.key,assignment.name.toLowerCase());assert.equal(q.progress,40);assert.equal(q.objective,assignment.objective);assert.equal(q.deadline,assignment.deadline);
 assert(q.questAliases.includes(variant.name));assert(q.identityHistory.some(x=>x.objective===assignment.objective));
 assert.equal(JSON.stringify(chat),before);
});
test('Bell aliases, leading place articles and broad dayparts do not fabricate exact times',()=>{
 for(const when of ['the bell rings at nine','when bell rings at nine','Morning','this morning']){
  const c=setup().ctx,chat=[msg(c,'a',[appointment]),msg(c,'b',[{...appointment,where:'courtyard',when}])];
  const items=c.agendaRead(chat,{}).items;assert.equal(items.length,1,when);assert.equal(items[0].dueAt,null);
 }
});
test('Different bell hours, periods, dates, venues and genuine extra occurrences stay distinct',()=>{
 for(const row of [{when:'the bell rings at ten'},{when:'afternoon'},{when:'early morning'},{when:'after the bell rings at nine'},{with:'Other Fighter'},{where:'East Hall courtyard'}]){
  const c=setup().ctx,items=c.agendaRead([msg(c,'a',[appointment]),msg(c,'b',[{...appointment,...row}])],{}).items;assert.equal(items.length,2,JSON.stringify(row));
 }
 for(const options of [{day:9},{body:'Another spar session with Cassian in the yard is arranged.'}]){
  const c=setup().ctx;assert.equal(c.agendaRead([msg(c,'a',[appointment]),msg(c,'b',[appointment],[],options)],{}).items.length,2);
 }
});
test('Equivalent combat assignments require the same target, giver, place and distinctive reward',()=>{
 const c=setup().ctx;
 for(const changes of [{giver:'Other Teacher'},{where:'East Hall courtyard'},{reward:'A copper coin'},{reward:null},{objective:'Defeat Arden or draw the spar'},{objective:'Kill Cassian'},{objective:'Win or draw the spar against Cassian without magic'},{objective:'Win the second spar against Cassian'},{objective:'Win or draw the spar against Cassian and escort the courier'}]){
  assert.equal(c.questDetailsLatest([msg(c,'a',[],[assignment]),msg(c,'b',[],[{...final,...changes}])]).length,2,JSON.stringify(changes));
 }
 const ended={...assignment,state:'completed'};
 assert.equal(c.questDetailsLatest([msg(c,'a',[],[ended]),msg(c,'b',[],[final])]).length,2,'A finished challenge is not a new active assignment');
 for(const body of ['No new quest is assigned.','If you win, a new quest might be assigned.'])
  assert.equal(c.questDetailsLatest([msg(c,'a',[],[assignment]),msg(c,'b',[],[final],{body})]).length,1,'Non-asserted new assignments are not new occurrences');
 const separate=msg(c,'b',[],[final],{body:'A second quest is assigned: win the spar against Cassian.'});
 assert.equal(c.questDetailsLatest([msg(c,'a',[],[assignment]),separate]).length,2);
 const ambiguous=[msg(c,'a',[],[assignment]),separate,msg(c,'c',[],[variant])];
 assert.equal(c.questDetailsLatest(ambiguous).length,2,'An ambiguous renamed update cannot create a third quest');
 c.history=ambiguous;c.campaignState=c.emptyChatState();
 assert.equal(c.hmsPanelState('test',ambiguous,c.campaignState).systems.quests.length,2,'Panel reconciliation must retain the explicit separate assignment');
});
test('The same identity rules work with unrelated names and settings',()=>{
 const c=setup().ctx,a={name:'Arena Test',objective:'Beat the Sentinel in the arena',giver:'Unit Seven',where:'Orbital Arena',reward:'A promised passage to Station Delta',state:'active'};
 const b={...a,name:'Passage to Delta',objective:'Win or draw the duel against the Sentinel',reward:'Passage to Station Delta'};
 assert.equal(c.questDetailsLatest([msg(c,'a',[],[a]),msg(c,'b',[],[b])]).length,1);
});
test('Existing campaign controls survive consolidation and restoration',()=>{
 const c=setup().ctx,chat=JSON.parse(JSON.stringify(history(c)));
 const key='spar with cassian in the yard :: cassian veyrath :: courtyard :: when the bell rings at nine';
 const items=c.agendaRead(chat,{agenda:{edits:{[key]:{state:'kept',after:'d'}}}}).items;
 assert.equal(items.length,1);assert.equal(items[0].state,'kept');assert.equal(c.questDetailsLatest(chat).length,1);
});
test('Repeated Separate automatic updates keep source-bound identities and do not add model calls',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;r.messages.push(...history(c));let calls=0;r.quiet(()=>calls++);
 for(const [agenda,quests]of [[[{...appointment,where:'Veyrath Hall courtyard',when:'Morning',state:'in_progress'}],[final]],[[{...appointment,where:'courtyard',when:'the bell rings at nine'}],[variant]],[[appointment],[assignment]]]){
  r.response({characters:[],agenda,quests});await c.runSeparateUpdate('test','d');
  const payload=r.events.filter(e=>e.type==='state'&&e.hms?.agenda).at(-1);assert.equal(payload.hms.agenda.items.length,1);assert.equal(c.questDetailsLatest(r.messages).length,1);
 }
 assert.equal(calls,3);assert.equal(c.agendaRead(JSON.parse(JSON.stringify(r.messages)),{}).items.length,1);
});
test('Reliable changed quest conditions and legitimate progress resets supersede old detail',()=>{
 const c=setup().ctx,newCondition={...variant,objective:'Defeat Cassian',progress:0};
 const chat=[msg(c,'a',[],[assignment]),msg(c,'b',[],[newCondition],{body:'The condition has changed: defeat Cassian.'})];
 const rows=c.questDetailsLatest(chat);assert.equal(rows.length,1);assert.equal(rows[0].objective,'Defeat Cassian');assert.equal(rows[0].progress,0);
 assert(rows[0].identityHistory.some(x=>x.objective===assignment.objective));
});
test('A broad Separate re-extraction cannot erase its unchanged source bell or exact clock',async()=>{
 for(const when of ['the bell rings at nine','09:00']){
  const r=setup(),c=r.ctx;seed(r);r.messages.length=0;
  r.messages.push(msg(c,'single',[{...appointment,when,where:'Veyrath Hall courtyard'}],[],{place:'Veyrath Hall Courtyard'}));
  r.response({characters:[],agenda:[{...appointment,where:'courtyard',when:'Morning'}]});
  await c.runSeparateUpdate('test','single');
  assert.equal(c.getSwipeData(r.messages[0]).agenda[0].when,when,'Retain source-confirmed time detail');
  assert.equal(c.agendaRead(r.messages,{}).items.length,1);
 }
});
test('An explicit reschedule can replace an old precise clock with a broad period',()=>{
 const c=setup().ctx,chat=[msg(c,'a',[{...appointment,when:'09:00'}]),msg(c,'b',[{...appointment,when:'Morning',state:'moved'}])];
 const items=c.agendaRead(chat,{}).items;assert.equal(items.length,1);assert.equal(items[0].when,'Morning');assert.equal(items[0].dueAt,null);assert(items[0].reschedules.length);
});
test('Together mode processes new inline reports without extra calls or duplicate host deliveries',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;
 r.run("settings.generationMode='together'; settings.catchUp=false;");
 let calls=0;r.quiet(()=>calls++);const ended=r.run('rpgcGenEnded');
 const frames=history(c);
 for(let i=0;i<frames.length;i++){
  const frame=frames[i],data=c.getSwipeData(frame);
  const current={id:frame.id,role:'assistant',swipe_id:0,content:frame.content+'\n<rpg_companion>'+JSON.stringify({characters:[],agenda:data.agenda,quests:data.quests})+'</rpg_companion>'};
  r.messages.push(current);await ended({chatId:'test',messageId:current.id,generationType:'normal'});
  await ended({chatId:'test',messageId:current.id,generationType:'normal',fromPanel:true});
  assert.equal(c.agendaRead(r.messages,{}).items.length,1);
  if(i)assert.equal(c.questDetailsLatest(r.messages).length,1);
 }
 assert.equal(calls,0,'Together inline reports require no extra model call');
 assert.equal(c.questDetailsLatest(JSON.parse(JSON.stringify(r.messages))).length,1);
});
if(process.argv.includes('--browser-fixture')) {
 const r=setup(),c=r.ctx;c.history=JSON.parse(JSON.stringify(history(c)));
 r.run("userNameCache.set('test','Marcus King'); const fixtureState=emptyChatState(); fixtureState.questFocus=\"the father's condition\";");
 const result=r.run("withReadPass(history,()=>hmsPanelState('test',history,fixtureState))");
 console.log(JSON.stringify(result));
} else (async()=>{let failed=0;for(const[name,fn]of tests){try{await fn();console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack)}}if(failed)process.exitCode=1;else console.log(tests.length+' identity-drift groups passed');})();
