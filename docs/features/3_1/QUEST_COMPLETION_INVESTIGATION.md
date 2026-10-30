# Quest completion investigation — no runtime fix

Reproduction: `node tools/test_quest_completion_investigation.cjs`.
Optional private replay: set `COMPANION_QUEST_COMPLETION_EXPORT` to the original
supplied export. No private messages are committed or printed by this test.

## Confirmed behaviour

1. `continuityReadIndex` only indexes a report for Quest lifecycle work when it
   has Quest rows or its `plot.now` includes dismissed/concluded/completed/
   finished/ended/failed/succeeded. A visible explicit named completion can be
   ignored if the tracker omitted the Quest and summarized a subsequent activity.
2. `questDetailsLatest` applies the same `plot.now` keyword gate before invoking
   `questSceneLifecycle`. "Marcus has beaten Cassian" does not satisfy that gate.
3. `questSceneLifecycle` accepts explicit uniquely named completion, but its
   automatic scene-ending fallback requires `final exchange`, `last chance`,
   `last attempt` or `last exchange` in the accepted objective, a present giver
   and compatible location. Generic "Beat Cassian or force him to acknowledge
   equality" remains active even with an explicit ended sparring session.
4. Explicit reported `state:completed` and named completion with a qualifying
   `plot.now` both work. Ending a scene alone is deliberately NOT proof of success.

Synthetic tests reproduce all three conservative gates and the working explicit
completion paths. The supplied 23-message replay yields one active Quest and
`finalPlotEntersSceneClosure:false`. Its final promise is conditional on sustained
performance, so retiring the entire reward-bearing assignment automatically
would be unsafe; a completed scene objective and a still-open broader commitment
must not be treated as the same thing.

## Proposed targeted follow-up, subject to review

Allow source-verified, explicit uniquely named lifecycle evidence to reach the
existing outcome check even when `plot.now` lacks a closing keyword. For generic
scene goals, require separately confirmed scope and an exact success/failure
condition before ending that objective. Preserve the broader assignment/stage,
reward promises and future commitments. Never award rewards from closure.

Risk: closing broader quests on ordinary spar endings; mistaking NPC actions,
quoted/hypothetical outcomes or a partial success for goal completion; replaying a
terminal state across an edited reply/swipe. Required tests: actual-source replay,
Together/Separate refreshes, partial/ambiguous victories, missing giver, different
locations/opponents, closed-versus-completed, future stages, explicit reopening,
manual focus, saved-data reload and no extra calls/history traversals.

**No Quest normalization, identity, reconciliation or lifecycle function was
changed.** All 60 existing Quest/Agenda/Family helper functions compare unchanged
to the 3.0.10 baseline in the final scope audit. Real narrator re-extraction and
live Lumiverse verification were not performed.
