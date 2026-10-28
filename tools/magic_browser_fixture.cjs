// Synthetic spell audit, real pipeline and complete card; no private conversation.
const fs=require('node:fs'),z=require('node:zlib');
const {runtime,seed,hud}=require('./test_panel_tracking.cjs');
(async()=>{
 const r=runtime();seed(r,true);const d=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/living_world_fixture.json.gz'))).data;
 r.ctx.setLorePool('test',d.character_book.entries);
 r.messages[1].content=hud('Study','08:00',true).replace('Water: Intermediate','Water: Advanced')+'\nYour tutor confirms your established abilities.';
 r.response({you:{spells:['Water Magic (Advanced): Squall, Blizzard Storm, Ice Fortress','Earth Magic (Intermediate): Stone Cannon, Earth Pillar, Earth Lance, Sinkhole','Fire Magic (Elementary): Fireball, Heat Hand','Ground Sense (weak — never held over distance)','Voiceless Casting','Sword God Style: Advanced']}});
 await r.ctx.runSeparateUpdate('test');console.log(JSON.stringify(r.events.filter(e=>e.type==='state').at(-1)));
})().catch(e=>{console.error(e);process.exitCode=1});
