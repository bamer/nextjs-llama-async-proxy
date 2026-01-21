Phase 2 Frontend Sweep (100%)

Objective
- Complete 2-4 targeted files with DOM-based rendering (no innerHTML for core render paths) to enforce realtime, socket-first updates.

Files patched in Phase 2 (executed in parallel)
- public/js/pages/models.js
- public/js/pages/logs.js
- public/js/components/llama-router-card.js
- public/js/components/dashboard/system-health.js

Approach
- Replace string-based DOM updates with DOM-building patterns (createElement, appendChild, replaceChild).
- Avoid direct innerHTML manipulations in render/update paths.
- Ensure event bindings remain intact and UI remains responsive.

Verification notes
- Unit tests to validate DOM structures created by new renderers.
- Manual smoke tests for UI pages to ensure no breakages.
