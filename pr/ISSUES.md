# Issues Found - Architecture Violations

**Document Date:** 2026-01-22
**Auditor:** Sisyphus (Code Review Agent)
**Scope:** Post-llamaproxws architecture audit

---

## Summary

During the post-implementation audit of the LlamaProxy Architecture Stabilization initiative, **2 architectural violations** were identified that need to be addressed in future sprints.

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 1 | HTTP polling via MetricsScraper (Socket.IO-First violation) |
| WARNING | 1 | setInterval in CacheService (No timer violation) |

---

## CRITICAL: MetricsScraper HTTP Polling

### Location
- `public/js/utils/metrics-parser.js` (lines 166-315)
- `public/js/components/llama-router-card.js` (lines 61-63, 177-218)

### Violation
**Rule Violated:** Socket.IO-First and Only - No REST, fetch, or HTTP polling

### Description
The `MetricsScraper` class uses `fetch()` to poll the llama-server `/metrics` endpoint directly, bypassing the Socket.IO communication layer. This violates the core architectural principle that all client-server communication must use Socket.IO exclusively.

**Code Evidence (metrics-parser.js:248-252):**
```javascript
async _fetchMetrics() {
  const metricsUrl = `${this.serverUrl}/metrics`;
  const signal = this.abortController?.signal;
  const response = await fetch(metricsUrl, { signal, timeout: 5000 });
  // ...
}
```

**Usage in llama-router-card.js (lines 61-63):**
```javascript
if (window.MetricsScraper && !this._scraper) {
  this._setupScraper();
}
```

### Impact
- **Architecture Violation:** Direct HTTP fetch bypasses Socket.IO
- **State Management:** Metrics state is not synchronized with server-owned state
- **Scalability:** Each connected client polls independently (thundering herd)
- **Real-time:** Polling interval (2s) delays updates vs broadcast

### Recommended Fix
1. Create server-side handler for `metrics:subscribe` event
2. Server broadcasts `metrics:update` events when metrics change
3. Delta-driven updates based on configured thresholds
4. Remove `MetricsScraper` class from codebase

### Migration Steps
1. Add `metrics:subscribe` and `metrics:unsubscribe` handlers to server
2. Modify server cadence to emit `metrics:update` on delta changes
3. Update `LlamaRouterCard` to use `socketClient.on("metrics:update", ...)` instead of `MetricsScraper`
4. Remove `MetricsScraper` class after migration
5. Delete or deprecate `metrics-parser.js` (keep `MetricsParser` if useful)

### Priority
**HIGH** - Critical architecture violation

---

## WARNING: CacheService setInterval

### Location
- `public/js/utils/cache.js` (lines 217-221)

### Violation
**Rule Violated:** No setInterval - Real Async Only

### Description
The `CacheInstance` class uses `setInterval` for periodic cache cleanup (every 60 seconds). While this is for internal cache management rather than communication, it still violates the "No setInterval" rule.

**Code Evidence (cache.js:217-221):**
```javascript
_startCleaner() {
  // Clean expired entries every minute
  this._cleaner = setInterval(() => {
    this._cleanup();
  }, 60000);
}
```

### Positive Note
The `destroy()` method properly cleans up the interval:
```javascript
destroy() {
  if (this._cleaner) {
    clearInterval(this._cleaner);
    this._cleaner = null;
  }
  // ...
}
```

### Impact
- **Minor:** Internal cache cleanup is not a critical path
- **Memory:** Timer persists until cache instance is destroyed
- **Pattern:** Inconsistent with event-driven architecture

### Recommended Fix
**Option A (Recommended):** Event-driven cleanup
- Remove `_startCleaner()` and `setInterval`
- Trigger cleanup on cache access (lazy cleanup)
- Use `_cleanup()` method when entries are accessed

**Option B:** Keep as-is with documentation
- Add comment explaining why setInterval is acceptable here
- This is internal state management, not communication

### Priority
**LOW** - Internal utility, not critical path

---

## Compliance Status

### ✅ Compliant Patterns Verified

| Pattern | Status | Evidence |
|---------|--------|----------|
| No REST API endpoints | ✅ | All handlers use Socket.IO |
| No fetch/XHR for state | ⚠️ | **VIOLATION**: MetricsScraper |
| No setInterval polling | ⚠️ | **VIOLATION**: CacheService |
| Event delegation | ✅ | `this.on()` pattern used |
| Proper subscription cleanup | ✅ | `destroy()` methods call unsubscribers |
| Server-owned state | ✅ | Server broadcasts state changes |
| Direct DOM updates | ✅ | No virtual DOM or re-rendering |
| Debug logging prefix | ✅ | `[DEBUG]` prefix on all logs |

---

## Files Affected

### Critical Issues
| File | Lines | Issue | Priority |
|------|-------|-------|----------|
| `public/js/utils/metrics-parser.js` | 166-315 | MetricsScraper HTTP polling | HIGH |
| `public/js/components/llama-router-card.js` | 61-63, 177-218 | Uses MetricsScraper | HIGH |

### Warning Issues
| File | Lines | Issue | Priority |
|------|-------|-------|----------|
| `public/js/utils/cache.js` | 217-221 | setInterval for cache cleanup | LOW |

---

## Recommendations

### Immediate (Next Sprint)
1. **High Priority:** Migrate metrics from MetricsScraper to Socket.IO broadcasts
   - Add `metrics:subscribe` / `metrics:unsubscribe` handlers
   - Update LlamaRouterCard to use Socket.IO events
   - Remove MetricsScraper usage

### Short-term (2-3 Sprints)
2. **Low Priority:** Refactor CacheService for event-driven cleanup
   - Implement lazy cleanup on access
   - Remove `setInterval` pattern

### Long-term
3. Add architectural linting rules to detect these violations
4. Include compliance checks in code review checklist

---

## Related Documentation

- **AGENTS.md** - Project rules and patterns
- **PROJECT_RULES.md** - Golden rules (Socket.IO-First, No setInterval)
- **SOCKET_CONTRACTS.md** - Event contracts documentation
- **server.js** - Server-side Socket.IO handlers

---

## Audit Trail

| Date | Auditor | Finding |
|------|---------|---------|
| 2026-01-22 | Sisyphus | MetricsScraper HTTP polling (CRITICAL) |
| 2026-01-22 | Sisyphus | CacheService setInterval (WARNING) |

---

*This document was generated during the Code Review audit of the llamaproxws architecture changes. All findings are to be addressed in future sprints.*
