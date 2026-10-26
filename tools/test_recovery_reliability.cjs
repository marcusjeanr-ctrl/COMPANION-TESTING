const assert = require('node:assert/strict');
const path = require('node:path');
const {runtime, seed, hud, reading} = require('./test_panel_tracking.cjs');
const filename = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
function fixture() {
    const r = runtime(filename); seed(r);
    const report=structuredClone(reading); report.you.xp=7;
    report.minds[0].toward=[{name:'you',moves:{storge:{d:2}}}];
    r.messages[1].content = hud() + '\n<rpg_companion>' + JSON.stringify(report) + '</rpg_companion>';
    let calls = 0; r.quiet(() => { calls++; });
    return {r, m:r.messages[1], calls:() => calls};
}
function effects(r) {
    const st=r.ctx.emptyChatState();
    return JSON.stringify({xp:r.ctx.hmsYouPanel(r.messages,st).xp.total,
        money:r.ctx.moneyRead(r.messages,st).totals,
        inventory:r.ctx.gearRead(r.messages,st).items.map(x=>[x.key,x.state]),
        relationships:r.ctx.getSwipeData(r.messages[1]).relations,
        minds:[...r.ctx.simFold(r.messages,st).pairs]});
}
(async () => {
    const control=fixture(); await control.r.ctx.healRecent('test',control.r.messages);
    const expected=effects(control.r);
    const {r,m,calls} = fixture();
    const write = r.ctx.spindle.chat.updateMessage; let attempts = 0;
    r.ctx.spindle.chat.updateMessage = async (...args) => {
        if (++attempts === 1) throw Error('Transient failure before commit');
        return write(...args);
    };
    const stale = structuredClone(r.messages);
    assert.equal(await r.ctx.healRecent('test', r.messages), false);
    assert.equal(r.ctx.getSwipeData(m), null);
    assert.equal(await r.ctx.healRecent('test', r.messages), true, 'Failed healing must be retryable');
    assert(r.ctx.getSwipeData(m)?.money);
    const committed = JSON.stringify(r.ctx.getSwipeData(m));
    assert.equal(await r.ctx.healRecent('test', stale), false, 'Stale raw snapshot must not replay committed recovery');
    assert.equal(attempts, 2);
    assert.equal(JSON.stringify(r.ctx.getSwipeData(m)), committed);
    assert.equal(r.ctx.questDetailsLatest(r.messages).length, 1);
    assert.equal(r.ctx.agendaRead(r.messages, {}).items.length, 1);
    assert.equal(r.ctx.simFold(r.messages, r.ctx.emptyChatState()).minds.size, 1);
    assert.equal(calls(), 0);
    assert.equal(effects(r),expected,'Recovery changed XP, money, inventory or relationship/Minds deltas');
    console.log('PASS failed commit retries; stale successful recovery does not replay rewards or Minds');

    for (const mode of ['concurrent', 'metadata-only', 'committed-error', 'deleted', 'edited', 'swiped']) {
        const {r,m,calls} = fixture(); const original = r.ctx.spindle.chat.updateMessage;
        let attempts = 0;
        r.ctx.spindle.chat.updateMessage = async (...args) => {
            attempts++;
            if (attempts === 1) {
                if (mode === 'metadata-only') { m.metadata = structuredClone(args[2].metadata); throw Error('Partial metadata write'); }
                if (mode === 'committed-error') { await original(...args); throw Error('Commit acknowledged late'); }
                if (mode === 'deleted') { r.messages.splice(1,1); throw Error('Deleted'); }
                if (mode === 'edited') { m.content += ' Changed'; throw Error('Edited'); }
                if (mode === 'swiped') { m.swipe_id = 1; throw Error('Swiped'); }
                await new Promise(resolve => setTimeout(resolve, 5));
            }
            return original(...args);
        };
        const snapshot = structuredClone(r.messages);
        if (mode === 'concurrent') {
            await Promise.all([r.ctx.healRecent('test', snapshot), r.ctx.healRecent('test', structuredClone(snapshot))]);
            assert.equal(attempts, 1, 'Concurrent recovery must share the pending commit');
        } else {
            await r.ctx.healRecent('test', snapshot);
            await r.ctx.healRecent('test', r.messages);
            if (mode === 'deleted') assert.equal(r.messages.length, 1);
            else assert(r.ctx.getSwipeData(m), mode + ' must recover the active source/swipe');
        }
        assert.equal(calls(), 0);
        if (r.messages.length > 1) {
            assert.equal(r.ctx.questDetailsLatest(r.messages).length, 1);
            assert.equal(r.ctx.simFold(r.messages, r.ctx.emptyChatState()).minds.size, 1);
            assert.equal(effects(r),expected,mode+' must apply economic and Minds effects exactly once');
        }
        console.log('PASS recovery ' + mode);
    }
    {
        const {r,m} = fixture(); const raw=m.content;
        await r.ctx.healRecent('test', r.messages);
        m.content=raw.replace('Allowance','Allotment'); // equal-length report edit
        assert.equal(m.content.length,raw.length);
        assert.equal(await r.ctx.healRecent('test',r.messages),true,'Equal-length source edit must recover');
        assert.equal(r.ctx.getSwipeData(m).money[0].what,'Allotment');
        m.content=raw; m.swipe_id=1;
        assert.equal(await r.ctx.healRecent('test',r.messages),true,'New swipe must recover independently');
        assert(r.ctx.getSwipeData(m).money);
        assert(m.metadata.rpg_companion.swipes[0]);
        assert.equal(r.ctx.getSwipeData({...m,content:m.content+' edit'}),null);
        console.log('PASS source fingerprints, equal-length edits and independent swipes');
    }
    for (const command of ['Mushoku_Save','OOC guide: explain tracking','Mushoku_Continue_Handler']) {
        const {r,m} = fixture(); r.messages[0].content=command;
        await r.ctx.healRecent('test',r.messages);
        assert.equal(r.writes.length,0,'Utility/continuation recovery must not commit transactions');
        assert.equal(r.ctx.getSwipeData(m),null);
    }
    console.log('PASS Save/Continue transaction isolation');
    {
        const {r,m}=fixture(),raw=m.content;
        for(let i=0;i<205;i++) { m.id='bounded-'+i; m.content=raw; await r.ctx.healRecent('test',r.messages); }
        assert(r.run('healed.size')<=200,'Successful recovery keys must be bounded');
        assert.equal(r.run('healing.size'),0,'Completed in-flight work must be released');
        console.log('PASS bounded recovery retention');
    }
})().catch(e => { console.error(e); process.exitCode=1; });
