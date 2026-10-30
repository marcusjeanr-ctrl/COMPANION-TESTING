const assert=require('node:assert/strict');
const {runtime,hud}=require('./test_panel_tracking.cjs');
function setup(){return runtime(process.env.COMPANION_REL_BASELINE);}
function reply(c,id,{standing=null,why=null,mode=null,kin=false,start=null,to='you',name='Guild clerk',body='The room is quiet.',relations=true}={}){
 const content=hud('Guild hall',id==='a'?'08:00':'08:01')+'\n'+body;
 const data=c.parseCompanion('<rpg_companion>'+JSON.stringify({characters:[{name}],relations:relations?[{name,standing,why}]:[],minds:[{name,toward:[{name:to,moves:'philia+0',...(mode?{mode}:{}),...(start?{start}:{}),...(kin?{kin:true}:{})}]}]})+'</rpg_companion>');
 return{id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:data},sources:{0:c.readingSource(content)}}}};
}
function projection(c,chat,st=c.emptyChatState(),opt={}){
 const fold=c.simFold(chat,st,opt);return{fold,pair:c.simPanel(fold).people[0].pairs[0]};
}
function warnings(c,chat){return c.hmsPanelState('test',chat,c.emptyChatState()).consistency||[];}
const tests=[],test=(name,fn)=>tests.push([name,fn]);
test('Non-family Close standing supplies warm without rewriting reports or guessed',()=>{
 const r=setup(),c=r.ctx,chat=[reply(c,'a',{standing:'Close'})],before=JSON.stringify(chat),p=projection(c,chat);
 assert.equal(p.pair.mode,'warm');assert.equal(p.pair.modeSource,'standing');assert.equal(p.pair.guessed,true);assert.equal([...p.fold.pairs.values()][0].mode,null);
 assert.equal(JSON.stringify(chat),before);assert.equal(r.writes.length,0);assert(c.simStateText(p.fold,chat,'Marcus').includes('mode warm (default)'));
});
test('Reported, inherited and manually edited modes win over standing defaults',()=>{
 for(const mode of ['stranger','hostile','warm','slow-burn']){
  const c=setup().ctx,chat=[reply(c,'a',{standing:'Close',mode}),reply(c,'b',{standing:'Devoted'})];
  assert.equal(projection(c,chat).pair.mode,mode,mode);assert.equal(projection(c,JSON.parse(JSON.stringify(chat))).pair.mode,mode);
 }
 const c=setup().ctx,m=reply(c,'a',{standing:'Devoted'});c.getSwipeData(m).minds[0].toward[0].mode='measured';assert.equal(projection(c,[m]).pair.mode,'measured');
});
test('Unknown is not reported, with the original axes guessed flag retained',()=>{
 const c=setup().ctx;assert.equal(projection(c,[reply(c,'a')]).pair.mode,'not reported');
 const p=projection(c,[reply(c,'a',{start:'philia 7'})]).pair;assert.equal(p.mode,'not reported');assert.equal(p.guessed,false);
});
test('Hostile and wary defaults cover all NPCs; kin does not erase hostility',()=>{
 for(const [standing,expected] of [['Devoted','warm'],['Friendly','warm'],['Hostile','hostile'],['Enemy','hostile'],['Nemesis','hostile'],['Wary','strained']]){
  const c=setup().ctx;assert.equal(projection(c,[reply(c,'a',{standing,kin:true})]).pair.mode,expected,standing);
 }
 const c=setup().ctx;assert.equal(projection(c,[reply(c,'a',{kin:true})]).pair.mode,'warm');
 assert.equal(projection(c,[reply(c,'a',{standing:'Close',kin:true,mode:'hostile'})]).pair.mode,'hostile');
});
test('Player standing cannot leak into an NPC-to-NPC pair; pair kin may supply warm',()=>{
 const c=setup().ctx;assert.equal(projection(c,[reply(c,'a',{standing:'Devoted',to:'Other clerk'})]).pair.mode,'not reported');
 assert.equal(projection(c,[reply(c,'a',{standing:'Devoted',to:'Other clerk',kin:true})]).pair.mode,'warm');
});
test('Excluded replies and continuation history do not fabricate reported modes',()=>{
 const c=setup().ctx,chat=[reply(c,'a',{standing:'Close'}),reply(c,'b',{standing:'Enemy'})];assert.equal(projection(c,chat,c.emptyChatState(),{excludeId:'b'}).pair.mode,'warm');
 const snap=reply(c,'a',{standing:'Close'});snap._rpgcPurpose='continue';const next=reply(c,'b',{relations:false});assert.equal(projection(c,[snap,next]).pair.mode,'warm');
});
test('Standing drop with positive reason warns without changing that standing',()=>{
 const c=setup().ctx,chat=[reply(c,'a',{standing:'Close'}),reply(c,'b',{standing:'Friend',why:'They felt grateful for your kindness.'})],before=JSON.stringify(chat);
 const w=warnings(c,chat);assert(w.some(x=>x.code==='relationship-positive-drop'));assert(!w.some(x=>x.code==='relationship-jump'));assert.equal(c.hmsRelationsPanel(chat,c.emptyChatState()).people[0].standing,'Friend');assert.equal(JSON.stringify(chat),before);
});
test('Multiple ladder steps with generic or absent reason warn in either direction',()=>{
 for(const [from,to,why] of [['Acquaintance','Close','Their mood changed.'],['Close','Stranger',null]]){
  const c=setup().ctx;assert(warnings(c,[reply(c,'a',{standing:from}),reply(c,'b',{standing:to,why})]).some(x=>x.code==='relationship-jump'));
 }
 const c=setup().ctx;assert.equal(warnings(c,[reply(c,'a',{standing:'Devoted'})]).length,0);
});
test('Explicit legitimate betrayal/drop and rescue/gain do not warn',()=>{
 const c=setup().ctx;
 assert.equal(warnings(c,[reply(c,'a',{standing:'Friend'}),reply(c,'b',{standing:'Wary',why:'You betrayed their trust.'})]).length,0);
 assert.equal(warnings(c,[reply(c,'a',{standing:'Acquaintance'}),reply(c,'b',{standing:'Devoted',why:'You rescued them from the fire.'})]).length,0);
 assert.equal(warnings(c,[reply(c,'a',{standing:'Close'}),reply(c,'b',{standing:'Friend',why:'They are not grateful; you insulted them.'})]).length,0);
});
test('Visible named events justify jumps; other NPCs, examples and hypotheticals do not',()=>{
 for(const [body,expected] of [['The Guild clerk witnessed your attack.',false],['Other clerk witnessed your attack.',true],['> The Guild clerk witnessed your attack.',true],['If the Guild clerk witnessed your attack, things would change.',true]]){
  const c=setup().ctx,chat=[reply(c,'a',{standing:'Close'}),reply(c,'b',{standing:'Wary',body})];assert.equal(warnings(c,chat).some(x=>x.code==='relationship-jump'),expected,body);
 }
});
test('Only the latest valid reply warns; repeated reads, sparse updates and the off switch are safe',()=>{
 const r=setup(),c=r.ctx,a=reply(c,'a',{standing:'Close'}),b=reply(c,'b',{standing:'Stranger'}),chat=[a,b],before=JSON.stringify(chat);
 assert.equal(warnings(c,chat).length,1);assert.equal(warnings(c,chat).length,1);assert.equal(JSON.stringify(chat),before);
 assert.equal(warnings(c,[a,b,reply(c,'c',{relations:false})]).length,0);
 assert.equal(warnings(c,[a,b,reply(c,'c',{standing:null})]).length,0);
 const edited=JSON.parse(JSON.stringify(chat));edited[1].content+=' changed';assert.equal(warnings(c,edited).length,0);
 const swiped=JSON.parse(JSON.stringify(chat));swiped[1].swipe_id=1;assert.equal(warnings(c,swiped).length,0);
 r.run('settings.consistencyChecks=false');assert.equal(warnings(c,chat).length,0);assert.equal(projection(c,[a]).pair.mode,'warm');assert.equal(r.writes.length,0);
});
test('Custom ladders use their own step order, and generic trust changes are not events',()=>{
 const r=setup(),c=r.ctx;r.run("settings.hmsSystems.relations.ladder='Bad, Okay, Great, Trusted';settings.hmsSystems.relations.neutral='Okay'");
 assert(warnings(c,[reply(c,'a',{standing:'Bad'}),reply(c,'b',{standing:'Trusted'})]).some(x=>x.code==='relationship-jump'));
 const other=setup().ctx;assert(warnings(other,[reply(other,'a',{standing:'Acquaintance'}),reply(other,'b',{standing:'Close',why:'Their trust returned.'})]).some(x=>x.code==='relationship-jump'));
 assert(warnings(other,[reply(other,'a',{standing:'Close'}),reply(other,'b',{standing:'Friend',why:'Their trust increased.'})]).some(x=>x.code==='relationship-positive-drop'));
});
test('Malformed legacy relations cannot crash the new context/checker readers',()=>{
 const c=setup().ctx,m=reply(c,'a');c.getSwipeData(m).relations={standing:'Close'};
 const before=JSON.stringify(m);assert.equal(projection(c,[m]).pair.mode,'not reported');assert.equal(c.consistencyWarnings('test',[m],c.parseHud(m.content),null).length,0);assert.equal(JSON.stringify(m),before);
});
test('Mixed positive/negative reasons and short NPC names remain valid',()=>{
 const c=setup().ctx;assert.equal(warnings(c,[reply(c,'a',{standing:'Close'}),reply(c,'b',{standing:'Friend',why:'They appreciated the help but distrusted your motives.'})]).length,0);
 assert.equal(warnings(c,[reply(c,'a',{name:'Li',standing:'Close'}),reply(c,'b',{name:'Li',standing:'Wary',body:'Li witnessed your attack.'})]).length,0);
});
test('Excluded future kin cannot supply a default; explicit user bond pins can',()=>{
 const c=setup().ctx,a=reply(c,'a'),b=reply(c,'b');c.getSwipeData(b).relations[0].bond='father';
 assert.equal(projection(c,[a,b],c.emptyChatState(),{excludeId:'b'}).pair.mode,'not reported');
 const st=c.emptyChatState();st.relPins={'guild clerk':{bond:'father'}};const before=JSON.stringify(st);assert.equal(projection(c,[a],st).pair.mode,'warm');assert.equal(JSON.stringify(st),before);
});
if(process.argv.includes('--browser-fixture')){
 const c=setup().ctx;console.log(JSON.stringify(c.hmsPanelState('test',[reply(c,'a',{standing:'Close'}),reply(c,'b',{standing:'Friend',why:'They felt grateful for your kindness.'})],c.emptyChatState())));
}else{
 let failed=0;for(const[name,fn]of tests){try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
 if(failed)process.exitCode=1;else console.log(`${tests.length} relationship default/drift groups passed.`);
}
