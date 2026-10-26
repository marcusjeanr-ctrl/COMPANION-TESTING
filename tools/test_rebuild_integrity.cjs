const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { runtime, seed } = require('./test_panel_tracking.cjs');
const root = path.resolve(__dirname, '..');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');

(async () => {
    assert.equal(sha(fs.readFileSync(path.join(__dirname, 'rebuild/baseline_2.8.1.zip'))), 'ba61d8f188871d0bd5bda67760fbdf028d3750c88f3193b48a5318934a023a38');
    const build = spawnSync('python3', [path.join(__dirname, 'rebuild.py'), '--check'], { encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr || build.stdout);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'spindle.json'), 'utf8'));
    assert.equal(manifest.version, '2.8.2');
    assert.equal(manifest.identifier, 'rpg_companion_hms');
    assert.equal(manifest.minimum_lumiverse_version, '1.2.0');
    assert.equal(manifest.interceptorTimeoutMs, 20000);
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'rpgc-budget-'));
    try {
        const baselinePath = path.join(temporary, 'backend.js');
        const extraction = spawnSync('python3', ['-c', 'import zipfile,sys,pathlib; pathlib.Path(sys.argv[2]).write_bytes(zipfile.ZipFile(sys.argv[1]).read("rpg_companion_hms/dist/backend.js"))', path.join(__dirname, 'rebuild/baseline_2.8.1.zip'), baselinePath]);
        assert.equal(extraction.status, 0);
        const profiles = [];
        for (const filename of [baselinePath, path.join(root, 'dist/backend.js')]) {
            const run = runtime(filename);
            const empty = run.ctx.buildCompanionInstruction({}, 'Rin', {}, run.ctx.emptyChatState(), [], true).length;
            seed(run);
            const populated = run.ctx.buildCompanionInstruction({}, 'Rin', {}, run.run('chatStateCache.get("test")'), run.messages, true).length;
            profiles.push({ empty, populated });
        }
        assert(profiles[1].empty <= profiles[0].empty, 'Static request grew beyond 2.8.1');
        assert(profiles[1].populated <= profiles[0].populated, 'Populated request grew beyond 2.8.1');
    } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
    const rt = runtime();
    for (const value of [null, undefined, '', ' ', false, true, [], [1], {}, Infinity, NaN, 'unknown']) assert(Number.isNaN(rt.ctx.reportNumber(value)));
    for (const [value, expected] of [[0, 0], ['0', 0], [42.5, 42.5], ['-12.5', -12.5]]) assert.equal(rt.ctx.reportNumber(value), expected);
    assert.equal(rt.ctx.gearPendingState('offered to be worn'), true);
    assert.equal(rt.ctx.gearPendingState('not held'), false);
    assert.equal(rt.ctx.gearPendingState('not held', true), true);
    assert.deepEqual(Array.from(rt.ctx.mushokuLocationSegments(['District {North, West}, Market (upper, east), Gate'])), ['District {North, West}', 'Market (upper, east)', 'Gate']);
    const parsedHud = rt.ctx.parseHud('### WORLD STATE ###\nDay: 1 | Time: 08:00\nLocation: Courtyard\n***');
    const systems = rt.ctx.hmsReadSystems(parsedHud);
    parsedHud.lines.map = () => { throw Error('Identity cache hit unnecessarily rebuilt the HUD text key'); };
    assert.equal(rt.ctx.hmsReadSystems(parsedHud), systems);
    const equivalentHud = rt.ctx.parseHud('### WORLD STATE ###\nDay: 1 | Time: 08:00\nLocation: Courtyard\n***');
    assert.equal(rt.ctx.hmsReadSystems(equivalentHud), systems);
    rt.ctx.cacheMessages = [{ id: 'first', role: 'assistant', content: '### WORLD STATE ###\nDay: 1 | Time: 08:00\nLocation: Gate\n***' },
        { id: 'second', role: 'assistant', content: '### WORLD STATE ###\nDay: 1 | Time: 08:00\nLocation: Gate\n***' }];
    assert(rt.run('withReadPass(cacheMessages, () => messageHud(cacheMessages[0]) === messageHud(cacheMessages[1]))'));
    rt.ctx.cacheMessages[1].content = rt.ctx.cacheMessages[1].content.replace('08:00', '08:01');
    assert.equal(rt.ctx.messageHud(rt.ctx.cacheMessages[1]).time, '08:01');
    assert(rt.run('withReadPass(cacheMessages, () => hmsClock(messageHud(cacheMessages[0])) === hmsClock(messageHud(cacheMessages[0])))'));
    rt.ctx.cacheMessages[0].content = rt.ctx.cacheMessages[0].content.replace('08:00', '08:02');
    assert.equal(rt.ctx.messageHud(rt.ctx.cacheMessages[0]).time, '08:02');
    let identityMatches = 0;
    const originalPartyMatch = rt.ctx.partyMatch;
    rt.ctx.partyMatch = (...args) => { identityMatches++; return originalPartyMatch(...args); };
    const keyOf = rt.ctx.simKeyer([{ name: 'Rin Stone', key: 'rin stone' }], rt.ctx.simYouKeys('You'));
    for (let i = 0; i < 100; i++) assert.equal(keyOf('Rin Stone'), 'rin stone');
    assert.equal(identityMatches, 1, 'A canonical identity was rematched within one fold');
    rt.ctx.partyMatch = originalPartyMatch;
    rt.run("withReadPass(cacheMessages, () => { for (let i = 0; i < 700; i++) hmsNorm('Label ' + i); if (activeReadPass.values.get('normalizedLabels').size > 512) throw Error('Unbounded label cache'); })");
    assert(rt.run('withReadPass(cacheMessages, () => { const hud = messageHud(cacheMessages[0]), cfg = hmsCfg(); return hmsReadQuests(hud, cfg) === hmsReadQuests(hud, cfg); })'));
    assert.equal(rt.run('withReadPass(cacheMessages, () => worldOf(["An unknown world"]))'), null);
    assert.equal(rt.run('withReadPass(cacheMessages, () => worldOf(["Skyrim", "Magicka: 100"]))'), 'skyrim');
    for (let i = 0; i < 3100; i++) rt.ctx.spellEstablishedNames({ id: 'spell-cache-' + i, content: 'No spell learning.' }, 'You');
    assert(rt.run('spellEstablishedCache.size <= 3000'));
    equivalentHud.lines.map = () => { throw Error('Text cache hit was not bound to the equivalent HUD identity'); };
    assert.equal(rt.ctx.hmsReadSystems(equivalentHud), systems);
    for (const name of ['backend', 'frontend']) {
        const source = fs.readFileSync(path.join(root, `dist/${name}.js`), 'utf8');
        const names = Array.from(source.matchAll(/^\s*(?:async )?function\s+(\w+)\s*\(/gm), m => m[1]);
        assert.equal(new Set(names).size, names.length, `${name}: duplicate named function declarations`);
    }
    const disk = new Map();
    rt.ctx.spindle.storage.getJson = async (key, options) => structuredClone(disk.get(key) ?? options?.fallback ?? null);
    rt.ctx.spindle.storage.setJson = async (key, value) => { disk.set(key, structuredClone(value)); };
    for (const version of ['old', 'new']) {
        const schemaVersion = version === 'old' ? '2.8.1' : '2.8.21';
        const record = JSON.parse(fs.readFileSync(path.join(__dirname, 'rebuild/save_fixtures', schemaVersion + '.json'), 'utf8'));
        disk.set(`chats/${version}.json`, record);
        const loaded = await rt.ctx.getChatState(version);
        await rt.ctx.saveChatState(version, loaded);
        const saved = disk.get(`chats/${version}.json`);
        for (const [key, value] of Object.entries(record)) assert.deepEqual(saved[key], value, `${version} upgrade lost ${key}`);
        assert.deepEqual(disk.get(`chats/${version}.json.recovery`), saved);
    }
    console.log('Clean rebuild passed: exact archive, reproducible bundles, 2.8.2 identity, shared guards, qualified location splits, no duplicate named functions, and nondestructive old/new save round-trips.');
})().catch(error => { console.error(error); process.exitCode = 1; });
