// Smoke test: the backend builds a full panel payload and a model request from a synthetic
// Six-Sided-style chat, and the real frontend renders every panel from it without errors.
// Synthetic data only. Run: node tools/test_smoke.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const quiet = { log() {}, warn() {}, error() {}, info() {} };

// ── a synthetic chat: WORLD STATE HUD in the Six-Sided format, and one report per system ──
const hud = (time, place) => `### WORLD STATE ###
Armored Dragon Calendar: K417, Month 4, Day 12 | Time: ${time} (Morning)
◆ Central Continent → Asura Kingdom → Fittoa Region → ${place}
Race: Human | Origin: Native | Age: 13 (born K404, Month 2)
Sandbox: Fittoa Region — K417 (canon: Arc 2.5)
Mana Capacity: Vast | Reserve: Full | Status: Rested
Touki (Battle Aura): Inactive
Sword Style: Sword God (Advanced)
Magic Tiers: Water (Advanced), Earth (Intermediate)
Voiceless Casting: Active
Equipment: Plain tunic (worn)
***
`;
let n = 0;
const user = text => ({ id: `u${++n}`, role: 'user', is_user: true, name: 'Test Hero', swipe_id: 0, content: text });
const reply = (time, place, prose, data) => ({ id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: 0, content: hud(time, place) + prose,
    extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data } } } } });
const quest = (objective, progress) => [{ key: 'the long road', questId: 'q_road', name: 'The Long Road', objective, progress, giver: 'Old Mentor',
    reward: 'A letter of passage', category: 'main', state: 'active', cls: 'active' }];
const chat = [
    user('Start'),
    reply('09:00', 'Test Hall', 'The Old Mentor waits in the courtyard. "We leave in two days," he says. You drove the dummy back with clean footwork.', {
        characters: [{ name: 'Old Mentor', emoji: '🧙', details: { appearance: 'grey robes', demeanor: 'patient' }, thoughts: { content: 'He is ready.' } }],
        relations: [{ key: 'old mentor', name: 'Old Mentor', standing: 'Friend', bond: 'teacher, Friend', minor: false, mood: 'patient', why: null }],
        family: [], quests: quest('Earn the mentor\'s approval in the courtyard', 60),
        agenda: [{ key: 'leave for the road', what: 'Leave for the road', with: 'Old Mentor', where: 'Test Hall gate', when: 'In two days', due: 'K417-04-14', kind: 'event', state: 'open' }],
        gear: [{ key: 'travel pack', name: 'travel pack', state: 'on body', where: 'back', inside: null }, { key: 'map', name: 'map', state: 'on body', where: 'study desk', inside: null }],
        survival: { mood: 'focused', spells: ['Water Ball', 'Ice Blade'], learned: [], mastered: [], got: ['travel pack'], lost: [],
            study: [{ spell: 'Ice Blade', progress: null, note: 'reviewed the blade diagrams · 3 more practical casts left' }],
            abilities: [{ name: 'Sword God Style', owner: 'you', state: 'reliable', historical: false, evidence: 'drove the dummy back with clean footwork' }] },
        plot: { now: 'Preparing to leave with the Old Mentor.', threads: [{ name: 'The road', state: 'open', note: 'Departure in two days.' }], canonEvents: [] },
        learned: [{ who: 'Old Mentor', fact: 'The hero is ready to travel', how: 'saw', from: null, sure: 'certain' }],
    }),
    user('I pack.'),
    reply('09:20', 'Test Hall', 'You pack the map and check the straps.', {
        characters: [], relations: [], quests: quest('Pack for the road', 20),
        gear: [{ key: 'travel pack', name: 'travel pack', state: 'on body', where: 'back', inside: null }],
        survival: { mood: 'calm', spells: ['Water Ball', 'Ice Blade'], learned: [], mastered: [], study: [], abilities: [] },
    }),
];
const lore = [
    { id: 'l1', comment: '[Spell] Water Ball', content: '[SPELL — Water Ball]\nSchool: Water · Rank: Beginner\nEffect: A sphere of water.', key: ['Water Ball'] },
    { id: 'l2', comment: '[Spell] Ice Blade', content: '[SPELL — Ice Blade]\nSchool: Water · Rank: Beginner\nEffect: A blade of ice.', key: ['Ice Blade'] },
    { id: 'l3', comment: '[Spell] Stone Cannon', content: '[SPELL — Stone Cannon]\nSchool: Earth · Rank: Intermediate\nEffect: A launched stone.', key: ['Stone Cannon'] },
];

// ── backend: payload + request ──
const backendSource = fs.readFileSync(path.join(root, 'dist', 'backend.js'), 'utf8');
const startup = backendSource.indexOf('// ───────────────────────────── Startup');
assert(startup > 0, 'backend startup marker missing');
const bctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
bctx.globalThis = bctx;
vm.createContext(bctx);
vm.runInContext(backendSource.slice(0, startup) + `
globalThis.__hooks = (chat, lore, user) => {
  chatApi.getMessages = async () => chat;
  getChatState = async () => ({}); saveChatState = async () => {};
  getUserName = async () => { userNameCache.set('c1', user); return user; }; userNameCache.set('c1', user);
  healRecent = async () => false;
  const pool = { entries: lore }; loreCatalogPool = () => pool;
  globalThis.__state = null; toFrontend = p => { if (p && p.type === 'state') globalThis.__state = p; };
  return { push: () => pushState('c1'), intercept: (m, c) => rpgcInterceptor(m, c) };
};`, bctx);

(async () => {
    const api = bctx.__hooks(chat, lore, 'Test Hero');
    await api.push();
    const state = bctx.__state;
    assert(state && state.hms && state.hms.active !== false, 'backend produced no HMS payload');
    const h = state.hms, sys = h.systems;
    assert.equal(h.hud && h.hud.location && h.hud.location.at(-1), 'Test Hall', 'HUD location read');
    const q = sys.quests.find(x => x.key === 'q_road');
    assert.equal(q.objective, 'Pack for the road', 'quest follows its current stage');
    assert.equal(h.relations.people[0].bond, 'teacher', 'standing copy removed from bond');
    assert.equal(h.agenda.items.length, 1, 'one agenda entry');
    const map = h.gear.items.find(i => i.name === 'map');
    assert.equal(map.state, 'stowed', 'on body + desk reads as left there');
    const iceBlade = h.magic.list.schools.flatMap(g => g.spells).find(s => s.name === 'Ice Blade');
    assert.equal(iceBlade.status, 'known');
    assert.match(iceBlade.note || '', /practical casts left/, 'known spell keeps its practice note');

    const prompt = [{ role: 'system', content: 'You are the game master.' }, ...chat.map(m => ({ role: m.role, content: m.content, __isChatHistory: true }))];
    let out = await api.intercept(prompt, { chatId: 'c1', generationType: 'normal' });
    out = Array.isArray(out) ? out : out.messages;
    const added = out.filter(m => !m.__isChatHistory && !prompt.some(p => p.content === m.content));
    assert(added.length >= 1, 'the side-panel request is injected');
    const text = added.map(m => m.content).join('\n');
    assert.equal(text.split('[RPG Companion: side-panel data]').length - 1, 1, 'the side-panel request is injected exactly once');
    let again = await api.intercept(out, { chatId: 'c1', generationType: 'normal' });
    again = Array.isArray(again) ? again : again.messages;
    assert.equal(again.length, out.length, 'a second pass over the same request adds nothing');

    // ── frontend: render every view from that payload ──
    class El {
        constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = []; this.dataset = {}; this.attributes = {}; this.style = { setProperty() {}, removeProperty() {} };
            this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false }; this.textContent = ''; this.open = false; }
        get childNodes() { return this.children; }
        appendChild(c) { if (c) { this.children.push(c); c.parentElement = this; } return c; }
        append(...c) { c.forEach(x => this.appendChild(typeof x === 'string' ? { textContent: x } : x)); }
        prepend(...c) { this.append(...c); }
        replaceChildren(...c) { this.children = []; this.append(...c); }
        insertBefore(c) { return this.appendChild(c); }
        removeChild(c) { this.children = this.children.filter(x => x !== c); return c; }
        replaceWith() {} remove() {} before() {} after() {}
        setAttribute(k, v) { this.attributes[k] = v; } getAttribute(k) { return this.attributes[k] ?? null; } removeAttribute(k) { delete this.attributes[k]; } hasAttribute(k) { return k in this.attributes; }
        addEventListener() {} removeEventListener() {} dispatchEvent() { return true; }
        querySelector() { return null; } querySelectorAll() { return []; } closest() { return null; } contains() { return false; }
        getBoundingClientRect() { return { top: 0, left: 0, width: 300, height: 20, right: 300, bottom: 20 }; }
        focus() {} blur() {} click() {} scrollIntoView() {} getContext() { return null; }
        get innerHTML() { return ''; } set innerHTML(v) { this.children = []; }
        get firstChild() { return this.children[0] || null; } get lastChild() { return this.children.at(-1) || null; }
        get parentNode() { return this.parentElement || null; }
        cloneNode() { return new El(this.tagName); }
    }
    const textOfTree = node => !node ? '' : (node.textContent || '') + ' ' + (node.children || []).map(textOfTree).join(' ');
    const doc = { createElement: t => new El(t), createElementNS: (_, t) => new El(t), createTextNode: t => ({ textContent: String(t) }),
        createDocumentFragment: () => new El('fragment'), documentElement: new El('html'), body: new El('body'), head: new El('head'),
        querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, getElementById: () => null };
    const tabRoot = new El('div');
    let receive = null;
    const hostCtx = {
        dom: { addStyle: () => () => {} },
        ui: { registerDrawerTab: () => ({ root: tabRoot, activate() {}, destroy() {}, setBadge() {} }), registerInputBarAction: () => ({ onClick() {}, setEnabled() {}, destroy() {} }),
            showConfirm: async () => false },
        sendToBackend() {}, onBackendMessage: fn => { receive = fn; return () => {}; },
        getActiveChat: () => ({ chatId: 'c1', characterId: 'x' }), events: { on: () => () => {} },
    };
    const storage = new Map();
    const fctx = vm.createContext({ console: quiet, document: doc, window: {}, navigator: { language: 'en' }, ctx: hostCtx, URL, Blob: class {},
        localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) },
        setTimeout: (fn) => { try { fn(); } catch (e) { throw e; } return 1; }, clearTimeout() {}, setInterval: () => 1, clearInterval() {}, requestAnimationFrame: fn => 1,
        MutationObserver: class { observe() {} disconnect() {} }, ResizeObserver: class { observe() {} disconnect() {} },
        getComputedStyle: () => ({ getPropertyValue: () => '' }), matchMedia: () => ({ matches: false, addEventListener() {} }) });
    const frontendSource = fs.readFileSync(path.join(root, 'dist', 'frontend.js'), 'utf8').replace(/^export function setup/m, 'function setup');
    vm.runInContext(frontendSource + '\nsetup(ctx);', fctx);
    assert(receive, 'frontend registered no backend handler');
    receive(JSON.parse(JSON.stringify(state)));
    const rendered = textOfTree(tabRoot);
    // Optional, local only: also render real payloads (never committed), e.g. SMOKE_PAYLOADS=a.json,b.json
    for (const file of (process.env.SMOKE_PAYLOADS || '').split(',').filter(Boolean)) {
        const real = JSON.parse(fs.readFileSync(file, 'utf8'));
        receive({ type: 'state', chatId: 'c1', settings: state.settings, ...real, hms: real.hms || real });
        assert(textOfTree(tabRoot).length > 200, `real payload ${path.basename(file)} rendered nothing`);
        console.log(`  rendered real payload ${path.basename(file)}: ${textOfTree(tabRoot).length} chars of panel text`);
    }
    for (const title of ['Quests', 'Gear', 'Agenda']) assert(rendered.includes(title), `panel "${title}" did not render`);
    assert(rendered.includes('Pack for the road'), 'quest objective rendered');
    assert(rendered.includes('Ice Blade'), 'magic panel rendered');
    console.log('smoke: backend payload, request (injected once) and frontend render all passed');
})().catch(e => { console.error('smoke FAILED:', e.stack || e); process.exitCode = 1; });
