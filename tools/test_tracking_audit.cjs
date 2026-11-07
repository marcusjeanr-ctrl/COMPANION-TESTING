// Regression checks for the 3.2.14 tracking-audit fixes, the 3.3.0 technique fix, the magic-discipline boundary and the HUD purse. Synthetic chats only; no private text.
// Run: node tools/test_tracking_audit.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.BACKEND || path.join(__dirname, '..', 'dist', 'backend.js'), 'utf8'); // BACKEND=<older backend.js> shows which checks fail without a fix
const startup = source.indexOf('// ───────────────────────────── Startup');
assert(startup > 0, 'backend startup marker missing');
const quiet = { log() {}, warn() {}, error() {}, info() {} };
const ctx = {
    console: quiet, structuredClone, URL, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, performance,
    spindle: new Proxy({}, { get: (t, k) => k === 'log' ? quiet : new Proxy(() => ({}), { get: () => async () => ({}), apply: () => ({}) }) }),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(source.slice(0, startup) + '\nglobalThis.__t = { chronicleBuild, agendaRead, dialogueSquare: typeof dialogueSquare === \'function\' ? dialogueSquare : null, pairMergeQuests: typeof pairMergeQuests === \'function\' ? pairMergeQuests : null, readingSource, getSwipeData, rewriteReplyText: typeof rewriteReplyText === \'function\' ? rewriteReplyText : null, setChatApi: (fn) => { chatApi.updateMessage = fn; }, factionFromHud, chronBondReworded: typeof chronBondReworded === \'function\' ? chronBondReworded : () => false, chronWhen, parseHud, techStanding: typeof techStanding === \'function\' ? techStanding : () => new Map(), questDetailsLatest, relGuard, relCfg, martialAbilityItems, techListPanel, posMovedNow, keepRoomReading, posRoomKey, setState: (st) => { getChatState = async () => st; saveChatState = async () => {}; }, setPool: p => { loreCatalogPool = () => p; }, spellStoryFold, moneyHudBalance: typeof moneyHudBalance === \'function\' ? moneyHudBalance : commsBalance, commsCfg, messageHud, moneyRead, hintEchoScrub: typeof hintEchoScrub === \'function\' ? hintEchoScrub : (o => o), studyIsTrainingTrack: typeof studyIsTrainingTrack === \'function\' ? studyIsTrainingTrack : () => false, trainingTracksNow: typeof trainingTracksNow === \'function\' ? trainingTracksNow : () => [], worldOf, worldCyberpunk: typeof worldCyberpunk === \'function\' ? worldCyberpunk : null, moneyHudBalance, commsCfg, parseHud, worldLines };', ctx);
const t = ctx.__t;

let n = 0;
const reply = (data, prose = 'The story continues.') => ({
    id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: 0, content: `${prose}`,
    extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data } } } },
});
const user = text => ({ id: `u${++n}`, role: 'user', is_user: true, swipe_id: 0, content: text });
const quest = (objective, progress) => ({ quests: [{ key: 'the long road', questId: 'q_road', name: 'The Long Road', objective, progress,
    giver: 'Old Mentor', reward: 'A letter of passage', category: 'main', state: 'active', cls: 'active' }] });
const results = [], failed = [];
const check = (name, fn) => { try { fn(); results.push(name); } catch (e) { failed.push(`${name}: ${e.message.split('\n')[0]}`); } };

// 1. Same Quest ID, a new (shorter) objective: the objective follows the story and progress starts over.
check('the echo guard drops the panel\'s own wording and keeps the story\'s', () => {
    const o = t.hintEchoScrub({ side_panel: { agenda: [{ key: 'post', what: 'Post south', when: 'in 3d 14h', due: 'due in 21h 52m (story: Day 5, first bell)' }, { key: 'b', what: 'Meet Bram', when: 'in two days' }],
        quests: [{ name: 'Road', deadline: 'in 3h 40m' }], gear: [{ name: 'purse', state: 'on body', where: 'belt, right hip · on the HUD' }], family: [{ name: 'Bram', status: 'status unknown' }, { name: 'Cassian', status: 'away at the muster yard' }] } });
    const sp = o.side_panel;
    assert.equal(sp.agenda[0].when, null); assert.equal(sp.agenda[0].due, 'Day 5, first bell'); assert.equal(sp.agenda[1].when, 'in two days');
    assert.equal(sp.quests[0].deadline, null); assert.equal(sp.gear[0].where, 'belt, right hip'); assert.equal(sp.gear[0].state, 'on body');
    assert.equal(sp.family[0].status, null); assert.equal(sp.family[1].status, 'away at the muster yard');
    assert.equal(sp.agenda[0].what, 'Post south', 'names and keys are never touched');
});
check('a study item that is only a Training track is left to the Training card', () => {
    // the Training line sits on the full HUD, not among the skill lines the cards are handed
    const chat = [{ id: 'a1', role: 'assistant', swipe_id: 0, content: '### WORLD STATE ###\nArmored Dragon Calendar: K416, Month 4, Day 1 | Time: 16:08 (Afternoon)\n◆ Roa → Boreas manor training yard\nSword Style: Sword God (Advanced)\nTraining: Sword God → Saint (54/60 sessions) · Water Magic → Saint (54/60 sessions)\n***\n\nThe yard.' }];
    const tracks = t.trainingTracksNow(chat);
    assert.equal(tracks.length, 2, 'both tracks read from the full HUD');
    for (const n of ['Sword God Style toward Saint', 'Water Magic toward Saint']) assert.equal(t.studyIsTrainingTrack(n, tracks), true, n);
    for (const n of ['Sword God stance', 'Sword God Style under Aurelius\'s drill', 'Earth Magic toward Advanced', 'Water Ball']) assert.equal(t.studyIsTrainingTrack(n, tracks), false, n);
});
check('a Cyberpunk: Living World HUD is read as Cyberpunk, every module included', () => {
    const hud = (eddies, hum, heat, extra = '') => ['### WORLD STATE ###', 'Date: November 3, 2077 | 22:40 (Night)', '◆ Night City → Watson → Kabuki → Misty\'s Esoterica',
        'Identity: Vex | Role: Netrunner | Lifepath: Streetkid | Age: 24 (born 2053)', 'Arc 3-B: Konpeki Plaza Heist', 'Game Mode: Canon: Canon | Guide: Off',
        `Eddies: ${eddies} (Streetrat)`, `Humanity: ${hum}/100 | Psyche: Shifting`, 'Street Cred: 16 | Reputation: Rising Star',
        `Cyberware: Kiroshi Optics, Cyberdeck Port${extra}`, 'Netrunning: Net Level 4 | Deck: Militech Paraline Mk.2', 'Faction: Valentinos (Initiate)',
        `Heat: ${heat} (NCPD) · Tyger Claws: Hunted`, 'Passenger: Johnny Silverhand | Overwrite: 31% | Stage: Bleed', 'Bonds: Jackie Welles (Choom), Misty Olszewski (Wary)',
        'Changes: Saved Jackie (1/3)', '  ⚠️ Checkpoint: Jackie reaches Vik by December 2077 (Arc 3-B) — in 28 days', '⏳ Next Canon Event: Konpeki Plaza heist — in 2 days (November 2077)', '***', '', 'Rain.'].join('\n');
    const same = (x, y) => assert.equal(JSON.stringify(x), JSON.stringify(y));   // the reader runs in its own realm
    const now = t.worldLines(t.parseHud(hud('2,100', 72, 3, ', Mantis Blades'))), before = t.worldLines(t.parseHud(hud('2,350', 78, 2)));
    assert.equal(t.worldOf(now), 'cyberpunk');
    assert.ok(t.worldCyberpunk, 'the reader exists');
    const w = t.worldCyberpunk(null, now, before);
    assert.equal(w.eddies, 2100); assert.equal(w.eddiesDelta, -250); assert.equal(w.humanity, 72); assert.equal(w.humanityDelta, -6); assert.equal(w.psyche, 'Shifting');
    assert.equal(w.cred, 16); assert.equal(w.reputation, 'Rising Star');
    same(w.identity, { name: 'Vex', role: 'Netrunner', lifepath: 'Streetkid', age: 24, born: 2053 });
    same(w.arc, { code: '3-B', title: 'Konpeki Plaza Heist' });
    same(w.cyberware.map(c => [c.name, c.isNew]), [['Kiroshi Optics', false], ['Cyberdeck Port', false], ['Mantis Blades', true]]);
    same(w.net, { level: 4, deck: 'Militech Paraline Mk.2' }); same(w.faction, { name: 'Valentinos', rank: 'Initiate' });
    assert.equal(w.heat.level, 3); assert.equal(w.heat.who, 'NCPD'); same(w.heat.hunted, ['Tyger Claws']); assert.equal(w.heat.prev, 2);
    assert.equal(w.passenger.pct, 31); assert.equal(w.passenger.stage, 'Bleed');
    same(w.bonds.map(b => [b.name, b.stage]), [['Jackie Welles', 'Choom'], ['Misty Olszewski', 'Wary']]);
    same(w.changes[0], { text: 'Saved Jackie', done: 1, goal: 3 }); assert.equal(w.checkpoints[0].what, 'Jackie reaches Vik');
    assert.equal(w.next.event, 'Konpeki Plaza heist'); assert.equal(w.next.inText, '2 days');
    // eddies are the purse
    const bal = t.moneyHudBalance(t.parseHud(hud('2,100', 72, 3)), t.commsCfg());
    assert.ok(bal && /2,100/.test(bal.value), 'eddies read as the balance');
    // a Dark Souls HUD with a Humanity line stays Dark Souls
    assert.notEqual(t.worldOf(['Souls: 1,204', 'Humanity: 3', 'Estus: 5/5', 'Bonfire: Firelink Shrine']), 'cyberpunk');
});
check('quest objective follows a new stage under the same Quest ID', () => {
    const chat = [user('go'), reply(quest('Win the mentor\'s approval at the training hall', 80)), user('next'),
        reply(quest('Pack for the road', 20)), user('next'), reply(quest('Pack for the road', 0))];
    const q = t.questDetailsLatest(chat).find(x => x.key === 'q_road');
    assert.equal(q.objective, 'Pack for the road');
    assert.equal(q.progress, 20, 'a new stage restarts progress; a lower report on the same stage does not regress it');
});

// 2. Unchanged 3.2.3 behavior: the same objective never regresses its progress.
check('progress on an unchanged objective does not regress', () => {
    const chat = [user('go'), reply(quest('Pack for the road', 60)), user('next'), reply(quest('Pack for the road', 10))];
    assert.equal(t.questDetailsLatest(chat).find(x => x.key === 'q_road').progress, 60);
});

// 2b. A longer old place does not outlive the story: it stays only while it refines the new report.
check('quest place follows a new place; a refinement keeps its detail', () => {
    const at = (where) => ({ quests: [{ ...quest('Depart for the capital', 10).quests[0], where }] });
    const moved = [user('go'), reply(at("north row market, the wand-maker's stall")), user('next'), reply(at('Old Hall')), user('next'), reply(at('Old Hall'))];
    assert.equal(t.questDetailsLatest(moved).find(x => x.key === 'q_road').where, 'Old Hall');
    const refined = [user('go'), reply(at('Old Hall, east yard')), user('next'), reply(at('Old Hall'))];
    assert.equal(t.questDetailsLatest(refined).find(x => x.key === 'q_road').where, 'Old Hall, east yard');
});

// 2c. Six-Sided v1.1 prints a style as "Name (Shown) — True: Rank (notes)": the style is still yours, at its True rank.
check('a sword style with a True rank is your style at that rank', () => {
    const st = t.techStanding(['Sword Style: Sword God (Advanced) — True: Advanced (age cap; potential: Saint)']);
    assert.deepEqual(JSON.parse(JSON.stringify(st.get('sword god'))), { name: 'Sword God', rank: 'Advanced', step: 2 });
    const two = t.techStanding(['Sword Style: Sword God (Saint) — True: Intermediate (age cap; potential: Saint), North God (Beginner)']);
    assert.equal(two.get('sword god').step, 1, 'the True rank decides, not the shown one');
    assert.equal(two.get('north god').step, 0);
});

// 2d. The Chronicle: a reworded bond is not a new bond, and a calendar with months keeps the month in its day.
check('chronicle skips a reworded bond and keeps the month', () => {
    assert.equal(t.chronBondReworded('his tally-keeper and the keeper of his slate', 'his tally-keeper and keeper of the slate'), true);
    assert.equal(t.chronBondReworded('keeper of the slate', 'keeper of the first-letter deal'), false);
    const hud = t.parseHud('### WORLD STATE ###\nArmored Dragon Calendar: K416, Month 4, Day 1 | Time: 06:10 (Dawn)\n◆ Central Continent → Asura Kingdom\n***');
    assert.match(t.chronWhen(hud), /^Month 4 · Day 1, 06:10/);
    assert.match(t.chronWhen(t.parseHud('### WORLD STATE ###\nDay 3 | Time: 14:20\n***')), /^Day 3/);
});

// 2e. Renown is fame, not a standing: an unknown name is no faction; a real reputation still is.
check('an unknown renown is not a neutral faction', () => {
    const read = line => JSON.parse(JSON.stringify(t.factionFromHud(t.parseHud(`### WORLD STATE ###\nTime: 09:00\n${line}\n***`))));
    assert.deepEqual(read('Renown: Asura: Unknown | elsewhere: Unknown'), []);
    assert.equal(read('Reputation: Adventurers Guild (Respected)').length, 1);
});

// 3. A bond ending with a copy of the standing loses the copy; other bonds and pinned bonds are untouched.
check('bond drops a trailing copy of the standing only', () => {
    const rc = t.relCfg(null);
    const g = (bond, standing, pin) => t.relGuard({ key: 'x', name: 'X', standing, bond, minor: false, reasons: {} }, pin, rc).bond;
    assert.equal(g('Father and head of the house, Close', 'Close'), 'Father and head of the house');
    assert.equal(g('Father and head of the house (Close)', 'Close'), 'Father and head of the house');
    assert.equal(g('close friend from the academy', 'Close'), 'close friend from the academy');
    assert.equal(g('Father, Close', 'Wary'), 'Father, Close', 'only the row\'s own standing is removed');
    assert.equal(g('Close', 'Close'), 'Close', 'never empties the bond');
    assert.equal(g('Sworn brother, Close', 'Close', { bond: 'Sworn brother, Close' }), 'Sworn brother, Close', 'a bond the player set stays as written');
});

// 4. One observation reported once is counted once.
check('a martial observation is not counted twice', () => {
    const ev = { name: 'Sword God Style', owner: 'you', state: 'reliable', historical: false, evidence: 'drove the opponent back with clean footwork' };
    const chat = [user('spar'), reply({ survival: { spells: [], learned: [], mastered: [], study: [], abilities: [ev] } }, 'In the yard you drove the opponent back with clean footwork.')];
    const item = t.martialAbilityItems('c1', chat, {}).find(x => /sword god/i.test(x.name));
    assert(item, 'martial ability missing');
    assert.equal(item.observations.length, 1);
});

// 5. (3.3.0) Practice on a technique already known shows on its card, as it does for spells.
check('practice on a known technique shows on its card', () => {
    t.setPool({ entries: [{ id: 't1', comment: '[Technique] Sword of Light', key: ['Sword of Light'],
        content: '[TECHNIQUE — Sword of Light]\nStyle: Sword God Style · Rank: Intermediate\nEffect: A single explosive cut.' }] });
    const learn = { survival: { spells: [], learned: [], mastered: [], study: [],
        abilities: [{ name: 'Sword of Light', owner: 'you', state: 'known', historical: false, evidence: 'you cut with the Sword of Light' }] } };
    const drill = { survival: { spells: [], learned: [], mastered: [], abilities: [], study: [{ spell: 'Sword of Light', progress: 40, note: 'drilled the opening stance' }] } };
    const chat = [user('train'), reply(learn, 'In the yard you cut with the Sword of Light.'), user('again'), reply(drill, 'You drill the opening stance.')];
    const row = t.techListPanel('c1', chat, {}, { _lines: ['Sword Style: Sword God (Advanced)'] }).schools.flatMap(g => g.spells).find(x => x.name === 'Sword of Light');
    assert(row, 'technique missing from the catalog');
    assert.equal(row.status, 'known');
    assert.equal(row.note, 'drilled the opening stance');
    assert.equal(row.progress, 40);
});

// 6. (3.3.4) Only a completed move in the player's own message asks for a new room.
check('room moves: completed vs hypothetical, intended or begun', () => {
    const moved = text => t.posMovedNow([user(text)]);
    for (const yes of ['*I enter my bedroom.*', 'I walk to my room.', 'I walk over to the rack, placing my sword, then I walk to my father\'s study.', '*I walk the remaining distance to my room, finally reaching the door and stepping inside.*',
        'I return to the library.', '*I quietly step into the kitchen.*', 'I head back to the courtyard.', 'I leave the study.', '*I walk to my room*'])
        assert.equal(moved(yes), true, `should move: ${yes}`);
    for (const no of ['I think about entering my bedroom.', 'I want to go to the library.', 'I begin walking back toward my room.', 'Can I go to the kitchen?',
        'I might head to the courtyard later.', '"I walk to my room," I say, staying put.', 'I look around my room.', 'I walk to my desk.', 'I walk toward the weapon rack and take a sword.', 'I burst inward. I enter, then cut toward his torso.', 'I plan to return to the hall.'])
        assert.equal(moved(no), false, `should not move: ${no}`);
});

// 8. (magic disciplines) A bare school name the model lists as a spell ("Water") is the discipline, not a spell,
//    when the chat's spell references file spells under that school. The report below is the real one from a
//    Six-Sided World session (names only), followed by the bare form the model switched to later.
const spellEntry = (name, school, rank = 'Beginner') => ({ id: name, comment: `[Spell] ${name}`, content: `[SPELL — ${name}]\nSchool: ${school} · Rank: ${rank}\nEffect: test.`, key: [name] });
const spellsFrom = (lore, reports) => {
    t.setPool({ entries: lore });
    const chat = []; for (const y of reports) chat.push(user('go'), reply({ survival: y }));
    const f = t.spellStoryFold(chat, 'c1');
    return { known: [...f.learned.keys()].sort(), mastered: [...f.mastered.keys()].sort() };
};
check('magic disciplines reported as spells stay out of the spellbook', () => {
    const lore = [spellEntry('Squall', 'Water', 'Advanced'), spellEntry('Earth Pillar', 'Earth', 'Intermediate'), spellEntry('Stone Cannon', 'Earth', 'Intermediate'),
        spellEntry('Earth Wall', 'Earth'), spellEntry('Heat Hand', 'Fire', 'not stated'), spellEntry('Fireball', 'Fire')];
    const r = spellsFrom(lore, [
        { spells: ['Squall', 'Earth Pillar', 'Stone Cannon', 'Water Magic', 'Earth Magic', 'Fire Magic'], learned: [], mastered: [] },
        { spells: ['Water', 'Earth', 'Fire', 'Earth Wall'], learned: [], mastered: ['Heat Hand'] }]);
    for (const school of ['water', 'earth', 'fire', 'water magic', 'earth magic', 'fire magic']) assert(!r.known.includes(school), `"${school}" counted as a spell`);
    for (const spell of ['squall', 'earth pillar', 'stone cannon', 'earth wall']) assert(r.known.includes(spell), `"${spell}" was lost`);
    assert.deepEqual(r.mastered, ['heat hand'], 'Heat Hand stays mastered');
});
check('a spell genuinely named like an element is kept', () => {
    // a book with a spell called "Fire" (school Black) and a school called Water: "Fire" is a spell, "Water" is not
    const r = spellsFrom([spellEntry('Fire', 'Black'), spellEntry('Aqua Jet', 'Water')], [{ spells: ['Fire', 'Water', 'Aqua Jet'] }]);
    assert(r.known.includes('fire') && r.known.includes('aqua jet'), 'the spell named Fire was rejected');
    assert(!r.known.includes('water'), 'the Water school became a spell');
    // a school and a spell with the same name: the exact spell wins
    assert(spellsFrom([spellEntry('Fire', 'Fire')], [{ spells: ['Fire'] }]).known.includes('fire'), 'a spell named after its own school was rejected');
});
check('a learned spell written with its school and rank is the same spell (export 7)', () => {
    const r = spellsFrom([spellEntry('Earth Wall', 'Earth', 'Intermediate'), spellEntry('Earth Pillar', 'Earth', 'Intermediate')], [{ spells: ['Earth Pillar'], learned: ['Earth Wall — Earth, Intermediate'] }]);
    assert(r.known.includes('earth wall'), 'Earth Wall was not learned');
    assert.equal(r.known.filter(k => /earth wall/.test(k)).length, 1, `two Earth Walls: ${r.known.join(', ')}`);
    const p = spellsFrom([spellEntry('Earth Wall', 'Earth', 'Intermediate')], [{ learned: ['Earth Wall (Earth, Intermediate)'] }]);
    assert.deepEqual(p.known.filter(k => /earth wall/.test(k)), ['earth wall'], `bracketed form: ${p.known.join(', ')}`);
});
check('a physical skill the reporter names is not a spell (export 9 "Bracer wand flick")', () => {
    const r = spellsFrom([spellEntry('Earth Wall', 'Earth', 'Intermediate')], [{ spells: [], learned: ['Earth Wall'], abilities: [{ name: 'Bracer wand flick', owner: 'you', state: 'reliable', evidence: 'wand flicked, seated again' }, { name: 'Break-falls', owner: 'you', state: 'practiced', evidence: 'break-falls from the knees' }] }]);
    for (const k of ['bracer wand flick', 'break falls', 'break-falls']) assert(!r.known.includes(k), `${k} landed in the Spellbook: ${r.known.join(', ')}`);
    assert(r.known.includes('earth wall'));
});
check('without spell references nothing is filtered', () => {
    const r = spellsFrom([], [{ spells: ['Fire', 'Water', 'Cure'] }]);
    assert.deepEqual(r.known, ['cure', 'fire', 'water']);
});

// 9. (1.0.1 finances) The purse as the HUD shows it, on a holdings line, without inventing transactions.
const hudReply = (line, data = {}) => ({ id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: 0,
    content: `### WORLD STATE ###\nDay: 3 | Time: 12:45 (Afternoon)\n◆ Kingdom → Hall → Room\n${line}\n***\nThe story continues.`,
    extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data } } } } });
const balanceOf = line => { const b = t.moneyHudBalance(t.messageHud(hudReply(line)), t.commsCfg()); return b ? `${b.label}: ${b.value}` : null; };
check('a holdings line with money is the balance, as written', () => {
    assert.equal(balanceOf('Resources: 12 Gold, 45 Silver'), 'Resources: 12 Gold, 45 Silver');
    assert.equal(balanceOf('Purse: 300 credits'), 'Purse: 300 credits');
    assert.equal(balanceOf('Gold: 12'), 'Gold: 12', 'a balance label reads as before');
});
check('a holdings line without money, or a reward line, is not a balance', () => {
    assert.equal(balanceOf('Resources: 3 rations, 2 torches'), null);
    assert.equal(balanceOf('Resources: plenty of supplies'), null);
    assert.equal(balanceOf('Reward: 50 Gold'), null, 'a quest reward is not money you hold');
});
check('a balance seen again adds no money and creates no income', () => {
    const chat = [user('I count my coins.'), hudReply('Resources: 12 Gold, 45 Silver', { money: [] }), user('I wait.'),
        hudReply('Resources: 12 Gold, 45 Silver', { money: [] }), user('I wait.'), hudReply('Resources: 12 Gold, 45 Silver', { money: [] })];
    const r = t.moneyRead(chat, {});
    assert.equal(r.balance && r.balance.value, '12 Gold, 45 Silver');
    assert.equal(r.list.length, 0, 'no ledger entry');
    assert.equal(Object.keys(r.totals).length, 0, 'no income');
    // a real purchase is still a transaction, and the balance follows the newest HUD
    chat.push(user('I buy bread.'), hudReply('Resources: 11 Gold, 45 Silver', { money: [{ amount: 1, currency: 'Gold', kind: 'expense', dir: 'out', what: 'bread' }] }));
    const r2 = t.moneyRead(chat, {});
    assert.equal(r2.balance.value, '11 Gold, 45 Silver');
    assert.equal(r2.list.length, 1); assert.equal(r2.totals.Gold.out, 1);
    // a promised payment the reporter marks as not accepted is not money received
    chat.push(user('He promises to pay.'), hudReply('Resources: 11 Gold, 45 Silver', { money: [{ amount: 5, currency: 'Gold', kind: 'income', dir: 'in', what: 'promised fee', accepted: false }] }));
    assert.equal(t.moneyRead(chat, {}).list.length, 1, 'a promise is not recorded');
});

// 8. Agenda letters (chat 2 export): a letter needs the story to say it; "the first letter" to one person is one item;
// waiting on an arrival somewhere else is not under way.
const scene = (place, prose, data) => ({ id: `m${++n}`, role: 'assistant', is_user: false, swipe_id: 0,
    content: `### WORLD STATE ###\nDay: 3 | Time: 21:10 (Night)\n◆ Kingdom → ${place}\n***\n${prose}`,
    extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data } } } } });
const letter = (what, who, state = 'open') => ({ key: what.toLowerCase(), what, with: who, where: 'Riverton', when: 'when he reaches Riverton', kind: 'letter', state });
check('a letter the story never mentions is not added', () => {
    const chat = [user('I nod.'), scene('Old Hall, study', '[D:Mira]"Supper within the hour."[/D]\nThe ledger goes into the drawer with the other letter.', { agenda: [letter('Write the first letter from Riverton to Mira', 'Mira Vale')] })];
    assert.equal(t.agendaRead(chat, {}).items.length, 0, 'Mira speaks, and a letter is mentioned, but not a letter to her');
    const told = [user('I nod.'), scene('Old Hall, study', '[D:Tess]"Then it\'s settled. First letter out of Riverton comes to my hand."[/D]', { agenda: [letter('Send the first letter from Riverton to Tess', 'Tess Vale')] })];
    assert.equal(t.agendaRead(told, {}).items.length, 1, 'spoken as her, about the letter');
    const asked = [user('I look at Tess. I\'ll write to you first, Tess.'), scene('Old Hall, study', 'She nods once.', { agenda: [letter('Write to Tess from Riverton', 'Tess Vale')] })];
    assert.equal(t.agendaRead(asked, {}).items.length, 1, 'the promise in your own message counts');
    const no = [user('I nod.'), scene('Old Hall, study', '[D:Mira]"No letters tonight. Only food."[/D]', { agenda: [letter('Write the first letter from Riverton to Mira', 'Mira Vale')] })];
    assert.equal(t.agendaRead(no, {}).items.length, 0, '"no letters" rules the letter out');
});
check('the first letter to one person is one agenda item', () => {
    const chat = [user('Deal.'), scene('Old Hall, study', '[D:Tess]"Your first letter from Riverton comes to me."[/D]', { agenda: [letter('Write the first letter from Riverton to Tess', 'Tess Vale')] }),
        user('I smile.'), scene('Old Hall, study', '[D:Tess]"The first letter home is mine, remember."[/D]', { agenda: [letter('First letter home goes to Tess', 'Tess Vale')] })];
    const items = t.agendaRead(chat, {}).items;
    assert.equal(items.length, 1); assert.equal(items[0].what, 'First letter home goes to Tess');
    const two = [user('Deal.'), scene('Old Hall, study', '[D:Tess]"Your first letter from Riverton comes to me."[/D] [D:Kai]"And write to me after, Marcus."[/D]', { agenda: [letter('Write the first letter from Riverton to Tess', 'Tess Vale'), letter('Write a second letter to Kai', 'Kai Vale')] })];
    assert.equal(t.agendaRead(two, {}).items.length, 2, 'another person\'s letter stays its own');
});
check('a short agenda title before ";" or "," is the same item (1.4.0)', () => {
    const row = (what, wh, when) => ({ key: what.toLowerCase(), what, with: wh, where: 'Old Hall yard', when, kind: 'meeting', state: 'open' });
    const chat = [user('Fine.'), scene('Old Hall, yard', '[D:Tess]"Dawn drill, first bell, every day."[/D]', { agenda: [row('Dawn drill with Tess, first bell, every day', 'Tess Vale', 'dawn, first bell'), row('Post leaves Day 5, first bell; letters by dusk the day before', 'Courier', 'Day 5, first bell')] }),
        user('I nod.'), scene('Old Hall, yard', 'Supper waits.', { agenda: [row('Dawn drill with Tess', 'Tess Vale', 'dawn, first bell'), row('Post leaves Day 5, first bell', 'Courier', 'Day 5, first bell')] })];
    assert.equal(t.agendaRead(chat, {}).items.length, 2);
});
check('an agenda title cut short, same time and person, is the same item (1.4.0)', () => {
    const row = (what) => ({ key: what.toLowerCase(), what, with: 'Courier', where: 'seed yard', when: 'Day 5, first bell', kind: 'other', state: 'open' });
    const chat = [user('Fine.'), scene('Old Hall, yard', 'The post goes Day 5.', { agenda: [row('Post pouch back south leaves Day 5, first bell')] }),
        user('Ok.'), scene('Old Hall, yard', 'Supper.', { agenda: [row('Post pouch back south leaves')] })];
    assert.equal(t.agendaRead(chat, {}).items.length, 1);
});
check('<D:Eris>"…"</D> is read as the dialogue marker (1.4.0)', () => {
    assert.ok(t.dialogueSquare, 'exists');
    assert.equal(t.dialogueSquare('<D:Eris>"Take a stance."</D> She waits. <D:Ghislaine:calm>"Again."</D>'), '[D:Eris]"Take a stance."[/D] She waits. [D:Ghislaine:calm]"Again."[/D]');
    assert.equal(t.dialogueSquare('<div>plain</div>'), '<div>plain</div>');
});
check('Merge on two look-alike rows makes them one, and can be split again (1.4.0)', () => {
    const row = (what, wh) => ({ key: what.toLowerCase(), what, with: wh, where: 'Old Hall', when: 'after supper', kind: 'meeting', state: 'open' });
    const chat = [user('Fine.'), scene('Old Hall, hall', 'Talk later.', { agenda: [row('Talk with Kai on the bench', 'Kai'), row('Bench talk with Kai', 'Kai')] })];
    assert.equal(t.agendaRead(chat, {}).items.length, 2, 'two different titles stay two until you merge them');
    const merged = t.agendaRead(chat, { agendaPairs: { ['bench talk with kai || talk with kai on the bench']: 'same' } }).items;
    assert.equal(merged.length, 1); assert.deepEqual([...merged[0].also], ['Bench talk with Kai']);
    assert.ok(t.pairMergeQuests, 'quest merge exists');
    const qs = [{ key: 'roa-study', name: 'Study under the Sword King', objective: 'Train at dawn', category: 'main' }, { key: 'sword-king-training', name: 'Sword King training', objective: null, progress: 40, category: 'personal' }];
    const one = t.pairMergeQuests(qs, { ['roa-study || sword-king-training']: 'same' });
    assert.equal(one.length, 1); assert.equal(one[0].name, 'Study under the Sword King'); assert.equal(one[0].progress, 40);
    assert.equal(t.pairMergeQuests(qs, { ['roa-study || sword-king-training']: 'different' }).length, 2);
});
check('a letter waiting on the arrival is not in progress at home', () => {
    const chat = [user('Deal.'), scene('Old Hall, study', '[D:Tess]"Your first letter from Riverton comes to me."[/D]', { agenda: [letter('Write the first letter from Riverton to Tess', 'Tess Vale', 'in_progress')] }),
        user('I smile.'), scene('Old Hall, gate', '[D:Tess]"The first letter is mine."[/D]', { agenda: [letter('Write the first letter from Riverton to Tess', 'Tess Vale', 'open')] })];
    assert.equal(t.agendaRead(chat, {}).items[0].state, 'open');
    chat.push(user('I arrive.'), scene('Riverton, inn', '[D:Inn]"Paper and ink, sir."[/D] You start the first letter to Tess.', { agenda: [letter('Write the first letter from Riverton to Tess', 'Tess Vale', 'in_progress')] }));
    assert.equal(t.agendaRead(chat, {}).items[0].state, 'in_progress', 'in Riverton it can be under way');
});

// 8b. The Chronicle logs a learned spell only when the Spellbook accepts it: a sentence in the learned slot is not a spell.
check('a reporter sentence in the learned slot is not a learned spell', () => {
    const rep = learned => scene('Old Hall, yard', 'Water gathers in your palm and holds.', { survival: { learned } });
    const chat = [user('I practise.'), rep(['Water Ball']), user('Again.'), rep(['Lord Boreas wants Marcus as steady company for his nephew, not for any gift of mana'])];
    const texts = (t.chronicleBuild(chat, {}, 'Marcus') || []).map(e => e.text).filter(x => /Learned/.test(x));
    assert(!texts.some(x => /Lord Boreas/.test(x)), 'the sentence is not logged as a spell');
    assert(texts.some(x => /Water Ball/.test(x)), 'a real spell is still logged');
});

(async () => {
// 9. The Companion's own edit to a reply's text (a Training count, a restored HUD line) keeps that reply's reading.
try {
    assert(t.rewriteReplyText, 'rewriteReplyText missing');
    const msg = scene('Old Hall', 'The story continues.', { agenda: [letter('Write to Tess', 'Tess Vale')] });
    msg.extra.spindle_metadata.rpg_companion.sources = { 0: t.readingSource(msg.content) };
    let sent = null; t.setChatApi(async (cid, mid, patch) => { sent = patch; });
    const next = msg.content.replace('Day: 3', 'Day: 4');
    await t.rewriteReplyText('c1', msg, { content: next });
    const after = { ...msg, content: next, metadata: sent.metadata };
    assert(t.getSwipeData(after, true), 'the reading is still valid after the edit');
    const stale = scene('Old Hall', 'The story continues.', { agenda: [] });
    stale.extra.spindle_metadata.rpg_companion.sources = { 0: 'not-this-text' };
    sent = null; await t.rewriteReplyText('c1', stale, { content: 'x' });
    assert(!sent.metadata, 'a reading that was already stale is not re-signed');
    results.push('the Companion\'s own text edit keeps the reply\'s reading');
} catch (e) { failed.push(`the Companion's own text edit keeps the reply's reading: ${e.message.split('\n')[0]}`); }
// 7. (3.3.4) Drawing a different room under the same place keeps the earlier room.
try {
    const st = { rooms: { 'fittoa region > hall': { name: 'Dining hall', w: 10, h: 10, features: [], exits: [] } } };
    t.setState(st);
    const hud = { location: ['Central Continent', 'Fittoa Region', 'Hall'] };
    await t.keepRoomReading('c1', { room: { name: 'Bedroom', w: 6, h: 6, features: [], exits: [] } }, hud);
    assert.equal(st.rooms['fittoa region > hall'].name, 'Bedroom', 'the current room is the new one');
    assert.equal(st.rooms['fittoa region > hall :: dining hall'].name, 'Dining hall', 'the earlier room is kept');
    await t.keepRoomReading('c1', { room: { name: 'Bedroom', w: 7, h: 6, features: [], exits: [] } }, hud);
    assert.equal(Object.keys(st.rooms).length, 2, 'redrawing the same room adds nothing');
    results.push('a new room under the same place keeps the earlier one');
} catch (e) { failed.push(`a new room under the same place keeps the earlier one: ${e.message.split('\n')[0]}`); }
console.log(`tracking audit regressions: ${results.length} passed, ${failed.length} failed`);
for (const r of results) console.log(`  ✓ ${r}`);
for (const f of failed) console.log(`  ✗ ${f}`);
if (failed.length) process.exitCode = 1;
})();
