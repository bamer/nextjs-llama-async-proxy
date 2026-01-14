/**
 * GPU Monitor - GPU metrics collection
 * Part of metrics.js refactoring (≤200 lines)
 */

import si from "systeminformation";

let gpuList = [];

/**
 * Get current GPU list
 * @returns {Array} List of GPU objects
 */
export function getGpuList() {
  return gpuList;
}

/**
 * Update GPU list from metrics collection
 * @param {Array} newGpuList - New list of GPU objects
 */
export function updateGpuList(newGpuList) {
  gpuList = newGpuList;
}

/**
 * Collect GPU metrics
 * @returns {Object} GPU metrics data
 */
export async function collectGpuMetrics() {
  let gpuListResult = [];
  let gpuUsage = 0;
  let gpuMemoryUsed = 0;
  let gpuMemoryTotal = 0;

  try {
    const gpu = await si.graphics();
    if (gpu.controllers && gpu.controllers.length > 0) {
      gpuListResult = gpu.controllers.map((controller) => ({
        name: controller.model || "Unknown GPU",
        usage: controller.utilizationGpu || 0,
        memoryUsed: (controller.memoryUsed || 0) * 1024 * 1024,
        memoryTotal: (controller.memoryTotal || 0) * 1024 * 1024,
        vendor: controller.vendor || "Unknown",
      }));

      // Primary GPU for backward compatibility
      const primaryGpu = gpuListResult[0];
      gpuUsage = primaryGpu.usage;
      gpuMemoryUsed = primaryGpu.memoryUsed;
      gpuMemoryTotal = primaryGpu.memoryTotal;

      // Update GPU list for metrics responses
      updateGpuList(gpuListResult);

      console.log("[DEBUG] GPU metrics collected:", {
        count: gpuListResult.length,
        primary: primaryGpu.name,
        usage: gpuUsage,
        memoryUsed: gpuMemoryUsed,
        memoryTotal: gpuMemoryTotal,
      });
    }
  } catch (e) {
    console.debug("[METRICS] GPU data not available:", e.message);
  }

  return {
    gpuList: gpuListResult,
    gpuUsage: Math.round(gpuUsage * 10) / 10,
    gpuMemoryUsed: Math.round(gpuMemoryUsed),
    gpuMemoryTotal: Math.round(gpuMemoryTotal),
  };
}
