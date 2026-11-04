// Writes a synthetic Six-Sided World v1.1 session as a chat export, for tools/replay_check.cjs and
// tools/compare_backends.cjs: 60 replies that switch HUD style (Classic, Visual, Compact, Panel), carry a
// wound from Raw to gone, train Healing to Advanced, learn a language, join a faction, move a bond,
// change who is present and tick the canon clock, with side-panel reports on every reply.
// Synthetic only. Run: node tools/sim_six_sided_v11.cjs <out.json> [replies]
const fs = require('node:fs');
const [out, count = '60'] = process.argv.slice(2);
if (!out) { console.error('usage: node tools/sim_six_sided_v11.cjs <out.json> [replies]'); process.exit(2); }
const N = Math.max(8, Number(count) || 60);
const SHORT = { Beginner: 'Beg', Intermediate: 'Int', Advanced: 'Adv', Saint: 'Saint', King: 'King', Imperial: 'Imp', Divine: 'Div' };
const ICON = { Water: '💧', Earth: '🪨', Healing: '✚' };
const rows = list => list.map(([a, b]) => `${a} (${b})`).join(', ');
function hud(s, style) {
    if (style === 'visual') return ['### 🌐 WORLD STATE ###', `🗓️ **Armored Dragon Calendar:** ${s.date} · 🕰️ **Time:** ${s.time} (${s.period})`, `📍 **Central Continent → Asura Kingdom → ${s.spot}**`,
        `🧬 **Race:** Human · **Origin:** Reincarnate · **Age:** 10 (born K407, Month 1)`, `📖 **Era / Arc:** ${s.arc}`, '━━━━━━━━━━━━━━━━━━━━',
        `🧠 **Memory:** Memory 1 · 🎮 **Game Mode:** Twin Soul`, `💧 **Mana Capacity:** Vast · **Reserve:** ${s.reserve} · **Status:** Rested`, `🔥 **Touki (Battle Aura):** Locked`,
        `⚔️ **Sword Style:** ${rows(s.sword)}`, `✨ **Magic Tiers:** ${rows(s.magic)}`, `🤫 **Voiceless Casting:** Active`, `🗣️ **Languages:** ${s.langs}`,
        s.training && `📈 **Training:** ${s.training}`, s.condition && `🩹 **Condition:** ${s.condition}`, `🎒 **Equipment:** ${s.equipment}`,
        `👑 **Standing:** ${s.standing}${s.faction ? ` · **Faction:** ${s.faction}` : ''}`, `🤝 **Bonds:** ${s.bonds}`, '━━━━━━━━━━━━━━━━━━━━', s.canon,
        s.present && `👥 **Present:** ${s.present}`, `🎭 **Narrative Mode:** Balanced`, '***'].filter(Boolean).join('\n');
    const compact = style === 'compact';
    return ['### WORLD STATE ###', `Armored Dragon Calendar: ${s.date} | Time: ${s.time}${compact ? '' : ` (${s.period})`}`,
        compact ? `◆ ${s.spot.split(', ').reverse().join(', ')}, Asura Kingdom (Central Continent)` : `◆ Central Continent → Asura Kingdom → ${s.spot}`,
        `Race: Human | Origin: Reincarnate | Age: 10${compact ? '' : ' (born K407, Month 1)'}`, `Era / Arc: ${s.arc}`, !compact && 'Memory: Memory 1', 'Game Mode: Twin Soul',
        compact ? `Mana Capacity: Vast | ${s.reserve} | Rested · Touki (Battle Aura): Locked` : `Mana Capacity: Vast | Reserve: ${s.reserve} | Status: Rested`,
        !compact && 'Touki (Battle Aura): Locked', !compact && `Sword Style: ${rows(s.sword)}`, !compact && `Magic Tiers: ${rows(s.magic)}`, !compact && 'Voiceless Casting: Active',
        compact && `Skills: ${s.magic.map(([a, b]) => `${ICON[a]}${a} ${SHORT[b]}`).join(' · ')} · ${s.sword.map(([a, b]) => `⚔️${a} ${SHORT[b]}`).join(' · ')} · 🤫 Voiceless`,
        `Languages: ${s.langs}`, s.training && `Training: ${s.training}`, s.condition && `Condition: ${s.condition}`, !compact && `Equipment: ${s.equipment}`,
        `Standing: ${s.standing}${s.faction ? ` · Faction: ${s.faction}` : ''}`, `Bonds: ${s.bonds}`, s.canon, s.present && `Present: ${s.present}`, 'Narrative Mode: Balanced', '***'].filter(Boolean).join('\n');
}
const styleAt = i => ['classic', 'classic', 'visual', 'visual', 'compact', 'compact', 'panel'][Math.floor(i / 4) % 7];
const msgs = [];
let id = 0;
const push = (m) => msgs.push({ id: `s${++id}`, swipe_id: 0, ...m });
push({ role: 'user', is_user: true, name: 'Test Hero', content: 'Start: Social: Noble (Knight, House Greyrat, Asura, Younger Child). Faction Start: House Boreas service. HUD: Classic' });
for (let i = 0; i < N; i++) {
    const day = 12 + i;
    const month = 4 + Math.floor((day - 1) / 30), d = ((day - 1) % 30) + 1;
    const sessions = Math.min(25, 7 + Math.floor(i * 1.5));
    const advanced = i >= 30;
    const s = {
        date: `K417, Month ${month}, Day ${d}`, time: `${String(8 + (i % 10)).padStart(2, '0')}:00`, period: i % 10 < 4 ? 'Morning' : 'Afternoon',
        spot: i % 3 === 0 ? 'Roa, Boreas Manor' : i % 3 === 1 ? 'Roa, Boreas Manor, Training Yard' : 'Roa, Market Square', arc: 'Sandbox: Fittoa Region — K417 (canon: Arc 2)',
        reserve: i % 2 ? 'Half' : 'Full', sword: [['Sword God', i >= 40 ? 'Advanced' : 'Intermediate']],
        magic: [['Water', 'Saint'], ['Earth', 'Advanced'], ['Healing', advanced ? 'Advanced' : 'Intermediate']],
        langs: i >= 20 ? 'Human-Tongue (Fluent, reads), Demon-Tongue (Conversational), Japanese (Fluent, reads)' : 'Human-Tongue (Fluent, reads), Demon-Tongue (Basic), Japanese (Fluent, reads)',
        training: advanced ? null : `Healing → Advanced (${sessions}/25 sessions)`,
        condition: i < 3 ? 'Cut forearm — Raw' : i < 8 ? 'Cut forearm — Treated, Fatigued' : i < 12 ? 'Cut forearm — Healing' : null,
        equipment: "Roxy's wand, travel cloak", standing: 'Noble — Knight, House Greyrat (Asura), Younger Child',
        faction: i >= 10 ? `Boreas Household (${i >= 35 ? 'Tutor' : 'Page'})` : null,
        bonds: `Eris Boreas Greyrat (${i >= 25 ? 'Trusted' : 'Friend'}), Ghislaine Dedoldia (Acquaintance)`,
        canon: `⏳ Next Canon Event: The Mana Calamity — in ${Math.max(1, 9 - Math.floor(i / 30))} months (K418)`,
        present: i % 5 === 4 ? null : 'Eris Boreas Greyrat (10), Ghislaine Dedoldia (28, b. K389)',
    };
    const style = styleAt(i);
    const prose = `Day ${d}. Eris pulls you to the yard again; Ghislaine counts your footwork. ${i % 4 === 0 ? 'You buy bread for 2 copper at the market.' : 'You practise healing on a scraped knee.'}`;
    const data = {
        characters: s.present ? [{ name: 'Eris Boreas Greyrat', emoji: '🔥', details: { demeanor: 'impatient' }, thoughts: { content: 'Again!' } }, { name: 'Ghislaine Dedoldia', emoji: '🐺', details: { demeanor: 'calm' }, thoughts: { content: 'Better.' } }] : [],
        relations: [{ key: 'eris boreas greyrat', name: 'Eris Boreas Greyrat', standing: i >= 25 ? 'Close' : 'Friend', bond: 'student, sparring partner', minor: true, mood: 'fierce', why: i === 25 ? 'you took a blow for her' : null }],
        quests: [{ key: 'teach eris', questId: 'q_teach', name: 'Teach Eris to read', objective: i < 30 ? 'Get Eris to sit through a lesson' : 'Finish the primer with Eris', progress: (i % 30) * 3, giver: 'Philip Boreas Greyrat', category: 'main', state: 'active', cls: 'active' }],
        agenda: [{ key: 'eris birthday', what: "Eris's tenth birthday", with: 'Eris Boreas Greyrat', where: 'Boreas Manor', when: 'Month 5', due: 'K417-05-01', kind: 'event', state: 'open' }],
        gear: [{ key: "roxy's wand", name: "Roxy's wand", state: 'on body', where: 'belt', inside: null }],
        money: i % 4 === 0 ? [{ amount: 2, currency: 'copper', kind: 'expense', dir: 'out', what: 'bread', with: 'baker' }] : [],
        survival: { mood: 'focused', spells: ['Healing', 'Water Ball'].filter(x => x !== 'Healing'), learned: [], mastered: [], study: [], abilities: [] },
        plot: { now: 'Tutoring at Boreas Manor.', threads: [{ name: 'The Mana Calamity', state: 'open', note: 'Months away.' }], canonEvents: [] },
    };
    push({ role: 'assistant', is_user: false, name: 'Mushoku Tensei RPG - Six-Sided World', content: `${hud(s, style)}\n${prose}`, extra: { spindle_metadata: { rpg_companion: { swipes: { 0: data } } } } });
    push({ role: 'user', is_user: true, name: 'Test Hero', content: i === 13 ? '[HUD = VISUAL] I keep training.' : 'I keep training.' });
}
fs.writeFileSync(out, JSON.stringify({ messages: msgs }));
console.log(`wrote ${msgs.length} messages (${N} replies) to ${out}`);
