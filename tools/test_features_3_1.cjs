const assert = require('node:assert/strict');
const {runtime,hud}=require('./test_panel_tracking.cjs');
function consistency(){
 const r=runtime(),c=r.ctx;
 const chat=[{id:'start',role:'user',content:'Mushoku_Start_Handler\nTouki: inactive at rest'}, {id:'a',role:'assistant',content:hud('Yard','09:00')}, {id:'b',role:'assistant',content:hud('Yard','08:45').replace('Reserve: Full','Reserve: Full | Status: Rested')}];
 const before=JSON.stringify(chat),check=()=>c.consistencyWarnings('test',chat,c.parseHud(chat.at(-1).content),null);
 assert(check().some(w=>w.code==='clock')); assert(check().some(w=>w.code==='start-setting'));
 chat.at(-1).content=chat.at(-1).content.replace('Status: Rested','Status: Fighting');assert(!check().some(w=>w.code==='start-setting'));
 chat.at(-1).content='A quiet scene.';assert(check().some(w=>w.code==='no-hud'));
 r.run('settings.consistencyChecks=false');assert.equal(check().length,0);assert.equal(r.writes.length,0);
 assert(before.includes('09:00'));
 const x=runtime();x.ctx.setLorePool('test',[{id:'rules',key:['Mushoku_Start_Handler'],content:'Touki: inactive at rest'}]);
 assert(x.ctx.consistencyWarnings('test',chat.slice(0,2).concat({id:'c',role:'assistant',content:hud().replace('Reserve: Full','Reserve: Full | Status: Rested')}),x.ctx.parseHud(hud().replace('Reserve: Full','Reserve: Full | Status: Rested')),null).some(w=>w.code==='start-setting'));
}
consistency();
console.log('3.1 feature regressions passed');
function familyLabels(){
 const fs=require('node:fs'),s=fs.readFileSync(require('node:path').join(__dirname,'../dist/frontend.js'),'utf8');
 assert(s.includes("m.known === 'seen' ? 'last seen'"));assert(s.includes("m.known === 'told' ? 'last known'"));assert(s.includes('Last reported activity'));
 const r=runtime(),c=r.ctx;
 const report=characters=>c.parseCompanion('<rpg_companion>'+JSON.stringify({characters,family:characters.length?[{name:'Aurelius King',relation:'father',where:'Study',known:'seen',doing:'Reading'}]:[]})+'</rpg_companion>');
 const a={id:'f1',role:'assistant',content:hud('Study','08:00'),metadata:{rpg_companion:{swipes:{0:report([{name:'Aurelius King'}])}}}};
 const b={id:'f2',role:'assistant',content:hud('Yard','08:30'),metadata:{rpg_companion:{swipes:{0:report([])}}}};
 const input=JSON.stringify([a,b]),family=c.hmsFamilyPanel([a,b],c.emptyChatState()).members[0];
 assert.equal(family.present,false);assert.equal(family.where,'Study');assert.equal(family.since,30);assert.equal(family.doing,'Reading');assert.equal(family.doingNow,false);assert.equal(JSON.stringify([a,b]),input);
}
familyLabels();

function sceneCast(){
 const {seed}=require('./test_panel_tracking.cjs');const r=runtime();seed(r);const c=r.ctx;
 for(const separate of [true,false]){
  const prompt=c.buildCompanionInstruction({characters:[{name:'Aurelius King'},{name:'Seraphina King'}]},'Marcus',{},c.emptyChatState(),r.messages,separate);
  assert(prompt.includes('Present now (check): '));assert(prompt.includes('Seraphina King'));assert(!prompt.includes('Previous panel data:'));
 }
 assert.equal('Present now (check): '.length,'Previous panel data: '.length);
 assert.equal(r.writes.length,0);
}
sceneCast();
function sheetExport(){
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync(require('node:path').join(__dirname,'../dist/frontend.js'),'utf8');
 const part=s.slice(s.indexOf('function characterSheetMarkdown('),s.indexOf('export function setup('));const c=vm.createContext({});vm.runInContext(part,c);
 const view={hms:{hud:{lines:[{text:'Magic Tiers: Water (Advanced)'}]},magic:{list:{schools:[{spells:[{name:'Water Bolt',status:'known'},{name:'Secret Storm',status:'locked'},{name:'Training',status:'study'}]}]}},techniques:{schools:[{spells:[{name:'Blade',status:'mastered'}]}]},systems:{quests:[{name:'Current',cls:'active'},{name:'Finished',state:'completed'},{name:'Retired',state:'closed'}]},family:{members:[{name:'Parent',where:'Study',present:false}]},relations:{people:[{name:'Friend',bond:'ally',standing:'Friendly'}]}}};
 const before=JSON.stringify(view),out=c.characterSheetMarkdown(view);assert(out.includes('Water Bolt'));assert(!out.includes('Secret Storm'));assert(!out.includes('Training'));assert(out.includes('Blade'));assert(out.includes('Finished'));assert(out.includes('Friendly'));assert.equal(JSON.stringify(view),before);assert(c.characterSheetMarkdown({}).includes('No recorded data'));
}
sheetExport();
async function snapshots(){
 const r=runtime(),c=r.ctx,st=c.emptyChatState();st.seed={characters:[{name:'Current'}]};st.xpAdjust=17;st.spellbook=[{name:'Existing'}];
 const stateBefore=JSON.stringify(st);assert.equal(c.trackerSnapshotEdit(st,{op:'restore',id:'missing'}),false);assert.equal(JSON.stringify(st),stateBefore);
 const view={hms:{hud:{lines:[{text:'Past HUD'}]},systems:{quests:[{name:'Old objective',cls:'active'}]}}};
 for(let i=0;i<12;i++)assert(c.trackerSnapshotEdit(st,{op:'save',name:'Before '+i,view}));
 assert.equal(st.trackerSnapshots.length,10);assert.equal(st.trackerSnapshots[0].name,'Before 2');assert.equal(st.seed.characters[0].name,'Current');assert.equal(st.xpAdjust,17);assert.equal(st.spellbook.length,1);assert.equal(r.writes.length,0);
 const id=st.trackerSnapshots[0].id;assert(c.trackerSnapshotEdit(st,{op:'restore',id}));assert.equal(c.trackerSnapshotPanel(st).view.hms.hud.lines[0].text,'Past HUD');
 await c.saveChatState('snap-test',st);const stored=JSON.parse(JSON.stringify(st));assert.equal(c.trackerSnapshotPanel(stored).active,id);
 assert(c.trackerSnapshotEdit(stored,{op:'live'}));assert.equal(c.trackerSnapshotPanel(stored).active,null);assert.equal(c.trackerSnapshotPanel(c.emptyChatState()).list.length,0);
 assert.equal(c.trackerSnapshotEdit(st,{op:'save',name:'Huge',view:{hms:{text:'x'.repeat(300001)}}}),false);
 assert.equal(c.trackerSnapshotEdit(st,{op:'save',name:'',view}),false);
 assert.equal(r.writes.length,0);
}
snapshots().catch(e=>{console.error(e);process.exitCode=1;});
