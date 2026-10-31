# RPG Companion development rules

## Scope and baseline
- Develop and publish only to `marcusjeanr-ctrl/COMPANION-TESTING`.
  `marcusjeanr-ctrl/Companion` is a read-only historical reference: never push,
  modify, reset, or create branches there.
- Preserve 2.9.7 RC as the starting gameplay baseline. Verify manifest, backend
  diagnostics, frontend title and Git history; a manifest alone is insufficient.
- Use the existing isolated checkout. Do not create a worktree unless requested.
  Work on a feature/fix branch, preserve user changes, and submit reviewable PRs.
- Do not rebuild/reconsolidate from historical bundles. `tools/rebuild.py` targets
  2.8.2 and overwrites runtime files. Use it only in an explicitly scoped historical
  investigation outside the working checkout.

## Investigation and data safety
- Read `docs/audit/BASELINE.md`, `HISTORY.md`, `TRACKING.md`, and `PERFORMANCE.md`.
- Reproduce a defect, establish expected behavior, add a failing regression, then
  make the smallest justified fix. Run targeted and full tests and inspect the diff.
- Compare behavior and call sites; a missing old function name is not a regression.
  Do not import older code without evidence. Distinguish unknown from defective.
- Never rewrite live tracking, delete valid records, weaken source validation,
  or adjust assertions just to pass. Private chat exports and credentials stay
  outside Git; use synthetic fixtures for committed tests. Do not log private text.
- Keep NPC routines (`agendas`) separate from scheduled player Agenda (`agenda`).
  Preserve participants, locations, schedules, objectives, stage history, uncertain
  knowledge and owner-isolated secrets. Similar names are insufficient for merges.

## Compatibility and performance
- Preserve extension identifier `rpg_companion_hms`, update compatibility, saved
  state and existing UI behavior. Support Overlord, Re:Zero, Mushoku Living World,
  COTE and Six-Sided World, plus legacy formats. Fixture checks are not full card
  or live Lumiverse certification.
- No extra model/API calls, polling, redundant refreshes, unbounded scans or writes.
  Preserve caches and token overhead. Measure changes with existing panel/pipeline
  benchmarks using the same runtime, fixtures and alternating comparison order.
- Standard checks: Node 22; `node tools/run_tests.cjs` (release identity, syntax,
  regressions, smoke test). Python 3 is used by documentation/embedding tools.
  In the cloud activate `export PATH=/workspace/.companion-tools/node_modules/.bin:$PATH`.
- Run relevant existing suites plus new defect regressions. Report failures,
  skipped tests and fixture mismatches separately. Do not claim unrun checks.

## Review and release
- Process: issue → reproduction → targeted fix → regression → review → PR → CI
  → merge → release verification. Review assumptions, data loss, false merges,
  synchronization, rendering, compatibility, complexity, API calls and performance.
- CI must validate the proposed checkout with read-only permissions. It must not
  copy old source into the checkout, push to main, or publish a gameplay release.
- Version changes must agree across spindle.json, backend RPGC_VERSION/diagnostics,
  frontend title, release notes and package. Keep RC status explicit until live
  acceptance is met. Do not bump gameplay version for documentation/infrastructure.
- For an authorized release, verify baseline and diff, all tests, performance and
  saved-data compatibility; package only installable public files; verify artifact
  hashes after upload. Use only COMPANION-TESTING. Never claim publication without
  GitHub confirmation. Follow `docs/DEVELOPMENT.md`.
- Stable requires live installation/update, frontend/WebView, persistence across
  reloads, representative cards, no critical tracking defects and measured acceptable
  performance, in addition to automated tests. RC tests alone cannot establish stability.
