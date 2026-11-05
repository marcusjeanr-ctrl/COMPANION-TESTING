// Lifecycle integration: what the narrator writes → what the reporter reports → what the Companion keeps →
// what the next request tells the narrator. Positive cases (a real change is captured) and negative ones
// (a mention, a hypothetical, a discarded swipe, an OOC turn or a repeat never becomes established state).
// Runs pushState and the request interceptor over synthetic chats with a persistent chat state, the way a
// session grows. Synthetic only. Run: node tools/test_lifecycle.cjs   (BACKEND=<older backend.js> to compare)
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const src = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = src.indexOf('// ───────────────────────────── Startup');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(src.slice(0, startup) + `
globalThis.__L = (lore, user) => { let chat = [], state = emptyChatState();
  chatApi.getMessages = async () => companionMarkTurnPurposes(chat); getChatState = async () => state; saveChatState = async (id, s) => { state = s; };
  getUserName = async () => { userNameCache.set('c1', user); return user; }; userNameCache.set('c1', user); healRecent = async () => false;
  const pool = { entries: lore }; loreCatalogPool = () => pool; let last = null; toFrontend = p => { if (p && p.type === 'state') last = p; };
  return { set: c => { chat = c; hmsCache.delete('c1'); }, push: async () => { last = null; hmsCache.delete('c1'); await pushState('c1'); return JSON.parse(JSON.stringify(last)); },
    state: () => JSON.parse(JSON.stringify(state)), setState: s => { state = s; },
    request: async (next) => { const msgs = [{ role: 'system', content: 'GM' }, ...chat.map(m => ({ role: m.role, content: textOf(m.content), __isChatHistory: true })), { role: 'user', content: next || 'I wait.', __isChatHistory: true }];
      const out = await rpgcInterceptor(msgs, { chatId: 'c1', generationType: 'normal' }); const arr = Array.isArray(out) ? out : out && out.messages || [];
      return arr.filter(m => !m.__isChatHistory && !msgs.some(p => p.content === m.content)).map(m => m.content).join('\\n'); } }; };`, ctx);

const spell = (name, school, rank) => ({ id: 'sp-' + name, comment: `[Spell] ${name}`, content: `[SPELL — ${name}]\nSchool: ${school} · Rank: ${rank}\nEffect: test.`, key: [name] });
const lore = [spell('Earth Wall', 'Earth', 'Intermediate'), spell('Water Ball', 'Water', 'Beginner'), spell('Earth Pillar', 'Earth', 'Intermediate')];
let n = 0;
const HUD = (o = {}) => ['### WORLD STATE ###', `Armored Dragon Calendar: K${o.year || 416}, Month ${o.month || 4}, Day ${o.day || 6} | Time: ${o.time || '09:00'} (Morning)`,
    `◆ Central Continent → Asura Kingdom → ${o.place || 'Roa, Boreas Manor yard'}`, `Race: Human | Origin: Native | Age: ${o.age || 12} (born K404, Month 1)`,
    'Era / Arc: Sandbox: Fittoa Region — K416 (canon: Arc 2.4)', 'Mana Capacity: Vast | Reserve: Full | Status: Rested', 'Sword Style: Sword God (Advanced)',
    'Magic Tiers: Water (Advanced), Earth (Intermediate)', o.condition ? `Condition: ${o.condition}` : null, `Equipment: ${o.equipment || 'Plain road sword, leather baldric'}`,
    `Present: ${o.present || 'Ghislaine Dedoldia (31, b. K385)'}`, '***'].filter(Boolean).join('\n');
const user = t => ({ id: `u${++n}`, role: 'user', is_user: true, swipe_id: 0, content: t });
const reply = (data, prose, o, swipes) => {
    const sw = swipes || { 0: data || {} };
    return { id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: swipes ? Number(Object.keys(sw).at(-1)) : 0, content: `${HUD(o)}\n\n${prose}`, extra: { spindle_metadata: { rpg_companion: { swipes: sw } } } };
};
const facts = st => JSON.parse(JSON.stringify(factsRaw(st)));
const factsRaw = st => {
    const h = st.hms;
    return {
        gear: h.gear.items.map(i => `${i.name}:${i.state}`).sort(),
        dead: h.relations.people.filter(p => p.dead).map(p => p.name).sort(),
        spells: (h.magic.spellbook || []).map(s => s.name).sort(),
        agenda: h.agenda.items.filter(a => ['open', 'in_progress'].includes(a.state)).map(a => a.what).sort(),
        money: (h.money && h.money.ledger || []).map(l => `${l.dir}${l.amount} ${l.currency} ${l.what}`).sort(),
        quests: h.systems.quests.map(q => q.name).sort(),
        wounds: h.systems.wounds.map(w => w.name).sort()
    };
};
const results = [], failed = [], known = [];
const check = async (name, fn, isKnown = false) => { try { await fn(); results.push(name); } catch (e) { (isKnown ? known : failed).push(`${name}: ${e.message.split('\n')[0]}`); } };
const A = { gear: [{ name: 'silver locket', state: 'worn' }], deaths: ['Halvin'], survival: { learned: ['Earth Wall'], spells: ['Earth Wall'], got: ['silver locket'] },
    relations: [{ key: 'halvin', name: 'Halvin', standing: 'Acquaintance', bond: 'smith' }],
    agenda: [{ key: 'duel at noon', what: 'Duel at noon', with: 'Ghislaine Dedoldia', when: 'at noon', kind: 'event', state: 'open' }],
    money: [{ amount: 5, currency: 'silver', kind: 'purchase', dir: 'out', what: 'silver locket', with: 'smith' }],
    quests: [{ key: 'the duel', questId: 'the duel', name: 'The Duel', objective: 'win', progress: 10, category: 'side', state: 'active', cls: 'active' }],
    injuries: [{ where: 'left arm', what: 'deep cut', kind: 'wound', severity: 'moderate', status: 'raw' }] };

(async () => {
    const L = ctx.__L(lore, 'Marcus Veyrath');
    const base = () => [user('Begin.'), reply({}, 'The yard is quiet.')];

    // ── swipes and regeneration ──
    await check('a discarded swipe leaves no trace: payload identical to the chat without it', async () => {
        L.setState(ctx.emptyChatState ? ctx.emptyChatState() : {}); L.set([...base(), user('I act.'), reply(null, 'Kept story.', { time: '10:00' }, { 0: A, 1: {} })]);
        const withDiscarded = facts(await L.push());
        L.setState({}); L.set([...base(), user('I act.'), reply({}, 'Kept story.', { time: '10:00' })]);
        assert.deepEqual(withDiscarded, facts(await L.push()));
    });
    await check('regenerating after a swipe was seen: what the old swipe added is gone (state kept between pushes)', async () => {
        L.setState({}); const msg = reply(A, 'Halvin dies on the forge floor. You buy the silver locket. Earth Wall rises.', { time: '10:00' });
        const chat = [...base(), user('I act.'), msg]; L.set(chat); const before = facts(await L.push());
        assert.ok(before.gear.some(g => /locket/.test(g)) && before.dead.includes('Halvin'), 'the kept swipe was not read at all: ' + JSON.stringify(before));
        msg.extra.spindle_metadata.rpg_companion.swipes[1] = {}; msg.swipe_id = 1; msg.content = `${HUD({ time: '10:00' })}\n\nNothing happens.`;
        L.set(chat); const after = facts(await L.push());
        assert.deepEqual(after.gear.filter(g => /locket/.test(g)), [], 'gear kept');
        assert.deepEqual(after.dead, [], 'death kept');
        assert.ok(!after.spells.includes('Earth Wall'), 'spell kept');
        assert.ok(!after.agenda.includes('Duel at noon'), 'agenda kept');
        assert.deepEqual(after.money, [], 'payment kept');
        assert.ok(!after.quests.includes('The Duel'), 'quest kept');
    });
    await check('the narrator request after a regeneration does not carry the discarded swipe', async () => {
        L.setState({}); const msg = reply(A, 'x', { time: '10:00' }, { 0: A, 1: {} }); msg.content = `${HUD({ time: '10:00' })}\n\nNothing happens.`;
        L.set([...base(), user('I act.'), msg]); await L.push();
        const req = await L.request();
        assert.doesNotMatch(req, /silver locket|Duel at noon|The Duel/);
    });

    // ── repeats, saves, OOC ──
    await check('pushing the same chat three times changes nothing (no duplicates in state or panels)', async () => {
        L.setState({}); L.set([...base(), user('I act.'), reply(A, 'Halvin dies. You buy the silver locket.', { time: '10:00' })]);
        const p1 = facts(await L.push()), s1 = JSON.stringify(L.state()); await L.push(); const p3 = facts(await L.push());
        assert.deepEqual(p1, p3); assert.equal(JSON.stringify(L.state()), s1);
    });
    await check('backup then restore gives the same panels', async () => {
        L.setState({}); L.set([...base(), user('I act.'), reply(A, 'Halvin dies.', { time: '10:00' })]);
        const p1 = facts(await L.push()); const saved = L.state(); L.setState({}); L.setState(saved); assert.deepEqual(facts(await L.push()), p1);
    });
    await check('an OOC question and its answer change no state', async () => {
        L.setState({}); const story = [...base(), user('I act.'), reply(A, 'Halvin dies.', { time: '10:00' })]; L.set(story); const p1 = facts(await L.push());
        L.set([...story, user('(OOC: what spells do I know?)'), { id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: 0, content: 'OOC — you know Water Ball and Earth Wall.', extra: { spindle_metadata: { rpg_companion: { swipes: { 0: {} } } } } }]);
        assert.deepEqual(facts(await L.push()), p1);
    });

    // ── mentions and hypotheticals that must not become state ──
    await check('a death in a hypothetical ("would die if") is not a death', async () => {
        L.setState({}); L.set([...base(), user('I ask what is at stake.'), reply({ relations: [{ key: 'halvin', name: 'Halvin', standing: 'Acquaintance', bond: 'smith' }], deaths: ['Halvin'] }, 'Ghislaine shrugs. "If you fail the test, Halvin would die for nothing. So don\'t."', { time: '10:00', present: 'Ghislaine Dedoldia (31, b. K385), Halvin (50)' })]);
        assert.deepEqual(facts(await L.push()).dead, []);
    });
    await check('a death the story shows is a death', async () => {
        L.setState({}); L.set([...base(), user('I watch.'), reply({ relations: [{ key: 'halvin', name: 'Halvin', standing: 'Acquaintance', bond: 'smith' }], deaths: ['Halvin'] }, 'The blade takes Halvin under the ribs. He falls and does not rise; he is dead before the sand is red.', { time: '10:00' })]);
        assert.deepEqual(facts(await L.push()).dead, ['Halvin']);
    });
    await check('a death named in no part of the reply is not a death', async () => {
        L.setState({}); L.set([...base(), user('I train.'), reply({ relations: [{ key: 'halvin', name: 'Halvin', standing: 'Acquaintance', bond: 'smith' }], deaths: ['Halvin'] }, 'You drill the footwork until noon.', { time: '10:00' })]);
        assert.deepEqual(facts(await L.push()).dead, []);
    });
    await check('a wound reported in a reply is tracked; the regenerated reply without it drops it', async () => {
        L.setState({}); const msg = reply(null, 'A cut opens your arm.', { time: '10:00', condition: 'Deep cut on the left arm — Raw' }, { 0: A });
        const chat = [...base(), user('I fight.'), msg]; L.set(chat); assert.ok(facts(await L.push()).wounds.length === 1);
        msg.swipe_id = 1; msg.extra.spindle_metadata.rpg_companion.swipes[1] = {}; msg.content = `${HUD({ time: '10:00' })}\n\nYou dodge.`;
        L.set(chat); assert.deepEqual(facts(await L.push()).wounds, []);
    });

    await check('a physical skill the reporter names stays out of the Spellbook (export 9 "Bracer wand flick")', async () => {
        L.setState({}); L.set([...base(), user('I drill.'), reply({ survival: { spells: [], learned: [], mastered: [], study: [], abilities: [
            { name: 'Bracer wand flick', owner: 'you', state: 'reliable', historical: false, evidence: "the stiff lip catching the wand's butt into your palm on the turn of the wrist" },
            { name: 'Break-falls', owner: 'you', state: 'practiced', historical: false, evidence: 'break-falls from the knees' }] } }, "Wenna's bracer, the stiff lip catching the wand's butt into your palm on the turn of the wrist. Then break-falls from the knees.", { time: '10:00' })]);
        const st = JSON.parse(JSON.stringify(await L.push()));
        const book = (st.hms.magic.spellbook || []).map(x => x.name);
        assert.ok(!book.some(n => /flick|break/i.test(n)), `in the Spellbook: ${book.join(', ')}`);
    });
    // ── time ──
    await check('a year rollover is not the clock going back; the player\'s birthday month raises the age check', async () => {
        L.setState({}); L.set([user('a'), reply({}, 'Snow.', { year: 416, month: 12, day: 30, time: '23:00' }), user('b'), reply({}, 'New year.', { year: 417, month: 1, day: 1, time: '07:00', age: 13 })]);
        const st = await L.push(); assert.ok(!st.hms.checks.some(c => c.kind === 'clock'), JSON.stringify(st.hms.checks));
    });
    await check('a long skip leaves no false "late" on a daily routine and no starvation', async () => {
        L.setState({}); const sched = { key: 'training schedule', what: 'Training schedule', when: 'every morning at dawn', kind: 'event', state: 'open' };
        L.set([user('a'), reply({ agenda: [sched] }, 'Dawn.', { month: 4, day: 6 }), user('(Time skip: two weeks.)'), reply({ agenda: [sched] }, 'Two weeks pass.', { month: 4, day: 20, time: '18:00' })]);
        const st = await L.push(); const it = st.hms.agenda.items.find(a => a.what === 'Training schedule');
        assert.equal(it.status, 'ongoing'); assert.ok(!(st.hms.todo || []).some(t => t.kind === 'due' && /Training schedule/.test(t.text)));
    });

    // ── what the next request carries ──
    await check('gear set down by the bags stays listed as left there; a HUD "(packed, top bag)" note wins over a missed report', async () => {
        // export chat 2: the side panel said "dropped … beside the bags"; the slate's packing was never reported
        L.setState({});
        const eq0 = "Plain road sword, leather baldric, slide-bracer (Wenna's make), Aurelia's prize slate";
        const eq1 = "Plain road sword, leather baldric (laid beside bags), slide-bracer (Wenna's make), Aurelia's prize slate (packed, top bag)";
        L.set([...base(), user('I take the gear.'), reply({ gear: [{ name: 'leather baldric', state: 'worn', where: 'across the back' }, { name: 'slide-bracer', state: 'worn', where: 'left forearm' }, { name: "Aurelia's prize slate", state: 'in hand' }] }, 'You buckle on the baldric and the bracer; Aurelia gives you the slate.', { equipment: eq0, time: '21:00' }),
            user('*I set Aurelia\'s slate in the top of my travel bag.*'), reply({}, 'The slate goes in on top.', { equipment: eq1.replace(' (laid beside bags)', ''), time: '21:30' }),
            user('*I set the slide bracer and baldric down beside my luggage.*'),
            reply({ gear: [{ name: 'leather baldric', state: 'dropped', where: 'beside the bags by the door' }, { name: 'slide-bracer', state: 'dropped', where: 'beside the bags by the door' }] }, 'The baldric goes down first, coiled flat. The bracer settles beside it.', { equipment: eq1, time: '21:50' })]);
        const g = (await L.push()).hms.gear, by = n => g.items.find(i => i.name === n);
        assert.equal(by('leather baldric')?.state, 'stowed'); assert.equal(by('slide-bracer')?.state, 'stowed');
        assert.equal(by("Aurelia's prize slate")?.state, 'in container'); assert.equal(by("Aurelia's prize slate")?.inside, 'top bag');
        assert.equal(by('Plain road sword')?.state ?? null, null);
        assert.ok(!g.gone.some(x => /baldric|bracer/.test(x.name)), 'HUD-listed gear went to Gone');
    });
    await check('"at first bell" said late at night is tomorrow, not late; "(top bag)" alone still means packed', async () => {
        L.setState({});
        const eq = "Plain road sword, Aurelia's prize slate (packed, top bag)";
        L.set([...base(), user('I pack.'), reply({ agenda: [{ key: 'departure at first bell', what: 'Departure at first bell', with: 'Seraphina Veyrath', where: 'the gate', when: 'first bell', kind: 'meeting', state: 'open' }] }, 'Seraphina says the courier leaves at first bell.', { equipment: eq, time: '21:50' }),
            user('I pack my books.'), reply({}, 'The books go in flat.', { equipment: eq.replace('packed, top bag', 'top bag'), time: '21:55' })]);
        const st = (await L.push()).hms;
        const dep = st.agenda.items.find(a => /first bell/i.test(a.what));
        assert.ok(dep && dep.dueIn > 0 && dep.status !== 'overdue', JSON.stringify(dep));
        assert.equal(st.gear.items.find(i => /slate/.test(i.name))?.state, 'in container');
    });
    await check('the narrator request stays bounded with many open items', async () => {
        L.setState({}); const many = Array.from({ length: 40 }, (_, i) => ({ key: `errand ${i}`, what: `Errand number ${i} at the market`, when: `in ${i + 1} days`, kind: 'errand', state: 'open' }));
        L.set([...base(), user('I plan.'), reply({ agenda: many }, 'A long list.', { time: '10:00' })]); await L.push();
        const req = await L.request(); assert.ok(req.length < 40000, `request grew to ${req.length} chars`);
    });

    for (const r of results) console.log(`  ✓ ${r}`);
    for (const k of known) console.log(`  ⚠ known (model-dependent, documented): ${k}`);
    for (const f of failed) console.log(`  ✗ ${f}`);
    console.log(failed.length ? `${failed.length} of ${results.length + failed.length + known.length} failed` : `all ${results.length} lifecycle checks passed${known.length ? `, ${known.length} documented limit(s)` : ''}`);
    process.exitCode = failed.length ? 1 : 0;
})().catch(e => { console.error('lifecycle run failed:', e.stack || e); process.exitCode = 2; });
