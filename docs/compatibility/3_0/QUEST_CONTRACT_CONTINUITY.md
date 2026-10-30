# 3.0.10 RC — Quest-only assignment continuity

Baseline: installed/merged 3.0.9, `a3d9c46113fd771037ea496b8df86102d20d7bea`.
Issue: https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/issues/28.
Branch: `fix/quest-assignment-continuity-3.0.10`.

## Reproduction and why the previous fix failed

The new export contains 23 messages. The original seven quest reports start with
concrete victory conditions, then use progress summaries, shorten a parental
reward reference, and describe the same promised introduction by the beneficiary's
name. 3.0.9 handles the first three labels, then produces five cards by the final
reply. Its tests ended before these later descriptions. The new test deliberately
continues through all seven reports and the final conditional introduction.

| Quest report position in export | 3.0.9 cards | Candidate cards |
|---|---:|---:|
| 8 | 1 | 1 |
| 10 | 1 | 1 |
| 12 | 1 | 1 |
| 14 | 2 | 1 |
| 18 | 3 | 1 |
| 20 | 4 | 1 |
| 22 | 5 | 1 |

This is verified through the actual backend panel projection, not a frontend
filter. The final progress remains 60% and the assignment remains active: a
conditional promise of an introduction is not completion or a delivered reward.
The private export stays outside Git and is unchanged by replay. Tests contain
synthetic scenes and the reported field shapes, not the complete private chat.

## Confirmed Quest changes

References below are in `dist/backend.js`.

- **Identity prevention:** `buildCompanionInstructionRead` previously told the
  tracker to reuse names without supplying an existing Quest catalogue;
  `questNormalize` derived every key from the title. The existing request now
  accepts optional `id`, retained as `questId`, and supplies `questIdentityContext`.
  This context includes at most eight active whole records within 1,800 characters;
  IDs and conditions are never cut mid-field. It uses the existing read pass/index
  and existing call, not a new model call or history fetch.
- **Old saves and models that omit IDs:** `questContractContinuation` identifies
  a unique active contract from giver, location/category/deadline, reward and
  visible current work. An evaluative progress summary must refer to that current
  work through the accepted scene/characters and actual visible source evidence.
  Quoted examples, private blocks, hypothetical scenes, different targets,
  restrictions, dates and independent assignments do not supply that evidence.
- **Reward wording:** `questRewardCompatible` accepts exact references, unique
  shortened parent/child references, and a relational-to-named introduction only
  with a visible explicit continuation of that promised meeting. Shared surnames
  or rewards alone are insufficient. No world/card names are embedded in this code.
- **Reference guards:** `questReferenceMatch` resolves IDs only against an
  established compatible assignment, preserving giver, reward and restriction
  boundaries. An explicit stage of the same assignment can change location and
  keeps `stageHistory`; reset percentages remain valid. Completed assignments
  cannot silently become a differently labelled active assignment through an ID.
  A source-confirmed new assignment can reuse a title and gets a separate key.
- **Refresh persistence:** `questRefreshReport` runs only on the Quest field inside
  the existing serialized, source/swipe-validated `setSwipeData` write. It retains
  the old identity, aliases, full conditions and sparse details for the unchanged
  accepted report. Equal-length edits and inactive swipes cannot inherit it.
  Repeated identical refreshes do not append duplicate identity-history entries.
  There is no extra fetch or write; history is bounded using the existing cap.
- **Panel controls:** Validated references take priority over display names, and
  final records carry canonical identity through `questMatch`/`questUnique`.
  `hmsPanelStateRead` retains the canonical detail key when attaching a HUD alias.
  An ambiguous bare HUD label cannot replace two known assignments; richer
  unresolved HUD facts remain available as a separate unresolved record. Merged alias arrays preserve all historical focus names.
  This fixes the model-to-storage-to-projection path; cards are not hidden by CSS.

## Scope protection

Every existing Agenda function is byte-identical to 3.0.9. A full replay comparison
of the supplied export verifies that every non-Quest panel field is identical,
including Agenda. The only changed existing functions are `questNormalize`,
`questDetailsLatest`, and Quest-specific branches in `buildCompanionInstructionRead`,
`setSwipeData`, and `hmsPanelStateRead`. `questMatch` also keeps distinct canonical records
separate during final projection. New helpers are Quest-only. Frontend runtime
changes are version strings only; the new browser check exercises the existing UI.
No NPC, Magic, inventory, gameplay, preset, settings or card implementation changed.
No destructive migration, rewrite, extra polling or dependency was introduced.

## Verification and performance

- **51 suites and both bundle syntax checks pass** on Node 22, including
  **22 new Quest contract groups**. All **30 UI + 5 visibility** Chromium checks
  pass with the mocked Lumiverse bridge. The final validation runner checks that
  backend/frontend SHA-256 hashes remain unchanged across every phase.
- The new browser test first renders five old cards, then repeatedly replaces
  that payload with the real synthetic backend projection, verifies one card,
  retains 60% progress and operates its canonical focus control.
- Full seven-label automatic Together and Separate processing, duplicate host
  notifications, source-bound repeated refresh, JSON save/load, reduced-history
  import, stage moves, legitimate resets/completion, reused display labels,
  independent same-title assignments, old focus aliases, 80 presentation changes,
  numeric ID suffixes, and 100 identical refreshes are tested.
- Negative cases preserve distinct targets, givers, places, rewards, restrictions,
  days and explicit new assignments. Private/quoted/hypothetical source material
  cannot provide the current-work link; edited sources and inactive swipes cannot
  inherit an accepted old identity. Ambiguous shortened references stay separate.
- The complete real export produces **one active Quest at 60%**; every non-Quest
  panel field matches baseline. Two older private export replays retain baseline
  counts. No private fixture or narrative is included in the package.
- Normal Separate processing keeps six host message reads, one lore activation
  read, two storage reads, one mocked generation, one metadata update and four
  storage writes. Together inline processing makes zero additional model calls.

Performance: two paired Node 22 rounds reverse baseline/candidate order. Both use
full checked-in card fixtures and 2,000 signed synthetic messages. Each panel run
has a cold read, three warmups and ten timed samples; pipeline timings use five
warmed rounds. The cloud results vary substantially; no general speedup or fixed
latency guarantee is claimed.

| Measurement, ms | 3.0.9 rounds 1 / 2 | Candidate rounds 1 / 2 |
|---|---:|---:|
| Six-Sided cold panel | 1,870.25 / 826.29 | 1,638.10 / 848.60 |
| Six-Sided warm median | 455.17 / 221.84 | 217.48 / 189.46 |
| Living cold panel | 2,366.77 / 1,672.79 | 1,758.16 / 3,071.34 |
| Living warm median | 220.83 / 232.99 | 214.82 / 265.21 |
| Response processing median | 0.9371 / 1.3569 | 1.0408 / 1.2517 |
| Prompt construction median | 0.4295 / 0.6065 | 0.4506 / 0.6841 |

The mixed measurements do not establish a uniform improvement or a consistent
slowdown. Real host responsiveness remains an acceptance requirement. Runs report
zero mock warnings. The fixed schema/instruction change adds **184 characters**:
empty/populated benchmark prompts grow from 15,107/19,029 to 15,291/19,213.
The supplied export's entire request grows from 21,056 to 21,475 characters;
its known-ID JSON is 217 characters. These are characters, not tokenizer counts.
The extra ID context is deliberately bounded to 1,800 characters/eight whole
records. This is a disclosed instruction cost for identity accuracy, without
additional AI calls, polling or history fetches.

Reproduce with `node tools/run_tests.cjs`, `python3 tools/test_ui_browser.py`,
`python3 tools/test_visibility_browser.py`, and the existing panel/pipeline
benchmarks in `docs/DEVELOPMENT.md`. For long panels use
`COMPANION_BIND_READINGS=1 COMPANION_BENCH_REPLIES=1000` with `COMPANION_CARD`
pointing to a decompressed checked-in fixture and reverse candidate/baseline order.


## Choices and remaining limits

More combat-verb substitutions would still fail on generic progress summaries.
Title/reward-only or broad fuzzy grouping can erase independent objectives.
An extra semantic model call adds latency/cost and is unnecessary here. The chosen
approach supplies stable references within existing processing, guards them, and
uses visible source-backed continuity for legacy reports. It is additive and
retains raw reports, control aliases, conditions, progress and stage history.

A model can omit or misuse a reference; ambiguous legacy reports without enough
source evidence remain separate. The context budget cannot list an unlimited
number of simultaneous assignments. No finite deterministic matcher guarantees
all possible natural-language paraphrases. The verified claim is the complete
supplied sequence, the synthetic boundary cases and the regression matrix, not
perfect universal model obedience. Actual Lumiverse/Android update/reload testing
remains outstanding. No release is automatically published by this patch.

Rollback: reinstall 3.0.9 from baseline `a3d9c46`; preserve existing chat data.
Optional Quest fields are additive and require no save migration to reverse.
