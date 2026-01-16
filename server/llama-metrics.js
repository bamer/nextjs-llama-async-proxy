/**
 * Llama Metrics - llama-server specific metrics collection
 * Part of metrics.js refactoring (≤200 lines)
 */

import { LlamaServerMetricsScraper } from "./handlers/llama-router/metrics-scraper.js";

let llamaMetricsScraper = null;

/**
 * Initialize llama-server metrics scraper.
 * Creates a new LlamaServerMetricsScraper instance for the specified port.
 * @param {number} port - The port llama-server is running on
 */
export function initializeLlamaMetricsScraper(port) {
  console.log("[DEBUG] Initializing llama metrics scraper for port:", port);
  llamaMetricsScraper = new LlamaServerMetricsScraper({
    host: "127.0.0.1",
    port: port,
  });
  console.log("[DEBUG] Llama metrics scraper initialized");
}

/**
 * Collect and broadcast llama-server metrics to connected clients.
 * @param {Object} io - Socket.IO server instance
 * @returns {Promise<void>}
 */
export async function collectLlamaMetrics(io) {
  if (!llamaMetricsScraper) {
    return;
  }

  try {
    const metrics = await llamaMetricsScraper.getMetrics();
    if (metrics) {
      // Emit llama-server status with metrics
      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "running",
          metrics: {
            activeModels: metrics.activeModels || 0,
            tokensPerSecond: metrics.tokensPerSecond || 0,
            queueSize: metrics.queueSize || 0,
            totalRequests: metrics.totalRequests || 0,
            uptime: metrics.uptime || 0,
          },
          // Also include raw metrics for advanced parsing
          rawMetrics: metrics,
        },
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    // Only log once to avoid spam - metrics endpoint might not be enabled
    if (!this._metricsErrorLogged) {
      console.warn("[LLAMA-METRICS] Metrics collection failed:", e.message);
      console.warn("[LLAMA-METRICS] Ensure llama-server is started with --metrics flag");
      this._metricsErrorLogged = true;
    }
  }
}

/**
 * Check if llama metrics scraper is initialized
 * @returns {boolean} True if initialized
 */
export function isLlamaMetricsInitialized() {
  return llamaMetricsScraper !== null;
}

/**
 * Cleanup llama metrics scraper
 */
export function cleanupLlamaMetrics() {
  if (llamaMetricsScraper) {
    llamaMetricsScraper = null;
  }
}
