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
    console.log(JSON.stringify({payload,name,note,internalStates,statesCss}));
})().catch(error => {console.error(error);process.exitCode=1;});
