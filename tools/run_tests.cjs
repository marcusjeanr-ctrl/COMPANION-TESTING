const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const suites = [
    'test_survival_flag_evidence.cjs',
    'test_agenda_display_grouping.cjs', 'test_completed_quest_display.cjs', 'test_play_tools.cjs',
    'test_objective_quest_labels.cjs', 'test_recent_display_dedup.cjs', 'test_reliability_3_2_investigation.cjs',
    'test_features_3_1.cjs', 'test_sheet_followup.cjs', 'test_consistency_followup.cjs', 'test_martial_investigation.cjs', 'test_relationship_defaults_drift.cjs', 'test_quest_completion_investigation.cjs',
    'test_2_8_1_panel_parity.cjs', 'test_atlas_references.cjs', 'test_general_tracking.cjs',
    'test_panel_tracking.cjs', 'test_display_cache_lifecycle.cjs', 'test_reading_and_magic.cjs', 'test_reconciliation_integrity.cjs', 'test_universal_agenda_dedup.cjs', 'test_agenda_bell_refinement.cjs', 'test_export_identity_drift.cjs', 'test_quest_contract_continuity.cjs',
    'test_six_sided_repairs.cjs', 'test_spell_aliases.cjs', 'test_startup_and_render.cjs',
    'test_universal_integrity.cjs', 'test_tracking_2_9_0.cjs', 'test_tracking_source_integrity.cjs', 'test_quest_identity_2_9_2.cjs', 'test_tracking_2_9_3.cjs',
    'test_visual_rank_integrity.cjs', 'test_universal_card_matrix.cjs', 'test_save_continue_boundary.cjs', 'test_internal_states_export_2_9_5.cjs', 'test_agenda_quest_export_2_9_7.cjs', 'test_frontend_chat_isolation.cjs', 'test_stabilization_continuity.cjs', 'test_long_chat_stability.cjs', 'test_tracking_continuation_accuracy.cjs', 'test_recovery_reliability.cjs', 'test_metadata_read_cost.cjs', 'test_rebuild_safety.cjs', 'test_publish_rc.cjs', 'test_agenda_occurrence_2_9_11.cjs', 'test_agenda_quest_continuity.cjs', 'test_additional_tracking_2_9_11.cjs', 'test_six_sided_integration.cjs', 'test_universal_six_sided_matrix.cjs', 'test_tracking_evidence_2_9_13.cjs', 'test_tracking_cross_system_2_9_13.cjs', 'test_living_world_compatibility.cjs', 'test_magic_identity_progression.cjs', 'test_tracking_engine_3.cjs', 'test_dual_mushoku_3.cjs', 'test_magic_classification.cjs', 'test_narrator_spell_grounding.cjs', 'test_narrator_lore_grounding.cjs', 'test_six_sided_release_integrity.cjs', 'test_durable_tracking_history.cjs', 'test_ability_quest_evidence.cjs', 'test_six_sided_acceptance.cjs', 'audit_release_continuity.cjs'
];
function run(args) {
    const r = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', env: { ...process.env, COMPANION_TRACKING_ONLY: '1' } });
    if (r.error) throw r.error;
    if (r.status !== 0) process.exit(r.status || 1);
}
for (const file of ['dist/backend.js', 'dist/frontend.js']) run(['--check', path.join(root, file)]);
for (const file of suites) run([path.join(__dirname, file)]);
const gateTests = spawnSync('python3', [path.join(__dirname, 'test_benchmark_gate.py')], {cwd:root,stdio:'inherit'});
if (gateTests.status !== 0) process.exit(gateTests.status || 1);
if (process.env.COMPANION_PRIVATE_EXPORT) run([path.join(__dirname, 'test_export_tracking_2_9_0.cjs'), path.resolve(process.env.COMPANION_PRIVATE_EXPORT)]);
if (process.env.COMPANION_TRACKING_EXPORT) run([path.join(__dirname, 'test_export_tracking_2_9_3.cjs'), path.resolve(process.env.COMPANION_TRACKING_EXPORT)]);
console.log(`All ${suites.length} baseline, card-compatibility, and regression suites plus both bundle syntax checks passed.`);
console.log('Legacy source-text-only compatibility harness remains archived; new runnable Visual and Save/Continue boundary tests are included.');
