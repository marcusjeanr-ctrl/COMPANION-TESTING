const assert = require('node:assert/strict');
const path = require('node:path');
const { runtime, hud } = require('./test_panel_tracking.cjs');
const rt = runtime(process.argv[2] && path.resolve(process.argv[2])), c = rt.ctx;
const msg = (id, data, story = '') => ({ id, role: 'assistant', swipe_id: 0,
    content: hud().replace(/\*\*\*[\s\S]*$/, '***\n' + story), metadata: { rpg_companion: { swipes: { 0: data } } } });
const cases = [], test = (name, fn) => cases.push([name, fn]);
const quests = rows => c.questNormalize(rows);
const agenda = rows => c.agendaNormalize(rows);
test('quest partial updates retain other quests and established fields', () => {
    const chat = [msg('a', { quests: quests([{ name: 'Repair the north bridge', objective: 'Replace broken beams', giver: 'Rin', progress: 25 }, { name: 'Find the missing courier', objective: 'Search the old road' }]) }),
        msg('b', { quests: quests([{ name: 'Repair the north bridge', objective: 'Fit the final beam' }]) })];
    const rows = c.questDetailsLatest(chat);
    assert.equal(rows.length, 2);
    const bridge = rows.find(q => q.name === 'Repair the north bridge');
    assert.equal(bridge.giver, 'Rin'); assert.equal(bridge.progress, 25);
    assert.equal(bridge.objective, 'Fit the final beam');
    chat[1].swipe_id = 1;
    assert.equal(c.questDetailsLatest(chat).find(q => q.name === bridge.name).objective, 'Replace broken beams');
});
test('quest renamed storyline uses objective/context, never a bare title prefix', () => {
    const first = { name: 'Earn a road permit', objective: 'Pass the northern gate inspection', giver: 'Rin', where: 'North Gate', progress: 0 };
    const renamed = { ...first, name: 'Permission to travel', progress: 50 };
    const rows = c.questDetailsLatest([msg('a', { quests: quests([first]) }), msg('b', { quests: quests([renamed]) })]);
    assert.equal(rows.length, 1); assert.equal(rows[0].progress, 50);
    assert.equal(c.questMatch({ name: 'Repair bridge', objective: 'Fix the west span' }, { name: 'Repair bridge supports', objective: 'Rebuild the eastern pillars' }), false);
    assert.equal(c.questMatch({ ...first, giver: 'Tess' }, first), false);
    assert.equal(c.questMatch({ ...renamed, objective: 'Pay the gate toll' }, first), false);
});
test('unknown quest progress stays unknown; explicit zero and measured progress survive', () => {
    for (const progress of [null, '', false, [], {}, 'unknown']) assert.equal(quests([{ name: 'Repair bridge', progress }])[0].progress, null);
    for (const progress of [0, 25, 100]) assert.equal(quests([{ name: 'Repair bridge', progress }])[0].progress, progress);
    assert.equal(quests([{ name: 'Suggested fishing trip', state: 'proposed' }]), null);
});
test('rephrased agenda titles deduplicate without collapsing distinct activities', () => {
    const a = { what: 'Mana measurement', with: 'Rin', where: 'Workshop', when: 'this afternoon' };
    const b = { ...a, what: 'Measure mana capacity', when: 'afternoon' };
    const chat = [msg('a', { agenda: agenda([a, b]) })];
    assert.equal(c.agendaRead(chat, {}).items.length, 1);
    chat.push(msg('b', { agenda: agenda([{ ...b, state: 'kept' }]) }));
    assert.equal(c.agendaRead(chat, {}).items[0].state, 'kept');
    const distinct = [a, { ...a, with: 'Tess' }, { ...a, where: 'Tower' }, { ...a, when: 'tomorrow afternoon' }, { ...a, what: 'Sword measurement' }];
    assert.equal(c.agendaRead([msg('c', { agenda: agenda(distinct) })], {}).items.length, 5);
    assert.equal(c.agendaRead([msg('d', { agenda: agenda([{ ...a, what: 'Practice sword casting' }, { ...a, what: 'Practice water casting' }]) })], {}).items.length, 2);
});
test('vague deadlines stay textual and never inherit fabricated clock minutes', () => {
    const at = 7 * 60;
    for (const when of ['this afternoon', 'sundown', 'before dark', 'after breakfast', 'tomorrow', 'in a few hours', 'around 16:00']) {
        assert.equal(c.agendaWhen(null, when, at), null, when);
    }
    assert.equal(c.agendaWhen('Day 1, 17:35', 'sundown', at, null, 'Return at sundown.'), null);
    assert.equal(c.agendaWhen('Day 1, 17:35', 'sundown', at, null, 'Return around 17:35.'), null);
    assert.equal(c.agendaWhen('Day 1, 08:30', 'after breakfast', at, null, 'The appointment is half past eight.'), 510);
    assert.equal(c.agendaWhen(null, 'tomorrow at 4:00 PM', at), 1440 + 960);
    assert.equal(c.agendaWhen(null, 'in two hours', at), at + 120);
    assert.equal(c.agendaWhen(null, 'Day 1, 16:00', at), 960);
    const chat = [msg('a', { agenda: agenda([{ what: 'Return for training', when: 'afternoon bell', due: 'Day 1, 16:00' }]) }, 'Return by afternoon bell.')];
    const item = c.agendaRead(chat, {}).items[0]; assert.equal(item.dueAt, null); assert.equal(item.when, 'afternoon bell');
});
test('partial agenda update refines confirmed time, reschedules and clears obsolete precision', () => {
    const a = { what: 'Inspect the array', with: 'Rin', where: 'Hall', when: 'after breakfast' };
    const chat = [msg('a', { agenda: agenda([a]) }), msg('b', { agenda: agenda([{ ...a, due: 'K417, Month 2, Day 8, 08:30' }]) }, 'Rin says: half past eight.')];
    assert.equal(c.agendaRead(chat, {}).items.length, 1); assert.notEqual(c.agendaRead(chat, {}).items[0].dueAt, null);
    chat.push(msg('c', { agenda: agenda([{ ...a, when: 'tomorrow afternoon', state: 'moved' }]) }));
    const rows = c.agendaRead(chat, {}).items; assert.equal(rows.length, 1); assert.equal(rows[0].dueAt, null);
});
test('meal and bell wording variants preserve one event; dates still separate appointments', () => {
    const a = { what: 'Inspect the array', with: 'Rin', where: 'Hall', when: 'after breakfast' };
    const chat = [msg('a', { agenda: agenda([a]) }), msg('b', { agenda: agenda([{ ...a, when: 'after the morning meal' }]) }),
        msg('c', { agenda: agenda([{ ...a, when: 'after breakfast, half past eight', due: 'K417, Month 2, Day 8, 08:30' }]) }, 'Half past eight, after breakfast.')];
    assert.equal(c.agendaRead(chat, {}).items.length, 1);
    chat.push(msg('d', { agenda: agenda([a]) }));
    assert.notEqual(c.agendaRead(chat, {}).items[0].dueAt, null, 'A later omitted clock erased a confirmed time');
    const bell = { what: 'Return for training', with: 'Rin', when: 'this afternoon, by afternoon bell' };
    assert.equal(c.agendaRead([msg('a', { agenda: agenda([bell]) }), msg('b', { agenda: agenda([{ ...bell, when: 'afternoon bell' }]) })], {}).items.length, 1);
    assert.equal(c.agendaRead([msg('a', { agenda: agenda([{ ...a, due: 'K417, Month 2, Day 8' }, { ...a, due: 'K417, Month 2, Day 9' }]) })], {}).items.length, 2);
});
test('omitted family, equipment, spells and new sword techniques retain established records', () => {
    c.setLorePool('continuity', [
        { id: 'spell', key: ['Ember Needle'], content: '[SPELL — Ember Needle]\nSchool: Fire · Rank: Beginner\nEffect: A thin flame.' },
        { id: 'tech', key: ['Severing Step'], content: '[TECHNIQUE — Severing Step]\nStyle: Sword God · Rank: Beginner\nEffect: A quick step and cut.' }
    ]);
    const data = { family: c.famNormalize([{ name: 'Rin', relation: 'mother', status: 'alive', known: 'seen' }]),
        survival: { learned: ['Ember Needle', 'Severing Step'] }, gear: c.gearNormalize([{ item: 'Borrowed lantern', state: 'stowed', where: 'locker' }]) };
    const chat = [msg('first', data), msg('omitted', {})], st = c.emptyChatState();
    assert.equal(c.hmsFamilyPanel(chat, st).members[0].relation, 'mother');
    assert.equal(c.hmsFamilyPanel(chat, st).members[0].present, false);
    assert.equal(c.hmsGearPanel(chat, st).items.find(x => x.name === 'Borrowed lantern').state, 'stowed');
    assert(c.spellKnown(chat, st, null, 'continuity').has('ember needle'));
    const techniques = () => c.techListPanel('continuity', chat, st, c.hmsReadSystems(c.parseHud(hud()))).schools[0].spells;
    assert.equal(techniques()[0].status, 'known');
    chat.push(msg('changed', { gear: c.gearNormalize([{ item: 'Borrowed lantern', state: 'gone' }]), family: c.famNormalize([{ name: 'Rin', relation: 'mother', status: 'missing' }]) }));
    assert(c.hmsGearPanel(chat, st).gone.some(x => x.name === 'Borrowed lantern'));
    assert.equal(c.hmsFamilyPanel(chat, st).members[0].status, 'missing');
    assert.equal(techniques()[0].status, 'known');
});
test('explicit uncertainty never becomes an established relationship or secret', () => {
    const cfg = { relations: { enabled: true, ladder: ['Stranger', 'Friendly'], bars: ['trust'] } };
    assert.equal(c.relNormalize([{ name: 'Rin', mood: 'jealous', certainty: 'speculative' }], cfg, {}, true), null);
    assert.equal(c.secretNormalize([{ secret: 'Hidden royal ancestry', whose: 'Rin', known_by: ['Tess'], how: 'guessed', confirmed: false }]), null);
    assert.equal(c.secretNormalize([{ secret: 'Hidden royal ancestry', whose: 'Rin', known_by: ['Tess'], how: 'confessed' }]).length, 1);
});
test('reused read-pass caches preserve edited text and configuration boundaries', () => {
    const first = msg('cache-a', {}), second = msg('cache-b', {});
    c.withReadPass([first, second], () => {
        const a = c.messageHud(first), b = c.messageHud(second);
        assert.equal(a, b, 'Identical source text should share the existing pass parse');
        const clock = c.hmsClock(a); assert.equal(c.hmsClock(a), clock);
        const cfg = { quests: { labels: 'Quest', states: '' } };
        assert.equal(c.hmsReadQuests(a, cfg), c.hmsReadQuests(a, cfg));
        assert.notEqual(c.hmsReadQuests(a, { quests: { labels: 'Task', states: '' } }), c.hmsReadQuests(a, cfg));
        for (let i = 0; i < 700; i++) c.hmsNorm('Label ' + i);
        assert(c.memoRead([first, second], 'unused', () => true));
    });
    const before = c.messageHud(first);
    first.content = first.content.replace('Training Yard', 'Training Hall');
    assert.notEqual(c.messageHud(first), before, 'Equal-length source edit reused an old HUD');
    second.swipe_id = 1; second.content = second.content.replace('07:15', '08:15');
    assert.equal(c.hmsClock(c.messageHud(second)).minutes - c.hmsClock(before).minutes, 60);
});
let failed = 0;
for (const [name, fn] of cases) { try { fn(); console.log('PASS ' + name); } catch (e) { failed++; console.error('FAIL ' + name + ': ' + e.message); } }
console.log(`2.9.0 targeted tracking: ${cases.length - failed}/${cases.length} groups passed.`);
if (failed) process.exitCode = 1;
