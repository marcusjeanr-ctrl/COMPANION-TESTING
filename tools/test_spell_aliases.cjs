const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runtime, seed } = require('./test_panel_tracking.cjs');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'six_sided_spell_fixture.json'), 'utf8'));
async function main() {
    const rt = runtime(); seed(rt);
    const entries = fixture.spells.map(row => row.entry);
    rt.ctx.setLorePool('test', entries);
    const resolve = rt.ctx.spellResolver('test');
    assert.equal(resolve('Waterball').name, 'Water Ball');
    assert.equal(resolve('Fire Ball').name, 'Fireball');
    assert.equal(resolve('Flashover').name, 'Flash Over');
    assert.equal(resolve('Water Magic').key, rt.ctx.spellKey('Water Magic'));
    assert.equal(resolve('Stone Cannon Variation').key, 'stone cannon variation');
    const state = rt.run('emptyChatState()');
    const lines = rt.ctx.parseHud(rt.messages[1].content).lines;
    const list = st => rt.ctx.spellListPanel('test', rt.messages, st, { _lines: lines });
    const spells = panel => panel.schools.flatMap(group => group.spells);
    state.spellbook = [{ name: 'Waterball', from: 'you', cost: 'small' }, { name: 'Water Ball', from: 'you' }];
    const before = JSON.stringify(state);
    const known = spells(list(state));
    assert.equal(known.find(row => row.name === 'Water Ball').status, 'known');
    assert(!known.some(row => row.name === 'Waterball'));
    assert.equal(JSON.stringify(state), before, 'Reading mutated saved state');
    state.spellbook = [];
    const report = data => ({ id: 'a1', role: 'assistant', swipe_id: 0, content: rt.messages[1].content,
        metadata: { rpg_companion: { swipes: { 0: { survival: data } } } } });
    rt.messages[1] = report({ learned: ['Waterball'], mastered: ['Waterball'], study: [{ spell: 'Waterball', progress: 40 }] });
    assert.equal(spells(list(state)).find(row => row.name === 'Water Ball').status, 'mastered');
    assert.equal(list(state).studying[0].name, 'Water Ball');
    assert.equal(list(state).studying[0].progress, 40);
    assert(!rt.ctx.spellStudyReminder('test', rt.messages, state, 'Marcus'), 'Mastered alias remained in study injection');
    state.spellForget = { waterball: 'a1' };
    assert.equal(spells(list(state)).find(row => row.name === 'Water Ball').status, 'study');
    state.spellStudyStopped = { 'water ball': 'a1' };
    assert.equal(spells(list(state)).find(row => row.name === 'Water Ball').status, 'reach');
    const later = report({ learned: ['Water Ball'] }); later.id = 'a2'; rt.messages.push(later);
    assert.equal(spells(list(state)).find(row => row.name === 'Water Ball').status, 'known');
    rt.messages.pop(); rt.messages[1].swipe_id = 1;
    assert.equal(spells(list(state)).find(row => row.name === 'Water Ball').status, 'reach');
    rt.messages[1].swipe_id = 0;
    const clean = rt.run('emptyChatState()');
    clean.spellbook = [{ name: 'Waterball', from: 'you' }];
    await rt.ctx.saveChatState('test', clean);
    let handle;
    rt.ctx.spindle.onFrontendMessage = callback => { handle = callback; };
    const source = fs.readFileSync(path.join(__dirname, '../dist/backend.js'), 'utf8');
    rt.run(source.slice(source.indexOf('spindle.onFrontendMessage(async'), source.lastIndexOf('// ───────────────────────────── Startup')));
    await handle({ type: 'spell_known', chatId: 'test', name: 'Water Ball', on: false });
    const forgotten = await rt.ctx.getChatState('test');
    assert(!rt.ctx.spellKnown(rt.messages, forgotten, null, 'test').has('water ball'), 'Canonical Forget failed to suppress alias');
    await handle({ type: 'spell_known', chatId: 'test', name: 'Waterball', on: true });
    const restored = await rt.ctx.getChatState('test');
    assert.equal(restored.spellbook.filter(row => /water ?ball/i.test(row.name)).length, 1);
    assert.equal(restored.spellbook[0].name, 'Water Ball');
    assert(rt.ctx.spellKnown(rt.messages, restored, null, 'test').has('water ball'));
    const collisions = [
        { id: 'a', key: ['Mist A', 'Shared Name'], content: '[SPELL — Mist A]\nSchool: Water · Rank: Elementary' },
        { id: 'b', key: ['Mist B', 'Shared Name'], content: '[SPELL — Mist B]\nSchool: Water · Rank: Elementary' }
    ];
    rt.ctx.setLorePool('ambiguous', collisions);
    assert.equal(rt.ctx.spellResolver('ambiguous')('Shared Name').key, 'shared name');
    rt.ctx.setLorePool('test', collisions);
    assert.equal(rt.ctx.spellResolver('test')('Waterball').name, 'Waterball', 'Alias cache survived catalog switch');
    console.log('Spell aliases passed: canonical names, no duplicate Other rows, study/progress/mastery, forget/relearn/swipes, manual controls, ambiguous keywords and catalog isolation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

