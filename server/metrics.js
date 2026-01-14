import os from "os";
import si from "systeminformation";
import { LlamaServerMetricsScraper } from "./handlers/llama-router/metrics-scraper.js";
import { updateGpuList } from "./handlers/metrics.js"; // Adjust path as needed

// Metrics collection with delta-based CPU calculation
let lastCpuTimes = null;
let metricsCallCount = 0;
let metricsInterval = null;
export let activeClients = 1; // Start with 1 client for backwards compatibility with tests
let llamaMetricsScraper = null;

/**
 * Initialize llama-server metrics scraper when server starts
 * @param {number} port - The port llama-server is running on
 */
export function initializeLlamaMetricsScraper(port) {
  console.log("[DEBUG] Initializing llama metrics scraper for port:", port);
  llamaMetricsScraper = new LlamaServerMetricsScraper({
    host: "127.0.0.1",
    port: port,
  });
  console.log("[DEBUG] Llama metrics scraper initialized");
}

/**
 * Update metrics collection interval based on active clients
 * 10s with clients, 60s when idle
 */
export function updateMetricsInterval(io, db) {
  const newInterval = activeClients > 0 ? 10000 : 60000;
  console.log("[DEBUG] Updating metrics interval:", {
    activeClients,
    interval: `${newInterval / 1000}s`,
  });

  if (metricsInterval) {
    clearInterval(metricsInterval);
  }

  metricsInterval = setInterval(() => collectMetrics(io, db), newInterval);
}

export async function startMetricsCollection(io, db) {
  lastCpuTimes = null;
  updateMetricsInterval(io, db);

  // Track active clients (only if io has on method, i.e., real Socket.IO instance)
  if (typeof io.on === "function") {
    io.on("connection", () => {
      activeClients++;
      console.log("[DEBUG] Client connected, active clients:", activeClients);
      updateMetricsInterval(io, db);
    });

    io.on("disconnect", () => {
      activeClients--;
      console.log("[DEBUG] Client disconnected, active clients:", activeClients);
      updateMetricsInterval(io, db);
    });
  }
}

export async function collectMetrics(io, db) {
  try {
    const cpus = os.cpus();

    // Calculate CPU usage using delta (more accurate than instantaneous)
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

    // Get system memory usage (as percentage)
    // Use (total - available) to account for cached memory
    let memoryUsedPercent = 0;
    let swapUsedPercent = 0;
    try {
      const memInfo = await si.mem();
      if (memInfo) {
        // Calculate real memory usage: total - available
        const actualUsed = memInfo.total - memInfo.available;
        memoryUsedPercent = Math.round((actualUsed / memInfo.total) * 1000) / 10;

        // Calculate swap usage
        if (memInfo.swaptotal > 0) {
          swapUsedPercent = Math.round((memInfo.swapused / memInfo.swaptotal) * 1000) / 10;
        }

        console.log("[DEBUG] Memory metrics collected:", {
          total: `${(memInfo.total / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${(actualUsed / 1024 / 1024 / 1024).toFixed(2)} GB`,
          available: `${(memInfo.available / 1024 / 1024 / 1024).toFixed(2)} GB`,
          percent: memoryUsedPercent,
          swapUsed: `${(memInfo.swapused / 1024 / 1024 / 1024).toFixed(2)} GB`,
          swapTotal: `${(memInfo.swaptotal / 1024 / 1024 / 1024).toFixed(2)} GB`,
          swapPercent: swapUsedPercent,
        });
      }
    } catch (e) {
      console.log("[DEBUG] Memory data not available:", e.message);
    }

    // Get disk usage for root drive
    let diskUsedPercent = 0;
    try {
      const disks = await si.fsSize();
      if (disks && disks.length > 0) {
        // Get root filesystem (typically mounted at /)
        const rootDisk = disks.find((d) => d.mount === "/") || disks[0];
        diskUsedPercent = Math.round((rootDisk.used / rootDisk.size) * 1000) / 10;
        console.log("[DEBUG] Disk metrics collected:", {
          mount: rootDisk.mount,
          used: rootDisk.used,
          total: rootDisk.size,
          percent: diskUsedPercent,
        });
      }
    } catch (e) {
      console.log("[DEBUG] Disk data not available:", e.message);
    }

    // Get GPU data - support multiple GPUs
    let gpuList = [];
    let gpuUsage = 0;
    let gpuMemoryUsed = 0;
    let gpuMemoryTotal = 0;
    try {
      const gpu = await si.graphics();
      if (gpu.controllers && gpu.controllers.length > 0) {
        gpuList = gpu.controllers.map((controller) => ({
          name: controller.model || "Unknown GPU",
          usage: controller.utilizationGpu || 0,
          memoryUsed: (controller.memoryUsed || 0) * 1024 * 1024, // Convert MB to bytes
          memoryTotal: (controller.memoryTotal || 0) * 1024 * 1024, // Convert MB to bytes
          vendor: controller.vendor || "Unknown",
        }));

        // Primary GPU for backward compatibility
        const primaryGpu = gpuList[0];
        gpuUsage = primaryGpu.usage;
        gpuMemoryUsed = primaryGpu.memoryUsed;
        gpuMemoryTotal = primaryGpu.memoryTotal;

        // Update GPU list for metrics responses
        updateGpuList(gpuList);

        console.log("[DEBUG] GPU metrics collected:", {
          count: gpuList.length,
          primary: primaryGpu.name,
          usage: gpuUsage,
          memoryUsed: gpuMemoryUsed,
          memoryTotal: gpuMemoryTotal,
        });
      }
    } catch (e) {
      console.log("[DEBUG] GPU data not available:", e.message);
    }

    // Save metrics
    db.saveMetrics({
      cpu_usage: Math.round(cpuUsage * 10) / 10,
      memory_usage: memoryUsedPercent,
      swap_usage: swapUsedPercent,
      disk_usage: diskUsedPercent,
      uptime: process.uptime(),
      gpu_usage: Math.round(gpuUsage * 10) / 10,
      gpu_memory_used: Math.round(gpuMemoryUsed),
      gpu_memory_total: Math.round(gpuMemoryTotal),
    });

    // Emit to clients
    io.emit("metrics:update", {
      type: "broadcast",
      data: {
        metrics: {
          cpu: { usage: cpuUsage },
          memory: { used: memoryUsedPercent },
          swap: { used: swapUsedPercent },
          disk: { used: diskUsedPercent },
          gpu: {
            usage: gpuUsage,
            memoryUsed: gpuMemoryUsed,
            memoryTotal: gpuMemoryTotal,
            list: gpuList,
          },
          uptime: process.uptime(),
        },
      },
    });

    // Prune old metrics every 6 minutes (based on 10s interval)
    metricsCallCount++;
    if (metricsCallCount % 36 === 0) {
      db.pruneMetrics(10000);
    }

    // Also collect llama-server metrics
    if (metricsCallCount % 2 === 0) {
      // Every 20s (2 * 10s interval)
      collectLlamaMetrics(io);
    }
  } catch (e) {
    console.error("[METRICS] Error:", e.message);
  }
}

/**
 * Collect and broadcast llama-server metrics
 */
export async function collectLlamaMetrics(io) {
  if (!llamaMetricsScraper) {
    return; // Not initialized yet
  }

  try {
    const metrics = await llamaMetricsScraper.getMetrics();
    if (metrics) {
      console.log("[DEBUG] Llama server metrics collected:", metrics);
      // Broadcast to clients
      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "running",
          metrics: {
            activeModels: metrics.activeModels || 0,
            tokensPerSecond: metrics.tokensPerSecond || 0,
            queueSize: metrics.queueSize || 0,
            totalRequests: metrics.totalRequests || 0,
          },
          uptime: metrics.uptime || 0,
        },
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    console.error("[LLAMA-METRICS] Failed to collect metrics:", e.message);
  }
}
