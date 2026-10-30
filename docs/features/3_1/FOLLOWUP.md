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
