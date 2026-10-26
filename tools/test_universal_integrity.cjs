const assert = require('node:assert/strict');
const path = require('node:path');
const { runtime, seed, hud } = require('./test_panel_tracking.cjs');
const filename = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
const cases = [];
const test = (name, run) => cases.push({ name, run });
const rt = runtime(filename);
const plain = value => JSON.parse(JSON.stringify(value));
const msg = (id, data, content = 'A scene.') => ({ id, role: 'assistant', swipe_id: 0, content, metadata: { rpg_companion: { swipes: { 0: data } } } });

test('identity: distinct full names and ambiguous aliases stay separate', () => {
    const roster = [{ name: 'Alex Stone', key: 'alex stone', aliases: ['Captain', 'Stone'] }, { name: 'Alex Reed', key: 'alex reed', aliases: ['Captain', 'Reed'] }];
    assert.equal(rt.ctx.partyMatch(roster, 'Alex Reed')?.name, 'Alex Reed');
    assert.equal(rt.ctx.partyMatch(roster, 'Alex Winter'), null);
    assert.equal(rt.ctx.partyMatch(roster, 'Captain'), null);
    assert.equal(rt.ctx.partyMatch(roster, 'Alex'), null);
    assert.equal(rt.ctx.partyMatch(roster, 'Stone')?.name, 'Alex Stone');
    assert.equal(rt.ctx.partyMatch([{ name: 'Alex Stone', key: 'alex stone' }], 'Alex')?.name, 'Alex Stone');
    const key = rt.ctx.simKeyer(roster, rt.ctx.simYouKeys('Alex Vale'));
    assert.notEqual(key('Alex Stone'), key('Alex Reed'));
    assert.notEqual(key('Alex Stone Jr'), key('Alex Stone'));
    assert.notEqual(key('Alex Reed'), key('Alex Vale'));
    assert.notEqual(key('The Keeper'), key('Keeper'));
});

test('knowledge: missing vectors, guesses and gossip never become certain', () => {
    const rows = rt.ctx.simLearnedNormalize([
        { who: 'Bram', fact: 'A private password', from: 'Rin' },
        { who: 'Bram', fact: 'Rin betrayed us', how: 'guessed', sure: 'certain' },
        { who: 'Bram', fact: 'The mayor fled', how: 'gossip', sure: 'certain' },
        { who: 'Bram', fact: 'The door is open', how: 'saw' },
        { who: 'Bram', fact: 'A mistaken belief', how: 'guessed', sure: 'wrong' }
    ]);
    assert.equal(rows[0].how, null); assert.equal(rows[0].sure, 'unsure');
    assert.equal(rows[1].sure, 'unsure'); assert.equal(rows[2].sure, 'partly');
    assert.equal(rows[3].sure, 'certain'); assert.equal(rows[4].sure, 'wrong');
    const knows = new Map();
    rt.ctx.simLearn(knows, { who: 'Bram', fact: 'A private password', sure: 'certain' }, 0, { clock: 1, msg: { id: 'a' } }, x => x);
    assert.equal(knows.get('Bram').facts[0].sure, 'unsure', 'Legacy reports bypassed the guard');
    assert(!knows.has('Rin'), 'Knowledge spread to another actor');
});

test('minds: explicit speculation is omitted, established readings remain', () => {
    assert.equal(rt.ctx.simMindsNormalize([{ name: 'Bram', feel: 'fear', speculative: true }]).length, 0);
    assert.equal(rt.ctx.simAgendasNormalize([{ name: 'Bram', doing: 'Stealing a key', confirmed: false }]).length, 0);
    assert.equal(rt.ctx.simMindsNormalize([{ name: 'Bram', feel: 'fear' }]).length, 1);
    const text = rt.ctx.simRequest(null, 'Rin').rules;
    assert.match(text, /imagined off-screen event/);
    assert.match(text, /not information transfer/);
});

test('objectives: suggestions, intentions and abandonment are not silently active', () => {
    assert.equal(rt.ctx.objectivesNormalize([{ text: 'Find a key', state: 'suggested' }])?.length || 0, 0);
    assert.equal(rt.ctx.objectivesNormalize([{ text: 'Find a key', state: 'intended' }])?.length || 0, 0);
    assert.equal(rt.ctx.objectivesNormalize([{ text: 'Find a key', state: 'active', accepted: false }])?.length || 0, 0);
    assert.equal(rt.ctx.objectivesNormalize([{ text: 'Find a key', state: 'abandoned' }])[0].state, 'abandoned');
    assert.equal(rt.ctx.objectivesNormalize([{ text: 'Find a key', state: 'accepted' }])[0].state, 'active');
    assert.equal(rt.ctx.objectivesNormalize([{ text: 'Find a key', state: 'done' }])[0].state, 'done');
    assert.deepEqual(plain(rt.ctx.objectivesNormalize([])), []);
    const chat = [msg('a', { objectives: [{ text: 'Find a key', state: 'active' }] }), msg('b', { objectives: rt.ctx.objectivesNormalize([]) })];
    assert.equal(rt.ctx.plotPanel(chat, rt.ctx.emptyChatState()).objectives.length, 0);
    assert.equal(rt.ctx.agendaNormalize([{ what: 'Meet Bram', state: 'suggested' }]), null);
    assert.equal(rt.ctx.agendaNormalize([{ what: 'Meet Bram', state: 'abandoned' }])[0].state, 'cancelled');
});

test('Agenda: appointments with different participants remain distinct', () => {
    const chat = [msg('a', { agenda: rt.ctx.agendaNormalize([{ what: 'Meet at the gate', with: 'Bram', state: 'open' }]) }),
        msg('b', { agenda: rt.ctx.agendaNormalize([{ what: 'Meet at the gate', with: 'Tess', state: 'kept' }]) })];
    const items = rt.ctx.agendaRead(chat, {}).items;
    assert.equal(items.length, 2);
    assert.equal(new Set(items.map(x => x.key)).size, 2);
    assert.equal(items.find(x => x.with === 'Bram').state, 'open');
});

test('privacy: Secrets cannot grant a recipient knowledge without a discovery vector', () => {
    const chat = [msg('a', { secrets: [{ key: 'password', text: 'The password is rose', whose: 'Rin', mine: true, knownBy: ['Bram'], how: null }] })];
    const st = rt.ctx.emptyChatState();
    assert.equal(rt.ctx.secretRead(chat, st, 'Rin').items[0].knownBy.size, 0);
    chat[0].metadata.rpg_companion.swipes[0].secrets[0].how = 'Rin tells Bram';
    assert.equal(rt.ctx.secretRead(chat, st, 'Rin').items[0].knownBy.size, 1);
    st.secrets = { added: [{ text: 'A manual secret', knownBy: ['Tess'] }] };
    assert.equal(rt.ctx.secretRead([], st, 'Rin').items[0].knownBy.size, 1);
});

test('source binding: equal-length edits invalidate all modules together', async () => {
    const r = runtime(filename); seed(r);
    await r.ctx.runSeparateUpdate('test');
    const m = r.messages[1], original = m.content;
    assert(r.ctx.getSwipeData(m)?.relations);
    m.content = original.replace('practices', 'abandons!');
    assert.equal(m.content.length, original.length);
    assert.equal(r.ctx.getSwipeData(m), null);
    assert.equal(r.ctx.spellKnown(r.messages, await r.ctx.getChatState('test')).has('earth spear'), false);
    assert.equal(r.ctx.agendaRead(r.messages, {}).items.length, 0);
    assert.equal(r.ctx.secretRead(r.messages, {}, 'Marcus King').items.length, 0);
    m.content = original;
    assert(r.ctx.getSwipeData(m)?.relations, 'Restoring the original text lost its valid report');
    m.swipe_id = 1; assert.equal(r.ctx.getSwipeData(m), null);
    m.swipe_id = 0; assert(r.ctx.getSwipeData(m));
    assert(r.ctx.getSwipeData(msg('legacy', { gear: [] })), 'Legacy metadata must remain readable');
});

test('persistence: caches only advance after metadata writes succeed', async () => {
    const r = runtime(filename); seed(r);
    r.ctx.statesFill('test', r.messages);
    const update = r.ctx.spindle.chat.updateMessage;
    r.ctx.spindle.chat.updateMessage = async () => { throw Error('disk unavailable'); };
    await assert.rejects(r.ctx.setSwipeData('test', r.messages[1], { characters: [{ name: 'Ghost' }] }));
    assert.equal((await r.ctx.getStatesFor('test', 'a1')), null);
    r.ctx.spindle.chat.updateMessage = update;
    await r.ctx.setSwipeData('test', r.messages[1], { characters: [{ name: 'Bram' }] });
    assert.equal((await r.ctx.getStatesFor('test', 'a1')).d.characters[0].name, 'Bram');
    const writes = await Promise.allSettled([r.ctx.setSwipeData('test', r.messages[1], { gear: [] }), r.ctx.setSwipeData('test', r.messages[1], { agenda: [] })]);
    assert(writes.every(x => x.status === 'fulfilled'));
    assert(r.ctx.getSwipeData(r.messages[1]).agenda);
});

test('classic refresh: slow output cannot attach to a changed or deleted reply', async () => {
    for (const change of ['swipe', 'edit', 'delete']) {
        const r = runtime(filename); seed(r);
        r.messages[1].content = 'Bram opens the door.';
        r.run("hmsCache.clear(); settings.hmsMode='off';");
        r.response({ userStats: { health: 90 }, characters: [] });
        r.quiet(() => {
            if (change === 'swipe') r.messages[1].swipe_id = 1;
            if (change === 'edit') r.messages[1].content = 'The door stays shut.';
            if (change === 'delete') r.messages.pop();
        });
        await r.ctx.runSeparateUpdate('test');
        assert.equal(r.writes.length, 0, `classic stale ${change} was saved`);
    }
});

test('regeneration: all generated module context uses only the prior branch', async () => {
    const r = runtime(filename); seed(r);
    r.messages[1].metadata = msg('x', { survival: { learned: ['BranchOnlySpell'] }, agendas: [{ name: 'Bram', doing: 'BranchOnlyAction' }] }).metadata;
    r.messages.push({ id: 'u2', role: 'user', content: 'I enter the room.' }, msg('a2', { survival: { learned: ['DiscardedSpell'] }, agendas: [{ name: 'Tess', doing: 'DiscardedAction' }] }, hud('DiscardedRoom')));
    r.run("settings.generationMode='together';");
    const before = r.ctx.trackingBefore(r.messages, 'a2');
    assert.equal(before.at(-1).id, 'u2');
    const prompt = await r.ctx.hmsRequestParts('test', r.messages, 'regenerate', 'a2', 'Marcus King', false);
    assert(!prompt.join('\n').includes('DiscardedAction'));
    assert(!prompt.join('\n').includes('DiscardedSpell'));
    const minds = await r.ctx.rpgcMindsMacro({ chatId: 'test', env: { system: { lastGenerationType: 'regenerate' } } });
    assert(!minds.includes('DiscardedAction'));
    const input = r.messages.map(m => ({ role: m.role, content: m.content, __isChatHistory: true }));
    r.ctx.promptInput = input;
    const result = await r.run("rpgcInterceptor(promptInput, {chatId:'test', generationType:'regenerate'})");
    const out = result.messages || result;
    const generated = out.filter(m => !m.__isChatHistory).map(m => m.content).join('\n');
    assert(!generated.includes('DiscardedAction'));
    assert(!generated.includes('DiscardedSpell'));
});

test('prompt handshake: Reporter/Minds slots and repeated interception are deduplicated', async () => {
    const r = runtime(filename); seed(r); r.run("settings.generationMode='together';");
    r.messages[1].metadata = msg('x', { minds: [{ name: 'Bram', feel: { p: 'fear' } }] }).metadata;
    r.messages.push({ id: 'u2', role: 'user', content: 'I wait.' });
    const slot = await r.ctx.rpgcSlotRequest({ chatId: 'test', env: {} });
    const minds = await r.ctx.rpgcMindsMacro({ chatId: 'test', env: {} });
    r.ctx.input = [{ role: 'system', content: slot }, { role: 'system', content: minds }, { role: 'user', content: 'I wait.', __isChatHistory: true }];
    const first = await r.run("rpgcInterceptor(input, {chatId:'test',generationType:'normal'})");
    const messages = first.messages || first;
    const all = messages.map(m => m.content).join('\n');
    assert.equal(all.split('[RPG Companion — for this reply]').length - 1, 1);
    assert.equal(all.split('[RPG Companion — minds]').length - 1, 1);
    r.ctx.again = messages;
    const second = await r.run("rpgcInterceptor(again, {chatId:'test',generationType:'normal'})");
    assert.equal((second.messages || second).length, messages.length);
});

test('save/load: concurrent loads share state and writes commit immutable snapshots in order', async () => {
    const r = runtime(filename);
    let reads = 0; const releases = [];
    r.ctx.spindle.storage.getJson = async () => { reads++; await new Promise(resolve => { releases.push(resolve); }); return { v: 2, spellbook: [{ name: 'Spark', from: 'you' }] }; };
    const a = r.ctx.getChatState('fresh'), b = r.ctx.getChatState('fresh');
    await Promise.resolve(); releases.forEach(resolve => resolve());
    assert.strictEqual(await a, await b); assert.equal(reads, 1);
    const disk = new Map(), log = [];
    r.ctx.spindle.storage.setJson = async (key, value) => { await Promise.resolve(); disk.set(key, structuredClone(value)); log.push([key, value.xpAdjust]); };
    const st = await r.ctx.getChatState('fresh'); st.xpAdjust = 1;
    const first = r.ctx.saveChatState('fresh', st); st.xpAdjust = 2;
    const second = r.ctx.saveChatState('fresh', st); st.xpAdjust = 3;
    await Promise.all([first, second]);
    assert.deepEqual(log.filter(([key]) => key.endsWith('.json')).map(([, value]) => value), [1, 2]);
    assert.equal(disk.get('chats/fresh.json').xpAdjust, 2);
    assert.equal(disk.get('chats/fresh.json.recovery').xpAdjust, 2);
});

test('save/load: damaged roots recover; legacy migration and manual data survive', async () => {
    const r = runtime(filename); const disk = new Map();
    disk.set('chats/recover.json', ['bad root']);
    disk.set('chats/recover.json.recovery', { v: 2, xpAdjust: 42, spellbook: [{ name: 'Spark', from: 'you' }], questNotes: ['Keep this note'] });
    disk.set('chats/legacy.json', { userStats: { health: 72 }, characters: [{ name: 'Bram' }] });
    disk.set('chats/malformed.json', { v: 2, spellbook: {}, locks: [], rooms: [], party: { members: null }, relPins: [] });
    r.ctx.spindle.storage.getJson = async (key, opt) => disk.get(key) ?? opt.fallback;
    const recovered = await r.ctx.getChatState('recover');
    assert.equal(recovered.xpAdjust, 42); assert.equal(recovered.spellbook[0].name, 'Spark');
    assert.equal(recovered.questNotes[0], 'Keep this note');
    assert.equal((await r.ctx.getChatState('legacy')).seed.userStats.health, 72);
    const bad = await r.ctx.getChatState('malformed');
    assert(Array.isArray(bad.spellbook)); assert(Array.isArray(bad.party.members));
    assert(!Array.isArray(bad.rooms)); assert(!Array.isArray(bad.relPins));
    const dangerous = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"enabled":false}');
    const merged = rt.ctx.mergeDeep({ enabled: true }, dangerous);
    assert.equal(merged.enabled, false); assert.equal(merged.polluted, undefined);
});

test('write failure: recovery survives and the next save is not blocked', async () => {
    const r = runtime(filename), disk = new Map(); let fail = false;
    r.ctx.spindle.storage.setJson = async (key, value) => { if (fail && key.endsWith('.json')) throw Error('interrupted'); disk.set(key, structuredClone(value)); };
    const st = r.ctx.emptyChatState(); st.xpAdjust = 10;
    await r.ctx.saveChatState('recover', st); fail = true; st.xpAdjust = 20;
    await assert.rejects(r.ctx.saveChatState('recover', st));
    assert.equal(disk.get('chats/recover.json.recovery').xpAdjust, 10);
    fail = false; await r.ctx.saveChatState('recover', st);
    assert.equal(disk.get('chats/recover.json').xpAdjust, 20);
});

test('performance: one model call, local rereads, bounded memoization and no added report fields', async () => {
    const r = runtime(filename); seed(r); let calls = 0;
    r.quiet(() => { calls++; });
    await r.ctx.runSeparateUpdate('test'); await r.ctx.pushState('test'); await r.ctx.pushState('test');
    assert.equal(calls, 1);
    r.ctx.chat = r.messages;
    assert(r.run('withReadPass(chat, () => hmsTimeline(chat) === hmsTimeline(chat))'));
    assert.equal(r.run('activeReadPass'), null);
    assert(!r.ctx.buildCompanionInstruction({}, 'Rin', {}, r.ctx.emptyChatState(), []).includes('"evidence_quote"'));
});

test('injuries: changing or deleting a branch restores the active body, manual wounds survive', async () => {
    const r = runtime(filename);
    const injury = { where: 'arm', what: 'a cut', kind: 'wound', severity: 'minor', status: 'raw' };
    const a = msg('a', { injuries: [injury] }, 'Bram cuts your arm.');
    r.messages.push(a);
    const st = r.ctx.emptyChatState();
    r.ctx.injAfterReply(st, a, [injury], 10);
    st.injuries.list.push({ ...injury, key: 'manual', what: 'manual scar', status: 'scar', manual: true });
    assert.equal(r.ctx.injuryReadState(r.messages, st).injuries.list.length, 2);
    a.swipe_id = 1; a.content = 'The blade misses.';
    assert.equal(r.ctx.injuryReadState(r.messages, st).injuries.list.length, 1);
    assert.equal(r.ctx.injuryReadState([], st).injuries.list[0].what, 'manual scar');
    a.swipe_id = 0; a.content = 'Bram cuts your arm.';
    assert.equal(r.ctx.injuryReadState(r.messages, st).injuries.list.length, 2);
    await r.ctx.setSwipeData('injuries', a, { injuries: [injury] });
    a.content = 'The blade misses.';
    assert.equal(r.ctx.injuryReadState(r.messages, st).injuries.list.length, 1);
    assert.equal(st.injuries.list.length, 2, 'Reading a rollback deleted stored records');
});

test('chapter memory: edited/swiped source summaries and derived discoveries are withheld', () => {
    const r = runtime(filename);
    const a = msg('a', {}, 'A door opens.');
    const chat = [a];
    const chapter = { id: 'c1', kind: 'loop', title: 'An encounter', fromId: 'a', toId: 'a', status: 'closed', summary: 'PrivateChapterSummary', learned: ['PrivateLoopKnowledge'] };
    chapter.summarySource = r.ctx.chapterRangeSource(chat, chapter);
    const st = { chapters: { list: [chapter], open: {}, knowledge: [{ text: 'PrivateLoopKnowledge', chapterId: 'c1', summarySource: chapter.summarySource }] } };
    assert(r.ctx.chaptersBlock(st, 'Rin', null, chat).includes('PrivateChapterSummary'));
    a.content = 'A gate opens.';
    assert.equal(r.ctx.chaptersBlock(st, 'Rin', null, chat), '');
    assert.equal(r.ctx.chaptersPanel(st, chat).list[0].stale, true);
    assert.equal(chapter.summary, 'PrivateChapterSummary', 'Stale summary was destroyed');
    a.content = 'A door opens.'; a.swipe_id = 1;
    assert.equal(r.ctx.chaptersBlock(st, 'Rin', null, chat), '');
    assert.equal(r.ctx.chaptersBlock(st, 'Rin', null, []), '');
});

test('chapter generation: a source change during the model call rejects the old summary', async () => {
    const r = runtime(filename); seed(r);
    const st = await r.ctx.getChatState('test');
    st.chapters = { list: [{ id: 'c1', kind: 'manual', title: 'A scene', status: 'closed', fromId: 'u1', toId: 'a1', summary: 'Original' }], open: {}, knowledge: [] };
    r.ctx.chapterQuiet = async () => { r.messages[1].content = 'An entirely different scene.'; return JSON.stringify({ title: 'Old branch', summary: 'Should not be stored' }); };
    await assert.rejects(r.ctx.chapterSummarize('test', 'c1'), /chapter changed/i);
    assert.equal(st.chapters.list[0].summary, 'Original');
});

test('hidden replies: HUD time, inventory and knowledge are excluded consistently', () => {
    for (const flags of [{ hidden: true }, { is_hidden: true }, { metadata: { hidden: true } }, { extra: { hidden: true } }]) {
        const r = runtime(filename);
        const a = msg('a', { learned: [{ who: 'Bram', fact: 'A private password', how: 'told', from: 'Rin' }], survival: { learned: ['Spark'] } }, hud());
        const metadata = { ...a.metadata, ...(flags.metadata || {}) };
        Object.assign(a, flags, { metadata });
        assert.equal(r.ctx.getSwipeData(a), null);
        assert.equal(r.ctx.hmsTimeline([a]).length, 0);
        assert.equal(r.ctx.relReadings([a]).length, 0);
        assert.equal(r.ctx.simFold([a], r.ctx.emptyChatState()).knows.size, 0);
    }
});

test('prompt slots: quoted history markers cannot suppress the real tracker request', async () => {
    const r = runtime(filename); seed(r); r.run("settings.generationMode='together';");
    r.messages.push({ id: 'u2', role: 'user', content: 'I wait.' });
    r.ctx.input = [{ role: 'assistant', content: 'Quoted: [RPG Companion — for this reply]', __isChatHistory: true }, { role: 'user', content: 'I wait.', __isChatHistory: true }];
    const result = await r.run("rpgcInterceptor(input, {chatId:'test',generationType:'normal'})");
    const out = result.messages || result;
    assert(out.some(m => !m.__isChatHistory && m.content.includes('<rpg_companion>')));
});

test('performance: report provenance is hashed once per unchanged message object', () => {
    const r = runtime(filename), a = msg('bound', {}, 'An unchanged scene.');
    a.metadata.rpg_companion.sources = { 0: r.ctx.readingSource(a.content) };
    const original = r.ctx.readingSource; let reads = 0;
    r.ctx.readingSource = text => { reads++; return original(text); };
    for (let i = 0; i < 20; i++) assert(r.ctx.getSwipeData(a));
    assert.equal(reads, 1);
    a.content = 'Another scene.';
    assert.equal(r.ctx.getSwipeData(a), null); assert.equal(reads, 2);
});

test('malformed reports: mixed invalid rows cannot crash module normalizers', () => {
    const r = runtime(filename);
    const names = ['simMindsNormalize', 'simAgendasNormalize', 'simLearnedNormalize', 'agendaNormalize', 'objectivesNormalize', 'famNormalize', 'gearNormalize', 'holdNormalize', 'moneyNormalize', 'factionNormalize', 'secretNormalize', 'injNormalize', 'questNormalize'];
    for (const name of names) for (const input of [null, false, 42, 'wrong', {}, [null, false, 42, 'x', {}, [], { name: { bad: 1 }, what: ['x'], who: true, fact: [] }]]) {
        assert.doesNotThrow(() => r.ctx[name](input), name);
    }
    assert.equal(r.ctx.getSwipeData({ id: 'bad', content: '', metadata: { rpg_companion: { swipes: { 0: 'broken' } } } }), null);
});

test('HUD validation: missing data stays absent and same-length edits refresh the clock', () => {
    const r = runtime(filename);
    assert.equal(r.ctx.parseHud('No HUD here.'), null);
    const a = msg('a', {}, '### WORLD STATE ###\nLocation: The gate\n***\nA scene.');
    assert.equal(r.ctx.hmsClock(r.ctx.messageHud(a)), null);
    a.content = hud('Gate', '07:15');
    const before = r.ctx.hmsClock(r.ctx.messageHud(a)).minutes;
    a.content = hud('Gate', '07:16');
    assert.equal(r.ctx.hmsClock(r.ctx.messageHud(a)).minutes - before, 1);
    assert.equal(r.ctx.messageHud(a).location.at(-1), 'Gate');
});

(async () => {
    const failures = [];
    for (const { name, run } of cases) {
        try { await run(); console.log(`PASS ${name}`); }
        catch (error) { failures.push(name); console.error(`FAIL ${name}: ${error.message}`); }
    }
    console.log(`Universal integrity: ${cases.length - failures.length}/${cases.length} groups passed.`);
    if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });

