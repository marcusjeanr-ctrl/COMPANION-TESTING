// Counts-only read-only export replay. No provider calls or private text in output.
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {runtime}=require('./test_panel_tracking.cjs');
const raw=fs.readFileSync(process.argv[2]),input=JSON.parse(raw),r=runtime(process.env.COMPANION_3_BASELINE),c=r.ctx;
if(process.argv[3])r.run(`userNameCache.set('audit3', ${JSON.stringify(process.argv[3])})`);
const card=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz'))).data;c.setLorePool('audit3',card.character_book.entries);
const chat=input.messages.map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')}));c.companionMarkTurnPurposes(chat);const before=JSON.stringify(chat),st=c.emptyChatState(),p=c.hmsPanelState('audit3',chat,st),all=p.magic.list.schools.flatMap(x=>x.spells),fold=c.spellStoryFold(chat,'audit3');
const result={sha256:crypto.createHash('sha256').update(raw).digest('hex'),messages:chat.length,reports:chat.filter(m=>c.getSwipeData(m)).length,
 magic:{canonicalKnown:all.filter(x=>['known','mastered'].includes(x.status)).length,knownOther:all.filter(x=>x.school==='Other'&&['known','mastered'].includes(x.status)).length,mastered:all.filter(x=>x.status==='mastered').length,activeStudy:p.magic.list.studying.filter(x=>!x.done).length,reportedStudy:fold.progress.size},
 quests:{cards:p.systems.quests.length,reportedNumericProgress:p.systems.quests.filter(x=>x.progress!==null&&x.progress!==undefined).length,progressWithNoPercentageInSource:chat.reduce((n,m)=>n+(c.getSwipeData(m)?.quests||[]).filter(q=>q.progress!==null&&q.progress!==undefined&&!/\d+(?:\.\d+)?\s*(?:%|percent)/i.test(m.content)).length,0)},
 family:{members:p.family.members.length},agenda:{scheduled:p.agenda.items.length},minds:{people:p.minds.people.length},gear:{items:p.gear.items.length},money:{transactions:p.money.ledger.length},factions:{memberships:p.factions.items?.length??p.factions.list?.length??0},
 sourceUnchanged:JSON.stringify(chat)===before};
assert(result.sourceUnchanged);assert(raw.equals(fs.readFileSync(process.argv[2])));console.log(JSON.stringify(result));
