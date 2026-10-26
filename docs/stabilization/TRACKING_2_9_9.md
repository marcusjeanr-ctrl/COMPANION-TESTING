# Tracking accuracy and continuation — 2.9.9 RC

Baseline: latest COMPANION-TESTING main fbfbd86 / 2.9.8 RC. Original Companion
repository remains read-only. This patch preserves existing architecture, prompts,
settings, permissions, identifier, UI design and stored metadata. The new private
17-message export is replayed locally only; it is not committed or packaged.

## Confirmed causes and changes

1. **Agenda duplicate / stale description.** The export repeats one mana-measurement
   appointment, then appends an em-dash condition. The older matcher did not
   recognize that suffix, and a matched record retained its first description.
   Recognize guarded conditional suffixes, update the description, and retain the
   first key. Context, schedule and unique-match guards remain. Explicit `moved`
   reports may update participants/location/time on an active occurrence; they do
   not rewrite completed occurrences. Different actors, places, times, recurring
   days and essential task suffixes remain separate. Scheduled `agenda` still
   does not read NPC `agendas`.
2. **Quest key changed after an otherwise valid rename.** Matching found the same
   objective/context, but copying the later row overwrote its key. Preserve the
   first key in reconciliation and duplicate collapse, keeping focus stable.
   Existing alias handling, rewards and source history remain. Latest numeric
   progress already supports lower values, including a next-stage reset to zero;
   no monotonic-progress clamp is added. The exported Roa Bargain (sword-cut
   condition), Visit (permission/letter), Journey (permission/preparation) and
   Friendship (meeting Rudeus) have distinct requirements and remain separate.
3. **Off-scene relative incorrectly moved into the active room.** The export
   correctly reports a relative leaving for the stables, but also repeats their
   relationship. Family reconciliation treated every relationship row as an
   in-person encounter, overwriting the reliable reported location. Use available
   scene membership and explicit family reports before inferring presence/location.
   Relationship cards use the same current-scene evidence. Omission is not death,
   deletion or movement; family/relationship records survive absence and reentry.
   Legacy empty character lists mean unspecified: preserve that fallback when no
   explicit family evidence exists, retaining the old four-world panel fixtures.
4. **Continuation data hidden by transaction isolation.** The first continuation
   reply has active-swipe metadata with a valid current-source fingerprint, but the
   blanket continuation filter excluded it from Internal States and passive facts.
   Opt-in reads now permit source-verified snapshots for Internal States, family,
   relationships, Agenda and quests. Default transaction readers still exclude
   continuation reports: receipts, XP, money and relative Minds deltas are not
   replayed. This restores the initial Roa Bargain record rather than dropping it.
5. **New inline continuation report ignored.** Continuation processing intentionally
   skips transaction extraction, so an available inline report could remain
   invisible without metadata. The existing render-cache fill can parse a complete,
   current trailing `<rpg_companion>` block locally for display. It performs no
   generation, metadata write or additional history traversal. Quoted/fenced blocks,
   missing data and rejected stored reports are not used to bypass provenance.

Diagnostics distinguish an available continuation snapshot from transaction selection and identify metadata versus current-inline display data. Unsigned snapshots have an explicit rejection reason; a displayed report no longer misleadingly reports zero selected data.

No tracking record is deleted or rewritten by reconciliation. Historical objective
stages and progress remain in source per-swipe metadata. The extension does not
invent a new historical record, migration or model instruction to force a merge.

## Regression evidence

Before fixes, all four original synthetic groups failed and the actual export
reproduced the duplicate appointment. A separate raw-continuation test failed to
render an available block. A further real-export and synthetic test reproduced the
relationship card incorrectly marking the departed NPC present.

After fixes:

- `node tools/run_tests.cjs`: all **23 suites** (the existing 22 plus the new
  tracking/continuation suite) and both bundle syntax checks pass.
- `node tools/test_tracking_continuation_accuracy.cjs /private/export.json`:
  **6/6 groups** pass, including actual export rendering, duplicate-event replay,
  departed family location, restored initial quest, source/swipe rejection and
  unchanged private input. Without the private path, five synthetic groups run in CI.
- **9 Chromium tests** pass with the actual bundles and a mock Lumiverse bridge,
  including the restored panel attached to its correct response. Normal fresh-chat
  generation/storage/render tests remain in the existing suite.
- New tests cover evolving conditions, explicit participant/time/location moves,
  different participants/locations/times, repeated days, completed occurrences,
  distinct essential suffixes, stable quest keys/rewards, stage reset to zero,
  separate Roa requirements, departure/absence/reentry, stale/wrong-swipe/unsigned
  snapshots, missing/quoted inline reports and private thoughts restricted to their
  panel. Cached rendering loads the history once and reuses it, with no model call
  or metadata write. The export is byte-identical after replay.

The actual export now has one mana-measurement Agenda item; all five family
members remain. The five distinct quest records include the source-verified
continuation objective. No supplied objective was merged merely to reduce cards.

## Performance

Five alternating paired rounds compare the latest 2.9.8 baseline with this candidate
using the existing source-bound panel and pipeline runners. Raw results and
operation counts: [TRACKING_2_9_9_PERFORMANCE.json](TRACKING_2_9_9_PERFORMANCE.json).

| Metric | Baseline | Candidate |
|---|---:|---:|
| 600-message panel warm median | 42.28 ms | 43.09 ms |
| 2000-message panel warm median | 68.97 ms | 70.91 ms |
| Response processing | 0.5565 ms | 0.5509 ms |
| Report parsing | 0.4149 ms | 0.4136 ms |
| Empty / populated prompt characters | 14832 / 18528 | 14832 / 18528 |

All predefined thresholds pass (5% or 1ms allowance; no prompt-size growth).
No performance improvement is claimed. Normal generation transport is identical:
1 model call, 6 message reads, 1 metadata write, 2 storage reads and 4 existing
storage writes. Panel instrumentation reports the same 9101 history element
reads and identical traversal counts. No polling or automatic refresh changes.
Continuation rendering reuses the existing render cache and does not create a
second history scan. Per-report presence checks reuse the extracted current data.

## Review, package and remaining limitations

Manifest, backend diagnostics, drawer and popout labels advance together to 2.9.9
RC. The frontend has only version-label changes in this patch. Use the existing
clean-checkout package command and checksum verification from Phase 2. GitHub
publication/CI outcomes are recorded on the PR and release, not inferred here.

No live Lumiverse instance is available, so real host attachment, install/update,
WebView behavior and reload acceptance remain unverified. Existing history-window
bounds remain; this is not a new unbounded archival-memory system. Ambiguous
participant replacements or simultaneous title/objective changes without identity
or rescheduling evidence remain separate instead of risking false merges. A
continuation reply with neither a valid source-bound report nor a current complete
inline block has missing data; it cannot be recovered without a normal user-requested
refresh. Unsigned continuation metadata remains untrusted. RC status is retained.
