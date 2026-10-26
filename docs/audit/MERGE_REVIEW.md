# Phase 1 merge review — 2026-10-26

PR: https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/pull/1

The audit commit `8d96d3bab90d7e4daf0554ad76b6d913485045b5` and delivery follow-up
`9d12ef430c58ed4778f37ed1c2aaabb5b694a7a7` were verified against the repository.
The baseline is `ad4eb707491cdf3e37fd1c642fefdb43c4c3178f` (2.9.7 RC).
The working tree was clean before this continuation. PR #1 already existed and
was reused rather than creating a duplicate.

The saved environment now allows api.github.com and actual repository, PR and
Actions API requests succeed. The earlier proxy blocker in FINAL.md/BASELINE.md
is historical. The integration cannot read branch-protection configuration
(HTTP 403, Resource not accessible by integration), so protection enforcement
cannot be independently certified. Merge must still wait for successful checks.

## Complete diff review

The patch adds maintenance guidance, baseline/historical/tracking/performance
reports with public-code fingerprints and counts, four audit/check utilities and
validation-only CI. The reports distinguish static evidence, actual export replay,
mock-host tests and untested live behavior. No private export, token, original
Companion checkout, gameplay bundle, manifest, preset, locale, dependency or
existing regression test is changed. The audit inventory is small JSON metadata,
not uploaded historical bundles. Utilities read private inputs without rewriting
them; runtime probes intentionally distinguish unsupported historical helpers.
The release check verifies active frontend/backend/manifest identity.

CI uses contents:read, checkout persist-credentials:false, Node 22, release checks,
all existing regression suites, a tracked-file cleanliness check, a 15-minute
limit and per-ref concurrency. It contains no source assembly, remote source copy,
commit, push or release publication. Third-party actions remain checkout/setup-node
v4 as before. No secret is passed to jobs.

The first patch replaced the obsolete publisher in place at assemble-rc.yml.
For retirement, validation now has its own path, `.github/workflows/validate.yml`.
The old GitHub workflow ID 396665142 was disabled through the Actions API before
merge; assemble-rc.yml is removed. The old 2.9.4 publishing commands therefore
cannot execute through the current default-branch workflow. No old publisher run
was active in the observed run list. Never re-enable or rerun historical publisher
runs; historical Git contents remain preserved, and repository administrators can
always change workflow configuration. Validation has no publishing permissions.

## Verification and acceptance

The local Node v22.22.2 run passed all 19 suites and both bundle syntax checks;
release identity passed. The original PR head 9d12ef4 also passed hosted push and
pull_request runs, including release checks, all regression suites and clean-tree
verification. Final-head and post-merge CI outcomes must be checked directly on
PR #1 / Actions; earlier green results do not stand in for those checks.

No new gameplay release or stability claim is made. Confirm the merged manifest
and both bundles against docs/audit/baseline-hashes.json and the Git baseline.
Remaining Phase 2 work is live Lumiverse installation/update, Internal States and
metadata persistence across reloads/swipes/edits, with full representative cards
and recorded performance. Obtain the missing independent 2.1 reference before
claiming a complete historical comparison.
