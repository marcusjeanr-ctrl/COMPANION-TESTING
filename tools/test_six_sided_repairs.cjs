const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {runtime,hud,seed} = require('./test_panel_tracking.cjs');
const rt = runtime();
const arcEntries = JSON.parse(fs.readFileSync(path.join(__dirname,'six_sided_arc_fixture.json'),'utf8'));
const calendar = JSON.parse(fs.readFileSync(path.join(__dirname,'six_sided_calendar_fixture.json'),'utf8'));
rt.ctx.setLorePool('test',[...arcEntries.map((e,i)=>({...e,id:'arc'+i})),{...calendar,id:'calendar'}]);
const state = rt.run('emptyChatState()');
const base = hud();
function world(text) { return rt.ctx.worldMushoku('test',rt.ctx.worldLines(rt.ctx.parseHud(text)),state,[]); }
function clock(text) { return rt.ctx.hmsClock(rt.ctx.parseHud(text)).minutes; }
function dateLine(text,line) { return text.replace(/Armored Dragon Calendar:[^\n]+/,line); }
const numbered = dateLine(base,'Armored Dragon Calendar: K417, Month 2, Day 8 | Time: 07:15');
assert.equal(world(numbered).year,417);assert.equal(world(numbered).month,2);assert.equal(world(numbered).day,8);
assert.equal(clock(base),clock(numbered));
for(const named of [true,false]) {
    const a=dateLine(base,named?'Armored Dragon Calendar: K417, Snowveil (Month 1), Day 30 | Time: 23:59':'Armored Dragon Calendar: K417, Month 1, Day 30 | Time: 23:59');
    const b=dateLine(base,named?'Armored Dragon Calendar: K417, Thawmoon (Month 2), Day 1 | Time: 00:00':'Armored Dragon Calendar: K417, Month 2, Day 1 | Time: 00:00');
    assert.equal(clock(b)-clock(a),1);
}
const yearEnd=dateLine(base,'Armored Dragon Calendar: K417, Month 12, Day 30 | Time: 23:59');
const nextYear=dateLine(base,'Armored Dragon Calendar: K418, Month 1, Day 1 | Time: 00:00');
assert.equal(clock(nextYear)-clock(yearEnd),1);
assert.equal(rt.ctx.mtCalendar('Armored Dragon Calendar: K417, Month 13, Day 1'),null);
assert.equal(world(base.replace('Age: 13 (born','Age: 13 🎂 (born')).birth,404);
assert.equal(rt.ctx.hmsParseWhen('Day 9, 07:15',clock(numbered),rt.ctx.parseHud(numbered))-clock(numbered),1440);
const hidden=base.replace('Magic Tiers: Water (Intermediate), Earth (Intermediate), Fire (Beginner)','Magic Tiers: Shown: None | True: Water (Saint), Earth (Advanced)')
    .replace('Sword Style: Sword God (Intermediate)','Sword Style: Shown: None | True: Water God (Advanced)')
    .replace('Mana Capacity: Vast | Reserve: Full','Mana Capacity: Shown: None (sealed) | True: Vast | Reserve: Full');
const hw=world(hidden);
assert.deepEqual(Array.from(hw.magic,x=>[x.name,x.rank]),[['Water','Saint'],['Earth','Advanced']]);
assert.equal(world(hidden.replace(/^Touki[^\n]+/m,'Touki: Shown: None | True: Active (basic control)')).touki,'Active (basic control)');
assert.equal(hw.martial[0].name,'Water God');assert.equal(hw.mana,'Vast');
const standing=rt.ctx.spellStanding(rt.ctx.parseHud(hidden).lines);
assert.deepEqual(Array.from(standing.schools.keys()),['water','earth']);
const multi=world(base.replace('Sword Style: Sword God (Intermediate)','Sword Style: Sword God (Intermediate), Water God (Beginner)'));
assert.deepEqual(Array.from(multi.martial,x=>x.name),['Sword God','Water God']);
for(const continent of ['Central Continent','Demon Continent','Milis Continent','Begaritt Continent','Heavenly Continent']) {
    const atlas={nodes:new Map(),roots:[],ix:new Map(),baseVersion:'test'};
    assert(rt.ctx.atlasAddMushokuPath(atlas,[continent,'Town','Guild']));assert.equal(atlas.nodes.size,3);
    assert.equal(rt.ctx.atlasAddMushokuPath(atlas,[continent,'Another Town'],'rezero'),false);
}
assert.equal(rt.ctx.mtArcList('test').length,22);
const cur=world(base);assert.equal(cur.saga.current,2);assert.equal(cur.saga.part,'4');
const sandbox=world(base.replace('Current Arc: Sandbox','Sandbox: Fittoa — K417 (canon: Arc 2.5)'));
assert.equal(sandbox.saga.current,2);assert.equal(sandbox.saga.part,'5');assert.equal(sandbox.saga.participation,'personal');
assert(sandbox.saga.personalArc.startsWith('Sandbox:'));
const sub=world(base.replace('Current Arc: Sandbox','Arc 3.2: Demon Continent — Rikarisu'));
assert.equal(sub.saga.current,3);assert.equal(sub.saga.part,'2');assert.equal(sub.saga.participation,'explicit');
const era=world(base.replace('Current Arc: Sandbox','Era 4: A new age'));
assert.equal(era.saga.participation,'personal');assert(era.saga.personalArc.startsWith('Era 4:'));
rt.ctx.setLorePool('partial',arcEntries.slice(0,3));assert.equal(rt.ctx.mtArcList('partial').length,22);
const learned = (id,field) => ({id,role:'assistant',swipe_id:0,content:base,metadata:{rpg_companion:{swipes:{0:{survival:field}}}}});
const forgotten=rt.run('emptyChatState()');forgotten.spellForget={'earth lance':'a1'};
const mastery=[learned('a1',{mastered:['Earth Lance']})];
assert.equal(rt.ctx.spellKnown(mastery,forgotten).has('earth lance'),false);
const learnedLater=[learned('a1',{learned:['Earth Lance']}),learned('a2',{learned:['Earth Lance']})];
assert.equal(rt.ctx.spellKnown(learnedLater,forgotten).has('earth lance'),true);
const masteredLater=[...mastery,learned('a2',{mastered:['Earth Lance']})];
assert.equal(rt.ctx.spellKnown(masteredLater,forgotten).get('earth lance').mastered,true);
const manual=rt.run('emptyChatState()');manual.spellbook=[{name:'Earth Lance',from:'you'}];
assert(rt.ctx.spellKnown([],manual).has('earth lance'));
const spellEntries=JSON.parse(fs.readFileSync(path.join(__dirname,'six_sided_spell_fixture.json'),'utf8')).spells.map(x=>x.entry);
rt.ctx.setLorePool('spells',spellEntries);
const mp=rt.ctx.spellListPanel('spells',mastery,forgotten,{_lines:rt.ctx.parseHud(base).lines});
assert.notEqual(mp.schools.flatMap(x=>x.spells).find(x=>x.name==='Earth Lance').status,'mastered');
async function main() {
    const sw=runtime();seed(sw);sw.messages[1].content=base+'\n<rpg_companion>{"characters":[],"you":{"spells":["Earth Lance"],"learned":["Earth Lance"]}}</rpg_companion>';
    await sw.ctx.hmsHandleReply('test',sw.messages,sw.messages[1],'normal');
    const st=await sw.ctx.getChatState('test');assert(sw.ctx.spellKnown(sw.messages,st).has('earth lance'));
    // Migration: old automatic caches must not overrule active-swipe evidence.
    st.spellbook.push({name:'Earth Lance',from:'story'});
    const originalContent=sw.messages[1].content;
    sw.messages[1].swipe_id=1;sw.messages[1].content=base+'\nThe attempt failed.';
    assert.equal(sw.ctx.spellKnown(sw.messages,st).has('earth lance'),false);
    sw.messages[1].swipe_id=0;sw.messages[1].content=originalContent;assert(sw.ctx.spellKnown(sw.messages,st).has('earth lance'));
    console.log('Audit repairs passed: two calendars, month/year rollovers, deadlines, birthdays, hidden ranks, multiple styles, five continents, complete Saga/sub-arcs, and swipe/forget/relearn/mastery/manual spell lifecycles.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

