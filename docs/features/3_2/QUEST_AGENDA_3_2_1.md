# Planned 3.2.1 — quest disclosures and Agenda investigation

Branch `feature/collapse-completed-quests`, baseline main `2231a23`.
No merge, publication, tag change or version bump has occurred. None of this has
been tested in a live Lumiverse instance.

## Task 1 — completed and ended disclosures

Display-only: `questDisplayGroups` moves the existing completed/ended membership
checks into a helper shared by the live card and Markdown sheet. It reads `state`
and `cls`; progress never determines completion. If inconsistent fields mark both
completion and another terminal state, the display groups the row once under
Completed without modifying the reported fields. All quests remain available to
`objectiveQuestLabel`, including those inside a closed section.

Native `details/summary`, the existing `simSubdet` helper, `rpgc-subdet` styling,
keyboard handling and `state.open` flags match Paid off. Lists are lazy; completed
status chips reuse `.rpgc-quest .st.done`. Active card markup/order and quest focus
controls are preserved. No setting, storage write, model hint or report change.
Two count templates are translated in all four dictionaries and embedded.

Focused checks pass: helper/sheet/immutable identity tests; six Chromium cases
cover zero/active/mixed/completed-only/failed/abandoned/closed, default closure,
keyboard toggles, session retention, done styling, objective chips, translations,
existing focus/chains and the private export. The supplied 37-message export has
one completed The Prodigy's Meeting and active The Greyrat Connection; the actual
browser places them in the required sections. Replay leaves input bytes and
messages unchanged and makes no writes. Private content is not committed; the
optional export test runs only when a local file path is explicitly supplied.
Fixture SHA-256: `eae442390d9e53fd5a25c36a8b28d77d73ba08fca57fc073badd5291f2a0d8af`.

## Task 2 — Step 1 findings, before changing Agenda

The supplied export reproduces the misleading grouping, but not the proposed
null-clock explanation: `agendaRead().now` and `hmsPanelState().systems.clock`
are both 216318795 (K417, Month 4, Day 12, 09:15). Depart for Greyrat meeting
has `dueAt=null`, `dueIn=null`, `status=unset`, and saved wording In two days.
`agendaWhen` requires an explicit clock for date-based appointments and leaves
this date-only deadline unresolved. The row shows the saved wording because no
numeric countdown exists. `hmsAgendaPanel` does not expose the raw date-only due
value. `agendaRequest` consumes this same panel and renders dueIn into model-facing
Agenda hints, so changing the backend deadline resolver would change those hints.
Grouping solely by the existing `appointmentDelta` therefore cannot move this
particular export item: its delta is null.

The user explicitly requires stopping if a root fix changes model-facing text.
No Agenda fix has been made. A separate display-only treatment for explicit,
time-unspecified dates needs a scope decision; it must preserve the original
wording and all hints, and must not invent an appointment hour. The combined
full-suite/visibility/20-pair gate will run once a compliant combined fix exists.
No merge is allowed while the combined fixture requirement remains unmet.
