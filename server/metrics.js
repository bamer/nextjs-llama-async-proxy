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
import { collectGpuMetrics, getGpuList } from "./services/gpu-monitor.js";
import {
  initializeLlamaMetricsScraper as initLlamaScraper,
  collectLlamaMetrics,
  cleanupLlamaMetrics,
} from "./llama-metrics.js";

// Subscription management
const subscriptions = new Map(); // socket.id -> { interval, lastEmit }
const DEFAULT_INTERVAL = 2000; // 2 seconds default
const MIN_INTERVAL = 1000; // 1 second minimum
const MAX_INTERVAL = 60000; // 60 seconds maximum

// Global broadcast interval (single source of truth for all clients)
let globalBroadcastInterval = null;
const GLOBAL_INTERVAL_MS = 500; // 0.5 seconds for fast token/s updates during inference

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
 * @param {Object} io - Socket.IO server instance.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} db - Database instance.
 */
async function collectAndEmitMetrics(io, socket, db) {
  const startTime = Date.now();
  console.debug("[METRICS] collectAndEmitMetrics started at", new Date(startTime).toISOString());

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

    console.debug("[METRICS] System metrics collected:", {
      cpu: cpuUsage,
      memory: memoryUsedPercent,
      swap: swapUsedPercent,
      disk: diskUsedPercent,
      gpu: gpuUsage,
      gpuMemory: `${gpuMemoryUsed}/${gpuMemoryTotal}`,
    });

    // Save to database
    const metricsData = {
      cpu_usage: cpuUsage,
      memory_usage: memoryUsedPercent,
      swap_usage: swapUsedPercent,
      disk_usage: diskUsedPercent,
      uptime: process.uptime(),
      gpu_usage: gpuUsage,
      gpu_memory_used: gpuMemoryUsed,
      gpu_memory_total: gpuMemoryTotal,
    };

    console.debug("[METRICS] Saving metrics to database...");
    db.saveMetrics(metricsData);
    console.debug("[METRICS] Metrics saved successfully");

    // Broadcast metrics update to ALL connected clients including sender
    // Using io.emit to reach all clients (not socket.broadcast.emit which excludes sender)
    const broadcastData = {
      timestamp: Date.now(),
      metrics: {
        cpu: { usage: cpuUsage },
        memory: { used: memoryUsedPercent },
        swap: { used: swapUsedPercent },
        disk: { used: diskUsedPercent },
        gpu: {
          usage: gpuUsage,
          memoryUsed: gpuMemoryUsed,
          memoryTotal: gpuMemoryTotal,
          list: gpuMetrics.gpuList,
        },
        uptime: process.uptime(),
      },
      gpuMetrics: {
        usage: gpuUsage,
        memoryUsed: gpuMemoryUsed,
        memoryTotal: gpuMemoryTotal,
        list: gpuMetrics.gpuList,
      },
    };

    console.debug("[METRICS] Broadcasting metrics update to clients, client count:", io.engine.clientsCount);
    io.emit("metrics:updated", broadcastData);
    console.debug("[METRICS] Metrics broadcast complete, duration:", Date.now() - startTime, "ms");

    // Collect llama-server metrics (fire and forget)
    collectLlamaMetrics(socket, db).catch((e) => {
      console.debug("[METRICS] Llama metrics collection skipped:", e.message);
    });
  } catch (e) {
    console.error("[METRICS] Error collecting metrics:", {
      error: e.message,
      stack: e.stack,
      duration: Date.now() - startTime,
    });
  }
}

/**
 * Start the global broadcast interval - single source for all clients
 * This prevents duplicate broadcasts from multiple subscribers
 * @param {Object} io - Socket.IO server instance.
 * @param {Object} db - Database instance.
 */
function startGlobalBroadcastInterval(io, db) {
  if (globalBroadcastInterval) {
    return; // Already running
  }

  globalBroadcastInterval = setInterval(() => {
    collectAndEmitMetrics(io, io, db);
  }, GLOBAL_INTERVAL_MS);

  // Emit initial metrics immediately
  collectAndEmitMetrics(io, io, db);

  console.log("[METRICS] Global broadcast interval started (" + GLOBAL_INTERVAL_MS + "ms)");
}

/**
 * Stop the global broadcast interval
 */
function stopGlobalBroadcastInterval() {
  if (globalBroadcastInterval) {
    clearInterval(globalBroadcastInterval);
    globalBroadcastInterval = null;
    console.log("[METRICS] Global broadcast interval stopped");
  }
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
   * Note: Uses global broadcast interval - interval is stored but not used for per-client timing
   * @param {Object} req - Request object with optional interval.
   */
  socket.on("metrics:subscribe", (req, callback) => {
    const interval = getClampedInterval(req?.interval);
    const subscription = subscriptions.get(socket.id) || {};

    subscription.interval = interval;
    subscription.lastEmit = Date.now();

    subscriptions.set(socket.id, subscription);

    console.log("[METRICS] Socket " + socket.id + " subscribed (global interval: " + GLOBAL_INTERVAL_MS + "ms)");

    // Start global interval if not already running
    if (!globalBroadcastInterval) {
      startGlobalBroadcastInterval(io, db);
    }

    // Acknowledge subscription with callback
    if (callback) {
      callback({
        success: true,
        interval: GLOBAL_INTERVAL_MS,
        message: "Subscribed to metrics (global broadcast every " + GLOBAL_INTERVAL_MS + "ms)",
      });
    }

    // Also emit for any listeners
    socket.emit("metrics:subscribe:result", {
      success: true,
      interval: GLOBAL_INTERVAL_MS,
      message: "Subscribed to metrics (global broadcast)",
    });
  });

  /**
   * Update metrics subscription interval.
   * Note: Interval is stored but global broadcast continues at fixed interval
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

    console.log("[METRICS] Socket " + socket.id + " updated interval preference to " + newInterval + "ms");

    // Note: Global interval continues at fixed rate - this is just a preference
    socket.emit("metrics:update-interval:result", {
      success: true,
      interval: GLOBAL_INTERVAL_MS,
    });
  });

  /**
   * Unsubscribe from metrics updates.
   * Note: Global interval continues running - only stops when all clients unsubscribe
   */
  socket.on("metrics:unsubscribe", () => {
    const subscription = subscriptions.get(socket.id);
    if (subscription) {
      subscriptions.delete(socket.id);
      console.log("[METRICS] Socket " + socket.id + " unsubscribed from metrics");

      // Stop global interval if no more subscribers
      if (subscriptions.size === 0) {
        stopGlobalBroadcastInterval();
      }
    }

    socket.emit("metrics:unsubscribe:result", {
      success: true,
      message: "Unsubscribed from metrics",
    });
  });

  /**
   * Handle socket disconnect - clean up subscription but keep global interval running
   */
  socket.on("disconnect", () => {
    const subscription = subscriptions.get(socket.id);
    if (subscription) {
      subscriptions.delete(socket.id);
      console.log("[METRICS] Socket " + socket.id + " disconnected, subscription removed");

      // Stop global interval if no more subscribers
      if (subscriptions.size === 0) {
        stopGlobalBroadcastInterval();
      }
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
  // Use a dummy socket for backwards compatibility
  const dummySocket = { id: "dummy", broadcast: { emit: () => {} }, emit: () => {} };
  await collectAndEmitMetrics(io, dummySocket, db);
}

/**
 * Cleanup metrics collection.
 */
export function cleanupMetrics() {
  // Clear global broadcast interval
  stopGlobalBroadcastInterval();

  subscriptions.clear();

  resetMetricsCallCount();
  cleanupLlamaMetrics();

  // Add GPU cleanup - check if function exists first
  if (typeof cleanupGpuMonitor === "function") {
    cleanupGpuMonitor();
  }
}
