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

import DB from "./server/db.js";
import { registerHandlers } from "./server/handlers.js";
import { parseGgufMetadata } from "./server/gguf-parser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// Metrics collection with delta-based CPU calculation
let lastCpuTimes = null;
let metricsCallCount = 0;

function startMetrics(io, db) {
  lastCpuTimes = null;

  setInterval(() => {
    try {
      const mem = process.memoryUsage();
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

      // Save metrics
      db.saveMetrics({
        cpu_usage: Math.round(cpuUsage * 10) / 10,
        memory_usage: mem.heapUsed,
        uptime: process.uptime(),
      });

      // Emit to clients
      io.emit("metrics:update", {
        type: "broadcast",
        data: {
          metrics: {
            cpu: { usage: cpuUsage },
            memory: { used: mem.heapUsed },
            uptime: process.uptime(),
          },
        },
      });

      // Prune old metrics every 6 minutes
      metricsCallCount++;
      if (metricsCallCount % 36 === 0) {
        db.pruneMetrics(10000);
      }
    } catch (e) {
      console.error("[METRICS] Error:", e.message);
    }
  }, 10000);
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
    console.log(
      `\n== Llama Async Proxy ==\n> http://localhost:${PORT}\n> Socket.IO: ws://localhost:${PORT}/llamaproxws\n`
    );
  });

  setupShutdown(server);
}

main().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
