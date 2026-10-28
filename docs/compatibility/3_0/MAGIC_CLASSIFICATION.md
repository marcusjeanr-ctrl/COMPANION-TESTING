# Targeted Magic / martial classification fix

> Publication update: the user authorized shipping this fix after review. Version 3.0.1 RC changes only release identity/notes from the tested 3.0.0 classification candidate below. The recorded payload/frontend hashes describe that implementation snapshot; release validation is rerun on the final versioned commit. Live acceptance and existing limitations remain.

## Scope and baseline

Baseline: merged 3.0 RC at `543e88904a01a9d84912080549fc373f180031ef`
(the source tree is identical to PR #11's `7bc774d`). Branch:
`fix/magic-martial-classification`, COMPANION-TESTING only. Version stays 3.0.0 RC;
no release, merge, new feature, panel, dependency or migration is performed.
Original Companion and the supplied card are untouched. Frontend source, settings,
presets, quests, inventory, combat UI, maps and NPC logic are unchanged.

Reference card SHA-256:
`df2fd8b90c1f8ee1bac2a054dd7acb60d165555022a7e8c59e34d149d84a69d7`.
It is byte-identical to the existing complete Six-Sided fixture. The existing
full-card audit and all enabled reference definitions are reused, not reconstructed.

## Confirmed root cause and existing Abilities suitability

`buildCompanionInstructionRead` asks `you.spells` for player spells **and techniques**.
`spellKnown` and the chronological fold intentionally carry generic ability
observations for both Magic and Sword Techniques. But `hmsMagicPanel` and
`spellListPanel` exclude martial abilities only when their exact names occur in
`techCatalog`. Unknown names therefore become Magic's Other spell rows; unknown
physical practice also reaches Magic Studying and its spell-learning reminder.
This is an overly broad fallback, not a CSS/rendering problem.

The existing Abilities renderer already accepts category → name/state/level items.
Its configured Martial category can accept derived martial observations safely;
no new store, frontend property contract, UI control or panel is needed. Existing
catalogued techniques already have their Sword Techniques view and are not duplicated.
Touki's current HUD status remains authoritative, rather than becoming a newly
learned spell/ability from an unreliable old list.

## Smallest shared-reader correction

- `spellResolver.domain`: reuse the cached canonical/alias index. An explicit
  magic catalogue match wins, even when its name sounds physical. Existing technique
  catalogue matches are martial. Otherwise, only strong physical signatures (Touki,
  feints/footwork, named sword cuts, lowered-center force absorption, opponents'
  footing drills) route as martial. Explicit magical wording and other unknown
  abilities keep existing Magic fallback. No arbitrary narrative name mining.
- `hmsMagicPanel`, `spellListPanel`, `spellStudyReminder`: use the same classification
  for automatic spellbook rows, counts, unknown assessments, study and spell reminders.
  Genuine magic and explicit manual spellbook/study decisions retain their previous
  behavior, including older manual study records without a `from` marker.
- `martialAbilityItems` / the existing `hmsPanelStateRead` Abilities assembly: project
  supported noncatalogue martial observations into the configured Martial category.
  Reuse the existing source-bound fold, knowledge, assessment and practice maps.
  There is no additional history traversal or parallel tracking pipeline. Clone
  derived group arrays rather than mutate cached HUD readings. Respect disabled
  Abilities and category configuration; no module is silently enabled.
- Tighten the existing extraction request so `you.spells` asks for **magical spells**,
  excluding physical/Touki maneuvers. Keep the existing generic ability/skill contract
  and exact source/owner guards. No new field, call, retry or automatic reread.

A performed/legacy maneuver is labelled **Reported maneuver**; unverified learning
or mastery claims say **Learning reported** / **Mastery reported**. Deliberate or
assigned practice appears as **Training**; accepted source-backed assessments retain
Attempted / Practicing / Reliable / Known. A Mastered label additionally needs an
explicit non-negated mastery statement; a failed drill or criticism cannot become
Mastered merely because the provider supplied an inconsistent state label. This
bounded check is not an independent semantic truth detector.

No saved spellbook, metadata, manual state or historical report is rewritten or
deleted. The historical correction is a reproducible read-time interpretation of
unambiguously physical automatic records. Manual assignments remain authoritative.
Original per-swipe source hashes, edited-source rejection, ownership, uncertainty,
withdrawal, continuation and JSON restore boundaries remain in force. Malformed
legacy study storage cannot interrupt unrelated existing panel assembly.

## Before/after examples

| Accepted observation | Previous classification | Fixed classification |
|---|---|---|
| Feint with rhythm-breaking footwork | Known spell / Other | Reported maneuver in existing Abilities |
| Touki-enhanced diagonal cut | Known spell / Other | Martial observation; no spell count |
| Grounding force absorption | Spell / spell study | Martial observation/training, without invented mastery |
| Breaking an opponent's footing through angled attack | Magic Studying | Uncompleted Training in Abilities |
| Touki Active in HUD | Existing HUD status plus potential false spell | Same HUD Active status, no automatic duplicate spell |
| Fireball, Water Ball, Rock Bullet | Known spells | Identical Magic rows and counts |
| Stone Cannon measured practice | Magic Studying | Identical study state/progress and controls |
| A catalogue spell with a martial-sounding name | Known spell | Catalogue still wins; remains Magic |
| An explicit manually marked spell/study | Manual Magic choice | Preserved; not silently reassigned |

## Actual export evidence

Export SHA-256:
`724e3f472814fefd4c5cc05ad704a354be8b9102a4e20aebfbc5ec9ff81bd586`.
Thirteen messages, six source-valid reports. Private input is not committed.
The screenshot shows six items in one view; the complete export replay accumulates
nine erroneous physical Known entries across valid earlier reports.

| Same read-only export | Baseline | Fixed |
|---|---:|---:|
| Automatic physical entries in Magic spellbook / Known count | 9 / 9 | 0 / 0 |
| Physical drills under Magic Studying | 2 | 0 |
| Martial observations/training in existing Abilities | 0 | 11 |
| Mastered martial labels | 0 | 0 |
| Current Touki HUD status | Active | Active |
| Source-valid reports | 6 | 6 |

These observations do not establish additional individual magical spells. All
111 catalogue references, school/rank access, mana capacity and voiceless casting
remain available; school rank does not auto-grant catalogue spells. Distinct
wordings of a physical maneuver are not globally deduplicated or rewritten by this
classification fix. Raw observations remain available for correction and history.

For an otherwise identical legitimate-magic fixture (Water/Earth/Fire, unknown
magic and measured spell study), the **entire Magic payload is byte-for-byte equal**:
SHA-256 `e4d6a20fd376b98e5de23242ec51506cc7fba135c37d00054361b7663fc6ca89`.
This compares actual backend outputs on frozen baseline/candidate, not just counts.
The shipped frontend file is also byte-identical to baseline.

## Verification and exact changed files

Baseline Magic/Abilities integration, reading, aliases and 2.9.15 progression suites
pass before implementation. Focused reproductions fail on baseline, then pass on
the candidate. Final gates: **38 regression suites**, both bundle syntax checks,
release identity, **18 Chromium UI + five visibility tests**. Existing Living World,
Six-Sided, Re:Zero, Overlord, COTE, legacy, continuation, ownership and unrelated
tracking assertions remain unchanged. Browser bridge is mocked, not live Lumiverse.

Eleven focused groups cover the six representative maneuvers, real storage with
one model call, genuine Water/Earth/Fire and unknown magic, magic practice, physical
study, performed/known/mastered distinctions, negative mastery, catalogue precedence
and reload, explicit/legacy manual choices, owner/source/swipe/JSON restoration,
and malformed legacy study storage. Browser regression checks spell counts, the
Martial destination, Touki Active, spell search and Mark learned control events.
Frontend source is unchanged; no Magic UI redesign or new control is introduced.

Changed files only:

- `dist/backend.js`: shared classification, existing panel/read projection and one extraction contract.
- `tools/test_magic_classification.cjs`: focused synthetic regressions/browser fixture.
- `tools/audit_magic_classification.cjs`: read-only private-export replay and legitimate-Magic parity hash.
- `tools/run_tests.cjs`: include the focused suite.
- `tools/test_ui_browser.py`: one classification/search/control regression.
- This report and `magic-classification-evidence.json`: counts, hashes and measured verification.

```sh
export PATH=/workspace/.companion-tools/node_modules/.bin:$PATH
node tools/test_magic_classification.cjs
node tools/run_tests.cjs
node tools/check_release.cjs
node tools/audit_magic_classification.cjs /private/training-export.json
COMPANION_CLASSIFICATION_BASELINE=/private/baseline-backend.js node tools/audit_magic_classification.cjs /private/training-export.json
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_ui_browser.py
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_visibility_browser.py
```

## Performance and remaining limitations

[machine-readable evidence](magic-classification-evidence.json) records counts,
immutable source hashes, alternating equivalent cold/warm normal/full-card panel,
response-pipeline, memory and operation measurements. Extra work is bounded
classification/projection over existing derived maps; no new model request, history
scan, metadata write, polling, automatic refresh or source migration. Prompt length
changes are reported as characters, not token counts. Live model/storage/WebView
latency is not independently measured.

Ambiguous unclassified names keep their previous behavior; this is not a universal
language classifier. English physical cues are intentionally conservative. Explicit
magic catalogue entries and user corrections win. A wrongly named or wrongly owned
provider observation cannot always be independently verified; source quotes establish
provenance, not perfect truth. If the configured Abilities vocabulary has no Martial
category or the module is disabled, observations remain stored without that projection.
Do not enable modules or invent learned abilities to make a panel look complete.

Live Lumiverse acceptance remains unverified. This task does not address the prior
3.0 project's unrelated provider-progress or long-history-window limitations.
No release/publication or broader architecture changes are included.

## Final-source measured comparison

| Workload | Baseline | Fixed |
|---|---:|---:|
| 600-message warm panel (ms) | 82.78 | 73.45 |
| 2,000-message warm panel (ms) | 122.29 | 119.11 |
| Six-Sided cold panel (ms) | 476.68 | 407.69 |
| Six-Sided warm panel (ms) | 84.99 | 74.11 |
| Living World cold panel (ms) | 1246.5 | 1193.74 |
| Living World warm panel (ms) | 93.39 | 86.29 |
| Response processing (ms) | 1.0342 | 0.9698 |
| Empty prompt characters | 14949 | 14949 |
| Populated prompt characters | 18819 | 18839 |
| Six-Sided catalogue heap (bytes) | 539216 | 538864 |

Host operation counts match: one model request, six history fetches, one metadata write, two storage reads/four writes; panel 9,101 indexed history-element reads and the same six traversal families. No additional full-chat scan or refresh. Differences above are measured costs/variance, not a claim of zero overhead or live certification.
