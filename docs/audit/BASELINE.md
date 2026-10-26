# 2.9.7 RC development baseline — 2026-10-26

Baseline: `ad4eb707491cdf3e37fd1c642fefdb43c4c3178f`, also the observed remote
main HEAD. Work is on `chore/development-baseline-audit`. The original Companion
repository was not modified. This phase changes documentation and infrastructure,
not gameplay bundles, version or saved tracking data.

## Architecture and version evidence

`spindle.json` identifies `rpg_companion_hms` 2.9.7, minimum Lumiverse 1.2.0,
backend `dist/backend.js` and frontend `dist/frontend.js`. Permissions are
interceptor, generation, chat_mutation, image_gen, world_books and memories.
Backend `RPGC_VERSION`, diagnostics binding and frontend `headerTitle` agree.
The README still introduces 2.9.4: this is documentation drift, not proof of an
older installed runtime. Embedded guides contain historical version references;
these are not active frontend identity. Exact current hashes are in
[baseline-hashes.json](baseline-hashes.json).

History establishes the trajectory: `7f15059` publishes assembled 2.9.4;
`6f7869a` fixes metadata/version synchronization in 2.9.5; `871e50c` adds 2.9.6
metadata fallback diagnostics; `ad4eb70` refines Agenda identity in 2.9.7. The
2.9.4→HEAD diff is narrow (metadata retrieval/write fallback, diagnostics, Agenda
matching, versions and two test suites), rather than a rebuild from an older ZIP.

The repository ships executable bundles, not an original npm application source
and build tree. Backend owns interceptor registration, model extraction, lore,
per-swipe records, folding and persistence. Frontend owns drawer setup, controls,
state updates and presentation. Backend also generates message-attached Internal
States HTML. Standard-library Node mock-host tests exercise the real bundles;
Python tools handle historical reconstruction/embedding. Fixtures and reports
live under tools; localization and preset assets are shipped separately.

## Validation

- Node v22.22.2 (CI major 22), Python 3.12.14.
- `node tools/run_tests.cjs`: all 19 suites plus both bundle syntax checks pass.
- `node tools/check_release.cjs`: identity, diagnostic version binding and
  entrypoints pass; this is a new CI check.
- Actual supplied 17-message export: Internal States test passes. Read-only audit
  returns 8 readable reports across 9 replies, 3 reconciled Minds, 9 pairs, 5 Agenda
  items and 5 quests. Edited-source rejection and unchanged input pass.
- The older `test_export_tracking_2_9_3.cjs` fails its fixture assertion: expects
  an 80-character historical study note; this file has 156. It does not reach its
  remaining assertions and is not counted as passed. The old test is preserved.
- Historical ZIP and behavior evidence: [HISTORY.md](HISTORY.md).
- Performance and limitations: [PERFORMANCE.md](PERFORMANCE.md).
- Tracking investigation: [TRACKING.md](TRACKING.md).

## Infrastructure and release status

The previous `assemble-rc.yml` cloned old source, overlaid 2.9.4 staging artifacts,
then committed and pushed main with contents:write. Its trigger on workflow-file
pushes made even a workflow edit dangerous. It is replaced by pull-request/push/
manual validation of the actual checkout with contents:read and no persisted
Git credentials. There is no source copying, committing, pushing or publishing.
GitHub branch protection is separate and has not been configured or verified.

Local checks do not establish hosted CI or publication. Git read access works;
GitHub CLI GraphQL PR listing returns Forbidden. Publication and hosted checks
must be reported from actual subsequent results, not inferred from local success.
This candidate is not certified stable. Live installation/update, real Lumiverse
API/WebView behavior, persistence across a real reload and full RP cards remain
untested. No gameplay release is authorized by completion of this audit.
