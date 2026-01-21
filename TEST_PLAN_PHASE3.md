TEST PLAN: Phase 3 — Settings gating & Dashboard stability

Objective
- Validate that the Dashboard remains stable as we gate Settings behind ENABLE_ROUTER_V2 and migrate Settings to llama:* streams.

Prerequisites
- ENABLE_ROUTER_V2 flag is ON for the long-term path and OFF for bridge path; ensure canary environment exists.
- Access to Dashboard, Settings, and canary environment. Local development environment must be configured with pnpm and Node.js.

Test Cases
1. Dashboard loads with bridge path (OFF)
   - Input: Open dashboard
   - Expected: Dashboard renders model data and metrics; no placeholders
   - How to verify: UI shows loaded models, metrics, and router status updated; logs show successful router:status bridge
2. Settings loads under bridging (OFF)
   - Input: Open settings
   - Expected: Settings shows router config and status; no errors
   - How to verify: UI shows router config values
3. Enable_ROUTER_V2 OFF to ON switch canary manually
   - Input: Toggle flag to ON in config
   - Expected: Dashboard continues to render; Settings migrates to llama:*
   - How to verify: Both pages reflect new events; dual broadcasts observed
4. Presets binding (non-blocking) during Phase 3
   - Input: Change presets; verify UI updates
   - Expected: presets dropdown remains synchronized
   - How to verify: UI shows updated presets after operation

Success Criteria
- All test cases pass; no regression in models:list/connectivity; Dashboard renders without placeholders; Settings migration proceeds without breaking Dashboard.

How to Execute
- Run: pnpm install
- Start server: pnpm start
- Access: http://localhost:3000
- Use browser devtools to verify network events and socket messages
- Capture: logs, payload samples, and screenshots as evidence
