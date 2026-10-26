# Changelog — RPG Companion HMS Edition

## 2.9.3 — Stored tracking accuracy

- Preserve longer study notes, agenda titles and physical-item labels with bounded limits and visible word-boundary ellipses instead of silent mid-word cuts.
- Keep borrowing permission out of automatic inventory while retaining physical permits, actual books, accepted transfers and manual data.
- Guard scheduled meetings/events against premature in-progress reports before their exact start. Preserve supported early starts and work before deadlines.
- Resolve trailing casting-method annotations to the same known spell without merging actual catalog variants. Prevent already-known practice from auto-starting study; preserve explicit learning/mastery completion and manual controls.
- Reuse already resolved spell state and known maps. Frontend/UI behavior, tracker instructions, model-call count, refresh frequency and storage/history operations are unchanged. Historical cut-off text requires a normal manual Refresh; Read cannot reconstruct missing words.
- Pass 14 scoped suites, both syntax checks, seven new tracking groups, the supplied export replay and the predefined repeated performance threshold. See tools/TRACKING_AUDIT_2_9_3.md.

## 2.9.2 — Quest objective identity

- Recognize equivalent objective wording and renamed quests even when one reading omits its giver. Require shared context and reject conflicting actors or places.
- Keep separate actions, destinations, quantities, negation and additional steps distinct. Preserve specific locations so a broad location cannot transitively merge two quests.
- Retain bounded derived title aliases and deduplicate current HUD/story aliases without rewriting saved records. Keep conflicting completion classes separate.
- Add seven quest-identity regression groups, including integrated HUD coverage. No added AI calls, prompt fields, storage writes or full-chat scans. See tools/QUEST_IDENTITY_2_9_2.md for scope and limits.

## 2.9.1 — Tracking integrity

- Match renamed quests using an unambiguous objective, giver and location; remove prefix-only joins. Preserve other established quests and omitted fields across partial updates.
- Deduplicate rephrased agenda descriptions and meal/bell variants while keeping different participants, places, dates and activities distinct. Preserve rescheduling and lifecycle updates.
- Keep afternoon, sundown and other approximate schedules textual. Reject unsupported exact `due` clocks; retain later confirmed exact times and legitimate relative durations.
- Preserve relationship bonds, standing and bars during mood-only updates. Unknown numbers stay unknown; explicit zero and false remain valid changes.
- Isolate secrets by owner and withhold explicitly speculative relationship/knowledge updates. Restore pending-equipment guards while retaining accepted gifts, borrowed gear and storage.
- Retain 2.9.0 sword-technique features, UI, preset, guides, translations and extension identity. Reuse existing bounded caches; no extra model calls, refresh triggers, full-chat verification scans or storage writes.
- Pass 12 scoped regression suites, both syntax checks, the private-export replay and the predefined repeated performance threshold. Separate inherited Visual/Save compatibility gaps are documented in tools/TRACKING_AUDIT_2_9_1.md; they are not counted as passing.

## 2.9.0 beta
- **Sword techniques**, a new card beside Magic: every sword technique the lorebook describes, by style and rank,
  against the HUD's `Sword Style:` / `Martial Style:` ranks: Known, Studying, Within reach, Next rank, Locked,
  Rank unknown. Reads `[TECHNIQUE — Name]` entries (`Style: … · Rank: …`, `Effect:`, `Requires:`) and the prose
  forms already in Mushoku lorebooks ("Sword God Technique: Silent Strike.", "… technique of the Water God Style,
  achieved at the Saint tier"). Study, ✓ and ✕ share the spells' learning: the model is reminded, the story reports
  progress and the first clean execution, learned techniques go to the Chronicle. The Mushoku world card's sword
  style ranks also list techniques from it.
- **A companion lorebook**, *Mushoku Tensei - Sword Techniques (Mazaki)*: the Sword God, Water God and North God
  techniques with a rank each, the rules for learning by rank, and the **Greyrat Style** founded by Ars Greyrat
  (a fan addition: seven techniques, Beginner to God, available only after he founds it).
- **Merged marcusjeanr-ctrl's 2.8.12–2.8.17** (stability and tracking integrity): tracker data bound to the reply it
  was read from (an edited reply drops its stale reading), serialized saves with a recovery copy, chapter summaries
  that go stale when their messages change, exact names first in People and Minds, guesses and gossip kept as
  unsure, abandoned objectives, Agenda items **In progress**, spell aliases, a reader for "Known spells" lists in
  replies, and the Mushoku Atlas (prose geography, ports, ruins only after the Calamity happens).
- Fixes on top: the Internal-states panel lost its map link (an undefined variable), and the Agenda's "in progress"
  count read the wrong field. The new text is translated in all five languages.

## 2.8.2 beta — fixes contributed by marcusjeanr-ctrl (from their 2.8.11 compatibility candidate)
- **Large lorebooks are read whole.** The book reader paged only the first 200 entries per book and stopped at 800;
  it now pages through every entry, so a 1,400-entry Mushoku book no longer loses half its spells. The spell catalog
  keeps the complete book even when only part of it is active.
- **Spells, stricter.** Spell names match exactly (Water Ball is not Water Ball Storm). A fight menu or an attempt
  never grants a spell; a successful cast or a learning report does, from the active swipe. New **Mastered** status.
  Spells with no rank in the lorebook show as **Rank unknown** (under All) instead of Within reach. Practice the story
  shows starts Studying by itself; a manual stop holds until new practice.
- **Mushoku, second HUD format** (the Six-Sided World card): `Armored Dragon Calendar: K.414, Month 3, Day 12`
  (12 months of 30 days), `Magic Tiers:`, `Sword Style:`, `Voiceless Casting:`, `Shown: … | True: …` mana and Touki,
  comma-separated locations. Year-less Agenda deadlines use the Mushoku calendar; no more "K. null" birth year;
  the mana tier note comes from the tier's own entry. The Living World HUD keeps working.
- **Saga timeline:** the full 22-arc list always shows, with the lorebook's dated canon calendar when it has one;
  a personal or Sandbox arc line is kept apart from the canon reference; canon events the story confirms are listed.
- **Atlas** adds the places the HUD visits in Mushoku chats. **Separate mode** now also keeps room drawings and
  positions, and drops a reading if the reply was swiped or edited while it ran.
- The side-panel block is asked for whenever a module that needs it is on (You, Magic, quests, Chronicle moments,
  and the other HMS modules), not only when People or Party are.
- New text translated in all five languages.

## 2.8.1 beta
- **Mushoku Tensei: the saga's timeline** on the world card, like Re:Zero's Arc 0 bar: the HUD's year (K.) on a bar
  of all 22 arcs, the current arc (with its part, "Arc 2-B: Hearth & Home"), how many years to the next arc, the
  arcs around you, and all of them folded underneath. Arcs and their start years are read from the lorebook's
  `[WORLD STATE — ARC N: …]` entries; without them the built-in canon list is used.

## 2.8.0 beta
- **Spell list from the bot's lorebook.** The Magic card now lists every spell the lorebook describes, by school,
  with its rank, effect and chant. It reads one-entry-per-spell books (`[SPELL — Name]` with `School:`/`Rank:`,
  and the older `Name [School Magic - Rank]:` lines), spell indexes (`### School` › `**Series**` › bullets) and
  one-entry-per-element books (Re:Zero's `– Core Definition` entries), plus the older Master Spell Index.
- **What you can use.** The HUD's `Magic School: Water: Saint, …` (rank per school) or `Magic: Fire | Gate:
  C-Rank` (elements, Gate as the tier cap) marks each spell Known, Within reach, Next rank, Locked or Special
  (unique, forbidden, lost). Melded spells need their parts. `Casting Method: Voiceless` marks chants optional.
  A filter (Usable and next / All) and a search box.
- **Learning magic.** 📖 Study a spell: the model gets a short reminder with the lorebook's effect and chant and
  the rule that learning takes practice and rank; the side-panel block reports progress and the first clean cast.
  Learned spells go to Known and the Chronicle ("Learned a spell — …"), and are given to the fight setup. ✓/✕ to
  mark by hand. A rank-up on the HUD shows which spells it opened. Works the same in Together and Separate modes.
- The Mushoku world card's spell lists now also fill from one-entry-per-spell lorebooks.

## 2.7.0 beta
- **Русский and Türkçe.** Settings → General → Language now also offers Russian and Turkish, and Auto picks
  them from the browser. Every card, setting, status line, the chat's Internal states and Minds tab, the whole
  Minds vocabulary, and the guide (GUIDE.ru.md, GUIDE.tr.md) are translated. **Ask for panel text in this
  language** asks the model for Russian or Turkish too.

## 2.6.3 beta
- **Family is family only.** A model sometimes reported an enemy, a mentor or a spirit under "family" (a fire
  spirit "who sentenced you" showed up there as dead and Nemesis). A family entry now needs a real family tie in
  its relation (mother, irmã, hermano, step-, adopted, in-law…, in English, Portuguese and Spanish); anything else
  is ignored, and entries already read that way drop out of the card. People you add by hand stay. The request
  also tells the model plainly that enemies, mentors and allies never go there.

## 2.6.2 beta
- **The bot's own `side_panel` block is read.** Newer HMS bots (Re:Zero) ask the model for a FrankenSIM-style
  block of their own, in a visible ```json fence: `{"side_panel": {"agendas", "learned", "chekhov": {"loaded",
  "fired", "drop"}}}`. It used to sit in the chat as raw JSON and feed nothing. Now its routines, what people
  learned and planted details go into the same cards (the bot's ids like `c7-toupeira` work for "fired"), the
  block is taken out of the saved reply, and the extension stops asking for the parts the bot already writes.
  A bare lock kind ("C") with nothing to wait for is not shown as a lock; weights above 3 count as 3.

## 2.6.1 beta
- **The "Close" standing showed as "Fechar" / "Cerrar"** (the button's word) in Portuguese and Spanish. Standings
  now have their own words: Nêmesis, Inimigo, Hostil, Desconfiado, Estranho, Conhecido, Amigável, Amigo,
  Próximo, Devotado (and the Spanish set), in the People card and in the chat's Bonds tab. A ladder of your
  own keeps its words.

## 2.6.0 beta — the official 2.1 (Minds) merged in
Everything from **TenderTriper's 2.1 beta** — **Minds**, ported from **FrankenSIM 4 Mini by Wireless (Ryah)**,
with permission; **TFDY** by **Pyropia** — joined to this edition's 2.5 work. See the 2.1 entry below for
what Minds does. On top of the merge:
- **Routines.** 2.1's "agendas" (what each person is doing, where, until when) are called Routines here, so
  they are not confused with your own **Agenda** card (your appointments and promises).
- **Secrets and "who knows what" are one picture.** Whoever knows one of your secrets shows it under what
  they know, with 🔒; ✕ there takes them off the secret too.
- **Translated:** every new card, setting, the chat's Minds tab and the whole vocabulary (the twelve
  feelings, TFDY, gate, filters, modes, Parrott's feelings, how someone found out) in Português and Español;
  the new guide part 7 in both guides. Fixed-list words are translated by kind, so "open" on a gate never
  changes an "open" elsewhere.
- The answer-cut-off recovery from 2.5.4 covers the bigger block Minds adds.
- Version: manifest 2.6.0; the panel and bug reports say 2.6.0-beta.

## 2.1 beta — Minds, from FrankenSIM
Ported from **FrankenSIM 4 Mini by Wireless (Ryah)**, with permission. **TFDY** is by **Pyropia**. Thank you both.
FrankenSIM has the model rewrite its whole state every reply; here the model says only what moved, and the
extension does the math and the remembering.
- **Minds**: each person's feeling (Parrott's tree) and at whom; TFDY (tenderness, fury, dread, yearning) resting
  where their temperament puts it; how warm they show themselves (IW); their mask; the side of them that leads.
  Toward you and toward each other: **twelve feelings** with walls between mirrors, a gate, what shows and what
  is said, filters that crack open, debts until paid, intent and mode. They replace the classic bars by default
  (Settings → Minds puts the bars back).
- **The math**: at most 2 a reply (TFDY 1); a quiet feeling eases back one step every 3 replies, faster when far
  off or near the top; three pushes the same way settle it a step deeper; never 0, first values 3 or more; minors
  and family never get desire or a romantic mode. A **Return by Death** makes the world forget the undone loop.
- **Agendas**: what everyone is doing, where and until when, here or elsewhere, with *over by* when the time passes.
- **Who knows what**: each fact with how it reached them and how sure, false beliefs marked. Forget one with ✕.
- **Chekhov's gun**: planted details in the Quests card, with weights, locks, ripe ones, payoffs. Drop one with ✕.
- **Building maps**: the rooms the story drew, joined into whole buildings floor by floor by their doors, at no
  token cost, with people placed by their agendas. A new room is told which rooms of its building exist.
  FrankenSIM's furniture footprints keep a bed a bed.
- **Tone of voice** in the dialogue display: whisper, steady, tremble, bite, drawn as type.
- **Handed back** before each reply as memory, never as a rule: in HMS Reporter's new *Minds state* slot
  (`{{rpgc_minds}}`), or in the extension's own context message.
- **Panel**: a 🧠 line on People cards and *Inside, feelings and what they know*; *Planted details* in Quests; a
  *Minds* tab under each reply; **Whole building** in the Map card; a **Minds (from FrankenSIM)** settings section
  and five Modules switches; credits in Help. The Test zone's Re:Zero demo shows all of it.
- **HMS Reporter beta 1.1.0**: a **Minds** block (play each character from the inside: facets that rotate,
  feelings that carry over and catch bystanders, masks, honesty that is earned, knowledge that needs a way in,
  people who act on their own), a minds step in the Normal and Deep plans (Deep also turns the world off screen
  and checks planted details), receipt beats cut, and the Minds state slot. Fix: the Frame category and the
  Frame block shared one id.
- Version: the manifest says 2.1.0; the panel and bug reports say 2.1.0-beta.

## 2.5.4 beta
- **"Update automatically after each reply" no longer misses replies.** In Separate mode the tracker call
  hangs on Lumiverse's "generation ended" event. When that event did not reach the extension, or arrived
  before the reply was saved, nothing ran and the panel stayed on the old turn until you pressed Refresh.
  Now the reply is looked up again for a few seconds if it is not there yet, and the panel, which hears the
  same event, tells the backend too. Whichever comes first does the work; a reply is never read twice.
- **Internal states and the other cards no longer vanish when the tracker answer is cut off.** With all the
  new modules the answer is longer, and a connection with a low response limit cuts it before the end. The
  whole answer used to be thrown away (or, in classic chats, the characters were lost). Now everything that
  arrived complete is kept, and the status line says the answer was cut off and how to fix it.
- A failure while reading the reply no longer stops the tracker call, and it shows in the panel's status
  line instead of only in the server log.

## 2.5.3 beta
- **Gear reads far more HUDs.** An inventory written as a label on its own line with the items as bullets
  under it was read as empty; items split by `|`, `·` or `•` were glued into one; "Carried:" was not a gear
  label; counts ("2x Med kit", "Radio x2") made a second item. All read now.
- **One item, not three.** "pack", "my backpack" and "Backpack" are the same bag, and a model writing in
  Portuguese or Spanish ("Mochila", "Espada") lands on the HUD's item instead of adding a new one. The HUD's
  spelling is the one shown, and the model is told to use it. Something put "into the pack" shows inside the
  Backpack, not in a second bag.
- **States the model words its own way** ("embainhada", "nas costas", "en la mano", "carried", "holstered")
  are understood instead of the change being dropped. `"gear": {"Sword": "sheathed"}` is read too.
- **What you added in the old Carried row** (before Gear existed) shows in the Gear card again, and what you
  removed there stays gone. With Gear on, that row is hidden, so those items had disappeared.
- "ring" and "earring", "belt" and "sword belt" are no longer merged into one item.
- **Chronicle:** a reply that repeats a holding already gained, a promise already kept or a secret someone
  already knew no longer adds the same entry again.

## 2.5.2 beta
- **A quest leaving the HUD is no longer a "Critical" alarm.** It used to sit in the red banner next to low HP,
  forever, with no way to clear it. Now it shows only in the Quests card, with two buttons: **Put back**
  (it is not over: write it back onto the Quests line) and **It's over** (the bot just stopped listing it: move
  it to the journal as "ended by you"). If the quest comes back to the HUD later, it is tracked again.
- The red banner translates each alarm on its own, so a mixed line no longer stays half in English.

## 2.5.1 beta
- **Agenda layout fix**: the time ("in 1h 25m (after the manor visit, this afternoon)") now sits under the title and
  wraps, instead of squeezing the title into a narrow column. Late and soon times are readable on light themes.

## 2.5.0 beta
- **Interface in English, Português (Brasil) and Español.** Settings → General → Language: Auto (the
  browser's language) or a fixed one. Every card, setting, status line, confirmation, the fight window, the
  Test zone and the in-chat panels (Internal states, the HUD card's own words) follow it. Only what is shown
  is translated: settings values, keys, HUD lines and everything sent to the model stay as they are, so
  lorebooks keep loading. The HUD card never translates a HUD line.
- **Ask for panel text in this language** (shown when the language is not English): the model writes the
  side-panel block's free text (thoughts, looks, reasons, moments, agenda, notes), chapter summaries and the
  OOC guide's answers in that language, keeping names, HUD lines, keys and list values untranslated.
- **The guide in all three languages** (GUIDE.md, GUIDE.pt-BR.md, GUIDE.es.md), the in-panel Guide follows the
  interface language.
- Translations live in `i18n/pt-BR.json` and `i18n/es.json` (English text → translation; `{0}` slots for text
  built at run time, `{0d}` for a number or a time span). `python3 tools/embed_i18n.py` copies them and the
  guides into `dist/`.

## 2.4.0 beta
- **Finances**: a ledger of every sum that changes hands (income, expense, debt, loan, repaid), from your own
  message and the reply, with totals per currency and open debts that count down as they are repaid. The HUD
  balance stays the authority. Open debts go into the request.
- **Factions**: guilds, kingdoms, churches, houses, gangs, school classes — your standing on an eight-step
  ladder (hunted to member), rank, bounty, why it moved, and their people from People. Read from the story and
  the HUD's Faction/Guild/Affiliation/Bounty lines; set the standing by hand. Swings, promotions and bounties go
  into the Chronicle.
- **Secrets**: your secrets and who found them out, and how; others' secrets you learned. Add, add a knower, or
  remove one by hand. The request names who knows each secret, so nobody acts on what they could not know.
  Discoveries go into the Chronicle.
- All three: Settings → HMS systems, Modules, classic chats too; the Mushoku Tensei demo shows each.

## 2.3.0 beta
- **Agenda**, a new card and module: appointments, promises, deadlines and errands.
  - Read from your own message and the reply ("I'll meet you at the river tomorrow") through an optional
    `"agenda"` key; made, kept, missed, moved or called off. Add your own.
  - Times land on the HUD clock: the HUD's format ("Day 5, 14:00"), or plain words ("tomorrow at dawn", "in
    three days", "tonight", "before dark", "at 4pm"). The card sorts them into Late, Soon, Coming up and No set
    time, and counts down.
  - The request tells the model what is coming up, due now or late. Kept and missed ones go into the
    Chronicle.
- **Holdings**, a new card and module: vehicles, mounts, homes and rented rooms, land, buildings, businesses,
  titles and offices — what you hold but do not carry.
  - From an optional `"holdings"` key (gained, lost, changed), the HUD's Title/Property/Mount/Vehicle/Estate
    lines (`Knight of Asura (granted by the king)`), and by hand. A holding the HUD lists is never lost.
  - Grouped by kind, with where it is, a note, how long it has been held, and what Gear says is kept there.
  - The request lists them; gains and losses go into the Chronicle.
- Settings → HMS systems → Agenda / Holdings; Modules → Agenda / Holdings. Classic chats too.
- Test zone: the Mushoku Tensei demo makes a promise, keeps an appointment and gains a room and a pony.

## 2.2.0 beta
- **Gear**, a new card and module: how you carry each thing — in hand, worn, sheathed, on you (back, belt,
  shoulder), inside a bag, left somewhere, dropped or gone.
  - **Your own message counts.** The side-panel block now reports every change in how you carry things
    from what you wrote ("I sheathe my sword, I sling the pack on my back") as well as from the reply,
    unless the reply shows it failed. Before, nothing tracked this, and things handed over only counted
    when they changed hands in the reply.
  - The HUD's Equipment/Items lines show on the card: `Backpack [rope, rations]` fills the backpack,
    `Longsword (sheathed)` sets the state, `Roxy's wand — keepsake` is read as "Roxy's wand". The HUD stays
    the record of what you own: an item it still lists is never marked gone.
  - One list per bag; **This turn** shows what changed; **Move…** changes the state or puts an item into a
    bag, holding until the story says something newer; added by hand with its state.
  - The request carries how everything is carried now, so a sheathed sword is not swung.
  - Gear replaces the Carried row of the You card while it is on (standard issue stays).
  - Classic chats get the same card from the tracker JSON.
- **"got" and "lost"** (things handed over) now include what you did in your own message.

## 2.1.0 beta
- **Family**, a new card and module. Your own family: what each one is to you, alive, missing or dead, and
  where they are, as the story last showed (*seen*, at your HUD location), told (*told*) or assumed
  (*guess*), with the trail of where they have been and how long ago on the HUD clock.
  - Read from an optional `"family"` key in the side-panel block (only the family members a reply shows or
    speaks of), from People readings whose bond is a family bond (family friends excluded), and from what
    you add by hand.
  - **Correct this**: set a place, the relation or the status by hand; it holds until the story says
    something newer about that person, then the story wins again.
  - The request carries each one's last known place and status, so the model does not move anyone the
    story never moved. Settings → HMS systems → Family: the card, asking the story, the reminder.
  - The Chronicle records a death, someone going missing, being found alive, and news of where someone is.
  - The People settings view (People, family, party & phone) and Modules list it.
  - Test zone: the Mushoku Tensei demo shows Paul in the scene and news of Zenith.
- **Fix: labelled location paths.** A HUD that writes `Location: ◆ World → Region → Place` (the Mushoku Tensei
  format, and `**Location:** A → B`) was read as a plain field, so the Atlas, the map bank, first visits in
  the Chronicle and Internal states found no place. The label is now skipped and the path read as one.
  `Location: Roswaal Mansion` with no path stays a plain field.

## 2.0.1 beta
- **Side calls read reasoning models' answers.** DeepSeek and GLM through some proxies send their chain of
  thought with no opening `<think>`, only a lone `</think>` before the answer. Fights, the tracker, chapter
  summaries, portraits and the OOC guide used to read that as "unreadable" (or pick up braces from the
  reasoning). One `stripThink` now handles `<think>`, `<thinking>`, `<reasoning>`, the orphan closing tag and a
  block cut off mid-way, everywhere a side call is read.
- **JSON repair finds the real object.** A `{` or `}` in prose before or after the JSON no longer spoils it: balanced
  objects are tried first.
- **Chapter summaries use the chat's own connection.** They were sent without the chat, so a side connection
  set for that chat was ignored, the busy-provider retry could not tell the chat was generating, and the panel
  showed no "provider busy" status.
- Unused code removed (`catalogCompose`, `commsInbox`, `CHAPTER_KINDS`, an unused list in the fight window).

## 2.0 beta — the official beta
- **The guide is built in.** A **Guide** button in the top bar opens the whole guide in the panel, with a find
  box; the same text is `GUIDE.md`. It explains the three parts (bot, preset, extension), who is in charge,
  setup, a new game, each turn, every card, OOC questions, memory, every setting, and fixes for common problems.
- **The Cosmic Hierarchy is removed**: its module, card, settings, world preset and the Nexus theme. Saved
  settings drop it by themselves (a chosen Nexus theme falls back to Lumiverse's own).
- **Each part stays in its lane.**
  - Injuries: a bot that keeps its own wounds (Re:Zero, Mushoku Tensei) owns them for the whole chat, also on
    turns where its HUD shows none. The extension used to step in on those turns and could remind the model of
    a wound the HUD had already healed.
  - Experience is asked only where the HUD shows a level. Re:Zero, Mushoku Tensei and Classroom of the Elite
    no longer get an XP question every reply.
  - **Move the world** is no longer marked OOC (an OOC message is now answered outside the story, with no HUD).
    The Test zone's plot buttons likewise.
  - The **Chronicle** switch in Modules really stops it (it used to hide only the card while still asking and
    writing).
  - The Man-God's advice is asked only while the world card is on.
- **New game**: start lines in capitals are found (`MUSHOKU_TENSEI_START_HANDLER`), and from the lorebook when
  the catalog pages do not name them. **Resume an old campaign** builds the bot's Start Continuer message from
  the old chat's last HUD, your last messages and a summary.
- **A world preset in one click**: after the first reply, the panel offers the preset for the bot it found
  (once per world).
- **Settings open as a short list**: every section starts closed.
- **Fixes**: a time like `12:40` showed as a label "12" in the World State card; the world card shared its
  open/closed state with the World State card; a quest deadline given as a bare time ("08:40") counted to the
  next day instead of showing overdue; a turn-based fight's aftermath now keeps the plot, objectives, key
  moments, inbox and injuries like any reply; search boxes take the panel's colours.
- **HMS Reporter beta** (the preset, was 0.5): renamed, with a plain description of who owns what.
- Version: the manifest says 2.0.0; the panel and bug reports say 2.0.0-beta.

- 1.9.26: New game, the OOC guide, the Arc line guard; emoji have one owner.
  - **New game builder** from the bot's own catalog pages and start handler line (see above).
  - **OOC guide** in the panel, or in the chat with the bot's trigger; OOC turns are left alone.
  - **Arc line guard** with a one-click fix to the lorebook's spelling.
  - **Emoji: one owner.** The extension draws them from the dialogue markers; HMS Reporter 0.5 no
    longer has an emoji block or asks the model for any.
  - Catalog descriptions no longer repeat their label.
- 1.9.25: The map bank, and fixes from the first Chronicle test.
  - **Map bank.** A room drawn once is kept for its world and used on every later visit and in every
    chat with that bot, so it is never drawn (or paid for) twice. View, forget, save the current
    version, or clear the bank from the Map card; the Atlas shows 🗺️ on places with a saved map and
    opens it in the details. Setting: Chat and panel extras → Map bank.
  - **Windows belong to walls.** A window the model gives as a block is drawn as a blue line in the wall
    it names, touches or is nearest to; the request says so too.
  - **One look for both maps.** The side-panel map uses the same world colours as the map under the
    reply.
  - **Atlas tiles readable in every panel theme** (they were dark boxes in the light themes).
  - **A room with nothing inside** opens among its neighbours in the Atlas, selected.
  - **The phone reads the story.** Texts, group chats and school or app notices that reach your phone
    are an optional `"inbox"` in the side-panel block (asked only when you have a device that takes
    messages). Notices show on the Phone card, people who messaged you become contacts you can answer,
    and Internal states shows them under Phone. Messages are no longer filed as things you carry.
  - **Your own device, per chat.** Name a phone (or mirror) on the Phone card when the story gave you one
    the HUD never prints.
- 1.9.24: The Chronicle.
  - **A timeline of the story**, read from the chat as it stands, so a swipe or an edit changes it too:
    milestones from the HUD (arc, rank, class, level, standing, powers gained, deaths and loops, quests,
    first visits), relationship history from the People readings (first meetings, standing and bond
    changes with their reason), plot threads opened and resolved, and key moments.
  - **Key moments** are one optional key in the side-panel block (`"moments"`, about 60 tokens of
    request, usually answered with `[]`). They show on the Plot tab of Internal states too.
  - **Chronicle card**: newest first, grouped by loop and day; filters for moments, bonds, plot,
    milestones and places; a name opens that person's timeline with you; star, hide, add your own;
    ✓ written, ⏳ waits for your answer.
  - **Written back into the Memory Cortex** once a reply is settled: facts with importance tags on the
    people, places and you; one `relationship` link per person toward you with its label and feeling;
    loops undone by Return by Death written as undone. Write now and Write everything again (after a
    Cortex rebuild; nothing doubles). Setting: Off, only the biggest, most (default), everything.
  - `{{rpgc_chronicle}}`: the key moments so far, for presets.
  - **Fix:** fights read the Memory Cortex's facts about the people in them again (the snapshot calls
    them `topFacts`).
- 1.9.23: The Atlas reads every bot's book.
  - **Re:Zero-style books.** Sections written as `**Label:**` lines (Appearance & Atmosphere, Function
    & Properties, Availability), lists written as `- **Name** *(note)*`, `◈ TIER n NAVIGATION ADDENDUM`
    and `◈ ADDITIONAL TIER n` lists, and `◆ POPULATION & FAUNA OVERLAY` entries (added to their place).
  - **One place, many spellings.** Paths that name a place differently in different entries become one
    place: short and long names, a name with its other name in brackets, `[Pocket Dimension]` flags,
    groups across cities (`[Royal Capital / Flanders / Costuul]`), a META copy of the root.
  - **No wrong links.** A listed room is looked for inside its own place and next to it, never across
    the world (Lugunica's throne room is not Vollachia's). A room listed under one name and written
    under another ("Maids' Rooms" / "Maids' Quarters") is one tile, not two.
  - **Cleaner text.** The details pane shows the book without markdown marks, list items as bullets.
  - **On the road.** `[In Transit: Lugunica → Vollachia]` stays one HUD segment; the Atlas shows you
    at the start of the trip, "on the road to Vollachia", and no room is drawn.
- 1.9.22: The Atlas.
  - **The location book as a map.** Every `◆ TIER` / `◈ PATH` entry becomes a place in one graph:
    parents from the paths, children in the book's navigation order, floors from `(Second Floor)`-style
    segments, surveillance graded (covered, watched, blind spots, no cameras), access and hours, who is
    usually there, scene anchors and links. The HUD's ◆ line is found in it, with the deepest known place
    and anything past the book shown as such. Built for all four HMS bots' shared format; tested on the
    Classroom of the Elite book (112 places).
  - **Atlas card** in the side panel: trail, floors, places as tiles coloured by how watched they are,
    and a details pane. Modules → Atlas switches it off.
  - **The map draws rooms from the book**: a new room's request carries its walls (or its shell's), its
    anchors and where it opens, once per room.
  - Internal states' Scene tab adds a Cameras line for the current place.
- 1.9.21: The map.
  - **Positions and the room map**, off by default: *Only in fights* or *Every reply*. Rooms are drawn
    once per place (from the location's lorebook entry when it is loaded) and kept; each reply then
    only moves people, with the last positions sent back for continuity. A Map tab in Internal states
    and a Map card in the side panel: walls, furniture, labelled ways out, and you, allies, foes and
    others in their own colours.
  - The D&D, Power scaling and Gritty play styles turn it on for fights; the others leave it off.
- 1.9.20: Internal states, and what you carry.
  - **Internal states panel** under each reply: Scene, People (with thoughts), Bonds (what moved, and
    why) and Plot, as tabs. Replaces the thoughts block by default; *Thoughts only* brings it back.
  - **Standard issue.** In Classroom of the Elite the phone, ID, uniform, dorm key and textbooks are
    assumed by the bot and never on its HUD; the Phone card now finds the phone, and the You card lists
    them.
  - **Carried.** The side-panel block now reports things handed over or lost on screen (`got` / `lost`);
    they collect in the You card, follow swipes, and can be removed or added by hand.
- 1.9.19: The HUD card and dialogue display.
  - **HUD card** in the chat (on by default), in the bot's world colours or Lumiverse's, with the plain
    text one click away. Display only: the saved HUD never changes.
  - **Dialogue colours, emoji reading cues and speaker names** (off by default) from `[D:Name:mood]`
    markers, drawn when shown. 42 emoji families, editable; per-chat speaker colours.
  - New macros `{{rpgc_marks}}` and `{{rpgc_emoji}}` so a preset's own emoji instruction can stand down.
  - The Test zone log hides the markers.
- 1.9.18: The preset handshake.
  - **`{{rpgc_request}}`, `{{rpgc_on}}`, `{{rpgc_fight}}`.** A preset with the slot (HMS Reporter v0.2)
    carries the side-panel request where its own reply shape expects it; the extension sees it there and
    does not add a second copy. Without the slot, nothing changes. If the slot fails or is slow, the
    extension adds its own message as before.
  - **A smaller request.** Last reply's characters go back as names and looks only — their old
    thoughts and moods were the part that grew with every character in the scene, and invited repeats.
    Spells are asked for only where the HUD shows magic (not in Classroom of the Elite). In the slot the
    request also drops the lines the preset already covers. A Classroom of the Elite scene with five
    people: about 1,690 → 1,375 tokens.
  - Settings → Modules explains that Request placement does not apply when the preset carries it.
- 1.9.17: Fixes from the first HMS Reporter test.
  - **The WORLD STATE header written twice** (the preset's opening plus the model's own, seen with GLM)
    is now one header. The reply is cleaned when it lands and on screen, and the second header is never
    read as a HUD line — that was the false "a HUD line was dropped" alarm on the next reply.
  - **The same quest twice.** The HUD writes `Name #1572188`, the story block just `Name`; quests are now
    matched without the barcode, quotes or capitals, so the story's details join the HUD's quest instead
    of adding an "in the story" copy.
  - **Bond history** no longer logs a "change" that is only capital letters, punctuation or spacing.
  - The Injuries note no longer names the Re:Zero HUD in other worlds.
- 1.9.16: Choose the connection.
  - **Connection for side calls** (Settings → General). Fights, the tracker, chapter summaries, portrait
    prompts and the Test zone used to run on Lumiverse's *default* connection only — not the one you had
    selected — and failed with "No connection profile found" when no default was set, which is why a
    turn-based fight could not start. Every call now names its connection. **Same as my chat** (the
    default) follows the connection your own replies in that chat use; you can also pick Lumiverse's
    default, or any one connection, for example a cheaper model for side calls.
  - With nothing to follow yet it falls back to the connection selected in Lumiverse, then the default,
    then your first connection. A chosen connection that was deleted falls back the same way and says so.
  - The fight window now explains a missing connection in plain words instead of showing Lumiverse's raw
    error.
- 1.9.15: Fixes from the first round of real play.
  - **Operator-scoped installs**: reading world info, long-term memory and portraits failed with "userId is
    required for operator-scoped extensions". Every user-scoped call now carries the user.
  - **One-request-at-a-time providers** (free plans): the extension's own calls collided with your reply and
    came back 429. They now wait four seconds after a reply, stand aside if you have already sent the next
    message, and try a busy provider again twice; if it is still busy, the panel says so in plain words.
  - **Read again**: a new button that reads the latest reply again — HUD and side-panel block — without a model
    call. The manual way when the automatic read missed something.
  - **The World State says why it is empty**, and shows how the reply starts. A reply still being written no
    longer blanks it, and a HUD written in HTML is read through the markup.
  - **Fixed**: starting the Test zone over while a live turn was being written crashed it ("sandbox.busy").
- 1.9.14: Injuries on the Re:Zero HUD's injury law.
  - The Injuries card (for HUDs without wounds) now runs on the Re:Zero lorebook's own rules: raw → treated
    → healed; each kind and severity heals in its window (wounds, fractures, sprains, burns); a break left
    unset 3–4 days heals crooked and turns Permanent; a wound or burn left raw risks infection; internal
    bleeding needs a healer; Permanent never heals with time; a healed moderate-or-worse wound may scar.
  - The story is told each injury's state and the day it is on ("broken shin, severe fracture, treated, day 6
    of 70–112"), and the side-panel block asks for kind, severity and status in the same words.
  - Your controls: Treated, Back to raw, Healed, Healed with a scar, Permanent; add your own with a kind and
    severity. Injuries saved by 1.9.13 are read the new way.
  - The Body card (a HUD that keeps its own wounds) warns in the law's words: an unset break heals crooked.
- 1.9.13: From the players: what the cards send, forgetful models, injuries — and the whole Cosmic Hierarchy.
  - **What the story is told, said plainly.** The Survival and Mind cards now say it: once you are tired, hungry
    or thirsty, or your state of mind is not calm, the story is told with every message so it can play it.
    The buttons log what you did; the story reports it too. With "Tell the story" off, they say only you see them.
  - **Models that forget the side-panel block.** When a reply leaves it out, it is fetched with one quick second
    call, only then, so the panel does not go stale. Three misses running and the panel suggests Separate mode.
  - **Injuries**, for HUDs that do not keep wounds: the story reports every injury you carry; the Injuries card
    shows how bad each is, whether it was treated and for how long; you can add one, mark it treated or healed;
    and the story is told them with every message. A HUD that prints its own wounds owns them.
  - **Fixed**: Separate mode (and Refresh in an HMS chat) dropped the plot, objectives, the Cosmos reading and
    the Man-God's advice it had read. It keeps everything now.
  - **The Cosmic Hierarchy, from its full lorebook**: Kael, Malachi and Janus (Gaius and Malus) join the family,
    with the nine servitor orders; the Creator is your persona; six pulls instead of four (Memory–Oblivion and
    Good–Evil); the gated arcs tracked phase by phase, with a warning when one skips; the Dice of Fate move the
    world, never the Creator himself; and the veil line steps aside when the lorebook already carries it.
- 1.9.12: The Cosmic Hierarchy, and sections that no longer close by themselves.
  - **Fixed**: a section could snap shut (or back open) on its own. It saved its new state on the browser's
    toggle event, which arrives a moment after the click; if a reply landed or the panel refreshed in that
    moment, the panel was rebuilt in the old state. The state is now saved on the click itself.
  - **The Cosmic Hierarchy module**: the Dice of Fate (Aurora and Moira roll with every exchange and lean the
    next beat), who of the hierarchy is present and the omens mortals notice, the balance between the
    Firstborn's domains, the realm and its Overseer, the knowledge veil, and an editable roster from the lore
    bible. Off by default; its own preset turns it on, with the new Nexus theme.
- 1.9.11: The plot and objectives, and the three new worlds checked.
  - **The Quests card opens with the plot** — where the main story stands and its open threads, marked moved or
    resolved as the story goes, the resolved ones kept below — **and objectives**: what you are trying to do right
    now as the story sets it, plus your own, which stay with you and are never sent. HMS and classic chats. They
    add about 190 tokens to the side-panel request; switch either off under Settings → Quests.
  - **Undertale's MERCY** in immersive fights: a monster that can be spared is marked, and sparing everyone ends
    the fight as spared, not as an escape.
  - **Each thing in one place**: what a world card shows — Authorities, classes, shouts, skills, the covenant — the
    Abilities card no longer lists a second time. Switch the world card off and it lists them again.
  - **The three new presets, checked**: Dark Souls no longer shows Estus twice (as a bar and as flasks); Undertale's
    LV, EXP, AT and DF live on the world card only; Skyrim's perk count is not read as an ability.
- 1.9.10: The presets, checked, and three more worlds.
  - **Every preset turns HMS on** (Always mode, the side-panel block, the guard, pin reminders) — the play styles
    did not touch it before.
  - **Fixed**: a world preset *replaced* whole sections of your settings instead of changing only what it names.
    Applying Overlord, say, reset your chapter budget, your D&D rules, the legacy window switch and your XP
    curve to their defaults. A preset now merges into your settings.
  - **Fixed**: the four wiki themes (1.9.0) were partly overwritten by the older world themes further down the
    stylesheet, so Re:Zero, Overlord, Classroom of the Elite and Mushoku showed a mix of the two looks —
    Mushoku's cream wiki cards with the old dark theme's pale text. The old rules are gone; each shows as
    designed.
  - **The world presets, reviewed**: Overlord gets its world card, Arcs chapters and engine-rule fights (it had
    power scaling, and no world card); Overlord, Classroom of the Elite and Mushoku switch D&D off (their own
    systems replace it) and Classroom of the Elite drops your roller (the School Database rolls); Re:Zero keeps
    D&D for its D&D mode and adds Arcs to Loops; every world keeps its arcs as chapters.
  - **The play styles, reviewed**: Pure narrative now really has no dice (no roller, no D&D) and asks fights for
    the least; Gritty survival plays on Hard; Social & romance turns the phone on.
  - **Undertale, Dark Souls and Skyrim**: a world preset, a theme, a world card and a Test zone world each.
    Undertale's SAVE, LOAD and RESET count as rewinds, so each timeline can be a chapter.
  - **Fights**: a HUD that prints your Stamina (Dark Souls, Skyrim) owns it, like HP and MP; FP and Magicka are
    read as MP.
- 1.9.9: A full diagnosis of 1.9.8, top to bottom.
  - **Every switch explains itself.** 37 settings switches had no line saying what they do; each has one now.
  - **Settings with no control**: the You module's level-up note and the XP needed for each level could only be
    changed by editing files. They are under HMS systems → You.
  - **Faster in long chats**: the panel re-read every system of every HUD in the chat to build the quest journal,
    about 440 ms per refresh on a 1,200-message chat. It reads only the quest lines now and remembers HUDs it
    has read: about 80 ms.
  - **Bounded memory**: the per-chat caches grew with every chat you opened; they keep the recent ones now.
  - **Plain-language errors**: a missing permission read "PERMISSION_DENIED: generation"; it now names the
    permission and where to grant it. A timeout says how long it waited and where to raise it.
  - **Dead code removed**: the old Chapter card was still in the file, hidden behind the new one.
  - **Modules** now cover Chapters, Lorebook context and Long-term memory too; switched off, a card leaves the
    panel and its text leaves the prompt, as everywhere else.
  - **Help & bug report** opens with a short guide to how the panel fits together, and its version always
    matches the build (it used to be typed in by hand).
  - **Fixed**: ending a turn-based fight before a single round closed the window without a word; the panel now
    says nothing was posted and why.
  - **Fixed**: a Godmother Decree due at midnight on January 1, set on December 31, showed as eleven months past.
  - **Fixed**: with the world card switched off, the D&D card stopped reading the D&D sheet the HUD prints.
  - **Fixed**: a level the HUD prints could be "raised" by hand in the D&D card, with no effect. Those buttons
    are locked now, like the rest of a HUD-owned sheet.
  - With only one kind of fight available, the fight button opens it straight away instead of a one-item chooser.
  - The README's settings map covers every section of Settings, and the panels are listed once each, in the
    order the panel shows them.
  - **Tested further**: every Test zone world in Live mode; a classic chat in Separate mode; both fight
    windows played by clicking; the floating panel; the model answering with garbage, nothing, the wrong
    shape, an error or never; each permission missing; every view scanned for leftover program text.
- 1.9.8: The world cards read the rulebooks and lorebooks behind each world.
  - **Re:Zero**: magic (element, what the Gate and Pool ranks mean, the element's spell series), Spirit
    Affinity, what each spirit rank is, Od Integrity and Corruption on their named stages with the next one,
    and curses. Entries marked SECRET — the sealed Sovereign forms — never reach the panel.
  - **Overlord**: each tradition's spells up to its LV from your magic core, and a framework check against the
    Being Framework, Traditions and Super-Tier rules. The Test zone's Overlord build now follows those rules.
  - **Mushoku Tensei**: sword techniques per style and rank from your technique index, the matchup triangle,
    and what your Mana Capacity and Touki stage mean.
  - **Fixed**: an ability description could come from a module's rulebook (how the engine heals a curse)
    instead of the entry about the thing itself.
- 1.9.7: A full pass over everything since 1.9.1.
  - **Fixed**: a clock going back was read as Return by Death in every story, so a new school year in
    Classroom of the Elite could close a "loop", and a new K. year in Mushoku Tensei could drop a fight as a
    rewind. Only a story with Return by Death rewinds now.
  - **Fixed**: your own presets forgot everything added since 1.8 — immersive fights, D&D, Chapters, the world
    card, Lorebook context, the engine core and memory. They remember all of it now.
  - **Fixed**: with "Watch the chat's world info" off, a world card showed no ability descriptions, class caps
    or spell lists until the first fight or tracker call. It reads the lorebook as soon as the card appears.
  - **Fixed**: amber text (enemy telegraphs, legendary classes) was hard to read on the light themes.
  - The bug report now says which systems are in play: the world card, chapters, a fight, D&D, the lore pool.
  - Modules name where merged parts live ("Party (in People)"), and the README is brought up to date:
    install permissions, presets, the Test zone, engines tested.
- 1.9.6: The world cards, built out from the bots' own start handlers, central controls and registries.
  Re:Zero shows the Arc 0 prequel year on the handler's −20 → 0 axis with its Part and milestones. Overlord
  reads each job class's tier and cap from your class registry, marks legendary classes, and shows traditions
  with their LV. Classroom of the Elite shows the school calendar and the days to the next Class Point
  announcement, and Chapters can follow the school months. Mushoku Tensei lists what you can cast in each
  school from your Master Spell Index, and what the next rank opens. The Test zone plays Mushoku Tensei, and
  its Re:Zero, Overlord and CotE scripts print the bots' current HUDs, so their world cards show there too.
- 1.9.5: A card of its own for each of the four worlds — Re:Zero, Overlord, Classroom of the Elite and Mushoku
  Tensei — found from the HUD. Overlord fights know every combatant's level and the gap to yours. The D&D card
  reads a D&D character sheet the HUD prints. The Mushoku Tensei preset is an HMS preset now (carriers,
  abilities, no survival clock, no phone); the Re:Zero preset switches Loops chapters on.
- 1.9.4: The pop-out window scrolls again. Lumiverse's own page rules (which the window copies so it matches
  the app) make the page itself unscrollable; the panel now scrolls in a container of its own, with the mouse
  wheel, touch and the keyboard.
- 1.9.3: Chapters, one card per person, and nothing asked twice.
  - **Chapters** are memory at the story's own scale: by hand (the default), or — switched on — per loop
    under Return by Death, per arc, per day. Summaries ride on top of the history; nothing is removed. A
    finished loop is sent as undone and remembered only by you, and what you uncovered collects into one list.
    The old "hide everything before this message" chapter is gone; a chat still using one can show its
    messages again from the Chapters card.
  - **One card per person.** Present characters, Party and People showed the same person three times; they
    are one card under People now.
  - **Nothing asked twice.** A party member was asked their mood twice, what is on their mind twice (as
    "thoughts" and as "concern") and their jealousy twice on two scales. Each is asked once now and the
    party reading is filled from the others. With the survival clock on, your stress is read from your state
    of mind instead of being asked separately.
  - **Fixed**: in an immersive fight with fate dice, a roll you made yourself and your fate die both went to
    the model for the same action. Your own roll now replaces your fate die.
- 1.9.2: From the first look at 1.9.1.
  - **D&D is one section with one switch**: a per-chat sheet (ability scores, saves, the 18 skills,
    proficiency from your level), a roller that adds your modifiers, advantage and a DC and sends the whole
    sum into your next reply, and turn-based fights. Switched off, the Turn-based fight button goes too.
  - **You and Vitals are one card.** The same HP bar was shown twice.
  - **Quests have their own Settings section.**
  - **The panel's place is chosen in the top bar**, next to Test zone and Settings.
  - **Fixed**: the pop-out window used unstyled text boxes and default fonts; it now copies Lumiverse's own
    look and follows its theme. Dropdown lists were white with pale text in dark themes (and pale on white
    in light ones); they are readable in every theme now. The Test zone called you "User" instead of your
    persona. A roll made in one chat went into the next reply of whichever chat you used next.
- 1.9.1: One extension again, and fights split into two different things.
  - **Merged**: the lore, engine and memory work that had been numbered 1.9–1.11 on its own line is
    folded into this build. Fights, the tracker and the companion block now carry your world books
    (Lorebook context), your engine core as binding law (Engine core & memory), and the Memory Cortex.
  - **Fights are two things now.** *Immersive*: you fight in the chat and the panel tracks everyone —
    HP, MP, Stamina, effects and how long they have lasted, each fighter's last move, enemy telegraphs,
    hidden enemy plans, Study, acting on a weakness, fate dice, a fight log. *Turn-based*: the D&D
    window. The narrative window is a legacy option under Settings → Fights. Your style, fate dice and
    difficulty carry over to immersive fights. Auto-start stays off by default.
  - **Fixed** in immersive fights: the fight froze in HMS chats whenever Present characters, Party,
    People and Phone were all switched off (the numbers only came back through their block). A reply
    that only carried the fight numbers was ignored and left raw JSON in the chat. The note to the model
    told it not to render "a status block", which made classic chats drop their trackers — the likely
    cause of "No trackers yet" during a fight. Swipes inflated the reply count. Every enemy fleeing never
    ended the fight, and you getting away was not an outcome. An enemy knocked out with HP left was never
    down. The auto-start notice used a host call that does not exist, so it never showed. Correcting a
    number used a browser prompt the desktop app may not show. Switching Fights off mid-fight hid End
    fight while the fight kept running, and auto-start ignored the switch. The Test zone's Demo spent
    tokens on an immersive fight.
  - **Fixed**: in Separate mode, the companion call was told to "add the block after the prose" instead of
    describing the latest reply (a wording change in 1.9.0 broke it). Granting the memories permission
    mid-session did nothing until a restart. With no watched pool, the lore fallback read every book you
    own, so a fight in one world could pull another world's lore; it now reads only the books the chat uses.
  - **New switch**: Watch the chat's world info — see Lorebooks for what it costs.
  - Settings move to v8: "Turn-based" now always means the D&D window.
- 1.9.0: The pre-2.0 build, from playtest feedback.
  - **Fixed**: the side-panel request was appended to your own message (~1,170 tokens on a one-line turn),
    which shortened replies and pushed some models to write the HUD into their thinking. It now has its own
    system message before your turn, framed as an extra, and is trimmed.
  - **Fixed**: a HUD or block written into the model's thinking is moved back into the reply; a reply that
    still carries a raw block is processed later — never while it is still being written.
  - **Fixed**: Fights, Tracker field presets, Custom prompts and Reset closed themselves a few seconds after
    opening. A HUD drafted inside <think> was read as the state. A block with only our newer keys, or an empty
    fence, could show in chat. Move the world posted a visible OOC message (now a short marker). Plot buttons
    failed in the test zone. An edited HUD value of the same length could be served stale.
  - **Fixed**: in HMS chats, present characters no longer ask for per-character stats (Health, Arousal) — and
    the minor guard now covers character stats too. People tracks feelings; it no longer pulls NPCs toward
    neutral, and never steers how they are written.
  - **New**: You (with XP and level-ups), Magic, richer Quests, Check what?, Difficulty, Modules, wiki-style
    world themes plus D&D / Heaven / Horror, the floating mini panel and pop-out window, and the bug report.
- 1.8.0: World presets that set everything, and the test zone.
  - **Living World presets**: Re:Zero — The Living World, Overlord — The Living World and Classroom of the
    Elite — HMS Render Engine now configure HMS (always on), carriers, vocabularies, meters, quest tags, party
    depth, phone kind, fights and theme for their bot. Presets merge deeply: they change only what they name.
    Your own presets now remember every system, not just a few switches; presets saved by 1.6 still apply.
  - **Test zone**: a practice chat inside the extension, in Demo (scripted, free) or Live (your model) mode.
  - Density and text size.
  - Every chat call now goes through one layer, which is what lets the test zone run the real code paths.
- 1.7.0: Relationships done right, every chat, and worlds.
  - **Fixed: closeness was read as romance.** The ladder ended in Lover, so deep affection became a
    romantic label — it called Beatrice, a child-appearing spirit whose card makes her bond daughter-
    and-parent, a lover. Standing now measures closeness only (it tops out at Devoted); the kind of bond is
    tracked apart, from the character's own entry and contract; minors and family bonds are guarded from
    romance and desire by the extension itself; and the bond can be set by hand. Untouched v1.6 lists
    upgrade automatically.
  - Relationship cards: mood, bond, Desire / Tension / Jealousy bars, the reason under the bar that moved,
    and the present-character dossier.
  - **People, Party and Phone in classic chats**, with their own settings section. Before, they only
    existed in HMS chats, so any bot the HUD detector did not recognise never showed them.
  - Phone kinds: phone, conversation mirror, Message spell, comms radio. The device can come from the
    inventory in classic chats.
  - World presets (Re:Zero, Overlord, Classroom of the Elite, Mushoku Tensei) and six new themes.
- 1.6.0: People, the phone, two combat systems, and play-style presets.
  - **People**: a relationship tracker for everyone you deal with — standing on a ladder, six bars,
    what changed, alerts, and four layouts. Party members take affection and trust from here.
  - **Phone**: device and balance from the HUD, contacts earned in the story, threads from the chat;
    texts, calls and transfers go into the story, where the engine decides whether they connect.
  - **Fights split in two**: Narrative (engine rules, power level with feats, hax and counters, or
    fiction; fate dice; outcome badges) and D&D (a rules engine in the extension: initiative, attack
    rolls against AC, damage dice, crits, saving throws, spell slots, Dodge, death saves, massive
    damage, stabilising, and companions rolling to obey). Your v1.5 choice carries over.
  - **Play-style presets** and **themes**. Tracker presets were renamed Tracker field presets.
- 1.5.0: Fights rebuilt, and a full audit against every source.
  - **Fights**: Physical / Magical / Abilities & skills menus, orders for allies (a request their
    card and mood answer), Check with lasting intel and exploit-with-advantage, Guard, a risky
    Flee, hidden enemy plans with visible telegraphs, apparent threat vs true power, four
    resolution modes, and true-random dice for every combatant.
  - Fixed: the aftermath of an HMS fight crashed when the side-panel block was on (a v1.4
    regression). A combatant a reply forgot to restate vanished from the fight. Try again
    re-rolled the dice. The fight settings' defaults were stored where nothing read them.
  - **Audit** against the three engines, their HUD modules, the original extension and the card
    toolkit: Gamemode, Now Playing and the Mental Council are carriers; Blood Pool, Thirst State,
    talents' Status, multi-Authority brackets, `[… - state]`, world items, Runecraft, Passives,
    `[MAIN QUEST: …]`, `[EVENT: …]`, Exam lines, attributes, the engine's own dice rolls and ✦
    notices are all read; self-clearing lines show as cleared; the corrected HUD after an
    (OOC: Correction) is the one read.
  - **Stands down in HMS chats**: Choose your own adventure (the engines forbid ending on
    options), and the plot buttons (Move the world replaces them). Styling prompts keep the HUD
    plain text. Move the world can no longer trip The World Moves.
  - README rewritten; LICENSE added with the modification notice AGPL asks for.
- 1.4.0: The party.
  - **Keep tabs on the people travelling with you.** Add them by name, from the suggestions
    (a contract on the HUD, or someone present in most recent replies), or with **+ Party** on
    a present character. Each reply, members in the scene are read through the side-panel
    block; the absent keep their last reading and read in the past tense ("was very hungry
    when last seen, 40m ago").
  - **Built on the V7.0 card toolkit.** Every state a card names for itself is reported in the
    card's own words: State Register (Territorial), Affect Band or behavioural mode (Band 1),
    contract stage, gated progression phase, vessel front, signature tell. The extension
    defines none of them and never restates card content into the prompt — it carries short
    labels forward so readings stay continuous.
  - **Universal levels** for what cards do not name: affection, trust, jealousy (and of whom),
    irritation, how hard they are holding an act, hunger, fatigue, pain, stress — none,
    slight, moderate, high, extreme.
  - **Alerts.** A strain at the alert level ("Honami is very jealous of Kikyo — for 40m"), a
    strain climbing several replies in a row, affection or trust dropping sharply, and a
    **skipped phase or stage** — which a V7.0 card forbids. The request itself tells the
    model a stage or phase moves only after an event with a cost. Durations run on the HUD
    clock. A member in agony, starving or about to drop joins the Critical banner; social
    strain stays in the Party panel.
  - **Other names.** Aliases per member ("Momonga", "Ainz Ooal Gown"); a shared vessel's souls go
    here too.
  - Each group (mask, bond, needs, phase) can be switched off, which removes it from the request.
  - **The side-panel block no longer depends on Present Characters.** The party and the survival
    clock can ride it on their own.
- 1.3.0: Vitals, body, mind, abilities, quests — and an optional survival clock.
  - **Read, never computed.** Every new panel reads what the engine already prints. HP, wounds
    and conditions stay the engine's; the extension shows them, tracks them over time, and
    never edits them.
  - **Vitals.** Resource pools (HP, MP, Focus, Super-Tier Slots…) as bars, with damage and
    healing since the last reply. Percent meters (Corruption, Od Integrity) with their stage,
    rising-is-bad ones inverted. Health pools can go critical.
  - **Body.** Wounds by tag — Raw, Treated, Magic-Healed, Permanent — with how long each has
    sat in its tag. A wound left Raw past a threshold (72h default, the malunion window) is
    flagged. Conditions on their own ladders (Blood Loss, Shock, Exhaustion, Starvation, Dread…)
    with stage, trend and time at stage. Unlisted conditions still read Mild…Critical and
    Stage N. Healed wounds and cleared conditions are noted.
  - **Mind.** Psychological conditions and status flags (Dread, Blood Frenzy, Emotion
    Suppression) in their own panel.
  - **Abilities.** Authorities, Divine Protections, Contracts, Blessings, Skills, Martial Arts,
    magic systems, classes, traits — grouped by category. What counts as an ability is a
    vocabulary you edit per world.
  - **Quests.** State badges, objective checklists (a Godmother Decree, a D&D Milestone), and a
    journal of quests that left the HUD. **A quest that leaves the line while still live is
    flagged**, with a one-click put-back: its printed name is what loads its entry, so a silent
    drop darkens it. Quest names are never injected into the prompt.
  - **Carrier lines.** When the guard catches a dropped Arc, Quests, Memory, Blessings, Game
    Mode, Authority, Divine Protection or Contract line, it is listed first and marked.
  - **Inline blocks respected.** Rows inside a ─── fenced block (Godmother, School
    Database, D&D sheet) are no longer diffed or pinned. Before, every XP tick flagged two false
    drops, and Restore would have written the stale header back in. Blocks now show as their own
    card, and restored lines never land inside one.
  - **Folded path layers** like `(Eastern Provinces)` show dimmed.
  - **Survival clock (off by default).** For bots whose HUD does not track sleep, food, water or
    state of mind. It measures elapsed time from the HUD clock — the arithmetic models are bad
    at — and tells the engine the facts; the engine decides the consequences. It stands down
    for anything the HUD already tracks, for immune races (Undead), and resets on a Return by
    Death rewind. Events come from the side-panel block or the Slept / Rested / Ate / Drank
    buttons.
  - Everything is configurable under Settings → HMS systems.
  - Fixed: quests after a ` | ` separator were cut from the Quests line.
- 1.2.0: Audit pass — correctness, reachability and honouring your own switches.
  - **HUD line identity is now content-based, not positional.** A HUD may legitimately
    carry several lines under one tag (Re:Zero's seven `[SPIRIT CONTRACT: …]` lines, two
    `[STATUS: …]` lines in Overlord). Those were keyed by tag alone and disambiguated by
    order, so when one dropped the survivors renumbered: the guard named a line that was
    still present, missed the one that actually vanished, and Restore wrote a duplicate
    into the saved reply. Pins had the same fault. Both fixed and covered by tests.
  - **A HUD template swap is no longer read as dropped lines.** Entering or leaving
    Re:Zero's WHDAAA theater replaces the whole HUD by design; the guard used to flag
    every standard line at once, and Restore would have spliced twelve stale lines into
    a theater HUD the module forbids touching. The swap is now detected and reported as
    a template change with nothing to restore. Ordinary drops are unaffected.
  - **Switching the extension off now actually stops it.** Refresh, Move the world,
    fights, plot nudges and portraits used to run regardless: Refresh spent tokens,
    Move the world posted to the chat, a fight could write its aftermath. Those actions
    are refused while it is off, and the three input-bar buttons grey out. Reading the
    panel, editing saved data and changing settings still work.
  - **Refresh honours “Ask for present characters and thoughts.”** With it off, a manual
    Refresh in an HMS chat used to fire the companion call anyway, against the promise
    that off means nothing is added. It now says there is nothing to fetch.
  - **Three settings became reachable in HMS mode.** Present characters, Quests, Dice and
    the bar colours are all live in HMS, but their controls sat in a panel HMS mode hid.
    Turning one off elsewhere left no way to turn it back on — worst for Present
    characters, which also gates the companion request. The section now appears in HMS
    with the toggles that apply there. Quests also honours its own toggle now.
  - **Portraits can be removed.** The backend could always clear one; nothing ever asked
    it to. There is now an ✕ next to Redraw.
  - **Leaked preset reasoning is stripped wherever it lands**, not only in the run
    directly after `***`. Prose that merely mentions the words is still untouched.
  - Settings carry a version and migrate on load. Stale HMS detection is cleared when
    messages are deleted. Unlabelled numeric inputs got labels. Dead CSS removed.
- 1.1.2: Panel auto-updates after every reply without a manual Refresh. It now listens for the
  reply-ended event, self-heals if a push is missed, and a repaint deferred while you're editing
  a field flushes correctly on blur (the applied data is never lost).
- 1.1.1: Safety net for a preset that spills its reasoning into the reply — a leaked
  fn:/page:/REPORT CARD/VIOLATION LOOP block sitting between the HUD's *** and the prose is
  stripped from the saved message and hidden live. Only fires when those markers appear right
  after the separator; ordinary prose that mentions the words is untouched. This is a
  backstop; the real fix is preset-side (keep that reasoning in the Thinking panel).
- 1.1.0: Relationship field widened and free-form by default (no more wrong "Lover" for a
  contracted or family bond); Quests panel (reads a HUD `Quests:` line and keeps your own
  notes); combat gains a per-fight thinking toggle, optional dice/skill checks, abilities read
  from the HUD each turn, and a Past fights log.
- 1.0.0: HMS Edition. Reads the WORLD STATE HUD instead of competing with it; HUD Guard
  with restore; pins; Move the world; fights and aftermaths on HMS rules; companion block
  for characters; automatic HMS detection with classic fallback.
