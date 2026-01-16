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

// Corrected import paths based on previous debugging
import {
  startMetricsCollection,
  initializeLlamaMetricsScraper,
  activeClients,
  collectMetrics,
  initializeLlamaMetricsScraper as initializeLlamaMetrics,
} from "./server/metrics.js";
import { setupGracefulShutdown } from "./server/shutdown.js";
import { DB } from "./server/db/index.js";
import { registerHandlers } from "./server/handlers.js";
import { parseGgufMetadata } from "./server/gguf/metadata-parser.js";
import { startLlamaServerRouter } from "./server/handlers/llama-router/index.js";
import { autoStartLlamaServer } from "./server/server-startup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// All metrics related functions are now imported from server/metrics.js
// No need for local variables like lastCpuTimes, metricsCallCount, metricsInterval, activeClients, llamaMetricsScraper
// These are managed within server/metrics.js

// Export for testing
export { startMetricsCollection, setupGracefulShutdown, main };

/**
 * Main server entry point that initializes all components.
 * @returns {Promise<void>} Resolves when server is fully initialized
 */
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

  // Initialize llama metrics scraper (pass db for dynamic port lookup)
  initializeLlamaMetricsScraper(null, db); // null = use config port from db
  console.log("[SERVER] Initialized Llama Metrics Scraper."); // ADDED LOG

  console.log("[SERVER] Registering Socket.IO handlers..."); // ADDED LOG
  registerHandlers(io, db, parseGgufMetadata, initializeLlamaMetrics); // PASS initializeLlamaMetrics
  console.log("[SERVER] Socket.IO handlers registered."); // ADDED LOG
  startMetricsCollection(io, db); // Use the imported function
  console.log("[SERVER] Started Metrics Collection."); // ADDED LOG

  app.use(express.static(path.join(__dirname, "public")));
  app.use(
    "/socket.io",
    express.static(path.join(__dirname, "node_modules", "socket.io", "client-dist"))
  );

  // SPA fallback: For any other GET request not handled by static files, send index.html
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  server.listen(PORT, () => {
    console.log("\n== Llama Async Proxy ==");
    console.log(`> http://localhost:${PORT}`);
    console.log(`> Socket.IO: ws://localhost:${PORT}/llamaproxws\n`);

    // Auto-start llama-server if enabled in config
    autoStartLlamaServer({
      db,
      startLlamaServerRouter,
      initializeLlamaMetrics,
    });
  });

  setupGracefulShutdown(server);
}

// Run main if this is the main module
const isMainModule =
  process.argv[1] &&
  (process.argv[1].includes("server.js") || process.argv[1].includes("bin/")) &&
  !process.env.JEST_WORKER_ID;

const inTestMode = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

if (isMainModule && !inTestMode) {
  main().catch((e) => {
    console.error("Failed to start server:", e);
    process.exit(1);
  });
}
