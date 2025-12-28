# Quick Reference: loadModelTemplates Error Fix

## The Problem

**Error:** "Failed to fetch" after 2+ minute waits in loadModelTemplates
**Impact:** 1,066 errors (90% of all logs) - Users experience 2+ minute delays

---

## Root Causes (3 Critical Issues)

### 1. No Timeout Configuration ⚠️ CRITICAL
**Location:** `src/lib/client-model-templates.ts` line 25

```typescript
// ❌ Current - waits indefinitely (2-3 minutes)
const response = await fetch("/api/model-templates");

// ✅ Fix - add 10 second timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch("/api/model-templates", {
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  // ... rest of code
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    console.error('Request timed out after 10 seconds');
  }
  throw error;
}
```

---

### 2. Request Storm from WebSocket ⚠️ CRITICAL
**Location:** `src/components/dashboard/ModelsListCard.tsx` line 57

**The Chain:**
```
WebSocket model update → Store updates → Component re-renders → useEffect runs → New fetch
```

**Fix:** Add request deduplication

```typescript
// In src/lib/client-model-templates.ts
let loadingPromise: Promise<Record<string, string>> | null = null;

export async function loadModelTemplates(): Promise<Record<string, string>> {
  // Return cached if already loaded
  if (isInitialized && Object.keys(cachedTemplates).length > 0) {
    return cachedTemplates;
  }

  // Return existing promise if request in-flight
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start new request
  loadingPromise = (async () => {
    try {
      // ... fetch logic with timeout
    } finally {
      loadingPromise = null;  // Clear when done
    }
  })();

  return loadingPromise;
}
```

---

### 3. Poor React Dependencies ⚠️ HIGH
**Location:** `src/components/dashboard/ModelsListCard.tsx` line 57

```typescript
// ❌ Current - triggers on every model update
}, [modelsList]);

// ✅ Better - only load once on mount
}, []);  // Remove modelsList dependency

// ✅ Alternative - track only model names
const modelNames = useMemo(
  () => modelsList.map(m => m.name).join(','),
  [modelsList.map(m => m.name)]
);
}, [modelNames]);
```

---

## Evidence from Logs

```
Total log entries: 1,185
Template errors: 1,066
Error rate: 90%
Peak concurrent requests: 100+ in same second
Wait time before timeout: ~2 minutes 44 seconds
```

---

## Implementation Priority

| Priority | Fix | Files to Change | Time Required |
|----------|-----|----------------|---------------|
| P1 ⚠️ | Add timeout | `client-model-templates.ts` | 15 min |
| P1 ⚠️ | Deduplication | `client-model-templates.ts` | 30 min |
| P2 | useEffect cleanup | `ModelsListCard.tsx` | 15 min |
| P3 | Optimize dependencies | `ModelsListCard.tsx` | 20 min |

**Total time to fix:** ~1.5 hours

---

## Quick Test

After implementing fixes, verify:

```bash
# 1. Start dev server
pnpm dev

# 2. Open browser dev tools Console tab
# 3. Navigate to dashboard
# 4. Observe:
#    - Only 1 request to /api/model-templates
#    - Request completes in < 1 second
#    - No "Failed to load templates" errors
#    - No errors after 10+ seconds
```

---

## Expected Results After Fix

- ✅ 0 timeout errors (down from 1,066)
- ✅ Single request per page load (down from 100+)
- ✅ < 1 second response time (down from 2+ minutes)
- ✅ No request storms during WebSocket updates
- ✅ Better user experience with instant UI feedback

---

## Related Files

- **Full analysis:** `LOADMODELTEMPLATES_ROOT_CAUSE_ANALYSIS.md`
- **Problem code:** `src/lib/client-model-templates.ts`
- **Component code:** `src/components/dashboard/ModelsListCard.tsx`
- **API endpoint:** `app/api/model-templates/route.ts`

---

## Key Takeaways

1. **Always add timeouts** to fetch requests (10-30s recommended)
2. **Deduplicate concurrent requests** to prevent request storms
3. **Optimize React dependencies** to avoid unnecessary re-renders
4. **Use AbortController** for request cancellation
5. **Test with slow networks** to catch timeout issues early

---

**Last Updated:** 2025-12-28
**Status:** Root Cause Analysis Complete
**Next Step:** Implement P1 fixes immediately
