# Phase B — play-focused features

Phase-start main is frozen at `e07830acbfe3e7a9d84185d7d19b067d247d39b1`.
Phase A passes the revised gate; historical wall-only failures remain archived.
No live Lumiverse testing, main merge or release is performed.

## 4. NPC dossier

Files: frontend runtime; shared pure-view regressions `tools/test_play_tools.cjs`;
registration in the standard runner; Chromium test; four dictionaries/embedded i18n.
A unique known NPC/short alias opens one lazy read-only popup from People, Family,
Minds, Agenda participant names and Chronicle name chips. Standing/bond, mood,
current mind, source-qualified location/time, player-related accepted knowledge,
next known appointment/routine and cached Chronicle entries are reused. Missing
sections stay absent and unknown/ambiguous names do not create records. No fetch,
model call, state write, timer or history traversal is added. Recent Chronicle may
be empty until its existing cache has loaded; no background request is introduced.

Tests cover full and individually missing sections, sparse/unknown/ambiguous names,
knowledge ownership and immutable inputs. Chromium checks lazy open/close, zero
edit requests, opt-out, 320px and floating light-theme layout. Explicit profile
labels are translated in all four dictionaries. Legacy character-name editing is
available with the dossier feature off; Chronicle filtering remains available via
Show timeline in the popup. These UI decisions are called out for review.

Performance is recorded at the Phase B gate; this feature changes no backend code
or prompt content. No separate per-item speed improvement is claimed.
