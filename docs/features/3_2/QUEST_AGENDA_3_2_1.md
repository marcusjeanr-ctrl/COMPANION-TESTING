# 3.2.1 RC — quest disclosures and Agenda investigation

Branch `feature/collapse-completed-quests`, baseline main `2231a23`.
Version references are synchronized to 3.2.1 RC. No merge, publication or tag change has occurred. None of this has
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

The user approved a strictly display-only date path after these findings were
reported. The resolver, `agendaRead`, `agendaRequest`, dueAt/dueIn values, stored
Agenda records and report schema remain unchanged.

## Task 2 — display implementation

`hmsAgendaPanel` has an explicit UI-only flag, enabled only in state payload
projections. For unresolved open items it uses the existing source-position index
to copy an unambiguous raw `due` reference as optional `displayDueDate`. It does
not rescan chat history, parse a time, alter a deadline or write data. The default
projection used by `agendaRequest` omits this reference and remains unchanged.
An ambiguous/missing current-source match supplies no new evidence.

One frontend `agendaDisplayTiming` helper supplies group and row timing. Numeric
values use `appointmentDelta`: late below -60 minutes, soon through 180, otherwise
upcoming. If both numeric deadline fields are absent, a strict date-only reference
can instead be compared by calendar day: future Coming up, today Soon, past Late.
The literal saved wording remains the row text. Known K dates and explicit ISO
Date/Calendar HUD dates are comparable within their own calendar; invalid dates,
calendar mismatches and missing current dates remain No set time. No hour or
minute is assigned. In-progress and terminal appointments retain their old rows
and groups. Group order, titles, actions and the Done disclosure are unchanged.

Input Agenda objects stay untouched: render-time rows are copies. Badges, alarm
styling and clock-warning visibility use the same display projection. No new user
strings, model requests, timers, polling, settings or dependencies are introduced.

## Verification and merge conditions

Focused tests cover numeric thresholds, missing backend clock with available UI
clock, day-only future/today/past, invalid/no date, missing wording, calendar
mismatch, non-open preservation and unchanged inputs. Default model projections
and report/instruction output match the protected baseline; the same invariant
passes with the actual private export, without metadata or file writes.

The combined private browser check confirms Depart for Greyrat meeting under
Coming up with exactly In two days, Completed (1) containing The Prodigy's Meeting,
and The Greyrat Connection still active. Public synthetic regressions remain in
CI; the private export is supplied locally and never committed.

Full suite, visibility and the 20-pair revised gate follow on the combined source.
An inconclusive or failed gate forbids merging for this task. The PR uses a regular
merge only; no squash, rebase or tag modification. No live Lumiverse verification.

## Combined local checks before the gate

Translation embedding (2,728 keys/language), release identity, both syntax checks,
**63 JS suites + 12 gate tests**, **54 Chromium UI cases + 5 visibility cases**
pass. All local browser cases include the supplied private fixture; CI will skip
that private-only case and run the public synthetic equivalents. No private
export is committed. Standard prompt sizes remain **15,291 / 19,213 characters**.
Pipeline smoke: parse 0.6436 ms, response processing 0.9057 ms, prompt construction
0.4131 ms; zero warnings. These independent smoke timings are not a performance gate.
The resolver, read function and model request body are byte-unchanged; actual
private-export model hints match baseline, and replay makes no writes. Acceptance
and frozen runtime hashes: [validation](QUEST_AGENDA_3_2_1_VALIDATION.json).

## Combined 20-pair gate

Frozen main `2231a23`; historical `540df20` is informational. Candidate was the
frozen combined worktree, with runtime hashes checked before and after.
[All statistics](QUEST_AGENDA_3_2_1_GATE.json), [lossless raw records](QUEST_AGENDA_3_2_1_GATE_RAW.json.gz).

| Messages | Metric | Main → candidate median ms | Change | Baseline / candidate IQR | Baseline / candidate spread |
| --- | --- | --- | --- | --- | --- |
| 600 | cold wall | 246.00 → 251.12 | +2.08% | 19.40 / 35.11 | 101.97 / 260.39 |
| 600 | cold CPU | 284.59 → 287.96 | +1.18% | 24.14 / 43.71 | 91.12 / 294.56 |
| 600 | warm wall | 65.07 → 67.79 | +4.18% | 8.57 / 8.82 | 25.92 / 28.55 |
| 600 | warm CPU | 136.56 → 139.70 | +2.30% | 17.96 / 21.05 | 54.93 / 60.69 |
| 2000 | cold wall | 574.54 → 583.04 | +1.48% | 57.46 / 58.11 | 201.88 / 251.24 |
| 2000 | cold CPU | 712.59 → 723.80 | +1.57% | 56.28 / 62.07 | 192.96 / 284.36 |
| 2000 | warm wall | 159.80 → 157.22 | -1.61% | 11.05 / 12.45 | 47.99 / 74.51 |
| 2000 | warm CPU | 229.91 → 228.48 | -0.62% | 23.41 / 37.43 | 84.48 / 129.19 |

| 2,000 warm comparison | Wall | CPU | Assessment |
| --- | --- | --- | --- |
| baseline_to_candidate | -1.61% | -0.62% | pass |
| reference_to_baseline | -3.66% | -1.79% | pass (informational) |
| reference_to_candidate | -5.21% | -2.40% | pass (informational) |

**Combined gate: PASS.** For this task only a PASS permits merging;
inconclusive also blocks it. All 120 fresh-process observations are retained.
Shared-host scheduling is uncontrolled; these are backend projection measurements,
not live WebView/provider latency. None of this was tested in live Lumiverse.

## CI browser synchronization follow-up

One initial GitHub browser job failed the existing relationship-web lazy-render
assertion while the other job passed on identical source. The test clicked a
disclosure closed and replaced its payload before the native `toggle` handler
had recorded the closed session state. The test now waits for that close event
before replacement; the zero-SVG assertion and all graph bounds remain intact.
This follow-up changes only the browser test and this report. Runtime hashes and
the combined performance-gate candidate remain unchanged.
