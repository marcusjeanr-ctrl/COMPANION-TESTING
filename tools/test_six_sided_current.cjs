const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '../dist/backend.js'), 'utf8');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout,
    setInterval, clearInterval, performance, spindle: new Proxy({}, { get: (_, key) => key === 'log' ? quiet :
        new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(source.slice(0, source.indexOf('// ───────────────────────────── Startup')) + `
globalThis.api = {
    init: core => { if (typeof sixNoteCard === 'function') sixNoteCard('current', core);
        chatApi.getMessages = async () => []; getChatState = async () => emptyChatState(); },
    process: async text => (await hmsProcessContent('current', text, null, 'normal', {})).content,
    world: text => worldMushoku('current', worldLines(parseHud(text)), {}),
    systems: text => hmsReadSystems(parseHud(text)),
    checks: text => { const chat = [{id:'m',chat_id:'current',role:'assistant',content:text}];
        return hmsChecks(chat, emptyChatState(), {}, 'Tester', 'current'); },
    reminders: text => hmsStoryReminders([{id:'m',chat_id:'current',role:'assistant',content:text}], emptyChatState(), 'Tester'),
  panel: async (text, core) => {
    const chat = [{id:'u',chat_id:'current',role:'user',content:'I wait.'},
      {id:'m',chat_id:'current',role:'assistant',content:text,swipe_id:0}];
    chatApi.getMessages = async () => chat;
    let state = emptyChatState(), payload = null;
    getChatState = async () => state; saveChatState = async (_, next) => { state = next; };
    userNameCache.set('current', 'Tester'); getUserName = async () => 'Tester'; healRecent = async () => false;
    toFrontend = p => { if (p?.type === 'state') payload = p; };
    hmsCache.delete('current'); await pushState('current');
    const request = buildCompanionInstruction({}, 'Tester', {}, null, chat, true);
    const messages = [{role:'system',content:core}, ...chat.map(m => ({...m,__isChatHistory:true}))];
    const result = await rpgcInterceptor(messages, {chatId:'current',generationType:'normal'});
    const arr = Array.isArray(result) ? result : result?.messages || [];
    return {payload: JSON.parse(JSON.stringify(payload)), request,
      injected: arr.filter(m => !messages.some(p => p.content === m.content)).map(m => textOf(m.content)).join('\\n')};
  },
    norm: loreNormEntry,
    request: text => buildCompanionInstruction({}, 'Tester', {}, null, [{id:'m',chat_id:'current',role:'assistant',content:text}], true),
    sessions: (text, prev) => sixTrainingFromSessions(text, parseHud(prev), [{skill:'Water Magic',count:2,teacher:true}]),
    notes: (id, core) => sixNoteCard(id, core),
    active: (id, text) => sixCurrentCard(id, parseHud(text)),
    view: text => { const h = parseHud(text); const before = JSON.stringify(h); const v = sixPanelHud(h); return {unchanged:before === JSON.stringify(h),same:v === h}; },
    detect: core => typeof sixCurrentCore === 'function' && sixCurrentCore(core),
    pin: async text => { getChatState = async () => ({...emptyChatState(),pins:{'mana capacity':{text:'Mana Capacity: Vast | Reserve: Full | Status: Rested'}}});
        const result = await hmsProcessContent('current', text, null, 'normal', {});
        getChatState = async () => emptyChatState(); return result.content; }
};`, ctx);
const A = ctx.api;
const core = '[WORLD STATE — SINGLE HUD RENDERER]\nActual zero/None/Unavailable values remain valid recorded states.\nCurrent Arc: [current supported title/selector or established custom route]';
const hud = ['### WORLD STATE ###', 'Armored Dragon Calendar: K417, Month 4, Day 12 | Time: 08:30 (Morning)',
    'Location: Central Continent → Asura Kingdom → Fittoa Region → Estate',
    'Race: Human | Origin: Native | Age: 12 (born K404)', 'Current Arc: Sandbox — Exploration',
    'Game Mode: Hard Mode, Blessed Child', 'Mana Capacity: Modest | Reserve: Low | Status: Mana Fatigue',
    'Touki (Battle Aura): Active', 'Sword Style: Sword God (Advanced)', 'Magic Tiers: Water (Advanced)',
    'Casting Method: Voiceless (Water only)', 'Voiceless Casting: Water only', 'Languages: Human Tongue (Fluent, reads)',
    'Contracts: None', 'Active Stance: Neutral', 'DEMON EYE: Foresight — Left | DEMON EYE: Magic Power — Right',
    'Curse: None | Blessing: Quickening', 'Dream Link: Apostle', 'Term: 1 | Role: Student',
    'Equipment: Ash wand', 'Inventory: Bandages | Purse: 0 copper', 'Adventurer: F | Party: Solo',
    'Injuries: Arm cut — Treated | Condition: Mana Fatigue, Hungry', 'Training: Water Magic → Saint (2/40 sessions)',
    'Canon Ledger: The rescue succeeded', 'Active Paths: Rescue — Complete', 'Present: Roxy',
    'Narrative Mode: Storyteller, Strict Agency', '***', 'The room is quiet.'].join('\n');
const visual = hud.replace('### WORLD STATE ###', '### 🌐 WORLD STATE ###').split('\n').map(line =>
    /^[A-Za-z][^:]*:/.test(line) ? '🌐 ' + line.replace(/(^| \| )([^:|]+):/g, '$1**$2:**').replace(/ \| /g, ' · ') : line).join('\n');
let passed = 0;
const failures = [];
async function check(name, fn) { try { await fn(); passed++; } catch (e) { failures.push(name + ': ' + e.message.slice(0, 180)); } }
(async () => {
    A.init(core);
    if (process.env.SIX_BENCH) {
        for (let i=0;i<50;i++) await A.process(hud);
        const start=performance.now();
        for (let i=0;i<500;i++) { await A.process(hud); A.systems(hud); }
        console.log(JSON.stringify({iterations:500,ms:performance.now()-start})); return;
    }
    for (const [style, text] of [['Classic', hud], ['Visual', visual]]) {
        await check(style + ' preserves authored HUD', async () => assert.equal(await A.process(text), text));
        await check(style + ' reads separate curses and eyes', () => {
            const w = A.world(text); assert.equal(w.eyes.length, 2); assert.equal(w.eyes[0].text, 'Foresight — Left');
            assert.equal(w.marks[0].name, 'None'); assert.equal(w.marks[1].name, 'Quickening');
        });
        await check(style + ' reads bare guild rank and Solo', () => { const w = A.world(text); assert.equal(w.adventurer.rank, 'F'); assert.equal(w.adventurer.solo, true); });
        await check(style + ' reads secondary conditions and treated wound', () => {
            const s = A.systems(text); assert.deepEqual(Array.from(s.conditions, x => x.text), ['Mana Fatigue', 'Hungry']);
            assert.equal(s.wounds[0].name, 'Arm cut'); assert.equal(s.wounds[0].cls, 'treated');
        });
        await check(style + ' ignores explicit no-injury value', () => assert.equal(A.systems(text.replace('Arm cut — Treated', 'None')).wounds.length, 0));
        await check(style + ' retains visible death flag', () => assert.equal(A.systems(text.replace('***', '💀 [STATUS: Deceased]\n***')).flags[0].name, 'Deceased'));
        await check(style + ' does not impose old progression or unknown births', () => {
            assert(!A.checks(text).some(x => /session|birth year|cap at age/i.test(x.text)));
            assert(!A.reminders(text).parts.join('\n').includes('Fix one now'));
        });
    }
    await check('explicit player pins still apply', async () => assert.match(await A.pin(hud), /Mana Capacity: Vast \| Reserve: Full/));
    await check('card recognition excludes unrelated/legacy cores', () => { assert(A.detect(core)); assert(!A.detect('Six-Sided World legacy')); assert(!A.detect('[WORLD STATE] Cyberpunk')); });
    for (const [style, text] of [['Classic', hud], ['Visual', visual]]) {
        await check(style + ' full panel and deduplicated request', async () => {
            const r = await A.panel(text, core); assert(r.payload.hms);
            assert.equal(r.payload.hms.systems.wounds[0].name, 'Arm cut');
            assert(!r.request.includes('"sessions":'));
            assert(!r.injected.includes('Fix one now'));
            assert((r.injected.match(/\[RPG Companion: side-panel request\]/g) || []).length <= 1);
        });
    }
    await check('reporter keeps tracking requests without old session formula', () => {
        const request = A.request(hud); assert(!request.includes('"sessions":')); assert(request.includes('"quests":'));
    });
    await check('legacy report sessions cannot rewrite current HUD', () => assert.equal(A.sessions(hud, hud), null));
    await check('panel adaptation leaves parsed HUD untouched', () => assert(A.view(hud).unchanged));
    await check('other-world panel identity is unchanged', () => assert(A.view('### WORLD STATE ###\nYear: 2077 | Time: 12:00\nLocation: Night City\n***\nQuiet.').same));
    await check('switching cards resets scoped activation', () => {
        A.notes('switch', core); assert(A.active('switch', hud)); A.notes('switch', 'Legacy WORLD STATE'); assert(!A.active('switch', hud));
        assert(A.active('reloaded', hud));
    });
    await check('only designated Six-Sided lore uses host-only activation', () => {
        assert(A.norm({content:'Lore',key:['test'],extensions:{six_sided_host_activation:true}}).narratorHostOnly);
        assert(!A.norm({content:'Lore',key:['test']}).narratorHostOnly);
    });
    await check('lore converter preserves gates and literal punctuation', () => {
        const {prepare} = require('./prepare_six_sided_lore.cjs');
        const entry={uid:1,key:['/magic/i','[MT-ARC:2-B]'],keysecondary:[],content:'Lore',disable:false,constant:false,selective:false,order:9,position:1,extensions:{}};
        const book={entries:{'1':entry},originalData:{entries:[{id:1,keys:entry.key,secondary_keys:[],content:'Lore',enabled:true,extensions:{}}]}};
        const r=prepare(book); assert.equal(r.changed,1); assert.equal(r.book.entries['1'].key[0],'magic');
        assert(new RegExp(r.book.entries['1'].key[1],'i').test('[MT-ARC:2-B]'));
        assert(!new RegExp(r.book.entries['1'].key[1],'i').test('MT-ARC:2-B'));
        assert.equal(entry.key[0],'/magic/i');
    });
    if (process.env.SIX_CARD) await check('unaltered uploaded card is recognized', () => assert(A.detect(JSON.parse(fs.readFileSync(process.env.SIX_CARD)).data.description)));
    console.log(`${passed} current Six-Sided checks passed; ${failures.length} failed`);
    failures.forEach(x => console.error(x)); process.exitCode = failures.length ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
