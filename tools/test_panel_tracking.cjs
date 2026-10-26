const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function runtime(filename = path.join(__dirname, '../dist/backend.js')) {
    const source = fs.readFileSync(filename, 'utf8');
    const messages = [], events = [], warnings = [], writes = [];
    let reply = '<rpg_companion>{"characters":[]}</rpg_companion>';
    let onQuiet = null;
    const spindle = {
        registerMacro() {}, registerInterceptor() {}, registerMessageContentProcessor() {},
        on() {}, onFrontendMessage() {},
        sendToFrontend(data) { events.push(structuredClone(data)); },
        log: { info() {}, warn(m) { warnings.push(m); }, error(m) { warnings.push(m); } },
        toast: { info() {}, warning() {}, error() {} },
        storage: { async getJson(_key, options) { return options?.fallback ?? null; }, async setJson() {} },
        macros: { async resolve() { return { text: 'Marcus King' }; } },
        chat: {
            async getMessages() { return structuredClone(messages); },
            async updateMessage(_chatId, id, patch) {
                const m = messages.find(x => x.id === id);
                if (!m) throw new Error('Message deleted');
                Object.assign(m, structuredClone(patch)); writes.push({ id, patch });
            }
        },
        world_books: { async getActivated() { return []; } },
        generate: { async quiet(request) { if (onQuiet) await onQuiet(request); return { content: reply }; } }
    };
    const ctx = vm.createContext({ spindle, setTimeout, clearTimeout, console, structuredClone });
    const startup = source.lastIndexOf('// ───────────────────────────── Startup');
    assert(startup > 0);
    vm.runInContext(source.slice(0, startup), ctx, { filename, timeout: 10000 });
    return { ctx, messages, events, warnings, writes,
        run: code => vm.runInContext(code, ctx),
        response(data) { reply = `<rpg_companion>${JSON.stringify(data)}</rpg_companion>`; },
        quiet(fn) { onQuiet = fn; }
    };
}

function hud(room = 'Training Yard', minute = '07:15', living = false) {
    const date = living ? `Year: K.417 | Day: 8 | Time: ${minute}`
        : `Armored Dragon Calendar: K417, Thawmoon (Month 2), Day 8 — Dragonsday | Season: Spring | Time: ${minute}`;
    const magic = living ? 'Magic School: Water: Intermediate, Earth: Intermediate, Fire: Elementary'
        : 'Magic Tiers: Water (Intermediate), Earth (Intermediate), Fire (Beginner)';
    return `### WORLD STATE ###\n${date}\n◆ Central Continent → Asura Kingdom, Fittoa Region → House King Estate, ${room}\nRace: Human | Origin: Native | Age: 13 (born K404, Month 2)\nMana Capacity: Vast | Reserve: Full\nTouki (Battle Aura): Active\nSword Style: Sword God (Intermediate)\n${magic}\nVoiceless Casting: Active\nEquipment: Training sword, signet ring\nCurrent Arc: Sandbox\nNarrative Mode: Strict Agency\n***\nAurelius hands Marcus a training sword. Marcus practices Earth Spear.`;
}
const reading = {
    characters: [{ name: 'Aurelius King', details: { Position: 'Beside the gate' } }],
    you: { mood: 'focused', sanity: 95, ate: true, got: ['Training sword'], spells: [], learned: ['Earth Spear'], mastered: [], study: [{ spell: 'Earth Wall', progress: null, note: 'Practiced once' }] },
    party: [{ name: 'Aurelius King', mood: 'patient', concern: 'Training safely' }],
    relations: [{ name: 'Aurelius King', standing: 'Friendly', bond: 'father', trust: 70, respect: 75 }],
    family: [{ name: 'Aurelius King', relation: 'father', status: 'alive', where: 'Training Yard', known: 'seen', doing: 'Teaching Marcus' }],
    gear: [{ name: 'Training sword', state: 'in hand' }],
    agenda: [{ what: 'Meet Aurelius', with: 'Aurelius King', where: 'Great Hall', when: 'Day 9, 08:00', kind: 'meeting', state: 'open' }],
    holdings: [{ name: 'Training room', kind: 'property', where: 'House King Estate', state: 'owned' }],
    money: [{ amount: 3, currency: 'copper', kind: 'income', what: 'Allowance' }],
    factions: [{ name: 'House King', standing: 'friendly', role: 'member' }],
    secrets: [{ text: 'Marcus practices silently', kind: 'yours', knownBy: [{ name: 'Aurelius King', how: 'saw him practice' }] }],
    contacts: [], inbox: [],
    quests: [{ name: 'Practice Earth Spear', objective: 'Cast it cleanly', progress: 100 }],
    plot: { now: 'Training with Aurelius', threads: [{ name: 'Magical training', state: 'advanced', note: 'First clean cast' }], canonEvents: [{ name: 'Training divergence', state: 'changed', detail: 'Marcus studies with Aurelius', arc: 2 }] },
    objectives: [{ text: 'Learn Earth Wall', state: 'active' }], injuries: [],
    moments: [{ what: 'First clean Earth Spear', kind: 'milestone', weight: 3 }],
    room: { name: 'Training Yard', w: 8, h: 8, features: [], exits: [{ side: 'north', at: 3, to: 'Great Hall' }] },
    pos: [{ name: 'Marcus King', side: 'you', x: 2, y: 2 }, { name: 'Aurelius King', side: 'other', x: 4, y: 2 }],
    minds: [{ name: 'Aurelius King', feel: { p: 'pride' }, tfdy: { T: { abs: 3 } } }],
    agendas: [{ name: 'Aurelius King', where: 'Training Yard', doing: 'Teaching Marcus', why: 'He is his father' }],
    learned: [{ who: 'Aurelius King', fact: 'Marcus can cast Earth Spear', how: 'saw', sure: 'certain' }],
    chekhov: { load: [{ what: 'The gate is loose', w: 1 }], fired: [], drop: [] }
};
function seed(rt, living = false) {
    rt.messages.push({ id: 'u1', role: 'user', content: 'I practice Earth Spear.' },
        { id: 'a1', role: 'assistant', swipe_id: 0, content: hud('Training Yard', '07:15', living) });
    rt.run(`settings.trackerSafeguards = {enabled:false}; settings.lore.enabled = false; settings.memory.inTracker = false;
        settings.positions.mode = 'always'; settings.generationMode = 'separate';
        const initialState = emptyChatState(); initialState.party.members = [{name:'Aurelius King',key:'aurelius king'}];
        chatStateCache.set('test', initialState); userNameCache.set('test', 'Marcus King');`);
    rt.response(reading);
}
async function main() {
    for (const living of [false, true]) {
        const rt = runtime(); seed(rt, living);
        let requested = '';
        rt.quiet(request => { requested = request.messages.at(-1).content; });
        await rt.ctx.runSeparateUpdate('test');
        const stored = rt.ctx.getSwipeData(rt.messages[1]);
        for (const key of ['characters', 'survival', 'party', 'relations', 'family', 'gear', 'agenda', 'holdings', 'money', 'factions', 'secrets', 'quests', 'plot', 'objectives', 'moments', 'room', 'pos', 'minds', 'agendas', 'learned', 'chekhov']) {
            assert(stored[key], `Missing stored ${key} (${living ? 'Living' : 'Six-Sided'})`);
        }
        for (const key of ['characters', 'you', 'party', 'relations', 'family', 'gear', 'agenda', 'holdings', 'money', 'factions', 'secrets', 'quests', 'plot', 'objectives', 'moments', 'room', 'pos', 'minds', 'agendas', 'learned', 'chekhov']) {
            assert(requested.includes(`"${key}"`), `Missing requested ${key}`);
        }
        assert.equal(stored.survival.study[0].progress, null);
        const cs = await rt.ctx.getChatState('test');
        assert(cs.rooms[stored.posRoom], 'Room not kept for Buildings');
        const states = rt.events.filter(e => e.type === 'state');
        assert.equal(states.length, 3, 'Original 2.8.1 preparation, scene-read and final state updates');
        const state = states.at(-1);
        assert.equal(state.busy, false);
        assert.equal(state.world.id, 'mushoku');
        for (const key of ['systems', 'you', 'magic', 'party', 'relations', 'family', 'gear', 'agenda', 'holdings', 'money', 'factions', 'secrets', 'minds', 'map', 'atlas', 'comms']) {
            assert(state.hms[key], `Missing panel ${key}`);
        }
        assert(state.plotView.now);
        assert.equal(rt.warnings.length, 0, rt.warnings.join('\n'));
        assert(!rt.events.some(e => e.type === 'tracker_status'));
    }
    // A swipe/edit/deletion during a slow provider response must not write to the new reply.
    for (const change of ['swipe', 'edit', 'delete']) {
        const rt = runtime(); seed(rt);
        rt.quiet(() => {
            if (change === 'swipe') rt.messages[1].swipe_id = 1;
            if (change === 'edit') rt.messages[1].content = hud('Great Hall');
            if (change === 'delete') rt.messages.pop();
        });
        await rt.ctx.runSeparateUpdate('test');
        assert.equal(rt.writes.length, 0, `Stale ${change} wrote tracker metadata`);
        assert.equal(rt.run("busyChats.has('test')"), false);
    }
    const rt = runtime(); seed(rt);
    rt.messages.push({id:'a2',role:'assistant',swipe_id:0,content:hud('Great Hall')});
    rt.ctx.history = rt.messages;
    assert(rt.run(`withReadPass(history, () => {
        const a = hmsTimeline(history), b = hmsTimeline(history);
        relReadings(history).reverse();
        return a === b && relReadings(history)[0].id === 'a1' && relReadings(history).at(-1).id === 'a2';
    })`));
    assert.equal(rt.run('activeReadPass'), null);
    assert.throws(() => rt.run(`withReadPass(history, () => { throw Error('test'); })`));
    assert.equal(rt.run('activeReadPass'), null);
    const first = rt.ctx.messageHud(rt.messages[1]);
    rt.messages[1].content = rt.messages[1].content.replace('07:15', '07:16');
    assert.notEqual(rt.ctx.messageHud(rt.messages[1]), first, 'Same-length edit kept a cached HUD');
    rt.messages[1].swipe_id = 1;
    rt.messages[1].content = hud('Great Hall');
    assert.equal(rt.ctx.messageHud(rt.messages[1]).location.at(-1), 'Great Hall');
    rt.messages.pop();
    rt.ctx.history = rt.messages;
    assert.equal(rt.run(`withReadPass(history, () => hmsTimeline(history).at(-1).hud.location.at(-1))`), 'Great Hall');
    // A single enabled data panel must activate its tracker even with NPC panels disabled.
    rt.run(`settings.hmsSystems = {survival:{enabled:false},relations:{enabled:false},comms:{enabled:false},
        you:{enabled:false},magic:{enabled:false},quests:{enabled:false},family:{enabled:false},
        gear:{enabled:true},agenda:{enabled:false},holdings:{enabled:false},money:{enabled:false},
        factions:{enabled:false},secrets:{enabled:false},party:{enabled:false},injuries:{enabled:false},
        minds:{enabled:false,agendas:false,knowledge:false,chekhov:false}};
        settings.showCharacterThoughts = false; settings.positions.mode = 'off';
        settings.chronicle.enabled = false;`);
    assert(rt.ctx.companionWanted(rt.run('initialState'), rt.messages));
    rt.run(`settings.hmsSystems.gear.enabled = false;`);
    assert.equal(rt.ctx.companionWanted(rt.run('emptyChatState()'), rt.messages), false);
    console.log('Panel integration passed: both HUDs, all data panels, separate room/position persistence, local-first updates, cache edits/swipes, and stale-response protection.');
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { runtime, hud, seed, reading };

