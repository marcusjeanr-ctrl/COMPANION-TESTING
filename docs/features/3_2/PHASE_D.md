# Phase D — roleplay-quality tools

Frozen phase-start main: `e07830acbfe3e7a9d84185d7d19b067d247d39b1`.
A/B pass; C is inconclusive (+5.85% wall / +7.45% CPU, both below baseline IQR).
Continuation is explicitly allowed by the revised rule. No live Lumiverse testing.
Full checks and 20-pair revised gate follow item 19; no per-item speed claim.

## 15. Repetition watch

Backend `playProse` reads at most 40 recent message positions / 10 visible story
replies, at most 12,000 visible characters each. It never reads reasoning fields;
HUD, hidden tracker, fenced JSON and explicit reasoning tags are excluded. Words
and within-sentence trigrams count once per reply; threshold is at least 3 replies
and 60% of the window, top 8 only. This is a heuristic with a small English stop
list, not a prose-quality score or a multilingual style guarantee.

The frontend requests this bounded read only for an open view, caches one active
chat/reply result, and invalidates on existing generation/swipe/edit events. No
poll frequency, timer, model call, persistent report or default prompt changes.
The separate reminder toggle defaults OFF; it appends at most 240 characters to an
already-existing context message only if space remains inside the existing 6,000
character lore/context allowance. Full lore is never evicted for a style hint.
No flagged words or no existing context means no hint. The setting explicitly says
prose style is normally the preset's job. Disabled views return before analysis.

Files: backend helper/read RPC and optional interceptor branch; frontend lazy view,
settings and bounded cache; shared tests; Chromium case; four dictionaries.
Tests cover actual API story annotations, hidden/continuation exclusion, HUD /
tracker / reasoning / fence exclusion, minimum frequency, once-per-reply counts,
real read RPC, actual interceptor off/on/off identity, no metadata writes and the
spare budget. Chromium checks open/read, counts and collapse. Default prompts are
checked by the phase pipeline; opted-in wording is advisory only.

## 17. Next-action drafts

Up to five read-only suggestions in a fixed order: due-soon appointment, present
NPC, active objective, live ungated planted lead/thread, explicitly known current
room exit. Secrets, gated planted details, ended objectives and unknown exit data
are excluded. No pathfinding, rule, outcome or NPC knowledge is inferred.
Click uses the official `ctx.composer.getState/setText/focus` draft bridge only;
there is no call to `send`, generation, chat mutation or saved tracking. A missing
bridge or wrong active chat disables the action. The current draft is replaced;
review/edit/send remains the user's decision (called out in the view).

Files: frontend helper/lazy view, settings, responsive chips; bounded room-exit
projection in the existing play-view read; shared tests; Chromium draft mock;
four dictionaries. Tests cover all five sources, ordering/cap, empty/unknown and
ended/private sources, immutable state, editable draft and zero send/backend edit
requests. Chromium at 320px passes. Default and optional prompt size: unchanged.
The installed host's composer capability still needs live verification.
