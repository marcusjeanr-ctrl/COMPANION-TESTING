# Martial export and reliability — investigation only

No ability classifier, learning rule, confidence guard, tracker prompt or saved
metadata was changed for this item. Reproduction:
`node tools/test_martial_investigation.cjs`.

## A. Is omission deliberate?

There is **no deliberate Martial-group or technique-name exclusion** in
`dist/frontend.js:characterSheetMarkdown`. Every accepted row supplied through
`hms.systems.abilities` is exported, including its state. A fixture containing
Sword God countercut, Diagonal Step/Counter and Touki exports all three. The
label-format defect in item 1 is separate and is fixed.

Two existing distinctions ARE deliberate:

- The **Known techniques** catalogue subsection exports only `known`/`mastered`.
  A `study`/attempt/training reference is not claimed as known. Adding a separate
  training section would be an export enhancement, not a learning-engine fix.
- `dist/backend.js:martialAbilityItems` omits a separate bare Touki learned row
  because its current Active/Inactive state belongs to the HUD. The sheet's HUD
  summary retains it. If the configured Abilities vocabulary exposes Touki there,
  item 1 also preserves that label. It is not granted as a permanent learned spell.

### Available real-export evidence

The previously supplied 23-message export contains these raw assessment records
(positions are zero-based). Metadata provenance is valid; assessment-quote
matching is a separate check.

| Position | Raw assessment | State | Exact source-quote accepted? |
|---|---|---|---|
| 10 | Touki (Battle Aura) | practiced | Yes |
| 14 | Diagonal Step/Counter | practiced | No |
| 18 | Sword God countercut | reliable | No |
| 20 | Touki (Battle Aura) | reliable | No |
| 22 | Sword God Countercut | reliable | No |

The rejected evidence does not match the selected response even case-insensitively.
`abilityEvidenceRows` requires a whitespace-normalized exact quote. These raw
records therefore cannot be treated as accepted player knowledge merely because
they are stored in metadata. Touki's separate historical practice row is accepted
but intentionally represented by the current HUD rather than another learned row.
With the available export/default empty lore cache, countercut/diagonal rows are
absent from the derived Abilities projection and sheet; this is not a serializer-
only disappearance. No private chat text or export file is committed.

A separate **fallback-classification gap** is reproduced without loaded references:
`spellResolver(...).domain('Sword God countercut')` and
`domain('Diagonal Step/Counter')` return `magic`; bare Touki returns `martial`.
The fallback recognizes some sword cuts/steps but not these compound names.
Loaded canonical technique references can change routing. No current live lore
cache or paired current panel/download was supplied, so the empty-cache result
is not claimed to prove the live card's routing. This gap is reported, not fixed.

## B. Why can one strike be Reliable?

The value is supplied by the **existing tracker JSON**, whose ability schema
permits `reliable`. There is no local strike-count rule promoting it.

Path in `dist/backend.js`:

1. `abilityEvidenceNormalize` accepts owner `you`, a supported state, a boolean
   historical flag, a name and a bounded evidence quote.
2. `abilityEvidenceRows` requires that quote in the selected response and rejects
   observation/NPC demonstrations, denied learning and attempts/practice/failure
   cues. Mastered additionally requires explicit mastery language.
3. There is **no corresponding explicit-reliability-language/history requirement**.
   Thus a reported reliable assessment backed by the synthetic exact quote
   “You deliver one clean countercut.” remains reliable.
4. `spellStoryFoldUncached` puts `known`, `reliable` and `mastered` assessments into
   its `learned`/known collection. This fixture has `newlyLearned:false` and is NOT
   in the mastery map. `martialAbilityItems` maps a verified reliable state to its
   Reliable display label when routing identifies the ability as martial.

The 3.0.3 change removed the narrator's one-clean-execution learning reminder and
strengthened failed-practice/demonstration guards. **It should prevent new learning
being inferred solely from one clean execution, but it does not currently reject
this separate unsupported reliable-assessment path.** This is a confirmed
synthetic confidence-validation gap, not proof that mastery was awarded or that
the available export's rejected countercut assessment was accepted. A single
execution can also demonstrate previously established skill; no arbitrary required
number of strikes should be invented as a fix.

Tests also show failed attempts and NPC demonstrations downgrade the same claim
to unverified, and a nonmatching quote is excluded entirely. No model/provider
was invoked and no metadata was written.

## Proposed follow-up; not implemented

- Keep unsupported newly reported reliability separate from earned knowledge;
  require appropriate explicit source/history evidence while preserving established
  skills, manual corrections, historical knowledge and card-specific progression.
- Improve evidence/reference-based routing of unlisted physical maneuvers without
  misclassifying genuinely magical/custom abilities or weakening source validation.
- If desired, add an explicitly labelled training/attempt section to the sheet
  while preserving Known-only catalogue claims.

Risks/tests: already-known skills, legitimate new assessments, failed practice,
NPC ownership, exact versus paraphrased quotes, forgotten/relearned abilities,
manual choices, changed swipes/sources, missing lore, real spell names resembling
physical moves and both Mushoku cards. No fixed success-count mechanic, additional
model call, full-chat scan or destructive migration is proposed.

**Live Lumiverse, the actual current model output and the current live lore cache
have not been tested.**
