// Regression checks for the live-play audit (exports 14–26): gear guesses, Training-line checks,
// swipe separation and the Training reader. Synthetic chats only; no private text.
// Run: node tools/test_live_play_audit.cjs   (BACKEND=<older backend.js> shows which checks fail without the fix)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = source.indexOf('// ───────────────────────────── Startup');
assert(startup > 0, 'backend startup marker missing');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = {
    console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(source.slice(0, startup) + `
globalThis.__t = { gearRead, getSwipeData, mtTraining, hmsTimeline, worldLines,
  hmsHudSync: typeof hmsHudSync === 'function' ? hmsHudSync : () => [], hmsStoryReminders, hmsReadWounds, diffHud, parseHud: typeof parseHud === 'function' ? parseHud : null,
  agendaDayOfMonth: typeof agendaDayOfMonth === 'function' ? agendaDayOfMonth : () => null, hmsAgendaPanel, hudRead: typeof hmsHudRead === 'function' ? hmsHudRead : null,
  hmsTrainingChecks: typeof hmsTrainingChecks === 'function' ? hmsTrainingChecks : () => [],
  gearMentioned: typeof gearMentioned === 'function' ? gearMentioned : () => true };`, ctx);
const t = ctx.__t;

let n = 0;
const hud = (o = {}) => ['### WORLD STATE ###',
    `Armored Dragon Calendar: K416, Month 1, Day ${o.day || 2} | Time: ${o.time || '09:00'} (Morning)`,
    '◆ Central Continent → Asura Kingdom → Fittoa Region → Veyrath Hall, east yard',
    `Race: Human | Origin: Native | Age: ${o.age || 12} (born K404, Month 1)`,
    'Game Mode: Canon: Living | Guide: Off',
    `Sword Style: ${o.sword || 'Sword God (Advanced)'}`,
    `Magic Tiers: ${o.magic || 'Water (Advanced), Earth (Intermediate)'}`,
    o.training === null ? null : `Training: ${o.training || 'Sword God → Saint (0/60 sessions)'}`,
    o.condition ? `Condition: ${o.condition}` : null,
    `Equipment: ${o.equipment || "Plain road sword (Halvin's mark), leather baldric"}`,
    `Present: ${o.present || 'Aurelius Veyrath (45, b. K371)'}`, '***'].filter(Boolean).join('\n');
const reply = (data, prose, o) => ({ id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: 0,
    content: `${hud(o)}\n\n${prose || 'The yard is quiet.'}`, extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data || {} } } } } });
const user = text => ({ id: `u${++n}`, role: 'user', is_user: true, swipe_id: 0, content: text });
const results = [], failed = [];
const check = (name, fn) => { try { fn(); results.push(name); } catch (e) { failed.push(`${name}: ${e.message.split('\n')[0]}`); } };
const gearState = (chat, name) => { const g = t.gearRead(chat, {}); const it = g.items.find(x => x.name === name); return it ? it.state : null; };
const sheathed = { gear: [{ name: 'Plain road sword', state: 'sheathed', where: 'baldric' }, { name: 'leather baldric', state: 'worn' }] };

// ── gear: the reporter guessing where an item "must be" ──
check('a guess about an item the HUD still carries does not move it (export 26)', () => {
    const chat = [user('go'), reply(sheathed, 'You buckle the baldric.'), user('train'),
        reply({ gear: [{ name: 'Plain road sword', state: 'stowed', where: 'Left behind before the drills; not carried in the yard' }] },
            'He throws you the second wooden sword. The wooden swords go into the snow. You finish the sword and abandon the body.', { time: '12:00' })];
    assert.equal(gearState(chat, 'Plain road sword'), 'sheathed');
});
check('the story leaving the item still moves it', () => {
    const chat = [user('go'), reply(sheathed, 'You buckle the baldric.'), user('I hang my sword on the rack'),
        reply({ gear: [{ name: 'Plain road sword', state: 'stowed', where: 'weapon rack' }] }, 'You hang your sword on the rack by the door.', { time: '12:00' })];
    assert.equal(gearState(chat, 'Plain road sword'), 'stowed');
});
check('someone taking an item by its HUD name still counts (export 18 paper)', () => {
    const chat = [user('go'), reply({ gear: [{ name: 'travel bundle of northern paper sheets', state: 'in hand' }] }, 'The seller hands you the bundle.', { equipment: 'travel paper bundle' }),
        user('home'), reply({ gear: [{ name: 'travel bundle of northern paper sheets', state: 'stowed', where: 'Seraphina Veyrath' }] },
            'Your mother takes the travel bundle back from under your arm.', { equipment: 'travel paper bundle', time: '12:00' })];
    assert.equal(gearState(chat, 'travel bundle of northern paper sheets') || gearState(chat, 'travel paper bundle'), 'stowed');
});
check('the mention test: own item yes, someone else\'s or a practice one no', () => {
    assert.equal(t.gearMentioned('you draw your sword', 'Plain road sword'), true);
    assert.equal(t.gearMentioned('you set the road sword down', 'Plain road sword'), true);
    assert.equal(t.gearMentioned('his own sword on his shoulder; your wooden sword in the snow', 'Plain road sword'), false);
    assert.equal(t.gearMentioned('the sword is finished when your feet are under you', 'Plain road sword'), false);
});

// ── Training line (Six-Sided v1.1): display-only checks ──
const trainChat = (a, b, oa = {}, ob = {}) => [user('go'), reply({}, 'Drills.', { training: a, ...oa }), user('next'), reply({}, 'More drills.', { training: b, time: '12:00', ...ob })];
const kinds = chat => JSON.parse(JSON.stringify(t.hmsTrainingChecks(t.hmsTimeline(chat)).map(c => c.text)));
check('one teacher session the same day is fine', () => {
    assert.deepEqual(kinds(trainChat('Sword God → Saint (0/60 sessions)', 'Sword God → Saint (1.5/60 sessions)')), []);
});
check('two sessions counted in one morning are flagged', () => {
    const k = kinds(trainChat('Sword God → Saint (0/60 sessions)', 'Sword God → Saint (3/60 sessions)'));
    assert.equal(k.length, 1); assert.match(k[0], /went up 3/);
});
check('three days of teacher sessions over a skip are fine', () => {
    assert.deepEqual(kinds(trainChat('Sword God → Saint (1.5/60 sessions)', 'Sword God → Saint (6/60 sessions)', {}, { day: 5 })), []);
});
check('a count going back is flagged', () => {
    assert.match(kinds(trainChat('Water Magic → Saint (4.5/60 sessions)', 'Water Magic → Saint (3/60 sessions)'))[0] || '', /went back/);
});
check('a wrong session total for the next rank is flagged', () => {
    assert.match(kinds(trainChat('Sword God → Saint (0/60 sessions)', 'Sword God → Saint (1.5/25 sessions)')).join(' '), /card's count to Saint is 60/);
});
check('each skill on the line is checked on its own', () => {
    const k = kinds(trainChat('Sword God → Saint (0/60 sessions) · Water Magic → Saint (1.5/60 sessions)', 'Sword God → Saint (1.5/60 sessions) · Water Magic → Saint (1.5/60 sessions)'));
    assert.deepEqual(k, []);
});
check('Saint sword at 12 is past the age cap; "True … (potential …)" is not', () => {
    assert.match(kinds(trainChat('Sword God → King (0/150 sessions)', 'Sword God → King (0/150 sessions)', {}, { sword: 'Sword God (Saint)' })).join(' '), /past the card's cap at age 12/);
    assert.deepEqual(kinds(trainChat('Sword God → Saint (0/60 sessions)', 'Sword God → Saint (0/60 sessions)', {}, { sword: 'Sword God (True: Advanced (potential: Saint))' })), []);
    assert.deepEqual(kinds(trainChat('Sword God → Saint (0/60 sessions)', 'Sword God → Saint (0/60 sessions)', {}, { magic: 'Water (King)' })), []);
});
check('the Training reader keeps half sessions and every skill', () => {
    const tr = t.mtTraining(['Training: Sword God → Saint (1.5/60 sessions) · Water Magic → Saint (4.5/60 sessions)']);
    assert.deepEqual(JSON.parse(JSON.stringify(tr.map(x => [x.skill, x.done, x.needed]))), [['Sword God', 1.5, 60], ['Water Magic', 4.5, 60]]);
});

// ── swipes: only the accepted (shown) swipe counts ──
check('a discarded swipe\'s report is never read', () => {
    const m = { id: 'mx', role: 'assistant', is_user: false, swipe_id: 1, content: 'kept',
        extra: { spindle_metadata: { rpg_companion: { swipes: { 0: { gear: [{ name: 'Discarded thing', state: 'in hand' }] }, 1: { gear: [{ name: 'Kept thing', state: 'in hand' }] } } } } } };
    assert.equal(t.getSwipeData(m).gear[0].name, 'Kept thing');
    const chat = [user('go'), m];
    assert.equal(gearState(chat, 'Discarded thing'), null);
    assert.equal(gearState(chat, 'Kept thing'), 'in hand');
});
check('a swipe with no report reads as nothing, not the other swipe', () => {
    const m = { id: 'my', role: 'assistant', is_user: false, swipe_id: 1, content: 'kept',
        extra: { spindle_metadata: { rpg_companion: { swipes: { 0: { gear: [{ name: 'Discarded thing', state: 'in hand' }] } } } } } };
    const d = t.getSwipeData(m);
    assert.ok(!d || !d.gear || !d.gear.some(g => g.name === 'Discarded thing'));
});

// ── keeping the HUD with the story: four reminders go to the narrator on their own, the Training one is a warning ──
const sync = (chat, st = {}) => JSON.parse(JSON.stringify(t.hmsHudSync(chat, st, 'Marcus Veyrath')));
const tell = (chat, st = {}) => { const r = t.hmsStoryReminders(chat, st, 'Marcus Veyrath'); return JSON.parse(JSON.stringify(r.parts)).join('\n'); };
const bruise = { hurtSeen: [{ where: 'left forearm', what: 'bruise from break-falls', kind: 'other', severity: 'minor', status: 'raw' }] };
const owns = { condition: 'Scraped knee — Healing' };   // a HUD that keeps wounds (the card's Condition line)
check('a wound the story shows but the Condition line forgot is reminded (export 26 arm)', () => {
    const chat = [user('go'), reply({ hurtSeen: [] }, 'Drills.', owns), user('fall'), reply(bruise, 'Your left arm is stinging red to the elbow.', { time: '12:00' })];
    const s = sync(chat);
    assert.equal(s.filter(x => x.kind === 'condition').length, 1);
    assert.match(tell(chat), /left forearm: bruise from break-falls.*Condition line/);
});
check('no reminder once the Condition line carries it', () => {
    const chat = [user('go'), reply({ hurtSeen: [] }, 'Drills.', owns), user('fall'), reply(bruise, 'Red arm.', { time: '12:00', condition: 'Bruised left forearm — Raw' })];
    assert.deepEqual(sync(chat).filter(x => x.kind === 'condition'), []);
});
check('a wound healed in the story but still on Condition is reminded; a forgotten one is not', () => {
    const healed = [user('go'), reply({ hurtSeen: [] }, 'Drills.', owns), user('heal'), reply({ hurtSeen: [] }, 'Your mother lays a hand on the forearm and the bruise fades under the green light.', { time: '12:00', condition: 'Bruised left forearm — Raw' })];
    assert.match(sync(healed).map(x => x.text).join(' '), /healed Bruised left forearm/);
    const quiet = [user('go'), reply({ hurtSeen: [] }, 'Drills.', owns), user('eat'), reply({ hurtSeen: [] }, 'You eat at the long table.', { time: '12:00', condition: 'Bruised left forearm — Raw' })];
    assert.deepEqual(sync(quiet).filter(x => x.kind === 'condition'), []);
});
check('someone named in the scene but missing from Present is reminded; a role is not', () => {
    const chat = [user('go'), reply({}, 'Yard.'), user('shop'), reply({ characters: [{ name: 'Ferren' }, { name: 'Paper-seller' }, { name: 'Marcus Veyrath' }, { name: 'Aurelius Veyrath' }] }, 'Ferren holds out the hazel.', { time: '12:00' })];
    const p = sync(chat).filter(x => x.kind === 'present');
    assert.equal(p.length, 1); assert.match(p[0].text, /^Ferren is in the scene/);
    assert.match(tell(chat), /Ferren: if they are in the scene with Marcus Veyrath/);
});
check('a dead person on Present is reminded', () => {
    const chat = [user('go'), reply({ deaths: ['Halvin'] }, 'The smith is gone.'), user('later'), reply({}, 'The forge is cold.', { time: '12:00', present: 'Aurelius Veyrath (45, b. K371), Halvin (50)' })];
    assert.match(sync(chat).map(x => x.text).join(' '), /Halvin is dead/);
    assert.match(tell(chat), /Halvin died earlier/);
});
check('a kept training session with no count is a warning only, never a reminder', () => {
    const ag = { agenda: [{ what: 'Sword training with Aurelius', state: 'kept' }] };
    const chat = [user('go'), reply({}, 'Dawn.', { time: '09:00' }), user('train'), reply(ag, 'The drills stop.', { time: '12:00' })];
    assert.equal(sync(chat).filter(x => x.kind === 'training').length, 1);
    assert.doesNotMatch(tell(chat), /Training/);
    const counted = [user('go'), reply({}, 'Dawn.', { time: '09:00' }), user('train'), reply(ag, 'The drills stop.', { time: '12:00', training: 'Sword God → Saint (1.5/60 sessions)' })];
    assert.deepEqual(sync(counted).filter(x => x.kind === 'training'), []);
});
check('a quiet reply sends no HUD reminder', () => {
    const chat = [user('go'), reply({ characters: [{ name: 'Aurelius Veyrath' }], hurtSeen: [] }, 'Yard.', owns), user('eat'), reply({ characters: [{ name: 'Aurelius Veyrath' }], hurtSeen: [] }, 'Lunch.', { ...owns, time: '12:00' })];
    assert.deepEqual(sync(chat), []);
    assert.doesNotMatch(tell(chat), /keep the HUD with the story/);
});

// ── export 4 (after the supper skip) ──
check('a treated wound with a bracketed note stays the same wound (no false "healed")', () => {
    const tl = t.hmsTimeline([user('a'), reply({}, 'Supper.', { condition: 'Left forearm break-fall bruise — Treated (cold-soaked, wrapped)' })]);
    const w = JSON.parse(JSON.stringify(t.hmsReadWounds(tl[tl.length - 1].hud)));
    assert.equal(w.length, 1); assert.equal(w[0].name, 'Left forearm break-fall bruise'); assert.equal(w[0].cls, 'treated');
});
const sched = { key: 'training schedule', what: 'Training schedule', with: 'Aurelius Veyrath and Seraphina Veyrath', when: 'dawn to ninth bell with Seraphina and the yard; ninth bell to midday with Aurelius and the sword', kind: 'event', state: 'open' };
check('a standing training schedule is ongoing, never late, and the narrator is not told it is due', () => {
    const chat = [user('a'), reply({ agenda: [sched] }, 'Breakfast.', { time: '08:00' }), user('skip to supper'), reply({ agenda: [sched] }, 'Supper.', { time: '17:35' })];
    const a = JSON.parse(JSON.stringify(t.hmsAgendaPanel(chat, {}, {})));
    const it = a.items.find(x => x.what === 'Training schedule');
    assert.equal(it.status, 'ongoing');
    assert.match(it.when, /to midday with Aurelius and the sword$/);
    const r = JSON.parse(JSON.stringify(t.hmsStoryReminders(chat, {}, 'Marcus Veyrath').parts)).join('\n');
    assert.doesNotMatch(r, /due now/);
});
check('a time-skip recap keeps a routine open', () => {
    const chat = [user('a'), reply({ agenda: [sched] }, 'Breakfast.', { time: '08:00' }), user('(Time skip: until supper.)')];
    const r = JSON.parse(JSON.stringify(t.hmsStoryReminders(chat, {}, 'Marcus Veyrath').parts)).join('\n');
    assert.match(r, /Training schedule.*ongoing: it runs on through the skip; keep it open/);
});

// ── export 6 (the month skip) ──
check('"the seventh" is a day of the month; "the seventh bell" or "the third time" is not', () => {
    assert.equal(t.agendaDayOfMonth('the seventh'), 7);
    assert.equal(t.agendaDayOfMonth('by the 21st of Month 3'), 21);
    assert.equal(t.agendaDayOfMonth('the first of the month'), 1);
    assert.equal(t.agendaDayOfMonth('the seventh bell'), null);
    assert.equal(t.agendaDayOfMonth('the third time'), null);
    const chat = [user('a'), reply({ agenda: [{ key: 'answer ghislaine', what: "Answer Ghislaine's question", when: 'the seventh', kind: 'letter', state: 'open' }] }, 'Supper.', { day: 2 })];
    const a = JSON.parse(JSON.stringify(t.hmsAgendaPanel(chat, {}, {})));
    assert.equal(a.items[0].dayIn, 5);
});
check('a healed Condition line going away is not a dropped HUD line', () => {
    const tl = t.hmsTimeline([user('a'), reply({}, 'x', { condition: 'Left forearm bruise — Treated' }), user('b'), reply({}, 'y', { time: '12:00' })]);
    const miss = JSON.parse(JSON.stringify(t.diffHud(tl[0].hud, tl[1].hud)));
    assert.deepEqual(miss.map(m => m.key), []);
});
check('an item "in hand, held by" someone present is with them, not the player', () => {
    const chat = [user('a'), reply({ gear: [{ name: 'travel paper bundle', state: 'in hand', where: 'held by Aurelia Veyrath, slate under her arm' }] }, 'Aurelia takes the paper.', { present: 'Aurelia Veyrath (8, b. ~K408)', equipment: 'Plain road sword' })];
    assert.equal(gearState(chat, 'travel paper bundle'), 'stowed');
    const mine = [user('a'), reply({ gear: [{ name: 'travel paper bundle', state: 'in hand', where: 'held by Marcus' }] }, 'You hold the paper.', { present: 'Aurelia Veyrath (8, b. ~K408)', equipment: 'Plain road sword' })];
    assert.equal(gearState(mine, 'travel paper bundle'), 'in hand');
});

for (const r of results) console.log(`  ✓ ${r}`);
for (const f of failed) console.log(`  ✗ ${f}`);
console.log(failed.length ? `${failed.length} of ${results.length + failed.length} failed` : `all ${results.length} live-play checks passed`);
process.exitCode = failed.length ? 1 : 0;
