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
