# Codebase Analysis: Bugs and Performance Issues

## Executive Summary

Found **11 critical bugs**, **5 performance issues**, and **18 code quality violations**. Most bugs are in metadata parsing and the test suite.

---

## 🔴 CRITICAL BUGS (11)

### 1. **formatBytes() returns integer instead of float string** (server.js, line 278-285)
**Severity**: HIGH | **Type**: Logic Bug | **Tests failing**: 5 tests

**Issue**: Function returns `"512 B"` instead of `"512.0 B"`, breaking 5 test assertions.

```javascript
// Current (WRONG):
return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
// Returns: "512 B" (parseFloat removes trailing zero)

// Should be:
return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
// Returns: "512.0 B"
```

**Impact**: Tests fail, consistent formatting is broken across UI.

---

### 2. **extractArchitecture() returns wrong fallback** (server.js, lines 210-245)
**Severity**: HIGH | **Type**: Logic Bug | **Tests failing**: 2 tests

**Issue**: For unknown architectures like "unknown", should return `"LLM"` but returns the capitalized filename instead.

```javascript
// Line 242-243 (WRONG):
const firstWord = filename.split(/[-_\s]/)[0].replace(/\d+$/, "").toLowerCase();
if (firstWord.length > 3) return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
// Returns: "Unknown" instead of "LLM"

// Should be:
const firstWord = filename.split(/[-_\s]/)[0].replace(/\d+$/, "").toLowerCase();
if (firstWord.length > 3 && patterns.some(p => p.regex.test(filename))) 
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
// Or just skip the fallback entirely and return "LLM"
```

**Impact**: Unknown model architectures get confusing names like "Xyzabc123.gguf" instead of "LLM".

---

### 3. **extractQuantization() fails for GPT-OSS filenames** (server.js, lines 261-276)
**Severity**: MEDIUM | **Type**: Regex Bug | **Tests failing**: 1 test

**Issue**: Regex doesn't match quantization in `GPT-OSS-1B-Q8_0.gguf` format.

```javascript
// Current regex pattern (line 262):
/[-_](Q[0-9]+(?:_[A-Za-z0-9]+)+)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/
// Fails on "Q8_0" because: the `+` quantifier requires 2+ underscore parts
// Matches: Q4_K_M ✓, Q8_0 ✗ (needs lookahead after extension, not before)

// Should be:
/[-_](Q[0-9]+[_A-Z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/i
```

**Impact**: GPT-OSS and other quantization formats silently fail to extract.

---

### 4. **Memory leak in Component.bindEvents()** (public/js/core/component.js, lines 92-105)
**Severity**: MEDIUM | **Type**: Memory Leak

**Issue**: Event listeners are added to elements without cleanup. When component re-renders, old listeners remain attached.

```javascript
bindEvents() {
  const map = this.getEventMap();
  Object.entries(map).forEach(([spec, handler]) => {
    // ... binds listeners to this._el
    this._el.addEventListener(event, fn);
  });
  // NO CLEANUP! Old listeners stay on old elements
}
```

**Impact**: Memory builds up over time with every component update. Each navigation accumulates event listeners.

---

### 5. **Memory leak in stateManager.subscribe()** (public/js/core/state.js, line 121-124)
**Severity**: LOW-MEDIUM | **Type**: Memory Leak

**Issue**: Listeners added to state are never cleaned up when components destroy. The unsubscribe function returned from subscribe works, but many controllers don't call it.

```javascript
// Example: DashboardController (lines 5-46) uses stateManager.subscribe but:
// - Stores unsubs in array ✓
// - But willUnmount() not always called properly ✗
```

**Impact**: Long-running app accumulates listener callbacks.

---

### 6. **Race condition in models:scan handler** (server.js, lines 391-463)
**Severity**: MEDIUM | **Type**: Concurrency Bug

**Issue**: Calling `db.getModels()` inside loop (line 430) is called for EVERY file, not just once at start.

```javascript
// Line 430 (WRONG):
const existing = db.getModels().find(m => m.model_path === fullPath);
// This queries DB for every single file!

// Should be:
const existingModels = db.getModels(); // Once at start
for (const fullPath of modelFiles) {
  const existing = existingModels.find(m => m.model_path === fullPath);
```

**Impact**: Scanning 1000 files = 1000 DB queries. Massive performance hit.

---

### 7. **models:scan doesn't handle duplicate files** (server.js, lines 391-463)
**Severity**: MEDIUM | **Type**: Logic Bug

**Issue**: If a scan runs twice, it adds the same model files again because `findModelFiles()` doesn't deduplicate.

```javascript
// After first scan: model at /home/user/models/llama.gguf is added
// After second scan: same file is added AGAIN as new entry
// Database has duplicates with different IDs
```

**Impact**: Running scan multiple times creates duplicate entries.

---

### 8. **Router doesn't preserve scroll position** (public/js/core/router.js)
**Severity**: LOW | **Type**: UX Bug

**Issue**: Navigation changes page but doesn't scroll to top. Users end up mid-page.

```javascript
// navigate() should:
window.scrollTo(0, 0);
// But doesn't
```

**Impact**: User experience degradation on page navigation.

---

### 9. **Component.update() doesn't preserve focus** (public/js/core/component.js, lines 56-84)
**Severity**: LOW | **Type**: UX Bug

**Issue**: When component re-renders, focus is lost on input fields.

```javascript
update() {
  oldEl.replaceWith(newEl);
  // Focus lost on form inputs after update
}
```

**Impact**: Users typing in search/filter boxes get focus stolen after state updates.

---

### 10. **Socket timeout is 30 seconds, too short for slow networks** (public/js/core/state.js, line 145)
**Severity**: LOW | **Type**: Configuration Bug

```javascript
const timeout = setTimeout(() => {
  this.pending.delete(reqId);
  reject(new Error(`Timeout: ${event}`));
}, 30000);  // 30 seconds - too strict
```

**Impact**: Slow networks timeout and fail when scanning large directories.

---

### 11. **Line length violations (24 instances)** (multiple files)
**Severity**: LOW | **Type**: Code Quality

Lines exceeding 100 character limit:
- `public/js/core/state.js`: lines 189-204 (16 lines)
- `public/js/pages/dashboard.js`: lines 36, 57, 67 (3 lines)
- `public/js/components/layout/layout.js`: lines 22-26, 86, 91, 109 (5 lines)

---

## 🟡 PERFORMANCE ISSUES (5)

### 1. **Metrics collection queries ALL CPUs on every interval** (server.js, line 559)
**Severity**: MEDIUM | **Impact**: CPU usage

```javascript
const cpu = os.cpus().reduce((acc, c) => 
  acc + (c.times.user + c.times.nice + c.times.sys) / 
  (c.times.idle + c.times.user + c.times.nice + c.times.sys), 0) 
  / os.cpus().length * 100;
// Runs EVERY 10 seconds
```

**Fix**: Cache CPU count, use process.cpuUsage() instead.

---

### 2. **Database query in tight loop during scan** (server.js, line 430)
**Severity**: HIGH | **Impact**: I/O bottleneck

**Already mentioned in bug #6** - calling `db.getModels()` for each file.

---

### 3. **Models list reloaded on every state subscription** (public/js/pages/models.js, line 16-20)
**Severity**: LOW-MEDIUM | **Impact**: Network

Every model state change triggers a render. During bulk operations, causes cascading renders.

---

### 4. **No pagination for logs viewer** (public/js/pages/logs.js)
**Severity**: LOW | **Impact**: Memory

Loads ALL logs (limit: 100 by default) into memory and renders all DOM nodes.

---

### 5. **Socket broadcast to ALL clients on single model change** (server.js, line 371)
**Severity**: MEDIUM | **Impact**: Network bandwidth

```javascript
io.emit("models:status", { ... }); // Broadcasts to EVERYONE
// Should be: socket.emit(...) just to requester
// OR io.emit with socket.broadcast
```

---

## ⚠️ CODE QUALITY ISSUES (18)

### ESLint Violations:
1. **24 line-length warnings** - Lines exceeding 100 characters
2. **Unused variable** (`isInitial` in router.js:62)
3. **String concatenation** instead of template literals (layout.js:46)

### Design Issues:
1. **No error boundaries** - App crashes on unhandled errors
2. **No rate limiting** on socket events
3. **No request deduplication** - multiple rapid clicks send multiple requests
4. **Hardcoded paths** in database layer (should use environment variables)
5. **No request validation** on socket handlers

### Frontend Architecture:
1. **Component re-render is slow** - entire component replaced instead of diffing
2. **No virtual scrolling** for long lists
3. **No debouncing** on search/filter inputs
4. **Socket handlers create closures** inside loops (performance issue)

### Testing:
1. **100% coverage required but tests are failing**
2. **Test functions duplicated between test file and server** (code duplication)

---

## 📋 PRIORITY FIX ORDER

### Phase 1 (CRITICAL - Fix immediately):
1. Fix `formatBytes()` decimal point (1 line fix, 5 tests pass)
2. Fix `extractArchitecture()` fallback logic (3 lines fix, 2 tests pass)
3. Fix `extractQuantization()` GPT-OSS regex (1 line fix, 1 test passes)
4. Fix models:scan DB loop performance (2 lines fix, huge perf gain)

### Phase 2 (HIGH - Fix this sprint):
5. Remove event listener memory leaks in Component
6. Fix Socket broadcast scope (model changes)
7. Add input debouncing for search/filter

### Phase 3 (MEDIUM - Fix next sprint):
8. Extract metadata parsing into separate module
9. Add pagination to logs viewer
10. Implement proper error boundaries

### Phase 4 (LOW - Code cleanup):
11. Fix all ESLint line-length warnings
12. Remove unused variables
13. Consolidate test helper functions

---

## 📊 Bug Summary by Category

| Category | Count | Severity |
|----------|-------|----------|
| Logic Errors | 4 | HIGH |
| Memory Leaks | 2 | MEDIUM |
| Performance | 5 | MEDIUM |
| UX Issues | 2 | LOW |
| Code Quality | 18 | LOW |
| **Total** | **31** | - |

---

## Files Most Affected

1. **server.js** (8 issues) - Metadata parsing, scan logic
2. **public/js/core/component.js** (2 issues) - Memory leaks, UX
3. **public/js/core/state.js** (3 issues) - Timeout, listener cleanup
4. **public/js/pages/models.js** (1 issue) - Render performance
5. **Multiple files** (18 issues) - ESLint violations
