# 3.2 staging — phased verification

Authorized repository: `marcusjeanr-ctrl/COMPANION-TESTING` only.
Branch: `staging/features-3.2`, starting main `e07830acbfe3e7a9d84185d7d19b067d247d39b1`.
Frozen comparison baseline: 3.0.10 `540df20f602bd475b9149c1ab28aa705e391f72d`.
No main merge, release, original-repository write or existing-tag change is authorized.

The starting controlled matrix already failed the 5% warm gate: 2,000-message
warm medians 125.52 → 143.22 ms (+14.10%); cold 474.49 → 505.98 ms (+6.64%).
600-message cold 261.24 → 277.38 ms (+6.18%), warm 65.77 → 69.03 ms (+4.96%).
Raw baseline data will be retained with phase results. These synthetic fixtures
and shared-machine measurements are not live host acceptance.

## Phase A

### 1. Objective quest-reference labels

Confirmed the Objectives renderer printed the raw `o.quest` string, including IDs.
`objectiveQuestLabel` now resolves a unique existing quest ID/key/identity key or
name to its title at render time. Unknown and ambiguous references remain raw.
No reports, quest identities, tracking interpretation or storage are modified.
No UI label strings, requests, prompts, timers or dependencies were added.

Files: `dist/frontend.js`, `tools/test_objective_quest_labels.cjs`, registration in
`tools/run_tests.cjs`, one Chromium case in `tools/test_ui_browser.py`, this report.
The failing pre-change regression and passing post-change tests cover actual parsed
quest IDs, name references, unknown references, case, ambiguity, missing data,
immutable reports and zero writes. Chromium exercises the actual Objectives card
at 320px and verifies that rendering sends no edit/objective requests.

Per-item focused checks and release identity pass. Full suite, Chromium and the
controlled matrix are phase-level checks, recorded after Phase A completes.

### 2. Display-only recent timeline deduplication

The Chronicle renderer previously showed each stored entry independently, including
near-identical consecutive descriptions. It now groups only display entries with
matching participants, kind, status, loop/arc, date (when known), hidden/star flags
and compatible wording within 12 source-message positions (at most six ordinary
user/assistant exchanges). Matching is anchored to the earliest entry, not an
unbounded chain. At most 64 recent candidate groups are compared per row.

Approved narrow wording normalization covers altering/shifting. Promise descriptions
can share an explicit named meeting target; conflicting explicit conditions remain
separate, and ambiguous matches are not collapsed. Different actors, actions,
directions, dates, recurrence words, user notes and unknown chronology remain
separate. Unknown participant attribution is conservatively left ungrouped. This is
not general semantic or multilingual paraphrase recognition.

Earliest text/control ID stays visible with a ×N count and the original descriptions
in its tooltip. Source reports, Chronicle/Cortex writes, IDs, tracking and planted
payoff logic are unchanged. The additive optional setting `chronicle.collapseSimilar`
(default on) restores the original individual display when off. The same presentation
helper handles live and paid-off planted details, using existing ages for their
bounded reply window and the existing source clock for day separation. Different
days cannot collapse; if the source day is unknown, separate replies stay separate.

Chronicle payloads add transient `msgId`/`replyIndex` display provenance, reusing
the existing builder's index. Planted views expose additive `readAt` from their
already-computed source clock; no report field is written. No new history pass is added. Closed Chronicle and
paid-off details do not run matching; opening performs the computation. Closed
Quests also skip the new live-planted matching. No new view, calls, polling or timers.

Files: both runtime sources in `dist/`, `tools/test_recent_display_dedup.cjs`, suite
registration, two Chromium cases, all four dictionaries plus embedded frontend
translations, and this report. Focused tests cover all supplied examples and negative
boundaries, immutable inputs, opt-out, lazy closed sections, counts and actual UI at
320px in dark Space and light Mushoku themes. The historical 2.8.1 parity comparison verifies the new display clock against
observed HUD clocks, then compares every original field unchanged; a dedicated
regression also asserts the exact source clock and immutable metadata.
Three new UI keys are translated to pt-BR/es/ru/tr (English source-key fallback).
Full suite/browser and controlled performance are recorded at the phase gate.

### 3. Reliability — investigation only

Pending; no ability-state or gameplay-rule changes are authorized for this item.

## Later phases

B, C and D have not started. Their execution depends on the preceding phase gates.
Version remains 3.1.0 RC during implementation; final 3.2.0 RC identity changes and
release-candidate notes are deferred until completion of the authorized gates.

**None of this has been tested in a live Lumiverse instance.**
