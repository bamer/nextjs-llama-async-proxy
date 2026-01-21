Test Engineer Diff: Handshake + Presets + Router Start Preset

Summary: scaffolds for 3 tests: handshake, presets-loader, router-start-preset.
- handshake.test.js: verify client connects, path '/llamaproxws', and receives expected welcome message.
- presets-loader.test.js: verify loader retries on failure and succeeds within max retries.
- router-start-preset.test.js: verify router.start triggers presets loading sequence and proper broadcasts.

- LSP Diagnostics Placeholder: tests/handshake-tests.js - syntax ok; coverage TBD.
