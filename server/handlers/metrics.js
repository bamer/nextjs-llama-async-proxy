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
  socket.on("metrics:get", (req) => {
    const id = req?.requestId || Date.now();
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
      console.log("[METRICS] Sending immediate metrics response:", id);
      // IMPORTANT: Always emit, never use ack() - client expects :result event
      socket.emit("metrics:get:result", { success: true, data: { metrics }, requestId: id });
    } catch (e) {
      console.error("[METRICS] Error fetching metrics:", e.message);
      socket.emit("metrics:get:result", { success: false, error: { message: e.message }, requestId: id });
    }
  });

  /**
    * Get metrics history - Send immediately without waiting for interval
    * Streamed progressively if history is large
    */
  socket.on("metrics:history", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const limit = req?.limit || 60;
      console.log(`[METRICS] Sending metrics history (${limit} records):`, id);

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

      // IMPORTANT: Always emit, never use ack() - client expects :result event
      socket.emit("metrics:history:result", {
        success: true,
        data: { history, gpuList: latestGpuList },
        requestId: id,
      });
    } catch (e) {
      console.error("[METRICS] Error fetching metrics history:", e.message);
      socket.emit("metrics:history:result", {
        success: false,
        error: { message: e.message },
        requestId: id,
      });
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
