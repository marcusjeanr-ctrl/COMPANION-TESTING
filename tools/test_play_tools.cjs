const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../dist/frontend.js'),'utf8'),c=vm.createContext({});new vm.Script(src.replace('export function setup','function setup'));vm.runInContext(src.slice(0,src.indexOf('export function setup')),c);
const view={userName:'Marcus',hms:{relations:{people:[{name:'Aurelius King',standing:'Close',bond:'father',mood:'calm'}]},family:{members:[{name:'Aurelius King',where:'Study',known:'told'}]},minds:{people:[{name:'Aurelius King',feel:{word:'pride'},agenda:{doing:'Reading'},knows:[{fact:'Marcus knows fire magic',sure:'partly'},{fact:'The king is away',sure:'certain'}]}]},agenda:{items:[{what:'Study',with:'Aurelius King',state:'open',dueIn:40}]}},chronData:{entries:[{text:'A bond',who:['Aurelius King']}]}},original=JSON.stringify(view);
let p=c.npcDossierData(view,'Aurelius');assert.equal(p.standing,'Close');assert.equal(p.family.where,'Study');assert.equal(p.knowledge.length,1);assert.equal(p.appointment.what,'Study');assert.equal(p.chronicle.length,1);assert.equal(JSON.stringify(view),original);
assert.equal(c.npcDossierData(view,'Unknown'),null);
const minimal={hms:{relations:{people:[{name:'Clerk'}]}}};p=c.npcDossierData(minimal,'Clerk');assert.equal(p.knowledge.length,0);assert.equal(p.family,null);
console.log('NPC dossier: complete, sparse, unknown, knowledge ownership and immutable input passed');
for(const field of ['relations','family','minds','agenda']){
 const sparse=JSON.parse(JSON.stringify(view));delete sparse.hms[field];assert(c.npcDossierData(sparse,'Aurelius King'));
}
assert.equal(c.npcDossierData({hms:{relations:{people:[{name:'Clerk East'},{name:'Clerk West'}]}}},'Clerk'),null);
const resumed={hms:{messageId:'old',hud:{location:['Town'],time:'09:00'},systems:{quests:[{name:'Open',state:'active'},{name:'Done',state:'completed'}]}},plotView:{now:'Training',threads:[{name:'A thread',state:'open'}],objectives:[{text:'Practice',state:'active'}]}},resumeOriginal=JSON.stringify(resumed);
assert.equal(c.recapData(resumed,['old']),null);assert.equal(c.recapData(resumed,[],true),null);assert.equal(c.recapData({}),null);assert.equal(c.recapData({hms:{messageId:'empty'}}),null);
const recap=c.recapData(resumed);assert.equal(recap.quests.length,1);assert.equal(recap.location,'Town');assert.equal(recap.now,'Training');assert.equal(JSON.stringify(resumed),resumeOriginal);
console.log('Recap: fresh/generated, resumed, dismissed, no data and immutable state passed');
assert(c.chronicleHighlight({kind:'moment',text:'Won the duel'}));assert(c.chronicleHighlight({kind:'milestone'}));assert(c.chronicleHighlight({kind:'plot'}));assert(!c.chronicleHighlight({kind:'place'}));assert(!c.chronicleHighlight({kind:'moment',text:'A quiet breakfast',imp:2}));
const bonds=[{kind:'bond',who:['Clerk'],when:'K417 Month 4 Day 1, 09:00',text:'Wary → Friendly'}, {kind:'bond',who:['Clerk'],when:'K417 Month 4 Day 1, 09:10',text:'Friendly → Close'}],bondOriginal=JSON.stringify(bonds);
assert.equal(c.dailyBondGroups(bonds).length,1);assert.equal(c.dailyBondGroups(bonds)[0].members.length,2);
assert.equal(c.dailyBondGroups([bonds[0],{...bonds[1],who:['Someone else']}]).length,2);assert.equal(c.dailyBondGroups([bonds[0],{...bonds[1],when:'K417 Month 4 Day 2, 09:10'}]).length,2);assert.equal(c.dailyBondGroups([]).length,0);assert.equal(JSON.stringify(bonds),bondOriginal);
console.log('Quieter Chronicle: Highlights membership, daily same-pair folding, distinct pairs/days and immutable empty input passed');
assert.equal(c.appointmentDelta({state:'open',dueAt:940},900),40);assert.equal(c.appointmentDelta({state:'open',dueIn:-10},900),-10);assert.equal(c.appointmentDelta({state:'open',when:'when the bell rings'},900),null);assert.equal(c.appointmentDelta({state:'kept',dueIn:40},900),null);assert.equal(c.appointmentDelta({state:'open',dueAt:1470},1430),40);
assert.equal(c.nextAppointment([{state:'open',what:'Later',dueIn:80},{state:'open',what:'Study',dueIn:40},{state:'open',what:'Old',dueIn:-10}]).what,'Study');
const {runtime:playRuntime,hud:playHud}=require('./test_panel_tracking.cjs');const clockRuntime=playRuntime();
function clock(date,time){return clockRuntime.ctx.hmsClock(clockRuntime.ctx.parseHud(playHud('Yard',time).replace('K417, Thawmoon (Month 2), Day 8',date))).minutes;}
assert.equal(c.appointmentDelta({state:'open',dueAt:clock('K418, Month 1, Day 1','00:30')},clock('K417, Month 12, Day 30','23:50')),40);
assert.equal(c.appointmentDelta({state:'open',dueAt:clock('K417, Month 3, Day 1','00:30')},clock('K417, Month 2, Day 30','23:50')),40);
assert.equal(c.appointmentDelta({state:'open',dueIn:null}),null);
console.log('Countdown: missing/overdue/now, rollover, K year and 12×30 month boundaries reuse existing clock minutes');
const generic=playHud('School','23:50').replace(playHud('School','23:50').split('\n')[1],'Date: 2026-01-31 | Time: 23:50');
const genericHud=clockRuntime.ctx.parseHud(generic),genericNow=clockRuntime.ctx.hmsClock(genericHud).minutes;
const genericDue=clockRuntime.ctx.agendaWhen(null,'tomorrow at 00:30',genericNow,genericHud);
assert.equal(c.appointmentDelta({state:'open',dueAt:genericDue},genericNow),40);
const chainQuests=[{key:'q_a',questId:'q_a',name:'Find a teacher',state:'completed',giver:'Guild',reward:'An audience with the prince',readAt:1},{key:'q_b',name:'The audience',state:'active',giver:'Guild',reward:'An audience with the prince',readAt:2}],chainCopy=JSON.stringify(chainQuests);
assert.equal(c.questChainLinks(chainQuests).length,1);assert.equal(c.questChainLinks(chainQuests)[0].from,'q_a');assert.equal(JSON.stringify(chainQuests),chainCopy);
assert.equal(c.questChainLinks([{...chainQuests[0],reward:'10 gold',objective:'Deliver a letter'},{...chainQuests[1],reward:'10 gold',objective:'Hunt wild boars'}]).length,0);
assert.equal(c.questChainLinks([chainQuests[0],{key:'other',name:'New task',objective:'Continue q_a after the introduction',giver:'Another person'}]).length,1);
assert.equal(c.questChainLinks([{...chainQuests[0],state:'active'},chainQuests[1]]).length,0);
assert.equal(c.questChainLinks([chainQuests[0],{...chainQuests[0],key:'alternative'},chainQuests[1]]).length,0);
console.log('Quest chains: completed predecessor, meaningful overlap, explicit reference, unrelated same giver and ambiguity passed without merging');

assert.equal(c.questChainLinks([{key:'training',name:'Training',state:'completed',giver:'A'},{key:'another',name:'Training at home',state:'active',giver:'B'}]).length,0);
const evidenceItem={observations:[{msgId:'1',state:'Reliable',evidence:'You execute the cut.',at:1},{msgId:'1',state:'Reliable',evidence:'You execute the cut.',at:1},{msgId:'2',state:'Known',evidence:'You execute it again.',at:2},{msgId:'3',state:'Known',evidence:'You practice in the spar.',at:3}]},evidenceOriginal=JSON.stringify(evidenceItem);
assert.equal(c.abilityEvidenceSummary({observations:[evidenceItem.observations[0]]}).current,1);assert.equal(c.abilityEvidenceSummary(evidenceItem).current,3);assert.equal(c.abilityEvidenceSummary(evidenceItem).last.msgId,'3');
assert.equal(c.abilityEvidenceSummary({}).current,0);assert.equal(c.abilityEvidenceSummary({observations:[{...evidenceItem.observations[0],historical:true}]}).historical,1);assert.equal(c.abilityEvidenceSummary({observations:[{...evidenceItem.observations[0],state:'unverified'}]}).current,0);assert.equal(JSON.stringify(evidenceItem),evidenceOriginal);
console.log('Ability evidence: one/several/deduplicated observations, empty, rejected and historical-only without progression changes passed');
const evidenceRuntime=playRuntime(),bc=evidenceRuntime.ctx,quote='You knew the compact diagonal cut long ago.';
const historicalData=bc.parseCompanion('<rpg_companion>'+JSON.stringify({you:{abilities:[{name:'Compact diagonal cut',owner:'you',historical:true,state:'known',evidence:quote}]}})+'</rpg_companion>');
const historyMsg={id:'past-evidence',role:'assistant',content:playHud()+'\n'+quote,metadata:{rpg_companion:{swipes:{0:{...historicalData,survival:historicalData.you}}}}},historyBefore=JSON.stringify(historyMsg);
const ability=bc.martialAbilityItems('test',[historyMsg],bc.emptyChatState())[0];assert.equal(c.abilityEvidenceSummary(ability).historical,1);assert.equal(c.abilityEvidenceSummary(ability).current,0);assert.equal(JSON.stringify(historyMsg),historyBefore);assert.equal(evidenceRuntime.writes.length,0);
const changeBefore={hms:{hud:{location:['Town']},gear:{items:[{key:'blade',name:'Blade',state:'stowed'}]},relations:{people:[{key:'clerk',name:'Clerk',standing:'Wary'}]},agenda:{items:[]},systems:{quests:[]}},chronicle:[]};
const changeAfter=JSON.parse(JSON.stringify(changeBefore));changeAfter.hms.hud.location=['Yard'];changeAfter.hms.gear.items[0].state='in hand';changeAfter.hms.relations.people[0].standing='Friendly';changeAfter.chronicle=[{id:'new',text:'A milestone'}];
assert.equal(c.snapshotChanges(null,changeAfter).length,0);assert.equal(c.snapshotChanges(changeBefore,changeBefore).length,0);assert.equal(c.snapshotChanges(changeBefore,changeAfter).length,4);
console.log('What changed: two snapshots only, first reply, no changes and multiple source changes passed');
assert.equal(c.snapshotChanges({hms:{systems:{clock:100},agenda:{items:[{key:'a',what:'Study',state:'open',when:'at noon',dueIn:40}]}}},{hms:{systems:{clock:110},agenda:{items:[{key:'a',what:'Study',state:'open',when:'at noon',dueIn:30}]}}}).length,0);
assert.equal(c.snapshotChanges({hms:{},chronicle:null},{hms:{},chronicle:[{id:'old',text:'Old record just fetched'}]}).length,0);
const loopView={userName:'Marcus',hms:{relations:{people:[{name:'Aurelius'}]},minds:{chekhov:{chamber:[{id:'c1',what:"Aurelius's promise to arrange a meeting with the Greyrat boy",age:2,readAt:540,status:'live'},{id:'c2',what:"Aurelius's promise to introduce Marcus to the Greyrat boy",age:1,readAt:550,status:'live'}],locked:[],fired:[{what:'Already paid off'}]}},secrets:{yours:[{text:'An unresolved secret'},{text:'A public secret',status:'public'}]}},plotView:{threads:[{name:'An open thread',state:'open'},{name:'Resolved thread',state:'resolved'}]}};
const loopsOriginal=JSON.stringify(loopView),loops=c.openLoopRows(loopView);assert.equal(loops.length,3);assert.equal(loops.find(x=>x.entry.kind==='promise').count,2);assert(!loops.some(x=>x.entry.text.includes('paid off')||x.entry.text.includes('public secret')));assert.equal(JSON.stringify(loopView),loopsOriginal);assert.equal(c.openLoopRows({}).length,0);
console.log('Open loops: existing live promises/secrets/threads, shared conservative dedup, paid-off/resolved exclusion and immutability passed');
const standingLadder=['Hostile','Wary','Friendly','Close'];
assert.equal(c.standingHistory({standing:'Friendly',events:[]},standingLadder).points.length,1);
assert.equal(c.standingHistory({standing:'Close',events:['Wary → Friendly','Friendly → Close']},standingLadder).points.at(-1).value,3);
assert.equal(c.standingHistory({standing:'Hostile',events:['Close → Wary','Wary → Hostile']},standingLadder).points.at(-1).value,0);
assert.equal(c.standingHistory({standing:'Wary',events:['Wary → Close','Close → Wary']},standingLadder).points.length,3);
assert(c.standingHistory({events:Array(20).fill('Wary → Close')},standingLadder).points.length<=12);assert.equal(c.standingHistory({},standingLadder).points.length,0);
console.log('Standing history: stable/rising/falling/flip-flop, unknown ranks and bounded observations passed');
const calendarView={userName:'Marcus',hms:{hud:{lines:[{text:'Armored Dragon Calendar: K417, Month 4, Day 1 | Time: 09:20'},{text:'Age: 13 (born K404, Month 2)'}]},agenda:{items:[{what:'Study',state:'open',dueIn:40}]}},world:{saga:{events:[{name:'Known date',when:'K417 Month 4 Day 2'},{name:'Vague event',when:'in a month'}]}}},calendarBefore=JSON.stringify(calendarView);
const calendar=c.worldCalendarData(calendarView);assert.equal(calendar.events.find(x=>x.kind==='appointment').day,1);assert.equal(calendar.events.find(x=>x.kind==='canon').day,2);assert(calendar.undated.includes('Vague event'));
const futureBirthday=c.worldCalendarData(calendarView,10).birthdays[0];assert.equal(futureBirthday.age,14);assert.equal(futureBirthday.year,418);assert.equal(futureBirthday.month,2);assert.equal(futureBirthday.day,null);assert.equal(c.worldCalendarData(calendarView,10).events.filter(x=>x.kind==='birthday').length,0);assert.equal(c.worldCalendarData({hms:{hud:{lines:[{text:'Date: 2026-10-30'}]}}}),null);assert.equal(JSON.stringify(calendarView),calendarBefore);
console.log('Calendar: supported 12×30 dates, known appointments/canon, undated canon, month-only birthday age 14 and unsupported world passed');

const proseRt=playRuntime(),pc=proseRt.ctx;
const proseChat=Array.from({length:5},(_,i)=>({id:'p'+i,role:'assistant',_rpgcPurpose:'story',content:'### WORLD STATE ###\nHUDOnly: glittering\n***\n'+(i<3?'A sharp sharp shape. A sharp shape.':'A quiet garden.')+'\n<think>reasononly reasononly</think>\n<rpg_companion>{"note":"trackeronly"}</rpg_companion>\n```json\n{"note":"fenceonly"}\n```'}));
const proseBefore=JSON.stringify(proseChat),prose=pc.playProse(proseChat),repeated=pc.repetitionRows(prose);
assert.equal(repeated.find(x=>x.text==='sharp').count,3);assert(repeated.find(x=>x.text==='a sharp shape'));assert(!repeated.some(x=>/glittering|reasononly|trackeronly|fenceonly/.test(x.text)));assert.equal(JSON.stringify(proseChat),proseBefore);
assert.equal(pc.repetitionRows([{text:'Sharp sharp sharp.'}]).length,0);assert.equal(pc.playProse([...proseChat,{role:'assistant',hidden:true,content:'***\nsecret'}]).length,5);assert.equal(pc.playProse([{role:'assistant',content:'No wall, no prose analysis'}]).length,0);assert.equal(pc.playProse(Array(100).fill(proseChat[0])).length,10);
assert.equal(pc.appendPlayHints({content:'context'},['Avoid overusing: sharp'],10).content,'context');assert.equal(pc.appendPlayHints({content:'context'},['Avoid overusing: sharp'],30).content,'context\nAvoid overusing: sharp');assert.equal(pc.appendPlayHints(null,['hint'],100),null);
assert.equal(pc.playProse([...proseChat,{role:'assistant',_rpgcPurpose:'continue',content:'***\nignored continuation'}]).length,5);
(async()=>{
 const rt=playRuntime();rt.messages.push(...proseChat,{id:'u',role:'user',content:'I wait.'});rt.ctx.userNameCache?.set?.('test','Marcus');rt.run("settings.hmsMode='on';settings.hmsPinReminder=true;settings.lore.maxChars=6000;chatStateCache.set('test',{...emptyChatState(),pins:{Touki:{text:'Touki: Inactive'}}})");
 await rt.frontendHandlers[0]({type:'play_prose',chatId:'test',replyId:'p4',requestKey:'read'});assert.equal(rt.events.at(-1).rows.length,5);
 rt.ctx.input=[{role:'user',content:'I wait.',__isChatHistory:true}];
 const output=async()=>{const r=await rt.run("rpgcInterceptor(input.map(x=>({...x})),{chatId:'test',generationType:'normal'})");return JSON.stringify(r);};
 const off=await output();assert(!off.includes('Avoid overusing:'));
 rt.run('settings.playTools={repetitionHint:true}');const on=await output();
 // A reminder may only append to an existing context; no extra message is created.
 assert(on.includes('Avoid overusing:'));assert(on.length-off.length<=241);
 rt.run('settings.playTools={repetitionHint:false}');assert.equal(await output(),off);
 assert.equal(rt.writes.length,0);
 console.log('Repetition: bounded visible prose, once per reply, hidden/HUD/tracker exclusions, opt-in default and spare prompt budget passed');
})().catch(e=>{console.error(e);process.exitCode=1;});

const actionView={data:{characters:[{name:'Clerk'}]},hms:{agenda:{items:[{what:'Study',state:'open',dueIn:40}]},minds:{chekhov:{chamber:[{what:'A promised letter',status:'live'}]}}},plotView:{objectives:[{text:'Deliver the parcel',state:'active'}]},playProse:{room:{exits:[{to:'Hall'}]}}};
const actionBefore=JSON.stringify(actionView),actions=c.nextActionRows(actionView);assert.equal(actions.length,5);assert.equal(actions.map(x=>x.kind).join(','),'appointment,person,objective,loop,exit');assert.equal(JSON.stringify(actionView),actionBefore);assert.equal(c.nextActionRows({}).length,0);
assert(!c.nextActionRows({...actionView,hms:{agenda:{items:[{what:'Study',state:'open',dueIn:null}]}}}).some(x=>x.kind==='appointment'));
assert(!c.nextActionRows({hms:{secrets:{yours:[{text:'Private NPC information'}]}}}).some(x=>x.kind==='loop'));
console.log('Next actions: every supported source, no data, stable ordering, five cap and no state mutation passed');

assert.equal(c.nextActionRows({plotView:{objectives:[{text:'An abandoned objective',state:'abandoned'}]}}).length,0);

assert.equal(c.voiceSuggestion([],'Clerk'),'');
const dialogue=[{text:'[D:Clerk]"Wait, friend."\n[D:Someone]"I speak at length."'},{text:'[D:Clerk]"Good morning."'}];
assert.equal(c.voiceSuggestion(dialogue,'Clerk'),'Short dialogue lines');assert.equal(c.voiceSuggestion(dialogue,'Someone'),'');assert.equal(c.voiceSuggestion([{text:'Clerk is clipped.'}],'Clerk'),'');
const noteState={v:2,seed:{unchanged:true}},noteCopy=JSON.stringify(noteState);
assert.equal(pc.playNoteRead(noteState,'voice','Clerk'),'');assert.equal(JSON.stringify(noteState),noteCopy);
assert(pc.playNoteEdit(noteState,'voice','Clerk','Clipped, calls you friend.'));assert.equal(pc.playNoteRead(noteState,'voice','Clerk'),'Clipped, calls you friend.');assert(pc.acceptedVoiceHint(noteState,[{name:'Clerk'}]).includes('Clipped'));assert.equal(pc.acceptedVoiceHint(noteState,[{name:'Other'}]),'');
pc.playNoteEdit(noteState,'voice','Clerk','Revised note');assert.equal(pc.playNoteRead(noteState,'voice','Clerk'),'Revised note');pc.playNoteEdit(noteState,'voice','Clerk','');assert.equal(pc.playNoteRead(noteState,'voice','Clerk'),'');assert.equal(noteState.seed.unchanged,true);
assert.equal(pc.appendPlayHints({content:'context'},['Accepted voice notes: Clerk: brief'],5).content,'context');
(async()=>{const rt=playRuntime(),disk=new Map();rt.ctx.spindle.storage.setJson=async(k,v)=>disk.set(k,structuredClone(v));rt.ctx.spindle.storage.getJson=async(k)=>structuredClone(disk.get(k)??null);
 const st=await rt.ctx.getChatState('notes');rt.ctx.playNoteEdit(st,'voice','Clerk','Accepted by user');await rt.ctx.saveChatState('notes',st);rt.run('chatStateCache.clear()');const loaded=await rt.ctx.getChatState('notes');assert.equal(rt.ctx.playNoteRead(loaded,'voice','Clerk'),'Accepted by user');assert.equal(rt.writes.length,0);
 console.log('Voice notes: own dialogue only, suggestions unaccepted, explicit edit/clear, current-cast reminder, spare budget and save/reload passed');
})().catch(e=>{console.error(e);process.exitCode=1;});

assert.equal(c.voiceSuggestion(dialogue,'Clerk King',['Clerk King']),'Short dialogue lines');assert.equal(c.voiceSuggestion(dialogue,'Clerk King',['Clerk King','Clerk Brown']),'');
(async()=>{
 const rt=playRuntime();rt.messages.push({id:'u1',role:'user',content:'I greet the clerk.'},{id:'a1',role:'assistant',content:playHud(),metadata:{rpg_companion:{swipes:{0:{characters:[{name:'Clerk',details:{appearance:'red coat'}}]}}}}},{id:'u2',role:'user',content:'I wait.'});
 rt.run("settings.hmsMode='on';settings.hmsPinReminder=true;const st=emptyChatState();st.pins={mode:{text:'Narrative Mode: Strict Agency'}};playNoteEdit(st,'voice','Clerk','Clipped dialogue');chatStateCache.set('test',st)");
 rt.ctx.input=[{role:'user',content:'I wait.',__isChatHistory:true}];
 const prompt=async()=>JSON.stringify(await rt.run("rpgcInterceptor(input.map(x=>({...x})),{chatId:'test',generationType:'normal'})"));
 const off=await prompt();assert(!off.includes('Accepted voice notes:'));rt.run('settings.playTools={voiceHint:true}');const on=await prompt();assert(on.includes('Accepted voice notes: Clerk: Clipped dialogue'));assert(on.length-off.length<=241);
 rt.run('settings.playTools={voiceHint:false}');assert.equal(await prompt(),off);
})().catch(e=>{console.error(e);process.exitCode=1;});

const journalView={chronData:{entries:[{id:'a',kind:'moment',text:'Won a duel',who:['Clerk'],when:'K417 Month 4 Day 1, 09:00',replyIndex:1},{id:'b',kind:'milestone',text:'Earned a title',when:'K417 Month 4 Day 2, 10:00'},{id:'c',kind:'moment',text:'Undated event'}]}};
assert.equal(c.dailyJournalRows(journalView).length,2);assert.equal(c.dailyJournalRows({}).length,0);assert(!c.dailyJournalRows(journalView).some(x=>x.text.includes('Undated')));
(async()=>{const rt=playRuntime(),disk=new Map();let calls=0;rt.ctx.spindle.storage.setJson=async(k,v)=>disk.set(k,structuredClone(v));rt.ctx.spindle.storage.getJson=async(k)=>structuredClone(disk.get(k)??null);rt.quiet(()=>{calls++});
 const st=await rt.ctx.getChatState('diary');assert.equal(calls,0);rt.ctx.playNoteEdit(st,'journal','K417 Month 4 Day 1','My edited day');await rt.ctx.saveChatState('diary',st);rt.run('chatStateCache.clear()');assert.equal(rt.ctx.playNoteRead(await rt.ctx.getChatState('diary'),'journal','K417 Month 4 Day 1'),'My edited day');
 rt.ctx.spindle.generate.quiet=async()=>{calls++;return {content:'My recorded day.'}};await rt.ctx.oocAsk('diary','Write this recorded day in first person.','',{ephemeral:true});assert.equal(calls,1);assert.equal((await rt.ctx.getChatState('diary')).ooc,undefined);assert.equal(rt.writes.length,0);
 console.log('Journal: dated days/empty/undated, explicit saved edit reload, no automatic call and ephemeral OOC without chat writes passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
const diaryRt=playRuntime(),diaryChat=[{id:'day-a',role:'assistant',content:playHud()},{id:'day-b',role:'assistant',content:playHud('New Town').replace('Thawmoon (Month 2)','Month 3'),metadata:{rpg_companion:{swipes:{0:{moments:[{text:'Won the second-month spar',who:['Aurelius']}]}}}}}],diarySource=JSON.stringify(diaryChat);
const diaryChron=diaryRt.ctx.chronicleBuild(diaryChat,diaryRt.ctx.emptyChatState());
assert(diaryChron.some(x=>x.recordedDay==='K417, Month 2, Day 8'));assert(diaryChron.some(x=>x.recordedDay==='K417, Month 3, Day 8'));assert.equal(JSON.stringify(diaryChat),diarySource);assert.equal(diaryRt.writes.length,0);
assert.equal(c.dailyJournalRows({chronData:{entries:diaryChron}}).length,2);
assert.equal(c.dailyBondGroups([{...bonds[0],recordedDay:'K417, Month 2, Day 1'},{...bonds[1],recordedDay:'K417, Month 3, Day 1'}]).length,2);
assert.equal(c.dailyJournalRows({chronData:{entries:[{kind:'moment',when:'Day 1, 09:00',recordedDay:null,text:'No current dated HUD'}]}}).length,0);

const repView={userName:'Marcus',hms:{hud:{lines:[{text:'Renown: Fittoa: Local name | Asura: Noticed | elsewhere: Unknown'}]},minds:{people:[{name:'Clerk',knows:[{fact:'Marcus won the duel',sure:'reported'},{fact:'Rain falls in the west',sure:'certain'}]}]}}},repCopy=JSON.stringify(repView);
const rep=c.reputationData(repView);assert.equal(rep.regions.length,3);assert.equal(rep.regions[0].level,'Local name');assert.equal(rep.knowledge.length,1);assert.equal(rep.knowledge[0].sure,'reported');assert.equal(JSON.stringify(repView),repCopy);assert.equal(c.reputationData({}).regions.length,0);assert.equal(c.reputationData({}).knowledge.length,0);assert.equal(c.reputationData({hms:{hud:repView.hms.hud}}).knowledge.length,0);
console.log('Reputation: regional HUD terms, explicit player knowledge and uncertainty, empty data, no invented scores and immutable input passed');
(async()=>{
 const rt=playRuntime();rt.messages.push(...proseChat);rt.run("repetitionRows=()=>{throw new Error('closed repetition view computed')}");
 await rt.frontendHandlers[0]({type:'play_prose',chatId:'test',replyId:'p4',view:'voice',requestKey:'voice'});assert.equal(rt.events.at(-1).rows.length,5);assert.equal(rt.events.at(-1).repetition,undefined);
 rt.run("playProse=()=>{throw new Error('closed prose view computed')}");await rt.frontendHandlers[0]({type:'play_prose',chatId:'test',replyId:'p4',view:'room',requestKey:'room'});assert.equal(rt.events.at(-1).view,'room');assert.equal(rt.events.at(-1).rows,undefined);assert.equal(rt.events.at(-1).repetition,undefined);
 console.log('Lazy play reads: room-only never analyzes prose; voice-only never computes repetition');
})().catch(e=>{console.error(e);process.exitCode=1;});
assert.equal(c.npcDossierData({hms:{agenda:{items:[{what:'Deliver a letter',with:'Courier',state:'open'}]}}},'Courier').appointment.what,'Deliver a letter');
assert.equal(c.npcDossierData({chronData:{entries:[{who:['Courier'],text:'Delivered a letter'}]}},'Courier').chronicle.length,1);
assert(c.nextActionRows(actionView,(template,value)=>'Translated '+value).every(x=>x.text.startsWith('Translated ')));
