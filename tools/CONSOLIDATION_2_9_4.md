# RPG Companion HMS 2.9.4 | Consolidated Release Candidate

## Provenance and comparison

All six uploaded development lines were inventoried: Perch 2.0, Perch 2.1, Mazaki 2.8.1, Mazaki 2.9.0, Mine 2.8.2, and Mine 2.9.3. The source-level function and path inventory is in `SOURCE_COMPARISON_2_9_4.json`; card file fingerprints are in `CARD_SPECS_2_9_4.json`. The distribution retains the later extension structure and preexisting data identifier because tests indicated it was a more compatible integration basis, not because newer always means better.

## Feature provenance, inherited versus newly integrated

| Capability | Status in 2.9.4 | Evidence and provenance |
| --- | --- | --- |
| HUD parsing, cards and layout | Existing 2.9.3 tracking/UI kept; new Visual semantic normalization | Perch original HUD behavior, 2.8.1 panel parity, Visual rank and card matrix tests |
| Quest identity/deduplication | **Inherited**, not new in 2.9.4 | 2.9.2 equivalence and 2.9.3 tracking suites |
| Items, events, appointments | **Inherited**, no broad rewrite | 2.9.3 source-integrity tests |
| Magic studying, knowing, mastering, alias handling | Inherited state machine; **new Visual-HUD rank support and Touki fix** | spell and Visual rank suites |
| Re:Zero RBD, Authorities, Gate | Inherited HMS mechanics | card matrix |
| Overlord Karma, class levels, HP/MP | Inherited HMS mechanics | card matrix |
| Classroom of the Elite cohorts, PP, standings, barcode quests | Inherited HMS mechanic parsing | card matrix |
| Mushoku Tensei classic and Six-Sided Classic/Visual HUD | Inherited Classic; **new Visual recognition and multi-school rank parsing** | card matrix and Visual rank suite |
| Minds, agendas, who-knows-what, bonds | **Inherited** from Perch / FrankenSIM-derived work and subsequent refinements | parity and reconciliation tests |
| Quest/map/atlas, combat, inventory, family, phone, catalog, guide | **Inherited**, source and panel preserved | panel parity, atlas, startup tests |
| Save/Continue and OOC auxiliary responses | **New transaction-purpose isolation**, adapted from 2.8.2 | Save/Continue boundary suite |
| Extra worlds: Undertale, Dark Souls, Skyrim | **Inherited** historical detection | card matrix |
| Data persistence and extension permissions | **Preserved** manifest ID and storage shape | source inventory, manifest, integration tests |
| Translations and multilingual guides | **Preserved** without redesign | package inventory and bundle syntax |

## Historical implementation exclusions and replacements

Perch's `catalogCompose` and `commsInbox` are absent by exact function name but their public purposes are retained in the modern composer/catalog checker and thread/inbox reader. 2.8.2's `hudVisualLine` and `normalizeHudLine` were not copied wholesale; new `hudSemanticText` isolates Visual presentation from normalized semantics. Its extra request-injection helpers `auxiliaryRequest`, `cardRequestPurpose`, and `protocolMessages` were not revived because they add a separate prompt path. Its `cardTurnPurpose` and `resumeHudText` duties are replaced by `companionTurnPurpose`, `companionMarkTurnPurposes`, and `companionResumeHud`. The 2.8.2 rebuild bundle is archival tooling, not a required runtime asset.

The historical source-function inventory is a difference detector, not proof that every imaginable behavior has been exercised. Every identified difference must be interpreted against replacement implementations and tests.

## Reproduction and release gate

Run `node tools/run_tests.cjs` from the extension root. Tests cover the 2.8.1 four-world panel baseline, newer tracking integrity, quest deduplication, Visual magic ranks and Touki, Save/Continue transaction isolation, Classic and Visual Six-Sided variants, five supplied cards, and historical Undertale/Dark Souls/Skyrim detection. The runner also syntax checks both distributed JS bundles.

**Release candidate only.** No claim is made that simulated tests certify live Lumiverse installation, WebView behavior across platforms, provider API concurrency, old-chat migration in all circumstances, complete Save/Continue generation, or long-running stress performance. Card fixtures are representative schemas and mechanics, not entire card playthroughs.

## Publication

`https://github.com/marcusjeanr-ctrl/COMPANION-TESTING` is the only intended publish/update repository. `marcusjeanr-ctrl/Companion` is source reference only and must never be modified during this release.
