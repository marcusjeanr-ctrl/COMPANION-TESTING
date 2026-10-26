const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {runtime,hud}=require('./test_panel_tracking.cjs');
const filename=process.env.COMPANION_AGENDA_BASELINE ? path.resolve(process.env.COMPANION_AGENDA_BASELINE) : undefined;
const tests=[], test=(name,fn)=>tests.push([name,fn]);
function make(r,id,agenda,minute='07:00',day=8) {
    const content=hud('Old Keep',''+minute).replace('Day 8','Day '+day);
    const report=r.ctx.parseCompanion('<rpg_companion>'+JSON.stringify({agenda})+'</rpg_companion>');
    return {id,role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:report},sources:{0:r.ctx.readingSource(content)}}}};
}
const base={what:'Morning sword training',with:'Bram Vale',where:'Old Keep, west yard',when:'this morning',kind:'event',state:'open'};
test('Repeated vague times resolve one occurrence with a stable key and complete state history',()=>{
    const r=runtime(filename),c=r.ctx;
    const rows=[base,{...base,when:'first light this morning',state:'missed'},
        {...base,when:'called for first light; now past',state:'missed'},base];
    const chat=rows.map((row,i)=>make(r,'training-'+i,[row],'07:'+String(i*5).padStart(2,'0')));
    const key=c.agendaRead(chat.slice(0,1),{}).items[0].key;
    const before=JSON.stringify(chat),items=c.agendaRead(chat,{}).items;
    assert.equal(items.length,1,'Vague wording split one same-day appointment');
    assert.equal(items[0].key,key);assert.equal(items[0].state,'missed');
    assert.deepEqual(JSON.parse(JSON.stringify(items[0].history)).map(x=>[x.from,x.to]),[['open','missed']]);
    assert.equal(JSON.stringify(chat),before);
});
test('Conditional timing descriptions and room doorway refinements do not create duplicates',()=>{
    const r=runtime(filename),c=r.ctx;
    const meal={what:'Breakfast in the dining hall',where:'Old Keep, dining hall',when:'shortly, after the visit',kind:'event',state:'open'};
    const visit={what:'See the tutor before breakfast',with:'Rin Vale',where:'Old Keep, study',when:'now',state:'in_progress',kind:'meeting'};
    const chat=[make(r,'start',[meal,visit]),make(r,'end',[{...meal,when:'shortly'},{...visit,where:'Old Keep, study doorway',when:'this morning',state:'kept'}],'07:10')];
    const items=c.agendaRead(chat,{}).items;
    assert.equal(items.length,2);assert.equal(items.filter(x=>x.state==='kept').length,1);assert.equal(items.filter(x=>x.state==='in_progress').length,0);
    assert.equal(items.find(x=>x.with).where,'Old Keep, study doorway');
});
test('Terminal statuses and active progress survive generic open reports; explicit controls still work',()=>{
    const r=runtime(filename),c=r.ctx;
    for(const state of ['kept','missed','cancelled','in_progress']) {
        const chat=[make(r,'first',[{...base,state}]),make(r,'repeat',[base],'07:05')];
        assert.equal(c.agendaRead(chat,{}).items[0].state,state,'Generic open regressed '+state);
        const key=c.agendaRead(chat,{}).items[0].key;
        assert.equal(c.agendaRead(chat,{agenda:{edits:{[key]:{state:'open',after:'repeat'}}}}).items[0].state,'open','Manual correction must remain authoritative');
    }
    const moved=[make(r,'active',[{...base,state:'in_progress'}]),make(r,'move',[{...base,state:'moved',when:'tomorrow morning'}])];
    assert.equal(c.agendaRead(moved,{}).items.length,1);assert.equal(c.agendaRead(moved,{}).items[0].state,'open');
    const corrected=[make(r,'wrong',[{...base,state:'missed'}]),make(r,'correct',[{...base,state:'kept'}])];
    assert.equal(c.agendaRead(corrected,{}).items[0].state,'kept');
    const renewed=[make(r,'old',[{...base,state:'kept'}]),make(r,'renewed',[{...base,state:'moved',when:'tomorrow morning'}])];
    const renewedRows=c.agendaRead(renewed,{}).items;assert.equal(renewedRows.length,2);
    assert.equal(renewedRows[0].state,'kept');assert.equal(renewedRows[1].state,'open');
});
test('Different times, days, participants, rooms and explicitly separate snapshot rows remain separate',()=>{
    const r=runtime(filename),c=r.ctx;
    for(const [a,b] of [
        [{...base,when:'07:30'},{...base,when:'08:30'}],
        [{...base,when:'first light this morning'},{...base,when:'late morning'}],
        [{...base,when:'this morning'},{...base,when:'this evening'}],
        [base,{...base,with:'Tess Vale'}],[base,{...base,where:'Old Keep, east yard'}],
        [{...base,where:'Old Keep, study'},{...base,where:'Old Keep, study annex'}],
        [{...base,when:'shortly, after class'},{...base,when:'shortly, before class'}],
        [{...base,when:'this morning, after class'},{...base,when:'this morning, before class'}]
    ]) assert.equal(c.agendaRead([make(r,'a',[a]),make(r,'b',[b])],{}).items.length,2,JSON.stringify([a.when,b.when,a.where,b.where]));
    assert.equal(c.agendaRead([make(r,'day8',[{...base,state:'kept'}]),make(r,'day9',[base],'07:00',9)],{}).items.length,2);
    for(const pair of [
        [{...base,where:'Old Keep, study'},{...base,where:'Old Keep, study doorway'}],
        [base,{...base,when:'first light this morning'}]
    ]) assert.equal(c.agendaRead([make(r,'distinct',pair)],{}).items.length,2,'A snapshot explicitly enumerated separate appointments');
});
test('Ambiguous refinements do not merge separate sessions or manufacture an extra occurrence',()=>{
    const r=runtime(filename),c=r.ctx;
    const chat=[make(r,'two',[{...base,when:'first light this morning'},{...base,when:'late morning'}]),make(r,'ambiguous',[{...base,state:'kept'}])];
    const rows=c.agendaRead(chat,{}).items;
    assert.equal(rows.length,2);assert(rows.every(x=>x.state==='open'),'Ambiguous completion chose a session');
});
test('Swipe/source changes and NPC routine separation remain intact',()=>{
    const r=runtime(filename),c=r.ctx,chat=[make(r,'a',[base]),make(r,'b',[{...base,state:'kept'}])];
    assert.equal(c.agendaRead(chat,{}).items[0].state,'kept');
    chat[1].swipe_id=1;assert.equal(c.agendaRead(chat,{}).items[0].state,'open');chat[1].swipe_id=0;
    chat[1].content+=' Edited';assert.equal(c.agendaRead(chat,{}).items[0].state,'open');
    const npc=make(r,'npc',[]);npc.metadata.rpg_companion.swipes[0]={agendas:[{name:'Bram Vale',doing:base.what,where:base.where}]};
    assert.equal(c.agendaRead([npc],{}).items.length,0);
});
if(process.argv[2]) test('Supplied export yields four commitments with preserved terminal statuses and unchanged input',()=>{
    const bytes=fs.readFileSync(process.argv[2]),data=JSON.parse(bytes),r=runtime(filename),c=r.ctx;
    const chat=data.messages.map(m=>({...m,role:m.role||(m.is_user?'user':'assistant')}));c.companionMarkTurnPurposes(chat);
    const before=JSON.stringify(chat),rows=c.agendaRead(chat,c.emptyChatState()).items;
    assert.equal(rows.length,4,'Export still contains duplicate Agenda cards');
    assert.equal(rows.filter(x=>x.state==='missed').length,1);assert.equal(rows.filter(x=>x.state==='kept').length,1);
    assert.equal(rows.filter(x=>x.state==='open').length,2);assert.equal(rows.filter(x=>x.state==='in_progress').length,0);
    assert.equal(new Set(rows.map(x=>x.key)).size,4);assert.equal(JSON.stringify(chat),before);
    assert(bytes.equals(fs.readFileSync(process.argv[2])));
});
let failed=0;for(const [name,run]of tests){try{run();console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+': '+e.message)}}
console.log(`${tests.length-failed}/${tests.length} Agenda occurrence/status groups passed`);if(failed)process.exitCode=1;
