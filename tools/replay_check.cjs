// Long-run replay: feeds a real chat export to the backend one reply at a time, the way a session grows,
// and after every reply checks that the trackers and the narrator request stay consistent.
// Local only — chat exports are private and never committed.
//   node tools/replay_check.cjs path/to/chat_export.json ["Persona name"] [card.json]
// Prints one line per problem and a summary. Exit code 1 when a problem is found.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const [file, persona = null, cardFile = null] = process.argv.slice(2);
if (!file) { console.error('usage: node tools/replay_check.cjs <chat_export.json> [persona name] [card.json]'); process.exit(2); }
const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
const msgs = (exp.messages || exp).map(m => ({ ...m, role: m.role || (m.is_user ? 'user' : 'assistant') }));
const user = persona || msgs.find(m => m.is_user)?.name || 'Player';
let lore = [];
if (cardFile) { const c = JSON.parse(fs.readFileSync(cardFile, 'utf8')); lore = ((c.data || c).character_book?.entries || []).map((e, i) => ({ id: String(e.id ?? i), comment: e.comment || e.name || '', content: e.content || '', key: e.keys || e.key || [] })); }

const quiet = { log() {}, warn() {}, error() {}, info() {} };
const src = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = src.indexOf('// ───────────────────────────── Startup');
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(src.slice(0, startup) + `
globalThis.__api = (lore, user) => { let chat = [];
  chatApi.getMessages = async () => chat; getChatState = async () => ({}); saveChatState = async () => {};
  getUserName = async () => { userNameCache.set('c1', user); return user; }; userNameCache.set('c1', user); healRecent = async () => false;
  const pool = { entries: lore }; loreCatalogPool = () => pool; let last = null; toFrontend = p => { if (p && p.type === 'state') last = p; };
  return { set: c => { chat = c; }, push: async () => { last = null; await pushState('c1'); return last; },
    intercept: (m) => rpgcInterceptor(m, { chatId: 'c1', generationType: 'normal' }), chron: () => chroniclePayload('c1'), key: lockKey }; };`, ctx);
const api = ctx.__api(lore, user);

const problems = [];
const flag = (turn, what) => problems.push(`reply ${turn}: ${what}`);
const firstWord = String(user).toLowerCase().split(/\s+/)[0];
const times = [];
let reqChars = 0;

(async () => {
    const replies = msgs.map((m, i) => [m, i]).filter(([m]) => m.role === 'assistant').map(([, i]) => i);
    for (const [n, end] of replies.entries()) {
        const chat = msgs.slice(0, end + 1);
        api.set(chat);
        const t0 = performance.now();
        let st;
        try { st = await api.push(); } catch (e) { flag(n, `panel build threw: ${e.message}`); continue; }
        const h = st?.hms || {};
        // Agenda: one live entry per appointment title
        const live = (h.agenda?.items || []).filter(x => ['open', 'in_progress'].includes(x.state));
        const seen = new Map(); for (const x of live) { const k = api.key(x.what); if (seen.has(k)) flag(n, `Agenda lists "${x.what}" twice while it is live`); seen.set(k, 1); }
        // Quests: no two live quests with the same name
        const qs = (h.systems?.quests || []).filter(q => !['done', 'failed', 'ended', 'hidden'].includes(q.cls));
        const qn = new Map(); for (const q of qs) { const k = api.key(q.name); if (qn.has(k)) flag(n, `two live quests named "${q.name}"`); qn.set(k, 1); }
        // Gear: an item listed once
        const gk = new Map(); for (const g of h.gear?.items || []) { if (gk.has(g.key)) flag(n, `Gear lists "${g.name}" twice`); gk.set(g.key, 1); }
        // People / Minds: the player is never tracked as a second person
        for (const p of h.minds?.people || []) {
            if (api.key(p.name).split(' ')[0] === firstWord && api.key(p.name).startsWith(api.key(user))) flag(n, `Minds tracks the player as a person: "${p.name}"`);
            for (const q of p.pairs || []) if (!q.you && api.key(q.toName || '').startsWith(api.key(user))) flag(n, `${p.name} has feelings toward "${q.toName}" apart from you`);
        }
        for (const p of h.relations?.people || []) if (api.key(p.name).startsWith(api.key(user) + ' ') || api.key(p.name) === api.key(user)) flag(n, `People lists the player as "${p.name}"`);
        // Narrator request: injected once, no repeated lines
        // the request this reply feeds: the history up to and including your next message
        if (!msgs[end + 1] || msgs[end + 1].role !== 'user') { times.push(performance.now() - t0); continue; }
        const prompt = [{ role: 'system', content: 'GM' }, ...msgs.slice(0, end + 2).map(m => ({ role: m.role, content: m.content, __isChatHistory: true }))];
        let out;
        try { out = await api.intercept(prompt); } catch (e) { flag(n, `request build threw: ${e.message}`); continue; }
        out = Array.isArray(out) ? out : out.messages;
        const added = out.filter(m => !m.__isChatHistory && !prompt.some(p => p.content === m.content)).map(m => m.content).join('\n');
        const blocks = added.split('[RPG Companion: side-panel data]').length - 1;
        if (h.hud ? blocks !== 1 : blocks > 1) flag(n, `side-panel request injected ${blocks} times`); // before the first HUD (a start handler) nothing is asked
        const lines = added.split('\n').map(l => l.trim()).filter(l => l.length > 40);
        const dup = lines.filter((l, i) => lines.indexOf(l) !== i);
        for (const l of [...new Set(dup)]) flag(n, `the narrator request repeats a line: "${l.slice(0, 90)}…"`);
        reqChars = added.length;
        times.push(performance.now() - t0);
    }
    // Chronicle over the whole chat: the same beat in consecutive replies
    api.set(msgs);
    const ch = await api.chron();
    const words = t => new Set(api.key(t).split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3));
    const moments = (ch?.entries || []).filter(e => e.kind === 'moment' && !e.hidden);
    for (let i = 1; i < moments.length; i++) {
        const a = words(moments[i - 1].text), b = words(moments[i].text); let k = 0; for (const w of a) if (b.has(w)) k++;
        if (k >= 4 && k / Math.min(a.size, b.size) >= 0.7) flag(moments[i].replyIndex, `Chronicle repeats a moment: "${moments[i].text.slice(0, 80)}"`);
    }
    const uniq = [...new Set(problems)];
    for (const p of uniq) console.log('  ✗ ' + p);
    const avg = times.reduce((a, b) => a + b, 0) / Math.max(1, times.length), max = Math.max(0, ...times);
    console.log(`replayed ${times.length} replies as "${user}": ${uniq.length} problem(s); panel+request ${avg.toFixed(0)} ms avg, ${max.toFixed(0)} ms max; last request ${reqChars} chars (~${Math.round(reqChars / 4)} tokens)`);
    process.exitCode = uniq.length ? 1 : 0;
})().catch(e => { console.error('replay failed:', e.stack || e); process.exitCode = 2; });
