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

## 16. NPC voice notes

Open dossiers can suggest short/long dialogue lines only after two of that NPC's
own quoted `[D:Name]` lines. Exact names and unambiguous first-name aliases are
supported; ambiguous aliases and narrator descriptions do not seed notes. No
personality or private knowledge is inferred. Suggestions are visibly unaccepted.
Save/accept/edit/clear are explicit user actions. Ordinary refreshes preserve an
unsaved draft in memory. Accepted one-line notes live in optional per-chat
`playNotes.voice` keys (maximum 60); old stores load without it. Reaching capacity
rejects a new note, never evicts an existing accepted note. Clearing affects only
the user's selected note. Reports/messages/schema versions are untouched.

The independent reminder defaults OFF. It uses accepted notes only for the
existing present-character list, in the same spare context allowance as item 15;
combined hints cannot exceed that allowance or displace existing lore. Default
prompt fixtures remain unchanged; opted-in voice text adds at most 240 characters.
Files: backend optional notes read/save helpers/RPC and hint; frontend dossier UI,
settings/suggestion helper; tests/Chromium; four dictionaries. Tests cover no/own
and ambiguous dialogue, unaccepted suggestions, edit/clear, sparse old stores,
current-cast ownership, save/reload, actual interceptor off/on/off identity and
spare-budget rejection. No automatic model request or generated note persistence.

## 18. Daily journal

The lazy view assembles recorded moments/milestones/plot-quest changes by known
in-game day from the existing Chronicle cache, reusing Phase A display deduplication.
Missing dated evidence yields an empty state; different loops and months stay
separate. Investigation found `chronWhen` intentionally emits only Day N / HH:MM.
The on-demand Chronicle builder now adds an optional full `recordedDay` from its
already-read HUD date (existing calendar parser); its old visible `when` label is
unchanged. The shared display grouping prefers that full anchor, so Day 8 in two
months cannot collapse. This is ephemeral projection data, never a report rewrite.
No new history pass, calendar rule or inferred date is introduced.

Only explicit Save writes the edited text to optional `playNotes.journal`.
Thirty accepted entries / 8,000 characters each are supported; capacity rejects a
new entry without deleting an old one. Saved-date keys remain selectable even when
outside the recent 30 assembled days, so accepted entries can still be edited or
cleared. Old stores need no migration. Generated assembly and unsaved edits are
not persisted. Refreshes preserve the current unsaved draft in memory.

The optional story-draft button invokes the existing OOC route ONLY on a user
click. Its ephemeral option returns a draft without saving the OOC log, journal
or chat. Ordinary OOC behavior is unchanged. The user must review/edit and Save;
no automatic model call, gameplay transaction or narrator message is produced.
Default prompt sizes are unchanged. An explicit manual OOC request has its existing
route/cost; this exception is the manual button authorized in the master task.

Files: backend Chronicle date projection, additive note RPC and OOC ephemeral path;
frontend journal helper/lazy editor/settings; shared tests; Chromium; dictionaries.
Tests cover no/one/multiple days, real parsed K-calendar months with identical day
numbers, unknown dates, immutable messages, edit/reload, no request/save on load,
exactly one manual OOC draft and no OOC/chat write. Browser verifies editing/save
and that the model button runs only after a click. Actual generated draft quality
and host provider behavior have not been tested; fixtures use a stub, never paid API.

## 19. Reported reputation

A lazy read-only view shows the HUD's exact Renown region/level terms and the NPC
knowledge already explicitly attributed to the player. Certainty labels stay as
reported. No region, relationship score, witness or outcome is invented. Thin or
missing sources show a short empty state. Each source is read only on expansion;
the feature has its own setting. Files: frontend helper/view; shared tests;
Chromium case; dictionaries. Tests cover several regions, no line, player-related
versus unrelated knowledge, uncertainty, absent knowledge and immutable state.
Chromium checks the actual view at 320px. The reputation projection itself changes no backend/prompt/storage behavior.

The RC identity is synchronized to 3.2.0 in manifest, backend diagnostics, frontend
title, README and CHANGELOG. This is a review candidate, not publication or live
acceptance. The first item-15 test caught the host's normal story annotation and
was corrected before commit; no failed implementation was published. Prose reads
are additionally bounded to 64,000 source characters per recent message before
hidden-content filtering, then 12,000 visible characters. No new timer/dependency.

Final lazy-read review tightened the shared RPC: room-only action chips do not
extract prose, and voice-only reads do not run repetition analysis. Results share
one active-chat cache when available, with per-view pending flags and existing
reply/edit invalidation. Tests replace closed-view helpers with throwing stubs to
prove those paths are not called; this is covered in the final full rerun. No
polling cadence, timer, report storage or model-call change is involved.

Final UI review also keeps rejected voice-note saves in the unsaved editor, and
keeps edits made while an OOC journal draft is pending. A late generated candidate
then requires an explicit Use generated draft click rather than overwriting the
new edit. Browser regressions exercise both cases. Action-draft templates are
translated in all four dictionaries. Dossiers now also recognize names whose only
existing source is an Agenda participant or cached Chronicle entry; sparse-source
regressions confirm those views without creating NPC records.

## Final local checks before the gate

Node 22 `check_release`, both syntax checks, **61 JS regression suites + 12 Python
gate tests**, **57 Chromium UI + 5 visibility cases** pass on the final source.
The final pipeline smoke reports 1.1568 ms parsing, 1.0506 ms response processing
and 0.5825 ms prompt construction; standard prompt lengths remain 15,291 / 19,213.
These independent tiny timing runs varied on this host (including slower readings)
and are not controlled before/after estimates. All four phase C/D smoke outputs,
including earlier faster readings, are retained in [validation data](VALIDATION_PHASE_D.json).
The authorized 20-pair CPU/wall projection gate is measured next, with no concurrent
local tests. New UI cost on the actual host, opted-in provider responses and WebView
behavior remain unverified; no stable or live acceptance is claimed.

## Phase D revised gate

20 alternating three-source observations per case; frozen main `e07830a`, historical
`540df20`. Full raw CPU/wall observations, IQRs and source spreads are retained in
[summary](REVISED_PHASE_D.json) and [raw archive](REVISED_PHASE_D_RAW.json.gz).

| Case | Metric | Main median → candidate ms | Change | Baseline IQR | Candidate IQR | Baseline / candidate spread ms |
| --- | --- | --- | --- | --- | --- | --- |
| 600 | cold wall | 264.68 → 260.47 | -1.59% | 45.23 | 40.84 | 956.85 / 150.43 |
| 600 | cold CPU | 303.59 → 293.29 | -3.40% | 52.40 | 48.74 | 1159.45 / 159.99 |
| 600 | warm wall | 72.56 → 69.04 | -4.85% | 9.38 | 10.86 | 38.54 / 83.93 |
| 600 | warm CPU | 147.02 → 136.70 | -7.02% | 29.21 | 22.38 | 76.66 / 109.59 |
| 2000 | cold wall | 565.13 → 557.02 | -1.44% | 112.81 | 64.45 | 176.11 / 404.45 |
| 2000 | cold CPU | 695.74 → 686.88 | -1.27% | 126.29 | 81.47 | 210.15 / 473.64 |
| 2000 | warm wall | 149.39 → 153.82 | +2.96% | 29.58 | 13.48 | 73.09 / 105.69 |
| 2000 | warm CPU | 216.32 → 214.73 | -0.74% | 39.65 | 36.73 | 115.82 / 125.45 |

| 2000 warm comparison | Wall change | CPU change | Assessment |
| --- | --- | --- | --- |
| baseline_to_candidate | +2.96% | -0.74% | pass |
| reference_to_baseline | -4.05% | -3.39% | pass (informational) |
| reference_to_candidate | -1.21% | -4.10% | pass (informational) |

**Phase D: PASS** under the revised main-relative rule.
No measurements were discarded. CPU is process-wide and can exceed wall time.
Shared-host scheduling remains uncontrolled; these results are neither live UI
latency nor proof of a per-feature speed improvement.
