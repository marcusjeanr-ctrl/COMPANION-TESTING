const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const {runtime,hud,reading} = require('./test_panel_tracking.cjs');

// Synthetic local histories, not live storage/WebView/provider performance.
for (const count of [50,100,250,500,1000,2000]) {
    const rt=runtime(), c=rt.ctx;
    const report=c.parseCompanion(`<rpg_companion>${JSON.stringify(reading)}</rpg_companion>`);
    for (let i=0;i<count/2;i++) {
        rt.messages.push({id:`u${i}`,role:'user',content:'Continue.'});
        const content=hud(`Training Room ${i%12}`)+`\nSynthetic turn ${i}.`;
        rt.messages.push({id:`a${i}`,role:'assistant',swipe_id:0,content,
            metadata:{rpg_companion:{swipes:{0:{...report,survival:report.you}},sources:{0:c.readingSource(content)}}}});
    }
    let calls=0; rt.quiet(()=>{calls++;});
    c.history=rt.messages;
    rt.run("const stressState=emptyChatState(); userNameCache.set('stress','Marcus King');");
    const original=JSON.stringify(rt.messages);
    const read=()=>rt.run("withReadPass(history,()=>hmsPanelState('stress',history,stressState))");
    const heapBefore=process.memoryUsage().heapUsed;
    const start=performance.now();read();const coldMs=performance.now()-start;
    const warmStart=performance.now();read();const warmMs=performance.now()-warmStart;
    assert.equal(c.agendaRead(rt.messages,c.emptyChatState()).items.length,1,'Repeated appointment duplicated');
    assert.equal(c.questDetailsLatest(rt.messages).length,1,'Repeated quest duplicated');
    assert.equal(c.simFold(rt.messages,c.emptyChatState()).minds.size,1,'NPC identity drift');
    assert.equal(JSON.stringify(rt.messages),original,'Reading rewrote saved messages');
    const last=rt.messages.at(-1), parsed=c.messageHud(last);
    assert.strictEqual(c.messageHud(last),parsed,'Unchanged message reparsed');
    last.content=last.content.replace('07:15','07:16');
    assert.notStrictEqual(c.messageHud(last),parsed,'Equal-length edit kept stale HUD');
    assert.equal(c.getSwipeData(last),null,'Equal-length edit reused old report');
    last.swipe_id=1;
    assert.equal(c.getSwipeData(last),null,'New swipe reused old report');
    assert.equal(rt.writes.length,0,'Read/refresh wrote metadata');
    assert.equal(calls,0,'Local read/refresh invoked a model');
    console.log(JSON.stringify({messages:count,coldMs:+coldMs.toFixed(2),warmMs:+warmMs.toFixed(2),
        heapDeltaBytes:process.memoryUsage().heapUsed-heapBefore,writes:rt.writes.length,calls}));
}
console.log('Long-chat reconciliation, unique identities, cache reuse, edits/swipes and read-only operations passed.');
