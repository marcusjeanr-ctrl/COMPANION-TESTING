# Historical feature and regression matrix

## Source identity and evidence limits

Seven supplied ZIP files were inspected without executing archive instructions or
extracting them into the working checkout. There are six unique builds: 2.0.0,
2.8.1, 2.8.2, 2.9.0, 2.9.3 and 2.9.6. The two files named 2.0 are byte-identical
(SHA-256 `a93b7a3377dc368ccfcc33439cb4f25b975488d8d7a03cbfb80247c7dd117d14`).
`Companion-main (1).zip` identifies as 2.9.3; the Diagnostics ZIP is 2.9.6.
No distinct 2.1 or 2.9.7 archive is available. Current 2.9.7 is verified from Git
history and runtime files, not assumed to be an uploaded build. Earlier documents
claim comparisons with 2.1, but this audit cannot independently reproduce them.

[archive-inventory.json](archive-inventory.json) records every manifest, archive and
bundle SHA-256, permissions, runtime requirement and static function evidence with
line numbers/reference counts. Reproduce with:

```sh
python3 tools/audit_archives.py /private/*.zip > /tmp/archive-inventory.json
```

The static scanner intentionally does not equate absent names with lost features.
It inventories anchors; the matrix below combines those with existing integration
suites, historical notes and narrow behavioral probes. Earliest *observed* evidence
is a lower bound, not proof of who originally invented a feature. Attribution to
Perch, Mazaki and Marcus follows the user's provenance, not cryptographic authorship.

## Cross-build comparison

| Area | 2.0 | 2.8.1 | 2.8.2 | 2.9.0 | 2.9.3 | 2.9.6 | 2.9.7 |
|---|---|---|---|---|---|---|---|
| Manifest permissions/minimum host | six permissions; 1.2.0 | same | same | same | same | same | same |
| HUD + tracker report probe | pass | pass | pass | pass | pass | pass | pass via suites |
| Backend/frontend initialization | shipped bundles | same contract | overlays | evolved bundles | evolved bundles | narrow fixes | narrow fixes |
| Appended-detail Agenda probe | unsupported helper | 1 record | 1 | 1 | 1 | 1 | 1 via suite |
| Export-only metadata probe | unreadable | unreadable | unreadable | unreadable | unreadable | readable | readable |
| Source fingerprint policy | simple live read | simple live read | source-aware live | source-aware live | source-aware live | candidate fallback | retained |
| Conservative questMatch anchor | absent name | absent name | absent name | absent name | present | present | retained |
| Save/Continue purpose anchor | absent name | absent name | absent name | absent name | absent name | present | retained |

Historical probes use the current mock host and synthetic reports. An unsupported
helper is not a demonstrated product defect. The simple appended-detail example
already deduplicates in older builds; the harder 2.9.7 conditions and deadline cases
must not be conflated with it. Export-only fallback is a demonstrated later
improvement, not a reason to import older readers.

Reproduce probes after safely obtaining only the historical backend files outside
the checkout: `node tools/probe_historical_runtime.cjs /private/backend-*.js`.
Results for this run are in [historical-probes.json](historical-probes.json).

## Feature evolution and current behavior

In this table 'retained/tested' means the named synthetic integration checks pass,
not full equivalence to every historical interaction. 'Unverified' is not 'missing'.
All 2.1 behavior is unverified because that build is missing.

| Feature / earliest observed evidence | Evolution | 2.9.7 result and safeguards | Behavioral evidence / remaining uncertainty |
|---|---|---|---|
| Architecture/init: 2.0 shipped Spindle backend and frontend | later bundles retain host split; 2.9.5–7 are narrow changes | retained/tested | startup/render; no real host installation tested |
| Manifest/permissions: 2.0 | all supplied manifests retain six permissions and Lumiverse 1.2.0 | retained, identity/version synchronized | inventory; check_release; real denial behavior partly mocked |
| Tracker pipeline: 2.0 parseCompanion + per-swipe storage | 2.8.x expanded modules, later source binding/queued writes | retained/tested; one normal extraction call | panel_tracking, universal_integrity; live provider untested |
| Frontend UI/response rendering: 2.0 statesPanelHtml | broader panels by 2.8.1, diagnostic/version changes later | retained/tested | startup/render, panel parity; WebView layout not certified |
| HUD: 2.0 parseHud | compatibility overlays, Visual/rank handling retained in current line | improved/tested | universal_card_matrix, visual_rank_integrity; full cards absent |
| Quest details: 2.0 questDetailsLatest | objective/context identity anchor observed in 2.9.3 | conservative matcher retained/tested | quest_identity_2_9_2, agenda_quest_export_2_9_7; related stages preserved |
| Scheduled Agenda: 2.8.1 agendaRead | context/schedule guards by 2.9.3; 2.9.7 appended conditions and now refinement | improved/tested | reconciliation, tracking_2_9_0, 2.9.7 fixture; arbitrary prose ambiguity remains |
| NPC agendas: 2.8.1 Minds fold/report fields | separate from player appointments across later bundles | retained/tested | panel_tracking stores both agenda/agendas; full live routine semantics unverified |
| Minds/Internal States: 2.0 HTML, Minds fold observed 2.8.1 | 2.9.5 exported layout, 2.9.6 candidate fallback/diagnostics | improved/tested, not a historical rollback | actual export + internal_states test; live sync remains unverified |
| Relationships/knowledge: 2.0 relationship readers; 2.8.1 Minds knowledge | numeric/owner/source guards strengthened in current line | retained/tested | reconciliation + universal_integrity; uncertain knowledge never certain |
| Magic/sword progression: 2.0 world spell readers; 2.8.1 spellKnown | catalog/ownership/aliases/study boundaries refined | retained/tested | reading_and_magic, spell_aliases, visual_rank; no rank-only grants |
| Inventory/equipment/ownership: 2.8.1 gearRead | permission/pending acquisition guards in later tracking updates | retained/tested | source_integrity and tracking_2_9_3; read-only export audit |
| Family/factions/characters: 2.8.1 report integration | partial updates retain established rows | retained/tested for fixtures | panel_tracking and tracking_2_9_0; older field names do not imply absence |
| Combat/encounters: 2.0 combatRolls and prompts | expanded immersive systems retained in later bundles | present, full battle behavior unverified | source inspection; general startup is not encounter coverage |
| Atlas/geography/world: 2.0 atlasBuild | pagination, temporal geography and cache isolation refined | improved/tested | atlas_references, six_sided_repairs; 64-node and full-book fixtures |
| Chronicle/continuity: 2.0 chronOf/chaptersOf | source-valid summary/knowledge safeguards in later line | retained, partially tested | universal_integrity chapter edits/concurrency; full Chronicle UI unverified |
| Save/Continue: older persistence; purpose isolation observed by 2.9.6 | current branch preserves resume HUD without stale transaction replay | retained/tested | save_continue_boundary; runtime restart not a real host reload |
| Settings/data persistence: 2.0 setSwipeData and host storage | later serialized writes/recovery and unknown-field preservation | improved/tested | universal_integrity queue/failure/migration cases; live disk integration unverified |
| Model/API overhead: 2.0 quiet generation and Reporter slot | compacted instructions/bounded memoization in later line | tested normal call count; no calls added by audit | panel_tracking, universal_integrity; prompt characters not tokens |
| Refresh/performance: later cache/read-pass consolidation | measured current bounded synthetic history; no gameplay changes | baseline measured, no improvement claimed | PERFORMANCE.md; live UI/storage/provider latency unmeasured |
| Primary/legacy RP formats: 2.0 world readers | expanded HUD compatibility retained | fixture-tested | six cases for five primary formats + three legacy recognitions; full cards absent |
| Preset/lorebook integration: 2.0 Reporter slot + world spell readers | pagination/catalog/source isolation strengthened | retained/tested | reading_and_magic, universal_integrity; actual preset import untested |

No missing feature or newly introduced critical gameplay regression was demonstrated.
This is a broad baseline comparison with explicit coverage limits, not an exhaustive
semantic equivalence proof. The confirmed unsafe legacy publisher is an infrastructure
defect corrected in this patch. Do not turn static inventory gaps into gameplay fixes.
