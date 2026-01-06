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

// Metrics collection
function startMetrics(io, db) {
  setInterval(() => {
    try {
      const mem = process.memoryUsage();
      const cpu = (os.cpus().reduce((a, c) => {
        const t = c.times.user + c.times.nice + c.times.sys + c.times.idle;
        return a + (c.times.user + c.times.nice + c.times.sys) / t;
      }, 0) / os.cpus().length) * 100;
      db.saveMetrics({ cpu_usage: cpu, memory_usage: mem.heapUsed, uptime: process.uptime() });
      io.emit("metrics:update", { metrics: { cpu: { usage: cpu }, memory: { used: mem.heapUsed }, uptime: process.uptime() } });
    } catch (e) {
      console.error("[METRICS] Error:", e.message);
    }
  }, 10000);
}

// Graceful shutdown
function setupShutdown(server) {
  const shutdown = (sig) => {
    console.log(`\n${sig} received, shutting down...`);
    server.close(() => { console.log("Server closed"); process.exit(0); });
    setTimeout(() => { console.error("Forced shutdown"); process.exit(1); }, 10000);
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
  app.use("/socket.io", express.static(path.join(__dirname, "node_modules", "socket.io", "client-dist")));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/socket.io") && !req.path.startsWith("/llamaproxws")) {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    } else {
      next();
    }
  });

  server.listen(PORT, () => {
    console.log(`\n== Llama Async Proxy ==\n> http://localhost:${PORT}\n> Socket.IO: ws://localhost:${PORT}/llamaproxws\n`);
  });

  setupShutdown(server);
}

main().catch((e) => {
  console.error("Failed to start server:", e);
  process.exit(1);
});
