const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../dist/frontend.js'),'utf8'),c=vm.createContext({});new vm.Script(src.replace('export function setup','function setup'));vm.runInContext(src.slice(0,src.indexOf('export function setup')),c);
const view={userName:'Marcus',hms:{relations:{people:[{name:'Aurelius King',standing:'Close',bond:'father',mood:'calm'}]},family:{members:[{name:'Aurelius King',where:'Study',known:'told'}]},minds:{people:[{name:'Aurelius King',feel:{word:'pride'},agenda:{doing:'Reading'},knows:[{fact:'Marcus knows fire magic',sure:'partly'},{fact:'The king is away',sure:'certain'}]}]},agenda:{items:[{what:'Study',with:'Aurelius King',state:'open',dueIn:40}]}},chronData:{entries:[{text:'A bond',who:['Aurelius King']}]}},original=JSON.stringify(view);
let p=c.npcDossierData(view,'Aurelius');assert.equal(p.standing,'Close');assert.equal(p.family.where,'Study');assert.equal(p.knowledge.length,1);assert.equal(p.appointment.what,'Study');assert.equal(p.chronicle.length,1);assert.equal(JSON.stringify(view),original);
assert.equal(c.npcDossierData(view,'Unknown'),null);
const minimal={hms:{relations:{people:[{name:'Clerk'}]}}};p=c.npcDossierData(minimal,'Clerk');assert.equal(p.knowledge.length,0);assert.equal(p.family,null);
console.log('NPC dossier: complete, sparse, unknown, knowledge ownership and immutable input passed');
for(const field of ['relations','family','minds','agenda']){
 const sparse=JSON.parse(JSON.stringify(view));delete sparse.hms[field];assert(c.npcDossierData(sparse,'Aurelius King'));
}
assert.equal(c.npcDossierData({hms:{relations:{people:[{name:'Clerk East'},{name:'Clerk West'}]}}},'Clerk'),null);
const resumed={hms:{messageId:'old',hud:{location:['Town'],time:'09:00'},systems:{quests:[{name:'Open',state:'active'},{name:'Done',state:'completed'}]}},plotView:{now:'Training',threads:[{name:'A thread',state:'open'}],objectives:[{text:'Practice',state:'active'}]}},resumeOriginal=JSON.stringify(resumed);
assert.equal(c.recapData(resumed,['old']),null);assert.equal(c.recapData(resumed,[],true),null);assert.equal(c.recapData({}),null);assert.equal(c.recapData({hms:{messageId:'empty'}}),null);
const recap=c.recapData(resumed);assert.equal(recap.quests.length,1);assert.equal(recap.location,'Town');assert.equal(recap.now,'Training');assert.equal(JSON.stringify(resumed),resumeOriginal);
console.log('Recap: fresh/generated, resumed, dismissed, no data and immutable state passed');
assert(c.chronicleHighlight({kind:'moment',text:'Won the duel'}));assert(c.chronicleHighlight({kind:'milestone'}));assert(c.chronicleHighlight({kind:'plot'}));assert(!c.chronicleHighlight({kind:'place'}));assert(!c.chronicleHighlight({kind:'moment',text:'A quiet breakfast',imp:2}));
const bonds=[{kind:'bond',who:['Clerk'],when:'K417 Month 4 Day 1, 09:00',text:'Wary → Friendly'}, {kind:'bond',who:['Clerk'],when:'K417 Month 4 Day 1, 09:10',text:'Friendly → Close'}],bondOriginal=JSON.stringify(bonds);
assert.equal(c.dailyBondGroups(bonds).length,1);assert.equal(c.dailyBondGroups(bonds)[0].members.length,2);
assert.equal(c.dailyBondGroups([bonds[0],{...bonds[1],who:['Someone else']}]).length,2);assert.equal(c.dailyBondGroups([bonds[0],{...bonds[1],when:'K417 Month 4 Day 2, 09:10'}]).length,2);assert.equal(c.dailyBondGroups([]).length,0);assert.equal(JSON.stringify(bonds),bondOriginal);
console.log('Quieter Chronicle: Highlights membership, daily same-pair folding, distinct pairs/days and immutable empty input passed');
