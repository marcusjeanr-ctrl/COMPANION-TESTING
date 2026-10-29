// Actual normal interceptor, cached full cards; no live model/tokenizer involved.
const fs=require('node:fs'),z=require('node:zlib'),path=require('node:path');
const {performance}=require('node:perf_hooks');const {runtime,seed,hud}=require('./test_panel_tracking.cjs');
const median=a=>a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)];
(async()=>{for(const file of process.argv.slice(2).length?process.argv.slice(2):[path.join(__dirname,'../dist/backend.js')])for(const cardId of ['six_sided_world','living_world'])for(const scenario of ['ordinary','named','inventory','host-provided','general','shared']){
 const r=runtime(path.resolve(file));seed(r,true);r.run('settings.lore.enabled=true; settings.hmsSystems.magic={enabled:true};');
 const card=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/'+cardId+'_fixture.json.gz'))).data;r.ctx.setLorePool('test',card.character_book.entries);
 const req=scenario==='ordinary'?'I eat breakfast.':scenario==='named'?'Explain Ice Pillar.':scenario==='general'?'Explain Longsword of Light and the Asura Gold Coin.':scenario==='shared'?'Explain Ice Pillar and the Asura Gold Coin.':'List all Water, Earth and Fire spells.';
 r.messages.length=0;r.messages.push({id:'a',role:'assistant',content:hud('Study','08:00',cardId==='living_world')},{id:'u',role:'user',content:req});
 const supplied=scenario==='host-provided'?card.character_book.entries.find(e=>e.id===(cardId==='living_world'?476:959)).content:null;
 const calls={};for(const group of ['chat','world_books','storage','generate'])for(const [key,fn]of Object.entries(r.ctx.spindle[group]))if(typeof fn==='function'){r.ctx.spindle[group][key]=function(...args){calls[group+'.'+key]=(calls[group+'.'+key]||0)+1;return fn.apply(this,args);};}
 const intercept=r.run('rpgcInterceptor');let output;const pass=async()=>{const m=[{role:'system',content:'Follow the actual card.'},...(supplied?[{role:'system',content:supplied}]:[]),...r.messages.map(x=>({...x,__isChatHistory:true}))];const result=await intercept(m,{chatId:'test',generationType:'normal'});output=result.messages||result;};
 let start=performance.now();await pass();const cold=performance.now()-start;for(let i=0;i<5;i++)await pass();const samples=[];
 const before={...calls};for(let i=0;i<30;i++){start=performance.now();await pass();samples.push(performance.now()-start);}
 const report=r.run("lastInjection.get('test')?.spellReferences"), lore=r.run("lastInjection.get('test')?.loreReferences"), callsPerPass=Object.fromEntries(Object.entries(calls).map(([k,v])=>[k,(v-(before[k]||0))/30]));
 const fresh=[];for(let i=0;i<10;i++){r.messages.at(-1).content=req+' [reference check '+i+']';start=performance.now();await pass();fresh.push(performance.now()-start);}
 console.log(JSON.stringify({file,card:cardId,scenario,coldMs:+cold.toFixed(3),warmMedianMs:+median(samples).toFixed(3),changedRequestMedianMs:+median(fresh).toFixed(3),spellCharacters:report?.characters||0,loreCharacters:lore?.characters||0,loreAdded:lore?.added?.length||0,systemCharacters:output.filter(x=>x.role==='system').reduce((n,x)=>n+x.content.length,0),callsPerPass}));
}})().catch(e=>{console.error(e);process.exitCode=1;});
