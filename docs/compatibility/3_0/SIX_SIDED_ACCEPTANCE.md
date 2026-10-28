# Six-Sided World acceptance follow-up — 3.0.2 RC

This extends PR #14 on `fix/six-sided-release-verification`, preserving checkpoint
`4598bf5c4bd6cc7df6baf81a042f09f102bceb5e`. Published baseline remains 3.0.1 RC
at `22aabf3c367c95a21f602f2a88fa00802f02f126`. The original Companion repository,
both cards, presets, UI design and existing tracking schema remain unchanged.
No release or claim of perfect live compatibility accompanies this investigation.

## Evidence and confirmed fixes

The full Six-Sided card is unchanged: 1,296 original entries, 1,273 enabled,
111 spell references and 23 technique references. Reuse the
[per-entry register](six-sided-coverage.csv), [complete clause register](six-sided-coverage.json.gz)
and [dual-card mechanics matrix](DUAL_CARD_REPORT.md). These distinguish actual
mechanics from illustrative lore, narrator responsibilities and unsupported
simulation. All enabled contents are normalized without changing their text;
reference availability never grants player knowledge. Living World retains its
998 enabled entries, 348 spells and 31 techniques.

The private export still yields six readable reports, one Mind, five family
members, one scheduled event, two quests, two gear items and one faction.
Internal States retrieval and edited-source rejection pass; inputs are unchanged.
It is a short sword-training scene, not a whole-campaign acceptance fixture.
The longer-history failures below are confirmed with synthetic accepted reports;
they are not represented as events observed in that short export.

| Root cause | Targeted repair / runtime reference | Regression evidence |
|---|---|---|
| `hmsRelationsPanel` and `relPrevious` inherited the recent 300-report window, forgetting People while Family/Minds retained them. | Read indexed relationship observations. Determine presence and "just read" from the actual latest visible report, not the last historical relationship update. | Off-scene retention, reentry, source/swipe/edit/hide/delete checks. |
| `agendaRead` forgot old appointments and their history. | Share indexed Agenda observations and existing clocks/order map. Include `plot.now` and NPC activity cues because existing status logic uses them even without a scheduled Agenda row. | Long absence, completion, postponement, separate participants, explicit start without Agenda row; all existing identity/status suites. |
| `secretRead` forgot discoveries, owners and explicit knowers. | Fold indexed secret observations through unchanged owner-isolation and uncertainty rules. | Two identical descriptions from different owners remain separate; no knowledge granted to unrelated NPC; inference rejected. |
| `commsContacts` forgot earned addresses. | Index accepted contact/inbox observations. Leave intentionally bounded message-thread display unchanged. | Old contact retained, duplicate manual contact not added. |
| `hmsYouPanel` recomputed cumulative XP and carried acquisitions from recent reports only. | Use indexed accepted XP/acquisition/loss rows; keep mood/stress/sanity recent. Reuse the per-read Gear result to reconcile explicit losses in automatic carried rows. | Old XP retained, explicit later gains/manual adjustment/current HUD zero preserved; Gear/Carried agree after loss. |
| Pocket removal on sparse history lost its timing anchor; Gear did not recognize a later acquisition if its original source state was already "on body". | Preserve message IDs as ordering-only markers. Actual pocket dispatcher anchors removal; Gear updates occurrence position after an explicit post-anchor acquisition. | Actual frontend handler → save → reacquisition restores both projections; hidden/player facts never grant XP/items. Legacy unanchored removals remain sticky. |
| `simMindView` dereferenced `SIM_EMO[f.p].icon` for unknown legacy emotions, throwing and blanking Minds. | Generic icon/color fallback, preserving raw label and other Minds. Current normalization and source data unchanged. | Unsupported legacy primary emotion renders without a panel warning or input mutation. |

This adds typed references to the existing `continuityReadIndex`, not another
tracking engine or full-chat scan. It is rebuilt once per synchronous read pass,
so edits/swipes/hidden messages cannot leave stale durable facts. Structural
message-ID markers contain no facts; only visible, accepted assistant observations
supply XP or acquisitions. Signed continuation People/Agenda snapshots remain
supported; copied continuation XP/items/contacts/discoveries do not replay.
A bounded 512-entry per-read activity-word cache reuses unchanged Agenda text
analysis, including distinct cues and edited next reads; no persistent cache
or altered matching rules are introduced.
The Pocket remove action reuses its existing history fetch and directly selects
the tail ID; it does not perform an index scan to set this manual anchor.
Manual state remains additive and source anchored; no metadata migration or
rewrite occurs. Full historical observation retention is distinct from the
existing finite display limits and recent-context windows.

## Verification

- Node 22 release identity and both bundle syntax checks pass: **3.0.2 RC**.
- The same final acceptance fixtures pass **5/17 at checkpoint `4598bf5`** and
  **17/17 after these repairs**. Several assertions share root causes; these
  are not twelve independent export bugs.
- **43 regression suites pass**, including **17 new acceptance groups** and all
  Living World, Six-Sided, Magic, generic/legacy and other supported-card tests.
- **22 UI and five visibility browser tests pass** using Chromium/mock host.
  New browser coverage checks persistent People, Agenda, Secrets, XP and the
  carried fallback/removal control; existing continuation Internal States tests pass.
- Expanded retention gate covers 13 projections after 320 sparse replies:
  Family, Holdings, Debts, Factions, Quests, Gear, Spells, People, Agenda, Secrets,
  Contacts, XP and Carried. All retain their initial observations (XP 20 → 20).
- Private export audit retains the results above and confirms unchanged source.
- Pure-reader tests prohibit API/storage writes, and restore/edit/swipe tests
  verify source validation. No new dependencies, model calls or polling.

## Performance

Measurements and exact source hashes are recorded in
[six-sided-acceptance-evidence.json](six-sided-acceptance-evidence.json).
The timing snapshot precedes only a two-line manual Pocket action optimization:
the final handler selects the already-fetched last message directly rather than
building an index just for its ID. Timed panel/pipeline functions are unchanged;
the final implementation and measured snapshot have separately recorded hashes.
Timing results are local synthetic observations, not historical/live-device
benchmarks. Cold/warm runs use full cached cards, identical source-bound fixtures
and alternating revision order. No concurrent regression/browser jobs run during
those measurements. See the evidence for retained raw samples and methodology.

| Projection, median warm milliseconds | Published 3.0.1 | Checkpoint 4598bf5 | Follow-up |
|---|---:|---:|---:|
| Six-Sided, 600 messages | 71.81 | 69.35 | 64.06 |
| Six-Sided, 2,000 messages | 111.37 | 134.21 | 164.19 |
| Living World, 600 messages | 80.30 | 79.28 | 77.50 |

Response processing is 0.9340 / 0.9795 / 1.0886 ms. Tested prompt sizes stay
14,949 / 18,839 characters (empty/populated), with zero warnings. Newly retained
facts may appropriately change reminder content within existing item limits;
these fixture measurements do not imply identical prompts for every old campaign.
Transport remains one model call, six history fetches, one metadata write, two
storage reads and four writes. Panel proxy element reads fall 6,701 → 6,101.

The 2,000-message dense-history stress case costs **29.98 ms / 22.3%** more than
the immediately preceding checkpoint. That is a measured performance tradeoff,
not a zero-overhead claim: historical relationship/event/discovery records that
were previously omitted are now folded. Relative to published 3.0.1 the complete
candidate also includes the earlier durable-money/gear/quest repairs. Cold panel
medians are 370.84 / 749.75 / 1,095.05 ms for the three respective fixtures.
Normal fixture latency does not show a comparable increase, but real long-campaign
and Android responsiveness need acceptance. No timers or extra automatic work
were added to compensate. Do not treat these results as performance-neutral or
as meeting the user's no-regression release condition without that evaluation.

## Remaining acceptance limits

Automated compatibility is substantially stronger; it is not proof of perfection.
No live Lumiverse instance was supplied. Installation/update, Android WebView,
real provider output, narration grounding obedience and representative lengthy
campaign reloads still need live acceptance. Browser mocks cannot certify those.
The export's nine unsupported ability quotations remain rejected rather than
being converted into earned abilities. Arbitrary prose cannot guarantee correct
identity, ownership or semantics; no independent spell-effect, inheritance,
economy or NPC autonomy simulator was added. Existing panel limits and finite
lore-injection budgets remain deliberate; no lore catalogue implies ownership.

The candidate stays in the same PR for review and CI. To roll back this follow-up,
use checkpoint `4598bf5` on a separate recovery branch; published `main` remains
`22aabf3`. Do not reset a live checkout or overwrite saved chats. Historical
checkpoint reports retain their original measurements and failure evidence.

From a clean working tree, prepare the exact previous candidate without resetting
this branch or touching live chats:

```bash
git switch -c recovery/3.0.2-before-acceptance 4598bf5c4bd6cc7df6baf81a042f09f102bceb5e
python3 tools/package_rc.py /tmp/RPG-Companion-3.0.2-RC-checkpoint.zip
```

Back up live chat/settings before any manual extension reinstall; building this
rollback artifact itself neither installs it nor changes saved state. Previously
recorded money-correction downgrade limitations still apply to older runtimes.
