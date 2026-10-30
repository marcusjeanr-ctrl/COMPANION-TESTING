// Synthetic, source-bound tests of the shipped parser and Agenda projection.
const assert = require('node:assert/strict');
const {runtime, hud} = require('./test_panel_tracking.cjs');
const cases = [], test = (name, fn) => cases.push([name, fn]);
const setup = () => runtime(process.env.COMPANION_AGENDA_BASELINE);
const base = {what:'Review the supply contract', with:'Dr. Nia Vale', where:'Orbital Station, briefing room', when:'09:00', kind:'meeting', state:'open'};
function msg(c, id, rows, {body='', time='08:00', day=8, raw=false}={}) {
    const content = hud('Orbital Station, briefing room', time).replace('Day 8', 'Day '+day)+'\n'+body;
    const data = raw ? {agenda:structuredClone(rows)} : c.parseCompanion('<rpg_companion>'+JSON.stringify({agenda:rows})+'</rpg_companion>');
    return {id, role:'assistant', swipe_id:0, content, metadata:{rpg_companion:{swipes:{0:data}, sources:{0:c.readingSource(content)}}}};
}
const read = (c, chat, state={}) => c.agendaRead(chat, state).items;
test('Duplicate extraction retains a later confirmed outcome instead of dropping it', () => {
    const c=setup().ctx, chat=[msg(c,'a',[base,{...base,state:'kept'}],{time:'09:15',body:'The supply contract review has finished.'})];
    const rows=read(c,chat);assert.equal(rows.length,1);assert.equal(rows[0].state,'kept');
    assert.equal(read(c,[msg(c,'b',[{...base,state:'kept'},base],{time:'09:15'})])[0].state,'kept');
    const corrected=[{...base,state:'kept'},{...base,state:'missed'},{...base,state:'kept'}];
    assert.equal(read(c,[msg(c,'corrected',corrected,{time:'09:15'})])[0].state,'kept');
});
test('Equivalent reordered titles and honorific participants update one occurrence', () => {
    const c=setup().ctx, other={...base,what:'Supply contract review meeting with Nia Vale',with:'Nia Vale'};
    for(const chat of [[msg(c,'a',[base,other])],[msg(c,'a',[base]),msg(c,'b',[other])]]){
        const rows=read(c,chat);assert.equal(rows.length,1);assert.equal(rows[0].key,'review the supply contract');
    }
});
test('Punctuation, Unicode spacing and participant order are identity formatting', () => {
    const c=setup().ctx, a={...base,with:'Dr. Nia Vale and Jo Chen'}, b={...a,what:'Review  the supply contract!',with:'Jo Chen & Nia Vale',where:'Orbital Station — briefing room'};
    assert.equal(read(c,[msg(c,'a',[a]),msg(c,'b',[b])]).length,1);
});
test('Equivalent bell wording stays vague without inventing a clock or date', () => {
    const c=setup().ctx,a={...base,when:'when the bell rings at nine'},b={...a,when:'at the nine o’clock bell'};
    const chat=[msg(c,'a',[a]),msg(c,'b',[b],{time:'08:10'})],rows=read(c,chat);
    assert.equal(rows.length,1);assert.equal(rows[0].dueAt,null);assert.equal(rows[0].key,read(c,chat.slice(0,1))[0].key);
});
test('Cards without a dated HUD never gain an invented date from duplicate outcomes', () => {
    const c=setup().ctx,m=msg(c,'undated',[base,{...base,state:'kept'}]);
    m.content='The supply contract review has finished.';m.metadata.rpg_companion.sources[0]=c.readingSource(m.content);
    const rows=read(c,[m]);assert.equal(rows.length,1);assert.equal(rows[0].dueAt,null);assert.equal(rows[0].state,'kept');
});
test('A repeated relative countdown with explicit continuity keeps its established due time', () => {
    const c=setup().ctx,a={...base,when:'in ten minutes'},chat=[msg(c,'a',[a]),msg(c,'b',[a],{time:'08:05',body:'The same supply contract review appointment is still pending.'})];
    const rows=read(c,chat);assert.equal(rows.length,1);assert.equal(rows[0].dueAt,read(c,chat.slice(0,1))[0].dueAt);
});
test('Legacy saved duplicate rows consolidate without changing input metadata', () => {
    const c=setup().ctx,a={...base,key:'review the supply contract'},b={...a,key:'legacy-duplicate',what:'Supply contract review meeting with Nia Vale',with:'Nia Vale',state:'kept'};
    const chat=JSON.parse(JSON.stringify([msg(c,'saved',[a,b],{raw:true,time:'09:15'})])),before=JSON.stringify(chat);
    const rows=read(c,chat);assert.equal(rows.length,1);assert.equal(rows[0].state,'kept');assert.equal(rows[0].key,a.key);assert.equal(JSON.stringify(chat),before);
});
test('Manual saved duplicates and corrections retain their original actionable keys', () => {
    const c=setup().ctx, chat=[msg(c,'clock',[])],at=c.hmsTimeline(chat)[0].clock;
    const a={...base,key:'manual-a',at},b={...a,key:'manual-b',what:'Supply contract review meeting with Nia Vale',with:'Nia Vale'};
    const state={agenda:{added:[a,b],edits:{'manual-b':{state:'kept',after:'clock'}}}},before=JSON.stringify(state),rows=read(c,chat,state);
    assert.equal(rows.length,1);assert.equal(rows[0].state,'kept');assert.equal(rows[0].key,'manual-a');assert.equal(JSON.stringify(state),before);
});
test('Previously generated duplicate control keys retain manual corrections after consolidation', () => {
    const c=setup().ctx,chat=[msg(c,'a',[base]),msg(c,'b',[{...base,with:'Nia Vale'}])];
    const compound='review the supply contract :: nia vale :: orbital station, briefing room :: 09:00';
    for(const key of [compound,compound+' :: 2']){
        const rows=read(c,chat,{agenda:{edits:{[key]:{state:'kept',after:'b'}}}});assert.equal(rows.length,1);assert.equal(rows[0].state,'kept');
    }
    // An ambiguous historical control cannot transfer to a different recurring day.
    const recurring=[msg(c,'a',[base]),msg(c,'b',[base],{day:9})],key='review the supply contract :: dr. nia vale :: orbital station, briefing room :: 09:00 :: 99';
    assert(read(c,recurring,{agenda:{edits:{[key]:{state:'kept',after:'b'}}}}).every(x=>x.state==='open'));
});
test('An explicitly separate occurrence is never deduplicated just because its fields repeat', () => {
    const c=setup().ctx,chat=[msg(c,'a',[base]),msg(c,'b',[base],{body:'A second separate supply contract review meeting is scheduled.'})];
    assert.equal(read(c,chat).length,2);
    const separate={...base,when:'10:00'},body='A second separate supply contract review meeting is scheduled.';
    assert.equal(read(c,[msg(c,'a',[base]),msg(c,'b',[separate],{body}),msg(c,'c',[separate],{body})]).length,2);
    assert.equal(read(c,[msg(c,'a',[base]),msg(c,'b',[base],{body:'Another council meeting begins. The supply contract review remains pending.'})]).length,1);
});
test('Future terminal claims require actual outcome evidence; elapsed time alone stays pending', () => {
    for(const state of ['kept','missed']){
        const c=setup().ctx,a={...base,when:'tomorrow at 09:00',state};assert.equal(read(c,[msg(c,'a',[a],{body:'The supply contract review is scheduled for tomorrow.'})])[0].state,'open');
    }
    const c=setup().ctx,chat=[msg(c,'a',[base]),msg(c,'b',[],{time:'12:00'})];assert.equal(read(c,chat)[0].state,'open');
    const early=msg(c,'early',[{...base,state:'kept'}],{body:'The supply contract review was completed early.'});assert.equal(read(c,[early])[0].state,'kept');
    assert.equal(read(c,[msg(c,'cancel',[{...base,when:'tomorrow at 09:00',state:'cancelled'}])])[0].state,'cancelled');
});
test('Negated activity does not start an appointment', () => {
    const c=setup().ctx,m=msg(c,'a',[{...base,when:'this morning'}]);m.metadata.rpg_companion.swipes[0].plot={now:'Supply contract review has not started.'};
    assert.equal(read(c,[m])[0].state,'open');
});
test('An NPC daily routine alone cannot start the players scheduled appointment', () => {
    const c=setup().ctx,m=msg(c,'a',[{...base,when:'this morning'}]);
    m.metadata.rpg_companion.swipes[0].agendas=[{name:'Jo Chen',doing:'Supply contract review is underway.',where:base.where}];
    assert.equal(read(c,[m])[0].state,'open');
});
test('Different people, locations, dates, times, qualifiers and maneuvers stay separate', () => {
    const variations=[{with:'Dr. Mira Vale'},{where:'Orbital Station, engine room'},{when:'10:00'},{when:'tomorrow at 09:00'},
        {what:'Review the employment contract'},{what:'Second supply contract review'},{what:'Review the supply contract draft'},
        {what:'Inspect the engine valves'},{when:'before the nine o’clock bell'},{when:'after the nine o’clock bell'}];
    for(const change of variations){const c=setup().ctx;assert.equal(read(c,[msg(c,'a',[base]),msg(c,'b',[{...base,...change}])]).length,2,JSON.stringify(change));}
    const c=setup().ctx,a={...base,when:'at the nine o’clock bell'},b={...a,when:'after the nine o’clock bell'};assert.equal(read(c,[msg(c,'a',[a,b])]).length,2);
});
test('Before/after clock windows and comma-separated activity targets remain distinct', () => {
    const c=setup().ctx;
    for(const pair of [[{...base,when:'before 09:00'},{...base,when:'after 09:00'}],
        [{...base,what:'Equipment inspection, engine valves'},{...base,what:'Equipment inspection, pressure sensors'}]]) {
        assert.equal(read(c,[msg(c,'a',pair)]).length,2,JSON.stringify(pair.map(x=>x.what+' '+x.when)));
    }
});
test('Latest manual correction wins across consolidated aliases regardless of object ordering', () => {
    const c=setup().ctx,chat=[msg(c,'a',[]),msg(c,'b',[])],at=c.hmsTimeline(chat)[0].clock;
    const added=[{...base,key:'old',at},{...base,key:'duplicate',at,with:'Nia Vale'}];
    const state={agenda:{added,edits:{duplicate:{state:'kept',after:'b'},old:{state:'open',after:'a'}}}};
    assert.equal(read(c,chat,state)[0].state,'kept');
    state.agenda.edits.old={state:'removed',after:'b'};assert.equal(read(c,chat,state).length,0);
});
test('Daily recurring appointments and same-name appointments on different days remain separate', () => {
    const c=setup().ctx,chat=[msg(c,'day8',[{...base,state:'kept'}],{time:'09:15'}),msg(c,'day9',[base],{day:9,time:'08:00'})];
    assert.equal(read(c,chat).length,2);assert.equal(read(c,chat).filter(x=>x.state==='kept').length,1);
    const bell={...base,when:'when the bell rings at nine'};assert.equal(read(c,[msg(c,'a',[bell]),msg(c,'b',[bell],{day:9})]).length,2);
});
test('Rescheduling retains identity, old schedule and pending state', () => {
    const c=setup().ctx,chat=[msg(c,'a',[base]),msg(c,'b',[{...base,state:'moved',when:'tomorrow at 10:00'}],{body:'The review is rescheduled.'})],rows=read(c,chat);
    assert.equal(rows.length,1);assert.equal(rows[0].key,read(c,chat.slice(0,1))[0].key);assert.equal(rows[0].state,'open');assert.equal(rows[0].reschedules[0].when,'09:00');
});
test('Sparse observations cannot choose among two existing similar appointments', () => {
    const c=setup().ctx,a={...base,when:'09:00'},b={...base,when:'10:00'},chat=[msg(c,'two',[a,b]),msg(c,'vague',[{...base,when:null,state:'kept'}])];
    const rows=read(c,chat);assert.equal(rows.length,2);assert(rows.every(x=>x.state==='open'));
});
test('Repeated processing/reload stays idempotent and respects edited, hidden and swiped sources', () => {
    for(const mode of ['edit','hidden','swipe']){
        const c=setup().ctx,chat=[msg(c,'a',[base]),msg(c,'b',[{...base,state:'kept'}],{time:'09:15'})];
        if(mode==='edit')chat[1].content+=' changed';if(mode==='hidden')chat[1].hidden=true;if(mode==='swipe')chat[1].swipe_id=1;
        assert.equal(read(c,chat)[0].state,'open',mode);
    }
    const c=setup().ctx,chat=Array.from({length:60},(_,i)=>msg(c,'r'+i,[i%2?{...base,what:'Supply contract review meeting with Nia Vale',with:'Nia Vale'}:base]));
    for(let i=0;i<3;i++)assert.equal(read(c,JSON.parse(JSON.stringify(chat))).length,1);
});
test('Helpers make no host calls, preserve NPC routines and do not mutate saves', () => {
    const r=setup(),c=r.ctx,chat=[msg(c,'a',[base])],before=JSON.stringify(chat);let calls=0;const fail=()=>{calls++;throw Error('Unexpected host call');};
    for(const [object,key] of [[r.ctx.spindle.chat,'getMessages'],[r.ctx.spindle.chat,'updateMessage'],[r.ctx.spindle.storage,'setJson'],[r.ctx.spindle.generate,'quiet'],[r.ctx.spindle.world_books,'getActivated']])object[key]=fail;
    read(c,chat);assert.equal(calls,0);assert.equal(JSON.stringify(chat),before);
    const npc=msg(c,'npc',[]);npc.metadata.rpg_companion.swipes[0].agendas=[{name:'Nia Vale',doing:base.what}];assert.equal(read(c,[npc]).length,0);
});
if(process.argv.includes('--browser-fixture')) {
    const c=setup().ctx,chat=[msg(c,'a',[{...base,when:'when the bell rings at nine'}]),msg(c,'b',[{...base,what:'Supply contract review meeting with Nia Vale',with:'Nia Vale',when:'at the nine o’clock bell'}])];
    console.log(JSON.stringify(c.hmsPanelState('test',chat,{})));
} else (async()=>{let failed=0;for(const[name,fn]of cases){try{await fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}}console.log(`${cases.length-failed}/${cases.length} universal Agenda groups passed`);if(failed)process.exitCode=1;})();
