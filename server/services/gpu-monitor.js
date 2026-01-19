/**
 * GPU Monitor Service - Real-time GPU monitoring with Socket.IO
 * No database persistence - pure real-time streaming
 */

import { detectAndCollectGpus, getDetectionStatus } from "./gpu-detector.js";

// Configuration
const GPU_POLL_INTERVAL = 2000; // 2 seconds for real-time updates
const GPU_DETECTION_INTERVAL = 10000; // 10 seconds for device enumeration

// State
let pollTimer = null;
let detectionTimer = null;
let isMonitoring = false;
let lastGpuList = [];

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

  // Initial detection
  runDetectionAndBroadcast(io);

  // Periodic full detection (for new device detection)
  detectionTimer = setInterval(() => {
    runDetectionAndBroadcast(io).catch(e => {
      console.error("[GPU-MONITOR] Detection error:", e.message);
    });
  }, GPU_DETECTION_INTERVAL);

  // Fast polling for metrics updates
  pollTimer = setInterval(() => {
    runMetricsUpdate(io).catch(e => {
      console.debug("[GPU-MONITOR] Metrics update error:", e.message);
    });
  }, GPU_POLL_INTERVAL);

  console.log("[GPU-MONITOR] Started - polling every", GPU_POLL_INTERVAL, "ms");
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
  * @param {Object} io - Socket.IO server instance
  */
 async function runDetectionAndBroadcast(io) {
   try {
     const gpus = await detectAndCollectGpus();
     lastGpuList = gpus;

     console.log("[DEBUG] GPU detection result:", JSON.stringify(gpus.map(g => ({
       deviceId: g.deviceId,
       name: g.name,
       vendor: g.vendor,
       vramTotalMiB: g.vramTotalMiB,
       metrics: g.metrics
     })), null, 2));

     const broadcastData = buildBroadcastData(gpus);

    if (io) {
      io.emit("gpu:updated", broadcastData);
    }

    console.log("[GPU-MONITOR] Detected", gpus.length, "GPU(s)");
    return gpus;
  } catch (error) {
    console.error("[GPU-MONITOR] Detection failed:", error.message);
    throw error;
  }
}

/**
 * Run metrics-only update (faster, no detection)
 * @param {Object} io - Socket.IO server instance
 */
async function runMetricsUpdate(io) {
  try {
    // Re-run full detection for freshest data
    const gpus = await detectAndCollectGpus();
    lastGpuList = gpus;

    const broadcastData = buildBroadcastData(gpus);

    if (io) {
      io.emit("gpu:updated", broadcastData);
    }

    return gpus;
  } catch (error) {
    // Silent fail for metrics updates - don't spam logs
    return lastGpuList;
  }
}

/**
 * Build Socket.IO broadcast data structure
 * @param {Array} gpus - Array of GPU objects
 * @returns {Object} Broadcast data
 */
function buildBroadcastData(gpus) {
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
 * @returns {Object} Current GPU status
 */
export function getGpuStatus() {
  return buildBroadcastData(lastGpuList);
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
