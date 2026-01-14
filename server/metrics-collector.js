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
 * Initialize CPU times for delta-based calculation
 */
export function initCpuTimes() {
  lastCpuTimes = null;
}

/**
 * Collect CPU metrics with delta-based calculation
 * @returns {Object} CPU usage percentage
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
 * Collect memory and swap metrics
 * @returns {Object} Memory usage data
 */
export async function collectMemoryMetrics() {
  try {
    const memInfo = await si.mem();
    if (!memInfo) return { memoryUsedPercent: 0, swapUsedPercent: 0 };

    const actualUsed = memInfo.total - memInfo.available;
    const memoryUsedPercent = Math.round((actualUsed / memInfo.total) * 1000) / 10;
    let swapUsedPercent = 0;

    if (memInfo.swaptotal > 0) {
      swapUsedPercent = Math.round((memInfo.swapused / memInfo.swaptotal) * 1000) / 10;
    }

    return { memoryUsedPercent, swapUsedPercent };
  } catch (e) {
    console.debug("[METRICS] Memory data not available:", e.message);
    return { memoryUsedPercent: 0, swapUsedPercent: 0 };
  }
}

/**
 * Collect disk usage metrics
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
 * Get current metrics call count and increment
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
 * Reset metrics call count
 */
export function resetMetricsCallCount() {
  metricsCallCount = 0;
}
