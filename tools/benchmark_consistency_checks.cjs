// Focused cached-lore consistency check; mocked host, no model calls.
const {performance}=require('node:perf_hooks');const {runtime,hud}=require('./test_panel_tracking.cjs');
const files=process.argv.slice(2);if(!files.length)files.push(require('node:path').join(__dirname,'../dist/backend.js'));
for(const file of files){
 const r=runtime(file),c=r.ctx;const start='Generic_RPG_Start_Handler\n'+('Setting: retained\n'.repeat(150))+'Touki: inactive at rest';
 const chat=[{id:'u',role:'user',content:start},{id:'a',role:'assistant',content:hud().replace('Reserve: Full','Reserve: Full | Status: Rested')}];
 c.setLorePool('bench',[...Array.from({length:1272},(_,i)=>({id:String(i),key:['Reference_'+i,'Alias_'+i],content:'Reference material'})),{id:'handler',key:['Generic_RPG_Start_Handler'],content:'Touki: inactive at rest'}]);
 const parsed=c.parseHud(chat[1].content),samples=[];const run=()=>c.withReadPass(chat,()=>c.consistencyWarnings('bench',chat,parsed,null));
 for(let i=0;i<3;i++)run();for(let i=0;i<20;i++){let t=performance.now();let w=run();if(!w.some(x=>x.code==='start-setting'))throw Error('Missing warning');samples.push(performance.now()-t)}samples.sort((a,b)=>a-b);
 console.log(JSON.stringify({file,entries:1273,startCharacters:start.length,medianMs:(samples[9]+samples[10])/2,warnings:r.warnings.length}));
}
