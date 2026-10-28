// Counts-only, read-only replay of the private five-message spell audit.
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {runtime}=require('./test_panel_tracking.cjs');
const raw=fs.readFileSync(process.argv[2]),input=JSON.parse(raw),r=runtime(process.env.COMPANION_MAGIC_BASELINE),c=r.ctx;
const card=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz'))).data;
c.setLorePool('magic-export',card.character_book.entries);
const chat=input.messages.map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')}));c.companionMarkTurnPurposes(chat);const before=JSON.stringify(chat);
const last=chat.filter(x=>x.role==='assistant').at(-1),sys=c.hmsReadSystems(c.parseHud(last.content)),st=c.emptyChatState();
const p=c.hmsMagicPanel(chat,st,null,sys,'magic-export'),rows=p.list.schools.flatMap(x=>x.spells),known=rows.filter(x=>['known','mastered'].includes(x.status));
const names=['Squall','Blizzard Storm','Ice Fortress','Stone Cannon','Earth Pillar','Earth Lance','Sinkhole','Fireball','Heat Hand','Ground Sense'];
if(!process.env.COMPANION_MAGIC_BASELINE){
 assert.equal(known.length,10);assert.equal(p.spellbook.length,10);for(const name of names)assert.equal(known.filter(x=>x.name===name).length,1,name);
 assert.equal(known.filter(x=>x.school==='Other').length,0);assert.equal(known.filter(x=>x.status==='mastered').length,0);
 const ground=known.find(x=>x.name==='Ground Sense');assert(/weak|distance/i.test(ground.note||ground.evidence?.evidence||''));
 assert.equal(rows.find(x=>x.name==='Riptide Fang').status,'locked');
 const reboot=runtime();reboot.ctx.setLorePool('magic-export',card.character_book.entries);assert.equal(reboot.ctx.spellKnown(JSON.parse(JSON.stringify(chat)),{},null,'magic-export').size,10);
}
const originalContent=last.content;last.content+=' Synthetic source edit.';assert.equal(c.getSwipeData(last),null);last.content=originalContent;
assert.equal(JSON.stringify(chat),before);assert(raw.equals(fs.readFileSync(process.argv[2])));
console.log(JSON.stringify({messages:chat.length,reports:chat.filter(m=>c.getSwipeData(m)).length,spellbook:p.spellbook.length,
 canonicalAuditSpellsKnown:known.filter(x=>names.includes(x.name)).length,malformedKnownOther:known.filter(x=>x.school==='Other').length,
 sourceUnchanged:true,sha256:crypto.createHash('sha256').update(raw).digest('hex')}));
