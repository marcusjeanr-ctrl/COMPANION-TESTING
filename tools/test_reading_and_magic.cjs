const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runtime, seed, hud, reading } = require('./test_panel_tracking.cjs');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname,'six_sided_spell_fixture.json'),'utf8'));
async function main() {
    const rt = runtime();seed(rt);
    // Old 2.8.8 settings cannot re-enable the withdrawn evidence/correction path.
    rt.run('settings.trackerSafeguards = {enabled:true,repair:true};');
    let calls=0;
    rt.quiet(request=>{
        calls++;
        assert(!request.messages.at(-1).content.includes('Tracking evidence'));
        assert(!request.messages.at(-1).content.includes('"evidence":'));
        assert(request.messages.at(-1).content.endsWith('Respond with ONLY the <rpg_companion> block, nothing else.'));
    });
    await rt.ctx.runSeparateUpdate('test');
    assert.equal(calls,1);
    const stored=rt.ctx.getSwipeData(rt.messages[1]);
    for(const key of ['survival','family','gear','agenda','holdings','money','factions','secrets','plot','objectives','room','pos','minds','agendas','learned'])assert(stored[key],key);
    assert.equal(stored.trackingAudit,undefined);
    assert.equal(rt.events.filter(x=>x.type==='state').length,3);
    // Read again's processing path must not call the model.
    const local=runtime();seed(local);local.run("rereading.add('test');");
    local.messages[1].content=hud()+'\n<rpg_companion>'+JSON.stringify(reading)+'</rpg_companion>';
    let localCalls=0;local.quiet(()=>{localCalls++;});
    await local.ctx.hmsHandleReply('test',local.messages,local.messages[1],'normal');
    assert.equal(localCalls,0);
    assert(local.ctx.getSwipeData(local.messages[1]).survival.learned.includes('Earth Spear'));
    // Recreate the actual card's 1,432 positions, including spell entries beyond page one.
    const book='six-sided', entries=Array.from({length:fixture.total},(_,i)=>({id:String(i),world_book_id:book,key:['reference '+i],content:'World reference '+i}));
    for(const row of fixture.spells)entries[row.index]={...row.entry,world_book_id:book};
    const magic=runtime();seed(magic);
    const offsets=[];
    magic.ctx.spindle.world_books.entries={async list(id,options){assert.equal(id,book);offsets.push(options.offset);return {data:entries.slice(options.offset,options.offset+options.limit),total:entries.length};}};
    const partial=entries.filter(e=>e.key.includes('Earth Lance')||e.key.includes('Ice Pillar')||e.key.includes('Earth Spear')||e.key.includes('Water Waterfall'));
    assert(partial.length>=2);
    magic.ctx.setLorePool('test',partial);
    const before=magic.ctx.spellCatalog('test');
    assert(!before.some(s=>s.name==='Ice Blade'),'The partial catalog should reproduce the missing spell');
    await magic.ctx.loreHydrateCatalog('test');
    assert.deepEqual(offsets,[0,200,400,600,800,1000,1200,1400]);
    const catalog=magic.ctx.spellCatalog('test');
    for(const name of ['Ice Blade','Ice Smash','Rock Bullet','Earth Lance','Ice Pillar'])assert(catalog.some(s=>s.name===name),'Missing spell '+name);
    for(const row of fixture.spells){const name=row.entry.content.match(/^\s*\[SPELL\s*[—–-]\s*([^\]]+)\]/i)?.[1];if(name&&!row.entry.disabled)assert(catalog.some(s=>s.name===name),'Canonical spell lost: '+name);}
    const state=await magic.ctx.getChatState('test');
    state.spellbook=['Ice Blade','Ice Smash','Rock Bullet'].map(name=>({name,from:'story'}));
    assert(!magic.ctx.spellKnown(magic.messages,state).has('ice blade'),'Legacy automatic cache granted an unsupported spell');
    await magic.ctx.setSwipeData('test',magic.messages[1],{survival:{learned:['Ice Blade','Ice Smash','Rock Bullet']}});
    const lines=magic.ctx.parseHud(hud()).lines;
    const panel=magic.ctx.spellListPanel('test',magic.messages,state,{_lines:lines});
    for(const name of ['Ice Blade','Ice Smash','Rock Bullet']){
        const group=panel.schools.find(s=>s.spells.some(x=>x.name===name));assert(group&&group.name!=='Other','Wrong school for '+name);
        assert.equal(group.spells.find(x=>x.name===name).status,'known');
    }
    await magic.ctx.loreHydrateCatalog('test');assert.equal(offsets.length,8,'A cached refresh reread the full book');
    magic.ctx.setLorePool('test',partial.slice(0,1));
    assert(magic.ctx.spellCatalog('test').some(s=>s.name==='Ice Blade'),'Activated subset replaced the complete catalog');
    // A different active book must not reuse the previous world's spell references.
    magic.ctx.setLorePool('test',[{id:'different',world_book_id:'another-world',key:['other'],content:'Other world'}]);
    assert(!magic.ctx.spellCatalog('test').some(s=>s.name==='Ice Blade'));
    console.log('Reading and Magic regressions passed: one original tracker call, no quote gate/correction, local rereads, 1,432-entry pagination, complete spell schools, cache reuse and world isolation.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

