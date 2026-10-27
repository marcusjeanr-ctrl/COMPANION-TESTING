// Synthetic legal HUDs derived from the supplied card description and entries
// 1116, 1169, 1195-1196, 1199, 1202-1206, 1230-1231. No model is called.
const assert = require('node:assert/strict');
const path = require('node:path');
const {runtime} = require('./test_panel_tracking.cjs');
const rt = runtime(process.argv[2] ? path.resolve(process.argv[2]) : undefined), c = rt.ctx;
const plain = x => JSON.parse(JSON.stringify(x));
const classic = `### WORLD STATE ###
Armored Dragon Calendar: K450, Month 4, Day 1 | Time: 09:40 (Morning)
◆ Demon Continent → Rikarisu, Guild Hall
Race: Migurd | Origin: Native | Age: 52 (looks 15)
Sandbox: Rikarisu — K450
Mana Capacity: None | Reserve: Empty | Status: Rested
Touki (Battle Aura): Locked
Guild: F (0/25 to E) | Purse: 5 stone coins
[DEMON EYE: Foresight (Sealed)]
[CURSE / BLESSING: Ageless]
Canon: None
Narrative Mode: Strict Agency
***`;
const visual = classic.replace('### WORLD', '### 🌐 WORLD')
    .replace('Sandbox: Rikarisu — K450', '📖 **Era / Arc:** Sandbox: Rikarisu — K450')
    .replace('[DEMON EYE: Foresight (Sealed)]', '👁️ **[DEMON EYE]:** Foresight (Sealed)')
    .replace('[CURSE / BLESSING: Ageless]', '☠️ **[CURSE / BLESSING]:** Ageless');
const cases = [];
function test(name, fn) { cases.push([name, fn]); }
function world(text) { return c.worldMushoku('integration', c.worldLines(c.parseHud(text)), {}); }
test('Visual era and bracket labels preserve the same World projection as Classic', () => {
    const a = world(classic), b = world(visual);
    assert.equal(b.saga.personalArc, a.saga.personalArc);
    assert.equal(b.saga.participation, 'personal');
    assert.equal(b.canon, 'None');
    assert.equal(b.eyes.length, 1); assert.equal(b.eyes[0].text, 'Foresight (Sealed)');
    assert.equal(a.marks.length, 1); assert.equal(b.marks.length, 1);
    assert.equal(b.marks[0].kind, 'CURSE / BLESSING'); // do not invent which one
    assert.equal(b.marks[0].name, 'Ageless');
    assert.equal(b.adventurer.rank, 'F');
    assert.equal(world(classic.replace('Guild: F (0/25 to E)', 'Guild: Magic Guild')).adventurer, null);
});
test('long-lived and non-caster identity/geography remain literal and unknown-safe', () => {
    assert.equal(world(classic.replace('Age: 52 (looks 15)', 'Age: 1200 (body 25 — Ageless)')).age, 1200);
    assert.equal(world(classic.replace('Age: 52 (looks 15)', 'Age: unknown')).age, null);
    assert.equal(world(classic).birth, null);
    const sparse = classic.replace(/^Mana Capacity:.*\n/m, '').replace(/^Touki.*\n/m, '');
    assert.deepEqual(plain(c.parseHud(sparse).location), ['Demon Continent', 'Rikarisu', 'Guild Hall']);
    assert.equal(world(sparse).mana, null); assert.equal(world(sparse).magic.length, 0);
});
test('an established player in the roster never receives NPC minds or routines', () => {
    const roster = [{name:'Rin Vale',key:'rin vale',aliases:['The Cartographer']}, {name:'Rin Reed',key:'rin reed'}];
    const key = c.simKeyer(roster, c.simYouKeys('Rin Vale'));
    assert.equal(key('Rin Vale'), '@you');
    assert.equal(key('The Cartographer'), '@you');
    assert.equal(key('Rin Reed'), 'rin reed');
    assert.equal(key('you'), '@you');
    const st = c.emptyChatState(); st.party.members = roster;
    const message = {id:'m',role:'assistant',content:classic,metadata:{rpg_companion:{swipes:{0:{
        characters:[{name:'Rin Vale'}], minds:[{name:'Rin Vale',feel:{p:'fear'}},{name:'Rin Reed',feel:{p:'joy'}}],
        agendas:[{name:'The Cartographer',doing:'chooses to betray the party'}]
    }}}}};
    const fold = c.simFold([message], st, {userName:'Rin Vale'});
    assert(!fold.minds.has('rin vale')); assert(fold.minds.has('rin reed'));
    assert.equal(fold.agendas.size, 0);
    assert.equal(c.getSwipeData(message).characters[0].name, 'Rin Vale');
});
test('imported lore obeys enabled flags, ID zero and exported activation settings', () => {
    assert.equal(c.loreNormEntry({id:4,enabled:false,content:'Disabled crossover'}), null);
    assert.equal(c.loreNormEntry({id:'host',disabled:true,enabled:true,content:'Disabled host'}), null);
    const e = c.loreNormEntry({id:0,enabled:true,content:'A rule',keys:['one'],secondary_keys:['two'],selective:true,
        insertion_order:7,extensions:{selective_logic:2,priority:31,use_regex:true}});
    assert.equal(e.id, '0'); assert.deepEqual(plain(e.keysecondary), ['two']);
    assert.equal(e.selectiveLogic, 2); assert.equal(e.priority, 31); assert.equal(e.order, 7); assert.equal(e.useRegex, true);
    const host = c.loreNormEntry({id:'host',content:'A rule',keysecondary:['host-key'],selective_logic:0,priority:0,order_value:0,use_regex:false,
        extensions:{selective_logic:2,priority:31,use_regex:true}});
    assert.equal(host.selectiveLogic, 0); assert.equal(host.priority, 0); assert.equal(host.order, 0); assert.equal(host.useRegex, false);
    c.setLorePool('disabled-test', [{id:'old',content:'Old enabled lore'}]);
    c.setLorePool('disabled-test', [{id:'old',content:'Old enabled lore',enabled:false}]);
    assert.equal(c.getLorePool('disabled-test').length, 0, 'An explicitly disabled-only book retained stale lore');
});
test('editing an existing Visual HUD field retains its icon and bold label', () => {
    const input = visual.replace('***', '🎒 **Equipment:** walking staff\n***')+'\nA narrator-owned scene.';
    const out = c.rewriteHud(input, rows => { rows.find(x=>x.key==='equipment').text='Equipment: travel cloak'; return true; });
    assert(out.content.includes('🎒 **Equipment:** travel cloak'));
    assert(out.content.endsWith('A narrator-owned scene.'));
    assert(out.content.includes('👁️ **[DEMON EYE]:** Foresight (Sealed)'));
});
test('HUD examples are not current state, while explicit continuation unwraps its saved HUD', () => {
    for (const wrap of [x=>'```text\n'+x+'\n```', x=>'~~~markdown\n'+x+'\n~~~', x=>'<pre><code>'+x+'</code></pre>', x=>x.split('\n').map(s=>'> '+s).join('\n')]) {
        assert.equal(c.parseHud('HUD example:\n'+wrap(classic)), null);
    }
    const saved='Mushoku_Continue_Handler\n```text\n'+visual+'\n```\n### SAVE NOTES ###\nA saved scene.';
    assert(c.companionResumeHud(saved).includes('K450'));
    const active=classic.replace('K450','K451');
    assert.equal(world('HUD example:\n```text\n'+classic+'\n```\n'+active).year,451);
    assert(c.parseHud('```text\n'+classic+'\n```'), 'Unlabelled legacy fenced HUD stopped working');
    assert(c.parseHud('<pre><code>'+classic+'</code></pre>'), 'Legacy HTML HUD stopped working');
});
let failures = 0;
for (const [name, fn] of cases) { try { fn(); console.log('PASS '+name); } catch(e) { failures++; console.error('FAIL '+name+': '+e.message); } }
if(failures) process.exitCode=1;
