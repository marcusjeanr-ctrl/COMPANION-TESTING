// Runs the release checks: identity, syntax, regressions and the end-to-end smoke test.
// Run: node tools/run_tests.cjs
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');
const steps = [
    ['release identity', ['tools/check_release.cjs']],
    ['backend syntax', ['--check', 'dist/backend.js']],
    ['frontend syntax', ['--check', 'dist/frontend.js']],
    ['tracking regressions', ['tools/test_tracking_audit.cjs']],
    ['live-play audit (gear guesses, Training line, swipes)', ['tools/test_live_play_audit.cjs']],
    ['Six-Sided World v1.1 HUD', ['tools/test_six_sided_v11.cjs']],
    ['Six-Sided card coverage (every HUD slot, three styles)', ['tools/test_card_coverage.cjs']],
    ['Six-Sided 1.5 paired artifacts and runtime', ['tools/test_six_sided_150.cjs']],
    ['lifecycle (swipes, regenerations, saves, OOC, hypotheticals, time)', ['tools/test_lifecycle.cjs']],
    ['cross-card (every demo world through the real reply pipeline)', ['tools/test_cross_card.cjs']],
    ['HUD upkeep (the Companion does the card\'s math and format)', ['tools/test_hud_upkeep.cjs']],
    ['carry-over (a continued save keeps the earlier chat\'s history)', ['tools/test_carry.cjs']],
    ['smoke (payload, request, render)', ['tools/test_smoke.cjs']],
];
let failed = 0;
for (const [name, args] of steps) {
    try {
        execFileSync(process.execPath, args, { cwd: root, stdio: 'pipe' });
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}\n${String(e.stdout || '')}${String(e.stderr || '')}`.trimEnd());
    }
}
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exitCode = failed ? 1 : 0;
