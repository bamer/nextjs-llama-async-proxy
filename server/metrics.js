/**
 * Metrics Collection - Main entry point
 * Refactored to use separate modules (≤200 lines)
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
export function initializeLlamaMetricsScraper(port) {
  initLlamaScraper(port);
}

/**
 * Update metrics collection interval based on active clients
 */
export function updateMetricsInterval(io, db) {
  const newInterval = activeClients > 0 ? 10000 : 60000;
  console.log("[DEBUG] Updating metrics interval:", {
    activeClients,
    interval: `${newInterval / 1000}s`,
  });

  if (metricsInterval) {
    clearInterval(metricsInterval);
  }

  metricsInterval = setInterval(() => collectMetrics(io, db), newInterval);
}

/**
 * Start metrics collection with dynamic interval based on active clients.
 * Initializes CPU tracking and sets up client connection listeners.
 * @param {Object} io - Socket.IO server instance
 * @param {Object} db - Database instance
 * @returns {Promise<void>}
 */
export async function startMetricsCollection(io, db) {
  initCpuTimes();
  updateMetricsInterval(io, db);

  if (typeof io.on === "function") {
    io.on("connection", () => {
      activeClients++;
      console.log("[DEBUG] Client connected, active clients:", activeClients);
      updateMetricsInterval(io, db);
    });

    io.on("disconnect", () => {
      activeClients--;
      console.log("[DEBUG] Client disconnected, active clients:", activeClients);
      updateMetricsInterval(io, db);
    });
  }
}

/**
 * Main metrics collection function that gathers and broadcasts all system metrics.
 * Collects CPU, memory, disk, GPU metrics and saves to database.
 * @param {Object} io - Socket.IO server instance
 * @param {Object} db - Database instance
 * @returns {Promise<void>}
 */
export async function collectMetrics(io, db) {
  try {
    // Collect system metrics
    const cpuUsage = collectCpuMetrics();
    const { memoryUsedPercent, swapUsedPercent } = await collectMemoryMetrics();
    const { diskUsedPercent } = await collectDiskMetrics();
    const { gpuUsage, gpuMemoryUsed, gpuMemoryTotal } = await collectGpuMetrics();

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

    // Prune old metrics every 6 minutes
    const callCount = getMetricsCallCount();
    if (callCount % 36 === 0) {
      db.pruneMetrics(10000);
    }

    // Collect llama-server metrics every 20s
    if (callCount % 2 === 0) {
      collectLlamaMetrics(io);
    }
  } catch (e) {
    console.error("[METRICS] Error:", e.message);
  }
}

/**
 * Cleanup metrics collection
 */
export function cleanupMetrics() {
  console.log("[DEBUG] Cleaning up metrics collection resources");
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
  resetMetricsCallCount();
  cleanupLlamaMetrics();
  console.log("[DEBUG] Metrics cleanup complete");
}
