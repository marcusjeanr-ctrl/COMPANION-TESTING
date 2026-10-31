// Regression checks for the 3.2.14 tracking-audit fixes and the 3.3.0 technique fix. Synthetic chats only; no private text.
// Run: node tools/test_tracking_audit.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = source.indexOf('// ───────────────────────────── Startup');
assert(startup > 0, 'backend startup marker missing');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = {
    console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(source.slice(0, startup) + '\nglobalThis.__t = { questDetailsLatest, relGuard, relCfg, martialAbilityItems, techListPanel, setPool: p => { loreCatalogPool = () => p; } };', ctx);
const t = ctx.__t;

let n = 0;
const reply = (data, prose = 'The story continues.') => ({
    id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: 0, content: `${prose}`,
    extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data } } } },
});
const user = text => ({ id: `u${++n}`, role: 'user', is_user: true, swipe_id: 0, content: text });
const quest = (objective, progress) => ({ quests: [{ key: 'the long road', questId: 'q_road', name: 'The Long Road', objective, progress,
    giver: 'Old Mentor', reward: 'A letter of passage', category: 'main', state: 'active', cls: 'active' }] });
const results = [], failed = [];
const check = (name, fn) => { try { fn(); results.push(name); } catch (e) { failed.push(`${name}: ${e.message.split('\n')[0]}`); } };

// 1. Same Quest ID, a new (shorter) objective: the objective follows the story and progress starts over.
check('quest objective follows a new stage under the same Quest ID', () => {
    const chat = [user('go'), reply(quest('Win the mentor\'s approval at the training hall', 80)), user('next'),
        reply(quest('Pack for the road', 20)), user('next'), reply(quest('Pack for the road', 0))];
    const q = t.questDetailsLatest(chat).find(x => x.key === 'q_road');
    assert.equal(q.objective, 'Pack for the road');
    assert.equal(q.progress, 20, 'a new stage restarts progress; a lower report on the same stage does not regress it');
});

// 2. Unchanged 3.2.3 behavior: the same objective never regresses its progress.
check('progress on an unchanged objective does not regress', () => {
    const chat = [user('go'), reply(quest('Pack for the road', 60)), user('next'), reply(quest('Pack for the road', 10))];
    assert.equal(t.questDetailsLatest(chat).find(x => x.key === 'q_road').progress, 60);
});

// 3. A bond ending with a copy of the standing loses the copy; other bonds and pinned bonds are untouched.
check('bond drops a trailing copy of the standing only', () => {
    const rc = t.relCfg(null);
    const g = (bond, standing, pin) => t.relGuard({ key: 'x', name: 'X', standing, bond, minor: false, reasons: {} }, pin, rc).bond;
    assert.equal(g('Father and head of the house, Close', 'Close'), 'Father and head of the house');
    assert.equal(g('Father and head of the house (Close)', 'Close'), 'Father and head of the house');
    assert.equal(g('close friend from the academy', 'Close'), 'close friend from the academy');
    assert.equal(g('Father, Close', 'Wary'), 'Father, Close', 'only the row\'s own standing is removed');
    assert.equal(g('Close', 'Close'), 'Close', 'never empties the bond');
    assert.equal(g('Sworn brother, Close', 'Close', { bond: 'Sworn brother, Close' }), 'Sworn brother, Close', 'a bond the player set stays as written');
});

// 4. One observation reported once is counted once.
check('a martial observation is not counted twice', () => {
    const ev = { name: 'Sword God Style', owner: 'you', state: 'reliable', historical: false, evidence: 'drove the opponent back with clean footwork' };
    const chat = [user('spar'), reply({ survival: { spells: [], learned: [], mastered: [], study: [], abilities: [ev] } }, 'In the yard you drove the opponent back with clean footwork.')];
    const item = t.martialAbilityItems('c1', chat, {}).find(x => /sword god/i.test(x.name));
    assert(item, 'martial ability missing');
    assert.equal(item.observations.length, 1);
});

// 5. (3.3.0) Practice on a technique already known shows on its card, as it does for spells.
check('practice on a known technique shows on its card', () => {
    t.setPool({ entries: [{ id: 't1', comment: '[Technique] Sword of Light', key: ['Sword of Light'],
        content: '[TECHNIQUE — Sword of Light]\nStyle: Sword God Style · Rank: Intermediate\nEffect: A single explosive cut.' }] });
    const learn = { survival: { spells: [], learned: [], mastered: [], study: [],
        abilities: [{ name: 'Sword of Light', owner: 'you', state: 'known', historical: false, evidence: 'you cut with the Sword of Light' }] } };
    const drill = { survival: { spells: [], learned: [], mastered: [], abilities: [], study: [{ spell: 'Sword of Light', progress: 40, note: 'drilled the opening stance' }] } };
    const chat = [user('train'), reply(learn, 'In the yard you cut with the Sword of Light.'), user('again'), reply(drill, 'You drill the opening stance.')];
    const row = t.techListPanel('c1', chat, {}, { _lines: ['Sword Style: Sword God (Advanced)'] }).schools.flatMap(g => g.spells).find(x => x.name === 'Sword of Light');
    assert(row, 'technique missing from the catalog');
    assert.equal(row.status, 'known');
    assert.equal(row.note, 'drilled the opening stance');
    assert.equal(row.progress, 40);
});

console.log(`tracking audit regressions: ${results.length} passed, ${failed.length} failed`);
for (const r of results) console.log(`  ✓ ${r}`);
for (const f of failed) console.log(`  ✗ ${f}`);
if (failed.length) process.exitCode = 1;
