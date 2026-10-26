# Reproducible performance baseline

Measured 2026-10-26 on Node v22.22.2 in this cloud instance at baseline ad4eb70.
Raw results: [performance.json](performance.json). No gameplay code was changed,
so this is a current baseline, not a before/after improvement claim.

| Workload | Cold | Warm median |
|---|---:|---:|
| 300 assistant + 300 user messages | 439.84 ms | 125.78 ms |
| 1,000 assistant + 1,000 user messages | 733.51 ms | 246.11 ms |
| Report parsing | — | 1.3426 ms/report |
| Response processing | — | 1.8268 ms/response |
| Prompt construction | — | 0.8214 ms/construction |

Empty-profile prompt: 14,832 characters. Populated: 18,528. These are characters,
not tokenizer measurements. Each workload produced zero mock warnings.
The panel runner warms three times and measures ten samples; pipeline measures
five rounds after warming. Each workload here ran in one process. Cloud load and
JIT variance limit conclusions; run repeated alternating baseline/candidate pairs
for release comparisons. No live API, actual token bill, WebView responsiveness,
storage latency or full-card timing was measured. The 125–246 ms warm panel work
is measurable and should not be described as instant, nor judged unacceptable
without an agreed real-host budget.

```sh
export PATH=/workspace/.companion-tools/node_modules/.bin:$PATH
COMPANION_BIND_READINGS=1 node tools/benchmark_panel_reads.cjs
COMPANION_BIND_READINGS=1 COMPANION_BENCH_REPLIES=1000 node tools/benchmark_panel_reads.cjs
node tools/benchmark_tracking_pipeline.cjs
```

For comparisons, pass baseline and candidate backend paths to these runners,
repeat five times and alternate order. Keep fixtures, runtime and environment
constant; use source-bound readings. Existing `benchmark_tracking_2_9_3.py` does
repeat/order comparisons but overwrites the historical `BENCHMARK_2_9_3.json`;
do not run it blindly in the current checkout. Preserve original benchmark files.
CI runs correctness only; performance thresholds need comparable measurements.
