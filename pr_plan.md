6-PR Plan by Subagent

- PR-ARCH-001: Architect – Stabilize /llamaproxws path and startup watchdog
  Summary: Unify websocket path usage, enforce upgrade handshake path on server and client, implement configurable startup timeout and zombie-process watchdog, and ensure presets loading reliability (retry/backoff).

- PR-FE-UX-002: Frontend UI/UX Engineer – Enforce event-driven contracts, handshake tests for websocket path, remove polling
  Summary: Replace any polling with real-time Socket.IO broadcasts for UI components; add handshake tests for /llamaproxws path; ensure UI components rely on socket broadcasts only.

- PR-TEST-003: Test Engineer – Handshake tests, presets loading tests, router-start-preset flow tests
  Summary: Implement tests for handshake between client and server, presets loading flow, and router-start-preset flow wired to the new path and startup flow.

- PR-DOCS-004: Documentation Specialist – SOCKET_CONTRACTS.md and startup/preset docs
  Summary: Update socket event contracts, payload schemas, and startup/preset flow in docs to reflect new handshake and path usage.

- PR-OPS-005: DevOps/Infra Specialist – Lockdown proxy to preserve /llamaproxws and CI health checks
  Summary: Enforce proxy config to lock down /llamaproxws, add lightweight CI health-check steps, and guard against accidental path changes.

- PR-REV-006: Code Reviewer – Audit all changes for event-driven patterns and cleanup
  Summary: Review all diffs for adherence to event-driven architecture, cleanup, and naming conventions; provide acceptance notes.

- Consolidated plan artifacts will include: per-PR diffs, per-PR test evidence, per-PR lsp_diagnostics, and acceptance notes.
