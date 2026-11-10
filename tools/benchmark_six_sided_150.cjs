const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const baseline = process.argv[2];
if (!baseline) throw new Error('Usage: node tools/benchmark_six_sided_150.cjs BASELINE_BACKEND');
const card = JSON.parse(fs.readFileSync(path.join(root, 'cards/six-sided/character.json')));
const book = JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync(path.join(root, 'cards/six-sided/lorebook.json.gz'))));
const hud = '### WORLD STATE ###\nArmored Dragon Calendar: K417, Month 4, Day 12 | Time: 08:30\nLocation: Central Continent → Asura Kingdom → Roa\nRace: Human | Origin: Native | Age: 13\nCurrent Arc: Sandbox: Fittoa Region\nMana Capacity: Vast | Reserve: Low | Status: Rested\nMagic Tiers: Water (Advanced)\nInjuries: Arm cut — Treated | Condition: Hungry\nNarrative Mode: Strict Agency\n***\nThe room is quiet.';
function load(file) {
    const src = fs.readFileSync(file, 'utf8');
    const quiet = { log() {}, warn() {}, error() {}, info() {} };
    const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout,
        setInterval, clearInterval, performance, spindle: new Proxy({}, { get: (_, k) => k === 'log' ? quiet :
            new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
    ctx.globalThis = ctx;
    vm.createContext(ctx);
    vm.runInContext(src.slice(0, src.indexOf('// ───────────────────────────── Startup')) + `
globalThis.run = (text, entries, core) => {
  const chat = [{id:'u',chat_id:'bench',role:'user',content:'I wait.'}, {id:'m',chat_id:'bench',role:'assistant',content:text}];
  lorePool.set('bench', {entries:entries.map(loreNormEntry).filter(Boolean)});
  if (typeof sixNoteContract === 'function') sixNoteContract('bench', core);
  chatApi.getMessages = async () => chat; getChatState = async () => emptyChatState();
  return async () => {
    await hmsProcessContent('bench', text, null, 'normal', {});
    buildCompanionInstruction({}, 'Marcus', {}, null, chat, true);
  };
};`, ctx);
    return ctx.run(hud, book.originalData.entries, card.data.description);
}
(async () => {
    const runs = { baseline: load(baseline), candidate: load(path.join(root, 'dist/backend.js')) };
    for (const run of Object.values(runs)) for (let i = 0; i < 5; i++) await run();
    const samples = { baseline: [], candidate: [] };
    for (let round = 0; round < 6; round++) for (const name of round % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
        const start = performance.now();
        for (let i = 0; i < 20; i++) await runs[name]();
        samples[name].push((performance.now() - start) / 20);
    }
    const median = a => { const b = [...a].sort((x, y) => x - y); return (b[2] + b[3]) / 2; };
    console.log(JSON.stringify({ runtime: process.version, workload: 'actual paired lore; response processing plus reporter request; 6 alternating rounds of 20 iterations',
        milliseconds_per_iteration: samples, medians: Object.fromEntries(Object.entries(samples).map(([k, v]) => [k, median(v)])),
        scope: 'Mock host CPU benchmark; excludes model latency, real host storage and WebView' }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
