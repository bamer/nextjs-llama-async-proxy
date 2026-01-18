/**
 * Metrics Collection - Event-Driven Architecture
 * Replaces fixed interval polling with WebSocket subscriptions
 * Clients subscribe to metrics updates with configurable intervals
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

// Subscription management
const subscriptions = new Map(); // socket.id -> { interval, lastEmit, timeoutId }
const DEFAULT_INTERVAL = 2000; // 2 seconds default
const MIN_INTERVAL = 1000; // 1 second minimum
const MAX_INTERVAL = 60000; // 60 seconds maximum
const PRUNE_INTERVAL = 10000; // Prune old metrics every 10 calls at default rate

/**
 * Initialize llama-server metrics scraper.
 * @param {number} port - Port for llama-server metrics scraper.
 * @param {Object|null} db - Database instance.
 */
export function initializeLlamaMetricsScraper(port, db = null) {
  initLlamaScraper(port, db);
}

/**
 * Get the subscription interval for a client, clamped to valid range.
 * @param {number} requestedInterval - Requested interval from client.
 * @returns {number} Clamped interval.
 */
function getClampedInterval(requestedInterval) {
  const interval = parseInt(requestedInterval, 10);
  if (isNaN(interval) || interval < MIN_INTERVAL) {
    return DEFAULT_INTERVAL;
  }
  return Math.min(interval, MAX_INTERVAL);
}

/**
 * Collect and emit metrics to a specific socket.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} db - Database instance.
 */
async function collectAndEmitMetrics(socket, db) {
  try {
    // Collect system metrics in parallel
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

    // Broadcast metrics update to ALL connected clients (except sender)
    // Using socket.broadcast.emit to reach all clients
    socket.broadcast.emit("metrics:update", {
      type: "broadcast",
      timestamp: Date.now(),
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
            list: gpuMetrics.gpuList, // Use the GPU list from collected metrics
          },
          uptime: process.uptime(),
        },
      },
    });

    // Collect llama-server metrics (fire and forget)
    collectLlamaMetrics(socket, db).catch((e) => {
      console.debug("[METRICS] Llama metrics collection skipped:", e.message);
    });
  } catch (e) {
    console.error("[METRICS] Error collecting metrics:", e.message);
  }
}

/**
 * Start the metrics collection interval for a subscription.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} db - Database instance.
 * @param {number} interval - Collection interval in milliseconds.
 */
function startCollectionInterval(socket, db, interval) {
  const subscription = subscriptions.get(socket.id);
  if (!subscription) return;

  // Clear any existing interval
  if (subscription.timeoutId) {
    clearInterval(subscription.timeoutId);
  }

  // Set up new interval
  subscription.timeoutId = setInterval(() => {
    collectAndEmitMetrics(socket, db);
  }, interval);

  // Emit initial metrics immediately
  collectAndEmitMetrics(socket, db);
}

/**
 * Register metrics subscription handlers on the socket.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} io - Socket.IO server instance.
 * @param {Object} db - Database instance.
 */
export function registerMetricsHandlers(socket, io, db) {
  /**
   * Subscribe to metrics updates with optional interval.
   * @param {Object} req - Request object with optional interval.
   */
  socket.on("metrics:subscribe", (req) => {
    const interval = getClampedInterval(req?.interval);
    const subscription = subscriptions.get(socket.id) || {};

    subscription.interval = interval;
    subscription.lastEmit = Date.now();

    subscriptions.set(socket.id, subscription);

    console.log(`[METRICS] Socket ${socket.id} subscribed with interval ${interval}ms`);

    // Start collection interval for this socket
    startCollectionInterval(socket, db, interval);

    // Acknowledge subscription
    socket.emit("metrics:subscribe:result", {
      success: true,
      interval,
      message: `Subscribed to metrics with ${interval}ms interval`,
    });
  });

  /**
   * Update metrics subscription interval.
   * @param {Object} req - Request object with new interval.
   */
  socket.on("metrics:update-interval", (req) => {
    const subscription = subscriptions.get(socket.id);
    if (!subscription) {
      socket.emit("metrics:update-interval:result", {
        success: false,
        error: "Not subscribed to metrics",
      });
      return;
    }

    const newInterval = getClampedInterval(req?.interval);
    subscription.interval = newInterval;

    console.log(`[METRICS] Socket ${socket.id} updated interval to ${newInterval}ms`);

    // Restart collection with new interval
    startCollectionInterval(socket, db, newInterval);

    socket.emit("metrics:update-interval:result", {
      success: true,
      interval: newInterval,
    });
  });

  /**
   * Unsubscribe from metrics updates.
   */
  socket.on("metrics:unsubscribe", () => {
    const subscription = subscriptions.get(socket.id);
    if (subscription) {
      if (subscription.timeoutId) {
        clearInterval(subscription.timeoutId);
      }
      subscriptions.delete(socket.id);
      console.log(`[METRICS] Socket ${socket.id} unsubscribed from metrics`);
    }

    socket.emit("metrics:unsubscribe:result", {
      success: true,
      message: "Unsubscribed from metrics",
    });
  });

  /**
   * Handle socket disconnect - clean up subscription.
   */
  socket.on("disconnect", () => {
    const subscription = subscriptions.get(socket.id);
    if (subscription) {
      if (subscription.timeoutId) {
        clearInterval(subscription.timeoutId);
      }
      subscriptions.delete(socket.id);
      console.log(`[METRICS] Socket ${socket.id} disconnected, subscription cleaned up`);
    }
  });

  /**
   * Get current metrics on demand.
   */
  socket.on("metrics:get", async (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const metrics = await collectMetricsForRequest(db);
      socket.emit("metrics:get:result", { metrics }, id, ack);
    } catch (e) {
      socket.emit("metrics:get:result", { error: e.message }, id, ack);
    }
  });
}

/**
 * Collect metrics for a one-time request.
 * @param {Object} db - Database instance.
 * @returns {Promise<Object>} Metrics object.
 */
async function collectMetricsForRequest(db) {
  const [cpuUsage, memoryMetrics, diskMetrics, gpuMetrics] = await Promise.all([
    Promise.resolve(collectCpuMetrics()),
    collectMemoryMetrics(),
    collectDiskMetrics(),
    collectGpuMetrics(),
  ]);

  return {
    cpu: { usage: cpuUsage },
    memory: { used: memoryMetrics.memoryUsedPercent },
    swap: { used: memoryMetrics.swapUsedPercent },
    disk: { used: diskMetrics.diskUsedPercent },
    gpu: {
      usage: gpuMetrics.gpuUsage,
      memoryUsed: gpuMetrics.gpuMemoryUsed,
      memoryTotal: gpuMetrics.gpuMemoryTotal,
      list: gpuMetrics.gpuList, // Use the GPU list from collected metrics
    },
    uptime: process.uptime(),
  };
}

/**
 * Start metrics collection system.
 * @param {Object} io - Socket.IO server instance.
 * @param {Object} db - Database instance.
 */
export async function startMetricsCollection(io, db) {
  initCpuTimes();

  // Register handlers for all sockets
  io.on("connection", (socket) => {
    registerMetricsHandlers(socket, io, db);
  });

  console.log("[METRICS] Event-driven metrics collection started");
}

/**
 * Main metrics collection function - kept for backwards compatibility.
 * @param {Object} io - Socket.IO server instance (unused in new architecture).
 * @param {Object} db - Database instance.
 */
export async function collectMetrics(io, db) {
  // In the new architecture, metrics are collected per-subscription
  // This function is kept for any legacy code that calls it directly
  await collectAndEmitMetrics(io, db);
}

/**
 * Cleanup metrics collection.
 */
export function cleanupMetrics() {
  subscriptions.forEach(sub => {
    if (sub.timeoutId) clearInterval(sub.timeoutId);
  });
  subscriptions.clear();

  resetMetricsCallCount();
  cleanupLlamaMetrics();

  // Add GPU cleanup - check if function exists first
  if (typeof cleanupGpuMonitor === "function") {
    cleanupGpuMonitor();
  }
}
