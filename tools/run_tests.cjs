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
