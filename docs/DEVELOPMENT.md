# Development and release process

Use `AGENTS.md` and the [audit index](audit/BASELINE.md). Work from the current
COMPANION-TESTING checkout on a feature branch; never publish to Companion.

1. Open/record the issue, expected behavior and evidence; redact private data.
2. Reproduce on the current baseline. Add a synthetic failing regression that
   exercises the actual runtime pipeline and checks false positive boundaries.
3. Implement the smallest fix; preserve saved records and source integrity.
4. Run `node tools/run_tests.cjs` (identity, syntax, regressions, smoke test), targeted tests,
   and relevant panel/pipeline benchmarks. Review the actual diff for data loss,
   false merges, cache invalidation, UI changes, token growth and added calls.
5. Push a feature branch to COMPANION-TESTING and open a PR. Require the
   `Validate Companion candidate / validate` check before merge. Repository
   branch protection must be enabled by an administrator; YAML alone cannot
   enforce it. Never enable the retired source-assembly publishing workflow.
6. Merge only after review and GitHub CI confirmation. The validation workflow
   has no publishing rights and intentionally does not create releases.

For an explicitly authorized gameplay release, synchronize version in spindle.json,
backend RPGC_VERSION, frontend headerTitle and changelog; retain the identifier.
Prepare a ZIP whose root contains spindle.json, dist/backend.js, dist/frontend.js,
i18n/, preset/, GUIDE*.md, README.md, CHANGELOG.md and LICENSE. Do not package
.git, tools, private exports, attachments, credentials or development caches.
Install and update in Lumiverse >=1.2.0; verify the real WebView, reload persistence,
representative cards, and required permissions. Compare package file hashes with
reviewed/tested files. Publish the reviewed artifact only to COMPANION-TESTING,
then download it and compare hashes again. Record commit, PR, CI run and release
URL. No upload or passing mock test alone establishes a stable release.

## Local commands

Node 22 matches CI; no npm install is needed inside the repository. Python 3 uses
standard-library tools. In this cloud use:

```sh
export PATH=/workspace/.companion-tools/node_modules/.bin:$PATH
cd /workspace/COMPANION-TESTING
node tools/run_tests.cjs
```

The optional export tests target specific historical fixtures. A different export
may legitimately violate their hard-coded counts or lengths: do not weaken the
original assertions. Check private exports locally only; never commit them.
for the current export checks, without committing the input or printing its text.
Historical rebuild/embedding tools write tracked bundles; do not run them as setup.
