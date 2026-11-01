// Compatibility checks for the Mushoku Tensei "Six-Sided World" v1.1 HUD: Classic, Visual, Compact and
// Panel (Panel is written as Classic; the card's regex only draws it). Synthetic HUDs written to the
// card's own slot map; no private chat text. Also checks that other cards keep their old readings.
// Run: node tools/test_six_sided_v11.cjs   (BACKEND=<older backend.js> shows which checks fail without the fix)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8');
const startup = source.indexOf('// ───────────────────────────── Startup');
assert(startup > 0, 'backend startup marker missing');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = { console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }) };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(source.slice(0, startup) + `
globalThis.__t = { parseHud, worldLines, worldOf, worldMushoku: (l, chat) => worldMushoku('c1', l, {}, chat || null), spellStanding, diffHud, isHudSwap, stripForDisplay, hudStyleFor: typeof hudStyleFor === 'function' ? hudStyleFor : null,
  hmsReadWounds, hmsReadConditions, hmsCfg, factionFromHud, techStanding, renderHudCard };
globalThis.__hooks = (chat, user) => {
  chatApi.getMessages = async () => chat;
  const state = {}; getChatState = async () => state; saveChatState = async () => {};
  getUserName = async () => { userNameCache.set('c1', user); return user; }; userNameCache.set('c1', user);
  healRecent = async () => false;
  const pool = { entries: [] }; loreCatalogPool = () => pool;
  globalThis.__state = null; toFrontend = p => { if (p && p.type === 'state') globalThis.__state = p; };
  return { push: () => pushState('c1'), chronicle: () => chroniclePayload('c1'), intercept: (m, c) => rpgcInterceptor(m, c), process: (content, prev) => hmsProcessContent('c1', content, prev, 'normal', {}) };
};`, ctx);
const t = ctx.__t;

// ── one state, four styles, exactly as the card's slot map writes them ──
const S = {
    date: 'K417, Month 4, Day 12', time: '09:20', period: 'Morning', cont: 'Central Continent', region: 'Asura Kingdom', spot: 'Roa, Boreas Manor',
    race: 'Human', origin: 'Reincarnate', age: 10, born: 'K407, Month 1', arc: 'Sandbox: Fittoa Region — K417 (canon: Arc 2)', memory: 'Memory 1',
    mode: 'Twin Soul, Hard Mode', mana: 'Vast', reserve: 'Half', status: 'Rested', touki: 'Locked',
    sword: [['Sword God', 'Intermediate'], ['Water God', 'Beginner']], magic: [['Water', 'Saint'], ['Earth', 'Advanced'], ['Healing', 'Intermediate']],
    voiceless: 'Active', langs: 'Human-Tongue (Fluent, reads), Demon-Tongue (Basic), Japanese (Fluent, reads)', training: 'Healing → Advanced (7/25 sessions)',
    dream: '☁ Connected', condition: 'Cracked rib — Treated, Fatigued', equipment: "Roxy's wand, travel cloak",
    standing: 'Noble — Knight, House Greyrat (Asura), Younger Child', faction: 'Boreas Household (Tutor)', renown: 'Fittoa: Local name | elsewhere: Unknown', guild: 'F',
    bonds: 'Eris Boreas Greyrat (Friend), Ghislaine Dedoldia (Trusted)', canon: '⏳ Next Canon Event: The Mana Calamity — in 9 months (K418)',
    paths: ['- Divergence: Paul stays in Buena (in effect)', '- Change: Learn Touki early (goal)'],
    present: 'Eris Boreas Greyrat (10), Ghislaine Dedoldia (28, b. K389)', narrative: 'Balanced',
};
const SHORT = { Beginner: 'Beg', Intermediate: 'Int', Advanced: 'Adv', Saint: 'Saint', King: 'King', Imperial: 'Imp', Divine: 'Div' };
const ICON = { Water: '💧', Fire: '🔥', Wind: '🌪️', Earth: '🪨', Healing: '✚' };
const rows = list => list.map(([a, b]) => `${a} (${b})`).join(', ');
const classic = (s = S) => ['### WORLD STATE ###', `Armored Dragon Calendar: ${s.date} | Time: ${s.time} (${s.period})`, `◆ ${s.cont} → ${s.region} → ${s.spot}`,
    `Race: ${s.race} | Origin: ${s.origin} | Age: ${s.age} (born ${s.born})`, `Era / Arc: ${s.arc}`, `Memory: ${s.memory}`, `Game Mode: ${s.mode}`,
    `Mana Capacity: ${s.mana} | Reserve: ${s.reserve} | Status: ${s.status}`, `Touki (Battle Aura): ${s.touki}`, `Sword Style: ${rows(s.sword)}`,
    `Magic Tiers: ${rows(s.magic)}`, `Voiceless Casting: ${s.voiceless}`, `Languages: ${s.langs}`, s.training && `Training: ${s.training}`,
    s.dream && `Dream Link: ${s.dream}`, s.condition && `Condition: ${s.condition}`, `Equipment: ${s.equipment}`, `Standing: ${s.standing} · Faction: ${s.faction}`,
    `Renown: ${s.renown} · Guild: ${s.guild}`, s.bonds && `Bonds: ${s.bonds}`, s.canon, s.paths.length && 'Active Paths:', ...s.paths.map(p => '  ' + p),
    `Present: ${s.present}`, `Narrative Mode: ${s.narrative}`, '***'].filter(Boolean).join('\n') + '\n';
const visual = (s = S) => ['### 🌐 WORLD STATE ###', `🗓️ **Armored Dragon Calendar:** ${s.date} · 🕰️ **Time:** ${s.time} (${s.period})`, `📍 **${s.cont} → ${s.region} → ${s.spot}**`,
    `🧬 **Race:** ${s.race} · **Origin:** ${s.origin} · **Age:** ${s.age} (born ${s.born})`, `📖 **Era / Arc:** ${s.arc}`, '━━━━━━━━━━━━━━━━━━━━',
    `🧠 **Memory:** ${s.memory} · 🎮 **Game Mode:** ${s.mode}`, `💧 **Mana Capacity:** ${s.mana} · **Reserve:** ${s.reserve} · **Status:** ${s.status}`,
    `🔥 **Touki (Battle Aura):** ${s.touki}`, `⚔️ **Sword Style:** ${rows(s.sword)}`, `✨ **Magic Tiers:** ${rows(s.magic)}`, `🤫 **Voiceless Casting:** ${s.voiceless}`,
    `🗣️ **Languages:** ${s.langs}`, s.training && `📈 **Training:** ${s.training}`, s.dream && `☁️ **Dream Link:** ${s.dream}`, s.condition && `🩹 **Condition:** ${s.condition}`,
    `🎒 **Equipment:** ${s.equipment}`, `👑 **Standing:** ${s.standing} · **Faction:** ${s.faction}`, `🏅 **Renown:** ${s.renown} · **Guild:** ${s.guild}`,
    s.bonds && `🤝 **Bonds:** ${s.bonds}`, '━━━━━━━━━━━━━━━━━━━━', s.canon, s.paths.length && `🔀 **Active Paths:** ${s.paths.map(p => p.replace(/^- /, '')).join('; ')}`,
    `👥 **Present:** ${s.present}`, `🎭 **Narrative Mode:** ${s.narrative}`, '***'].filter(Boolean).join('\n') + '\n';
const compact = (s = S, { memory = false, equipment = false } = {}) => ['### WORLD STATE ###', `Armored Dragon Calendar: ${s.date} | Time: ${s.time}`,
    `◆ ${s.spot.split(', ').reverse().join(', ')}, ${s.region} (${s.cont})`, `Race: ${s.race} | Origin: ${s.origin} | Age: ${s.age}`, `Era / Arc: ${s.arc}`,
    memory && `Memory: ${s.memory}`, `Game Mode: ${s.mode}`, `Mana Capacity: ${s.mana} | ${s.reserve} | ${s.status} · Touki (Battle Aura): ${s.touki}`,
    `Skills: ${s.magic.map(([a, b]) => `${ICON[a]}${a} ${SHORT[b]}`).join(' · ')} · ${s.sword.map(([a, b]) => `⚔️${a} ${SHORT[b]}`).join(' · ')}${s.voiceless === 'Active' ? ' · 🤫 Voiceless' : ''}`,
    `Languages: ${s.langs}`, s.training && `Training: ${s.training}`, s.dream && `Dream Link: ${s.dream}`, s.condition && `Condition: ${s.condition}`,
    equipment && `Equipment: ${s.equipment}`, `Standing: ${s.standing} · Faction: ${s.faction}`, `Renown: ${s.renown} · Guild: ${s.guild}`, s.bonds && `Bonds: ${s.bonds}`,
    s.canon, s.paths.length && 'Active Paths:', ...s.paths.map(p => '  ' + p), `Present: ${s.present}`, `Narrative Mode: ${s.narrative}`, '***'].filter(Boolean).join('\n') + '\n';
const STYLES = { classic, visual, compact, panel: classic };

const parse = text => t.parseHud(text + 'The story continues.');
const world = (text, chat) => t.worldMushoku(t.worldLines(parse(text)), chat);
const results = [], failed = [];
const check = (name, fn) => { try { fn(); results.push(name); } catch (e) { failed.push(`${name}: ${e.message.split('\n')[0]}`); } };
const checkAsync = async (name, fn) => { try { await fn(); results.push(name); } catch (e) { failed.push(`${name}: ${e.message.split('\n')[0]}`); } };
const plain = v => JSON.parse(JSON.stringify(v));

// 1. Every style reads the same character sheet.
for (const [style, make] of Object.entries(STYLES)) {
    check(`${style}: the world card reads the same sheet`, () => {
        const h = parse(make());
        assert.equal(t.worldOf(t.worldLines(h)), 'mushoku');
        const w = world(make());
        assert.deepEqual([w.year, w.month, w.day], [417, 4, 12], 'date');
        assert.equal(w.mana, 'Vast', 'mana tier alone');
        assert.equal(w.reserve, 'Half', 'reserve');
        assert.equal(w.touki, 'Locked', 'touki');
        assert.equal(w.casting, 'Voiceless (Active)', 'voiceless casting');
        assert.deepEqual(plain(w.magic.map(m => [m.name, m.rank])), [['Water', 'Saint'], ['Earth', 'Advanced'], ['Healing', 'Intermediate']], 'magic tiers');
        assert.deepEqual(plain(w.martial.map(m => [m.name, m.rank])), [['Sword God', 'Intermediate'], ['Water God', 'Beginner']], 'sword styles');
        assert.deepEqual(plain(w.languages), [{ name: 'Human-Tongue', fluency: 'Fluent, reads' }, { name: 'Demon-Tongue', fluency: 'Basic' }, { name: 'Japanese', fluency: 'Fluent, reads' }], 'languages keep "(Fluent, reads)" whole');
        assert.equal(w.adventurer && w.adventurer.rank, 'F', 'guild rank after "·"');
        assert.equal(h.arc, S.arc, 'the Era / Arc line is the arc');
        assert.equal(h.location.at(-1), 'Boreas Manor', 'the exact spot is the current place');
        if (style !== 'compact') assert.equal(w.period, 'Morning', 'period from the named-calendar time');
    });
    check(`${style}: the Spellbook sees the school ranks`, () => {
        const sp = t.spellStanding(parse(make()).lines);
        assert.deepEqual(plain([...sp.schools.values()].map(s => [s.name, s.rank])), [['Water', 'Saint'], ['Earth', 'Advanced'], ['Healing', 'Intermediate']]);
        assert.equal(sp.voiceless, true);
    });
}

// 2. Compact writes the place spot-first: read in the same order as Classic.
check('compact: location reads general → specific like Classic', () => {
    assert.deepEqual(plain(parse(compact()).location), plain(parse(classic()).location));
});

// 3. Visual's ━━━ dividers decorate the HUD; the rows between them are ordinary lines.
check('visual: rows between the two dividers are HUD lines, not an inline block', () => {
    const h = parse(visual());
    const sword = h.lines.find(l => l.key === 'sword style');
    assert(sword && !sword.block, 'Sword Style is an ordinary line');
    const prev = parse(visual()), cur = parse(visual({ ...S, sword: [] }).replace(/^.*Sword Style.*\n/m, ''));
    assert.deepEqual(plain(t.diffHud(prev, cur).map(m => m.key)), ['sword style'], 'a dropped stat row is reported');
});

// 4. Standing · Faction and Renown · Guild are separate fields in every style.
check('classic: Faction after "·" is a faction with its rank, Standing stays alone', () => {
    const f = t.factionFromHud(parse(classic())).find(x => /boreas/i.test(x.name));
    assert(f, 'Boreas Household read from the Standing line');
    assert.equal(f.rank, 'Tutor');
    const standing = parse(classic()).lines.find(l => l.key === 'standing');
    assert.equal(standing.fields[0].value, S.standing, 'Standing value stops before "· Faction"');
});

// 5. Condition carries wounds with Raw / Treated / Healing: a wound, not a condition; states stay conditions.
check('condition: a tagged wound is a wound; Fatigued is a condition', () => {
    const h = parse(classic());
    const w = t.hmsReadWounds(h);
    assert.deepEqual(plain(w.map(x => [x.name, x.cls])), [['Cracked rib', 'treated']]);
    const c = t.hmsReadConditions(h, t.hmsCfg());
    assert(!c.some(x => /cracked rib/i.test(x.text)), 'the wound is not also a condition');
    assert(c.some(x => /fatigued/i.test(x.text)), 'Fatigued stays a condition');
    const v = parse(visual());
    assert.deepEqual(plain(t.hmsReadWounds(v).map(x => [x.name, x.cls])), [['Cracked rib', 'treated']], 'Visual: the wound reads through the icon and bold label');
    assert(t.hmsReadConditions(v, t.hmsCfg()).some(x => /fatigued/i.test(x.text)), 'Visual: Fatigued is a condition');
    const healing = t.hmsReadWounds(parse(classic({ ...S, condition: 'Burned hand — Healing' })));
    assert.equal(healing[0] && healing[0].cls, 'treated', 'Healing is past treatment, not raw');
});

// 6. The guard: style switches, self-clearing slots and Compact's own omissions are not drops.
check('guard: switching styles is a layout change, not dropped lines', () => {
    for (const [a, b] of [['classic', 'visual'], ['visual', 'classic'], ['classic', 'compact'], ['compact', 'classic'], ['visual', 'compact'], ['compact', 'visual']]) {
        const prev = parse(STYLES[a]()), cur = parse(STYLES[b]());
        assert(t.isHudSwap(prev, cur) || !t.diffHud(prev, cur).length, `${a} → ${b}: ${JSON.stringify(t.diffHud(prev, cur).map(m => m.key))}`);
    }
});
check('techniques: the sword-style reach reads in every style', () => {
    for (const make of [classic, visual, compact]) {
        const st = t.techStanding(parse(make()).lines);
        assert.deepEqual(plain([...st.values()].map(r => [r.name, r.rank])), [['Sword God', 'Intermediate'], ['Water God', 'Beginner']], make.name);
    }
});
check('world card: Imperial and Divine magic tiers have a step', () => {
    const w = world(classic({ ...S, age: 30, magic: [['Water', 'Imperial'], ['Healing', 'Divine']] }));
    assert.deepEqual(plain(w.magic.map(m => m.step)), [5, 6]);
});
check('panel: the card\'s "HMS Panel — Open" regex cannot redraw the HUD copy inside the Companion card', () => {
    const shown = t.renderHudCard(classic() + 'Prose.');
    assert(/rh-raw/.test(shown), 'the card was drawn');
    const panelOpen = /^###\s*WORLD STATE\s*###[ \t]*\n([\s\S]*?)\n\*\*\*[ \t]*$/m;   // the card's own find pattern
    assert(!panelOpen.test(shown), 'no live HUD left for the Panel script');
});
check('named calendar: month name, weekday and season still give the date and period', () => {
    const w = world(classic({ ...S, date: 'K417, Month of Water (Month 4), Day 12 — Firstday | Season: Spring' }));
    assert.deepEqual([w.year, w.month, w.day, w.monthName, w.period], [417, 4, 12, 'Month of Water', 'Morning']);
});
check('hidden power: Shown / True keeps the true rank', () => {
    const w = world(classic({ ...S }).replace(/^Sword Style:.*$/m, 'Sword Style: Shown: None | True: Water God (Advanced)').replace(/^Mana Capacity:.*$/m, 'Mana Capacity: Shown: None (Absolute Void Seal) | True: Vast | Reserve: Full | Status: Rested'));
    assert.equal(w.mana, 'Vast');
    assert.deepEqual(plain(w.martial.map(m => [m.name, m.rank])), [['Water God', 'Advanced']]);
});
check('guard: a dropped line in the same style is still reported', () => {
    const prev = parse(classic()), cur = parse(classic().replace(/^Bonds:.*\n/m, ''));
    assert.equal(t.isHudSwap(prev, cur), false);
    assert.deepEqual(plain(t.diffHud(prev, cur).map(m => m.key)), ['bonds']);
});
(async () => {
    // 7. Panel-level: guard classification, wounds, injuries request, factions, Chronicle.
    let n = 0;
    const user = text => ({ id: `u${++n}`, role: 'user', is_user: true, name: 'Test Hero', swipe_id: 0, content: text });
    const reply = (hud, prose = 'The story continues.') => ({ id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: 0, content: hud + prose });
    const run = async (chat, intercept) => {
        const api = ctx.__hooks(chat, 'Test Hero');
        await api.push();
        let added = null;
        if (intercept) {
            const prompt = [{ role: 'system', content: intercept }, ...chat.map(m => ({ role: m.role, content: m.content, __isChatHistory: true }))];
            let out = await api.intercept(prompt, { chatId: 'c1', generationType: 'normal' });
            out = Array.isArray(out) ? out : out.messages;
            added = out.filter(m => !m.__isChatHistory && !prompt.some(p => p.content === m.content)).map(m => m.content).join('\n');
        }
        return { h: ctx.__state.hms, added, api, chronicle: await api.chronicle() };
    };
    const guardOf = async (prevText, curText) => {
        const api = ctx.__hooks([user('x')], 'Test Hero');
        const r = await api.process(curText + 'Prose.', parse(prevText));
        return r.guard || (r.res && r.res.guard) || r;
    };

    await checkAsync('guard: Condition and Training clearing are not drops', async () => {
        const prev = classic(), cur = classic({ ...S, condition: null, training: null });
        const g = await guardOf(prev, cur);
        const keys = (g.missing || []).map(m => m.key);
        assert(!keys.includes('training') || t.hmsCfg().selfClearing.includes('Training'), 'Training ends by its own rules');
        const chat = [user('a'), reply(prev), user('b'), reply(cur)];
        chat[3].extra = { spindle_metadata: { rpg_companion: { swipes: { 0: { hudGuard: { ...g, missing: g.missing || [] } } } } } };
        const { h } = await run(chat);
        assert.deepEqual(plain((h.guard && h.guard.missing || []).map(m => m.key)), [], 'nothing listed as dropped');
    });
    await checkAsync('guard: Compact leaving out Memory and Equipment is not a drop', async () => {
        const g = await guardOf(compact(S, { memory: true, equipment: true }), compact());
        assert.equal(g.swapped || !(g.missing || []).some(m => /^(memory|equipment)$/.test(m.key)), true, JSON.stringify(g.missing));
    });
    await checkAsync('wounds: a Condition wound shows in Wounds, and the extension does not ask for its own injuries', async () => {
        const chat = [user('a'), reply(classic()), user('b')];
        const { h, added } = await run(chat, 'You are the game master.');
        assert((h.systems.wounds || []).some(w => /cracked rib/i.test(w.name)), 'wound shown');
        assert(!(h.systems.conditions || []).some(c => /cracked rib/i.test(c.text)), 'not doubled as a condition');
        assert(!/"injuries"\s*:/.test(added), 'no competing injuries request');
    });
    await checkAsync('wounds: the card\'s Condition law alone means the card keeps wounds', async () => {
        const chat = [user('a'), reply(classic({ ...S, condition: null })), user('b')];
        const law = 'Condition: [wound or state] — [Raw / Treated / Healing], [..]';
        const { added } = await run(chat, `[HMS — WORLD STATE ENGINE]\n${law}`);
        assert(!/"injuries"\s*:/.test(added), 'no competing injuries request');
    });
    await checkAsync('factions: Faction from the Standing line, in Classic and Compact alike', async () => {
        for (const make of [classic, compact, visual]) {
            const { h } = await run([user('a'), reply(make())]);
            const items = h.factions && h.factions.items || [];
            const f = items.find(x => /boreas household/i.test(x.name));
            assert(f && f.title === 'Tutor' && f.standing === 'member', `${make.name}: ${JSON.stringify(items.map(x => [x.name, x.title, x.standing]))}`);
            assert(!items.some(x => x.name === 'F'), 'the guild rank is not a faction');
            const guild = items.find(x => x.name === 'Guild');
            assert(guild && guild.title === 'F', 'guild rank F');
        }
    });
    await checkAsync('chronicle: a magic tier earned through training is a milestone, and the arc opens the story', async () => {
        const up = { ...S, magic: [['Water', 'Saint'], ['Earth', 'Advanced'], ['Healing', 'Advanced']], training: null };
        const chat = [user('a'), reply(classic()), user('b'), reply(classic(up))];
        const { chronicle } = await run(chat);
        const ch = JSON.stringify(chronicle);
        assert(/Magic Tiers:[^"]*Healing \(Intermediate\)[^"]*→[^"]*Healing \(Advanced\)/.test(ch), 'rank-up recorded');
        assert(/The story begins — Sandbox: Fittoa Region/.test(ch), 'arc named at the start');
    });

    // 9. Deeper v1.1 integration: training, bonds, standing and family plots, Compact Chronicle, Panel.
    check('HUD: a blank line inside the HUD (the wall still ahead) does not end it', () => {
        const t2 = classic().replace(/^(Bonds:.*)$/m, '$1\nCanon: Living\n- Ledger: empty\n');
        const h = parse(t2);
        assert(h.lines.some(l => /^Present:/.test(l.text)), 'Present after the blank line is read');
        assert(h.find.sepFound, 'the wall is found');
        const prose = t.parseHud('### WORLD STATE ###\nDay: 1 | Time: 08:00\nHP: 10/10\n\nShe turns to you and smiles.\n\n***\nMore story.');
        assert.equal(prose.lines.length, 2, 'prose after a blank line is never read as HUD');
    });
    check('drift: bold labels, blank lines and "Magic:" / "Martial:" still read as the sheet', () => {
        const drift = '### WORLD STATE ###\n\n**Armored Dragon Calendar: K416, Month 1, Day 12**\n**Time:** 08:20 (Morning)\n\n**Mana Capacity:** Vast | **Reserve:** Full | **Status:** Rested\n**Martial:** Sword God Style — Advanced\n**Magic:** Water — Advanced · Earth — Intermediate · Fire — Beginner\n**Languages:** Human-Tongue (Fluent, reads)\n\n***\n';
        const w = world(drift);
        assert.equal(w.mana, 'Vast');
        assert.deepEqual(plain(w.magic.map(m => [m.name, m.rank])), [['Water', 'Advanced'], ['Earth', 'Intermediate'], ['Fire', 'Beginner']]);
        assert.deepEqual(plain(w.martial.map(m => m.rank)), ['Advanced']);
        assert.equal(t.spellStanding(t.parseHud('### WORLD STATE ###\nDay: 3 | Time: 09:00\nMagic: Fire / Wind | Gate: C-Rank\n***\nx').lines).ladder, 'rz', 'Re:Zero "Magic: … | Gate:" is unchanged');
    });
    check('training: sessions toward the next rank are read', () => {
        const w = world(classic({ ...S, training: 'Healing → Advanced (7/25 sessions)' }));
        assert.deepEqual(plain(w.training), [{ skill: 'Healing', next: 'Advanced', done: 7, needed: 25 }]);
        const none = world(classic({ ...S, training: null }));
        assert.deepEqual(plain(none.training), []);
    });
    check('standing: class, rank, house, nation and birth; faction and family plots from the start command', () => {
        const chat = [{ role: 'user', is_user: true, content: 'Mushoku_Start_Handler\nSandbox Mode\nSocial: Noble (Upper Noble, House Veyrath, Asura, Younger Child)\nFamily Plot: Arranged Marriage\nFamily Plot: Feud with House Dravenmoor' }];
        const w = world(classic(), chat);
        assert.deepEqual(plain(w.standing), { kind: 'Noble', rank: 'Knight', house: 'House Greyrat', nation: 'Asura', birth: 'Younger Child', text: S.standing });
        assert.equal(w.faction, S.faction);
        assert.deepEqual(plain(w.familyPlots), ['Arranged Marriage', 'Feud with House Dravenmoor']);
    });
    check('display: a stray closing tag on its own line is hidden; real markup is kept', () => {
        assert.equal(t.stripForDisplay('Text.\n\n</ofilter>\n\nMore.').includes('</ofilter>'), false);
        assert(t.stripForDisplay('<div>\nA\n</div>').includes('</div>'), 'a closing tag with its opening stays');
    });
    check('panel: the start command or a [HUD = …] switch says the card draws its own Panel', () => {
        assert(t.hudStyleFor, 'hudStyleFor exists');
        const u = c => ({ role: 'user', is_user: true, content: c });
        assert.equal(t.hudStyleFor([u('Mushoku_Start_Handler\nHUD: Panel')]), 'panel');
        assert.equal(t.hudStyleFor([u('Mushoku_Start_Handler\nHUD: Panel'), u('[HUD = CLASSIC] I wave.')]), 'classic');
        assert.equal(t.hudStyleFor([u('hello')]), null);
    });
    await checkAsync('bonds: the HUD stage shows on the person, and a HUD stage change is in their history and the Chronicle', async () => {
        const rel = (name, standing) => ({ key: name.toLowerCase(), name, standing, bond: 'friend', minor: true, mood: null, why: null });
        const a = { ...S, bonds: 'Eris Boreas Greyrat (Friend), Ghislaine Dedoldia (Trusted)' }, b2 = { ...S, bonds: 'Eris Boreas Greyrat (Trusted), Ghislaine Dedoldia (Trusted)' };
        const r1 = reply(classic(a)); r1.extra = { spindle_metadata: { rpg_companion: { swipes: { 0: { relations: [rel('Eris Boreas Greyrat', 'Friend')] } } } } };
        const r2 = reply(classic(b2)); r2.extra = { spindle_metadata: { rpg_companion: { swipes: { 0: { relations: [rel('Eris Boreas Greyrat', 'Friend')] } } } } };
        const { h, chronicle } = await run([user('a'), r1, user('b'), r2]);
        const eris = h.relations.people.find(p => /eris/i.test(p.name));
        assert.equal(eris.hudBond, 'Trusted');
        assert(eris.events.some(e => /HUD bond: Friend → Trusted/.test(e)), JSON.stringify(eris.events));
        assert(/Eris Boreas Greyrat: Friend → Trusted/.test(JSON.stringify(chronicle)), 'Chronicle has the bond step');
    });
    await checkAsync('chronicle: training starts and finishes; Compact and style switches still record rank-ups', async () => {
        const start = { ...S, training: null }, mid = { ...S, training: 'Healing → Advanced (7/25 sessions)' }, done = { ...S, training: 'Healing → Advanced (25/25 sessions)' };
        const up = { ...S, training: null, magic: [['Water', 'Saint'], ['Earth', 'Advanced'], ['Healing', 'Advanced']], sword: [['Sword God', 'Advanced'], ['Water God', 'Beginner']] };
        const chat = [user('a'), reply(classic(start)), user('b'), reply(compact(mid)), user('c'), reply(compact(done)), user('d'), reply(compact(up)), user('e'), reply(visual({ ...up, sword: [['Sword God', 'Saint'], ['Water God', 'Beginner']] }))];
        const { chronicle } = await run(chat);
        const ch = JSON.stringify(chronicle);
        assert(/Training began: Healing → Advanced/.test(ch), 'training start');
        assert(/Training complete: Healing → Advanced/.test(ch), 'training complete');
        assert(/Magic Tiers:[^"]*Healing \(Intermediate\)[^"]*→[^"]*Healing \(Advanced\)/.test(ch), 'Compact rank-up recorded');
        assert(/Sword Style:[^"]*Sword God \(Intermediate\)[^"]*→[^"]*Sword God \(Advanced\)/.test(ch), 'Compact sword rank-up recorded');
        assert(/Sword Style:[^"]*Sword God \(Advanced\)[^"]*→[^"]*Sword God \(Saint\)/.test(ch), 'rank-up across a style switch recorded');
        assert(!/Magic Tiers:[^"]*→[^"]*"[^"]*Magic Tiers:/.test(ch) && (ch.match(/Magic Tiers:/g) || []).length === 1, 'a style switch alone records nothing');
    });

    // 8. Other cards keep their readings.
    check('other cards: Re:Zero Condition stays a staged condition', () => {
        const h = t.parseHud('### WORLD STATE ###\nDay: 3 | Time: 12:30\n◆ World of Re:Zero → Lugunica → Roswaal Manor → East Corridor\nHP: 72/100\nInjuries: Left forearm laceration — Raw\nCondition: Blood Loss (Mild)\n***\nx');
        assert.deepEqual(plain(t.hmsReadWounds(h).map(w => w.name)), ['Left forearm laceration']);
        assert(t.hmsReadConditions(h, t.hmsCfg()).some(c => c.name === 'Blood Loss'));
    });
    check('other cards: Skyrim skills are not magic schools', () => {
        const h = t.parseHud('### WORLD STATE ###\n4th of Last Seed, 4E 201 | 10:00\n◆ Skyrim → Whiterun Hold → Whiterun\nSkills: One-Handed 52 · Block 41 · Destruction 33\nFactions: Companions (Whelp)\n***\nx');
        assert.equal(t.spellStanding(h.lines).schools.size, 0);
        const g = t.parseHud('### WORLD STATE ###\nDay: 1 | Time: 08:00\nSkills: Lockpicking Adv · Haggling Beg\n***\nx');
        assert.equal(t.spellStanding(g.lines).schools.size, 0, 'ranked mundane skills are not magic schools');
    });
    check('other cards: a fenced inline block at the end of the HUD is still a block', () => {
        const titled = t.parseHud('### WORLD STATE ###\nDay: 1 | Time: 08:00\nHP: 10/10\n─────\n[WHDAAA]\nReel: 1\n─────\n***\nx');
        assert.equal(titled.lines.find(l => /^Reel/.test(l.text)).block, 'WHDAAA');
        const untitled = t.parseHud('### WORLD STATE ###\nDay: 1 | Time: 08:00\nHP: 10/10\n━━━━━━━━\nXP: 5/100\n━━━━━━━━\n***\nx');
        assert(untitled.lines.find(l => /^XP/.test(l.text)).block, 'an untitled block directly above the wall stays a block');
    });
    check('other cards: a "·" inside a value without a label after it stays in the value', () => {
        const h = t.parseHud('### WORLD STATE ###\nDay: 1 | Time: 08:00\nSkills: One-Handed 52 · Block 41\n***\nx');
        assert.equal(h.lines[1].fields[0].value, 'One-Handed 52 · Block 41');
    });

    console.log(`${results.length} passed, ${failed.length} failed`);
    for (const f of failed) console.log('  ✗ ' + f);
    process.exitCode = failed.length ? 1 : 0;
})();
