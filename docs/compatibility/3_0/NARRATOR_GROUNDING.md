# 3.0.2 RC candidate: narrator spell grounding

Baseline: published 3.0.1 RC, commit
`22aabf3c367c95a21f602f2a88fa00802f02f126`. Development branch:
`fix/narrator-spell-grounding`, COMPANION-TESTING only. This task prepares a PR;
it does not merge, publish, edit either card or touch the original Companion.

## Evidence and confirmed boundary

The supplied scene describes a spell inventory containing names without verified
Six-Sided spell definitions, alongside real definitions such as Ice Pillar (73),
Earth Lance (12) and Stone Cannon (628). Mud Wall (31) is a rare fan addition,
not an automatically available Earth spell. A narrative mention of Flash Flood
is not evidence of its stated Advanced rank. The fixture audits retain that
important distinction between definitions, incidental mentions and ordinary words.

The confirmed integration gap is in the outgoing request, not the catalogue parser:
`rpgcInterceptor` supplies tracking/study/context reminders but did not explicitly
supply cached canonical spell references to the normal narrator. `buildLoreBlock`
serves sidecalls and can fetch world-book data; reusing it here would add calls.
A populated panel catalogue therefore did not prove that the narrator received
its definitions. The baseline actual-interceptor regression produces no reference
block. It also shows no reference-coverage note for an unlisted saved spell.

The user's pasted response does not contain the actual host prompt. It cannot
prove whether Lumiverse failed to activate a particular entry or whether the model
ignored a supplied reference. Neither is asserted as a confirmed host defect.

Full existing source fixtures are reused:

| Card | Full entries / enabled | Cached spell definitions | Source SHA-256 |
|---|---:|---:|---|
| Six-Sided World | 1296 / 1273 | 111 | `df2fd8b90c1f8ee1bac2a054dd7acb60d165555022a7e8c59e34d149d84a69d7` |
| The Living World | 1004 / 998 | 348 | `21918f9b3f02ec9edbb4cc44565256078863d3b93eb7ab0fe5cbb708c4d33e1f` |

## Targeted changes

- `narratorSpellGrounding`: synchronous, cache-only helper called by the existing
  normal interceptor. It looks at at most three recent visible messages and bounded
  user/previous-reply text. Ordinary breakfast turns with a Magic HUD do not trigger
  an added spell prompt. Explicit spell names, magic requests and relevant follow-ups
  can trigger it. It does not search arbitrary historical turns.
- Use the existing catalogue/resolver, exact names, explicit aliases and stated
  schools/ranks. Named requests receive relevant effects where they fit. Broad lists
  interleave school references, retain whole rows and report partial coverage.
  Unknown names are not automatically aliased to similar catalogue entries.
- Cached enabled source entries retain secondary-key constraints. General lists
  exclude rare/fan/NPC-restricted entries. An explicitly named restricted definition
  retains its restriction and does not grant ownership or reveal an NPC's private state.
- Compare exact source definitions against nonhistory system context already in
  the outgoing request. Reuse complete existing definitions instead of repeating
  rows. History quotations and incidental name mentions are not treated as supplied
  definitions. Deduplication is deliberately conservative for host reformattings.
- Supply instructions distinguishing reference definitions from owned abilities,
  ranks from individual knowledge, unknown coverage from nonexistence, and explicitly
  permitted custom magic from invented canonical names. An unavailable catalogue is
  reported rather than replaced by invented definitions.
- The new block shares `lore.maxChars` as its per-block character cap, at most 6,000
  characters, including policy/footer. Zero or insufficient budgets add nothing.
  It is a computed reference block, not a change to host lore activation or to the
  existing sidecall `maxEntries` selection. Host context remains under host control.
- `lastInjection.spellReferences` records scope, status, source descriptors, added
  and already supplied references, budget, omitted count and characters. It reuses
  existing diagnostics, not a new store or automatic refresh.
- `spellResolver.reference`, `hmsMagicPanel` and `spellListPanel`: label unmatched
  Known/studying names **Not found in loaded spell references** when references
  exist. This reports coverage only: no record deletion, ownership downgrade,
  alias invention, progress rewrite, migration or manual-choice override.
- Frontend edits synchronize the candidate version title only. Existing renderers
  show the notes; no panel redesign, preset changes or new control is introduced.

No additional model calls, world-book fetches, polling, full-chat scans, metadata
writes, dependencies or hydration requests are introduced. Existing catalogue
hydration remains responsible for populating the cache. Quiet, impersonation,
continuation-generation and the existing early OOC guide paths stay unchanged.
A resumed chat's subsequent normal RP turns use the same helper as a fresh chat.

## Verification

Node 22: release identity check, both bundle syntax checks and all **39 suites**
pass. The new suite has **15 groups**, including the actual interceptor/idempotence,
both full-card caches, canonical names/ranks, source reuse, quoted-history rejection,
ordinary turns, missing/changed caches, budget boundaries, disabled paths,
rare/custom restrictions, preserved raw metadata and manual Known/study records.
The pre-fix reproduction fails on missing outgoing references and unlisted notes;
new helper-contract checks are not counted as separate historical defects.

Chromium with mock Lumiverse host: **19 UI + 5 visibility tests pass**. Added coverage
renders an unlisted Known row with its coverage note, preserves search and the
existing canonical row, and retains custom study. Existing Magic/martial, spell
controls, continuation, cross-card, source/swipe and saved-state regressions pass.
Browser checks exercise the real frontend, not a live Lumiverse installation or
model. No private export or credential is added to Git.

## Performance

See the accompanying performance results and raw alternating runs. The dedicated
`tools/benchmark_narrator_spell_grounding.cjs` measures the actual normal interceptor,
with both complete cached cards, ordinary/named/inventory/host-provided scenarios,
cold invocation plus 30 warm samples. Existing pipeline and source-bound 600/2,000
message panel benchmarks compare the same baseline and candidate with alternating
order across three pairs. Benchmarks run sequentially after tests, on Node 22.

Reference context deliberately adds bounded characters on triggered turns. It is
not zero-token overhead. Character counts are measured; provider tokenization,
model latency, model obedience and live process-memory use are not measured.
Existing full-history panel work is inherited, not an added narrator traversal.


### Measured results

Raw measurements: [narrator_grounding_performance.json](narrator_grounding_performance.json). Values below are medians of the three run medians; cold values are medians of first invocations.

| Card / normal request | Warm baseline → candidate (ms) | Cold baseline → candidate (ms) | Added reference characters |
|---|---:|---:|---:|
| six_sided_world / ordinary | 5.801 → 6.261 | 81.880 → 68.452 | 0 |
| six_sided_world / named | 6.190 → 8.422 | 34.852 → 35.065 | 535 |
| six_sided_world / inventory | 5.736 → 8.675 | 33.028 → 41.883 | 1866 |
| six_sided_world / host-provided | 5.992 → 9.209 | 39.980 → 43.578 | 447 |
| living_world / ordinary | 5.257 → 4.058 | 94.153 → 93.246 | 0 |
| living_world / named | 4.020 → 6.580 | 91.228 → 106.688 | 546 |
| living_world / inventory | 3.908 → 7.895 | 88.885 → 97.964 | 1809 |
| living_world / host-provided | 3.887 → 8.055 | 90.140 → 121.419 | 447 |

The mock API ledger is identical in every narrator scenario: one existing `chat.getMessages` per pass, zero world-book/model/storage calls. Ordinary turns add zero characters. Inventory requests name Water/Earth/Fire explicitly. A host-provided index retains the short policy/footer; named explanations still add missing effects.

| Existing work | Warm baseline → candidate (ms) | Cold baseline → candidate (ms) |
|---|---:|---:|
| panel-six-600 | 99.18 → 86.97 | 382.99 → 409.41 |
| panel-six-2000 | 156.43 → 136.30 | 841.39 → 700.19 |
| panel-living-600 | 101.86 → 106.66 | 1314.50 → 1140.56 |

| Pipeline operation | Baseline → candidate (ms) |
|---|---:|
| Parse report | 0.7599 → 0.7380 |
| Process response | 0.9954 → 1.0955 |
| Build tracker prompt | 0.5227 → 0.4479 |

Tracker prompt sizes remain 14,949 empty / 18,839 populated characters. Backend size: 1,178,835 → 1,186,650 bytes; deterministic gzip 347,032 → 349,414 bytes. Frontend behavior changes only through the existing note fields; its source changes are version strings.

Relevant-turn grounding has a measured local CPU and prompt cost; ordinary-turn results and other timing differences include VM/JIT/cloud noise. The source-bound panel/pipeline results do not establish live WebView or provider latency. No observed correctness/API-count regression occurred. Compare the recorded raw runs before drawing conclusions from small percentages.

## Remaining limitations and acceptance

This is spell-reference grounding, not an enforcement engine or a complete lore
retrieval system for every technique/item/NPC rule. It cannot make a model read or
obey text deterministically. Missing/cache-partial or budget-omitted definitions
remain unverified; existing saved invented names remain preserved and flagged.
A flagged name may be legitimate custom magic or a missing reference.

Relevant-turn detection is bounded and conservative; an ambiguous "continue" or
implicit reference outside the recent window may not trigger a reference block.
Exact source deduplication may miss reformatted/role-user host injections, so some
redundancy is possible. Reference selection does not reproduce all host probability,
cooldown/sticky or activation behavior, nor claim to be host activation.

Live acceptance still needs the actual Lumiverse outgoing prompt, a normal spell
inventory request, named and unavailable spell requests, missing-reference/custom
behavior, repeat turns, reload/continuation and representative non-Mushoku cards.
Check `lastInjection.spellReferences` against the captured request and distinguish
missing data from provider disobedience. Do not claim complete compatibility or a
stable release from these tests. No live test instance was supplied.

Rollback before merging: switch back to published baseline `22aabf3` or discard the
unmerged compatibility branch. After an approved merge, revert its merge commit
through a reviewed PR; do not rewrite saved tracking data. Version 3.0.1 remains
published until a separate release action is authorized and verified.
