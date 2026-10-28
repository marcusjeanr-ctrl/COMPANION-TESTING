# Ability identity, scene objectives and progression evidence

**Release preparation:** these fixes are included in 3.0.3 RC under PR #15.
The investigation below records checkpoint `f518159`, before the release identity
change from 3.0.2 to 3.0.3. Its runtime hashes and measurements remain unchanged
as historical evidence; release asset checksums identify the packaged version.


Investigation checkpoint `f518159` on `fix/ability-identity-quest-evidence`, based on published
3.0.2 RC (`efdf4419c9bba39f7301d573b5f68cbd7650f5e9`). Original Companion,
character cards, presets and raw saved reports remain unchanged. This report
covers this follow-up; older reports describe their own checkpoints.

## Confirmed findings and fixes

1. **Duplicate martial observations.** `martialAbilityItems` used spelling keys,
   so three descriptions of the same absorption drill produced three chips.
   `martialIdentity` reconciles tightly equivalent physical absorption wording,
   removing teacher-acknowledgment decorations and the specific pressure/counter-
   pressure wording variant. It does not use broad token similarity. Different
   methods/modifiers, center recovery, feints, sword cuts and genuine catalogue
   spells remain separate. Aliases, source message IDs, available evidence,
   training notes, states and latest explicit progress are preserved in the
   projection; raw history stays intact. Latest progress can legitimately be zero.
   Earned proficiency is retained through further practice, and explicit retraction
   applies across aliases without reviving old mastery. Existing Abilities chips
   show the retained observations in their tooltip; there is no new panel.

2. **Objectives outlive their scene.** `questDetailsLatest` retained omitted quest
   reports, correctly avoiding deletion, but had no source-backed scene-outcome
   fallback. Existing extracted plot cues now select relevant replies in the shared
   continuity index. `questSceneContext` parses each selected source once, without
   a new full-chat pass. A unique, specifically named outcome closes its own quest;
   ambiguous equal names do not select a target. An explicit training/session
   ending can retire a final-exchange/last-chance goal with the same giver and
   compatible location. A confirmed failed footing objective becomes failed;
   an ended trial without a confirmed result becomes **closed**, not completed.
   Main quests require their own explicit outcome; a finished scene cannot close
   their current stage as if it completed the whole quest. Future/umbrella goals
   remain active. No percentages, rewards or financial
   transactions are invented. Same-reply stale HUD state cannot override a verified
   scene outcome; later explicit HUD reopening keeps existing precedence. Explicit
   report reopening/new stages remain supported. Questioned, conditional, negated,
   example, fenced/blockquote, continuation, hidden and invalid-source observations
   cannot supply this inferred closure. Outcome evidence remains in the projection.

3. **Provider claims bypassed evidence through parallel arrays.** Exact quote
   presence did not establish that the player owned an action. Known/reliable
   labels attached to failed attempts, practice-only evidence or an NPC demonstration
   could enter Known, including through the same report's legacy `spells`, `learned`
   or `mastered` fields. `abilityEvidenceRows` now marks these recognizable
   contradictory/observer/actor patterns unverified. `spellStoryFoldUncached`
   excludes matching positive legacy claims from that reply, while preserving
   independently earned and manual knowledge. Named player/NPC evidence, positive
   player mastery alongside a failed NPC example, and actual forgetting are tested.
   Diagnostics distinguish all unverified claims from the mastery-only count.
   This is a bounded evidence guard, not a universal natural-language truth engine.

4. **A useful narrator correction.** The existing `spellStudyReminder` explicitly
   said that one clean execution means the ability is learned. That overrode
   card-specific progression requirements. The reminder now distinguishes practice
   evidence from earned learning/mastery. The tracker learning description is
   aligned with that rule. Existing cached spell-reference grounding is preserved;
   no extra model/API call or response-rewriting pass is added. Live narrator
   obedience and arbitrary invented-rule detection are still unverified.

## Real export evidence

The newly supplied export contains 15 messages. Its file stays outside Git.
On the same input and card, the original projection has 11 supplemental martial
chips; the fixed projection has nine because the three equivalent absorption
labels now share one identity. The existing HUD Touki status is independent.
The three quest states change from active/active/active to failed/closed/active.
The future training commitment remains active. These counts describe the supplied
scene, not a whole-card accuracy score. Source/swipe validation remains in force,
and this read-only replay does not rewrite the export or stored reports.

## Verification and performance

The normal runner includes `test_ability_quest_evidence.cjs`. It tests identity,
separate maneuvers, evidence/progress retention and resets, retraction/reacquisition,
actor attribution, parallel-field bypasses, manual/established knowledge, scene
outcomes, different participants/locations, conditional/negated/example text,
named-target ambiguity, explicit reopening, source edits/swipes/hidden/continuation
boundaries and the narrator instruction correction. The earlier exact-name
classification assertion now also accepts a preserved alias: this is the intended
new deduplication contract, not removal of its Magic-routing check.

Results and exact runtime hashes are recorded in `ability-quest-evidence.json`.
Node 22, full existing-card regressions and Chromium/mock-host tests are used.
Five paired rounds alternate published/fixed order with full Six-Sided references,
source-bound 600- and 2,000-message histories and the existing pipeline benchmark.
The final focused suite has 19 cases, included in all 44 regression suites;
23 UI and five visibility browser tests include the alias tooltip and quest badges.
Timing is measured without concurrent regression/browser workloads. The private
export and credentials are not committed. Live Lumiverse/Android acceptance and
arbitrary narrator semantics remain outside this verification. Closure fallback is
limited to existing extracted plot cues and explicit source matches; unknown wording
or ambiguous objectives remain unresolved. Unsupported synonyms are kept separate.
No extra AI judge, blanket spell blacklist, whole-response rewrite or independent
game-rules simulator is introduced.

The investigation checkpoint made no release, version increment or merge.
The authorized 3.0.3 RC preparation now uses current GitHub validation and the
manual release workflow; release checksums identify the exact packaged commit.

### Measured comparison against published 3.0.2

| Median of five paired rounds | Published | Fixed |
|---|---:|---:|
| Six-Sided, 600 messages, warm panel | 69.30 ms | 66.32 ms |
| Six-Sided, 2,000 messages, warm panel | 197.78 ms | 172.84 ms |
| Pipeline response processing | 1.0312 ms | 1.0767 ms |

These are local observations with substantial cloud/JIT variation, not evidence
that this patch solves the previously reported long-campaign performance issue.
The normal fixture changes by about 3 ms; real WebView responsiveness remains
unverified. The 2,000-message result must not be advertised as a guaranteed speedup.
Raw round samples and source hashes are included in the evidence JSON. These
fixtures do not exercise thousands of unique goals ending at once.

The measured transport counts are identical: one model call, six history fetches,
one metadata write, two storage reads and four writes. Panel proxy history-element
reads remain 6,101, with the same traversals. The existing tracker prompt grows
158 characters empty / 190 populated, reflecting the corrected progression and
lifecycle wording; these are characters, not measured model tokens. No new model
call, polling interval, independent history scan or metadata migration is added.
