# 3.2 staging — phased verification

**Gate policy update:** the user superseded the original historical wall-only hold.
The revised 20-pair wall/CPU three-way check **passes Phase A**; see
[GATE_REVISION.md](GATE_REVISION.md). The earlier report below is retained as the
historical Phase A record. Phase B now proceeds on the review branch only.

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

Confirmed with exact synthetic quotes matching both examples: a provider-supplied
`reliable` assessment survives for “I reinforce my movement with Touki and burst
diagonally.” and “I deliberately withdraw my Touki.”, as does one clean countercut.
This is not a local use-count promotion: `abilityEvidenceNormalize` accepts the
state, `abilityEvidenceRows` checks quote presence and attempt/ownership/mastery
boundaries, and `spellStoryFoldUncached` treats `reliable` as known. It has no
additional explicit-reliability/history requirement. The first-person “I” wording
also is not the `you|playerName` actor pattern used in the attempt guard. No runtime
rule, prompt, progression, reported assessment or saved data was changed here.

Visibility was reproduced with both an empty cache and the repository's complete
Six-Sided World lore fixture loaded:

- `Sword God countercut` and `Diagonal Step/Counter` fall through as magic in this
  fixture. Their names appear in the Magic spellbook (not as canonical known Sword
  techniques). This is the previously reported fallback-routing gap, not proof of
  what a different live lore cache will classify. The Magic spellbook does not
  itself display the raw Reliable label, but the acceptance makes these names known.
- A recognized martial `Compact diagonal cut` appears in Abilities as **Reliable**
  after one quote. This is the exact confidence-validation gap.
- Bare Touki is intentionally suppressed as a new learned item; it remains the
  current HUD's Active/Inactive Abilities field, not a separate known Magic spell.
  The investigation fixture's HUD says Active; narrative withdrawal alone does not
  overwrite that authoritative HUD.
- None of these single-use reliable assessments is in the mastered map, and
  `newlyLearned` remains false. The problem is unsupported reliability/knowledge,
  not a locally awarded mastery count.

Smallest proposed guard, **not implemented**: separate an unsupported newly
reported reliability assessment from earned knowledge unless its source explicitly
establishes repeatable/reliable ability or accepted prior evidence already establishes
that skill. Reuse existing observations; preserve historical knowledge, manual
choices, failed practice and ownership/source safeguards. Do not invent a universal
minimum number of strikes. Risk: blocking legitimately established abilities or
card-specific progression; require known-vs-new, historical/manual, single-use,
failed/observed, explicit reliable evidence, source edits/swipes and cross-card tests.
Routing unlisted physical maneuvers is a separate proposed follow-up.

Files: `tools/test_reliability_3_2_investigation.cjs`, suite registration and this
report. Eight parser/fold/panel fixtures (four names × empty/full lore) verify exact
current acceptance and card visibility, unchanged metadata and zero writes.
Findings were reported before proposing any guard; none was implemented.

## Phase A verification and performance gate

Node 22: `node tools/check_release.cjs`, all **60** regression suites and both bundle
syntax checks pass. Real Chromium with the mock Lumiverse bridge: **42** UI and
**5** visibility tests pass, including new 320px, dark/light, opt-out and lazy cases.
`python3 tools/embed_i18n.py` embeds 2,694 keys in each of the four dictionaries
(English uses source keys). No new dependency or workflow was added.
Raw local acceptance: [VALIDATION_PHASE_A.json](VALIDATION_PHASE_A.json).

Standard prompt fixtures remain **15,291 / 19,213 characters**. Pipeline medians
(single smoke process, not a controlled speed claim): parse 0.6912 ms, response
0.9398 ms, construct prompt 0.3896 ms; zero logged mock warnings. See
[PIPELINE_PHASE_A.json](PIPELINE_PHASE_A.json). Items 1–3 add no injection, model
request, polling, timer or automatic frequency change. Phase D did not start.

### Method

`tools/benchmark_release_comparison.py`, Node 22, 600 and 2,000 messages, ten
alternating AB/BA pairs per case; frozen 3.0.10 source. Each source/run gets a fresh
process, cold first projection, three warmups and median of ten warm reads. The
reported warm metric is the ratio of the ten run-medians, matching the existing
5% gate. No local test/benchmark workload ran concurrently. Shared-host scheduling
cannot be fully controlled. Tables show IQR; min/max and individual measurements
are kept in the linked raw data. No unsuccessful run was discarded or replaced.

### Starting main, before Phase A

[PERFORMANCE_BEFORE.json](PERFORMANCE_BEFORE.json)

| Messages / case | 3.0.10 median (IQR), ms | Candidate median (IQR), ms | Change |
| --- | --- | --- | --- |
| 600 / cold | 261.24 (226.70–305.49) | 277.38 (231.50–336.13) | +6.18% |
| 600 / warm | 65.77 (60.86–90.66) | 69.03 (59.38–78.56) | +4.96% |
| 2000 / cold | 474.49 (464.33–510.99) | 505.98 (482.57–527.69) | +6.64% |
| 2000 / warm | 125.52 (125.11–139.47) | 143.22 (131.48–152.15) | +14.10% |

### Phase A candidate (items 1–2 runtime; item 3 has no runtime changes)

[PERFORMANCE_PHASE_A.json](PERFORMANCE_PHASE_A.json)

| Messages / case | 3.0.10 median (IQR), ms | Candidate median (IQR), ms | Change |
| --- | --- | --- | --- |
| 600 / cold | 237.50 (208.31–270.93) | 232.86 (228.73–249.65) | -1.95% |
| 600 / warm | 63.10 (50.30–67.67) | 63.95 (55.08–71.07) | +1.34% |
| 2000 / cold | 509.09 (484.33–538.82) | 547.37 (488.24–561.86) | +7.52% |
| 2000 / warm | 140.25 (134.62–174.44) | 153.06 (135.97–158.50) | +9.14% |

**Gate failed: +9.14% exceeds 5%.** The paired-percent median in this same run is
−5.03%, which highlights variability; it is not substituted for the required gate
metric. The difference versus the earlier +14.10% matrix is not claimed as a speed
improvement because the underlying baseline medians changed between matrices.

### Commit boundary / bisection

- Item 1 `80baa8b`: frontend-only runtime change. Its backend is byte-identical to
  starting main `e07830a`: SHA-256
  `513f4b4f52f4daec0b2f814ef693f887a73b45373c8b4d7842ad30bfb327e910`.
- Item 2 `a4894b6`: adds the display grouping and only source-position/clock
  provenance in backend read views. Backend SHA-256
  `ef32a06a28c6a7d321204063212abe920c302682ae64ecb679bd802069269fe0`.
  The phase matrix above tests these exact bytes.
- Item 3: no runtime change. It shares the item-2 runtime and phase measurements;
  inventing a separate before/after speed improvement would be misleading.

The controlled ten-pair item-1 boundary run is retained in
[PERFORMANCE_BISECT_ITEM1.json](PERFORMANCE_BISECT_ITEM1.json):

| Messages / case | 3.0.10 median (IQR), ms | Candidate median (IQR), ms | Change |
| --- | --- | --- | --- |
| 600 / cold | 252.87 (231.38–284.87) | 260.12 (241.71–324.10) | +2.87% |
| 600 / warm | 70.50 (63.01–84.37) | 66.62 (63.36–73.02) | -5.49% |
| 2000 / cold | 552.37 (525.48–671.38) | 494.92 (477.89–525.18) | -10.40% |
| 2000 / warm | 155.07 (143.28–169.31) | 141.14 (131.72–142.71) | -8.98% |

The identical starting backend thus measured +14.10% initially and −8.98% at the
item-1 boundary, with overlapping spreads. This is not repeatable evidence that a
particular new phase item caused the entire difference. The passing boundary run
does **not** clear the failed Phase A candidate gate. No culprit or performance fix
is claimed. Item 2 is **held from release/integration**, retained on this draft
branch so its tested implementation can be reviewed or deferred without losing
work. No unrelated 3.1 feature was removed to force the number below 5%.

Per-item performance record: item 1 uses the byte-identical starting backend and
its explicit boundary matrix; item 2 uses the Phase A matrix; investigation-only
item 3 uses the same unchanged runtime. Both original failed matrices remain raw.

## Status, limitations and next work

**Stopped at the Phase A gate. Phases B, C and D (items 4–19) have not started.**
No NPC dossier, recap, Highlights view, new countdown, quest-chain links, evidence
counts, change strip, open-loop list, standing chart, calendar, report card,
repetition watcher, voice notes, action chips, daily journal or reputation view is
claimed. These depend on clearing the phase gate.

Version remains **3.1.0 RC** on this incomplete staging branch; the final 3.2.0 RC
identity bump is deferred rather than labeling unfinished work a completed 3.2
candidate. README/CHANGELOG distinguish unreleased Phase A work from a release.
The requested `3.2-phase-a` tag is a **held review/rollback checkpoint**, not a gate
pass or release. No B/C/D phase tags are created. Main and the existing 3.0.10 /
3.1.0-rc tags remain untouched.

Remaining limitations: source-supported chronology and participant attribution
are required for display grouping; ambiguous/unknown cases remain visible. General
semantic or multilingual paraphrase matching is not claimed. Existing Cortex
writing and tracker extraction may still retain repeated reports because this is
display-only. Single-action Reliable acceptance and the reproduced martial fallback
routing gap are reported proposals, **not fixed**. Benchmark variability and the
failed strict budget require performance investigation before the next phase;
reviewing/deferring item 2 is a decision for the next acceptance step.

**None of this has been tested in a live Lumiverse instance**, Android WebView or
live provider. Browser bridge tests, synthetic card fixtures and JSON checks do not
establish live campaign acceptance. No paid API tests were run.
