# Current Six-Sided card compatibility

Base: `release/1.4.0`, `7e13ff1f98afdce36f1239c9045d394bfebc76ac` (after the 1.5.0 revert). Issue #62.

The current supplied card owns one WORLD STATE renderer. Legacy upkeep was renaming Current Arc, combining distinct fields, removing explicit None states, enforcing legacy session totals, and assigning unsupported birth precision. The baseline failed 14 of the initial 16 current-card regression cases.

## Scope

Only the Mushoku/Six-Sided adapter and its guarded call sites change at runtime. The card is recognized from its existing description; no new prompt contract or marker entry is required. A current-format HUD provides a reload fallback. Other worlds and the previous Six-Sided contract retain their behavior.

- Preserve the current card's labels, order, explicit empty states, narrative progression, age precision and conditional event dates.
- Read combined Injuries/Condition rows through an immutable panel view; keep wounds and conditions separate, ignore explicit no-injury values, and display decorated ending flags.
- Read bare adventurer ranks and separate curse/blessing and eye fields in the Mushoku world card.
- Keep existing general HUD guards, explicit pins, gear reminders, presence/death reminders, quests, inventory, NPC tracking, report parsing/folding, persistence, frontend, preset and version untouched. Only old card-specific progression and invented-birth instructions are bypassed for the new contract.
- Mark converted Six-Sided regex entries as host-activation-only for supplemental narrator lore. Normal host-activated entries and the reference catalog remain available. No extra prompts, generation calls, host calls or polling are added.

## Lumiverse setup

Embedding is optional and is not needed for this pair. Use the supplied character card unchanged. Import `Mushoku_Tensei_Lumiverse_Lorebook.json` as a worldbook and attach it to that character. Enable one copy only; remove/disable a previous duplicate attachment or global copy. The converted book contains the same 1,017 entries (1,014 enabled, three disabled). No lore content, entry IDs, constant/selective state or insertion order was changed.

The supplied book has 118 entries containing 288 slash-delimited regex keys. Lumiverse's importer defaults `use_regex` to false; its matcher compiles raw key strings rather than removing `/.../i`. The converter enables regex on those entries, strips the delimiters, and escapes the 510 literal keys sharing those entries. All source regex flags are `i`; case sensitivity and whole-word options were unset/false for these entries. Both JSON representations are converted identically. All 798 resulting patterns compile.

Reproduce the conversion without committing the user's source files:

```sh
node tools/prepare_six_sided_lore.cjs INPUT.json OUTPUT.json
```

Host sources inspected: [entry import normalization](https://github.com/prolix-oc/Lumiverse/blob/main/src/services/world-books.service.ts), [raw regex matcher](https://github.com/prolix-oc/Lumiverse/blob/main/src/services/world-info-matcher.service.ts), and [attached/embedded sources](https://github.com/prolix-oc/Lumiverse/blob/main/src/services/world-info-sources.service.ts). Route activation was exercised against that actual matcher locally. Host versions may differ; live import remains an acceptance check.

## Coverage and boundaries

| Surface | Verification |
| --- | --- |
| Classic and Visual HUD | Reply processing, panel payload, field preservation, treated wounds, secondary conditions, no-injury states, ending flags |
| Magic/sword progression | Existing tracking suites; current card does not inherit the older automatic session formula or age caps; reported studies remain tracked |
| Curse/blessing, Demon Eyes, guild | Separate fields, multiple eyes, bare guild rank and Solo |
| Prompts and controls | Full interceptor/panel request, single side-panel injection, unchanged pins, scoped recognition and card switching |
| Lorebook | All 1,017 content strings and activation enable states preserved; paired representations agree; all converted patterns compile; representative route activation using host matcher |
| Lore-driven systems | 23 source categories cover characters, locations, magic, swords, races, monsters, world lore, arcs/scenes/memories, openings, controls and HUD modules. Their authored content remains narrator/host owned; the Companion does not independently simulate every lore rule |
| Other worlds and persistence | Existing cross-card, tracking, lifecycle, carry-over and smoke suites |

Local checks: all 13 runner groups pass. The focused suite passes 25 synthetic checks, plus one check recognizing the actual unmodified uploaded card (26 total with SIX_CARD set). Node v24.22.1 locally; hosted CI uses Node 22.

Alternating baseline/candidate microbenchmark, 500 reply-processing plus cached panel-read iterations per sample: baseline 500.4/485.1 ms; candidate 256.5/234.2 ms. This synthetic workload avoids unnecessary legacy repairs; it is not a live latency guarantee.

No full live installation, WebView, real provider generation, save/reload session, or exhaustive semantic activation test of every lore rule was performed. Passing tests establish the stated integration coverage, not a guarantee of narrator obedience or a stable-release certification. No gameplay version bump or release is included.
