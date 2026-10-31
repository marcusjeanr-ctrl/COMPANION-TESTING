# 3.2.2 RC — Survival flag evidence

Baseline: main `01c3df9e37d707dcdecb7ced2cd401b66d6be513` (PR #34).
Branch: `fix/survival-flag-evidence`. No other features are included.

## Root cause and narrow fix

`parseCompanion` accepts the four model booleans without corroboration. Saved
`survival` flags then feed both `statesPanelHtml`'s “This reply” row and
`hmsSurvival`'s elapsed-time resets. Repeated unsupported `ate` reports therefore
reset hunger even when no eating appears in the corresponding reply.

`getSwipeData` now returns a read-only derived view of those four booleans.
`survivalFlagReading` checks only the same selected swipe's visible prose, after
the WORLD STATE block. It excludes inline reasoning, separate reasoning fields,
`<rpg_companion>` blocks (including incomplete blocks) and fenced JSON. With no
HUD, the visible prose itself is used. The shared `SURVIVAL_FLAG_EVIDENCE` constant
contains lexical patterns for English, Portuguese, Spanish, Russian and Turkish.
Simple immediately preceding negations are rejected; plain “water” does not prove
drinking. Other fields and unrelated tracking engines are unchanged.

Unsupported original true flags become false in this derived view, with their
names in `survival.unconfirmed`. Existing metadata and messages remain byte-for-
byte unchanged on reads; no migration or write is performed. New report saves
also apply this filter and persist the additive `unconfirmed` list, retaining
which true booleans were rejected. Existing source fingerprints, selected-swipe
checks, save serialization and continuation boundaries still apply. A weak-key
cache reuses evidence results for unchanged report/content/flag inputs. There is
no additional chat traversal, model call, timer or polling.

Manual `hmsSurvivalLog` entries bypass this check and always count. The event and
timer algorithms are unchanged: they consume the filtered read view, so rejected
flags cannot reset hunger/thirst/sleep or grant rest credit. No new panel text or
translations are needed. `tools/embed_i18n.py` is nevertheless verified.

The only intended model-instruction change adds:
“If the reply does not describe the action, leave all four flags false. Do not
carry a flag over from an earlier reply.” The rest of the instruction is retained.

## Real export investigation (indices used by the export)

The supplied export has 39 messages. All six cited replies store `ate: true`.
Each reply's full prose after `***`, inline content and available reasoning were
inspected; no private export is committed. Reasoning is investigation evidence,
never input to flag confirmation.

| Reply | Prose evidence | Available reasoning | Effective `ate` |
| --- | --- | --- | --- |
| 4 | No eating/food evidence | No reasoning text supplied | false; unconfirmed |
| 8 | Marcus sets his plate aside; breakfast conversation | Explicitly says he finishes eating | true |
| 10 | No eating/food evidence | No reasoning text supplied | false; unconfirmed |
| 12 | No eating/food evidence | No eating/food evidence | false; unconfirmed |
| 28 | No eating/food evidence | No reasoning text supplied | false; unconfirmed |
| 38 | Study conversation; no eating/food evidence | No eating/food evidence | false; unconfirmed |

Reply 4 also has unsupported `slept`/`rested` flags; the same four-flag rule rejects
those. Reply 38's actual `statesPanelHtml` output has no “This reply: ate” row;
reply 8 retains it. Raw metadata is preserved. The baseline's lack-of-evidence
regression fails before the patch and passes afterward.

## Boundaries and regression requirements

This is a small lexical corroboration rule, not an NLP engine or a guarantee that
an action belonged to the player. Meal/beverage/bed nouns can supply context;
word presence cannot independently certify consumption, intention, ownership or
completion. Translation lists cover common forms in all five interface languages,
not every inflection or synonym; other languages currently have only the English
fallback. Negation handling is deliberately limited to short preceding phrases.
Missed paraphrases can be logged manually. No claim of universal language accuracy
or live Lumiverse acceptance is made.

`tools/test_survival_flag_evidence.cjs` covers all four positive/negative flags,
simple negations, multilingual examples, HUD/reasoning/tracker exclusions,
selected-swipe/cache behavior, preserved unrelated fields, read immutability,
additive acceptance storage, false-flag timers and manual logging. An optional
private export argument checks the six actual replies and their rendered rows.
The export remains outside Git.

Verification and the revised 20-pair CPU/wall gate are recorded below.
No part of this candidate has been tested in a live Lumiverse instance.

## Initial candidate verification and publication STOP (historical)

Release identity, both bundle syntax checks, translation embedding (2,728 keys per
translated language), **64 JS suites + 12 gate tests**, **54 Chromium UI cases**
(including the previous 37-message fixture), and **5 visibility cases** pass.
The supplied 39-message fixture passes all six reply and rendered-row assertions;
its hunger clock measures from reply 8 rather than the unsupported reply 38 flag.
The optional fixture assertion was extended to test that actual elapsed interval.
No input messages or export bytes were changed.

The baseline fails the no-prose-evidence assertion; the candidate passes. Prompt
smoke fixtures remain 15,291 / 19,213 characters because they do not request this
survival instruction. When survival extraction is requested, the new two-sentence
instruction intentionally adds 119 characters (no additional model calls).

Frozen main `01c3df9`; 20 alternating pairs for both 600 and 2,000 messages, with
historical 3.0.10 informational. All 120 fresh-process observations were retained.
No other tests or benchmark workloads ran concurrently. Source hashes remained
unchanged from measurement through this report.
[Statistics](SURVIVAL_3_2_2_GATE.json),
[lossless raw measurements](SURVIVAL_3_2_2_GATE_RAW.json.gz),
[validation](SURVIVAL_3_2_2_VALIDATION.json).

| Messages | Metric | Main → candidate median ms | Change | Baseline / candidate IQR | Baseline / candidate spread |
| --- | --- | --- | --- | --- | --- |
| 600 | cold wall | 227.90 → 254.20 | +11.54% | 11.48 / 13.09 | 29.98 / 32.84 |
| 600 | cold CPU | 259.98 → 290.90 | +11.89% | 12.31 / 14.74 | 40.32 / 38.52 |
| 600 | warm wall | 62.68 → 70.39 | +12.30% | 4.03 / 11.01 | 15.16 / 18.53 |
| 600 | warm CPU | 124.86 → 126.40 | +1.24% | 8.71 / 17.34 | 28.93 / 51.56 |
| 2000 | cold wall | 500.15 → 589.07 | +17.78% | 13.92 / 22.79 | 61.62 / 74.79 |
| 2000 | cold CPU | 622.66 → 731.66 | +17.51% | 27.97 / 22.01 | 89.87 / 106.31 |
| 2000 | warm wall | 133.15 → 172.07 | +29.23% | 11.69 / 7.33 | 30.22 / 26.59 |
| 2000 | warm CPU | 191.10 → 241.46 | +26.35% | 25.65 / 15.93 | 59.77 / 36.20 |

**Gate: FAIL.** Both 2,000-message warm medians exceed +5%, and each excess exceeds
its pooled baseline run-median IQR. Wall excess is 38.92 ms versus 11.69 ms IQR;
CPU excess is 50.36 ms versus 25.65 ms IQR. This is not labeled host noise or a
passing result. Cold overhead is also visible in the table.

The user's explicit STOP rule applies: this candidate is not merged or published;
main remains 3.2.1. No tags were changed or created. The working patch is retained
on `fix/survival-flag-evidence`. No new benchmark was run to replace this failure.
Further work should profile and reduce the evidence-check hot-path/cache cost
before a newly changed candidate receives the full tests and a new gate. Repeated
key/filter/signature allocations before a cache hit are one suspected contributor,
not a measured breakdown of the observed regression. No speculative optimization
was applied after the failed gate. None of this was tested in live Lumiverse.

## Master-task continuation: profile before modifying source

The existing branch was pushed to GitHub before starting. The parent is still
main `01c3df9`. Instrumentation used a temporary copy of the 2,000-message
benchmark source (1,000 assistant replies plus user turns), the same `reading`
and `hud` fixtures, source-bound metadata, a cold projection, three warmups and
ten measured warm projections. No instrumented file was installed in the repo.
Diagnostic timer overhead and cotenant scheduling limit these splits; the
unmodified 20-pair tool remains the acceptance authority.

[Stage split](SURVIVAL_3_2_2_PROFILE.json): the cold projection had 15,803 helper
calls, 1,000 cache misses and 14,803 hits. Lookup preparation cost 36.92 ms,
prose cleanup 15.74 ms, evidence matching/verdict allocation 9.46 ms. A warm
projection still had 15,803 calls, all cache hits: median lookup preparation
**29.69 ms**, prose cleanup **0 ms**, matching **0 ms**. The benchmark reports
true `ate` claims throughout, so the all-false branch is not exercised by this
fixture. Its existing short-circuit already skipped prose for false flags.
A separate unmodified Node CPU profile sampled `survivalFlagReading` at 205.03 ms
self time across the full process. Rebuilding key arrays, filter/map results and
signature strings before every hit was the measured hot path; repeated warm
prose/regex scanning was not the cause.

### Step 1 and step 2

Step 1 was already present: all-false reports return before reading prose.
A new content-getter regression proves this without weakening existing tests.
Step 2 moved the flag-key list to a frozen module constant and reused each
compiled evidence regex rather than constructing it on a miss. The full gate
was rerun: **FAIL**, 2,000 warm wall **+30.14%**, CPU **+23.26%**.
[All statistics](SURVIVAL_3_2_2_STEP2_GATE.json),
[all raw observations](SURVIVAL_3_2_2_STEP2_RAW.json.gz).
This failure was retained, not replaced or relabeled.

### Step 3

The bounded cache now uses reply id, selected swipe and content length, validates
exact text (including equal-length edits) and raw-report/flag inputs, and keeps at
most 3,000 entries. Scalar flag masks replace per-read lists and string signatures;
list construction and prose normalization/matching occur only on a miss. All new
helper regexes are module-level constants. Raw metadata, all non-flag fields and
manual logs retain the original semantics. This is still read-time filtering;
existing chats do not require re-saving in this candidate.

An independently wrapped whole-helper timing comparison on the same synthetic
2,000-message fixture reduced median warm helper time **33.36 → 17.17 ms** for
15,803 calls. [Matched instrumentation](SURVIVAL_3_2_2_CACHE_PROFILE.json).
It is diagnostic, not an acceptance benchmark.

Release, embedding, syntax, **65 JS suites + 12 gate tests**, **54 Chromium UI
cases** and **5 visibility cases** pass. The unchanged original 3.2.2 suite
passes, including the real 39-message export. New tests add repeated-cache reads,
equal-length edits, id reuse, swipe replacement and zero prose access for false
flags. The old 37-message display fixture also passes. No existing test assertion
was changed or weakened; only the suite registry was extended.

The actual additional reply 2 has `slept:true`, but only describes breakfast
conversation: no sleep evidence or reasoning is supplied. It becomes
`unconfirmed:['slept']`. Its `ate`, `drank` and `rested` flags were false and stay
false, despite food and NPC drinking references. Replies 4, 8, 10, 12, 28 and 38
retain the outcomes in the investigation table above. No export is rewritten.

#### Step 3 acceptance gate

Frozen main `01c3df9`, 20 alternating pairs per case, all 120 fresh-process
observations retained. No local test/benchmark workload ran concurrently.
[Statistics](SURVIVAL_3_2_2_STEP3_GATE.json),
[raw observations](SURVIVAL_3_2_2_STEP3_RAW.json.gz),
[current validation/source hashes](SURVIVAL_3_2_2_OPTIMIZED_VALIDATION.json).

| Messages | Metric | Main → candidate median ms | Change | Baseline / candidate IQR | Baseline / candidate spread |
| --- | --- | --- | --- | --- | --- |
| 600 | cold wall | 205.82 → 230.24 | +11.86% | 11.63 / 14.76 | 30.65 / 70.26 |
| 600 | cold CPU | 237.59 → 261.62 | +10.12% | 14.97 / 14.31 | 36.64 / 86.14 |
| 600 | warm wall | 49.98 → 59.75 | +19.54% | 7.97 / 12.83 | 18.81 / 21.08 |
| 600 | warm CPU | 109.54 → 110.98 | +1.32% | 10.55 / 29.64 | 30.60 / 49.20 |
| 2000 | cold wall | 483.73 → 527.14 | +8.98% | 37.65 / 25.01 | 1166.97 / 337.92 |
| 2000 | cold CPU | 601.29 → 656.60 | +9.20% | 57.61 / 41.83 | 1331.98 / 377.01 |
| 2000 | warm wall | 134.23 → 145.12 | +8.12% | 10.88 / 9.55 | 26.93 / 52.51 |
| 2000 | warm CPU | 188.81 → 211.47 | +12.00% | 26.55 / 16.55 | 72.17 / 111.96 |

**INCONCLUSIVE, not PASS.** Both warm medians exceed +5%; wall excess 10.89 ms
exceeds its baseline IQR 10.88 ms, while CPU excess 22.66 ms remains within its
26.55 ms IQR. The tool's generic `continueAllowed` does not authorize this task's
merge: the user explicitly requires PASS. No gate rule or benchmark tool changed.

### Step 4 conflict and STOP

The requested write-time-only fallback would leave existing unsaved metadata
unfiltered. This contradicts the unchanged `test_survival_flag_evidence.cjs`
assertion at lines 12/18: a legacy raw `ate:true` with “You speak to the instructor
in the study.” must read as false and be listed in `unconfirmed`. A temporary
copy disabling the two read-view calls (while keeping the acceptance filter)
reproduces `true !== false` in that exact test. No acceptance-time storage layout
can correct an old unsaved reply without reading it. The fallback was therefore
not installed and no test was weakened, per the explicit test-conflict STOP rule.

**Part 1 stopped.** The read-time candidate and measurements are retained on the
pushed branch for review. No main merge, release, tag change or original-repo
write. Parts 2 (3.2.3) and 3 (3.2.4) have not started. Their investigations were
not run out of order. None of this was tested in a live Lumiverse instance.

## Consumer-placement follow-up

The latest reader inventory and unchanged-test entry-point conflict are recorded
in [the consumer audit](SURVIVAL_3_2_2_CONSUMER_AUDIT.md). Runtime remains candidate
`11db330`; no new gate result or release is claimed.
