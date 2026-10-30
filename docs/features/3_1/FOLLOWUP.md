# 3.1 RC follow-up verification

Starting branch: `staging/features-3.1`, commit `f1016e583bf4976ce3140a94949f33673ecde022`.
Frozen published baseline: `540df20f602bd475b9149c1ab28aa705e391f72d` (3.0.10).
No live Lumiverse testing has been performed. All host/provider tests are mocked.

## Item 1 — exported ability labels

Confirmed before fix with the actual HUD parser: Abilities exported `Active` and
`Vast`, despite their panel records retaining Touki/Mana labels. The regression
failed on the starting branch. `characterSheetMarkdown` now prefixes each existing
label, matching the panel's Abilities card, while preserving state suffixes.

Files: `dist/frontend.js`, new `tools/test_sheet_followup.cjs`, registration in
`tools/run_tests.cjs`, `CHANGELOG.md`, this report. No tracking/storage changes.
Test uses `Touki (Battle Aura): Active` and `Mana Capacity: Vast` HUD lines with
the existing configurable ability vocabulary and asserts the Abilities subsection,
not merely the duplicated HUD summary. Input metadata remains unchanged.

Node 22: release identity, both syntax checks and all 54 suites passed.
Post-change smoke benchmark: 600-message cold/warm 240.75/69.40 ms;
parse/response/prompt 0.6469/0.9803/0.3757 ms. Prompt sizes 15,291/19,213 chars.
These single smoke runs are not controlled before/after performance evidence;
item 4 supplies the isolated alternating comparison.

## Item 2 — consistency fixtures

Before: `Touki: Available; inactive at rest.` **did not fire** against Active in a
resting HUD; a reply without a WORLD STATE HUD **did fire** `no-hud`.
After: both cases fire. The prefix `Available;` is accepted only before the
explicit `inactive at rest` directive; unsupported extra conditions are rejected.
Fighting, matching Inactive, unknown rest state and the off switch do not produce
the contradiction warning. Checks remain advisory, source-preserving and write-free.

Files: `dist/backend.js`, `tools/test_consistency_followup.cjs`, suite registration,
`CHANGELOG.md`, this report. No new translated messages or settings/schema changes.
All 55 suites, release identity and syntax checks passed. Post-change smoke:
600-message cold/warm 234.11/64.42 ms; parse/response/prompt
0.7487/1.1020/0.4793 ms; prompt lengths unchanged. These are uncontrolled smoke
samples; item 4 is the merge-gating comparison.

## Item 3 — HUD spell-rank vocabulary

Before: a known lorebook spell ranked Elementary exported as Elementary even
when the HUD used Beginner. The new regression failed before the change.
After: the Known spells section shows Beginner when the actual HUD magic-tier/
school fields use that term. Elementary-only or missing HUDs retain Elementary;
unrelated quest text cannot activate the substitution. Higher ranks and stored
spell objects remain unchanged. Technique ranks are outside this spell-only fix.

Files: `dist/frontend.js`, `tools/test_sheet_followup.cjs`, `CHANGELOG.md`, this
report. This is display formatting only; the HUD term stays literal, not translated
or written into the catalogue. No new UI translation keys were introduced.
All 55 suites, syntax/release checks passed. Smoke cold/warm: 433.25/69.27 ms;
parse/response/prompt: 1.0642/1.0853/0.5515 ms; prompt lengths unchanged.

## Item 4 — merge-gating performance comparison

`tools/benchmark_release_comparison.py` freezes both Git sources into temporary
files, verifies Node 22, uses a fresh process per source/run and alternates AB/BA
pair order. This first completed matrix used 10 pairs per chat size: **10 baseline
and 10 candidate runs for both 600 and 2,000 messages**, 40 processes total.
Each run measures the cold first read, three warmups, then the median of ten warm
reads. No other local tests/benchmarks ran during the matrix; the runner checks
for competing workloads. Assigned-machine load was 0.34 initially / 1.26 at the
end, including the benchmark itself. Physical host/cotenant scheduling is outside
our control. All mock warnings were zero; no provider calls were made.

Frozen candidate checkout: `84cc76b`; baseline `540df20`. Full hashes, all raw
samples, IQRs, order and elapsed time are in [PERFORMANCE_FOLLOWUP.json](PERFORMANCE_FOLLOWUP.json).
The gate was predefined as the percentage ratio of the two source medians of
2,000-message warm run medians. It was not changed after seeing the results.

Times are ms. Spread below is minimum–maximum across the ten source runs.

| Messages | Read | 3.0.10 median [spread] | Branch median [spread] | Change |
|---|---|---:|---:|---:|
| 600 | Cold | 295.78 [232.12–680.24] | 269.69 [236.60–637.47] | -8.82% |
| 600 | Warm | 78.06 [64.89–338.46] | 74.28 [66.33–199.82] | -4.83% |
| 2000 | Cold | 599.10 [533.30–1194.47] | 584.85 [524.37–1292.61] | -2.38% |
| 2000 | Warm | 159.69 [151.63–191.99] | 165.12 [140.24–371.83] | +3.40% |

**Gate: +3.40%, within 5%.** The earlier two-pair +5.71% result is superseded
for this decision, not erased from the historical report. No feature was deferred
and the conditional bisect was not triggered. The 600-message median paired
percentage is +5.81% even though its ratio of medians is -4.83%; the JSON records
both estimators. Wide outliers remain visible, so this is not a device-latency or
general-speedup guarantee. Native long-campaign acceptance remains unverified.

Files: new serial benchmark runner, raw performance evidence, this report, and
supersession links in the original staging report/README. No runtime change for
item 4. Release/syntax checks and all 55 suites passed; both standard benchmark
scripts were also rerun after adding the runner. Their single smoke samples are
not substituted for the 10-pair comparison above.

## Item 5 — Martial omission and reliability investigation only

Full findings and function references: [MARTIAL_INVESTIGATION.md](MARTIAL_INVESTIGATION.md).
Accepted Abilities rows are not filtered out by the serializer. Known-technique
catalogue rows deliberately exclude training/attempts, and bare Touki is represented
by the HUD. The available export's countercut/diagonal assessment quotes fail
source matching; they are raw reports, not accepted knowledge. An empty-lore
fallback naming gap is also reproduced and left unchanged.

A valid synthetic one-strike quote reported as reliable survives current guards
and enters the known collection (`newlyLearned:false`, no mastery). This is a
separate confidence-validation gap that the 3.0.3 guards do not cover. Failed
practice, NPC demonstrations and nonmatching evidence remain rejected. No runtime
ability logic changed. No arbitrary number of required strikes was introduced.

Files: `tools/test_martial_investigation.cjs`, suite registration, investigation
and follow-up reports. All 56 suites plus release/syntax checks passed. Standard
benchmarks were rerun: 600-message smoke cold/warm 310.42/85.41 ms;
parse/response/prompt 0.7410/0.9953/0.4410 ms. Prompt lengths unchanged.
Item 4's frozen runtime source is unchanged by this docs/tests-only item.

## Verification limits and merge decision

The 10-pair primary gate is +3.40%, so the user's conditional merge is eligible
once final browser and GitHub checks pass. Individual runs have wide outliers;
this does not guarantee real-device timing. All prior saves, metadata and ability
logic remain untouched. No new model calls, polling, timers or dependencies.
No live Lumiverse instance, Android WebView, native installation/reload or actual
provider/model response was tested. This remains **3.1.0 RC**, never a stable claim.

Final local browser checks: **37 Chromium UI cases and five visibility cases
passed**, using the mocked host. Existing save/load, Together/Separate and
continuation/source-swipe regression coverage remains passing.
