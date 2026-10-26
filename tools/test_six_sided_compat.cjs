const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../dist/backend.js'), 'utf8');
const arcEntries = JSON.parse(fs.readFileSync(path.join(__dirname, 'six_sided_arc_fixture.json')));
function section(from, to) { const a = src.indexOf(from), b = src.indexOf(to, a + from.length); assert(a >= 0 && b > a, from); return src.slice(a, b); }
const code = [
 section('function reportNumber(value)', 'function partyLevel(v)'),
 section('function reportSpeculative(row)', 'function simLearnedNormalize(list)'),
 section('function pocketAcquisitionPending(value)', '/**\n * What the player carries'),
 section('function hmsSplitTop(str, sepRe)', 'function hmsNum(s)'),
 section('let activeReadPass =', 'async function pushState('),
 section('function messageHud(m)', 'function hmsTimeline(chat,'),
 'const hmsParseCache = new Map();',
 section('const HUD_HEAD_RE =', '/**\n * True when the HUD was replaced'),
 section('const WORLD_LABEL =', '// ── Expansions read from the bots'),
 section('function mtManaTierLore(chatId,', 'function worldReZero('),
 section('const MT_ABBR =', '/** The panel payload for the world card'),
 section('/** In-world minutes from the HUD', 'function hmsSpan('),
 section('const ATLAS_TIER_RE =', '// ───────────────────────────── Positions and the room map'),
 section('function spellStanding(lines)', '/** What the story reports'),
 section('function spellEstablishedList(content, playerName)', 'const SPELL_STATUS_ORDER ='),
 section('const SPELL_STATUS_ORDER =', '/** The spells being studied'),
 section('function spellStudyReminder(', '/** The catalog in the Master Spell Index'),
 section('function plotCfg()', 'function objectivesNormalize(list)'),
 section('const AGENDA_KINDS =', 'function agendaNormalize(list)'),
 section('function agendaNormalize(list)', 'function agendaRequest('),
 section('const OOC_TURN_RE =', '/** What the guide may draw on'),
 section('function hmsParseWhen(text,', '/** The latest quest details'),
 section('const FAM_KIN_RE =', '/** Everyone in the family'),
 section('const GEAR_STATES =', 'function hmsGearPanel('),
 section('function gearRequest(chat,', 'async function hmsGearEdit('),
 'const SPELL_MT_WORDS = {beginner:0,basic:0,elementary:0,elem:0,intermediate:1,advanced:2,saint:3,king:4,emperor:5,imperial:5,god:6,divine:6};',
 'function spellMtStep(s) { const m=String(s).toLowerCase().match(/\\b(beginner|basic|elementary|elem|intermediate|advanced|saint|king|emperor|imperial|god|divine)\\b/); return m ? SPELL_MT_WORDS[m[1]] : null; }',
 'function spellSchoolKey(s) { return String(s).toLowerCase(); }',
 'function spellTitle(s) { return s; }',
 'function lockKey(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }',
 'function hudFieldsFixed(s) { return s; }',
 'function hmsMarkBlocks() {}',
 'function hmsCfg() { return {quests:{},gear:{}}; }',
 'function hmsFieldsOf(l) { return l.fields || []; }',
 'function hmsLabelIn(label,list) { return list.some(x => label.toLowerCase()===x.toLowerCase()); }',
 'function relSameWords(a,b) { return String(a).toLowerCase() === String(b).toLowerCase(); }',
 'function hmsTimeline(chat) { return chat.filter(m => m.hud).map(m => ({msg:m,hud:m.hud,clock:hmsClock(m.hud)?.minutes ?? 100})); }',
 'function relReadings(chat) { return chat.filter(m => m.role === "assistant"); }',
 'function pocketIsMessage() { return false; }',
 'function worldLore() { return null; }',
 'function worldSpellIndex() { return null; }',
 'function spellIndexFromCatalog() { return null; }',
 'function getLorePool() { return entries; }',
 'function loreCatalogPool(chatId) { return lorePool.get(chatId); }',
 'function isPlainObject(x) { return x && typeof x === "object" && !Array.isArray(x); }',
 'function immText(s,n) { return typeof s === "string" ? s.slice(0,n) : null; }',
 'function partyText(s,n) { return typeof s === "string" ? s.slice(0,n) : null; }',
 'function getSwipeData(m) { return m.metadata?.rpg_companion?.swipes?.[String(m.swipe_id ?? 0)] || m.data || null; }',
 'function spellKey(s) { return lockKey(s); }',
 'function textOf(s) { return s; }',
 'function stripCompanion(s) { return s; }',
 'function stripLeakedReasoning(s) { return s; }',
 'const userNameCache = new Map();',
 'const lorePool = new Map(), LORE_POOL_MAX_CHATS = 10;',
 'function logW() {}',
 'const FAM_STATUS = ["alive","missing","dead","unknown"], FAM_KNOWN = ["seen","told","guess"];',
 'const SPELL_ELEMENTS = /water|earth|fire|wind/i;',
 'const SPELL_LADDER = {mt:["Beginner","Intermediate","Advanced"]};',
 'const spellRows = [{name:"Earth Wall",key:"earth wall",school:"Earth",parent:null,ladder:"mt",step:null,rank:null,kind:"normal",effect:"An earthen wall.",chant:null,fan:false},{name:"Earth Spear",key:"earth spear",school:"Earth",parent:null,ladder:"mt",step:1,rank:"Intermediate",kind:"normal",effect:null,chant:null,fan:false}];',
 'function spellCatalog() { return spellRows; }',
 'function chatIdOf() { return null; }',
 'function loreQueueCatalog() {}',
 'const entries = [];',
 'function hmsClockTest(h) { return hmsClock(h); }',
].join('\n');
const ctx = vm.createContext({}); vm.runInContext(code, ctx);
function evalExpr(expr) { return vm.runInContext(expr, ctx); }
const six = `### WORLD STATE ###\nArmored Dragon Calendar: K417, Thawmoon (Month 2), Day 8 — Dragonsday | Season: Spring | Time: 07:15 (Early Morning)\n◆ Central Continent → Asura Kingdom → Fittoa Region → House King Estate → Training Yard\nRace: Human | Origin: Native | Age: 13 (born K404, Month 2)\nMana Capacity: Vast | Reserve: Full\nTouki (Battle Aura): Active\nSword Style: Sword God (Intermediate)\nMagic Tiers: Water (Intermediate), Earth (Intermediate), Fire (Beginner)\nVoiceless Casting: Active\nCanon: Living\nNarrative Mode: Strict Agency\nCurrent Arc: Sandbox\n***\nScene.`;
const living = `### WORLD STATE ###\nYear: K.417 | Day: 8 | Time: 07:15\nLocation: ◆ Six-Faced World → Central Continent → Asura Kingdom → Buena Village\nBirth: K.404 | Race: Human | Age: 13 | Origin: Native\nMana Capacity: Monstrous\nCasting Method: Voiceless (Silent)\nTouki: Active\nMartial Style: Sword God Style: Intermediate\nMagic School: Water: Intermediate, Earth: Intermediate\nCurrent Arc: Arc 3: Demon Continent\n***\nScene.`;
const h6 = ctx.parseHud(six), hl = ctx.parseHud(living);
evalExpr('lorePool').set('test',{entries:[
 {key:['Mana Capacity Expansion Ritual'],content:'Mana Capacity Expansion Ritual: Highly dangerous.'},
 {key:['Mana Capacity'],content:'[MANA CAPACITY — TIERS]\nTHE TIERS\n- Vast (~6,000 MP): ~24 Advanced or ~6 Saint spells.\n- Average (~400 MP): ~8 Intermediate spells.'}
]});
assert.deepEqual(Array.from(h6.location), ['Central Continent','Asura Kingdom','Fittoa Region','House King Estate','Training Yard']);
assert.equal(ctx.worldOf(ctx.worldLines(h6)), 'mushoku');
assert.equal(ctx.worldOf(ctx.worldLines(hl)), 'mushoku');
for (const [id, sample] of [
 ['rezero','Deaths: 0 | Witch\'s Scent: Faint\nLocation: World of Re:Zero → Lugunica'],
 ['overlord','Overall Lvl: 100 | Racial Lvl: 40\nKarma: -500\nLocation: Great Tomb of Nazarick'],
 ['cote','Cohort: 1-D\nStandings: 50\nPrivate Points: 1000\nLocation: The ANHS Program'],
 ['undertale','LV: 1\nSOUL: Red\nRoute: Neutral\nLocation: Snowdin'],
 ['darksouls','Souls: 1234\nEstus: 5\nBonfire: Firelink Shrine'],
 ['skyrim','Magicka: 100\nDragon Souls: 1\nShouts: Unrelenting Force\nLocation: Whiterun, Skyrim']
]) assert.equal(ctx.worldOf(ctx.worldLines(ctx.parseHud(`### WORLD STATE ###\n${sample}\n***\nScene.`))),id);
const w6=ctx.worldMushoku('test',ctx.worldLines(h6),{}), wl=ctx.worldMushoku('test',ctx.worldLines(hl),{});
assert.equal(w6.year,417); assert.equal(w6.month,2); assert.equal(w6.day,8);
assert.equal(w6.birth,404); assert.equal(w6.birthMonth,2); assert.equal(w6.age,13);
assert.equal(w6.mana,'Vast'); assert.equal(w6.reserve,'Full'); assert.equal(w6.touki,'Active');
assert.match(w6.manaLore,/^Vast \(~6,000 MP\)/);
assert.equal(wl.manaLore,null);
assert.equal(w6.magic[0].step,1); assert.equal(w6.magic[2].step,0);
assert.equal(w6.martial[0].step,1); assert.equal(w6.agency,'Strict Agency'); assert.equal(w6.canon,'Living');
assert.equal(wl.mana,'Monstrous'); assert.equal(wl.magic[0].step,1); assert.equal(wl.martial[0].step,1);
const missingBirth=ctx.worldMushoku('test',ctx.worldLines(ctx.parseHud(six.replace('Age: 13 (born K404, Month 2)','Age: 13'))),{});
assert.equal(missingBirth.birth,null);
assert.equal(missingBirth.age,13);
const standaloneBirth=ctx.worldMushoku('test',ctx.worldLines(ctx.parseHud(six.replace('Age: 13 (born K404, Month 2)','Age: 13 | Born: K404, Month 2'))),{});
assert.equal(standaloneBirth.birth,404);
assert.equal(standaloneBirth.birthMonth,2);
assert.equal(ctx.spellStanding(h6.lines).voiceless,true); assert.equal(ctx.spellStanding(h6.lines).schools.get('water').step,1);
assert.equal(ctx.spellStanding(hl.lines).schools.get('water').step,1);
const rankPanel=ctx.spellListPanel('test',[],{}, {_lines:h6.lines});
assert.equal(rankPanel.schools.find(s=>s.name==='Earth').spells.find(s=>s.name==='Earth Wall').status,'unranked');
assert.equal(rankPanel.schools.find(s=>s.name==='Earth').reach,1);
assert.equal(rankPanel.schools.find(s=>s.name==='Earth').unranked,1);
const practice=[{id:'p1',role:'assistant',data:{survival:{study:[{spell:'Earth Wall',progress:null,note:'Practiced shaping a short wall'}]}}}];
const practicePanel=ctx.spellListPanel('test',practice,{}, {_lines:h6.lines});
assert.equal(practicePanel.schools.find(s=>s.name==='Earth').spells.find(s=>s.name==='Earth Wall').status,'study');
assert.equal(practicePanel.schools.find(s=>s.name==='Earth').spells.find(s=>s.name==='Earth Wall').progress,null);
assert.match(ctx.spellStudyReminder('test',practice,{},'the player'),/Earth Wall/);
assert(!ctx.spellStudyReminder('test',practice,{},'the player').includes('0%'));
const stopped={spellStudyStopped:{'earth wall':'p1'}};
assert.equal(ctx.spellListPanel('test',practice,stopped,{_lines:h6.lines}).schools.find(s=>s.name==='Earth').spells.find(s=>s.name==='Earth Wall').status,'unranked');
const resumed=[...practice,{id:'p2',role:'assistant',data:{survival:{study:[{spell:'Earth Wall',progress:30,note:'Worked with a teacher'}]}}}];
assert.equal(ctx.spellListPanel('test',resumed,stopped,{_lines:h6.lines}).schools.find(s=>s.name==='Earth').spells.find(s=>s.name==='Earth Wall').status,'study');
const learned=[...resumed,{id:'p3',role:'assistant',data:{survival:{learned:['Earth Wall']}}}];
assert.equal(ctx.spellListPanel('test',learned,{}, {_lines:h6.lines}).schools.find(s=>s.name==='Earth').spells.find(s=>s.name==='Earth Wall').status,'known');
assert.equal(w6.saga.participation,'personal'); assert.equal(w6.saga.personalArc,'Sandbox');
assert.equal(wl.saga.participation,'explicit');
assert.equal(ctx.hmsClockTest(h6).dated,true);
const later=ctx.parseHud(six.replace('Day 8','Day 9'));
assert.equal(ctx.hmsClockTest(later).minutes-ctx.hmsClockTest(h6).minutes,1440);
assert.equal(ctx.agendaWhen('Day 9, 08:00','',ctx.hmsClockTest(h6).minutes,h6)-ctx.hmsClockTest(h6).minutes,24*60+45);
assert.equal(ctx.agendaWhen('Day 9, 08:00','',ctx.hmsClockTest(hl).minutes,hl)-ctx.hmsClockTest(hl).minutes,24*60+45);
assert.equal(ctx.agendaWhen('K417, Seedwake (Month 3), Day 1 — 08:00','',ctx.hmsClockTest(h6).minutes,h6)-ctx.hmsClockTest(h6).minutes,(30-8+1)*1440+45);
assert.equal(ctx.agendaWhen(null,'tomorrow at dawn',ctx.hmsClockTest(h6).minutes,h6)-ctx.hmsClockTest(h6).minutes,22*60+45);
const agendaChat=[{id:'a1',role:'assistant',hud:h6,data:{agenda:[{key:'steel lesson',what:'Steel lesson',when:'tomorrow morning',due:'Day 9, 08:00',kind:'meeting',state:'open'}]}}];
assert.equal(ctx.hmsAgendaPanel(agendaChat,{},{}).items[0].dueIn,24*60+45);
const monthEnd=ctx.parseHud(six.replace('Day 8','Day 30'));
const nextMonth=ctx.parseHud(six.replace('Thawmoon (Month 2), Day 8','Seedwake (Month 3), Day 1'));
assert.equal(ctx.hmsClockTest(nextMonth).minutes-ctx.hmsClockTest(monthEnd).minutes,1440);
const comma=ctx.parseHud(six.replace('Asura Kingdom → Fittoa Region → House King Estate → Training Yard','Asura Kingdom, Fittoa Region → House King Estate, Training Yard'));
assert.deepEqual(Array.from(comma.location),Array.from(h6.location));
const atlas=ctx.atlasFor('test',comma.location);
assert(atlas && atlas.nodes.size===5);
assert.equal(ctx.atlasLocate(atlas,comma.location).past.length,0);
ctx.atlasFor('test',ctx.parseHud(six.replace('Training Yard','Kitchen')).location);
assert.equal(atlas.nodes.size,6);
assert.equal([...atlas.nodes.values()].filter(n=>n.name==='House King Estate').length,1);
assert.equal(ctx.atlasFor('other',['World of Re:Zero','Lugunica']),null);
const story=[{id:'m1',role:'assistant',data:{survival:{learned:['Water Ball'],study:[{spell:'Water Ball',progress:null}]},plot:{canonEvents:[{name:'Mana Calamity',state:'changed',detail:'Fittoa remained intact',arc:3}]}}},
 {id:'m2',role:'assistant',data:{survival:{mastered:['Water Ball']}}}];
const fold=ctx.spellStoryFold(story);
assert.equal(fold.progress.get('water ball').progress,null);
assert(fold.mastered.has('water ball'));
assert.equal(ctx.spellKnown(story,{spellbook:[{name:'Unlearned Menu Spell',from:'fight'}]},fold).has('unlearned menu spell'),false);
assert.equal(ctx.spellKnown(story,{},fold).has('water ball'),true);
assert.equal(ctx.spellSame('water ball','water ball storm'),false);
assert.equal(ctx.mtEventLedger(story)[0].state,'changed');
const swiped={id:'s1',role:'assistant',swipe_id:1,metadata:{rpg_companion:{swipes:{'0':{plot:{canonEvents:[{name:'Mana Calamity',state:'occurred',detail:'Old swipe'}]}},'1':{plot:{canonEvents:[{name:'Mana Calamity',state:'prevented',detail:'Active swipe'}]}}}}}};
assert.equal(ctx.mtEventLedger([swiped])[0].state,'prevented');
assert.equal(ctx.plotNormalize({canonEvents:[{name:'Rumor',state:'predicted',detail:'maybe'}]}),null);
assert.equal(ctx.famNormalize([{name:'Aldous',relation:'teacher'},{name:'Seraphina',relation:'mother'}]).length,1);
assert.equal(ctx.oocChatText(null,'How does mana work?'),'OOC: How does mana work?');
assert.equal(ctx.oocTurnIn([{id:'o1',role:'user',content:ctx.oocChatText(null,'How does mana work?')}]),true);
assert.equal(ctx.oocChatText({trigger:'[OOC:'},'Question'),'[OOC: Question]');
assert.equal(ctx.gearState('wielding'),'in hand');
assert.equal(ctx.gearState('stored in the room'),'stowed');
assert.equal(ctx.gearNormalize([{item:'Roxy wand',state:'in hand'},{item:'Estate sword',state:'nearby'}]).length,1);
const gearHud={lines:[{kind:'field',fields:[{label:'Equipment',value:'Longsword (sheathed), Backpack [rope, rations]'}]}]};
assert.equal(ctx.gearFromHud(gearHud).length,2);
const gearChat=[{id:'g0',role:'assistant',hud:gearHud,data:{}},{id:'g1',role:'assistant',data:{gear:[{name:'Longsword',state:'in hand'}]}}];
const gearNow=ctx.gearRead(gearChat,{},{}).items;
assert.equal(gearNow.find(x=>x.name==='Longsword').state,'in hand');
assert.equal(gearNow.find(x=>x.name==='rope').inside,'Backpack');
assert.equal(gearNow.find(x=>x.name==='Backpack').onHud,true);
assert(!ctx.gearRequest(gearChat,{},'Marcus',{gear:{enabled:false}}));
assert(ctx.plotRequest('Marcus',true).rules.includes('Another character proposing'));
assert(!ctx.plotRequest('Marcus',false).json.includes('canonEvents'));
evalExpr('entries').push(...arcEntries);
assert.equal(ctx.mtArcList('test').length,22);
assert.equal(ctx.mtArcList('test').find(x=>x.no===3).year,417);
console.log('Compatibility assertions passed: both HUDs, 30-day calendar, Atlas, automatic spell study and learning, family, saga ledger, objectives, gear, and 22 lorebook arcs.');

