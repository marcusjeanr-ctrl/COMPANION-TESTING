# Phase C — optional displays

Main at phase start: `e07830acbfe3e7a9d84185d7d19b067d247d39b1`.
Phase A/B pass the revised main-relative CPU/wall rule. No main merge or live
Lumiverse testing is performed. Full checks and the revised gate follow item 14.

## 10. What changed

Frontend-only change strip holds references to only the two most recent pushed
reply views for the active chat. Same-reply refreshes/swipes replace the current
view; they do not advance a transaction history. Chat changes reset the pair.
Location, gear, standing, appointments, quests and already-loaded Chronicle IDs
are compared only when the strip is opened. No raw reports are copied or written.
Unknown/unloaded modules do not imply deletions. Merely advancing the clock does
not count as rescheduling: known dueIn values are compared as absolute source-clock
moments. The closed summary is just What changed, preserving strict lazy rendering;
the expanded body is a compact line of changes. Feature off hides it.

Files: frontend, shared tests, Chromium case and four dictionaries. Tests cover
first snapshot, no change, multiple changes, normal countdown advancement, an old
Chronicle cache arriving late, and lazy expand. No backend/prompt change.

## 11. Open loops

A lazy read-only list uses current live/locked planted details, active stored secrets
and open/advanced plot threads. Paid-off/public/resolved entries are excluded only
when explicitly marked; outcomes are never inferred. The Phase A display matcher
is reused with source participant/chronology guards and separate types. Uncertain
or undated matches stay separate. Feature off hides it without extracting data.
Files: frontend helper/view, shared tests, Chromium case and four dictionaries.
Tests cover promised-detail grouping, paid-off/resolved exclusion, empty input,
immutable state and closed-view laziness. No backend, prompt or new request.

## 12. Per-NPC standing history

The dossier can show a bounded 12-point step chart from existing standing events
and the latest reported standing, using the configured ladder. It does not parse
bond-kind changes as standings or infer dates for undated observations. One known
standing is one point, not invented historical samples. Graph construction occurs
only in an open dossier with the feature enabled. Source events are never edited.
Files: frontend, shared tests, Chromium case and four dictionaries. Tests cover
stable/rising/falling/flip-flop, unknown data and point cap; real SVG fits 320px.
The chart's x-axis is observation order, not a fabricated precise time scale.
No backend, prompt or persistent-data change.
