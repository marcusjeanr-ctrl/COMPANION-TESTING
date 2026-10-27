// Local GC/catalog cost, same complete card and source-bound metadata in both versions.
// node --expose-gc tools/measure_living_world.cjs BACKEND
const fs=require('node:fs'),zlib=require('node:zlib'),{performance}=require('node:perf_hooks');
const {runtime,hud,reading}=require('./test_panel_tracking.cjs');
if(!global.gc)throw new Error('Run with --expose-gc');
const fixture=JSON.parse(zlib.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz')));
global.gc();const startHeap=process.memoryUsage().heapUsed,start=performance.now(),r=runtime(process.argv[2]);
const vmInitMs=performance.now()-start;
for(let i=0;i<1000;i++){
 const content=hud('Courtyard','07:15',true),data=r.ctx.parseCompanion('<rpg_companion>'+JSON.stringify(reading)+'</rpg_companion>');
 r.messages.push({id:'a'+i,role:'assistant',content,swipe_id:0,metadata:{rpg_companion:{swipes:{0:{...data,survival:data.you}},sources:{0:r.ctx.readingSource(content)}}}});
}
r.ctx.setLorePool('measure',fixture.data.character_book.entries);
global.gc();const fixtureHeap=process.memoryUsage().heapUsed;
const cold=performance.now(),spells=r.ctx.spellCatalog('measure'),techniques=r.ctx.techCatalog('measure');
const catalogColdMs=performance.now()-cold;
const samples=[];for(let i=0;i<10;i++){const at=performance.now();r.ctx.spellCatalog('measure');r.ctx.techCatalog('measure');samples.push(performance.now()-at);}
samples.sort((a,b)=>a-b);global.gc();
console.log(JSON.stringify({file:process.argv[2],messages:r.messages.length,enabledEntries:r.ctx.getLorePool('measure').length,
 vmInitMs:+vmInitMs.toFixed(3),fixturePlusVmHeapBytes:fixtureHeap-startHeap,catalogAdditionalHeapBytes:process.memoryUsage().heapUsed-fixtureHeap,
 catalogColdMs:+catalogColdMs.toFixed(3),catalogWarmMedianMs:+((samples[4]+samples[5])/2).toFixed(5),spells:spells.length,techniques:techniques.length}));
