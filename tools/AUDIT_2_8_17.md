# RPG Companion 2.8.17 — Universal Stability & Tracking Integrity

Audit date: October 25, 2026. Baseline: Companion main 2.8.16, commit `c7cba775494764e517d11eabef49fcca3b051bbe`.

## Result and scope

This release fixes confirmed shared-engine defects. It does not introduce a new simulation architecture, replace the tracker, add corrective model calls, or change the Reporter preset. Six-Sided World is an integration fixture alongside the original Re:Zero, Overlord, Classroom of the Elite and Mushoku panel fixtures. Classic mode has its own stale-response regressions.

All ten regression suites pass, including 23 universal integrity test groups. The backend and frontend pass syntax checks. Tests run against the complete backend bundle with mocked documented host APIs, and a minimal DOM harness exercises frontend startup/populated panels. This is evidence of the listed behaviors, not proof of perfect model extraction, provider behavior or live Android compatibility.

## Confirmed defects and implemented fixes

| ID | Priority / system | Reproduction or implementation evidence | 2.8.17 behavior and regression coverage |
|---|---|---|---|
| I01 | P0 / Identity | `partyMatch` matched different full names by first name and selected the first matching alias. `simKeyer` could merge arbitrary longer/prefix forms. | Exact canonical names win. Aliases and one-word first names must be unique within the roster. Distinct multiword names and articles remain distinct. Minds uses exact names/roster resolution rather than speculative prefix matching. Tests cover two Alexes, shared Captain, suffixes, the player and explicit unique aliases. |
| I02 | P0 / NPC knowledge | `simLearnedNormalize` inferred told from a sender alone and defaulted missing certainty to certain, including guesses/gossip. Legacy `simLearn` also accepted this directly. | A source name does not invent a transfer vector. Missing vectors/guesses become unsure; gossip cannot be certain; false beliefs stay explicitly wrong. Both new normalization and legacy folds apply the guard. Knowledge remains assigned to its recipient. |
| I03 | P0 / Minds and off-screen activity | Explicit speculative/unconfirmed fields were discarded during normalization while the remaining reading became normal state. The agenda instruction encouraged inventing absent characters' activities. | Explicit speculation is omitted from Minds/activity reports and ignored in the fold. Instructions require established traits/depicted inner states and established off-screen activity. This does not automatically detect speculation that a model fails to label. |
| I04 | P0 / Goals | Unknown objective states, including suggested/intended/abandoned, were promoted to active. Empty arrays became null and previous objectives persisted. | Explicit [] clears objectives. Unaccepted/suggested/intended/invalid reports do not create active goals; accepted maps to active and abandoned/cancelled maps to abandoned. Nonempty entirely invalid objective arrays do not clear previous valid data. Abandonment gets an explicit UI label. |
| I05 | P0 / Agenda | Same-title appointments could merge despite different participants or locations; unknown states became open. | Contextually different appointments remain separate with distinct action keys. Suggested/unaccepted/invalid rows are skipped; abandoned maps to cancelled. Active/completed states remain distinct. Existing clock-only-overdue and in-progress regressions continue passing. |
| I06 | P0 / Edited and regenerated branches | Saved tracker reports had no binding to their source text; editing the same swipe could retain old inventory, knowledge and progression. Regeneration context excluded the old reply in Minds but still used the full chat in other requests/reminders. | Newly written reports carry a compact source fingerprint outside their payload. Changed text invalidates the entire report consistently through `getSwipeData`. Regeneration requests, macros and generated context read the history before the replaced reply. Tests include equal-length edits, swipes, restoration and generated spell/Minds context. Legacy unstamped reports remain readable. |
| I07 | P0 / Slow classic tracking | Classic separate mode selected the fresh target or fell back to a deleted target without verifying its swipe/text. HMS already had a guard. | Both modes discard responses after a target edit/swipe/deletion. Historical target requests collect prior committed state before that target. A queued metadata write also rechecks the active target. |
| I08 | P1 / Metadata persistence | `setSwipeData` updated UI caches before awaiting the host write, and merged metadata from an old message snapshot. Failed writes could expose phantom state. | Per-message write serialization, a fresh metadata read and post-success cache updates. Tests simulate failure, retry and concurrent calls. Host-level compare-and-swap is not available in the existing API; see limitations. |
| I09 | P1 / Knowledge isolation across modules | Secrets accepted `knownBy` without any discovery vector; the panel/Minds bridge could then present certain private knowledge. Chronicle could export the unsupported discovery. | Story discoveries without `how` retain the secret record but do not grant recipients knowledge or export a discovery. Explicit manual knowledge remains authoritative. Positive transfer and negative no-vector tests cover both behaviors. |
| I10 | P1 / Injuries | Persisted injury state could survive a discarded/deleted report even though most panels derive from current swipes. | Injury read views replay active injury reports and omit discarded report-sourced wounds. Manual and unbound legacy injuries remain. This is a non-destructive view: stored records are not erased by a read. |
| I11 | P1 / Chapter memory | Summaries could finish after their source changed and later be injected after a source edit/swipe/deletion. | New generated/edited summaries store their source range fingerprint; late results are rejected. Stale summaries and associated new loop discoveries are withheld from prompts, with a visible source-changed label. Original text remains available to review/edit/re-summarise. Legacy boundaries also get existence/clock/arc checks where available. |
| I12 | P1 / Hidden state synchronization | Modules disagreed on hidden flags: some HUD/report folds included hidden replies while Minds skipped some of them. | Shared visibility checks cover hidden, is_hidden, metadata.hidden and extra.hidden in core report/HUD readers and history selection. Hidden report, clock and knowledge regressions pass. |
| I13 | P1 / Save/load | Concurrent cache misses returned different mutable state objects; asynchronous saves had no immutable ordered snapshot; damaged roots had no recovery copy. Some collection roots could be malformed. | Shared in-flight loads, per-chat ordered snapshot writes, a post-success recovery copy and root fallback. Existing v2/legacy seed formats remain accepted; malformed collection roots fall back to safe shapes. Load/save/failure/retry/manual-data tests pass. Unsafe deep-merge and lock-path keys are rejected. |
| I14 | P1 / Injection handshake | A quoted slot marker inside chat history could suppress the actual tracker/Minds request. Reprocessing an injected prompt could add context again. | Slot detection is limited to non-history blocks. A WeakSet prevents repeat injection on the same returned prompt array. Positive Reporter/Minds slot and quoted-marker regressions pass. |

## Already-working systems retained

- Active-swipe metadata and derived relationship/family/gear/finance/secret/quest/spell folds already isolate ordinary swipe selection. The new source binding closes same-swipe text-edit gaps for newly written reports; it does not replace those folds.
- Manual spell knowledge, Forget, later real relearning, mastery, study progress, unknown source ranks and spell aliases pass the existing suites. No rank or skill is awarded by this patch merely because it appears in lore or a proposed goal.
- HUD-derived world state remains the authority. Missing HUD/clock data stays absent; same-length time edits invalidate the existing parse cache. No universal invented calendar or time advance is added.
- Six-Sided World calendar rollovers, birthday parsing, multiple/hidden ranks, observed Atlas paths, dated Saga references and spell catalogs continue passing their existing tests. No world-specific rules were added to the new universal guards.
- The original four-world 2.8.1 panel fixtures still match their established outputs, apart from the previously documented Mushoku clock/Atlas corrections.
- Reporter/Minds slot suppression of duplicate extension requests already worked for genuine preset slots and remains supported.
- Full lore pagination, read-pass memoization, spell catalog caches, local Read again behavior and the original one-request tracker transport remain in place.

## Potential risks and boundaries of this audit

1. **Semantic extraction is still model-dependent.** These guards cannot prove that a confidently reported saw/told event actually happened, or that a plausible inner motive was established. They constrain explicit uncertainty, acquisition vectors and request wording. There is no mandatory quotation gate or second corrective call.
2. **Legacy provenance is incomplete.** Existing unstamped per-swipe reports and old summaries/discoveries lack their original text fingerprint. They remain readable to preserve saved sessions; old edited content cannot be reconstructed reliably. Re-read/re-summarise affected material when a legacy branch is known to be wrong. Old persisted chapter boundaries and unbound notes are not globally rebuilt.
3. **Already exported Cortex facts are external.** An old settled branch may already have been written to Memory Cortex. This release does not destructively delete external entities/facts or promise to retract them. Settled-turn deferral reduces, but does not eliminate, edits to already-exported history. Cortex retrieval may also expose broadly stored facts; host-side knowledge filtering is outside this patch.
4. **No universal entity ID migration.** Two truly different people with exactly the same full name still need explicit distinguishing names/aliases. Safer matching may leave separate partial-name records until an explicit roster alias resolves them. Existing incorrectly merged history is not silently rewritten.
5. **No atomic multi-host transaction.** Write queues serialize this extension instance only. Another process/user can still change metadata between the fresh read and host write. Recovery is best effort: after a primary write succeeds but before its recovery copy finishes, recovery may contain the preceding save. Loss/corruption of both copies is not recoverable here.
6. **Caches and source fingerprints are integrity checks, not cryptographic authentication.** Fingerprints use length and two integer hashes. They avoid duplicating entire replies in metadata and are cached per message; theoretical collisions remain possible.
7. **Deduplication scope is explicit.** Existing slot detection plus same-array replay protection is tested. Arbitrary third-party prompt rewrites, cloned/mixed prompts without host history markers, and duplicate installations are not universally solved.
8. **Reference material is not observation.** Atlas lore references, saved room maps, manual notes, seeds and external memories remain distinct from proof of a current visit/event. Existing world-specific Atlas temporal handling is not a universal chronology interpreter. This release does not certify every Six-Sided spell prerequisite or reference fact as exact.
9. **Live validation remains necessary.** Tests do not simulate provider latency, every permission configuration, multi-user server races, abrupt filesystem/process failure, all host releases, or the real Android browser layout.

## Validation matrix

Run `node tools/run_tests.cjs` from the installed package root. No npm dependencies are required for these tests.

| Requirement | Evidence |
|---|---|
| NPC privacy / misinformation | Universal knowledge, speculative reading and secret-vector groups; original Minds fixtures |
| Goal acceptance / active / abandoned / complete | Universal goal/Agenda groups; general-tracking lifecycle and UI tests |
| Spell and skill progression | Existing reading/magic, spell aliases, six-sided repairs/compatibility and original multiworld ability panel fixtures; progression logic preserved |
| Identity aliases / collisions | Universal exact/alias/first-name/title/player/suffix tests; spell aliases have a separate resolver suite |
| Timeline rollback / regeneration | Source binding, classic slow-response, regeneration prompt, injury and chapter tests; existing active-swipe spell lifecycles |
| HUD / calendar | Universal missing/edited-clock checks and existing dated/legacy calendar/rollover suites |
| Save/load / migration / malformed records | Concurrent loads/writes, immutable snapshots, legacy seed, recovery root, failed write/retry, malformed normalizer groups |
| Cross-module consistency | All-panel integration, original four-world panel parity, shared report invalidation and hidden-state tests |
| Duplicate instructions | Reporter/Minds slot, same-array replay and quoted-history-marker tests |
| Performance / context | One tracker call with local rereads, hash memoization, existing bounded read passes, benchmark below |

One older synthetic swipe test now restores the saved text when returning to its original swipe. Previously it changed only the swipe number while retaining the alternate text; source binding correctly treats that as an edited source. Its original learning/forget/mastery assertions remain.

## Measured overhead and performance limits

Local Node benchmark, 600 messages / 300 active full-panel reports; three warmups and ten measured reads. New reports were fingerprint-bound for 2.8.17. No provider call or phone rendering is included.

| Version | Cold panel read | Warm median | Warnings |
|---|---:|---:|---:|
| 2.8.16 baseline | 109.54 ms | 45.51 ms | 0 |
| 2.8.17 audited build | 166.31 ms | 54.54 ms | 0 |

This sample shows about 9 ms additional warm local work. It does not demonstrate an overall refresh speedup. Results vary by machine, GC and history. The benchmark can be repeated with `COMPANION_BIND_READINGS=1 node tools/benchmark_panel_reads.cjs PATH_TO_BASELINE dist/backend.js`.

The representative enabled-module report instruction measured 17,841 characters before and 18,616 after: +775 characters. Dividing by four gives roughly 194 extra tokens, **not an actual tokenizer count**. State budgets/history depth are unchanged; the model is not asked for new mandatory evidence fields. There are no added generation requests. Save recovery intentionally adds a second storage write per successful chat-state save, and guarded metadata writes add a fresh message read. Shared in-flight loads and per-object fingerprint memoization avoid repeated work within those safety requirements.

## Compatibility and installation

- `spindle.json` version: 2.8.17; identifier: `rpg_companion_hms`; minimum host: unchanged at 1.2.0.
- Existing public actions, module names, settings migration version, saved v2 shape and legacy tracker seed imports remain supported. New sources/summarySource/recovery fields are additive.
- All earlier features, preset, engines and translations are included. Newly added status labels use the existing English fallback; this release does not add new translation catalogs.
- The ZIP contains one `rpg_companion_hms/` package with its manifest, both bundles, assets, preset, audit and tests. Extract it for Lumiverse's existing local extension import workflow, or update the same Companion repository installation.
- Existing chat restart is not required. A fresh tracker read is useful after editing a reply whose newly bound report is now invalid. Stale chapter text can be reviewed and re-summarised without discarding the save.
- The previous source remains available at the baseline commit above. Do not delete saved chats to install or roll back.

There is no claim of 100% reliability or universal semantic compatibility.
