const assert=require('node:assert/strict');
const {runtime,hud,seed}=require('./test_panel_tracking.cjs');
const tests=[],test=(name,fn)=>tests.push([name,fn]);
const setup=()=>runtime(process.env.COMPANION_QUEST_BASELINE);
const root={name:'Prove Yourself Against Cassian',objective:'Defeat Cassian or force him to acknowledge Marcus as an equal',giver:'Aurelius Veyrath',where:'Veyrath Hall courtyard',reward:"A meeting with Paul Greyrat's son",category:'personal',state:'active',progress:null};
const variants=[root,
 {...root,name:'Meeting the Greyrat prodigy',objective:'Defeat or match Cassian in the yard',reward:"An arranged meeting with Paul Greyrat's son"},
 {...root,name:"The Father's Condition",objective:'Win or draw the spar against Cassian'},
 {...root,name:"The Yard's Price",objective:'Dominate the spar',progress:20},
 {...root,name:'Veyrath Trial',objective:'Prove skill to Aurelius',reward:"Meeting with Paul's son",progress:60},
 {...root,name:"Aurelius's Test",objective:'Prove himself in the spar against Cassian'},
 {...root,name:"The Prodigy's Meeting",objective:'Prove worth to Aurelius to meet Rudeus',where:'Veyrath Hall',reward:'Introduction to Rudeus Greyrat'}];
function msg(c,id,quests,{day=8,time='08:50',body='Cassian tests Marcus in the courtyard. Aurelius watches the same spar.',now='Marcus continues the spar with Cassian under Aurelius.',people=['Cassian Veyrath','Aurelius Veyrath'],inline=false}={}){
 const content=hud('Veyrath Hall courtyard',time).replace('Day 8','Day '+day)+'\n'+body;
 const raw={characters:people.map(name=>({name})),quests,plot:{now}};
 if(inline)return{id,role:'assistant',swipe_id:0,content:content+'\n<rpg_companion>'+JSON.stringify(raw)+'</rpg_companion>'};
 const data=c.parseCompanion('<rpg_companion>'+JSON.stringify(raw)+'</rpg_companion>');
 return{id,role:'assistant',swipe_id:0,content,extra:{spindle_metadata:{rpg_companion:{swipes:{0:data},sources:{0:c.readingSource(content)}}}}};
}
function history(c){return variants.map((q,i)=>msg(c,'q'+i,[q],i===6?{body:'Cassian lowers his sword. Aurelius says: "The Greyrat boy is an anomaly. Meeting the Greyrat boy is not automatic. If you maintain this edge, I will arrange the introduction."',now:'Marcus has beaten Cassian in the spar and requested a meeting with Rudeus Greyrat.'}:{}));}
function panel(c,chat,state=c.emptyChatState()){return c.hmsPanelState('test',chat,state);}
test('Full seven-label progression and persisted replay retain one canonical quest through the final reply',()=>{
 const c=setup().ctx,chat=history(c),before=JSON.stringify(chat);
 for(let i=1;i<=chat.length;i++){
  const qs=c.questDetailsLatest(chat.slice(0,i));assert.equal(qs.length,1,'prefix '+i);assert.equal(qs[0].key,root.name.toLowerCase());
 }
 const result=panel(c,JSON.parse(JSON.stringify(chat)));
 assert.equal(result.systems.quests.length,1);const q=result.systems.quests[0];assert.equal(q.progress,60);assert.equal(q.objective,root.objective);
 for(const v of variants.slice(0,-1))assert(q.questAliases.includes(v.name),v.name);
 assert.equal(JSON.stringify(chat),before);
});
test('Known quest IDs are offered to the existing tracker and survive parsing, saving and arbitrary renaming',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;r.messages.push(msg(c,'root',[root]));
 const prompt=c.buildCompanionInstruction({},'Marcus King',{},c.emptyChatState(),r.messages,true);
 assert(prompt.includes('"id"'),'Quest schema must request a stable reference');assert(prompt.includes('Known quest IDs'));assert(prompt.includes(root.name.toLowerCase()));
 const report=c.questNormalize([{...root,id:root.name.toLowerCase(),name:'An unexpected label',objective:'Demonstrate continued competence',progress:70}])[0];
 assert.equal(report.questId,root.name.toLowerCase());
 assert(c.questReferenceMatch(c.questNormalize([root])[0],c.questNormalize([{...variants[1],id:root.name.toLowerCase()}])[0],[]),'Equivalent alternatives keep the referenced target');
 r.messages.push(msg(c,'latest',[{...root,id:root.name.toLowerCase(),name:'An unexpected label',objective:'Demonstrate continued competence',progress:70}]));
 assert.equal(c.questDetailsLatest(r.messages).length,1);
 r.response({characters:[{name:'Cassian Veyrath'}],quests:[{...root,id:root.name.toLowerCase(),name:'Another presentation label',objective:'Continue the established test',progress:80}]});
 await c.runSeparateUpdate('test','latest');assert.equal(c.getSwipeData(r.messages[1]).quests[0].questId,root.name.toLowerCase());assert.equal(c.questDetailsLatest(r.messages).length,1);
});
test('A shared giver, location and reward cannot combine independent tasks or targets',()=>{
 for(const q of [{...root,name:'Escort',objective:'Escort the courier to the city'}, {...root,name:'Different opponent',objective:'Defeat Arden'}, {...root,name:'Extra constraint',objective:'Dominate the spar without magic'}, {...root,name:'Another round',objective:'Dominate the second spar'}, {...variants[4],giver:'Other Teacher'}, {...variants[4],where:'East Hall courtyard'}, {...variants[4],reward:'A bag of silver'}]){
  const c=setup().ctx;assert.equal(c.questDetailsLatest([msg(c,'a',[root]),msg(c,'b',[q])]).length,2,q.name);
 }
});
test('Separate assignments, concurrent same-reward tasks and ambiguous shortened rewards are preserved',()=>{
 const c=setup().ctx,other={...root,name:'Other test',objective:'Defeat Cassian or demonstrate expertise',reward:"A meeting with Paul Stone's son"};
 const chat=[msg(c,'a',[root,other]),msg(c,'b',[variants[4]])];assert.equal(c.questDetailsLatest(chat).length,3,'Ambiguous Paul cannot choose a family');
 const separate=[msg(c,'a',[root]),msg(c,'b',[variants[3]],{body:'Aurelius assigns a second quest: dominate the spar. Cassian watches.'})];
 assert.equal(panel(c,separate).systems.quests.length,2);
 const nextDay=[msg(c,'a',[root]),msg(c,'b',[variants[3]],{day:9})];assert.equal(c.questDetailsLatest(nextDay).length,2,'No unsupported cross-day legacy linking');
});
test('Stable references reject incompatible ownership, rewards, terminal reactivation and explicit new tasks',()=>{
 for(const change of [{giver:'Other Teacher'},{where:'East Hall courtyard'},{reward:'An unrelated bag of gold'},{objective:'Win without magic'},{objective:'Defeat Arden'}]){
  const c=setup().ctx,q={...variants[3],id:root.name.toLowerCase(),...change};assert.equal(c.questDetailsLatest([msg(c,'a',[root]),msg(c,'b',[q])]).length,2,JSON.stringify(change));
 }
 const c=setup().ctx;assert.equal(c.questDetailsLatest([msg(c,'a',[{...root,state:'completed'}]),msg(c,'b',[{...variants[3],id:root.name.toLowerCase()}])]).length,2);
 const q={...variants[3],id:root.name.toLowerCase()};assert.equal(c.questDetailsLatest([msg(c,'a',[root]),msg(c,'b',[q],{body:'A second quest is assigned: dominate the spar with Cassian.'})]).length,2);
});
test('Visible scene evidence is required; private, quoted or speculative context cannot link unnamed progress',()=>{
 for(const body of ['An unrelated conversation takes place.','> Cassian continues the spar.','```\nCassian continues the spar.\n```','If Cassian were here he could continue the spar.']){
  const c=setup().ctx;assert.equal(c.questDetailsLatest([msg(c,'a',[root]),msg(c,'b',[variants[3]],{body})]).length,2,body);
 }
});
test('Reward references require actual context; siblings do not become the same reward recipient',()=>{
 const c=setup().ctx,a={...root,reward:'Meeting with Lina Vale'},b={...variants[3],reward:'Introduction to Nora Vale'};
 assert.equal(c.questDetailsLatest([msg(c,'a',[a]),msg(c,'b',[b],{body:'Cassian continues the spar. Aurelius will arrange the introduction.'})]).length,2);
 const chat=history(c);chat.at(-1).content=chat.at(-1).content.replace('Greyrat boy','visitor').replace('the introduction','a conversation');chat.at(-1).extra.spindle_metadata.rpg_companion.sources[0]=c.readingSource(chat.at(-1).content);
 assert.equal(c.questDetailsLatest(chat).length,2,'A changed recipient without a source bridge remains separate');
});
test('IDs, progress resets, completion and renewed stages update the same explicitly referenced assignment',()=>{
 const c=setup().ctx,chat=[msg(c,'a',[root]),msg(c,'b',[{...root,id:root.name.toLowerCase(),name:'Next phase',objective:'Demonstrate continued competence',progress:0}],{body:'Cassian continues the test. The next stage of the same assignment begins.'}),msg(c,'c',[{...root,id:root.name.toLowerCase(),name:'Test concluded',objective:'Demonstrate continued competence',state:'completed',progress:100}],{body:'Cassian acknowledges the final result. The assignment is completed.'})];
 assert.equal(c.questDetailsLatest(chat.slice(0,2))[0].progress,0);const rows=c.questDetailsLatest(chat);assert.equal(rows.length,1);assert.equal(rows[0].cls,'done');
});
test('An explicit referenced stage can move location while retaining stage history',()=>{
 const c=setup().ctx,next={...root,id:root.name.toLowerCase(),name:'Harbor stage',objective:'Collect the sealed crate',where:'South Harbor',progress:0};
 const rows=c.questDetailsLatest([msg(c,'a',[root]),msg(c,'b',[next],{body:'The next stage of the same assignment begins at South Harbor: collect the sealed crate.'})]);
 assert.equal(rows.length,1);assert.equal(rows[0].where,'South Harbor');assert.equal(rows[0].objective,'Collect the sealed crate');assert(rows[0].stageHistory.some(s=>s.objective===root.objective));
});
test('A source-confirmed new assignment can reuse a title without reusing the old identity',()=>{
 for(const id of [null,root.name.toLowerCase()]){
 const c=setup().ctx,q={...root,id};
 const chat=[msg(c,'old',[root]),msg(c,'new',[q],{body:'A new quest is assigned: Prove Yourself Against Cassian. This is a separate assignment.'})];
 const rows=c.questDetailsLatest(chat);assert.equal(rows.length,2);assert.notEqual(rows[0].key,rows[1].key);assert.equal(panel(c,chat).systems.quests.length,2);
 }
});
test('A validated ID takes precedence over a reused display label and preserves both assignments',()=>{
 const c=setup().ctx,other={...root,name:'Courier clearance',objective:'Find the missing courier',reward:'A bag of silver'};
 const update={...root,id:root.name.toLowerCase(),name:other.name,objective:'Demonstrate continued competence',progress:70};
 const chat=[msg(c,'a',[root,other]),msg(c,'b',[update])];
 const rows=c.questDetailsLatest(chat);assert.equal(rows.length,2);assert.equal(rows.find(q=>q.key===root.name.toLowerCase()).progress,70);
 const previous=c.getSwipeData(chat[0]).quests, normalized=c.questNormalize([update]);
 assert.equal(c.questRefreshReport(normalized,previous,chat[0],c.getSwipeData(chat[0]))[0].key,root.name.toLowerCase(),'Refresh also prioritizes the validated ID');
 assert.equal(rows.find(q=>q.key===other.name.toLowerCase()).reward,'A bag of silver');assert.equal(panel(c,chat).systems.quests.length,2);
 const last=chat.at(-1);last.content=last.content.replace('Current Arc: Sandbox','Current Arc: Sandbox\nQuest: Courier clearance — Active');
 last.extra.spindle_metadata.rpg_companion.sources[0]=c.readingSource(last.content);
 assert.equal(panel(c,chat).systems.quests.length,2,'An ambiguous bare HUD label cannot replace two canonical assignments');
});
test('The original HUD identity survives more presentation labels than the alias-history cap',()=>{
 const c=setup().ctx,chat=[msg(c,'root',[root])];
 for(let i=0;i<80;i++)chat.push(msg(c,'long-'+i,[{...root,id:root.name.toLowerCase(),name:'Presentation '+i,objective:'Demonstrate continued competence'}]));
 const last=chat.at(-1);last.content=last.content.replace('Current Arc: Sandbox','Current Arc: Sandbox\nQuest: Prove Yourself Against Cassian — Active');
 last.extra.spindle_metadata.rpg_companion.sources[0]=c.readingSource(last.content);
 assert.equal(panel(c,chat).systems.quests.length,1);assert.equal(c.questDetailsLatest(chat)[0].key,root.name.toLowerCase());
});
test('Stable references preserve numeric suffixes rather than using title cleanup',()=>{
 const c=setup().ctx,row={...root,key:'contract #1234'},q={...root,questId:'contract #5678'};
 assert.equal(c.questReferenceMatch(row,q,[]),false,'Distinct IDs cannot share title-normalized identity');
 const saved=msg(c,'opaque',[{...root,id:'contract #1234'}]);
 assert.equal(c.questDetailsLatest([saved])[0].key,'contract #1234');
});
test('Quest ID context is bounded by whole records and excludes discarded branches',()=>{
 const c=setup().ctx,quests=Array.from({length:12},(_,i)=>({...root,name:'Independent task '+i,objective:'Deliver item '+i,where:'Destination '+i}));
 const chat=[msg(c,'old',quests),msg(c,'replace',[{...root,name:'Discarded quest'}]),msg(c,'future',[{...root,name:'Future-only quest'}])];
 const context=c.questIdentityContext(chat.slice(0,1));assert(context.length<=1800);assert(Array.isArray(JSON.parse(context)));
 const prompt=c.buildCompanionInstruction({},'Marcus King',{},c.emptyChatState(),chat,true,{excludeId:'replace'});
 assert(!prompt.includes('Discarded quest'));assert(!prompt.includes('Future-only quest'));
});
test('Saved focus resolves through every historical quest label',()=>{
 const c=setup().ctx,chat=history(c);for(const v of variants){const st=c.emptyChatState();st.questFocus=v.name.toLowerCase();assert.equal(panel(c,chat,st).systems.questFocus,root.name.toLowerCase());}
});
test('An unrelated setting uses the same contract continuity without card-specific names',()=>{
 const c=setup().ctx,a={name:'Dock trial',objective:'Repair the quantum relay',giver:'Chief Arden',where:'Station Meridian, Dock Seven',reward:'Passage to Station Delta',state:'active'};
 const b={...a,name:'Transit approval',objective:'Demonstrate competence to Arden',progress:50};
 const opt={body:'Chief Arden inspects the quantum relay. The repair proceeds under the same test.',now:'The quantum relay repair continues under Arden.',people:['Chief Arden','Technician Sera']};
 assert.equal(c.questDetailsLatest([msg(c,'a',[a],opt),msg(c,'b',[b],opt)]).length,1);
});
test('Same-source refresh retains canonical identity, prior conditions and focus even with one stored reply',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;r.messages.push(msg(c,'only',[root]));
 const bytes=r.messages[0].content;r.response({characters:[{name:'Cassian Veyrath'},{name:'Aurelius Veyrath'}],quests:[variants[3]],plot:{now:'Marcus continues the spar with Cassian under Aurelius.'}});
 await c.runSeparateUpdate('test','only');
 const qs=c.questDetailsLatest(r.messages);assert.equal(qs.length,1);assert.equal(qs[0].key,root.name.toLowerCase());assert.equal(qs[0].objective,root.objective);assert(qs[0].questAliases.includes(root.name));
 assert.equal(r.messages[0].content,bytes);
 r.response({characters:[{name:'Cassian Veyrath'},{name:'Aurelius Veyrath'}],quests:[{...variants[3],id:root.name.toLowerCase(),name:'Tracker presentation',objective:'Demonstrate continued competence',progress:0}],plot:{now:'Marcus continues the spar with Cassian under Aurelius.'}});
 await c.runSeparateUpdate('test','only');assert.equal(c.questDetailsLatest(r.messages)[0].key,root.name.toLowerCase());assert.equal(c.questDetailsLatest(r.messages)[0].progress,0);
});
test('Refresh cannot inherit identity from an edited response or an inactive swipe',async()=>{
 for(const kind of ['edit','swipe']){
  const r=setup(),c=r.ctx;seed(r);r.messages.length=0;r.messages.push(msg(c,'only',[root]));
  if(kind==='edit')r.messages[0].content+=' An edited scene.';else r.messages[0].swipe_id=1;
  r.response({characters:[{name:'Cassian Veyrath'}],quests:[variants[3]],plot:{now:'Marcus continues the spar with Cassian under Aurelius.'}});
  await c.runSeparateUpdate('test','only');assert.equal(c.questDetailsLatest(r.messages)[0].key,variants[3].name.toLowerCase());
 }
});
test('Repeated identical refreshes do not accumulate redundant quest history',()=>{
 const c=setup().ctx,m=msg(c,'same',[root]),data={characters:[{name:'Cassian Veyrath'},{name:'Aurelius Veyrath'}],plot:{now:'Marcus continues the spar with Cassian under Aurelius.'}};
 let previous=c.getSwipeData(m).quests;
 for(let i=0;i<100;i++)previous=c.questRefreshReport(c.questNormalize([variants[3]]),previous,m,data);
 assert.equal(previous[0].identityHistory.length,1);assert.equal(previous[0].key,root.name.toLowerCase());
});
test('A canonical ID survives a legacy report refresh and a reduced-history import',async()=>{
 const r=setup(),c=r.ctx;seed(r);r.messages.length=0;r.messages.push(msg(c,'root',[root]),msg(c,'later',[variants[3]]));
 r.response({characters:[{name:'Cassian Veyrath'},{name:'Aurelius Veyrath'}],quests:[{...variants[3],id:root.name.toLowerCase()}],plot:{now:'Marcus continues the spar with Cassian under Aurelius.'}});
 await c.runSeparateUpdate('test','later');const saved=c.getSwipeData(r.messages[1]).quests[0];assert.equal(saved.questId,root.name.toLowerCase());
 assert.equal(c.questDetailsLatest(JSON.parse(JSON.stringify(r.messages.slice(1))))[0].key,root.name.toLowerCase());
});
test('HUD aliases preserve canonical control IDs rather than minting another display identity',()=>{
 const c=setup().ctx,chat=history(c);chat.at(-1).content=chat.at(-1).content.replace('Current Arc: Sandbox','Current Arc: Sandbox\nQuest: Veyrath Trial — Active; The Yard\'s Price — Active');
 chat.at(-1).extra.spindle_metadata.rpg_companion.sources[0]=c.readingSource(chat.at(-1).content);
 const qs=panel(c,chat).systems.quests;assert.equal(qs.length,1);assert.equal(qs[0].key,root.name.toLowerCase());
});
test('The entire extended sequence stays one quest through automatic Together and Separate delivery',async()=>{
 for(const mode of ['together','separate']){
  const r=setup(),c=r.ctx;seed(r);r.messages.length=0;r.run("settings.generationMode="+JSON.stringify(mode)+"; settings.catchUp=false;");
  const ended=r.run('rpgcGenEnded');let calls=0;r.quiet(()=>calls++);
  const frames=history(c);
  for(let i=0;i<frames.length;i++){
   const frame=frames[i],data=c.getSwipeData(frame),q=variants[i];
   const report={characters:data.characters,quests:[q],plot:data.plot};
   const current={id:frame.id,role:'assistant',swipe_id:0,content:frame.content+(mode==='together'?'\n<rpg_companion>'+JSON.stringify(report)+'</rpg_companion>':'')};
   r.messages.push(current);r.response(report);
   await ended({chatId:'test',messageId:current.id,generationType:'normal'});
   await ended({chatId:'test',messageId:current.id,generationType:'normal',fromPanel:true});
   const state=r.events.filter(e=>e.type==='state'&&e.hms?.systems).at(-1);assert.equal(state.hms.systems.quests.length,1,mode+' turn '+i);
   assert.equal(state.hms.systems.quests[0].key,root.name.toLowerCase());
  }
  assert.equal(calls,mode==='together'?0:variants.length,'No extra calls for identity resolution');
  assert.equal(panel(c,JSON.parse(JSON.stringify(r.messages))).systems.quests.length,1);
 }
});
if(process.argv.includes('--browser-fixture')){const c=setup().ctx,st=c.emptyChatState();st.questFocus='veyrath trial';console.log(JSON.stringify(panel(c,history(c),st)));}
else(async()=>{let failures=0;for(const[name,fn]of tests){try{await fn();console.log('PASS '+name)}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack)}}if(failures)process.exitCode=1;else console.log(tests.length+' quest contract groups passed');})();
