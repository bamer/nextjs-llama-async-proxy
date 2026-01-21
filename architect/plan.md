Architect Subagent Plan (architect)
- Objective: Stabilize websocket upgrade path usage (/llamaproxws) across server and client, harden startup with timeout and zombie watchdog, and ensure presets loading reliability.

- Tasks:
  1. Normalize websocket path usage: ensure server listens on /llamaproxws and client connects to the same endpoint. Remove any alternate path usage.
  2. Startup hardening: implement configurable startup timeout and zombie-process watchdog, with auto-restart and clean shutdown hooks.
  3. Presets loading: add reliable presets loader with retries and backoff, plus health signals to client on load status.
  4. Tests/docs references: prepare code diffs and diagnostic outputs for LSP, and surface startup diagnostics.

- Diffs (patch placeholders will follow in separate file):
  - server.js websocket path handling
  - public/js/services/socket.js connection path
  - presets loader module

- LSP Diagnostics (example):
  - server.js: diagnostics: no syntax errors; potential circular dependency risk in startup watchers
- Acceptance: handshake path consistent, startup timeout configurable, presets loader reliable under retry semantics.
