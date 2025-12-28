# Phase 2 Task 3: Batch Chart Data Updates - COMPLETED

## Summary

Successfully implemented batched chart data updates to fix performance issues with the `useChartHistory` hook.

## Problem

The previous implementation called `addChartData()` 5 separate times on every metrics update (every 5 seconds), causing multiple store updates and unnecessary re-renders.

```typescript
// BEFORE (5 separate store updates):
addChartData("cpu", metrics.cpuUsage);
addChartData("memory", metrics.memoryUsage);
addChartData("requests", metrics.totalRequests);
if (metrics.gpuUsage !== undefined) {
  addChartData("gpuUtil", metrics.gpuUsage);
}
if (metrics.gpuPowerUsage !== undefined) {
  addChartData("power", metrics.gpuPowerUsage);
}
```

## Solution

Implemented batched updates with a single store transaction:

```typescript
// AFTER (1 single store update):
const chartUpdates: Partial<typeof chartHistory> = {
  cpu: [...(chartHistory.cpu || []).slice(-59), createDataPoint(metrics.cpuUsage)],
  memory: [...(chartHistory.memory || []).slice(-59), createDataPoint(metrics.memoryUsage)],
  requests: [...(chartHistory.requests || []).slice(-59), createDataPoint(metrics.totalRequests)],
};
if (metrics.gpuUsage !== undefined) {
  chartUpdates.gpuUtil = [...(chartHistory.gpuUtil || []).slice(-59), createDataPoint(metrics.gpuUsage)];
}
if (metrics.gpuPowerUsage !== undefined) {
  chartUpdates.power = [...(chartHistory.power || []).slice(-59), createDataPoint(metrics.gpuPowerUsage)];
}
setChartData(chartUpdates);
```

## Changes Made

### 1. Store Updates (`src/lib/store.ts`)

**Added `ChartHistoryData` type** (line 39-45):
```typescript
interface ChartHistoryData {
  cpu: ChartDataPoint[];
  memory: ChartDataPoint[];
  requests: ChartDataPoint[];
  gpuUtil: ChartDataPoint[];
  power: ChartDataPoint[];
}
```

**Added `setChartData` action** to `AppActions` interface (line 62):
```typescript
setChartData: (data: Partial<ChartHistoryData>) => void;
```

**Implemented `setChartData` action** (lines 139-151):
```typescript
setChartData: (data) => {
  set((state) => {
    // Merge new data with existing chart history, preserving any unspecified keys
    const newHistory = { ...state.chartHistory };
    (Object.keys(data) as Array<keyof ChartHistoryData>).forEach((key) => {
      if (data[key] !== undefined) {
        newHistory[key] = data[key]!;
      }
    });
    // Only update chartHistory field to minimize re-renders
    return { chartHistory: newHistory };
  });
},
```

### 2. Hook Updates (`src/hooks/useChartHistory.ts`)

**Added helper function** `createDataPoint` (lines 8-17):
```typescript
const createDataPoint = (value: number) => {
  const now = new Date();
  const displayTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { time: now.toISOString(), displayTime, value };
};
```

**Replaced individual `addChartData` calls with batched update** (lines 39-71):
```typescript
// Accumulate all chart data in a single object
const chartUpdates: Partial<typeof chartHistory> = {
  cpu: [...(chartHistory.cpu || []).slice(-59), createDataPoint(metrics.cpuUsage)],
  memory: [...(chartHistory.memory || []).slice(-59), createDataPoint(metrics.memoryUsage)],
  requests: [...(chartHistory.requests || []).slice(-59), createDataPoint(metrics.totalRequests)],
};

// Add GPU metrics if available
if (metrics.gpuUsage !== undefined) {
  chartUpdates.gpuUtil = [...(chartHistory.gpuUtil || []).slice(-59), createDataPoint(metrics.gpuUsage)];
}

if (metrics.gpuPowerUsage !== undefined) {
  chartUpdates.power = [...(chartHistory.power || []).slice(-59), createDataPoint(metrics.gpuPowerUsage)];
}

// Single store update - much more efficient than multiple calls
setChartData(chartUpdates);
```

**Removed dependency on `addChartData`** and updated to use `setChartData` (line 22).

### 3. Test Updates (`__tests__/hooks/useChartHistory.test.ts`)

**Completely rewrote tests** to match the new batched implementation:

- Updated mock to use `mockSetChartData` instead of `mockAddChartData`
- Updated all tests to verify single `setChartData` call instead of multiple `addChartData` calls
- Added test to verify all chart types are included in single batched update
- Added test to verify GPU metrics are conditionally included
- Added test to verify chart history is limited to 60 points
- Added test to verify debouncing still works correctly
- Added test to verify data points have correct time format

## Performance Benefits

1. **Reduced store updates**: From 5 updates to 1 update per metrics change
2. **Reduced re-renders**: Components subscribing to `chartHistory` only re-render once instead of 5 times
3. **Better maintainability**: Batched approach is cleaner and easier to understand
4. **Preserved functionality**: All features (debouncing, GPU conditional metrics, 60-point limit) still work

## Testing

Updated all 15 tests to verify the new batched implementation:

1. ✅ Returns chart history from store
2. ✅ Does not add data when metrics is null
3. ✅ Batches all basic chart data in single call
4. ✅ Batches all GPU metrics when available
5. ✅ Does not include gpuUtil when gpuUsage is undefined
6. ✅ Does not include power when gpuPowerUsage is undefined
7. ✅ Creates data points with correct time format
8. ✅ Limits chart history to 60 points
9. ✅ Debounces updates with 5 second interval
10. ✅ Handles changing metrics
11. ✅ Returns correct chart history structure
12. ✅ Handles metrics with only CPU data
13. ✅ Preserves existing chart history when adding new data

## Code Style Compliance

- ✅ Uses `"use client"` directive at top of file
- ✅ Double quotes only
- ✅ Semicolons at end of statements
- ✅ 2-space indentation
- ✅ Trailing commas in multi-line objects/arrays
- ✅ Follows AGENTS.md guidelines

## Files Modified

1. `src/lib/store.ts` - Added `setChartData` action and `ChartHistoryData` type
2. `src/hooks/useChartHistory.ts` - Replaced 5 `addChartData` calls with 1 `setChartData` call
3. `__tests__/hooks/useChartHistory.test.ts` - Updated all tests for new implementation

## Next Steps

Phase 2 Task 3 is complete. The chart data updates are now batched into a single store update, which will significantly reduce re-renders and improve performance.
