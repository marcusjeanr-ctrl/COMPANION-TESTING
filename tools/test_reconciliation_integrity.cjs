const assert = require('node:assert/strict');
const path = require('node:path');
const { runtime, hud } = require('./test_panel_tracking.cjs');
const rt = runtime(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
const c = rt.ctx;
const cfg = { relations: { enabled: true, ladder: ['Stranger', 'Friendly', 'Trusted'], neutral: 'Stranger', bars: ['trust', 'respect ±'] } };
const st = c.emptyChatState();
const msg = (id, data) => ({ id, role: 'assistant', swipe_id: 0, content: hud(), metadata: { rpg_companion: { swipes: { 0: data } } } });
const cases = [];
const test = (name, run) => cases.push({ name, run });
const relation = row => c.relNormalize([row], cfg, st, true);
const agenda = rows => c.agendaNormalize(rows);
const people = chat => c.hmsRelationsPanel(chat, st, cfg, true).people;

test('appointments: same report retains different participants, places and schedules', async () => {
    const rows = [
        { what: 'Meet at the gate', with: 'Bram', where: 'North Gate', when: 'tomorrow morning' },
        { what: 'Meet at the gate', with: 'Tess', where: 'North Gate', when: 'tomorrow morning' },
        { what: 'Meet at the gate', with: 'Bram', where: 'South Gate', when: 'tomorrow morning' },
        { what: 'Meet at the gate', with: 'Bram', where: 'North Gate', when: 'tomorrow evening' }
    ];
    const normalized = agenda([...rows, { ...rows[0] }]);
    assert.equal(normalized.length, 4, 'Normalization lost distinct appointments');
    const chat = [msg('a', { agenda: normalized })];
    let items = c.agendaRead(chat, st).items;
    assert.equal(items.length, 4);
    assert.equal(new Set(items.map(x => x.key)).size, 4);
    chat.push(msg('b', { agenda: agenda([{ ...rows[1], state: 'kept' }]) }));
    items = c.agendaRead(chat, st).items;
    assert.equal(items.length, 4);
    assert.equal(items.find(x => x.with === 'Tess').state, 'kept');
    assert(items.filter(x => x.with === 'Bram').every(x => x.state === 'open'));
    chat.push(msg('ambiguous', { agenda: agenda([{ what: rows[0].what, state: 'cancelled' }]) }));
    assert.equal(c.agendaRead(chat, st).items.filter(x => x.state === 'cancelled').length, 0);
    chat.pop();
    chat[1].swipe_id = 1;
    assert(c.agendaRead(chat, st).items.every(x => x.state === 'open'));
    const single = [msg('start', { agenda: agenda([rows[0]]) }), msg('move', { agenda: agenda([{ ...rows[0], where: 'West Gate', when: 'tomorrow evening', state: 'moved' }]) })];
    assert.equal(c.agendaRead(single, st).items.length, 1);
    assert.equal(c.agendaRead(single, st).items[0].where, 'West Gate');
    rt.run("chatStateCache.set('agenda-manual', emptyChatState());");
    for (const row of [...rows, rows[0]]) await c.hmsAgendaEdit('agenda-manual', { op: 'add', ...row });
    const saved = await c.getChatState('agenda-manual');
    const manual = c.agendaRead([], saved).items;
    assert.equal(manual.length, 4);
    const tess = manual.find(x => x.with === 'Tess');
    await c.hmsAgendaEdit('agenda-manual', { op: 'set', key: tess.key, state: 'removed' });
    assert.equal(c.agendaRead([], saved).items.length, 3);
});

test('relationships: mood-only reports preserve standing, bond, minor and numerical readings', () => {
    const first = relation({ name: 'Bram', standing: 'Trusted', bond: 'mentor', minor: true, trust: 70, respect: 30 });
    const chat = [msg('a', { relations: first }), msg('b', { relations: relation({ name: 'Bram', mood: 'tired' }) })];
    const current = people(chat)[0];
    assert.equal(current.bond, 'mentor');
    assert.equal(current.standing, 'Trusted');
    assert.equal(current.minor, true);
    assert.equal(current.mood, 'tired');
    assert.equal(current.bars.find(x => x.id === 'trust').value, 70);
    assert.equal(current.bars.find(x => x.id === 'trust').delta, 0);
    const previous = c.relPrevious(chat, st, c.relCfg(cfg, true))[0];
    assert.equal(previous.bond, 'mentor');
    assert.equal(previous.trust, 70);
    const changed = relation({ name: 'Bram', standing: 'Friendly', bond: 'former mentor', minor: false, trust: 0, respect: -25 });
    chat.push(msg('c', { relations: changed }));
    assert.equal(people(chat)[0].bond, 'former mentor');
    assert.equal(people(chat)[0].standing, 'Friendly');
    assert.equal(people(chat)[0].minor, false);
    assert.equal(people(chat)[0].bars.find(x => x.id === 'trust').value, 0);
    chat[2].swipe_id = 1;
    assert.equal(people(chat)[0].bond, 'mentor');
    st.relPins = { bram: { bond: 'father', minor: true } };
    assert.equal(people(chat)[0].bond, 'father');
    delete st.relPins;
});

test('numbers: unknown stays null, real zero and finite numeric strings survive', () => {
    for (const value of [undefined, null, '', '  ', false, true, [], [12], {}, NaN, Infinity, 'unknown']) {
        const reading = relation({ name: 'Bram', trust: value })[0];
        assert.equal(reading.trust, null, `Unknown value became a number: ${String(value)}`);
        assert.equal(people([msg('a', { relations: [reading] })])[0].bars.length, 0);
    }
    for (const [value, expected] of [[0, 0], ['0', 0], ['42.6', 43], [120, 100], [-3, 0]]) {
        assert.equal(relation({ name: 'Bram', trust: value })[0].trust, expected);
    }
    const chat = [msg('a', { relations: relation({ name: 'Bram', trust: 70 }) }), msg('b', { relations: relation({ name: 'Bram', trust: null }) })];
    assert.equal(people(chat)[0].bars.find(x => x.id === 'trust').value, 70);
    assert.equal(people(chat)[0].alerts.length, 0);
});

test('secrets: owners isolate fuzzy descriptions, identical descriptions and manual edits', async () => {
    const rows = [
        { secret: 'Bram keeps the royal seal in his cellar', whose: 'Bram', known_by: ['Rin'], how: 'Rin saw it' },
        { secret: 'Tess keeps the royal seal in her cellar', whose: 'Tess', known_by: ['Rin', 'Alex'], how: 'Tess told Alex and Rin' }
    ];
    const chat = [msg('a', { secrets: c.secretNormalize(rows, 'Rin') })];
    let items = c.secretRead(chat, st, 'Rin').items;
    assert.equal(items.length, 2, 'Fuzzy description matching merged different owners');
    assert(!items.find(x => x.whose === 'Bram').knownBy.has('alex'));
    assert(items.find(x => x.whose === 'Tess').knownBy.has('alex'));
    const identical = rows.map(row => ({ ...row, secret: 'The royal seal is in the cellar' }));
    chat[0] = msg('b', { secrets: c.secretNormalize(identical, 'Rin') });
    items = c.secretRead(chat, st, 'Rin').items;
    assert.equal(items.length, 2, 'Normalization merged identical descriptions across owners');
    assert.equal(new Set(items.map(x => x.key)).size, 2);
    const tess = items.find(x => x.whose === 'Tess');
    const manual = { secrets: { edits: { [tess.key]: { forget: ['Alex'], addKnows: ['Nora'] } } } };
    items = c.secretRead(chat, manual, 'Rin').items;
    assert(items.find(x => x.whose === 'Tess').knownBy.has('nora'));
    assert(!items.find(x => x.whose === 'Bram').knownBy.has('nora'));
    chat.push(msg('c', { secrets: c.secretNormalize([{ ...identical[1], whose: 'TESS', known_by: ['Nora'] }], 'Rin') }));
    assert.equal(c.secretRead(chat, st, 'Rin').items.length, 2);
    const mine = [msg('mine', { secrets: c.secretNormalize([
        { secret: 'The key is under the ancient stone', whose: 'you', known_by: ['Bram'], how: 'You told Bram' },
        { secret: 'The key is under the ancient stone', whose: 'Rin', known_by: ['Tess'], how: 'You told Tess' }
    ], 'Rin') })];
    assert.equal(c.secretRead(mine, st, 'Rin').items.length, 1);
    const old = { secrets: { edits: { 'a private password': { addKnows: ['Bram'] } } } };
    assert(c.secretRead([msg('old', { secrets: [{ text: 'A private password', whose: 'Rin', mine: true }] })], old, 'Rin').items[0].knownBy.has('bram'));
    rt.run("chatStateCache.set('secret-manual', emptyChatState());");
    await c.hmsSecretsEdit('secret-manual', { op: 'add', text: identical[0].secret, whose: 'Bram' });
    await c.hmsSecretsEdit('secret-manual', { op: 'add', text: identical[0].secret, whose: 'Tess' });
    const saved = await c.getChatState('secret-manual');
    assert.equal(c.secretRead([], saved, 'Rin').items.length, 2);
    const manualTess = c.secretRead([], saved, 'Rin').items.find(x => x.whose === 'Tess');
    await c.hmsSecretsEdit('secret-manual', { op: 'remove', key: manualTess.key });
    assert.equal(c.secretRead([], saved, 'Rin').items.length, 1);
    assert.equal(c.secretRead([], saved, 'Rin').items[0].whose, 'Bram');
});

(async () => {
    let failed = 0;
    for (const { name, run } of cases) {
        try { await run(); console.log(`PASS ${name}`); }
        catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); }
    }
    console.log(`Reconciliation integrity: ${cases.length - failed}/${cases.length} groups passed.`);
    if (failed) process.exitCode = 1;
})();
