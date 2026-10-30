const assert = require('node:assert/strict');
const {runtime,hud}=require('./test_panel_tracking.cjs');
function consistency(){
 const r=runtime(),c=r.ctx;
 const chat=[{id:'start',role:'user',content:'Mushoku_Start_Handler\nTouki: inactive at rest'}, {id:'a',role:'assistant',content:hud('Yard','09:00')}, {id:'b',role:'assistant',content:hud('Yard','08:45').replace('Reserve: Full','Reserve: Full | Status: Rested')}];
 const before=JSON.stringify(chat),check=()=>c.consistencyWarnings('test',chat,c.parseHud(chat.at(-1).content),null);
 assert(check().some(w=>w.code==='clock')); assert(check().some(w=>w.code==='start-setting'));assert.equal(JSON.stringify(chat),before);
 chat.at(-1).content=chat.at(-1).content.replace('Status: Rested','Status: Fighting');assert(!check().some(w=>w.code==='start-setting'));
 chat.at(-1).content='A quiet scene.';assert(check().some(w=>w.code==='no-hud'));
 r.run('settings.consistencyChecks=false');assert.equal(check().length,0);assert.equal(r.writes.length,0);
 assert(before.includes('09:00'));
 const dated=structuredClone(chat);dated.at(-1).content=hud('Yard','09:00').replace('Day 8','Day 7');r.run('settings.consistencyChecks=true');assert(c.consistencyWarnings('test',dated,c.parseHud(dated.at(-1).content),null).some(w=>w.code==='clock'));
 const other=runtime();other.ctx.setLorePool('other',[{id:'generic-start',key:['Other_RPG_Start_Handler'],content:'Shield: disabled'}]);const otherChat=[{id:'u',role:'user',content:'  Other_RPG_Start_Handler  '},{id:'a',role:'assistant',content:hud()+'\n'}];otherChat[1].content=otherChat[1].content.replace('Touki (Battle Aura): Active','Shield: enabled');assert(other.ctx.consistencyWarnings('other',otherChat,other.ctx.parseHud(otherChat[1].content),null).some(w=>w.code==='start-setting'));
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
  assert(prompt.includes('Cast to check: ['));assert(prompt.includes('In order: '));assert(prompt.includes('Seraphina King'));assert(!prompt.includes('Previous panel data:'));
 }
 for(const rows of [[{name:'Only'}],[{name:'A',details:{Position:'By the door'}},{name:'B'}]]) {
  const next='\nCast to check: '+JSON.stringify(rows.map(r=>r.name))+'\nIn order: '+JSON.stringify(rows.map(({name,...rest})=>rest));
  assert(next.length<='\nPrevious panel data: '.length+JSON.stringify(rows).length);
 }
 assert.equal(r.writes.length,0);
}
sceneCast();
function sheetExport(){
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync(require('node:path').join(__dirname,'../dist/frontend.js'),'utf8');
 const part=s.slice(s.indexOf('function characterSheetMarkdown('),s.indexOf('export function setup('));const c=vm.createContext({});vm.runInContext(part,c);
 const view={hms:{hud:{lines:[{text:'Magic Tiers: Water (Advanced)'}]},magic:{list:{schools:[{spells:[{name:'Water Bolt',status:'known'},{name:'Secret Storm',status:'locked'},{name:'Training',status:'study'}]}]}},techniques:{schools:[{spells:[{name:'Blade',status:'mastered'}]}]},systems:{quests:[{name:'Current',cls:'active'},{name:'Finished',state:'completed'},{name:'Retired',state:'closed'}]},family:{members:[{name:'Parent',where:'Study',present:false}]},relations:{people:[{name:'Friend',bond:'ally',standing:'Friendly'}]}}};
 const before=JSON.stringify(view),out=c.characterSheetMarkdown(view);assert(out.includes('Water Bolt'));assert(!out.includes('Secret Storm'));assert(!out.includes('Training'));assert(out.includes('Blade'));assert(out.includes('Finished'));assert(out.includes('Friendly'));assert.equal(JSON.stringify(view),before);assert(c.characterSheetMarkdown({}).includes('No recorded data'));assert(c.characterSheetMarkdown({hms:{magic:{spellbook:[{name:'Uncatalogued known spell'}]}}}).includes('Uncatalogued known spell'));
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
function webProjection(){
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync(require('node:path').join(__dirname,'../dist/frontend.js'),'utf8');
 const part=s.slice(s.indexOf('function relationshipWebData('),s.indexOf('// Read-only export;'));const c=vm.createContext({});vm.runInContext(part,c);
 const people=Array.from({length:30},(_,i)=>({key:'p'+i,name:'Person '+i,feel:{p:'anger'},pairs:[{you:true},{to:'p'+((i+1)%30)}]}));
 const before=JSON.stringify(people),web=c.relationshipWebData({people},'Player');assert.equal(web.nodes.length,20);assert.equal(web.omitted,11);assert(web.links.length<=80);assert(web.links.every(l=>web.nodes.some(n=>n.key===l.to)));assert(web.links.some(l=>l.color==='#dc5252'));assert.equal(JSON.stringify(people),before);
 assert.equal(c.relationshipWebData(null).nodes.length,1);
}
webProjection();
function canonEvidence(){
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync(require('node:path').join(__dirname,'../dist/frontend.js'),'utf8');const c=vm.createContext({});
 vm.runInContext(s.slice(s.indexOf('function canonDivergenceRows('),s.indexOf('// Bounded projection of existing Minds')),c);
 const saga={personalArc:'Sandbox — personal story',arcs:[{year:400,title:'Old reference arc'}],events:[{name:'A',state:'occurred',detail:'Actually happened'},{name:'B',state:'changed',detail:'Explicit change'},{name:'C',state:'prevented',detail:'Explicit prevention'},{name:'D',state:'predicted',detail:'Rumor'}]};
 const hud={lines:[{text:'Next Canon Event: Future event — in 1 month'}]};const before=JSON.stringify({saga,hud});
 const rows=c.canonDivergenceRows(saga,hud);assert.equal(rows.length,4);assert.equal(rows[0].state,'passed');assert.equal(rows[1].state,'changed');assert.equal(rows[2].state,'skipped');assert.equal(rows[3].state,'pending');assert.equal(rows[3].name,'Future event');assert.equal(JSON.stringify({saga,hud}),before);assert(!rows.some(r=>r.name==='Old reference arc'));
 assert.equal(c.canonDivergenceRows({personalArc:'Canon',events:saga.events},hud).length,0);assert.equal(c.canonDivergenceRows({personalArc:'Sandbox'}, {lines:[{text:'Next Canon Event: None'}]}).length,0);
}
canonEvidence();
function compactLayout(){
 const fs=require('node:fs'),s=fs.readFileSync(require('node:path').join(__dirname,'../dist/frontend.js'),'utf8');
 assert(s.includes('function renderMobilePinned()'));assert(s.includes('rpgc-compact-mobile .rpgc-mobile-pinned{position:sticky'));assert(s.includes('Who is here'));assert(s.includes('Compact mobile layout'));
}
compactLayout();
function snapshotCatalogueBudget(){
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync(require('node:path').join(__dirname,'../dist/frontend.js'),'utf8');
 const c=vm.createContext({clone:x=>structuredClone(x)});
 vm.runInContext(s.slice(s.indexOf('function trackerSnapshotCapture('),s.indexOf('// Read-only export;')),c);
 const hms={magic:{list:{schools:[{name:'Water',spells:[{name:'Known spell',status:'known'},...Array.from({length:1000},(_,i)=>({name:'Reference '+i,status:'locked',effect:'x'.repeat(1000)}))]}]}},techniques:{schools:[{spells:[{name:'Training',status:'study'},{name:'Locked',status:'locked'}]}]}};
 const before=JSON.stringify(hms),captured=c.trackerSnapshotCapture(hms);assert.equal(captured.hms.magic.list.schools[0].spells.length,1);assert.equal(captured.hms.techniques.schools[0].spells.length,1);assert(JSON.stringify(captured).length<300000);assert.equal(JSON.stringify(hms),before);
}
snapshotCatalogueBudget();
async function snapshotReload(){
 const r=runtime(),c=r.ctx,records=new Map();let storageWrites=0;
 c.spindle.storage.setJson=async(k,v)=>{records.set(k,structuredClone(v));storageWrites++};
 c.spindle.storage.getJson=async(k,options)=>records.has(k)?structuredClone(records.get(k)):options?.fallback??null;
 const st=c.emptyChatState();st.xpAdjust=37;st.spellbook=[{name:'Established'}];st.family={pins:{mother:{where:'Study'}}};
 c.trackerSnapshotEdit(st,{op:'save',name:'Before travel',view:{hms:{hud:{lines:[{text:'Past yard'}]}}}});
 c.trackerSnapshotEdit(st,{op:'restore',id:st.trackerSnapshots[0].id});await c.saveChatState('reload',st);
 r.run("chatStateCache.delete('reload')");const loaded=await c.getChatState('reload');assert.equal(c.trackerSnapshotPanel(loaded).active,'tracker-snapshot-1');assert.equal(loaded.xpAdjust,37);assert.equal(loaded.spellbook[0].name,'Established');assert.equal(loaded.family.pins.mother.where,'Study');assert.equal(storageWrites,2);assert.equal(r.writes.length,0);
}
snapshotReload().catch(e=>{console.error(e);process.exitCode=1;});
