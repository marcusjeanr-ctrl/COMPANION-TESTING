# Revised phase gate — tools only

Current selected-candidate verification is in [REPORT.md](REPORT.md). The tables
below retain the historical gate calibration; they do not certify another build.

The user superseded the original 3.0.10-relative wall-only gate. Old failed matrices
remain in REPORT.md; none was discarded or relabeled as a pass. No runtime code was
changed to revise the measurement. Historical 3.0.10 is informational, not a gate.

## Measurements and rule

Every fresh Node child records cold and ten warm projection wall times, matching
`process.cpuUsage` user+system deltas, both warm medians, and whole-process CPU and
wall totals (including setup). The gate uses projection deltas, not setup totals.
CPU is process-wide, so GC/worker CPU may exceed wall time; it is not a browser or
provider latency measurement. The same instrumentation is used for every source.

At least 20 alternating observations per source and case are required. Balanced
ABC/CBA triples provide 20 ordered pairs for every comparison: main, Phase A and
3.0.10. Main/candidate relative order alternates. Candidate occupies the middle
triple position; fresh-process warmups reduce carryover but cannot control host
cotenant scheduling. No other local tests/benchmarks run concurrently.

Each source reports median, quartiles, IQR, min/max, run spread and MAD. Baseline
warm run medians are pooled separately for wall and CPU noise IQRs;
individual-read IQR is retained separately as information. Units are never pooled together.
For 2,000-message warm results, FAIL requires BOTH:

1. Wall and CPU median-of-run-medians each exceed the frozen phase-start main by
   more than 5%.
2. Each positive absolute difference exceeds its corresponding pooled baseline
   run-median IQR.

If either metric alone exceeds 5%, or either excess remains inside its noise band,
status is **inconclusive** and continuation is allowed. If neither exceeds 5%, it
passes. Equality at 5% or at the IQR is not an exceedance. Missing the 2,000-message
case cannot authorize continuation. Informational old-version comparisons never
control the exit status. Raw records are checkpointed after every balanced pair;
aborted runs retain records and their reason instead of silently retrying them.

Tests: tools/test_benchmark_gate.py covers both-metric failures, wall-only/CPU-only,
noise boundaries, pass boundaries, missing cases, pooled samples versus run spread,
minimum pairs and actual child CPU component recording. It runs in the standard
regression runner. No dependency, timer, runtime API or model call was added.

## Three-way results

Main was pinned to `e07830acbfe3e7a9d84185d7d19b067d247d39b1`; candidate is
`3.2-phase-a` (`b0fea03`); historical reference is `540df20` (3.0.10).
20 balanced triples per case completed: 120 fresh Node processes, each with ten
warm readings. [Summary and all statistics](REVISED_PHASE_A.json),
[lossless complete raw records](REVISED_PHASE_A_RAW.json.gz).

| Comparison (warm, 2,000 messages) | Wall change | CPU change | Assessment | Role |
| --- | --- | --- | --- | --- |

| baseline_to_candidate | -1.24% | +2.44% | pass | phase gate |
| reference_to_baseline | -4.64% | -4.41% | pass | informational |
| reference_to_candidate | -5.82% | -2.07% | pass | informational |

**Phase A passes.** Phase B may proceed under the revised rule. All earlier wall-only failures remain historical evidence; they are not retroactively renamed passes. Existing tags and main remain unchanged. No live Lumiverse test was performed.

The initial tool implementation pooled individual warm reads. Before Phase C this was corrected to pool run medians, matching the gate statistic and the user’s run-to-run noise requirement. Original assessments are retained in `REVISED_PHASE_*_ORIGINAL_SAMPLE_NOISE.json.gz`; corrected analyses reuse exactly the same raw observations. Phase A and B remain passes because both metrics were already below +5%. No outcome was selected by rerunning.
