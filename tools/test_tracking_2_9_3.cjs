const assert = require('node:assert/strict');
const path = require('node:path');
const { runtime, hud } = require('./test_panel_tracking.cjs');
const r = runtime(process.argv[2] && path.resolve(process.argv[2])), c = r.ctx;
const cases = [], test = (name, fn) => cases.push([name, fn]);
const msg = (id, data, minute = '07:57') => ({ id, role: 'assistant', swipe_id: 0, content: hud('Study', minute), metadata: { rpg_companion: { swipes: { 0: data } } } });
const report = data => c.parseCompanion(`<rpg_companion>${JSON.stringify(data)}</rpg_companion>`);
test('stored study notes, item labels and agenda titles retain confirmed-length text', () => {
    const note = 'Held a steady sphere above the palm without incantation; the instructor praised its stability and explained the next exercise.';
    const item = "The scorched Fire primer (corner repaired and re-copied in the elder sibling's handwriting)";
    const what = 'Mana measurement in the testing hall, with sustained casting under calibrated draw and a witness observing the full sequence';
    assert.equal(report({ you: { study: [{ spell: 'Water Ball', note }] } }).you.study[0].note, note);
    assert.equal(report({ you: { got: [item] } }).you.got[0], item);
    assert.equal(c.gearNormalize([{ item, state: 'in hand' }])[0].name, c.gearBare(item));
    assert.equal(c.agendaNormalize([{ what }])[0].what, what);
});
test('bounded over-limit text ends visibly, not as a silently chopped word', () => {
    const note = report({ you: { study: [{ spell: 'Water Ball', note: 'Detailed observation '.repeat(100) }] } }).you.study[0].note;
    assert(note.length <= 500); assert(note.endsWith('…'));
});
test('permission is not a carried object; physical permits and actual borrowed books survive', () => {
    const got = report({ you: { got: ['Permission to borrow books from the collection', 'Approval to enter the archive', 'Permission slip', 'Written travel permit', 'Borrowed Fire primer'] } }).you.got;
    assert.deepEqual(Array.from(got), ['Permission slip', 'Written travel permit', 'Borrowed Fire primer']);
    const legacy = [msg('a', { survival: { got: ['Permission to borrow books from the collection', 'Borrowed Fire primer'] } })];
    assert(!c.pocketsNow([{ msgId: 'a', got: ['Permission to borrow books from the collection'] }], {}).length);
    assert(!c.gearRead(legacy, {}).items.some(x => /^Permission to/.test(x.name)));
    assert(c.gearRead(legacy, {}).items.some(x => x.name === 'Borrowed Fire primer'));
    assert.equal(c.gearNormalize([{ item: 'Paper message from school', state: 'in hand' }])[0].name, 'Paper message from school');
    const oldGear = [msg('b', { gear: [{ name: 'Permission to enter the archive', state: 'on body' }, { name: 'Physical permission slip', state: 'in hand' }] })];
    assert(!c.gearRead(oldGear, {}).items.some(x => x.name === 'Permission to enter the archive'));
    assert(c.gearRead(oldGear, {}).items.some(x => x.name === 'Physical permission slip'));
});
test('a future scheduled event stays open while the current scene is only preparing for it', () => {
    const row = { what: 'Mana measurement in the testing hall', with: 'Rin', where: 'Testing Hall', when: '08:30', kind: 'event', state: 'in_progress' };
    const data = { agenda: c.agendaNormalize([row]), plot: { now: 'Rin is readying to walk to the measurement at half past eight.' }, agendas: [{ name: 'Rin', doing: 'Taking a cloak and preparing to leave', next: 'Conduct the mana measurement' }] };
    assert.equal(c.agendaRead([msg('a', data)], {}).items[0].state, 'open');
    assert.equal(c.agendaRead([msg('b', data, '08:30')], {}).items[0].state, 'in_progress');
    const early = { ...data, plot: { now: 'The mana measurement begins early as the calibrated draw starts.' } };
    assert.equal(c.agendaRead([msg('c', early)], {}).items[0].state, 'in_progress');
    assert.equal(c.agendaRead([msg('c', early), msg('c2', data, '08:00')], {}).items[0].state, 'in_progress');
    const deadline = { ...data, agenda: c.agendaNormalize([{ ...row, kind: 'deadline' }]) };
    assert.equal(c.agendaRead([msg('d', deadline)], {}).items[0].state, 'in_progress');
});
test('casting-method annotations share one known identity, including legacy readings', () => {
    c.setLorePool('spells', [{ id: 'orb', key: ['Water Ball', 'Waterball'], content: '[SPELL — Water Ball]\nSchool: Water · Rank: Beginner\nEffect: A sphere of water.' }]);
    const chat = [msg('a', { survival: { spells: ['Waterball (voiceless casting)'], study: [{ spell: 'Waterball (voiceless)', progress: null, note: 'Held a steady sphere' }] } })];
    const st = c.emptyChatState();
    assert.equal(c.spellKnown(chat, st, null, 'spells').size, 1);
    assert(c.spellKnown(chat, st, null, 'spells').has('water ball'));
    assert.equal(c.spellStudyActive(chat, st, null, 'spells').length, 0);
    assert.equal(c.spellStudyReminder('spells', chat, st, 'Player'), null);
    const list = c.spellListPanel('spells', chat, st, c.hmsReadSystems(c.parseHud(hud())));
    assert.equal(list.studying.length, 0);
    assert.equal(list.schools.flatMap(x => x.spells).find(x => x.name === 'Water Ball').status, 'known');
});
test('real variants remain separate; exact catalog names beat annotation stripping', () => {
    assert.equal(c.spellResolver('spells')('Water Ball (Storm)').key, 'water ball storm');
    assert.equal(c.spellResolver('spells')('Water Ball Storm').key, 'water ball storm');
    c.setLorePool('variants', [
        { id: 'base', key: ['Signal'], content: '[SPELL — Signal]\nSchool: Fire · Rank: Beginner\nEffect: A light.' },
        { id: 'variant', key: ['Signal (Silent)'], content: '[SPELL — Signal (Silent)]\nSchool: Fire · Rank: Advanced\nEffect: A distinct catalog spell.' }
    ]);
    assert.equal(c.spellResolver('variants')('Signal (Silent)').key, 'signal silent');
    assert.notEqual(c.spellResolver('spells')('Water Ball Storm').key, c.spellResolver('spells')('Water Ball').key);
});
test('new spell study and manual completed-study history retain their existing behavior', () => {
    const chat = [msg('new', { survival: { study: [{ spell: 'Ember Needle', progress: 25, note: 'First intentional practice' }] } })];
    assert.equal(c.spellStudyActive(chat, c.emptyChatState(), null, 'spells')[0].name, 'Ember Needle');
    const st = c.emptyChatState(); st.spellbook = [{ name: 'Water Ball', from: 'you' }]; st.spellStudy = [{ name: 'Water Ball', from: 'you' }];
    assert.equal(c.spellStudyActive([], st, null, 'spells').length, 1, 'Manual completed entries must remain clearable');
    assert.equal(c.spellStudyReminder('spells', [], st, 'Player'), null);
});
let failed = 0;
for (const [name, fn] of cases) { try { fn(); console.log('PASS ' + name); } catch (e) { failed++; console.error('FAIL ' + name + ': ' + e.message); } }
console.log(`2.9.3 tracking: ${cases.length - failed}/${cases.length} groups passed.`);
if (failed) process.exitCode = 1;
