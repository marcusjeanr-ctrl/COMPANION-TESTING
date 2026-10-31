const assert=require('node:assert/strict');
const {runtime}=require('./test_panel_tracking.cjs');
const r=runtime(),c=r.ctx;
function evidence(m) { return c.survivalFlagReading(m,c.getSwipeData(m)); }
function message(id,content,survival={ate:true}){
 return {id,swipe_id:0,role:'assistant',content,metadata:{rpg_companion:{swipes:{0:{survival}}}}};
}
const m=message('same-length-edit','Marcus ate.');
const accepted=evidence(m);assert.equal(accepted.survival.ate,true);
assert.equal(evidence(m),accepted);
const originalLength=m.content.length;m.content='Marcus ran.';
assert.equal(m.content.length,originalLength);
const changed=evidence(m);assert.equal(changed.survival.ate,false);
assert.deepEqual(Array.from(changed.survival.unconfirmed),['ate']);
assert.equal(evidence(m),changed);
m.content='Marcus ate.';assert.equal(evidence(m).survival.ate,true);
const replacement=message(m.id,'Marcus ran.');
assert.equal(evidence(replacement).survival.ate,false,'A reused id cannot reuse a previous content verdict');
replacement.metadata.rpg_companion.swipes[1]={survival:{drank:true}};
replacement.swipe_id=1;replacement.content='Marcus drank water.';
assert.equal(evidence(replacement).survival.drank,true);
replacement.content='Marcus spoke calmly.';
assert.equal(evidence(replacement).survival.drank,false);
const noFlags=message('no-flags','',{ate:false,drank:false,slept:false,rested:false,mood:'calm'});
Object.defineProperty(noFlags,'content',{get(){throw new Error('False flags must not read prose');}});
assert.equal(evidence(noFlags).survival.mood,'calm');
assert.equal(r.writes.length,0);assert.equal(r.warnings.length,0);
console.log('Survival cache: repeated reads, same-length edits, replacement ids, swipe changes and no-prose false-flag fast path passed');
if(process.argv[2]){
 const fs=require('node:fs'),bytes=fs.readFileSync(process.argv[2]),j=JSON.parse(bytes);
 assert.equal(j.messages.length,39);
 const m={...j.messages[2],role:'assistant'},before=JSON.stringify(m),y=evidence(m).survival;
 assert.equal(y.slept,false);assert(Array.from(y.unconfirmed).includes('slept'));
 assert.equal(y.ate,false,'Food references must not promote a false reported flag');
 assert.equal(y.drank,false);assert.equal(y.rested,false);
 assert.equal(JSON.stringify(m),before);assert(bytes.equals(fs.readFileSync(process.argv[2])));
 console.log('Private reply 2: unsupported sleep rejected; all reported-false actions stay false; input unchanged');
}

// The signed hot path uses the stored source binding and report-object identity.
const signed=message('signed','Marcus ate.');
signed.metadata.rpg_companion.sources={0:c.readingSource(signed.content)};
const raw=c.getSwipeData(signed),verdict=c.survivalFlagReading(signed,raw);
assert.equal(verdict.survival.ate,true);
const textOf=c.textOf;c.textOf=()=>{throw new Error('Signed cache hit must not call textOf');};
try { assert.equal(c.survivalFlagReading(signed,raw),verdict); } finally {c.textOf=textOf;}
signed.content='Marcus ran.';
assert.equal(c.getSwipeData(signed),null,'An old signed report cannot survive changed content');
signed.metadata.rpg_companion.sources[0]=c.readingSource(signed.content);
const edited=c.survivalFlagReading(signed,c.getSwipeData(signed));
assert.equal(edited.survival.ate,false);assert.deepEqual(Array.from(edited.survival.unconfirmed),['ate']);
assert.equal(raw.survival.ate,true,'Cached verdicts never rewrite raw signed reports');
console.log('Signed cache: no textOf on hit; same-length content/source changes invalidate verdicts');
