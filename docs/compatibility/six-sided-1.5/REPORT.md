# Six-Sided pairing — Companion 1.5.0 RC

Base: `release/1.4.0`, commit `8bd03d4`. Issue: #59.

## Deliverables and installation

- `cards/six-sided/character.json`: Character Card V3, bot only, revision 1.5.0.
- `cards/six-sided/lorebook.json.gz`: losslessly compressed standalone book, 1,017 original entries plus one
  constant compatibility contract. Both ST and originalData representations agree.
- `spindle.json` and runtime bundles: extension 1.5.0 RC, unchanged identifier
  `rpg_companion_hms`, minimum Lumiverse 1.2.0 and existing permissions.

The release packager expands the compressed book to `cards/six-sided/lorebook.json`, byte-for-byte identical to the tested source. Source-checkout tests read the gzip directly.

Import the character and book separately, attach the book once to the character,
and update the extension. Do not attach both an old and new copy of this same book.
Continue an existing campaign with its actual state or supplied save. No restart,
saved-data migration, reset, or automatic ability grant is introduced. This card
supports Classic and Visual. Older cards retain their Compact/Panel support.

The contract is read from the card's assembled system context/preset macro and,
after reload, from its attached book. It is chat-scoped and bounded in memory.
It adds no API/model calls, polling, saved fields or recurring injected request.
Explicit user pins still apply. Remove an obsolete pin if it intentionally locks
a value that the campaign has since changed.

## Confirmed conflicts and changes

The new card explicitly gives the narrator authority over current facts and
allows established conventions, corrected dates, unknown birthdays, natural
progression, conditional canon outcomes and real mode changes. The older
Companion enforced a different card's rules. Under this explicit contract only,
the legacy automatic age/label/order/session repairs, speculative card-rule
warnings and dropped/reverted-line carry reminders stand down. This prevents
renaming Inventory into Equipment or Injuries into Condition, forcing 60-session
training, refilling mana after sleep, resurrecting cleared optional state,
forcing a past canon event to happen, or restoring a deliberately changed mode.
Current HUD data, tracking reports, manual corrections, user pins, quests,
inventory, appointments, Minds and persistence continue through existing readers.

Additional parser fixes were reproduced before editing:

- Conditions following `Injuries: ... | Condition: ...` were absent from the
  condition panel. Both labels now remain readable in Classic and Visual.
- `Injuries: None` was treated as a named wound. Explicit empty values now clear it.
- The first eye/curse on a joined row swallowed the following field. Values stop
  at the next field boundary; multiple eyes and separate blessings remain distinct.
- Visual `[STATUS: Deceased]`/ending flags with a leading icon were missed.
- Bare guild ranks and the book's established exceptional SS rank were not read.
- ST `disable: true` entries could enter the reference catalog. They are excluded.

The original 1,017 lore contents, keys, secondary keys and enabled states are
preserved. Entries with scoped regex keys receive host-only supplemental-injection
metadata: Companion does not independently reactivate them from a broad fallback
keyword. This does not change their host activation keys or recursion settings.
Host matching itself still belongs to Lumiverse; compilation is not live matching
certification.

## System mapping and verification boundaries

The complete [inventory](inventory.json) names every entry, enabled state,
activation counts, content hash, owner, processing route and coverage boundary.
It distinguishes generic reader checks from live semantic acceptance; no entry is
called fully tested solely because it exists or its regex compiles.

| Card/lore output or transition | Companion route | Evidence / boundary |
| --- | --- | --- |
| Single HUD, Classic/Visual, date, location, identity, route | findHud → parseHud → hmsProcessContent → panel | Actual paired-file suite; response text preserved |
| Mana, reserve, status, Touki, schools, styles, casting | World/Abilities readers; narrator owns costs and recovery | Joined-field and full panel tests; no forced replenishment |
| Eyes, curses, blessings, contracts, academy, stance | World/Abilities and generic HUD | Multiple-eye/mark tests; actual activation remains host-owned |
| Injuries, concurrent conditions, treatment, empty state | hmsReadWounds / hmsReadConditions | Both styles, treated wound, clearing and no synthetic None wound |
| Player death / object destruction | HUD flags; narrator owns ending | Visual ending-flag test; no automatic resurrection |
| Training / learned / studying | Explicit HUD/report evidence; existing spell/technique readers | Actual contract blocks legacy session math; legacy suites retained |
| Equipment / inventory / purse / adventurer / party / clan | HUD, Gear, Money, World and report readers | Actual panel; bare/SS rank; transaction safeguards in lifecycle suite |
| NPC dossiers, beliefs, relationships and secrets | People/Minds/relations/knowledge | Existing tracking/lifecycle suites; lore alone grants no knowledge |
| Geography, monsters, races, institutions, economy | Atlas/reference catalogs and narrative context | All entries inventoried; world simulation remains narrator-owned |
| Premises, agency, modes, start handlers | Bot setup and host activation; display current state | No legacy forced-mode warnings; model compliance is not deterministic |
| Arcs, scenes, memories, canon ledger, event clocks | HUD, saga/reference, quests and Chronicle | Conditional event regression; reference dates do not force outcomes |
| Save/continue, OOC, swipes and regeneration | Existing purpose/source-bound persistence | Lifecycle and carry-over suites; real host reload pending |
| Optional immersive/D&D modules | Existing user-selected extension features | Unchanged; selecting these features is an additional gameplay choice |

## Validation

- New defects reproduced on the 1.4.0 baseline before fixes.
- `node tools/run_tests.cjs`: all 13 groups passed locally, including the paired
  artifact suite, legacy cards, Cyberpunk, lifecycle, carry-over and mock frontend.
- Local runtime: Node 24.22.1. GitHub validation uses Node 22.
- [Alternating benchmark](performance.json): real paired lore, reply processing
  plus reporter-request construction, 6 rounds × 20 iterations per build.
  Median baseline 1.231 ms; candidate 0.975 ms. This is mock-host CPU work, not
  model, storage or WebView latency. No performance regression measured here.
- Actual browser test attempted. Chromium was absent; the download returned
  invalid archives. Browser layout checks did not run successfully.
- No live Lumiverse session or provider was available for importing, updating,
  activating this book, playing representative scenes, or reloading saved data.

Release classification remains **RC**. Stable acceptance requires real import and
update, Classic/Visual display, attached-book activation, actual narrator/reporter
turns, save/continue, reload persistence and representative combat/progression/
condition/quest scenes. Passing automated tests does not guarantee every model
response or certify the host's import behavior. No stable tag is claimed.
