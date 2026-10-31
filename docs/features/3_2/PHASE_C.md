# Selected dossier history and deferred model attribution

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

## 14. Model report card — deferred

No generating-model attribution is present in the existing panel message payload
or available saved-message fixtures. The SDK connection model identifies the
current connection, not necessarily the generator of an earlier narrator reply;
Separate tracker and narrator connections can differ. A score by connection would
therefore misattribute results. Per the task’s explicit condition, no model report
card is implemented and no provenance is invented. Live saved-message provenance
is required before adding this view. No runtime or metadata change for this item.


Selected-candidate acceptance and measurements are recorded in REPORT.md.
