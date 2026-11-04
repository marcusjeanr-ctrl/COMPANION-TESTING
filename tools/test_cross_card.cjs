// Cross-card integration: every built-in demo world (Re:Zero, Overlord, Classroom of the Elite, Mushoku,
// Undertale, Dark Souls, Skyrim, Classic) is played through the REAL reply pipeline (rpgcGenEnded: parse,
// HUD guard, swipe save) turn by turn, then the panels, World State checks and the narrator request are read.
// It shows the Six-Sided work did not overfit: no thrown errors, no error status, no Six-Sided-only warning or
// reminder on another card, the side-panel request once, no line repeated, nothing listed twice.
// Run: node tools/test_cross_card.cjs   (TURNS=n for more turns)
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const src = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = src.indexOf('// ───────────────────────────── Startup');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const store = new Map();
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : k === 'storage' ? { getJson: async (f, o) => store.has(f) ? structuredClone(store.get(f)) : (o && 'fallback' in o ? o.fallback : null), setJson: async (f, v) => { store.set(f, structuredClone(v)); }, get: async () => null, set: async () => {} }
        : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(src.slice(0, startup) + `
globalThis.__x = {
  worlds: () => Object.keys(SANDBOX_WORLDS),
  start: async (world) => { const states = new Map(); getChatState = async (id) => { if (!states.has(id)) states.set(id, emptyChatState()); return states.get(id); }; saveChatState = async (id, s) => { states.set(id, s); };
    getUserName = async () => { userNameCache.set(SANDBOX_ID, 'Tester'); return 'Tester'; }; userNameCache.set(SANDBOX_ID, 'Tester'); healRecent = async () => false;
    globalThis.__status = []; const ss = setStatus; setStatus = (id, kind, text) => { globalThis.__status.push([kind, text]); };
    globalThis.__last = null; toFrontend = p => { if (p && p.type === 'state') globalThis.__last = p; };
    spindle.generate = { quiet: async () => ({ content: '' }) };
    await sandboxStart({ world, mode: 'demo' }); },
  turn: async (text) => { sandbox.messages.push({ id: 'tz' + (++sandbox.seq), role: 'user', content: text, swipe_id: 0, metadata: {} }); await sandboxGenerate(); },
  state: async () => { await pushState(SANDBOX_ID); return globalThis.__last; },
  request: async () => { const msgs = [{ role: 'system', content: 'GM' }, ...sandbox.messages.map(m => ({ role: m.role, content: textOf(m.content), __isChatHistory: true })), { role: 'user', content: 'I look around.', __isChatHistory: true }];
    const out = await rpgcInterceptor(msgs, { chatId: SANDBOX_ID, generationType: 'normal' }); return { msgs, out: Array.isArray(out) ? out : out && out.messages || [] }; },
  status: () => globalThis.__status, key: lockKey, hasHud: () => sandbox.messages.some(m => m.role === 'assistant' && parseHud(textOf(m.content)))
};`, ctx);
const x = ctx.__x;
const SIX = /Training line|Training: |age cap|birth year|keep the HUD with the story|Condition line|card's count/i;
const problems = [], seen = [];
(async () => {
    const turns = Number(process.env.TURNS) || 6;
    for (const w of x.worlds()) {
        const flag = what => problems.push(`${w}: ${what}`);
        try { await x.start(w); for (let i = 0; i < turns; i++) await x.turn(i % 2 ? 'I keep going.' : 'I look around and act.'); }
        catch (e) { flag(`a demo turn threw: ${e.message}`); continue; }
        let st; try { st = await x.state(); } catch (e) { flag(`the panels threw: ${e.message}`); continue; }
        for (const [kind, text] of x.status()) if (kind === 'error') flag(`error status: ${text}`);
        const h = st && st.hms;
        if (!h) { if (w === 'classic' && st) { seen.push(`${w}: ${turns} turns, no HUD world (classic panels only)`); continue; } flag('no panel payload'); continue; }
        if (process.env.SHOW) console.log(w, JSON.stringify((h.checks || []).map(c => c.kind + ': ' + c.text)));
        const mush = w === 'mushoku';
        for (const c of h.checks || []) if (!mush && SIX.test(c.text)) flag(`a Six-Sided warning on another card: ${c.text}`);
        const gk = new Set(); for (const g of h.gear?.items || []) { if (gk.has(g.key)) flag(`Gear lists "${g.name}" twice`); gk.add(g.key); }
        const live = (h.agenda?.items || []).filter(a => ['open', 'in_progress'].includes(a.state)); const ak = new Set();
        for (const a of live) { const k = x.key(a.what); if (ak.has(k)) flag(`Agenda lists "${a.what}" twice`); ak.add(k); }
        let req; try { req = await x.request(); } catch (e) { flag(`the narrator request threw: ${e.message}`); continue; }
        const added = req.out.filter(m => !m.__isChatHistory && !req.msgs.some(p => p.content === m.content)).map(m => m.content).join('\n');
        const blocks = added.split('[RPG Companion: side-panel data]').length - 1;
        if (blocks > 1) flag(`side-panel request injected ${blocks} times`);
        if (!mush && /keep the HUD with the story/.test(added) && /Condition line/.test(added)) flag('a Six-Sided Condition reminder on another card');
        const lines = added.split('\n').map(l => l.trim()).filter(l => l.length > 40);
        for (const l of new Set(lines.filter((l, i) => lines.indexOf(l) !== i))) flag(`the request repeats a line: "${l.slice(0, 80)}"`);
        seen.push(`${w}: ${turns} turns, ${h.hud ? h.hud.lines.length : 0} HUD lines, ${(h.checks || []).length} checks, request +${added.length} chars`);
    }
    for (const s of seen) console.log('  ✓ ' + s);
    for (const p of problems) console.log('  ✗ ' + p);
    console.log(problems.length ? `${problems.length} problem(s)` : `all ${seen.length} demo worlds played through the real pipeline cleanly`);
    process.exitCode = problems.length ? 1 : 0;
})().catch(e => { console.error('cross-card run failed:', e.stack || e); process.exitCode = 2; });
