# RPG Companion 3.0 RC — tracking and compatibility review

## Delivery and protected baseline

Repository: `marcusjeanr-ctrl/COMPANION-TESTING` only. Published baseline is
2.9.15 RC, merge `0d84f371fe19c69a81f7e31f307c8099bc3763a6`, existing tag
`v2.9.15-rc.1`. Development: `development/3.0-rc-tracking`; manifest version
`3.0.0` is the semantic-version representation of 3.0 RC. Original Companion,
character cards, presets, dependencies and existing visual design are unchanged.
This is a review candidate, not an automatic merge/publication or live certification.

## Phase 1 — complete inventory and baseline evidence

The structural audit reads all 226 baseline tracked files (15,184,301 bytes), hashes
all contents, inventories every named backend/frontend function and all renderers,
and maps 34 system areas to their existing readers, stores and behavioral tests.
The architectural inventory is structural evidence plus targeted semantic review;
it does not pretend that lexical references prove reachability or equivalence.
No file or feature was removed based on a name/count search.

[Systems register](systems.json) covers HUD, classic trackers, attributes, info/date/
weather/location, vitals, wounds, conditions, injuries/recovery, player XP/mood,
survival, Magic, techniques/Touki, quests, Agenda, plot/objectives, canon events,
Sandbox/branches, characters/party/relationships, family, NPC feelings/bonds/routines,
knowledge/secrets, Internal States, Chekhov clues, inventory/equipment/carried items,
property, money/debts, affiliations, World/contracts, Atlas/travel, maps/buildings,
comms, chapters/Chronicle, encounters/immersive/DND, Save/Continue, metadata/swipes,
lore/memory/prompt injection, settings/presets/recovery, UI/localization and release.
Settings/render helpers are also individually present in
[architecture-inventory.json.gz](architecture-inventory.json.gz).

Living World is byte-identical to the complete previous reference, SHA-256
`21918f9b3f02ec9edbb4cc44565256078863d3b93eb7ab0fe5cbb708c4d33e1f`.
The register reads all core fields/instructions and every original entry's complete
content/metadata: **1,004 entries; 998 enabled, six disabled**. Start 577, continuer
578, HUD 104–127, modes 579–599, magic 232–576, martial 176–220, histories 0–34,
characters/races/monsters, geography and other rules remain traceable by original ID.
All nine alternate greetings plus the introduction remain reference-only.

[Card inventory](card-inventory.json) includes core mechanic clauses and duplicate
content groups. [Per-ID CSV](living-world-coverage.csv) and
[full traceability register](living-world-coverage.json.gz) connect original IDs,
mechanic clauses, extraction/read/storage/display references and tests. The existing
lossless `tools/living_world_fixture.json.gz` is reused, without another 4.2 MB card.
All enabled entries remain **partially supported**, not certified complete laws;
disabled entries are not applicable. Individual deterministic contracts are covered
by named tests. Lore defines possibilities, never owned abilities or occurred events.

### Actual export and measurable accuracy

New export SHA-256:
`dee31032b8e651afd64fb7c6bbbac49264441747860a625bba8f414a5167ec97`.
It has five messages and two source-valid reports. The diagnostics identify 2.9.15,
valid live metadata, 998 lore entries and no recent reported errors. Those diagnostics
are user-supplied evidence, not a new live connection/installation test.

Replay uses the same input, full card, player identity and runtime paths on both
versions. [accuracy.json](accuracy.json) contains counts only; private conversation,
settings, connection identifiers and personas are not committed.

| Observation | 2.9.15 | 3.0 RC | Assessment |
|---|---:|---:|---|
| Cards for the one canal assignment | 2 | 1 | Confirmed reconciliation improvement |
| Individual canonical Known spells | 10 | 10 | 2.9.15 fixes preserved |
| Malformed Known Other rows / fabricated mastery | 0 / 0 | 0 / 0 | Preserved |
| Active study cards | 0 | 0 | Future assignment already does not become active practice |
| Retained family members / NPC Minds | 5 / 3 | 5 / 3 | Preserved with player identity configured |
| Scheduled Agenda commitments | 2 | 2 | Retained; NPC routines remain separate |
| Numeric progress without a percentage in its source | 1 | 1 | Provider/data concern remains, not claimed repaired |

Inventory, currency and affiliations have no observed transactions in this scene.
Zero records are not evidence that those systems were exercised. No invented
accuracy percentage, full-chat event recall score or historical benchmark is used.
The known-contract suite has **1/10 passing on untouched 2.9.15 → 10/10 on candidate**;
these are synthetic defect contracts, not an overall gameplay accuracy rate.

## Phase 2 — smallest coherent architecture changes

The existing single extraction → active-swipe metadata → chronological read pass
→ panel architecture remains. Confirmed flaws lie in a few shared contracts:
quest identity/lifecycle/projection, uncertainty interpretation, identity lookup at
a privacy boundary, descriptive truncation and stable manual keys. Fix those
contracts rather than introducing a second tracker, event store, generic framework,
new dependency or migration. Model extraction remains the existing configured call.

Separate folds are intentional responsibilities: NPC routines are not appointments,
spell reference eligibility is not ownership, quest completion is not a payment,
private knowledge is not public narration, and current HUD is not historical lore.
Those distinctions must not be consolidated into one mutable truth object.
No unused runtime subsystem or equivalent duplicate pipeline was proved removable.
Historical diagnostics/reports/tools remain development evidence; shipped runtime
still uses the two bundles. No historical source assembly/rebuild was run.

## Phase 3 — confirmed defects and implemented repairs

| ID | Evidence/root cause | Repair and regression |
|---|---|---|
| E01 | Actual export's assignment changes label, objective phrasing and location wording; strict objective equality rejects the match. | Existing `questMatch` gains a conservative assignment-label refinement: same giver, same multiword title core, shared explicit action, two non-generic place words, preserved conditions/quantities and unique candidate. Original key and aliases survive; genuinely different actions, owners, locations, conditions and ambiguity stay separate. No card/NPC/example names are hardcoded. |
| E02 | `questNormalize` discards lifecycle fields and story-only panel rows force active; stale story details can replace current HUD lifecycle. Synthetic reproduction. | Preserve explicit accepted/completed/failed/abandoned/reopened state and class through parsing, storage, fold and projection. Explicit HUD lifecycle wins when attaching older details. Percentages do not complete quests and completion never generates rewards. |
| E03 | Common uncertainty predicate ignores boolean `uncertain`; money normalization does not use the common predicate at all. Synthetic reproduction across tracking systems. | Honor boolean uncertainty in the existing guard, including learned-fact certainty. Apply it to new and legacy money records; reject unaccepted transactions. Preserve original ledger IDs and manual hiding/settling anchors before filtering, and honor explicit manual records. |
| E04 | Secret-to-Minds projection selects the first matching first name even for a different full name or ambiguous short name. Synthetic privacy reproduction. | Reuse existing `partyMatch`: exact names/aliases first, short name only when unique. No private fact is sent to a different same-first-name NPC. Existing owner-specific secret storage remains. |
| E05 | Quest objective limit truncates at 160 characters, removing distinguishing end conditions and making separate tasks look identical. Synthetic harmful-data-loss reproduction. | Preserve bounded objectives to 500 characters through existing word-boundary `reportText`; show an ellipsis at the bound. Never use an ellipsis-truncated objective as sole rename evidence. Raw saved reports are unchanged. |
| E06 | Quest focus is rendered using stable key but click/handler reconstruct it from renamed display name. Synthetic real-handler reproduction. | Pass the actual key from existing control, retain name-only older-client fallback, and toggle that stable key. No layout change. |

Source references and exact assertions are in the system register and
`tools/test_tracking_engine_3.cjs`; all 2.9.15 Magic regressions remain unchanged.
The rename rule is deliberately conservative and English-cue based. It is not a
universal semantic equivalence engine; ambiguous goals require canonical reports
or explicit correction rather than a speculative merge.

### Confirmed data concerns not disguised as runtime fixes

The latest provider stores **5% quest progress** although the supplied reply has
no measured percentage. The old extraction instruction already forbade estimates.
A stored current-study record describes a future exercise; the existing Known/
practice reconciliation correctly suppresses it from active Studying. Its quoted
ability assessment also needs to satisfy the unchanged exact-source quote check.

This candidate strengthens the existing wording to require an actual measured
percentage, explicit lifecycle, no invented reward, and practice **begun now** rather
than an assigned/future lesson. No additional call or automatic reprocessing occurs.
This wording is a preventive contract improvement, **not proof that the live provider
will obey it**. Existing historical progress is retained because missing quote fields
in the legacy schema cannot prove that every percentage is false. Do not globally
zero/reset progress or delete saved study records. Reprocess this source with a
compatible provider and inspect that progress becomes null and future study is omitted;
this is a release acceptance item. A future stricter provenance protocol needs
explicit storage compatibility and legitimate measured-progress regression coverage.

## Phase 4 — verification and compatibility

All 35 existing suites and their assertions are retained; the runner adds the new
engine suite for **36 suites**, plus both shipped-bundle syntax checks and release
identity. New suite: **ten behavioral groups**, covering the actual failure shape,
negative matches, stage resets, lifecycle/HUD precedence, uncertain records, privacy,
long conditions, stable focus, legacy ledger IDs, source edits, swipes, sparse updates
and JSON restoration. Tests use synthetic observations with the real parsers,
per-swipe store, handlers, folds and panel payloads, not a replacement implementation.

Browser verification: **16 Chromium UI + five visibility tests**, including failed
quest state, escaped objective text and stable-key focus, retaining full Magic and
continuation checks. Bridge is mocked, not live Lumiverse. Existing tests cover
Six-Sided World, Living World, Re:Zero, Overlord, COTE, generic/legacy formats,
source/swipe isolation, continuation, ownership, family absence/reentry, spell
practice/learning/mastery, rewards, inventory, time and cross-system behavior.
Tests of narrator-owned combat rules remain partial; no complete fictional physics,
spell costs, guild promotion simulation or every possible card playthrough is claimed.

```sh
export PATH=/workspace/.companion-tools/node_modules/.bin:$PATH
node tools/check_release.cjs
node tools/run_tests.cjs
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_ui_browser.py
CHROMIUM_PATH=/usr/bin/chromium python3 tools/test_visibility_browser.py
python3 tools/build_tracking_3_coverage.py /tmp/companion-3-register /private/card.json
node tools/audit_tracking_3.cjs /private/export.json 'actual player identity'
COMPANION_3_BASELINE=/private/2.9.15-backend.js node tools/audit_tracking_3.cjs /private/export.json 'actual player identity'
```

Archived source-text-only/historical-contract harnesses remain excluded by the
existing runner and are not counted as passed. No old assertions were weakened.
Private replay is byte-preserving and JSON-restorable, not a real host disk reload.
No independent TypeScript/build/lint configuration is invented for shipped bundles.

## Performance and saved-data compatibility

[PERFORMANCE.json](PERFORMANCE.json) records immutable source hashes, raw alternating
processes, cold/warm panel timings, 600/2,000-message workloads, full-card reads,
response pipeline, memory and host-operation counts. Character lengths are not
model-token measurements. No live provider latency or universal speed guarantee.
Numeric comparison is recorded below.

No extra model request, polling frequency, history traversal, automatic refresh or
metadata write is introduced. Existing read-pass caches remain. Added work is bounded
checks inside existing normalizers/matching/projection; new quest field is optional.
No saved-state schema version change or destructive migration. Keys, aliases,
manual focus, ledger IDs, source hashes, active swipes, settings and original
historical reports remain authoritative. Other source/data files retain their hashes.
The 500-character objective bound can retain up to 340 more characters per affected
quest; that useful additional evidence has a bounded storage cost, not zero cost.

## Phase 5 — review candidate, limitations and rollback

Deliver source branch, commit, PR, CI and a deterministic local RC package. No merge
or release is authorized by this master task; the separate previous authorization
published 2.9.15, not this candidate. Keep main and `v2.9.15-rc.1` unchanged.

Outstanding acceptance: provider's unsupported progress/future-study reports; live
installation/update, WebView, actual extraction with a compatible side model,
reloads, continuation/swipes, a multi-turn campaign and another supported card.
Five messages cannot prove large-campaign event recall or every lifecycle. The
entry register exposes partial semantics rather than inventing completion.

Exact rollback/reference: clean checkout of `v2.9.15-rc.1`, verify
`git rev-parse HEAD` resolves `0d84f371fe19c69a81f7e31f307c8099bc3763a6`, then
`node tools/check_release.cjs` and `python3 tools/package_rc.py /tmp/Companion-2.9.15-RC.zip`.
Back up application/chat data before changing installed versions. There is no data
migration to undo. Never move the published tag, reset main or force-push. If this
candidate is later merged, undo a merge using a reviewed revert PR, not history rewriting.

3.0 RC changelog: preserve 2.9.15 Magic; reconcile confirmed assignment label refinements;
retain explicit quest lifecycle and current HUD authority; retain long objective
conditions; honor uncertainty and transaction acceptance; isolate same-first-name
NPC secrets; preserve renamed quest focus and saved ledger anchors. Existing visuals,
card definitions, presets, processing architecture and integrations remain.

## Task 1 measured comparison

| Workload | 2.9.15 | Task 1 checkpoint |
|---|---:|---:|
| 600-message warm panel (ms) | 76.75 | 65.14 |
| 2,000-message warm panel (ms) | 122.34 | 123.63 |
| Full-card cold panel (ms) | 1221.61 | 1079.89 |
| Full-card warm panel (ms) | 100.76 | 72.11 |
| Response processing (ms) | 0.8725 | 0.9744 |
| Empty prompt characters | 14892 | 14949 |
| Populated prompt characters | 18768 | 18819 |
| Catalogue retained heap (bytes) | 782024 | 782000 |

Operation counts match: one model call, six host history reads, one metadata write, two storage reads/four writes, 9,101 panel history-element reads and the same six traversal families. Timings and bounded prompt growth above are reported rather than described as free. No extra scan, refresh or network stage.
