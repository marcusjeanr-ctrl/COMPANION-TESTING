const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { runtime, hud, reading, seed } = require('./test_panel_tracking.cjs');
const files = process.argv.slice(2);
if (!files.length) files.push(path.join(__dirname, '../dist/backend.js'));
const median = values => values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];

(async () => {
    for (const file of files) {
        const r = runtime(path.resolve(file));
        const report = `<rpg_companion>${JSON.stringify(reading)}</rpg_companion>`;
        const response = hud() + '\n' + report;
        const samples = [];
        for (let i = 0; i < 100; i++) r.ctx.parseCompanion(report);
        for (let round = 0; round < 5; round++) {
            const start = performance.now();
            for (let i = 0; i < 1000; i++) r.ctx.parseCompanion(report);
            samples.push((performance.now() - start) / 1000);
        }
        const processSamples = [];
        for (let i = 0; i < 10; i++) await r.ctx.hmsProcessContent('bench', response, null, 'normal', {});
        for (let round = 0; round < 5; round++) {
            const start = performance.now();
            for (let i = 0; i < 50; i++) await r.ctx.hmsProcessContent('bench', response, null, 'normal', {});
            processSamples.push((performance.now() - start) / 50);
        }
        const prompt = r.ctx.buildCompanionInstruction({}, 'Rin', {}, r.ctx.emptyChatState(), [], true);
        const promptSamples = [], state = r.ctx.emptyChatState();
        for (let round = 0; round < 5; round++) {
            const start = performance.now();
            for (let i = 0; i < 100; i++) r.ctx.buildCompanionInstruction({}, 'Rin', {}, state, [], true);
            promptSamples.push((performance.now() - start) / 100);
        }
        seed(r);
        const populatedPrompt = r.ctx.buildCompanionInstruction({}, 'Rin', {}, r.run('chatStateCache.get("test")'), r.messages, true);
        console.log(JSON.stringify({ file, parseReportMedianMs: +median(samples).toFixed(4),
            processResponseMedianMs: +median(processSamples).toFixed(4), promptConstructMedianMs: +median(promptSamples).toFixed(4), promptCharacters: prompt.length,
            populatedPromptCharacters: populatedPrompt.length,
            warnings: r.warnings.length }));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
