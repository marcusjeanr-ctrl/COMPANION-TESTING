# Phase 2 stabilization backlog

Initial gameplay baseline: ad4eb70 / 2.9.7 RC; Phase 1 merge: 1372ea9 (PR #1).
No live Lumiverse instance is available (confirmed by user); continue local tests.

| ID | Severity / state | Reproduction and next action |
|---|---|---|
| UI-1 | Medium, reproduced/fixed | A 52-character compound spell name exceeds the 276px study row (363px content). Add scoped wrapping; preserve stored text. Chromium regression. |
| UI-2 | Medium, reproduced/fixed | Default floating panel ends at x=462 in a 320px viewport; saved positions and resize can hide all controls. Bound size/position to viewport on open, drag, enlarge and resize. Chromium regression. |
| CHAT-1 | High, reproduced/fixed | Non-HMS extras remain after CHAT_SWITCHED until next state arrives. Clear old transient extras immediately; reject late old-chat state. No storage rewrite. |
| UI-3 | Passed local | Stored study-note text is complete in the DOM for the fixture. Older exports may already be truncated; do not invent missing text or weaken existing caps. |
| UI-4 | Passed Chromium / mock host | Drawer, floating, popout, test-zone switching; Known/Studying/Mastered/Locked labels; Internal States CSS tabs and collapse. Real host/WebView untested. |
| TRACK-1 | Existing fixtures pass; expand continuity checks | Minds source validation, swipes/edits, knowledge/privacy, player Agenda vs NPC routines, Roa quest stages, inventory ownership and progression. |
| PERF-1 | Pending measured stress | Deterministic 50/100/250/500/1000+ message histories; cache reuse, edits/swipes, memory and storage/call counts. |
| LIVE-1 | Blocked live | Installation/update/restart, page reload, actual metadata API, real WebView and all five complete RP cards need a Lumiverse test instance. |
| HISTORY-1 | Missing reference | Independent 2.1 archive not supplied; no new consolidation. |
| RELEASE-1 | Gate | Retain RC status; require full regressions, browser CI, measurements, review and exact artifact verification before any RC publication. No stable claim. |
