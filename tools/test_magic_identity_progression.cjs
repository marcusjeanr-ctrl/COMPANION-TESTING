// Synthetic accepted extraction reports, complete original card, real storage/folds/panels.
const assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib');
const {runtime,hud,seed}=require('./test_panel_tracking.cjs');
const card=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz'))).data;
const r=runtime(process.env.COMPANION_MAGIC_BASELINE),c=r.ctx;c.setLorePool('magic',card.character_book.entries);
const tests=[],test=(name,fn)=>tests.push([name,fn]);
const view=()=>hud('Study','08:00',true).replace('Water: Intermediate','Water: Advanced');
function message(id,you,scene='A reliable teacher confirms your established abilities.'){
 const content=view()+'\n'+scene;return {id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:{survival:you}},sources:{0:c.readingSource(content)}}}};
}
function panel(chat,st={}){return c.spellListPanel('magic',chat,st,c.hmsReadSystems(c.parseHud(chat.at(-1).content)));}
function spells(p){return p.schools.flatMap(x=>x.spells);}
test('Grouped known reports reconcile each catalogue spell and exclude reported rank/casting labels',()=>{
 const chat=[message('audit',{spells:['Water Magic (Advanced): Squall, Blizzard Storm, Ice Fortress','Earth Magic (Intermediate): Stone Cannon, Earth Pillar, Earth Lance, Sinkhole','Fire Magic (Elementary): Fireball, Heat Hand','Ground Sense (weak — never held over distance)','Voiceless Casting (since childhood), standard incantations also known','Sword God Style: Advanced']})];
 const before=JSON.stringify(chat),p=panel(chat),known=spells(p).filter(x=>x.status==='known');
 const expected=['Squall','Blizzard Storm','Ice Fortress','Stone Cannon','Earth Pillar','Earth Lance','Sinkhole','Fireball','Heat Hand','Ground Sense'];
 assert.equal(known.length,10);for(const name of expected){const a=known.filter(x=>x.name===name);assert.equal(a.length,1,name);assert(a[0].school!=='Other');}
 assert.equal(c.hmsMagicPanel(chat,{},null,c.hmsReadSystems(c.parseHud(view())),'magic').spellbook.length,10);
 assert(!spells(p).some(x=>/Magic \(|Casting|Style:/.test(x.name)));assert.match(known.find(x=>x.name==='Ground Sense').note,/weak/);
 assert.equal(p.studying.length,0,'A weak skill was misread as current practice');assert.equal(JSON.stringify(chat),before);
});
test('Grouped names, aliases, qualifications and unknown spells never use substring matching',()=>{
 const names=c.spellKnown([message('a',{spells:['Waterball, Ground Sense','Ground Sense (not mastered)','Uncatalogued Beacon','Water Ball Storm']})],{},null,'magic');
 assert(names.has('waterball'));assert(names.has('ground sense'));assert(names.has('uncatalogued beacon'));assert(names.has('water ball storm'));
 assert.equal([...names.keys()].filter(x=>x==='ground sense').length,1);
 assert(!names.has('waterball ground sense'));
 const negative=c.spellKnown([message('b',{spells:['The instructor knows Squall','You might learn Squall','Water Magic (Advanced): not Squall, Blizzard Storm']})],{},null,'magic');assert.equal(negative.size,0);
});
test('Source-backed grouped confirmations retain ownership and never treat a school assessment as spell mastery',()=>{
 const quote='You already know Squall and Blizzard Storm.';
 const chat=[message('a',{abilities:[{name:'Squall, Blizzard Storm',owner:'you',state:'known',historical:true,evidence:quote},{name:'Water Magic (Advanced)',owner:'you',state:'mastered',historical:true,evidence:quote}]},quote)];
 const known=c.spellKnown(chat,{},null,'magic');assert.equal(known.size,2);assert(known.has('squall'));assert(!known.get('squall').mastered);
 for(const bad of [{owner:'NPC'},{speculative:true},{evidence:'An absent quote.'}]){
  const m=message('bad',{abilities:[{name:'Squall',owner:'you',state:'known',historical:false,evidence:quote,...bad}]},quote);assert.equal(c.spellKnown([m],{},null,'magic').size,0);
 }
});
test('All named spells in grouped rank sources retain their independent identity and never become owned by rank',()=>{
 const cat=c.spellCatalog('magic');assert.equal(cat.length,348);
 for(const entry of card.character_book.entries){const n=c.loreNormEntry(entry);if(!n)continue;
  const rows=c.rankedLoreBullets(n);for(const row of rows){const found=cat.find(x=>x.key===c.spellKey(row.name));assert(found,'Missing '+entry.id+':'+row.name);assert(found.effect);assert(found.school===row.school || found.alsoSchools?.includes(row.school),'Lost source school '+row.name);}
 }
 const chat=[message('ranks',{})];assert.equal(c.spellKnown(chat,{},null,'magic').size,0);
 for(const school of ['Water','Fire','Wind','Earth','Healing','Detoxification','Divine Strike','Barrier','Summoning'])
  for(const rank of ['Elementary','Intermediate','Advanced','Saint','King','Emperor','God']){
   const stand=c.spellStanding(c.parseHud(view().replace(/Magic School:[^\n]+/,'Magic School: '+school+': '+rank)).lines);assert.equal(stand.schools.size,1);assert(stand.schools.get(c.spellSchoolKey(school)));
  }
});
test('Melded references preserve explicit component requirements and do not invent rank access',()=>{
 const cat=c.spellCatalog('magic'),r=cat.find(x=>x.name==='Riptide Fang');assert(r.needs.includes('Water')&&r.needs.includes('Wind'));
 let p=panel([message('a',{})]);assert.equal(spells(p).find(x=>x.name==='Riptide Fang').status,'locked');
 const gated=message('ranks',{});gated.content=gated.content.replace(/Magic School:[^\n]+/,'Magic School: Water: Advanced, Wind: Intermediate, Melded: Elementary');gated.metadata.rpg_companion.sources[0]=c.readingSource(gated.content);assert.equal(spells(panel([gated])).find(x=>x.name==='Riptide Fang').status,'locked');
 p=panel([message('known',{spells:['Riptide Fang']})]);assert.equal(spells(p).find(x=>x.name==='Riptide Fang').status,'known');
});
test('Known abilities can retain active deliberate practice and weaknesses without downgrading knowledge',()=>{
 const chat=[message('known',{spells:['Ground Sense']}),message('practice',{study:[{spell:'Ground Sense',progress:null,note:'Still loses the signal at long distance.'}]})];
 let p=panel(chat);assert.equal(spells(p).find(x=>x.name==='Ground Sense').status,'known');assert.equal(p.studying.length,1);assert.equal(p.studying[0].done,false);assert.match(spells(p).find(x=>x.name==='Ground Sense').note,/distance/);assert.equal(p.studying[0].progress,null);
 chat.push(message('mastery',{mastered:['Ground Sense']}));p=panel(chat);assert.equal(spells(p).find(x=>x.name==='Ground Sense').status,'mastered');assert.equal(p.studying[0].done,true);assert.equal(spells(p).find(x=>x.name==='Ground Sense').note,null);
});
test('Retractions, swipes, edits, repeated reports and manual negatives work after grouped normalization',()=>{
 const quote='You can no longer cast Squall.';const chat=[message('a',{spells:['Water Magic (Advanced): Squall, Blizzard Storm']}),message('b',{abilities:[{name:'Squall',owner:'you',state:'forgotten',historical:false,evidence:quote}]},quote)];
 let known=c.spellKnown(chat,{},null,'magic');assert(!known.has('squall'));assert(known.has('blizzard storm'));
 const manual={spellForget:{'blizzard storm':'b'}};assert.equal(c.spellKnown(chat,manual,null,'magic').size,0);
 const clone=JSON.parse(JSON.stringify(chat));clone[1].swipe_id=1;assert.equal(c.spellKnown(clone,{},null,'magic').size,2);clone[0].content+=' Source edit.';assert.equal(c.spellKnown(clone,{},null,'magic').size,0);
 chat.push(message('c',{learned:['Squall']}));known=c.spellKnown(chat,{},null,'magic');assert.equal(known.size,2);
});
test('Accepted user actions/NPC reports/narration survive real refresh and JSON restart with one existing call',async()=>{
 const rt=runtime();seed(rt,true);rt.ctx.setLorePool('test',card.character_book.entries);rt.messages[0].content='I demonstrate a spell I already know.';
 rt.messages[1].content=view()+'\nA tutor confirms your established spell list.';
 rt.response({you:{spells:['Water Magic (Advanced): Squall, Blizzard Storm, Ice Fortress']}});let calls=0;rt.quiet(()=>calls++);await rt.ctx.runSeparateUpdate('test');
 assert.equal(rt.ctx.spellKnown(rt.messages,{},null,'test').size,3);await rt.ctx.runSeparateUpdate('test');assert.equal(calls,2);
 const restarted=runtime();restarted.ctx.setLorePool('test',card.character_book.entries);restarted.messages.push(...JSON.parse(JSON.stringify(rt.messages)));assert.equal(restarted.ctx.spellKnown(restarted.messages,{},null,'test').size,3);
});
test('Every canonical reference can be individually Known without duplication or inferred mastery',()=>{
 const cat=c.spellCatalog('magic'),chat=cat.map((row,i)=>message('spell-'+i,{spells:[row.name]}));
 const p=panel(chat),rows=spells(p);assert.equal(rows.filter(x=>x.status==='known').length,cat.length);assert.equal(rows.filter(x=>x.status==='mastered').length,0);assert.equal(new Set(rows.map(x=>x.key)).size,rows.length);
});
test('Attempts, NPC demonstrations, raw player intentions and school ranks do not grant individual spells',()=>{
 const quote='You attempted Squall but did not complete it.';
 const chat=[{id:'user',role:'user',content:'I will try Squall. My tutor knows Squall.'},message('reply',{abilities:[{name:'Squall',owner:'you',state:'attempted',historical:false,evidence:quote}]},quote)];
 assert.equal(c.spellKnown(chat,{},null,'magic').size,0);
 chat.push(message('npc',{},'Your tutor demonstrates Blizzard Storm. You watch.'));assert.equal(c.spellKnown(chat,{},null,'magic').size,0);
});
test('Hidden, OOC and continuation reference lists cannot become current owned spells',()=>{
 for(const flag of ['hidden','help','continue']){
  const m=message('reference',{},'Your Known Spells:\n- Squall');if(flag==='hidden')m.hidden=true;else m._rpgcPurpose=flag;
  assert.equal(c.spellKnown([m],{},null,'magic').size,0,flag);
 }
 const accepted=message('start',{},'Your Known Spells:\n- Squall; Blizzard Storm');assert.equal(c.spellKnown([accepted],{},null,'magic').size,2);
});
test('Old grouped manual negatives remain respected and fresh independent learning restores only its spell',()=>{
 const group='Water Magic (Advanced): Squall, Blizzard Storm';const chat=[message('a',{spells:[group]})];
 const st={spellForget:{[c.spellKey(group)]:'a'}};assert.equal(c.spellKnown(chat,st,null,'magic').size,0);
 chat.push(message('b',{learned:['Squall']}));const k=c.spellKnown(chat,st,null,'magic');assert.equal(k.size,1);assert(k.has('squall'));
 const custom={spellbook:[{name:'Precision Working (custom)',from:'you'}]};assert(c.spellKnown([],custom,null,'magic').has(c.spellKey('Precision Working (custom)')));
});
test('Explicit progress resets are retained during known-spell practice without numerical invention',()=>{
 const chat=[message('a',{spells:['Ground Sense']}),message('b',{study:[{spell:'Ground Sense',progress:40,note:'Controlled practice over ten steps.'}]}),message('c',{study:[{spell:'Ground Sense',progress:0,note:'A new exercise resets the measured drill.'}]})];
 const p=panel(chat);assert.equal(p.studying[0].progress,0);assert.equal(p.studying[0].done,false);assert.equal(spells(p).find(x=>x.name==='Ground Sense').status,'known');
});
test('Catalogue reload invalidates identity caches and preserves distinct longer ability names',()=>{
 const original=card.character_book.entries;
 try{
  c.setLorePool('magic',[...original,{id:'new-beacon',keys:['Astral Beacon','Star Beacon'],comment:'',content:'[SPELL — Astral Beacon]\nSchool: Light · Rank: Elementary\nEffect: A navigation light.'}]);
  assert(c.spellKnown([message('alias',{spells:['Star Beacon']})],{},null,'magic').has('astral beacon'));
  c.setLorePool('magic',original);const k=c.spellKnown([message('without',{spells:['Star Beacon','Astral Beacon Storm']})],{},null,'magic');assert(k.has('star beacon'));assert(k.has('astral beacon storm'));assert(!k.has('astral beacon'));
 }finally{c.setLorePool('magic',original);}
});
test('Weaknesses persist through sparse confirmations and unknown qualified spells remain usable offline',()=>{
 const chat=[message('a',{spells:['Ground Sense (weak over distance)']}),message('b',{spells:['Ground Sense']})];assert.match(spells(panel(chat)).find(x=>x.name==='Ground Sense').note,/distance/);
 const off=runtime();const m=message('unknown',{spells:['Uncatalogued Beacon (weak at range)','Void','Never Ending Flame','Unknown Beacon']});const k=off.ctx.spellKnown([m],{});assert(k.has('uncatalogued beacon'));assert(k.has('void'));assert(k.has('never ending flame'));assert(k.has('unknown beacon'));assert.match(k.get('uncatalogued beacon').note,/range/);
 const names=c.spellKnown([message('mixed',{spells:['Squall, Uncatalogued Beacon','Water (Advanced)','Water (Advanced): Ice Fortress']})],{},null,'magic');assert(names.has('squall'));assert(names.has('uncatalogued beacon'));assert(names.has('ice fortress'));assert(!names.has('water advanced'));
 const unknown=spells(panel([message('uncatalogued',{spells:['Uncatalogued Beacon (weak at range)']})])).find(x=>x.name==='Uncatalogued Beacon');assert.equal(unknown.school,'Other');assert.match(unknown.note,/range/);
});
test('Manual Known finishes old practice while genuinely later practice remains active',async()=>{
 const rt=runtime();seed(rt,true);rt.ctx.setLorePool('test',card.character_book.entries);rt.response({you:{study:[{spell:'Ground Sense',progress:40,note:'Initial practice'}]}});await rt.ctx.runSeparateUpdate('test');
 await rt.frontendHandlers[0]({type:'spell_known',chatId:'test',name:'Ground Sense',on:true});let st=await rt.ctx.getChatState('test');assert.equal(rt.ctx.spellStudyActive(rt.messages,st,null,'test').length,0);
 rt.messages.push({id:'u2',role:'user',content:'I refine its range.'},{id:'a2',role:'assistant',swipe_id:0,content:view()+'\nYou deliberately practice finer control.'});rt.response({you:{study:[{spell:'Ground Sense',progress:null,note:'Refining an already known skill'}]}});await rt.ctx.runSeparateUpdate('test');st=await rt.ctx.getChatState('test');assert.equal(rt.ctx.spellStudyActive(rt.messages,st,null,'test').length,1);
 const p=rt.ctx.spellListPanel('test',rt.messages,st,rt.ctx.hmsReadSystems(rt.ctx.parseHud(view())));assert.equal(spells(p).find(x=>x.name==='Ground Sense').status,'known');assert.equal(p.studying[0].done,false);
 const fresh=message('first',{study:[{spell:'Ground Sense',note:'First refinement'}]});assert.equal(panel([fresh],{spellbook:[{name:'Ground Sense',from:'you'}],spellStudyStopped:{'ground sense':null}}).studying[0].done,false);
});
test('An individual ten-spell confirmation survives parsing and storage without the old eight-name loss',async()=>{
 const names=['Squall','Blizzard Storm','Ice Fortress','Stone Cannon','Earth Pillar','Earth Lance','Sinkhole','Fireball','Heat Hand','Ground Sense'];
 const parsed=c.parseCompanion('<rpg_companion>'+JSON.stringify({you:{spells:names,learned:names,mastered:names}})+'</rpg_companion>');for(const field of ['spells','learned','mastered'])assert.equal(parsed.you[field].length,10,field);
 const rt=runtime();seed(rt,true);rt.ctx.setLorePool('test',card.character_book.entries);rt.response({you:{spells:names}});await rt.ctx.runSeparateUpdate('test');assert.equal(rt.ctx.getSwipeData(rt.messages[1]).survival.spells.length,10);assert.equal(rt.ctx.spellKnown(rt.messages,{},null,'test').size,10);
});
test('Legacy object observations retain names while honoring explicit uncertainty and NPC ownership',()=>{
 const raw={you:{learned:[{name:'Squall',owner:'NPC'},{name:'Blizzard Storm',speculative:true},{name:'Ice Fortress'}],study:[{spell:'Ground Sense',owner:'NPC'},{spell:'Ground Sense',uncertain:true}]}};
 const parsed=c.parseCompanion('<rpg_companion>'+JSON.stringify(raw)+'</rpg_companion>');assert.equal(parsed.you.learned.length,1);assert.equal(parsed.you.learned[0],'Ice Fortress');assert.equal(parsed.you.study.length,0);
 const k=c.spellKnown([message('old',{learned:raw.you.learned})],{},null,'magic');assert.equal(k.size,1);assert(k.has('ice fortress'));
 assert.equal(c.spellStoryFold([message('old-study',{study:raw.you.study})],'magic').progress.size,0);
});
(async()=>{let failures=0;for(const[n,f]of tests){try{await f();console.log('PASS '+n)}catch(e){failures++;console.error('FAIL '+n+': '+e.message)}}if(failures)process.exitCode=1})();
