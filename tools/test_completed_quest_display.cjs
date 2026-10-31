// Display grouping only; optional private export replay never commits or alters input.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {runtime}=require('./test_panel_tracking.cjs');
const source=fs.readFileSync(path.join(__dirname,'../dist/frontend.js'),'utf8'),c=vm.createContext({});
vm.runInContext(source.slice(0,source.indexOf('export function setup')),c);
assert.equal(typeof c.questDisplayGroups,'function','The live card and sheet need a shared display partition');
const cases=[[],[{name:'Active',state:'active',progress:100}],
 [{name:'Active',state:'active'},{name:'First complete',state:'completed'},{name:'Second complete',cls:'done'}],
 [{name:'Only complete',state:'done'}],
 [{name:'Complete',cls:'completed'},{name:'Failed',state:'failed'},{name:'Abandoned',cls:'abandoned'},{name:'Closed',state:'closed'}]];
const expected=[[0,0,0],[1,0,0],[1,2,0],[0,1,0],[0,1,3]];
for(let i=0;i<cases.length;i++){
 const quests=cases[i],before=JSON.stringify(quests),groups=c.questDisplayGroups(quests);
 assert.equal([groups.open.length,groups.completed.length,groups.ended.length].join(','),expected[i].join(','));
 assert.equal(JSON.stringify(quests),before);assert.equal(Object.values(groups).flat().length,quests.length);
 const sheet=c.characterSheetMarkdown({hms:{systems:{quests}}});
 for(const [key,title] of [['open','Open quests'],['completed','Completed quests'],['ended','Other ended quests']]){
  const text=sheet.split('## '+title+'\n')[1].split('\n## ')[0];for(const q of groups[key])assert(text.includes(q.name));
 }
}
const completed={questId:'q_meeting',questAliases:['Original meeting'],name:'A finished introduction',state:'completed',progress:100};
assert.equal(c.objectiveQuestLabel('q_meeting',[completed]),completed.name);
assert.equal(c.questDisplayGroups([completed]).completed[0],completed);
const payloadMode=process.argv.includes('--payload'),file=process.argv.slice(2).find(x=>!x.startsWith('--'));
if(file){
 const bytes=fs.readFileSync(file),data=JSON.parse(bytes),r=runtime();assert.equal(data.messages.length,37,'Expected the supplied 37-message export');
 const chat=data.messages.map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')})),before=JSON.stringify(chat);
 const panel=r.ctx.hmsPanelState('completed-quest-fixture',chat,r.ctx.emptyChatState()),quests=panel.systems.quests,groups=c.questDisplayGroups(quests);
 assert.equal(groups.completed.length,1);assert.equal(groups.completed[0].name,"The Prodigy's Meeting");
 assert(groups.open.some(q=>q.name==='The Greyrat Connection'));
 assert.equal(JSON.stringify(chat),before);assert.equal(r.writes.length,0);assert(bytes.equals(fs.readFileSync(file)));
 const departure=panel.agenda.items.find(x=>x.what==='Depart for Greyrat meeting');assert(departure);assert.equal(departure.displayDueDate,'K417-04-14');assert.equal(departure.dueIn,null);assert.equal(departure.when,'In two days');assert.equal(c.agendaDisplayTiming(departure,panel.systems.clock,panel.hud).status,'upcoming');
 console.log(JSON.stringify(payloadMode?{quests,agenda:panel.agenda,clock:panel.systems.clock,hud:panel.hud,messageCount:chat.length}:{messages:chat.length,completed:groups.completed.length,active:groups.open.length,requiredTargetsCorrect:true,agendaGroupCorrect:true,inputUnchanged:true,writes:0}));
}else console.log('Quest display groups: empty, active, mixed, completed-only, ended states, unchanged input, sheet and completed objective labels passed');
