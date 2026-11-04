"""Builds the versioned HMS 1.2 test copy of the Six-Sided World card from the card file you have.

Four HUD-contract clarifications, evidence from live play (see docs/release/1.2.0-INTEGRATION-REPORT.md).
Lore, lorebook entries, mechanics and Strict Agency are untouched; the copy is renamed so importing it
never replaces the card your campaign uses.

  python3 tools/ecosystem/make_card_test_copy.py "<Six-Sided World card>.json" <out.json>
"""
import json, sys

EDITS = [
    ("- Reaching the count makes the rank possible;",
     "- The count carries forward: [done] is the last HUD's number plus this turn's sessions, never restated from memory. After a time skip it is the old number plus every session inside the skip (1.5 + 24 × 1.5 = 37.5).\n- Reaching the count makes the rank possible;"),
    ("- Wounds: Raw (untreated, worsens with use)",
     "- A bruise, welt, strain or scrape the story shows (training, a fall, a blow) is a minor wound and goes on the line: \"Left forearm bruise — Raw\".\n- Wounds: Raw (untreated, worsens with use)"),
    ("— the other people physically in the scene (the player's character is the HUD itself), at most 6, updated as they come and go.",
     "— the other people physically in the scene (the player's character is the HUD itself), at most 6, updated as they come and go. Someone only seen from afar or heard from another room is not Present. Creatures and groups go in brackets, with no age: \"[Acid Wolves: 3]\"."),
    ("- Freezing ages → every age is recomputed from birth year and HUD date.",
     "- Freezing ages → every age is recomputed from birth year and HUD date.\n- Restating a counter → Training is the last HUD's sessions plus this turn's; a time skip adds every session inside it."),
]

def main(src, out):
    card = json.load(open(src, encoding='utf-8'))
    d = card.get('data', card)
    desc = d['description']
    for old, new in EDITS:
        if desc.count(old) != 1:
            sys.exit(f'card text not found exactly once (card changed?): {old[:60]}')
        desc = desc.replace(old, new)
    d['description'] = desc
    d['name'] = d['name'] + ' (HMS 1.2 test)'
    d['character_version'] = (d.get('character_version') or '1.1') + '-hms1'
    d['creator_notes'] = (d.get('creator_notes') or '') + '\n\n[HMS 1.2 test copy] Four HUD-contract clarifications for RPG Companion HMS 1.2 (Training counts carry forward, minor wounds on Condition, who is Present, brackets for creatures and groups). Lore, mechanics and Strict Agency unchanged.'
    json.dump(card, open(out, 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'wrote {out}: {len(EDITS)} clarifications, lorebook untouched')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
