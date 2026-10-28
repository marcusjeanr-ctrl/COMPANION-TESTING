// Full cached card + synthetic accepted observations; no private export/model calls.
const assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib');const {runtime,hud,seed}=require('./test_panel_tracking.cjs');
const cases=[],test=(n,f)=>cases.push([n,f]);function setup(){const r=runtime(process.env.COMPANION_ACCEPTANCE_BASELINE);seed(r,true);return r;}
function msg(c,id,data={},header=hud()){return {id,role:'assistant',swipe_id:0,content:header,metadata:{rpg_companion:{swipes:{0:data},sources:{0:c.readingSource(header)}}}};}
function data(c){return {relations:c.relNormalize([{name:'Alden Vale',standing:'Friendly',bond:'father',trust:60}]),family:c.famNormalize([{name:'Alden Vale',relation:'father',status:'alive',where:'Library',known:'seen'}]),agenda:c.agendaNormalize([{what:'Review the training folio',with:'Alden Vale',where:'Library',when:'tomorrow at 09:00',state:'open'}]),secrets:c.secretNormalize([{text:'The signal is blue',whose:'user',known_by:['Alden Vale'],how:'Told privately'}],'Pilot'),contacts:c.commsNormalize([{name:'Alden Vale',how:'Given a contact address'}]),survival:{xp:20,xpWhy:'Explicit training award',got:['Survey compass']},minds:[{name:'Alden Vale',feel:{p:'joy'}},{name:'Bryn North',feel:{p:'surprise'}}],agendas:[{name:'Alden Vale',where:'Library',doing:'Reading',why:'Daily routine'}]};}
function stretch(c,source){return [source,...Array.from({length:340},(_,i)=>msg(c,'later'+i))];}
test('People, Family and Minds agree on an established off-scene character after long absence',()=>{
 const c=setup().ctx,chat=stretch(c,msg(c,'origin',data(c))),st=c.emptyChatState();const p=c.hmsPanelState('test',chat,st);assert.equal(p.family.members.length,1);assert.equal(p.relations.people.length,1);assert.equal(p.relations.people[0].name,'Alden Vale');assert(!p.relations.people[0].present);assert.equal(p.minds.people.length,2);assert(!p.family.members[0].present);
 chat.push({id:'return',role:'user',content:'I seek Alden Vale.'});assert(c.relPrevious(chat,st,c.relCfg()).some(x=>x.name==='Alden Vale'&&x.standing==='Friendly'));
});
test('Scheduled Agenda survives long absence independently of NPC daily agendas and completed history',()=>{
 const c=setup().ctx,chat=stretch(c,msg(c,'origin',data(c)));assert.equal(c.agendaRead(chat,{}).items.length,1);assert.equal(c.simFold(chat,{}).agendas.size,1);chat.push(msg(c,'done',{agenda:c.agendaNormalize([{what:'Review the training folio',with:'Alden Vale',where:'Library',when:'tomorrow at 09:00',state:'kept'}])}));assert.equal(c.agendaRead(chat,{}).items.length,1);assert.equal(c.agendaRead(chat,{}).items[0].state,'kept');
});
test('Activity cues without Agenda rows still start a retained appointment',()=>{
 const c=setup().ctx,chat=stretch(c,msg(c,'origin',{agenda:c.agendaNormalize([{what:'Field footwork drill against Alden',with:'Alden',when:'now',kind:'event',state:'open'}])}));chat.push(msg(c,'start',{plot:{now:'The footwork drill begins as Alden attacks.'}}));assert.equal(c.agendaRead(chat,{}).items[0].state,'in_progress');
});
test('Repeated activity cues reuse a read pass without hiding a different or edited cue',()=>{
 const c=setup().ctx,chat=[],item={what:'Field footwork drill against Alden',with:'Alden'};
 c.withReadPass(chat,()=>{for(let i=0;i<600;i++)assert.equal(c.agendaActivityState(item,{plot:{now:'The footwork drill begins as Alden attacks.'}}),'in_progress');assert.equal(c.agendaActivityState(item,{plot:{now:'The footwork drill is about to begin.'}}),null);assert.equal(c.agendaActivityState({what:'Meeting at the library'}, {plot:{now:'The footwork drill begins as Alden attacks.'}}),null);});
 c.withReadPass(chat,()=>assert.equal(c.agendaActivityState(item,{plot:{now:'The footwork drill is finished.'}}),null));
});
test('Old appointment rescheduling updates the existing event while separate participants remain separate',()=>{
 const c=setup().ctx,chat=stretch(c,msg(c,'origin',data(c)));chat.push(msg(c,'postpone',{agenda:c.agendaNormalize([{what:'Review the training folio',with:'Alden Vale',where:'Library',when:'Day 10, 10:00',state:'rescheduled'}])}));let items=c.agendaRead(chat,{}).items;assert.equal(items.length,1);assert.equal(items[0].when,'Day 10, 10:00');chat.push(msg(c,'other',{agenda:c.agendaNormalize([{what:'Review the training folio',with:'Bryn North',where:'Library',when:'Day 10, 10:00',state:'open'}])}));assert.equal(c.agendaRead(chat,{}).items.length,2);
});
test('Secrets and explicit knowledge boundaries persist without granting unrelated NPC knowledge',()=>{
 const c=setup().ctx,chat=stretch(c,msg(c,'origin',data(c))),p=c.hmsPanelState('test',chat,c.emptyChatState());assert.equal(p.secrets.yours.length,1);assert.equal(p.secrets.yours[0].knownBy.length,1);assert.equal(p.secrets.yours[0].knownBy[0].name,'Alden Vale');assert(p.minds.people.find(x=>x.name==='Alden Vale').knows.some(x=>x.secretKey));assert(!p.minds.people.find(x=>x.name==='Bryn North').knows.some(x=>x.secretKey));assert(!p.secrets.yours[0].isNew);
});
test('Same secret text from different owners remains separate; inference never becomes a witnessed fact',()=>{
 const c=setup().ctx,chat=stretch(c,msg(c,'origin',{secrets:c.secretNormalize([{text:'The signal is blue',whose:'Alden Vale',known_by:['Pilot'],how:'Told privately'},{text:'The signal is blue',whose:'Bryn North',known_by:['Pilot'],how:'Told privately'}],'Pilot')}));assert.equal(c.secretRead(chat,{},'Pilot').items.length,2);assert.equal(c.secretNormalize([{text:'The signal is green',whose:'Bryn North',how:'inferred',known_by:['Pilot']}],'Pilot'),null);
});
test('Explicit XP gains persist without carrying stale mood; current HUD XP remains authoritative',()=>{
 const c=setup().ctx,chat=stretch(c,msg(c,'origin',{survival:{xp:20,xpWhy:'Explicit award',mood:'happy'}}));let p=c.hmsYouPanel(chat,{});assert.equal(p.xp.total,20);assert.equal(p.mood,null);chat.push(msg(c,'gain',{survival:{xp:5,xpWhy:'Second explicit award'}}));assert.equal(c.hmsYouPanel(chat,{}).xp.total,25);assert.equal(c.hmsYouPanel(chat,{xpAdjust:-10}).xp.total,15);const h=c.hmsReadSystems(c.parseHud(hud().replace('***','XP: 0/100\n***')));assert.equal(c.hmsYouPanel(chat,{},null,h).xp.total,0);
});
test('Carried supplement and Gear both retain old acquisitions and explicit losses',()=>{
 const c=setup().ctx,chat=stretch(c,msg(c,'origin',data(c)));assert(c.hmsYouPanel(chat,{}).carried.some(x=>x.name==='Survey compass'));assert(c.gearRead(chat,{}).items.some(x=>x.name==='Survey compass'&&x.state!=='gone'));chat.push(msg(c,'lost',{gear:c.gearNormalize([{name:'Survey compass',state:'gone'}])}));assert(!c.hmsYouPanel(chat,{}).carried.some(x=>x.name==='Survey compass'));
});
test('A pocket removal after a sparse history has a source anchor and permits later reacquisition',async()=>{
 const r=setup(),c=r.ctx;r.messages.length=0;r.messages.push(...stretch(c,msg(c,'origin',data(c))));await r.frontendHandlers[0]({type:'pocket',chatId:'test',op:'remove',name:'Survey compass'});const st=await c.getChatState('test');assert(st.pockets.removed[0].after);r.messages.push(msg(c,'regain',{survival:{got:['Survey compass']}}));assert(c.hmsYouPanel(r.messages,st).carried.some(x=>x.name==='Survey compass'));
});
test('Earned contacts persist while finite message-thread history stays intentionally bounded',()=>{
 const c=setup().ctx,chat=stretch(c,msg(c,'origin',data(c)));assert.equal(c.commsContacts(chat,{}).length,1);assert.equal(c.commsContacts(chat,{comms:{contacts:[{name:'Alden Vale',how:'manual'}]}}).length,1);
});
test('Persistent states reject old source edits, hidden/deleted messages and inactive swipes after JSON restore',()=>{
 const c=setup().ctx,original=stretch(c,msg(c,'origin',data(c)));for(const mode of ['edit','hidden','swipe','delete']){const chat=JSON.parse(JSON.stringify(original));if(mode==='edit')chat[0].content+=' edited';if(mode==='hidden')chat[0].hidden=true;if(mode==='swipe')chat[0].swipe_id=1;if(mode==='delete')chat.shift();assert.equal(c.hmsRelationsPanel(chat,{}).people.length,0);assert.equal(c.agendaRead(chat,{}).items.length,0);assert.equal(c.secretRead(chat,{}).items.length,0);assert.equal(c.hmsYouPanel(chat,{}).xp.total,0);assert.equal(c.commsContacts(chat,{}).length,0);}
});
test('Continuation snapshots preserve supported static records without replaying XP, items, contacts or discoveries',()=>{
 const c=setup().ctx,m=msg(c,'snapshot',data(c));m._rpgcPurpose='continue';const chat=stretch(c,m);assert.equal(c.agendaRead(chat,{}).items.length,1);assert.equal(c.hmsRelationsPanel(chat,{}).people.length,1);assert.equal(c.hmsYouPanel(chat,{}).xp.total,0);assert.equal(c.hmsYouPanel(chat,{}).carried.length,0);assert.equal(c.commsContacts(chat,{}).length,0);assert.equal(c.secretRead(chat,{}).items.length,0);
});
test('Both complete card catalogues remain references and never grant abilities, family or XP',()=>{
 for(const name of ['six_sided_world','living_world']){const r=setup(),c=r.ctx,card=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/'+name+'_fixture.json.gz'))).data;c.setLorePool('test',card.character_book.entries);assert.equal(c.spellKnown([],{},null,'test').size,0);assert.equal(c.famRead([],{}).members.length,0);assert.equal(c.hmsYouPanel([],{}).xp.total,0);}
});
test('All acceptance projections are local and leave metadata, settings and manual choices unchanged',()=>{
 const r=setup(),c=r.ctx,chat=stretch(c,msg(c,'origin',data(c))),st=c.emptyChatState(),before=JSON.stringify({chat,st});const fail=()=>{throw Error('Unexpected API');};c.spindle.generate.quiet=fail;c.spindle.chat.getMessages=fail;c.spindle.storage.setJson=fail;c.spindle.world_books.getActivated=fail;c.withReadPass(chat,()=>{c.hmsRelationsPanel(chat,st);c.agendaRead(chat,st);c.secretRead(chat,st);c.hmsYouPanel(chat,st);c.commsContacts(chat,st);});assert.equal(JSON.stringify({chat,st}),before);
});
test('An unrecognized legacy emotion cannot blank the entire Minds panel',()=>{
 const r=setup(),c=r.ctx,d=data(c);d.minds[1].feel={p:'calm'};const m=msg(c,'legacy',d),before=JSON.stringify(m),p=c.hmsPanelState('test',[m],{});assert.equal(p.minds.people.length,2);assert.equal(p.minds.people.find(x=>x.name==='Bryn North').feel.icon,'💭');assert.equal(JSON.stringify(m),before);assert(!r.warnings.some(x=>/Minds read failed/.test(x)));
});
test('Structural manual anchors do not grant facts from hidden, continuation or player messages',async()=>{
 const r=setup(),c=r.ctx;r.messages.length=0;const a=msg(c,'origin',{survival:{got:['Survey compass'],xp:20}}),hidden=msg(c,'hidden',{survival:{got:['Forged item'],xp:999}});hidden.hidden=true;r.messages.push(a,hidden,{id:'intent',role:'user',content:'I want a forged item.',metadata:{rpg_companion:{swipes:{0:{survival:{xp:999,got:['Forged item']}}}}}});await r.frontendHandlers[0]({type:'pocket',chatId:'test',op:'remove',name:'Survey compass'});const st=await c.getChatState('test');assert.equal(st.pockets.removed[0].after,'intent');r.messages.push(msg(c,'regain',{survival:{got:['Survey compass']}}));const p=c.hmsYouPanel(r.messages,st);assert.equal(p.xp.total,20);assert(p.carried.some(x=>x.name==='Survey compass'));assert(!p.carried.some(x=>x.name==='Forged item'));assert(c.gearRead(r.messages,st).items.some(x=>x.name==='Survey compass'&&x.state!=='gone'));
});
if(process.argv.includes('--browser-fixture')){const c=setup().ctx;console.log(JSON.stringify(c.hmsPanelState('test',stretch(c,msg(c,'origin',data(c))),{})));}else (async()=>{let failed=0;for(const[n,f]of cases){try{await f();console.log('PASS '+n)}catch(e){failed++;console.error('FAIL '+n+': '+e.message)}}console.log(`${cases.length-failed}/${cases.length} Six-Sided acceptance groups passed`);if(failed)process.exitCode=1})();
