const assert = require('node:assert/strict');
const { runtime } = require('./test_panel_tracking.cjs');
const rt = runtime();
const original = '### WORLD STATE ###\nArmored Dragon Calendar: K417, Month 2, Day 8 | Time: 07:20\nMana Capacity: Vast\nMagic Tiers: Water (Intermediate)\n***';
const past = { id: 'a0', role: 'assistant', content: original, swipe_id: 0 };
const saved = { id: 'a1', role: 'assistant', content: 'Here is your saved game:\n\n```text\n' + original + '\n```\n\n### SAVE NOTES ###\nThe blade was never acquired.', swipe_id: 0 };
const ooc = { id: 'a2', role: 'assistant', content: original + '\nThe guide explains the game.', swipe_id: 0 };
const restored = { id: 'a3', role: 'assistant', content: '```text\n' + original + '\n```\n\nRestored for continuation.', swipe_id: 0 };
const messages = [past, { id: 'u1', role: 'user', content: 'Mushoku_Save' }, saved,
  { id: 'u2', role: 'user', content: 'OOC guide: how does magic work?' }, ooc,
  { id: 'u3', role: 'user', content: 'Mushoku_Continue_Handler\n\n```text\n' + original + '\n```\n### SAVE NOTES ###\nContinue from here.' }, restored];
rt.ctx.companionMarkTurnPurposes(messages);
assert.equal(saved._rpgcPurpose, 'save');
assert.equal(ooc._rpgcPurpose, 'help');
assert.equal(restored._rpgcPurpose, 'continue');
assert.equal(rt.ctx.trackingMessageVisible(saved), false);
assert.equal(rt.ctx.trackingMessageVisible(ooc), false);
assert.equal(rt.ctx.getSwipeData(restored), null);
assert.equal(rt.ctx.messageHud(saved), null);
assert.equal(rt.ctx.messageHud(ooc), null);
assert(rt.ctx.messageHud(restored), 'Continue HUD is readable');
assert.equal(rt.ctx.messageHud(restored).lines.length, 3);
assert.equal(rt.ctx.hmsTimeline(messages).length, 2);
assert.equal(rt.ctx.previousHudFor(messages, 'a3').lines.length, 3);
assert.equal(rt.ctx.companionTurnPurpose('Mushoku_Start_Handler\nNo saved HUD'), 'story');
console.log('Save/Continue transaction boundaries passed: saved snapshots and OOC guides excluded, valid resumed HUD read without importing stale tracking metadata.');
