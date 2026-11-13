// Six-Sided World v2.5 (Preset Friendly) compatibility: its headers, named calendar, written times, route marker,
// own row order and rank words, NPCs Present, Party Mode records, care-staged Injuries and the two-block save.
// Synthetic HUDs written from the card's HUD PRESENTATION and CALENDAR rules; no private chat text.
// Run: node tools/test_six_sided_v25.cjs   (BACKEND=<older backend.js> to compare)
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const src = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = src.indexOf('// ───────────────────────────── Startup');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(src.slice(0, startup) + `
globalThis.__T = {
  parseHud, hmsClock, mtCalendar, abil: (t, v) => JSON.parse(JSON.stringify(hmsReadAbilities(parseHud(t), mergeDeep(HMS_SYS_DEFAULTS, { abilities: { vocabulary: v } })).map(g => [g.category, g.items.map(i => [i.name, i.state])]))), leaves: (key, text) => hmsLeavesOnItsOwn(key, null, null, parseHud(text)),
  standing: t => { const r = spellStanding(parseHud(t).lines); return JSON.parse(JSON.stringify({ voiceless: r.voiceless, schools: [...r.schools].map(([k, v]) => [k, v.name, v.rank]) })); },
  sys: t => JSON.parse(JSON.stringify(hmsReadSystems(parseHud(t)))),
  fix: (text, prevText, user) => { const prev = prevText ? parseHud(prevText) : null; const hud = parseHud(text); let notes = [];
    const r = rewriteHud(text, items => { notes = sixUpkeep(items, { cal: hmsCalNow(hud), prev, userName: user || 'Kael', rows: [], sessions: null, elapsedDays: 0, math: true, format: true }); return notes.length > 0; });
    return { text: r.content, notes: JSON.parse(JSON.stringify(notes)) }; },
  rules: (msgs) => { const pool = { entries: [] }; loreCatalogPool = () => pool; return JSON.parse(JSON.stringify(hmsCardRuleChecks(msgs, hmsTimeline(msgs), 'Kael', null))); },
  hooks: (chat, user) => {
    chatApi.getMessages = async () => chat;
    const state = {}; getChatState = async () => state; saveChatState = async () => {};
    getUserName = async () => { userNameCache.set('c1', user); return user; }; userNameCache.set('c1', user);
    healRecent = async () => false;
    const pool = { entries: [] }; loreCatalogPool = () => pool; try { lorePool.set('c1', pool); } catch {}
    globalThis.__state = null; toFrontend = p => { if (p && p.type === 'state') globalThis.__state = p; };
    return { push: async () => { await pushState('c1'); return JSON.parse(JSON.stringify(globalThis.__state)); }, process: (content, prev) => hmsProcessContent('c1', content, prev, 'normal', {}) };
  }
};`, ctx);
const T = ctx.__T;
const J = x => JSON.parse(JSON.stringify(x));   // values from the VM, compared in this realm

// the card's order: date (with Time), Season, Location, Current Arc, Current Scene, Race, Rudeus Mode, Memory, Game Mode … NPCs Present, Narrative Mode
const HUD = (o = {}) => [o.head || '### WORLD STATE ###',
    `Armored Dragon Calendar: ${o.date || 'K414, Rainveil 12, Stoneday'} | Time: ${o.time || 'Late afternoon'}`,
    'Season: Spring (calendar)',
    'Location: Central Continent → Asura Kingdom → Fittoa Region → Buena Village → Greyrat House — Kitchen',
    o.arc === null ? null : `Current Arc: ${o.arc || 'Arc 2-B: Hearth & Home [MT-ARC:2-B]'}`,
    "Current Scene: Paul's tutoring proposal, unanswered",
    'Race: Human | Origin: Native | Age: 7 (born K407, Month 4)',
    'Rudeus Mode: NPC', 'Memory: Memory 0 [MT-MEMORY:0]',
    'Game Mode: Original Character | Canon: Living | Guide: On', `HUD Style: ${o.style || 'Classic'}`, 'Calendar Profile: Themed',
    'Mana Capacity: Above Average | Reserve: Full | Status: Rested',
    'Sword Style: Sword God Style (Beginner)', `Magic Tiers: ${o.magic || 'Water (Elementary), Healing (Elementary)'}`,
    'Languages: Human God Language (Native, literate)',
    ...(o.training ? [`Training: ${o.training}`] : []),
    `Injuries: ${o.inj || 'left forearm cut — Treated'}`, 'Condition: Stable',
    'Equipment: wooden practice sword, plain tunic', 'Inventory: 3 copper, chalk',
    'Standing: Commoner, Greyrat household guest', `Bonds: ${o.bonds || 'Paul (mentor, warm), Zenith (kind)'}`,
    `${o.presentLabel || 'NPCs Present'}: ${o.present || 'Paul Greyrat'}`, 'Narrative Mode: Strict Agency', '***', '', 'Paul waits over an untouched cup.'].filter(x => x !== null).join('\n');
const results = [], failed = [];
const check = async (name, fn) => { try { await fn(); results.push(name); } catch (e) { failed.push(`${name}: ${String(e && e.message || e).split('\n')[0]}`); } };

(async () => {
    await check('Panel and Collapsed headers ("### WORLD STATE [PANEL] ###") are read as the HUD', () => {
        for (const head of ['### WORLD STATE [PANEL] ###', '### WORLD STATE [COLLAPSED] ###', '### 🌐 WORLD STATE ###']) {
            const h = T.parseHud(HUD({ head }));
            assert.ok(h, head); assert.equal(h.find.headLine.trim(), head);
            assert.match(h.lines[0].text, /^Armored Dragon Calendar/);
        }
    });
    await check('a translation block after the scene is not a second HUD', () => {
        const h = T.parseHud(HUD() + '\n\n### 🌐 Português ###\nPaul espera.\n***');
        assert.equal(h.lines[h.lines.length - 1].text, 'Narrative Mode: Strict Agency');
    });
    await check('the Themed, Familiar and Numbered calendars give the same date, with the weekday', () => {
        for (const date of ['K414, Rainveil 12, Stoneday', 'K414, April 12, Thursday', 'K414, Month 4, Day 12, Stoneday']) {
            const c = T.mtCalendar(`Armored Dragon Calendar: ${date} | Time: Late afternoon`);
            assert.ok(c, date); assert.deepEqual([c.year, c.month, c.day], [414, 4, 12], date); assert.ok(c.weekday, date);
        }
    });
    await check('a time written in words gives the day exactly and the hour approximately', () => {
        const c = T.hmsClock(T.parseHud(HUD({ time: 'Late afternoon' })));
        assert.ok(c && c.dated && c.approx); assert.equal(Math.floor(c.minutes / 1440), 414 * 360 + 3 * 30 + 11); assert.equal(c.minutes % 1440, 16 * 60 + 30);
        assert.equal(T.parseHud(HUD()).time, 'Late afternoon');
        assert.equal(T.hmsClock(T.parseHud(HUD({ time: 'whenever' }))), null);
    });
    await check('a Visual HUD (bold labels) has its clock', () => {
        const v = HUD({ time: '08:30 (Morning)' }).replace('Armored Dragon Calendar:', '📅 **Armored Dragon Calendar:**').replace('| Time:', '| **Time:**');
        const c = T.hmsClock(T.parseHud(v)); assert.ok(c && c.dated); assert.equal(c.minutes % 1440, 8 * 60 + 30);
    });
    await check('a correct v2.5 HUD comes through the upkeep unchanged (order, Elementary magic, Training)', () => {
        const t = HUD({ training: 'Water practice with Paul, daily' });
        const r = T.fix(t, HUD()); assert.equal(r.text, t, r.notes.join('; ')); assert.equal(r.notes.length, 0, r.notes.join('; '));
    });
    await check('magic stays Elementary / Emperor / God; drifted Novice and Expert get the card\'s words', () => {
        const r = T.fix(HUD({ magic: 'Water (Emperor), Fire (God), Wind (Novice), Earth (Expert)' }), HUD());
        assert.match(r.text, /^Magic Tiers: Water \(Emperor\), Fire \(God\), Wind \(Elementary\), Earth \(Advanced\)$/m);
    });
    await check('lines out of place go back to v2.5 order; a dropped Current Arc comes back after Location', () => {
        let t = HUD().replace(/^Current Arc:.*\n/m, '').replace(/^(Race:.*)\n/m, '').replace(/^(Season:.*)$/m, '$1\nRace: Human | Origin: Native | Age: 7 (born K407, Month 4)');
        const r = T.fix(t, HUD()); const ls = r.text.split('\n');
        assert.equal(ls.findIndex(l => /^Current Arc:/.test(l)), ls.findIndex(l => /^Location:/.test(l)) + 1);
        assert.ok(ls.findIndex(l => /^Race:/.test(l)) > ls.findIndex(l => /^Current Scene:/.test(l)));
        assert.equal(r.text.split('***')[0], HUD().split('***')[0]);
    });
    await check('the player comes off NPCs Present, and the label stays "NPCs Present"', () => {
        const r = T.fix(HUD({ present: 'Paul Greyrat, Kael' }), HUD());
        assert.match(r.text, /^NPCs Present: Paul Greyrat$/m);
        const r2 = T.fix(HUD({ presentLabel: 'Present' }), HUD());
        assert.match(r2.text, /^NPCs Present: Paul Greyrat$/m);
    });
    await check('no v1 card-rule warnings on v2.5 (Bonds count and stages, Game Mode set by the bot)', () => {
        const bonds = 'Paul (mentor), Zenith (kind), Lilia (polite), Roxy (teacher)';
        const msgs = [{ role: 'user', content: 'Mushoku_Start_Handler\nStart at Arc 2-B' }, { role: 'assistant', content: HUD({ bonds }) }, { role: 'user', content: 'go' }, { role: 'assistant', content: HUD({ bonds }) }];
        const warn = T.rules(msgs).map(x => x.text).join(' | ');
        assert.doesNotMatch(warn, /Bond|Game Mode shows/, warn);
    });
    await check('Injuries apart by semicolons, each with its care stage', () => {
        const w = T.sys(HUD({ inj: 'left forearm cut — Treated; right ankle sprain — Raw; left eye — Lasting (blurred)' })).wounds;
        assert.deepEqual(J(w.map(x => [x.name, x.cls])), [['left forearm cut', 'treated'], ['right ankle sprain', 'raw'], ['left eye', 'permanent']]);
    });
    await check('the world card: date, period, season, scene, route marker, campaign settings, injuries', async () => {
        const t = HUD({ inj: 'left forearm cut — Treated; right ankle sprain — Raw' });
        const api = T.hooks([{ id: 'u1', role: 'user', content: 'Start at Arc 2-B' }, { id: 'a1', role: 'assistant', content: t, swipe_id: 0 }], 'Kael');
        const w = (await api.push()).world;
        assert.equal(w.id, 'mushoku');
        assert.deepEqual(J([w.year, w.month, w.day, w.monthName, w.weekday, w.period]), [414, 4, 12, 'Rainveil', 'Stoneday', 'Late afternoon']);
        assert.equal(w.season, 'Spring (calendar)'); assert.match(w.scene, /tutoring proposal/);
        assert.deepEqual(J([w.rudeusMode, w.guide, w.hudStyle, w.calendarProfile]), ['NPC', 'On', 'Classic', 'Themed']);
        assert.deepEqual(J(w.injuries.map(x => x.stage)), ['Treated', 'Raw']);
        assert.deepEqual(J(w.magic.map(m => m.rank)), ['Elementary', 'Elementary']);
    });
    await check('the route marker: branch, marker-only and Sandbox routes', () => {
        const saga = arc => { vm.runInContext('globalThis.__arcLine = ' + JSON.stringify(arc), ctx);
            return vm.runInContext('(() => { mtArcList = () => [{ no: 2, year: 414, title: "Home Tutor" }, { no: 3, year: 417, title: "Entry-Level Adventurer" }, { no: 7, year: 421, title: "Northern Adventurer" }]; mtCanonSchedule = () => []; const s = mtSaga("c1", 414, __arcLine, { year: 414, month: 4, day: 12 }); return JSON.stringify([s.current, s.part, s.partName, s.personalArc]); })()', ctx); };
        assert.equal(saga('Arc 2-B: Hearth & Home [MT-ARC:2-B]'), JSON.stringify([2, 'B', 'Hearth & Home', null]));
        assert.equal(saga('[MT-ARC:7] Northern Adventurer'), JSON.stringify([7, null, 'Northern Adventurer', null]));
        assert.equal(saga('Open a bakery [MT-ARC:Sandbox]'), JSON.stringify([null, null, null, 'Sandbox — Open a bakery']));
    });
    await check('Party Mode: each player\'s rows stay with that player; your card is your own record', async () => {
        const party = ['### WORLD STATE ###', 'Armored Dragon Calendar: K417, Seedtide 3, Galeday | Time: Morning', 'Season: Spring (calendar)',
            'Location: Central Continent → Asura Kingdom → Fittoa Region → Roa → Boreas Manor', 'Current Arc: Arc 2: Home Tutor [MT-ARC:2]', 'Current Scene: First lesson',
            'Game Mode: Party Mode | Canon: Off-Screen | Guide: On', 'Player: Ana', 'Race: Human | Origin: Native | Age: 16', 'Mana Capacity: Modest | Reserve: Full | Status: Rested',
            'Sword Style: Sword God Style (Beginner)', 'Injuries: right hand blister — Treated', 'Player: Leo', 'Race: Human | Origin: Native | Age: 17',
            'Mana Capacity: Above Average | Reserve: Low | Status: Mana Fatigue', 'Magic Tiers: Water (Elementary)', 'Injuries: left knee bruise — Raw',
            'NPCs Present: Ghislaine Dedoldia', 'Narrative Mode: Strict Agency', '***', '', 'Ghislaine watches.'].join('\n');
        const r = T.fix(party, party, 'Ana'); assert.equal(r.text, party, r.notes.join('; '));   // no reordering across records
        assert.deepEqual(J(T.sys(party).wounds), []);   // nobody's wounds land on a shared sheet
        const api = T.hooks([{ id: 'u1', role: 'user', content: 'Party Mode' }, { id: 'a1', role: 'assistant', content: party, swipe_id: 0 }], 'Ana');
        const w = (await api.push()).world;
        assert.equal(w.mana, 'Modest'); assert.deepEqual(J(w.magic), []); assert.deepEqual(J(w.players), ['Ana', 'Leo']);
        assert.deepEqual(J(w.injuries.map(x => x.site)), ['right hand blister']);
    });
    await check('icons before schools, a noted hybrid style, and Voiceless Casting listing its schools', async () => {
        const t = HUD().replace(/^Magic Tiers:.*$/m, 'Magic Tiers: 💧 Water — Advanced | 🪨 Earth — Intermediate | 🔥 Fire — Elementary')
            .replace(/^Sword Style:.*$/m, 'Sword Style: Sword God Style — Advanced · Magic Swordsmanship (personal hybrid discipline) — Advanced')
            .replace(/^(Languages:.*)$/m, 'Voiceless Casting: Water, Earth, Fire\n$1');
        const api = T.hooks([{ id: 'u1', role: 'user', content: 'Start' }, { id: 'a1', role: 'assistant', content: t, swipe_id: 0 }], 'Kael');
        const s = await api.push();
        assert.deepEqual(J(s.world.magic.map(m => [m.name, m.rank])), [['Water', 'Advanced'], ['Earth', 'Intermediate'], ['Fire', 'Elementary']]);
        assert.deepEqual(J(s.world.martial.map(m => m.name)), ['Sword God Style', 'Magic Swordsmanship']);
        const st = T.standing(t);
        assert.equal(st.voiceless, true);
        assert.deepEqual(J(st.schools), [['water', 'Water', 'Advanced'], ['earth', 'Earth', 'Intermediate'], ['fire', 'Fire', 'Elementary']]);
        assert.deepEqual(J(T.sys(t).abilities.find(a => a.category === 'Magic').items.map(i => [i.name, i.state])), [['Water', 'Advanced'], ['Earth', 'Intermediate'], ['Fire', 'Elementary']]);
    });
    await check('"Race/Origin/Age: Human / Native / 12 (born …)" is read, and written as the card\'s Race row', async () => {
        const t = HUD().replace(/^Race:.*$/m, 'Race/Origin/Age: Human / Native / 9 (born K404, Goldfall 3)');   // K414 Rainveil: 9 until Goldfall
        assert.match(T.fix(t, HUD()).text, /^Race: Human \| Origin: Native \| Age: 9 \(born K404, Goldfall 3\)$/m);
        const api = T.hooks([{ id: 'u1', role: 'user', content: 'Start' }, { id: 'a1', role: 'assistant', content: t, swipe_id: 0 }], 'Kael');
        const w = (await api.push()).world;
        assert.deepEqual(J([w.race, w.origin, w.age, w.birth, w.birthMonth]), ['Human', 'Native', 9, 404, 10]);
    });
    await check('a Panel header written without its closing ### gets it, so the card can draw the panel', async () => {
        const t = HUD({ head: '### WORLD STATE [PANEL]', style: 'Panel' });
        const api = T.hooks([{ id: 'u1', role: 'user', content: 'Start\nHUD: Panel' }, { id: 'a1', role: 'assistant', content: HUD({ head: '### WORLD STATE [PANEL] ###', style: 'Panel' }), swipe_id: 0 }, { id: 'u2', role: 'user', content: 'go' }], 'Kael');
        const r = await api.process(t, T.parseHud(t));
        const out = typeof r === 'string' ? r : (r && (r.content || r.text)) || t;
        assert.match(out, /^### WORLD STATE \[PANEL\] ###\n/);
        const ok = HUD({ head: '### WORLD STATE [PANEL] ###', style: 'Panel' });
        const r2 = await api.process(ok, T.parseHud(ok));
        assert.match(typeof r2 === 'string' ? r2 : (r2 && (r2.content || r2.text)) || ok, /^### WORLD STATE \[PANEL\] ###\n/);
    });
    await check('2.5.3 hidden groups: a row the player turned off is not put back or asked for', () => {
        const basic = ['### WORLD STATE [PANEL] ###', 'Armored Dragon Calendar: K414, Rainveil 12, Stoneday | Time: Late afternoon', 'Season: Spring (calendar)',
            'Location: Central Continent → Asura Kingdom → Fittoa Region → Buena Village', 'Current Arc: [MT-ARC:2-B]', 'Rudeus Mode: NPC', 'Condition: Stable', '***', '', 'Paul waits.'].join('\n');
        const r = T.fix(basic, HUD());   // the last HUD still had Race, Magic Tiers, Injuries…
        assert.equal(r.text, basic, r.notes.join('; '));
        for (const k of ['race', 'magic tiers', 'injuries', 'npcs present', 'bonds', 'mana capacity']) assert.equal(T.leaves(k, basic), true, k);
        for (const k of ['location', 'current arc', 'rudeus mode', 'season']) assert.equal(T.leaves(k, basic), false, k);
        assert.equal(T.leaves('race', '### WORLD STATE ###\nYear: K419 | Day: 12\nRace: Human\n***'), false);   // other cards: unchanged
    });
    await check('a note after the rank ("Sword God Style — Advanced (studying Longsword of Light)") keeps the style and rank', async () => {
        const t = HUD().replace(/^Sword Style:.*$/m, 'Sword Style: Sword God Style — Advanced (studying Longsword of Light); Magic Swordsmanship — Advanced (personal)');
        const api = T.hooks([{ id: 'u1', role: 'user', content: 'Start' }, { id: 'a1', role: 'assistant', content: t, swipe_id: 0 }], 'Kael');
        const w = (await api.push()).world;
        assert.deepEqual(J(w.martial.map(m => [m.name, m.rank, m.step, m.note])), [['Sword God Style', 'Advanced', 2, 'studying Longsword of Light'], ['Magic Swordsmanship', 'Advanced', 2, 'personal']]);
    });
    await check('Abilities: "Touki (Battle Aura): Active — not mastered" is the Touki chip with its status', () => {
        const t = HUD().replace(/^(Sword Style:.*)$/m, 'Touki (Battle Aura): Active — not mastered\n$1');
        assert.deepEqual(J(T.abil(t, 'Martial: Martial Style, Touki, Active Stance')), [['Martial', [['Touki', 'Active — not mastered']]]]);
    });
    await check('Mushoku_Save: both fenced blocks come through intact', async () => {
        const hudOnly = HUD().split('***')[0] + '***';
        const save = '```text\n' + hudOnly + '\n```\n\n```text\n### SAVE NOTES ###\nSchema: MT-Standalone-2\nSystem revision: 2.5\n***\n```\n\n(OOC: Copy both blocks.)';
        const api = T.hooks([{ id: 'u1', role: 'user', content: 'Start' }, { id: 'a1', role: 'assistant', content: HUD(), swipe_id: 0 }, { id: 'u2', role: 'user', content: 'Mushoku_Save' }], 'Kael');
        const r = await api.process(save, T.parseHud(HUD()));
        const out = typeof r === 'string' ? r : (r && (r.content || r.text)) || save;
        assert.equal((out.match(/```/g) || []).length, 4); assert.match(out, /```\n\n```text\n### SAVE NOTES ###/);
    });

    for (const r of results) console.log(`  ✓ ${r}`);
    for (const f of failed) console.log(`  ✗ ${f}`);
    console.log(failed.length ? `${failed.length} of ${results.length + failed.length} failed` : `all ${results.length} passed`);
    process.exit(failed.length ? 1 : 0);
})();
