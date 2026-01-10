/**
 * Llama Async Proxy Dashboard - Server Entry Point
 * Node.js + Express + Socket.IO
 */

import http from "http";
import express from "express";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import si from "systeminformation";

import DB from "./server/db/index.js";
import { registerHandlers } from "./server/handlers.js";
import { updateGpuList } from "./server/handlers/metrics.js";
import { parseGgufMetadata } from "./server/gguf/index.js";
import { LlamaServerMetricsScraper } from "./server/handlers/llama-router/metrics-scraper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// Metrics collection with delta-based CPU calculation
let lastCpuTimes = null;
let metricsCallCount = 0;
let metricsInterval = null;
let activeClients = 1; // Start with 1 client for backwards compatibility with tests
let llamaMetricsScraper = null;

/**
 * Update metrics collection interval based on active clients
 * 10s with clients, 60s when idle
 */
function updateMetricsInterval(io, db) {
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

async function startMetrics(io, db) {
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

async function collectMetrics(io, db) {
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
async function collectLlamaMetrics(io) {
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

// Graceful shutdown
function setupShutdown(server) {
  const shutdown = (sig) => {
    console.log(`\n${sig} received, shutting down...`);
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Forced shutdown");
      process.exit(1);
    }, 10000);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Export for testing
export { startMetrics, setupShutdown, main };

// Main entry point
async function main() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new DB();
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/llamaproxws",
    transports: ["websocket"],
  });

  registerHandlers(io, db, parseGgufMetadata);
  startMetrics(io, db);

  app.use(express.static(path.join(__dirname, "public")));
  app.use(
    "/socket.io",
    express.static(path.join(__dirname, "node_modules", "socket.io", "client-dist"))
  );
  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/socket.io") &&
      !req.path.startsWith("/llamaproxws")
    ) {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    } else {
      next();
    }
  });

  server.listen(PORT, () => {
    console.log("\n== Llama Async Proxy ==");
    console.log(`> http://localhost:${PORT}`);
    console.log("> Socket.IO: ws://localhost:${PORT}/llamaproxws\n");
  });

  setupShutdown(server);
}

// Run main if this is the main module
// Check if this is being run directly (not imported for testing)
const isMainModule =
  process.argv[1] &&
  (process.argv[1].includes("server.js") || process.argv[1].includes("bin/")) &&
  !process.env.JEST_WORKER_ID;

// Also prevent execution during test imports
const inTestMode = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

if (isMainModule && !inTestMode) {
  main().catch((e) => {
    console.error("Failed to start server:", e);
    process.exit(1);
  });
}
