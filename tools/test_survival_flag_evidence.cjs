const assert = require('node:assert/strict'), fs = require('node:fs');
const {runtime, hud} = require('./test_panel_tracking.cjs');
const r = runtime(process.env.SURVIVAL_BASELINE), c = r.ctx;
const flags = ['ate','drank','slept','rested'];
function msg(prose, survival = {ate:true}, id = 'one', minute = '08:00') {
 return {id,role:'assistant',swipe_id:0,content:hud('Study',minute).split('***')[0]+'***\n'+prose,
 metadata:{rpg_companion:{swipes:{0:{survival}}}}};
}
function evidence(m) { return c.survivalFlagReading(m,c.getSwipeData(m)); }
function read(m) { return evidence(m).survival; }
function check(prose, flag, expected) {
 const m=msg(prose,{[flag]:true,mood:'focused',mind:'calm',stress:2,sanity:95,xp:4,spells:['Spark'],got:['Key'],lost:[],abilities:[]}), before=JSON.stringify(m);
 const raw=c.getSwipeData(m),y=read(m); assert.equal(y[flag],expected,prose);
 const html=c.statesPanelHtml({d:raw,survivalSource:c.survivalSourceDescriptor(m,raw)},c.parseHud(m.content),m.id);
 assert.equal(/This reply<\/span><span>[^<]+/.test(html),expected,'Rendered action: '+prose);
 assert.equal((y.unconfirmed||[]).includes(flag),!expected,prose);
 for(const k of ['mood','mind','stress','sanity','xp','spells','got','lost','abilities']) assert.deepEqual(y[k],m.metadata.rpg_companion.swipes[0].survival[k]);
 assert.equal(JSON.stringify(m),before);
}
for(const [flag,prose] of [['ate','You ate a meal.'],['drank','You drank water.'],['slept','You slept overnight.'],['rested','You sat down to catch your breath.']]) check(prose,flag,true);
for(const flag of flags) check('You speak to the instructor in the study.',flag,false);
for(const prose of ["You didn't eat.",'You did not eat food.','You refused the food.','You went without eating.','You skipped the meal.']) check(prose,'ate',false);
check("You didn't fight, but you ate bread.",'ate',true);
check('The waterfall shines. Water magic fills the air.','drank',false);
check('You refused the wine.','drank',false);check('You did not sleep in bed.','slept',false);check('Without resting, you left.','rested',false);
for(const [flag,prose] of [['ate','Você comeu pão.'],['drank','Você bebeu chá.'],['slept','Você dormiu.'],['rested','Você descansou.'],['ate','Comió pan.'],['drank','Bebió té.'],['slept','Durmió.'],['rested','Descansó.'],['ate','Он поел суп.'],['drank','Он выпил чай.'],['slept','Он спал.'],['rested','Он отдохнул.'],['ate','Ekmek yedi.'],['drank','Su içti.'],['slept','Uyudu.'],['rested','Dinlendi.']]) check(prose,flag,true);
for(const prose of ['Não comeu comida.','No comió pan.','Он не ел хлеб.']) check(prose,'ate',false);
// HUD, inline reasoning, separate reasoning and tracker text cannot confirm flags.
const excluded=msg('You speak quietly.\n<rpg_companion>{"you":{"mood":"ate food"}}</rpg_companion>');
excluded.content='<think>You ate breakfast.</think>\n'+excluded.content.replace('Equipment:','Breakfast: food\nEquipment:');
excluded.extra={reasoning:'You ate breakfast.'};assert.equal(read(excluded).ate,false);
check('You speak.\n```json\n{"you":{"mood":"ate food"}}\n```','ate',false);
for(const prose of ['You break his guard.','You recover your balance.','You recovered your footing.','You are recovering your balance.','Você recuperou o equilíbrio.','Recuperó el equilibrio.','Он восстановился после удара.','Toparlandı.']) check(prose,'rested',false);
for(const prose of ['You sat down.','You rested.','You took a short break.','You take a break.','You caught your breath.']) check(prose,'rested',true);

const cached=msg('You speak.');const first=evidence(cached);assert.equal(evidence(cached),first);
cached.content=cached.content.replace('You speak.','You ate soup.');assert.equal(read(cached).ate,true);
cached.swipe_id=1;cached.metadata.rpg_companion.swipes[1]={survival:{ate:true}};cached.content=cached.content.replace('You ate soup.','You speak.');assert.equal(read(cached).ate,false);
const base=msg('You begin the day.',{},'start','08:00'),falseFlags=msg('You talk in the study.',{ate:true,drank:true,slept:true,rested:true},'false','18:00');
const tl=c.hmsTimeline([base,falseFlags]),cfg={...c.hmsCfg(),survival:{...c.hmsCfg().survival,enabled:true,fatigue:true,hunger:true,thirst:true}},now=tl.at(-1).clock;
let sv=c.hmsSurvival(tl,{},cfg,null);assert.equal(sv.events.length,0);
for(const t of sv.tracks) assert.equal(t.minutes,600,t.id);
sv=c.hmsSurvival(tl,{survival:{log:flags.map(kind=>({kind,at:now}))}},cfg,null);
assert.equal(sv.events.filter(e=>e.src==='you').length,4);for(const t of sv.tracks)assert.equal(t.minutes,0,t.id);
(async()=>{
 // Old, unsaved data stays raw in the generic getter but both consumers filter it.
 const before=JSON.stringify([base,falseFlags]);
 assert.equal(c.getSwipeData(falseFlags).survival.ate,true);
 c.statesFill('legacy-read',[base,falseFlags]);
 const state=await c.getStatesFor('legacy-read',falseFlags.id);
 const html=c.statesPanelHtml(state,c.parseHud(falseFlags.content),falseFlags.id);
 assert(!html.includes('>This reply</span>'));
 assert.equal(c.hmsSurvival(c.hmsTimeline([base,falseFlags]),{},cfg,null).events.length,0);
 assert.equal(JSON.stringify([base,falseFlags]),before);assert.equal(r.writes.length,0);
 // Acceptance saves rejected originals additively, never edits narrative.
 r.messages.push(msg('You speak.',{ate:true},'saved'));
 await c.setSwipeData('test',r.messages[0],{survival:{ate:true,mood:'calm'}});
 const saved=r.messages[0].metadata.rpg_companion.swipes[0].survival;
 assert.equal(saved.ate,false);assert.deepEqual(Array.from(saved.unconfirmed),['ate']);assert.equal(saved.mood,'calm');
 // The original true claim remains recoverable from unconfirmed on an explicit re-save.
 const oldReport=r.messages[0].metadata.rpg_companion.swipes[0],oldBytes=JSON.stringify(oldReport);
 r.messages[0].content=r.messages[0].content.replace('You speak.','You ate soup.');
 assert.equal(c.getSwipeData(r.messages[0]),null,'Edited content rejects the stale signed report before re-save');
 await c.setSwipeData('test',r.messages[0],oldReport);
 const recovered=c.getSwipeData(r.messages[0]);
 assert.equal(recovered.survival.ate,true);assert.deepEqual(Array.from(recovered.survival.unconfirmed),[]);
 assert.equal(recovered.survival.mood,'calm');assert.equal(JSON.stringify(oldReport),oldBytes);
 c.statesFill('reconfirmed',[r.messages[0]]);
 const recoveredState=await c.getStatesFor('reconfirmed',r.messages[0].id);
 assert(/This reply<\/span><span>[^<]*\bate\b/.test(c.statesPanelHtml(recoveredState,c.parseHud(r.messages[0].content),r.messages[0].id)));
 assert(c.hmsSurvival(c.hmsTimeline(r.messages),{},cfg,null).events.some(e=>e.kind==='ate'&&e.src==='story'));

 for(const kind of flags) await c.hmsSurvivalLog('test',{op:'add',kind});
 const st=await c.getChatState('test');assert.equal(st.survival.log.length,4);
 const file=process.argv[2];if(file){
  const bytes=fs.readFileSync(file),j=JSON.parse(bytes);assert.equal(j.messages.length,39);const report=[];
  for(const i of [4,8,10,12,28,38]){
   const m={...j.messages[i],role:'assistant'},before=JSON.stringify(m),raw=c.getSwipeData(m),d=c.survivalFlagReading(m,raw);assert(d?.survival);
   assert.equal(m.index_in_chat,i);assert.equal(m.is_user,false);
   assert.equal(d.survival.ate,i===8,'reply '+i);
   const html=c.statesPanelHtml({d:raw,survivalSource:c.survivalSourceDescriptor(m,raw)},c.parseHud(m.content),m.id);
   assert.equal(/This reply<\/span><span>[^<]*\bate\b/.test(html),i===8,'This reply '+i);
   assert.equal(JSON.stringify(m),before);
   report.push({reply:i,ate:d.survival.ate,unconfirmed:Array.from(d.survival.unconfirmed||[])});
  }
  const chat=j.messages.map(m=>({...m,role:m.is_user?'user':'assistant'}));
  const timeline=c.hmsTimeline(chat),survival=c.hmsSurvival(timeline,{},cfg,null);
  const mealClock=timeline.find(e=>e.msg.id===chat[8].id).clock;
  assert.equal(survival.tracks.find(t=>t.id==='hunger').minutes,timeline.at(-1).clock-mealClock);
  assert(bytes.equals(fs.readFileSync(file)));console.log(JSON.stringify({messages:39,report,inputUnchanged:true}));
 }
 console.log('Survival evidence: prose, negations, five languages, exclusion, cache/swipe, timers, manual logging and additive acceptance passed');
})().catch(e=>{console.error(e);process.exit(1);});
