# Agenda maintenance — 2.9.11 RC

Baseline: COMPANION-TESTING main `120189658fc71ac87cdb5e7e17aac52ea45b5f72`
(2.9.10 RC). Only targeted Agenda reconciliation and release identity change.
Original Companion remains untouched. Private input stays outside Git/package.

## Confirmed causes

The supplied 13-message export reproduces the screenshot without any saved-data
mutation: the baseline derives eight cards, including duplicate training, breakfast
and visit entries. Final replay derives four commitments: one missed, one kept and
two open. The stale in-progress visit is absent; Done contains two entries.

1. **Vague time wording split one occurrence.** Exact clock conflicts and textual
   schedule compatibility were conservative, but did not recognize same-day broad/
   narrow labels such as morning versus first light, or an omitted appended
   condition. This produced three records for one training appointment and two for
   one meal. Add guarded cross-report refinement on the same confirmed calendar
   day. Different exact times, days, explicit early/late windows and distinguishing
   conditions stay separate. A broad ambiguous update never chooses among sessions
   or manufactures a new occurrence. Source reports remain available unchanged.
2. **A doorway detail split a completed visit.** Location matching required exact
   strings, so study versus study doorway created separate active/completed cards.
   Permit only named-room doorway/threshold/entrance refinements across reports.
   Other rooms, annexes and participants remain distinct. Multiple appointments
   explicitly listed in the same report do not use the new soft refinements.
3. **Pending status overwrote established progress/completion.** Once a row matched,
   a generic open report could replace missed/kept/cancelled or in-progress status.
   Retain those established statuses for the same occurrence rather than reopening
   it from a repeated pending report. Explicit moves, current manual corrections,
   terminal-state corrections and new-day occurrences retain their paths. Repeated
   reports do not add duplicate transition history; original keys remain stable.

`agendaRead`, `agendaScheduleCompatible` and `agendaReportedState` contain the
changes, supported by small Agenda-only place/period helpers. Parsing, extraction,
metadata readers/writers, rendering design and all other tracking domains are
unchanged. The frontend changes only drawer/popout version strings.

## Regression evidence

- New targeted suite against baseline: **2/7 groups pass**, with failures for
  repeated schedule wording, doorway/condition refinement, status regression,
  ambiguous matching and actual-export card count. Against candidate: **7/7 pass**
  including private export; six synthetic groups run in public CI.
- Entire runner: **27 suites plus both bundle syntax checks pass**. Existing world/
  card fixtures, source/swipe integrity, Save/Continue, Internal States, family,
  quest/reward history, recovery, visibility and historical rebuild safety pass.
- Existing Chromium suites: **14/14 pass**. Additional local real-Chromium replay
  using this private export confirms four Agenda rows, one kept, one missed, zero
  in-progress and Done (2). That private replay is not claimed as a hosted CI test.
- Tests retain different participants/rooms/exact times/days, early versus late
  sessions, distinct before/after conditions, two explicitly listed appointments,
  ambiguous updates, manual corrections, explicit moves, later occurrences,
  source edits/swipes and the separation of scheduled Agenda from NPC routines.
- The export file remains byte-identical, and folding does not mutate its records.
  No tracking migration, rewrite, deletion, extra scan or extraction request occurs.

## Performance and resource checks

Node 22.22.2, same cloud host, identical fixtures. Five alternating baseline/candidate
panel rounds at 600/2,000 messages with source-bound reports; each first read is
followed by three warmups and ten samples. Three alternating pipeline and explicit-GC
VM heap rounds. No network, model generation or actual host disk latency included.
Raw results: [PERFORMANCE_2_9_11.json](PERFORMANCE_2_9_11.json).

| Operation | 2.9.10 | 2.9.11 |
|---|---:|---:|
| 600-message cold median | 155.22 ms | 155.63 ms |
| 600-message warm median | 43.18 ms | 42.40 ms |
| 2,000-message cold median | 333.53 ms | 331.21 ms |
| 2,000-message warm median | 67.94 ms | 68.81 ms |
| Parse report | 0.4196 ms | 0.4282 ms |
| Process response | 0.5436 ms | 0.5666 ms |
| Construct instruction | 0.2576 ms | 0.2733 ms |
| VM + 1,000-report retained heap | 11,833,536 bytes | 11,841,792 bytes |
| Additional states cache heap | 164,272 bytes | 164,272 bytes |

No material regression under the existing comparison tolerance of
`max(5% of baseline, 1 ms)` per timed operation. The larger warm panel difference is
+0.87 ms (1.3%); smaller timings vary by hundredths of a millisecond. Do not infer a
universal speedup or exact production latency from these cloud measurements. The
extra retained fixture heap is about 8 KiB, not growth per read or evidence of a leak.

Normal update counts are identical: one model call, six history fetches, one metadata
write, two storage reads, four storage writes and three payloads. Instrumented panel
history index accesses remain 9,101 with the same uncached traversal families. Empty/
populated fixture instructions remain 14,832/18,528 characters. Prompt text, polling,
caches, dependencies, storage shape, identifier, permissions, minimum host, presets
and unrelated UI/gameplay functions remain unchanged.

## Release gate and limits

Use the separate maintenance branch/PR. Require green hosted validation/browser CI,
verified package contents and uploaded/downloaded artifact hashes before publication.
Do not merge into the normal source-update branch or publish an empty release if
release/update verification remains blocked. The existing read-only validation
workflow performs testing/package checks; no automatic publisher is restored.

This remains an RC because no live Lumiverse instance is available. Actual client
installation/update/reload and complete card sessions are not certified. Remote
manifest/assets being reachable alone does not demonstrate a completed client update.
Ambiguous reports remain conservative; the new textual refinements are intentionally
narrow rather than an unrestricted natural-language matcher. Historical report
versions/documentation are not relabeled as the current release.
