/**
 * GPU Monitor - GPU metrics collection
 * Part of metrics.js refactoring (≤200 lines)
 */

import { execSync } from "child_process";
import si from "systeminformation";

let gpuList = [];

/**
 * Get current GPU list populated from last metrics collection.
 * @returns {Array<Object>} List of GPU objects with name, usage, memory info
 */
export function getGpuList() {
  return gpuList;
}

/**
 * Update GPU list from metrics collection.
 * @param {Array<Object>} newGpuList - New list of GPU objects
 */
export function updateGpuList(newGpuList) {
  gpuList = newGpuList;
}

/**
 * Try to get GPU metrics from nvidia-smi as fallback.
 * @returns {Object|null} GPU metrics or null if unavailable
 */
function tryNvidiaSmi() {
  try {
    // Try to get GPU utilization and memory from nvidia-smi
    const output = execSync(
      "nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null",
      { encoding: "utf8", timeout: 3000, maxBuffer: 1024 * 1024 }
    ).trim();

    if (!output) return null;

    const lines = output.split("\n");
    const gpus = [];

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 4) {
        gpus.push({
          index: parseInt(parts[0]) || 0,
          usage: parseFloat(parts[1]) || 0,
          memoryUsed: parseFloat(parts[2]) * 1024 * 1024, // Convert MB to bytes
          memoryTotal: parseFloat(parts[3]) * 1024 * 1024, // Convert MB to bytes
        });
      }
    }

    return gpus.length > 0 ? gpus : null;
  } catch (e) {
    // nvidia-smi not available or failed
    return null;
  }
}

/**
 * Collect GPU metrics from system information.
 * Queries available GPU controllers and calculates usage/memory.
 * Falls back to nvidia-smi if systeminformation doesn't provide utilization data.
 * @returns {Object} GPU metrics data with usage, memory values, and list
 */
export async function collectGpuMetrics() {
  let gpuListResult = [];
  let gpuUsage = 0;
  let gpuMemoryUsed = 0;
  let gpuMemoryTotal = 0;

  try {
    const gpu = await si.graphics();
    if (gpu.controllers && gpu.controllers.length > 0) {
      // Map systeminformation data
      gpuListResult = gpu.controllers.map((controller, index) => ({
        name: controller.model || `GPU ${index}`,
        usage: controller.utilizationGpu || 0,
        memoryUsed: (controller.memoryUsed || 0) * 1024 * 1024,
        memoryTotal: (controller.memoryTotal || 0) * 1024 * 1024,
        vendor: controller.vendor || "Unknown",
        hasUtilizationData: controller.utilizationGpu > 0 || controller.memoryUsed > 0,
      }));

      // Check if any GPU has utilization data
      const hasUtilizationData = gpuListResult.some((g) => g.hasUtilizationData);

      // If systeminformation didn't provide utilization data, try nvidia-smi
      if (!hasUtilizationData) {
        console.log("[DEBUG] GPU: systeminformation returned no utilization data, trying nvidia-smi...");
        const nvidiaGpus = tryNvidiaSmi();

        if (nvidiaGpus) {
          // Merge nvidia-smi data with systeminformation data
          for (let i = 0; i < gpuListResult.length; i++) {
            const siGpu = gpuListResult[i];
            const nvidiaGpu = nvidiaGpus.find((ng) => ng.index === i) || nvidiaGpus[0];

            if (nvidiaGpu) {
              siGpu.usage = nvidiaGpu.usage;
              siGpu.memoryUsed = nvidiaGpu.memoryUsed;
              siGpu.memoryTotal = nvidiaGpu.memoryTotal;
              siGpu.hasUtilizationData = true;
              console.log(`[DEBUG] GPU: Updated ${siGpu.name} from nvidia-smi (usage: ${nvidiaGpu.usage}%, memory: ${nvidiaGpu.memoryUsed}/${nvidiaGpu.memoryTotal})`);
            }
          }
        } else {
          // Use VRAM from systeminformation as memoryTotal if available
          for (const g of gpuListResult) {
            if (g.memoryTotal === 0 && g.vram) {
              // systeminformation returns vram in MB
              g.memoryTotal = g.vram * 1024 * 1024;
              g.memoryUsed = 0; // Unknown, show as 0
              console.log(`[DEBUG] GPU: Using basic VRAM data for ${g.name}: ${g.memoryTotal} bytes`);
            }
          }
        }
      }

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
        hasUtilizationData: gpuListResult.some((g) => g.hasUtilizationData),
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
