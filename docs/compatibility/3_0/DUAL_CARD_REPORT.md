# 3.0 RC — Living World and Six-Sided World integration

## Verified foundation and delivery boundary

Task 2 extends [Task 1](REPORT.md) on `development/3.0-rc-tracking`; no restart,
rebuild, new engine or lost Magic improvement. Exact pre-integration checkpoint:
**`31e44daef9966cce9b4f05eecd31c259aa8db6e5`**, annotated tag
`checkpoint/3.0-task1-before-six-sided`. At that commit: **36 regression suites,
both syntax checks, release identity, 16 Chromium UI and five visibility tests**
passed. It includes all 2.9.15 Magic fixes and the Task 1 identity/lifecycle,
uncertainty, privacy, long-objective and stable-key repairs. Its performance and
accuracy records remain unchanged in this directory.

Only `marcusjeanr-ctrl/COMPANION-TESTING` is modified. Published main/tag remain
2.9.15 RC at `0d84f371fe19c69a81f7e31f307c8099bc3763a6`. This candidate uses
manifest version **3.0.0**, with explicit RC status. A PR is for review; no merge
or release is performed. Original Companion, cards, presets and UI design stay intact.

## Equivalent full-card evaluation

Both complete uploads are read as data, including core instructions, handler formats,
HUDs, all enabled entries, and activation metadata. Existing catalogs/examples are
not treated as campaign events or automatic possessions. Registers expose the
scope of individual tests rather than certifying a whole fictional rule system.

| Evidence | Living World | Six-Sided World |
|---|---|---|
| Original SHA-256 | `21918f9b3f02ec9edbb4cc44565256078863d3b93eb7ab0fe5cbb708c4d33e1f` | `df2fd8b90c1f8ee1bac2a054dd7acb60d165555022a7e8c59e34d149d84a69d7` |
| Original entries / enabled / disabled | 1,004 / 998 / 6 | 1,296 / 1,273 / 23 |
| Per-entry CSV | [Living](living-world-coverage.csv) | [Six-Sided](six-sided-coverage.csv) |
| Full traceability | [Living](living-world-coverage.json.gz) | [Six-Sided](six-sided-coverage.json.gz) |
| Core fields/rules and probe | [Living](card-inventory.json) | [Six-Sided](six-sided-inventory.json) |
| Real export | Five messages, two readable reports | Five messages, two readable reports |
| Lossless development fixture | Existing full Living fixture | Full Six-Sided fixture added; 857,933 compressed bytes |

The Six-Sided upload is the same full source as the earlier audit. Its classifications
are recalculated from source headers/content using the existing audit's profiles,
not accepted merely from its preliminary CSV. Every original ID, enabled flag,
content hash, activation setting, handler function and test family is cross-checked.
Core-field hashes and rule-clause line references point into complete fixture content.
The extension mirror's different IDs/labels are not counted as another 1,296 mechanics.
Disabled crossover entries remain disabled. No card entry is edited, removed or enabled.

Important actual Six-Sided systems include start/continue and Classic/Visual HUD
formats; aging, birth month and named 12×30 calendar (1196); mana growth (1195);
Canon modes/custom ripples (1199); Canon Clock/calendar/countdown (1200); arc closers
(1201); guilds/payments (1202); canon ledger/guide (1203); natural renown/guild/title
progression (1205); start locks (1206); era/Sandbox/off-screen and romance-ripple
systems (1168–1174); World State arc/memory modules, magic, martial and geographic
references, NPC/race/monster dossiers, possessions and relevant household lore.
Rules and examples are distinct: mere appearance in a sample HUD never grants a
spell, estate, marriage, title, canon outcome or guild payment.

## Confirmed Task 2 defects and repairs

| ID | Evidence and cause | Targeted repair / safety boundary |
|---|---|---|
| S01 — owned spell-list convention | Real export has `SPELL LIST — <player>` with Markdown school headings, rank/cost parentheses, semicolon descriptions and explicit incomplete mastery. Existing established-list reader recognizes Known Spells but not this owned header. Old metadata retained only eight names. | Extend the same cached established-list reader. Require exact configured player identity; strip rank/cost annotation before name delimiters; stop at section separators; retain explicit Known-not-Mastered assessment. Theory-only/next-tier references, NPC/ownerless/quoted/fenced/hidden/continuation lists do not grant knowledge. No narrative substring mining or new history traversal. |
| S02 — short/full family duplicates | Real reports use full family names and short character/relationship names. `famRead` keys these separately and inferred scene locations can displace explicit family locations. | Reuse canonical/unique lookup for existing full identities. Preserve full display name, explicit locations and hidden/manual keys. Ambiguous first names never select a full identity or overwrite it. No global first-name merging or surname invention. |
| S03 — parent-qualified Agenda locations | Two commitments are repeated as Training yard versus Estate, training yard; one says now, this morning versus this morning. Exact place matching creates four records. | Allow a multiword suffix abbreviation only when both observed HUD hierarchies establish the same full parent, across reports, and all existing participant/schedule/unique-match guards pass. Treat now within the same daypart as refinement. Different estates/yards/conditions remain separate. Context is derived, not a new persisted store. |
| S04 — speculative inheritance/property grants | Lifetime synthetic tests show offered, unaccepted or uncertain holdings become gained; normalizer lacks the shared guard. This is a synthetic confirmed defect, not a claim that the short real export acquired property. | Guard new and legacy holding observations through one bounded `holdPending` predicate using acceptance/uncertainty and explicit pending-state labels. Explicit owned/gained/lost/changed property remains supported; manual additions remain authoritative. No automatic inheritance, tax, income, marriage or estate simulation. |

These adapt shared formats/contracts; no Six-Sided/Marcus/example spell names are
hardcoded into runtime logic. Both cards retain their own spell catalog identities,
rank terminology, chronology and declared game modes. No model call is added.

## Before/after real-export accuracy

Six-Sided export SHA-256:
`d811bf7216cc4a82121c084f89eefddc13c04af54d08421e3a5c75f12e304a34`.
Replay uses the same bytes, complete card and configured player name on checkpoint
and final runtime. No provider is contacted or raw metadata rewritten.
[dual-accuracy.json](dual-accuracy.json) contains counts and criteria, not private prose.

| Real observation | Task 1 checkpoint | Integrated candidate |
|---|---:|---:|
| Six-Sided individual Known spells | 8 | 16 |
| Six-Sided fabricated Mastered / active study | 0 / 0 | 0 / 0 |
| Six-Sided family cards for five established relatives | 8 | 5 |
| Six-Sided scheduled cards for two commitments | 4 | 2 |
| Six-Sided NPC Minds / equipment items | 5 / 2 | 5 / 2 |
| Six-Sided quest cards / financial transactions | 0 / 0 | 0 / 0 |
| Living World Known spells / family / Agenda | 10 / 5 / 2 | 10 / 5 / 2 |
| Living World canal quest cards | 1 | 1 |

Cumulonimbus is explicitly Known but not mastered; theory-only Melded entries
remain ungranted, and failed/attempted assessments do not establish knowledge.
No inference that school rank grants all spells. Existing supported canonical
names differ legitimately between the cards (for example Water Ball / Waterball);
tests resolve through each card's catalogue rather than forcing one spelling.

Source bytes and source-bound metadata remain unchanged. A JSON-restored replay
returns the same state; source edits and nonactive swipes reject the corresponding
observations. The export still covers only one short opening scene. No overall
accuracy/recall percentage or lifetime correctness rate can be inferred from it.

## Equal-primary compatibility and lifetime matrix

| System | Living World | Six-Sided World | Verification and limits |
|---|---|---|---|
| Start/continue | Own handler / START_CONTINUER | Own Start/Continue Handler | Both snapshots render validated Internal States without replaying copied money/possessions; core source inventory and existing continuation tests. Live app transfer unverified. |
| HUD and chronology | Year + extended campaign Day | Armored Dragon / named month, 12×30 days | Explicit ages 13→22→42→85, birth-month birthday marker, month rollover and Living days 721→722. Never coerce the two calendars or invent an exact birthday from birth month alone. |
| Magic, study/mastery and sword/Touki | 348 canonical magic refs / 31 techniques | 111 canonical spell / 23 technique references | All Task 1/2.9.15 tests retained; owned-list recognition, attempts/ownership, practice/learning/mastery, ranks/prerequisites, no automatic grants or cost/advancement simulator. |
| Quests/objectives/promises | Task 1 same-assignment repair | Existing quest/Agenda formats | Identity, lifecycle, explicit resets, deferred rewards, rescheduling and parent-location refinement. Arbitrary semantic paraphrases remain conservative. |
| Injury/disease/disability/recovery | Explicit wound/condition/Drain forms | Explicit disease/curse/status/wound forms | Permanent wound remains visible in explicit lifetime HUDs; prior Raw/Treated/Magic-Healed/Permanent and recovery tests retained. Missing narrator output is not independent medical evidence. |
| Wealth/debt/property/business | Existing holdings/money | Same stores, own HUD fields | Explicit business/title/debt survive decades of observed time-skips and JSON restore. No extra income, interest, taxation, estate valuation or inheritance event is invented. |
| Family/marriage/children/descendants | Existing family + relations | Same, full/short names reconciled | Explicit spouse/child additions persist with known parent; no automatic death from elapsed age. No recursive genealogy, legal succession engine or demographic simulation. |
| Nobility/politics/reputation | Literal titles/affiliations | Renown, guild, title and region fields | Explicit titles/guild ranks retained, no automatic noble promotion. Regional Renown uses existing faction-style projection; Unknown has the existing neutral fallback, not evidence of actual membership, influence or legal status. Raw regional fields remain visible. |
| Travel/weather/languages | Own HUD/geography | Own named-calendar/geography | Observed location/status changes and existing temporal Atlas tests; no route/weather/language consequence simulator or inferred travel outcome. |
| Canon/Sandbox/divergence/Turning Points | Unscheduled Sandbox stays personal | Own Canon Clock, modes, ripple rules | Existing event ledger distinguishes forecast from occurrence; references do not trigger events. Full branch/playthrough simulation and all ripple-law effects remain narrator-owned. |
| NPC knowledge/autonomy/off-screen | Owner/source boundaries | Same, unique identity | Task 1 privacy checks retained; NPC routines stay separate from appointments. No NPC skill transfer, inferred death or private fact granted by an ambiguous first name. |
| Long histories / continuity | Existing bounded observation window | Same | See retention limitation below; sparse/time-skipped scenes tested, not unlimited campaign storage. |

### Important lifetime retention limitation

Several ordinary report-based folds use `relReadingsUncached`'s **300 visible
assistant-message window**. A sparse lifetime across a handful of time-skipped
scenes is verified; a fact existing only before that window can stop appearing
unless it has been restated or saved through the relevant manual/state mechanism.
Do not claim indefinite retention or a complete multi-generation database. The [synthetic retention probe](retention-probe.json), reproducible with
`node tools/probe_tracking_retention_3.cjs`, measures family/holding rows 1→0 after
300 empty subsequent replies while spell knowledge remains 1; the checkpoint has
the same result. This
is inherited from the checkpoint, not a Task 2 regression; increasing the window
blindly would increase every affected reader's work and undermine the performance
requirement. A future targeted design should use a source-bound compact historical
checkpoint/index, with edit/swipe/retraction, deletion, branch isolation, migration,
manual precedence and large-chat cost tests before replacing the bounded contract.
No unvalidated aggregate cache or second source of truth is added here.

The Living export's unsupported 5% quest progress remains an explicit provider/data
acceptance issue from Task 1. Historical metadata is preserved. Do not treat a
stronger prompt as demonstrated live-provider compliance. Catalog/rule definitions
and source quotes cannot independently prove the truth of every NPC claim.

## Regression, data and performance verification

Final runner: **37 suites**, including all 35 original suites, Task 1's ten engine
contracts and Task 2's **nine dual-card groups**, plus both syntax and release identity
checks. Existing cross-card fixtures cover Living World, Six-Sided, Re:Zero,
Overlord, COTE and generic/legacy formats. Existing assertions remain intact.
Task 2 focused contracts run against the immutable checkpoint first to reproduce
its defects (**5/9 → 9/9 groups**), then against the final runtime. New lifetime, birthday, continuation,
ownerless-list, ambiguous-identity, inheritance and separate-yard tests protect
both primaries. Tests are simulated accepted observations, not live model sessions.

Real Chromium: **17 UI + five visibility tests**, including full-card Six-Sided
owned-list/family payload, all Living/Magic, continuation, lifecycle and stable-focus
checks. The mocked bridge is explicit; UI layout/settings/presets are unchanged.
Saved metadata, settings, identifiers, manual keys, original ledger anchors and
state version remain compatible; no destructive migration or automatic reprocessing.
Full-card development fixtures/tools stay out of installable packages.

[DUAL_PERFORMANCE.json](DUAL_PERFORMANCE.json) compares frozen Task 1 checkpoint and
final source with alternating equal workloads: ordinary 600/2,000-message panels,
full Living and full Six-Sided card panels, response pipeline, GC/catalog memory
for each card and host operation counts. The unchanged Task 1 comparison against
published 2.9.15 remains [PERFORMANCE.json](PERFORMANCE.json). No invented historical
or live benchmark. Numerical results and variance limits accompany the final report.

Reproduce:

```sh
node tools/run_tests.cjs
node tools/test_dual_mushoku_3.cjs
python3 tools/build_six_sided_3_coverage.py /tmp/six-3-register
node tools/audit_tracking_3.cjs /private/six-export.json 'actual player identity' tools/six_sided_world_fixture.json.gz
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_ui_browser.py
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_visibility_browser.py
```

Checkpoint restore: use a clean checkout of
`checkpoint/3.0-task1-before-six-sided`, verify exact commit
`31e44daef9966cce9b4f05eecd31c259aa8db6e5`, then rerun identity/tests. This tag
is pushed as a rollback reference; server-enforced immutability is not claimed.
Do not reset main, move published tags or force-push. No data migration needs undoing.
For the published baseline instead, use `v2.9.15-rc.1` as described in Task 1.

Both targets have received the same full-inventory, real-export, synthetic lifecycle,
cross-card and performance evaluation. **This does not establish complete compatibility
or release readiness.** Provider semantics, unlimited history retention, live install/
reload/update, actual models, WebView behavior, all branch/career/household outcomes
and representative long campaigns remain unverified. Deliver one reviewable 3.0 RC
with those limits visible; merge/publication require subsequent review and authorization.

## Task 2 measured comparison

| Workload | Task 1 checkpoint | Integrated Task 2 |
|---|---:|---:|
| 600-message warm panel (ms) | 76.13 | 68.38 |
| 2,000-message warm panel (ms) | 112.32 | 112.83 |
| Living full-card cold panel (ms) | 1191.36 | 1107.84 |
| Living full-card warm panel (ms) | 100.75 | 71.6 |
| Six-Sided full-card cold panel (ms) | 459.65 | 404.54 |
| Six-Sided full-card warm panel (ms) | 88.49 | 70.01 |
| Response processing (ms) | 0.9057 | 1.1467 |
| Empty prompt characters | 14949 | 14949 |
| Populated prompt characters | 18819 | 18819 |
| Living catalogue heap (bytes) | 782024 | 782024 |
| Six-Sided catalogue heap (bytes) | 539104 | 539216 |

Host counts match: one extraction request, six history fetches, one metadata write, two storage reads/four writes; panel 9,101 indexed message reads and the same six traversal families. No added polling or automatic refresh. The isolated response-processing median increased by 0.241 ms (about 27%); full-card warm panel medians improved in this run. This does not establish a real-host speedup or neutral response cost. Memory and timing changes are explicit rather than claimed cost-free; validate real-host responsiveness before release.
