# Selected Phase A items 1–3

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

