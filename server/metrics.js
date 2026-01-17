/**
 * Metrics Collection - Main entry point
 * Simplified with reduced frequency and minimal logging
 */

import {
  initCpuTimes,
  collectCpuMetrics,
  collectMemoryMetrics,
  collectDiskMetrics,
  getMetricsCallCount,
  resetMetricsCallCount,
} from "./metrics-collector.js";
import { collectGpuMetrics, getGpuList } from "./gpu-monitor.js";
import {
  initializeLlamaMetricsScraper as initLlamaScraper,
  collectLlamaMetrics,
  cleanupLlamaMetrics,
} from "./llama-metrics.js";

// Module-level variables for metrics collection
export let activeClients = 0;
let metricsInterval = null;

/**
 * Initialize llama-server metrics scraper
 */
export function initializeLlamaMetricsScraper(port, db = null) {
  initLlamaScraper(port, db);
}

/**
 * Update metrics collection interval based on active clients
 */
function updateMetricsInterval(io, db) {
  // Collect metrics every 2s when clients connected (for truly responsive UI)
  // No collections when idle to save CPU
  const newInterval = activeClients > 0 ? 2000 : 120000;

  if (metricsInterval) {
    clearInterval(metricsInterval);
  }

  metricsInterval = setInterval(() => collectMetrics(io, db), newInterval);
  console.log(`[METRICS] Interval updated to ${newInterval}ms (${activeClients} clients)`);
}

/**
 * Start metrics collection with dynamic interval based on active clients.
 */
export async function startMetricsCollection(io, db) {
  initCpuTimes();
  updateMetricsInterval(io, db);

  if (typeof io.on === "function") {
    io.on("connection", () => {
      activeClients++;
      updateMetricsInterval(io, db);
    });

    io.on("disconnect", () => {
      activeClients--;
      updateMetricsInterval(io, db);
    });
  }
}

/**
 * Main metrics collection function
 */
export async function collectMetrics(io, db) {
  try {
    // Collect system metrics
    // Use Promise.all for parallel async collection of independent metrics
    const [cpuUsage, memoryMetrics, diskMetrics, gpuMetrics] = await Promise.all([
      Promise.resolve(collectCpuMetrics()),
      collectMemoryMetrics(),
      collectDiskMetrics(),
      collectGpuMetrics(),
    ]);

    const { memoryUsedPercent, swapUsedPercent } = memoryMetrics;
    const { diskUsedPercent } = diskMetrics;
    const { gpuUsage, gpuMemoryUsed, gpuMemoryTotal } = gpuMetrics;

    // Save to database
    db.saveMetrics({
      cpu_usage: cpuUsage,
      memory_usage: memoryUsedPercent,
      swap_usage: swapUsedPercent,
      disk_usage: diskUsedPercent,
      uptime: process.uptime(),
      gpu_usage: gpuUsage,
      gpu_memory_used: gpuMemoryUsed,
      gpu_memory_total: gpuMemoryTotal,
    });

    // Emit to clients
    io.emit("metrics:update", {
      type: "broadcast",
      data: {
        metrics: {
          cpu: { usage: cpuUsage },
          memory: { used: memoryUsedPercent },
          swap: { used: swapUsedPercent },
          disk: { used: diskUsedPercent },
          gpu: {
            usage: gpuUsage,
            memoryUsed: gpuMemoryUsed,
            memoryTotal: gpuMemoryTotal,
            list: getGpuList(),
          },
          uptime: process.uptime(),
        },
      },
    });

    // Prune old metrics every 6 minutes (12 calls at 30s intervals)
    const callCount = getMetricsCallCount();
    if (callCount % 12 === 0) {
      db.pruneMetrics(10000);
    }

    // Collect llama-server metrics (parallel with error handling)
    collectLlamaMetrics(io, db).catch((e) => {
      console.debug("[METRICS] Llama metrics collection skipped:", e.message);
    });
  } catch (e) {
    console.error("[METRICS] Error:", e.message);
  }
}

/**
 * Cleanup metrics collection
 */
export function cleanupMetrics() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
  resetMetricsCallCount();
  cleanupLlamaMetrics();
}
