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

Pending.

### 3. Reliability — investigation only

Pending; no ability-state or gameplay-rule changes are authorized for this item.

## Later phases

B, C and D have not started. Their execution depends on the preceding phase gates.
Version remains 3.1.0 RC during implementation; final 3.2.0 RC identity changes and
release-candidate notes are deferred until completion of the authorized gates.

**None of this has been tested in a live Lumiverse instance.**
