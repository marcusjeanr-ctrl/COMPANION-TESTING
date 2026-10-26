const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runtime, seed } = require('./test_panel_tracking.cjs');
const { frontend } = require('./test_startup_and_render.cjs');
const rt = runtime(); seed(rt);
rt.run("userNameCache.set('test', 'Rin Vale');");
const entries = JSON.parse(fs.readFileSync(path.join(__dirname, 'six_sided_spell_fixture.json'), 'utf8')).spells.map(row => row.entry);
rt.ctx.setLorePool('test', entries);
const listText = `**Rin Vale — Known Spells** *(OOC reference; no time advanced)*
All spells below can be cast voiceless or with the standard chant.
**WATER — Intermediate rank**
*Beginner tier:* Water Ball · Water Shield · Water Arrow · Ice Smash · Ice Blade
*Intermediate tier:* Water Cannon · Ice Pillar · Ice Lance · Icicle Field · Waterfall (small-scale pressurized column) · Water Splash · Flood Flush (localized)
**EARTH — Intermediate rank**
*Beginner tier:* Rock Bullet
*Intermediate tier:* Stone Cannon · Earth Pillar · Earth Lance · Earth Wall (basic section) · Sand Cloud
**FIRE — Beginner rank**
*Beginner tier:* Fireball · Heat Hand (warming grip/objects)
**Not trained:** Healing, Detoxification, Barrier, Summoning, Melded magic, Wind.
**Notes**
- Quagmire might be learned later.`;
const names = Array.from(rt.ctx.spellEstablishedList(listText, 'Rin Vale'));
assert.equal(names.length, 20);
assert(names.includes('Waterfall')); assert(names.includes('Heat Hand'));
assert(!names.includes('Quagmire'));
for (const heading of ["Rin Vale's Known Spells", 'Known Spells — Rin Vale', 'Your Known Spells', 'Spells you already know']) {
    assert.deepEqual(Array.from(rt.ctx.spellEstablishedList(`## ${heading}\n- Waterball\n- Ice Blade`, 'Rin Vale')), ['Waterball', 'Ice Blade']);
}
for (const text of [
    '**Bram — Known Spells**\n- Water Ball',
    '**Available Spells**\n- Water Ball',
    '**Your school rank: Intermediate**\n- Water Ball',
    '**Known Spells**\n- Water Ball',
    '```\n**Your Known Spells**\n- Water Ball\n```',
    '> **Your Known Spells**\n> - Water Ball',
    '**Your Known Spells**\n- Water Ball (not learned)',
    '**Your Known Spells**\n**Equipment**\n- Water Ball'
]) assert.equal(rt.ctx.spellEstablishedList(text, 'Rin Vale').length, 0, text);
assert.deepEqual(Array.from(rt.ctx.spellEstablishedList('Your Known Spells\n- Water Ball Storm', 'Rin Vale')), ['Water Ball Storm']);
const state = rt.run('emptyChatState()');
rt.messages[1].content += '\n' + listText;
const known = () => rt.ctx.spellKnown(rt.messages, state, null, 'test');
assert.equal(known().size, 20);
assert(!known().has('quagmire'));
state.spellForget = { waterball: 'a1' };
assert(!known().has('water ball'), 'Forgotten alias was restored by the saved list');
rt.messages.push({ ...rt.messages[1], id: 'a2' });
assert(!known().has('water ball'), 'A repeated list undid manual Forget');
rt.messages[2].metadata = { rpg_companion: { swipes: { 0: { survival: { learned: ['Waterball'] } } } } };
assert(known().has('water ball'), 'Actual later learning did not restore the spell');
rt.messages.pop(); delete state.spellForget;
rt.messages[1].content = rt.messages[1].content.replace(listText, '**Rin Vale — Known Spells**\n- Waterball');
assert.equal(known().size, 1, 'Edited list reused stale cached names');
rt.messages[1].swipe_id = 1; rt.messages[1].content = rt.messages[1].content.replace(/\*\*Rin Vale — Known Spells\*\*[\s\S]*$/, 'No spell learning occurs.');
assert.equal(known().size, 0, 'Discarded list survived its swipe');
rt.messages[1].swipe_id = 0;
rt.messages[1].content += '\n' + listText;
assert.equal(rt.ctx.agendaActivityState({ what: 'Meet Bram at school', with: 'Bram', where: 'school' }, { plot: { now: 'Bram begins fighting at school.' } }), null, 'Shared participants and location started an unrelated appointment');
const agenda = rt.ctx.agendaNormalize([{ what: 'Field footwork drill against Bram, blunts allowed', with: 'Bram', when: 'now', kind: 'event', state: 'open' }]);
rt.messages[1].metadata = { rpg_companion: { swipes: { 0: { agenda } } } };
const current = { ...rt.messages[1], id: 'a2', content: rt.messages[1].content.replace('07:15', '07:17'), metadata: { rpg_companion: { swipes: { 0: { plot: { threads: [], canonEvents: [], now: 'The footwork drill begins as Bram attacks Rin.' } } } } } };
rt.messages.push(current);
let panel = rt.ctx.hmsAgendaPanel(rt.messages, state);
assert.equal(panel.items[0].state, 'in_progress'); assert.equal(panel.items[0].status, 'in_progress');
assert(rt.ctx.agendaRequest(rt.messages, state, 'Rin Vale').rules.includes('in progress'));
current.metadata.rpg_companion.swipes[0].plot.now = 'Rin is about to begin the footwork drill against Bram.';
assert.equal(rt.ctx.hmsAgendaPanel(rt.messages, state).items[0].state, 'open', 'Planned activity was marked started');
current.metadata.rpg_companion.swipes[0] = { agenda: rt.ctx.agendaNormalize([{ what: agenda[0].what, kind: 'event', state: 'kept' }]) };
assert.equal(rt.ctx.hmsAgendaPanel(rt.messages, state).items[0].state, 'kept');
current.swipe_id = 1;
assert.equal(rt.ctx.hmsAgendaPanel(rt.messages, state).items[0].state, 'open', 'Discarded completion survived');
current.swipe_id = 0;
current.metadata.rpg_companion.swipes[0] = { agenda: rt.ctx.agendaNormalize([{ what: agenda[0].what, state: 'started', kind: 'event' }]) };
assert.equal(rt.ctx.hmsAgendaPanel(rt.messages, state).items[0].state, 'in_progress');
state.agenda = { edits: { [agenda[0].key]: { state: 'cancelled', after: current.id } } };
assert.equal(rt.ctx.hmsAgendaPanel(rt.messages, state).items[0].state, 'cancelled');
delete state.agenda;
current.metadata.rpg_companion.swipes[0] = {};
current.content = current.content.replace('07:17', '10:17');
assert.equal(rt.ctx.hmsAgendaPanel(rt.messages, state).items[0].status, 'overdue', 'A passed deadline alone started the activity');
current.content = current.content.replace('10:17', '07:17');
current.metadata.rpg_companion.swipes[0] = { plot: { threads: [], canonEvents: [], now: 'The footwork drill begins as Bram attacks Rin.' } };
(async () => {
    rt.run("chatStateCache.set('test', emptyChatState());");
    await rt.ctx.pushState('test', rt.messages);
    const payload = rt.events.filter(event => event.type === 'state').at(-1);
    const ui = frontend(); ui.receive(payload);
    assert.match(ui.text(), /In progress/);
    assert(!ui.text().includes('Soon (next 3 hours)'));
    assert(!ui.text().includes('Done (1)'));
    assert.equal(payload.hms.magic.spellbook.length, 20);
    const waterfall = payload.hms.magic.list.schools.flatMap(group => group.spells).find(row => row.name === 'Waterfall');
    assert.equal(waterfall.rank, null, 'Known-list tier labels overrode an unstated lorebook rank');
    assert.equal(waterfall.status, 'known');
    ui.dispose();
    console.log('General tracking passed: 20 established spells, player ownership, catalog/quote/negation exclusions, aliases, Forget/relearn, edits/swipes, explicit activity lifecycle, no clock-only start and active Agenda rendering.');
})().catch(error => { console.error(error); process.exitCode = 1; });

