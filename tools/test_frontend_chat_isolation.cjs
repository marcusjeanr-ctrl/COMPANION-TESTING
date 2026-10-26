const assert = require('node:assert/strict');
const {runtime,seed} = require('./test_panel_tracking.cjs');
const {frontend} = require('./test_startup_and_render.cjs');
(async () => {
    const rt=runtime(); seed(rt); await rt.ctx.runSeparateUpdate('test'); await rt.ctx.pushState('test');
    const payload=structuredClone(rt.events.filter(e=>e.type==='state').at(-1));
    // Non-HMS chats use extras for the same side-panel modules.
    payload.extras=payload.hms; payload.hms=null; payload.world=null;
    payload.extras.gear.items[0].name='Chat A private heirloom';
    const ui=frontend();
    try {
        ui.receive(payload);
        assert(ui.text().includes('Chat A private heirloom'),'Fixture did not render old-chat extras');
        ui.switchChat('chat-b');
        assert(!ui.text().includes('Chat A private heirloom'),'Old-chat tracking remained visible while the next chat loads');
        ui.receive(payload);
        assert(!ui.text().includes('Chat A private heirloom'),'Late previous-chat state repainted the new chat');
        ui.receive({...payload,chatId:'chat-b',extras:null});
        assert(!ui.text().includes('Chat A private heirloom'));
    } finally { ui.dispose(); }
    console.log('Frontend chat isolation: old extras cleared immediately; late prior-chat payload rejected.');
})().catch(e=>{console.error(e);process.exitCode=1;});
