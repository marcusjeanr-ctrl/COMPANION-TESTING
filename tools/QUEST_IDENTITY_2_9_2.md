# 2.9.2 — conservative quest objective identity

Small follow-up to 2.9.1 (`0220b32f595692c768d8f7e9be131744d207377f`). No card, character, destination, world or scene names are hardcoded into the matcher.

## Confirmed cause and change

The previous renamed-quest matcher required an exactly identical objective string and both matching giver and place. It missed simple wording changes and records omitting a giver. Separately, multiple HUD labels could re-create a duplicate after story records had already been reconciled.

The existing matcher now compares conservative objective signatures, with shared giver or compatible place as independent context. It recognizes articles, a few unambiguous action variants (repair/fix, find/locate) and permission wording, including possessive vs “permission from” and trip phrasing. Conflicting givers or unrelated places still reject a match. Parent/child place descriptions can agree, but a broad later label does not overwrite a known specific place and bridge two different locations.

Actors, directions, numbers, negation, temporal qualifiers and extra clauses remain significant. A shared title prefix, destination, prerequisite or storyline is insufficient. Ambiguous candidates remain separate. Same established quest names retain their existing identity/update behavior.

When an unambiguous record is renamed, up to 40 historical names are retained in the derived reading only. This lets an old HUD label attach to the same objective instead of creating another row. A small current-quest-array fold removes aliases after attachment; conflicting completion classes stay separate. No message metadata or saved records are migrated, deleted or rewritten. Explicit reported progress survives; unknown partial values do not overwrite existing fields.

For the supplied screenshot, making an unreadable sword cut is a distinct prerequisite. Obtaining permission, collecting a letter, preparing for travel and meeting someone can also be distinct objectives. The patch deliberately does not collapse all of them into one quest merely because they belong to the same journey. It removes equivalent-goal aliases when the objective and context justify that identity.

## Tests and performance

`node tools/test_quest_identity_2_9_2.cjs` covers seven groups: equivalent permission wording/missing giver, unrelated-card goals/place granularity, separate storyline objectives, actors/directions/negation/quantities/extra steps, conflicting context, ambiguous and non-transitive matches, and integrated HUD alias deduplication. Three of those groups failed against untouched 2.9.1; the other four document distinctions that must remain preserved. All seven pass after correction.

`node tools/run_tests.cjs` passes 13 scoped suites and both bundle syntax checks. Earlier inherited HUD/Save limitations remain as documented in `TRACKING_AUDIT_2_9_1.md`; this quest-only patch does not claim to fix them. The existing historical helper snapshot `tracking_2_9_0_helpers.js` describes the 2.9.1 implementation; the new quest identity source is `quest_identity_2_9_2.js`, and the tested runtime is `dist/backend.js`.

No AI calls, report fields, instructions, token budgets, automatic refreshes or storage writes were added. Signatures use the existing bounded read-pass memo (maximum 512 entries). Work stays in the existing bounded quest fold and small current quest list, with no additional chat scan. See `BENCHMARK_2_9_2.json`, `PERFORMANCE_2_9_2.md` and `OPERATIONS_2_9_2.jsonl` for the repeated timing and call-count comparison against 2.9.1. Exact provider tokens and live host rendering were not measured.

After updating the existing extension, reload Lumiverse and use local Read. Equivalent stored reports are reconciled on read, so a new RP chat is not required. Broader semantic paraphrases without enough evidence intentionally remain separate; this is a lightweight identity rule, not an additional semantic-verification model.
