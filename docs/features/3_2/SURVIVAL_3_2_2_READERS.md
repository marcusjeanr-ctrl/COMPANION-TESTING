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
