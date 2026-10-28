// Synthetic observed owned list and family aliases; complete Six-Sided reference.
const fs=require('node:fs'),z=require('node:zlib'),{runtime,hud}=require('./test_panel_tracking.cjs');
const r=runtime(),c=r.ctx;c.setLorePool('six',JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/six_sided_world_fixture.json.gz'))).data.character_book.entries);r.run(`userNameCache.set('six','Pilot Vale')`);
const content=hud()+'\n**SPELL LIST — Pilot Vale**\n**WATER — Advanced**\n- Water Ball *(Beginner · 10)* — confirmed prior knowledge.\n- Squall *(Advanced · 250)* — confirmed prior knowledge.\n***';
const d={family:[{name:'Alden Vale',relation:'father',where:'Library',known:'told',status:'alive'}],characters:[{name:'Alden'}],relations:[{key:'alden',name:'Alden',bond:'father'}]};
const chat=[{id:'six-ui',role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:d},sources:{0:c.readingSource(content)}}}}];console.log(JSON.stringify({hms:c.hmsPanelState('six',chat,c.emptyChatState()),world:c.worldMushoku('six',c.worldLines(c.parseHud(content)),c.emptyChatState())}));
