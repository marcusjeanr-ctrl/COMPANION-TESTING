// Synthetic references and full-card checks; no live model obedience claim.
const assert = require('node:assert/strict'), fs = require('node:fs'), z = require('node:zlib');
const { runtime, seed } = require('./test_panel_tracking.cjs');
const cases = [], test = (name, fn) => cases.push([name, fn]);
function entry(id, key, content = `${key}: established reference only.`, extra = {}) {
    return { id, keys: [key], content, comment: key, ...extra };
}
function setup(entries) {
    const r = runtime(); seed(r); r.run('settings.lore.enabled=true');
    r.ctx.setLorePool('test', entries); return r;
}
function context(request, scene = '') {
    const chat = [{ id: 'a', role: 'assistant', content: scene }, { id: 'u', role: 'user', content: request }];
    return { chat, messages: [{ role: 'system', content: 'Follow the actual card.' }, ...chat.map(m => ({ ...m, __isChatHistory: true }))] };
}
function ground(r, request, scene = '', extra = [], options = {}) {
    const { chat, messages } = context(request, scene);
    return r.ctx.narratorLoreGrounding('test', messages.concat(extra), chat, 'normal', options);
}
test('All reference categories work through the actual narrator interceptor without granting facts', async () => {
    const entries = ['Blade Reversal', 'Alden Vale', 'Copperbridge', 'Moonstone Ring', 'Guild Charter', 'Winter Calendar'].map((k, i) => entry(i, k));
    const r = setup(entries), { chat, messages } = context('Explain Blade Reversal, Alden Vale, Copperbridge, Moonstone Ring, Guild Charter and Winter Calendar.');
    r.messages.splice(0, r.messages.length, ...chat); const before = JSON.stringify(r.messages);
    const result = await r.run('rpgcInterceptor')(messages, { chatId: 'test', generationType: 'normal' });
    const out = result.messages || result, added = out.filter(m => String(m.content).includes('[RPG Companion: lore references]'));
    assert.equal(added.length, 1);
    for (const e of entries) assert(added[0].content.includes(e.content));
    assert.match(added[0].content, /not.*(?:knowledge|ownership)|not owned/i);
    assert.match(added[0].content, /private|secret/i);
    assert.equal(JSON.stringify(r.messages), before);
    assert.equal(r.ctx.spellKnown([], {}, null, 'test').size, 0);
    assert.equal(r.run("lastInjection.get('test').loreReferences.added.length"), entries.length);
    assert.equal(await r.run('rpgcInterceptor')(out, { chatId: 'test', generationType: 'normal' }), out);
});
test('Disabled entries and unrelated references never enter narration', () => {
    const r = setup([entry(1, 'Ring', 'DISABLED', { enabled: false }), entry(2, 'Shield', 'UNRELATED'), entry(3, 'Market')]);
    const q = ground(r, 'Show me the Ring at the Market.'); assert(q.text.includes('Market:'));
    assert(!q.text.includes('DISABLED')); assert(!q.text.includes('UNRELATED'));
    assert.equal(ground(r, 'I go to sleep.').text, '');
});
test('Primary matching retains case, whole-word, regex and selective semantics', () => {
    const r = setup([entry(1, 'Gem', 'CASE', { case_sensitive: true }), entry(2, 'cat', 'WHOLE'),
        entry(3, '/rune [0-9]+/i', 'REGEX', { use_regex: true }),
        entry(4, 'Gate', 'BOTH', { selective: true, secondary_keys: ['Key', 'Dawn'], selective_logic: 0 })]);
    assert.equal(ground(r, 'gem concatenate Gate Key').text, '');
    const q = ground(r, 'Gem cat rune 17 Gate Key Dawn.');
    for (const word of ['CASE', 'WHOLE', 'REGEX', 'BOTH']) assert(q.text.includes(word));
});
test('Host-only probability, timing, group, filter and activation controls are not bypassed', () => {
    const gates = [{ probability: 0 }, { probability: 25 }, { cooldown: 2 }, { sticky: 2 }, { delay: 1 },
        { delay_until_recursion: true }, { group: 'choice' }, { group_name: 'host-choice' }, { vectorized: true }, { scan_depth: 1 },
        { exclude_greeting: true }, { placement: { kind: 'outlet' } }, { outlet_name: 'private-slot' }, { wi_marker: 'private-slot' }, { position: 7 },
        { automation_id: 'event' }, { triggers: ['normal'] }, { characterFilter: { names: ['Alden'] } }, { role: 'assistant' }];
    for (const extensions of gates) for (const extra of [extensions, { extensions }]) {
        const r = setup([entry('gated', 'Gate', 'WITHHELD', extra), entry('ordinary', 'Gate', 'ALLOWED')]);
        const q = ground(r, 'Explain Gate.'); assert(!q.text.includes('WITHHELD'), JSON.stringify(extra)); assert(q.text.includes('ALLOWED'));
    }
});
test('Selective none/any/not-all and disabled probability controls keep their meaning', () => {
    for (const [logic, request, allowed] of [[1, 'Gate', true], [1, 'Gate Key', false], [2, 'Gate Key', true], [2, 'Gate', false], [3, 'Gate Key', true], [3, 'Gate Key Dawn', false]]) {
        const r = setup([entry(1, 'Gate', 'SELECTIVE', { selective: true, secondary_keys: ['Key', 'Dawn'], selective_logic: logic })]);
        assert.equal(!!ground(r, request).text, allowed, `${logic}: ${request}`);
    }
    const r = setup([entry(1, 'Gate', 'NO RANDOM GATE', { extensions: { probability: 0, use_probability: false } })]);
    assert(ground(r, 'Gate').text.includes('NO RANDOM GATE'));
});
test('Exact definitions in host system context are reused; story quotations are not definitions', () => {
    const e = entry(1, 'Gate'), r = setup([e]);
    const q = ground(r, 'Explain Gate.', '', [{ role: 'system', content: '<lore>' + e.content + '</lore>' }]);
    assert.equal(q.text, ''); assert.equal(q.report.hostProvided.length, 1);
    assert(ground(r, 'Explain Gate.', '', [{ role: 'assistant', __isChatHistory: true, content: e.content }]).text.includes(e.content));
});
test('Relevant previous-scene text is optional; old history and HUD carriers are not scanned', () => {
    const r = setup([entry(1, 'Gate')]);
    assert(ground(r, 'I inspect it.', 'The Gate is closed.').text.includes('Gate:'));
    r.run('settings.lore.matchSceneTerms=false'); assert.equal(ground(r, 'I inspect it.', 'The Gate is closed.').text, '');
    r.run('settings.lore.matchSceneTerms=true');
    const { chat, messages } = context('I eat.', '### WORLD STATE ###\nGate: Unknown\n***\nBreakfast begins.');
    chat.unshift({ id: 'old', role: 'assistant', content: 'Gate' });
    assert.equal(r.ctx.narratorLoreGrounding('test', messages, chat).text, '');
});
test('Small budgets, oversized entries and maximum entry counts never truncate definitions', () => {
    const r = setup([entry(1, 'Gate', 'LONG'.repeat(2000)), entry(2, 'Gate', 'SHORT COMPLETE'), entry(3, 'Gate', 'SECOND COMPLETE')]);
    r.run('settings.lore.maxChars=900; settings.lore.maxEntries=1'); const q = ground(r, 'Gate');
    assert(q.text.length <= 900); assert(!q.text.includes('LONGLONG')); assert(q.text.includes('SHORT COMPLETE'));
    assert.equal(q.report.added.length, 1); assert(q.report.omitted >= 2);
    for (const maxChars of [0, 50, 300]) assert.equal(ground(r, 'Gate', '', [], { maxChars }).text, '');
});
test('Request matches outrank previous scene matches and literal duplicates are emitted once', () => {
    const r = setup([entry(1, 'Old', 'OLD', { priority: 100 }), entry(2, 'New', 'NEW'), entry(3, 'New', 'NEW')]);
    r.run('settings.lore.maxEntries=1'); const q = ground(r, 'New', 'Old');
    assert(q.text.includes('NEW')); assert(!q.text.includes('[Old]')); assert.equal(q.report.added.length, 1);
});
test('Specific names outrank broad keywords even when their host insertion order is later', () => {
    const r = setup([entry(1, 'Gold', 'BROAD', { insertion_order: 0 }), entry(2, 'Asura Gold Coin', 'SPECIFIC', { insertion_order: 100 })]);
    r.run('settings.lore.maxEntries=1'); const q = ground(r, 'Asura Gold Coin'); assert(q.text.includes('SPECIFIC')); assert(!q.text.includes('BROAD'));
});
test('General grounding works with Magic off; lore off and non-narrator passes stay untouched', () => {
    const r = setup([entry(1, 'Gate')]); r.run('settings.hmsSystems.magic={enabled:false}'); assert(ground(r, 'Gate').text);
    const { chat, messages } = context('Gate');
    for (const mode of ['quiet', 'impersonate', 'continue']) assert.equal(r.ctx.narratorLoreGrounding('test', messages, chat, mode).text, '');
    r.run('settings.lore.enabled=false'); assert.equal(ground(r, 'Gate').text, '');
});
test('Book replacement, disabling and changed definitions are reflected without stale selections', () => {
    const r = setup([entry(1, 'Gate', 'FIRST')]); assert(ground(r, 'Gate').text.includes('FIRST'));
    r.ctx.setLorePool('test', [entry(1, 'Gate', 'SECOND')]); assert(!ground(r, 'Gate').text.includes('FIRST'));
    assert(ground(r, 'Gate').text.includes('SECOND'));
    r.ctx.setLorePool('test', [entry(1, 'Gate', 'SECOND', { enabled: false })]); assert.equal(ground(r, 'Gate').text, '');
    r.ctx.setLorePool('other', [entry(2, 'Gate', 'OTHER WORLD')]); assert.equal(ground(r, 'Gate').text, '');
});
test('Hidden recent messages and available cache in other chats cannot supply references', () => {
    const r = setup([entry(1, 'Gate')]), { chat, messages } = context('I eat.', 'Gate');
    chat[0].is_hidden = true; chat[0].hidden = true;
    assert.equal(r.ctx.narratorLoreGrounding('test', messages, chat).text, '');
    assert.equal(r.ctx.narratorLoreGrounding('another-chat', messages, context('Gate').chat).text, '');
});
test('Companion private blocks and reasoning do not activate general narrator references', () => {
    const r = setup([entry(1, 'Gate')]);
    assert.equal(ground(r, 'I eat.', 'Breakfast. <rpg_companion>{"secret":"Gate"}</rpg_companion>').text, '');
    assert.equal(ground(r, 'I eat.', '<think>Gate</think>Breakfast.').text, '');
});
test('A supplied spell source is not injected a second time as general lore', () => {
    const r = setup([entry(1, 'Gate')]); assert.equal(ground(r, 'Gate', '', [], { spellSources: ['1'] }).text, '');
});
test('Helpers use only existing caches and bounded history with zero host/model/storage calls', () => {
    const r = setup([entry(1, 'Gate')]); let calls = 0;
    const fail = () => { calls++; throw Error('Unexpected call'); };
    r.ctx.spindle.world_books.getActivated = fail; r.ctx.spindle.world_books.entries = { list: fail };
    r.ctx.spindle.chat.getMessages = fail; r.ctx.spindle.generate.quiet = fail; r.ctx.spindle.storage.setJson = fail;
    const { chat, messages } = context('Gate');
    chat.unshift(new Proxy({}, { get() { throw Error('Old history visited'); } }), { role: 'user', content: 'Earlier.' }, { role: 'assistant', content: 'Earlier.' });
    assert(r.ctx.narratorLoreGrounding('test', messages, chat).text); assert.equal(calls, 0);
});
test('Both primary cards supply exact non-spell references', () => {
    for (const card of ['six_sided_world', 'living_world']) {
        const entries = JSON.parse(z.gunzipSync(fs.readFileSync(__dirname + '/' + card + '_fixture.json.gz'))).data.character_book.entries;
        const r = setup(entries), q = ground(r, 'Explain Longsword of Light and the Asura Gold Coin.');
        assert(q.report.added.some(e => /Longsword|Sword God/i.test(e.name)), card);
        assert(q.report.added.some(e => /Coin|Currency/i.test(e.name)), card);
        for (const e of q.report.added) assert(q.text.includes(entries.find(x => String(x.id) === e.source).content.trim()));
    }
});
test('Spell grounding keeps priority and combined narrator reference overhead stays within the existing cap', async () => {
    const entries = JSON.parse(z.gunzipSync(fs.readFileSync(__dirname + '/six_sided_world_fixture.json.gz'))).data.character_book.entries;
    const r = setup(entries), { chat, messages } = context('Explain Ice Pillar and the Asura Gold Coin.');
    r.messages.splice(0, r.messages.length, ...chat); r.run('settings.lore.maxChars=1400');
    const res = await r.run('rpgcInterceptor')(messages, { chatId: 'test', generationType: 'normal' });
    const out = res.messages || res, content = out.filter(m => m.role === 'system').map(m => m.content).join('\n');
    assert(content.includes('[RPG Companion: spell references]'));
    const report = r.run("lastInjection.get('test')");
    assert(report.spellReferences.characters + report.loreReferences.characters <= 1400);
    assert(report.spellReferences.added.some(e => e.name === 'Ice Pillar'));
});
(async () => { let failed = 0; for (const [name, fn] of cases) { try { await fn(); console.log('PASS ' + name); } catch (e) { failed++; console.error('FAIL ' + name + ': ' + e.stack); } }
    console.log(`${cases.length - failed}/${cases.length} universal narrator lore groups passed`); if (failed) process.exitCode = 1;
})();
