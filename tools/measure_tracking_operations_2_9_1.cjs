const path = require('node:path');
const { runtime, seed, hud, reading } = require('./test_panel_tracking.cjs');
const files = process.argv.slice(2);
if (!files.length) files.push(path.join(__dirname, '../dist/backend.js'));

(async () => {
    for (const file of files) {
        const r = runtime(path.resolve(file));
        const counts = { model: 0, getMessages: 0, metadataWrites: 0, storageReads: 0, storageWrites: 0, historyElementReads: 0, traversals: {} };
        for (const [object, key, counter] of [[r.ctx.spindle.chat, 'getMessages', 'getMessages'], [r.ctx.spindle.chat, 'updateMessage', 'metadataWrites'],
            [r.ctx.spindle.storage, 'getJson', 'storageReads'], [r.ctx.spindle.storage, 'setJson', 'storageWrites']]) {
            const original = object[key]; object[key] = async (...args) => { counts[counter]++; return original.apply(object, args); };
        }
        seed(r); r.quiet(() => { counts.model++; });
        await r.ctx.runSeparateUpdate('test');
        const transport = JSON.parse(JSON.stringify(counts));
        const sample = [];
        for (let i = 0; i < 300; i++) {
            sample.push({ id: `u${i}`, role: 'user', content: 'I continue training.' });
            const data = r.ctx.parseCompanion(`<rpg_companion>${JSON.stringify(reading)}</rpg_companion>`);
            sample.push({ id: `a${i}`, role: 'assistant', swipe_id: 0, content: hud(), metadata: { rpg_companion: { swipes: { 0: { ...data, survival: data.you } } } } });
        }
        const tracked = new Proxy(sample, { get(target, key, receiver) { if (typeof key === 'string' && /^\d+$/.test(key)) counts.historyElementReads++; return Reflect.get(target, key, receiver); } });
        const functions = [typeof r.ctx.hmsTimelineUncached === 'function' ? 'hmsTimelineUncached' : 'hmsTimeline',
            typeof r.ctx.relReadingsUncached === 'function' ? 'relReadingsUncached' : 'relReadings',
            typeof r.ctx.spellStoryFoldUncached === 'function' ? 'spellStoryFoldUncached' : 'spellStoryFold',
            'protocolMessages', 'mtEventLedgerUncached', 'injuryReadState', 'simReplies', 'atlasObserveHistory'];
        for (const name of functions) if (typeof r.ctx[name] === 'function') {
            const original = r.ctx[name]; r.ctx[name] = (...args) => { counts.traversals[name] = (counts.traversals[name] || 0) + 1; return original(...args); };
        }
        counts.historyElementReads = 0;
        r.ctx.sample = tracked;
        r.run("hmsPanelState('test', sample, emptyChatState())");
        console.log(JSON.stringify({ file, transport, panel: { messages: sample.length, historyElementReads: counts.historyElementReads, traversals: counts.traversals } }));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
