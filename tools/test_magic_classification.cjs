// Synthetic source-bound sword training; real parser/folds/panels, complete card.
const assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib');
const {runtime,hud,seed}=require('./test_panel_tracking.cjs');const baseline=process.env.COMPANION_CLASSIFICATION_BASELINE;
const r=runtime(baseline),c=r.ctx,card=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/six_sided_world_fixture.json.gz'))).data;c.setLorePool('classification',card.character_book.entries);
r.run(`settings.hmsSystems.abilities = {enabled:true, vocabulary:'Martial: Touki (Battle Aura), Touki\\nMagic: Mana Capacity, Magic Tiers'};`);
const tests=[],test=(n,f)=>tests.push([n,f]);
function message(you,scene='You performed a physical sword drill under your instructor.',id='m'){const content=hud()+'\n'+scene;return {id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:{survival:you}},sources:{0:c.readingSource(content)}}}};}
function panel(you,st={},scene){return c.hmsPanelState('classification',[message(you,scene)],st);}
const magic=p=>p.magic.list.schools.flatMap(x=>x.spells),martial=p=>p.systems.abilities.filter(x=>/martial/i.test(x.category)).flatMap(x=>x.items);
const maneuvers=['Feint with rhythm-breaking footwork','Touki-enhanced diagonal cut','Grounding force absorption',"Absorbing an opponent's counter-pressure through a lowered center",'Diagonal cut with compact hip-driven acceleration','Angle-changing flank advance'];
test('Automatic sword maneuvers and Touki do not increase Magic spellbook or known spell counts',()=>{
 const p=panel({spells:['Touki',...maneuvers]});assert.equal(p.magic.spellbook.length,0);assert.equal(magic(p).filter(x=>['known','mastered'].includes(x.status)).length,0);for(const name of maneuvers)assert(martial(p).some(x=>x.name===name||x.aliases?.includes(name)),name);assert(martial(p).some(x=>/touki/i.test(x.label||'')&&x.name==='Active'));
});
test('Water, Earth, Fire, unknown magic and genuine magic study retain existing behavior',()=>{
 const p=panel({spells:['Water Ball','Rock Bullet','Fireball','Uncatalogued Beacon','Phantom Feint','Spectral Parry','Astral Riposte',...maneuvers],study:[{spell:'Stone Cannon',progress:40,note:'Measured practice.'}]});assert.equal(p.magic.spellbook.length,7);assert(p.magic.spellbook.some(x=>x.name==='Phantom Feint'));assert(p.magic.spellbook.some(x=>x.name==='Spectral Parry'));assert(p.magic.spellbook.some(x=>x.name==='Astral Riposte'));for(const name of ['Water Ball','Rock Bullet','Fireball'])assert.equal(magic(p).find(x=>x.name===name).status,'known');assert(p.magic.spellbook.some(x=>x.name==='Uncatalogued Beacon'));assert.equal(p.magic.list.studying[0].name,'Stone Cannon');assert.equal(p.magic.list.studying[0].progress,40);assert(p.magic.list.voiceless);assert(p.magic.arts.some(g=>g.items.some(x=>x.label==='Mana Capacity'&&x.name==='Vast')));
});
test('Physical training objectives stay out of Magic Studying and remain uncompleted training in Abilities',()=>{
 const name="Breaking an opponent's footing through angled attack";const p=panel({study:[{spell:name,progress:null,note:'Instructor assigned the drill; not completed.'}]});assert.equal(p.magic.list.studying.length,0);const row=martial(p).find(x=>x.name===name);assert(row);assert.match(row.state,/training/i);assert(!/master|learned|known|complete/i.test(row.state));
});
test('Attempted and practiced maneuvers do not become learned or mastered Abilities',()=>{
 for(const state of ['attempted','practiced']){const name='Compact diagonal cut',quote='You attempted a compact diagonal cut, but the instructor stopped it.';const p=panel({abilities:[{name,owner:'you',state,historical:false,evidence:quote}]},{},quote);assert.equal(p.magic.spellbook.length,0);const row=martial(p).find(x=>x.name===name);assert(row);assert.match(row.state,state==='attempted'?/attempted/i:/practic/i);assert(!/known|mastered/i.test(row.state));}
});
test('Exact accepted learning/mastery evidence is distinct from unverified legacy learning claims',()=>{
 const name='Compact diagonal cut',quote='You have learned the compact diagonal cut.';let p=panel({learned:[name]});assert.match(martial(p).find(x=>x.name===name).state,/report/i);p=panel({abilities:[{name,owner:'you',state:'known',historical:false,evidence:quote}]},{},quote);assert.equal(martial(p).find(x=>x.name===name).state,'Known');assert(!p.magic.spellbook.some(x=>x.name===name));
});
test('Catalogue magic wins over martial wording, with reload invalidating the classification',()=>{
 const name='Grounding force absorption';try{c.setLorePool('classification',[...card.character_book.entries,{id:'magic-exception',keys:[name],content:'[SPELL — '+name+']\nSchool: Earth · Rank: Beginner\nEffect: An actual magical spell.'}]);let p=panel({spells:[name]});assert(p.magic.spellbook.some(x=>x.name===name));assert(!martial(p).some(x=>x.name===name));}finally{c.setLorePool('classification',card.character_book.entries);}assert.equal(panel({spells:[name]}).magic.spellbook.length,0);
});
test('Explicit manual spellbook and study choices remain authoritative and unmodified',()=>{
 for(const from of [undefined,'you']) { const st={spellbook:[{name:'Shoulder feint',from:'you'}],spellStudy:[{name:'Diagonal cut',...(from?{from}:{})}]},before=JSON.stringify(st),p=panel({},st);assert(p.magic.spellbook.some(x=>x.name==='Shoulder feint'));assert(p.magic.list.studying.some(x=>x.name==='Diagonal cut'));assert.equal(JSON.stringify(st),before); }
});
test('Source/swipe/owner guards and JSON restoration preserve records without migration',()=>{
 const quote='You practiced the diagonal cut.';const msg=message({abilities:[{name:'Diagonal cut',owner:'NPC',state:'mastered',historical:false,evidence:quote}]},quote);assert(!martial(c.hmsPanelState('classification',[msg],{})).some(x=>x.name==='Diagonal cut'));
 const m=message({spells:maneuvers,study:[{spell:'Shoulder feint',progress:null}]});const before=JSON.stringify(m);c.hmsPanelState('classification',[m],{});assert.equal(JSON.stringify(m),before);const rt=runtime(baseline);rt.ctx.setLorePool('classification',card.character_book.entries);assert.equal(rt.ctx.hmsPanelState('classification',[JSON.parse(before)],{}).magic.spellbook.length,0);m.swipe_id=1;assert(!martial(c.hmsPanelState('classification',[m],{})).some(x=>maneuvers.includes(x.name)));m.swipe_id=0;m.content+=' changed';assert.equal(c.getSwipeData(m),null);
});
test('Real parsing and storage retain source observations with one existing model call',async()=>{
 const rt=runtime(baseline);seed(rt,true);rt.ctx.setLorePool('test',card.character_book.entries);rt.response({you:{spells:['Fireball','Touki-enhanced diagonal cut'],study:[{spell:'Shoulder feint',progress:null}]}});let calls=0;rt.quiet(()=>calls++);await rt.ctx.runSeparateUpdate('test');const d=rt.ctx.getSwipeData(rt.messages[1]);assert(d.survival.spells.includes('Touki-enhanced diagonal cut'));assert.equal(calls,1);const p=rt.events.filter(x=>x.type==='state').at(-1).hms;assert.equal(p.magic.spellbook.length,1);assert.equal(p.magic.list.studying.length,0);
});
test('Failed drills and denied mastery cannot turn an inconsistent provider label into Mastered',()=>{
 for(const quote of ['You failed the diagonal cut; the instructor criticizes your balance.','You have not mastered the diagonal cut.']){const name='Compact diagonal cut';const p=panel({abilities:[{name,owner:'you',state:'mastered',historical:false,evidence:quote}]},{},quote);assert.equal(martial(p).find(x=>x.name===name).state,'Reported assessment');assert.equal(p.magic.spellbook.length,0);}
 const quote='You have mastered the compact diagonal cut.';const p=panel({abilities:[{name:'Compact diagonal cut',owner:'you',state:'mastered',historical:false,evidence:quote}]},{},quote);assert.equal(martial(p).find(x=>x.name==='Compact diagonal cut').state,'Mastered');
});
test('Malformed legacy study storage cannot interrupt existing panel processing',()=>{
 const m=message({spells:['Fireball']});m.metadata.rpg_companion.swipes[0].quests=[{key:'recorded task',name:'Recorded task',objective:'Inspect the wall'}];const p=c.hmsPanelState('classification',[m],{spellStudy:{legacy:true}});assert.equal(p.magic.spellbook[0].name,'Fireball');assert.equal(p.systems.quests.length,1);
});
if(process.argv.includes('--browser-fixture')) console.log(JSON.stringify(panel({spells:['Water Ball','Rock Bullet','Fireball',...maneuvers],study:[{spell:'Stone Cannon',progress:40,note:'Measured magic practice.'},{spell:"Breaking an opponent's footing",progress:null}]})));
else (async()=>{let failed=0;for(const[n,f]of tests){try{await f();console.log('PASS '+n)}catch(e){failed++;console.error('FAIL '+n+': '+e.message)}}console.log(`${tests.length-failed}/${tests.length} magic classification groups passed`);if(failed)process.exitCode=1})();
