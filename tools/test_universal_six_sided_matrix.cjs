// Synthetic representative configurations, not exhaustive narrator/card certification.
// Source: description (HUD slots/races), greetings (builder), entries 1129-1231.
const assert=require('node:assert/strict');
const {runtime}=require('./test_panel_tracking.cjs');
const c=runtime().ctx, plain=x=>JSON.parse(JSON.stringify(x));
const cases=[
 ['native swordsman','Human','Native','Minuscule','Sword God (Intermediate)','',25],
 ['native mage','Human','Native','Average','','Water (Intermediate)',25],
 ['hybrid','Human','Native','Average','Water God (Intermediate)','Healing (Beginner)',25],
 ['non-human','Superd','Native','Small','North God (Advanced)','',70],
 ['non-caster','Human','Otherworlder','None','','',25],
 ['multiple styles','Human','Native','Small','Sword God (Intermediate), Water God (Beginner), North God (Advanced)','',30],
 ['custom noble','Human','Native','Small','','Water (Beginner)',25],
 ['village resident','Human','Native','Minuscule','','',35],
 ['adventurer','Beastfolk','Native','Small','North God (Intermediate)','',25],
 ['merchant','Demon','Native','Small','','',40],
 ['canon actor Roxy','Migurd','Native','Average','','Water (Saint)',52],
 ['sandbox custom','Sea Race','Native','Small','','',30],
 ['pre-canon','Human','Native','Minuscule','','',25,'K330'],
 ['post-canon','Heaven Race','Native','Average','','Wind (Intermediate)',35,'K490'],
 ['living canon','Human','Reincarnate','Large','','Water (Advanced)',25,null,'Living'],
 ['keep canon','Human','Native','Small','','',25,null,'Keep'],
 ['divergent history','Human','Native','Small','','',25,null,'Join'],
 ['long-lived','Dragon','Native','Average','','',1200],
 ['multi-chat continuation','Human','Native','Small','','',30],
 ['no established family','Human','Otherworlder','None','','',25],
 ['large evolving family','Beastfolk','Native','Minuscule','','',45],
 ['political relationships','Human','Native','Small','','',45],
 ['private knowledge','Demon','Native','Small','','',70],
 ['classic HUD','Human','Native','Small','','',25],
 ['visual HUD','Migurd','Native','Small','','Water (Beginner)',52],
 ['optional HUD','Human','Native','Small','','',30],
 ['magic progression','Human','Native','Average','','Earth (Intermediate)',25],
 ['touki transitions','Human','Native','Minuscule','Sword God (Intermediate)','',25],
 ['temporary equipment','Human','Native','Small','','',30],
 ['agenda calendar','Human','Native','Small','','',30],
 ['off-screen canon','Human','Native','Small','','',30,null,'Off-Screen'],
 ['no canon','Human','Native','Small','','',30,null,'None'],
];
for(const [name,race,origin,mana,sword,magic,age,year='K450',canon='Living'] of cases) {
 const actualYear=year||'K450',actualCanon=canon||'Living';
 const text=`### WORLD STATE ###\nArmored Dragon Calendar: ${actualYear}, Month 4, Day 1 | Time: 09:40\n◆ Demon Continent → Rikarisu → Guild Hall\nRace: ${race} | Origin: ${origin} | Age: ${age}\nSandbox: Rikarisu — ${actualYear}\nMana Capacity: ${mana} | Reserve: Full\nTouki (Battle Aura): Locked\n${sword?'Sword Style: '+sword+'\n':''}${magic?'Magic Tiers: '+magic+'\n':''}Canon: ${actualCanon}\nNarrative Mode: Strict Agency\n***`;
 const h=c.parseHud(text),w=c.worldMushoku('matrix',c.worldLines(h),{});
 assert.equal(w.race,race,name);assert.equal(w.origin,origin,name);assert.equal(w.age,age,name);
 assert.equal(w.mana,mana,name);assert.equal(w.canon,actualCanon,name);assert.equal(w.birth,null,name);
 assert.equal(w.magic.length,magic?magic.split(',').length:0,name);
 assert.equal(w.martial.length,sword?sword.split(',').length:0,name);
 const chat=[{id:name,role:'assistant',content:text}],st=c.emptyChatState();
 assert.equal(c.spellKnown(chat,st,null,'matrix').size,0,name+' rank is not mastery');
 assert.equal(c.mtEventLedger(chat).length,0,name+' calendar is not an event');
 assert.equal(c.agendaRead(chat,st).items.length,0,name+' reference is not an appointment');
 assert.equal(c.famRead(chat,st).members.length,0,name+' no fabricated family');
}
// State transitions: mana reserve, Touki availability/activation and temporary
// omitted modules are current observations, never computed costs or acquisitions.
const base='### WORLD STATE ###\nArmored Dragon Calendar: K450, Month 4, Day 1 | Time: 09:40\nMana Capacity: Average | Reserve: Full\nTouki (Battle Aura): Locked\n[DEMON EYE: Foresight (Sealed)]\n***';
for(const [aura,reserve] of [['Locked','Full'],['Available — inactive','High'],['Active','Low'],['Inactive','Half']]) {
 const h=c.parseHud(base.replace('Locked',aura).replace('Full',reserve));
 const w=c.worldMushoku('matrix',c.worldLines(h),{});
 assert.equal(w.touki,aura);assert.equal(w.reserve,reserve);
}
assert.equal(c.worldMushoku('matrix',c.worldLines(c.parseHud(base.replace(/^\[DEMON EYE.*\n/m,''))),{}).eyes.length,0);
// All five continents accept dynamic places without taking geography from another world.
for(const continent of ['Central Continent','Demon Continent','Milis Continent','Begaritt Continent','Heavenly Continent']) {
 const h=c.parseHud(base.replace('Mana Capacity:',`◆ ${continent} → New Settlement → Workshop\nMana Capacity:`));
 assert.deepEqual(plain(h.location),[continent,'New Settlement','Workshop']);
}
console.log(`PASS ${cases.length} legal representative HUD configurations; literal reserve/Touki transitions, five continents and no automatic knowledge/events/family.`);
console.log('Limits: configuration parsing is not scenario outcome, magic-cost, family-tree or multi-chat live verification; focused existing suites cover those storage boundaries.');
