# Cached narrator references across lore categories

**Release preparation:** included in 3.0.4 RC under PR #17. The investigation
below records implementation checkpoint `2a43789`, before the release version
change. Its hashes and measurements remain historical evidence; published package
checksums identify the release artifact.

Issue: [#16](https://github.com/marcusjeanr-ctrl/COMPANION-TESTING/issues/16).
Baseline: published 3.0.3 RC, `f15a942e7945c527d87227ee7115f48bb14e18d6`.
Candidate backend SHA-256:
`90bb547858e6f10f2b6883f3ff31edaab70c7802535de5af69900fddd6e9ff58`.
This is an unreleased feature branch. Version, UI, settings, cards and stored
tracking formats are unchanged; the original Companion repository is untouched.

## Confirmed gap and implementation

`narratorSpellGrounding` supplements magic references before ordinary narration.
General `buildLoreBlock` supplies side calls, not ordinary narration. This does
not mean the host failed to activate general lore: it means the additional cached
reference safeguard previously had no equivalent outside the spell catalogue.
The initial synthetic test run failed all 13 groups on the baseline, including
the actual interceptor receiving no general reference block.

`narratorLoreGrounding` now selects existing cached entries of any category using
the existing `loreEntryHits` matcher. It reads only the last three message slots,
filters hidden messages, bounds user text to 6,000 characters and previous visible
prose to 4,000 characters, and excludes HUD carriers, reasoning and Companion
report blocks from that prose. It does not scan the whole history or hydrate books.

User-request matches outrank previous-scene matches; specifically named literal
keys outrank broad keys before original order/priority tie breakers. A full-card
probe caught a broad `Gold` match crowding out the requested coin and technique;
specificity ordering fixes this case without semantic/fuzzy retrieval or another
model call. Regex, case, whole-word and all four selective logic modes retain the
existing matcher's behavior. Disabled entries are excluded during normalization.

Whole literal definitions are reused from non-history system messages, and exact
duplicate definitions are emitted once. Existing spell grounding runs first;
its selected source entries are not injected again as general references. Both
paths share the existing configured maximum of 6,000 added characters, including
their separator. General grounding adds at most the configured entry count,
hard-capped at 20. Entries too large for the remaining space are omitted in full;
smaller remaining entries can still fit. No-match turns receive no general policy
block. Repeated selections use a bounded, per-chat cache invalidated by a changed
request, scene or normalized pool snapshot.

The reference policy distinguishes definitions from player knowledge, ownership,
proficiency, current events and established facts, and explicitly preserves agency,
chronology, card conditions and NPC private information. It changes supplied
context, not narrator output after generation and not stored tracking data.

## Host activation boundaries

The supplemental matcher is not a second world-info activation engine. Entries
with known probability restrictions, sticky/cooldown/delay controls, recursion
delay, vector activation, group/group_name competition, automation, explicit scan
depth, greeting exclusions, generation triggers, character filters, non-system
roles or custom placement/outlet markers remain host-only. Both root host DTO
fields and card extension fields are recognized; the normalized flag survives
pool round trips. Host interception fields were cross-checked against
[Lumiverse's DTO](https://github.com/prolix-oc/Lumiverse/blob/main/src/spindle/world-info-interceptor.ts).
No activation state or host budget is changed. This is a bounded supplemental
reference budget, not a reproduction of every host/global activation setting.

All categories can participate; not every entry is eligible on every turn. Entries
without matching keys, unavailable caches, oversized definitions and advanced
activation gates remain limitations. Quiet, impersonation and append-continuation
generation passes are skipped. Normal turns in restored continuation chats use
the same path once the existing lore cache is available. No special card names
or Mushoku-specific rules are built into selection.

## Verification

- `node tools/check_release.cjs`: existing 3.0.3 identity remains consistent.
- `node tools/run_tests.cjs`: 45 suites and both bundle syntax checks pass.
- New `test_narrator_lore_grounding.cjs`: 18 groups, including actual interceptor
  injection, synthetic techniques/NPCs/locations/items/organizations/rules,
  exact technique and currency definitions from both complete Mushoku fixtures,
  matching/gating boundaries, cross-chat/cache changes, hidden/private text,
  idempotence, whole-entry budgets, spell priority and no tracking grants.
- Existing spell grounding: all 15 groups pass. Its character accounting now
  measures the spell segment separately from the additional general segment.
- Browser UI: 23 tests pass. Visibility: all five pass in an isolated rerun.
  One 100 ms visibility expectation initially failed while the full regression
  workload was running concurrently; frontend files were unchanged. No visibility
  assertion was weakened or implementation changed to hide that timing failure.
- Helper spies reject model, world-book, chat-fetch and storage calls. The full
  interceptor benchmark retains one existing `chat.getMessages` call per pass
  and adds no host/model/storage calls. No provider inference was tested.

## Measured cost

Node 22 in this cloud instance, full Six-Sided/Living fixtures, actual normal
interceptor with mock host. Three final paired rounds alternate baseline/candidate
order, without simultaneous regression/browser workloads. Each case measures a
first/cold call, five warmups, 30 repeated-request samples and ten changed-request
samples. Below are medians of round medians, in milliseconds. Changed requests
miss the selection cache and more closely represent changing user turns. The mock
host deliberately omits general lore, so prompt increases are not a prediction of
normal host activation or token bills.

| Card / request | Repeated before → after | Changed before → after | Added general characters |
| --- | --- | --- | ---: |
| Six-Sided / ordinary | 8.40 → 8.44 | 8.53 → 26.21 | 1,100 |
| Six-Sided / named spell | 10.23 → 10.76 | 10.50 → 24.50 | 1,100 |
| Six-Sided / spell list | 9.05 → 11.67 | 8.81 → 28.10 | 1,100 |
| Six-Sided / host spell index | 8.77 → 11.66 | 8.30 → 26.88 | 1,100 |
| Six-Sided / technique + currency | 7.27 → 8.85 | 7.18 → 24.74 | 5,954 |
| Six-Sided / spell + currency | 8.98 → 12.04 | 9.18 → 25.66 | 4,887 |
| Living / ordinary | 4.51 → 5.66 | 5.00 → 25.73 | 0 |
| Living / named spell | 8.07 → 9.45 | 7.78 → 25.93 | 0 |
| Living / spell list | 7.36 → 9.72 | 7.06 → 26.77 | 0 |
| Living / host spell index | 7.90 → 8.05 | 7.70 → 23.21 | 0 |
| Living / technique + currency | 5.87 → 6.09 | 5.49 → 22.55 | 4,109 |
| Living / spell + currency | 7.19 → 6.85 | 6.64 → 27.68 | 2,237 |

General technique/currency cold-call medians: Six-Sided 44.98 → 77.54 ms;
Living 98.18 → 120.47 ms. Changing-request overhead is approximately 14–21 ms
on these cards; repeated-request medians vary by roughly -0.34 to +3.06 ms.
The previous Six-Sided training scene accounts for its ordinary-turn lore match.
No claim of zero CPU overhead or faster model generation is made. References can
increase input tokens on previously ungrounded turns; characters are not tokens.
No model latency, price, Android responsiveness or live narrator obedience was
measured, and this does not resolve the separate long-campaign panel benchmark.

Reproduce against an extracted baseline backend using:

```sh
node tools/benchmark_narrator_spell_grounding.cjs /tmp/baseline-backend.js dist/backend.js
```

Live acceptance should check relevant non-spell definitions in Lumiverse's
resolved prompt, current pool capture, host activation exclusions, private
information boundaries and real model behavior on both cards and another world.
Passing fixtures alone does not establish universal compatibility or obedience.
