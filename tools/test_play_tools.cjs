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
