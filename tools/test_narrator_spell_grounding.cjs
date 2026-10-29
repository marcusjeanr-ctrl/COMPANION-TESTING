// Complete card references, mocked host; not a live-model obedience test.
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const {runtime,seed,hud}=require('./test_panel_tracking.cjs');const baseline=process.env.COMPANION_GROUNDING_BASELINE;
const cards={six:JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/six_sided_world_fixture.json.gz'))).data,living:JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz'))).data};
function setup(id='six'){const r=runtime(baseline);seed(r,true);r.run('settings.lore.enabled=true; settings.hmsSystems.magic={enabled:true};');r.ctx.setLorePool('test',cards[id].character_book.entries);return r;}
function history(request='List my known Water, Earth and Fire spells.'){return [{id:'a',role:'assistant',content:hud('Study','08:00',true)+'\nThe reference book lies open.'},{id:'u',role:'user',content:request}];}
function input(chat){return [{role:'system',content:'Follow the actual character card.'},...chat.map(x=>({...x,__isChatHistory:true}))];}
function ground(r,request,extra=[]){const chat=history(request);return r.ctx.narratorSpellGrounding('test',input(chat).concat(extra),chat,'normal');}
const cases=[],test=(n,f)=>cases.push([n,f]);
test('Actual normal narrator request receives cached canonical references and trace metadata',async()=>{
 const r=setup();r.messages.length=0;r.messages.push(...history());const before=JSON.stringify(r.messages),messages=input(r.messages);const fn=r.run('rpgcInterceptor');const result=await fn(messages,{chatId:'test',generationType:'normal'});const out=result.messages||result;const refs=out.filter(m=>String(m.content).includes('[RPG Companion: spell references]'));assert.equal(refs.length,1);assert.match(refs[0].content,/Water Ball|Fireball/);assert.match(refs[0].content,/not owned abilities/i);assert.match(refs[0].content,/exact names/i);assert.equal(out.at(-1).content,r.messages.at(-1).content);assert.equal(JSON.stringify(r.messages),before);const report=r.run("lastInjection.get('test').spellReferences");assert(report.added.length>0);assert.equal(report.characters,refs[0].content.split('\n\n[RPG Companion: lore references]')[0].length);const loreReport=r.run("lastInjection.get('test').loreReferences");assert(report.characters+loreReport.characters+(loreReport.characters?2:0)<=6000);const again=await fn(out,{chatId:'test',generationType:'normal'});assert.equal(again,out);
});
test('Both cards use their own literal names, ranks and relevant named definitions',()=>{
 for(const id of ['six','living']){const r=setup(id);const q=ground(r,id==='six'?'Explain Ice Pillar.':'Explain Ground Sense and Squall.');assert(q.text);assert(q.report.added.some(x=>x.name===(id==='six'?'Ice Pillar':'Ground Sense')));assert(q.report.added.every(x=>x.source!==undefined));assert(!q.text.includes('Water Bolt'));assert.match(q.text,/rank|Intermediate|Advanced|Elementary/i);const scoped=ground(r,'List all Water spells.');assert(scoped.report.added.length>0);assert(scoped.report.added.every(x=>x.school==='Water'));}
});
test('No additional model, world-book, history-fetch or storage calls are needed by the reference helper',()=>{
 const r=setup();let calls=0;const fail=()=>{calls++;throw Error('Unexpected API call');};r.ctx.spindle.world_books.getActivated=fail;r.ctx.spindle.world_books.entries={list:fail};r.ctx.spindle.chat.getMessages=fail;r.ctx.spindle.generate.quiet=fail;r.ctx.spindle.storage.setJson=fail;const q=ground(r,'What spells can I learn?');assert(q.text);assert.equal(calls,0);
});
test('Already supplied exact catalogue content is not repeated, but the grounding policy is retained',()=>{
 for(const id of ['six','living']){const r=setup(id);const e=cards[id].character_book.entries.find(x=>x.id===(id==='six'?959:476));const q=ground(r,'List Water spells.',[{role:'system',content:e.content}]);assert(q.report.hostProvided.length>0);assert.equal(q.report.added.length,0);assert.match(q.text,/exact names/i);const named=ground(r,'Explain Ice Pillar.',[{role:'system',content:e.content}]);assert(named.report.added.some(x=>x.name==='Ice Pillar'),'an index alone does not supply its effect');}
});
test('History quotations and incidental NPC mentions do not certify that definitions were supplied',()=>{
 const r=setup();const e=cards.six.character_book.entries.find(x=>x.id===959);const q=ground(r,'List Water spells.',[{role:'assistant',__isChatHistory:true,content:e.content},{role:'system',content:'An NPC once mentioned Water Ball.'}]);assert.equal(q.report.hostProvided.length,0);assert(q.report.added.some(x=>x.name==='Water Ball'));
});
test('Ordinary non-magic turns do not gain catalogue overhead from the HUD magic fields',()=>{
 const r=setup();const q=ground(r,'I eat breakfast and greet my father.');assert.equal(q.text,'');assert.equal(q.report.characters,0);
});
test('Source budgets produce whole references and explicit partial-coverage notices',()=>{
 const r=setup('living');r.run('settings.lore.maxChars=1200');const q=ground(r,'Show every spell in the spell catalogue.');assert(q.text.length<=1200);assert(q.report.omitted>0);assert.match(q.text,/subset|partial/i);assert(q.report.added.some(x=>x.school==='Fire'));assert(q.report.added.some(x=>x.school==='Earth'));assert(q.report.added.some(x=>x.school==='Water'));
});
test('Missing catalogues are reported as unavailable, not proof that spells do not exist',()=>{
 const r=setup();r.ctx.setLorePool('test',[{id:'empty',content:'An ordinary location.'}]);const q=ground(r,'List my spells.');assert.match(q.text,/unavailable|not available/i);assert(!/no spells exist/i.test(q.text));assert.equal(q.report.added.length,0);assert.equal(q.report.status,'catalogue-unavailable');
});
test('Disabled lore, disabled Magic and quiet/impersonate/continuation passes remain untouched',()=>{
 for(const mode of ['quiet','impersonate','continue']){const r=setup(),chat=history();assert.equal(r.ctx.narratorSpellGrounding('test',input(chat),chat,mode).text,'');}
 const r=setup();r.run('settings.lore.enabled=false');assert.equal(ground(r,'List spells.').text,'');r.run('settings.lore.enabled=true; settings.hmsSystems.magic.enabled=false');assert.equal(ground(r,'List spells.').text,'');
});
test('Lorebook references never grant ownership or mastery and rare/custom rules are explicit',()=>{
 const r=setup();const q=ground(r,'Explain Mud Wall.');assert.match(q.text,/fan|rare/i);assert.match(q.text,/custom/i);assert.match(q.text,/school rank/i);assert.equal(r.ctx.spellKnown([],{},null,'test').size,0);assert.equal(r.ctx.simFold([],r.ctx.emptyChatState()).minds.size,0);
});
test('Catalogue reloads and book changes cannot retain previous-world reference names',()=>{
 const r=setup();assert(ground(r,'List Water spells.').text.includes('Water Ball'));r.ctx.setLorePool('test',[{id:'elsewhere',world_book_id:'another-world',content:'A school with no magic.'}]);const q=ground(r,'List spells.');assert(!q.text.includes('Water Ball'));assert.equal(q.report.added.length,0);
});
test('Unlisted records retain Known/study state, exact names, manual choices and raw data',()=>{
 const r=setup(),c=r.ctx;const content=hud(),m={id:'saved',role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:{survival:{spells:['Water Sphere','Water Ball'],study:[{spell:'Custom Beacon',progress:25,note:'Explicitly permitted custom study.'}]}}},sources:{0:c.readingSource(content)}}}};const before=JSON.stringify(m);const p=c.hmsPanelState('test',[m],c.emptyChatState());const rows=p.magic.list.schools.flatMap(x=>x.spells);const unknown=rows.find(x=>x.name==='Water Sphere');assert.equal(unknown.status,'known');assert.match(unknown.note,/not found in loaded spell references/i);assert(!rows.find(x=>x.name==='Water Ball').note?.includes('Not found'));assert.equal(p.magic.list.studying[0].progress,25);assert.match(p.magic.list.studying[0].note,/not found/i);assert.equal(JSON.stringify(m),before);
});
test('Very small and unavailable-cache budgets are never exceeded',()=>{
 for(const max of [0,200,500])for(const available of [true,false]){const r=setup();r.run('settings.lore.maxChars='+max);if(!available)r.ctx.setLorePool('test',[{id:'empty',content:'A place.'}]);const q=ground(r,'List spells.');assert(q.text.length<=max);if(max<500)assert.equal(q.report.status,'budget-unavailable');}
});
test('Unlisted requests are not renamed to unsupported aliases or assigned invented ranks',()=>{
 const r=setup(),q=ground(r,'List Water Bolt and Oceanic Pressure magic.');assert(q.report.added.length>0);assert(!q.report.added.some(x=>/water bolt|oceanic pressure/i.test(x.name)));assert.match(q.text,/unverified/i);assert.equal(r.ctx.spellResolver('test').reference('Water Bolt'),null);
});
test('Exact individual definitions are reused and manual unlisted ownership remains authoritative',()=>{
 const r=setup(),e=cards.six.character_book.entries.find(x=>x.id===73);const q=ground(r,'Explain Ice Pillar.',[{role:'system',content:e.content}]);assert(q.report.hostProvided.some(x=>x.name==='Ice Pillar'));assert(!q.report.added.some(x=>x.name==='Ice Pillar'));
 const state={spellbook:[{name:'Custom Beacon',from:'you',note:'Approved custom spell.'}]},before=JSON.stringify(state);const p=r.ctx.hmsPanelState('test',history(),state);const row=p.magic.list.schools.flatMap(x=>x.spells).find(x=>x.name==='Custom Beacon');assert.equal(row.status,'known');assert.match(row.note,/not found/i);assert.match(row.why,/Marked by you/);assert.equal(JSON.stringify(state),before);
});
function browserFixture(){const r=setup(),content=hud(),m={id:'saved',role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:{survival:{spells:['Water Sphere','Water Ball'],study:[{spell:'Custom Beacon',progress:25,note:'Explicitly permitted custom study.'}]}}},sources:{0:r.ctx.readingSource(content)}}}};return r.ctx.hmsPanelState('test',[m],r.ctx.emptyChatState());}
if(process.argv.includes('--browser-fixture'))console.log(JSON.stringify(browserFixture()));else (async()=>{let failed=0;for(const[n,f]of cases){try{await f();console.log('PASS '+n)}catch(e){failed++;console.error('FAIL '+n+': '+e.message)}}console.log(`${cases.length-failed}/${cases.length} narrator grounding groups passed`);if(failed)process.exitCode=1})();
