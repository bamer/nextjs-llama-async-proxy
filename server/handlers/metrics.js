/**
 * Metrics Handlers
 * Socket.IO handlers for metrics operations
 */

import { ok, err } from "./response.js";

// Store latest GPU list to include in responses
let latestGpuList = [];

/**
 * Register all Socket.IO event handlers for metrics operations.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} db - Database instance.
 */
export function registerMetricsHandlers(socket, db) {
  /**
   * Get latest metrics - Send immediately without waiting for interval
   */
  socket.on("metrics:get", (req, ack) => {
    console.log("[METRICS] Received metrics:get request");
    try {
      const m = db.getLatestMetrics() || {};
      const metrics = {
        cpu: { usage: m.cpu_usage || 0 },
        memory: { used: m.memory_usage || 0 },
        swap: { used: m.swap_usage || 0 },
        disk: { used: m.disk_usage || 0 },
        gpu: {
          usage: m.gpu_usage || 0,
          memoryUsed: m.gpu_memory_used || 0,
          memoryTotal: m.gpu_memory_total || 0,
          list: latestGpuList,
        },
        uptime: m.uptime || 0,
      };
      console.log("[METRICS] Sending metrics response");
      const response = { success: true, data: metrics };
      if (typeof ack === "function") {
        ack(response);
      }
    } catch (e) {
      console.error("[METRICS] Error fetching metrics:", e.message);
      const response = { success: false, error: { message: e.message } };
      if (typeof ack === "function") {
        ack(response);
      }
    }
  });

  /**
     * Get metrics history - Send immediately without waiting for interval
     * Streamed progressively if history is large
     */
   socket.on("metrics:history", (req, ack) => {
      try {
        const limit = req?.limit || 60;
        console.log(`[METRICS] Sending metrics history (${limit} records)`);

        const history = db.getMetricsHistory(limit).map((m) => ({
          cpu: { usage: m.cpu_usage || 0 },
          memory: { used: m.memory_usage || 0 },
          swap: { used: m.swap_usage || 0 },
          disk: { used: m.disk_usage || 0 },
          gpu: {
            usage: m.gpu_usage || 0,
            memoryUsed: m.gpu_memory_used || 0,
            memoryTotal: m.gpu_memory_total || 0,
          },
          uptime: m.uptime || 0,
          timestamp: m.timestamp,
        }));

        const response = {
          success: true,
          data: history,
        };
        if (typeof ack === "function") {
          ack(response);
        }
      } catch (e) {
        console.error("[METRICS] Error fetching metrics history:", e.message);
        const response = {
          success: false,
          error: { message: e.message },
        };
        if (typeof ack === "function") {
          ack(response);
        }
      }
    });
}

/**
 * Update the GPU list to include in metrics responses
 * @param {Array} gpuList - Array of GPU objects with name, usage, memory info
 */
export function updateGpuList(gpuList) {
  latestGpuList = gpuList || [];
}
