const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { runtime, seed } = require('./test_panel_tracking.cjs');
const plain = value => JSON.parse(JSON.stringify(value));
const reportedHud = `### 🌐 WORLD STATE ###
🗓️ **Armored Dragon Calendar:** K417, Thawmoon (Month 2), Day 8 — Dragonsday | Season: Late Winter | Time: 07:20 (Morning)
📍 **Central Continent → Asura Kingdom, Fittoa Region → House King Estate, training yard**
🧬 **Race:** Human · **Origin:** Native · **Age:** 13 (born K404, Month 2)
📖 **Era / Arc:** Sandbox: Fittoa Region — K417 (canon: Arc 2.5)
━━━━━━━━━━━━━━━━━━━━
🎮 **Game Mode:** Sandbox
💧 **Mana Capacity:** Vast · **Reserve:** Full · **Status:** Rested
🔥 **Touki (Battle Aura):** Awakening — surfaces under pressure, not yet controlled
⚔️ **Sword Style:** Sword God (Intermediate)
✨ **Magic Tiers:** Water (Intermediate) · Earth (Intermediate) · Fire (Beginner)
🤫 **Voiceless Casting:** Active
🎒 **Equipment:** quilted wool training jacket, leather gloves, blunt practice longsword (yard issue, worn grip) · felt-lined boots, mud-caked
🏅 **Renown:** Fittoa: Unknown | elsewhere: Unknown
━━━━━━━━━━━━━━━━━━━━
📖 **Canon reference:** Arc 2.5: Eve of the Calamity (canon: ~K417)
⚠️ **World event:** The Mana Calamity erases the Fittoa Region — in 3 months (K417, Month 5)
👥 **Present:** Aurelius King (46) · Cassian King (18) · Garan (master-at-arms)
🔀 **Active Paths:**
- Canon: Living | Guide: Off
- Canon Ledger: (empty)
🎭 **Narrative Mode:** Strict Agency
***`;
const rt = runtime(); seed(rt);
rt.run(`settings.hmsSystems.abilities.vocabulary += ${JSON.stringify('\nMartial: Touki, Touki (Battle Aura)')}`);
const fixture = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'updated_six_sided_fixture.json.gz'))));
rt.ctx.setLorePool('test', fixture.entries);
rt.messages[1].content = reportedHud;
const hud = rt.ctx.parseHud(reportedHud);
const state = rt.ctx.emptyChatState();
const standing = rt.ctx.spellStanding(hud.lines);
assert.deepEqual(plain([...standing.schools.values()].map(x => [x.name, x.rank, x.step])), [
    ['Water', 'Intermediate', 1], ['Earth', 'Intermediate', 1], ['Fire', 'Beginner', 0]
]);
const world = rt.ctx.worldMushoku('test', rt.ctx.worldLines(hud), state);
assert.deepEqual(plain(world.magic.map(x => [x.name, x.rank, x.step])), [
    ['Water', 'Intermediate', 1], ['Earth', 'Intermediate', 1], ['Fire', 'Beginner', 0]
]);
assert.equal(world.martial[0].name, 'Sword God');
assert.equal(world.martial[0].rank, 'Intermediate');
const abilities = rt.ctx.hmsReadSystems(hud).abilities;
const martial = abilities.find(x => x.items.some(item => /Touki/i.test(item.label || '')));
assert.equal(martial.items.filter(x => /Touki/i.test(x.label || '')).length, 1);
assert.equal(martial.items.find(x => /Touki/i.test(x.label || '')).name, 'Awakening — surfaces under pressure, not yet controlled');
assert.equal(rt.ctx.hudToBlock(hud), reportedHud);
const narration = '\n\nFrost still holds. [D:Garan]"Again."[/D]';
assert.equal(rt.ctx.renderHudCard(reportedHud + narration, { hudCard: true }), reportedHud + narration);
const classicHud = '### WORLD STATE ###\nArmored Dragon Calendar: K417, Month 2, Day 8 | Time: 07:20\nEquipment: sword, gloves\n***';
assert(rt.ctx.renderHudCard(classicHud, { hudCard: true }).includes('rh-grid'), 'Classic HUD card stopped rendering');
const equipment = rt.ctx.hudCardValue('Equipment', 'blunt practice longsword (yard issue, worn grip), felt-lined boots');
assert(equipment.includes('>blunt practice longsword (yard issue, worn grip)</span>'));
assert(!equipment.includes('>worn grip)</span>'));
for (const sep of [', ', '; ', ' · ', '·']) {
    const raw = `Shown: Sword God (Beginner) | True: Sword God Style: Intermediate${sep}Water God (Advanced)${sep}North God — Saint`;
    const rows = rt.run(`mtRankRows(${JSON.stringify(raw)}, MT_MARTIAL)`);
    assert.deepEqual(plain(rows.map(x => [x.name, x.rank, x.step])), [
        ['Sword God Style', 'Intermediate', 1], ['Water God', 'Advanced', 2], ['North God', 'Saint', 3]
    ]);
    const legacy = rt.ctx.parseHud(reportedHud.replace('⚔️ **Sword Style:** Sword God (Intermediate)', `Martial Style: Sword God Style: Intermediate${sep}Water God (Advanced)`));
    assert.equal(rt.ctx.worldMushoku('test', rt.ctx.worldLines(legacy), state).martial.length, 2);
}
assert.equal(rt.run("mtRankRows('Water (Unknown) · Fire (Beginner)', MT_MAGIC)")[0].step, null);
assert.equal(rt.run("mtRankRows('Water (Intermediate · trained, steady) · Fire (Beginner)', MT_MAGIC)")[0].name, 'Water');
const panel = () => rt.ctx.spellListPanel('test', rt.messages, state, { _lines: hud.lines });
const spells = () => panel().schools.flatMap(x => x.spells);
assert.equal(panel().total, 111);
assert(spells().some(x => x.status === 'reach'), 'Visual standing has no eligible catalog spells');
assert(!spells().some(x => x.status === 'known' || x.status === 'mastered'), 'School rank granted knowledge');
const report = survival => ({ id: 'a1', role: 'assistant', swipe_id: 0, content: reportedHud,
    metadata: { rpg_companion: { swipes: { 0: { survival } } } } });
const water = () => spells().find(x => x.name === 'Water Ball');
rt.messages[1] = report({ study: [{ spell: 'Waterball', progress: 40 }] });
assert.equal(water().status, 'study');
rt.messages[1] = report({ learned: ['Waterball'] });
assert.equal(water().status, 'known');
rt.messages[1] = report({ mastered: ['Waterball'] });
assert.equal(water().status, 'mastered');
state.spellForget = { waterball: 'a1' };
assert.equal(water().status, 'reach');
rt.messages.push({ ...report({ learned: ['Water Ball'] }), id: 'a2' });
assert.equal(water().status, 'known');
rt.messages.pop(); state.spellForget = {};
rt.messages[1].swipe_id = 1;
assert.equal(water().status, 'reach');
rt.messages[1].swipe_id = 0;
assert.equal(water().status, 'mastered');
console.log('Visual rank integrity passed: exact reported HUD, three magic schools, sword aliases/separators, Shown/True, unknown ranks, one Touki, 111 catalog entries, eligibility without grants, study/known/mastery/forget/relearn/swipe rollback.');

