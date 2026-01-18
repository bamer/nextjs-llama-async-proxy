Bridge Decision: Router Event Migration Strategy

Goal
- Define whether to continue with a straightforward router:* bridge (OFF in Phase 2) or adopt a long-term, flag-driven migration (ENABLE_ROUTER_V2) with dual broadcasts and gated frontend subscriptions.
- Based on current evidence, Dashboard must render reliably as quickly as possible; long-term path should minimize risk and enable Settings migration later with a single source of truth for events.

Recommendation (Current Plan)
- Phase 2 (Dashboard-first bridging): OFF bridge (router:* -> llama:*) with compatibility, no feature flag for Phase 2; canary/QA gates prepare for Phase 3.
- Phase 3+: Move Settings to llama:* with ENABLE_ROUTER_V2 flag; gate Dashboard to llama:*; dual broadcasts under ON
- Documentation: Maintain flat PLAN.md and CONTRACTS.md as living docs to reflect changes.

Rationale
- Dashboard is the most visible surface; ensuring it renders data reliably is the top priority.
- A flag-driven approach reduces risk by letting us switch between backward-compatible bridging and long-term path with minimal disruption.
- A flat docs approach makes it easier to maintain and track changes without nested documentation that can drift.

Rollback & Safety
- If canaries show any regression, rollback to the bridge-only path and postpone the long-term migrations until issues are resolved.
- In any path, all existing models operations (list/load/unload) must keep working as before.
