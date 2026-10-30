# Item 6 — Relationship defaults and advisory drift checks (3.1.0 RC)

Baseline: `0d08726138a0749e779df210e079be2ac87dc796` (tagged 3.1.0 RC).
Review branch: `fix/relationship-defaults-drift`. No main merge, tag change, release,
original-repository write, gameplay correction, or saved-report migration.

## Confirmed behavior and changes

Previously `simPairNew` replaced omitted modes with `stranger`, making an absent
report indistinguishable from an explicit report. It now retains omission in the
transient fold. `simPairMode` supplies a read-only view/context default:

| Existing evidence | Default |
| --- | --- |
| Close, Devoted, Friend, Friendly | warm |
| Hostile, Enemy, Nemesis | hostile |
| Wary | strained |
| Kin, without a mapped standing | warm |
| No recognized standing or kin | not reported |

A previously reported or user-edited mode takes precedence, including `stranger`.
The existing minor/family romance safeguards and numerical axes remain unchanged.
`guessed` is unchanged: a qualitative default is not a new numerical baseline.
Derived labels carry a tooltip and a transient `modeSource`; existing context
labels them `(default)`. Explicitly reported mode views retain their previous
shape. NPC-to-player People standing is never borrowed for NPC-to-NPC links;
those require an explicit mode or that pair's kin flag. No synthetic NPC is added.

`simGuards` reuses its existing relationship traversal for passive default context.
Unlike its unchanged historical safety sets, defaults accept only active Minds
history, excluding undone/excluded replies, stale sources and inactive swipes.
Continuation snapshots supply passive People context without replaying Minds
transactions. Manual bond pins take precedence for kin classification.

The consistency table now compares consecutive established standings for every
NPC using the configured ladder. It warns on a drop with a clearly positive stated
reason, or a jump of more than one step without an explicit event. It never edits
standing, modes, metadata, or the HUD. It uses the existing consistency switch.
First observations, sparse replies, continuation snapshots and intentional rewind
replies do not themselves generate drift alerts. A reason that explicitly reports
betrayal can justify a sharp drop; a clearly positive drop still warns. Where the
reason has no event, only bounded visible prose from that current reply is checked,
with the full reported NPC name required. Quotes, hidden tracker/reasoning,
examples, hypothetical language and events naming someone else cannot justify it.
Previous standings are gathered inside the existing shared continuity-index pass;
there is no new full-chat traversal, model call, polling, timer, or dependency.

## Files and verification

- `dist/backend.js`: runtime source, omitted-mode distinction, shared defaults,
  existing-traversal context and table-driven advisory checks.
- `dist/frontend.js`: runtime source, visible mode/default tooltip and escaped
  advisory reasons; embedded translations regenerated from dictionaries.
- `i18n/{pt-BR,es,ru,tr}.json`: four new keys; English is the source-key fallback.
- `tools/test_relationship_defaults_drift.cjs`: 15 focused regression groups.
- `tools/run_tests.cjs`: new suite registration.
- `tools/test_ui_browser.py`: two real Chromium tests using the backend fixture.
- `CHANGELOG.md` and this report: review notes; version remains 3.1.0 RC.

Before implementation the synthetic Close/unknown fixtures reproduced the
`stranger` fallback. Additional failing regressions caught excluded future kin and
mixed positive/negative reasons. The final focused tests cover all requested cases,
explicit/inherited/manual modes, JSON reload, guessed flags, custom ladders,
continuations, inactive swipes, edits, malformed legacy rows, sparse/repeated reads,
short names, event attribution, off-switch behavior and unchanged metadata/no writes.

Node 22: release check and both bundle syntax checks pass; all **57** regression
suites pass. Real Chromium/mock bridge: **39** UI tests and **5** visibility tests
pass, including a 320px relationship/default/warning view and safe text rendering.
`python3 tools/embed_i18n.py` regenerated all four dictionaries (English implicit).

## Performance

See `RELATIONSHIP_PERFORMANCE.json` for the final serial AB/BA comparison and
`RELATIONSHIP_PERFORMANCE_INITIAL.json` for the rejected initial implementation.
Ten alternating pairs per case, frozen sources, fresh Node processes, cold first
projection, three warmups and ten warm reads per run; no concurrent local tests.
Medians, IQRs and percentage changes are recorded below. Shared-host scheduling
cannot be fully controlled; these synthetic panel timings are not device timings.

The first implementation added a separate People loop in the Minds fold. Its
2,000-message warm median was 164.975 vs 151.465 ms (+8.92%), with substantial
spread. It was rejected. Reusing the existing guards traversal also fixed a
future/excluded-kin leak. The intermediate matrix still measured +14.27% warm
and +10.59% cold at 2,000 messages, so that optimization did not clear the gate.
The diagnostic split of defaults/checker versus baseline used fresh processes in
forward/reverse order (two samples per variant). It did not establish a stable
single-feature attribution; see `RELATIONSHIP_PERFORMANCE_ISOLATION.json`. The
last change skips reclassification/map writes for identical confirmations and
avoids per-message empty change arrays; sparse, speculative and changed reports
retain their original handling. All raw matrices are retained rather than replacing
unfavorable results. The comparison alone does not establish causality for the
entire observed difference on this shared machine.

| Messages / case | Baseline median (IQR), ms | Candidate median (IQR), ms | Change |
| --- | --- | --- | --- |
| 600 / cold | 282.96 (250.43–314.57) | 323.20 (267.09–376.75) | +14.22% |
| 600 / warm | 85.17 (61.86–92.89) | 78.62 (67.33–89.00) | -7.69% |
| 2000 / cold | 641.97 (530.47–678.46) | 684.48 (662.09–687.76) | +6.62% |
| 2000 / warm | 171.52 (146.88–189.00) | 189.07 (181.12–193.31) | +10.23% |

**Gate failed: +10.23% exceeds 5%; do not merge, tag, publish, or call this
performance-cleared.** The source is retained only as a draft review candidate.
The local process was otherwise idle, but shared-host scheduling remains a limitation.
The two-sample diagnostic could not reliably isolate a single responsible feature;
profiling did not establish a sole cause. The slowdown remains unresolved.

Serial pipeline ABBA medians (baseline → candidate; two samples per source):

- Parse: 0.6063 → 0.5961 ms (-1.69%).
- Process response: 0.8237 → 0.8194 ms (-0.53%).
- Construct prompt: 0.4106 → 0.3870 ms (-5.75%).

These small pipeline samples do not establish a broad speed improvement. Standard
prompt fixtures remain 15,291 / 19,213 characters with zero logged warnings. A single
synthetic omitted-mode pair adds six context characters for `warm (default)`
(519 → 525), or four for `not reported` (519 → 523); explicitly reported modes
retain their previous text. This reuses existing bounded pair selection and adds
no prompt section or model call. See `RELATIONSHIP_PIPELINE.json`.

## Limits and review decisions

- Positive-reason and event recognition uses conservative **English lexical cues**,
  not semantic analysis. Sarcasm, nuanced or non-English explanations and events
  using only nicknames can be missed. Mixed negative/positive and negated reasons
  are suppressed conservatively. Unknown custom standing terms show `not reported`
  unless kin is known; their ladder steps still work in the advisory checker.
- Previously explicit `stranger` cannot safely be reclassified as an omission.
- Source reports and under-reply reported Internal States are not rewritten to
  insert default modes. Default evidence changes only read-time projection/context.
- An advisory cannot independently prove an event or correct model mistakes.
- No live Lumiverse instance, Android WebView, provider/model test or live save/load
  was available. Browser bridge and JSON reload tests are synthetic verification.
