# 3.0.2 RC follow-up: complete durable tracking history

The four retention failures reported in the initial readiness investigation are
fixed in the same `fix/six-sided-release-verification` branch / PR #14. Candidate
version remains **3.0.2 RC**, building on checkpoint
`9b31453d48d42d860ed41d6795c47f6527dd0ad8`; published `main` is still 3.0.1 RC
at `22aabf3`. The earlier grounding, classification, family/property and mastery
repairs are preserved. Original Companion and both character cards are untouched.
This follow-up does not publish or claim 100% live compatibility.

## Root causes and changes

All four readers inherited `relReadings`' 300-visible-assistant window. Absence
from later responses therefore removed old state from the derived panel, despite
raw reports remaining in the chat. Money additionally used a window-relative
ledger ordinal for hide/settle controls, so blindly widening the window could
attach a saved correction to the wrong transaction.

- **Equipment:** `gearReadUncached` now consumes relevant source-bound acquisition,
  loss and gear records from the existing `continuityReadIndex`. Container placement,
  explicit loss, latest HUD equipment and anchored manual edits retain their old
  precedence. `gearRead` shares its result within one read pass because Gear and
  Holdings both need it; consumer panels derive their own display objects.
- **Guilds/factions:** `factionRead` uses the same index for historical membership,
  rank, standing and bounty updates. New explicit facts, HUD fields and manual
  edits still apply normally; no membership is inferred from lorebook capabilities.
- **Quests:** `questDetailsLatest` reads indexed source-backed quest observations
  beyond the recent window. Existing identity/stage/reopening, progress-reset,
  deadline and completion rules remain in charge; this is not a new quest engine.
- **Money/debts:** `moneyRead` retains actual historical transactions, partial
  repayments and open debts. Current HUD balance still controls the displayed
  balance; totals do not fabricate a wallet from the lorebook. Pending/speculative
  transactions remain excluded without renumbering legacy slots.

One shared index replaces the readers' separate full-history position maps.
Only relevant source messages are folded. Hidden/deleted messages, edited source,
active swipes and source fingerprints are revalidated on every read pass. The
index and clock caches expire with that pass; no persistent historical aggregate,
extra full-chat scan, model call, refresh timer or independent tracking pipeline
is introduced. Classic tracking requests also share the existing read pass,
preventing a separate source-index scan for each requested module. Signed continuation quests remain snapshots; copied money, gear
and faction observations do not replay as transactions.

## Stable financial corrections and legacy compatibility

New money controls send `money:v1:` source IDs, derived from message ID, active
swipe, structured transaction fields/eligibility and the occurrence number of an
identical transaction in that message. Earlier message deletion, unrelated rows,
window movement and reordered distinct rows no longer change their targets.
Identical legitimate transactions remain separate. A changed amount/transaction
or swipe does not inherit another observation's settled/hidden flag.

The internal legacy `moneyRead.list[].id` remains available; panel controls use
`sourceId`. Current-window numeric aliases still follow the old ordinal rules,
including rejected/malformed positions. Existing `hidden`/`settled` arrays are
preserved and can contain legacy and source IDs together.

Resolved old aliases are remembered against that loaded money-state object.
`moneyPreserveCorrectionAnchors` adds optional `money.correctionAnchors` during
the next **existing** `saveChatState` call, before its ordinary primary/recovery
snapshot. Reads do not mutate saved state, trigger a write or fetch more history.
The weak cache holds the current recent alias map plus active legacy corrections;
obsolete bindings are pruned. There is no additional storage call or migration
pass over saved chats.

If an already-expired old numeric key has multiple possible transactions and no
previously captured anchor, the missing intent cannot be recovered honestly.
Such keys remain intact and are listed as unresolved rather than guessed. The
existing Finances panel shows a short review notice only when needed. While a
correction remains ambiguous, reminders do not assert that disputed debts are
certainly unpaid. After reviewing the records and making any corrections, the
player can explicitly confirm review; optional `money.legacyReviewed` annotations
acknowledge the obsolete keys without deleting original corrections. The action
uses the existing save cadence and is covered by handler/browser tests. A changed
or unavailable anchored source never causes that correction to jump to another
transaction. Identifiable legacy corrections are retained; ambiguous historical
keys are not claimed repaired automatically.

Transaction field changes can produce a new source ID; this is deliberately
conservative, not fuzzy financial reconciliation. It prevents a correction for
one amount/person from silently suppressing a different payment. The structure
remains chat-state version 2 / settings version 9 with an optional money field.
On downgrade, older runtimes do not interpret new `money:v1:` controls or their
anchors. Retain a pre-patch state/export or reapply those manual decisions in the
older runtime; raw tracking and correction strings are not deleted.

## Verification

Before this follow-up, the focused suite passed 3/12 initial groups and the
explicit retention audit exited 2 with debts/factions/quests/gear lost. New
regressions were added before implementation. Final checks:

- Node 22: **42 suites**, both bundle syntax checks and release identity pass.
- **20 durable-history groups** cover 340 sparse turns, JSON restore, later updates,
  partial payment, containers, completion, manual precedence, hidden/deleted/edited
  source, swipes, continuation boundaries, stable IDs, duplicate transactions,
  rejected/malformed rows, actual edit/save/restart behavior and ambiguous aliases.
- The unchanged substantive retention gate now passes: all seven fixture records
  remain **1→1**, with `lost: []`. The output is named `retentionFixturePassed`;
  one fixture does not establish indefinite correctness. This audit now runs in
  the normal suite runner, so future loss fails CI.
- Chromium/mock host: **21 UI + five visibility checks** pass. The added test shows
  retained equipment/quest/guild records, the legacy-review notice and a real
  Finances button emitting a source-bound ID.
- All Living World, Six-Sided, generic/legacy and other supported-card regression
  suites remain in the runner. The historical panel-parity test now positively
  checks unique source-ID controls, then compares all remaining fields unchanged;
  the ID change is intentional and independently regression-tested.
- The supplied Six-Sided export replays unchanged. Nine unsupported optional
  ability quotes remain unverified; no fuzzy quote acceptance was introduced.

Profiling identified repeated transaction hashing and duplicate Gear folding in
one panel pass. Identical transaction definitions now share a fingerprint within
the read, while each source event keeps its distinct ID. Gear folds once per
state/read pass. Exact consecutive quest confirmations avoid redoing an unchanged
fold, while explicit stage changes/resets and the first deadline anchor remain
intact. Shared text comparisons reuse up to 512 normalized strings per read pass;
the normalization and matching rules themselves are unchanged. Deterministic operation tests protect both optimizations without
relying on flaky timing thresholds or merging actual transactions.

## Remaining acceptance and rollback

The four known retention failures are resolved. Actual Lumiverse installation,
WebView, real-model obedience, reload/update and representative long campaigns
still need live acceptance; no running test instance was provided. Other card
mechanics remain bounded by the coverage register's documented evidence. This
patch does not assert that every possible narrator output or legacy ambiguity
can be made perfect. Ordinary green CI alone is not stable-release certification.

Restore code checkpoint `9b31453` for the prior unmerged patch, or `22aabf3` /
`v3.0.1-rc.1` for the published baseline, without rewriting `main` or release tags.
Keep saved data/export backups; heed the new financial-control downgrade limit
above. No raw chat metadata or original source is rewritten by this patch.

## Measurements

Final measurements compare the frozen candidate, prior patch `9b31453` and
published 3.0.1 `22aabf3`, using five sequential rounds with revision order rotated
and reversed. Same Node 22, complete card caches, source-bound 600/2,000-message
panels, existing pipeline and actual narrator-interceptor benchmarks. No test
process runs concurrently. Results and exact source hashes are recorded below.
Timing is local mock-host work; it is not provider latency, token billing or a
live million-user capacity claim.

| Workload | Published 3.0.1 | Prior patch | Completed patch |
|---|---:|---:|---:|
| panel-six-600 warm (ms) | 78.07 | 81.76 | 80.92 |
| panel-six-600 cold (ms) | 413.70 | 358.74 | 412.38 |
| panel-six-2000 warm (ms) | 122.79 | 134.88 | 150.62 |
| panel-six-2000 cold (ms) | 680.69 | 661.63 | 693.36 |
| panel-living-600 warm (ms) | 84.52 | 83.81 | 86.15 |
| panel-living-600 cold (ms) | 1173.81 | 1130.91 | 1175.53 |
| Parse report (ms) | 0.8053 | 0.7868 | 0.8144 |
| Process response (ms) | 1.0839 | 1.0770 | 1.0825 |
| Build tracker prompt (ms) | 0.4841 | 0.5180 | 0.5349 |

Values are medians of run medians; cold values are medians of first invocations.

The completed 2,000-message panel costs **150.62 ms**, versus **134.88 ms** for the prior patch and **122.79 ms** published. This is +15.74 ms / about 11.7% versus the prior patch: more historical observations and transactions are now correctly retained and processed. It is **not** a speed-neutral or universal responsiveness claim. Response-processing time is essentially unchanged in this run; live long-campaign performance still needs acceptance.

Normal transport counts match all three revisions: **one model request, six history fetches, one metadata write, two storage reads/four writes** for the existing complete update probe. Proxy-indexed history element reads fall **9,101 → 8,501 → 6,701** for the 600-message panel; this is a visitation count, not the total semantic work on derived records. Classic requests independently assert a single shared source-index pass.

Tracker prompt sizes remain **14,949 empty / 18,839 populated characters** in these fixtures. Actual narrator requests have unchanged reference character counts and host-call ledgers versus the prior grounding patch. Retained old debts can fill existing capped reminders in longer histories; zero token growth for every campaign is not claimed. No new extraction schema, model/API call or polling frequency is added.

The separate GC probe retains a 1,000-reply runtime and loaded legacy correction. After one warm pass / 30 further passes, retained heap (bytes) is: published 11,539,808 / 12,337,520; prior 11,570,048 / 12,330,304; candidate 11,675,480 / 12,540,928. This is one local probe, affected by JIT/GC; it is not a leak proof or an infinite-history memory guarantee. Per-pass indexes/signatures expire after the read; correction bindings are weakly keyed to loaded state and the recent alias map remains window-bounded.

Raw source hashes, all 180 measurements, operations, GC samples and replay counts: [durable-history-evidence.json](durable-history-evidence.json).
