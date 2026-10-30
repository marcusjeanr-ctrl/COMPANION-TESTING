// Investigation only: these assertions document existing behaviour, not a fix.
const assert=require('node:assert/strict');
const {runtime,hud}=require('./test_panel_tracking.cjs');
const r=runtime(),c=r.ctx;
const goal={name:'Yard Challenge',objective:'Beat Cassian or force him to acknowledge equality',giver:'Aurelius King',where:'Training Yard',category:'personal',state:'active'};
function message(id,quests,now,body){
 const data=c.parseCompanion('<rpg_companion>'+JSON.stringify({characters:[{name:'Aurelius King'},{name:'Cassian'}],quests,plot:{now}})+'</rpg_companion>');
 const content=hud('Training Yard','09:00')+'\n'+body;
 return {id,role:'assistant',content,swipe_id:0,metadata:{rpg_companion:{swipes:{0:data},sources:{0:c.readingSource(content)}}}};
}
const start=message('start',[goal],'The challenge begins.','Aurelius assigns the Yard Challenge.');
const ending=message('end',[],'Marcus has beaten Cassian in the spar.','Marcus defeats Cassian. Cassian acknowledges him as an equal. The sparring session ended.');
const before=JSON.stringify([start,ending]);
assert.equal(c.questDetailsLatest([start,ending])[0].cls,'active','Reproduction: won/beaten does not enter the ending-word gate');
const explicitEnd=message('end2',[],'The sparring session ended.','Marcus defeats Cassian. Cassian acknowledges him as an equal. The sparring session ended.');
assert.equal(c.questDetailsLatest([start,explicitEnd])[0].cls,'active','Reproduction: a generic objective does not meet the final-exchange guard');
const explicitProseOnly=message('prose-only',[],'Marcus rests in the courtyard.','The Yard Challenge completed.');
assert.equal(c.questDetailsLatest([start,explicitProseOnly])[0].cls,'active','Reproduction: explicit named prose is ignored without an ending word in plot.now');
const named=message('end3',[],'The Yard Challenge completed.','The Yard Challenge completed.');
assert.equal(c.questDetailsLatest([start,named])[0].cls,'done','Existing explicit named completion works');
const reported=message('end4',[{...goal,state:'completed'}],'The spar ends.','The Yard Challenge is completed.');
assert.equal(c.questDetailsLatest([start,reported])[0].cls,'done','Existing explicit tracker lifecycle works');
assert.equal(JSON.stringify([start,ending]),before);assert.equal(r.writes.length,0);
console.log('Quest completion investigation: reproduced two existing conservative closure gates; explicit named/reported completion passes. No Quest logic changed.');
if(process.env.COMPANION_QUEST_COMPLETION_EXPORT){
 const fs=require('node:fs');const raw=JSON.parse(fs.readFileSync(process.env.COMPANION_QUEST_COMPLETION_EXPORT,'utf8'));
 const chat=(Array.isArray(raw)?raw:raw.messages).map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')}));
 c.companionMarkTurnPurposes(chat);const rows=c.questDetailsLatest(chat),last=chat.filter(m=>m.role==='assistant').at(-1),data=c.getSwipeData(last);
 console.log(JSON.stringify({privateExport:true,messages:chat.length,questCount:rows.length,states:rows.map(q=>q.cls),finalPlotEntersSceneClosure:/\b(?:dismissed|concluded|completed|finished|ended|failed|succeeded)\b/i.test(data?.plot?.now||'')}));
}
