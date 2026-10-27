// Deterministic mock-host payload for browser layout checks; contains no chat export.
const {runtime, seed, reading} = require('./test_panel_tracking.cjs');
(async () => {
    const rt = runtime(); seed(rt);
    const name = 'LongSpellName'.repeat(4);
    const note = 'Practice slowly, retaining each detail of the learning exercise. '.repeat(5).trim();
    const report = structuredClone(reading);
    report.you.study = [{spell:name,progress:25,note}];
    report.you.mastered = ['Mastered Sphere'];
    rt.response(report);
    rt.ctx.setLorePool('test', [
        [name, 'Intermediate'], ['Earth Spear', 'Intermediate'], ['Mastered Sphere', 'Beginner'], ['Locked Sphere', 'God']
    ].map(([name,rank],i) => ({id:String(i),key:[name],content:`[SPELL — ${name}]\nSchool: Earth · Rank: ${rank}\nEffect: A ${name} demonstration with a readable description.`})));
    await rt.ctx.runSeparateUpdate('test');
    await rt.ctx.pushState('test');
    const payload = rt.events.filter(e => e.type === 'state').at(-1);
    const data = rt.ctx.getSwipeData(rt.messages.at(-1));
    const internalStates = rt.ctx.statesPanelHtml({d:data,prevRel:new Map()},rt.ctx.parseHud(rt.messages.at(-1).content),'ui-fixture');
    const statesCss = rt.run('STATES_CSS');
    const resumed=runtime();
    const restored=structuredClone(rt.messages.at(-1));restored.id='continued-ui';
    resumed.messages.push({id:'continue-handler',role:'user',content:'Mushoku_Continue_Handler\n'+restored.content},restored);
    const continuation=await resumed.processors.find(p=>p.priority===50).handler({origin:'render',isUser:false,content:restored.content,chatId:'resumed-ui',messageId:restored.id});
    const living=runtime(); const livingReply=structuredClone(restored); livingReply.id='living-continued-ui';
    living.messages.push({id:'living-continue',role:'user',content:'MUSHOKU_TENSEI_START_CONTINUER\nResume\n'+livingReply.content},livingReply);
    const livingContinuation=await living.processors.find(p=>p.priority===50).handler({origin:'render',isUser:false,content:livingReply.content,chatId:'living-resumed-ui',messageId:livingReply.id});
    console.log(JSON.stringify({livingContinuationHtml:livingContinuation?.content || '',payload,name,note,internalStates,statesCss,continuationHtml:continuation?.content || ''}));
})().catch(error => {console.error(error);process.exitCode=1;});
