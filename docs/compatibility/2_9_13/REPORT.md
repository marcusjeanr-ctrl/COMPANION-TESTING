# Universal tracking stabilization — 2.9.13 RC candidate

## Scope, baseline and delivery status

Authorized repository: `marcusjeanr-ctrl/COMPANION-TESTING` only. Baseline is
published 2.9.12 RC, commit `7a98c1c18070972f3e8201fffe5bbc6955f547da`.
Use the existing backend/frontend bundles; no historical rebuild, redesign,
new dependency, preset change or modification of the original Companion repository.
This report follows all nine execution phases of the new master task.

The requested card filename was `(7).json`; the user explicitly confirmed that it
is unchanged from the previously supplied complete card. Its SHA-256 is
`df2fd8b90c1f8ee1bac2a054dd7acb60d165555022a7e8c59e34d149d84a69d7`.
The new private export has seven messages and three readable tracking reports;
its bytes remain unchanged. No private export or diagnostic settings are committed.

This is a tested source candidate, **not a claim of complete compatibility or
successful live re-extraction**. A compatible live provider and real Lumiverse
acceptance remain required. PR/commit/CI and artifact status accompany delivery.
The published 2.9.12 release is not overwritten by these source changes.

## A. Complete lossless inventory

- **1,296 original entries: 1,273 enabled, 23 disabled.** Original IDs, keys,
  comments, complete content and activation/extension metadata are preserved in
  the existing `tools/updated_six_sided_fixture.json.gz:entries` fixture. Every
  entry in that fixture was checked for exact equality with the actual card.
- `tools/six_sided_core_inventory.json.gz` retains all other card fields,
  instructions, all 11 alternate greetings, book headers and the extension-book
  metadata deltas/order. Combining it with the existing full entry fixture
  reconstructs the **entire parsed original card exactly**, including both book
  representations. This avoids duplicating the full lorebook.
- [Inventory index](inventory.json), [per-entry CSV](entry-coverage.csv),
  [full register, gzip JSON](entry-coverage.json.gz), and
  [full-card runtime probe](full-card-probe.json) are machine-readable evidence.
- Every enabled entry has expected evidence/transition implications, normalization
  and reconciliation functions, persistent representation, UI destination,
  existing/new tests, status and limitations. Dormant/conditional entries retain
  their activation flags rather than becoming automatically active features.
- Definitions, dossiers, spells, items, timeline starts and modes are evaluated
  as reference versus accepted campaign state. A name in a catalog never grants
  ownership, knowledge, mastery, a quest or an occurred event.

Reproduce without modifying the card or calling a provider:

```sh
python3 tools/build_tracking_coverage_2_9_13.py /private/card.json docs/compatibility/2_9_13
node tools/audit_tracking_evidence_2_9_13.cjs /private/new-export.json
```

## B. Compatibility and coverage counting

The per-entry counting unit is the **original lorebook ID**, not a distinct tested
gameplay system. Counts deliberately do not inflate verification by counting static
entries or successful normalization as tested gameplay:

| Status | Entries |
|---|---:|
| Verified supported | 0 |
| Partially supported | 174 |
| Unsupported | 0 |
| Defective | 0 |
| Untested | 1,096 |
| Not applicable | 26 |

The 26 not applicable entries are 23 disabled entries and three background-history
entries requiring no dedicated tracker. Partial entries have source-specific
reference or core-contract evidence; their full effects remain unverified. The
1,096 untested entries still have tracking implications and code/storage/UI mappings,
but lack individual semantic tests. This stricter register supersedes the earlier
broad family classifications. Zero unsupported/defective IDs is **not** a claim
that every requested transition is implemented or that the provider is reliable.

[Behavioral coverage](behavioral-coverage.json) separately enumerates actual named
regression contracts and their assertions. Tests verify deterministic pipeline,
storage, reconciliation and rendering behavior. They do not certify every spell
effect, NPC biography, branching scenario or narrator-enforced world law.

## C. Defect register

| ID / severity | Evidence and root cause | Resolution / remaining requirement |
|---|---|---|
| T01 — High: postponed Agenda duplicates | Actual export folds into two active copies of one training commitment. `agendaRequest` omitted `moved` from its schema despite parser support; schedule compatibility correctly kept distinct times apart, but the older open report lacked its move marker. | Schema now offers `moved`; parser also accepts postponed/rescheduled. A conservative legacy fallback requires an explicit non-hypothetical move cue, one exact active commitment, matching participants/place and no separately enumerated sessions. Actual replay now produces **one** commitment, stable key, latest approximate schedule and retained rescheduling history. |
| T02 — High: historical abilities absent after refresh | All three saved ability arrays are empty. The prompt explicitly requested only spells learned/cast “this reply,” excluding a journal revealing earlier knowledge. The existing deterministic prose reader intentionally handles explicit known-spell lists, not arbitrary journals. | Correct the extraction contract and add bounded source-backed assessments through the existing call. Storage/fold/UI and mocked refresh/reload tests pass. **Actual provider journal re-extraction remains unverified**; replay does not invent the missing abilities from a free-text name regex. |
| T03 — Medium: provenance/proficiency not representable distinctly | Existing string lists cannot retain a quote, historical status or a distinction between failed practice, reliable execution and explicit mastery. | Optional `survival.abilities` stores attributed assessments and source quotes. Reliable is not mastered; historical knowledge is not a new-learning event or automatically current study. Unsupported/misattributed/uncertain rows are rejected. |
| T04 — Medium: harmful identity truncation | A newly verified long ability appears correctly, but the real manual forget handler clips its name to 60 characters and writes a different key. Legacy name arrays could also split one long identity from its full assessment. Reproduced through the actual registered frontend-message handler and mixed-format report. | Preserve identities up to the same 160-character bound in legacy spell/study lists, explicit known lists, manual learn/forget/study controls and `spellbookAdd`. Existing already-truncated names are not fabricated or rewritten. |
| T05 — High external configuration blocker: NanoGPT Decision model 400 | Supplied diagnostics explicitly reject mixed-role requests: “Decision models accept only user messages with text content.” Companion uses system instructions and attributed history for extraction. | Not repaired by flattening roles, hiding the failure, adding retries or silently selecting another model. Use a compatible text-chat model for Companion's side connection. A regression proves one failed attempt preserves committed metadata. Live success is not claimed. |
| T06 — Unconfirmed current defect: older Chat not found warnings | Diagnostics contain earlier missing-chat warnings, but the current seven-message chat has valid live tracking selected for all three replies. | Insufficient host event/deletion evidence to establish the cause or reproduce an active-chat failure. Existing chat-isolation/stale-push tests pass; no speculative change. |
| T07 — Not harmful stored-data loss: diagnostic text cut-off | Diagnostics intentionally cap `lastReply` at 3,000 characters. The actual exported reply is longer and retained. | No change to diagnostic bounds. Existing 240-character descriptive-field safeguards remain; this cut-off is not proof that stored narrative was lost. |

The export contains no quest reports, so it does not reproduce a new overlapping-
quest defect. Existing quest stage/reset/reward and identity tests remain applicable.
Family replay retains five members. Premature acquisition, ownership, cancellation,
private knowledge and sparse data receive negative/integration coverage; no defect
is invented merely because the master task lists a risk.

The Decision-model diagnostic proves a past failed call, not that every later call
or the currently selected connection is incompatible. Valid reports exist in the
export. A recurring 400 needs a compatible model; actual current-provider success
cannot be established from this offline environment.

## D. Implementation and storage contract

`survival.abilities` is optional; existing reports require no migration. At most
eight assessments per report, each with a name up to 160 characters and an exact
source quote up to 160 characters:

```json
{"name":"Signal Weaving","owner":"you","state":"known",
 "historical":true,"evidence":"You already knew Signal Weaving before this expedition."}
```

States are `known`, `practiced`, `attempted`, `reliable`, `mastered`, `forgotten`.
Owner must be `you`, historical must be boolean, and uncertainty/speculation flags
are honored. The quote must occur in the accepted active response after hidden
reasoning/report blocks are removed. Quote validation proves **source provenance**,
not independent truth or perfect semantic attribution by a live model.

- Known/reliable/explicitly mastered evidence can establish existing knowledge.
  Attempt/practice alone cannot. Explicit current loss is distinct from absence.
- Historical knowledge does not mark ongoing deliberate study complete. Later
  explicit relearning supersedes a loss rather than displaying an obsolete loss note.
- Unknown historical dates do not supersede an established current assessment.
  Manual negative corrections cannot be undone by historical backfill. Current
  new-learning reports retain their real transaction marker.
- Confirmed catalog aliases reuse the existing resolver; distinct longer ability
  names do not merge by substring. Retractions follow the canonical identity.
- Same-source refreshes preserve an omitted optional assessment field. An explicit
  replacement array is treated as a reread of that source; it is not a cross-chat
  migration. Manual controls and source edits remain available for corrections.
- Active swipes, source fingerprints, hidden/Save/Continue boundaries and chronological
  message order remain authoritative. Reprocessing an older message does not move
  its observations to the end of history.
- Existing spell/technique rows show a small provenance note. No panel redesign,
  new spell grants from school ranks, invented mana costs or private NPC narrative
  disclosure. Custom abilities with no catalog retain existing spellbook behavior;
  a full catalog-style evidence row requires the existing list panel.

The report asks for these assessments in magic contexts or explicitly enabled
generic skill tracking. It does not turn every card into a magic system. Historical
free prose still requires the existing provider to produce a correct structured
report; this candidate adds no extra model pass or full-history text mining.

## E. Behavioral, cross-system and lifecycle verification

New suites: `test_tracking_evidence_2_9_13.cjs` (**14 groups**) and
`test_tracking_cross_system_2_9_13.cjs` (**8 groups**). These execute the actual
bundles and persistence/panel pipeline, including:

- Repeated/successive moves, lessons, appointments, departures, meetings, ceremonies,
  training, manual corrections, separate recurrences, ambiguity and hypothetical moves.
- Historical known versus attempted/reliable/mastered, fantasy/science-fiction/generic
  abilities, NPC ownership, unsupported quotes, uncertainty, aliases and retractions.
- Refresh, omitted optional data, active swipes, edited-source rejection, older-target
  reprocessing and a new VM restored from JSON-persisted messages/state.
- Mana/eye drain/rest reserve observations without changing capacity or granting skills;
  deliberate study and new learning without automatic school-rank promotion.
- Offered versus received/stored gear, reward transactions, cancellation versus completion,
  deadline/Agenda updates, travel/birthdays and accepted historical continuity.
- Hidden power and owner-specific knowledge, forecasts versus occurred events, replay
  idempotency, provider failure preservation and long-name manual controls.

These synthetic reports are clearly labelled. A mocked provider returns structured
reports; tests then exercise real parsing, writes, reconciliation and display payloads.
This is not proof of nondeterministic live extraction. Real new-export replay proves
Agenda repair and preserved input; it also explicitly proves that the old saved
ability reports remain empty until a compatible provider actually reprocesses them.

Existing 31 suites are retained, including cross-card/HMS/non-HMS formats, metadata
source integrity, continuation rendering, recovery, privacy, family persistence,
quest progression and 2.9.11/2.9.12 regressions. No old assertion is weakened to pass.

Real Chromium/mock host: **11 UI + 5 visibility tests**, including escaped historical
assessment text. A JSON-restored VM is not a real application/database reload. Live
Lumiverse installation, storage reload, provider extraction and every playthrough
remain outside this environment's demonstrated coverage.

Node 22: both bundle syntax checks and release identity pass. There is no independent
TypeScript, lint or source-build configuration in this shipped-bundle repository;
those checks are not falsely claimed. Python inventory syntax/reconstruction and
the complete-card runtime probe are checked separately.

The pre-existing runner excludes archived source-text/historical-contract harnesses.
They are not counted as passing or silently repaired to match current code; the
earlier compatibility report documents those mismatches. Applicable current suites
and the new behavioral regressions are the validation gate for this candidate.

## F. Performance and data safety

[Performance evidence](PERFORMANCE.json) records alternating immutable baseline/
candidate runs with source-bound 600/2,000-message fixtures, pipeline, operation and
GC-memory measurements. A variable initial panel result is repeated separately.
No added model call, polling, network refresh or full-chat traversal. Extra quote
checks occur only for the bounded new field in the existing fold.

Prompt bytes are not claimed unchanged: measured empty/populated request lengths
are **14,832 → 14,892** and **18,528 → 18,721** characters. The populated increase is
193 characters (1.04%), justified by a universal provenance contract; redundant
magic-specific prose was shortened without removing its safeguards. Characters
are not tokens. The bounded assessment output can add metadata/output tokens;
actual provider billing and generated output lengths were not measured live.

No schema migration, new dependency, forced refresh, unrelated state rewrite or
deletion. The supplied card, private exports and original Companion repository are
unchanged. The lossless inventory lives in development fixtures and is not loaded
into runtime prompts, polling loops or panel state.

## G. Remaining compatibility and live acceptance

Remaining individual mechanics are visible in the register rather than silently
marked verified. Companion records narrator-established outcomes; it does not
independently execute spell physics/costs, age/training restrictions, guild promotion
formulas, every divergence/checkpoint/arc closer, NPC agency, language barriers or
all conditional curse/gear effects. Raw HUD visibility is not typed semantic support
for every optional field. Existing source-card conflicts are not rewritten.

Historical dates/ages in quotes are retained as evidence; no new effective-date
arithmetic or universal journal-language parser is invented. The legacy Agenda
fallback is deliberately narrow and English-cue based; explicit structured `moved`
reports support context changes without that prose heuristic. Generic skills reuse
the existing shared ability representation, not a new profession/skill UI or simulator.

Required live acceptance: configure a compatible side model, reprocess the journal
reply, inspect stored `survival.abilities` and Magic/Techniques rows, refresh again,
reload the application, switch swipes and confirm no duplicates or future-state
overwrites. Then exercise generic/science-fiction cards and representative Six-Sided
modes, families, geography, ownership, privacy and Save/Continue. Do not treat a
provider-generated incorrect owner/state label as validated merely because its
quote exists. Arbitrary unlabelled or ambiguous prose remains a model limitation.

Publication is not claimed by this report. A source candidate/PR and passing local
or hosted tests do not establish a published release or live gameplay certification.

## Files changed

`dist/backend.js`: extraction contract, Agenda reconciliation, optional assessment
normalization/storage/folds, study/knowledge boundaries and identity limits.
`dist/frontend.js`: assessment notes and candidate identity only. `spindle.json`,
`CHANGELOG.md`, `README.md`: version and documentation. `tools/run_tests.cjs` and
`tools/test_panel_tracking.cjs`: include new suites and expose existing registered
handlers for real manual-control tests. New tracking/evidence/cross-system/private
audit suites and inventory generator, the existing read-only card probe, and this
directory's inventory/coverage/report/performance artifacts supply reproducibility.
`tools/test_ui_browser.py` adds the escaped assessment display regression.

## Measured candidate comparison

| Workload | 2.9.12 | Candidate |
|---|---:|---:|
| 600 messages, cold / warm ms | 158.00 / 46.00 | 153.87 / 43.68 |
| 2000 messages, cold / warm ms | 345.36 / 71.57 | 340.07 / 70.63 |

Operation counts match: one normal extraction call, six mock history fetches, one metadata write, two/four storage reads/writes, 9,101 panel index accesses and the same traversal families. The assessment-heavy benchmark includes eight new source-backed assessments on every reply; both versions retain the same known abilities through legacy strings, while the candidate additionally validates and retains the quotes. This is an explicitly additional-provenance workload; its CPU/storage cost is justified by the new accuracy requirement, not claimed zero. Raw results and variance limits are in PERFORMANCE.json. No universal speedup or zero-overhead claim.


The maximal assessment workload (eight assessments per reply, 600 messages) measured
warm panel medians of **46.55 → 57.77 ms** (+11.22 ms) in one process pair. Both
versions knew the same nine abilities through legacy strings; the candidate also
validated and retained 2,400 assessment records. This is a measurable cost of the
new provenance data, with greater variance than the five-pair normal workloads.
The supplied full-card pair measured 44.43 → 43.74 ms warm. Neither single pair
establishes a general performance guarantee. Reproduce the assessment workload with
`COMPANION_BIND_READINGS=1 COMPANION_BENCH_ASSESSMENTS=8 node tools/benchmark_panel_reads.cjs BASELINE_BACKEND CANDIDATE_BACKEND`.
