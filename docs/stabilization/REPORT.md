# Phase 2 — 2.9.8 RC stabilization report (2026-10-26)

Initial gameplay baseline: 2.9.7 RC (ad4eb70), following Phase 1 merge 1372ea9 / PR #1.
Authorized repository: COMPANION-TESTING only. Original Companion remains untouched.
This is a targeted frontend patch plus verification across the requested systems,
not a redesign or reconstruction. No live Lumiverse test instance is available,
as confirmed by the user. Release-candidate status is retained.

## Confirmed defects and minimal fixes

| Severity | Root cause / reproduction | Fix and regression |
|---|---|---|
| Medium | A 52-character compound spell name produced 363px content in a 276px study row | Scoped overflow wrapping in reused spell/technique rows; complete note preserved; real Chromium test |
| Medium | Default floating panel ended at x=462 on a 320px viewport; restored desktop geometry could hide all controls | CSS viewport bounds and position clamping on restore, drag, enlarge and viewport resize; cleanup removes resize listener; real Chromium tests |
| High | CHAT_SWITCHED cleared HMS payload but left non-HMS extras visible while the next chat loaded | Clear transient extras in the existing switch path; Node and Chromium tests reject previous-chat content and late old-chat states |
| Low | Popout title still identified the old 2.9 beta | Synchronize popout title with 2.9.8 RC and add it to release identity checks |

All three behavioral regressions were reproduced before their respective fixes;
no live tracking records were changed to make tests pass. The study note fixture
was intact in the DOM: no storage limits or tracking prompts were changed.
Only the backend diagnostic version constant changes; its gameplay implementation
is byte-identical after normalizing that version line. Identifier, permissions,
preset, translations, settings contracts and storage schema remain unchanged.

## Verification by phase

| Phase / systems | Evidence | Status / limits |
|---|---|---|
| A: Magic/statuses, long notes/names | Eight Chromium tests with actual frontend and backend-generated payload | Passed locally; no live WebView |
| A: Internal States | Actual backend HTML, CSS-only tabs/collapse in Chromium; existing startup/render fixture | Passed locally; actual host attachment untested |
| A: drawer/float/popout/test zone | Mode transitions, saved geometry and resizing, 240/320/768 widths | Passed with mock bridge |
| A: other panels/settings | Existing full-panel startup fixture; settings navigation; compact/comfortable, small/normal/large; host/space/parchment themes | Passed representative combinations, not exhaustive visual inspection of every setting or combat modal |
| B: Minds/knowledge/privacy/routines | Existing universal integrity and reconciliation suites; actual export replay | Passed fixture/source integrity; model-generated truth not certified |
| B: Agenda/quests | Existing 2.9.7 examples and identity suites; long-chat repeated identity checks | Passed; Roa stages remain distinct; no automatic merges added |
| B: magic/sword/ownership/currency/family/factions | Existing general/read/magic/visual-rank/tracking/panel suites | Passed fixtures; no changes to inference/grants/equipment rules |
| B: combat/injuries/Chronicle/Atlas/world events | Existing module, injury/source-summary, temporal Atlas, card and Save/Continue coverage | Existing assertions pass; full live fights and complete card mechanics untested |
| C: reload/import/export/older saves | Fresh VM + serialized message export, active-swipe reads; 2.8.1/2.8.21 save fixtures and recovery copy preserving unknown fields | Passed mock persistence; real page/restart/update not executed |
| C: chat switching | New isolation tests plus independent runtimes | Passed, confirmed old-extra leak fixed |
| D: long chats | Deterministic 50, 100, 250, 500, 1000 and 2000 messages | Unique identities, cache identity reuse, equal-length edit/new swipe rejection, no read-side metadata writes/model calls |
| E: single-event consistency | Item receipt + explicit held state, learned vs studied spell, matching quest/routine; existing pending/ownership/speculation tests | Passed; no invented cross-system completion rules |
| F: performance | Three alternating paired pipeline/browser processes plus synthetic scaling | Measured below; not live UI/storage/provider latency |
| G: compatibility | Six primary HUD examples and three legacy recognitions; existing panel demos/lore fixtures | Fixture-tested, not full-card/live certification |
| H: update/rollback | Version identity, package verification and older-data round trips; recovery guide | Local package/data checks; real failed update interrupted host process untested |

The normal suite now runs 22 suites: the original 19 are retained, plus frontend
chat isolation, stabilization continuity and long-chat stability. Both bundle
syntax checks remain. Eight browser tests are a separate CI job using pinned
Playwright 1.62.0 and installed Chromium; product runtime has no new dependency.
Private-export audit and Internal States replay pass on the supplied 17-message
export: 8 readable reports, 3 folded Minds, 9 pairs, 5 Agenda items and 5 quests,
without modifying it. The old 2.9.3-specific export test remains a known fixture
mismatch (80-character expectation vs this export's 156); it is not counted as passed.
Historical rebuild tests target 2.8.2 and are not run against 2.9.8; their older-save
fixtures are exercised directly without rebuilding current bundles.

## Measured comparison

Raw samples: [performance.json](performance.json), [stress.json](stress.json).
Node 22.22.2; same deterministic inputs; baseline/candidate order alternated across
three processes. Browser: 5 warmups, then 20 render+layout samples per process.

| Metric | 2.9.7 baseline | Candidate |
|---|---:|---:|
| Chromium panel render/layout median | 17.2 ms | 16.7 ms |
| Parse report median | 0.4069 ms | 0.4357 ms |
| Response processing median | 0.5442 ms | 0.5627 ms |
| Prompt construction median | 0.2606 ms | 0.2615 ms |
| Empty / populated prompt characters | 14832 / 18528 | 14832 / 18528 |

Differences are small and do not establish an improvement; no significant new
rendering overhead was observed. Backend processing code is unchanged, so small
sub-millisecond timing changes reflect run variance. These measurements do not
replace token counts or real provider latency. Phase 1's older machine timings
are retained as historical observations; paired fresh runs give the fair comparison.

At 2000 synthetic messages the recorded cold/warm panel reads were 376.8/80.96ms.
Heap deltas vary with GC and allocations; they are not proof of retained-memory
size or absence of leaks. Reads perform zero metadata writes and zero model calls.
Only ordinary layout work and one existing-path transient-state reset are added;
no polling, generation prompts, refresh cycle or storage schema is added.

## Compatibility matrix

| Format | Verified here | Not established |
|---|---|---|
| Overlord Living World | HUD/world detection/raw preservation, fixture fields, original demo panel | Full character/lorebook playthrough, combat mechanics |
| Re:Zero Living World | HUD/raw preservation/RBD fixture fields, original demo panel | Live RBD/update/reload behavior |
| Mushoku Living World | HUD/world parsing, three schools/sword rank, both-panel integration | Actual full card and all lorebook interactions |
| COTE Living World | HUD/Standings/quest barcode fixture, original demo panel | Live exam/gameplay progression |
| Mushoku Six-Sided | Classic + Visual examples, world/sword/magic, 1432-entry pagination and Saga/Atlas fixtures | Complete live card/WebView |
| Undertale/Dark Souls/Skyrim | Historical HUD format recognition | Full mechanics and live UI |

No full card files were supplied separately; no world-specific hardcoding was added.
No new critical backend tracking regression was reproduced. Unverified risks remain
in arbitrary prose identity matching and unsigned historical metadata; leave these
unchanged until a targeted reproduction justifies a patch. The missing distinct
2.1 archive still limits the historical comparison.

## Release and recovery

Version 2.9.8 is a release candidate, not stable. Focused fix commits are 12775d3
(UI wrapping/containment) and 04e0472 (chat isolation); later commits add coverage,
measurements and release metadata. See the PR/GitHub release for final commit and CI
results; local success alone does not establish hosted checks or publication.

The repeatable package command is `python3 tools/package_rc.py /tmp/Companion-2.9.8-RC.zip` from a clean, tested checkout. It includes only tracked public runtime/assets/guides/docs, rejects symlinks, verifies every archived byte and writes a separate SHA-256 manifest. CI also exercises packaging. Generated packages stay outside Git.

Before an update, back up the host's extension settings, persistent extension
storage and chat exports, including message Spindle metadata, using supported host
backup/export controls. Keep the current verified package and hashes. Do not clear
extension storage, reset chats or rerun historical rebuild tools as recovery.
If an install/update fails, disable the extension, preserve/backup partial state,
install the previously verified package through Lumiverse's supported mechanism,
and verify settings and active-swipe tracking before re-enabling automatic tracking.
Do not import old chat data over newer progress blindly. No automatic downgrade,
new migration or data deletion is introduced. Real interrupted-update recovery
remains untested without the host.

Remaining next step: a live Lumiverse acceptance pass with representative full
cards, real API metadata/reload behavior and installation/update/rollback checks.
Do not mark stable solely because this release's automated tests pass.
