const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../dist/frontend.js'),'utf8'),c=vm.createContext({});vm.runInContext(src.slice(0,src.indexOf('export function setup')),c);
const view={userName:'Marcus',hms:{relations:{people:[{name:'Aurelius King',standing:'Close',bond:'father',mood:'calm'}]},family:{members:[{name:'Aurelius King',where:'Study',known:'told'}]},minds:{people:[{name:'Aurelius King',feel:{word:'pride'},agenda:{doing:'Reading'},knows:[{fact:'Marcus knows fire magic',sure:'partly'},{fact:'The king is away',sure:'certain'}]}]},agenda:{items:[{what:'Study',with:'Aurelius King',state:'open',dueIn:40}]}},chronData:{entries:[{text:'A bond',who:['Aurelius King']}]}},original=JSON.stringify(view);
let p=c.npcDossierData(view,'Aurelius');assert.equal(p.standing,'Close');assert.equal(p.family.where,'Study');assert.equal(p.knowledge.length,1);assert.equal(p.appointment.what,'Study');assert.equal(p.chronicle.length,1);assert.equal(JSON.stringify(view),original);
assert.equal(c.npcDossierData(view,'Unknown'),null);
const minimal={hms:{relations:{people:[{name:'Clerk'}]}}};p=c.npcDossierData(minimal,'Clerk');assert.equal(p.knowledge.length,0);assert.equal(p.family,null);
console.log('NPC dossier: complete, sparse, unknown, knowledge ownership and immutable input passed');
for(const field of ['relations','family','minds','agenda']){
 const sparse=JSON.parse(JSON.stringify(view));delete sparse.hms[field];assert(c.npcDossierData(sparse,'Aurelius King'));
}
assert.equal(c.npcDossierData({hms:{relations:{people:[{name:'Clerk East'},{name:'Clerk West'}]}}},'Clerk'),null);
