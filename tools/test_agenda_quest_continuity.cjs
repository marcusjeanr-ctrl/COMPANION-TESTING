// Source-bound synthetic regressions; screenshots alone do not expose saved rows.
const assert=require('node:assert/strict');
const {runtime,hud}=require('./test_panel_tracking.cjs');
const cases=[],test=(name,fn)=>cases.push([name,fn]);
const setup=()=>runtime(process.env.COMPANION_OCCURRENCE_BASELINE);
const event={what:'Doubled sparring sessions with Father',with:'Lord Alden Vale',where:'Old Keep training yard',when:'08:00',kind:'event',state:'open'};
const quest={name:'Doubled sparring sessions',objective:'Accept and begin doubled sword training',giver:'Lord Alden Vale',where:'Old Keep training yard',category:'personal',progress:20,state:'active',reward:'Further instruction'};
const next={...quest,name:'Doubled sparring sessions with Father',objective:'Report ten minutes before the first bell',progress:0};
function msg(c,id,fields,body='',{time='08:00',day=8,where='Old Keep training yard',living=false}={}){
 const content=hud(where,time,living).replace('Day 8','Day '+day).replace('Day: 8','Day: '+day)+'\n'+body;
 const data=c.parseCompanion('<rpg_companion>'+JSON.stringify({characters:[],...fields})+'</rpg_companion>');
 return{id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:data},sources:{0:c.readingSource(content)}}}};
}
function campaign(c){return[msg(c,'start',{quests:[quest]},'You accept the doubled sparring sessions assignment.'),msg(c,'stage',{quests:[next]},'The doubled sparring sessions assignment continues. Its next stage now requires reporting before the bell.',{time:'08:10'})];}
test('Repeated fixed clocks stay on the stated day after their time passes on both calendars',()=>{
 for(const living of [false,true]){const c=setup().ctx,chat=[0,1,2].map(i=>msg(c,'r'+i,{agenda:[event]},'The same appointment remains at 08:00 today.',{time:'08:'+String(i*10).padStart(2,'0'),living}));const first=c.agendaRead(chat.slice(0,1),{}).items[0],rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,1);assert.equal(rows[0].key,first.key);assert.equal(rows[0].dueAt,first.dueAt);assert.equal(rows[0].scheduleDay,first.scheduleDay);}
});
test('A continuing now session retains its first start, key and one active row',()=>{
 const c=setup().ctx,chat=[0,1,2].map(i=>msg(c,'r'+i,{agenda:[{...event,when:'now',state:'in_progress'}]},'The same sparring session continues without a break.',{time:'08:'+String(i*10).padStart(2,'0')}));const before=JSON.stringify(chat),first=c.agendaRead(chat.slice(0,1),{}).items[0],rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,1);assert.equal(rows[0].dueAt,first.dueAt);assert.equal(rows[0].key,first.key);assert.equal(rows[0].state,'in_progress');assert.equal(JSON.stringify(chat),before);
});
test('The same session can finish without leaving an active duplicate or drifting its start',()=>{
 const c=setup().ctx,a={...event,when:'now',state:'in_progress'},chat=[msg(c,'a',{agenda:[a]}),msg(c,'b',{agenda:[{...a,state:'kept'}]},'The same sparring session has finished.',{time:'08:10'}),msg(c,'c',{agenda:[{...a,state:'kept'}]},'The same earlier sparring session remains completed.',{time:'08:20'})];const first=c.agendaRead(chat.slice(0,1),{}).items[0],rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,1);assert.equal(rows[0].state,'kept');assert.equal(rows[0].dueAt,first.dueAt);assert(rows[0].history.some(x=>x.to==='kept'));
});
test('A second completed session does not overwrite earlier completed history',()=>{
 const c=setup().ctx,a={...event,when:'now',state:'kept'},chat=[msg(c,'a',{agenda:[a]},'The first sparring session is completed.'),msg(c,'b',{agenda:[a]},'A second, separate sparring session is completed.',{time:'09:00'})];assert.equal(c.agendaRead(chat,{}).items.length,2);
});
test('An accepted appointment can finish without an intermediate active report',()=>{
 const c=setup().ctx,chat=[msg(c,'a',{agenda:[event]}),msg(c,'b',{agenda:[{...event,when:'now',state:'kept'}]},'The same sparring session is completed.',{time:'08:10'})];const rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,1);assert.equal(rows[0].state,'kept');
});
test('Generic open reports of the same occurrence preserve active and terminal states',()=>{
 for(const [state,body] of [['in_progress','The same sparring session continues.'],['kept','The same earlier sparring session remains completed.'],['missed','The same earlier sparring session was missed.'],['cancelled','The same earlier sparring session was cancelled.']]){
  const c=setup().ctx,a={...event,when:'now',state},chat=[msg(c,'a',{agenda:[a]}),msg(c,'b',{agenda:[{...a,state:'open'}]},body,{time:'08:10'})];const rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,1,state);assert.equal(rows[0].state,state);
 }
});
test('A still-pending same occurrence does not drift its due time on repeated now reports',()=>{
 const c=setup().ctx,a={...event,when:'now'},chat=[msg(c,'a',{agenda:[a]}),msg(c,'b',{agenda:[a]},'The same sparring appointment is still pending.',{time:'08:10'})];const rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,1);assert.equal(rows[0].dueAt,c.agendaRead(chat.slice(0,1),{}).items[0].dueAt);
});
test('Many repeated observations and JSON reloads do not accumulate active duplicates',()=>{
 const c=setup().ctx,a={...event,when:'now',state:'in_progress'},chat=Array.from({length:120},(_,i)=>{const minutes=480+i;return msg(c,'r'+i,{agenda:[a]},'The same sparring session continues.',{time:Math.floor(minutes/60)+':'+String(minutes%60).padStart(2,'0')});});const rows=c.agendaRead(JSON.parse(JSON.stringify(chat)),{}).items;assert.equal(rows.length,1);assert.equal(rows[0].key,c.agendaRead(chat.slice(0,1),{}).items[0].key);
});
test('A declared new session, terminal history and another day remain distinct',()=>{
 for(const options of [{body:'A second, separate sparring session begins.'},{state:'kept',body:'The next sparring session begins.'},{day:9,body:'The same sparring session continues.'}]){
  const c=setup().ctx,a={...event,when:'now',state:options.state||'in_progress'},b={...event,when:'now',state:'in_progress'};const rows=c.agendaRead([msg(c,'a',{agenda:[a]}),msg(c,'b',{agenda:[b]},options.body,{time:'08:10',day:options.day||8})],{}).items;assert.equal(rows.length,2,JSON.stringify(options));if(options.state)assert(rows.some(x=>x.state==='kept'));
 }
});
test('Explicit different times, participants and ambiguous active candidates are not collapsed',()=>{
 for(const other of [{...event,when:'09:00'},{...event,with:'Tess Vale'},{...event,where:'Old Keep east yard'}]){
  const c=setup().ctx;assert.equal(c.agendaRead([msg(c,'a',{agenda:[event,other]})],{}).items.length,2);
 }
 const c=setup().ctx,a={...event,state:'in_progress'},b={...a,when:'08:10'},chat=[msg(c,'a',{agenda:[a,b]},'',{time:'08:10'}),msg(c,'b',{agenda:[{...a,when:'now'}]},'The same sparring session continues.',{time:'08:20'})];assert.equal(c.agendaRead(chat,{}).items.length,2);
});
test('Hypothetical, negated, quoted and unrelated continuity cues do not establish one occurrence',()=>{
 for(const body of ['If the same sparring session continues, you will stay.','Does the same sparring session continue?','The same sparring session does not continue.','The same sparring session no longer continues.','> The same sparring session continues.','```\nThe same sparring session continues.\n```','The same council meeting continues elsewhere.','Sparring continues.\nThis is not the same; a second session begins.']){
  const c=setup().ctx,a={...event,when:'now',state:'in_progress'};assert.equal(c.agendaRead([msg(c,'a',{agenda:[a]}),msg(c,'b',{agenda:[a]},body,{time:'08:10'})],{}).items.length,2,body);
 }
});
test('Parent-to-room refinement needs both source locations and retains one stable occurrence',()=>{
 const c=setup().ctx,a={...event,what:'Afternoon study of condensation circles',where:'Old Keep',when:'this afternoon'},b={...a,where:'Old Keep study'},chat=[msg(c,'a',{agenda:[a]},'',{where:'Old Keep study'}),msg(c,'b',{agenda:[b]},'',{time:'08:10',where:'Old Keep study'})];const rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,1);assert.equal(rows[0].where,'Old Keep study');assert.equal(rows[0].key,c.agendaRead(chat.slice(0,1),{}).items[0].key);
});
test('Different rooms, annexes, missing location evidence and explicit snapshot appointments stay separate',()=>{
 for(const [where,oldScene,newScene] of [['Old Keep study annex','Old Keep study annex','Old Keep study annex'],['Old Keep east wing','Old Keep east wing','Old Keep east wing'],['Old Keep study','Old Keep yard','Old Keep study']]){
  const c=setup().ctx,a={...event,where:'Old Keep',when:'this afternoon'},b={...a,where};assert.equal(c.agendaRead([msg(c,'a',{agenda:[a]},'',{where:oldScene}),msg(c,'b',{agenda:[b]},'',{time:'08:10',where:newScene})],{}).items.length,2,where);
 }
 const c=setup().ctx;assert.equal(c.agendaRead([msg(c,'a',{agenda:[{...event,where:'Old Keep'},{...event,where:'Old Keep study'}]},'',{where:'Old Keep study'})],{}).items.length,2);
});
test('Todays activity cannot start a different appointment scheduled tomorrow',()=>{
 const c=setup().ctx,a={...event,when:'tomorrow at 08:00'},chat=[msg(c,'a',{agenda:[a]}),msg(c,'b',{plot:{now:'Doubled sparring sessions with Father are underway.'}},'Today you practice; the separately scheduled appointment remains tomorrow.',{time:'08:10'})];const rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,1);assert.equal(rows[0].state,'open');
 const bad=c.agendaRead([msg(c,'a',{agenda:[{...a,state:'in_progress'}],plot:{now:'Doubled sparring sessions with Father are underway.'}})],{}).items;assert.equal(bad[0].state,'open');
});
test('Generic activity cues do not start later same-day sessions but allow explicit early starts',()=>{
 const c=setup().ctx,a={...event,when:'08:00'},b={...event,when:'09:00'},chat=[msg(c,'a',{agenda:[a,b]},'',{time:'07:50'}),msg(c,'b',{plot:{now:'Doubled sparring sessions with Father are underway.'}},'',{time:'08:10'})];const rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,2);assert.equal(rows.find(x=>x.when==='08:00').state,'in_progress');assert.equal(rows.find(x=>x.when==='09:00').state,'open');
 const early=c.agendaRead([msg(c,'early',{agenda:[{...b,state:'in_progress'}],plot:{now:'Doubled sparring sessions with Father are underway.'}},'The lesson explicitly starts early.',{time:'08:50'})],{}).items;assert.equal(early[0].state,'in_progress');
});
test('Explicit dates, tomorrow, reschedules and overdue times remain functional',()=>{
 const c=setup().ctx,first=msg(c,'a',{agenda:[event]}),at=c.hmsTimeline([first])[0].clock,day=Math.floor(at/1440);
 assert.equal(Math.floor(c.agendaWhen(null,'tomorrow at 08:00',at)/1440),day+1);
 assert.equal(Math.floor(c.agendaWhen(null,'Day 9, 08:00',at,c.parseHud(first.content))/1440),day+1);
 const moved=c.agendaRead([first,msg(c,'b',{agenda:[{...event,state:'moved',when:'tomorrow at 09:00'}]},'The appointment is postponed.',{time:'08:10'})],{}).items;assert.equal(moved.length,1);assert.equal(moved[0].state,'open');assert.equal(Math.floor(moved[0].dueAt/1440),day+1);
 assert(c.hmsAgendaPanel([first,msg(c,'later',{},'',{time:'10:00'})],{},c.hmsCfg()).items[0].dueIn<0);
});
test('A new undated future clock and a genuinely second next-day appointment retain old date semantics',()=>{
 const c=setup().ctx,first=msg(c,'a',{agenda:[event]}),at=c.hmsTimeline([first])[0].clock,day=Math.floor(at/1440);
 assert.equal(Math.floor(c.agendaWhen(null,'07:00',at)/1440),day+1);
 const chat=[first,msg(c,'b',{agenda:[event]},'A second sparring appointment is set for tomorrow.',{time:'08:10'})];const rows=c.agendaRead(chat,{}).items;assert.equal(rows.length,2);assert.equal(Math.floor(rows[1].dueAt/1440),day+1);
 const repeated=[first,msg(c,'b',{agenda:[event]},'The same appointment remains at 08:00 today.',{time:'08:10'}),msg(c,'c',{agenda:[event]},'The same appointment remains at 08:00 today.',{time:'08:20'})];assert.equal(c.agendaRead(repeated,{}).items.length,1);
});
test('Explicit quest stage continuation preserves key, reset, rewards and earlier stage evidence',()=>{
 const c=setup().ctx,chat=campaign(c),before=JSON.stringify(chat),rows=c.questDetailsLatest(chat);assert.equal(rows.length,1);assert.equal(rows[0].key,c.questDetailsLatest(chat.slice(0,1))[0].key);assert.equal(rows[0].objective,next.objective);assert.equal(rows[0].progress,0);assert.equal(rows[0].reward,quest.reward);assert(rows[0].questAliases.includes(quest.name));assert(rows[0].stageHistory.some(x=>x.objective===quest.objective&&x.progress===20&&x.msgId==='start'));assert.equal(JSON.stringify(chat),before);
});
test('Quest staging retains unrelated quests and deduplicates its HUD aliases',()=>{
 const c=setup().ctx,chat=campaign(c),other={...quest,name:'Deliver the parcel',objective:'Deliver a parcel to the south gate',giver:'Rin',where:'Town'};chat[0]=msg(c,'start',{quests:[quest,other]},'You accept both assignments.');const rows=c.questDetailsLatest(chat);assert.equal(rows.length,2);assert(rows.some(x=>x.name===other.name));
 const h=chat[1];h.content=h.content.replace('Current Arc: Sandbox','Current Arc: Sandbox\nQuest: Doubled sparring sessions — Active; Doubled sparring sessions with Father — Active');h.metadata.rpg_companion.sources[0]=c.readingSource(h.content);const panel=c.hmsPanelState('test',chat,{});assert.equal(panel.systems.quests.filter(x=>/Doubled sparring/.test(x.name)).length,1);
});
test('Related names without explicit continuation, distinct objectives and same-packet entries stay separate',()=>{
 for(const body of ['', 'A new, separate assignment begins.', 'The same council assignment continues elsewhere.', 'If the same assignment continues, its next stage changes.', '> The same assignment continues. Its next stage changes.']){
  const c=setup().ctx,chat=campaign(c);chat[1]=msg(c,'stage',{quests:[next]},body,{time:'08:10'});assert.equal(c.questDetailsLatest(chat).length,2,body);
 }
 const c=setup().ctx;assert.equal(c.questDetailsLatest([msg(c,'both',{quests:[quest,next]},'The doubled sparring assignment continues. Its next stage changes.')]).length,2);
 assert.equal(c.questDetailsLatest([msg(c,'a',{quests:[{...quest,name:'The Bargain',objective:'Earn permission'},{...quest,name:'The Journey',objective:'Prepare supplies'}]})]).length,2);
});
test('Quest owner, location, terminal and ambiguous candidates prevent speculative stage merges',()=>{
 for(const change of [{giver:'Tess Vale'},{where:'Southern Keep'}]){const c=setup().ctx,chat=campaign(c);chat[1]=msg(c,'stage',{quests:[{...next,...change}]},'The doubled sparring assignment continues. Its next stage changes.');assert.equal(c.questDetailsLatest(chat).length,2);}
 const c=setup().ctx,chat=campaign(c);chat[0]=msg(c,'start',{quests:[{...quest,state:'completed'}]});assert.equal(c.questDetailsLatest(chat).length,2);
 const d=setup().ctx;const two=[quest,{...quest,name:quest.name+' with the instructor',objective:'A separate objective'}];assert.equal(d.questDetailsLatest([msg(d,'both',{quests:two}),msg(d,'later',{quests:[next]},'The doubled sparring assignment continues. Its next stage changes.')]).length,3);
});
test('A personal child objective cannot replace an ongoing main quest',()=>{
 const c=setup().ctx,chat=campaign(c);chat[0]=msg(c,'start',{quests:[{...quest,category:'main'}]});const rows=c.questDetailsLatest(chat);assert.equal(rows.length,2);assert.equal(rows.find(x=>x.category==='main').objective,quest.objective);
});
test('Unrelated card terminology and bounded stage evidence preserve one identity without schema migration',()=>{
 const c=setup().ctx,a={...quest,name:'Quantum relay calibration',objective:'Connect the relay',giver:'Supervisor Nia',where:'Orbital Lab'},b={...a,name:a.name+' with the supervisor',objective:'Tune the second channel',progress:0};const chat=[msg(c,'a',{quests:[a]}),msg(c,'b',{quests:[b]},'Quantum relay calibration continues; its next phase requires tuning the second channel.')];const rows=c.questDetailsLatest(chat);assert.equal(rows.length,1);assert.equal(rows[0].progress,0);assert.equal(rows[0].stageHistory[0].objective,a.objective);
});
test('Swipes, hidden/edited sources and continuation snapshots cannot supply new stage evidence',()=>{
 for(const mode of ['swipe','hidden','edit','continuation']){const c=setup().ctx,chat=campaign(c);if(mode==='swipe')chat[1].swipe_id=1;if(mode==='hidden')chat[1].hidden=true;if(mode==='edit')chat[1].content+=' changed';if(mode==='continuation')chat[1]._rpgcPurpose='continue';const rows=c.questDetailsLatest(chat);const original=rows.find(x=>x.name===quest.name);assert(original,mode);assert.equal(original.objective,quest.objective,mode);}
});
test('Restored saved metadata, final completion and manual Agenda corrections remain compatible',()=>{
 const c=setup().ctx,chat=JSON.parse(JSON.stringify(campaign(c)));chat.push(msg(c,'done',{quests:[{...next,state:'completed',progress:100}]},'The assignment is completed.'));const rows=c.questDetailsLatest(chat);assert.equal(rows.length,1);assert.equal(rows[0].state,'completed');assert.equal(rows[0].progress,100);
 const a={...event,when:'now',state:'in_progress'},events=[msg(c,'a',{agenda:[a]}),msg(c,'b',{agenda:[a]},'The same sparring session continues.',{time:'08:10'})],key=c.agendaRead(events,{}).items[0].key;assert.equal(c.agendaRead(events,{agenda:{edits:{[key]:{state:'kept',after:'b'}}}}).items[0].state,'kept');
});
test('Projection helpers add no model, host or storage calls and leave raw reports untouched',()=>{
 const r=setup(),c=r.ctx,chat=campaign(c),before=JSON.stringify(chat);let calls=0;const fail=()=>{calls++;throw Error('Unexpected call');};r.ctx.spindle.world_books.getActivated=fail;r.ctx.spindle.generate.quiet=fail;r.ctx.spindle.chat.getMessages=fail;r.ctx.spindle.storage.setJson=fail;r.ctx.spindle.chat.updateMessage=fail;c.questDetailsLatest(chat);c.agendaRead(chat,{});assert.equal(calls,0);assert.equal(JSON.stringify(chat),before);
});
function browserFixture(){const c=setup().ctx,chat=campaign(c);chat[0].metadata.rpg_companion.swipes[0].agenda=c.agendaNormalize([{...event,when:'now',state:'in_progress'}]);chat[1].metadata.rpg_companion.swipes[0].agenda=c.agendaNormalize([{...event,when:'now',state:'in_progress'}]);chat[1].content+='\nThe same sparring session continues.';chat[1].metadata.rpg_companion.sources[0]=c.readingSource(chat[1].content);return c.hmsPanelState('test',chat,{});}
if(process.argv.includes('--browser-fixture'))console.log(JSON.stringify(browserFixture()));else (async()=>{let failed=0;for(const[name,fn]of cases){try{await fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}}console.log(`${cases.length-failed}/${cases.length} Agenda/quest continuity groups passed`);if(failed)process.exitCode=1;})();
