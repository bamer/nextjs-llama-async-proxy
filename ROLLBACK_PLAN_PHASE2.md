ROLLBACK PLAN: Phase 2 Bridge Event Migration
Overview
- If Phase 2 bridge path causes regressions (Dashboard data not rendering, UI errors, or socket failures), rollback to the original, pure bridge path and defer long-term migration.

Rollback Triggers
- Any dashboards rendering regressions after enabling bridge path
- Recurrent errors in models:*/llama:* path synchronization
- Loss of stability in socket connection or server logs indicating critical error patterns

Rollback Actions
- Revert to old router:* bridge behavior if needed (disconnect and reestablish) and ensure models:* paths continue to function
- Disable ENABLE_ROUTER_V2 flag to revert to bridge-only mode
- Verify Dashboard loads data correctly and Settings resets to previous state

Evidence & Verification
- Show a before/after payload example during rollback; include the exact logs
- Ensure tests skip canaries and revert to bridging only
