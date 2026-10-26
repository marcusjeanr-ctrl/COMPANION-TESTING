# RPG Companion 2.9.7 RC: Agenda/Quest identity follow-up

Based on the supplied 19-message chat export, confirmed repeated Agenda records for Seraphina's mana measurement and afternoon sword drills, including additional description and conditions, plus a spellbook selection time refined from 'before half past eight' to 'now'.

## Code changes
- Existing Agenda matcher now checks an anchored activity title before optional appended details, while retaining actor/location/day compatibility.
- A 'now' report on the same day can refine an existing before/by/until deadline instead of spawning another copy.
- Quests keep the existing context-guarded matching, because 'Roa Bargain' (sword-cut condition), 'Roa Visit' (permission and letter), 'Roa Journey' (permission and preparation), and 'Friendship with the Boy Genius' (meeting someone) have distinct action requirements. Similar titles alone cannot justify merging them.
- NPC agendas and historical completed states remain separate and unchanged.

## Historical comparison
Perch 2.0/2.1 had quest details but not current Agenda identity; 2.8.1, 2.8.2, and 2.9.0 contained earlier Agenda readers; 2.9.3 added context-sensitive objective identity and schedule compatibility. Preserve these later safeguards instead of importing weaker legacy matching.

## Validation
19 automated suites and 2 JavaScript syntax checks passed. The supplied chat export replay resolved 5 scheduled Agenda entries while retaining 5 quest records. No extra API calls, tracker invocations, polling or background scans. Existing stored readings are not rewritten.
Live Lumiverse validation remains outstanding.
