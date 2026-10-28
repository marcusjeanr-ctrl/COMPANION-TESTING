// Whole-pipeline contracts. All conversations and entities here are synthetic.
const assert=require('node:assert/strict');
const {runtime,hud,seed}=require('./test_panel_tracking.cjs');
const c=runtime(process.env.COMPANION_3_BASELINE).ctx,tests=[],test=(n,f)=>tests.push([n,f]);
function msg(id,fields,scene='The assignment remains accepted.') {const content=hud('Hall','08:00',true)+'\n'+scene;return {id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:fields},sources:{0:c.readingSource(content)}}}};}
const a={name:'The Northern Aqueduct',objective:'Go to the northern aqueduct, diagnose the moving water table, fix nothing until the cause is known',giver:'Tutor Vale',where:"Vale Hall's northern lands, Highplain",deadline:'Before market day',progress:null};
const b={...a,name:'Northern Aqueduct Diagnosis',objective:'Ride to the northern aqueduct, read the ground along the line, determine why the water table is moving — diagnose only, fix nothing',where:'The northern aqueduct, Vale Hall lands'};
test('Assignment label refinements retain one stable key, aliases, reward and legitimate stage reset',()=>{
 const rows=c.questDetailsLatest([msg('a',{quests:[{...a,reward:'A signed recommendation',progress:40}]}),msg('b',{quests:[{...b,progress:0}]})]);assert.equal(rows.length,1);assert.equal(rows[0].key,c.questKey(a.name));assert.equal(rows[0].progress,0);assert.equal(rows[0].reward,'A signed recommendation');assert(rows[0].questAliases.includes(a.name));
 const p=c.hmsPanelState('universal3',[msg('a',{quests:[a]}),msg('b',{quests:[b]})],c.emptyChatState());assert.equal(p.systems.quests.length,1);
});
test('Related but different actions, owners, destinations, negation and ambiguous partials remain distinct',()=>{
 for(const change of [{giver:'Other Tutor'},{name:'Northern Aqueduct Repair',objective:'Repair the northern aqueduct'},{where:'Distant Hall northern lands'},{objective:'Do not diagnose the northern aqueduct'},{objective:'Diagnose the northern aqueduct after the flood'},{objective:'Diagnose the northern aqueduct with a different instrument'}])assert.equal(c.questMatch(a,{...b,...change}),false,JSON.stringify(change));
 const rows=c.questDetailsLatest([msg('a',{quests:[a,{...a,name:'Other Aqueduct',where:'Distant Hall'}]}),msg('b',{quests:[{...b,giver:null,where:null}]})]);assert.equal(rows.length,3);
});
test('Explicit quest lifecycle survives parser/storage/panel without progress-driven completion',async()=>{
 for(const [state,cls] of [['completed','done'],['failed','failed'],['abandoned','failed'],['active','active']]){
  const parsed=c.questNormalize([{...a,state,progress:state==='active'?100:null}]);assert.equal(parsed[0].cls,cls);const p=c.hmsPanelState('life',[msg(state,{quests:parsed})],c.emptyChatState());assert.equal(p.systems.quests[0].cls,cls);
 }
 const rt=runtime(process.env.COMPANION_3_BASELINE);seed(rt,true);rt.response({quests:[{...a,state:'failed'}]});await rt.ctx.runSeparateUpdate('test');assert.equal(rt.ctx.getSwipeData(rt.messages[1]).quests[0].state,'failed');
});
test('Uncertain ownership and commitments never become inventory, money, objectives or completed quests',()=>{
 assert.equal(c.reportSpeculative({uncertain:true}),true);
 assert.equal(c.gearNormalize([{item:'Key',state:'held',uncertain:true}]),null);
 assert.equal(c.moneyNormalize([{kind:'income',amount:20,currency:'gold',uncertain:true}]),null);
 assert.equal(c.questNormalize([{...a,state:'completed',uncertain:true}]),null);
 assert.equal(c.objectivesNormalize([{text:'Find the key',state:'done',uncertain:true}]),null);
 assert.equal(c.simLearnedNormalize([{who:'Tutor',fact:'The room is empty',how:'told',sure:'certain',uncertain:true}])[0].sure,'unsure');
});
test('Secret projection uses canonical NPC identity and refuses ambiguous first names',()=>{
 const people=[{name:'Alex South',feel:{p:'joy'}},{name:'Alex North',feel:{p:'joy'}}];
 function check(knownBy){return c.hmsPanelState('privacy3',[msg('secret',{minds:people,secrets:[{text:'A private player fact',whose:'user',mine:true,knownBy:[knownBy],how:'Told privately'}]})],c.emptyChatState()).minds.people;}
 let p=check('Alex North');assert(!p.find(x=>x.name==='Alex South').knows.some(x=>x.secretKey));assert(p.find(x=>x.name==='Alex North').knows.some(x=>x.secretKey));
 p=check('Alex West');assert(p.every(x=>!x.knows.some(f=>f.secretKey)));
 p=check('Alex');assert(p.every(x=>!x.knows.some(f=>f.secretKey)));
});
test('Long objective endings are retained so contradictory conditions never reconcile through truncation',()=>{
 const prefix='Investigate the damaged aqueduct and document every junction, recording the masonry condition and interviewing every crew member before reporting the source of the damage';
 const parsed=c.questNormalize([{...a,name:'First',objective:prefix+' before the flood'},{...a,name:'Second',objective:prefix+' after the flood'}]);assert(parsed[0].objective.endsWith('before the flood'));assert(parsed[1].objective.endsWith('after the flood'));assert.equal(c.questMatch(...parsed),false);
});
test('Stable quest focus uses the persisted key after a rename',async()=>{
 const rt=runtime(process.env.COMPANION_3_BASELINE);seed(rt,true);rt.response({quests:[a]});await rt.ctx.runSeparateUpdate('test');await rt.frontendHandlers[0]({type:'quest_focus',chatId:'test',name:a.name,key:c.questKey(a.name)});let st=await rt.ctx.getChatState('test');assert.equal(st.questFocus,c.questKey(a.name));
 await rt.frontendHandlers[0]({type:'quest_focus',chatId:'test',name:b.name,key:c.questKey(a.name)});st=await rt.ctx.getChatState('test');assert.equal(st.questFocus,null);
});
test('Sparse metadata, swipes, source edits and JSON restoration preserve corrected identity',()=>{
 const chat=[msg('a',{quests:[a]}),msg('b',{quests:[b]}),msg('empty',{quests:null})];assert.equal(c.questDetailsLatest(JSON.parse(JSON.stringify(chat))).length,1);chat[1].swipe_id=1;assert.equal(c.questDetailsLatest(chat)[0].name,a.name);chat[1].swipe_id=0;chat[1].content+=' edited';assert.equal(c.questDetailsLatest(chat)[0].name,a.name);
});
test('Rejected legacy transactions retain later ledger IDs and saved manual hiding',()=>{
 const chat=[msg('cash',{money:[{amount:20,kind:'income',dir:'in',currency:'gold',uncertain:true},{amount:5,kind:'income',dir:'in',currency:'gold'}]})];
 const ledger=c.moneyRead(chat,{});assert.equal(ledger.list.length,1);assert.equal(ledger.list[0].id,'cash:1');assert.equal(c.moneyRead(chat,{money:{hidden:['cash:1']}}).list.length,0);
});
test('Current HUD lifecycle wins over old story completion, and reopen does not fabricate rewards',()=>{
 const m=msg('hud',{quests:[{...a,state:'completed',cls:'done'}]});m.content=m.content.replace('***','Quests: The Northern Aqueduct — Failed\n***');m.metadata.rpg_companion.sources[0]=c.readingSource(m.content);
 const p=c.hmsPanelState('hud-life',[m],c.emptyChatState());assert.equal(p.systems.quests[0].cls,'failed');assert.equal(p.systems.quests[0].state,'Failed');
 const rows=c.questDetailsLatest([msg('a',{quests:[{...a,state:'completed'}]}),msg('reopen',{quests:[{...a,state:'reopened',progress:0}]})]);assert.equal(rows[0].cls,'active');assert.equal(rows[0].progress,0);assert.equal(rows[0].reward,undefined);
});
(async()=>{let failed=0;for(const[n,f]of tests){try{await f();console.log('PASS '+n)}catch(e){failed++;console.error('FAIL '+n+': '+e.message)}}console.log(`${tests.length-failed}/${tests.length} engine contracts passed`);if(failed)process.exitCode=1})();
