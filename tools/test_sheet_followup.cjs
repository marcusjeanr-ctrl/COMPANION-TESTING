const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {runtime,hud}=require('./test_panel_tracking.cjs');
function sheet(){
 const src=fs.readFileSync(path.join(__dirname,'../dist/frontend.js'),'utf8'),ctx=vm.createContext({});
 vm.runInContext(src.slice(src.indexOf('function characterSheetMarkdown('),src.indexOf('export function setup(')),ctx);
 return ctx.characterSheetMarkdown;
}
const r=runtime();r.run("settings.hmsSystems.abilities.vocabulary='Martial: Touki\\nMagic: Mana Capacity'");
const input=hud(),systems=r.ctx.hmsReadSystems(r.ctx.parseHud(input));
const view={hms:{hud:{lines:r.ctx.parseHud(input).lines},systems}};
const before=JSON.stringify(view),output=sheet()(view),abilities=output.split('## Abilities\n')[1].split('\n## ')[0];
assert(abilities.includes('Touki (Battle Aura): Active'),abilities);
assert(abilities.includes('Mana Capacity: Vast'),abilities);
assert.equal(JSON.stringify(view),before);assert.equal(r.writes.length,0);
console.log('Sheet follow-up: actual HUD ability labels retained; input and stored metadata unchanged.');
module.exports={sheet};
function spellRankTerms(){
 const make=sheet(),spell={name:'Water Bolt',rank:'Elementary',status:'known'},higher={name:'Water Jet',rank:'Intermediate',status:'known'};
 for(const [hudText,expected] of [[hud(),'Beginner'],[hud().replace('Fire (Beginner)','Fire (Elementary)'),'Elementary'],['','Elementary'],[hud().replace('Fire (Beginner)','Fire (Elementary)')+'\nQuest: Learn a Beginner spell','Elementary']]){
  const v={hms:{hud:{lines:hudText?r.ctx.parseHud(hudText).lines:[]},magic:{list:{schools:[{spells:[spell,higher]}]}}}};
  const before=JSON.stringify(v),section=make(v).split('## Known spells\n')[1].split('\n## ')[0];
  assert(section.includes('Water Bolt ('+expected+')'),section);assert(section.includes('Water Jet (Intermediate)'));assert.equal(JSON.stringify(v),before);
 }
}
spellRankTerms();
