// Counts-only replay of a local training export; no provider call or source mutation.
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {runtime,hud}=require('./test_panel_tracking.cjs');const r=runtime(process.env.COMPANION_CLASSIFICATION_BASELINE),c=r.ctx;
c.setLorePool('classification',JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/six_sided_world_fixture.json.gz'))).data.character_book.entries);
const raw=fs.readFileSync(process.argv[2]),j=JSON.parse(raw),chat=j.messages.map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')}));c.companionMarkTurnPurposes(chat);const before=JSON.stringify(chat),p=c.hmsPanelState('classification',chat,c.emptyChatState()),rows=p.magic.list.schools.flatMap(x=>x.spells),martial=p.systems.abilities.filter(x=>/martial/i.test(x.category)).flatMap(x=>x.items);
const output={sha256:crypto.createHash('sha256').update(raw).digest('hex'),messages:chat.length,validReports:chat.filter(m=>c.getSwipeData(m)).length,spellbook:p.magic.spellbook.length,knownMagic:rows.filter(x=>['known','mastered'].includes(x.status)).length,magicStudy:p.magic.list.studying.length,martialItems:martial.length,masteredMartial:martial.filter(x=>x.state==='Mastered').length,touki:c.worldMushoku('classification',c.worldLines(c.parseHud(chat.at(-1).content)),{}).touki,sourceUnchanged:JSON.stringify(chat)===before};
assert(output.sourceUnchanged);assert(raw.equals(fs.readFileSync(process.argv[2])));
// Exact entire Magic payload parity on an otherwise identical legitimate-magic scene.
const content=hud()+'\nYou study a spell.',m={id:'magic-only',role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:{survival:{spells:['Water Ball','Rock Bullet','Fireball','Uncatalogued Beacon'],study:[{spell:'Stone Cannon',progress:40,note:'Measured practice.'}]}}},sources:{0:c.readingSource(content)}}}};
const golden=c.hmsPanelState('classification',[m],c.emptyChatState()).magic;output.legitimateMagicPayloadSha256=crypto.createHash('sha256').update(JSON.stringify(golden)).digest('hex');
if(!process.env.COMPANION_CLASSIFICATION_BASELINE){assert.equal(output.spellbook,0);assert.equal(output.knownMagic,0);assert.equal(output.magicStudy,0);assert.equal(output.masteredMartial,0);assert(martial.length>0);}
console.log(JSON.stringify(output));
