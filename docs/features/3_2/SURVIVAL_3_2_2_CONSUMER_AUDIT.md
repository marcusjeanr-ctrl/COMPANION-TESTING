# 3.2.2 — Consumer placement audit and test-contract STOP

Audited source: candidate `11db330`, branch `fix/survival-flag-evidence`, draft
PR #35. This follow-up changes documentation only. No runtime/test/gate change,
new benchmark, merge, tag change or later-part work was performed.

## Complete action-flag inventory

A repository-wide search for each flag name, the four-name lists, `survival`,
computed-key access and their callers finds **two runtime interpreters** of saved
story action booleans. References below are to candidate `11db330`.

| Path | Function / location | Role |
| --- | --- | --- |
| `dist/backend.js:3962`–3966 | `statesPanelHtml` | Reads `d.survival` and filters the four boolean keys for the under-response “This reply” row. |
| `dist/backend.js:11826`–11828 | `hmsSurvival` | Reads each timeline report's four flags to produce story clock events. |
| `dist/backend.js:11838`–11860 | `hmsSurvival`, downstream | Consumes event kinds, not saved booleans, to reset sleep/meal/drink and apply rest credit. |
| `dist/backend.js:11871` onward; caller at 3166 | `hmsSurvivalReminder` | Model hint consumes derived elapsed tracks/stages and mind; no raw flag access. |
| `dist/backend.js:2075` onward | `survivalFlagReading` | Evidence helper reads the four claims plus `unconfirmed`. It is currently installed in both generic `getSwipeData` return paths and in acceptance storage. |
| `dist/backend.js:10216` | `parseCompanion` | Input parser normalizes the four reported booleans; not an application/display consumer. |
| `dist/backend.js:10485`, 10548 | `buildCompanionInstructionRead` | Produces schema example and survival instructions; does not read historical flags. |
| `dist/backend.js:15823`–15825 | `youReadings` | Bulk copies the survival object, including the flags, without interpreting them. Its sole caller `hmsYouPanelRead` uses mood/stress/sanity/XP and carried objects, not these flags. |
| `dist/backend.js:13124`, 16442 | Gear and spell/story folds | Use got/lost and spell/study/ability fields respectively; do not read the action booleans. |
| `dist/backend.js:12048` | `hmsSurvivalLog` | Creates manual action events; these must always count. |
| `dist/frontend.js:3984`–4017 | `renderSurvival` | Displays derived tracks; the four buttons create manual log requests. No saved-flag reads. |
| `dist/frontend.js:1327` onward | `characterSheetMarkdown` | Exports selected HUD/abilities/spells/techniques/Agenda/Gear/family/quest/relationship fields; no survival action booleans. Preset export exports settings. |

`getSwipeData` has 51 textual occurrences including its declaration (50 call
expressions). Its generic callers and the states caches can carry the report
object, but do not introduce another action-flag interpreter. Continuation and
snapshot paths may copy stored reports; they do not independently interpret these
four booleans. No frontend action-flag field reader, study consumer or additional
model-hint consumer was found.

The placement review is correct: filtering at the clock and under-response
display boundaries can retain old-chat correctness while avoiding work for
unrelated generic readers. `statesFill`/`statesReading` currently cache the report
without its source message, and `statesPanelHtml` receives `{d, prevRel}`. The
relocation therefore also needs source provenance passed/cached at the display
boundary, rather than assuming `statesPanelHtml` already has the reply prose.

## Unchanged-test conflict reproduced before code changes

The master's rule remains: “No existing test may be changed or weakened. If a fix
contradicts an existing test, STOP on that fix and report it.” The latest request
also requires all existing tests to pass unchanged.

Two existing tests bind the expected filtering to the generic getter itself:

- `tools/test_survival_flag_evidence.cjs:9` defines `read(m)` as
  `getSwipeData(m).survival`; its line 12/18 assertions require an unsaved raw
  `ate:true` to read as false when the prose only describes speaking.
- `tools/test_survival_evidence_cache.cjs:12` directly asserts that
  `getSwipeData(m).survival.ate` becomes false after an equal-length edit to
  “Marcus ran.” Other assertions in that file require the same getter behavior
  for replacement ids, swipes and private reply 2.

A temporary source copy outside the repo replaced only the two
`return survivalFlagReading(...)` expressions in `getSwipeData` with the original
raw returns. The unchanged first test fails at lines 12/18 with
`AssertionError: You speak to the instructor in the study. true !== false`.
These assertions execute before any clock or row-rendering consumer. Correct
filtering at either downstream consumer cannot make a direct getter assertion
pass. This is a test entry-point conflict, **not** an inability to preserve
read-time correction for old chats.

Required test-boundary adjustment, not applied: use the evidence helper/real
clock and rendered row for the same accuracy, raw-preservation and invalidation
assertions; assert that the generic getter preserves raw reported values. Keep
all positive/negative fixtures, manual-log checks and exact expected outcomes.
Changing that entry point requires relaxing the unchanged-test-file restriction;
no test was edited, intercepted, special-cased or weakened to conceal the conflict.

## STOP and measurement status

Step 2 stopped before runtime changes under the explicit test-conflict rule.
Steps 3 (combat-vs-rest wording) and 4 (re-save/reconfirmation regression) have
not been applied. No signed-cache implementation or new gate result is claimed.

The last measured candidate remains `11db330`: 2,000-message warm wall
**134.23 → 145.12 ms (+8.12%)**, CPU **188.81 → 211.47 ms (+12.00%)**,
**INCONCLUSIVE**, from 20 alternating pairs per case. All recorded samples and
IQRs remain in `SURVIVAL_3_2_2_STEP3_GATE.json` and its raw archive. No unchanged
candidate was rerun to seek a different result. The prior candidate's tests and
CI pass; this temporary counterfactual failure is separate from those results.

Main is still 3.2.1 at `01c3df9`. PR #35 stays draft/blocked. No 3.2.3 or 3.2.4
work started. No live Lumiverse testing was performed.
