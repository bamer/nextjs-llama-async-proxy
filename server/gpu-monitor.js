/**
 * GPU Monitor - GPU metrics collection
 * Part of metrics.js refactoring (≤200 lines)
 * Uses async operations to prevent event loop blocking
 */

import { exec } from "child_process";
import { promisify } from "util";
import si from "systeminformation";

const execAsync = promisify(exec);

let gpuList = [];

/**
 * Get current GPU list populated from last metrics collection.
 * @returns {Array<Object>} List of GPU objects with name, usage, memory info.
 */
export function getGpuList() {
  return gpuList;
}

/**
 * Update GPU list from metrics collection.
 * @param {Array<Object>} newGpuList - New list of GPU objects.
 */
export function updateGpuList(newGpuList) {
  gpuList = newGpuList;
}

/**
 * Try to get GPU metrics from nvidia-smi as fallback.
 * @returns {Promise<Object|null>} Promise resolving to GPU metrics or null if unavailable.
 */
async function tryNvidiaSmi() {
  try {
    // Use async exec with timeout instead of blocking execSync
    const { stdout } = await execAsync(
      "nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null",
      { encoding: "utf8", timeout: 5000 }
    );

    if (!stdout) return null;

    const lines = stdout.split("\n");
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
  } catch {
    // nvidia-smi not available or failed
    return null;
  }
}

/**
 * Get all GPU info from nvidia-smi including name and vendor.
 * @returns {Promise<Array>} Array of GPU objects with full details.
 */
async function getAllNvidiaGpus() {
  try {
    // Get GPU index, name, utilization, memory
    const { stdout } = await execAsync(
      `nvidia-smi --query-gpu=index,name,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null`,
      { encoding: "utf8", timeout: 5000 }
    );

    if (!stdout) return [];

    const lines = stdout.trim().split("\n");
    const gpus = [];

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 5) {
        gpus.push({
          index: parseInt(parts[0]) || 0,
          name: parts[1] || `GPU ${parts[0]}`,
          vendor: "NVIDIA",
          usage: parseFloat(parts[2]) || 0,
          memoryUsed: parseFloat(parts[3]) * 1024 * 1024,
          memoryTotal: parseFloat(parts[4]) * 1024 * 1024,
          hasUtilizationData: true,
        });
      }
    }

    return gpus;
  } catch {
    return [];
  }
}

/**
 * Detect AMD GPUs via sysfs DRM devices.
 * @returns {Promise<Array>} Array of AMD GPU objects.
 */
async function getAmdGpusFromSysfs() {
  const gpus = [];
  
  try {
    // Read DRM card directories
    const fs = await import("fs");
    const drmPath = "/sys/class/drm";
    
    const entries = fs.readdirSync(drmPath);
    
    for (const entry of entries) {
      if (entry.startsWith("card") && !entry.includes("-")) {
        const devicePath = `${drmPath}/${entry}/device`;
        
        // Check if it's an AMD GPU (vendor 0x1002)
        const vendorPath = `${devicePath}/vendor`;
        try {
          const vendor = fs.readFileSync(vendorPath, "utf8").trim();
          if (vendor === "0x1002") {
            // AMD GPU found
            const namePath = `${devicePath}/name`;
            let name = "AMD GPU";
            try {
              name = fs.readFileSync(namePath, "utf8").trim();
            } catch {
              // Use device ID for name
              const deviceIdPath = `${devicePath}/device`;
              const deviceId = fs.readFileSync(deviceIdPath, "utf8").trim();
              name = `AMD GPU (${deviceId})`;
            }
            
            // Try to get memory info from VRAM
            let memoryTotal = 0;
            let memoryUsed = 0;
            
            // Check for VRAM info in various locations
            const vramPath = `${devicePath}/mem_info_vram_total`;
            const memPath = `${devicePath}/memory_total`;
            
            try {
              const vramTotal = fs.readFileSync(vramPath, "utf8").trim();
              memoryTotal = parseInt(vramTotal) || 0;
            } catch {
              try {
                const memTotal = fs.readFileSync(memPath, "utf8").trim();
                memoryTotal = parseInt(memTotal) || 0;
              } catch {
                // No memory info available
              }
            }
            
            gpus.push({
              name: name,
              vendor: "AMD",
              usage: 0, // sysfs doesn't provide real-time usage
              memoryUsed: memoryUsed,
              memoryTotal: memoryTotal,
              hasUtilizationData: memoryTotal > 0,
              sysfsPath: devicePath,
            });
          }
        } catch {
          // Not an AMD GPU or no vendor info
        }
      }
    }
  } catch (e) {
    // sysfs not available or other error
  }
  
  return gpus;
}

/**
 * Detect all GPUs (NVIDIA + AMD) from the system.
 * @returns {Promise<Array>} Array of GPU objects with full details.
 */
async function getAllGpus() {
  const allGpus = [];
  
  // Get NVIDIA GPUs from nvidia-smi
  const nvidiaGpus = await getAllNvidiaGpus();
  allGpus.push(...nvidiaGpus);
  
  // Get AMD GPUs from sysfs
  const amdGpus = await getAmdGpusFromSysfs();
  allGpus.push(...amdGpus);
  
  return allGpus;
}

/**
 * Collect GPU metrics from system information.
 * Queries available GPU controllers and calculates usage/memory.
 * Falls back to nvidia-smi if systeminformation doesn't provide utilization data.
 * @returns {Promise<Object>} Promise resolving to GPU metrics data with usage, memory values, and list.
 */
export async function collectGpuMetrics() {
  let gpuListResult = [];
  let gpuUsage = 0;
  let gpuMemoryUsed = 0;
  let gpuMemoryTotal = 0;

  try {
    // First, detect all GPUs (NVIDIA + AMD)
    const allGpus = await getAllGpus();
    
    if (allGpus.length > 0) {
      // Use detected GPU data directly
      gpuListResult = allGpus;
      
      console.log("[DEBUG] GPU: Detected", gpuListResult.length, "GPU(s):", 
        gpuListResult.map(g => `${g.vendor} ${g.name}(${g.usage}%)`).join(", "));
    } else {
      // Fallback to systeminformation
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

        // If systeminformation didn't provide utilization data, try nvidia-smi for each GPU
        if (!hasUtilizationData) {
          console.log("[DEBUG] GPU: systeminformation returned no utilization data, trying nvidia-smi...");
          const nvidiaGpuData = await tryNvidiaSmi();

          if (nvidiaGpuData) {
            // Merge nvidia-smi data with systeminformation data
            for (let i = 0; i < gpuListResult.length; i++) {
              const siGpu = gpuListResult[i];
              const nvidiaGpu = nvidiaGpuData.find((ng) => ng.index === i) || nvidiaGpuData[0];

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
      }
    }

    // Calculate aggregate metrics from ALL GPUs (not just primary)
    if (gpuListResult.length > 0) {
      // Sum up all GPU metrics for aggregate values
      gpuUsage = gpuListResult.reduce((sum, g) => sum + (g.usage || 0), 0) / gpuListResult.length;
      gpuMemoryUsed = gpuListResult.reduce((sum, g) => sum + (g.memoryUsed || 0), 0);
      gpuMemoryTotal = gpuListResult.reduce((sum, g) => sum + (g.memoryTotal || 0), 0);

      console.log("[DEBUG] GPU metrics collected:", {
        count: gpuListResult.length,
        gpus: gpuListResult.map(g => ({ name: g.name, usage: g.usage, memory: `${g.memoryUsed}/${g.memoryTotal}` })),
        aggregate: { usage: gpuUsage, memoryUsed: gpuMemoryUsed, memoryTotal: gpuMemoryTotal },
      });
    }

    // Update GPU list for metrics responses
    updateGpuList(gpuListResult);
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
