# RPG Companion 2.9.5 RC: Internal States and runtime versions

## Confirmed cause

The supplied Lumiverse chat export carries NPC reading data at `message.extra.spindle_metadata.rpg_companion.swipes[swipe]`. The 2.9.4 reader only accessed `message.metadata.rpg_companion`, so exported-layout reports were invisible to Minds folds and the per-reply Internal States renderer. The supplied reply contains two NPC minds and valid associated data, and the source fingerprint matches the reply text. It is not a missing report or an unsupported HUD.

## Changes

- Read `metadata.rpg_companion` first, with a fallback to `extra.spindle_metadata.rpg_companion` when the live metadata is absent. Keep the original source-content fingerprint and swipe validation, so edited or replaced replies do not inherit obsolete readings.
- When writing a fresh reading, preserve any existing export-layout report as the update base, without changing the existing Spindle `updateMessage(..., {metadata})` write API.
- Advance the manifest, frontend panel title and backend diagnostic version to `2.9.5` together. Historical documents and regression test identifiers retain their historical numbers deliberately.
- Add fixture and supplied-export reproduction tests for preserved NPC minds, relationship folds, Internal States HTML output, live-metadata precedence and stale-content invalidation.

## Verification

- `node tools/run_tests.cjs`: all 18 suites and backend/frontend syntax checks pass.
- `node tools/test_internal_states_export_2_9_5.cjs /path/to/chat_export.json`: passes on the supplied chat export.
- No changes to UI structure, tracker prompts, refresh scheduling, model calls, settings schema or extension ID.

## Release limitations

- Release candidate only. Live Lumiverse WebView, actual extension manager update and persisted data across live software upgrades have not been tested here.
- The GitHub runtime is not connected to the container file system; this release ZIP is locally produced, and GitHub publication must be verified separately. Previous GitHub RC remains unchanged until publication of the complete tested tree.
