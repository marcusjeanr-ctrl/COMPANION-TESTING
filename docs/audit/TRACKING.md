# Tracking integrity investigation

## Minds and Internal States

The real-bundle path is `buildCompanionInstruction` / `parseCompanion` →
`setSwipeData` → `getSwipeData` → `simFold` / panel payload → frontend state;
message-attached panels use `statesFill` / `getStatesFor` / `statesPanelHtml`.
`test_panel_tracking.cjs` exercises report generation through metadata writes and
state synchronization; `test_startup_and_render.cjs` boots backend and frontend;
`test_internal_states_export_2_9_5.cjs` exercises exported metadata and HTML.
These tests use a mock host/provider, not a live model or browser DOM.

Current retrieval checks live `metadata.rpg_companion`, exported
`extra.spindle_metadata.rpg_companion`, then nested
`metadata.spindle_metadata.rpg_companion`. Each candidate selects the active swipe
and rejects a present mismatched source fingerprint. A stale live candidate does
not mask a valid exported candidate. Legacy entries without fingerprints remain
readable: stale protection cannot retroactively authenticate their source. Writes
serialize per message, re-fetch and verify content/swipe before committing and
advance UI caches only after a successful write. Existing tests cover equal-length
edits, swipes, deletion, hidden messages, regeneration, failures and concurrency.

The supplied export passes the real-bundle read/fold/HTML checks: 3 Minds and
9 pairs reconcile, with 2 Minds in the last report. The pasted diagnostic reports
valid live metadata, 2 Minds in the last report and 3 folded Minds; these counts
are consistent because one is per reply and one is accumulated. It contains no
recent problems. This is user-supplied observation, not a fresh live validation.
The export is unchanged byte-for-byte after replay and is not committed.

## Agenda and Quests

`agendaRead` derives identity from activity plus compatible participants, location
and schedule, with unique-match selection. The 2.9.7 change anchors the activity
before appended conditions and permits same-day 'now' refinement of before/by/
until windows. Existing tests cover breakfast details, sword-drill conditions,
time refinement, different activities and locations; reconciliation suites cover
different participants and schedules. The supplied replay produces 5 Agenda items.
This count alone does not prove semantic correctness of every record.

`questMatch` / `questUnique` use objective/context with conservative ownership and
location checks. The Roa Bargain (unreadable sword cut), Visit (permission/letter),
Journey (permission plus preparation), and Friendship (meeting Rudeus) share a
storyline but impose distinct actions. Existing synthetic tests preserve all four
plus the mana measurement quest; the supplied export yields 5 quest records.
No data was merged or removed to make the result pass. NPC `agendas` are folded
in Minds and remain distinct from scheduled player `agenda`.

## Other safeguards and open risks

Existing suites exercise ownership vs permission, pending gifts, spells vs study,
manual forget/relearn, uncertain numbers, secret owners and knowledge vectors,
family retention, source-bound chapters, temporal Atlas and Save/Continue isolation.
No new critical tracking regression was demonstrated by this audit. This is not a
proof of absence: free-text activity anchoring may overmatch appended text that
actually changes identity, unspecified context remains ambiguous, and legacy
unsigned records cannot be fully validated after edits. These warrant targeted
reproductions before any gameplay patch. No speculative fixes were made.

Full primary card files were not supplied as separate inputs. Current tests cover
six HUD examples across five card formats plus Undertale/Dark Souls/Skyrim
recognition; they do not certify every lorebook, prompt, gameplay mode or live card.
The old runner's wording 'supplied cards' overstates what this run demonstrates.
