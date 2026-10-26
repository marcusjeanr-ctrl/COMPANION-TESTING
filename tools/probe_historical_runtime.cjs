// Synthetic behavior probes using the current mock host. Failures may indicate
// an incompatible harness rather than a historical product defect.
const {runtime,hud,reading} = require('./test_panel_tracking.cjs');
for (const file of process.argv.slice(2)) {
    const result = {file, checks:{}};
    try {
        const {ctx:c} = runtime(file);
        const probes = {
            hud: () => !!c.parseHud(hud()),
            report: () => !!c.parseCompanion(`<rpg_companion>${JSON.stringify(reading)}</rpg_companion>`),
            agendaRecords: () => {
                const rows = ['Mana measurement','Mana measurement after breakfast'];
                const chat = rows.map((what,i) => ({id:String(i),role:'assistant',content:hud(),
                    metadata:{rpg_companion:{swipes:{0:{agenda:c.agendaNormalize([{what,with:'A',where:'Hall',when:'08:30'}])}}}}}));
                return c.agendaRead(chat,c.emptyChatState()).items.length;
            },
            exportedMetadata: () => c.getSwipeData({role:'assistant',content:hud(),
                extra:{spindle_metadata:{rpg_companion:{swipes:{0:{minds:[{name:'Synthetic NPC'}]}}}}}})?.minds?.length === 1
        };
        for(const [name, probe] of Object.entries(probes)) {
            try {result.checks[name] = probe();}
            catch(error) {result.checks[name] = {unsupportedOrFailed:error.message};}
        }
    } catch(error) {result.harnessError = error.message;}
    console.log(JSON.stringify(result));
}
