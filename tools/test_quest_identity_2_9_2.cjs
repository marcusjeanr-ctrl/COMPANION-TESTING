const assert = require('node:assert/strict');
const path = require('node:path');
const { runtime, hud } = require('./test_panel_tracking.cjs');
const r = runtime(process.argv[2] && path.resolve(process.argv[2])), c = r.ctx;
const cases = [], test = (name, fn) => cases.push([name, fn]);
const msg = (id, quests, content = hud()) => ({ id, role: 'assistant', swipe_id: 0, content,
    metadata: { rpg_companion: { swipes: { 0: { quests: c.questNormalize(quests) } } } } });
test('equivalent permission objectives match across names and missing giver fields', () => {
    const a = { name: 'The Harbor Bargain', objective: "Obtain Lord Rin's permission to travel to Highport", giver: 'Rin', where: 'Old Keep', progress: 20 };
    const b = { name: 'The Harbor Visit', objective: 'Secure permission from Rin for the trip to Highport', where: 'Old Keep', progress: null };
    assert.equal(c.questMatch(a, b), true);
    const rows = c.questDetailsLatest([msg('a', [a]), msg('b', [b])]);
    assert.equal(rows.length, 1); assert.equal(rows[0].giver, 'Rin'); assert.equal(rows[0].progress, 20);
});
test('equivalent ordinary goals work across unrelated cards and context granularity', () => {
    for (const [a, b] of [
        ['Fix the north bridge', 'Repair north bridge'],
        ['Locate the missing courier', 'Find missing courier'],
        ['Recover the oxygen regulator', 'Recover oxygen regulator'],
        ['Calibrate the quantum relay', 'Calibrate quantum relay']
    ]) assert(c.questMatch({ name: 'Old goal', objective: a, where: 'Station Meridian' }, { name: 'New name', objective: b, where: 'Station Meridian, Dock Seven' }), a);
});
test('shared storyline, prefixes, prerequisite and destination do not merge distinct goals', () => {
    const base = { where: 'Old Keep', giver: 'Rin' };
    const rows = [
        { ...base, name: 'The Bargain', objective: 'Make a cut Rin cannot read beforehand' },
        { ...base, name: 'The Visit', objective: "Secure Rin's permission and a letter for the trip to Highport" },
        { ...base, name: 'The Journey', objective: "Secure Rin's permission and prepare for the road to Highport" },
        { ...base, name: 'Meet the scholar', objective: 'Travel to Highport and meet the scholar' }
    ];
    assert.equal(c.questDetailsLatest([msg('a', rows)]).length, 4);
    assert.equal(c.questMatch({ ...base, name: 'Repair bridge', objective: 'Repair the eastern pillars' }, { ...base, name: 'Repair bridge supports', objective: 'Repair the western pillars' }), false);
});
test('actors, directions, negation, quantities and extra steps stay distinct', () => {
    const row = objective => ({ name: objective, objective, where: 'Old Keep' });
    for (const [a, b] of [
        ["Obtain Rin's permission to travel to Highport", "Obtain Tess's permission to travel to Highport"],
        ["Obtain Rin's permission to travel to Highport", "Obtain Rin's permission to travel to Lowport"],
        ['Deliver supplies from Alpha to Beta', 'Deliver supplies from Beta to Alpha'],
        ['Collect two crystals', 'Collect three crystals'],
        ['Open the gate', 'Do not open the gate'],
        ['Find the missing courier', 'Find the missing courier and escort her home'],
        ['Repair north bridge before the flood', 'Repair north bridge after the flood']
    ]) assert.equal(c.questMatch(row(a), row(b)), false, `${a} / ${b}`);
});
test('conflicting owners/locations and generic unanchored goals never merge', () => {
    const a = { name: 'Bridge repairs', objective: 'Repair the bridge', giver: 'Rin', where: 'Northern Camp' };
    assert.equal(c.questMatch(a, { ...a, name: 'New repairs', giver: 'Tess' }), false);
    assert.equal(c.questMatch(a, { ...a, name: 'New repairs', where: 'Southern Camp' }), false);
    assert.equal(c.questMatch({ name: 'A', objective: 'Repair the bridge' }, { name: 'B', objective: 'Fix the bridge' }), false);
});
test('ambiguous partial aliases never pick one of two established quests', () => {
    const a = { name: 'North repair', objective: 'Repair the bridge', giver: 'Rin', where: 'Old Keep, North Yard' };
    const b = { ...a, name: 'South repair', where: 'Old Keep, South Yard' };
    const q = { name: 'Bridge repair', objective: 'Fix the bridge', where: 'Old Keep', progress: 100 };
    const rows = c.questDetailsLatest([msg('a', [a, b]), msg('b', [q])]);
    assert.equal(rows.length, 3);
    assert(rows.filter(x => x.name !== q.name).every(x => x.progress === null));
    const reordered = c.questDetailsLatest([msg('a', [a]), msg('b', [q]), msg('c', [b])]);
    assert.equal(reordered.length, 2, 'A broad place must not transitively merge separate yards');
    assert.equal(reordered.find(x => x.where === b.where).progress, null);
});
test('current HUD aliases deduplicate after objective attachment; distinct HUD objectives remain', () => {
    const a = { name: 'Northern repairs', objective: 'Repair the north bridge', where: 'Old Keep', progress: 25 };
    const b = { ...a, name: 'Fix the bridge', objective: 'Fix north bridge', progress: 50 };
    const content = hud() + '\n';
    const rows = c.questDetailsLatest([msg('a', [a, b], content)]);
    assert.equal(rows.length, 1); assert.equal(rows[0].progress, 50);
    const duplicates = c.questUnique([{ ...a, cls: 'active' }, { ...b, cls: 'active' }]);
    assert.equal(duplicates.length, 1);
    assert.equal(c.questUnique([{ ...a, cls: 'active' }, { ...b, cls: 'done' }]).length, 2);
    const withHud = hud().replace('Current Arc: Sandbox', 'Current Arc: Sandbox\nQuest: Northern repairs — Active; Fix the bridge — Active');
    const chat = [msg('a', [a], withHud), msg('b', [b], withHud)];
    const panel = c.hmsPanelState('quest-aliases', chat, c.emptyChatState());
    assert.equal(panel.systems.quests.length, 1, 'HUD names and story aliases recreated a duplicate');
});
let failed = 0;
for (const [name, fn] of cases) { try { fn(); console.log('PASS ' + name); } catch (e) { failed++; console.error('FAIL ' + name + ': ' + e.message); } }
console.log(`Quest identity: ${cases.length - failed}/${cases.length} groups passed.`);
if (failed) process.exitCode = 1;
