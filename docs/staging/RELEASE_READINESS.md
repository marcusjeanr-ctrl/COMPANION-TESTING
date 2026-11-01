# 3.5.0 release readiness (staging)

Status: **release candidate on staging, not ready for main** until the live checks below pass.

## Verified
| What | How |
| --- | --- |
| Release identity, syntax, tracking regressions, end-to-end smoke (backend payload → request injected once → frontend renders every card) | `node tools/run_tests.cjs` |
| 29-reply Six-Sided World session replayed reply by reply with the full card (1,296 lorebook entries): no duplicate Agenda/Quest/Gear records, the player never tracked as a second person, request injected once with no repeated lines, no repeated Chronicle moments; ~54 ms per reply, request ~5.7k tokens | `node tools/replay_check.cjs <export> Marcus <card>` |
| The replay check catches real defects: on 3.4.0 it reports the "Marcus Veyrath" split (Minds) and the duplicate duel (Chronicle) | `BACKEND=<3.4.0 backend.js> node tools/replay_check.cjs …` |
| Every view (Scene, You, People, Journey, All), the Now card by day and night, recap, relationship web, quest rings, Loose ends (synthetic conflict), Agenda place chips | Real Chromium rendering of the real panel with the export's payload, 340 / 420 / 860 px wide |
| Own window background: takes the drawer's colour, not the host body's | Chromium pop-up with a teal body and a dark drawer |

## Not verified (needs live Lumiverse)
- Installing/updating 3.5.0 through Spindle; settings and saved chat state surviving the update and reloads.
- Own window inside the real Lumiverse page (its stylesheets, zoom, the host's real drawer background).
- The view bar's sticky position inside Lumiverse's drawer scroller; the float panel enlarged to two columns.
- Mobile Lumiverse (compact mode) with the new views.
- Real generations on 3.5.0: whether the model follows "a moment already reported is not reported again".
- Other cards: Re:Zero, COTE, Overlord, non-HMS cards. Only Six-Sided World was replayed. Run the replay check on an export of each.
- Chat branching and swipes: the replay uses the active swipe of a linear export.

## Known limits (by design)
- Loose ends are hints: they can be wrong when the story's present-characters list omits someone for a turn. ✕ dismisses one per chat.
- The Chronicle duplicate filter is conservative: a repeat that adds information ("…after the Greyrat trip") stays.
- The "you're here" chip matches place words; a place the story names differently each time will show nothing rather than guess.

## Before merging to main
1. Install from `staging/3.5.0` in Lumiverse; open an existing Six-Sided chat; check drawer, own window and float.
2. Play 5–10 turns; confirm Agenda, Quests, Chronicle and the request (Lorebook context / status) look right.
3. Run `tools/replay_check.cjs` on that new export and on one export from another card.
4. Then bump the name from "staging" and merge.
