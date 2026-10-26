const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {runtime,seed,reading}=require('./test_panel_tracking.cjs');
(async()=>{
    const rt=runtime();seed(rt);let calls=0;rt.quiet(()=>{calls++;});
    await rt.ctx.runSeparateUpdate('test');
    const serialized=JSON.stringify(rt.messages);
    const exported=rt.messages.map(m=>{
        const copy=structuredClone(m);
        if(copy.metadata){copy.extra={spindle_metadata:copy.metadata};delete copy.metadata;}
        return copy;
    });
    // Fresh runtime models a new extension process with imported message metadata.
    const restarted=runtime();restarted.messages.push(...JSON.parse(JSON.stringify(exported)));
    const c=restarted.ctx, state=c.emptyChatState();
    const data=c.getSwipeData(restarted.messages.at(-1));
    for(const key of ['minds','agendas','agenda','quests','gear','family','survival'])assert(data[key],key);
    assert.equal(c.simFold(restarted.messages,state).minds.size,1);
    assert.equal(c.agendaRead(restarted.messages,state).items.length,1);
    assert.equal(c.questDetailsLatest(restarted.messages).length,1);
    assert(c.gearRead(restarted.messages,state).items.some(x=>x.name==='Training sword'));
    assert(c.spellKnown(restarted.messages,state).has('earth spear'));
    assert(!c.spellKnown(restarted.messages,state).has('earth wall'),'Studying granted a spell');
    assert.equal(data.agendas[0].name,'Aurelius King');
    assert.equal(data.agenda[0].with,'Aurelius King');
    assert.equal(data.quests[0].name,reading.quests[0].name);
    const before=JSON.stringify(restarted.messages);
    const oldReport=c.getSwipeData(restarted.messages.at(-1));
    const other=runtime();seed(other);other.response({characters:[],you:{},quests:[]});
    await other.ctx.runSeparateUpdate('other-chat');
    assert.equal(JSON.stringify(restarted.messages),before,'Other conversation changed imported data');
    assert.strictEqual(c.getSwipeData(restarted.messages.at(-1)),oldReport);
    restarted.messages.at(-1).swipe_id=1;
    assert.equal(c.getSwipeData(restarted.messages.at(-1)),null);
    restarted.messages.at(-1).swipe_id=0;
    assert(c.getSwipeData(restarted.messages.at(-1)));
    assert.equal(JSON.stringify(rt.messages),serialized,'Export mutated original data');
    assert.equal(restarted.writes.length,0,'Read-only reload rewrote imported records');
    assert.equal(calls,1,'Original tracking used more than one model call');
    // Exercise representative older saved formats without running the historical rebuild.
    const disk=new Map(), legacy=runtime();
    legacy.ctx.spindle.storage.getJson=async(key,options)=>structuredClone(disk.get(key)??options?.fallback??null);
    legacy.ctx.spindle.storage.setJson=async(key,value)=>{disk.set(key,structuredClone(value));};
    for(const version of ['2.8.1','2.8.21']) {
        const record=JSON.parse(fs.readFileSync(path.join(__dirname,'rebuild/save_fixtures',version+'.json'),'utf8'));
        record.futureField={retained:true};
        const chatId='legacy-'+version.replace(/\./g,'-');
        disk.set(`chats/${chatId}.json`,record);
        const loaded=await legacy.ctx.getChatState(chatId);
        await legacy.ctx.saveChatState(chatId,loaded);
        const saved=disk.get(`chats/${chatId}.json`);
        for(const [key,value]of Object.entries(record))assert.deepEqual(saved[key],value,`Lost ${version} field ${key}`);
        assert.deepEqual(disk.get(`chats/${chatId}.json.recovery`),saved);
    }
    console.log('Continuity: fresh runtime/export round-trip, item/training/quest/routine consistency, cross-chat separation and active swipe selection passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
