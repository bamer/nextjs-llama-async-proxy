# Master Plan — Six-Subagent Orchestration (Socket.IO-First, Event-Driven)

- Objective: Stabilize the websocket path (/llamaproxws), harden startup with a configurable timeout and a watchdog, ensure robust presets loading, remove polling in UI, and lock down proxy health checks. Deliver six separate PRs (one per subagent) with code, tests, and docs.
- Timebox: ~3 days per subagent; overall ~2 weeks for orchestration and integration.
- Deliverables: six PRs, master plan doc, test plan, and evidence bundles per subagent.
- Rollout: staging first, then prod; feature-flag gating optional per org policy.

## Success Criteria (high level)
- All changes respect: Pure Event-Driven DOM Updates; Socket.IO-First; Decentralized, autonomous components.
- WebSocket path /llamaproxws is consistently used across server and client; no path suffixes during handshake.
- Presets loading is robust with retry/backoff and explicit startup watchdog; presets:list always returns an array.
- UI updates are driven entirely by Socket.IO broadcasts; no polling for state.
- CI health checks verify path availability and handshake in staging.

## Artifacts
- 6 PR scaffolds (architect, frontend, tests, docs, infra, reviewer)
- Master plan doc; consolidated test plan; per-PR acceptance notes

## How to proceed
- Kick off six subagents in parallel; each produces code changes, tests, and diagnostics.
- Orchestrator consolidates results into master plan and six PRs.

This document is the canonical plan for the orchestration run and will be updated as subagents publish results.
