# RPG Companion HMS Edition 2.9.4 RC

This repository is the dedicated **Lumiverse extension** destination for the consolidated RPG Companion. It is separate from `marcusjeanr-ctrl/Companion`, which must remain untouched.

## Release state

**Release candidate, not stable.** The validated candidate exists as an installable ZIP in the originating ChatGPT project. Its local automated tests pass, including five RP-card fixture families and additional historical formats. These tests do not replace live Lumiverse installation and WebView verification.

**Important:** The complete extension source tree has **not yet been published to this repository**. Do not use this repository as a Lumiverse installation or update URL until the root contains `spindle.json`, `dist/backend.js`, `dist/frontend.js`, and the supporting files from the verified build. A README alone is not a valid installable extension.

## Publication requirements

1. Preserve the RC build's tested file bytes and `identifier: rpg_companion_hms`.
2. Set both `github` and `homepage` in root `spindle.json` to `https://github.com/marcusjeanr-ctrl/COMPANION-TESTING`.
3. Run `node tools/run_tests.cjs`, check the distributed bundle syntax, and confirm the complete source tree before advertising this repository for Lumiverse updates.
4. Keep the 2.9.4 designation as a release candidate pending live Lumiverse install, migration, tracking, and WebView validation.

Source comparison and compatibility documentation accompany the validated candidate ZIP.
