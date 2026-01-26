import dotenv from "dotenv";
import http from "http";
import express from "express";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import si from "systeminformation";

// Load environment variables from .env file
dotenv.config();

// Corrected import paths based on previous debugging
import {
  startMetricsCollection,
  initializeLlamaMetricsScraper,
  collectMetrics,
  initializeLlamaMetricsScraper as initializeLlamaMetrics,
} from "./server/metrics.js";
import { setupGracefulShutdown } from "./server/shutdown.js";
import { DB } from "./server/db/index.js";
import { registerAllDomainHandlers } from "./server/handlers/index.js";
import { parseGgufMetadata } from "./server/gguf/metadata-parser.js";
import { startLlamaServerRouter } from "./server/handlers/llama-router/index.js";
import { autoStartLlamaServer } from "./server/server-startup.js";
import {
  startGpuMonitor,
  stopGpuMonitor,
} from "./server/services/gpu-monitor.js";
import { registerGpuHandlers } from "./server/handlers/gpu-handler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// Rate limiting state
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_EVENTS_PER_WINDOW = 10; // Max 10 events per second per socket

function createRateLimiter() {
  return (socket, next) => {
    const clientId = socket.id;
    const now = Date.now();

    if (!rateLimitStore.has(clientId)) {
      rateLimitStore.set(clientId, { count: 0, lastReset: now });
    }

    const clientData = rateLimitStore.get(clientId);

    if (now - clientData.lastReset > RATE_LIMIT_WINDOW) {
      clientData.count = 0;
      clientData.lastReset = now;
    }

    clientData.count++;

    if (clientData.count > MAX_EVENTS_PER_WINDOW) {
      console.warn(
        `[RATE LIMIT] Client ${clientId} exceeded limit, disconnecting`
      );
      return next(new Error("Rate limit exceeded"));
    }

    next();
  };
}

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  await fs.promises.mkdir(dataDir, { recursive: true });

  const db = new DB();
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://yourdomain.com"]
          : ["http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
    },
    path: "/llamaproxws",
    transports: ["websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 10000,
  });

  // Apply rate limiting middleware
  io.use(createRateLimiter());

  io.engine.on("connection_error", (err) => {
    console.error("[WS] Connection error:", {
      message: err.message,
      code: err.code,
      context: err.context,
    });
  });

  // Removed: separate io.engine connection handler; use standard io.on('connection') for per-socket wiring

  // Initialize llama metrics scraper
  initializeLlamaMetricsScraper(null, db);
  console.log("[SERVER] Initialized Llama Metrics Scraper.");

  // Modular domain handlers will be mounted per-connection via registrar
  // start metrics collection and other boot-time tasks here
  startMetricsCollection(io, db);
  console.log("[SERVER] Started Metrics Collection.");

  // On new connections, mount domain-handlers via registrar and then register GPU handlers
  io.on("connection", (socket) => {
    if (typeof registerAllDomainHandlers === "function") {
      registerAllDomainHandlers(socket, io, db, initializeLlamaMetrics);
    }
    registerGpuHandlers(socket);
  });
  console.log("[SERVER] GPU handlers registered.");

  // Start GPU monitoring
  startGpuMonitor(io);
  console.log("[SERVER] GPU monitoring started.");

  app.use(express.static(path.join(__dirname, "public")));
  // Serve Socket.IO client from a path that doesn't conflict with Socket.IO server
  app.use(
    "/js/socket.io",
    express.static(
      path.join(__dirname, "node_modules", "socket.io", "client-dist")
    )
  );

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  server.listen(PORT, () => {
    console.log("\n== Llama Async Proxy ==");
    console.log(`> http://localhost:${PORT}`);
    console.log(`> Socket.IO: ws://localhost:${PORT}/llamaproxws`);

    autoStartLlamaServer({
      db,
      startLlamaServerRouter,
      initializeLlamaMetrics,
    });
  });

  setupGracefulShutdown(server);
}

const isMainModule =
  process.argv[1] &&
  (process.argv[1].includes("server.js") || process.argv[1].includes("bin/")) &&
  !process.env.JEST_WORKER_ID;

const inTestMode =
  process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

if (isMainModule && !inTestMode) {
  main().catch((e) => {
    console.error("Failed to start server:", e);
    process.exit(1);
  });
}
