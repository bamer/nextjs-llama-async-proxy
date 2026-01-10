# Consolidated Quickstart Guide

Comprehensive reference guide for the Llama Proxy Dashboard, consolidating all quick guides, debugging procedures, and feature documentation.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Presets System](#presets-system)
3. [Logging System](#logging-system)
4. [Project Status](#project-status)
5. [Restart & Testing](#restart--testing)
6. [Debug Procedures](#debug-procedures)
7. [Performance Improvements](#performance-improvements)
8. [Phase 1 Quick Wins](#phase-1-quick-wins)
9. [Component Fixes](#component-fixes)
10. [Code Analysis](#code-analysis)

---

## Quick Start

### Server Startup (2 minutes)

```bash
# Start server
pnpm start

# Open browser
http://localhost:3000
```

### Verify Installation

- [ ] Server running on port 3000
- [ ] Can click "Presets" link in sidebar
- [ ] "+ New Preset" button works
- [ ] Can add models to preset
- [ ] Can download INI file
- [ ] Can copy command
- [ ] Files in config/ directory

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| server/handlers/presets.js | Backend logic | 456 |
| public/js/pages/presets.js | UI component | 700+ |
| public/js/services/presets.js | Socket.IO API | 207 |
| public/css/pages/presets/presets.css | Styling | 230+ |

---

## Presets System

### Create Preset (2 minutes)

1. Click "+ New Preset"
2. Enter name
3. Click "Create"

### Add Model to Preset

1. Select preset
2. Click "+ Add Model"
3. Fill form with model parameters
4. Click "Add"

### Use Preset

1. Click "Copy Command"
2. Paste in terminal
3. Run llama-server

### INI File Format

```ini
LLAMA_CONFIG_VERSION = 1

[model-name]
model = ./models/model.gguf
ctx-size = 8192
temp = 0.7
n-gpu-layers = 99
threads = 8
batch = 512
```

### Performance Metrics

| Operation | Time |
|-----------|------|
| Create preset | < 100ms |
| Add model | < 100ms |
| List presets | < 50ms |
| Download file | < 10ms |

---

## Logging System

### Quick Test (2 minutes)

1. Open **Settings** page
2. Find **Log Level** select box
3. Change to "Error"
4. Should change visually immediately
5. Open DevTools Console (F12)
6. Look for: `[DEBUG] LoggingConfig.onLogLevelChange: { value: "error", ... }`

### Save Settings Test

1. With Log Level on "Error", click **Save All Settings**
2. Should see notification: "Settings saved successfully"
3. Check server console for: `[DEBUG] Log level changed to: error`

### Logs Page Test

1. Navigate to **Logs** page
2. Wait 2 seconds
3. Should see logs displayed
4. Look for: `[DEBUG] readLogFile response: { logsCount: 5, ... }`

### Log Level Values

| Level | Value | Description |
|-------|-------|-------------|
| debug | 3 | Most verbose - shows all |
| info | 2 | Default - shows info, warn, error |
| warn | 1 | Shows warn, error only |
| error | 0 | Shows error only |

### Console Messages

```
[DEBUG] LoggingConfig.onLogLevelChange: { value: "error", normalized: "error" }
[DEBUG] Calling parent callback with value: error
[DEBUG] SettingsPage.onLogLevelChange: { val: "error", oldValue: "debug" }
```

---

## Project Status

**Last Updated**: 2025-01-06
**Status**: ✅ COMPLETE & VERIFIED

### Executive Summary

| Metric | Value |
|--------|-------|
| Critical bugs fixed | 4 |
| Code quality issues resolved | 7 |
| Tests passing | 406/406 (100%) |
| Regressions | 0 |

### Critical Bug Fixes

| Issue | File | Impact | Status |
|-------|------|--------|--------|
| formatBytes() decimal | server.js:283 | 5 tests | ✅ Fixed |
| extractArchitecture fallback | server.js:242-245 | 2 tests | ✅ Fixed |
| extractQuantization regex | server.js:262,268,272 | 1 test | ✅ Fixed |
| models:scan O(n²) perf | server.js:427,430 | 100x faster | ✅ Fixed |

### Code Quality Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total ESLint issues | 141 | 92 | -35% |
| Errors | 12 | 0 | -100% |
| Warnings | 129 | 92 | -29% |

### Documentation Created

1. CODEBASE_ANALYSIS.md (19 KB) - Complete analysis of 31 issues
2. CRITICAL_BUGS_FIXED.md (8 KB) - Executive summary of 4 critical fixes
3. FIXES_APPLIED.md (6 KB) - Technical breakdown of each fix
4. QUICK_FIXES.md (4 KB) - Step-by-step instructions
5. CODE_QUALITY_FIXES.md (8 KB) - Code quality improvements

---

## Restart & Testing

### Restart Server (2 minutes)

```bash
# Stop server (Ctrl+C)
# Restart
pnpm start
```

Expected output:
```
> Llama Async Proxy Dashboard
> http://localhost:3000
```

### Refresh Browser

```
Ctrl+Shift+R (Cmd+Shift+R on Mac)
```

### Test Logs Page (1 minute)

1. Click "Logs" in sidebar
2. Wait 2 seconds
3. ✅ Should see logs listed
4. If empty: Check browser console for `[DEBUG]` messages

### Test Settings Page (2 minutes)

1. Click "Settings" in sidebar
2. Find "Log Level" dropdown
3. Change it (debug → info)
   - ✅ Should change immediately
   - Should be fast, not slow
4. Click "Save All Settings"
   - ✅ Should see "Settings saved successfully"
5. Check server console for: `[DEBUG] Log level changed to: info`

### Expected Results

| Test | Expected Result |
|------|-----------------|
| Logs page | ✅ Shows logs from database |
| Select dropdown | ✅ Changes immediately & fast |
| Save button | ✅ Saves successfully |
| Server applies | ✅ Shows [DEBUG] message |
| Console messages | ✅ Shows [DEBUG] logs |

### Emergency Checklist

- [ ] Server restarted? (Ctrl+C then pnpm start)
- [ ] Browser hard refreshed? (Ctrl+Shift+R)
- [ ] Console checked for errors? (F12)
- [ ] Database file exists? (ls data/llama-dashboard.db)
- [ ] Logs directory exists? (ls -la logs/)
- [ ] Network tab shows WebSocket connection?

---

## Debug Procedures

### Select Box Not Changing

1. **Check Component.h value binding**
   - Open DevTools Elements panel
   - Right-click select element
   - Check if `value="..."` attribute exists

2. **Test event firing manually**

   ```javascript
   const select = document.querySelector('select[data-field="log-level"]');
   select.value = "error";
   select.dispatchEvent(new Event("change", { bubbles: true }));
   ```

### No Logs Appearing

1. **Check if logs are being created**

   ```bash
   ls -la logs/
   cat logs/app-YYYYMMDD.log
   ```

2. **Check database**

   ```bash
   sqlite3 data/llama-dashboard.db "SELECT COUNT(*) FROM logs;"
   ```

3. **Check socket connection**
   - DevTools Network tab
   - Filter for WS (WebSocket)
   - Should see `/llamaproxws` connection

### Settings Not Saving

1. **Check network request**
   - DevTools Network tab
   - Look for `settings:update` WebSocket event

2. **Test manually**

   ```javascript
   stateManager
     .updateSettings({ logLevel: "error" })
     .then((r) => console.log("Success:", r))
     .catch((e) => console.error("Error:", e));
   ```

---

## Performance Improvements

### Applied Fixes

| Fix | File | Impact | Status |
|-----|------|--------|--------|
| Database indexes | server/db.js | 10-100x faster queries | ✅ DONE |
| Metrics pruning | server/db.js | Bounded DB size | ✅ DONE |
| Delta-based CPU | server.js | 30% more accurate | ✅ DONE |
| GGUF buffer allocation | gguf-parser.js | 20-30% faster parsing | ✅ DONE |
| Shallow equality check | state.js | 30-50% fewer re-renders | ✅ DONE |

### Performance Metrics

| Area | Before | After | Gain |
|------|--------|-------|------|
| Get all models | 200-500ms | 20-50ms | 90-95% |
| Get logs (100 items) | 300-800ms | 10-30ms | 95% |
| Get metrics history | 200-600ms | 15-40ms | 90% |
| API latency | 150-300ms | 100-150ms | 30-40% |
| Memory (24h) | ~500MB | ~250MB | 50% reduction |
| GGUF parsing | 500ms | 350-400ms | 30% |
| Re-renders per action | 5-10 | 1-2 | 80% reduction |

### Deployment Checklist

- [ ] Run `pnpm test` - All tests pass
- [ ] Run `pnpm lint` - No linting errors
- [ ] Delete old database: `rm data/llama-dashboard.db`
- [ ] Start server: `pnpm start`
- [ ] Verify indexes created in logs

### Monitoring Commands

```bash
# Check database size
du -sh data/llama-dashboard.db

# Watch pruning logs
tail -f server.log | grep "Pruned"

# Check API performance (browser console)
console.time("getModels");
await stateManager.getModels();
console.timeEnd("getModels");
```

---

## Phase 1 Quick Wins

### Features Implemented

#### 1. Dark Mode Toggle

- Toggle button in sidebar footer (🌙 Dark / ☀️ Light)
- Theme persistence in localStorage
- Automatic application of dark-mode class

#### 2. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + H | Show shortcuts help |
| Ctrl + D | Navigate to Dashboard |
| Ctrl + M | Navigate to Models |
| Ctrl + P | Navigate to Presets |
| Ctrl + G | Navigate to Settings |
| Ctrl + L | Navigate to Logs |
| Ctrl + S | Scan models / Save settings |
| Escape | Close all modals |

#### 3. Model Favorite/Star System

- Star icon (★/☆) in model table rows
- Toggle favorite status with click
- "Show Favorites Only" checkbox filter
- Favorites sorted first in list
- Persistent storage in database

#### 4. One-Click Model Test

- "Test" button in each model row
- Simple prompt ("Hello!") completion
- Success/failure notification
- Output displayed in notification

#### 5. Export/Import Configuration

- Export configuration to JSON file
- Import configuration from JSON file
- Validation of imported configuration
- User notifications for success/failure

#### 6. Quick Preset Templates

| Template | Settings |
|----------|----------|
| Fast Chatbot | temp 0.7, top_p 0.9 |
| Creative Writing | temp 0.9, top_p 0.95 |
| Code Generation | temp 0.2, top_p 0.95 |
| Minimal RAM | batch 256, ctx 2048 |

### Files Created (10 files)

1. `public/js/utils/keyboard-shortcuts.js`
2. `public/js/components/keyboard-shortcuts-help.js`
3. `public/js/components/models/model-table-row.js`
4. `public/js/components/models/model-filters.js`
5. `public/js/components/settings/config-export-import.js`
6. `public/js/components/presets/preset-templates.js`
7. `public/js/pages/models/controller.js`
8. `public/js/pages/models/page.js`
9. `public/css/components/quick-wins.css`

---

## Component Fixes

### Double-Click Issue Fix

**Problem**: Clicking navigation triggered twice

**Solution** in `layout.js`:

```javascript
handleClick(e) {
  const t = e.target.closest("[data-page]");
  if (t) {
    e.preventDefault();
    e.stopPropagation();  // ← Added this
    const p = t.dataset.page;
    window.router.navigate(`/${p === "dashboard" ? "" : p}`);
  }
}
```

### Settings Save Button Fix

**Problem**: Had to click save button twice

**Root Cause**: Event listeners accumulated without cleanup

**Solution** in `component.js`:

```javascript
_cleanupEvents() {
  if (!this._delegatedHandlers) return;
  Object.entries(this._delegatedHandlers).forEach(([key, handler]) => {
    const [event] = key.split("|");
    document.removeEventListener(event, handler, false);
  });
}

bindEvents() {
  // Always clean up old listeners first
  this._cleanupEvents();
  this._delegatedHandlers = {};
  // ... rest of binding
}
```

### Single Smart Start Button

**Before**: Two start buttons (confusing)

**After**: Single smart button

```javascript
async handleStart(event) {
  event.preventDefault();
  event.stopPropagation();
  this.state.routerLoading = true;
  this._updateUI();

  // If preset selected, launch with preset; otherwise start normally
  if (this.state.selectedPreset) {
    await this.handleLaunchPreset(event);
  } else {
    this.state.onAction("start");
  }
}
```

Button text dynamically shows:
- "▶ Starting..." (during loading)
- "▶ Start with Preset" (when preset selected)
- "▶ Start Router" (when no preset selected)

### Router Card Unification

**Before**: Two separate components (Dashboard + Settings)

**After**: Single unified RouterCard

| Feature | Before | After |
|---------|--------|-------|
| State Reflection | Dashboard only | Both pages |
| Loading States | Dashboard only | Both pages |
| UI Updates | Different | Consistent |

---

## Code Analysis

### Critical Bugs Found (11 total)

| # | Bug | Severity | Tests Failing |
|---|-----|----------|---------------|
| 1 | formatBytes() missing decimal | HIGH | 5 |
| 2 | extractArchitecture() wrong fallback | HIGH | 2 |
| 3 | extractQuantization() regex broken | MEDIUM | 1 |
| 4 | Memory leak in bindEvents() | MEDIUM | - |
| 5 | Memory leak in subscribe() | LOW-MEDIUM | - |
| 6 | models:scan O(n²) loop | MEDIUM | - |
| 7 | Duplicate files on scan | MEDIUM | - |
| 8 | Router scroll position | LOW | - |
| 9 | Component.update() focus loss | LOW | - |
| 10 | Socket timeout 30s | LOW | - |
| 11 | Line length violations | LOW | 24 |

### Performance Issues (5 total)

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Metrics collection CPU | MEDIUM | CPU usage |
| 2 | DB query in loop | HIGH | I/O bottleneck |
| 3 | Models list reload | LOW-MEDIUM | Network |
| 4 | No pagination logs | LOW | Memory |
| 5 | Socket broadcast scope | MEDIUM | Bandwidth |

### Priority Fix Order

**Phase 1 (CRITICAL)**:
1. Fix formatBytes() decimal
2. Fix extractArchitecture() fallback
3. Fix extractQuantization() regex
4. Fix models:scan DB loop

**Phase 2 (HIGH)**:
5. Remove event listener memory leaks
6. Fix Socket broadcast scope
7. Add input debouncing

**Phase 3 (MEDIUM)**:
8. Extract metadata parsing
9. Add pagination to logs
10. Implement error boundaries

**Phase 4 (LOW)**:
11. Fix ESLint warnings
12. Remove unused variables
13. Consolidate test helpers

### Files Most Affected

1. **server.js** (8 issues) - Metadata parsing, scan logic
2. **public/js/core/component.js** (2 issues) - Memory leaks, UX
3. **public/js/core/state.js** (3 issues) - Timeout, listener cleanup
4. **public/js/pages/models.js** (1 issue) - Render performance

---

## Consolidated From

This document consolidates information from the following files:

1. QUICK_REFERENCE.md
2. QUICK_TEST_LOGGING.md
3. START_HERE.md
4. STATUS.md
5. RESTART_AND_TEST.md
6. DEBUG_STEPS.md
7. FINAL_STATS_GRID_FIX.md
8. COMPLETE_IMPROVEMENTS.md
9. CODEBASE_ANALYSIS.md
10. PHASE_1_QUICK_WINS_SUMMARY.md
11. PERFORMANCE_CHECKLIST.md
12. FIX_DOUBLE_CLICK_ISSUE.md
13. SINGLE_START_BUTTON_FIX.md
14. COMPONENT_UNIFICATION.md

---

**Last Updated**: 2026-01-11
**Status**: ✅ Ready for Use
