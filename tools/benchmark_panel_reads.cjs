const { performance } = require('node:perf_hooks');
const path = require('node:path');
const fs = require('node:fs');
const { runtime, hud, reading } = require('./test_panel_tracking.cjs');

const files = process.argv.slice(2);
if (!files.length) files.push(path.join(__dirname, '../dist/backend.js'));
for (const filename of files) {
    const rt = runtime(filename);
    const samples = [], cpuSamples = [], readings = [];
    const assessmentCount = Math.max(0, Math.min(8, Number(process.env.COMPANION_BENCH_ASSESSMENTS) || 0));
    const grouped = process.env.COMPANION_BENCH_GROUPED === '1';
    const fixture = assessmentCount || grouped ? structuredClone(reading) : reading;
    if (grouped) fixture.you.spells = ['Water Magic (Advanced): Squall, Blizzard Storm, Ice Fortress', 'Earth Magic (Intermediate): Stone Cannon, Earth Pillar, Earth Lance, Sinkhole', 'Fire Magic (Elementary): Fireball, Heat Hand', 'Ground Sense (weak at range)', 'Voiceless Casting', 'Sword God Style: Advanced'];
    if (assessmentCount) {
        fixture.you.abilities = Array.from({length:assessmentCount}, (_, i) => ({name:`Navigation Skill ${i}`, owner:'you', historical:true, state:'known', evidence:`Your signed record confirms Navigation Skill ${i}.`}));
        // Equal known-ability counts in both versions; only the candidate retains provenance.
        fixture.you.spells = fixture.you.abilities.map(row => row.name);
    }
    // 300 active readings, with user turns, many rooms, and full panel metadata.
    const replies = Math.max(1, Math.min(5000, Number(process.env.COMPANION_BENCH_REPLIES) || 300));
    for (let i = 0; i < replies; i++) {
        rt.messages.push({ id: `u${i}`, role: 'user', content: 'I continue training.' });
        const data = rt.ctx.parseCompanion(`<rpg_companion>${JSON.stringify(fixture)}</rpg_companion>`, [], null, null);
        rt.messages.push({ id: `a${i}`, role: 'assistant', swipe_id: 0,
            content: hud(`Training Room ${i % 12}`, `07:${String(i % 60).padStart(2, '0')}`) + (assessmentCount ? '\n' + fixture.you.abilities.map(row => row.evidence).join('\n') : ''),
            metadata: { rpg_companion: { swipes: { 0: { ...data, survival: data.you } } } } });
    }
    if (process.env.COMPANION_BIND_READINGS === '1' && typeof rt.ctx.readingSource === 'function') {
        for (const m of rt.messages) if (m.metadata) m.metadata.rpg_companion.sources = { 0: rt.ctx.readingSource(m.content) };
    }
    rt.ctx.history = rt.messages;
    rt.run(`const benchmarkState = emptyChatState(); userNameCache.set('bench', 'Marcus King');`);
    // Optional local card files supply the same full lore pool to each version.
    if (process.env.COMPANION_CARD) {
        const card = JSON.parse(fs.readFileSync(process.env.COMPANION_CARD, 'utf8'));
        const entries = card.data.character_book.entries;
        rt.ctx.entries = entries.map((e, i) => ({ ...e, id: String(e.id ?? i), key: e.keys || [], keysecondary: e.secondary_keys || [] }));
        rt.run(`setLorePool('bench', entries)`);
    }
    const runPanel = () => rt.run(`typeof withReadPass === 'function'
        ? withReadPass(history, () => hmsPanelState('bench', history, benchmarkState))
        : hmsPanelState('bench', history, benchmarkState)`);
    const coldCpuStart = process.cpuUsage(), coldStart = performance.now(); runPanel();
    const coldMs = performance.now() - coldStart, coldCpu = process.cpuUsage(coldCpuStart);
    for (let i = 0; i < 3; i++) runPanel();
    for (let i = 0; i < 10; i++) {
        const cpuStart = process.cpuUsage(), start = performance.now(); runPanel();
        const wallMs = performance.now() - start, cpu = process.cpuUsage(cpuStart);
        samples.push(wallMs); cpuSamples.push((cpu.user + cpu.system) / 1000);
        readings.push({wallMs, cpuMs:(cpu.user + cpu.system)/1000, userCpuMs:cpu.user/1000, systemCpuMs:cpu.system/1000});
    }
    samples.sort((a, b) => a - b); cpuSamples.sort((a, b) => a - b);
    const totalCpu = process.cpuUsage();
    console.log(JSON.stringify({ file: filename, messages: rt.messages.length, coldMs: +coldMs.toFixed(2),
        medianMs: +((samples[4] + samples[5]) / 2).toFixed(4),
        coldCpuMs:(coldCpu.user+coldCpu.system)/1000, cpuMedianMs:(cpuSamples[4]+cpuSamples[5])/2,
        warmSamples:readings, processWallMs:process.uptime()*1000,
        processCpu:{userMs:totalCpu.user/1000,systemMs:totalCpu.system/1000,totalMs:(totalCpu.user+totalCpu.system)/1000}, warnings: rt.warnings.length, ...(grouped ? {groupedAudit:true} : {}),
        ...(assessmentCount ? {assessmentsPerReply:assessmentCount,knownAbilities:rt.ctx.spellKnown(rt.messages,rt.run('benchmarkState')).size} : {}) }));
}

