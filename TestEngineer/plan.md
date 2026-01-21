Test Engineer Subagent Plan (TestEngineer)
- Objective: Implement handshake tests, presets loading tests, and router-start-preset flow tests.

- Tasks:
  1. Create handshake tests for client-server websocket path /llamaproxws.
  2. Create presets loading tests to verify loader retries and success on load.
  3. Create router-start-preset flow tests confirming startup sequence triggers presets load and broadcasts readiness.
  4. Produce test diffs and lsp diagnostics for changed test files.

- Diffs Placeholder:
  - tests/handshake.test.js
  - tests/presets-loader.test.js
  - tests/router-start-preset.test.js

- Acceptance: All tests PASS in CI with coverage requirements.
