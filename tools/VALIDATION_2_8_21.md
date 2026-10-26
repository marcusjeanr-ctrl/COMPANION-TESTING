# RPG Companion 2.8.21 — tracking source integrity

Baseline: 2.8.20, main commit defe3e7e950416501c51fc34506e053344f7944f. Audit source: the supplied three-message opening export. The original export and character card are unchanged and are not included in the public repository.

## Audit findings and attribution

| Finding | Attribution | Correction and limit |
| --- | --- | --- |
| Sword recorded in hand | The narrator explicitly says the protagonist holds it and later refers to the sword in their hands. The tracker follows that physical statement. The start request did not authorize that player decision. | Preserve the explicit physical fact; do not invent consent or silently rewrite the story. Clarify extraction instructions. Player-agency violation belongs to narration. |
| Two wrapped gifts recorded as acquired | No accepted transfer is shown. Their own acquisition descriptors still identify wrapped gifts/nearby parcels. | Reject pending descriptors in normalization and both inventory readers. Explicitly accepted/received wrapped gifts and borrowed objects remain valid. |
| Offered gear could become worn/held | Gear synonyms matched action words inside an offer, including explicitly unaccepted rows. Reproduced independently. | Guard pending states and explicit rejection before synonym matching; preserve real holding, wearing, storage, sheathing, dropping and unequipping. |
| Birthday scene became a quest at 40% | The extractor supplied a made-up quest and percentage; the request required a numeric percentage without permitting unknown. | Request established quests and measured percentages or null. Fix null/blank/boolean/object values becoming zero; reject explicitly suggested, unaccepted or speculative records. An unflagged finite 40 remains indistinguishable from genuine measured progress locally. |
| Future instructions became promises | The extractor labelled NPC instructions as promises despite the existing acceptance rule. Separately, unsupported request/invitation kinds defaulted to meeting. | Clarify that promises require explicit player commitment and external schedules are events. Reject unaccepted request/invitation/instruction/proposal kinds. Do not erase valid scheduled events. An unflagged false promise is not safely detectable without more evidence. |
| Envy inferred from teasing | The extractor added envy/strain without explicit private narration establishing them. Existing Minds instructions already discourage invented motives. | Clarify that teasing, disagreement and competition alone prove no negative change. Close missing speculation guards in relationships and nested emotional changes. Supported behavior/dialogue interpretation remains available; unflagged inference still depends on the model. |
| Planning prefix and repeated HUD | Visible model output includes a labelled draft, explicit scene planning and a final HUD attached to the last planning paragraph. The old parser selected the first draft; the tracker received the whole polluted reply. | Recognize this explicit draft/plan/final sequence through the shared HUD parser and clean it before extraction and existing history transport. Normal prose, quoted examples, repeated bare headers and OOC corrections keep their behavior. |

The exported reply's planning discusses conflicting output instructions while acknowledging Companion's instruction to keep reasoning private. Companion's ordinary-gameplay instructions require one HUD and prohibit printed reasoning. The shipped Reporter preset contains optional think-aloud output, model-specific header-prefill settings and core-precedence instructions. The export identifies the Reporter preset and model/provider but does not establish the effective switch values or prove which upstream instruction caused the leak. The optional Companion reasoning-recovery function returns null for the supplied reply, so it did not create this particular leak or duplicate the HUD. No provider, card, preset or narrative-simulation changes were made.

## Implementation scope

- Targeted changes to existing scalar normalization, classification, HUD selection and reconciliation loops. No new requested report fields or evidence schema.
- Existing 2.8.20 appointment matching, owner-isolated secrets, relationship carry-forward, unknown relationship numbers, family recognition, character identity and physical-presence tracking remain intact.
- No additional AI/API calls, full-chat scans, verification calls, polling, automatic refresh triggers or storage writes. Existing bounded tracker-history messages use the cleaned source. Existing caches and incremental processing are retained.
- Frontend changes are the two version-title strings. The Reporter preset, translations, card and unrelated UI behavior remain unchanged.
- No destructive migration or automatic rewrite of historical extracted facts. Explicitly pending legacy acquisition descriptors are filtered when read; other pre-existing semantic mistakes require correction or a fresh extraction.

## Regression tests

`node tools/test_tracking_source_integrity.cjs /path/to/2.8.20/dist/backend.js`: seven failure groups reproduced, with one pre-existing HUD-safety group passing.

`COMPANION_BASELINE=/path/to/2.8.20/dist/backend.js node tools/test_tracking_source_integrity.cjs`: all eight generic groups pass. They cover offered versus acquired equipment; unopened gifts; explicit accepted gifts; borrowed possessions; storage/unequipping; quest progress and rejected tasks; requests versus commitments; appointment lifecycle; speculative emotional changes; family continuity; final-HUD selection; poisoned draft data blocks; tagged reasoning; quotes; malformed headers; and a single tracker call.

Set `COMPANION_EXPORT` to the private supplied export's path to enable a ninth group. It verifies the final HUD, unchanged five family and present-character records, relationship records, retained explicit held-sword state, removal of two pending acquisition descriptors, and unchanged real scene prose. It intentionally confirms that the unflagged finite quest percentage cannot be disproved by the normalizer alone.

`node tools/run_tests.cjs`: all 14 suites and both JavaScript syntax checks pass. Full output: VALIDATION_2_8_21.txt. The original 2.8.1 four-world panel parity, Visual/Classic formats, supported-world startup, inventory, injuries, spells, locations/timestamps, NPC knowledge, Save/Continue, swipes, persistence, caches and injection deduplication are included. The isolated compatibility harness imports the real new helper dependencies; no expected gameplay output was weakened.

## Performance

Five paired benchmark runs alternate version order. Panel tests use the existing 600-message/300-reading fixture. Pipeline tests measure five batches of 1,000 report parses and five batches of 50 response-processing calls after warmup. Values below are the median of the five per-process medians. Raw measurements: BENCHMARK_2_8_21.json. Commands: `node tools/benchmark_panel_reads.cjs BASELINE PATCHED` and `node tools/benchmark_tracking_pipeline.cjs BASELINE PATCHED`.

| Local operation | 2.8.20 | 2.8.21 |
| --- | ---: | ---: |
| Warm panel read | 53.56 ms | 53.28 ms |
| Cold panel read | 126.89 ms | 117.15 ms |
| Report normalization | 0.4184 ms | 0.4021 ms |
| Response processing | 0.6041 ms | 0.5885 ms |
| Tested static request size | 15,798 characters | 15,528 characters |

No meaningful slowdown was measured. Differences are small enough that they should not be sold as guaranteed speed gains. Requested output field names and counts are identical. Existing wording was replaced and shortened rather than extended with new instructions. Provider-specific token counts, live refresh latency and future model output length were not measured; a smaller character count is not an exact tokenizer measurement. No runtime tokenizer, verification request or additional generation is introduced.

## Remaining limits

Unflagged semantic errors cannot be reliably proved false from a short report alone. This release does not silently delete the export's unflagged 40% quest, promises or envy entries, nor infer missing player consent. A keyword-only full-story consent/measurement detector was excluded because it would add verification work and reject valid narration. Blanket removal of percentages, promises, gifts or emotional interpretation was also excluded to preserve completeness. The revised existing extraction instructions mitigate those errors; they do not guarantee perfect extraction.

The plain-planning cleanup requires an explicit labelled HUD draft plus labelled scene planning and a later completed HUD. It does not attempt to classify arbitrary prose as reasoning. The existing optional recover-from-thinking feature remains available for users who intentionally recover structured output from the model's thinking; direct extraction and tracker history now exclude tagged reasoning, but that explicit legacy recovery path is not disabled by this release. Generic English pending descriptors are guarded conservatively; no multilingual semantic-consent engine was added.

No live Lumiverse/Android/provider session was used. Local host APIs and generation were mocked. Install the ZIP as the same `rpg_companion_hms` extension, reload Lumiverse and use Read in the existing chat. A repository update becomes available after the prepared patch reaches the configured update branch. No chat restart, card replacement, preset change or save migration is required.
