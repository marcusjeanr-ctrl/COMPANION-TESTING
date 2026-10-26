# Companion 2.8.18 — updated Six-Sided World integration

## Sources and boundaries

Baseline: the supplied **Companion-main (3).zip**, manifest 2.8.17. Its backend and frontend matched repository commit `6e122036b4ce4de466d9829c32a41fbe6623727f` byte for byte before editing.

Target: the attached **Mushoku Tensei RPG - Six-Sided World.json**, 1,296 entries in each mirrored embedded book. The integration fixture uses the primary book once, not both copies. Original card SHA-256: `df2fd8b90c1f8ee1bac2a054dd7acb60d165555022a7e8c59e34d149d84a69d7`. The card is unchanged. The compressed test fixture retains the actual entries and Visual template; no old compatible card was substituted.

Existing identifier, settings/save versions, manual actions, locks, permissions, transport and Reporter preset remain unchanged. There are no corrective model calls, mandatory quotations or new spell prerequisite engine.

## Implemented behavior

### HUDs and modifiers

- Both WORLD STATE headers normalize to the same gameplay representation. Visual icons/bold labels, field middots, location bolding, Era / Arc label and decorative dividers are read without modifying the saved story text. A standalone `***` still terminates the HUD.
- Field middots are interpreted at recognized HUD field boundaries. Equipment description punctuation/Markdown and Present-name separators remain literal. Narration and dialogue are not globally normalized. Active Paths/checkpoint indentation remains available.
- Shown/True, named/numbered months, birth/birthday data, room hierarchy, modes, school/style ranks, optional pools, countdowns and narrative mode keep their prior readers. Original four-world panel parity still passes.
- Existing pin/repair paths preserve unchanged raw lines, Visual labels/icons and dividers. A duplicate Reporter Classic header preceding a Visual header keeps the Visual choice.
- Plain, bracketed and Visual CURSE, BLESSING, CURSE / BLESSING, DEMON EYE and SOUL TETHER forms feed the existing ability groups when present on a Mushoku HUD. Literal names/details and tether partners remain visible; equivalent modifiers deduplicate. Arbitrary bracketed lines do not grant abilities.
- A Turning Point marker/countdown does not generate an event ledger outcome, injury, relationship or objective. State still requires an actual report; the code does not independently prove semantic truth in model reports.

### Spells and references

Qualified `Chant (...)` and `Incantation (...)` labels are accepted. Complete chant text is retained, with outer quotation marks and trailing LN citations separated from the chant; qualifiers/citations are displayed as source metadata. Existing descriptions retain their prior clipping behavior. Fan labels remain visible for known spells too.

| Full updated-book check | Result |
|---|---:|
| Entries read | 1,296 |
| Dedicated spell headers | 81 |
| Distinct catalog identities | 111 |
| Chants extracted | 25 |
| Qualified chant entries | 3 |
| Atlas reference nodes before temporal filtering | 57 |
| Actual source arc headers | 22 |
| Dated arc/start-point schedule rows | 64 |

The three qualified chants are Healing, X-Healing and Illusion Barrier. The long Illusion Barrier chant is no longer cut to 200 characters. Waterfall's unstated rank remains unknown. Quagmire remains Melded. Existing aliases, unique/fan classifications and learning/mastery/Forget/relearning tests pass.

Seven 200-entry API pages load the complete attached book; subsequent reads reuse the full catalog. Changing attached-book identity does not reuse the old catalog. No numeric entry-position lookup was added. Arc 5's source-derived K419 date is checked against the built-in K420 fallback to verify real source extraction, not just a fallback count. Vast mana reference text is verified from the actual book.

Atlas links still require explicit containment and unique aliases. Organizations are not generally turned into places, and the existing pre-Calamity filter excludes Roa Ruins. The node count is extraction coverage, not proof that every place in arbitrary prose has been mapped. Lorebook references, later character biographies, eventual gear and relationships do not automatically grant possessions, participation or knowledge.

### Request purpose and actual transport

The ordinary assembled-prompt interceptor adds one scoped purpose block for this card's story, help, Save or Continue operation. It preserves genuine Reporter/Minds slots; quoted history markers do not suppress the purpose block. Story requests reinforce the selected WORLD STATE style, avoid a second generic HUD and do not request printed internal reasoning. Save/Continue do not receive ordinary gameplay side-panel requests.

Direct extension calls use `quietCall` with explicit auxiliary calculation, help or summary scope on the actual `messages` sent to the provider. This does not assume quiet calls receive the card, or that they pass through the story interceptor. Their existing final schema/wrapper request stays last. Required narrative fields inside calculation JSON remain allowed; standalone gameplay HUD/prose is not requested. No new host API is introduced.

These instructions communicate purpose; they do not establish stronger precedence than Lumiverse or the provider actually supports. Whether a particular model follows them against competing card instructions remains a live check.

### Save and Continue

`Mushoku_Save` and `[SAVE GAME]` are recognized as commands at the start of the user's turn, not when merely mentioned/quoted. Their responses are read-only utilities. Save preserves the previous gameplay HUD/panels and does not call the tracker, save new tracker metadata or derive transactions from its recap. Generic fenced/blockquote/HTML-code HUD examples are excluded from gameplay discovery.

`Mushoku_Continue_Handler` selects the supplied current HUD before SAVE NOTES/quoted recent-message history. Both fenced save HUDs and direct Classic/Visual HUDs are supported. The current state's date/style takes priority over old HUDs in the pasted history. Missing-HUD and HUD-only continuation instructions follow the card's actual protocol; no extra setup prompt is added by Companion.

**The first Continue response is a restoration baseline.** Its HUD is read, but transactional side-panel deltas are not ingested or refreshed from the recap. This intentionally avoids replaying old income/acquisitions/learning/injuries/milestones/objectives. New transactional tracking resumes on the next ordinary gameplay reply. Any genuinely new transaction written into that first restoration response is also outside that initial delta read. Existing manual state and locks are preserved.

This is card-level continuation, not a Companion-state importer. HUD mechanics and the narrative resume point can be restored; a narrative save does not restore unexported Companion metadata, manual ledgers, hidden Minds structures or Memory Cortex. Known-spell notes are not silently imported as new learning. Use existing native save/import mechanisms when that separate data needs transferring.

## Validation

`node tools/run_tests.cjs` runs all eleven suites plus both bundle syntax checks. All pass, including the ten new updated-card test groups and the 23 universal integrity groups retained from 2.8.17. Actual-template tests compare Classic/Visual systems and Mushoku world data, preserving prose and raw style. Tests also cover Visual pins/dividers, modifiers, birthdays/rollover/countdowns, real chants/catalog/arcs/Atlas, Save non-duplication, Continue/manual-state preservation, quote/code exclusion, pagination/isolation and deterministic provider request construction.

Earlier suites retain coverage of classic tracking, Together/Separate activation, stale asynchronous results, edits/swipes/regeneration, save failure/recovery, aliases, progression and original supported-world panels. The extracted installable archive is checked with the same runner. Test APIs/provider responses and the frontend DOM are mocked; there are no live generation claims.

**Live checks unperformed:** Lumiverse Classic generation, Visual generation, OOC help, provider tracker refresh, Save and Continue, including real Android layout. No live Lumiverse session was available. Model interpretation, custom instruction conflicts and unsupported prose layouts remain subject to real-session validation. The previous release's documented legacy-provenance, external Cortex rollback and multi-process write limits remain.

## Updating

Update the existing Companion repository installation, or extract the ZIP's `rpg_companion_hms/` directory and use the existing local-extension import/update workflow. Keep the same extension identifier and saved chats. Reload the extension/reopen the panel to load the new bundles; no chat restart or card replacement is needed.

Read again can display existing Classic/Visual gameplay HUDs locally. Refresh is only needed when you want a new tracker read for an ordinary gameplay reply; it uses the configured model connection. Save/initial Continue utilities deliberately do not replay tracker deltas. The complete validation output is included in `tools/VALIDATION_2_8_18.txt`.
