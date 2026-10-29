# 3.0.5 RC — Agenda occurrence and quest stage continuity

Issue [#18](https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/issues/18).
Baseline: published 3.0.4 RC, `9a06fec02651bcd897f9a6d1af0a18d6e0dc5fd9`.
Candidate backend SHA-256:
`0580be9a0120dc4e9a489bc6b98f4114d9b20a325657832641e3ab2029a9a5ba`.

The preceding investigation compared 23 version-labelled snapshots beginning at
2.0/2.1, including supplied historical archives and eight exact published release
commits. Other later snapshots were explicitly version-introduction checkpoints.
Early quest reads discarded omitted history, and early Agenda matching collapsed
separate appointments. This patch retains the present architecture and safeguards.

The supplied screenshots show symptoms, not saved occurrence dates/source fields.
Their newer scenes are absent from the available exports. Reproductions below are
source-bound synthetic cases; they do not establish the exact cause of each pictured
row. No original Companion repository, card, preset or user save is modified.

## Confirmed causes and targeted changes

All runtime changes are in `dist/backend.js`:

1. **Clock rollover masquerades as another occurrence.** `agendaWhen` uses the
   shared future-deadline parser. Repeating 08:00 after 08:00 can therefore yield
   tomorrow, which `agendaScheduleCompatible` treats as another event. The fix
   leaves both parsers unchanged. `agendaBareClock` / `agendaRepeatedClock` reuse
   an existing occurrence's original deadline when its clock, participant/place,
   intended day and source context remain compatible. Explicit dates, another
   session, tomorrow/new-day cues and enumerated appointments prevent this reuse.
   Newly scheduled undated future clocks retain their previous interpretation.

2. **“Now” is recalculated every turn.** One active session reported at 08:00,
   08:10 and 08:20 previously produced three rows. `agendaContinuationCue` matches
   explicit local activity-continuation or same-occurrence outcome evidence;
   `agendaScheduleCompatible` still requires a unique compatible occurrence on
   the same day. `agendaRead` preserves its first key/deadline. Completion and
   repeated completion update that same row, and generic open reports retain
   established active/terminal states. A genuinely second session remains separate.
   A 120-report synthetic session now projects one row after JSON restoration.

3. **A parent place becomes a room.** `agendaPlaceCompatible` now permits a
   parent-to-room refinement only across separate reports whose source HUD paths
   both establish the same more specific place. Distinct rooms, wings, annexes,
   different source locations and separate snapshot appointments remain distinct.

4. **Current activity starts future appointments.** The final `agendaRead`
   activity loop could promote every matching open appointment, including one
   scheduled tomorrow. `agendaActivityState` now checks observation time/day
   before inferred starts; `agendaReportedState` rejects a contradictory future-day
   in-progress claim. Later same-day appointments remain pending under generic
   cues. Existing explicit early-start and before/by/until window behavior is
   preserved; automatic inference does not silently reschedule appointments.

5. **Both quest title and objective change.** `questMatch` intentionally rejects
   arbitrary prefix or storyline similarity. `questStageContinuation` adds a
   source-backed fallback within `questDetailsLatest`: a unique active quest,
   matching giver, compatible place/category and a narrowly related title must
   have explicitly named continuation plus stage/phase/step evidence in the source.
   Same-packet distinct entries, other quests, conflicting categories/givers/places,
   completed quests and ambiguous candidates do not merge. The original key and
   aliases survive; earlier objective/progress/state/reward/source information is
   retained in a bounded derived `stageHistory` preview (40 stages). Raw historical
   reports remain unchanged. A legitimate progress reset to zero stays zero.

`trackingContinuityLines` reads only the accepted current source, bounded to 24,000
characters; it removes HUD, private Companion blocks, reasoning, fences and
blockquote examples. `trackingContinuityAsserted` rejects hypothetical, questioned
and negated continuity. Copied continuation snapshots cannot supply new evidence.
The source is inspected lazily inside existing indexed folds; no additional full
chat traversal, model/API call, polling, data migration or write is introduced.

## Verification

- Release identity and syntax checks pass for 3.0.5 RC.
- All **46 regression suites** pass, including **26 new continuity groups**.
- All **24 browser UI + five visibility tests** pass against Chromium/mock host.
  A new browser case renders one continued Agenda row and quest card and verifies
  that the manual completion button still submits the retained stable key.
- Existing Six-Sided, Living World, other-card, Magic, ownership, saved-data,
  source/swipe, quest identity, rescheduling and terminal-history suites remain.
- Available 13-message export: Agenda 1 / quests 2 / family 5, unchanged.
  Available 15-message export: Agenda 1 / quests 3 / family 5, unchanged.
  Both inputs and in-memory tracking reports remain unchanged during replay.
- The existing mocked update pipeline retains: one model call, six chat fetches,
  one world-info activation lookup, one metadata update, two storage reads and
  four storage writes. These are total existing counts, not added calls.
- Empty/populated tracker prompt character counts are compared in the performance
  evidence; no extraction prompt or requested JSON schema was changed.

## Performance

Final measurements and methodology are recorded in
`agenda-quest-occurrence-evidence.json`. They use Node 22, the actual published
baseline and candidate bundles, full Six-Sided/Living fixtures, source-bound
2,000-message histories and two alternating comparison rounds. Each panel case
includes a cold call, three warmups and ten warm samples; pipeline timings use
the existing five-round benchmark. No concurrent regression/browser workload
runs during these measurements. Cloud/JIT/GC variance limits latency conclusions;
these are not Android, live Lumiverse or model-provider measurements.

| Card / history | Cold ms | Warm median ms | Warm round ranges ms |
| --- | --- | --- | --- |
| Six-Sided / 2,000 messages | 797.98 → 736.84 | 169.44 → 180.10 | 168.95–169.92 → 168.20–192.01 |
| Living World / 2,000 messages | 1517.32 → 1627.95 | 196.50 → 195.12 | 183.88–209.13 → 185.16–205.07 |

Response-processing median: 1.2563 → 1.0060 ms; prompt construction: 0.5838 →
0.4534 ms. Empty/populated prompts remain exactly 15,107 / 19,029 characters.
The Six-Sided warm median is 10.67 ms higher in these two rounds, with its second
round slightly faster; Living World is essentially flat. Earlier paired runs also
varied in direction. No across-the-board speedup or zero-overhead claim is made.
Device-level responsiveness remains unverified; calls, writes and prompt budgets
are unchanged. Before-fix reproductions pass only 10 of the 26 focused groups;
the candidate passes all 26.

## Limits and rollback

Source-confirmed rules remain conservative. Unrelated labels, unsupported languages
or wording, missing evidence, several compatible occurrences and same-packet
entries cannot be resolved by guessing. Honorific-only participant changes are
not broadly normalized; that still requires reliable established aliases. Initial
ambiguous bare times retain the old future-time convention. The latest screenshot
export and live Lumiverse/Android acceptance are unavailable. This release does
not claim every duplication or all narrator/extractor mistakes are resolved.

Old raw reports and metadata remain intact; projections are recomputed locally.
To roll back, reinstall the verified
[3.0.4 RC](https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/releases/tag/v3.0.4-rc.1)
from commit `9a06fec02651bcd897f9a6d1af0a18d6e0dc5fd9`. No save migration reversal
is needed. No old source assembly or reconstruction tool is used.
