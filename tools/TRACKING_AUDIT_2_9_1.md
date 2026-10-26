# 2.9.1 tracking integrity patch

This is a targeted patch to the supplied 2.9.0 implementation, preserving its sword-technique catalog, controls, guides, preset, translations and existing extension identifier. It is not the earlier 2.8.2 rebuild. The manifest's update repository is `marcusjeanr-ctrl/Companion`; 2.9.1 is an increasing version over the currently published 2.9.0.

## Sources and reproduced defects

The supplied archive SHA-256 is `b1855cd4f1bd5345f7b0505194939d0253fbcfb632cb87a4ef98706653a3099a`. At audit start, GitHub main was `48791018e24ac6c79a0a434b0ea71dab05927658`. Its extension files matched the archive except for the repository URLs/manifest serialization. The supplied private 15-message export was read locally and is not included in the package or repository.

Before editing reconciliation, the four existing reconciliation groups failed on the original bundle. Seven new tracking groups also failed on the original bundle. Baseline failure logs are included; subsequent tests add continuity, spelling variants and cache boundaries.

| Confirmed defect | Correction | Regression evidence |
| --- | --- | --- |
| Quest details came only from the most recent reply containing quests, discarding other established rows and omitted fields. | Fold the same existing bounded reading window, merge partial fields and reuse the read-pass memo. Keep a deadline anchored to the reply that supplied it. | Multiple quests, later one-row update, omitted giver/progress and discarded swipe. |
| Quest panel joins accepted a bare name prefix, while renamed stories had no objective-aware reconciliation. | Exact identity first. Renaming requires the same explicit objective, giver and location, with no conflicting context; ambiguous candidates remain distinct. Remove prefix-only joins. | Renamed storyline retains progress; different objectives, givers and prefix-sharing titles remain separate. |
| `Number(null)`, booleans and empty values created false numerical changes. | Share finite number/string validation across relationship, quest, sanity and study readings; preserve actual zero and valid numeric strings. | Unknowns stay null; explicit zero and supported updates survive. |
| Agenda normalization discarded same-title events; title matching missed rephrased descriptions. | Match meaningful normalized words together with participants, location and schedule. Preserve distinct dates, participants and activities; apply ambiguous partial changes to no record. | Measurement/measure phrasing, meal/bell variants, same-title distinct events, manual owner edits, rescheduling and lifecycle tests. |
| Daypart fallback supplied exact minutes, and an extractor's `due` clock could overwrite approximate `when` wording. | Keep approximate labels textual with no exact countdown. Use the available reply text to corroborate a precise `due` when `when` is approximate. Retain explicit clocks and exact relative minute/hour durations. A reschedule can clear obsolete precision. | Afternoon, sundown, meal, bell, approximate numerical clocks, tomorrow at 4 PM, exact durations and later confirmed half-past-eight. |
| Mood-only reports replaced established standing/bond/minor/number fields with null or false. | Reconcile omitted/unknown fields against established readings; preserve explicit false, zero and genuine changes. | Mood-only update, changed bond, numeric changes, pin and swipe rollback. |
| Similar secret descriptions merged across different owners. Speculative secret/relationship reports could become facts. | Owner-qualified matching and unambiguous legacy edits; reject explicit uncertainty and unsupported guessed/gossip discoveries. Preserve supported emotional interpretation and actual discoveries. | Distinct owners, same text, manual owner edits, mood/relationship uncertainty, confession and existing knowledge tests. |
| 2.9.0 had also lost pending-equipment guards. | Restore the already demonstrated small offer/unaccepted-gift guards in normalization and legacy inventory reads. Preserve accepted wrapped gifts, borrowed gear, storage and unequipping. | Six tracking/source groups include offered vs acquired, wrapped gifts and legitimate physical states. |

No names, worlds, scenes, HUD layouts or game mechanics from the private export are hardcoded into the runtime changes. The shared helper source is in `tracking_2_9_0_helpers.js`; the delivered `dist/backend.js` is the actual tested runtime. Other restored reconciliation primitives retain their established implementation.

## What the reference export establishes

The export confirms an extraction error: 08:30 appears in tracker metadata before narration establishes it. Later dialogue explicitly says half past eight, which legitimately supports 08:30. The afternoon bell remains approximate in narration while metadata supplies inconsistent clock values. The patched replay retains two separate events, one confirmed 08:30 appointment and one approximate bell entry. Family bonds remain tracked.

That export contains no quest-detail rows. Quest naming/progress regressions are reproduced with controlled synthetic inputs, not claimed as findings from those absent rows. The visible narrative is not rewritten, nor are narrator decisions treated as player consent. Reasoning stored separately in the export is not used as timing evidence.

## Validation

`node tools/run_tests.cjs` passes 12 scoped regression suites and both bundle syntax checks. This includes 10 new tracking groups, all four original reconciliation groups, all 23 universal integrity groups, family/gear/spell continuity, the new sword-technique known state, panel startup, Separate updates, room/position persistence, stale responses, edits/swipes, lorebook isolation and spell lifecycle.

The older panel parity fixture is adapted only for the intentional changes: 2.9 adds a null technique panel to demos without a technique catalog, and this patch removes invented daypart countdowns. All remaining panel expectations are retained. The source-integrity suite runs its six tracking groups in the scoped runner; its full eight-group invocation remains available and still exposes the inherited HUD/source failures below. These exclusions are printed by the runner and are not counted as passes.

The exact supplied export also passes this optional local command:

```bash
COMPANION_PRIVATE_EXPORT=/absolute/path/to/reference.json node tools/run_tests.cjs
```

`VALIDATION_2_9_1.txt` contains the results. `LEGACY_COMPATIBILITY_2_9_1.json` separately records the old compatibility-suite results against both the untouched supplied 2.9.0 and this patch.

## Performance

The acceptance policy was set before final evaluation: each median timing may increase by at most the greater of 5% of the baseline or 1 ms. Five rotating-order runs compare cold/warm panels on 600 and 2,000 messages, report normalization, response processing and prompt construction. See `PERFORMANCE_2_9_1.md` and the raw benchmark JSON.

The first candidate failed the panel timing threshold. Profiling found repeated HUD clock, label, quest, identity and source parsing. Existing bounded read-pass caches now reuse those results; exact source edits, configuration identity and canonical-name boundaries have regression coverage. The known-spell list cache uses the existing 3,000-message cache bound to avoid larger-history thrashing. These are local cache changes, not extra extraction or verification calls.

The measured Separate update remains one model call, six chat reads, one metadata write, two storage reads and four storage writes in both versions. A 600-message panel read performs 9,101 indexed history reads in both, and each measured history traversal runs once. This patch adds no full-chat verification, refresh trigger, polling or automatic persistence. Quest continuity folds the existing capped reading results rather than scanning raw chat again. `OPERATIONS_2_9_1.jsonl` supplies the counts.

Reproduce timings with the original bundle extracted from the supplied archive:

```bash
python3 tools/benchmark_tracking_2_9_1.py /absolute/path/to/original/dist/backend.js
node tools/measure_tracking_operations_2_9_1.cjs /absolute/path/to/original/dist/backend.js dist/backend.js
```

Prompt character counts are smaller in both tested profiles. They are not exact provider-token counts. No schema fields, output-token budgets or generation calls were added. Live network refresh latency was not measured.

## Remaining limits and inherited gaps

- No local matcher can certify an unflagged invented percentage, motive or exact clock when the extracted report presents it as fact and the relevant source is absent. The reporting instructions require evidence and unknowns; the patch does not claim semantic verification. An exact clock elsewhere in the same reply is corroboration, not proof of its relationship to a particular event.
- Conservative matching intentionally leaves genuinely ambiguous quest/agenda aliases separate. No historical records are destructively migrated or erased. Existing model mistakes may need a relevant-response Refresh or manual correction.
- Existing history windows and source validity rules remain unchanged. This is not unbounded archival recovery from every old reply.
- The supplied 2.9.0 already fails the later Visual-HUD/rank and Save/Continue compatibility suites. Examples include certain Visual headers, explicit draft/final selection, protected HUD examples, updated-book references and Save/Continue transaction handling. These unchanged upstream gaps require a separate compatibility patch; the scoped 12-suite result is not an all-features compatibility certification. One older isolated-function harness also assumes the 2.8.2 helper layout and is not portable as-is to this bundle.
- Native Lumiverse installation/rendering, provider round trips and complete live user-database upgrades were not available. Tests use the actual bundles with mocked host APIs. Runtime storage schemas are unchanged; manual records are preserved by the tested reconciliation paths.

## Existing chats and rollback

Update the existing `rpg_companion_hms` extension, reload Lumiverse and use local Read. Keep the same chat, card and preset; do not delete state or run a second extension copy. Back up the current chat/state first. A local Read repairs derived matches and timing precision but cannot reconstruct records absent from the saved extraction. For rollback, reinstall the saved 2.9.0 package with the same identifier and retain the backup. The supplied Reporter preset, guides, license and translation dictionaries are unchanged.
