const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runtime, seed } = require('./test_panel_tracking.cjs');
const fixture = JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync(path.join(__dirname, 'updated_six_sided_fixture.json.gz'))).toString('utf8'));
const plain = value => JSON.parse(JSON.stringify(value));
function pair() {
    const visual = fixture.visualTemplate
        .replace('K[Y], Month [m], Day [d]', 'K417, Thawmoon (Month 2), Day 8 — Dragonsday')
        .replace('[HH:MM] ([Period])', '08:40 (Morning)')
        .replace('[Continent] → [Region] → [Spot]', 'Central Continent → Asura Kingdom, Fittoa Region → House King Estate, training yard')
        .replace('[Race]', 'Human').replace('[Origin]', 'Native').replace('[N] (born K[year], Month [m])', '13 🎂 (born K404, Month 2)')
        .replace('[Era / Arc]', 'Sandbox: Fittoa Region — K417 (canon: Arc 2.5)')
        .replace('🧠 **Memory:** [..] · 🎮 **Game Mode:** [..]', '🧠 **Memory:** Memory 1 · 🎮 **Game Mode:** Sandbox')
        .replace('💧 **Mana Capacity:** [..] · **Reserve:** [..] · **Status:** [..]', '💧 **Mana Capacity:** Shown: None · **True:** Vast · **Reserve:** Full · **Status:** Rested')
        .replace('🔥 **Touki (Battle Aura):** [..]', '🔥 **Touki (Battle Aura):** Active (basic control)')
        .replace('⚔️ **Sword Style:** [..]', '⚔️ **Sword Style:** Sword God (Intermediate), Water God (Beginner)')
        .replace('✨ **Magic Tiers:** [..]', '✨ **Magic Tiers:** Water (Intermediate), Earth (Intermediate), Fire (Beginner)')
        .replace('🤫 **Voiceless Casting:** [..]', '🤫 **Voiceless Casting:** Active')
        .replace('👁️ **[DEMON EYE]:** [..]', '👁️ **[DEMON EYE]:** Foresight (Dormant)')
        .replace('☠️ **[CURSE / BLESSING]:** [..]', '☠️ **[CURSE / BLESSING]:** Glass Body — Cursed One (Congenital)')
        .replace('🎒 **Equipment:** [..]', '🎒 **Equipment:** inscribed sword · **Status:** ceremonial family keepsake')
        .replace('🏅 **Guild:** [..] · **Epithet:** [..]', '🏅 **Guild:** unregistered · **Epithet:** Unknown')
        .replace('⚠️ **[TURNING POINT]:** [..]', '⚠️ **[TURNING POINT]:** 1 ACTIVE')
        .replace('⏳ **Next Canon Event:** [..]   (Canon: Living → 📖 **Canon reference:** [..])', '📖 **Canon reference:** Arc 2.5 — Eve of the Calamity\n⚠️ **World event:** The Mana Calamity — in 2 months (K417, Month 5)')
        .replace('🔀 **Active Paths:** [..]', '🔀 **Active Paths:**\n- Canon: Living · **Guide:** Off\n- Divergence: A saved village\n  ⚠️ Checkpoint: The village survives')
        .replace('👥 **Present:** [Name] ([age]) · [Name] ([age])', '👥 **Present:** Bram Vale (40) · Tess Vale (38)')
        .replace('🎭 **Narrative Mode:** [..]', '🎭 **Narrative Mode:** Strict Agency');
    // Real template with filled values; canonical counterpart written independently.
    const classic = `### WORLD STATE ###
Armored Dragon Calendar: K417, Thawmoon (Month 2), Day 8 — Dragonsday | Time: 08:40 (Morning)
◆ Central Continent → Asura Kingdom, Fittoa Region → House King Estate, training yard
Race: Human | Origin: Native | Age: 13 🎂 (born K404, Month 2)
Sandbox: Fittoa Region — K417 (canon: Arc 2.5)
Memory: Memory 1 | Game Mode: Sandbox
Mana Capacity: Shown: None | True: Vast | Reserve: Full | Status: Rested
Touki (Battle Aura): Active (basic control)
Sword Style: Sword God (Intermediate), Water God (Beginner)
Magic Tiers: Water (Intermediate), Earth (Intermediate), Fire (Beginner)
Voiceless Casting: Active
[DEMON EYE: Foresight (Dormant)]
[CURSE / BLESSING: Glass Body — Cursed One (Congenital)]
Equipment: inscribed sword · **Status:** ceremonial family keepsake
Guild: unregistered | Epithet: Unknown
[TURNING POINT: 1 ACTIVE]
Canon reference: Arc 2.5 — Eve of the Calamity
World event: The Mana Calamity — in 2 months (K417, Month 5)
Active Paths:
- Canon: Living | Guide: Off
- Divergence: A saved village
  Checkpoint: The village survives
Present: Bram Vale (40) · Tess Vale (38)
Narrative Mode: Strict Agency
***`;
    return { classic, visual };
}
const cases = [];
const test = (name, run) => cases.push({ name, run });
const r = runtime();
const { classic, visual } = pair();

test('actual Visual template and Classic state agree without altering prose or raw style', async () => {
    const a = r.ctx.parseHud(classic), b = r.ctx.parseHud(visual);
    assert(b); assert.equal(b.style, 'visual'); assert.equal(a.style, 'classic');
    assert.deepEqual(plain(b.location), plain(a.location)); assert.equal(b.time, a.time);
    assert.deepEqual(plain(r.ctx.hmsReadSystems(b)), plain(r.ctx.hmsReadSystems(a)));
    assert.deepEqual(plain(r.ctx.worldMushoku('updated', r.ctx.worldLines(b), {})), plain(r.ctx.worldMushoku('updated', r.ctx.worldLines(a), {})));
    assert(b.lines.some(x => x.text === '  Checkpoint: The village survives'));
    assert(b.lines.some(x => x.text.includes('inscribed sword · **Status:** ceremonial family keepsake')));
    assert(b.lines.some(x => x.text === 'Present: Bram Vale (40) · Tess Vale (38)'));
    const prose = '\nRin says, **“Bram · Tess → wait!”** ⚠️';
    const out = await r.ctx.hmsProcessContent('format', visual + prose, null, 'normal', {});
    assert.equal(out.content, visual + prose);
    assert.equal(r.ctx.hudToBlock(b), visual);
    assert.equal(r.ctx.mtCalendar(b.lines[0].text).month, 2);
    assert.equal(r.ctx.mtPowerViews(b.lines.find(x => /^Mana Capacity:/.test(x.text)).text.replace(/^Mana Capacity:\s*/, '')).shown, 'None');
    assert.equal(r.ctx.worldMushoku('updated', r.ctx.worldLines(b), {}).mana, 'Vast');
});

test('Visual pins preserve icons, dividers, header and narration', () => {
    const out = r.ctx.rewriteHud(visual + '\nDo not **change · this**.', items => {
        const item = items.find(x => x.key === 'equipment'); item.text = 'Equipment: wooden sword'; return true;
    });
    assert(out.content.includes('### 🌐 WORLD STATE ###'));
    assert.equal((out.content.match(/━━━━━━━━━━━━━━━━━━━━/g) || []).length, 2);
    assert(out.content.includes('🎒 **Equipment:** wooden sword'));
    assert(out.content.endsWith('Do not **change · this**.'));
    assert.equal(r.ctx.collapseDuplicateHudHeads('### WORLD STATE ###\n'+visual).split('\n')[0], '### 🌐 WORLD STATE ###');
});

test('numbered calendar, birthday, rollover and future countdown stay distinct from outcomes', () => {
    const b = r.ctx.parseHud(visual.replace('Thawmoon (Month 2)', 'Month 2'));
    assert.equal(r.ctx.mtCalendar(b.lines[0].text).month, 2);
    const rows = [classic.replace('Thawmoon (Month 2), Day 8', 'Month 12, Day 30').replace('K417, Month', 'K417, Month'), classic.replace('Thawmoon (Month 2), Day 8', 'Month 1, Day 1').replace('K417, Month', 'K418, Month')].map((content,i) => ({id:'c'+i,role:'assistant',content}));
    assert.equal(r.ctx.hmsTimeline(rows)[1].clock-r.ctx.hmsTimeline(rows)[0].clock, 1440);
    assert.equal(r.ctx.atlasCalamityState(b, []), 'before');
    const st = r.ctx.emptyChatState(), chat = [{id:'a',role:'assistant',content:visual}];
    assert.equal(r.ctx.mtEventLedger(chat).length, 0);
    assert.equal(r.ctx.agendaRead(chat, st).items.length, 0);
    assert.equal(r.ctx.simFold(chat, st).knows.size, 0);
    assert.equal(r.ctx.worldMushoku('updated',r.ctx.worldLines(b),st).birthMonth, 2);
});

test('curse and tether variants retain literal modifiers and deduplicate equivalent effects', () => {
    const forms = ['Curse: Glass Body — Cursed One (Congenital)', '[CURSE: Glass Body — Cursed One (Congenital)]', '☠️ **Curse:** Glass Body — Cursed One (Congenital)'];
    const mods = form => r.ctx.hmsReadAbilities(r.ctx.parseHud(classic.replace('[CURSE / BLESSING: Glass Body — Cursed One (Congenital)]', form)), r.run('hmsCfg()')).find(x => x.category === 'Modifiers').items;
    const names = forms.map(form => mods(form).find(x => x.name.includes('Glass Body')).name);
    assert(names.every(x => x === names[0]));
    const more = classic.replace('[CURSE / BLESSING: Glass Body — Cursed One (Congenital)]', forms.join('\n')+'\n[🔗 SOUL TETHER: Tess Vale]\n[ARBITRARY NOTE: not a power]');
    const groups = r.ctx.hmsReadAbilities(r.ctx.parseHud(more),r.run('hmsCfg()'));
    assert.equal(groups.find(x=>x.category==='Modifiers').items.filter(x=>x.name.includes('Glass Body')).length,1);
    assert.equal(groups.find(x=>x.category==='Modifiers').items.find(x=>x.name==='Soul Tether').state,'Tess Vale');
    assert(!groups.flatMap(x=>x.items).some(x=>x.name.includes('not a power')));
});

test('full updated book extracts spells, qualified chants, arcs, mana and reference-only places', () => {
    assert.equal(fixture.entries.length,1296);
    r.ctx.setLorePool('updated',fixture.entries.map(e=>r.ctx.loreNormEntry(e)));
    const cat=r.ctx.spellCatalog('updated');
    assert.equal(cat.length,111); assert.equal(cat.filter(x=>x.chant).length,25);
    for(const name of ['Healing','X-Healing','Illusion Barrier']) {
        const spell=cat.find(x=>x.name===name); assert(spell?.chant); assert(spell.chantSource);
        assert(!spell.chant.includes('[LN')); assert(!/"$/.test(spell.chant));
    }
    assert(cat.find(x=>x.name==='Illusion Barrier').chant.length>200,'Long chant was truncated');
    assert.equal(cat.find(x=>x.name==='Quagmire').kind,'melded');
    assert.equal(cat.find(x=>x.name==='Waterfall').rank,null);
    assert.equal(r.ctx.mtArcList('updated').length,22);
    assert.equal(fixture.entries.filter(e=>/^\s*\[WORLD STATE\s*[—–-]\s*ARC/i.test(e.content)).length,22);
    assert.equal(r.ctx.mtCanonSchedule('updated').length,64);
    assert.equal(r.ctx.mtArcList('updated').find(x=>x.no===5).year,419);
    assert(cat.some(x=>x.fan));assert(cat.some(x=>x.kind==='unique'));
    const before=r.ctx.atlasMushokuReferences(r.ctx.atlasMushokuTemporalEntries(fixture.entries.map(e=>r.ctx.loreNormEntry(e)), 'before'));
    assert(!before.some(x=>/PATH:.*Roa Ruins/.test(x.content)));
    assert(r.ctx.mtManaTierLore('updated','Vast').includes('6,000'));
    const entries=fixture.entries.map(e=>r.ctx.loreNormEntry(e)), atlas=r.ctx.atlasMushokuReferences(entries);
    assert.equal(atlas.length,57);
    assert(atlas.some(x=>/PATH:.*Fittoa Region → Roa/.test(x.content)));
    assert(!atlas.some(x=>/PATH:.*(?:Smuggling Ring|Adventurers Guild)$/.test(x.content)));
    assert(fixture.entries.some(x=>/Dossier v2/.test(x.comment||'')));
    assert.equal(r.ctx.spellKnown([{id:'rank-only',role:'assistant',content:visual+'\nA teacher offers a lesson. Rin attempts Quagmire unsuccessfully.'}],r.ctx.emptyChatState(),null,'updated').size,0);
    assert.equal(r.ctx.simFold([],r.ctx.emptyChatState()).knows.size,0);
    assert.equal(r.ctx.spellCatalog('unattached').length,0);
});

test('HUD examples in quotes and code are not current state; Continue selects the first current HUD', () => {
    assert.equal(r.ctx.parseHud('```text\n'+classic+'\n```'),null);
    assert.equal(r.ctx.parseHud('<pre><code>'+classic+'</code></pre>'),null);
    assert.equal(r.ctx.parseHud(classic.split('\n').map(l=>'> '+l).join('\n')),null);
    const old=classic.replace('K417,','K410,');
    const input='Mushoku_Continue_Handler\n```text\n'+visual+'\n```\n```text\n### SAVE NOTES ###\nLast scene: at the yard\n```\nRecent messages:\n'+old;
    const chosen=r.ctx.resumeHudText(input);
    assert(chosen.includes('K417')); assert(!chosen.includes('K410'));
    assert.equal(r.ctx.cardTurnPurpose(input),'continue');
    assert.equal(r.ctx.cardTurnPurpose('Mushoku_Start_Handler\n'+visual),'continue');
    assert.equal(r.ctx.cardTurnPurpose('Please explain Mushoku_Save.'),'story');
    assert.equal(r.ctx.cardTurnPurpose('> Mushoku_Save'),'story');
});

test('Save preserves gameplay state and makes no tracker, metadata or event writes', async () => {
    for(const command of ['Mushoku_Save','[SAVE GAME]']) {
        const rt=runtime();seed(rt);await rt.ctx.runSeparateUpdate('test');
        const before=plain(rt.ctx.hmsPanelState('test',await rt.ctx.chatApi?.getMessages?.('test')||rt.messages,await rt.ctx.getChatState('test')));
        const oldWrites=rt.writes.length;let calls=0;rt.quiet(()=>{calls++;});
        rt.messages.push({id:'save-command',role:'user',content:command},{id:'save',role:'assistant',content:'```text\n'+classic+'\n```\n```text\n### SAVE NOTES ###\nPossessions & money: old sword; 3 copper\nKnown spells: Earth Spear\n```\n(OOC) Saved.'});
        await rt.run("rpgcGenEnded({chatId:'test',messageId:'save',generationType:'normal'})");
        await rt.ctx.runSeparateUpdate('test','save');
        assert.equal(calls,0);assert.equal(rt.writes.length,oldWrites);
        const after=rt.events.filter(x=>x.type==='state').at(-1);
        assert.equal(after.hms.messageId,'a1');
        assert.equal(after.hms.magic.spellbook.length,before.magic.spellbook.length);
        const parts=await rt.ctx.hmsRequestParts('test',rt.messages,'normal',null,'Rin',true);
        assert.equal(parts.length,0);
    }
});

test('Continue is a HUD restoration baseline, preserves manual data, and does not replay saved deltas', async () => {
    const rt=runtime();seed(rt);rt.messages.length=0;
    const st=await rt.ctx.getChatState('test');st.spellbook=[{name:'Manual Spark',from:'you'}];st.locks={userStats:true};
    rt.messages.push({id:'resume-input',role:'user',content:'Mushoku_Continue_Handler\n```\n'+visual+'\n```\n### SAVE NOTES ###\nLast scene: the yard\nRecent messages:\n'+classic.replace('K417,','K410,')},{id:'resume',role:'assistant',content:visual+'\nThe interrupted scene resumes.'});
    let calls=0;rt.quiet(()=>{calls++;});await rt.run("rpgcGenEnded({chatId:'test',messageId:'resume',generationType:'normal'})");
    await rt.ctx.runSeparateUpdate('test','resume');
    assert.equal(calls,0);assert.equal(rt.writes.length,0);
    const state=rt.events.filter(x=>x.type==='state').at(-1);
    assert.equal(state.world.year,417);
    assert.equal(st.spellbook[0].name,'Manual Spark');assert.equal(st.locks.userStats,true);
    assert.equal(state.hms.money.ledger.length,0);
    assert.equal(state.hms.agenda.items.length,0);
    assert.equal(rt.ctx.cardTurnPurpose('Mushoku_Continue_Handler'),'continue');
    const out=rt.ctx.cardRequestPurpose([{role:'user',content:'Mushoku_Continue_Handler',__isChatHistory:true}],rt.messages.slice(0,1),'normal');
    assert(out.some(x=>x.content.includes('No supplied HUD')));
});

test('updated attached book paginates completely, caches and isolates other books', async () => {
    const rt=runtime();const book='updated-book';const rows=fixture.entries.map((entry,i)=>({...entry,id:'updated-'+i,world_book_id:book}));const offsets=[];
    rt.ctx.setLorePool('updated',rows.slice(0,4));
    rt.ctx.spindle.world_books.entries={async list(id,options){assert.equal(id,book);offsets.push(options.offset);return {data:rows.slice(options.offset,options.offset+options.limit),total:rows.length};}};
    const full=await rt.ctx.loreHydrateCatalog('updated');assert.equal(full.entries.length,1296);assert.equal(offsets.length,7);
    assert.equal(rt.ctx.spellCatalog('updated').length,111);await rt.ctx.loreHydrateCatalog('updated');assert.equal(offsets.length,7);
    rt.ctx.setLorePool('updated',[{id:'elsewhere',world_book_id:'another-book',key:['Other world'],content:'Other world'}]);
    assert.equal(rt.ctx.spellCatalog('updated').length,0);
});

test('actual transport receives purpose scope and keeps schema last; story/help/save scopes deduplicate', async () => {
    const rt=runtime();seed(rt);let request;
    rt.quiet(x=>{request=x;});await rt.ctx.runSeparateUpdate('test');
    assert.equal(request.messages.filter(x=>x.content.startsWith('[RPG Companion — auxiliary operation]')).length,1);
    assert(request.messages.at(-1).content.includes('<rpg_companion>'));
    assert(request.messages.some(x=>x.content.includes('No standalone HUD')));
    const again=rt.ctx.auxiliaryRequest(request,'calculation');assert.equal(again.messages.length,request.messages.length);
    for(const [command,word] of [['I wait.','Ordinary gameplay'],['Mushoku_Save','Card save utility'],['OOC: explain ranks','OOC help utility'],['Mushoku_Continue_Handler','Card continuation']]) {
        const chat=[{id:'prior',role:'assistant',content:visual},{id:'u',role:'user',content:command}];
        const input=[{role:'assistant',content:'Quoted [RPG Companion — request purpose]',__isChatHistory:true},{role:'user',content:command,__isChatHistory:true}];
        const out=rt.ctx.cardRequestPurpose(input,chat,'normal');assert(out.some(x=>!x.__isChatHistory&&x.content.includes(word)));
        assert.equal(rt.ctx.cardRequestPurpose(out,chat,'normal').length,out.length);
    }
    const help=rt.ctx.auxiliaryRequest({messages:[{role:'user',content:'Help'}]},'help');assert(help.messages.some(x=>x.content.includes('No private NPC knowledge')));
});

(async()=>{let failed=0;for(const {name,run} of cases){try{await run();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.stack);}}console.log(`Updated Six-Sided: ${cases.length-failed}/${cases.length} groups passed.`);if(failed)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});

