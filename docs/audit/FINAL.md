# Phase 1 results

Prepared on branch `chore/development-baseline-audit`; initial audit commit
`8d96d3b` was pushed successfully to COMPANION-TESTING. No gameplay version was
published, no original Companion files were changed, and the private input is
outside Git. The working gameplay baseline remains ad4eb70 / 2.9.7 RC.

## Deliverables

- [Baseline/architecture/version report](BASELINE.md)
- [Historical feature/regression matrix](HISTORY.md), archive fingerprints and
  narrow cross-version behavior probes
- [Tracking integrity report](TRACKING.md), including actual export replay
- [Measured performance baseline](PERFORMANCE.md)
- Root AGENTS.md and [development/release procedure](../DEVELOPMENT.md)
- Read-only checkout-validation CI replacing the unsafe old 2.9.4 assembler;
  release identity check and private/history audit utilities

All 19 existing suites plus two bundle syntax checks pass on Node v22.22.2.
Release identity passes and a deliberate frontend mismatch is rejected.
Actual export replay/HTML/source guards pass without modifying the input.
The old 2.9.3 export test fails its fixed 80-character-note assertion against this
new 156-character-note export; it remains preserved and is not reported as passing.
Final review checked source hashes, privacy, CI permissions, workflow YAML and
Git whitespace. Manifest and both runtime bundles are unchanged.

No new critical gameplay regression was confirmed. An unsafe infrastructure
publisher was confirmed and replaced on the branch. Static comparison and selected
behavioral tests do not establish complete historical equivalence. Two 2.0 ZIPs
are identical, so the requested independent 2.1 comparison remains blocked by
missing source. Uploaded diagnostics are 2.9.6, not an independent 2.9.7 ZIP.
The checked-out Git baseline supplies current 2.9.7 evidence. Full card files,
live Lumiverse/WebView, reload persistence and install/update verification remain
outstanding. RC stability is not claimed.

## Publication and remaining actions

Git push confirmed the review branch exists. PR creation and hosted Actions status
could not be verified: api.github.com returns a proxy CONNECT 403 (even for an
unauthenticated HEAD request). This establishes a network blocker, not missing
Git credentials. No new token was requested. Environment startup instructions
were saved to read the new guidance and run release checks; api.github.com was
added to the network draft, preserving the package-manager presets. Draft saves
do not apply runtime networking or publish the environment.

Review/save the environment draft to apply API access, then publish the environment
when desired. Recheck GitHub API operations after that change; API authorization
must be tested separately from Git access. PR creation link supplied by GitHub:
https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/pull/new/chore/development-baseline-audit

The old publisher remains on main until this branch is reviewed and merged.
Do not trigger the old workflow. After API access is available, create/review the
PR, verify hosted CI, configure the required branch-protection check and merge the
infrastructure patch. No gameplay release should follow automatically.

Next investigations: obtain the distinct 2.1 archive; validate all five actual
cards in Lumiverse; test real metadata layouts and reload/update behavior; gather
repeated live and synthetic performance comparisons. Create targeted reproductions
for ambiguous Agenda suffixes/unspecified context before proposing gameplay fixes.
