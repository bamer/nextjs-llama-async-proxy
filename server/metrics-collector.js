/**
 * System Metrics Collector - CPU, Memory, Disk collection
 * Part of metrics.js refactoring (≤200 lines)
 */

import os from "os";
import si from "systeminformation";

let lastCpuTimes = null;
let metricsCallCount = 0;
const MAX_METRICS_CALL_COUNT = 1000000;

/**
 * Initialize CPU times for delta-based calculation.
 * Resets internal tracking to start fresh measurements.
 */
export function initCpuTimes() {
  lastCpuTimes = null;
}

/**
 * Collect CPU metrics with delta-based calculation.
 * Calculates CPU usage by comparing current and previous CPU times.
 * @returns {number} CPU usage percentage (0-100)
 */
export function collectCpuMetrics() {
  const cpus = os.cpus();
  let cpuUsage = 0;

  if (lastCpuTimes) {
    let userDelta = 0;
    let sysDelta = 0;
    let idleDelta = 0;

    for (let i = 0; i < cpus.length; i++) {
      userDelta += cpus[i].times.user - (lastCpuTimes[i]?.user || 0);
      sysDelta += cpus[i].times.sys - (lastCpuTimes[i]?.sys || 0);
      idleDelta += cpus[i].times.idle - (lastCpuTimes[i]?.idle || 0);
    }

    const totalDelta = userDelta + sysDelta + idleDelta;
    if (totalDelta > 0) {
      cpuUsage = ((userDelta + sysDelta) / totalDelta) * 100;
    }
  }

  // Store current times for next iteration
  lastCpuTimes = cpus.map((c) => ({
    user: c.times.user,
    sys: c.times.sys,
    idle: c.times.idle,
  }));

  return Math.round(cpuUsage * 10) / 10;
}

/**
 * Collect memory and swap metrics from system information.
 * @returns {Object} Memory usage data with memoryUsedPercent and swapUsedPercent
 */
export async function collectMemoryMetrics() {
  try {
    const memInfo = await si.mem();
    if (!memInfo) {
      console.debug("[METRICS] Memory info not available from systeminformation");
      return { memoryUsedPercent: 0, swapUsedPercent: 0 };
    }

    // Debug logging for swap diagnostics
    const hasSwap = memInfo.swaptotal > 0;
    console.log("[DEBUG] Memory metrics retrieved:", {
      total: memInfo.total,
      available: memInfo.available,
      swapTotal: memInfo.swaptotal,
      swapUsed: memInfo.swapused,
      hasSwap: hasSwap,
      swapUsage: hasSwap ? Math.round((memInfo.swapused / memInfo.swaptotal) * 1000) / 10 : 0,
    });

    const actualUsed = memInfo.total - memInfo.available;
    const memoryUsedPercent = Math.round((actualUsed / memInfo.total) * 1000) / 10;
    let swapUsedPercent = 0;

    if (hasSwap) {
      swapUsedPercent = Math.round((memInfo.swapused / memInfo.swaptotal) * 1000) / 10;
    }

    return { memoryUsedPercent, swapUsedPercent };
  } catch (e) {
    console.debug("[METRICS] Memory data not available:", e.message);
    return { memoryUsedPercent: 0, swapUsedPercent: 0 };
  }
}

/**
 * Collect disk usage metrics for the root filesystem.
 * @returns {Object} Disk usage percentage
 */
export async function collectDiskMetrics() {
  try {
    const disks = await si.fsSize();
    if (!disks || disks.length === 0) return { diskUsedPercent: 0 };

    const rootDisk = disks.find((d) => d.mount === "/") || disks[0];
    const diskUsedPercent = Math.round((rootDisk.used / rootDisk.size) * 1000) / 10;

    return { diskUsedPercent };
  } catch (e) {
    console.debug("[METRICS] Disk data not available:", e.message);
    return { diskUsedPercent: 0 };
  }
}

/**
 * Get current metrics call count and increment.
 * Used for periodic task scheduling (e.g., prune old metrics).
 * @returns {number} Current count after increment
 */
export function getMetricsCallCount() {
  metricsCallCount++;
  if (metricsCallCount >= MAX_METRICS_CALL_COUNT) {
    metricsCallCount = 1;
  }
  return metricsCallCount;
}

/**
 * Reset metrics call count to zero.
 */
export function resetMetricsCallCount() {
  metricsCallCount = 0;
}
