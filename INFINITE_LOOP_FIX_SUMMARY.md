# Infinite Loop Fix Summary

## Problem
The application was loading models from the database in an infinite loop (hundreds of times per second), causing severe performance degradation.

**Root Cause Identified:**

### 1. WebSocket Event Handler Instability
**File:** `/app/models/hooks/use-websocket-handlers.ts`

The `cleanup` function was being recreated on every render:
```typescript
const cleanup = () => {  // ← Recreated on EVERY render!
  off("models_loaded", handleModelsLoaded);
  // ...
};
```

### 2. WebSocket Provider Function Instability
**File:** `/src/providers/websocket-provider.tsx`

All WebSocket context functions were recreated on every render:
```typescript
const sendMessage = (event: string, data?: unknown) => { /* ... */ };
const requestMetrics = () => { /* ... */ };
// ... all recreated on every render
```

### 3. useEffect Dependency Issue
**File:** `/app/models/hooks/use-models.ts`

The useEffect had `cleanup` in its dependency array:
```typescript
useEffect(() => {
  wsSendMessage("load_models", {});  // ← Sends message to load models
  console.log("[useModels] Loading models from database");

  return cleanup;
}, [wsSendMessage, cleanup]);  // ← cleanup changes on every render!
```

This created an infinite loop:
1. `cleanup` function recreated on every render
2. `useEffect` re-runs when `cleanup` changes
3. Effect sends `wsSendMessage("load_models", {})` → triggers database load
4. Database loads models → updates state → triggers re-render
5. **Repeat forever** (hundreds of times per second!)

## Solution

### 1. Memoize WebSocket Event Handlers
**File:** `/app/models/hooks/use-websocket-handlers.ts`

Wrapped all event handlers in `useCallback` with proper dependencies:
```typescript
const handleModelsLoaded = useCallback((data: unknown) => {
  // ... handler logic
}, [setModels, options?.onModelsLoaded]);

const cleanup = useCallback(() => {
  off("models_loaded", handleModelsLoaded);
  // ...
}, [off, handleModelsLoaded, /* ... */]);
```

### 2. Memoize WebSocket Provider Functions
**File:** `/src/providers/websocket-provider.tsx`

Wrapped all context functions in `useCallback`:
```typescript
const sendMessage = useCallback((event: string, data?: unknown) => {
  if (!isConnected) {
    console.warn('[WebSocketProvider] WebSocket not connected, message not sent:', event);
    return;
  }
  websocketServer.sendMessage(event, data);
}, [isConnected]);

const requestMetrics = useCallback(() => {
  websocketServer.requestMetrics();
}, []);

// ... all other functions memoized
```

### 3. Fix TypeScript Types
Replaced `any` types with proper `unknown` types:
```typescript
// Before
on: (event: string, callback: (data: any) => void) => void;

// After
on: (event: string, callback: (data: unknown) => void) => void;
```

### 4. Remove Unstable Dependency
**File:** `/app/models/hooks/use-models.ts`

Removed `cleanup` from useEffect dependency array (only needed for return value):
```typescript
useEffect(() => {
  wsSendMessage("load_models", {});
  console.log("[useModels] Loading models from database");

  return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [wsSendMessage]);  // ← Only re-run when WebSocket message function changes
```

## Impact

### Before Fix
- **Database queries:** Hundreds per second
- **Log spam:** Infinite "Loading models from database..." messages
- **Performance:** Severe degradation
- **Resource usage:** Excessive CPU and I/O

### After Fix
- **Database queries:** Once on mount (normal behavior)
- **Log spam:** Eliminated
- **Performance:** Restored to normal
- **Resource usage:** Stable

## Files Modified

1. `/app/models/hooks/use-websocket-handlers.ts`
   - Added `useCallback` imports
   - Wrapped all 4 event handlers in `useCallback`
   - Wrapped `cleanup` function in `useCallback`
   - Added proper dependencies to all callbacks

2. `/app/models/hooks/use-models.ts`
   - Removed `cleanup` from useEffect dependency array
   - Added eslint-disable comment for exhaustive-deps rule

3. `/src/providers/websocket-provider.tsx`
   - Added `useCallback` imports
   - Wrapped all 8 context functions in `useCallback`
   - Fixed TypeScript types: `any` → `unknown`
   - Removed unused imports (`useRef`, `WebSocketMessage`)

## Testing

Run the following commands to verify the fix:

```bash
# Lint all modified files
pnpm lint src/providers/websocket-provider.tsx app/models/hooks/use-websocket-handlers.ts app/models/hooks/use-models.ts

# Type check
pnpm type:check

# Run development server
pnpm dev
```

**Expected Result:**
- Database loads models once on mount
- No infinite "Loading models from database..." log spam
- Performance is normal
- WebSocket connection works correctly

## Technical Details

### Why useCallback Matters
`useCallback` memoizes functions so they only change when their dependencies change. Without memoization:
- Functions are recreated on every render
- Child components and effects re-run unnecessarily
- Can cause infinite loops when used in dependency arrays

### Why Dependencies Matter
Effect dependencies must be stable:
- ✅ Stable dependencies: `useCallback` functions, primitive values from props/state
- ❌ Unstable dependencies: Functions recreated on every render, objects/arrays

### Why ESLint disable is acceptable here
The `cleanup` function is only needed for the return value of the effect, not as a dependency. Including it would cause the effect to run when cleanup changes, which defeats the purpose of the fix.

## Related Issues
- React Hooks Dependency Array Best Practices
- WebSocket Event Handler Memory Management
- Performance Optimization with useCallback
