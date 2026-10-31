# Phase C — optional displays

Main at phase start: `e07830acbfe3e7a9d84185d7d19b067d247d39b1`.
Phase A/B pass the revised main-relative CPU/wall rule. No main merge or live
Lumiverse testing is performed. Full checks and the revised gate follow item 14.

## 12. Per-NPC standing history

The dossier can show a bounded 12-point step chart from existing standing events
and the latest reported standing, using the configured ladder. It does not parse
bond-kind changes as standings or infer dates for undated observations. One known
standing is one point, not invented historical samples. Graph construction occurs
only in an open dossier with the feature enabled. Source events are never edited.
Files: frontend, shared tests, Chromium case and four dictionaries. Tests cover
stable/rising/falling/flip-flop, unknown data and point cap; real SVG fits 320px.
The chart's x-axis is observation order, not a fabricated precise time scale.
No backend, prompt or persistent-data change.

## 14. Model report card — deferred

No generating-model attribution is present in the existing panel message payload
or available saved-message fixtures. The SDK connection model identifies the
current connection, not necessarily the generator of an earlier narrator reply;
Separate tracker and narrator connections can differ. A score by connection would
therefore misattribute results. Per the task’s explicit condition, no model report
card is implemented and no provenance is invented. Live saved-message provenance
is required before adding this view. No runtime or metadata change for this item.

Verification before the C gate: check_release; all 61 JS suites, bundle syntax,
and 12 Python gate tests pass; pipeline prompts remain 15,291 / 19,213 characters.
Chromium: 52 UI cases and 5 visibility cases pass. The first full UI run exposed
an asynchronous native-details-toggle assertion in the existing B bond-fold test;
the harness now waits for the expanded element instead of reading the DOM before
its toggle handler runs. The failed log is retained in PHASE_C_BROWSER_FIRST.log.gz.
No runtime change was needed for that test synchronization.

## Phase C revised gate

20 alternating three-source observations per case; frozen main `e07830a`, historical
`540df20`. Full raw CPU/wall observations, IQRs and source spreads are retained in
[summary](REVISED_PHASE_C.json) and [raw archive](REVISED_PHASE_C_RAW.json.gz).

| Case | Metric | Main median → candidate ms | Change | Baseline IQR | Candidate IQR | Baseline / candidate spread ms |
| --- | --- | --- | --- | --- | --- | --- |
| 600 | cold wall | 268.88 → 256.62 | -4.56% | 46.85 | 48.64 | 124.27 / 88.23 |
| 600 | cold CPU | 302.37 → 289.95 | -4.10% | 44.44 | 41.09 | 154.02 / 99.62 |
| 600 | warm wall | 70.47 → 68.98 | -2.11% | 12.41 | 12.92 | 43.10 / 54.72 |
| 600 | warm CPU | 140.21 → 138.70 | -1.08% | 12.83 | 14.94 | 96.74 / 64.88 |
| 2000 | cold wall | 586.71 → 599.20 | +2.13% | 55.31 | 66.25 | 305.67 / 828.34 |
| 2000 | cold CPU | 722.10 → 731.11 | +1.25% | 58.95 | 63.93 | 319.81 / 884.71 |
| 2000 | warm wall | 161.45 → 170.89 | +5.85% | 16.30 | 50.61 | 152.69 / 282.28 |
| 2000 | warm CPU | 228.31 → 245.33 | +7.45% | 23.60 | 59.74 | 142.02 / 354.06 |

| 2000 warm comparison | Wall change | CPU change | Assessment |
| --- | --- | --- | --- |
| baseline_to_candidate | +5.85% | +7.45% | inconclusive |
| reference_to_baseline | -4.63% | -6.67% | pass (informational) |
| reference_to_candidate | +0.94% | +0.29% | pass (informational) |

**Phase C: INCONCLUSIVE** under the revised main-relative rule.
No measurements were discarded. CPU is process-wide and can exceed wall time.
Shared-host scheduling remains uncontrolled; these results are neither live UI
latency nor proof of a per-feature speed improvement.
