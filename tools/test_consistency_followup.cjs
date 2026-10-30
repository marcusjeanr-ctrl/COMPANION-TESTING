const assert=require('node:assert/strict');
const {runtime,hud}=require('./test_panel_tracking.cjs');
const r=runtime(),c=r.ctx;
function check(start,content){
 const chat=[{id:'start',role:'user',content:'Mushoku_Start_Handler\n'+start},{id:'reply',role:'assistant',content}];
 const before=JSON.stringify(chat),result=c.consistencyWarnings('test',chat,c.parseHud(content),null);
 assert.equal(JSON.stringify(chat),before);assert.equal(r.writes.length,0);return result;
}
const resting=hud().replace('Reserve: Full','Reserve: Full | Status: Rested');
assert(check('Touki: Available; inactive at rest.',resting).some(w=>w.code==='start-setting'),'Available; inactive at rest must warn against Active while resting');
assert(check('Touki: Available; inactive at rest.','A scene without a world-state block.').some(w=>w.code==='no-hud'));
assert(!check('Touki: Available; inactive at rest.',resting.replace('Status: Rested','Status: Fighting')).some(w=>w.code==='start-setting'));
assert(!check('Touki: Available; inactive at rest.',resting.replace('Touki (Battle Aura): Active','Touki (Battle Aura): Inactive')).some(w=>w.code==='start-setting'));
assert(!check('Touki: Available; inactive at rest.',hud()).some(w=>w.code==='start-setting'),'Unknown rest state is not assumed');
assert(!check('Touki: Available; inactive at rest if wounded.',resting).some(w=>w.code==='start-setting'),'Additional unsupported conditions must not become unconditional rules');
r.run('settings.consistencyChecks=false');assert.equal(check('Touki: Available; inactive at rest.',resting).length,0);
console.log('Consistency fixtures: resting contradiction and missing HUD warn; fighting, matching status, unknown rest, unsupported condition and disabled checker do not. No writes.');
