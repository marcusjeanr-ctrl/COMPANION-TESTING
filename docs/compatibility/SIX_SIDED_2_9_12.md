# Six-Sided World compatibility investigation — 2.9.12 RC

This is a targeted integration of the actual supplied card with the current
COMPANION-TESTING runtime, preserving 2.9.11. It is **not complete compatibility
certification**. The complete 16-phase master specification and supplemental
inventory requirements govern this investigation. No RP card, preset or original
Companion repository was modified. There is no live Lumiverse instance available.

## Evidence and reproducibility

- Repository baseline: `8d54bc65cfe965291329d812b8dfcec64ed6148a`, version 2.9.11.
  The newly supplied repository ZIP has identical manifest and gameplay bundles.
- Complete card SHA-256:
  `df2fd8b90c1f8ee1bac2a054dd7acb60d165555022a7e8c59e34d149d84a69d7`.
- [Inventory summary](six-sided-inventory-summary.json) covers every top-level
  text field and all 11 alternate greetings, with lengths/hashes and greeting
  headings. Description is the HMS engine; personality/scenario/system prompt
  and greetings are also inspected. Empty example/post-history fields are recorded.
- [Per-entry CSV](six-sided-coverage.csv) retains all **1,296 original CSV IDs**,
  triggers, enabled flags, content hashes, JSON source pointers, runtime references,
  concrete assertion references and explicit coverage limitations.
- [Full machine register, gzip JSON](six-sided-coverage.json.gz) additionally
  records activation settings, rule excerpts and source-field provenance. Decompress
  with Python's standard `gzip` module or any gzip reader.
- CSV cross-check: zero ID, enabled, label, category, trigger or content-length
  mismatches. **1,273 enabled / 23 disabled**. The preliminary report did not run
  tests; its filenames and mechanism groups are leads, not proof of coverage.
  For example, ID 3 is a historical canon event rather than a magic acquisition.
- The extension mirror has identical content for all 1,296 entries, but 1,291 IDs,
  all labels/extensions and five insertion orders differ. Original `data.character_book`
  IDs remain authoritative for this register. Original ID **285** has an extra
  `Trigger: Luke Murders Ariel` key absent from its mirror. Neither card copy is edited.
- All entries have priority 10, probability 100, zero cooldown/delay and no regex;
  69 have sticky=3. All are nonconstant. Enabled entries are nonselective; the 23
  disabled entries are selective. Host activation still owns sticky/recursive/depth
  behavior; Companion does not recreate the host's activation scheduler.

Reproduce privately without checking the complete card or exports into Git:

```sh
python3 tools/audit_six_sided.py /private/card.json /private/inventory.csv /tmp/coverage
node tools/test_six_sided_integration.cjs
node tools/test_universal_six_sided_matrix.cjs
node tools/check_release.cjs
node tools/run_tests.cjs
```

The register is conservative: **450 partially supported, 820 narrator-dependent,
23 not applicable (disabled), and 3 background-history entries compatible by
design** (IDs 50, 256, 942). No entry is marked fully supported and verified from
generic tests. Dossiers, spells, monsters, items and factions can contain mechanics;
they are not dismissed as narrative-only because no dedicated panel exists.
Direct per-entry execution verifies normalization/identity/disabled/content
invariants, **not every possible narrative effect**. Family-level assertion
references are explicitly labelled; they are not claimed as individual spell,
NPC biography or alternate-history outcome simulations.

## Confirmed defects, minimal fixes and regression evidence

| Defect / reproduction on 2.9.11 | Root cause and changed behavior | Regression / risk boundary |
|---|---|---|
| Actual Visual `Era / Arc`, `[DEMON EYE]:` and combined `[CURSE / BLESSING]:` fields disappear from the World projection | `worldMushoku` matched older plain/bracket spellings only. Accept documented spellings, preserving actual text. Combined modifiers keep a neutral type; frontend no longer calls every non-CURSE modifier a blessing. | `test_six_sided_integration.cjs`: Classic/Visual projection, neutral combined tag, guild F vs Magic Guild; real-browser World rendering. No power activation or lore-derived grants. |
| Documented `Guild: F (0/25 to E)` has no adventurer projection | The World reader recognized only legacy `Adventurer: F-Rank`. Accept explicit F/E/D/C/B/A/S rank tokens in Guild fields. | Magic Guild is not treated as a rank; promotion counters and purse remain literal HUD data, not invented transactions. |
| An established age of 1200 becomes unknown, and non-casters without power fields keep comma-combined location segments | `ageField` allowed only three digits; geographic normalization required a magic/sword/mana line as well as the Armored Dragon calendar. Accept up to six age digits; use the calendar identity for the existing geography splitter. | Unknown age/birth remain unknown; five continents/custom places and no assumed magic. No guessed birthday or geographic hierarchy. |
| Player in party roster becomes an NPC Mind/routine | `simKeyer` returned a roster match before checking the established player name. Check direct identity and resolved unique roster identity against player keys. | Player + explicit unique alias excluded; similar full-name NPC retained; normal Characters data untouched. No speculative nickname/title discovery. |
| Disabled imported lore survives; ID zero and export activation fields are lost | `loreNormEntry` understood only host `disabled`, used falsy ID fallback and ignored exported secondary keys/nested settings. Accept export fields while preserving explicit host-field precedence. An explicitly disabled-only book clears its old enabled pool. | Tests cover ID 0, both disabled flags, host 0/false precedence, settings, secondary keys and stale-pool removal. Transient empty snapshots retain existing fallback behavior. |
| Existing Visual field edit drops its icon/bold label | `rewriteHud` spliced a plain replacement into a styled source line. Preserve its existing prefix only when the label/key still match. | Change Equipment without altering other lines or prose. No HUD template reconstruction; newly inserted lines are not automatically restyled. |
| Explicitly labelled fenced/HTML HUD example is read as current state | `findHud` searched examples as normal text, and HTML fallback stripped their code wrappers. Mask labelled examples with equal-length blanks before existing reads. | Example before real state selects real state; explicit continuation unwraps saves. **Unlabelled legacy fenced/HTML HUDs remain supported.** Arbitrary unlabelled examples remain ambiguous. |

All six new regression groups fail on the original baseline; the primary five
groups were recorded before fixes, and the example case was reproduced separately.
The disabled-only stale-pool case was reproduced during review and added before
its fix. Tests use actual bundle functions, not substitute tracking implementations.
No live saved records are rewritten, discarded or merged by this integration.

## Results across all 16 phases

### 1. Complete card/source inventory

All 1,296 original entries are content-indexed, runtime-normalized and assigned
explicit handling/test/limitation records. Every enabled and disabled module is
accounted for. Header/category classification is deliberately conservative and
checks actual content for explicit condition/effect/HUD directives. Core system
entries 1166–1174, 1195–1206, 1229–1231, all 22 World State arcs 1207–1228, and all
64 Start Cards 1232–1295 are included. Other mechanics/creatures/skills/divergences
are mapped to their existing tracker or narrator-owned rule family. This is an
inventory and evaluation, not semantic execution of 1,296 complete stories.

### 2. Character creation and identity

The 32 synthetic legal configurations exercise all eight documented race names,
Native/Reincarnate/Otherworlder, noncaster, martial, mage, hybrid, canon actor,
noble/villager/merchant, long-lived and no-established-family cases. Names/origins
are literal, with no canonical player assumptions. No rank-only spell grants or
fabricated relatives. Player autonomy exclusion is fixed as described above.
Creation legality/defaults still belong to the card's Start Handler and Start Locks
(1230/1206), not a second validator. Conflicting identical names, unestablished
aliases, species-specific physical maturity and provider-generated starts require
further evidence; the parser does not independently resolve them.

### 3. Complete HUD and cross-field integrity

Classic and Visual current observations feed `parseHud`, `hmsReadSystems` and
`worldMushoku`. Dates, geographic paths, race/origin/age, mana reserve, Touki,
styles/schools, casting, eyes/modifiers, Guild and Saga have focused checks.
Memory, Game Mode, status/exhaustion, equipment, injuries, renown/epithet, turning
points, Canon references/clock, active paths/checkpoints and Present remain
available in the raw HUD and existing configurable panels; not every optional
field has a dedicated typed World property. Original layout/prose are preserved.

Missing/null tracking fields retain prior established tracker records. Current
HUD projections intentionally show the current supplied HUD; omission is **not**
a death/deletion or a storage migration. Explicit temporary slot disappearance
does not get silently restored. The existing HUD guard flags missing persistent
lines but cannot decide every card's omitted/expired/removed semantics. There is
no new automatic reconstruction from old HUDs. Hidden Shown/True values retain
their existing distinction. Numeric mana costs, recovery, injury healing,
equipment/ownership, guild promotion and rank/technique consistency are not
independently simulated or corrected by this patch.

### 4. Magic, sword, Touki and progression

Full-card runtime reference results: **111 spells, 22 accepted chants, 23 techniques**.
Existing study/known/mastered, failed-attempt, possession-vs-knowledge, aliases,
forget/relearn and active-swipe regressions pass. All seven ladder tiers remain
reference eligibility, not automatic mastery. Literal Locked / Available-inactive /
Active / Inactive Touki states and reserve changes are preserved independently.
The card's canon Battle Aura entry 1116 explicitly permits Laplace-factor holders
with differing Touki aptitude: no universal prohibition is added. Every ritual,
unique spell effect, magical armor dependency, age-cap and numeric cost combination
is **not** certified. The archived test expecting 25 chants is not evidence that
three accepted chants were lost: it asserts a different extraction contract.

### 5. Geography and time

The existing 30-day/12-month calendar, named/numbered formats, rollovers, deadlines,
sub-arcs and birthdays retain their regression coverage. Five continents and new
settlement/room paths are tested. Atlas retains temporal Calamity/reference and
cross-world isolation tests; room changes do not generate travel transactions.
Age is displayed from established output; Companion does not invent a birth date,
automatically calculate every NPC's birthday, enforce travel durations or fabricate
language knowledge. Language strings remain literal `worldMushoku.languages`;
untranslated dialogue and fluency enforcement are narrator-owned. Calendar years
outside the existing 3–4 digit K parser range remain an explicit limitation.

### 6. NPCs, family, relationships and Internal States

Existing persistence, departures/returns, reliable location priority, directed
relationships, bond limits, source-bound continuation metadata and per-swipe
rendering tests pass. Dossiers do not automatically create NPCs. The player remains
eligible for Characters while excluded from NPC Minds/routines when identity is
established. Repetitive bond concatenation was not reproduced; no speculative
relationship rewrite was made. Arbitrary huge casts/family graphs and unreported
off-screen changes are not fully verified. Established narrator-private inner
states remain audience-side panel data, not newly established player knowledge.

### 7. Knowledge and secrets

Preserve 2.9.11 evidence/guess/gossip certainty guards, direct reports, later
confirmation, owner-isolated secrets and active-source validity. Narrator knowledge,
private thoughts and proximity alone do not transfer knowledge. No model-driven
fact checker or automatic omniscient spread is added. Automated tests cannot prove
that a live provider will always label an information vector correctly or respect
language barriers/deception; conflicting reports remain an evidence limitation.

### 8. Agenda, quests and objectives

All repeated-description, exact-time/participant/location distinction, ambiguity,
terminal-status, reschedule/manual override, stage reset/reward/history and NPC
routine separation tests pass. Actual maintenance export still yields four
commitments with preserved terminal statuses. No new quest/event reconciler.
Free-text semantic ambiguity and every possible recurrence pattern are not certified.

### 9. Inventory, equipment and economy

Existing ownership-vs-authorization, promised/nearby/borrowed/stored/consumed,
transfer and currency tests pass. Raw Guild purse is not treated as a new payment;
literal rank parsing does not promote the player. Price tables, regional conversion,
crafting, artifact effects and all independent storage-site mechanics depend on
established narrator output. No inventory or currency migration/recalculation.

### 10. Canon, sandbox and divergent states

All 22 arcs, 64 calendar rows, era/sandbox frames, Living/Keep/Join/Off-Screen/None
tokens and actual-event-vs-reference boundaries have tests. Visual personal frames
now reach Saga. A future/reference row does not create an occurred event. Canon
Ledger, active paths, checkpoints and Guide remain narrator HUD facts; the extension
does not force canon, execute every divergence or infer an off-screen event from a
date. Sandbox without an explicit personal arc still has a **reference** timeline,
not an assertion that its events occurred. Every alternate-history ripple remains
unverified individually. No new Six-Sided-only fork or simulation scheduler.

### 11. Continuation and long-term tracking

Existing Save/OOC filtering and Continue restoration paths preserve per-swipe
metadata, passive records and manual corrections without replaying transactions.
Private continuation export passes the actual render-processor test. A new chat
receiving only the card's HUD/Save Notes does **not** magically contain the old
chat's extension metadata: the narrator may re-establish records, while old exact
Internal States/history require supplied messages/metadata or an actual host
transfer. No cross-chat import, full-chat rescan or fabricated recovery is added.
Multi-chat host reload/persistence/branch acceptance still requires live Lumiverse.

### 12. UI verification

Real Chromium with a mock host: existing narrow layouts, long spell/study text,
drawer/float/popout, theme/density/text settings, chat isolation and visibility
behavior plus the new long-lived/Visual eye/neutral multilingual modifier check.
There is no redesign. This is DOM/browser evidence, **not** a real Lumiverse WebView
or every large-family/long-name/font combination. Inserting a new Visual HUD row
still uses the existing insertion behavior; only an existing row's label style is
preserved by the new edit fix.

### 13. Universal test matrix

`test_universal_six_sided_matrix.cjs` provides **32 synthetic legal configurations**
corresponding to all 30 requested scenario families plus Off-Screen/None modes.
These assert identity/resource/rank parsing and absence of invented abilities,
family/events; a scenario label is **not** claimed as full scenario outcome coverage.
Focused storage/progression/continuation suites supply deeper transition tests.
`test_six_sided_integration.cjs` supplies six new defect groups with adverse cases.
The complete supplied card is an optional private input for the per-entry probe;
committed fixtures contain synthetic text, not the complete card or chat exports.

### 14. Other RPG cards

The existing universal matrix and integrity suites exercise Mushoku Living World,
Re:Zero, Overlord, COTE, legacy formats and generic/non-HMS behavior. No canon/rank
law is imposed on another world. Unlabelled fenced/HTML HUD support is deliberately
retained for legacy compatibility; only explicitly labelled examples are ignored.
No complete new files for all other cards were supplied, so their full behavior
and live providers are not certified from format fixtures.

### 15. Performance, stability and data safety

See [performance evidence](PERFORMANCE_2_9_12.json). Compare immutable 2.9.11 and
final candidate backends on Node 22 with alternating order, identical source-bound
600/2,000-message fixtures, cold/warm panel reads, pipeline and GC heap samples.
Count real mock transport calls/writes/traversals, not timing alone. Also run the
same full supplied lorebook through each panel benchmark. These are local synthetic
workloads; no provider bill, actual tokenizer, host database latency or live memory
leak certification is claimed. Prompt character counts are not token counts.
No additional runtime network/model calls, polling, full-chat scans, dependencies,
metadata schema or storage migrations are introduced. Existing caches/read passes,
queued writes and source validation remain unchanged.

| Measurement (median of comparable process results) | 2.9.11 | 2.9.12 candidate |
|---|---:|---:|
| 600 messages: cold / warm panel ms | 156.77 / 43.42 | 159.37 / 43.66 |
| 2,000 messages: cold / warm panel ms, 10 pairs | 335.53 / 69.27 | 340.48 / 71.86 |
| Parse / process / prompt construction ms | 0.4378 / 0.5469 / 0.2606 | 0.4126 / 0.5398 / 0.2591 |
| Empty / populated prompt characters | 14,832 / 18,528 | 14,832 / 18,528 |
| VM + 1,000-message fixture heap bytes | 11,841,816 | 11,846,400 |
| Additional Internal States cache heap bytes | 164,272 | 164,272 |

The initial five large-history pairs showed a 5.35% difference between aggregate
warm medians. A separate five-pair repeat showed 3.23%; all ten pairs show 3.73%
(2.59 ms). This does not establish zero cost or a speedup; it is below the 5%
review tolerance after repetition. Transport counts are identical: model 1,
history fetches 6, metadata writes 1, storage reads/writes 2/4; panel history-index
accesses 9,101 with the same traversal families. Full-card timing pairs and raw
browser-render samples are included in the JSON, with their smaller sample limits.
Raw bundle growth is small; release archive growth also includes the requested
coverage documents/register, which are not loaded into runtime prompts or caches.

### 16. Review, PR, CI and release

Version identity is synchronized to **2.9.12 RC**. Changes use COMPANION-TESTING's
feature branch → reviewed diff → PR → read-only validation/browser CI → verified
draft staging → merge → main CI → manual hash-gated publication process. The manual
publisher remains separate from validation and requires a tested exact commit/hash.
Final commit, PR/check links and publication evidence are reported with the release;
no text here substitutes for GitHub confirmation. Stable acceptance requires real
installation/update, reload persistence and representative-card playthroughs.

## Validation and archived-harness interpretation

- Standard runner: **31 suites** plus both bundle syntax checks; identity check.
- Browser: **10 UI + 5 visibility tests** in actual Chromium/mock host.
- Private maintenance replay: **7/7 Agenda + 5/5 additional tracking groups**.
- Private continuation replay: **6/6 groups**, including restored first-panel HTML.
- Full-card probe: all 1,296 normalization invariants; all 23 disabled excluded,
  original IDs retained; no automatic spell knowledge or NPC population.
- Original card/CSV/private exports remain byte-for-byte unchanged and outside Git.

The archived `test_updated_six_sided.cjs` was run separately on the baseline:
**1/10 groups passed**. It expects old `hud.style`, semantic `.lines[].text`, old
purpose/auxiliary marker contracts, 25 chants, a particular modifier category and
all fenced examples rejected. Current tests instead verify raw Visual round-trip,
semantic readers, current `companion*` purpose functions and actual event paths.
Its Visual edit/example issues supplied useful leads; the new tests independently
reproduce the applicable defects. Its assertions were not weakened or counted as
passed. Directly invoking `runSeparateUpdate` is not equivalent to the ordinary
Save/Continue event path; existing event-boundary and private replay tests remain
the applicable transaction evidence. These historical harness mismatches are
reported explicitly rather than imported wholesale or hidden by a passing total.

## Remaining acceptance work and changes to avoid

Files changed: `dist/backend.js` (targeted readers/identity/normalization),
`dist/frontend.js` (neutral combined modifier label and RC identity), `spindle.json`,
`CHANGELOG.md`, `README.md` (version/release documentation), `tools/run_tests.cjs`
(two new suites), `tools/test_six_sided_integration.cjs`,
`tools/test_universal_six_sided_matrix.cjs`, `tools/test_ui_browser.py`
(regressions), `tools/audit_six_sided.py`, `tools/probe_six_sided_card.cjs`
(read-only reproducible audit), and this directory's report/register/measurements.
No preset, permission, release workflow, updater identifier or storage field changes.

Live Lumiverse must verify installation/update discovery, actual host world-book
representation/activation (including sticky entries), provider extraction with
both HUD styles, save/continue/reload and swipe changes, player aliases and privacy,
large casts/families, all representative modes, noncaster starts and cross-card
playthroughs. Every entry's individual rule/cost/causal outcome is not certified.
Card-internal conflicting generic HUD/forced Calamity/system directives can still
cause narrator output errors; the RP card is intentionally unchanged.

Do **not** turn lore references into automatically known skills, populate every
dossier as an active NPC, use True hidden power as universal NPC knowledge, force
canon by calendar, merge same-name people/quests without evidence, import unrelated
chat state, erase omitted persistent facts, invent birth dates or add polling/model
calls to fill unknowns. Additional defects need a concrete reproduction, targeted
fix and adverse regression before any later integration patch.
