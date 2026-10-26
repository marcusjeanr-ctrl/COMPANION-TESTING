// Read-only replay; prints counts only. Never commit the supplied input.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { runtime } = require('./test_panel_tracking.cjs');
assert(process.argv[2], 'Usage: node tools/audit_private_export.cjs /private/export.json');
const filename = process.argv[2];
const originalBytes = fs.readFileSync(filename);
const data = JSON.parse(originalBytes);
assert(Array.isArray(data.messages) && data.messages.length > 0);
const rt = runtime();
const chat = data.messages.map(m => ({ ...m, role: m.role || (m.is_user ? 'user' : 'assistant') }));
const before = JSON.stringify(chat);
const c = rt.ctx, st = c.emptyChatState();
const replies = chat.filter(m => m.role === 'assistant');
const selected = replies.map(m => c.getSwipeData(m));
assert(selected.some(Boolean), 'No readable tracking reports');
const fold = c.simFold(chat, st);
assert(fold.minds.size > 0, 'Export has no reconciled Minds');
const agenda = c.agendaRead(chat, st);
const quests = c.questDetailsLatest(chat);
const last = replies.at(-1), report = c.getSwipeData(last);
assert(report && report.minds?.length > 0, 'Last reply has no Minds');
assert(c.statesPanelHtml({d:report,prevRel:new Map()},c.parseHud(last.content),last.id).includes('Internal states'));
const originalContent = last.content;
last.content += '\nSynthetic audit edit.';
assert.equal(c.getSwipeData(last), null, 'Edited source reused tracking');
last.content = originalContent;
assert.equal(JSON.stringify(chat), before, 'Replay mutated input messages');
assert(originalBytes.equals(fs.readFileSync(filename)), 'Replay changed the private file');
console.log(JSON.stringify({messages:chat.length,replies:replies.length,readableReports:selected.filter(Boolean).length,
 minds:fold.minds.size,pairs:fold.pairs.size,agenda:agenda.items.length,
 quests:Array.isArray(quests)?quests.length:Object.keys(quests||{}).length,
 internalStates:true,editedSourceRejected:true,inputUnchanged:true}));
