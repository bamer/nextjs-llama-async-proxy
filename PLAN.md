Flat Plan: Aggressive Phase 3 Rollout (Dashboard-first) with Canary

Overview
- Goal: Move Settings gating to the ENABLE_ROUTER_V2 path aggressively to get the entire application up and running quickly, with Dashboard stabilized first and Settings following in the canary rollout.
- Approach: Immediate gating of Settings behind ENABLE_ROUTER_V2; Dashboard continues to use dual-path paths behind the scenes, with a canary rollout to Settings. Flat docs updated to reflect the plan.

Phase 3 Rollout (Aggressive)
- Phase 3.0 (Immediate Gate): Enable gating in Settings and route to llama:* streams when ON; disable for OFF to test compatibility.
- Phase 3.1 (Dashboard sanity): Verify Dashboard renders with new binding on/off; collect proof of no regressions on Dashboard load.
- Phase 3.2 (Settings canary): Enable Settings llama:* subscriptions in canary environment; verify Settings loads, saves, and updates propagate properly.
- Phase 3.3 (Evidence collection): Capture payloads, logs, and screenshots; run Phase 3 test plan; document results.

Phase 4 (Canary Governance)
- Phase 4 will scale canary gradually across environments with kill-switch criteria and rollback plan.

Artifacts to produce
- PLAN.md (flat; already) + TEST_PLAN_PHASE3.md + ROLLOUT_PLAN_PHASE3.md + BRIDGE_DECISION.md

Success Criteria
- Dashboard renders data normally while enabling the canary for Settings; no regressions observed.
- Settings migrates to llama:* streams cleanly; UI updates accordingly.
- All tests pass; evidence collected.

Evidence & Verification
- Payloads, logs, and screenshots from Phase 3 activities.
