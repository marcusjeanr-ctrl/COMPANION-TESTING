// UI check in a real browser (Chromium via Playwright, when installed): the real frontend renders a payload
// at four widths in every look and every view, with no script errors and no horizontal overflow, and the
// interactive parts work: view tabs (mouse and arrow keys), the Now card links, Find (Ctrl+K → Enter →
// dossier → Esc), the Tools tray, the Settings search and the look switch. It also times a full render and,
// with FRONTEND_OLD=<old frontend.js>, compares it with an older build. Screenshots go to UI_SHOTS (optional).
//   node tools/test_ui.cjs [payload.json]       (default: the synthetic payload from tools/test_smoke.cjs)
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), { execFileSync } = require('node:child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch { console.log('test_ui: Playwright is not installed here — skipped (npm i -D playwright to run it).'); process.exit(0); }
const root = path.join(__dirname, '..');
let payloadFile = process.argv[2];
if (!payloadFile) { payloadFile = path.join(os.tmpdir(), `rpgc-ui-payload-${process.pid}.json`); execFileSync(process.execPath, [path.join(__dirname, 'test_smoke.cjs')], { env: { ...process.env, SMOKE_DUMP: payloadFile }, stdio: 'ignore' }); }
const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));
const shots = process.env.UI_SHOTS || null; if (shots) fs.mkdirSync(shots, { recursive: true });
const page = (frontFile, width, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#12131a;color:#e6e6ee;font-family:system-ui,sans-serif}#drawer{width:${width}px;height:100vh;overflow:auto}</style></head><body><div id="drawer"></div><script>
window.__errors=[];addEventListener('error',e=>__errors.push(e.message));
const ctx={dom:{addStyle:css=>{const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);return()=>s.remove();}},
ui:{registerDrawerTab:()=>({root:document.getElementById('drawer'),activate(){},destroy(){},setBadge(){}}),registerInputBarAction:()=>({onClick(){},setEnabled(){},destroy(){}}),showConfirm:async()=>false},
sendToBackend:m=>{(window.__sent=window.__sent||[]).push(m)},onBackendMessage:fn=>{window.__recv=fn;return()=>{}},getActiveChat:()=>({chatId:'c1',characterId:'x'}),events:{on:()=>()=>{}}};
${extra}
${fs.readFileSync(frontFile, 'utf8').replace(/^export function setup/m, 'function setup').replace(/<\/script>/g, '<\\/script>')}
setup(ctx);
</script></body></html>`;
const VIEWS = ['scene', 'you', 'people', 'journey', 'all'], LOOKS = ['modern', 'storybook', 'minimal'], WIDTHS = [340, 420, 860, 1200];
const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
(async () => {
    const browser = await chromium.launch();
    const tmp = path.join(os.tmpdir(), `rpgc-ui-${process.pid}.html`); // one file per run, so two runs never share a page
    const open = async (width, look, view, frontFile = process.env.FRONTEND || path.join(root, 'dist', 'frontend.js')) => {
        fs.writeFileSync(tmp, page(frontFile, width, `localStorage.setItem('rpgc-view','${view}');`));
        const p = await browser.newPage({ viewport: { width: width + 40, height: 900 } });
        p.setDefaultTimeout(3000); // a missing control fails fast instead of waiting 30 s
        p.on('pageerror', e => fails.push(`${look}/${view}@${width}: script error ${e.message}`));
        await p.goto('file://' + tmp);
        const data = JSON.parse(JSON.stringify(payload)); data.settings = { ...data.settings, uiLook: look };
        await p.evaluate(d => window.__recv(d), data);
        await p.waitForTimeout(80);
        return p;
    };
    // every look × width × view
    for (const look of LOOKS) for (const width of WIDTHS) for (const view of VIEWS) {
        if (look !== 'modern' && width !== 420 && view !== 'scene') continue; // other looks: all views at 420, scene at every width
        const p = await open(width, look, view);
        const r = await p.evaluate(() => { const rt = document.querySelector('.rpgc'); const d = document.getElementById('drawer');
            const wide = [...rt.querySelectorAll('*')].filter(el => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > d.getBoundingClientRect().right + 2 && getComputedStyle(el).position !== 'fixed' && !el.closest('.rpgc-find-overlay,.rpgc-play-overlay'); }).slice(0, 3).map(el => el.className || el.tagName);
            return { look: rt.className, cards: document.querySelectorAll('.rpgc-view > *').length, tab: document.querySelector('.rpgc-viewtab[aria-selected=true]')?.dataset.view, overflow: d.scrollWidth - d.clientWidth, wide }; });
        const tag = `${look}/${view}@${width}`;
        check(r.look.includes('look-' + look), `${tag}: look class missing (${r.look})`);
        check(r.cards > 0, `${tag}: the view rendered no cards`);
        check(r.tab === view, `${tag}: tab ${r.tab} selected`);
        check(r.overflow <= 1 && !r.wide.length, `${tag}: horizontal overflow ${r.overflow}px ${r.wide.join(', ')}`);
        if (shots) await p.screenshot({ path: path.join(shots, `${look}-${view}-${width}.png`), fullPage: true });
        await p.close();
    }
    // interactions (a missing control is reported as a failure, and the run goes on to the timing)
    const p = await open(420, 'modern', 'scene');
    try {
    await p.click('.rpgc-viewtab[data-view=people]');
    check(await p.evaluate(() => document.querySelector('.rpgc-viewtab[aria-selected=true]')?.dataset.view) === 'people', 'clicking People does not switch view');
    await p.focus('.rpgc-viewtab[aria-selected=true]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(30);
    check(await p.evaluate(() => document.querySelector('.rpgc-viewtab[aria-selected=true]')?.dataset.view) === 'journey', 'ArrowRight does not move to the next view');
    check(await p.evaluate(() => document.activeElement?.dataset?.view) === 'journey', 'focus does not follow the arrow key');
    await p.click('.rpgc-viewtab[data-view=scene]');
    const nowLink = await p.$('.rpgc-now-rows > div.go');
    if (nowLink) { await nowLink.click(); await p.waitForTimeout(30); check(await p.evaluate(() => document.querySelector('.rpgc-viewtab[aria-selected=true]')?.dataset.view) !== 'scene', 'a Now card link does not open its card'); await p.click('.rpgc-viewtab[data-view=scene]'); }
    await p.keyboard.press('Control+k'); await p.waitForTimeout(30);
    check(!!(await p.$('.rpgc-find input')), 'Ctrl+K does not open Find');
    const person = await p.evaluate(() => (document.querySelector('.rpgc-find-list li .tx b')?.textContent) || '');
    if (person) {
        await p.keyboard.type(person.split(' ')[0]); await p.waitForTimeout(30);
        check(await p.evaluate(n => [...document.querySelectorAll('.rpgc-find-list li .tx b')].some(b => b.textContent === n), person), 'Find does not list a person typed by name');
        await p.keyboard.press('Enter'); await p.waitForTimeout(40);
        check(await p.evaluate(() => /Dossier/.test(document.querySelector('[role=dialog]')?.getAttribute('aria-label') || '')), 'Enter in Find does not open the dossier');
        check(await p.evaluate(() => document.activeElement?.classList.contains('rpgc-sheet-close')), 'the dossier does not take focus');
        await p.keyboard.press('Escape'); await p.waitForTimeout(30);
        check(!(await p.$('[role=dialog]')), 'Escape does not close the dossier');
    } else fails.push('Find lists nothing for this payload');
    await p.click('.rpgc-tools > summary');
    check(await p.evaluate(() => /Export character sheet/.test(document.querySelector('.rpgc-tools')?.textContent || '')), 'the Tools tray lost Export character sheet');
    await p.click('.tb-settings'); await p.waitForTimeout(30);
    const before = await p.evaluate(() => [...document.querySelectorAll('.rpgc > details.rpgc-sec')].filter(d => !d.hidden).length);
    await p.fill('.rpgc-set-search', 'quest'); await p.waitForTimeout(30);
    const after = await p.evaluate(() => [...document.querySelectorAll('.rpgc > details.rpgc-sec')].filter(d => !d.hidden).length);
    check(before > 5 && after > 0 && after < before, `Settings search does not filter (${before} → ${after})`);
    } catch (e) { fails.push('interaction stopped: ' + String(e.message).split('\n')[0]); }
    await p.close();
    // Gear containers: contents under their container's row, every item exactly once, loops not nested,
    // opening/closing is display only (no message), remembered, independent; Move still works.
    {
        const item = (name, st, inside = null) => ({ key: name.toLowerCase(), name, state: st, where: null, inside, from: 'story', onHud: false, mine: false, history: [] });
        const items = [item('Pack', 'on body'), item('Pouch', 'in container', 'Pack'), item('coin', 'in container', 'Pouch'), item('rope', 'in container', 'Pack'),
            item('Chest A', 'in container', 'Chest B'), item('Chest B', 'in container', 'Chest A'), item('gem', 'in container', 'Chest A'),
            item('note', 'in container', 'Locker'), item('map', 'in container', 'Unknown bag'), item('cloak', 'worn')];
        const gearPayload = JSON.parse(JSON.stringify(payload));
        gearPayload.hms.gear = { items, containers: ['Pack', 'Pouch', 'Chest A', 'Chest B', 'Locker'], gone: [], ask: true, tell: true };
        fs.writeFileSync(tmp, page(process.env.FRONTEND || path.join(root, 'dist', 'frontend.js'), 420, `localStorage.setItem('rpgc-view','you');`));
        const q = await browser.newPage({ viewport: { width: 460, height: 900 } }); q.setDefaultTimeout(3000);
        q.on('pageerror', e => fails.push('gear: script error ' + e.message));
        await q.goto('file://' + tmp); await q.evaluate(d => window.__recv(d), gearPayload); await q.waitForTimeout(60);
        try {
            const facts = () => q.evaluate(() => {
                const sec = [...document.querySelectorAll('details')].find(d => d.dataset.openKey === 'gear');
                const rows = [...sec.querySelectorAll('li.rpgc-gear-item')].map(li => li.querySelector('.name')?.textContent);
                const parentBox = name => { const li = [...sec.querySelectorAll('li.rpgc-gear-item')].find(l => l.querySelector('.name')?.textContent === name); return li?.parentElement?.closest('li.rpgc-gear-box')?.querySelector('.name')?.textContent || null; };
                const visible = name => { const li = [...sec.querySelectorAll('li.rpgc-gear-item')].find(l => l.querySelector('.name')?.textContent === name); return !!li && li.offsetParent !== null; };
                return { rows, pouchIn: parentBox('Pouch'), coinIn: parentBox('coin'), ropeIn: parentBox('rope'), gemIn: parentBox('gem'), chestABox: !!sec.querySelector('[data-box-key="gear-box-chest a"]'),
                    groups: [...sec.querySelectorAll('.rpgc-gear-group')].map(g => g.querySelector('summary,h4')?.textContent || ''), coinVisible: visible('coin'), ropeVisible: visible('rope'), sent: (window.__sent || []).filter(m => m.type === 'gear').length };
            });
            let f = await facts();
            const counts = {}; for (const r of f.rows) counts[r] = (counts[r] || 0) + 1;
            for (const it of items) check(counts[it.name] === 1, `gear: "${it.name}" is drawn ${counts[it.name] || 0} times (must be once)`);
            check(f.pouchIn === 'Pack' && f.coinIn === 'Pouch' && f.ropeIn === 'Pack', `gear: nesting wrong (Pouch in ${f.pouchIn}, coin in ${f.coinIn}, rope in ${f.ropeIn})`);
            check(!f.chestABox && f.gemIn === null && f.groups.some(t => /Inside Chest A/.test(t)), 'gear: a loop of containers was nested instead of kept as groups');
            check(f.groups.some(t => /Inside Locker/.test(t)) && f.groups.some(t => /Packed away/.test(t)), 'gear: a container without a row, or an unknown container, lost its group');
            await q.click('[data-box-key="gear-box-pack"] > .rpgc-box-toggle'); f = await facts();
            check(!f.ropeVisible && !f.coinVisible, 'gear: closing Pack does not hide its contents');
            check(f.rows.length === items.length && f.sent === 0, 'gear: closing a container changed the items or sent a message');
            check(await q.evaluate(() => document.querySelector('[data-box-key="gear-box-pack"] > .rpgc-box-toggle').getAttribute('aria-expanded')) === 'false', 'gear: the toggle does not report closed');
            await q.click('[data-box-key="gear-box-pack"] > .rpgc-box-toggle');
            await q.click('[data-box-key="gear-box-pouch"] > .rpgc-box-toggle'); f = await facts();
            check(f.ropeVisible && !f.coinVisible, 'gear: containers do not open and close independently');
            await q.evaluate(d => window.__recv(d), gearPayload); await q.waitForTimeout(40); f = await facts();
            check(!f.coinVisible && f.ropeVisible, 'gear: a closed container does not stay closed after a refresh');
            await q.selectOption('select[aria-label="Move rope"]', 's:dropped');
            const moved = await q.evaluate(() => (window.__sent || []).filter(m => m.type === 'gear').at(-1));
            check(moved && moved.op === 'set' && moved.name === 'rope' && moved.state === 'dropped', 'gear: Move no longer sends the move');
            if (shots) await q.screenshot({ path: path.join(shots, 'gear-containers.png'), fullPage: true });
        } catch (e) { fails.push('gear check stopped: ' + String(e.message).split('\n')[0]); }
        await q.close();
    }
    // render time: a full render of All, new build vs FRONTEND_OLD
    const time = async file => { const q = await open(420, 'modern', 'all', file); const ms = await q.evaluate(d => { const t = []; for (let i = 0; i < 7; i++) { const a = performance.now(); window.__recv(JSON.parse(JSON.stringify(d))); t.push(performance.now() - a); } t.sort((x, y) => x - y); return t[3]; }, payload); await q.close(); return ms; };
    const now = await time(path.join(root, 'dist', 'frontend.js'));
    const old = process.env.FRONTEND_OLD ? await time(process.env.FRONTEND_OLD) : null;
    await browser.close();
    for (const f of fails) console.log('  ✗ ' + f);
    console.log(`ui: ${LOOKS.length} looks, ${WIDTHS.length} widths, ${VIEWS.length} views and the interactions checked: ${fails.length} problem(s); full render (All) ${now.toFixed(1)} ms${old !== null ? `, older build ${old.toFixed(1)} ms` : ''}`);
    process.exitCode = fails.length ? 1 : 0;
})().catch(e => { console.error('test_ui failed:', e.stack || e); process.exitCode = 2; });
