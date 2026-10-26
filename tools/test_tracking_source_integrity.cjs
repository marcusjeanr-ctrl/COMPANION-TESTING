const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runtime, hud, seed } = require('./test_panel_tracking.cjs');
const filename = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
const r = runtime(filename), c = r.ctx;
const cases = [];
const test = (name, run) => cases.push({ name, run });
const msg = (id, data, content = hud().replace(/^Equipment:.*$/m, 'Equipment: None')) => ({ id, role: 'assistant', swipe_id: 0, content, metadata: { rpg_companion: { swipes: { 0: data } } } });
const planning = `HUD format check: use the selected layout.\n\n${hud('Draft Room', '06:00')}\n\nProse: describe the scene, without deciding the player's actions.\n\nScene beats:\n1. Offer a cloak; do not assume acceptance.\n\nStop before the player acts.${hud('Courtyard', '09:00')}\nRin waits by the gate.`;

test('equipment: explicit offers and unaccepted actions never become held or worn', () => {
    assert.equal(c.gearNormalize([{ item: 'Travel cloak', state: 'offered to be worn', accepted: false }]), null);
    assert.equal(c.gearNormalize([{ item: 'Knife', state: 'offered, held out to you' }]), null);
    assert.equal(c.gearNormalize([{ item: 'Bow', state: 'planned to be equipped' }]), null);
    for (const state of ['in hand', 'worn', 'sheathed', 'stowed', 'on body', 'in container', 'dropped']) {
        assert.equal(c.gearNormalize([{ item: 'Travel cloak', state }])[0].state, state);
    }
    assert.equal(c.gearNormalize([{ item: 'Borrowed shield', state: 'in hand', owned: false }])[0].state, 'in hand');
    assert.equal(c.gearNormalize([{ item: 'Knife', state: 'not held', where: 'on your belt' }])[0].state, 'on body');
});

test('inventory: unopened nearby gifts are pending, accepted wrapped gifts and temporary possessions survive', () => {
    const parsed = c.parseCompanion('<rpg_companion>' + JSON.stringify({ you: { got: [
        'a wrapped bundle beside the plate (an unopened gift)',
        'a small crookedly-wrapped parcel with a carving inside',
        'Knife offered but not taken',
        { item: 'Map', accepted: false },
        'Accepted unopened gift', 'Borrowed lantern', 'Unopened toolbox'
    ] } }) + '</rpg_companion>');
    assert.deepEqual(Array.from(parsed.you.got), ['Accepted unopened gift', 'Borrowed lantern', 'Unopened toolbox']);
    const chat = [msg('a', { survival: { got: ['Knife offered but not taken', 'Borrowed lantern'] } })];
    assert.equal(c.gearRead(chat, {}).items.length, 1, 'Legacy pending acquisition reached Gear');
    assert.equal(c.pocketsNow([{ msgId: 'a', got: ['Knife offered but not taken', 'Borrowed lantern'] }], {}).length, 1);
    chat.push(msg('b', { gear: [{ name: 'Borrowed lantern', state: 'stowed', where: 'locker' }] }));
    assert.equal(c.gearRead(chat, {}).items[0].state, 'stowed');
    chat.push(msg('c', { gear: [{ name: 'Borrowed lantern', state: 'in hand' }] }));
    assert.equal(c.gearRead(chat, {}).items.length, 1);
    assert.equal(c.gearRead(chat, {}).items[0].state, 'in hand');
    chat[2].swipe_id = 1;
    assert.equal(c.gearRead(chat, {}).items[0].state, 'stowed');
});

test('quests: unknown percentages stay unknown; explicit progress survives; rejected tasks are omitted', () => {
    for (const progress of [null, '', ' ', false, true, [], {}, NaN, Infinity]) {
        assert.equal(c.questNormalize([{ name: 'Repair the gate', progress }])[0].progress, null);
    }
    for (const [progress, expected] of [[0, 0], [40, 40], ['75', 75], [100, 100]]) {
        assert.equal(c.questNormalize([{ name: 'Repair the gate', progress }])[0].progress, expected);
    }
    assert.equal(c.questNormalize([{ name: 'Suggested errand', accepted: false, progress: 100 }]), null);
    assert.equal(c.questNormalize([{ name: 'Maybe a quest', speculative: true, progress: 40 }]), null);
    assert.equal(c.questNormalize([{ name: 'Proposed errand', state: 'suggested', progress: 0 }]), null);
    assert.equal(c.objectivesNormalize([{ text: 'An invitation', accepted: false, state: 'active' }]), null);
    const established = msg('quest', { quests: c.questNormalize([{ name: 'Repair the gate', progress: 40 }]) });
    assert.equal(c.questDetailsLatest([established, msg('no-change', {})])[0].progress, 40);
});

test('appointments: requests do not become promises; confirmed events retain lifecycle and context', () => {
    assert.equal(c.agendaNormalize([{ what: 'Visit the workshop', kind: 'request', state: 'open' }]), null);
    assert.equal(c.agendaNormalize([{ what: 'Visit the workshop', kind: 'invitation', state: 'open' }]), null);
    for (const kind of ['promise', 'meeting', 'deadline', 'event', 'errand']) {
        const row = c.agendaNormalize([{ what: 'Visit the workshop', kind, accepted: true, with: 'Rin', where: 'Workshop', when: 'tomorrow morning' }])[0];
        assert.equal(row.kind, kind);
        assert.equal(row.with, 'Rin'); assert.equal(row.where, 'Workshop');
        assert.equal(row.state, 'open');
    }
    const rows = [msg('a', { agenda: c.agendaNormalize([{ what: 'Visit the workshop', kind: 'event', when: 'tomorrow morning' }]) })];
    for (const state of ['started', 'kept', 'cancelled']) {
        rows.push(msg(state, { agenda: c.agendaNormalize([{ what: 'Visit the workshop', kind: 'event', state }]) }));
        assert.equal(c.agendaRead(rows, {}).items[0].state, state === 'started' ? 'in_progress' : state);
    }
});

test('relationships: explicit speculation is withheld without deleting established bonds or useful interpretations', () => {
    assert.equal(c.relNormalize([{ name: 'Rin', mood: 'jealous', speculative: true }]), null);
    assert.equal(c.simTowardNormalize({ name: 'Rin', moves: 'phthonos+1', speculative: true }), null);
    assert(c.simTowardNormalize({ name: 'Rin', moves: 'philia+1', why: 'They smiled and offered help' }));
    assert.equal(c.simMindsNormalize([{ name: 'Rin', feel: 'joy', toward: [{ name: 'You', moves: 'phthonos+1', confirmed: false }] }])[0].toward, undefined);
    const chat = [msg('family', { relations: c.relNormalize([{ name: 'Rin', bond: 'mother', standing: 'Close' }]) }),
        msg('uncertain', { relations: c.relNormalize([{ name: 'Rin', bond: 'enemy', speculative: true }]) })];
    assert.equal(c.hmsRelationsPanel(chat, {}).people[0].bond, 'mother');
    const number = c.relNormalize([{ name: 'Rin', trust: null }], { relations: { bars: ['trust'] } }, null, true)[0];
    assert.equal(number.trust, null);
});

test('sources: explicit draft/planning prefixes cannot override the final HUD or pollute tracking transport', async () => {
    assert.equal(c.parseHud(planning).time, '09:00');
    assert(c.parseHud(planning).location.includes('Courtyard'));
    const clean = c.stripLeakedReasoning(planning);
    assert(!clean.includes('Scene beats:'));
    assert(!clean.includes('Draft Room'));
    assert(clean.includes('Rin waits by the gate.'));
    assert.equal(c.parseHud(clean).time, '09:00');
    const fake = '<rpg_companion>{"you":{"got":["Invented key"]}}</rpg_companion>';
    const poisoned = planning.replace('Scene beats:', fake + '\n\nScene beats:');
    const processed = await c.hmsProcessContent('draft-report', poisoned, null, 'normal', {});
    assert.equal(processed.comp.found, false, 'A data block inside the discarded draft became a report');
    assert.equal(c.parseCompanion('<think>' + fake + '</think>').found, false);
    const rt = runtime(filename); seed(rt); rt.messages[1].content = planning;
    let calls = 0, source = '';
    rt.quiet(request => { calls++; source = request.messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n'); });
    await rt.ctx.runSeparateUpdate('test');
    assert.equal(calls, 1);
    assert(!source.includes('Scene beats:'));
    assert(source.includes('Rin waits by the gate.'));
});

test('HUD safety: repeated headers, quoted examples, tagged reasoning and ordinary prose remain safe', () => {
    const current = hud('Courtyard', '09:00');
    assert.equal(c.parseHud('### WORLD STATE ###\n' + current).time, '09:00');
    assert.equal(c.parseHud('<reasoning>' + hud('Draft Room', '06:00') + '</reasoning>\n' + current).time, '09:00');
    const normal = current + '\nRin reads the director\'s notes: Scene beats: rain, then thunder.\n' + hud('Example Room', '10:00');
    assert.equal(c.parseHud(normal).time, '09:00');
    assert.equal(c.stripLeakedReasoning(normal), normal);
    assert.equal(c.parseHud('```\n' + hud('Example Room', '10:00') + '\n```\n' + current).time, '09:00');
    assert.equal(c.parseHud(current + '\n(OOC: Correction)\n' + hud('Courtyard', '09:05')).time, '09:05');
    assert.equal(c.parseHud('### WORLD STATE ###'), null);
});

test('prompt policy: measured quest progress, explicit promises and accepted acquisitions without added prompt length', () => {
    const prompt = c.buildCompanionInstruction({}, 'Rin', {}, c.emptyChatState(), [], true);
    assert(!prompt.includes('"progress": 0..100'));
    assert.match(prompt, /progress[^\n]*(?:measured|explicit)[^\n]*null/i);
    assert.match(prompt, /promise[^\n]*(?:explicit|commit)/i);
    assert.match(prompt, /(?:unopened|wrapped)[^\n]*(?:accept|acqui|transfer)/i);
    if (process.env.COMPANION_BASELINE) {
        const old = runtime(path.resolve(process.env.COMPANION_BASELINE));
        const before = old.ctx.buildCompanionInstruction({}, 'Rin', {}, old.ctx.emptyChatState(), [], true);
        assert(prompt.length <= before.length, `Prompt grew: ${before.length} -> ${prompt.length}`);
        const fields = value => Array.from(value.split('<rpg_companion>')[1].split('</rpg_companion>')[0].matchAll(/"([a-zA-Z_]+)"\s*:/g), m => m[1]);
        assert.deepEqual(fields(prompt), fields(before), 'Requested output fields changed');
        console.log(`Prompt characters: ${before.length} -> ${prompt.length}`);
    }
});

if (process.env.COMPANION_EXPORT) test('supplied export: final HUD, family, physical presence and explicit held state survive', async () => {
    const exported = JSON.parse(fs.readFileSync(process.env.COMPANION_EXPORT, 'utf8'));
    const last = exported.messages.at(-1);
    assert.equal(c.recoverFromReasoning(last, last.content), null, 'The optional recovery feature generated the exported planning leak');
    const stored = last.extra.spindle_metadata.rpg_companion.swipes[String(last.swipe_id ?? 0)];
    const clean = c.stripLeakedReasoning(last.content);
    assert(!clean.includes('Scene beats:'));
    assert.equal((clean.match(/WORLD STATE/g) || []).length, 1);
    assert.equal(c.parseHud(clean).time, stored.infoBox.time.end);
    const report = { ...stored, you: stored.survival };
    const normalized = c.parseCompanion('<rpg_companion>' + JSON.stringify(report) + '</rpg_companion>');
    assert.equal(normalized.family.length, stored.family.length);
    assert.equal(normalized.characters.length, stored.characters.length);
    assert.equal(normalized.gear[0].state, stored.gear[0].state);
    assert.equal(normalized.relations.length, stored.relations.length);
    assert.equal(normalized.you.got.length, 1, 'Pending gift descriptors remained acquired');
    // The arbitrary number is supplied by the extractor; there is no local proof it is measured.
    assert.equal(normalized.quests[0].progress, stored.quests[0].progress);
    const p = await c.hmsProcessContent('export', last.content, null, 'normal', {});
    assert.equal(p.content, clean);
    assert.equal(p.hud.time, stored.infoBox.time.end);
});

(async () => {
    let failed = 0;
    const selected = process.env.COMPANION_TRACKING_ONLY === '1'
        ? cases.filter(x => !/^(?:sources:|HUD safety:|supplied export:)/.test(x.name)) : cases;
    for (const { name, run } of selected) {
        try { await run(); console.log(`PASS ${name}`); }
        catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); }
    }
    console.log(`Tracking source integrity${process.env.COMPANION_TRACKING_ONLY === '1' ? ' (six tracking groups; legacy HUD/source groups excluded)' : ''}: ${selected.length - failed}/${selected.length} groups passed.`);
    if (failed) process.exitCode = 1;
})();
