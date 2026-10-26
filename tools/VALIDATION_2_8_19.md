# RPG Companion 2.8.19 validation

## Confirmed repairs

The reported Visual HUD used middots between Water (Intermediate), Earth (Intermediate) and Fire (Beginner). The rank reader only split commas/semicolons, creating one invalid school and an empty eligible-spell filter. The shared magic/martial rank reader now splits top-level commas, semicolons and middots while preserving bracketed/parenthetical content, unknown ranks and Shown/True power views.

Touki's scalar description was passed through the generic list splitter, producing two abilities at its comma. Touki now preserves the entire scalar description while keeping existing parenthetical state handling. Generic ability lists retain their existing behavior.

The chat HUD-card renderer replaced Visual Markdown with its table display. Visual HUDs now remain in their original Markdown form, preserving icons, bold labels, dividers, checkpoints and values. This bypass affects display only: tracking, guards, pins and semantic normalization remain active. Classic HUD cards continue working. Disabling HUD cards remains supported. Classic chip rendering now respects parentheses/brackets, preventing the equipment qualifier '(yard issue, worn grip)' from becoming two chips.

## Validation performed locally

`node tools/run_tests.cjs`: all 12 regression suites and both bundle syntax checks passed. Full output: VALIDATION_2_8_19.txt.

The new test uses the exact reported HUD plus the complete 1,296-entry updated-card fixture retained from 2.8.18. It verifies:

- Three correctly ranked magic schools and 111 catalog identities, with eligible spells visible and no rank-only knowledge grants.
- Sword God (Intermediate), Sword God Style: Intermediate, Water God (Advanced), North God — Saint, mixed separators, unknown ranks and Shown/True handling.
- One Touki entry with its comma-containing description intact.
- Study, Known, Mastered, Forget, relearning and active-swipe rollback using canonical aliases in the repaired Visual flow.
- Visual output unchanged, including narration, and continued Classic HUD-card rendering.
- Classic chip rendering preserves comma-containing equipment qualifiers.

All earlier suites remain passing, including original-world 2.8.1 panel parity, Save/Continue, dated Atlas behavior, catalog extraction, identities, goal acceptance, privacy, stale results, edits/swipes, persistence and injection deduplication. No new calls, APIs, schema changes or migrations were introduced. The supplied character card remains unchanged.

## Update

Update the existing extension from its configured Companion GitHub source, or install the supplied ZIP as the same extension identifier. Reload Lumiverse, reopen the existing chat and press Read again to rebuild local panels. A model Refresh is not required for the rank/display repair. No chat restart or character-card replacement is needed. Existing learned-spell records are preserved; school ranks do not invent missing knowledge.

## Limits

No live Lumiverse/Android session was available for this release. Host Markdown/CSS appearance therefore requires live confirmation. Keeping Visual Markdown bypasses the generic HUD-card-only bars, chip layout and raw-text disclosure for that reply; Classic HUD cards still provide those features.

The parser repairs do not correct story contradictions, establish player acceptance of an NPC's challenge, or guarantee every semantic extraction. Existing goal-acceptance safeguards remain unchanged. Tests validate existing progression/reconstruction paths; no new spell-grant rules were added. A card-level narrative continuation still does not import unexported Companion or Cortex metadata.
