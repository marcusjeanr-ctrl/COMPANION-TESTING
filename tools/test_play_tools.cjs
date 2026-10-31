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
const standingLadder=['Hostile','Wary','Friendly','Close'];
assert.equal(c.standingHistory({standing:'Friendly',events:[]},standingLadder).points.length,1);
assert.equal(c.standingHistory({standing:'Close',events:['Wary → Friendly','Friendly → Close']},standingLadder).points.at(-1).value,3);
assert.equal(c.standingHistory({standing:'Hostile',events:['Close → Wary','Wary → Hostile']},standingLadder).points.at(-1).value,0);
assert.equal(c.standingHistory({standing:'Wary',events:['Wary → Close','Close → Wary']},standingLadder).points.length,3);
assert(c.standingHistory({events:Array(20).fill('Wary → Close')},standingLadder).points.length<=12);assert.equal(c.standingHistory({},standingLadder).points.length,0);
console.log('Standing history: stable/rising/falling/flip-flop, unknown ranks and bounded observations passed');
const voiceRt=playRuntime(),pc=voiceRt.ctx;
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

// Full source dates prevent daily bond folds from crossing calendar months.
const datedRt=playRuntime(),datedChat=[{id:'d1',role:'assistant',content:playHud()},{id:'d2',role:'assistant',content:playHud('New Town').replace('Thawmoon (Month 2)','Month 3')}],datedBefore=JSON.stringify(datedChat);
const datedEntries=datedRt.ctx.chronicleBuild(datedChat,datedRt.ctx.emptyChatState());
assert(datedEntries.some(x=>x.recordedDay==='K417, Month 2, Day 8'));assert(datedEntries.some(x=>x.recordedDay==='K417, Month 3, Day 8'));assert.equal(JSON.stringify(datedChat),datedBefore);
assert.equal(c.dailyBondGroups([{...bonds[0],recordedDay:'K417, Month 2, Day 1'},{...bonds[1],recordedDay:'K417, Month 3, Day 1'}]).length,2);
assert.equal(datedRt.run("hmsLabelIn('reputation'.toUpperCase(),FACTION_HUD_LABELS)"),true);
assert.equal(c.npcDossierData({hms:{agenda:{items:[{what:'Deliver a letter',with:'Courier',state:'open'}]}}},'Courier').appointment.what,'Deliver a letter');
assert.equal(c.npcDossierData({chronData:{entries:[{who:['Courier'],text:'Delivered a letter'}]}},'Courier').chronicle.length,1);
(async()=>{
 const rt=playRuntime();rt.messages.push(...Array.from({length:5},(_,i)=>({id:'voice-'+i,role:'assistant',content:'### WORLD STATE ###\nHUDOnly: hidden-field\n***\n[D:Clerk]"Wait, friend."\n<think>hidden thought</think>\n<rpg_companion>{"secret":"hidden report"}</rpg_companion>'})));
 const before=JSON.stringify(rt.messages);await rt.frontendHandlers[0]({type:'voice_dialogue',chatId:'test',replyId:'voice-4',requestKey:'read'});
 const rows=rt.events.at(-1).rows;assert.equal(rows.length,5);assert(rows.every(x=>x.text.includes('[D:Clerk]')&&!/hidden|HUDOnly/.test(x.text)));assert.equal(JSON.stringify(rt.messages),before);assert.equal(rt.writes.length,0);
 assert.equal(rt.ctx.voiceDialogueRows(Array(100).fill(rt.messages[0])).length,10);
 assert.equal(rt.ctx.voiceDialogueRows([{...rt.messages[0],hidden:true}]).length,0);
 console.log('Voice source: lazy read RPC, API story annotations, bounded window and hidden/HUD/tracker exclusions passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
