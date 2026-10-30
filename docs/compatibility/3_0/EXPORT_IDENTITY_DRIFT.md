# 3.0.9 RC — Real-export Agenda and Quest identity drift

Baseline: published 3.0.8 RC, `90c80224ff49e5da32624f476fb8b336ad63ab9e`.
Issue: https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/issues/26.
Branch: `fix/agenda-quest-occurrence-3.0.9`. No card or narrator modifications.

## Confirmed reproduction

The supplied 13-message export has six assistant reports. It is replayed through
`getSwipeData`, the existing continuity index, `agendaRead`, `questDetailsLatest`
and the actual panel projection. The unmodified 3.0.8 projection ends with **four
Agenda rows and three Quest rows** for the repeated appointment/assignment.
The screenshot shows three Agenda rows; the deterministic export replay exposes
an additional leading-article split. Counts are not assumed from the screenshot.

| Assistant message position | Baseline Agenda / Quest | Candidate Agenda / Quest |
|---|---:|---:|
| 2 | 0 / 0 | 0 / 0 |
| 4 | 0 / 0 | 0 / 0 |
| 6 | 1 / 0 | 1 / 0 |
| 8 | 2 / 1 | 1 / 1 |
| 10 | 3 / 2 | 1 / 1 |
| 12 | 4 / 3 | 1 / 1 |

The private export is kept outside Git. Committed tests use synthetic scenes and
reported field shapes matching the supplied examples, not the complete export.
Replay/normal reads do not rewrite original report bytes, active swipes or
narrative text. Automatic Separate updates still use the existing single metadata
report write; their retained timing detail stays bound to the unchanged source.

## Root causes and targeted fixes

All references below are in `dist/backend.js`.

- **Location articles:** `agendaPlaceCompatible` treated “the courtyard” and
  “courtyard” as different destinations. Remove only the leading article in this
  Agenda-specific comparison. Existing full/short venue evidence remains required.
- **Bell grammar:** `agendaTimeKey`/`agendaBellClock` recognized the previous
  “when the bell rings at nine” example but not “the bell rings at nine.” Accept
  the optional grammatical words; do not create a due date/time from a bell hint.
- **Coarse restatements:** `agendaScheduleCompatible` could not connect that bell
  hint to a later unqualified “Morning.” `agendaDaypartContains` checks the broad
  period against an established hint; qualified windows, different hours/dates,
  new occurrences and ambiguous matches remain protected. `agendaRead` retains
  the more specific prior label. `agendaRefreshReport` also retains accepted bell
  or clock detail during re-extraction of the same unchanged source.
- **Renamed assignments:** `questMatch` handled exact objective normalization and
  narrow label refinements, not “Defeat or match X” / “Win or draw the spar against
  X” under unrelated titles. `questChallengeMatch` requires the same target,
  giver, compatible location, category and distinctive normalized reward. It
  rejects differing deadlines, restrictions, quantities, extra actions, terminal
  old challenges and independently established assignments. It does not use
  similarity scores, shared rewards alone, names from the card, or AI guesses.
- **Continuity:** `questDetailsLatest` retains the first key, aliases, progress,
  deadline and fuller established condition unless the new source explicitly
  establishes its replacement (legitimate progress resets also remain valid);
  prior definitions are retained in
  bounded projection-only `identityHistory` backed by unchanged raw reports.
  Explicit separate assignments carry derived key boundaries so later panel
  reconciliation cannot collapse them. An ambiguous paraphrase does not create
  another quest. Saved focus under an old label resolves to the retained key.
  Existing Agenda legacy-control aliases remain actionable.

## Why this approach

Title-only IDs fail when the extractor changes labels; the export proves that.
Broad fuzzy matching or reward-only matching risks conflating independent goals.
An additional semantic/model pass would add calls, latency and nondeterminism.
Deleting saved duplicates would destroy evidence and would not prevent recurrence.
The selected fix uses existing reports and source context in the existing read
pipeline, handles old saved reports on normal reads, and preserves raw history.
There is no separate tracking engine, destructive migration, new dependency,
polling or extra model call. Prompt/schema instructions are unchanged.

## Verification

- **50 suites + both bundle syntax checks**, Node 22; release identity 3.0.9 RC.
- **29 UI + 5 visibility** real Chromium checks with the mock Lumiverse bridge.
  The new browser test repeatedly restores the actual synthetic backend payload,
  counts one Agenda item and one Quest card, and operates the retained focus key.
- **11 new identity-drift groups** reproduce the multi-turn exported field shapes,
  repeated automatic Separate re-extractions, new Together inline reports and
  duplicate host notifications, JSON restore, legacy Agenda manual controls,
  quest aliases/focus, unchanged-source time retention, real reschedules, explicit
  condition changes and legitimate progress resets.
- Negative boundaries: other participants, opponents, venues, dates, bell hours,
  qualified periods, rewards, restrictions, extra actions and explicit separate
  assignments remain separate. Ambiguous later labels do not create a third quest.
- The actual export's prefix counts match the table above; the input is unchanged.
  Old export replays retain baseline counts. No private export is packaged.
- Normal Separate update counts are unchanged: six host message reads, one lore
  activation read, two storage reads, one mocked model call, one metadata update,
  four storage writes. Together inline reports need zero added model calls.

Paired Node 22 comparisons against the saved 3.0.8 bundle use the full checked-in
Living/Six-Sided fixtures with 2,000 signed synthetic messages. Each panel run has
one cold projection, three warmups and ten measured samples; the second round
reverses candidate/baseline order. Pipeline uses the existing five-round benchmark.

| Warm median, ms | 3.0.8, rounds 1 / 2 | 3.0.9, rounds 1 / 2 |
|---|---:|---:|
| Six-Sided panel | 155.96 / 176.37 | 154.83 / 149.89 |
| Living panel | 156.90 / 198.10 | 167.25 / 191.82 |
| Response processing | 1.0416 / 0.8530 | 0.8086 / 0.9420 |

Six-Sided cold projections: baseline 657.60 / 654.46 ms, candidate 585.78 /
683.37 ms. Living cold projections: baseline 1,238.16 / 1,485.08 ms, candidate
5,927.93 / 1,531.28 ms. The first slow candidate cold sample prompted two more
Living comparisons in alternating order: baseline 2,037.69 / 1,211.47 ms,
candidate 1,263.28 / 1,267.39 ms; their warm medians were baseline 215.13 /
176.49 ms and candidate 155.43 / 151.18 ms. The cold outlier did not recur.
Cloud/JIT/GC variation prevents a general speedup or latency guarantee; no
consistent slowdown was reproduced. All benchmark runs reported zero warnings.

Prompt sizes remain **15,107 / 19,029 characters** (empty/populated fixture,
not tokenizer counts). No prompt text, polling interval or model-call count grows.
Reproduce using `tools/benchmark_panel_reads.cjs BASELINE CANDIDATE` with
`COMPANION_BIND_READINGS=1`, `COMPANION_BENCH_REPLIES=1000` and the decompressed
card fixture in `COMPANION_CARD`, then reverse argument order. Pipeline command:
`node tools/benchmark_tracking_pipeline.cjs BASELINE CANDIDATE`.


## Limits and rollback

The exact supplied progression and committed synthetic cases are verified, not
all possible natural-language paraphrases. Arbitrary renamed objectives lacking
strong anchors remain separate rather than risking a false merge. Distinct time
windows, restrictions or genuinely new quests must not be erased to reduce counts.
A vague bell still has no exact `dueAt`. This patch does not infer completion from
elapsed time or turn a practice attempt into an earned ability.

Live Lumiverse/Android update, reload and campaign acceptance remain unperformed;
mock bridge/browser checks are not that certification. No claim of perfect or
100% universal semantic understanding is made. Other engines, UI and presets are
unchanged. Reinstall `v3.0.8-rc.1` to roll back; no save migration needs reversal.
