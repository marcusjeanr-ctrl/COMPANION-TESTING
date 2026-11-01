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
        gear: [{ key: 'travel pack', name: 'travel pack', state: 'on body', where: 'back', inside: null }, { key: 'rations', name: 'rations', state: 'in container', where: null, inside: 'travel pack' }],
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
    if (process.env.SMOKE_DUMP) fs.writeFileSync(process.env.SMOKE_DUMP, JSON.stringify(state)); // the synthetic payload, for tools/test_ui.cjs
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
            this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false }; this.textContent = ''; this._open = false; this._ls = {}; }
        get open() { return this._open; }
        set open(v) { v = !!v; if (v === this._open) return; this._open = v; Promise.resolve().then(() => (this._ls.toggle || []).forEach(fn => fn({ target: this }))); }
        get childNodes() { return this.children; }
        appendChild(c) { if (c) { if (c.parentElement && c.parentElement.children) c.parentElement.children = c.parentElement.children.filter(x => x !== c); this.children.push(c); c.parentElement = this; } return c; } // moves, like the DOM
        append(...c) { c.forEach(x => this.appendChild(typeof x === 'string' ? { textContent: x } : x)); }
        prepend(...c) { this.append(...c); }
        replaceChildren(...c) { this.children = []; this.append(...c); }
        insertBefore(c) { return this.appendChild(c); }
        removeChild(c) { this.children = this.children.filter(x => x !== c); return c; }
        replaceWith() {} remove() {} before() {} after() {}
        setAttribute(k, v) { this.attributes[k] = v; if (/^data-/.test(k)) this.dataset[k.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = String(v); } getAttribute(k) { return this.attributes[k] ?? null; } removeAttribute(k) { delete this.attributes[k]; } hasAttribute(k) { return k in this.attributes; }
        addEventListener(t, fn) { (this._ls[t] ||= []).push(fn); } removeEventListener() {} dispatchEvent(e) { (this._ls[e.type] || []).forEach(fn => fn(e)); return true; }
        querySelectorAll(sel) { const m = String(sel).match(/^(\w+)?\.([\w-]+)$/); const out = []; if (!m) return out;
            const walk = n => (n.children || []).forEach(c => { if (c.tagName && (!m[1] || c.tagName === m[1].toUpperCase()) && String(c.className || '').split(/\s+/).includes(m[2])) out.push(c); walk(c); }); walk(this); return out; }
        querySelector(sel) { return this.querySelectorAll(sel)[0] || null; } closest() { return null; } contains() { return false; }
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
    const storage = new Map([['rpgc-view', 'all']]); // 3.5.0: the panel opens on Scene; the checks below cover every card, so use All
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
    const find = (node, pred) => !node ? null : pred(node) ? node : (node.children || []).reduce((hit, c) => hit || find(c, pred), null);
    const bag = find(tabRoot, n => n.tagName === 'DETAILS' && n.dataset && n.dataset.openKey === 'gear-box-travel pack');
    assert(bag, 'container renders as a collapsible group');
    assert.equal(bag.open, true, 'containers start open');
    assert(textOfTree(bag).includes('(1)') && textOfTree(bag).includes('rations'), 'container shows its item count and contents');
    const folded = find(tabRoot, n => n.tagName === 'DETAILS' && n.dataset && /^person-/.test(n.dataset.openKey || ''));
    assert(folded, 'someone not in the scene folds to a header row');
    assert.equal(folded.open, false, 'folded people start closed');
    assert(textOfTree(folded.children[0]).includes('Old Mentor'), 'the folded header shows the name');
    assert(rendered.includes('Collapse all') && rendered.includes('Expand all'), 'collapse/expand all controls render');
    // Magic: rows fold to their header, studying stays visible, no "No retained evidence" noise
    const spellRow = name => find(tabRoot, n => n.tagName === 'DETAILS' && n.dataset && n.dataset.foldKey === 'spell-' + name.toLowerCase());
    const ice = spellRow('Ice Blade'), water = spellRow('Water Ball');
    assert(ice && water, 'spell rows fold');
    assert.equal(water.open, false, 'spell rows start folded');
    assert(textOfTree(ice.children[0]).includes('\uD83D\uDCD6'), 'a spell being studied keeps its study marker on the folded header');
    assert(!rendered.includes('No retained evidence'), 'no "No retained evidence" labels');
    // search opens matches without overwriting what you opened; clearing it restores your state
    const stored = () => JSON.parse(storage.get('rpgc-open-sections') || '{}');
    const tick = () => new Promise(r => setTimeout(r, 0));
    water.open = true; await tick(); await new Promise(r => setTimeout(r, 350));
    assert.equal(stored()['spell-water ball'], true, 'opening a spell is remembered');
    const box = find(tabRoot, n => n.tagName === 'INPUT' && n.attributes && n.attributes.placeholder === 'Find a spell');
    assert(box, 'spell search box');
    box.value = 'ice'; box.dispatchEvent({ type: 'input' }); await tick();
    assert.equal(ice.open, true, 'search opens a match');
    assert.equal(water.open, false, 'search folds a non-match while searching');
    box.value = ''; box.dispatchEvent({ type: 'input' }); await tick(); await new Promise(r => setTimeout(r, 350));
    assert.equal(water.open, true, 'clearing the search restores what you had open');
    assert.equal(ice.open, false, 'clearing the search folds what only the search opened');
    assert.equal(stored()['spell-water ball'], true, 'search never overwrote the remembered state');
    assert.equal(stored()['spell-ice blade'], undefined, 'search-opened rows are not remembered');
    // Optional, local only: also render real payloads (never committed), e.g. SMOKE_PAYLOADS=a.json,b.json
    for (const file of (process.env.SMOKE_PAYLOADS || '').split(',').filter(Boolean)) {
        const real = JSON.parse(fs.readFileSync(file, 'utf8'));
        receive({ type: 'state', chatId: 'c1', settings: state.settings, ...real, hms: real.hms || real });
        assert(textOfTree(tabRoot).length > 200, `real payload ${path.basename(file)} rendered nothing`);
        const all = []; const walk = n => { if (!n) return; if (n.tagName === 'DETAILS' && /^person-/.test(n.dataset?.openKey || '')) all.push(n.dataset.openKey.replace(/^person-n:/, '')); (n.children || []).forEach(walk); }; walk(tabRoot);
        console.log(`  rendered real payload ${path.basename(file)}: ${textOfTree(tabRoot).length} chars of panel text; folded people: ${all.join(', ') || 'none'}`);
    }
    for (const title of ['Quests', 'Gear', 'Agenda']) assert(rendered.includes(title), `panel "${title}" did not render`);
    assert(rendered.includes('Pack for the road'), 'quest objective rendered');
    assert(rendered.includes('Ice Blade'), 'magic panel rendered');
    console.log('smoke: backend payload, request (injected once) and frontend render all passed');
})().catch(e => { console.error('smoke FAILED:', e.stack || e); process.exitCode = 1; });
