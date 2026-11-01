// Behavioural comparison of two backend builds on one real chat: after every reply, the panel data and
// the narrator request each build produces must be identical (version strings aside).
// Local only — chat exports are private.
//   node tools/compare_backends.cjs <old backend.js> <new backend.js> <chat_export.json> [persona] [card.json]
const fs = require('node:fs');
const vm = require('node:vm');
const [oldFile, newFile, file, persona = null, cardFile = null] = process.argv.slice(2);
if (!file) { console.error('usage: node tools/compare_backends.cjs <old backend.js> <new backend.js> <chat_export.json> [persona] [card.json]'); process.exit(2); }
const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
const msgs = (exp.messages || exp).map(m => ({ ...m, role: m.role || (m.is_user ? 'user' : 'assistant') }));
const user = persona || msgs.find(m => m.is_user)?.name || 'Player';
let lore = [];
if (cardFile) { const c = JSON.parse(fs.readFileSync(cardFile, 'utf8')); lore = ((c.data || c).character_book?.entries || []).map((e, i) => ({ id: String(e.id ?? i), comment: e.comment || '', content: e.content || '', key: e.keys || [] })); }
const quiet = { log() {}, warn() {}, error() {}, info() {} };
function load(srcFile) {
    const src = fs.readFileSync(srcFile, 'utf8'), startup = src.indexOf('// ───────────────────────────── Startup');
    const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
        spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
    ctx.globalThis = ctx; vm.createContext(ctx);
    vm.runInContext(src.slice(0, startup) + `
globalThis.__api = (lore, user) => { let chat = [];
  chatApi.getMessages = async () => chat; getChatState = async () => ({}); saveChatState = async () => {};
  getUserName = async () => { userNameCache.set('c1', user); return user; }; userNameCache.set('c1', user); healRecent = async () => false;
  const pool = { entries: lore }; loreCatalogPool = () => pool; let last = null; toFrontend = p => { if (p && p.type === 'state') last = p; };
  return { set: c => { chat = c; }, push: async () => { last = null; await pushState('c1'); return last; },
    intercept: m => rpgcInterceptor(m, { chatId: 'c1', generationType: 'normal' }), chron: () => chroniclePayload('c1') }; };`, ctx);
    return ctx.__api(lore, user);
}
const A = load(oldFile), B = load(newFile);
const scrub = v => JSON.stringify(v, (k, x) => (k === 'version' || k === 'at' || k === 'readAt' || k === 'checkpoint') ? undefined : typeof x === 'string' ? x.replace(/\b\d+\.\d+\.\d+( RC)?\b/g, 'V') : x);
const firstDiff = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return `…${a.slice(Math.max(0, i - 60), i + 60)}… vs …${b.slice(Math.max(0, i - 60), i + 60)}…`; };
(async () => {
    let same = 0, diff = 0;
    const replies = msgs.map((m, i) => [m, i]).filter(([m]) => m.role === 'assistant').map(([, i]) => i);
    for (const end of replies) {
        const chat = msgs.slice(0, end + 1);
        A.set(chat); B.set(chat);
        const pa = scrub(await A.push()), pb = scrub(await B.push());
        if (pa !== pb) { diff++; console.log(`  ✗ reply ${end}: panel data differs ${firstDiff(pa, pb)}`); } else same++;
        if (msgs[end + 1]?.role === 'user') {
            const prompt = [{ role: 'system', content: 'GM' }, ...msgs.slice(0, end + 2).map(m => ({ role: m.role, content: m.content, __isChatHistory: true }))];
            const ra = scrub(await A.intercept(structuredClone(prompt))), rb = scrub(await B.intercept(structuredClone(prompt)));
            if (ra !== rb) { diff++; console.log(`  ✗ reply ${end}: narrator request differs ${firstDiff(ra, rb)}`); } else same++;
        }
    }
    A.set(msgs); B.set(msgs);
    const ca = scrub(await A.chron()), cb = scrub(await B.chron());
    if (ca !== cb) { diff++; console.log(`  ✗ Chronicle differs ${firstDiff(ca, cb)}`); } else same++;
    console.log(`compared ${replies.length} replies: ${same} identical, ${diff} different (panel data, narrator request, Chronicle)`);
    process.exitCode = diff ? 1 : 0;
})().catch(e => { console.error('compare failed:', e.stack || e); process.exitCode = 2; });
