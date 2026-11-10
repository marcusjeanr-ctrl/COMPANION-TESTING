const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const card = JSON.parse(fs.readFileSync(path.join(root, 'cards/six-sided/character.json')));
const book = JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync(path.join(root, 'cards/six-sided/lorebook.json.gz'))));
const source = fs.readFileSync(process.env.BACKEND || path.join(root, 'dist/backend.js'), 'utf8');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout,
    setInterval, clearInterval, performance, spindle: new Proxy({}, { get: (_, k) => k === 'log' ? quiet :
        new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(source.slice(0, source.indexOf('// ───────────────────────────── Startup')) + `
globalThis.api = {
  init: (entries, core) => {
    const normalized = entries.map(loreNormEntry).filter(Boolean);
    lorePool.set('modern', { entries: normalized });
    if (typeof sixNoteContract === 'function') sixNoteContract('modern', core);
    injNoteCore('modern', core);
    chatApi.getMessages = async () => [];
    getChatState = async () => emptyChatState();
    return normalized.length;
  },
  process: async (text, prev = null) => (await hmsProcessContent('modern', text, prev && parseHud(prev), 'normal', {})).content,
  world: text => worldMushoku('modern', worldLines(parseHud(text)), {}),
  wounds: text => hmsReadWounds(parseHud(text)),
  rules: messages => hmsCardRuleChecks(messages, hmsTimeline(messages), 'Marcus', 'modern'),
  norm: loreNormEntry,
  conditions: text => hmsReadConditions(parseHud(text), hmsCfg()),
  flags: text => hmsReadFlags(parseHud(text), hmsCfg()),
  sessions: (text, prev) => sixTrainingFromSessions(text, parseHud(prev), [{skill:'Water Magic',count:2,teacher:true}], 'modern'),
  owns: () => injBotOwns([], 'modern'),
  contract: sixNarratorContract,
  note: sixNoteContract,
  dropCore: () => sixContractChats.clear(),
  pin: async (text) => {
    getChatState = async () => ({...emptyChatState(), pins: {'mana capacity': {text: 'Mana Capacity: Vast | Reserve: Full | Status: Rested'}}});
    const result = await hmsProcessContent('modern', text, null, 'normal', {});
    getChatState = async () => emptyChatState();
    return result.content;
  },
  panel: async (text, core) => {
    const chat = [{id:'u',chat_id:'modern',role:'user',content:'I wait.'},
      {id:'m',chat_id:'modern',role:'assistant',content:text,swipe_id:0}];
    chatApi.getMessages = async () => chat;
    let state = emptyChatState(), payload = null;
    getChatState = async () => state; saveChatState = async (_, next) => { state = next; };
    userNameCache.set('modern', 'Marcus'); getUserName = async () => 'Marcus'; healRecent = async () => false;
    toFrontend = p => { if (p?.type === 'state') payload = p; };
    hmsCache.delete('modern'); await pushState('modern');
    const request = buildCompanionInstruction({}, 'Marcus', {}, null, chat, true);
    const messages = [{role:'system',content:core}, ...chat.map(m => ({...m,__isChatHistory:true}))];
    const result = await rpgcInterceptor(messages, {chatId:'modern',generationType:'normal'});
    const arr = Array.isArray(result) ? result : result?.messages || [];
    return {payload: JSON.parse(JSON.stringify(payload)), request,
      injected: arr.filter(m => !messages.some(p => p.content === m.content)).map(m => textOf(m.content)).join('\\n')};
  }
};`, ctx);
const A = ctx.api;
const hud = ['### WORLD STATE ###', 'Armored Dragon Calendar: K417, Month 4, Day 12 | Time: 08:30 (Morning)',
    'Location: Central Continent → Asura Kingdom → Fittoa Region → Estate',
    'Race: Human | Origin: Native | Age: 12 (born K404)', 'Current Arc: Sandbox: Fittoa Region',
    'Game Mode: Hard Mode, Blessed Child', 'Mana Capacity: Modest | Reserve: Low | Status: Mana Fatigue',
    'Touki (Battle Aura): Active', 'Sword Style: Sword God (Advanced)', 'Magic Tiers: Water (Advanced)',
    'Casting Method: Voiceless (Water only)', 'Voiceless Casting: Water only', 'Languages: Human Tongue (Fluent, reads)',
    'Contracts: None', 'Active Stance: Neutral', 'DEMON EYE: Foresight — Left | DEMON EYE: Magic Power — Right',
    'Curse: None | Blessing: Quickening', 'Dream Link: Apostle', 'Term: 1 | Role: Student',
    'Equipment: Ash wand', 'Inventory: Bandages | Purse: 0 copper', 'Adventurer: F-Rank | Party: Solo',
    'Injuries: Arm cut — Treated | Condition: Mana Fatigue, Hungry', 'Training: Water Magic → Saint (2/40 sessions)',
    'Canon Ledger: The rescue succeeded', 'Active Paths: Rescue — Complete', 'Present: Roxy',
    'Narrative Mode: Storyteller, Strict Agency', '***', 'The room is quiet.'].join('\n');
const visual = hud.replace('### WORLD STATE ###', '### 🌐 WORLD STATE ###').split('\n').map(line =>
    /^[A-Za-z][^:]*:/.test(line) ? '🌐 ' + line.replace(/(^| \| )([^:|]+):/g, '$1**$2:**').replace(/ \| /g, ' · ') : line).join('\n');
const failures = [];
let passed = 0;
async function check(name, fn) {
    try { await fn(); passed++; } catch (error) { failures.push(`${name}: ${error.message.slice(0, 240)}`); }
}
(async () => {
    A.init(book.originalData.entries, card.data.description);
    for (const [style, text] of [['Classic', hud], ['Visual', visual]]) {
        await check(`${style}: current contract survives actual reply processing`, async () => assert.equal(await A.process(text), text));
        await check(`${style}: separate curses and both eyes`, () => {
            const w = A.world(text);
            assert.equal(w.eyes.length, 2);
            assert.equal(w.eyes[0].text, 'Foresight — Left');
            assert.equal(w.marks[0].name, 'None');
            assert.equal(w.marks.length, 2);
            assert.equal(w.marks[1].name, 'Quickening');
        });
        await check(`${style}: secondary Condition field`, () => assert.deepEqual(Array.from(A.conditions(text), x => x.text), ['Mana Fatigue', 'Hungry']));
        await check(`${style}: explicit Solo affiliation`, () => {
            assert.equal(A.world(text).adventurer.rank, 'F');
            assert.equal(A.world(text).adventurer.solo, true);
        });
        await check(`${style}: no imaginary injury named None`, () => assert.equal(A.wounds(text.replace('Arm cut — Treated', 'None')).length, 0));
        await check(`${style}: unresolved wound remains treated`, () => {
            assert.equal(A.wounds(text)[0].name, 'Arm cut');
            assert.equal(A.wounds(text)[0].cls, 'treated');
        });
    }
    await check('Visual death flag remains visible', () => assert.equal(A.flags(visual.replace('***', '💀 [STATUS: Deceased]\n***'))[0].name, 'Deceased'));
    await check('bare and exceptional guild ranks remain readable', () => { for (const rank of ['F','SS']) assert.equal(A.world(hud.replace('F-Rank', rank)).adventurer.rank, rank); });
    await check('reporter cannot impose legacy session math', () => assert.equal(A.sessions(hud, hud), null));
    await check('bot owns injuries before first injury', () => assert.equal(A.owns(), true));
    await check('cleared states never restored from older HUD', async () => {
        const next = hud.replace('Injuries: Arm cut — Treated | Condition: Mana Fatigue, Hungry\n', '').replace('Inventory: Bandages | Purse: 0 copper\n', '');
        assert.equal(await A.process(next, hud), next);
    });
    await check('conditional future event is not forced by legacy warnings', () => {
        const text = hud.replace('Canon Ledger:', 'World event: Changed event — in 3 months (K416)\nCanon Ledger:');
        assert.equal(A.rules([{id:'m',chat_id:'modern',role:'assistant',content:text}]).length, 0);
    });
    await check('explicit user pins still work', async () => assert.match(await A.pin(hud), /Mana Capacity: Vast \| Reserve: Full/));
    await check('contract rehydrates from attached book after cache reset', () => { A.dropCore(); assert.equal(A.contract('modern'), true); assert.equal(A.contract('unrelated'), false); });
    await check('all scoped activation entries stay host-owned', () => {
        for (const e of book.originalData.entries) if (e.enabled && [...e.keys, ...e.secondary_keys].some(k => k.startsWith('/'))) assert.equal(A.norm(e).narratorHostOnly, true, e.comment);
    });
    for (const [style, text] of [['Classic', hud], ['Visual', visual]]) {
        await check(`${style}: full panel and request with actual standalone lore`, async () => {
            const result = await A.panel(text, card.data.description);
            assert(result.payload.hms, 'panel payload missing');
            assert.equal(result.payload.hms.systems.wounds[0].name, 'Arm cut');
            assert(!result.request.includes('"sessions":'), 'legacy session request');
            assert(!result.request.includes('"injuries":'), 'competing injury simulation');
            assert(!result.injected.includes('Fix one now as'), 'invented birth precision');
            assert(!result.injected.includes('one focused day each'), 'legacy progression injection');
            assert((result.injected.match(/\[RPG Companion: side-panel request\]/g) || []).length <= 1);
        });
    }
    await check('both import representations have identical IDs, content and gates', () => {
        assert.equal(Object.keys(book.entries).length, book.originalData.entries.length);
        for (const entry of book.originalData.entries) {
            const outer = book.entries[String(entry.id)];
            assert(outer, `missing ${entry.id}`);
            assert.equal(entry.content, outer.content, `content ${entry.id}`);
            assert.deepEqual(entry.keys, outer.key, `keys ${entry.id}`);
            assert.deepEqual(entry.secondary_keys, outer.keysecondary, `secondary ${entry.id}`);
            assert.equal(entry.enabled, !outer.disable, `enabled ${entry.id}`);
        }
    });
    await check('all activation regular expressions compile', () => {
        for (const entry of book.originalData.entries) for (const key of [...entry.keys, ...entry.secondary_keys]) {
            if (!key.startsWith('/')) continue;
            const end = key.lastIndexOf('/');
            assert(end > 0, `malformed regex ${entry.id}`);
            new RegExp(key.slice(1, end), key.slice(end + 1));
        }
    });
    await check('disabled ST entry never enters reference catalog', () => assert.equal(A.norm({...book.entries['41'],disable:true}), null));
    console.log(`${passed} Six-Sided 1.5 checks passed; ${failures.length} failed`);
    for (const failure of failures) console.error(failure);
    process.exitCode = failures.length ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
