# Living World compatibility — 2.9.14 RC proposal

## Delivery boundary and protected baseline

Repository: `marcusjeanr-ctrl/COMPANION-TESTING` only. The verified protected source
is `601e98e140227fbfa3ffd3066e4fd46417d1ddd0`, the merge of PR #8, version 2.9.13.
Work is on `compatibility/living-world-2.9.14-rc`. This proposal is for review:
**no merge, release tag, release publication or update to main is authorized.**
The original `marcusjeanr-ctrl/Companion` repository is untouched.

The annotated rollback tag is
`rollback/2.9.13-rc-before-living-world-601e98e`, pushed before source edits and
pointing to the exact baseline. Never move or overwrite it. The commit itself is
content-addressed. An attempt to install a GitHub tag ruleset preventing update
and deletion returned **403 Resource not accessible by integration**. Therefore
server-enforced tag immutability is **not claimed**; a repository administrator
must protect that exact tag if protection against privileged retagging is required.

## Full input inventory and evidence

Card: **Mushoku Tensei RPG — The Living World v1.0+: A New Beginning**, original
SHA-256 `21918f9b3f02ec9edbb4cc44565256078863d3b93eb7ab0fe5cbb708c4d33e1f`.
The complete JSON, not a reconstructed subset, is losslessly retained as a
compressed development fixture `tools/living_world_fixture.json.gz`. Exact parsed
JSON equality against the upload was checked. It is not loaded by the extension,
injected into prompts, or included in installable packages by `tools/package_rc.py`.

Inventory includes all core instructions, the introduction, all nine alternate
greetings, every field and all **1,004 original entry IDs: 998 enabled, six disabled**.
Core personality, start handler **577**, continuer **578**, HUD modules **104–127**,
mode entries **579–599**, school/spell entries **232–576**, sword entries **176–220**,
arc/memory entries **0–34**, people/races/monsters and locations are traceable.
Every enabled entry is read by normalization and catalog probes; no disabled entry
is activated. Original IDs, activation metadata, content and ordering are retained.

There are **124 groups of byte-identical entry contents**, including the 122
repeated spell entries in the Magic 1/Magic 2 books. They remain separate original
IDs in the register, but one catalog identity in Companion. Nothing in the card
is deleted, rewritten or reconciled by the extension audit.

Artifacts:

- [Inventory and core fields](inventory.json)
- [Every original ID, CSV](entry-coverage.csv)
- [Complete entry register, metadata and mechanic clauses, gzip JSON](entry-coverage.json.gz)
- [Direct per-entry runtime output](full-card-probe.json)
- [Named observational contracts and exact assertion references](mechanic-coverage.json)
- [Performance methodology and measurements](PERFORMANCE.json)

The entry counting unit is an original lorebook ID. All **998 enabled entries are
partially supported**; six disabled entries are not applicable. No entire enabled
entry is declared fully supported just because it normalizes or contains a catalog
name. Individual narrative behavior and live model interpretation remain untested.
The separate mechanic register identifies supported deterministic contracts. These
counts are not a gameplay compatibility percentage.

The supplied private export SHA-256 is
`3bb86fd30772e3a6463e39dff4dadf51d0159f8f9e6a2929560d759c9d5998a4`.
It contains **three messages, one readable tracking report, two genuinely distinct
Agenda commitments and zero individually reported player abilities**. Internal
States are readable and edited sources are rejected. Its initial Sandbox HUD
reports three magic schools and Advanced Sword God rank. These are school/style
ranks, not proof that every catalog spell/technique is known. Input bytes remain
unchanged; no private conversation, persona or settings are committed.

## Confirmed defects and targeted repairs

| ID | Evidence / cause | Repair and validation |
|---|---|---|
| LW01 | Baseline reads 123 spell references but ignores field-based `Tier / School / Status` definitions and plain Markdown school/rank bullets. Dedicated effects, schools and fan provenance are lost; the compressed fan-extension index can create malformed reference names. | Read explicit `Spell:` entry labels plus typed fields through the existing spell parser; read explicit ranked Markdown bullets; ignore the summary block whose detailed definitions are authoritative. Recognize Divine Strike as a school. All 244 field entries, including duplicate IDs, resolve to their first identical dedicated source with correct fan status. Candidate has **348** spell references, no automatic knowledge. |
| LW02 | Baseline finds **zero** techniques: neither Markdown `Rank/School` definitions nor ranked school bullets match old technique formats. | Add those explicit formats inside existing cached catalog construction. Prefer detailed definitions, preserve explicitly rankless techniques, exclude narrative qualification bullets, and retain fan markers. Candidate has **31** distinct technique references. No rank-only skill grants. |
| LW03 | `MUSHOKU_TENSEI_START_CONTINUER` is absent from turn-purpose recognition and is treated as a normal transaction-producing turn. | Recognize it alongside the existing continuation command; reuse snapshot isolation, source/swipe checks and display-only Internal States. Saved rewards are not replayed as new acquisitions. No extra extraction call or storage format. |
| LW04 | Actual export's `Sandbox — objective` selects canon Arc 3 from the year; explicit `Arc N DIVERGENCE:` is not parsed as an explicit personal arc. | An unscheduled `Sandbox —` frame has no clock-selected current/next arc, and its existing World panel says no scheduled canon progression. Parse explicit divergence without changing its number/name, and preserve an explicit late arc absent from the built-in reference index instead of substituting a date-selected arc. Preserve older Six-Sided `Sandbox:` canon-reference formats and dated-reference tests. |
| LW05 | Canonical `[SUMMON PACT: ...]` and `[SPIRIT: ...]` lines are preserved raw but absent from the existing World Contracts row. | Project explicit bound entities into that existing row. Omitted pacts stay unknown; friendly creatures do not become contracts. |
| LW06 | Core and continuer allow `Condition: Drain Syndrome (Year X of 10)`, while module 112 also documents `Drain Syndrome: Stage | Onset: ...`. Only the latter reaches the dedicated World status. | Accept both explicit forms, preserving the reported stage/year and leaving an unknown onset unknown. Do not calculate or invent progression. |
| LW07 | Legacy `Year: K.N | Day: N` World date extraction rejects days above 360, blanking the date during longer campaigns, even though its clock fallback already accepts them. | Accept bounded extended campaign-day counters through 999,999. Preserve the existing clock arithmetic and the separate strict 12×30 Six-Sided monthly calendar. Day 720→721 remains one day. No new calendar conversion or save migration. |

Focused tests reproduce six failing groups on the untouched baseline, then pass
against the candidate. These are confirmed output/parser defects. The catalogue
contains some narrative rules with differing language between core and modules;
Companion accepts their explicit observed outputs rather than choosing new physics.

## Mechanic coverage and intentional boundaries

| System | Companion handling / classification | Behavioral evidence / limitation |
|---|---|---|
| WORLD STATE and creation facts | Supported observational parsing; preserves raw HUD and reads explicitly initialized identity, ranks, mana and conditions | Card-format matrix, all catalogue greetings excluded as examples, actual export replay; no creation grant from card capabilities |
| Schools, spells, practice, learning, mastery | Supported catalog/state contracts; full effects partial | All field definitions, Markdown lists, existing source-backed historical assessments, multi-turn failed practice→learning→mastery; never auto-promote school ranks |
| Sword styles, techniques, Touki | Supported rank/reference/progression observations; full combat physics partial | 31 references, explicit rankless/detailed precedence, style rank and unchanged ability ownership; matchup triangle remains narrator law |
| Mana/casting/injuries/curses/conditions/eyes | Supported explicit observations; narrative effects partial | All four wound tags, persistent curse/eye lines, both Drain formats, existing eye/reserve/rest regression; no fabricated healing, curse cure or mana costs |
| Family/NPC identities and knowledge | Supported persistence/boundary contracts; all biographies partial | Leave/reenter with changed location; sparse turns retain identity/history; unrelated Merchant does not inherit Tutor's witnessed facts; existing inference/secret tests retained |
| Inventory/equipment/property/currency/organizations | Supported accepted-record storage/folds; economy simulation partial | Received/stowed key, owned workshop, income transaction, guild membership survive sparse updates; prior offered-item/reward idempotence regressions retained |
| Agenda/quests/objectives | Supported identity/progression observations; arbitrary extraction partial | Accepted lesson moves without duplication; stages can reset progress; prior distinct-occurrence, cancelled-objective and reward coverage retained |
| Time/travel/world conditions | Supported explicit HUD transition; calendar semantics partial | Locations change between turns, day 720→721, existing monthly rollover/birthday tests; Year and a campaign-relative Day do not establish a universal conversion |
| Sandbox and branching | Supported declared frames/outcomes; all branch scripts partial | Actual initial Sandbox fixed; explicit divergence retains number/title; existing event-ledger tests distinguish forecasts from established outcomes |
| Start and continuation | Supported initialization reading and snapshot display/isolation; live transfer partial | Commands 577/578, no-HUD guard classification, source-bound Internal States, active swipe selection, JSON-restored state; never infer rewards from pasted history |
| Item mode / non-standard origins | Partially supported | Form/Bearer/Powers/Bond remain raw HUD fields; no invented biological resources or new custom object UI. Outworlder restrictions remain narrator-established state |
| Arc histories / future scripts / dossiers | Reference-only until observed, partially supported | No automatic NPCs, quests, spells, historical events, fate flags, inherited memories or completed rewards from lore alone |
| Narrative style / physical laws / character agency | Not applicable as autonomous Companion simulation | Companion is a tracker, not a second narrator, damage engine, guild promotion calculator, translation system or arc-script executor |

Extraction still relies on the existing configured side model. A quoted source
supports provenance, not perfect semantic truth. Known historical abilities require
actual accepted evidence; no free-prose name-matching pass is introduced. The
existing source-backed `survival.abilities` representation and manual controls are
retained unchanged.

Continuation restoration follows the existing conservative boundary: the first
restored snapshot may display validated Internal States, but copied tracking is not
replayed as new transactions. Subsequent ordinary story turns track normally. This
is not an automatic import of a prior chat's entire NPC/family/quest database; a
HUD-only paste cannot restore information it does not contain. Real provider
interpretation of narrative newly added on the restoration turn remains a live
acceptance item.

The historical built-in Saga index remains a canon reference, not the full Living
World 23-arc engine. The card exposes only early arc registry entries to its lore
pool, and core personality contains a broader 23-arc list. Companion does not
invent dated future starts or rewrite that card. Late-arc reference indexing and
individual branch playthroughs remain partial; the accepted personal HUD is
preserved, including an explicit Arc 23 absent from the old index. No claim that all 23 arc titles/dates are independently reconstructed.

## Verification and reproducibility

- **34 regression suites**, both bundle syntax checks and synchronized 2.9.14 RC
  identity. Existing Six-Sided World, Overlord, Re:Zero, COTE, legacy formats,
  continuation/source integrity, universal tracking and historical tests retained.
- **Ten new named deterministic groups**, including full-card reference reading,
  all ten greetings, multi-turn tracking and JSON restart. Mocked reports test real
  parsing, storage, folds and payloads; they are not live provider extraction.
- **13 Chromium UI tests + five visibility tests**, including Living World
  continuation Internal States and Sandbox/pact/Drain rendering. Host bridge is
  mocked; no real Lumiverse instance is available.
- Actual opening export: two distinct Agenda events retained; one report and
  Internal States readable; no individual ability invented; source edit rejected;
  source bytes unchanged. Opening scene is not comprehensive gameplay evidence.
- Full lossless card comparison, all enabled entry normalization, explicit source
  definitions and disabled-entry exclusion. No TypeScript/build/lint configuration
  is invented; repository ships the existing bundles.

```sh
export PATH=/workspace/.companion-tools/node_modules/.bin:$PATH
node tools/check_release.cjs
node tools/run_tests.cjs
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_ui_browser.py
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_visibility_browser.py
python3 tools/build_living_world_coverage.py /tmp/living-world-register /private/card.json
node tools/audit_living_world.cjs /private/card.json /private/living-world-export.json
```

Live acceptance must cover installation, an actual compatible side model, learning,
practice, explicit mastery, postponements, family leave/reentry, privacy, restart,
active swipes, continuation and representative branch/sandbox/non-standard starts.
Every individual lorebook mechanic and long campaign is not certified by these
contracts. No complete compatibility claim, merge or publication follows from a
passing mock suite.

## Exact rollback

No rollback is currently needed on main: this PR has not been merged. To inspect
or package the exact original 2.9.13 code from a clean checkout:

```sh
git fetch origin main 'refs/tags/rollback/2.9.13-rc-before-living-world-601e98e:refs/tags/rollback/2.9.13-rc-before-living-world-601e98e'
git switch --detach rollback/2.9.13-rc-before-living-world-601e98e
git rev-parse HEAD
# Must print 601e98e140227fbfa3ffd3066e4fd46417d1ddd0.
node tools/check_release.cjs
python3 tools/package_rc.py /tmp/RPG_Companion_HMS_2.9.13_RC.zip
```

This does not publish or force-push anything. Back up current Lumiverse chat and
extension data before an installation rollback; this patch introduces no schema
migration or destructive conversion. Repository rollback after any future approval
should be a reviewed revert PR: `git revert -m 1 <compatibility-merge-SHA>` for a
merge commit, or `git revert <compatibility-squash-SHA>` if squashed. Never reset or
force-push main, and never repoint the rollback tag. The merge SHA is intentionally
not supplied now because no merge has occurred.

## Files changed and RC changelog

`dist/backend.js`: targeted format adapters, turn-purpose recognition, literal
World projections and extended-day display. `dist/frontend.js`: one Sandbox
status phrase and candidate version only; no layout/preset redesign.
`spindle.json`, README and changelog identify the review candidate. New card
fixture, runtime tests, read-only audit, coverage builder and measurement helper
are development tools. Existing test runner/browser fixture include new coverage.
No dependency, timer, schema migration, model call or automatic refresh is added.

2.9.14 RC proposal: read Living World's explicit spell/technique formats; retain
fan provenance and rankless definitions; recognize its continuer; preserve
unscheduled Sandbox/divergence identity; display explicit pacts/Drain state and
extended campaign days; retain universal tracking and saved-state compatibility.
See the root changelog for the release-candidate summary. Not published.

## Measured performance assessment

| Workload | 2.9.13 baseline | Candidate |
|---|---:|---:|
| 600 messages, cold / warm ms | 249.94 / 76.24 | 225.77 / 56.50 |
| 2,000 messages, cold / warm ms | 550.34 / 119.58 | 536.59 / 110.61 |
| Full Living World card + 600 messages, cold / warm ms | 1153.98 / 90.29 | 1176.54 / 84.01 |
| Response processing microbenchmark, median ms | 0.9470 | 1.0623 |

The isolated response-processing median increased by 0.1153 ms (12.2%) across six alternating pairs. Its response-processing function is unchanged; local VM/JIT/load effects are not independently isolated. The observed difference is reported, not hidden as zero overhead. It is below 0.2 ms per response in this workload and does not establish live provider/UI latency. The full-card cold read and additional cache memory costs are also explicit below.

Full-card catalog retained heap: **381,336 → 768,120 bytes**. The additional 386,784 bytes retain 348 spell / 31 technique references instead of 123 / zero. This is useful additional reference data, not free functionality.
Catalog cold / cached median: 87.457 / 0.00113 ms → 103.654 / 0.00107 ms. Fixture + VM retained heap: 12,120,744 → 12,128,256 bytes.

Operation counts match: one normal extraction call, six mock history fetches, one metadata write, two storage reads/four writes, 9,101 panel index reads and the same traversal families. Measured empty/populated prompts remain 14,892 / 18,721 characters; these are not token counts. Catalogs reuse existing caches and do not add full-chat traversals or refresh frequency.

Synthetic timings vary with host load and JIT; modest differences are not a universal speedup. No material warm-panel slowdown appears in these comparable local workloads. No leak test, real WebView/provider latency certification or exhaustive long-campaign performance guarantee is claimed.

Reproduce normal timing with `COMPANION_BIND_READINGS=1 node tools/benchmark_panel_reads.cjs BASELINE CANDIDATE`, repeat with `COMPANION_BENCH_REPLIES=1000`; set `COMPANION_CARD=/private/card.json` for the full-card workload. Use `node tools/benchmark_tracking_pipeline.cjs BASELINE CANDIDATE`, `node tools/measure_tracking_operations_2_9_1.cjs BACKEND`, and `node --expose-gc tools/measure_living_world.cjs BACKEND` for pipeline/counts/memory. Repeat alternating orders as recorded in PERFORMANCE.json.
