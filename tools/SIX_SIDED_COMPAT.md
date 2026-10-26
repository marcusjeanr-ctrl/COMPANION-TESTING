# Mushoku compatibility in HMS 2.8.16 candidate

Install the extension ZIP in Lumiverse. The original cards remain readable. A separate Six_Sided_World_HMS_Compatible.json copy resolves conflicting generic-HUD and output-order instructions in the supplied Six-Sided card; its lorebook is unchanged. Living World, the start handler and Reporter preset are unchanged. HMS reads the active chat's WORLD STATE HUD and the attached lorebook; it does not have an independent authoritative world state.

## What is implemented

- Both Mushoku HUD dialects normalize date, age and birth, mana capacity and reserve, Touki, sword and magic ranks, voiceless casting, canon mode, agency, and geographic path. The Six-Sided calendar uses 12 months of 30 days. Living World's K-year/day format remains supported.
- The complete 22-arc index is augmented by the chat's lorebook and dated canon calendar, even under partial activation. Numbered sub-arcs and Sandbox/Era frames are supported. The panel separates a dated canon reference from Marcus's personal arc and shows explicit event outcomes recorded in chat metadata. Dates and lorebook entries do not prove participation or an event outcome. Swipes rebuild the outcome ledger from active metadata; after editing narration, use Read again to refresh its tracker report.
- The spell catalog shows eligibility separately from learned and mastered spells. A fight menu, catalog entry, or first attempt does not grant a spell. Study percentages stay unknown until reported. Spell identity is exact after punctuation and case normalization so a learned base spell does not grant a longer named variant.
- A spell whose lorebook entry does not state a rank appears as **Rank unknown** under **All**, rather than being counted Within reach. The story decides when it can be learned.
- Narrated practice can automatically enter Studying for either Mushoku HUD format. A manual stop suppresses earlier practice until a later practice event; an explicit learned cast becomes Known. Unknown progress remains blank.
- The Atlas derives observed Six-Sided locations and rooms from recent HUD paths, including a custom estate. These nodes live in chat memory and do not modify the character card. A room change adds a sibling under the same estate.
- Yearless `Day N` Agenda deadlines are anchored to the current Mushoku calendar rather than compared with year zero. Birth is displayed only if the HUD supplies a birth year; missing data never renders as `K. null`. Mana tier descriptions come from the exact tier entry, not unrelated mana lore.
- Six-Sided has no dedicated OOC question guide entry. Panel questions use a neutral lore-based fallback; Living World's named guide remains intact. In-chat questions without a guide use `OOC:`. The model's live response still needs a Lumiverse check.
- Existing family, NPC Minds, relationship, gear, objectives, and generic RPG modules remain in place. Family entries require explicit kinship. NPC knowledge requests specify how information reached that character. NPC suggestions do not become accepted player goals. Gear reporting excludes unclaimed nearby items and NPC possessions.
- Cross-world detection tests cover Re:Zero, Overlord, Classroom of the Elite, Undertale, Dark Souls, and Skyrim. Six-Sided-specific Atlas and canon event logic is gated by its HUD and Mushoku identification.

## Verification

Run `node --check dist/backend.js`, `node --check dist/frontend.js`, and `node tools/test_six_sided_compat.cjs` from the extension folder. The fixture uses the 22 arc entries from the supplied Six-Sided card and checks two Mushoku HUD formats, calendar rollover, spell evidence, custom Atlas hierarchy, family classification, gear state, objectives, canon event serialization across swipes, and world detection regressions.

**Live Lumiverse validation is still required before calling the integration 100% compatible.** In separate chats with each Mushoku card, confirm the HUD and Atlas, learn and master a new spell across several replies, swipe an event outcome, visit a custom room, and verify that an NPC request does not create an objective. Open Re:Zero afterward and confirm its world and Atlas still load. Model-generated tracker reports can omit or misstate facts, so correct an individual tracker entry if narration contradicts it.

## Current reading behavior in 2.8.9

The tracker request transport and refresh workflow come from the supplied 2.8.1 package. Its JSON repair, normalization, locks, per-swipe metadata and missing-block catch-up remain. One normal Separate-mode update makes one tracker call. Read again processes locally. The 2.8.8 evidence gate, automatic correction request, review UI and related settings have been removed, rather than merely switched off. Previously stored safeguard settings and audit metadata are ignored.

Six-Sided compatibility stays layered on the original reader: its calendar and HUD dialect, ranks, study/learning metadata, canon outcomes and observed locations remain supported. Room and position readings are saved in Separate mode too. Local cache reuse remains bounded and exact-text edits invalidate HUD reads.

The Magic catalog now paginates `world_books.entries.list` with the documented `limit` and `offset` parameters. It loads only books identified by this chat's live entry/book references, never every book the user owns. Complete references are cached separately from the current activation subset and from the tracker prompt's lore budget. Loading a catalog does not send its entire contents to the model. A partial nonempty catalog triggers background hydration, so it no longer permanently puts documented known spells under Other.

The original `limit:200` one-page fallback and 800-entry cutoff could truncate the supplied 1,432-entry card. A regression fixture preserves the original positions of 113 spell entries and recreates non-spell rows for pagination. It checks all canonical spell headers plus the specific screenshot names Ice Blade, Ice Smash and Rock Bullet. Fan/non-canon labels still follow the source card; a catalog entry or eligible rank does not automatically grant a spell.

Run:

```sh
node --check dist/backend.js
node --check dist/frontend.js
node tools/test_six_sided_compat.cjs
node tools/test_panel_tracking.cjs
node tools/test_2_8_1_panel_parity.cjs
node tools/test_reading_and_magic.cjs
```

The original demo-panel parity fixture permits only the intended Mushoku absolute calendar-clock correction. The reading regression checks one ordinary model call with no evidence instructions, local rereads, preservation of data without quotes, eight reference pages, cache reuse and source-world isolation.

This fixes demonstrated code paths; a successful local test does not guarantee that a model reads every RP fact correctly. The former 34% figure measured local panel payload computation, excluded model waiting, and is not a claim about the restored 2.8.1 refresh workflow. Live refresh time still depends on the chosen provider, history depth, enabled systems and lore retrieval.

## 2.8.10 state migration and tests

Automatic story/fight spell caches from older releases no longer grant Known by themselves. Active-swipe learning/mastery reports establish those spells; manually granted spells remain. A discarded swipe therefore cannot leave a permanent automatic grant. Forget also suppresses older mastery, while later learning or mastery restores the spell. No chat restart is needed.

Run all five suites: `test_six_sided_compat.cjs`, `test_panel_tracking.cjs`, `test_2_8_1_panel_parity.cjs`, `test_reading_and_magic.cjs`, and `test_six_sided_repairs.cjs` under `tools/`. The repair suite uses the supplied card's exact canon-clock entry. Original demo-panel parity allows only the intended Mushoku calendar and observed-Atlas corrections. These deterministic tests verify data handling, not perfect interpretation of every live model response or a total-refresh speed percentage.

## 2.8.11 startup hotfix

2.8.10 omitted the Saga arc list and could crash the populated panel render. 2.8.11 restores that payload field and guards the renderer against an incomplete list. Run `node tools/test_startup_and_render.cjs` in addition to the five data suites. This executes backend startup and frontend setup/render with actual backend payloads using a minimal DOM test harness; it covers both Mushoku HUDs and recovery from a missing arc list.

## 2.8.13 Atlas prose references

Atlas uses the complete reference catalog for Mushoku, rather than the activated subset. It reads Six-Sided entries categorized as geography/locations/landmarks/nations whose first sentence describes a place. It excludes organizations and weather, preserves summaries, and links only explicitly stated parents; unresolved places remain separate roots. This is a lorebook reference map plus observed HUD paths, not a visited-place or player-knowledge ledger. Run `node tools/test_atlas_references.cjs` for the supplied card geography fixture, eight-page hydration, duplicate handling, cache retention and world isolation.

## 2.8.14 Calamity timeline filtering

The supplied card mixes intact locations with post-Calamity variants. Atlas now filters the three explicit Calamity ruin entries and future destruction sentences using the current HUD and active-swipe event ledger. K417 Month 2/countdowns keep the intact references; a later date alone does not activate ruins. An occurred report or an explicit completed event in the HUD establishes the aftermath. Prevented or changed events do not force canonical destruction. The frontend version changes with the outcome and history cannot repopulate incompatible settlement states. This targets the supplied Calamity variants; it is not a general semantic timeline interpreter for every historical sentence in arbitrary lorebooks.

## 2.8.15 aliases and ports

Dedicated spell-entry keywords can supply alternate names when they uniquely identify one spell. General school/magic/variation keywords and ambiguous aliases do not grant catalog spells; canonical names remain authoritative. Existing saved alias names are resolved for display and controls without rewriting message reports. Explicit formatting duplicates are merged, giving 111 catalog names from the supplied book's 81 dedicated spell entries plus other definitions/indexes. Run `node tools/test_spell_aliases.cjs` for study, progress, mastery, manual controls, forgetting, relearning, swipe reversal and world isolation.

Atlas splits the supplied grouped port entries into East Port, West Port and Zant Port, using their explicitly stated continents. Heaven Continent Skyport is read as an access point. None of these references establish player visits or knowledge. The prior Calamity filters remain in effect.

## 2.8.16 general reconciliation

Explicit player-owned Known Spells lists in active assistant replies establish existing spell knowledge independently of the tracker delta. The local reader recognizes supported English Markdown headings and list/tier formats; it does not interpret arbitrary prose as a spell grant. General catalogs, other actors, negative/untrained sections and quoted/code examples are excluded. The list supplies names only: it cannot assign mastery or override catalog ranks. Existing manual Forget suppresses repeated lists until an actual later learning report restores the spell. Edits and swipes invalidate exact-text cached reads.

Agenda supports in_progress for ongoing activities and distinguishes that state from due-soon, overdue and completed outcomes. It can reconcile legacy open entries against matching explicit activity cues in current plot/NPC-activity reports. Shared participants/location alone, future/conditional plans and clock passage do not establish a start. Manual overrides and reported completion remain authoritative. Run `node tools/test_general_tracking.cjs` alongside the eight existing suites. These changes apply across supported chats rather than to one character/export.
