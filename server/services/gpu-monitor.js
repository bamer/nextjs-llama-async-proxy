/**
 * GPU Monitor Service - Real-time GPU monitoring with Socket.IO
 * No database persistence - pure real-time streaming
 *
 * ARCHITECTURE:
 * - Device detection runs ONCE at startup to discover all GPUs
 * - Metrics polling runs every 2 seconds to update GPU metrics only
 * - This prevents infinite detection loops and reduces system load
 */

import { detectAndCollectGpus, getDetectionStatus } from "./gpu-detector.js";

// Configuration
const GPU_POLL_INTERVAL = 2000; // 2 seconds for real-time metrics updates
const GPU_DETECTION_INTERVAL = 60000; // 60 seconds for device enumeration (only if needed)

// State
let pollTimer = null;
let detectionTimer = null;
let isMonitoring = false;
let lastGpuList = [];
let lastDetectionTime = 0;
let detectionErrorCount = new Map(); // Track errors per detection type

/**
 * Start GPU monitoring service
 * @param {Object} io - Socket.IO server instance
 */
export function startGpuMonitor(io) {
  if (isMonitoring) {
    console.warn("[GPU-MONITOR] Already running");
    return;
  }

  console.log("[GPU-MONITOR] Starting real-time GPU monitoring...");
  isMonitoring = true;

  // Initial detection (runs once at startup)
  runDetectionAndBroadcast(io).catch(e => {
    console.error("[GPU-MONITOR] Initial detection error:", e.message);
  });

  // Metrics polling - runs every 2 seconds, does NOT re-run device detection
  pollTimer = setInterval(() => {
    runMetricsUpdate(io).catch(e => {
      // Silent fail for metrics updates - don't spam logs
    });
  }, GPU_POLL_INTERVAL);

  // Periodic detection check - ONLY runs if no GPUs were found initially
  // GPUs cannot be hot-plugged, so we only need to retry detection if initial detection failed
  // This prevents infinite ROCm detection loops
  detectionTimer = setInterval(() => {
    const now = Date.now();
    // Only re-run detection if we haven't found any GPUs
    if (lastGpuList.length === 0) {
      runDetectionAndBroadcast(io).catch(e => {
        console.debug("[GPU-MONITOR] Periodic detection error:", e.message);
      });
    }
    // If we already found GPUs, don't re-run detection - polling handles metrics updates
  }, GPU_DETECTION_INTERVAL);

  console.log("[GPU-MONITOR] Started - polling metrics every", GPU_POLL_INTERVAL, "ms");
}

/**
 * Stop GPU monitoring service
 */
export function stopGpuMonitor() {
  if (!isMonitoring) return;

  console.log("[GPU-MONITOR] Stopping...");

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  if (detectionTimer) {
    clearInterval(detectionTimer);
    detectionTimer = null;
  }

  isMonitoring = false;
  console.log("[GPU-MONITOR] Stopped");
}

/**
 * Run full GPU detection and broadcast
 * This runs at startup and occasionally to detect new devices
 * @param {Object} io - Socket.IO server instance
 */
async function runDetectionAndBroadcast(io) {
  try {
    console.log("[GPU-MONITOR] Running full GPU detection...");
    const gpus = await detectAndCollectGpus();
    lastGpuList = gpus;
    lastDetectionTime = Date.now();

    const broadcastData = buildBroadcastData(gpus);

    if (io) {
      io.emit("gpu:updated", broadcastData);
      console.log("[GPU-MONITOR] Broadcasted gpu:updated event");

      // Also update the metrics handler with GPU list
      try {
        const { updateGpuList } = await import("../handlers/metrics.js");
        updateGpuList(broadcastData.data?.list || gpus);
      } catch (e) {
        // Metrics handler might not be available, that's OK
      }
    }

    console.log("[GPU-MONITOR] Detected", gpus.length, "GPU(s)");
    gpus.forEach((gpu, i) => {
      console.log(`  [${i + 1}] ${gpu.vendor} - ${gpu.name} (${gpu.vramTotalMiB}MiB, integrated=${gpu.isIntegrated})`);
    });

    return gpus;
  } catch (error) {
    console.error("[GPU-MONITOR] Detection failed:", error.message);
    // Return cached data on failure
    return lastGpuList;
  }
}

/**
 * Run metrics-only update (faster, no detection)
 * Only collects metrics for already-detected GPUs
 * @param {Object} io - Socket.IO server instance
 */
async function runMetricsUpdate(io) {
  try {
    // Check if we have cached GPUs to query
    if (lastGpuList.length === 0) {
      // No GPUs detected yet, run detection
      return await runDetectionAndBroadcast(io);
    }

    // Collect metrics for known GPUs without re-running detection
    const gpus = await collectGpuMetricsOnly(lastGpuList);
    lastGpuList = gpus;

    const broadcastData = buildBroadcastData(gpus);

    if (io) {
      io.emit("gpu:updated", broadcastData);
      // Also update the metrics handler with latest GPU list
      try {
        const { updateGpuList } = await import("../handlers/metrics.js");
        updateGpuList(broadcastData.data?.list || gpus);
      } catch (e) {
        // Metrics handler might not be available, that's OK
      }
    }

    return gpus;
  } catch (error) {
    // Silent fail - return cached data on error
    return lastGpuList;
  }
}

/**
 * Collect metrics only for already-detected GPUs
 * Does not re-run device detection
 * @param {Array} knownGpus - Previously detected GPU list
 * @returns {Promise<Array>} GPU list with updated metrics
 */
async function collectGpuMetricsOnly(knownGpus) {
  const updatedGpus = [];

  for (const gpu of knownGpus) {
    try {
      let updatedGpu = { ...gpu, metrics: gpu.metrics || {}, lastUpdated: Date.now() };

      // Query metrics based on GPU type
      if (gpu.vendor === "NVIDIA") {
        updatedGpu = await updateNvidiaMetrics(updatedGpu);
      } else if (gpu.vendor === "AMD") {
        // Only use ROCm metrics for ROCm-capable discrete GPUs (not integrated)
        // Integrated AMD GPUs don't have ROCm support and will have isRocmCapable = false
        if (gpu.isRocmCapable) {
          updatedGpu = await updateRocmMetrics(updatedGpu);
        } else {
          // AMD integrated GPU - no metrics available via sysfs, keep existing
        }
      }
      // Intel iGPU - no metrics available via sysfs

      updatedGpus.push(updatedGpu);
    } catch (error) {
      // Keep existing GPU data on error
      updatedGpus.push(gpu);
    }
  }

  return updatedGpus;
}

/**
 * Update NVIDIA GPU metrics by querying nvidia-smi
 * @param {Object} gpu - GPU object
 * @returns {Promise<Object>} GPU with updated metrics
 */
async function updateNvidiaMetrics(gpu) {
  try {
    const { stdout } = await execAsync(
      `/usr/bin/nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,power.limit,fan.speed,clocks.gr,clocks.mem,utilization.encoder,utilization.decoder --format=csv,noheader,nounits 2>/dev/null`,
      { encoding: "utf8", timeout: 3000 }
    );

    const lines = stdout.trim().split("\n");
    // Find matching GPU by index
    const gpuIndex = parseInt(gpu.deviceId.replace("nvidia-", "")) || 0;
    const line = lines[gpuIndex];

    if (line) {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length >= 11) {
        const vramTotalMiB = gpu.vramTotalMiB || 0;
        const memoryUsedMiB = parseInt(parts[2]) || 0;

        gpu.metrics = {
          utilizationPercent: parseFloat(parts[1]) || 0,
          memoryUsedMiB,
          memoryUsedBytes: memoryUsedMiB * 1024 * 1024,
          memoryTotalMiB: parseInt(parts[3]) || vramTotalMiB,
          memoryTotalBytes: (parseInt(parts[3]) || vramTotalMiB) * 1024 * 1024,
          temperatureCelsius: parseFloat(parts[4]) || null,
          powerDrawWatts: parseFloat(parts[5]) || null,
          powerLimitWatts: parseFloat(parts[6]) || null,
          fanSpeedPercent: parseFloat(parts[7]) || null,
          clockSpeedMhz: parseFloat(parts[8]) || null,
          memoryClockMhz: parseFloat(parts[9]) || null,
          encoderUtilPercent: parseFloat(parts[10]) || null,
          decoderUtilPercent: parseFloat(parts[11]) || null,
          vramUsagePercent: vramTotalMiB > 0 ? (memoryUsedMiB / vramTotalMiB) * 100 : 0,
        };
        gpu.lastUpdated = Date.now();
      }
    }
  } catch (error) {
    // NVIDIA metrics query failed, keep existing data
  }
  return gpu;
}

/**
 * Update ROCm GPU metrics
 * @param {Object} gpu - GPU object
 * @returns {Promise<Object>} GPU with updated metrics
 */
async function updateRocmMetrics(gpu) {
  try {
    const { stdout } = await execAsync(
      `rocm-smi --showid --showmeminfo --showtemp --showpower --showuse --json 2>/dev/null`,
      { encoding: "utf8", timeout: 3000 }
    );

    const data = JSON.parse(stdout);
    const cardId = gpu.deviceId.replace("amd-rocm-", "");

    if (data[cardId]) {
      const gpuData = data[cardId];
      const vramTotalMiB = gpu.vramTotalMiB || 0;
      const vramUsedMiB = gpuData["Memory"]["Used GC memory (MiB)"] || 0;

      gpu.metrics = {
        utilizationPercent: gpuData["GPU use (%)"] || 0,
        memoryUsedMiB,
        memoryUsedBytes: vramUsedMiB * 1024 * 1024,
        memoryTotalMiB: vramTotalMiB,
        memoryTotalBytes: vramTotalMiB * 1024 * 1024,
        temperatureCelsius: gpuData["Temperature (Sensor edge) (C)"] || null,
        powerDrawWatts: gpuData["Average Graphics Package Power (W)"] || null,
        fanSpeedPercent: gpuData["Fan Speed (%)"] || null,
        clockSpeedMhz: null,
        memoryClockMhz: null,
        encoderUtilPercent: null,
        decoderUtilPercent: null,
        vramUsagePercent: vramTotalMiB > 0 ? (vramUsedMiB / vramTotalMiB) * 100 : 0,
      };
      gpu.lastUpdated = Date.now();
    }
  } catch (error) {
    // ROCm metrics query failed, keep existing data
  }
  return gpu;
}

// Import execAsync for metrics collection
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

/**
 * Build Socket.IO broadcast data structure
 * @param {Array} gpus - Array of GPU objects
 * @returns {Object} Broadcast data
 */
export function buildBroadcastData(gpus) {
  // Calculate aggregates
  const activeGpus = gpus.filter(g => g.status === "active");
  const totalVram = activeGpus.reduce((sum, g) => sum + (g.vramTotalBytes || 0), 0);
  const totalUsedVram = activeGpus.reduce((sum, g) => sum + (g.metrics?.memoryUsedBytes || 0), 0);
  const avgUtilization = activeGpus.length > 0
    ? activeGpus.reduce((sum, g) => sum + (g.metrics?.utilizationPercent || 0), 0) / activeGpus.length
    : 0;
  const maxTemperature = activeGpus.length > 0
    ? Math.max(...activeGpus.map(g => g.metrics?.temperatureCelsius || 0))
    : 0;
  const totalPower = activeGpus.reduce((sum, g) => sum + (g.metrics?.powerDrawWatts || 0), 0);

  return {
    type: "broadcast",
    timestamp: Date.now(),
    data: {
      list: gpus.map(gpu => ({
        deviceId: gpu.deviceId,
        name: gpu.name,
        vendor: gpu.vendor,
        vramTotalMiB: gpu.vramTotalMiB,
        vramTotalBytes: gpu.vramTotalBytes,
        driverVersion: gpu.driverVersion,
        cudaVersion: gpu.cudaVersion,
        busLocation: gpu.busLocation,
        isIntegrated: gpu.isIntegrated || false,
        metrics: {
          utilizationPercent: gpu.metrics?.utilizationPercent || 0,
          memoryUsedMiB: gpu.metrics?.memoryUsedMiB || 0,
          memoryUsedBytes: gpu.metrics?.memoryUsedBytes || 0,
          memoryTotalMiB: gpu.metrics?.memoryTotalMiB || gpu.vramTotalMiB,
          memoryTotalBytes: gpu.metrics?.memoryTotalBytes || gpu.vramTotalBytes,
          temperatureCelsius: gpu.metrics?.temperatureCelsius || null,
          powerDrawWatts: gpu.metrics?.powerDrawWatts || null,
          fanSpeedPercent: gpu.metrics?.fanSpeedPercent || null,
          clockSpeedMhz: gpu.metrics?.clockSpeedMhz || null,
          memoryClockMhz: gpu.metrics?.memoryClockMhz || null,
          encoderUtilPercent: gpu.metrics?.encoderUtilPercent || null,
          decoderUtilPercent: gpu.metrics?.decoderUtilPercent || null,
          vramUsagePercent: gpu.metrics?.vramUsagePercent || 0,
        },
        status: gpu.status,
        lastUpdated: gpu.lastUpdated,
      })),
      count: gpus.length,
      usage: Math.round(avgUtilization * 10) / 10,
      memoryUsed: totalUsedVram,
      memoryTotal: totalVram,
      temperature: maxTemperature,
      power: Math.round(totalPower * 10) / 10,
    },
  };
}

/**
 * Get current GPU status (for initial load)
 * @returns {Object} Current GPU status with proper structure
 */
export function getGpuStatus() {
  console.debug("[GPU-MONITOR] getGpuStatus called, lastGpuList has", lastGpuList.length, "GPUs");

  // Ensure we always have a valid broadcast data structure
  const broadcastData = buildBroadcastData(lastGpuList);

  console.debug("[GPU-MONITOR] Returning broadcast data:", {
    hasData: !!broadcastData.data,
    listLength: broadcastData.data?.list?.length || 0,
    count: broadcastData.data?.count || 0,
  });

  return broadcastData;
}

/**
 * Check if monitoring is active
 * @returns {boolean}
 */
export function isMonitoringActive() {
  return isMonitoring;
}

/**
 * Get detection status (what methods are available)
 * @returns {Object}
 */
export function getGpuDetectionStatus() {
  return getDetectionStatus();
}

/**
 * Collect GPU metrics for metrics.js compatibility
 * Returns simplified format for metrics aggregation
 * @returns {Promise<Object>}
 */
export async function collectGpuMetrics() {
  try {
    const gpus = await detectAndCollectGpus();
    const activeGpus = gpus.filter(g => g.status === "active");

    const totalMemory = activeGpus.reduce((sum, g) => sum + (g.vramTotalBytes || 0), 0);
    const usedMemory = activeGpus.reduce((sum, g) => sum + (g.metrics?.memoryUsedBytes || 0), 0);
    const avgUsage = activeGpus.length > 0
      ? activeGpus.reduce((sum, g) => sum + (g.metrics?.utilizationPercent || 0), 0) / activeGpus.length
      : 0;

    return {
      gpuUsage: avgUsage,
      gpuMemoryUsed: usedMemory,
      gpuMemoryTotal: totalMemory,
      gpuList: gpus,
    };
  } catch (error) {
    console.debug("[GPU-MONITOR] collectGpuMetrics error:", error.message);
    return {
      gpuUsage: 0,
      gpuMemoryUsed: 0,
      gpuMemoryTotal: 0,
      gpuList: [],
    };
  }
}

/**
 * Get current GPU list (for metrics.js compatibility)
 * @returns {Promise<Array>}
 */
export async function getGpuList() {
  try {
    return await detectAndCollectGpus();
  } catch (error) {
    console.debug("[GPU-MONITOR] getGpuList error:", error.message);
    return [];
  }
}
