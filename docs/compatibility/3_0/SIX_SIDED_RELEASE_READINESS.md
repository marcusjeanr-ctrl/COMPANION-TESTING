# Six-Sided World: release-readiness investigation

**Historical snapshot at `9b31453`:** the four remaining retention failures below
have since been fixed in the same patch. See [Durable history completion](DURABLE_HISTORY_COMPLETION.md)
for current results, stable money corrections and performance. The initial failures
and measurements below are preserved as evidence; live acceptance remains pending.

## Protected source and scope

Published baseline: 3.0.1 RC, `22aabf3c367c95a21f602f2a88fa00802f02f126`.
Task checkpoint: `b675b64ad63239827952b815df78d989e1bfc6fc`, the committed 3.0.2
narrator-grounding candidate in PR #13. Branch: `fix/six-sided-release-verification`.
All Task 1 grounding/classification work is preserved. The candidate remains
3.0.2 RC; no new public version, merge, release or change to original Companion
is performed. Source is patched directly, without reconstruction or new dependencies.

The supplied Six-Sided JSON has SHA-256
`df2fd8b90c1f8ee1bac2a054dd7acb60d165555022a7e8c59e34d149d84a69d7`:
byte-identical to the previously audited full fixture. The full core fields,
11 alternate greetings, primary lorebook and extension mirror are unchanged.
The 1,296 original IDs / 1,273 enabled entries, all original content hashes and
runtime normalization were cross-checked again through
`build_six_sided_3_coverage.py`. The mirror is not another 1,296 independent rules.
Reuse the complete [per-entry register](six-sided-coverage.csv),
[lossless clause register](six-sided-coverage.json.gz),
[inventory](six-sided-inventory.json) and [dual-card report](DUAL_CARD_REPORT.md).
Those are historical evidence snapshots; function names, rather than their old
line numbers, identify current replacements.

Classification remains conservative: 450 partially supported, 820 dependent on
narrator output, 23 disabled/not applicable, three compatible without special
tracking. Individual normalization checks do not establish execution of each
entry's gameplay rules. The extension reads actual play; it does not simulate
all lore, grant listed powers, run every spell or reproduce the narrator.

Private export SHA-256:
`24530488965c36a0f9b707e1b26c6b7ecfb6337376236c0fa4174cc0d9dba332`.
It stays outside Git and installable assets. No source text, private biography,
message ID, bridge connection ID or credential is included in this report.

## Export and diagnostic findings

| Observation | Verified result and interpretation |
|---|---|
| 13 messages / seven assistant messages | Initial greeting plus six gameplay replies; all six gameplay reports are readable. |
| Internal States | Active-swipe exported metadata is selected; actual Internal States HTML renders. Edited-source rejection and unchanged input pass. No confirmed retrieval failure here. |
| Abilities | 11 optional assessments: two source-matched, nine rejected because the quoted evidence is absent from that reply after existing whitespace normalization. Three practiced, one mastered, two reliable, five attempted were reported. These are provider evidence failures, not nine parser defects. |
| Magic/martial | Current corrected runtime has zero owned Magic spells from this sword-drill export; physical observations route to existing Martial Arts. School ranks are not individual ownership. |
| Family | Five established family members remain; all retain reported alive status. They are not all claimed physically present. |
| Agenda / quests | One scheduled event, two quest records. Distinct objectives are retained; a sparse last transaction does not delete earlier records or silently complete a still-active goal. No duplicate-merge repair is justified by count alone. |
| Truncated `lastReply` | Diagnostics intentionally include at most 3,000 characters. The actual last response has 3,722. No saved-response truncation was found; a new boolean makes preview truncation explicit. |
| Metadata `valid`, no recent problems | Valid provenance does not certify every model-supplied assessment. New counts expose quote mismatches without printing private evidence. |
| Live acceptance | User-supplied diagnostic/export only. No running Lumiverse/model instance is available; this is not a fresh live acceptance test. |

Replay outputs remain unchanged after fixes: six reports, one Mind, five family
members, one Agenda item, two quests, two gear items and one faction membership.
The private file and messages remain byte-for-byte/structurally unchanged.

## Confirmed defects and implemented repairs

### Durable family and property observations

`famRead` and `holdRead` consumed `relReadings`, capped at 300 visible assistant
replies. An old father/workshop disappeared after 300 sparse later replies despite
no death, removal or loss. This is a reproducible inherited defect; the short
export cannot itself demonstrate it.

`continuityReadIndex` replaces those readers' existing full-history position-map
passes with one shared per-read source index. It retains relevant family/kin and
property observations, validates active swipe/source/visibility and preserves
manual anchor positions. It does not increase the general recent-HUD/report window.
`continuityObservation` reuses recent clocks and cached message HUDs; dated older
observations receive their actual clock, undated history gets no invented date.
Clock parsing is shared within the read pass. No persistent aggregate becomes a
second source of truth.

Family leaving a scene retains identity/location/status, returning short/full
identities reconcile, reliable newer facts replace old places and pins, and
explicit property loss/reacquisition still works. Signed continuation family
snapshots remain readable; copied property transactions are never replayed.
Raw reports, storage schema, manual edits and old saved data are not rewritten.

### Inconsistent mastery claims

`spellStoryFoldUncached` checked whether an assessment quote occurred, but treated
`state: mastered` as proof even when that quote said "not mastered" or contained
only failed practice. The prior martial-only display guard did not protect Magic
or catalogued techniques and could leave shared Known/mastered maps incorrect.
This is a synthetic confirmed defect, not a claim that this export's unsupported
historical mastery quote was accepted—it correctly fails the exact-source check.

`abilityEvidenceRows` reuses the exact-source check and a shared bounded
`abilityMasteryConfirmed` predicate. Contradictory/absent mastery wording becomes
an ephemeral **unverified** assessment; it cannot add learning/mastery or bypass the
guard via the same report's legacy `mastered` array. Existing independently earned
mastery, manual choices, historical precedence and deliberate study are preserved.
Explicit mastery remains supported, including the affirmative "not only mastered".
The same reader serves Magic, catalogued techniques and martial observations.
This is not a general semantic truth/subject detector for arbitrary prose.

### Diagnostic clarity

`abilityEvidenceAudit` adds counts only under
`chat.trackingMetadata.assessmentEvidence`: reported, normalized, source-matched,
source-mismatched and unverified-mastery counts for that reply. `lastReplyTruncated`
labels the existing preview cap. No private quote, extra scan of all history,
automatic refresh, model call or metadata write is added by these diagnostics.

## Mechanics coverage and release limits

| System | Handling and evidence | Remaining limit |
|---|---|---|
| WORLD STATE, starts, continuation | Existing parser, HUD/Save/Continue/dual-card suites; all current 14 HUD keys recognized. | Exact live host prompts and every handler branch unverified. |
| Age, birth month, birthdays, chronology | Dual-card 13→22→42→85, calendar rollover and distinct Living extended-day tests pass. | No invented exact birthday, automatic lifetime events or proof of every time skip. |
| Magic, spells, study, ranks, voiceless casting | 111 Six-Sided cached references, literal schools/ranks; original Magic and grounding suites plus new mastery tests. Living retains its 348 references/terminology. | Actual model compliance and execution of every effect/cost unverified; nine export quotes remain unsupported. |
| Sword styles, Touki, techniques | 23 references; HUD Active distinct from Known/learning; attempt/practice/reliability/mastery tests. | Free-form drill labels are not guaranteed canonical techniques or safely mergeable aliases. |
| Injuries, diseases, recovery, conditions | Existing HUD/body, drain, retraction and cross-card tests. | Narrator must establish changes; Companion is not an independent medical/rules simulator. |
| Family, descendants, property/businesses/titles | Old source-bound family/property persistence repaired; marriage/children/inheritance/lifetime and manual/source tests retained. | No automatic inheritance, births, income or political simulation. |
| NPCs, relationships, knowledge/autonomy | Existing identity, owner-isolated secrets, uncertainty, Minds and off-scene tests. | People/other readers retain inherited windows; model claims are not proof of truth or universal NPC autonomy. |
| Money, debts, guild payments | Explicit transactions/ownership tests; no fabricated amounts. | **Fails old-debt retention gate**; ledger-ID compatibility needs dedicated migration/alias work. |
| Equipment, possessions | Existing ownership/container/HUD/correction tests. | **Fails old-observation retention gate**; raw metadata remains stored. |
| Guilds, nobility, renown, social standing | Literal HUD/faction updates and political/title scenarios tested. | **Fails old-membership retention gate**; no automatic influence/economy engine. |
| Agenda, quests, objective transitions | Existing identity, rescheduling, completion/history and genuine-separate-objective tests. | **Fails old-quest retention gate**; arbitrary prose identity is not guaranteed. |
| Geography, travel, language, weather | Existing dynamic hierarchy, Atlas, temporal map/travel tests. | No independent simulation of every route, language, weather or regional consequence. |
| Canon/Sandbox, divergence, Turning Points | Existing forecasts vs actual event ledger, Saga and branch tests. | Every alternate timeline/ripple is narrator-owned and not exhaustively simulated. |
| Other RPG cards and saved data | Entire Living, Overlord, Re:Zero, COTE, generic/legacy, swipe/edit/manual/source suites retained. | Fixtures are not live certification for every card. |

## Explicit failing release gate and proposed next repairs

`node tools/audit_release_continuity.cjs` deliberately exits **2** on the current
candidate. Seven initial observations become, after 320 sparse replies:
family 1→1, holdings 1→1, spells 1→1; debts 1→0, factions 1→0, quests 1→0,
gear 1→0. The fixture uses actual normalized accepted records and public synthetic
names. It neither changes old assertions nor hides this failure in passing tests.

Required before a full-compatibility release:

1. `moneyRead`: source-stable transaction identities with legacy hidden/settled-ID
   compatibility. IDs currently include a window-relative ledger ordinal. Simply
   extending the window can renumber saved corrections; for multi-transaction
   messages an old unanchored ordinal may be ambiguous. Never guess or hide the
   wrong payment. Require multi-row, partial repayment, accepted/rejected, deleted/
   swiped/edited earlier history, manual hide/settle and long-history cost tests.
2. `gearRead`: retain explicit acquisitions, containment, loss and manual anchors
   beyond the window; test body/pockets consistency, moved containers, reentry,
   authorization vs ownership, old edits/swipes and no phantom equipment grants.
3. `factionRead` / relationship readers: retain established membership/rank/bounty
   without implying presence, preserving explicit departure, ambiguity and pins.
4. `questDetailsLatest` / Agenda readers: retain unresolved and completed history
   with stable objective stages, progress resets, rewards, rescheduling, genuinely
   separate records and no cross-card false merges.
5. Re-run this gate, complete suites, performance and saved-data checks, then live
   installation/update/reload/continuation and both primary cards with actual models.

These fixes are compatible with the existing architecture, but widening all windows
or rebuilding from historical bundles is not a validated repair. A broad rewrite
would not supply missing source evidence or recover ambiguous legacy corrections.
Do not publish this candidate merely because ordinary CI is green.

## Verification and rollback

Node 22: release identity, both bundle syntax checks and all **40 suites** pass.
The new suite includes **11 groups**: long-history family/property retention,
source/swipe/hidden/deletion/JSON restore, manual precedence, continuations, both
calendars/undated history, no API/writes, shared mastery and actual diagnostics.
Nine initial focused failures were reproduced across two runtime root causes
before patching; they are not nine independent historical defects.
Chromium/mock host: **20 UI + five visibility checks** pass, including old family/
property display and a denied mastery row remaining unverified. Real export replay
and full-entry normalization pass. The separate release gate **fails** as above.

Performance raw results and limitations are recorded alongside this report; the
comparison checkpoint includes all earlier grounding work, so existing context
budgets and call counts must remain unchanged. No live-provider timing or complete
process-memory certification is claimed.

Restore the exact pre-task code with a clean checkout of `b675b64`; restore the
published 3.0.1 with tag `v3.0.1-rc.1` / `22aabf3`. Do not reset main, force-push,
move release tags or rewrite tracking data. All changes remain on an unmerged
review branch; no state migration needs reversal.

### Measured comparison

Five sequential baseline/candidate pairs, alternating order, on Node 22.22.2. Same source-bound fixtures, complete card caches and existing runners. Panel: cold + 3 warmups + 10 samples; normal narrator: cold + 5 warmups + 30 samples; pipeline uses its existing repeated rounds. Values below are medians across runs, not a live responsiveness or memory certification.

| Workload | Warm checkpoint → candidate (ms) | Cold checkpoint → candidate (ms) |
|---|---:|---:|
| panel-six-600 | 81.74 → 85.94 | 420.30 → 400.62 |
| panel-six-2000 | 117.69 → 131.63 | 659.20 → 685.23 |
| panel-living-600 | 98.41 → 90.47 | 1164.34 → 1357.95 |
| Parse report | 0.8097 → 0.8139 | — |
| Process response | 1.2185 → 1.0954 | — |
| Build tracker prompt | 0.5287 → 0.4878 | — |

Normal-narrator context/API counts match the grounding checkpoint in every scenario: no added world-book/model/storage calls, one existing history fetch. Ordinary turns add zero reference characters. Existing grounded requests retain the same character counts; tracker prompt sizes remain 14,949 empty / 18,839 populated characters. These benchmark prompt sizes match; no new extraction schema or prompt budget is added. Retained old facts can populate existing capped reminders in longer campaigns, so zero token growth is not claimed for every history. Prior grounding costs remain documented separately.

| Card / normal request | Warm checkpoint → candidate (ms) | Added reference characters (both) |
|---|---:|---:|
| six_sided_world / ordinary | 7.650 → 6.926 | 0 |
| six_sided_world / named | 9.436 → 8.987 | 535 |
| six_sided_world / inventory | 9.257 → 9.525 | 1866 |
| six_sided_world / host-provided | 9.877 → 13.074 | 447 |
| living_world / ordinary | 5.054 → 5.904 | 0 |
| living_world / named | 7.479 → 8.519 | 546 |
| living_world / inventory | 7.849 → 7.483 | 1809 |
| living_world / host-provided | 8.960 → 8.026 | 447 |

The 2,000-message warm panel increased from 117.69 to 131.63 ms (+13.94 ms, about 11.8%); the Living cold result also increased by 193.61 ms. No speed-neutral or release-ready claim is made. Optimizing/accepting this added continuity cost on the real host remains a release gate.

Retaining old observations adds work proportional to relevant family/property history; it is not free or an unlimited-memory guarantee. Shared per-read indexing replaces two existing full position scans, and shared clock parsing avoids redundant old-HUD work. All raw observations remain the source of truth. Timing variation includes cloud/JIT effects; no model/tokenizer/live WebView latency or long-session heap benchmark is claimed.

Raw counts, source hash, failing gate and every run: [six-sided-release-evidence.json](six-sided-release-evidence.json).
