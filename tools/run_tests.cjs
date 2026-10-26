const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const suites = [
    'test_2_8_1_panel_parity.cjs', 'test_atlas_references.cjs', 'test_general_tracking.cjs',
    'test_panel_tracking.cjs', 'test_reading_and_magic.cjs', 'test_reconciliation_integrity.cjs',
    'test_six_sided_repairs.cjs', 'test_spell_aliases.cjs', 'test_startup_and_render.cjs',
    'test_universal_integrity.cjs', 'test_tracking_2_9_0.cjs', 'test_tracking_source_integrity.cjs', 'test_quest_identity_2_9_2.cjs', 'test_tracking_2_9_3.cjs',
    'test_visual_rank_integrity.cjs', 'test_universal_card_matrix.cjs', 'test_save_continue_boundary.cjs', 'test_internal_states_export_2_9_5.cjs', 'test_agenda_quest_export_2_9_7.cjs'
];
function run(args) {
    const r = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', env: { ...process.env, COMPANION_TRACKING_ONLY: '1' } });
    if (r.error) throw r.error;
    if (r.status !== 0) process.exit(r.status || 1);
}
for (const file of ['dist/backend.js', 'dist/frontend.js']) run(['--check', path.join(root, file)]);
for (const file of suites) run([path.join(__dirname, file)]);
if (process.env.COMPANION_PRIVATE_EXPORT) run([path.join(__dirname, 'test_export_tracking_2_9_0.cjs'), path.resolve(process.env.COMPANION_PRIVATE_EXPORT)]);
if (process.env.COMPANION_TRACKING_EXPORT) run([path.join(__dirname, 'test_export_tracking_2_9_3.cjs'), path.resolve(process.env.COMPANION_TRACKING_EXPORT)]);
console.log(`All ${suites.length} baseline, card-compatibility, and regression suites plus both bundle syntax checks passed.`);
console.log('Legacy source-text-only compatibility harness remains archived; new runnable Visual and Save/Continue boundary tests are included.');
