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

## 5. Previously on recap

Frontend-only: pure `recapData` and a dismissible card reuse current HUD, plot,
active quests/objectives/manual objectives and cached Chronicle highlights. Missing
identity/data produces no recap. The existing GENERATION_ENDED handler marks local
reply IDs; no new listener, timer, polling or model request is added. Unknown event
IDs bind to the next changed pushed reply rather than the stale request response.
Dismissal is local UI state, retained across refreshes for the same chat/reply.
Session caches are bounded (80 chats / 64 IDs each); restoring an older reply beyond
that window may conservatively show a recap again. At most 8 quests/objectives,
6 threads and 4 highlights are shown. No new source facts or messages are written.

Files: frontend, shared view tests, one Chromium test and four dictionary updates.
Tests cover fresh/generated, resumed, dismissal/no reappearance, empty data and
immutable input. Feature off returns before assembling the view. No backend/prompt
change; phase-level performance and full checks follow item 9.

## 6. Quieter Chronicle

Frontend-only Highlights filter includes explicit fight/encounter kinds, milestones,
plot/quest entries, stars and high-importance/fight-worded moments. The wording
fallback is conservative English; no gameplay outcome is inferred. All remains the
default, unchanged apart from Phase A deduplication. Consecutive same-pair/same-day
bond entries fold only in the Bonds filter so All stays intact. Expand lazily
reveals original per-entry controls and source IDs; open state survives refresh.
Unknown dates/pairs and different loops/days remain separate. The shared optional
Quieter Chronicle setting restores the old filters/Bonds view when off.

Files: frontend, shared pure tests, Chromium test and four dictionaries. Tests cover
filter membership, folding and negative pair/day cases, empty input, immutability,
All preservation, lazy expand and original entries. No backend or prompt changes.

## 7. Appointment countdown

Frontend-only rendering reuses the Agenda engine's authoritative `dueIn` at the
latest HUD clock; optional absolute dueAt/clock input is also supported. There is
no duplicate calendar parser or tick. The pinned compact summary shows the nearest
future appointment (or most recent overdue one if none future); the Agenda shows
past-due labels without marking it missed or changing stored status. Missing or
unsupported precision keeps the original wording. In-progress/completed states
retain their existing labels. The display has its own on/off setting.

Shared tests cover missing/past/now times, midnight, K-year rollover, 12×30 month
boundaries and another world's explicit relative tomorrow timing via the existing
clock resolver. Unsupported absolute formats are not interpreted as invented dates.
Chromium checks pinned/Agenda output, 40 minutes, overdue and missing due data.
Files: frontend, shared tests, Chromium case and four dictionaries. No backend,
prompt, source-report or processing-frequency changes; phase benchmarks follow.

## 8. Quest chains

Frontend-only advisory links connect a unique completed predecessor to a new
separate quest when an explicit reference names it, or when the same giver and
meaningful objective/reward overlap support the relationship. Currency amounts
alone, ambiguous predecessors, future observations and live predecessors do not
link. Both quest IDs, objectives, rewards, stages and completion states stay intact;
no completion, merge or dependency rule is introduced. Links render only when the
Quests panel is open and the setting is enabled; the old Journal can show a link
when its source key/name is unambiguous.

Files: frontend, shared pure tests, Chromium opt-out test and four dictionaries.
Tests cover unique overlap, explicit references, two unrelated same-giver tasks,
ambiguous candidates, completed-only boundaries, immutability, reciprocal labels
and zero quest-control writes. Heuristic links are display suggestions, not proof
of a card-defined quest dependency. No backend or prompt change.
