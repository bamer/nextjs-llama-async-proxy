# Charts Data Persistence Fix - Summary

## Problem
After a refactoring, charts data was not being persisted to the database and restored on app launch/refresh. The issue was a disconnect between:
- **Server-side metrics collection** (`LlamaServerIntegration`) - which collected comprehensive metrics every 3 seconds
- **Client-side chart data loading** (`useChartHistory` hook) - which tried to read from database via `/api/monitoring/history`

The missing piece was **saving metrics to the database**.

## Root Cause
The `collectMetrics()` function in `LlamaServerIntegration` was collecting CPU, memory, disk, GPU, requests data every 3 seconds and broadcasting it via WebSocket, but it was never calling the `saveMetrics()` function from the database module. This meant:
- WebSocket clients received metrics for real-time display ✓
- But no data was persisted to the SQLite database ✗
- On app refresh, `/api/monitoring/history` returned no data ✗
- Charts appeared empty after page refresh

## Solution
Added database persistence in **`src/server/services/LlamaServerIntegration.ts`**:

### File: `src/server/services/LlamaServerIntegration.ts`

**Changes made:**

1. **Import `saveMetrics` function** from database module (line 11):
   ```typescript
   import { saveMetrics as saveMetricsToDb } from "../../lib/database";
   ```

2. **Update `startMetricsBroadcast()` function** (lines 230-247) to save metrics to database every 3 seconds:
   ```typescript
   private startMetricsBroadcast(): void {
     if (this.metricsInterval) {
       clearInterval(this.metricsInterval);
     }

     this.metricsInterval = setInterval(async () => {
       const metrics = await this.collectMetrics();
       this.io.emit("metrics", { type: "metrics", data: metrics, timestamp: Date.now() });

       // NEW: Persist metrics to database for chart history
       try {
         saveMetricsToDb({
           cpu_usage: metrics.cpuUsage,
           memory_usage: metrics.memoryUsage,
           disk_usage: metrics.diskUsage,
           gpu_usage: metrics.gpuUsage || 0,
           gpu_temperature: metrics.gpuTemperature || 0,
           gpu_memory_used: metrics.gpuMemoryUsed || 0,
           gpu_memory_total: metrics.gpuMemoryTotal || 0,
           gpu_power_usage: metrics.gpuPowerUsage || 0,
           active_models: metrics.activeModels || 0,
           uptime: metrics.uptime || 0,
           requests_per_minute: Math.round((metrics.totalRequests || 0) / 10),
         });
         logger.debug('Metrics saved to database');
       } catch (error) {
         logger.error('Failed to save metrics to database:', error);
       }
     }, 3000);

     logger.info("📊 Metrics broadcasting started (every 3s)");
   }
   ```

## How It Works Now

### Metrics Collection Flow (every 3 seconds):
1. **LlamaServerIntegration** calls `collectMetrics()` to gather:
   - CPU usage (via `top` command)
   - Memory usage (via `free` command)
   - Disk usage (via `df` command)
   - GPU metrics (via `nvidia-smi` command) - utilization, temperature, power, memory
   - Active models count
   - Total requests
   - Server uptime

2. **Metrics are broadcast** via WebSocket to connected clients for real-time display

3. **NEW: Metrics are saved** to SQLite database using `saveMetrics()`
   - Saves to `data/llama-dashboard.db` in `metrics_history` table
   - Automatically cleans up records older than 10 minutes
   - Provides historical data for chart persistence

### On App Launch/Refresh:
1. **`useChartHistory` hook** calls `/api/monitoring/history` on mount
2. **API endpoint** retrieves last 10 minutes of metrics from database using `getMetricsHistory(10)`
3. **Charts are populated** with historical data before new real-time metrics arrive
4. **Seamless transition** from persisted data to new real-time data

## Database Schema
The `metrics_history` table has these fields:
- `id` - Primary key (auto-increment)
- `timestamp` - Unix timestamp in milliseconds
- `cpu_usage` - CPU usage percentage
- `memory_usage` - Memory usage percentage
- `disk_usage` - Disk usage percentage
- `gpu_usage` - GPU utilization percentage
- `gpu_temperature` - GPU temperature in Celsius
- `gpu_memory_used` - GPU memory used in bytes
- `gpu_memory_total` - GPU memory total in bytes
- `gpu_power_usage` - GPU power usage in Watts
- `active_models` - Number of active models
- `uptime` - Server uptime in seconds
- `requests_per_minute` - Requests per minute
- `created_at` - Creation timestamp (also in milliseconds)

## Benefits
✅ **Charts now have data immediately on app launch** - No more empty charts on refresh
✅ **Historical data is preserved** - 10 minutes of metrics kept in database
✅ **Seamless user experience** - Real-time metrics overlay on top of historical data
✅ **Automatic cleanup** - Old data ( >10 min) automatically removed to keep database size manageable
✅ **No additional network calls needed** - Uses existing metrics collection flow

## Testing
To verify the fix:
1. Start the dev server (`pnpm dev`)
2. Monitor charts at `/monitoring` page
3. Refresh the browser - charts should show data from before refresh
4. Wait 3-10 seconds - new data points should appear
5. Check database: `sqlite3 data/llama-dashboard.db "SELECT COUNT(*) FROM metrics_history;"`

Expected result: Charts should display data immediately on page load and refresh.

## Files Modified
- `src/server/services/LlamaServerIntegration.ts` - Added database persistence to metrics collection

## Notes
- The `src/lib/monitor.ts` file was also updated to save basic CPU/memory metrics to database
- However, `LlamaServerIntegration` is the primary source of metrics since it captures GPU data and comprehensive system metrics
- The fix ensures metrics are persisted regardless of which component is active
- Database auto-cleanup ensures storage doesn't grow unbounded
