/**
 * Metrics Handlers
 * Socket.IO handlers for metrics operations
 */

import { ok, err } from "./response.js";

// Store latest GPU list to include in responses
let latestGpuList = [];

/**
 * Register metrics handlers
 */
export function registerMetricsHandlers(socket, db) {
  /**
   * Get latest metrics
   */
  socket.on("metrics:get", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const m = db.getLatestMetrics() || {};
      const metrics = {
        cpu: { usage: m.cpu_usage || 0 },
        memory: { used: m.memory_usage || 0 },
        disk: { used: m.disk_usage || 0 },
        gpu: {
          usage: m.gpu_usage || 0,
          memoryUsed: m.gpu_memory_used || 0,
          memoryTotal: m.gpu_memory_total || 0,
          list: latestGpuList,
        },
        uptime: m.uptime || 0,
      };
      ok(socket, "metrics:get:result", { metrics }, id);
    } catch (e) {
      err(socket, "metrics:get:result", e.message, id);
    }
  });

  /**
   * Get metrics history
   */
  socket.on("metrics:history", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const history = db.getMetricsHistory(req?.limit || 100).map((m) => ({
        cpu: { usage: m.cpu_usage || 0 },
        memory: { used: m.memory_usage || 0 },
        disk: { used: m.disk_usage || 0 },
        gpu: {
          usage: m.gpu_usage || 0,
          memoryUsed: m.gpu_memory_used || 0,
          memoryTotal: m.gpu_memory_total || 0,
          list: latestGpuList,
        },
        uptime: m.uptime || 0,
        timestamp: m.timestamp,
      }));
      ok(socket, "metrics:history:result", { history }, id);
    } catch (e) {
      err(socket, "metrics:history:result", e.message, id);
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
