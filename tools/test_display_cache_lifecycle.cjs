const assert = require('node:assert/strict');
const {runtime} = require('./test_panel_tracking.cjs');
const defer = () => { let resolve,reject; const promise=new Promise((a,b)=>{resolve=a;reject=b}); return {promise,resolve,reject}; };
function message(rt, name='Current') {
    const content='A visible response.';
    return {id:'reply',role:'assistant',swipe_id:0,content,metadata:{rpg_companion:{swipes:{0:{characters:[{name,thoughts:'Private thought'}],relations:[]}},sources:{0:rt.ctx.readingSource(content)}}}};
}
async function main() {
    {
        const rt=runtime(), pending=defer(); let reads=0;
        rt.ctx.spindle.chat.getMessages=()=>{reads++;return pending.promise;};
        const states=rt.ctx.getStatesFor('test','reply'), thoughts=rt.ctx.getThoughtsFor('test','reply');
        pending.resolve([message(rt)]);
        const [s,t]=await Promise.all([states,thoughts]);
        assert.equal(reads,1,'Concurrent display requests must share one history read');
        assert.equal(s.d.characters[0].name,'Current'); assert.equal(t[0].name,'Current');
    }
    for(const failure of [false,true]) {
        const rt=runtime(), pending=defer();
        rt.ctx.spindle.chat.getMessages=()=>pending.promise;
        const request=rt.ctx.getThoughtsFor('test','reply');
        rt.ctx.refreshThoughtsCache('test',[message(rt,'Fresh')]);
        if(failure)pending.reject(new Error('Old failed fetch'));else pending.resolve([message(rt,'Stale')]);
        await request;
        assert.equal((await rt.ctx.getThoughtsFor('test','reply'))[0].name,'Fresh','Late load must not overwrite a newer snapshot');
        assert.equal((await rt.ctx.getStatesFor('test','reply')).d.characters[0].name,'Fresh');
    }
    {
        const rt=runtime(), old=defer(), fresh=defer(); let reads=0;
        rt.ctx.spindle.chat.getMessages=()=>++reads===1?old.promise:fresh.promise;
        const a=rt.ctx.getStatesFor('test','reply');
        rt.ctx.statesDrop('test');
        const b=rt.ctx.getStatesFor('test','reply');
        old.resolve([message(rt,'Old')]); await a;
        const c=rt.ctx.getThoughtsFor('test','reply');
        assert.equal(reads,2,'Old finalizer must not remove the replacement load');
        fresh.resolve([message(rt,'Fresh')]); await Promise.all([b,c]);
        assert.equal((await rt.ctx.getThoughtsFor('test','reply'))[0].name,'Fresh');
    }
    {
        const rt=runtime();let reads=0;
        rt.ctx.spindle.chat.getMessages=async()=>{if(++reads===1)throw Error('Temporary');return [message(rt)];};
        assert.equal(await rt.ctx.getStatesFor('test','reply'),null);
        assert.equal((await rt.ctx.getThoughtsFor('test','reply'))[0].name,'Current','An unrequested view must remain retryable');
        assert.equal(reads,2);
    }
    {
        const rt=runtime(), c=rt.ctx, normal=message(rt), legacy=message(rt,'Legacy');
        legacy.id='legacy'; delete legacy.metadata.rpg_companion.sources;
        const exported=message(rt,'Exported');exported.id='exported';exported.extra={spindle_metadata:exported.metadata};delete exported.metadata;
        const continuation=message(rt,'Continuation'); continuation.id='continuation'; continuation._rpgcPurpose='continue';
        const hidden=message(rt,'Hidden');hidden.id='hidden';hidden.hidden=true;
        const edited=message(rt,'Edited');edited.id='edited';edited.content+=' Changed.';
        const swipe=message(rt,'Inactive');swipe.id='swipe';swipe.swipe_id=1;
        swipe.metadata.rpg_companion.swipes[1]={characters:[{name:'Active'}],relations:[]};
        swipe.metadata.rpg_companion.sources[1]=c.readingSource(swipe.content);
        const inline={id:'inline',role:'assistant',_rpgcPurpose:'continue',content:'Restored history.\n<rpg_companion>{"characters":[{"name":"Snapshot"}]}</rpg_companion>'};
        const history=[normal,legacy,exported,continuation,hidden,edited,swipe,inline];
        const expected=history.map(m=>[m.id,c.statesReading(m)]).filter(([,d])=>d);
        const bytes=JSON.stringify(history);
        let reads=0; c.spindle.chat.getMessages=async()=>{reads++;return history;};
        c.refreshThoughtsCache('test',history);
        for(const [id,d]of expected){const actual=await c.getStatesFor('test',id);assert(actual,id);assert.deepEqual(actual.d,d);}
        for(const m of [hidden,edited])assert.equal(await c.getStatesFor('test',m.id),null);
        for(const m of [hidden,edited,continuation,inline])assert.equal(await c.getThoughtsFor('test',m.id),null);
        assert.equal((await c.getThoughtsFor('test','swipe'))[0].name,'Active');
        for(let i=0;i<100;i++)await Promise.all([c.getStatesFor('test','reply'),c.getThoughtsFor('test','reply')]);
        assert.equal(reads,0,'Warm refreshes must reuse the display cache');
        assert.equal(JSON.stringify(history),bytes);assert.equal(rt.writes.length,0);
    }
    {
        const rt=runtime(), c=rt.ctx, history=Array.from({length:2000},(_,i)=>({...message(rt),id:'reply-'+i}));
        const original=c.getSwipeData;let validations=0;
        c.getSwipeData=(...args)=>{validations++;return original(...args);};
        c.refreshThoughtsCache('long',history);
        assert.equal(validations,2000,'Each valid ordinary report is validated once for both displays');
        assert.equal((await c.getThoughtsFor('long','reply-0'))[0].name,'Current','Oldest response remains available');
        assert.equal((await c.getStatesFor('long','reply-1999')).d.characters[0].name,'Current');
        assert.equal(rt.writes.length,0);
    }
    console.log('Display cache lifecycle: concurrent load, newer snapshot, invalidation and failure isolation passed.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
