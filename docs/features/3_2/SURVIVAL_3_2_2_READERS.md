# 3.2.2 — Validate survival flags at their consumers

Current continuation of PR #35, from main `01c3df9`. The user authorized
retargeting the two survival tests introduced by this PR. Tests already present
on main, the benchmark tool and GATE_REVISION remain unchanged.

## Step 2: move the check

`getSwipeData` again returns the source-validated raw report in both paths.
Evidence validation runs only in `hmsSurvival` and `statesPanelHtml`, plus the
existing acceptance-time filter. Internal States cache entries keep a lightweight
source descriptor only for reports with action claims; the descriptor includes
reply id, swipe, content and selected stored source hash, with no extra API call,
message traversal or stored schema change. `statesNote` updates that descriptor
when a report is accepted. Non-flag fields remain unchanged.

The cache is a WeakMap keyed by raw report data. Signed hits compare the selected
stored source hash, raw survival object and scalar flag mask. They do not call
`textOf`, construct an id/length string or compare full prose. Existing
`getSwipeData` fingerprint validation still rejects stale signed reports before
consumption. The new signed regression checks that rejection, then updates the
source binding and verifies a changed verdict for an equal-length edit.

Unsigned legacy reports have no stored hash. Their fallback retains the existing
id/swipe/length key and exact content guard, so equal-length edits also invalidate
old verdicts. Their cache hits skip normalization and evidence matching; signed
hits take the cheaper hash-only path. No new strong-key cache retains old reports.

Both new test files retain the original inputs and expected evidence, rejection,
negation, multilingual, raw-preservation, manual-log and export results. The
helper is now tested explicitly. Raw `getSwipeData` values remain unchanged.
Actual clock and rendered-row checks prove that an old unsaved report creates no
story event, cannot reset timers, and produces no “This reply” row. The real
`statesFill` → `getStatesFor` → `statesPanelHtml` path is covered. Manual log
entries still count. Reply 8 retains eating; replies 2, 4, 10, 12, 28 and 38 keep
their required rejections. No private export is committed.

Release/syntax, **65 JS suites + 12 gate tests**, **54 Chromium UI tests** and
**5 visibility tests** pass before measurement. Step 2's unchanged 20-pair gate
must PASS before proceeding. Steps 3 and 4 have not yet been applied here.
No live Lumiverse testing.

## Step 2 result

The 20-pair gate for `d2411e0` **PASSES** against frozen main `01c3df9`:
2,000 warm wall **147.88 → 142.33 ms (-3.75%)**, CPU
**216.02 → 207.53 ms (-3.93%)**. Raw observations and all IQRs/spreads are in
[SURVIVAL_3_2_2_READERS_GATE.json](SURVIVAL_3_2_2_READERS_GATE.json) and
[the raw archive](SURVIVAL_3_2_2_READERS_RAW.json.gz). Earlier failed and
inconclusive matrices remain historical; none was discarded. These timings
establish the configured gate result, not a live-host speedup claim.

## Steps 3 and 4

Generic English break/recover forms and generic recovery equivalents were
removed from rest evidence. Explicit resting, sitting down, taking a short break
and catching breath remain supported. New positive/negative examples, including
combat balance recovery and guard breaking, pass without changing the original
inputs or expected results. The helper remains lexical rather than a full NLP
system; broad claims of language or narrative accuracy are not made.

The re-save regression keeps the rejected original claim in `unconfirmed`, edits
the reply to include real eating, rejects the old signed report before re-save,
then explicitly saves the preserved report. It confirms eating again, clears the
rejection list, retains mood, leaves the prior raw object untouched, and verifies
both the actual row and clock event. No runtime change was needed for Step 4;
this recoverability already exists in the acceptance filter.

The combined Step 3/4 source passes **65 JS suites + 12 gate tests, 54 Chromium UI
cases and 5 visibility cases**, the release/syntax checks and the supplied
39-message fixture. The final 20-pair gate follows on that exact backend source;
Step 4 changes tests only. No merge is authorized without its PASS result.

## Final Steps 3/4 gate and release acceptance

The exact backend used by Steps 3 and 4 is the same (Step 4 adds tests only).
Measured candidate `e1479bd`, frozen main `01c3df9`, 20 alternating pairs per case,
120 fresh-process observations, no concurrent local tests. No samples discarded.
[All statistics](SURVIVAL_3_2_2_FINAL_GATE.json),
[raw archive](SURVIVAL_3_2_2_FINAL_RAW.json.gz),
[final checks and hashes](SURVIVAL_3_2_2_FINAL_VALIDATION.json).

| Messages | Metric | Main → candidate median ms | Change | Baseline / candidate IQR | Baseline / candidate spread |
| --- | --- | --- | --- | --- | --- |
| 600 | cold wall | 241.47 → 233.18 | -3.44% | 32.95 / 25.02 | 226.16 / 159.87 |
| 600 | cold CPU | 275.69 → 265.96 | -3.53% | 36.07 / 26.21 | 253.32 / 191.74 |
| 600 | warm wall | 65.47 → 64.93 | -0.82% | 7.57 / 8.32 | 40.16 / 41.91 |
| 600 | warm CPU | 132.87 → 132.95 | +0.06% | 18.01 / 17.92 | 62.59 / 73.22 |
| 2000 | cold wall | 516.34 → 527.50 | +2.16% | 37.42 / 58.44 | 183.53 / 119.25 |
| 2000 | cold CPU | 657.14 → 648.70 | -1.28% | 40.89 / 67.27 | 195.74 / 135.73 |
| 2000 | warm wall | 138.03 → 143.18 | +3.73% | 9.74 / 14.81 | 34.67 / 50.59 |
| 2000 | warm CPU | 200.79 → 202.63 | +0.92% | 21.60 / 21.43 | 64.99 / 70.34 |

**Final gate: PASS.** Both 2,000 warm changes are below +5%. Step 2 was also PASS
(-3.75% wall / -3.93% CPU); the earlier generic-getter attempts remain preserved
as failed/inconclusive history. The gate and benchmark tool are unchanged.
Shared-host noise remains; no live-provider/WebView performance claim is made.

All local checks pass: 65 suites, 12 gate tests, 54 Chromium UI tests, 5 visibility
tests, release/syntax/embedding and both the real 39-message survival fixture and
previous 37-message display fixture. Main's existing test files are untouched.
Only the two PR-new survival tests and their one registry line changed in tools.
The only model-facing instruction change is the requested survival sentence.
No gameplay/Quest/Agenda/Minds/relationship engine or saved schema was changed.
No old message migration, extra model call, polling or timer. Manual events remain
unconditional. Signed report provenance remains enforced by the existing getter.

RC limitations: no live Lumiverse installation/WebView verification; lexical
lists and short negations are not full NLP or exhaustive language coverage.
Regular merge only after GitHub CI confirms the final checkout. No tag changes.
