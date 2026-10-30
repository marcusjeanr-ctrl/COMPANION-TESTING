# 3.0.6 RC: targeted universal Agenda reconciliation

Baseline: `ab863217c639ae86cd37233b645a1f113e3cd1c7` (published 3.0.5 RC).
Issue: [#20](https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/issues/20).

## Confirmed causes and targeted changes

All runtime changes are in Agenda functions in `dist/backend.js`. The shared date
parser, Quest/NPC/Magic/Inventory engines, extraction schema and prompts are unchanged.

- `agendaNormalize` discarded a later same-packet outcome because its identity
  fields matched an earlier pending row. It now discards only redundant repeated
  states, retaining transitions and corrections for the normal chronological fold.
- `agendaRead` compared participant strings literally and could split formatting,
  honorific/order and reordered-title variants. Agenda-only lexical keys normalize
  these forms. Reordered titles need nonempty matching participants and location;
  substantive target words, numbers, different names and locations remain distinct.
  The prior generic measurement/capacity refinement remains supported.
- `agendaScheduleCompatible` did not recognize equivalent bell wording. A small
  textual equivalence rule matches “when the bell rings at nine” and “at the nine
  o’clock bell”; it does **not** assign clock minutes or a calendar date. Existing
  exact-date/time parsing remains authoritative. Source-confirmed continued relative
  countdowns reuse their established deadline rather than restarting the countdown.
  Active same-appointment reports with an asserted “is underway”/“is in progress”
  also retain one occurrence; they do not require the literal word “continues”.
- Bare clocks on past outcome reports could roll into tomorrow, then collide with
  tomorrow's real recurring occurrence. Agenda-only anchoring keeps that outcome on
  its observed day and reconciles pending/outcome rows within one packet. Newly
  scheduled undated clocks retain existing future semantics; undated HUD-free chats
  never receive an invented date.
- Broad title-subset and comma-prefix matching could collapse different targets or
  ordinal occurrences. Matching retains those distinctions and before/after clock
  windows. Explicit separate-occurrence evidence is bounded to a relevant source
  sentence; unrelated, hypothetical, quoted/private examples cannot establish it.
- Duplicate saved reports and manual additions now fold into a single derived
  appointment when identity is unambiguous. Original reports and saved records are
  not rewritten or deleted. Stable original keys, historical transitions and prior
  duplicate control aliases preserve manual completion/removal; the latest anchored
  correction wins. Ambiguous aliases cannot choose a recurring occurrence.
- `agendaActivityState` no longer treats an NPC daily routine as evidence that the
  player's appointment started. It still accepts established current-scene activity
  and explicit Agenda reports. `agendaReportedState` rejects premature outcomes
  contradicted by source evidence that the appointment remains pending, while keeping
  legacy outcomes whose original narrative is unavailable. Time passing alone never
  completes, cancels or marks an appointment missed. Explicit early fulfillment,
  cancellation, rescheduling and manual corrections retain their existing paths.

## Verification and limits

`tools/test_universal_agenda_dedup.cjs` exercises the shipped parser/projection,
not a replacement matcher: duplicate extraction and correction order, reordered
titles, participants, punctuation, vague bell times, relative countdowns, restored
legacy reports/manual additions/control aliases, JSON reload/repeated processing,
recurring days, different targets/people/rooms/time windows, rescheduling, ambiguous
updates, premature outcomes, NPC routines, undated cards, source edits/swipes/hidden
messages, unchanged input and zero helper host/model/storage calls.

The browser regression renders the deduplicated appointment once, retains its
vague time and verifies the existing completion button submits its stable key.
See `agenda-3_0_6-verification.json` for exact check counts and comparative timings.

The patch is independent of card names/settings, with no new pipeline, model call,
poll, history pass, save migration or UI redesign. New aliases and identity flags
exist only in the derived projection. Source validation, stored history and manual
data remain intact. Existing saved duplicates are consolidated on the next normal
read; a previously lost extraction observation cannot be reconstructed.

This is conservative lexical reconciliation, not a guarantee of semantic identity
for every language or arbitrary narrator paraphrase. Unknown nicknames, absent
context, conflicting schedules and ambiguous candidates are not forcibly merged.
Recurring commitments require actual occurrence evidence; the patch does not
generate appointments from a recurring schedule. No new real duplicate export or
live Lumiverse instance was supplied. Mock-host/browser tests do not certify live
Android WebView, provider behavior or every campaign. Retain RC status.

## Rollback

Review/compare against `ab863217c639ae86cd37233b645a1f113e3cd1c7` or reinstall
the published `v3.0.5-rc.1` package. This patch performs no data migration; original
reports/manual records remain readable. Back up live chats/settings before changing
installed versions. Do not rewrite main history or modify the original Companion.
