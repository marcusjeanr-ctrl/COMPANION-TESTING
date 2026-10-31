const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/frontend.js'),'utf8'),c=vm.createContext({});
vm.runInContext(source.slice(0,source.indexOf('export function setup')),c);
const options={names:['Marcus','Cassian','Aurelius','Elena'],player:'Marcus'};
function row(text,n,kind='moment',who=['Marcus','Cassian']){return{id:'e'+n,text,kind,who,replyIndex:n*2,when:'K417 Month 4 Day 1, 09:'+String(n).padStart(2,'0'),loop:1};}
function groups(rows,opt=options){return c.recentTimelineRows(rows,opt);}
const duel=['Marcus decisively defeated Cassian in a duel, fundamentally altering their sibling dynamic','Marcus decisively defeated Cassian in a duel, fundamentally shifting their sibling dynamic'];
assert.equal(groups(duel.map((x,i)=>row(x,i))).length,1);
assert.equal(groups(duel.map((x,i)=>row(x,i)))[0].count,2);
for(const text of ["Cassian's mask came off",'Cassian holds it against you: humiliation','Aurelius and you: made good — Proven martial competence']){
 const who=text.startsWith('Aurelius')?['Aurelius']:['Cassian'];const list=groups([row(text,1,'bond',who),row(text,2,'bond',who)]);
 assert.equal(list.length,1,text);assert.equal(list[0].entry.id,'e1');
}
const promises=["Aurelius's price: a meeting with the Greyrat boy in exchange for proving himself","Aurelius's promise to arrange a meeting with the Greyrat boy","Aurelius's promise to introduce Marcus to the Greyrat boy"];
const planted=promises.map((text,i)=>({...row(text,i,'planted',[]),status:'fired'}));
const frozen=JSON.stringify(planted),p=groups(planted);assert.equal(p.length,1);assert.equal(p[0].count,3);assert.equal(p[0].entry.text,promises[0]);assert.equal(JSON.stringify(planted),frozen);
for(const pair of [
 [row(duel[0],0),row(duel[1].replaceAll('Cassian','Elena'),1,'moment',['Marcus','Elena'])],
 [row(duel[0],0),row(duel[1].replace('defeated','forgave'),1)],
 [row('Marcus defeated Cassian',0),row('Cassian defeated Marcus',1)],
 [row("Cassian's mask came off",0,'bond',['Cassian']),row('Cassian holds it against you: humiliation',1,'bond',['Cassian'])],
 [row(duel[0],0),row(duel[1],20)],
 [row('Cassian: Wary → Friendly',0,'bond',['Cassian']),row('Cassian: Friendly → Wary',1,'bond',['Cassian'])],
 [row('Cassian attacked you again',0,'bond',['Cassian']),row('Cassian attacked you again',1,'bond',['Cassian'])],
 [row('Aurelius promised a meeting at nine',0,'planted',['Aurelius']),row('Aurelius promised a meeting at ten',1,'planted',['Aurelius'])],
 [row(duel[0],0),{...row(duel[1],1),loop:2}],
 [row(duel[0],0),{...row(duel[1],1),when:'K417 Month 4 Day 2, 09:01'}],
 [{...row(promises[0],0,'planted',[]),when:null,readAt:540},{...row(promises[1],1,'planted',[]),when:null,readAt:1980}],
 [{...row(promises[0],0,'planted',[]),when:null},{...row(promises[1],1,'planted',[]),when:null}],
 [row(duel[0],0),{...row(duel[1],1),hidden:true}],
 [{...row(duel[0],0),user:true},{...row(duel[1],1),user:true}],
 [{...row(duel[0],0),replyIndex:undefined},{...row(duel[1],1),replyIndex:undefined}],
 [row('Aurelius promised to meet Galen',0,'planted',['Aurelius']),row('Aurelius promised to meet Orin',1,'planted',['Aurelius'])],
 [row("Aurelius's promise to arrange a meeting with the greyrat boy",0,'planted',['Aurelius']),row("Aurelius's promise to introduce orin to the greyrat boy",1,'planted',['Aurelius'])],
]) assert.equal(groups(pair).length,2,JSON.stringify(pair));
assert.equal(groups([row(duel[0],0),row(duel[1],1)],{...options,enabled:false}).length,2);
assert.equal(groups([]).length,0);assert.equal(groups([row('A bell rang',0,'moment',[]),row('A bell rang',1,'moment',[])]).length,2);
console.log('Recent display dedup: all reported examples, participants, directions, distinct events, recurrence, bounds, days, visibility, opt-out and immutability passed');

const {runtime,hud}=require('./test_panel_tracking.cjs'),r=runtime(),b=r.ctx;
const d=b.parseCompanion('<rpg_companion>'+JSON.stringify({chekhov:{load:[{what:"Aurelius promises a meeting",w:2}],fired:[],drop:[]}})+'</rpg_companion>');
const message={id:'source',role:'assistant',content:hud(),metadata:{rpg_companion:{swipes:{0:d}}}},original=JSON.stringify(message);
const view=b.simChekhovView(b.simFold([message],b.emptyChatState()));
assert.equal(view.chamber[0].readAt,b.hmsClock(b.parseHud(message.content)).minutes);
assert.equal(JSON.stringify(message),original);assert.equal(r.writes.length,0);
console.log('Planted display provenance equals the existing source clock, without report writes');
