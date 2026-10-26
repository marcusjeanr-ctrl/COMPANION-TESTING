# RPG Companion 2.8.20 validation

Base: marcusjeanr-ctrl/Companion main at 9ab46531427f4a451460caec862fe0c7e531a185 (2.8.19).

## Confirmed failures and corrections

1. Two same-titled appointments with different participants or places were collapsed before reconciliation. Normalization now compares title, participant, location and schedule; reconciliation checks those discriminators and requires a unique match. Tests retain four same-titled appointments, deduplicate exact repeats, update only the intended appointment, preserve explicit rescheduling, ignore ambiguous title-only changes and isolate manual removal. Discarded swipes restore the prior states.
2. A later mood-only relationship report replaced established standing and bond with null. The existing history loops now merge missing relationship fields with their last established values, in both the panel and the previous-standing context. Tests preserve bond, standing, age flag and numbers; explicit later changes, false, zero, pins and swipe rollback remain effective. The original 2.8.1 Mushoku parity sample previously expected an omitted Wary standing to disappear; its assertion now explicitly expects Wary. No other fixture output was relaxed.
3. Number(null), Number('') and Number(false) became zero. Relationship normalization now accepts only finite numbers and nonempty numeric strings. Tests reject missing/null/blank/boolean/object/array/non-finite values, retain valid zero and numeric strings, preserve bounds and prevent false trust-drop alerts. An unknown current report carries a previously established number without changing the stored unknown reading.
4. Fuzzy secret matching ignored ownership. Both normalization and reconciliation now require the same normalized owner, with player aliases resolving to the player. Different owners keep separate records and known-by sets even with identical text. Duplicate-description records receive owner-qualified edit keys; ordinary keys stay compatible. Tests cover case normalization, player aliases, manual additions/removal, owner-isolated knowledge changes, and unambiguous legacy keys. An owner-qualified edit cannot fall back to a different owner's similarly worded record.

## Reproduction and regression verification

`node tools/test_reconciliation_integrity.cjs /path/to/2.8.19/dist/backend.js`: 0/4 groups pass, with an independent original-failure assertion for each defect.

`node tools/test_reconciliation_integrity.cjs`: 4/4 groups pass, including data-preservation and legitimate-update controls.

`node tools/run_tests.cjs`: all 13 regression suites and both bundle syntax checks pass. Full output: VALIDATION_2_8_20.txt. This includes the existing HUD formats, original-world panel parity, spell lifecycle, Save/Continue, identity ambiguity, private knowledge, regeneration, stale results, persistence and deduplicated prompt injection checks. The existing transport test verifies one model call and local rereads.

## Performance

Ran the existing `tools/benchmark_panel_reads.cjs` with the original and patched backend in five paired processes, alternating version order. Each version receives the same 600-message synthetic history with 300 full-panel readings, one cold read, three warmups and ten measured reads per process. Raw results: BENCHMARK_2_8_20.json.

| Metric | 2.8.19 | 2.8.20 |
| --- | ---: | ---: |
| Median of five warm medians | 52.62 ms | 51.81 ms |
| Median cold panel read | 125.96 ms | 111.07 ms |
| Logged warnings across runs | 0 | 0 |

No measured slowdown in this workload. Timing noise prevents treating the small difference as a guaranteed speed improvement. No new model/API calls, history scans, verification passes, polling, refresh triggers, prompt instructions or requested report fields were introduced. Changes reuse the existing per-report and history reconciliation loops. The optional internal moved flag retains an already-supported appointment state; it adds no requested AI output. Matching examines existing bounded report/item collections, without rescanning chat. Frontend changes only update the two release-title strings; HUD parsing and rendering remain unchanged.

## Install and limits

Install the complete 2.8.20 ZIP as the same `rpg_companion_hms` extension, or update from the repository after this change reaches its configured update branch. Reload Lumiverse and use Read to rebuild panels in the existing chat. No card replacement, chat restart, preset change or save migration is required.

Previously discarded appointment or secret rows cannot be recreated from metadata that no longer contains them; rereading panels cannot recover those missing facts. Fresh extraction from the relevant response is needed if that historical data must be restored. Previously stored coerced zero values cannot safely be distinguished from legitimate zero values, so the patch preserves them. Ambiguous partial appointment updates and ambiguous legacy secret edits do not guess a target. Explicit rescheduling applies when the matching appointment is unambiguous.

Validation used the real extension bundle with mocked host APIs and generation. Live Lumiverse/Android behavior, provider latency and semantic extraction accuracy were not measured. The benchmark covers local panel processing, not network refresh time. Original Accuracy & Performance Optimization requirements remain applicable; this release prioritizes these four demonstrated defects.
