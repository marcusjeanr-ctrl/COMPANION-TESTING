# 3.2.3 — Quest reset investigation: STOP before implementation

Base: merged 3.2.2 RC `118d56c0050a41bcd083f8d76f04ad04864d8170`.
Branch `fix/accuracy-3-2-3` was created from that origin/main and pushed immediately.
This branch contains investigation documentation only: no runtime, prompt, test,
schema, identity, completion or version change. No 3.2.4 work has started.

## Step 1: existing behavior and why the export drops get through

The 3.0.5 release (`ab86321`, implementation `3f54009`) introduced the source-backed
stage fallback in `questDetailsLatest` / `questStageContinuation`, documented in
`docs/compatibility/3_0/AGENDA_QUEST_OCCURRENCE_FIX.md:54`–63. The doc explicitly
promises: “A legitimate progress reset to zero stays zero.” The current code
retains that behavior.

`questNormalize` clamps finite progress to 0–100 and preserves null as unknown.
It has no dedicated reset/restart field. It accepts known lifecycle states,
including the active-class spelling `reopened`; none of the conflicting examples
below uses that spelling. Stage history and `continuationEvidence.kind =
quest-stage` are **derived** continuity evidence, not reset markers carried by
an incoming report. They cannot silently be treated as a report reset field.

After identity matching, `questDetailsLatest` overlays every non-null/nonempty
reported field onto the matched derived row, including numeric zero. It does not
classify lower progress as legitimate versus illegitimate, check previous
activation, require a restart or take a maximum. The matching code does validate
identity/ownership/context; that validation is not a progress-reset policy.
Thus any accepted lower report can replace an earlier value on the same row.

The explicit stage fallback requires one active candidate, matching giver,
compatible place/category, a narrowly related title, no conflicting same-packet
old entry, and asserted source prose naming continuation plus stage/step/phase.
It rejects speculative, quoted, separate-assignment and ambiguous evidence. It
keeps the canonical key/aliases and records the old progress/objective/state/reward
in bounded stageHistory. It then accepts the new lower progress without a
completed→active transition or new canonical identity.

Both actual exports were replayed read-only through the current panel:

| Export | Reports for q_greyrat_meet | Latest panel value | Prodigy's Meeting |
| --- | --- | --- | --- |
| 39 messages | r30=80, r32=50, r34=50, r36=20, r38=0 | 0 | done, 100 |
| 37 messages | r30=80, r32=50, r34=50, r36=20 | 20 | done, 100 |

All listed Greyrat reports remain active with the same questId and no reset key.
The changed objectives replace earlier values through the ordinary overlay. The
proposed whole-quest ratchet would show 80 in both cases; that requirement makes
sense for this observed step re-rating. No private prose/export is committed and
neither export was modified.

## Protected reset cases and tests

These tests are already on main; none was changed:

- `tools/test_agenda_quest_continuity.cjs:87`–89, “Explicit quest stage
  continuation preserves key, reset, rewards and earlier stage evidence”. The
  same active assignment goes **20→0** through explicitly narrated continuation
  into its next stage. It must remain one canonical identity, retain its old
  20% stage record and expose current progress 0.
- The same file at line 109, “Unrelated card terminology and bounded stage
  evidence preserve one identity without schema migration”, requires the same
  zero reset for an orbital-lab relay moving into its next phase. This protects
  universal behavior beyond the Mushoku fixtures.
- `tools/test_export_identity_drift.cjs:76`–81, “Reliable changed quest conditions
  and legitimate progress resets supersede old detail”, requires **20→0** on
  one active assignment when the accepted source explicitly changes the
  condition. No restart field or inactive state is supplied.
- `tools/test_quest_contract_continuity.cjs:74`–82 protects explicitly referenced
  stages, completion and location changes. Its first progress is unknown, then
  zero, so that particular test alone is not proof of a positive→zero conflict.
  Its same-source refresh case at lines 131–138 also preserves a corrected zero;
  superseded reports within one source must not become invented historical gains.
- The 3.0.5 continuity suite also protects distinct same-packet quests,
  giver/place/category conflicts, completed history, ambiguous matches, and
  exclusion of inactive swipes, hidden/edited sources and continuation snapshots.
  These identity/provenance protections must remain intact under any future fix.

## Conflict with the requested allowed-reset list

A read-only replay of the exact 3.0.5 positive→zero stage case confirms:

- states are active→active;
- canonical key remains `doubled sparring sessions` and aliases preserve the rename;
- both `questDetailsLatest` and the actual panel expose **0**;
- stageHistory retains the earlier **20**;
- a maximum-since-activation policy limited to the three requested reset
  exceptions would instead expose **20**.

There is no inactive→active transition, new canonical quest identity or explicit
incoming reset marker. A renamed label is not a new quest: treating it as one
would contradict the identity/alias requirement. Existing source-confirmed stage
and changed-condition resets therefore conflict with the requested exclusive
reset policy.

Leaving a legacy helper at zero while displaying twenty would keep an assertion
green but change the protected behavior described by 3.0.5. This is not resolved
by a test-entry-point adjustment of the kind authorized for the PR-new survival
tests. These quest tests predate this branch and are already on main.

The master task explicitly requires STOP if a protected reset test contradicts
the ratchet. **Part 2 stops here, before code or instruction changes.** A reset-
policy decision is required: whether explicit source-confirmed stage/condition
resets remain an additional exception, or the old protection is intentionally
superseded. Neither decision was made silently. No test was changed or weakened.
The Minds instruction is pending with the stopped part; no partial 3.2.3 release
or version bump is claimed. Part 3 has not started.

## Verification and limits

The unchanged relevant suites pass: **26 continuity groups, 11 identity-drift
groups, 22 quest-contract groups**. Both real exports retain their bytes after
replay. No Part 2 implementation exists, so no new full-suite/browser/performance
acceptance result is claimed; rerunning the unchanged 3.2.2 backend cannot
establish acceptance of an unimplemented 3.2.3 ratchet.

Main remains verified 3.2.2 RC. Its post-merge validation/browser workflow passed.
No merge or tag change was performed by this investigation. No live Lumiverse
instance was used.
