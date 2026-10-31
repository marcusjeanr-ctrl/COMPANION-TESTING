const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {runtime,hud}=require('./test_panel_tracking.cjs');
const source=fs.readFileSync(path.join(__dirname,'../dist/frontend.js'),'utf8'),c=vm.createContext({});vm.runInContext(source.slice(0,source.indexOf('export function setup')),c);
const clock=216318795,current={lines:[{text:'Armored Dragon Calendar: K417, Month 4, Day 12 | Time: 09:15'}]};
const open={state:'open',status:'unset',when:'In two days',dueAt:null,dueIn:null};
for(const [delta,status] of [[-61,'overdue'],[-60,'soon'],[0,'soon'],[180,'soon'],[181,'upcoming'],[2880,'upcoming']]){
 const input={...open,dueAt:clock+delta},before=JSON.stringify(input),display=c.agendaDisplayTiming(input,clock,current);
 assert.equal(display.status,status);assert.equal(display.delta,delta);assert.equal(JSON.stringify(input),before);
}
assert.equal(c.agendaDisplayTiming({...open,dueAt:clock+30,dueIn:900},clock,current).status,'soon');
assert.equal(c.agendaDisplayTiming({...open,dueIn:30},undefined,current).status,'soon');
for(const [date,status] of [['K417-04-14','upcoming'],['K417-04-12','soon'],['K417-04-11','overdue'],['K418-01-01','upcoming'],['K417-04-31','unset'],['unparseable','unset'],['K417-04-14 09:00','unset']]){
 const input={...open,displayDueDate:date},before=JSON.stringify(input),display=c.agendaDisplayTiming(input,clock,current);
 assert.equal(display.status,status,date);assert.equal(display.delta,null);assert.equal(JSON.stringify(input),before);
}
assert.equal(c.agendaDisplayTiming({...open,when:null},clock,current).status,'unset');
assert.equal(c.agendaDisplayTiming({...open,displayDueDate:'K417-04-14'},clock,null).status,'unset');
assert.equal(c.agendaDisplayTiming({...open,displayDueDate:'2026-04-14'},clock,current).status,'unset');
assert.equal(c.agendaDisplayTiming({...open,displayDueDate:'2026-04-14'},clock,{lines:[{text:'Date: 2026-04-12 | Time: 09:15'}]}).status,'upcoming');
assert.equal(c.agendaDisplayTiming({...open,displayDueDate:'2026-02-29'},clock,{lines:[{text:'Date: 2026-02-28 | Time: 09:15'}]}).status,'unset');
for(const state of ['in_progress','kept','missed','cancelled'])assert.equal(c.agendaDisplayTiming({...open,state,status:state,displayDueDate:'K417-04-14'},clock,current).status,state);

// A source date is an optional UI reference, not a resolved time or tracker field.
function fixture(r){
 const reading=r.ctx.parseCompanion('<rpg_companion>'+JSON.stringify({agenda:[{what:'Depart for meeting',with:'Guard',where:'Gate',when:'In two days',due:'K417-04-14',kind:'meeting',state:'open'}]})+'</rpg_companion>');
 return [{id:'date-only-source',role:'assistant',content:hud().replace('Thawmoon (Month 2), Day 8','Month 4, Day 12')+'\nThe departure is agreed for two days later.',metadata:{rpg_companion:{swipes:{0:reading}}}}];
}
function verify(r){
 const chat=fixture(r),st=r.ctx.emptyChatState(),before=JSON.stringify(chat);
 const request=r.ctx.agendaRequest(chat,st,'Rin');
 const raw=r.ctx.agendaRead(chat,st),panel=r.ctx.hmsAgendaPanel(chat,st),ui=r.ctx.hmsAgendaPanel(chat,st,undefined,true);
 assert.equal(raw.items[0].dueAt,null);assert.equal(panel.items[0].dueIn,null);assert.equal(panel.items[0].status,'unset');assert.equal(panel.items[0].displayDueDate,undefined);
 if(r.ctx===backend.ctx){assert.equal(ui.items[0].displayDueDate,'K417-04-14');assert.equal(ui.items[0].when,'In two days');assert.equal(c.agendaDisplayTiming(ui.items[0],raw.now,current).status,'upcoming');}
 const clean=JSON.parse(JSON.stringify(ui));for(const item of clean.items)delete item.displayDueDate;
 assert.deepEqual(clean,JSON.parse(JSON.stringify(panel)));
 assert.equal(JSON.stringify(r.ctx.agendaRequest(chat,st,'Rin')),JSON.stringify(request));assert.equal(JSON.stringify(chat),before);assert.equal(r.writes.length,0);
 return crypto.createHash('sha256').update(JSON.stringify(request)).digest('hex');
}
const backend=runtime(),digest=verify(backend);
// Filled from the protected pre-fix baseline; guards the observable model request.
const expected='649de72d48f2a8a4c44f27cc6bd41c8da63d340cb7999ca1dbb052c1d1aae00d';
assert.equal(digest,expected,'Agenda report schema or model-facing hints changed');
console.log('Agenda display: numeric thresholds, day-only future/today/past, invalid/unknown clocks, non-open preservation, UI-only provenance and unchanged model hints passed');
module.exports={fixture};
