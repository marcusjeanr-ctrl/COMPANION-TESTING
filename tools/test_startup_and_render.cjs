const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { runtime, seed } = require('./test_panel_tracking.cjs');

class Element {
    constructor(tag = 'div') {
        this.tagName = tag.toUpperCase();
        this.children = [];
        this.dataset = {};
        this.attributes = {};
        this.style = { setProperty() {}, removeProperty() {} };
        this.classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
        this.scrollTop = 0;
    }
    get childNodes() { return this.children; }
    appendChild(node) { this.children.push(node); node.parentElement = this; return node; }
    replaceChildren(...nodes) { this.children = []; nodes.forEach(node => this.appendChild(node)); }
    append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key]; }
    addEventListener() {}
    removeEventListener() {}
    remove() {}
    querySelector() { return null; }
    querySelectorAll() { return []; }
    contains() { return false; }
}

function frontend() {
    const root = new Element();
    const document = {
        createElement: tag => new Element(tag),
        createElementNS: (_ns, tag) => new Element(tag),
        createTextNode: text => ({ textContent: text }),
        createDocumentFragment: () => new Element('fragment'),
        documentElement: new Element('html'), body: new Element('body'), head: new Element('head'),
        querySelector: () => null, querySelectorAll: () => [], addEventListener() {}
    };
    let receive;
    const ctx = {
        dom: { addStyle() { return () => {}; } },
        ui: {
            registerDrawerTab() { return { root, activate() {}, destroy() {} }; },
            registerInputBarAction() { return { onClick() {}, setEnabled() {}, destroy() {} }; }
        },
        sendToBackend() {},
        onBackendMessage(handler) { receive = handler; return () => {}; },
        getActiveChat() { return { chatId: 'test', characterId: 'character' }; },
        events: { on() { return () => {}; } }
    };
    const context = vm.createContext({
        console, document, window: {}, navigator: { language: 'en' }, ctx,
        setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
        MutationObserver: class { observe() {} disconnect() {} },
        getComputedStyle: () => ({ getPropertyValue: () => '' })
    });
    const source = fs.readFileSync(path.join(__dirname, '../dist/frontend.js'), 'utf8');
    vm.runInContext(source.replace('export function setup', 'function setup') + '\nconst dispose = setup(ctx);', context, { timeout: 10000 });
    const text = node => String(node.textContent || '') + (node.children || []).map(text).join(' ');
    return { receive: message => receive(structuredClone(message)), text: () => text(root), dispose: () => vm.runInContext('dispose()', context) };
}

async function main() {
    const boot = runtime();
    boot.ctx.spindle.permissions = { onChanged() {}, onDenied() {} };
    const source = fs.readFileSync(path.join(__dirname, '../dist/backend.js'), 'utf8');
    await boot.run(source.slice(source.lastIndexOf('// ───────────────────────────── Startup')));
    for (const living of [false, true]) {
        const rt = runtime();
        seed(rt, living);
        rt.ctx.setLorePool('test', [{ id: 'ice-blade', key: ['Ice Blade'], content: '[SPELL — Ice Blade]\nSchool: Water · Rank: Elementary\nEffect: Creates a sword made of ice.' }]);
        await rt.ctx.runSeparateUpdate('test');
        await rt.ctx.pushState('test');
        const payload = rt.events.filter(event => event.type === 'state').at(-1);
        assert.equal(payload.world.saga.arcs.length, 22, 'Saga must include the arc list required by the frontend');
        const ui = frontend();
        assert.match(ui.text(), /Loading/);
        ui.receive(payload);
        assert.match(ui.text(), /World State/);
        assert.match(ui.text(), /Magic/);
        assert.match(ui.text(), /All 22 arcs/);
        assert.match(ui.text(), /Ice Blade Beginner/);
        const spell = payload.hms.magic.list.schools.flatMap(group => group.spells).find(row => row.name === 'Ice Blade');
        assert.equal(spell.rank, 'Elementary', 'Display formatting must preserve stored/source rank');
        assert.equal(spell.status, 'reach');
        ui.receive({ ...payload, world: null });
        assert.match(ui.text(), /Ice Blade Elementary/, 'Non-Mushoku labels must remain unchanged');
        ui.receive(payload);
        const malformed = structuredClone(payload);
        delete malformed.world.saga.arcs;
        ui.receive(malformed);
        assert.match(ui.text(), /Saga data is incomplete/);
        assert.match(ui.text(), /Magic/, 'Other panels must survive an incomplete Saga payload');
        ui.receive(payload);
        assert.match(ui.text(), /All 22 arcs/);
        ui.dispose();
    }
    console.log('Startup/render regression passed: backend boot, frontend setup, both populated Mushoku HUDs, all 22 Saga arcs, incomplete payload recovery and cleanup.');
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { frontend };

