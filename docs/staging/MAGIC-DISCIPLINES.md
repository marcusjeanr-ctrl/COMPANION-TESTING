# Magic disciplines shown as spells: investigation

Branch `experiment/magic-discipline-classification` from `bf80da9`. Not merged anywhere.

## Finding
- The reporter (the model) put disciplines in `survival.spells` in 7 replies of export 5: "Water Magic", "Earth Magic",
  "Fire Magic" (replies 10–64) and, in reply 78, the bare "Water", "Earth", "Fire". The request already says
  "no school/style ranks"; the model still does it.
- `resolve.records` (spell name normalisation in `dist/backend.js`) rejected "<School> Magic" (it needs the word
  Magic/School or a rank in brackets) but accepted a bare school name, so reply 78 made Water, Earth and Fire
  "known". Nothing else was at fault: the fold, the spellbook state and the panel only showed what was accepted.
- Not a loop: the known-spell list is not sent back to the model.
- Scope: any card whose spell references file spells by school can be hit the same way (fantasy elements,
  schools of magic, disciplines). Cards without spell references were not affected and are not changed.

## Fix
One condition in `resolve.records`: a bare label that is a school of this chat's spell catalog (and not itself an
exact spell name, which returns earlier) is not a spell. Hand-marked spells (`spellbookAdd(..., 'you')`) bypass it.

## Verification
- `tools/test_tracking_audit.cjs`: three new checks built on the real report (names only):
  disciplines stay out while Squall, Earth Pillar, Stone Cannon, Earth Wall stay in and Heat Hand stays mastered;
  a spell named "Fire" (school Black) and a spell named after its own school are kept; no references → nothing
  filtered. Two of them fail on the unfixed backend.
- Export 5 with the card: Spellbook 19 → 16 (Water, Earth, Fire gone); Heat Hand mastered; Earth Wall known.
- Old vs new backend over export 5 (41 replies) and export 1 (29 replies): only the Magic card differs, at 2 replies
  of export 5; every other part of the panel and every narrator request identical.
- `run_tests.cjs`, `replay_check.cjs` pass.

## Not verified
- Other HMS cards (Re:Zero, Overlord, COTE…) and non-HMS magic systems: covered only by the synthetic checks above.
