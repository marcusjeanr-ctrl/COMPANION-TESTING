// Read every supplied entry through the actual runtime; output contains no private prose.
// Usage: node tools/audit_living_world.cjs [CARD_JSON] [PRIVATE_CHAT_EXPORT]
const fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {runtime}=require('./test_panel_tracking.cjs');
const bytes=process.argv[2]?fs.readFileSync(process.argv[2]):zlib.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz'));
const input=JSON.parse(bytes),c=runtime(process.env.COMPANION_LIVING_BASELINE).ctx,card=input.data;
const entries=card.character_book.entries;c.setLorePool('living-audit',entries);
const spells=c.spellCatalog('living-audit'),tech=c.techCatalog('living-audit');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const result={cardParsedSha256:hash(JSON.stringify(input)),entries:[],greetings:[],spells:spells.length,techniques:tech.length,
 automaticKnowledge:c.spellKnown([],{},null,'living-audit').size,automaticNpcs:c.simFold([],c.emptyChatState()).minds.size};
for(const entry of entries){
 const normalized=c.loreNormEntry(entry);assert.equal(!!normalized,entry.enabled!==false&&entry.disabled!==true);
 if(normalized){assert.equal(normalized.content,entry.content.trim());assert.equal(normalized.id,String(entry.id));}
 const sr=[],tr=[];if(normalized){c.spellsFromEntry(normalized,sr);c.techsFromEntry(normalized,tr);}
 result.entries.push({id:entry.id,enabled:!!normalized,contentSha256:hash(entry.content),
  directSpells:sr.map(x=>({name:x.name,school:x.school,step:x.step,kind:x.kind,fan:x.fan})),
  directTechniques:tr.map(x=>({name:x.name,style:x.style,step:x.step,fan:x.fan})),
  catalogSpellNames:spells.filter(x=>String(x.src)===String(entry.id)).map(x=>x.name),
  catalogTechniqueNames:tech.filter(x=>String(x.src)===String(entry.id)).map(x=>x.name)});
}
for(const [i,text]of [card.first_mes,...card.alternate_greetings].entries())result.greetings.push({index:i,activeHud:!!c.parseHud(text)});
assert.equal(result.automaticKnowledge,0);assert.equal(result.automaticNpcs,0);
if(process.argv[3]){
 const original=fs.readFileSync(process.argv[3]),j=JSON.parse(original),chat=j.messages.map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')}));
 c.companionMarkTurnPurposes(chat);const before=JSON.stringify(chat),last=chat.filter(m=>m.role==='assistant').at(-1),h=c.parseHud(last.content),st=c.emptyChatState();
 const w=c.worldMushoku('living-audit',c.worldLines(h),st),ag=c.agendaRead(chat,st),reports=chat.filter(m=>c.getSwipeData(m));
 assert.equal(chat.length,3);assert.equal(reports.length,1);assert.equal(ag.items.length,2);
 assert.equal(w.year,417);assert.equal(w.day,1);assert.equal(w.magic.length,3);assert.equal(w.martial[0].step,2);
 assert.equal(w.saga.current,null);assert.equal(w.saga.next,null);
 assert.equal(c.spellKnown(chat,st,null,'living-audit').size,0,'School rank must not grant individual spells');
 c.statesFill('living-export',chat);assert(c.statesReading(last));
 const source=last.content;last.content+=' Edited source.';assert.equal(c.getSwipeData(last),null);last.content=source;
 assert.equal(JSON.stringify(chat),before);assert(original.equals(fs.readFileSync(process.argv[3])));
 result.privateExport={sha256:hash(original),messages:3,reports:1,distinctAgendaEvents:2,individualAbilities:0,
  internalStatesReadable:true,sourceEditRejected:true,sourceUnchanged:true,scope:'Opening scene only; no live re-extraction'};
}
console.log(JSON.stringify(result));
