const assert = require('node:assert/strict');
const { runtime, hud } = require('./test_panel_tracking.cjs');
const c = runtime().ctx;
const samples = [
 [{what:'Mana measurement in the magic hall',when:'after a proper breakfast',with:'Seraphina King',where:'Magic Hall'},{what:'Afternoon sword drills',when:'this afternoon',with:'Aurelius King',where:'West Yard'}],
 [{what:'Mana measurement in the magic hall after a proper breakfast',when:'half past eight this morning',with:'Seraphina King',where:'Magic Hall'},{what:'Afternoon sword drills, double drill if shoulder flaw persists',when:'afternoon',with:'Aurelius King',where:'West Yard'}],
 [{what:"Choose a spellbook stack from Seraphina's study",when:'before half past eight',with:'Seraphina King',where:'Study'}],
 [{what:"Choose a spellbook stack from Seraphina's study",when:'now',with:'Seraphina King',where:'Study'}]
];
const messages = samples.map((agenda,i)=>({id:'fixture-'+i,role:'assistant',swipe_id:0,content:hud(),
 metadata:{rpg_companion:{swipes:{0:{agenda:c.agendaNormalize(agenda),quests:[]}}}}}));
const result = c.agendaRead(messages,c.emptyChatState());
assert.equal(result.items.filter(x=>/mana measurement/i.test(x.what)).length,1,'measurement duplicated');
assert.equal(result.items.filter(x=>/afternoon sword drills/i.test(x.what)).length,1,'drills duplicated');
assert.equal(result.items.filter(x=>/choose a spellbook/i.test(x.what)).length,1,'same-day refinement duplicated');
assert.equal(result.items.length,3);
assert.equal(c.agendaSame('Mana measurement in the magic hall','Mana measurement in the western laboratory'),false);
assert.equal(c.agendaSame('Afternoon sword drills','Afternoon magic lessons'),false);
const q = [
 {name:'The Roa Bargain',objective:'Make a cut Aurelius cannot read beforehand',giver:'Aurelius',where:'House King Estate'},
 {name:'The Roa Visit',objective:"Secure Aurelius's permission and letter for the trip to Roa",giver:'Aurelius',where:'House King Estate'},
 {name:'The Roa Journey',objective:"Secure Aurelius's permission and prepare for the road to Roa",giver:'Aurelius',where:'House King Estate'},
 {name:'Friendship with the Boy Genius',objective:'Travel to Roa to meet Rudeus Greyrat',where:'Roa'},
 {name:'Sounding the Well',objective:'Complete a mana measurement',where:'Magic Hall'}
];
assert.equal(c.questUnique(q).length,5,'different quest stages were collapsed');
console.log('Agenda and quest identity fixture: same events merged, different goals kept');
