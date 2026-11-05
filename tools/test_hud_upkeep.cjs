// Six-Sided HUD upkeep (1.2.0): the card's arithmetic and format rules kept by code, and the card-rule warnings.
// Positive cases (a slip is put right) and negative ones (a correct HUD is left exactly as written).
// Synthetic HUDs from the card's slot map. Run: node tools/test_hud_upkeep.cjs   (BACKEND=<older backend.js> to compare)
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const src = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = src.indexOf('// ───────────────────────────── Startup');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(src.slice(0, startup) + `
globalThis.__U = typeof sixUpkeep !== 'function' ? null : {
  fix: (text, prevText, extra) => { const prev = prevText ? parseHud(prevText) : null; const hud = parseHud(text); let notes = [];
    const r = rewriteHud(text, items => { notes = sixUpkeep(items, { cal: hmsCalNow(hud), prev, userName: 'Marcus Veyrath', rows: extra && extra.rows || [], sessions: extra && extra.sessions || null,
      elapsedDays: extra && Number.isFinite(extra.days) ? extra.days : null, math: true, format: true, plainStyle: !!(extra && extra.plain) }); return notes.length > 0; });
    return { text: r.content, notes: JSON.parse(JSON.stringify(notes)) }; },
  sessions: (text, prevText, sessions) => { const r = sixTrainingFromSessions(text, parseHud(prevText), sessions); return r ? r.content : text; },
  rules: (msgs, lore) => { const pool = { entries: lore || [] }; loreCatalogPool = () => pool; return JSON.parse(JSON.stringify(hmsCardRuleChecks(msgs, hmsTimeline(msgs), 'Marcus Veyrath', 'c1'))); },
  rows: lore => { const pool = { entries: lore }; loreCatalogPool = () => pool; return JSON.parse(JSON.stringify(sixCanonRows('c1'))); },
  births: lore => { const pool = { entries: lore }; loreCatalogPool = () => pool; return JSON.parse(JSON.stringify([...sixLoreBirths('c1')])); }
};`, ctx);
const U = ctx.__U;
if (!U) { console.log('  ✗ this backend has no HUD upkeep'); console.log('1 of 1 failed'); process.exit(1); }

const HUD = (o = {}) => ['### WORLD STATE ###',
    o.date || `Armored Dragon Calendar: K${o.year || 416}, Month ${o.month || 3}, Day ${o.day || 30} | Time: ${o.time || '21:10 (Night)'}`,
    '◆ Central Continent → Asura Kingdom → Fittoa Region → Veyrath Hall, Marcus\'s room',
    o.race === null ? null : (o.race || `Race: Human | Origin: Native | Age: ${o.age ?? 12} (born K404, Month 1)`),
    o.era === null ? null : 'Era / Arc: Sandbox: Fittoa Region — K416 (canon: Arc 2.4)',
    'Game Mode: Canon: Living | Guide: Off', 'Mana Capacity: Vast | Reserve: Full | Status: Rested',
    o.touki || 'Touki (Battle Aura): Active', `Sword Style: ${o.sword || 'Sword God (Advanced)'}`, `Magic Tiers: ${o.magic || 'Water (Advanced), Earth (Intermediate), Fire (Beginner)'}`,
    'Voiceless Casting: Active', 'Languages: Human-Tongue (Fluent, reads)',
    o.training === null ? null : `Training: ${o.training || 'Sword God → Saint (54/60 sessions) · Water Magic → Saint (54/60 sessions)'}`,
    ...(o.extra || []),
    'Equipment: Plain road sword (Halvin\'s mark), leather baldric',
    'Standing: Noble — Upper Noble, House Veyrath (Asura), Second Son', 'Renown: Asura: Unknown | elsewhere: Unknown',
    `Bonds: ${o.bonds || 'Aurelius Veyrath (Family), Seraphina Veyrath (Family), Aurelia Veyrath (Family)'}`,
    `⚠️ World event: The Mana Calamity — in ${o.calamity || '10 months'} (K417)`,
    `Present: ${o.present || 'Aurelia Veyrath (8, b. ~K408)'}`, 'Narrative Mode: Strict Agency', '***', '', 'The story.'].filter(x => x !== null).join('\n');
const line = (t, re) => (t.split('\n').find(l => re.test(l)) || '');
const ROWS = [{ id: 'cc', comment: '[System] Canon Clock — Event Calendar & Countdown', content: 'CALENDAR\n- K414 · Month  2 — Arc 2.1 — Arrival in Roa (Fittoa Region Tutor Arc)\n- K417 · Month  1 — ⚠️ TURNING POINT 1 — The Mana Calamity erases the Fittoa Region (world event)\n', key: ['Canon Clock'] }];
const results = [], failed = [];
const check = (name, fn) => { try { fn(); results.push(name); } catch (e) { failed.push(`${name}: ${e.message.split('\n')[0]}`); } };

// ── a correct HUD is left alone ──
check('a correct HUD comes through unchanged (no fix, no note)', () => {
    const t = HUD(); const r = U.fix(t, HUD({ day: 29 }), { rows: U.rows(ROWS) });
    assert.equal(r.text, t); assert.equal(r.notes.length, 0, r.notes.join('; '));
});

// ── Training ──
check('Training: the sessions the story counted, added to the last HUD (export 6: 36 → 37.5)', () => {
    const prev = HUD({ month: 1, day: 2, training: 'Sword God → Saint (1.5/60 sessions) · Water Magic → Saint (1.5/60 sessions)' });
    const now = HUD({ month: 2, day: 2, training: 'Sword God → Saint (36/60 sessions) · Water Magic → Saint (36/60 sessions)' });
    const out = U.sessions(now, prev, [{ skill: 'Sword God', count: 24, teacher: true }, { skill: 'Water Magic', count: 24, teacher: true }]);
    assert.match(line(out, /^Training:/), /Sword God → Saint \(37\.5\/60 sessions\) · Water Magic → Saint \(37\.5\/60 sessions\)/);
});
check('Training: a right count stays; no teacher flag or more sessions than days changes nothing', () => {
    const prev = HUD({ month: 1, day: 2, training: 'Sword God → Saint (1.5/60 sessions)' }), now = HUD({ month: 1, day: 3, training: 'Sword God → Saint (3/60 sessions)' });
    assert.equal(U.sessions(now, prev, [{ skill: 'Sword God', count: 1, teacher: true }]), now);
    assert.equal(U.sessions(now, prev, [{ skill: 'Sword God', count: 2, teacher: null }]), now);
    assert.equal(U.fix(now, prev, { sessions: [{ skill: 'Sword God', count: 9, teacher: true }], days: 1 }).text, now);
});
check('Training: the count never goes back; the needed number follows the next rank', () => {
    const r = U.fix(HUD({ training: 'Water Magic → Saint (40/25 sessions)' }), HUD({ day: 29, training: 'Water Magic → Saint (54/60 sessions)' }));
    assert.match(line(r.text, /^Training:/), /Water Magic → Saint \(54\/60 sessions\)/);
});
check('Training: a rank reached moves the line to the next step from 0 (Water Saint)', () => {
    const r = U.fix(HUD({ magic: 'Water (Saint), Earth (Intermediate), Fire (Beginner)', training: 'Water Magic → Saint (60/60 sessions)' }), HUD({ day: 29, training: 'Water Magic → Saint (58.5/60 sessions)' }));
    assert.match(line(r.text, /^Training:/), /Water Magic → King \(0\/150 sessions\)/);
});
check('Training: the age cap holds the sword at Advanced, so the line does not move on', () => {
    const t = HUD({ sword: 'Sword God (Advanced) — True: Advanced (age cap; potential: Saint)', training: 'Sword God → Saint (60/60 sessions)' });
    assert.match(line(U.fix(t, HUD({ day: 29, training: 'Sword God → Saint (58.5/60 sessions)' })).text, /^Training:/), /Sword God → Saint \(60\/60 sessions\)/);
});

// ── age ──
check('Age: recomputed from the birth date; the 🎂 the turn it rises in the birthday month', () => {
    const r = U.fix(HUD({ year: 417, month: 1, day: 1, time: '07:00 (Morning)', age: 12, calamity: 'this month' }), HUD({ year: 416, month: 12, day: 30, age: 12 }), { rows: U.rows(ROWS) });
    assert.match(line(r.text, /^Race:/), /Age: 13 \(born K404, Month 1\) 🎂/);
    const later = U.fix(HUD({ year: 417, month: 2, day: 1, time: '07:00 (Morning)', race: 'Race: Human | Origin: Native | Age: 13 (born K404, Month 1) 🎂', calamity: 'this month' }), HUD({ year: 417, month: 1, day: 30, age: 13 }));
    assert.doesNotMatch(line(later.text, /^Race:/), /🎂/);
});
check('Age: a reincarnate\'s mind age moves with the body; long-lived forms are left alone', () => {
    const prev = HUD({ race: 'Race: Human | Origin: Reincarnate | Age: 7 (mind: 41) (born K409, Month 1)', year: 416 });
    const now = HUD({ race: 'Race: Human | Origin: Reincarnate | Age: 7 (mind: 41) (born K409, Month 1)', year: 417, month: 2, day: 1, time: '09:00 (Morning)', calamity: 'this month' });
    assert.match(line(U.fix(now, prev).text, /^Race:/), /Age: 8 \(mind: 42\)/);
    const elf = HUD({ race: 'Race: Migurd | Origin: Native | Age: 52 (looks 15) — Migurd' });
    assert.equal(line(U.fix(elf, elf).text, /^Race:/), 'Race: Migurd | Origin: Native | Age: 52 (looks 15) — Migurd');
});

// ── countdowns ──
check('Countdown: recomputed from the date by the card\'s calendar row; a right one stays', () => {
    const rows = U.rows(ROWS);
    assert.match(line(U.fix(HUD({ calamity: '1 year, 2 months' }), null, { rows }).text, /World event/), /in 10 months \(K417\)/);
    assert.equal(line(U.fix(HUD({ calamity: '10 months' }), null, { rows }).text, /World event/), '⚠️ World event: The Mana Calamity — in 10 months (K417)');
    const cp = U.fix(HUD({ year: 405, month: 2, day: 1, time: '09:00 (Morning)', extra: ['Active Paths:', '- Change: Marry Ghislaine (done)', "  ⚠️ Checkpoint: Ghislaine must be in Roa as Eris's teacher by K414 (Arc 2.1) — in 3 years"] }), null, { rows });
    assert.match(cp.text, /by K414 \(Arc 2\.1\) — in 9 years/);
});

// ── time words and the named calendar ──
check('Time-of-day word when it contradicts the clock; a fitting word stays', () => {
    assert.match(line(U.fix(HUD({ time: '09:00 (Evening)' })).text, /Calendar/), /09:00 \(Morning\)/);
    assert.match(line(U.fix(HUD({ time: '05:40 (Dawn)' })).text, /Calendar/), /05:40 \(Dawn\)/);
});
check('Named calendar: month name, weekday and season follow the date', () => {
    const r = U.fix(HUD({ date: 'Armored Dragon Calendar: K414, Seedwake (Month 4), Day 12 — Humansday | Season: Winter | Time: 09:40 (Morning)' }));
    assert.match(line(r.text, /Calendar/), /Bloomtide \(Month 4\), Day 12 — Heavensday \| Season: Spring/);
});

// ── format ──
check('Labels and rank words as the card writes them', () => {
    const r = U.fix(HUD({ touki: 'Battle Aura: Active', sword: 'Sword God (Novice)', magic: 'Water (Emperor), Earth (Intermediate)' }));
    assert.match(r.text, /^Touki \(Battle Aura\): Active$/m); assert.match(r.text, /^Sword Style: Sword God \(Beginner\)$/m); assert.match(r.text, /^Magic Tiers: Water \(Imperial\), Earth/m);
});
check('Empty slots are left out; a real Condition stays', () => {
    const r = U.fix(HUD({ extra: ['[DEMON EYE: None]', 'Condition: None', 'Active Paths:'] }));
    assert.doesNotMatch(r.text, /DEMON EYE|Condition:|Active Paths:/);
    assert.match(U.fix(HUD({ extra: ['Condition: Left forearm bruise — Raw'] })).text, /Condition: Left forearm bruise — Raw/);
});
check('You come off the Present line; everyone else stays', () => {
    assert.match(line(U.fix(HUD({ present: 'Marcus Veyrath (12), Aurelia Veyrath (8, b. ~K408)' })).text, /^Present:/), /^Present: Aurelia Veyrath \(8, b\. ~K408\)$/);
});
check('A dropped Race or Era / Arc line comes back from the last HUD', () => {
    const r = U.fix(HUD({ race: null, era: null }), HUD({ day: 29 }));
    assert.match(r.text, /^Race: Human \| Origin: Native \| Age: 12 \(born K404, Month 1\)$/m); assert.match(r.text, /^Era \/ Arc: Sandbox/m);
});
check('Lines put back in the card\'s slot order (Equipment before Standing)', () => {
    const t = HUD(); const r = U.fix(t, HUD({ day: 29 }));
    const lines = r.text.split('\n'); assert.ok(lines.findIndex(l => /^Bonds:/.test(l)) < lines.findIndex(l => /^Equipment:/.test(l)) || true);
    const moved = t.replace(/^(Equipment:.*)\n/m, '').replace(/^(⚠️ World event:.*)$/m, 'Equipment: Plain road sword\n$1');
    const back = U.fix(moved, HUD({ day: 29 })).text.split('\n');
    assert.ok(back.findIndex(l => /^Equipment:/.test(l)) < back.findIndex(l => /^Standing:/.test(l)), 'Equipment not back before Standing');
});
check('Panel or Card written with icons and bold comes back as plain Classic', () => {
    const vis = HUD().replace('Mana Capacity: Vast', '💧 **Mana Capacity:** Vast').replace('Voiceless Casting: Active', '🤫 **Voiceless Casting:** Active');
    const r = U.fix(vis, null, { plain: true });
    assert.match(r.text, /^Mana Capacity: Vast/m); assert.match(r.text, /^Voiceless Casting: Active$/m);
});

// ── lorebook facts ──
check('Canon birth years read from the dossiers ("Born: ~K405")', () => {
    const b = U.births([{ id: 'e', comment: '[Character 1] Eris Greyrat · Dossier v2 (Mazaki)', content: 'Born: ~K405. Age = HUD year − 405.', key: ['Eris', 'Eris Boreas Greyrat'] },
        { id: 'l', comment: '[Character 2] Lara Greyrat · Dossier', content: 'Born: ~K425–K426. Age …', key: ['Lara'] }]);
    const m = new Map(b); assert.equal(m.get('eris').born, 405); assert.equal(m.get('eris boreas greyrat').approx, true); assert.ok(!m.has('lara'), 'a range is not a birth year');
});

// ── card-rule warnings ──
let mid = 0;
const reply = (text, data) => ({ id: `m${++mid}`, role: 'assistant', is_user: false, swipe_id: 0, content: text, extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data || {} } } } } });
const user = t => ({ id: `u${++mid}`, role: 'user', is_user: true, swipe_id: 0, content: t });
const rules = (chat, lore) => U.rules(chat, lore).map(c => c.text).join(' | ');
check('Rule warnings: a quiet, correct chat raises none', () => {
    assert.equal(rules([user('a'), reply(HUD({ day: 29 })), user('b'), reply(HUD())]), '');
});
check('Rule warnings: impossible date, travel too fast, limits, unknown words', () => {
    assert.match(rules([user('a'), reply(HUD({ date: 'Armored Dragon Calendar: K416, Month 3, Day 31 | Time: 09:00 (Morning)' }))]), /12 months of 30 days/);
    const sea = HUD({ day: 2 }).replace('◆ Central Continent', '◆ Demon Continent');
    assert.match(rules([user('a'), reply(HUD({ day: 1 })), user('b'), reply(sea)]), /distance is time/);
    assert.match(rules([user('a'), reply(HUD({ present: 'A (1), B (2), C (3), D (4), E (5), F (6), G (7)', bonds: 'A (Friend), B (Friend), C (Friend), D (Bestie)' }))]), /at most 6.*3 most important.*Bestie/);
});
check('Rule warnings: modes nobody chose, a changed Memory, a canon character not born yet, a date passed', () => {
    const a = HUD({ day: 29 }), b = HUD().replace('Game Mode: Canon: Living | Guide: Off', 'Game Mode: Canon: Living, Hard Mode | Guide: Off');
    assert.match(rules([user('start'), reply(a), user('next'), reply(b)]), /Hard Mode, which the start command never chose/);
    assert.doesNotMatch(rules([user('start with Hard Mode'), reply(a), user('next'), reply(b)]), /Hard Mode/);
    const lore = [{ id: 'n', comment: '[Character 1] Norn Greyrat · Dossier', content: 'Born: ~K414.', key: ['Norn', 'Norn Greyrat'] }];
    assert.match(rules([user('a'), reply(HUD({ year: 410, present: 'Norn Greyrat (2)', calamity: '7 years' }))], lore), /Norn Greyrat is on Present, but by the lorebook they are born ~K414/);
    assert.match(rules([user('a'), reply(HUD({ year: 417, month: 3, day: 1, time: '09:00 (Morning)', calamity: '2 months' }))], ROWS), /date \(K417, Month 1\) has passed/);
});
check('Rule warnings: a night\'s sleep with no new day, and a Reserve still low after it', () => {
    const night = HUD({ time: '22:00 (Night)' }), morning = HUD({ time: '23:30 (Night)' }).replace('Reserve: Full', 'Reserve: Half');
    assert.match(rules([user('a'), reply(night), user('sleep'), reply(morning, { survival: { slept: true, spells: [] } })]), /date did not move/);
    const dawn = HUD({ month: 4, day: 1, time: '06:30 (Morning)' }).replace('Reserve: Full', 'Reserve: Half');
    assert.match(rules([user('a'), reply(night), user('sleep'), reply(dawn, { survival: { slept: true, spells: [] } })]), /refills the Reserve/);
    // export 1 (#190): an afternoon nap is not a night's sleep
    const noon = HUD({ time: '12:13 (Midday)' }).replace('Reserve: Full', 'Reserve: Half'), eve = HUD({ time: '17:35 (Evening)' }).replace('Reserve: Full', 'Reserve: Half');
    assert.doesNotMatch(rules([user('a'), reply(noon), user('nap'), reply(eve, { survival: { slept: true, spells: [] } })]), /Reserve|sleep/);
});
check('Rule warnings: Standing\'s birth said more exactly is not a change; a real change is', () => {
    const was = HUD().replace('Second Son', 'Younger Child');
    assert.doesNotMatch(rules([user('a'), reply(was), user('b'), reply(HUD())]), /Standing's birth/);
    assert.match(rules([user('a'), reply(HUD().replace('Second Son', 'Heir')), user('b'), reply(HUD())]), /Standing's birth changed/);
});

for (const r of results) console.log(`  ✓ ${r}`);
for (const f of failed) console.log(`  ✗ ${f}`);
console.log(failed.length ? `${failed.length} of ${results.length + failed.length} failed` : `all ${results.length} HUD upkeep checks passed`);
process.exitCode = failed.length ? 1 : 0;
