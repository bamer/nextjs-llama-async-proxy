# Dashboard Memory & Swap Reporting Fix

## Problem
The dashboard was displaying incorrect memory values. The issue was two-fold:

1. **Wrong memory calculation**: Using `memInfo.used` which includes Linux cached memory (~89.5% with caches)
2. **No swap statistics**: Dashboard had no swap usage indicator

## Root Cause
- `si.mem()` returns `used` as total allocated memory (including disk cache)
- Need to calculate real usage: `total - available` (Linux actually available memory)
- Swap metrics weren't being collected or displayed

## Solution
Fixed memory calculation and added swap metrics:

### Memory Calculation Fix
**Before (incorrect):**
```javascript
memoryUsedPercent = (memInfo.used / memInfo.total) * 100  // ~89.5% with caches
```

**After (correct):**
```javascript
const actualUsed = memInfo.total - memInfo.available;
memoryUsedPercent = (actualUsed / memInfo.total) * 100  // ~30% actual usage
```

### Swap Support Added
```javascript
if (memInfo.swaptotal > 0) {
  swapUsedPercent = (memInfo.swapused / memInfo.swaptotal) * 100;
}
```

## Changes Made

### Server-side (server.js)
- Calculate memory percentage using `total - available` to account for Linux caches
- Collect swap usage percentage
- Send both metrics in broadcasts
- Debug logging shows memory in GB and percentages

### Database (metrics handlers)
- Store `memory_usage` and `swap_usage` percentages
- Include swap in metrics:get and metrics:history responses

### Frontend Components
- **StatsGrid**: Added swap usage card with 💨 icon, 50% warning threshold
- **Dashboard page**: Initialize swap metric (0% default)
- **Health checker**: Include swap in system health evaluation (threshold: 50%)

## Verification
Example real-world output:
```
Memory metrics collected:
  total: 27.28 GB
  used: 8.10 GB (actual, not cached)
  available: 19.18 GB
  percent: 29.7 %

Swap metrics:
  swapUsed: 0.91 GB
  swapTotal: 32.00 GB
  swapPercent: 2.9 %
```

## Files Modified
1. `server.js` - Memory & swap calculation
2. `server/handlers/metrics.js` - Added swap to responses
3. `public/js/components/dashboard/stats-grid.js` - Added swap card
4. `public/js/pages/dashboard/page.js` - Added swap metric init
5. `public/js/utils/dashboard-utils.js` - Added swap to health check

## Thresholds
- **Memory**: Warning at 85% (red indicator)
- **Swap**: Warning at 50% (red indicator)
- **CPU**: Warning at 80%
- **Disk**: Warning at 90%
