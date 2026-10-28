// Synthetic source-bound regressions; never bundle a private chat export.
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');const {runtime,hud,seed}=require('./test_panel_tracking.cjs');
const baseline=process.env.COMPANION_FINAL_BASELINE,cases=[],test=(n,f)=>cases.push([n,f]);
function setup(){const r=runtime(baseline);seed(r,true);return r;}
function message(c,id,data={},body='',head=hud()){const content=head+'\n'+body;return {id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:data},sources:{0:c.readingSource(content)}}}};}
function campaign(c,data){return [message(c,'origin',data),...Array.from({length:320},(_,i)=>message(c,'later'+i))];}
test('Family persists off scene past the 300-report window without inventing presence or death',()=>{
 const c=setup().ctx,chat=campaign(c,{family:[{name:'Alden Vale',relation:'father',status:'alive',where:'Library',known:'seen'}]});const p=c.hmsFamilyPanel(chat,{});assert.equal(p.members.length,1);assert.equal(p.members[0].status,'alive');assert.equal(p.members[0].where,'Library');assert.equal(p.members[0].present,false);
 chat.push(message(c,'return',{family:[{name:'Alden',relation:'father',where:'Harbor',known:'seen'}]}));const back=c.hmsFamilyPanel(chat,{});assert.equal(back.members.length,1);assert.equal(back.members[0].name,'Alden Vale');assert.equal(back.members[0].where,'Harbor');assert(back.members[0].present);
});
test('Old property, lost property and explicit new acquisition survive sparse later turns',()=>{
 const c=setup().ctx,chat=campaign(c,{holdings:[{key:'workshop',name:'Workshop',kind:'business',state:'gained'}]});assert.equal(c.holdRead(chat,{}).items.length,1);chat.push(message(c,'loss',{holdings:[{key:'workshop',name:'Workshop',state:'lost'}]}));assert(c.holdRead(chat,{}).items[0].lost);chat.push(message(c,'regain',{holdings:[{key:'workshop',name:'Workshop',state:'gained'}]}));assert(!c.holdRead(chat,{}).items[0].lost);
});
test('Source edits, swipe selection, hidden/deleted history and restored JSON cannot retain stale old records',()=>{
 const c=setup().ctx,original=campaign(c,{family:[{name:'Alden Vale',relation:'father',status:'alive'}],holdings:[{key:'estate',name:'Estate',state:'gained'}]});
 for(const mode of ['edit','swipe','hidden','delete']){const chat=JSON.parse(JSON.stringify(original));assert.equal(c.famRead(chat,{}).members.length,1);if(mode==='edit')chat[0].content+=' changed';if(mode==='swipe')chat[0].swipe_id=1;if(mode==='hidden')chat[0].hidden=true;if(mode==='delete')chat.shift();assert.equal(c.famRead(chat,{}).members.length,0);assert.equal(c.holdRead(chat,{}).items.length,0);}
 assert.equal(c.famRead(JSON.parse(JSON.stringify(original)),{}).members.length,1);
});
test('Old observation anchors respect manual pins until reliable newer observations',()=>{
 const c=setup().ctx,chat=campaign(c,{family:[{name:'Alden Vale',relation:'father',status:'alive',where:'Library',known:'seen'}],holdings:[{key:'estate',name:'Estate',kind:'property',state:'gained',where:'North'}]});const st={family:{pins:{'alden vale':{where:'West',after:'later319'}}},holdings:{edits:{estate:{where:'East',after:'later319'}}}};assert.equal(c.famRead(chat,st).members[0].where,'West');assert.equal(c.holdRead(chat,st).items[0].where,'East');chat.push(message(c,'new',{family:[{name:'Alden Vale',relation:'father',where:'Harbor',known:'seen'}],holdings:[{key:'estate',name:'Estate',where:'South',state:'changed'}]}));assert.equal(c.famRead(chat,st).members[0].where,'Harbor');assert.equal(c.holdRead(chat,st).items[0].where,'South');
});
test('Old continuation snapshots retain family but never replay copied property transactions',()=>{
 const c=setup().ctx,chat=campaign(c,{family:[{name:'Alden Vale',relation:'father',status:'alive'}],holdings:[{key:'estate',name:'Estate',state:'gained'}]});chat[0]._rpgcPurpose='continue';assert.equal(c.famRead(chat,{}).members.length,1);assert.equal(c.holdRead(chat,{}).items.length,0);
});
test('Both calendars retain old observation dates, while undated history does not invent a date',()=>{
 const c=setup().ctx;for(const living of [false,true]){const head=hud('Library','08:00',living);const chat=campaign(c,{});chat[0]=message(c,'origin',{family:[{name:'Alden Vale',relation:'father',where:'Library',known:'seen'}],holdings:[{key:'estate',name:'Estate',state:'gained'}]},'',head);const a=c.famRead(chat,{}).members[0];assert(a);assert.equal(a.at,c.hmsClock(c.parseHud(head)).minutes);assert.equal(c.holdRead(chat,{}).items[0].since,a.at);}
 const undated=campaign(c,{});undated[0]=message(c,'old',{family:[{name:'Alden Vale',relation:'father',where:'Library',known:'seen'}]},'','### WORLD STATE ###\nTime: 08:00\n***');assert.equal(c.famRead(undated,{}).members[0].at,null);
});
test('Reading old state is local, source-bound and does not rewrite observations',()=>{
 const r=setup(),c=r.ctx,chat=campaign(c,{family:[{name:'Alden Vale',relation:'father',status:'alive'}],holdings:[{key:'estate',name:'Estate',state:'gained'}]}),before=JSON.stringify(chat);const fail=()=>{throw Error('Unexpected API');};c.spindle.generate.quiet=fail;c.spindle.chat.getMessages=fail;c.spindle.storage.setJson=fail;c.spindle.world_books.getActivated=fail;c.withReadPass(chat,()=>{assert.equal(c.famRead(chat,{}).members.length,1);assert.equal(c.holdRead(chat,{}).items.length,1);});assert.equal(JSON.stringify(chat),before);
});
function assessment(c,quote,state='mastered',extra={}){return message(c,'assessment',{survival:{...extra,abilities:[{name:'Ice Pillar',owner:'you',historical:false,state,evidence:quote}]}},quote);}
test('Contradictory or absent mastery evidence cannot award Magic mastery through either field',()=>{
 const r=setup(),c=r.ctx;c.setLorePool('test',JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/six_sided_world_fixture.json.gz'))).data.character_book.entries);
 for(const quote of ['You have not mastered Ice Pillar.','You practiced Ice Pillar, but the exercise failed.','Your Ice Pillar mastery is not established.',"You haven't mastered Ice Pillar."]){const chat=[assessment(c,quote,'mastered',{mastered:['Ice Pillar']})];assert(!c.spellKnown(chat,{},null,'test').get('ice pillar')?.mastered);const p=c.hmsPanelState('test',chat,{});assert.notEqual(p.magic.list.schools.flatMap(x=>x.spells).find(x=>x.name==='Ice Pillar').status,'mastered');}
});
test('Explicit mastery works; an inconsistent later report does not erase established knowledge',()=>{
 const c=setup().ctx,a=assessment(c,'You have mastered Ice Pillar.'),b=assessment(c,'You have not mastered Ice Pillar.');b.id='later';assert(c.spellKnown([a],{}).get('ice pillar').mastered);assert(c.spellKnown([a,b],{}).get('ice pillar').mastered);const only=assessment(c,'You have not only mastered Ice Pillar but also refined its shape.');assert(c.spellKnown([only],{}).get('ice pillar').mastered);
});
test('Diagnostics distinguish quote mismatch and unsupported mastery from valid metadata',()=>{
 const c=setup().ctx,m=assessment(c,'You practiced Ice Pillar.');m.metadata.rpg_companion.swipes[0].survival.abilities.push({name:'Fireball',owner:'you',state:'known',historical:false,evidence:'An invented quotation.'});const q=c.abilityEvidenceAudit(m,c.getSwipeData(m));assert.equal(q.reported,2);assert.equal(q.sourceMatched,1);assert.equal(q.sourceMismatch,1);assert.equal(q.unverifiedMastery,1);assert(!JSON.stringify(q).includes('invented quotation'));
});
test('Actual diagnostic output exposes assessment counts and labels its bounded reply preview',async()=>{
 const r=setup(),c=r.ctx,m=assessment(c,'You practiced Ice Pillar.');m.content+=' '.repeat(3200);m.metadata.rpg_companion.sources[0]=c.readingSource(m.content);r.messages.length=0;r.messages.push(m);const before=JSON.stringify(m),d=await c.hmsDiagnostics('test',true);assert.equal(d.chat.trackingMetadata.assessmentEvidence.unverifiedMastery,1);assert.equal(d.chat.trackingMetadata.assessmentEvidence.sourceMatched,1);assert.equal(d.lastReplyTruncated,true);assert.equal(d.lastReply.length,3000);assert.equal(JSON.stringify(m),before);
});
function browserFixture(){const r=setup(),c=r.ctx;c.setLorePool('test',JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/six_sided_world_fixture.json.gz'))).data.character_book.entries);const chat=campaign(c,{family:[{name:'Alden Vale',relation:'father',status:'alive',where:'Library',known:'seen'}],holdings:[{key:'workshop',name:'Workshop',kind:'business',state:'gained'}]});chat.push(assessment(c,'You have not mastered Ice Pillar.'));return c.hmsPanelState('test',chat,{});}
if(process.argv.includes('--browser-fixture'))console.log(JSON.stringify(browserFixture()));else (async()=>{let failed=0;for(const[n,f]of cases){try{await f();console.log('PASS '+n)}catch(e){failed++;console.error('FAIL '+n+': '+e.message)}}console.log(`${cases.length-failed}/${cases.length} release-integrity groups passed`);if(failed)process.exitCode=1})();
