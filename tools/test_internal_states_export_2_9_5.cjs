const assert = require('node:assert/strict');
const fs = require('node:fs');
const { runtime } = require('./test_panel_tracking.cjs');
const exportFile = process.argv[2];
const rtFixture = runtime();
const demoContent = `### WORLD STATE ###\nArmored Dragon Calendar: K417, Month 2, Day 8 | Time: 07:58\nPresent: Seraphina King (43), Aurelia King (9)\n***\nThe basin waits.`;
const demoReport = { minds: [{name:'Seraphina King',feel:'pride',toward:[{name:'you',moves:{storge:{d:2}}}]},{name:'Aurelia King',feel:'joy',toward:[{name:'you',moves:{philia:{d:2}}}]}], characters:[{name:'Seraphina King'},{name:'Aurelia King'}] };
const demoSource = rtFixture.ctx.readingSource(demoContent);
const original = exportFile ? JSON.parse(fs.readFileSync(exportFile, 'utf8')).messages.at(-1) : {
  id:'test-reply', content:demoContent, swipe_id:0,
  extra:{spindle_metadata:{rpg_companion:{swipes:{'0':demoReport},sources:{'0':demoSource}}}}
};
const rt = runtime();
const m = { id: original.id, role: 'assistant', content: original.content,
  swipe_id: original.swipe_id, extra: original.extra };
const report = original.extra.spindle_metadata.rpg_companion.swipes['0'];
rt.messages.push(m);
assert.equal(rt.ctx.getSwipeData(m).minds.length, 2, 'Export-backed Minds were lost');
assert.equal(rt.ctx.getSwipeData(m).characters.length, 2);
const fold = rt.ctx.simFold(rt.messages, rt.ctx.emptyChatState());
assert.equal(fold.minds.size, 2, 'Minds fold lost NPCs');
assert(fold.pairs.size > 0, 'Relationship matrix disappeared');
const panel = rt.ctx.statesPanelHtml({ d: report, prevRel: new Map() }, rt.ctx.parseHud(m.content), m.id);
assert(panel && panel.includes('Internal states'), 'Internal States panel not constructed');
const originalContent = m.content;
m.content = originalContent.replace('The basin waits.', 'The window waits.');
assert.equal(rt.ctx.getSwipeData(m), null, 'An edited response reused stale Minds');
m.content = originalContent;
assert.equal(rt.ctx.getSwipeData(m).minds.length, 2);
m.metadata = { rpg_companion: { swipes: { '0': { minds: [{name:'Live priority'}] } } } };
assert.equal(rt.ctx.getSwipeData(m).minds[0].name, 'Live priority', 'Live metadata did not take priority');
console.log('Internal States export reproduction, read precedence, source integrity, and rendered panel passed');
