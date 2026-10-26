# 2.9.3 — stored text, scheduled events and spell identity

Targeted follow-up to 2.9.2 (`83c1a16e8ff5329ef06b0f1f68e2dcc5e39e3d08`). The attached report and 17-message export were reviewed locally. Private exports, report settings, credentials/connection identifiers and screenshots are not included in the repository.

## Confirmed causes and fixes

| Evidence | Cause | Targeted correction |
| --- | --- | --- |
| The Studying note ends mid-word at exactly 80 characters. An agenda title ends at 90 characters; a book label ends at 60. | Local normalization silently slices these stored fields. The frontend displays the complete string it receives. | Preserve study notes up to 500 characters, agenda titles up to 240, and automatic item labels up to 160. If a safety limit is still reached, prefer a word boundary and show an ellipsis. Keep list counts bounded. |
| Permission to borrow books appears in `survival.got` and then as Gear. | A nonphysical authorization supplied by the extractor passed the physical-item filter. | Exclude explicit permission/approval/consent/authorization-to-act strings from automatic inventory normalization and the existing legacy inventory reader. Physical permission slips, permits and actual borrowed books remain valid. Manual additions are not destructively rewritten. |
| A measurement scheduled for 08:30 is reported as `in_progress` at 07:57 while the scene is still preparing to leave. | The reader trusted a reported start despite an exact future start time. Existing activity detection correctly withheld an inferred start but did not guard the directly supplied state. | For meetings/events before their exact scheduled start, require an existing observed-activity cue to accept `in_progress`. Preserve an already established state otherwise. Allow supported early starts, normal starts, and work already underway before a deadline. “Before/by/until” times are not treated as scheduled starts. |
| Known `Waterball (voiceless casting)` and study `Waterball (voiceless)` become separate keys. | A casting-method annotation was treated as part of the spell identity. | Exact catalog names win first. Only recognized trailing casting-method annotations can fall back to the base name/unique catalog alias. Actual variants such as Storm remain distinct, and an explicitly named Silent catalog variant is preserved. |
| Already-known practice can create an automatic study entry. | Automatic study accepted every study report independently of known status. | Reuse known-state results to avoid starting automatic study for an already-known spell. Keep actual learning/mastery completion history and clearable manual study records; do not grant mastery from practice or school rank. |

The spell fix operates on existing player-owned spell reports, not on invented spell knowledge inferred from rank, a demonstration, or an attempt. The exported successful cast already has an explicit `spells` record; its identity was the local failure. No world, character or story name is hardcoded into the runtime changes.

## Export replay and attribution

The unchanged exported rows now read as one Known Water Ball with no automatic study entry; the future measurement remains open with its confirmed 08:30 time; borrowing permission is absent from Gear while physically transferred books remain. The replay asserts that every exported message/metadata object remains unchanged.

The source note is already truncated in that export. Read cannot restore words that were never saved. After updating, a normal manual Refresh of the affected reply can regenerate the report under the corrected limits. No automatic regeneration, history rewrite, extra model call or speculative reconstruction is added.

Some extractor descriptions of which books are held are stronger than the surrounding narration. This patch does not infer missing transfers from titles, reverse explicit narrator-described physical handovers, or equate permission with possession. Unflagged semantic extraction mistakes without a reliable local contradiction remain a model/reporting limitation.

## UI and compatibility

The frontend is byte-for-byte unchanged from 2.9.2. No CSS, layout, theme, controls, popup behavior or UI feature is changed. A local Chromium review of the exported note at 320, 380, 460 and 900 pixels showed that its entire stored 80-character value was already visible; its missing ending is a storage-normalization defect. This was not a native Lumiverse/WebView validation.

Spell aliases, ambiguous catalogs, manual grants/Forget/Stop, completion display, edits/swipes, family relationships, quest identity, inventory continuity and persistence protections retain regression coverage. Previously documented inherited Visual/Save compatibility limitations remain unchanged (`TRACKING_AUDIT_2_9_1.md`).

## Tests and speed

Seven new tracking groups reproduce the text limits, intangible inventory item, premature event start and casting-method identity. Five fail against untouched 2.9.2; two preserve legitimate variants/manual behavior. All seven pass after correction. The supplied 17-message export replay also passes. The scoped runner passes 14 suites and both bundle syntax checks.

```bash
node tools/run_tests.cjs
COMPANION_TRACKING_EXPORT=/absolute/path/to/reference.json node tools/run_tests.cjs
python3 tools/benchmark_tracking_2_9_3.py /absolute/path/to/2.9.2/dist/backend.js
```

Performance policy was declared before final evaluation: five rotating-order runs, 600 and 2,000 messages, each median within max(5% baseline, 1 ms). The first candidate missed the larger warm-panel threshold. It is retained as `BENCHMARK_FIRST_CANDIDATE_2_9_3.json`. Reusing already resolved spell state and known maps removed repeated reconciliation without dropping correctness guards. The final benchmark passes all metrics; see `PERFORMANCE_2_9_3.md` and `BENCHMARK_2_9_3.json`.

Measured model calls, chat/storage reads, metadata/storage writes and indexed history traversals are identical to 2.9.2. Existing tracker instructions, requested fields and output budgets are unchanged. Both ordinary prompt profiles are byte-identical; retaining longer labels can increase their later context representation where those labels are already included. Character counts are not exact provider token measurements. No polling or automatic refresh changes, extra history verification pass or new cache are introduced.

The patch is bounded local processing. Live provider latency, native popup behavior and a complete live user database migration were not available; mocked-host tests execute the actual shipped bundles. Existing truncated historical fields and ambiguous unflagged model reports are not silently repaired.
