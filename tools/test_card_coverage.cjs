// Six-Sided World coverage: every slot of the card's HUD template, in Classic/Panel, Compact and Visual, read
// through the full panel payload; plus the people/creature split and the Present-line forms the card allows.
// Synthetic HUDs written from the card's slot map. Run: node tools/test_card_coverage.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const src = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = src.indexOf('// ───────────────────────────── Startup');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(src.slice(0, startup) + `
globalThis.__C = { named: hmsNamedPerson, present: t => hmsPresentPeople(parseHud(t)), diff: (a, b) => diffHud(parseHud(a), parseHud(b)),
  run: async (msgs, lore) => { chatApi.getMessages = async () => companionMarkTurnPurposes(msgs); let st = emptyChatState(); getChatState = async () => st; saveChatState = async (i, s) => { st = s; };
    getUserName = async () => { userNameCache.set('c1', 'Marcus Veyrath'); return 'Marcus Veyrath'; }; userNameCache.set('c1', 'Marcus Veyrath'); healRecent = async () => false;
    const pool = { entries: lore }; loreCatalogPool = () => pool; let last = null; toFrontend = p => { if (p && p.type === 'state') last = p; }; hmsCache.delete('c1'); await pushState('c1'); return JSON.parse(JSON.stringify(last)); } };`, ctx);
const C = ctx.__C;
const classic=`### WORLD STATE ###
Armored Dragon Calendar: K416, Month 4, Day 6 | Time: 14:20 (Afternoon)
◆ Central Continent → Asura Kingdom → Roa Guild Hall
Race: Human | Origin: Native | Age: 12 (born K404, Month 1)
Era / Arc: Sandbox: Fittoa Region — K416 (canon: Arc 2.4)
Memory: Keepsake Slate of Aurelia
Game Mode: Canon: Living, Hard Mode | Guide: Off
Mana Capacity: Vast | Reserve: Low | Status: Depleted
Touki (Battle Aura): Active
Sword Style: Sword God (Advanced), North God (Beginner)
Magic Tiers: Water (Advanced), Earth (Intermediate), Fire (Beginner)
Voiceless Casting: Active
Languages: Human-Tongue (Fluent, reads), Beast-Tongue (Basic)
Training: Sword God → Saint (55.5/60 sessions) · Water Magic → Saint (55.5/60 sessions)
[DEMON EYE: Foresight — Left]
[CURSE / BLESSING: Gift of Quickening]
Dream Link: ◌ Dormant
Condition: Cracked rib — Treated (bound), Mana-sick
Equipment: Plain road sword (Halvin's mark), leather baldric, trued ash wand, slide-bracer (Wenna's make)
Standing: Noble — Upper Noble, House Veyrath (Asura), Second Son · Faction: Boreas Retinue (Ward)
Renown: Asura: Noticed | elsewhere: Unknown · Guild: F (party Black Falcon: F)
Bonds: Ghislaine Dedoldia (Wary), Eris Boreas Greyrat (Rival), Aurelius Veyrath (Family)
[⚠️ TURNING POINT 1: ACTIVE]
⚠️ World event: The Mana Calamity — in 9 months (K417)
Active Paths:
- Divergence: Veyrath Ward in Roa (in effect)
- Change: Register with the Adventurer's Guild in Roa (done)
Present: Ghislaine Dedoldia (31, b. K385), Eris Boreas Greyrat (11, b. ~K405), Kessa (240, looks 30) — Migurd
Narrative Mode: Strict Agency
***
`;
const compact=`### WORLD STATE ###
Armored Dragon Calendar: K416, Month 4, Day 6 | Time: 14:20
◆ Roa Guild Hall, Asura Kingdom (Central Continent)
Race: Human | Origin: Native | Age: 12
Era / Arc: Sandbox: Fittoa Region — K416 (canon: Arc 2.4)
Game Mode: Canon: Living, Hard Mode
Mana Capacity: Vast | Low | Depleted · Touki (Battle Aura): Active
Skills: 💧Water Adv · 🪨Earth Int · 🔥Fire Beg · ⚔️Sword God Adv · 🤫 Voiceless
Languages: Human-Tongue (Fluent, reads), Beast-Tongue (Basic)
Training: Sword God → Saint (55.5/60 sessions) · Water Magic → Saint (55.5/60 sessions)
[DEMON EYE: Foresight — Left]
[CURSE / BLESSING: Gift of Quickening]
Dream Link: ◌ Dormant
Condition: Cracked rib — Treated (bound), Mana-sick
Standing: Noble — Upper Noble, House Veyrath (Asura), Second Son · Faction: Boreas Retinue (Ward)
Renown: Asura: Noticed | elsewhere: Unknown · Guild: F (party Black Falcon: F)
Bonds: Ghislaine Dedoldia (Wary), Eris Boreas Greyrat (Rival), Aurelius Veyrath (Family)
[⚠️ TURNING POINT 1: ACTIVE]
⚠️ World event: The Mana Calamity — in 9 months (K417)
Active Paths:
- Divergence: Veyrath Ward in Roa (in effect)
- Change: Register with the Adventurer's Guild in Roa (done)
Present: Ghislaine Dedoldia (31, b. K385), Eris Boreas Greyrat (11, b. ~K405), Kessa (240, looks 30) — Migurd
Narrative Mode: Strict Agency
***
`;
const visual=classic.replace('### WORLD STATE ###','### 🌐 WORLD STATE ###').split('\n').map(l=>{const m=l.match(/^([A-Z][A-Za-z /()&-]+?):\s(.*)$/);return m&&!/^Armored/.test(l)?`**${m[1]}:** ${m[2]}`:l}).join('\n').replace('**Memory:**','━━━━━━━━━━━━━━━━━━━━\n🧠 **Memory:**').replace('[⚠️ TURNING','━━━━━━━━━━━━━━━━━━━━\n⚠️ [TURNING'.replace('⚠️ [','[⚠️ '));
const lore = [{ id: 's1', comment: '[Spell] Earth Wall', content: '[SPELL — Earth Wall]\nSchool: Earth · Rank: Intermediate\nEffect: A wall of stone.', key: ['Earth Wall'] },
    { id: 't1', comment: '[Combat] Flash Slash', content: '[TECHNIQUE — Flash Slash]\nStyle: Sword God · Rank: Intermediate\nEffect: a dash.', key: ['Flash Slash'] }];
const data = { characters: [{ name: 'Ghislaine Dedoldia' }, { name: 'Eris Boreas Greyrat' }, { name: 'Kessa' }, { name: 'Acid Wolf' }, { name: 'Two bandits' }],
    relations: [{ key: 'ghislaine dedoldia', name: 'Ghislaine Dedoldia', standing: 'Acquaintance', bond: 'teacher' }],
    gear: [{ name: 'Amulet of Millis', state: 'worn', where: 'neck' }], survival: { slept: false, ate: true, drank: true, spells: [], learned: [], mastered: [], study: [], abilities: [], got: [], lost: [] } };
const chatOf = hud => [{ id: 'u1', role: 'user', is_user: true, swipe_id: 0, content: 'I register at the guild.' },
    { id: 'm1', role: 'assistant', is_user: false, swipe_id: 0, content: hud + '\nThe clerk stamps your card.', extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data } } } } }];
const SLOTS = ['armored dragon calendar', 'location', 'race', 'era / arc', 'game mode', 'mana capacity', 'languages', 'training', 'dream link', 'condition', 'standing', 'renown', 'bonds', 'world event', 'active paths', 'present', 'narrative mode'];
const results = [], failed = [];
const check = async (name, fn) => { try { await fn(); results.push(name); } catch (e) { failed.push(`${name}: ${e.message.split('\n')[0]}`); } };
const J = x => JSON.parse(JSON.stringify(x));
(async () => {
    for (const [style, hud] of [['Classic / Panel', classic], ['Compact', compact], ['Visual', visual]]) {
        await check(`${style}: every slot is read, and nothing right is flagged`, async () => {
            const h = J((await C.run(chatOf(hud), lore)).hms);
            const keys = h.hud.lines.map(l => l.key);
            for (const k of SLOTS) assert.ok(keys.includes(k), `slot "${k}" not read`);
            for (const tag of ['DEMON EYE', 'CURSE / BLESSING', 'TURNING POINT']) assert.ok(keys.some(k => k.includes(tag)), `slot [${tag}] not read`);
            const magic = h.systems.abilities.find(g => g.category === 'Magic');
            assert.deepEqual(magic && magic.items.map(i => `${i.name}:${i.state}`), ['Water:Advanced', 'Earth:Intermediate', 'Fire:Beginner']);
            assert.deepEqual(h.systems.wounds.map(w => [w.name, w.cls]), [['Cracked rib', 'treated']]);
            assert.deepEqual(h.systems.conditions.map(c => c.name), ['Mana-sick']);
            assert.ok(h.factions.items.some(f => f.name === 'Boreas Retinue' && f.title === 'Ward'), 'faction');
            assert.equal(h.relations.people.find(p => p.name === 'Ghislaine Dedoldia').hudBond, 'Wary');
            assert.ok(h.techniques.schools.some(s => s.name === 'Sword God'), 'sword style');
            const kinds = h.checks.map(c => c.text);
            assert.ok(!kinds.some(t => /Acid Wolf|bandits/.test(t)), `a creature or a group asked for an age: ${kinds.join(' | ')}`);
            assert.ok(!kinds.some(t => /Training|cap/.test(t)), `a false Training warning: ${kinds.join(' | ')}`);
        });
    }
    await check('style switches between Classic, Compact and Visual are not dropped lines', async () => {
        for (const [a, b] of [[classic, compact], [compact, visual], [visual, classic]]) assert.deepEqual(J(C.diff(a, b)).filter(m => !/memory|equipment|sword style|magic tiers|voiceless|touki|skills|━/.test(m.key)).map(m => m.key), []);
    });
    await check('Present: the forms the card allows', async () => {
        const p = t => J(C.present(`### WORLD STATE ###\nArmored Dragon Calendar: K416, Month 4, Day 6 | Time: 14:20 (Afternoon)\nPresent: ${t}\n***\n`)).map(x => [x.name, x.age, x.born]);
        assert.deepEqual(p('Kessa (240, looks 30) — Migurd, Ferren (40)'), [['Kessa', 240, null], ['Ferren', 40, null]]);
        assert.deepEqual(p('Roxy Migurdia (43, b. K373, looks 14)'), [['Roxy Migurdia', 43, 373]]);
        assert.deepEqual(p('Elinalise Dragonroad (200+, b. ~K210), Paper-seller'), [['Elinalise Dragonroad', 200, 210], ['Paper-seller', null, null]]);
    });
    await check('people vs groups and creatures', async () => {
        for (const n of ['Ferren', 'Bram', 'Sword King Ghislaine']) assert.equal(C.named(n), true, n);
        for (const n of ['Acid Wolf', 'Two bandits', 'Black Wolf pack', 'Paper-seller', 'the guard']) assert.equal(C.named(n), false, n);
    });
    for (const r of results) console.log(`  ✓ ${r}`);
    for (const f of failed) console.log(`  ✗ ${f}`);
    console.log(failed.length ? `${failed.length} of ${results.length + failed.length} failed` : `all ${results.length} card coverage checks passed`);
    process.exitCode = failed.length ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 2; });
