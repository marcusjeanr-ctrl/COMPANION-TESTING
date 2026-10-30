# 3.0.8 RC — Targeted stability cleanup

Baseline: `dfc7304743c46a47c4f2b112fca37e15aa4cfd75` (merged 3.0.7,
unchanged tree from its verified candidate). Branch: `chore/stability-cleanup-3.0.8`.
Issue: https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/issues/24.
No gameplay interpretation, persistent schema, prompt or UI design changes.

## Confirmed issues and fixes

Backend references below are in `dist/backend.js`; frontend references are in
`dist/frontend.js`.

1. **Duplicate display loads and traversal.** `getStatesFor` and `getThoughtsFor`
   independently fetched cold message history. `refreshThoughtsCache` traversed
   that history and then called `statesFill` for another traversal, validating
   ordinary reports twice. Both views now share `loadMessagePanels`; `statesFill`
   fills both maps in one pass and reuses the ordinary validated report. Separate
   caches remain because continuation snapshots are eligible for Internal States
   but not normal character Thoughts or transaction processing.
2. **Stale asynchronous display results.** Invalidating a cache did not invalidate
   its pending load. A late result/error could overwrite a newer snapshot, and an
   old finalizer could remove the replacement pending load. Pending entry identity
   now gates success, error and cleanup; `statesDrop` and current snapshot fills
   supersede pending work. Failed loads cache emptiness only for requested views.
   There are no new retries, history reads, timers, metadata writes or model calls.
3. **Frontend teardown retention.** `setup`'s disposer left `popLookObs` connected
   to the host document and left `state.ngTimer`/`state.ngF` scheduled. It now
   disconnects that observer and cancels both catalogue debounces. Active panel
   behavior and polling intervals are unchanged.

Removed/consolidated: two independent pending-load maps and their duplicate
fetch/error/finalizer blocks became one guarded loader; the extra history loop
was removed. Source/swipe validation and display builders remain separate.

## Verification

Before the patch, the new real-bundle test observed **two** concurrent cold host
reads rather than one. New Chromium tests reproduced **one** retained popout
observer and **two** uncancelled catalogue timers after disposal. All now pass.
Deferred-load tests also cover newer snapshots, late failures, invalidation and
replacement loads, including an old finalizer finishing before the new load.

- All **49 regression suites** and both bundle syntax checks pass under Node 22.
- All **28 UI + 5 visibility** Chromium checks pass with the mock Lumiverse bridge.
- New display tests check 100 repeated warm requests, a 2,000-response history,
  retained oldest/newest reports, normal/legacy/exported source policies, hidden
  and edited replies, active swipes and continuation-only snapshots.
- Existing Together/Separate, prompt-handshake/repeated interception, duplicate
  generation delivery, save/load ordering/recovery, continuation, manual data and
  supported-card suites pass. Long-history tests cover up to 2,000 messages.
- Existing private 13- and 15-message campaign replays match baseline Agenda,
  Quest and family counts, with no input mutation. These are limited replays,
  not comprehensive gameplay certification; private fixtures are not committed.
- Normal Separate update host/model/storage counts are unchanged: six message
  reads, one lore activation read, two storage reads, one mocked model call,
  one metadata update and four storage writes. No paid calls were made.
- Release identity is consistently 3.0.8 RC. The original Companion repository
  is untouched. No merge or publication is part of this patch.

## Performance

Node 22; local mocks only, no paid API tests. Two paired rounds reversed the
baseline/candidate order with full Living World and Six-Sided card fixtures and
2,000 synthetic signed messages. Panel timings use a cold read, three warmups
and ten samples; pipeline timings use five warmed rounds. Cloud/JIT/GC variation
is substantial, so ranges below are observations, not guaranteed host budgets.

| Workload | 3.0.7 | 3.0.8 |
|---|---:|---:|
| Concurrent cold display host reads | 2 | 1 |
| Validations / ordinary 1,000-report display snapshot | 2,000 | 1,000 |
| Display snapshot median, paired runs | 2.87 / 2.95 ms | 1.53 / 1.65 ms |
| Six-Sided full panel warm median, paired runs | 184.24 / 318.72 ms | 178.21 / 168.90 ms |
| Living World full panel warm median, paired runs | 188.14 / 165.44 ms | 196.10 / 269.48 ms |
| Six-Sided cold projection, range | 813–848 ms | 726–841 ms |
| Living World cold projection, range | 1,604–1,610 ms | 1,412–1,426 ms |
| Response processing median, range | 0.81–0.94 ms | 0.84–1.00 ms |
| Prompt characters, empty / populated | 15,107 / 19,029 | 15,107 / 19,029 |

The display microbenchmark uses 1,000 assistant + 1,000 user messages, four
warmups and twenty timed snapshot fills per run. Browser render/layout uses
five warmups and twenty samples, with three paired runs in alternating order:
baseline medians **31.25 / 29.50 / 30.95 ms**, candidate **45.05 / 26.05 /
26.25 ms**. The initial slower candidate result did not recur in reversed and
repeated comparisons. Display validation work is demonstrably halved; no broad
rendering/projection speedup is claimed. Full-panel Living timings are mixed,
not evidence of a confirmed regression in the unchanged projection engine.
Actual long-campaign host responsiveness remains an acceptance requirement.

No prompt/token growth or added calls/writes was observed. Heap deltas are not
presented as proof of leak freedom: the observer/timer retention defects are
verified by actual lifecycle checks, not a noisy process-wide memory sample.
Backend size is 1,234,503 → 1,234,881 bytes (+378); frontend is
1,428,487 → 1,428,591 bytes (+104). The 482-byte total increase funds the
invalidation guards and teardown cleanup; no dependency or generated bundle was added.

Reproduce panel comparisons with `tools/benchmark_panel_reads.cjs BASELINE CANDIDATE`
using `COMPANION_BIND_READINGS=1`, `COMPANION_BENCH_REPLIES=1000` and
`COMPANION_CARD` pointing to the decompressed checked-in card fixture. Run
`tools/benchmark_tracking_pipeline.cjs BASELINE CANDIDATE` in both orders, and
`tools/test_ui_browser.py --frontend FILE --measure /tmp/render.json` for layout.
The display work-count invariant is in `tools/test_display_cache_lifecycle.cjs`.

## Audit decisions and remaining limits

No duplicate named global declarations, exact duplicate substantial backend
function bodies, or proven unreferenced global functions were found in the static
survey. This is not proof that all code is reachable under every host. Similar
HUD comparators, NPC routines vs player appointments, source validation vs display
projection, and Together/Separate delivery paths have different responsibilities;
they were not merged. Existing safeguards deduplicate host/frontend generation
notifications and repeated prompt interception; removing either route is unsafe.

Prompt construction and lore grounding are unchanged. No proven redundant prompt
segment justified changing narrator or tracker instructions. No new dependencies,
model calls, polling, or settings were introduced.

Legacy save readers, diagnostic/release tools and historical regression fixtures
remain. Broad cache eviction or per-message retention caps risk losing historical
panels or altering recovery/catch-up safeguards; those speculative changes were
not made. The patch fixes specific reproduced lifecycle defects, not every
possible long-session leak. Actual Lumiverse reload/update persistence, Android
WebView and lengthy live campaigns still need host acceptance. Chromium tests use
a mocked bridge; local performance excludes network and provider latency.

Rollback before publication: close/reload the extension and reinstall the verified
3.0.7 package from baseline commit `dfc7304743c46a47c4f2b112fca37e15aa4cfd75`.
There is no data migration to reverse; preserve campaign data and settings.
