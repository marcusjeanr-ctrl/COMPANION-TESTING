const assert=require('node:assert/strict');
const {runtime}=require('./test_panel_tracking.cjs');
const r=runtime(),c=r.ctx;
function message(id,content,survival={ate:true}){
 return {id,swipe_id:0,role:'assistant',content,metadata:{rpg_companion:{swipes:{0:{survival}}}}};
}
const m=message('same-length-edit','Marcus ate.');
const accepted=c.getSwipeData(m);assert.equal(accepted.survival.ate,true);
assert.equal(c.getSwipeData(m),accepted);
const originalLength=m.content.length;m.content='Marcus ran.';
assert.equal(m.content.length,originalLength);
const changed=c.getSwipeData(m);assert.equal(changed.survival.ate,false);
assert.deepEqual(Array.from(changed.survival.unconfirmed),['ate']);
assert.equal(c.getSwipeData(m),changed);
m.content='Marcus ate.';assert.equal(c.getSwipeData(m).survival.ate,true);
const replacement=message(m.id,'Marcus ran.');
assert.equal(c.getSwipeData(replacement).survival.ate,false,'A reused id cannot reuse a previous content verdict');
replacement.metadata.rpg_companion.swipes[1]={survival:{drank:true}};
replacement.swipe_id=1;replacement.content='Marcus drank water.';
assert.equal(c.getSwipeData(replacement).survival.drank,true);
replacement.content='Marcus spoke calmly.';
assert.equal(c.getSwipeData(replacement).survival.drank,false);
const noFlags=message('no-flags','',{ate:false,drank:false,slept:false,rested:false,mood:'calm'});
Object.defineProperty(noFlags,'content',{get(){throw new Error('False flags must not read prose');}});
assert.equal(c.getSwipeData(noFlags).survival.mood,'calm');
assert.equal(r.writes.length,0);assert.equal(r.warnings.length,0);
console.log('Survival cache: repeated reads, same-length edits, replacement ids, swipe changes and no-prose false-flag fast path passed');
if(process.argv[2]){
 const fs=require('node:fs'),bytes=fs.readFileSync(process.argv[2]),j=JSON.parse(bytes);
 assert.equal(j.messages.length,39);
 const m={...j.messages[2],role:'assistant'},before=JSON.stringify(m),y=c.getSwipeData(m).survival;
 assert.equal(y.slept,false);assert(Array.from(y.unconfirmed).includes('slept'));
 assert.equal(y.ate,false,'Food references must not promote a false reported flag');
 assert.equal(y.drank,false);assert.equal(y.rested,false);
 assert.equal(JSON.stringify(m),before);assert(bytes.equals(fs.readFileSync(process.argv[2])));
 console.log('Private reply 2: unsupported sleep rejected; all reported-false actions stay false; input unchanged');
}
