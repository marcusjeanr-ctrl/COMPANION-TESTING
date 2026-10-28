# Magic tracking rework — 2.9.15 RC candidate

## Baseline and scope

Baseline: published 2.9.14 RC, `415392cd3decefbae260ff898c0a94792656695f`.
Repository: `marcusjeanr-ctrl/COMPANION-TESTING` only. Development branch:
`fix/magic-identity-progression-2.9.15-rc`. This is a tested candidate for a review
PR, not a claim of publication or live Lumiverse certification. Original Companion,
card content, presets, dependencies, UI layout and unrelated tracking are unchanged.
No historical rebuild or consolidation was run.

## Actual export reproduction

The five-message export SHA-256 is
`bf7d17b57073ab2e15e229931df51a00978d8344eb5a057eea3d77dd48154ab7`.
It has two readable tracking reports. The spell audit is already present in saved
metadata; no new model call is needed to recover its individual spell identities.

| Read-only replay | Published 2.9.14 | Candidate |
|---|---:|---:|
| Spellbook items (including malformed records) | 10 | 10 |
| Correct individual audit spells marked Known | 2 | 10 |
| Malformed Known rows under Other | 8 | 0 |

The ten individual spells are Squall, Blizzard Storm, Ice Fortress, Stone Cannon,
Earth Pillar, Earth Lance, Sinkhole, Fireball, Heat Hand and Ground Sense. They
resolve to existing catalogue identities. Ground Sense stays **Known** and retains
its range weakness; the audit does not create current Studying or Mastered state.
Casting method and school/style rank observations remain in their existing HUD/
World representations rather than being mistaken for individual learned spells.

The source report contains wrongly grouped strings and some school-level ability
assessments. The repair normalizes their interpretation inside the existing fold;
it does not rewrite the original reports. Input bytes are unchanged. A JSON-restored
runtime reproduces the corrected ten-spell state. Private narrative/settings are
not committed. The real export is evidence for this audit, not a full playthrough.

## Confirmed causes and repairs

| ID | Evidence / cause | Targeted repair |
|---|---|---|
| MG01 — grouped identities | Resolver accepts one name; the saved value `Water Magic (Advanced): Squall, Blizzard Storm, Ice Fortress` therefore becomes one unknown identity. | Extend the existing resolver with bounded, cached report-name normalization. Split typed school/known lists and recognizably named lists into individual canonical identities. Exact catalogue names win before delimiter handling; no substring matching. |
| MG02 — category contamination | Legacy `you.spells` and optional assessments can contain school/style ranks or casting-method labels. They were all treated as individual abilities. | Exclude automatic category labels from individual spell knowledge and tighten the existing extraction contract to one confirmed named ability per row. Preserve explicit manual corrections. No rank-only grant or extra extraction pass. |
| MG03 — qualifications and weakness loss | `Ground Sense (weak — never held over distance)` is a different key from Ground Sense; useful qualifications can disappear on repeated reports or fail to reach known rows. | Separate recognized qualifications from identity, retain notes through sparse confirmations, and show notes using the existing row style. Preserve unknown named abilities separately and exact named variants. New explicit mastery/superseding assessments can replace obsolete notes/evidence; original history remains intact. |
| MG04 — practice mistaken for acquisition | Current Known abilities generally disappear from active practice unless a historical-evidence special case applies. | Reconcile knowledge and deliberate practice independently. A known spell remains Known while an actual practice record can remain ongoing. Preserve explicit percentages including zero/reset; never manufacture progress. Manual Known completes prior practice using the existing stopped-study anchor; genuinely later practice can resume. |
| MG05 — stale provenance / precedence | An older established-list observation or evidence can mask a later accepted learning/mastery update. | Prefer the latest accepted canonical observation while retaining manual negatives and historical/current precedence. Avoid displaying obsolete assessment evidence after later learning/mastery. |
| MG06 — lost Melded requirements | Markdown references discarded component requirements and deliberately nulled explicit rank steps; some inaccessible spells appeared Within Reach. | Retain explicit components and ranks. Missing prerequisites stay locked. If Melded proficiency cannot be established from the HUD, report unknown access rather than inventing it. Honor an explicitly reported Melded rank. Established knowledge still takes precedence over reference eligibility. |
| MG07 — reference-list eligibility | Explicit Known-list parsing runs before metadata eligibility; hidden/OOC/continuation lists can grant knowledge. | Apply the existing visibility/snapshot boundary before reading owned knowledge, while retaining all assistant message order positions for saved manual anchors. Internal States rendering is unchanged. |
| MG08 — incoming list truncation | A ten-name individual confirmation is cut to eight `spells`, six `learned`, or six `mastered` names by the parser. This would undermine singular-name extraction. | Retain up to 32 named observations in each of those existing arrays, with the existing 160-character identity bound. The ten-spell pipeline regression verifies parsing and storage. Optional quoted assessments and deliberate study retain their existing eight-row bounds. |
| MG09 — legacy object flags | Legacy name extraction could discard explicit NPC ownership/uncertainty before validating a learned/study object. | Honor those flags before extracting names and again when reading older object-shaped records. Name-only legacy objects remain usable. This is reproduced synthetically, not asserted to have occurred in the supplied export. |

These are distinct from unproven provider failures. An NPC's claim must be accepted
as reliable player knowledge by the existing extraction contract; the normalizer
is not an independent lie detector or general prose inference engine.

## Pipeline and saved-data compatibility

Existing path remains:
`buildCompanionInstructionRead → parseCompanion → per-swipe metadata → spellStoryFold`
`→ spellResolveState / spellKnown → spellListPanel / hmsMagicPanel → existing UI`.
There is one canonical name interpretation shared by legacy reports, structured
assessments, study progress and manual controls; no second tracker or store.

Names are normalized before chronological reconciliation, so a later loss or manual
negative can affect the correct member of an earlier grouped record. Existing
source fingerprints, active swipes, chat isolation, refresh behavior and metadata
storage formats remain authoritative. Old grouped manual-negative keys are honored
when their source groups remain reconstructible. Positive manual entries are
retained, including unknown custom abilities.

No destructive migration or forced reread is required. Raw legacy transaction
arrays remain provenance, not a second mutable spellbook. New reports request
individual spell/technique names; casting method and school ranks are not mastery
of every spell. Existing optional source quotes/ownership/uncertainty checks remain.

An old manual correction that has no saved action timestamp cannot be dated
retroactively. Such knowledge remains Known conservatively; reapplying Known
establishes the existing study boundary for future practice. No timestamp is invented.

## Complete Living World magic inventory

The supplied card is unchanged from the complete 2.9.14 reference, SHA-256
`21918f9b3f02ec9edbb4cc44565256078863d3b93eb7ab0fe5cbb708c4d33e1f`.
Reuse `tools/living_world_fixture.json.gz`; no duplicate full-card fixture is added.
The previous [full card inventory](../living_world_2_9_14/REPORT.md) remains available.

This pass inventories **345 magic entries**: **244 typed individual entries**
(including the 122 identical Magic 1/Magic 2 pairs), **68 school/rank list entries**,
and **33 index/rule/reference entries**. They resolve to **348 canonical spell
references**, with every reference linked to its original entry IDs.

- Nine ranked schools: Water, Fire, Wind, Earth, Healing, Detoxification,
  Divine Strike, Barrier and Summoning; all seven rank readings are tested.
- Melded entries retain their own stated rank and component information.
- Unique/Inherent references retain their special classification and attributed
  restrictions; catalogue presence never establishes player possession.
- The Master Spell Index supplements detailed definitions rather than creating a
  second owned record. Duplicate definitions preserve all original card content.
- A spell listed in multiple categories, such as Magma Gush, keeps one canonical
  identity and the prior primary school, plus alternate source-school metadata.
  This is not a claim that every source's taxonomy is identical.
- Squall, Blizzard Storm, Ice Fortress and Ground Sense have individual school/rank,
  description and status even without standalone entries.

Artifacts: [spell-by-spell CSV](spell-coverage.csv),
[original magic entry IDs + complete reference register](magic-coverage.json.gz),
[inventory counts](inventory.json), [behavioral contracts](behavioral-coverage.json),
[source/function references](source-references.json), [performance](PERFORMANCE.json).

Reproduce the structural inventory with `node tools/audit_magic_catalogue.cjs`;
regenerate these registers with `python3 tools/build_magic_coverage_2_9_15.py OUTPUT_DIRECTORY`.
Each entry's full content and metadata remain in the existing lossless fixture.
Reference parsing is verified; independent execution of 348 fictional spell effects
is not implied by the inventory or the test count.

## Verification

- **35 regression suites**, both shipped-bundle syntax checks and release identity.
  Existing Living World, Six-Sided, Re:Zero, Overlord, COTE, legacy formats,
  source/swipe integrity, continuation and tracking suites are retained.
- **18 new behavioral groups** cover grouped names, category exclusion, aliases,
  qualifications/unknowns, all 348 independent Known identities, nine schools and
  seven ranks, Melded prerequisites, successful versus attempted reports,
  NPC/owner/hypothetical boundaries, hidden/reference lists, known practice,
  manual completion, legitimate resets, retractions, swipes/edits, repeated refresh,
  JSON restart and ten-name parser/storage retention.
- **15 Chromium UI tests + five visibility tests**, including the synthetic full
  catalogue audit, search, Known status, weakness-note visibility and escaped text.
  Existing controls/layout remain intact. Lumiverse bridge is mocked.
- Actual private-export replay verifies ten canonical Known spells, zero malformed
  Known Other rows, retained weakness, no invented mastery, safe source rejection
  and unchanged input bytes. No live API/model extraction was called.

```sh
export PATH=/workspace/.companion-tools/node_modules/.bin:$PATH
node tools/check_release.cjs
node tools/run_tests.cjs
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_ui_browser.py
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_visibility_browser.py
node tools/audit_magic_catalogue.cjs
node tools/audit_magic_export_2_9_15.cjs /private/spell-audit-export.json
```

The full-reference Known test uses synthetic accepted reports. User actions, NPC
statements, narration and starting facts must still be correctly attributed by the
existing provider or explicit owned-list format. Merely mentioning or attempting a
spell, observing another caster or possessing a school rank does not grant it.

## Performance comparison

Node 22.22.2, identical synthetic fixtures and alternating fresh processes; medians of process medians. Raw results, source hashes and methodology are in [PERFORMANCE.json](PERFORMANCE.json). No live provider or Lumiverse timing is implied.

| Workload | 2.9.14 | Candidate |
|---|---:|---:|
| 600-message warm panel (ms) | 63.37 | 66.56 |
| 2,000-message warm panel (ms) | 103.5 | 104.2 |
| Full-card warm panel (ms) | 72.94 | 75.05 |
| Grouped full-card warm panel (ms) | 87.9 | 81.35 |
| Full-card cold panel (ms) | 943.16 | 1191 |
| Grouped full-card cold panel (ms) | 1000.37 | 1079.54 |
| Response processing (ms) | 0.8745 | 0.9812 |
| Additional catalogue heap (bytes) | 768152 | 781904 |

Operation counts match: one model request, six host history reads, one metadata write, two storage reads and four writes per processing fixture; panel history element reads remain 9,101 with the same six traversal families. No polling or refresh frequency changes. Empty prompt stays 14,892 characters; populated prompt grows 47 characters (18,721 → 18,768, about 0.25%), not a token measurement.

The added catalogue heap is about 14 KB. Warm and cold timing changes vary by workload; there is no claim of zero overhead or a universal speedup. In particular, grouped inputs now produce individual canonical facts rather than opaque labels, adding useful reconciliation work. No extra history traversal or model call is introduced. The latest full-card cold median rose by about 248 ms (26%); an earlier same-workload comparison varied in the opposite direction, so cold-start cost remains a live acceptance concern rather than a proven neutral result. Response processing rose about 0.11 ms in this mock fixture. Live responsiveness remains an acceptance requirement.

## Limits and acceptance

No claim of universal natural-language interpretation, full playthrough coverage
or live Lumiverse certification. Unsupported/ambiguous legacy free prose is not
mined for spell-name substrings. Unknown unlabelled comma strings can remain opaque
when they cannot safely be distinguished from an actual named ability. Recognized
legacy qualifier/category syntax is conservative and primarily English; structured
individual names avoid relying on that heuristic.

Source quotes validate provenance, not truth or perfect provider semantics. The
legacy string-list contract still trusts an accepted player report; it cannot
retroactively prove the honesty of every NPC claim. Positive Known reports do not
silently demote established mastery. Explicit current loss is handled; arbitrary
partial proficiency changes require actual applicable observations or correction.

Melded prerequisites come from literal definitions. Companion does not simulate
spell physics, mana costs, hidden innate ownership or training law, and does not
invent a Melded school rank from component-school proficiency. Numeric study values
are shown only when actually supplied. Per-report observation bounds remain finite
(32 names per knowledge/learning/mastery array, eight assessments/study rows).

Required live acceptance: install the candidate, open the supplied chat, confirm all
ten known rows and Ground Sense's note, refresh/reload, switch swipes, practice an
already known spell, learn a genuinely new spell and verify privacy/ownership on a
second supported card with a compatible extraction model.

## Rollback and delivery

Main remains the published 2.9.14 baseline while this candidate is reviewed. For an
exact source rollback use existing release tag `v2.9.14-rc.1`, verified against
`415392cd3decefbae260ff898c0a94792656695f`; do not move it or force-push main.
Restore from a clean checkout/backup or revert a future merge through a review PR.
There is no saved-data migration to undo. Back up live extension/chat data before
changing installed versions.

The candidate package excludes private exports, tools and the source card fixture.
Commit/PR/CI and package hashes accompany delivery. This report is not a publication
claim. All runtime changes remain in the existing bundles; no UI redesign,
reconsolidation, new dependency, polling, model call or extra full-chat scan.
