// Private export replay. Output contains counts only, never the narrative or names.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {runtime}=require('./test_panel_tracking.cjs');
const bytes=fs.readFileSync(process.argv[2]),input=JSON.parse(bytes),r=runtime(process.env.COMPANION_EVIDENCE_BASELINE),c=r.ctx;
const chat=input.messages.map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')}));c.companionMarkTurnPurposes(chat);
const before=JSON.stringify(chat),st=c.emptyChatState();
const reports=chat.filter(m=>m.role==='assistant').map(m=>c.getSwipeData(m)).filter(Boolean);
assert.equal(chat.length,7);assert.equal(reports.length,3);
const agenda=c.agendaRead(chat,st);const positive=c.spellKnown(chat,st);
assert.equal(agenda.items.length,process.env.COMPANION_EVIDENCE_BASELINE?2:1);
if(!process.env.COMPANION_EVIDENCE_BASELINE) {
 assert(agenda.items[0].reschedules.length>0);assert.equal(agenda.items[0].dueAt,null);
 assert.equal(c.agendaRead(JSON.parse(JSON.stringify(chat)),st).items.length,1);
}
// The saved extraction omitted all ability evidence. Do not invent a successful
// provider re-extraction or reinterpret a free-prose journal with a name regex.
assert.equal(positive.size,0);assert(reports.every(d=>(d.survival?.spells||[]).length===0));
assert.equal(JSON.stringify(chat),before);assert(bytes.equals(fs.readFileSync(process.argv[2])));
console.log(JSON.stringify({messages:chat.length,readableReports:reports.length,agenda:agenda.items.length,
 savedAbilityKnowledge:positive.size,abilityRefreshRequiresProvider:true,quests:c.questDetailsLatest(chat).length,
 family:c.famRead(chat,st).members.length,sourceUnchanged:true,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}));
