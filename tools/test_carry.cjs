// Carry-over: a new chat that continues a saved game (Mushoku_Save → Mushoku_Continue_Handler) reads the
// earlier chat's history first, so People, Spellbook, gear, money, quests and hand marks continue.
// Runs the real chatApi, chat state and storage code over an in-memory Spindle. Synthetic only.
// Run: node tools/test_carry.cjs   (BACKEND=<older backend.js> to compare)
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const src = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = src.indexOf('// ───────────────────────────── Startup');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const chats = new Map(), store = new Map(), writes = [];
const fallback = new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) });
const spindle = new Proxy({}, { get: (t, k) => {
    if (k === 'log') return quiet;
    if (k === 'chat') return {
        getMessages: async id => (chats.get(id) || []).map(m => ({ ...m })),
        updateMessage: async (id, mid, patch) => { writes.push([id, mid]); const m = (chats.get(id) || []).find(x => x.id === mid); if (!m) throw new Error('no such message'); Object.assign(m, patch); return m; },
        setMessagesHidden: async () => null, appendMessage: async () => null };
    if (k === 'storage') return {
        getJson: async (p, o) => store.has(p) ? JSON.parse(store.get(p)) : (o ? o.fallback : null),
        setJson: async (p, v) => { store.set(p, JSON.stringify(v)); } };
    return fallback;
} });
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance, spindle };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(src.slice(0, startup) + `
globalThis.__C = (user) => { let last = null;
  getUserName = async (id) => { userNameCache.set(id, user); return user; };
  loreCatalogPool = () => ({ entries: [] }); toFrontend = p => { if (p && p.type === 'state') last = p; };
  const has = typeof carryLink === 'function';
  return { has,
    push: async id => { last = null; hmsCache.delete(id); await pushState(id); return JSON.parse(JSON.stringify(last)); },
    link: async (id, from) => carryLink(id, from), unlink: async id => carryUnlink(id),
    cold: () => { chatStateCache.clear(); if (has) { carryMem.clear(); carryIndex = null; } hmsCache.clear(); },
    state: async id => JSON.parse(JSON.stringify(await getChatState(id))),
    setState: async (id, s) => saveChatState(id, s),
    messages: async id => (await chatApi.getMessages(id)).map(m => ({ id: m.id, carried: !!m._rpgcCarried, text: textOf(m.content).slice(0, 40) })),
    update: async (id, mid) => chatApi.updateMessage(id, mid, { content: 'x' }),
    swipe: async (id, mid, data) => { const m = (await chatApi.getMessages(id)).find(x => x.id === mid); return setSwipeData(id, m, data); },
    status: id => chatStatus.get(id) || null,
    burst: async id => { let n = 0; const was = toFrontend; toFrontend = p => { if (p && p.type === 'state') { n++; last = p; } };
      await Promise.all([pushState(id), pushState(id), pushState(id), pushState(id)]); toFrontend = was; return n; } }; };`, ctx);

let n = 0;
const HUD = (o = {}) => ['### WORLD STATE ###', `Armored Dragon Calendar: K416, Month ${o.month || 3}, Day ${o.day || 30} | Time: ${o.time || '21:10'} (Night)`,
    '◆ Central Continent → Asura Kingdom → Fittoa Region → Veyrath Hall, Marcus\'s room', 'Race: Human | Origin: Native | Age: 12 (born K404, Month 1)',
    'Era / Arc: Sandbox: Fittoa Region — K416 (canon: Arc 2.4)', 'Game Mode: Canon: Living | Guide: Off', 'Mana Capacity: Vast | Reserve: Full | Status: Rested',
    'Sword Style: Sword God (Advanced)', 'Magic Tiers: Water (Advanced), Earth (Intermediate)', `Equipment: ${o.equipment || 'Plain road sword, silver locket'}`,
    `Present: ${o.present || 'Aurelia Veyrath (8, b. ~K408)'}`, 'Narrative Mode: Strict Agency', '***'].join('\n');
const user = t => ({ id: `u${++n}`, role: 'user', is_user: true, swipe_id: 0, content: t });
const reply = (data, prose, o) => ({ id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: 0, content: `${HUD(o)}\n\n${prose}`, extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data || {} } } } } });
const A_DATA = { gear: [{ name: 'silver locket', state: 'worn' }], survival: { learned: ['Earth Wall'], spells: ['Earth Wall'], got: ['silver locket'] },
    relations: [{ key: 'halvin', name: 'Halvin', standing: 'Acquaintance', bond: 'smith' }],
    money: [{ amount: 5, currency: 'silver', kind: 'purchase', dir: 'out', what: 'silver locket', with: 'Halvin' }],
    quests: [{ key: 'two years in roa', questId: 'two years in roa', name: 'Two Years in Roa', objective: 'Leave with the courier', progress: 90, category: 'main', state: 'active', cls: 'active' }] };
const facts = st => JSON.parse(JSON.stringify({
    spells: (st.hms.magic.spellbook || []).map(s => s.name).sort(),
    gear: st.hms.gear.items.map(i => i.name).sort(),
    people: st.hms.relations.people.map(p => p.name).sort(),
    money: (st.hms.money && st.hms.money.ledger || []).length,
    quests: st.hms.systems.quests.map(q => q.name).sort()
}));
const results = [], failed = [];
const check = async (name, fn) => { try { await fn(); results.push(name); } catch (e) { failed.push(`${name}: ${e.message.split('\n')[0]}`); } };

(async () => {
    const api = vm.runInContext('__C', ctx)('Marcus Veyrath');
    if (!api.has) { console.log('carry-over: not in this backend (0 passed, 1 failed)'); process.exit(1); }
    // Chat A: the story, then a save turn.
    const A = [reply(null, 'PAGE 1 · CANVAS'), user('I buy the locket from Halvin.'),
        reply(A_DATA, 'Halvin takes your five silver and hands over the locket. Seraphina shows you Earth Wall in the yard; you raise it.', { time: '20:00' }),
        user('I go to my room.'), reply({}, 'You climb the stairs to your room. Aurelia follows with her slate.', { time: '21:10' }),
        user('Mushoku_Save'), { id: `m${++n}`, role: 'assistant', swipe_id: 0, content: '```\n' + HUD().replace('\n***', '') + '\n```\n\n### SAVE NOTES ###\nParty: None.' }];
    chats.set('A', A);
    // Chat B: the card's greeting, the continue turn with the pasted save, then play.
    const B = [{ id: 'b0', role: 'assistant', swipe_id: 0, content: '# 🎨 PAGE 2 · CANVAS\n*This page is left clean on purpose.*' },
        { id: 'b1', role: 'user', is_user: true, swipe_id: 0, content: 'Mushoku_Continue_Handler\n\n' + HUD().replace('\n***', '') + '\n\n***\n\n### SAVE NOTES ###\nParty: None.' },
        { id: 'b2', role: 'assistant', swipe_id: 0, content: `${HUD({ time: '21:20' })}\n\nThe room is as you left it.`, extra: { spindle_metadata: { rpg_companion: { swipes: { 0: {} } } } } },
        { id: 'b3', role: 'user', is_user: true, swipe_id: 0, content: '*I pack the slate in my bag.*' },
        { id: 'b4', role: 'assistant', swipe_id: 0, content: `${HUD({ time: '21:30' })}\n\nThe slate goes in on top.`, extra: { spindle_metadata: { rpg_companion: { swipes: { 0: {} } } } } }];
    chats.set('B', B);

    const a = await api.push('A');
    const before = await api.push('B');
    await check('the new chat starts empty, as reported (the bug)', async () => {
        assert.deepEqual(facts(before).spells, []); assert.ok(!facts(before).people.includes('Halvin'));
    });
    await check('a continued chat is offered its save, matched by date and place', async () => {
        assert.equal(before.carry.continued, true); assert.equal(before.carry.linked, null);
        assert.equal(before.carry.choices[0].chatId, 'A'); assert.equal(before.carry.choices[0].match, true);
    });
    // Hand marks in chat A (a birth year set by hand) come along; chat B's own marks are kept.
    const stA = await api.state('A'); stA.peopleBorn = { halvin: { born: 380, month: null } }; await api.setState('A', stA);
    const stB = await api.state('B'); stB.pins = { mine: true }; await api.setState('B', stB);
    assert.equal(await api.link('B', 'A'), true);
    const after = await api.push('B');
    await check('after carry-over every panel continues from chat A', async () => {
        const f = facts(after), fa = facts(a);
        assert.deepEqual(f.spells, fa.spells); assert.ok(f.spells.includes('Earth Wall'));
        assert.ok(f.people.includes('Halvin')); assert.equal(f.money, fa.money); assert.ok(f.money >= 1);
        assert.ok(f.quests.includes('Two Years in Roa')); assert.ok(f.gear.includes('silver locket'));
        assert.equal(after.hms.hud.time, '21:30');
    });
    await check('the panel reports the link and no longer offers it', async () => {
        assert.equal(after.carry.linked.from, 'A'); assert.equal(after.carry.linked.count, 5); assert.equal(after.carry.choices.length, 0);
    });
    await check('the save turn and chat B\'s greeting are left out; order is A then B', async () => {
        const ms = await api.messages('B');
        assert.ok(!ms.some(m => /SAVE NOTES|PAGE 2/.test(m.text) && m.carried));
        assert.ok(!ms.some(m => m.id === 'b0'));
        assert.equal(ms.filter(m => m.carried).length, 5); assert.equal(ms[5].id, 'b1');
    });
    await check('hand marks from chat A come along; chat B\'s own stay', async () => {
        const st = await api.state('B'); assert.equal(st.peopleBorn.halvin.born, 380); assert.equal(st.pins.mine, true);
    });
    await check('the carried history is read only: no write reaches chat A', async () => {
        writes.length = 0;
        assert.equal(await api.update('B', A[2].id), null);
        await assert.rejects(() => api.swipe('B', A[2].id, {}));
        assert.equal(writes.length, 0);
        await api.swipe('B', 'b4', { gear: [] });
        assert.deepEqual(writes, [['B', 'b4']]);
    });
    await check('it survives a restart and the earlier chat being deleted', async () => {
        chats.delete('A'); api.cold();
        const st = await api.push('B'); assert.ok(facts(st).spells.includes('Earth Wall')); assert.equal(st.carry.linked.missing, false);
        chats.set('A', A);
    });
    await check('a chain carries both earlier chats; a loop is refused', async () => {
        chats.set('C', [{ id: 'c1', role: 'user', is_user: true, swipe_id: 0, content: 'Mushoku_Continue_Handler\n\n' + HUD({ time: '21:30' }).replace('\n***', '') },
            { id: 'c2', role: 'assistant', swipe_id: 0, content: `${HUD({ time: '21:40' })}\n\nYou sleep.`, extra: { spindle_metadata: { rpg_companion: { swipes: { 0: {} } } } } }]);
        const offer = await api.push('C');
        if (process.env.DBG) console.log(JSON.stringify(offer.carry));
        assert.equal(offer.carry.choices[0].chatId, 'B'); assert.equal(offer.carry.choices[0].match, true);
        assert.ok(!offer.carry.choices.some(c => c.chatId === 'A' && c.match));
        assert.equal(await api.link('C', 'B'), true);
        const st = await api.push('C'); assert.ok(facts(st).people.includes('Halvin')); assert.equal(st.carry.linked.count, 9);
        assert.equal(await api.link('A', 'C') && await api.link('B', 'C'), false);
    });
    await check('undo returns the chat to its own history and removes what was copied', async () => {
        assert.equal(await api.unlink('B'), true);
        const st = await api.push('B'), s = await api.state('B');
        assert.deepEqual(facts(st).spells, []); assert.equal(st.carry.linked, null); assert.equal(st.carry.dismissed, true);
        assert.ok(!s.peopleBorn || !s.peopleBorn.halvin); assert.equal(s.pins.mine, true);
    });
    await check('a restart from an older save matches the chat that ended at that hour, not a later one; opening pages are not offered', async () => {
        chats.set('D', [{ id: 'd1', role: 'user', is_user: true, swipe_id: 0, content: 'Mushoku_Continue_Handler\n\n' + HUD().replace('\n***', '') },
            { id: 'd2', role: 'assistant', swipe_id: 0, content: `${HUD()}\n\nAurelia waits.` }]);
        chats.set('E', [{ id: 'e0', role: 'assistant', swipe_id: 0, content: HUD() + '\n\nPAGE 1' }]);
        await api.push('E');
        const st = await api.push('D'), ch = st.carry.choices;
        assert.deepEqual(JSON.parse(JSON.stringify(ch.filter(c => c.match).map(c => c.chatId))), ['A']);
        assert.ok(!ch.some(c => c.chatId === 'E'));
    });
    await check('a deleted chat is no longer offered; old rows without the hour give one match, not several', async () => {
        chats.set('F', [{ id: 'f1', role: 'user', is_user: true, swipe_id: 0, content: 'Mushoku_Continue_Handler\n\n' + HUD().replace('\n***', '') },
            { id: 'f2', role: 'assistant', swipe_id: 0, content: `${HUD()}\n\nAurelia waits.` }]);
        const saveD = chats.get('D'); chats.delete('D');
        vm.runInContext('carryAliveSeen.clear(); for (const r of carryIndex) delete r.time;', ctx);
        const ch = (await api.push('F')).carry.choices;
        assert.ok(!ch.some(c => c.chatId === 'D'), 'deleted chat listed');
        assert.equal(ch.filter(c => c.match).length, 1);
        chats.set('D', saveD);
    });
    await check('an ordinary chat is unchanged and offered nothing at the top', async () => {
        const st = await api.push('A'); assert.equal(st.carry.continued, false); assert.equal(st.carry.linked, null);
    });

    await check('a burst of pushes builds the panel at most twice (1.4.0)', async () => {
        const n = await api.burst('A');
        assert.ok(n >= 1 && n <= 2, `built ${n} times`);
    });

    for (const f of failed) console.log('  FAIL ' + f);
    console.log(`carry-over: ${results.length} passed, ${failed.length} failed`);
    process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
