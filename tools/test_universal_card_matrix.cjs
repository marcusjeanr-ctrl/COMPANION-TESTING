const assert = require('node:assert/strict');
const { runtime } = require('./test_panel_tracking.cjs');
const rt = runtime();
const state = rt.ctx.emptyChatState();
const cases = [
  [
    "overlord",
    "### WORLD STATE ###\nDay: 3 | Time: 12:45\n◆ The New World → Re-Estize Kingdom → E-Rantel → Adventurer's Guild Building\nCurrent Arc: Arc 1: Beginning\nRace: Human (Humanoid) | Origin: New World\nClasses: Fighter (3) | Job Lvl: 3 | Overall Lvl: 3\nHP: 60/60 | MP: 12/12\nKarma: 0 (Neutral)\nEquipment: Steel sword\n***",
    "overlord"
  ],
  [
    "rezero",
    "### WORLD STATE ###\nDay: 3 | Time: 12:45 (Midday)\n◆ World of Re:Zero → Kingdom of Lugunica → Capital → Royal Capital Street\nRace: Human | Origin: Outworlder\nArc 1: A Day in the Capital\nDeaths: 1\nDefault Save Point: Lugunica (Day 1, 09:00)\nWitch's Scent: Lv 2\n[AUTHORITY: Return by Death] (Awakened)\nMagic: Fire | Gate: B-Rank\n***",
    "rezero"
  ],
  [
    "mushoku-living",
    "### WORLD STATE ###\nYear: K.417 | Day: 3 | Time: 12:45 (Midday)\n◆ Six-Faced World → Central Continent → Asura Kingdom → Fittoa Region\nBirth: K.404 | Race: Human | Age: 13 | Origin: Native\nCurrent Arc: Sandbox\nMana Capacity: Vast\nMartial Style: Sword God Style: Intermediate\nMagic School: Water: Intermediate, Earth: Intermediate, Fire: Elementary\nEquipment: Training sword\n***",
    "mushoku"
  ],
  [
    "cote",
    "### WORLD STATE ###\nYear 1/3 · Month 2/12 · May 1 | 08:20 (Morning)\n◆ ANHS Program → Campus → School Complex → Main Building → The Delta Classroom\nCohort: 1-DELTA | Standing: Class 1-D | Seat 12\nStandings 5/1 — ALPHA 1004 (A) · BRAVO 663 (B) · CHARLIE 492 (C) · DELTA 87 (D)\nArc 2-A: Class Average Divided By Two\nPrivate Points: 8700\nSurveillance: Watched (rear classroom camera)\nQuests: The Half Hour Before The Teacher #7510789 — live\n***",
    "cote"
  ],
  [
    "six-sided-classic",
    "### WORLD STATE ###\nArmored Dragon Calendar: K417, Month 2, Day 8 | Time: 07:20 (Morning)\n◆ Central Continent → Asura Kingdom → Fittoa Region → House King Estate\nRace: Human | Origin: Native | Age: 13 (born K404, Month 2)\nEra / Arc: Sandbox\nMana Capacity: Vast | Reserve: Full | Status: Rested\nSword Style: Sword God (Intermediate)\nMagic Tiers: Water (Intermediate), Earth (Intermediate), Fire (Beginner)\nVoiceless Casting: Active\n***",
    "mushoku"
  ],
  [
    "six-sided-visual",
    "### 🌐 WORLD STATE ###\n🗓️ **Armored Dragon Calendar:** K417, Month 2, Day 8 · 🕰️ **Time:** 07:20 (Morning)\n📍 **Central Continent → Asura Kingdom → Fittoa Region → House King Estate**\n🧬 **Race:** Human · **Origin:** Native · **Age:** 13 (born K404, Month 2)\n📖 **Era / Arc:** Sandbox\n💧 **Mana Capacity:** Vast · **Reserve:** Full · **Status:** Rested\n⚔️ **Sword Style:** Sword God (Intermediate)\n✨ **Magic Tiers:** Water (Intermediate) · Earth (Intermediate) · Fire (Beginner)\n🤫 **Voiceless Casting:** Active\n***",
    "mushoku"
  ]
];
for (const [name, input, id] of cases) {
  const hud = rt.ctx.parseHud(input);
  assert(hud, name + ' HUD not parsed');
  assert.equal(rt.ctx.worldOf(rt.ctx.worldLines(hud)), id, name + ' world identification');
  assert.equal(rt.ctx.hudToBlock(hud), input, name + ' raw HUD preservation');
  assert(hud.lines.length >= 6, name + ' lost HUD fields');
  if (id === 'mushoku') {
    const world = rt.ctx.worldMushoku('matrix', rt.ctx.worldLines(hud), state);
    assert.equal(world.magic.length, 3, name + ' lost magic schools');
    assert.equal(world.martial[0].step, 1, name + ' lost sword rank');
  }
  if (id === 'cote') {
    assert(hud.lines.find(x => x.key === 'arc'), 'COTE arc missing');
    assert(hud.lines.some(x => x.text.startsWith('Standings')), 'COTE frozen standings missing');
    assert(hud.quests[0].name.includes('#7510789'), 'COTE barcode lost');
  }
  if (id === 'rezero') assert(hud.lines.some(x => x.text.includes('Return by Death')), 'RBD authority missing');
  if (id === 'overlord') assert(hud.lines.some(x => x.text.includes('Karma')), 'Karma missing');
  console.log('PASS ' + name + ': recognized, preserved, and parsed');
}
for (const [name, fields] of [["undertale",["LV: 5","SOUL: Determination","Route: Neutral","Location: Snowdin"]],["darksouls",["Souls: 920","Estus: 4/5","Bonfire: Firelink Shrine","Humanity: 2"]],["skyrim",["Magicka: 100/100","Dragon Souls: 1","Shouts: Unrelenting Force","Location: Whiterun, Skyrim"]]]) {
  const input = ['### WORLD STATE ###',...fields,'***'].join('\n');
  assert.equal(rt.ctx.worldOf(rt.ctx.worldLines(rt.ctx.parseHud(input))), name, name + ' historical format lost');
  console.log('PASS ' + name + ': historical format retained');
}
console.log(cases.length + ' card HUD cases across 5 supplied cards plus 3 historical format detections passed.');
