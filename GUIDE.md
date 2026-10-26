# HMS Guide

**RPG Companion HMS Edition 2.9 beta** and **HMS Reporter beta**

This guide explains how an HMS game works, how to set it up, and what every part does.
Read **Start here** first. Use the other parts when you need them.

---

## 1. Start here: three parts, one game

An HMS game has three parts. Each part has one job.

| Part | What it is | Its job |
| --- | --- | --- |
| **The bot** | The character card and its lorebooks: Re:Zero, Mushoku Tensei, Classroom of the Elite or Overlord | The world and its rules. It writes the **WORLD STATE HUD** at the top of every reply. |
| **HMS Reporter beta** | A preset: the prompt Lumiverse sends | How the story under the HUD is written: style, voices, length, thinking. |
| **RPG Companion HMS Edition 2.9 beta** | An extension: the side panel | It reads the HUD and shows it as cards. It tracks people, how they feel and what they know, quests, fights and more. It helps you start a game and ask questions. |

### Who is in charge

When two parts disagree, this order wins:

1. **The bot.** Its rules and its HUD are the law. The bots call this **STATE IS GOD**. Nothing may hide, change or replace the HUD.
2. **The preset.** It only shapes the story under the HUD. It never changes a rule or a HUD line.
3. **The extension.** It reads and shows. It asks the model for one small hidden block after the story, and hands back what it remembers about the people (Minds) before the next reply. It never writes a HUD of its own and never adds rules.

### What a reply looks like

```
### WORLD STATE ###
Day: 3 | Time: 14:10 (Afternoon)
◆ World of Re:Zero → Lugunica → Roswaal Mansion
Arc: Arc 2: A Week at the Mansion
***
The story...
<rpg_companion>{ ... }</rpg_companion>
```

- **The HUD** is the top part, from `### WORLD STATE ###` down to the `***` line. It belongs to the bot.
- **The wall** is the `***` line.
- **The story** comes under the wall. It follows the bot's rules, written in the preset's style.
- **The hidden block** comes last. It belongs to the extension. You never see it: it is removed from the saved message.

### Who owns what

| Thing | Owner | Notes |
| --- | --- | --- |
| The HUD: time, place, arc, powers, money | Bot | The extension only reads it. |
| Rules: death, power gaps, Return by Death, exams | Bot | Fights in the extension use the bot's own rules. |
| Start commands and the catalog | Bot | The New game card only fills them in for you. |
| OOC answers | Bot (its guide character) | The OOC card asks that same guide. |
| Injuries in Re:Zero and Mushoku Tensei | Bot | These bots keep wounds on their HUD. The extension stays out. |
| Injuries in Classroom of the Elite and Overlord | Extension | These bots keep no wounds. The Injuries card tracks them. |
| How the story reads, its length, thinking | Preset | Set them under the sliders icon. |
| Emoji and dialogue colours | Extension | Drawn on your screen. The preset never writes emoji. |
| Side panel, map, Chronicle, people, quests | Extension | Read from the HUD and the hidden block. |
| Who a character is | Bot (its character cards) | The cards always win. |
| How characters are played from the inside | Preset (the Minds block) | From FrankenSIM. See part 7. |
| The numbers: feelings, routines, who knows what, planted details | Extension (Minds) | The model only says what moved. The extension keeps the rest. See part 7. |

---

## 2. Install and set up

You need **Lumiverse 1.2.0 or newer**.

### Step 1: Remove the old RPG Companion

If you have the original RPG Companion extension, disable or remove it. Both would add to your prompt.

### Step 2: Install the extension

1. Open the drawer and go to **Extensions**.
2. Click **Add Extension**.
3. Pick one way:
    - **Install from Source**: paste the extension's GitHub link.
    - **Import Local** (owner or admin only): first put the `rpg_companion_hms` folder in `Lumiverse/data/extensions/`.
4. Read the permissions and click **Install**.
5. New extensions start switched off. Turn **Enable** on.
6. Grant the permissions. You can skip any. That part then switches off and tells you why.

| Permission | What it is for |
| --- | --- |
| interceptor | Adds the extension's small request to your prompt. |
| generation | The extension's own model calls: fights, the OOC guide, chapter summaries, a missed side-panel block. |
| chat_mutation | Keeps the hidden block out of saved replies, puts back HUD lines, and posts your new-game, phone and Move the world turns. |
| world_books | Reads your lorebooks: the Atlas, the Arc line check, the OOC guide, lore for fights. |
| memories | Uses Lumiverse's Memory Cortex: the Chronicle writes to it, fights read from it. |
| image_gen | Character portraits only. |

### Step 3: Import the preset

1. Open the **Preset Manager** in Lumiverse.
2. Import the file `HMS_Reporter_beta.json`. It comes with the extension, in its `preset` folder.
3. Choose **HMS Reporter beta** as the preset for your HMS chats.

### Step 4: Open the panel

Open a chat with an HMS bot. Then open the **RPG Companion (HMS)** tab in the side drawer.

### Step 5: Use your world's preset

After the first reply, the panel offers **Use the [world] preset**. Click it.
It sets the right cards, fights and theme for that bot in one click.
You can also do this later in **Settings → Play style**.

### Good settings to start with

- Preset sliders: **Thinking: Normal**, **Prose length: Scene-led**, **Start replies with the HUD header: Auto**.
- Lumiverse: switch on the **Memory Cortex** if you want the Chronicle to remember key moments.
- Extension: keep **Together** mode (Settings → General).
- Want emoji or coloured dialogue? Settings → **Chat and panel extras** → **Dialogue**. They are off at first.

---

## 3. Start a new game

### The catalog

Every HMS bot opens on a **catalog**. Its first message has many pages. Swipe left and right to see them.

- **The hub page** says how to start, and names the **start handler** line.
- **The canvas page** is almost empty. You type your start under it.
- **Command pages** list starts, add-ons and ready-made examples.

### The start handler line

Your first message must begin with the bot's start line, on a line of its own.

| Bot | First line | Line to resume an old campaign |
| --- | --- | --- |
| Re:Zero | `ReZero_Start_Handler` | `ReZero_Start_Continuer` |
| Mushoku Tensei | `MUSHOKU_TENSEI_START_HANDLER` | `MUSHOKU_TENSEI_START_CONTINUER` |
| Classroom of the Elite | `Cote_Start_Handler` | `Cote_Start_Continuer` |
| Overlord | `Overlord_Start_Handler` | `Overlord_Start_Continuer` |

Then come your commands. For example:

```
ReZero_Start_Handler
Start at Arc 3 with RBD, Hell Mode, Start with Echidna
```

### The New game card (the easy way)

On a new chat, the panel shows **New game**. It reads the catalog pages for you.

1. Pick a page at the top.
2. Pick one **start**.
3. Pick any **add-ons**. Add-ons stack on a start.
4. Fill any blanks, like `[Name]`.
5. Read the warnings. For example: no start yet, an empty blank, or no Return by Death in Re:Zero. One click adds `with RBD`.
6. Press **Start the game**.

The card turns the greeting to the canvas page and sends your command. You can also edit the command by hand, **Copy** it, or **Clear** it.

### Resume an old campaign

Inside the New game card, open **Resume an old campaign instead**.

1. Paste the last HUD from your old chat. This is your save file.
2. If you have them, paste your last few messages and a summary of the story.
3. Press **Resume the campaign**.

The card puts the bot's Continuer line first, as the bot asks.

### After the first reply

- The bot builds the HUD on turn 1. From then on it carries it in every reply.
- **Arc line check.** The Arc line is a lookup key. If it is misspelled, the arc's lore never loads. The World State card warns you and offers the book's spelling in one click.

---

## 4. What happens each turn

1. You write what you do, and send it.
2. The preset builds the prompt: the bot's card and engine, your lore, memory, the chat, the minds state, and the extension's small request.
3. The model writes the HUD, the `***` wall, the story, and the hidden block.
4. The extension reads the reply:
    - It reads the HUD and updates the cards.
    - It reads the hidden block (people, feelings, routines, what people learned, planted details, quests, phone, injuries), then removes it from the saved message.
    - It does the Minds math: caps each step, lets old feelings fade, remembers debts.
    - It checks for HUD lines that vanished, and puts back lines you pinned.
    - It draws the HUD as a card in the chat, and dialogue colours and emoji if you switched them on.
5. When you answer a reply, that reply is settled. The Chronicle then writes its key moments to the Memory Cortex.

### The button row

| Button | What it does |
| --- | --- |
| **Move the world** | You do nothing new. One story thread off screen moves one step. |
| **Immersive fight** | Starts a fight you play in the chat. The panel tracks it. |
| **Turn-based fight** | Opens the D&D fight window. Only when D&D is on. |
| **Read again** | Reads the latest reply again. Free: no model call. Use it when a card did not update. |

### The top bar

| Item | What it does |
| --- | --- |
| Together mode / Separate mode / Paused | Shows how the extension gets its data. See Settings → General. |
| **Refresh** | Asks the model again for the side-panel data. This costs a call. |
| Drawer / Floating / Own window | Where the panel lives: in the drawer, floating over the chat, or in its own window for a second screen. |
| **Test zone** | A practice chat inside the extension. Demo mode costs nothing. |
| **Guide** | This guide. |
| **Settings** | All settings. |

### Buttons in the chat input bar

**Refresh side panel**, **Open RPG Companion**, **Start or resume a fight**, and **Move the world**.

---

## 5. HMS Reporter beta (the preset)

### What it does

HMS Reporter beta tells the model how to write the story under the wall. It always puts the bot first. It says: the core and its lorebook entries outrank everything in this preset.

### The blocks, top to bottom

| Block | On at first? | What it does |
| --- | --- | --- |
| Frame | On | Says who is in charge and the reply shape: HUD, wall, story, then the hidden block if one is asked for. Explains OOC messages. |
| Game card | On | The bot's description and its system prompt. |
| HMS core (personality field) | On | The bot's engine: its rules and its HUD. |
| Scenario | On | The card's scenario, if it has one. |
| Player persona | On | Your persona. |
| Example messages | On | Style examples only. |
| Reporter: how the prose reads | On | Lead with what changed. Use exact details. Show only what you can see. End where the world hands it back. Cut stock phrases. |
| Voices and groups | On | People speak briefly and in their own voice. Nobody reads minds. Groups talk to each other. |
| The player's character | On | The model never writes your choices, words or thoughts. A Narrative Mode from the bot can change this. |
| Minds (from FrankenSIM) | On | How to play each character from the inside: the side of them that leads, feelings that carry over, masks, honesty that is earned, knowledge that needs a way in. See part 7. |
| Mature content (adults only) | Off | Adult scenes between adults only. Minors and family bonds always stay non-explicit. |
| Gore | Off | Shows violence without softening it. |
| World info (before) and (after) | On | Your lorebook entries. |
| Memory (Chat Memory and Memory Cortex) | On | Lumiverse's long-term memory. |
| Story summary (Loom Summary) | Off | Lumiverse's own summary. Turn it on only if you use it instead of Chapters. |
| Chat history | On | The chat itself. |
| Card's post-history instructions | On | Anything the card puts after the chat. |
| Minds state (RPG Companion) | On | What the extension remembers about the people of the story. It stays empty without the extension, with Minds off, and on OOC turns. |
| Fight craft | Fights only | Loads by itself during fights: wind-ups, the room in the fight, impact before pain. |
| Side panel (RPG Companion) | On | The extension's request goes here. It stays empty without the extension and on OOC turns. |
| Before you write | On | Thinking, length, and the dialogue marker reminder. On an OOC turn: answer out of character. |

### Your settings: the sliders icon

| Setting | Choices | Tip |
| --- | --- | --- |
| Thinking | Off, Light, Normal (default), Deep | Normal and Deep think through each character first (the minds step). Deep also moves the world off screen and checks planted details. It is the slowest. |
| Think out loud | On or off | For models that cannot think by themselves. Also switch on Auto-parse thoughts in Lumiverse, so the plan folds away. |
| Prose length | Brief, Scene-led (default), Long, Very long | The HUD never counts toward the length. |
| Start replies with the HUD header | Auto (default), Always, Never | Auto helps only Kimi and DeepSeek. Use Always only if a model keeps skipping the HUD, with thinking off. |

### OOC messages

Start a message with the bot's OOC trigger, like `[OOC: ...]` or `OOC guide: ...`.
The preset then asks for an answer out of character: no HUD, no story, no hidden block, and no time passes.

---

## 6. The extension's cards

The panel shows one card per thing. A card only shows when it has something to show.
Click a card's title to fold or unfold it.

### New game
Only on a new chat. See part 3.

### World State
The HUD, line by line.

- **Pin** a line (the pin icon) to keep it exactly as it is. If the model drops or changes it, the extension puts it back. The model is also reminded.
- **The guard.** If a line vanishes, you see it with **Restore**. A carrier line (one that keeps lore loaded, like the Arc line) is marked, because losing it hides lore.
- Lines that end by their own rules (a healed injury, a passed exam) show as **cleared**, with a put-back button.
- If a reply has no HUD at all, press **Put the last HUD back**.
- The **Arc line check** warns when the Arc line loads no arc lore, and fixes it in one click.

### The world card
One card per world: **Re:Zero**, **Overlord**, **Classroom of the Elite**, **Mushoku Tensei**, **Undertale**, **Dark Souls** and **Skyrim**.
It shows that world's own stats from the HUD, explained from your lorebooks. Some examples:

- Re:Zero: deaths and the save point, Authorities, spirit contracts and their ranks.
- Overlord: levels and classes, with a check that they add up.
- Classroom of the Elite: the calendar, class standings, Private Points, the exam.
- Mushoku Tensei: sword styles and magic ranks, the Man-God's advice, and the saga's timeline: the year (K.) on a bar of all 22 arcs, the current arc, and how many years to the next one. The arcs and their years come from the lorebook's "[WORLD STATE — ARC N: …]" entries, or the canon list if it has none.

### Map
Where everyone stands in the room. It is off at first: Settings → Chat and panel extras → **Map**.
A room is drawn once, then only people move. The **map bank** keeps every drawn room for that world, so a place is never paid for twice.

**Whole building.** When two or more rooms of one building are drawn, press **Whole building**. The extension joins the rooms by their doors, floor by floor. It costs no tokens. People not in your room show where their routine puts them. A room no door leads to yet is drawn with a dashed line. See part 7.

### Atlas
The bot's location book as a map. It shows where you are, the rooms around you, and details for any place: how watched it is, opening hours, who is usually there.
Click a place to go in, **Up** to go out.

### You
Your own state: health and other pools, meters, mood, stress and sanity.
Level and experience show only in worlds that have levels.
**Standard issue** lists things the bot assumes you have. **Carried** lists small things you got in the story. You can add or remove them.

### D&D
A character sheet and a dice roller. Your roll goes into your next message.
Switch it off in Settings → Modules if your game does not use dice.

### People
Everyone you have met. Each person shows:

- **Standing**: how close they feel to you, from Nemesis to Devoted. It is never romance.
- **Bond**: what kind of relationship it is: classmate, mentor, family, partner.
- **The 🧠 line**: what they feel right now and at whom, how warm they show themselves, and their three strongest feelings toward you. A ⚠️ means a wall, a ⚖️ means you owe them.
- **📍** what they are doing and until when.
- **Inside, feelings and what they know**: open it for the rest. See part 7.
- **In the scene**: how they look and act now, and their thoughts.

The classic bars (Affection, Trust and the rest) come back if you set Settings → Minds → **Feelings toward you** to Classic bars.

Use **Set the bond** if the story reads a relationship wrong.
Minors are protected: never a romantic bond, never any desire.
Party members show how they are holding up. Add them with **Add to party**.

### Finances
A ledger of every payment, wage, purchase, bribe, loan and debt, from your own messages and the story, beside the HUD's balance (which stays the record of what you have).

- **Open debts**: who owes whom and how much is left; a repayment to the same person counts it down, ✓ settles it by hand.
- **Ledger**: newest first, with totals in and out per currency. **Log** adds your own entry, ✕ removes one.
- The model is reminded of open debts, so a creditor remembers.

### Factions
Groups, not people: guilds, kingdoms, churches, noble houses, gangs, school classes. For each: your **standing** (hunted, hostile, unfriendly, neutral, friendly, trusted, allied, member), your **rank** in it, any **bounty** on your head, why it last moved, and who from People belongs to it.

- From your messages and the story, and from the HUD's Faction, Guild, Affiliation and Bounty lines. Change the standing from the card; it holds until the story moves it again.
- The model is reminded where you stand with each. Big swings, promotions and bounties go into the Chronicle.

### Secrets
Who knows what.

- **Your secrets** (a past life, Return by Death, a plan) and who has found each out, and how. **What you know about others**: their secrets you have learned.
- From the story when someone finds something out, and by hand: add a secret, add someone who knows, or ✕ someone who does not.
- The model is told who knows each secret; anyone not named does not know it and cannot act on it. Each discovery goes into the Chronicle.

### Agenda

Appointments, promises and set times: "I'll meet you at the river tomorrow", "the exam is on Friday", "be back before dark". These are yours; what other people are doing is their **routine**, in People (part 7).

- They come from your own messages and from the story. Times are placed on the HUD clock ("tomorrow at dawn", "in three days", "Day 5, 14:00"), so the card counts down: **Late**, **Soon** (next 3 hours), **Coming up**, **No set time**.
- ✓ kept, ✗ missed, ⊘ called off; the story marks them too. Done ones fold away.
- The model is reminded what is coming up, due now or late, so people remember you were meant to meet. Kept and missed promises go into the Chronicle.

### Holdings
What you own or hold that you do not carry: **vehicles** (a wagon, a ship), **mounts**, **homes** and rented rooms, **land**, **buildings**, **businesses**, **titles** and **offices**.

- Read from your messages and the story (gained, lost, changed) and from the HUD's Title, Property, Mount and similar lines. Something the HUD lists cannot be marked lost.
- Each shows where it is, a note (condition, rank, what it brings), how long you have held it, and what the Gear card says is kept there ("stowed in the wagon").
- **Edit** sets where it is or a note; ✕ marks it lost. Gains and losses go into the Chronicle.

### Gear
How you carry each thing: **in hand**, **worn**, **sheathed**, **on you** (slung on your back, on your belt), **inside a bag**, **left somewhere** or **dropped**.

- Just write it in your message: "I sheathe my sword and sling the pack on my back", "the letter goes in my coat pocket". After the reply the card shows it. What you say you do counts unless the reply shows it failed.
- What the HUD lists under Equipment or Items shows up too (as *on the HUD*). The HUD stays the record of what you own; Gear only says how you carry it.
- **This turn** lists what changed. Each bag gets its own list of what is inside it.
- **Move…** changes how you carry something, puts it into a bag, or marks it gone. It holds until the story says something newer about that item.
- The model is reminded how everything is carried, so a sheathed sword is not swung and a dropped pack is not opened.

Settings → HMS systems → Gear switches the card, the reading and the reminder.

### Family
Your own family, on a card of its own: what each one is to you, whether they are alive, and where they are.

- **Where**: the place the story last showed or told. *seen* means they were in the scene with you (the place is your own HUD location then), *told* means someone in the story said so, *a guess* means it is only assumed. **Here with you** marks anyone in the current scene.
- **Status**: alive, missing, dead or unknown. A missing person seen again is marked found.
- **Where they have been**: every move, with how it was known and how long ago on the HUD clock.
- Their standing and Affection and Trust come from People, so the two cards agree.
- **Correct this**: set the place, what they are to you, or the status. It holds until the story says something newer about them.
- **Add to family** for someone the story has not named yet. **✕** hides someone who is not family.
- The model is reminded where everyone was last known, so nobody turns up where the story never sent them. Deaths, disappearances, reunions and news of where someone is go into the Chronicle.

Settings → HMS systems → Family switches the card, the question to the story and the reminder.

### Phone
Your device, your money, your contacts, your messages and notices.
Send a text, call or transfer. It goes into the story as your turn, and the bot decides whether it reaches anyone.

### Body
Wounds and conditions from the HUD, with how long each has lasted.

### Injuries
Only for bots that keep no wounds on their HUD (Classroom of the Elite, Overlord).
Each injury is raw until tended. Treated is not healed. The card shows healing time and warnings.

### Mind
Mind conditions, like Dread, and the Mental Council.

### Survival
Off at first. Tracks time since you slept, ate and drank, from the HUD clock. The bot decides what it means.

### Magic
Magic pools, traditions, cooldowns, and a spellbook that learns your spells.

**Spell list.** When the bot's lorebook describes spells, the card lists them by school, read from the lorebook itself: one entry per spell (`[SPELL — Earth Lance]` with `School:` and `Rank:`, or `Earth Lance [Earth Magic - Intermediate]`), a spell index (`### Fire Magic` › `**Goa Series**` › `* **El Goa** – …`), or one entry per element. The HUD decides what is in reach: `Magic School: Water: Saint, Fire: Advanced` gives a rank per school; `Magic: Fire | Gate: C-Rank` gives your elements, and the Gate how high a series goes (D El, C Ul, B Al). Each spell shows as **Mastered**, **Known**, **Studying**, **Within reach**, **Next rank**, **Rank unknown** (the lorebook gives it no rank, so the story decides; shown under All), **Locked** or **Special** (unique to a character, forbidden, lost). **Usable and next** hides the rest; **All** shows everything; the search box finds a spell by name or effect. With `Casting Method: Voiceless`, the chant is marked as optional.

**Learning.** Press 📖 to study a spell. Before each reply the model is reminded what you study, with the spell's effect and chant from the lorebook, and the rule that learning takes practice and your rank. The side-panel block reports progress (a bar under the spell) and the spell once you first cast it cleanly: it moves to Known and into the Chronicle. ✓ marks a spell learned by hand; ✕ takes it off. When a school's rank goes up on the HUD, the card says which spells it just opened. Spells you know are also given to the fight setup. Being offered in a fight menu, or merely tried, never counts as learning; a spell the story shows you practising goes into Studying by itself. Lorebooks of any size are read whole, not only the first 200 entries.

### Sword techniques
The same list as the spells, for sword styles. Techniques come from the lorebook: `[TECHNIQUE — Longsword of Light]` with `Style: Sword God · Rank: Saint`, or prose such as "Sword God Technique: Silent Strike." and "… technique of the Water God Style, achieved at the Saint tier". The HUD's `Sword Style:` (or `Martial Style:`) line gives your rank in each style, so each technique shows as Known, Studying, Within reach, Next rank, Locked or Rank unknown. Study, ✓ and ✕ work as for spells; the story's report of a first clean execution makes it Known and puts it in the Chronicle. A companion lorebook, *Mushoku Tensei - Sword Techniques (Mazaki)*, gives every technique of the Sword God, Water God and North God styles a rank, plus the Greyrat Style founded by Ars Greyrat (a fan addition).

### Abilities
Your powers, skills and attributes, read from the HUD.

### Quests
- **The plot**: where the story stands, and its open threads.
- **🔫 Planted details** (Chekhov's gun): small things the story planted that should pay off later. **Ripe** ones are free to pay off. A 🔒 one waits for a time, a person or a condition. Press ✕ to drop one that does not fit.
- **Objectives**: what you are trying to do now. You can add your own. Yours are never sent to the model.
- **Quests** from the HUD, with the goal, who gave it, where, the reward, and the time left.
- **Your notes** are never sent to the model.
- If a quest drops off the HUD while still live, press **Put back**. If the bot only stopped listing it because it ended, press **It's over**.

### Chronicle
The story's timeline: key moments, milestones, how people came to feel about you, and plot points.
Filter it, star an entry, hide one, or add your own.
Settled replies are written to the Memory Cortex. See part 9.

### Chapters
Summaries of parts of the story. Press **End chapter and summarise** when a part ends.
Summaries go with every message, on top of the chat.

### OOC guide
Ask the bot's guide a question. See part 8.

### Critical
A red banner for real danger: health near zero, a condition at its worst, a wound left raw too long.

### The fight tracker
During an immersive fight: everyone's HP, MP and Stamina, effects, what each fighter just did, and a fight log.

### Fights

| Kind | How it works |
| --- | --- |
| **Immersive fight** | No window. You fight by writing in the chat. The panel tracks bodies, effects and moves. Enemies keep hidden plans. **Study** an enemy to learn its weak points. The bot's rules decide who wins. |
| **Turn-based fight** | A D&D window: initiative, attack rolls, damage dice, saving throws. The extension rolls the dice. When it ends, the aftermath is posted to the chat as a normal reply, with the HUD. |
| **Narrative window** | The old fight window. Hidden unless you switch it on in Settings → Fights → Legacy. |

### In the chat itself

- **The HUD card.** The HUD drawn as a neat card in the bot's colours. The saved reply keeps its plain text. **Show the HUD as text** opens the plain version.
- **Internal states** under each reply: tabs for Scene, People, Minds, Bonds, Plot and Map. **Minds** shows what moved inside each person in that reply.
- **Dialogue display** (off at first): an emoji for each speaker's feeling, a colour per speaker, or their name. **Tone of voice** draws a whispered line in italics, a biting one in bold.

### Test zone
A practice chat inside the extension. It runs the same code as a real chat and touches none of your chats.
**Demo** plays scripted turns for each world and costs nothing. **Live** uses your model.

---

## 7. Minds (from FrankenSIM)

**Minds** is how the people of the story feel, think and act. It comes from **FrankenSIM 4 Mini by Wireless (Ryah)**, with permission. **TFDY** (Tenderness, Fury, Dread, Yearning) is by **Pyropia**. Thank you both.

### How it works

1. The model writes the story as usual.
2. In the hidden block, it says only **what moved** inside each person in this reply, and why.
3. The extension does the math: it keeps every number, caps each step, lets old feelings fade, and remembers.
4. Before the next reply, it hands the state back to the model as memory.

The bot still wins. Its character cards say who someone is. Minds only remembers what the story showed.

### Inside a person

| Part | What it means |
| --- | --- |
| **Feeling** | What they feel now, named by where it leads (Parrott's list: love, joy, surprise, anger, sadness, fear), and at whom. |
| **TFDY** | Their mood under everything: 💗 Tenderness, 🔥 Fury, 😰 Dread, 🌙 Yearning, from 0 to 4. Each rests at a level set by their temperament. |
| **Shows** | How warm they act on the outside: ❄️ frostbound, cool, temperate, warm, 🔥 fervent. It can differ from what they feel. |
| **Mask** | The face they wear: held, cracking or off. |
| **Sides of them** | Five to seven sides from their card. One leads at a time. If the same one leads three replies running, the panel says so. |
| **Still carrying** | A strong feeling from the last few replies that has not gone away. |

### Toward you (and toward each other)

Twelve feelings, each from 1 to 20:

| Warm | Its mirror |
| --- | --- |
| 🌶️ Desire | 😠 Hate |
| 🎲 Play | 🥊 Strife |
| 🤝 Friendship | ❄️ Enmity |
| 🛠️ Partnership | 🪨 Stuck |
| 🏠 Belonging | 🌫️ Indifference |
| 🕊️ Care | 🐍 Envy |

- **A wall** (⚠️): a feeling and its mirror are both high (10 or more), like desire and hate. It comes out sideways.
- **Gate** 🚪: how far they let themselves feel: dormant, attentive, aware, longing, open. It moves one step at a time, and only for an event.
- **Shows it / Says it**: whether the feeling comes out in what they do and in what they say.
- **Filters**: what holds the feeling back (social, values, fit, ties). Each can crack open step by step. Open never closes again.
- **Owed** ⚖️: a wrong done to them. It stays until it is made good.
- **Mode**: stranger, warm, strained, hostile, lovers and more.

### The math the extension does

| Rule | What it means for you |
| --- | --- |
| **Most a feeling moves in one reply: 2** | One scene cannot flip a person. |
| **Fading: one step every 3 quiet replies** | A feeling nothing feeds goes back toward where it rests. Big feelings fade a little faster. |
| **Settling** | A feeling pushed the same way three times becomes part of who they are to you. |
| **Never 0** | Nobody feels nothing. A first meeting starts at 3 or more. |
| **Minors and family** | Never desire, never a romantic mode, whatever the model says. |
| **Return by Death** | When time goes back, everyone forgets the undone loop: its feelings, what they learned there, and their plans. Planted details stay, because you saw them. |

You can change the step size and the fading speed in Settings → **Minds**.

### Routines, knowledge and planted details

- **Routines** 📍 (FrankenSIM calls them agendas): what each person is doing, where, and until when, here or elsewhere. When the time passes, the panel says **over by**. Nobody jumps between places.
- **Who knows what**: each fact a person learned, and how: 👁️ saw it, 👂 overheard, 🗣️ told by someone, 🔎 evidence, ✉️ message, 🌐 common knowledge, 💬 gossip, 🤔 guessed. A **false belief** is underlined in red. Press ✕ if someone should not know a thing. Whoever knows one of your secrets (the Secrets card) shows it here too, with 🔒.
- **Planted details** 🔫 (Chekhov's gun): in the Quests card. The story decides when one pays off. Up to 20 are kept. Old light ones fade away.
- **Building maps**: in the Map card, from the rooms the story drew.
- **The bot's own block**: some bots (Re:Zero, for one) ask the model for their own `side_panel` block in the reply. The extension reads it into these same cards, takes it out of the saved reply, and stops asking for the parts the bot already writes, so nothing is written twice.

### Switch parts on and off

Settings → **Modules** → **Minds (from FrankenSIM)** has five switches: Minds and feelings, Routines, Who knows what, Chekhov's gun, Building maps. Settings → **Minds** has the details. **Undo my corrections** brings back facts and details you took out.

**Cost:** with everything on, about 1,000 tokens of instructions and 300 to 600 tokens of state per reply, plus what the model writes in its hidden block.

---

## 8. Ask out of character (OOC)

Each bot has a guide character who answers questions about the world, the rules and the commands.

| Bot | Guide | Trigger |
| --- | --- | --- |
| Re:Zero | Echidna | `[OOC: your question]` |
| Mushoku Tensei | Roxy | `OOC guide: your question` |
| Overlord | Demiurge | `OOC guide: your question` |
| Classroom of the Elite | Arisu Sakayanagi | `OOC guide: your question` (also `[OOC:` or `OOC:`) |

### Two ways to ask

1. **In the panel**: open the **OOC guide** card, type your question, press **Ask**. The answer stays in the panel. The story never sees it. It costs one model call.
2. **In the chat**: press **Ask in the story**, or type the trigger yourself.

You can name another guide in the **Guide** box, if the bot allows it.

### What happens on an OOC turn

- No HUD, no story, and no time passes.
- The extension adds nothing to that turn and does not read the answer as story.
- Your next normal message picks the story up again.

---

## 9. Memory: what remembers what

| Helper | Part | What it keeps | Reaches the model? |
| --- | --- | --- | --- |
| **Chronicle** | Extension | The timeline: moments, milestones, bonds, plot | Yes, through the Memory Cortex |
| **Chapters** | Extension | Summaries of story parts; loops in Re:Zero | Yes, as "the story so far", once summarised |
| **Map bank** | Extension | Every room drawn, per world | Only a short room plan when needed |
| **Minds** | Extension | Feelings, routines, who knows what, planted details | Yes, as the minds state before each reply |
| **Memory Cortex** and **Chat Memory** | Lumiverse | People, places, links between them, older passages | Yes, through the preset's Memory block |
| **Loom Summary** | Lumiverse | One summary of the story | Only if you switch on its block in the preset |

### The Chronicle and the Memory Cortex

- A reply is written to the Cortex only after you answer it. So a swipe never leaves a wrong memory.
- Each entry becomes a fact on the people it is about, with an importance tag.
- Choose how much is written: Settings → **Chronicle** → Write to the Memory Cortex. **Key moments, bonds, plot and milestones** is the default.
- **Write now** writes at once. **Write everything again** is for after a Cortex rebuild. Nothing is written twice.
- In Re:Zero, a loop undone by Return by Death is written as undone.

### Tip

Use **Chapters** or the **Loom Summary**, not both. Both would send a summary of the same story.

---

## 10. Settings, section by section

Settings opens as a list of sections. Click one to open it. Every switch has a short note under it.

| Section | What it holds |
| --- | --- |
| **Play style** | World presets (one click per bot), play styles (HMS Narrative, D&D, Power scaling, Pure narrative, Gritty survival, Social and romance), your own saved presets, the panel theme, density and text size. |
| **Modules** | Every feature in one list. Switch off what you do not use: it leaves the panel and the prompt, and costs no tokens. |
| **HMS engine** | HMS mode (automatic, always, off), the hidden block, fetching a forgotten block, the guard for dropped lines, the pin reminder. |
| **HMS systems** | How the HUD is read: pools and meters, wounds and conditions, abilities and attributes, people and their bars, your agenda, holdings, gear, money, factions, secrets and family, the phone, the party, the survival clock, injuries, experience. |
| **Minds (from FrankenSIM)** | Feelings (twelve feelings or the classic bars), between the others too, the step size, the fading speed, handing the state back, routines, who knows what, Chekhov's gun, building maps, and the credits. |
| **Quests** | The Quests card, quest details, the plot, objectives, the quest journal, quest labels and states. |
| **Chapters** | Automatic chapters for loops, arcs, days or months; summaries; whether they go with every message and with fights. |
| **Chronicle** | On or off, asking the story for key moments, and how much goes into the Memory Cortex. |
| **Lorebook context** | Which of the extension's own calls get your lorebooks, and what the last call sent. |
| **Engine core & memory** | Whether fights run on the bot's engine, and how much long-term memory they recall. |
| **General** | The master switch, Together or Separate mode, the connection for the extension's own calls, and time limits. |
| **Panels** | Which classic panels show, and bar colours. |
| **Chat and panel extras** | Internal states under each reply, the map and map bank, the HUD card, dialogue emoji, colours and names, weather effects, portraits. |
| **Characters setup** | What is asked about each character in the scene: details, thoughts, character bars. |
| **Fights** | Difficulty, how immersive fights resolve, fate dice, effects, moves, hidden plans, the legacy window. |
| **D&D** | The D&D card, the roller, the HUD's scores, turn-based fights. |
| **Story extras** | Extras from the original RPG Companion: immersive HTML, dialogue colouring, deception tags, the omniscience filter, choose your own adventure (off in HMS chats), song suggestions. |
| **Tracker field presets** | Save and load whole tracker setups, mostly for classic chats. Link one to a character. |
| **Custom prompts** | Every prompt the extension sends, editable. Empty uses the built-in one. |
| **Help & bug report** | **Open the guide**, and **Copy bug report** for Discord. No chat text unless you tick the box. |
| **Reset** | Clear this chat's trackers, or reset all settings. |

**Together or Separate?** Together (the default) gets the side-panel data in the same reply: one call. Separate makes a second call after each reply. Use Separate only if your model keeps forgetting the hidden block.

---

## 11. When something goes wrong

| Problem | What to do |
| --- | --- |
| The World State card is empty. | It says why. Often the model wrote the HUD inside its thinking. Press **Read again**. The extension also moves a HUD out of the thinking by itself. |
| A card did not update. | Press **Read again**. It is free. |
| "The reply left out the side-panel block." | The extension fetches it with a quick second call. If it happens a lot, use **Separate** mode (Settings → General). |
| A HUD line vanished. | Press **Restore** in the World State card. Pin the line if it keeps happening. |
| The reply has no HUD at all. | Press **Put the last HUD back**, or swipe for a new reply. |
| The HUD header shows twice. | The extension keeps one by itself. If it keeps happening, set the preset's HUD header slider to **Never**. |
| "The Arc line loads no arc entry." | Press **Use** to put in the book's spelling. |
| An OOC answer came back with a HUD or a story. | Check the trigger is at the very start of your message, like `[OOC: ...]`. |
| No emoji or dialogue colours. | They are off at first: Settings → Chat and panel extras → Dialogue. |
| The New game card does not show. | It only shows on a new chat whose first message has catalog pages. |
| The D&D card shows in a game without dice. | Use your world's preset, or switch D&D off in Settings → Modules. |
| "Your provider allows only one request at a time." | Wait for the reply to finish, then press **Refresh**, or **Read again** (free). |
| A permission is missing. | Grant it in the Extensions panel. The part that needs it says which one. |
| Someone knows something they could not know. | Open their card → Inside, feelings and what they know → press ✕ on the fact. |
| A planted detail does not fit the story. | Quests card → Planted details → press ✕. |
| Someone's feelings look wrong. | They move at most 2 per reply, so give the story a few replies. If the relationship itself is wrong, use **Set the bond**. |
| Too many tokens. | Switch off parts of Minds in Settings → Modules. |
| Something else. | Settings → **Help & bug report** → **Copy bug report**, and paste it in the Discord. |

### What it costs

- The hidden-block request is about 1,000 to 1,700 tokens per reply, depending on what is switched on.
- Minds adds about 1,000 tokens of instructions and 300 to 600 tokens of state per reply. Switch parts off to save.
- Modules you switch off cost nothing.
- Fights, the OOC guide and chapter summaries each make their own call when you use them.

---

## 12. Words used in this guide

| Word | Meaning |
| --- | --- |
| **HMS** | The game engine inside the bot's card. |
| **HUD** (WORLD STATE) | The block at the top of each reply: time, place, arc, powers and more. |
| **The wall** | The `***` line under the HUD. The story starts after it. |
| **STATE IS GOD** | The bots' rule: the HUD is true, and the story must agree with it. |
| **Carrier line** | A HUD line whose words keep a lorebook entry loaded, like the Arc line. |
| **Start handler** | The bot's start line, like `ReZero_Start_Handler`. Your first message begins with it. |
| **Catalog** | The pages of the bot's first message: how to start, and all the commands. |
| **Canvas** | The almost empty catalog page you type your start under. |
| **OOC** | Out of character: a question to the bot's guide, outside the story. |
| **Hidden block** | The small `<rpg_companion>` data after the story. The extension reads it and removes it. |
| **Pin** | Keep a HUD line exactly as it is. |
| **Guard** | The check for HUD lines that vanished. |
| **Swipe** | Another version of a reply. The extension follows the swipe you keep. |
| **Lorebook** | The bot's world entries. A keyword in the chat loads an entry. |
| **Memory Cortex** | Lumiverse's memory of people, places and their links. |
| **Preset** | The prompt recipe Lumiverse sends to the model. Here: HMS Reporter beta. |
| **Extension** | An add-on for Lumiverse. Here: RPG Companion HMS Edition. |
| **Together / Separate** | Whether the side-panel data comes in the same reply, or from a second call. |
| **Settled reply** | A reply you have answered. It can no longer be swiped away. |
| **Minds** | How people feel, think and act, from FrankenSIM. The extension keeps the numbers. |
| **TFDY** | Tenderness, Fury, Dread, Yearning: a person's mood under everything, 0 to 4. By Pyropia. |
| **Shows (IW)** | How warm a person acts on the outside. FrankenSIM calls it Inner Weather. |
| **The twelve feelings** | Desire, Play, Friendship, Partnership, Belonging, Care, and their mirrors Hate, Strife, Enmity, Stuck, Indifference, Envy. |
| **Settles at** | Where a feeling rests. It moves slowly, when a feeling is pushed the same way again and again. |
| **Wall** | A feeling and its mirror both high at once. |
| **Gate** | How far a person lets themselves feel for someone. |
| **Routine** | What a person is doing, where, and until when. |
| **Chekhov's gun** | A detail the story planted that should pay off later. |
