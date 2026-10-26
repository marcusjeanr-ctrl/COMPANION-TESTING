# Agenda and stored tracking maintenance — 2.9.11 RC

Baseline: COMPANION-TESTING main `120189658fc71ac87cdb5e7e17aac52ea45b5f72`
(2.9.10 RC). Targeted Agenda, automatic report-text and knowledge-certainty fixes.
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
changes, supported by small Agenda-only place/period helpers. The additional fixes
below change only the named report fields/certainty guard. Core HUD extraction,
metadata storage contracts and rendering design remain. The frontend changes only
drawer/popout version strings.

## Additional export review and historical references

4. **Silent stored-text cuts are inherited and harmful.** All six reference builds
   reproduce the 60-character automatic bond/position-note limits. Those intentional
   bounds silently cut qualifiers mid-word. Use the existing word-boundary `reportText`
   helper at 240 characters for these two descriptive fields, visibly marking overflow.
   Integration tests verify the full text through the real metadata commit. Other
   text limits, identity keys, manual short labels and schemas remain. Relationship
   prompt reminders keep their old 60-character bound; normal fixture prompts do not
   grow. Previously discarded text cannot safely be reconstructed: existing saved
   strings are not rewritten or completed from guesswork.
5. **Indirect evidence was treated as certain.** Perch 2.1 and all supplied later
   references with the runnable knowledge helper reproduce this behavior (the 2.0
   helper is unavailable, not evidence of missing functionality). `simHowOf` groups
   evidence/deductions/clues; the certainty default and guard handled guesses/gossip
   but let indirect evidence become certain. Normalize this vector to at most partly;
   retain unsure/wrong and keep direct witnessed/named NPC-report vectors and source
   provenance distinct. A later direct report can confirm the same fact. Attached
   panels apply the same guard to legacy metadata without shortening the original
   fact text or rewriting history. No model call or narrative scan is added. A
   mislabeled model claim cannot be independently fact-checked by this local guard.
6. **Sparse 08:45 transaction: no confirmed data-loss defect.** Its source-bound HUD
   metadata is committed, while most extracted fields are null. Synthetic pipeline
   and actual-export prefix/full replays show earlier family, Agenda, relationships,
   knowledge and transactions remain available through the existing readers/folds.
   Sparse is not a reset. That path passes before and after and is unchanged. The
   export lacks provider/run-state logs: it cannot establish whether a separate
   tracker call was pending, returned no block or failed. Do not claim proof that
   every extraction succeeded, or introduce an unneeded model retry to fill nulls.

No older bundle is copied or reconstructed. Narrator-owned WORLD STATE formatting
and Present inaccuracies are excluded: no Companion cause was established and those
code paths are unchanged.

## Regression evidence

- New targeted suite against baseline: **2/7 groups pass**, with failures for
  repeated schedule wording, doorway/condition refinement, status regression,
  ambiguous matching and actual-export card count. Against candidate: **7/7 pass**
  including private export; six synthetic groups run in public CI.
- Entire runner: **28 suites plus both bundle syntax checks pass**. Existing world/
  card fixtures, source/swipe integrity, Save/Continue, Internal States, family,
  quest/reward history, recovery, visibility and historical rebuild safety pass.
- Existing Chromium suites: **14/14 pass**. Additional local real-Chromium replay
  using this private export confirms four Agenda rows, one kept, one missed, zero
  in-progress and Done (2). That private replay is not claimed as a hosted CI test.
- Tests retain different participants/rooms/exact times/days, early versus late
  sessions, distinct before/after conditions, two explicitly listed appointments,
  ambiguous updates, manual corrections, explicit moves, later occurrences,
  source edits/swipes and the separation of scheduled Agenda from NPC routines.
- Additional tracking suite: **5/5 groups pass** with the private export; four
  synthetic groups run in CI. Before these fixes it passes only 1/5 (the sparse
  pipeline path already works). Cover long stored bonds/notes through commit,
  explicit overflow, direct versus indirect vectors, legacy fold/HTML, confirmation
  provenance, unchanged legacy fact text and sparse transaction persistence.
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
| 600-message cold median | 156.10 ms | 155.52 ms |
| 600-message warm median | 43.24 ms | 43.15 ms |
| 2,000-message cold median | 334.52 ms | 338.86 ms |
| 2,000-message warm median | 71.38 ms | 69.68 ms |
| Parse report | 0.4344 ms | 0.4152 ms |
| Process response | 0.5996 ms | 0.5525 ms |
| Construct instruction | 0.2695 ms | 0.2647 ms |
| VM + 1,000-report retained heap | 11,833,696 bytes | 11,842,400 bytes |
| Additional states cache heap | 164,272 bytes | 164,272 bytes |

No material regression under the existing comparison tolerance of
`max(5% of baseline, 1 ms)` per timed operation. Warm reads are essentially unchanged at 600 messages and 1.70 ms lower at
2,000 messages; the larger cold median is 4.34 ms (1.3%) higher. Do not infer a
universal speedup or exact production latency from these cloud measurements. The
extra retained fixture heap is about 8 KiB, not growth per read or evidence of a leak.

Normal update counts are identical: one model call, six history fetches, one metadata
write, two storage reads, four storage writes and three payloads. Instrumented panel
history index accesses remain 9,101 with the same uncached traversal families. Empty/
populated fixture instructions remain 14,832/18,528 characters. Instruction text, polling, caches, dependencies, storage shape, identifier,
permissions, minimum host, presets and unrelated UI/gameplay functions remain.
Restored long text remains bounded in storage, with 60-character relationship
reminders in prompts; standard fixture instruction lengths are unchanged.

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
