# 3.0.7 RC — exact bell/clock Agenda follow-up

Baseline: published 3.0.6 RC, `c1fd7cac527f5437091acc1abd7878e681e13460`.
Issue: [#22](https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/issues/22).

## Reproduction and confirmed causes

The screenshot has a second identity difference besides its time labels:
`Veyrath Hall courtyard` versus `courtyard`. Before nine, 3.0.6 already merges
09:00 and “when the bell rings at nine” if the location strings are identical.
It reproduces two cards with the screenshot's short location: the contextual
location rule required at least two words, excluding the one-word room alias.

Two further failures are reproduced through the actual runtime. A vague appointment
refined to a bare 09:00 after nine rolls into tomorrow and fails its day comparison.
Also, Separate mode replaces the current reply's entire Agenda report: refreshing
that unchanged reply with a partial bell label erases its accepted explicit clock.
This can reappear even after a projection-only deduplication fix.

The existing fallback could also equate 09:00 with a *different* bell hour. The
new regression explicitly preserves ten/before/after/approximate alternatives.

## Targeted changes

- `agendaPlaceCompatible`: match a one-word terminal room alias to a fully qualified
  location when the short label's source HUD establishes that place or its venue.
  The appointment may be discussed indoors or agreed elsewhere; neither participant
  has to be standing in the courtyard yet. Different venues, missing location
  evidence, annexes and wings keep their existing safeguards.
- `agendaBellClock` / `agendaScheduleCompatible`: use a recognized bell hour as a
  matching constraint, without generating a due time/date from the bell phrase.
  Unknown/conditional bell descriptions cannot arbitrarily refine an exact clock.
- `agendaBellRollover` / `agendaRead`: anchor a matching later bare clock to the
  established same observed day only when the original observation preceded that
  clock, subject to new-occurrence/future guards (including “next bell”). Explicit
  dates, other days, unanchored late-night bells and new future occurrences remain
  authoritative.
- `agendaPlaceDetail` / `agendaRead`: retain the full location and explicit label
  when a matching report later supplies only its short location/bell wording.
- `agendaRefreshReport`: preserve accepted precision/details/status for a unique
  matching partial re-extraction of the **same validated source/swipe**. Both HMS
  and classic Separate mode use it through their Agenda assignment only. A newly
  supplied date cannot borrow an undated prior outcome. Empty reports and explicit
  moves retain their prior replacement semantics; different/ambiguous records are
  not forcibly matched. Promise/meeting labels do not split the same identity;
  duplicate observations use existing status rules and retain an established
  reschedule marker. Malformed legacy rows are ignored. No cross-message storage
  merge or data migration is added.

Source/swipe validation is unchanged. Existing saved duplicate reports reconcile
on normal reads without rewriting/deleting history. Legacy manual control aliases
continue to work. Original keys, terminal outcomes and their history remain intact.

## Verification

`tools/test_agenda_bell_refinement.cjs` reproduces the exact title, participant,
clock/bell labels and full/short locations in both orders. It covers extraction
packets, raw legacy metadata, restored JSON, original keys, detailed locations,
confirmed/unknown due times, status/history and old duplicate control keys.

The real Separate update/storage path is exercised repeatedly on one reply, plus
the actual automatic `GENERATION_ENDED` handler across three replies. Mock generation
counts are exactly one per requested update; no paid model tests are performed.
Additional cases cover non-HMS cards without a calendar, edited sources, swipes,
new dates, different places/people, recurrence and conflicting clock conditions.
The Chromium regression renders the exact screenshot fixture once and verifies
its existing completion button submits the retained key.

Final suite counts, hashes, unchanged calls and alternating before/after performance
measurements are recorded in [the verification data](agenda-bell-verification.json). Unrelated engines,
extraction prompts, model-call count, polling, UI layout and save schema are unchanged.

## Limits and rollback

The original live chat metadata was not supplied with this screenshot. These are
exact synthetic reproductions through shipped code and mock-host browser tests,
not live Lumiverse/Android certification. Unknown aliases and ambiguous scheduling
evidence remain conservative; no guarantee is made for every narrator paraphrase.
The helper does not invent AM/PM, recurrence instances or calendar dates.

Reinstall `v3.0.6-rc.1` or compare against the baseline commit above for rollback.
No data migration is required; preserve chat/settings backups when changing installed
versions. The original Companion repository remains untouched.
