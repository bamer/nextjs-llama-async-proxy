# Customer Release Preparation: Issue Report & Action Plan

**Project:** Next.js Llama Async Proxy Dashboard  
**Assessment Date:** January 14, 2026  
**Release Readiness Score:** 7/10  
**Target:** v1.0 Customer Release

---

## Executive Summary

The project demonstrates strong architectural foundations with a modular backend, event-driven frontend, and comprehensive test coverage (600+ tests). However, 10 files violate the 200-line limit, debug logging is pervasive, and there are several critical bugs and memory leak risks that must be addressed before release.

---

## 1. CRITICAL ISSUES (Must Fix Before Release)

### 1.1 Server Template Literal Bug
**File:** `server.js:79`  
**Severity:** Critical  
**Status:** Bug

```javascript
// CURRENT (BROKEN):
console.log("> Socket.IO: ws://localhost:${PORT}/llamaproxws\n");

// SHOULD BE:
console.log(`> Socket.IO: ws://localhost:${PORT}/llamaproxws\n`);
```

**Impact:** Template literal not interpolated, shows `${PORT}` literally in console output.

**Fix:** Change double quotes to backticks for proper interpolation.

---

### 1.2 Memory Leak in Metrics Collection
**File:** `server/metrics.js:218-222`  
**Severity:** Critical  
**Status:** Bug

```javascript
if (metricsCallCount % 2 === 0) {
  collectLlamaMetrics(io);
}
// Llama metrics collected every 20 seconds but NEVER pruned or cleaned up
```

**Impact:** Unlimited memory growth as llama-server metrics accumulate indefinitely.

**Fix:** 
- Add metrics retention policy (e.g., keep last 1000 data points)
- Implement pruning similar to `db.pruneMetrics()`
- Add cleanup in graceful shutdown

---

### 1.3 Closure Issue in Router Startup
**File:** `server/handlers/llama-router/start.js:252-286`  
**Severity:** Critical  
**Status:** Bug

```javascript
// cleanupProcess defined inside spawn callback but referenced after
const cleanupProcess = () => { /* ... */ };
spawn('llama-server', args, (err, child) => {
  // cleanupProcess referenced here but defined outside scope
});
```

**Impact:** Potential race condition and closure issues with process management.

**Fix:** Move cleanupProcess definition inside the spawn callback or ensure proper closure handling.

---

### 1.4 Frontend Memory Leaks
**File:** `public/js/pages/dashboard/controller.js:126-131`  
**Severity:** Critical  
**Status:** Bug

```javascript
const unsub = stateManager.subscribe("connectionStatus", (status) => {
  if (status === "connected") {
    unsub(); // Only unsub if connected
    this._loadData();
  }
});
setTimeout(() => {
  // unsub() called here for timeout but only if status !== "connected"
  // If status changes to "connected" after timeout, subscription leaks
}, 5000);
```

**Impact:** Subscriptions leak when connection timeout occurs.

**Fix:** Always unsubscribe on timeout, not just on connection.

---

## 2. HIGH PRIORITY ISSUES (Should Fix Before Release)

### 2.1 File Size Limit Violations

**Total Files Violating 200-Line Rule:** 10 files (5 backend, 5 frontend)

#### Backend Files (>200 lines)

| File | Lines | Limit | Excess | Priority |
|------|-------|-------|--------|----------|
| `server/handlers/llama-router/start.js` | 373 | 200 | +173 | **P0** |
| `server/handlers/presets/utils.js` | 389 | 200 | +189 | **P0** |
| `server/handlers/collab.js` | 444 | 200 | +244 | **P1** |

#### Frontend Files (>200 lines)

| File | Lines | Limit | Excess | Priority |
|------|-------|-------|--------|----------|
| `public/js/core/state-validator.js` | 396 | 200 | +196 | **P0** |
| `public/js/pages/dashboard/page.js` | 356 | 200 | +156 | **P0** |
| `public/js/pages/settings/settings-page.js` | 341 | 200 | +141 | **P0** |
| `public/js/pages/dashboard/controller.js` | 342 | 200 | +142 | **P1** |

**Impact:** Violates project mandate, increases maintenance burden, reduces readability.

**Solution:** Refactor into smaller modules following single-responsibility principle.

---

### 2.2 Excessive Debug Logging
**Files:** Throughout codebase  
**Severity:** High  
**Status:** Technical Debt

**Current State:** 100+ `[DEBUG]` console.log statements

| File | Debug Statements |
|------|------------------|
| `server/metrics.js` | 12 |
| `server/handlers/presets/handlers.js` | 40+ |
| Various frontend files | ~50 |

**Impact:** 
- Pollutes production logs
- Reduces signal-to-noise ratio
- Performance impact (string concatenation)

**Fix:**
```javascript
// Wrap in development check
if (process.env.NODE_ENV === 'development') {
  console.log("[DEBUG] Some operation", { data });
}

// Or remove entirely for production
```

---

### 2.3 Duplicate Functionality
**Files:** 
- `public/js/pages/dashboard/controller.js` AND `public/js/pages/dashboard/controller.js`
- `public/js/pages/models/models-controller.js` AND `public/js/pages/models/models.js`

**Severity:** High  
**Status:** Technical Debt

**Impact:** 
- Confusion over which file to edit
- Potential sync issues
- Wasted maintenance effort

**Solution:** Consolidate duplicates, keep best implementation, remove other.

---

### 2.4 Missing Metrics Retention Policy
**File:** `server/metrics.js`  
**Severity:** High  
**Status:** Missing Feature

**Current State:** 
- System metrics pruned via `db.pruneMetrics()`
- Llama metrics NEVER pruned

**Impact:** Unlimited memory growth from llama metrics.

**Fix:**
- Implement `pruneLlamaMetrics()` similar to system metrics
- Set retention policy (e.g., keep last 24 hours or 1000 points)
- Add to graceful shutdown

---

### 2.5 Missing Toast Container in HTML
**File:** `public/index.html`  
**Severity:** Medium  
**Status:** UX Issue

**Current State:** Toast container created dynamically by `notification.js`

**Impact:** 
- Slight delay in toast visibility
- Potential styling inconsistencies
- Not following HTML-first pattern

**Fix:** Add toast container to index.html:
```html
<div id="toast-container" class="toast-container"></div>
```

---

## 3. MEDIUM PRIORITY ISSUES (Polish Before Release)

### 3.1 Missing HTML Meta Tags
**File:** `public/index.html`  
**Severity:** Medium  
**Status:** UX Issue

**Missing:**
- `<meta name="description" content="...">`
- `<meta name="theme-color" content="...">`
- Open Graph tags for social sharing

**Fix:** Add appropriate meta tags for better UX and sharing.

---

### 3.2 CSS Syntax Error
**File:** `public/css/main.css:77`  
**Severity:** Medium  
**Status:** Bug

**Current State:** Missing closing brace for `@media` block

**Fix:** Add closing brace for media query.

---

### 3.3 Missing Script References
**File:** `public/index.html`  
**Severity:** Medium  
**Status:** Broken Link

**Lines:**
- 47: `/js/components/llama-server/llama-server-config.js`
- 90: `/js/components/keyboard-shortcuts-help.js`

**Impact:** 404 errors in browser console

**Fix:** Either create files or remove script tags.

---

### 3.4 No API Documentation
**Files:** Project-wide  
**Severity:** Medium  
**Status:** Documentation Gap

**Impact:** Difficult for developers to extend Socket.IO API

**Fix:** Create `docs/API.md` with all Socket.IO events documented.

---

### 3.5 Missing Model Update Endpoint
**Files:** `server/handlers/models/`  
**Severity:** Medium  
**Status:** Missing Feature

**Current State:** Only `models:save` and `models:delete` exist

**Impact:** Cannot update individual model properties (e.g., favorite status)

**Fix:** Add `models:update` endpoint:
```javascript
socket.on('models:update', async (req) => {
  const { id, updates } = req;
  // Validate updates
  // Update in database
  // Broadcast change
});
```

---

### 3.6 Duplicate npm Packages
**File:** `package.json`  
**Severity:** Low  
**Status:** Technical Debt

**Issue:** Both `gguf` and `@huggingface/gguf` installed

**Impact:** 
- Increased bundle size
- Confusion over which to use
- Potential version conflicts

**Fix:** Remove duplicate, use single package.

---

### 3.7 No Rate Limiting
**Files:** `server.js` and handlers  
**Severity:** Low  
**Status:** Missing Security Feature

**Impact:** No protection against API abuse

**Fix:** Add basic rate limiting:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

---

## 4. LOW PRIORITY ISSUES (Nice to Have)

### 4.1 Missing favicon
**File:** `public/`  
**Severity:** Low  
**Status:** UX Issue

**Impact:** Browser shows 404 for favicon.ico

**Fix:** Add favicon or link to SVG/PNG version.

---

### 4.2 No Loading States
**Files:** Frontend pages  
**Severity:** Low  
**Status:** UX Improvement

**Impact:** No visual feedback during async operations

**Fix:** Add loading spinners/skeletons to async operations.

---

### 4.3 Keyboard Shortcuts
**Files:** `public/js/components/keyboard-shortcuts-help.js`  
**Severity:** Low  
**Status:** Incomplete

**Issue:** Script referenced in HTML but may not exist

**Impact:** Broken feature

**Fix:** Implement or remove.

---

## 5. PRIORITIZED ACTION PLAN

### Phase 1: Critical Fixes (Day 1)

#### Task 1.1: Fix Server Template Literal
**Subtask:** `fix-server-template-literal`  
**File:** `server.js:79`  
**Effort:** 5 minutes  
**Status:** Pending

**Acceptance Criteria:**
- [ ] Template literal properly interpolated
- [ ] Console output shows correct port

**Deliverables:**
- Fixed server.js

---

#### Task 1.2: Fix Memory Leak in Metrics
**Subtask:** `fix-metrics-memory-leak`  
**Files:** `server/metrics.js`, `server/db/metrics-repository.js`  
**Effort:** 2 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] Llama metrics capped at 1000 data points
- [ ] Pruning implemented similar to system metrics
- [ ] Memory growth stopped under load test

**Deliverables:**
- Updated metrics.js with pruning
- Updated metrics-repository.js with pruneLlamaMetrics()
- Updated shutdown.js to clean metrics on exit

---

#### Task 1.3: Fix Router Startup Closure
**Subtask:** `fix-router-startup-closure`  
**Files:** `server/handlers/llama-router/start.js`  
**Effort:** 1 hour  
**Status:** Pending

**Acceptance Criteria:**
- [ ] Cleanup function properly scoped
- [ ] Process cleanup works reliably
- [ ] No closure-related race conditions

**Deliverables:**
- Refactored start.js with proper closure handling

---

#### Task 1.4: Fix Frontend Memory Leaks
**Subtask:** `fix-frontend-memory-leaks`  
**Files:** `public/js/pages/dashboard/controller.js`, `public/js/core/state.js`  
**Effort:** 2 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] All subscriptions cleaned up on timeout
- [ ] Controller lifecycle properly implemented
- [ ] No memory leaks under navigation stress test

**Deliverables:**
- Fixed subscription cleanup in dashboard controller
- Updated state.js with leak detection (optional)

---

### Phase 2: Code Quality (Day 2-3)

#### Task 2.1: Refactor Backend Files
**Subtask:** `refactor-backend-files`  
**Files:** 
- `server/handlers/llama-router/start.js` (373 → ~200 lines)
- `server/handlers/presets/utils.js` (389 → ~200 lines)
- `server/handlers/collab.js` (444 → ~200 lines)  
**Effort:** 6 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] All backend files ≤200 lines
- [ ] Single responsibility per module
- [ ] No functionality loss

**Plan:**
```
start.js → start.js + process-spawner.js + args-builder.js
utils.js → utils.js + validator.js + template-engine.js
collab.js → collab.js + presence.js + sync.js (if kept)
```

**Deliverables:**
- Refactored backend modules
- Updated imports in handlers.js

---

#### Task 2.2: Refactor Frontend Files
**Subtask:** `refactor-frontend-files`  
**Files:**
- `public/js/core/state-validator.js` (396 → ~200 lines)
- `public/js/pages/dashboard/page.js` (356 → ~200 lines)
- `public/js/pages/settings/settings-page.js` (341 → ~200 lines)
- `public/js/pages/dashboard/controller.js` (342 → ~200 lines)  
**Effort:** 8 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] All frontend files ≤200 lines
- [ ] Component patterns consistent
- [ ] No functionality loss

**Plan:**
```
state-validator.js → validator.js + schema.js + errors.js
settings-page.js → settings-page.js + config-form.js + theme-settings.js
dashboard/page.js → dashboard.js + metrics-chart.js + router-status.js
dashboard/controller.js → Consolidate with duplicate
```

**Deliverables:**
- Refactored frontend modules
- Updated imports in controllers

---

#### Task 2.3: Clean Debug Logging
**Subtask:** `clean-debug-logging`  
**Files:** Throughout codebase  
**Effort:** 3 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] All [DEBUG] logs wrapped in NODE_ENV check OR removed
- [ ] Production logs clean and meaningful
- [ ] No performance impact from debug logging

**Plan:**
```javascript
// Pattern to use:
if (process.env.NODE_ENV === 'development') {
  console.log("[DEBUG] Detail", { data });
}

// Or remove entirely for truly verbose logs
```

**Deliverables:**
- Updated metrics.js
- Updated handlers/presets/handlers.js
- Updated all frontend files with debug logs
- Documentation: "Debug logging only enabled in development mode"

---

#### Task 2.4: Remove Duplicate Files
**Subtask:** `remove-duplicate-files`  
**Files:**
- `public/js/pages/dashboard/dashboard-controller.js` (vs controller.js)
- `public/js/pages/models/models-controller.js` (vs models.js)  
**Effort:** 1 hour  
**Status:** Pending

**Acceptance Criteria:**
- [ ] No duplicate controller files
- [ ] Consistent naming (use controller.js pattern)
- [ ] Imports updated in router.js

**Plan:**
1. Compare duplicate files
2. Keep best implementation
3. Delete duplicates
4. Update router.js imports

**Deliverables:**
- Removed duplicate files
- Updated router.js

---

### Phase 3: Polish (Day 4-5)

#### Task 3.1: Fix HTML/CSS Issues
**Subtask:** `fix-html-css-issues`  
**Files:** `public/index.html`, `public/css/main.css`  
**Effort:** 2 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] Meta tags added (description, theme-color)
- [ ] Toast container in HTML
- [ ] CSS syntax error fixed
- [ ] Missing script tags resolved (create or remove)

**Deliverables:**
- Updated index.html
- Fixed main.css
- Created missing component files OR removed script tags

---

#### Task 3.2: Add API Documentation
**Subtask:** `add-api-documentation`  
**Files:** `docs/API.md` (new file)  
**Effort:** 3 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] All Socket.IO events documented
- [ ] Request/response formats specified
- [ ] Examples provided for each event

**Deliverables:**
- `docs/API.md` with complete Socket.IO API reference

---

#### Task 3.3: Add Missing Features
**Subtask:** `add-missing-features`  
**Files:** `server/handlers/models/`, `server/db/`  
**Effort:** 4 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] `models:update` endpoint implemented
- [ ] Favorite status can be updated via API
- [ ] Database has index on favorite field

**Deliverables:**
- New endpoint: `models:update`
- Database migration: add idx_models_favorite
- Updated Socket.IO event handlers

---

#### Task 3.4: Cleanup Dependencies
**Subtask:** `cleanup-dependencies`  
**Files:** `package.json`  
**Effort:** 30 minutes  
**Status:** Pending

**Acceptance Criteria:**
- [ ] Only one GGUF package installed
- [ ] No unused dependencies
- [ ] All versions current

**Deliverables:**
- Cleaned package.json
- Updated package-lock.json

---

### Phase 4: Testing & Verification (Day 6-7)

#### Task 4.1: Comprehensive Testing
**Subtask:** `comprehensive-testing`  
**Files:** Test suite, application  
**Effort:** 4 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] All existing tests pass
- [ ] New tests for refactored code
- [ ] Memory leak test (navigation stress test)
- [ ] Load test (metrics collection under load)
- [ ] Integration test (full user workflow)

**Deliverables:**
- Test report
- Memory leak test results
- Load test results

---

#### Task 4.2: Code Review & Final Polish
**Subtask:** `code-review-final-polish`  
**Files:** Entire codebase  
**Effort:** 4 hours  
**Status:** Pending

**Acceptance Criteria:**
- [ ] All 200-line violations resolved
- [ ] No debug logs in production code
- [ ] No broken imports or references
- [ ] Consistent code style (Prettier verified)
- [ ] ESLint passes with no errors

**Deliverables:**
- Code review report
- Fixed linting issues
- Formatted code (Prettier)

---

## 6. SCOPE DEFINITION

### In Scope for v1.0

✅ **Core Functionality:**
- Models management (list, scan, load, unload, update)
- Llama server control (start, stop, status)
- Presets (create, save, delete, apply)
- Router mode support (multi-model)

✅ **Monitoring:**
- Metrics dashboard (CPU, memory, GPU)
- Real-time updates via Socket.IO
- Logs viewer (filter, clear)

✅ **Settings:**
- Configuration management
- Settings persistence

✅ **Architecture:**
- Event-driven DOM updates
- Modular backend
- SQLite database
- Graceful shutdown

❌ **NOT in Scope for v1.0:**
- Advanced collaboration features (collab.js incomplete)
- Real-time collaboration/sync
- Batch model operations
- Rate limiting (security)
- Advanced analytics

**Rationale:** Collaboration features in `collab.js` are incomplete and would delay release. Focus on core functionality polish.

---

## 7. EFFORT ESTIMATION

| Phase | Tasks | Effort | Total |
|-------|-------|--------|-------|
| Phase 1: Critical | 4 tasks | 5 hours | 5 hours |
| Phase 2: Quality | 4 tasks | 18 hours | 23 hours |
| Phase 3: Polish | 4 tasks | 10 hours | 33 hours |
| Phase 4: Testing | 2 tasks | 8 hours | 41 hours |

**Total Estimated Effort:** 41 hours (1 week)

---

## 8. SUCCESS CRITERIA

### Release Checklist

- [ ] All critical issues fixed
- [ ] No files > 200 lines
- [ ] No debug logs in production
- [ ] No memory leaks detected
- [ ] All tests pass (600+ tests)
- [ ] ESLint passes with no errors
- [ ] Prettier formatting applied
- [ ] API documentation created
- [ ] HTML/CSS issues resolved
- [ ] Missing features implemented (models:update)
- [ ] Dependencies cleaned up
- [ ] Duplicate files removed

### Performance Benchmarks

- [ ] Application starts in < 3 seconds
- [ ] Socket.IO connects in < 1 second
- [ ] Metrics update every 10 seconds without lag
- [ ] Memory usage stable over 24-hour period
- [ ] No console errors in production

### Code Quality

- [ ] ESLint: 0 errors, 0 warnings
- [ ] Test coverage: > 80% (current: ~70%)
- [ ] Documentation: API docs complete
- [ ] No TODO comments in production code

---

## 9. NEXT STEPS

### Immediate Actions

1. **Start Phase 1 immediately** - Critical fixes prevent crashes and data issues
2. **Schedule Phase 2** - Code quality enables maintainable codebase
3. **Plan Phase 3** - Polish ensures good first impression
4. **Reserve Phase 4** - Testing validates all work

### Future Versions

**v1.1 (Post-Release):**
- Add rate limiting
- Implement batch model operations
- Add keyboard shortcuts
- Improve loading states
- Add favicon

**v2.0 (Future):**
- Complete collaboration features
- Advanced analytics
- Multi-user support with auth
- Plugin system
- Mobile responsive design

---

## 10. RISKS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Refactoring introduces bugs | Medium | High | Comprehensive testing in Phase 4 |
| Timeline too aggressive | Medium | Medium | Prioritize critical issues, defer polish if needed |
| Dependencies break on update | Low | High | Test thoroughly, keep versions stable |
| Memory leak deeper than expected | Low | High | Use profiling tools, allocate extra time |

---

**Document Version:** 1.0  
**Created:** January 14, 2026  
**Last Updated:** January 14, 2026  
**Status:** Ready for Review