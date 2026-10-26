# 2.9.6 RC: Internal States regression follow-up

- Actual follow-up diagnostic: version 2.9.5, Minds enabled but zero loaded, no recent errors.
- New supplied export: three Minds, including Seraphina, Aurelia and Cassian, saved under `extra.spindle_metadata.rpg_companion.swipes["0"]`; corresponding source fingerprint matches the active reply.
- Six historical versions compared: 2.0, 2.1 and 2.8.1 use simple metadata read; 2.8.2, 2.9.0 and 2.9.3 use source-verified per-swipe reads. No older algorithm was blindly imported.
- Fix: when one metadata representation contains an invalid or empty active swipe, attempt the other supported representation. Every candidate remains subject to source validation, with no stale-read relaxation.
- Additional diagnostics: `chat.trackingMetadata` reports whether live, exported or nested metadata is absent, lacks the active swipe, has a source mismatch or is valid; plus the selected report's counts. No NPC content is included.
- New export fixture tests use actual NPC count rather than a fixed two, and test invalid live metadata with valid export fallback, edited-reply rejection, live precedence, fold and panel.
- All 18 automated suites and both bundle syntax checks pass. This is not proof of live Lumiverse API behavior: if all `trackingMetadata` sources show absent while the export has Minds, the runtime API is not exposing the persisted data and further live integration is required.
- No tracker prompts, generation paths, settings schema, saved data, UI layout, or extra model calls were changed.
