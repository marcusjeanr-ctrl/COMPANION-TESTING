const assert=require('node:assert/strict');
const path=require('node:path');
const {runtime,hud,seed}=require('./test_panel_tracking.cjs');
const rt=runtime(process.env.COMPANION_EVIDENCE_BASELINE ? path.resolve(process.env.COMPANION_EVIDENCE_BASELINE) : undefined), c=rt.ctx;
const tests=[],test=(name,fn)=>tests.push([name,fn]);
const row={what:'Sword practice in the courtyard',with:'Rin Vale',where:'Old Keep courtyard',when:'after breakfast, before the rain',state:'open',kind:'event'};
function msg(id,agenda,scene,day=8) {
 const content=hud().replace('Day 8','Day '+day)+'\n'+scene;
 const d=c.parseCompanion('<rpg_companion>'+JSON.stringify({agenda})+'</rpg_companion>');
 return {id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:d},sources:{0:c.readingSource(content)}}}};
}
test('Postponement in accepted narration updates one occurrence despite an open report',()=>{
 const chat=[msg('a',[row],'The practice is set.'),msg('b',[{...row,when:'midday, once the briefing ends'}],'The courtyard can wait. Practice will be at midday instead.')];
 const key=c.agendaRead(chat.slice(0,1),{}).items[0].key;
 let items=c.agendaRead(chat,{}).items;assert.equal(items.length,1);assert.equal(items[0].key,key);assert.match(items[0].when,/midday/);
 chat.push(msg('c',[{...row,when:'tomorrow afternoon',state:'rescheduled'}],'Practice has been rescheduled to tomorrow afternoon.'));
 items=c.agendaRead(chat,{}).items;assert.equal(items.length,1);assert.equal(items[0].key,key);assert.match(items[0].when,/tomorrow/);
 assert.equal(c.agendaRead(JSON.parse(JSON.stringify(chat)),{}).items.length,1);
 const underway=[msg('started',[{...row,state:'in_progress'}],'Practice has begun.'),msg('paused',[{...row,when:'tomorrow afternoon'}],'Practice has been postponed to tomorrow afternoon.')];
 assert.equal(c.agendaRead(underway,{}).items[0].state,'open','A postponed active session stayed in progress');
});
test('No title-only merging, hypothetical postponement, recurrence or ambiguous target',()=>{
 const later={...row,when:'midday, once the briefing ends'};
 for(const scene of ['A second practice will be at midday.','If practice is postponed, we might meet at midday.','The council meeting was postponed to midday.','Practice can wait?'])
  assert.equal(c.agendaRead([msg('a',[row],''),msg('b',[later],scene)],{}).items.length,2,scene);
 assert.equal(c.agendaRead([msg('a',[row],''),msg('b',[later],'Practice is set for midday.',9)],{}).items.length,2);
 const two=[row,{...row,when:'evening'}];
 assert.equal(c.agendaRead([msg('a',two,''),msg('b',[later],'Practice has been postponed to midday.')],{}).items.length,3);
 const done={...row,state:'kept'};
 assert.equal(c.agendaRead([msg('a',[done],''),msg('b',[later],'Practice has been postponed to midday.')],{}).items.length,2);
});
test('Reschedule states are part of the extraction contract and normalize without loss',()=>{
 const request=c.agendaRequest([],{},'Rin');assert(request.json.includes('moved'));
 for(const state of ['moved','postponed','rescheduled'])assert.equal(c.agendaNormalize([{...row,state}])[0].moved,true);
});
test('Lessons, appointments, departures, meetings, ceremonies and training preserve explicit move context',()=>{
 for(const what of ['Language lesson','Medical appointment','Harbor departure','Council meeting','Oath ceremony','Navigation training']) {
  const old={...row,what,when:'tomorrow morning'};
  const moved={...old,when:'in two days after the inspection',with:'New coordinator',where:'West Annex',state:'moved'};
  const chat=[msg('a',[old],''),msg('b',[moved],'The agreed event is rescheduled.')];
  const key=c.agendaRead(chat.slice(0,1),{}).items[0].key;const item=c.agendaRead(chat,{}).items;
  assert.equal(item.length,1);assert.equal(item[0].key,key);assert.equal(item[0].where,'West Annex');assert.equal(item[0].with,'New coordinator');assert.equal(item[0].dueAt,null);
  const manual={agenda:{edits:{[key]:{state:'cancelled',after:'b'}}}};
  assert.equal(c.agendaRead(chat,manual).items[0].state,'cancelled');
 }
});
test('Historical ability evidence preserves provenance without inventing new learning or mastery',()=>{
 const scene='The signed training record states: Solar Lance was performed reliably last year.';
 const data=c.parseCompanion('<rpg_companion>'+JSON.stringify({you:{abilities:[{name:'Solar Lance',owner:'you',state:'reliable',historical:true,evidence:'Solar Lance was performed reliably last year.'}]}})+'</rpg_companion>');
 assert.equal(data.you.abilities.length,1);
 const m={id:'h',role:'assistant',content:hud()+'\n'+scene,metadata:{rpg_companion:{swipes:{0:{survival:data.you}}}}};
 const fold=c.spellStoryFold([m]);assert.equal(fold.learned.get('solar lance').newlyLearned,false);
 const known=c.spellKnown([m],{},fold);assert(known.has('solar lance'));assert(!known.get('solar lance').mastered);
 assert.equal(known.get('solar lance').evidence.historical,true);
 assert.equal(c.spellKnown(JSON.parse(JSON.stringify([m])),{}).size,1);
});
test('NPC, hypothetical, missing-source, attempts and historical downgrades are guarded',()=>{
 function ability(id,state,historical,evidence,owner='you') {
  return {id,role:'assistant',content:hud()+'\n'+evidence,metadata:{rpg_companion:{swipes:{0:{survival:{abilities:[{name:'Vector Fold',owner,state,historical,evidence}]}}}}}};
 }
 const a=ability('current','mastered',false,'You have explicitly mastered Vector Fold.');
 const old=ability('old','attempted',true,'Your old log records a failed attempt at Vector Fold.');
 const known=c.spellKnown([a,old],{});assert(known.get('vector fold').mastered);assert.equal(known.get('vector fold').evidence.state,'mastered');
 assert.equal(c.spellKnown([ability('npc','known',false,'The pilot knows Vector Fold.','NPC')],{}).size,0);
 assert.equal(c.spellKnown([ability('attempt','attempted',false,'You attempted Vector Fold unsuccessfully.')],{}).size,0);
 const forged=ability('forged','known',false,'An unsupported quote.');forged.content=hud()+'\nNo acquisition.';assert.equal(c.spellKnown([forged],{}).size,0);
 const forgot=ability('forget','forgotten',false,'You have lost the ability to use Vector Fold.');assert.equal(c.spellKnown([a,forgot],{}).size,0);
 const relearned={id:'relearn',role:'assistant',content:hud(),metadata:{rpg_companion:{swipes:{0:{survival:{learned:['Vector Fold']}}}}}};
 assert(c.spellKnown([a,forgot,relearned],{}).has('vector fold'));
 assert.equal(c.spellKnown([a,forgot,relearned],{}).get('vector fold').evidence,undefined,'An obsolete loss assessment masked relearning');
 assert.equal(c.spellKnown([a],{spellForget:{'vector fold':'current'}}).size,0);
});
test('Refresh stores and projects historical proficiency through the real pipeline',async()=>{
 const r=runtime();seed(r);const quote='You already knew Signal Weaving before this expedition.';
 r.messages[1].content=hud()+'\n'+quote;
 r.response({characters:[],you:{abilities:[{name:'Signal Weaving',owner:'you',state:'known',historical:true,evidence:quote}]}});
 let calls=0;r.quiet(()=>calls++);await r.ctx.runSeparateUpdate('test');
 const stored=r.ctx.getSwipeData(r.messages[1]);assert.equal(stored.survival.abilities[0].evidence,quote);
 const st=await r.ctx.getChatState('test');assert(r.ctx.spellKnown(r.messages,st,null,'test').has('signal weaving'));
 assert(r.events.filter(x=>x.type==='state').at(-1).hms.magic.spellbook.some(x=>x.name==='Signal Weaving'));
 assert.equal(calls,1);r.response({you:{mood:'calm'}});await r.ctx.runSeparateUpdate('test');assert.equal(calls,2);assert.equal(r.ctx.spellKnown(r.messages,st).size,1);
});
test('Fantasy, science-fiction and generic abilities preserve source boundaries and live-validation limits',()=>{
 for(const name of ['Ember Veil','Phase Navigation','Precision Joinery']) {
  const quote=`Your signed record confirms you already know ${name}.`;
  const make=(id,abilities)=>({id,role:'assistant',content:hud()+'\n'+quote,metadata:{rpg_companion:{swipes:{0:{survival:{abilities}}}}}});
  const row={name,owner:'you',state:'known',historical:true,evidence:quote};
  assert(c.spellKnown([make('a',[row])],{}).has(c.spellKey(name)));
  for(const bad of [{...row,speculative:true},{...row,owner:'instructor'},{...row,historical:'true'},{...row,evidence:'A fabricated quote.'}])
   assert.equal(c.spellKnown([make('a',[bad])],{}).size,0);
  const swipe=make('a',[row]);swipe.swipe_id=1;assert.equal(c.spellKnown([swipe],{}).size,0);
  const snapshot=make('a',[row]);snapshot.metadata.rpg_companion.sources={0:c.readingSource(snapshot.content)};
  snapshot.content+=' A source edit.';assert.equal(c.spellKnown([snapshot],{}).size,0);
 }
 const r=runtime();r.run("settings.hmsSystems.survival.enabled=false; settings.hmsSystems.you.enabled=false; settings.trackerConfig.userStats.skillsSection.enabled=true;");
 const request=r.ctx.buildCompanionInstruction({},'Rin',{},r.ctx.emptyChatState(),[],true);
 assert(request.includes('"abilities"'));assert(request.includes('"historical":false'));
 for(const field of ['learned','study','mastered']) assert(request.includes('"'+field+'"'),field+' remained world-gated');
});
test('Existing current mastery outranks a newly revealed old failed assessment',()=>{
 const old='The older record describes a failed attempt.';
 const a={id:'now',role:'assistant',content:hud(),metadata:{rpg_companion:{swipes:{0:{survival:{mastered:['Ember Veil']}}}}}};
 const b={id:'history',role:'assistant',content:hud()+'\n'+old,metadata:{rpg_companion:{swipes:{0:{survival:{abilities:[{name:'Ember Veil',owner:'you',historical:true,state:'attempted',evidence:old}]}}}}}};
 assert(c.spellKnown([a,b],{}).get('ember veil').mastered);
 assert.equal(c.spellKnown([a,b],{}).get('ember veil').evidence,undefined);
 b.metadata.rpg_companion.swipes[0].survival.abilities[0].state='known';
 assert.equal(c.spellKnown([a,b],{spellForget:{'ember veil':'now'}}).size,0,'A historical backfill overrode a manual correction');
});
test('Historical knowledge does not finish current deliberate study',()=>{
 const r=runtime(),ctx=r.ctx;ctx.setLorePool('study',[{id:'solar',key:['Solar Lance'],content:'[SPELL — Solar Lance]\nSchool: Fire · Rank: Beginner\nEffect: A training example.'}]);
 const quote='Your old record confirms you already knew Solar Lance.';
 const chat=[{id:'practice',role:'assistant',content:hud(),metadata:{rpg_companion:{swipes:{0:{survival:{study:[{spell:'Solar Lance',progress:40,note:'Practicing finer control'}]}}}}}},
 {id:'record',role:'assistant',content:hud()+'\n'+quote,metadata:{rpg_companion:{swipes:{0:{survival:{abilities:[{name:'Solar Lance',owner:'you',state:'known',historical:true,evidence:quote}]}}}}}}];
 assert.equal(ctx.spellStudyActive(chat,{},null,'study').length,1);
 const panel=ctx.spellListPanel('study',chat,{},ctx.hmsReadSystems(ctx.parseHud(hud())));
 assert.equal(panel.studying[0].progress,40);assert.equal(panel.studying[0].done,false);
});
test('Application restart and older-message reprocessing retain the latest accepted state',async()=>{
 const r=runtime();seed(r);const early='You knew Solar Lance years ago.',latest='You have now mastered Solar Lance.';
 r.messages[1].content=hud()+'\n'+early;
 r.messages.push({id:'u2',role:'user',content:'I continue.'},{id:'a2',role:'assistant',swipe_id:0,content:hud()+'\n'+latest});
 r.response({you:{abilities:[{name:'Solar Lance',owner:'you',state:'mastered',historical:false,evidence:latest}]}});
 await r.ctx.runSeparateUpdate('test','a2');
 r.response({you:{abilities:[{name:'Solar Lance',owner:'you',state:'known',historical:true,evidence:early}]}});
 await r.ctx.runSeparateUpdate('test','a1');
 const reloaded=runtime();reloaded.messages.push(...JSON.parse(JSON.stringify(r.messages)));
 assert(reloaded.ctx.spellKnown(reloaded.messages,{}).get('solar lance').mastered);
 assert.equal(reloaded.ctx.spellKnown(reloaded.messages,{}).size,1);
});
test('Incompatible provider fails once and preserves existing committed metadata',async()=>{
 const r=runtime();seed(r);await r.ctx.runSeparateUpdate('test');const before=JSON.stringify(r.ctx.getSwipeData(r.messages[1]));let calls=0;
 r.quiet(()=>{calls++;throw new Error('NanoGPT generate failed (400): Decision models accept only user messages with text content.');});
 await r.ctx.runSeparateUpdate('test');assert.equal(calls,1);
 assert.equal(JSON.stringify(r.ctx.getSwipeData(r.messages[1])),before);
 assert(r.warnings.some(x=>x.includes('Decision models')));
});
test('Confirmed aliases reconcile evidence and retractions without merging distinct abilities',()=>{
 const r=runtime(),ctx=r.ctx;
 const fixture=JSON.parse(require('node:zlib').gunzipSync(require('node:fs').readFileSync(require('node:path').join(__dirname,'updated_six_sided_fixture.json.gz'))));
 ctx.setLorePool('alias',fixture.entries);
 const message=(id,name,state)=>{const evidence=`You ${state==='forgotten'?'can no longer use':'know'} ${name}.`;return {id,role:'assistant',content:hud()+'\n'+evidence,metadata:{rpg_companion:{swipes:{0:{survival:{abilities:[{name,state,owner:'you',historical:false,evidence}]}}}}}};};
 const chat=[message('a','Waterball','known'),message('b','Water Ball','known')];
 assert.equal(ctx.spellKnown(chat,{},null,'alias').size,1);
 chat.push(message('c','Water Ball Storm','known'));assert.equal(ctx.spellKnown(chat,{},null,'alias').size,2);
 chat.push(message('d','Waterball','forgotten'));const result=ctx.spellKnown(chat,{},null,'alias');assert.equal(result.size,1);assert(result.has('water ball storm'));
});
test('Long ability identities survive manual learn/forget controls without prefix truncation',async()=>{
 const r=runtime();seed(r);const name='Precision Resonance Navigation Through the Outer Magnetic Confluence';
 const quote='You already know '+name+'.';r.messages[1].content=hud()+'\n'+quote;
 r.response({you:{spells:[name],abilities:[{name,owner:'you',state:'known',historical:true,evidence:quote}]}});await r.ctx.runSeparateUpdate('test');
 assert(r.ctx.spellKnown(r.messages,{}).has(r.ctx.spellKey(name)));
 assert.equal(r.ctx.spellKnown(r.messages,{}).size,1,'Legacy string and evidence fields split one long identity');
 assert(r.frontendHandlers.length>0);await r.frontendHandlers[0]({type:'spell_known',chatId:'test',name,on:false});
 const st=await r.ctx.getChatState('test');assert.equal(r.ctx.spellKnown(r.messages,st).size,0);
 await r.frontendHandlers[0]({type:'spell_known',chatId:'test',name,on:true});
 const latest=await r.ctx.getChatState('test');assert(r.ctx.spellKnown(r.messages,latest).has(r.ctx.spellKey(name)));assert.equal(latest.spellbook[0].name,name);
});
(async()=>{let failed=0;for(const[name,fn]of tests){try{await fn();console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+': '+e.message.split('\n').slice(0,4).join(' '))}}if(failed)process.exitCode=1})();
