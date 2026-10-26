# RPG Companion HMS 2.8.2 — clean compatibility rebuild

Version 2.8.2 is used as explicitly requested. The separate branch is `rebuild/2.8.2-clean-compatibility`. The rebuild was prepared and validated without changing the live repository. Publication was subsequently explicitly authorized; the runtime bundles are unchanged from the tested ZIP.

## Foundation and reproducibility

The implementation foundation is the supplied original `rpg_companion_hms_2_8_1_beta(1).zip`, SHA-256:

`ba61d8f188871d0bd5bda67760fbdf028d3750c88f3193b48a5318934a023a38`

The untouched archive is retained at `tools/rebuild/baseline_2.8.1.zip`. The first branch commit contains its extracted files unchanged. Compatibility behavior and tests were compared with commit `f2e3840a346df977455b9aa0677c0262af155578` of `marcusjeanr-ctrl/Companion`, version 2.8.21. The default branch was checked and still pointed to that commit during this rebuild. The reference was not silently advanced.

Both versions ship bundles, not an original source/build tree. The rebuild starts from the archived 2.8.1 bytes and applies reviewed, responsibility-grouped source replacements. It does not copy the reference bundles as its starting point. Tested reference implementations are retained where appropriate; this is not a claim that every later helper needed an independent rewrite. Each overlay identifies its original source range, before/after content, reference range, function, action and covering tests. Original-byte checks fail on mismatches or overlapping replacements. Independent consolidation and prompt compaction follow those overlays. The reference bundle is not a build dependency.

```bash
python3 tools/rebuild.py
python3 tools/rebuild.py --check
node tools/run_tests.cjs
```

The generated `dist/backend.js` and `dist/frontend.js` are the actual tested runtime entrypoints. Python and Node are development/verification requirements only; Lumiverse runs the delivered bundles directly. File sizes and SHA-256 values are in `tools/rebuild/provenance.json`.

The original preset, five guides, license and credits are preserved. The preset is byte-identical in the original archive, pinned reference and rebuild: 39,590 bytes, SHA-256 `f2ea113b3137cd254d3addff69ee75694bb09b11588e65ef12fa7f6c5a9eb9d9`. All existing translations are retained; the two demonstrated lifecycle labels are added to each dictionary. The original frontend's stale 2.1-beta title is corrected to 2.8.2. No UI redesign or replacement application was introduced.

## Lifecycle and change map

The original initialization, context read, validation, activation, simulation, context construction, deduplicated injection and completion flow remains in place. No second compatibility engine or parallel tracker was added.

| Area and actual paths | Action | Reproduction / verification |
| --- | --- | --- |
| Context/source: `getSwipeData`, `setSwipeData`, `trackingBefore`, `collectCommitted`, interceptors | Retain source binding, atomic metadata writes, regeneration exclusion and injection deduplication; keep necessary callsite dependencies coherent. | Equal-length edits, changed/deleted targets, hidden replies, failed writes and repeated interception in `test_universal_integrity.cjs`. |
| HUD: `findHudRaw`, `parseHud`, `rewriteHud`, `messageHud`, `hmsReadSystems` | Reintroduce Classic/Visual support, protected examples, explicit draft-plan-final selection, qualifiers and original Visual Markdown; consolidate cache hits. | Visual/Classic, rank, scalar Touki, malformed/duplicated headers, pins and narration in the original reference suites. New identity/text-cache tests in `test_rebuild_integrity.cjs`. |
| World references: lore pagination/catalog retention, Atlas, world detection, calendar and Saga readers | Retain complete paginated catalogs, reference/source isolation, dated world interpretation and observed geography. Share the bracket-aware splitter rather than maintain another comma parser. Cache repeated world identification within the existing read pass. | 1,432-entry pagination fixture, updated 1,296-entry book, 22 Saga arcs, temporal Atlas and location/calendar fixtures. |
| Reports: inline `parseCompanion`, `classicExtras`, `hmsCompanionCall` and Separate updates | Retain one existing extraction call, validated records, cleaned tracker input and late-result guards; compact existing instructions without requesting new fields beyond the reference. | Together/Separate integration, single-call assertions, source contamination, source export and request-schema tests. |
| Tracking: relationships, gear, pockets, Agenda, quests, objectives, secrets and Minds | Retain demonstrated 2.8.20/21 integrity rules. Reimplement repeated numeric validation through one `reportNumber`; consolidate pending gear-state detection. | Same-title appointments, partial updates, explicit false/zero, unknowns, ownership, offers/gifts/borrowed items, speculative emotions, secret-owner edits and knowledge boundaries. |
| Magic: catalog resolver, known-list ownership, `spellStoryFold`, study/known/mastered/forget controls | Retain canonical identities, unique aliases, qualified chants, eligibility distinctions and edit/swipe reconstruction. Align the existing known-list cache with the 3,000-record message cache to avoid thrashing on larger histories. | Spell aliases, full lifecycle, manual controls, quoted/foreign lists, rank-only non-grants, Forget/relearn and source-change fixtures. |
| Save/load and utilities: state queues, recovery copy, chapter/injury source validity, Save/Continue | Retain tested correctness protections and unknown/newer fields. No destructive migration. Keep optional recovery-from-thinking behavior. | Failure/recovery/concurrency suites; old/new schema fixture round-trips; private-export test; Save without transaction replay and Continue with restored current HUD. |
| Panel rendering and controls | Retain baseline layout and tested reference field contracts, active appointments, complete Saga data, abandoned objectives and stale-summary display. | Original four-world panel parity, DOM startup/render and full-panel integration suites. |

The detailed machine-readable overlays are `tools/rebuild/01-runtime-integrity.json` through `06-panel-contract.json`. `excluded_regions.json` records reference-only branding, whitespace/comment changes and diagnostic-only cache rewiring that were not imported. The embedded translation replacement is regenerated from baseline dictionaries plus the two required labels instead of copying the reference's serialized table wholesale.

## Evidence-based cleanup

Inspection found no duplicate named function declarations in either 2.8.1 or 2.8.21. File size and version count were not used as evidence of duplication. Working combat, guides, settings and unrelated subsystems were not rewritten to manufacture a cleanup.

Actual repeated work was found and corrected:

- Relationship, quest, sanity and study normalization repeated the same numeric/unknown guard. They now call one shared primitive, preserving explicit zero and existing bounds.
- Gear status and report normalization repeated pending-state expressions. One helper now distinguishes pending transfers from unequipping.
- Location parsing duplicated bracket-aware splitting already available in the baseline.
- An identity hit still rebuilt a HUD text cache key, and a text hit was not bound back to the HUD identity. The existing dual cache now uses its fast paths correctly.
- Cold reads reparsed identical HUD text across messages. The existing read-pass memo now shares exact-text parses for that pass, bounded at 600 values. It does not share records or character state.
- HUD clocks, world identification, quest fields and normalized labels were repeatedly derived from the same read-pass inputs. The results now reuse the existing pass memo. Distinct configuration objects and changed source text remain separate.
- The 600-entry known-list cache thrashed when scanning 1,000 assistant replies. Its bound is now 3,000, matching the existing message parse cache. No unbounded cache was added.
- Already canonical names were unnecessarily rematched within one simulation fold. The existing canonical-name map now supplies the answer. Ambiguous aliases still use the normal identity rules.
- Repeated reporting instructions were shortened without deleting the ownership, commitment, uncertainty, agency, family or knowledge-boundary rules. Static and populated requests are smaller than both comparators in the tested profiles.

The first candidate failed the predefined performance policy. Its raw measurements are retained as `tools/rebuild/benchmark_before_cleanup.json`; correctness protections were not removed to obtain the final result. Profiling identified the repeated operations above. There is no claim that every added line after 2.8.1 was redundant.

## Regression and upgrade evidence

`node tools/run_tests.cjs` passes all 15 suites and both bundle syntax checks. Fourteen suites/fixtures are behavioral references from the pinned repository. The additional rebuild suite checks the archive hash, reproducible bundles, unchanged extension identity, shared guards, bounded caches, changed-text/configuration separation, canonical matching, request size and old/new state preservation. An implementation-coupled isolated VM harness loads the real new helper dependencies; expected gameplay output was not weakened.

`tools/rebuild/save_fixtures/2.8.1.json` and `2.8.21.json` are seeded copies generated using each exact source's `emptyChatState` schema, with manual records and representative newer fields. Load/save round-trips preserve every supplied property, including owner-qualified secret edits, stopped study, forgotten spells, source-bound chapter fields and an unknown future property. These are controlled schema fixtures, not a claim that a live user's complete disk database was tested.

The private-export ninth source-integrity group ran against the supplied opening export. It is recorded in `tools/EXPORT_VALIDATION_2_8_2.txt`. The private export is not copied into the public code or test fixtures. Reproduce it with:

```bash
COMPANION_EXPORT=/path/to/opening-export.json node tools/test_tracking_source_integrity.cjs
```

## Performance and I/O

The acceptance threshold was defined before evaluating the final results: reject a sustained median increase above `max(5% of comparator median, 1 ms)` for each timed operation against either comparator. Five rounds rotate version order. Panels use 600 and 2,000 total messages, including cold and warm reads. Pipeline tests separately measure normalization, response processing and prompt construction. The final comparison passes this unchanged policy. Raw runs, medians, policy and counts are in `tools/BENCHMARK_2_8_2.json`.

Reproduce against a local copy of the pinned reference:

```bash
python3 tools/benchmark_rebuild.py --reference /path/to/pinned-2.8.21/dist/backend.js
node tools/measure_rebuild_operations.cjs /path/to/original/backend.js /path/to/pinned/backend.js dist/backend.js
```

The benchmark script extracts the exact 2.8.1 backend from the retained archive, so a second baseline download is unnecessary. Small timing differences are not guarantees of live latency or speed gains. The results table is in `tools/PERFORMANCE_2_8_2.md`.

One instrumented fresh-chat Separate update makes one model call in all three versions. Compared with 2.8.1, the retained 2.8.21 safeguards have measurable I/O costs: chat reads 5 → 6, storage reads 1 → 2, storage writes 1 → 4; metadata writes stay at one. The extra chat read validates the write target; the fresh-state probe can read the recovery file, and primary/recovery snapshots plus room persistence explain the storage writes. These costs were retained and disclosed, not falsely described as unchanged. The rebuild adds none of those calls beyond 2.8.21. Existing populated saves need not incur the fresh-state fallback probe.

On the same 600-message panel workload, counted history-element reads drop from 29,471 in 2.8.1 to 9,101 in the reference and rebuild. Selected traversal counters are recorded separately. Cache work adds no full-chat verification pass, model call, polling or refresh trigger. Reading reuses established processing results.

Requested fields and output-token settings remain compatible with the reference; the original preset and its token controls are unchanged. Prompt character counts are reported separately from tokens. No provider-specific tokenizer or live provider session was available, so exact token consumption and generated output length are not certified. No tokenizer, corrective generation or verification call was added to runtime.

## Install, existing chats and rollback

1. Export/back up the current chat and Companion state before replacing an installed extension. Keep the current 2.8.21 package available for rollback.
2. Install the complete `rpg_companion_hms` folder from the ZIP using the same identifier, `rpg_companion_hms`. Preserve the existing data directory and permissions. Do not run a second copy alongside it.
3. Reload Lumiverse and open the existing chat. Use local Read to rebuild the panels. No new character card, preset or chat restart is required.
4. Existing incorrect model extractions are not silently rewritten. Refresh the relevant response or correct the record manually when needed; Read cannot recover rows discarded by an older extractor.
5. To roll back, restore the saved 2.8.21 extension package under the same identifier and reload. Keep the pre-upgrade state backup. Rolling back to an untouched 2.8.1 writer is not recommended for newer saves because its older loader does not preserve every newer field.

Numerically, 2.8.2 sorts below 2.8.21. Its version was selected explicitly by the user; this is not an ordinary increasing-version update from 2.8.21. Publication to the live repository was authorized after validation. An Update button that requires a numerically higher version may not offer 2.8.2 over 2.8.21. Use the complete ZIP for manual installation if needed; host-specific downgrade restrictions were not tested live. Do not delete stored data to work around such a restriction.

The ZIP also includes `tools/rebuild/rebuild-2.8.2.bundle`, containing the separate local branch and reviewable commits. From a development checkout, restore it with:

```bash
git clone tools/rebuild/rebuild-2.8.2.bundle ../companion-review --branch rebuild/2.8.2-clean-compatibility
```

## Remaining limitations

No live Lumiverse/Android session or provider round-trip was available. Tests use the real bundles with mocked host APIs and generation. Native downgrade/install handling, actual rendering in the host and network refresh latency remain untested.

Incorrect narration, incorrect extraction and local reconciliation failures remain distinct. A narrator-stated physical action can be accurately tracked while violating player agency; the extension does not invent consent or rewrite narration. An unflagged invented percentage, promise or emotional inference cannot be disproved from a short report alone. Existing rules are clearer, but perfect semantic verification is not claimed. Explicitly speculative or pending reports are guarded; useful supported interpretation remains available.

Labelled draft/scene-plan/final-HUD cleanup is conservative. Arbitrary prose is not guessed to be planning. The optional `recoverFromThinking` setting retains its intended legacy behavior; neither the unchanged preset nor this setting proves the cause of a particular generation leak. No character-specific names, opening events or new game mechanics were hardcoded into shared tracking.
