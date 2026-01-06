/**
 * Llama Async Proxy Dashboard - Simplified Server
 * Node.js + Express + Socket.IO
 */

import http from "http";
import express from "express";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import DatabasePackage from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Database = DatabasePackage;

// Database Layer
class DB {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(process.cwd(), "data", "llama-dashboard.db");
    this.db = new Database(this.dbPath);
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'llama',
        status TEXT DEFAULT 'idle',
        parameters TEXT DEFAULT '{}',
        model_path TEXT,
        ctx_size INTEGER DEFAULT 2048,
        batch_size INTEGER DEFAULT 512,
        threads INTEGER DEFAULT 4,
        created_at INTEGER,
        updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cpu_usage REAL,
        memory_usage REAL,
        disk_usage REAL,
        active_models INTEGER,
        uptime REAL,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE TABLE IF NOT EXISTS server_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER);
    `);
  }

  // Models
  getModels() { return this.db.prepare("SELECT * FROM models ORDER BY created_at DESC").all(); }
  getModel(id) { return this.db.prepare("SELECT * FROM models WHERE id = ?").get(id); }
  saveModel(model) {
    const id = model.id || `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    this.db.prepare(`INSERT OR REPLACE INTO models (id, name, type, status, parameters, model_path, ctx_size, batch_size, threads, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, model.name, model.type || "llama", model.status || "idle",
      JSON.stringify(model.parameters || {}), model.model_path || model.path || null,
      model.ctx_size || 2048, model.batch_size || 512, model.threads || 4,
      model.created_at || now, now
    );
    return this.getModel(id);
  }
  updateModel(id, updates) {
    const allowed = ["name", "type", "status", "parameters", "model_path", "ctx_size", "batch_size", "threads"];
    const set = [], vals = [];
    for (const [k, v] of Object.entries(updates)) {
      if (allowed.includes(k)) {
        set.push(`${k} = ?`);
        vals.push(k === "parameters" ? JSON.stringify(v) : v);
      }
    }
    if (set.length === 0) return null;
    vals.push(Math.floor(Date.now() / 1000), id);
    this.db.prepare(`UPDATE models SET ${set.join(", ")}, updated_at = ? WHERE id = ?`).run(...vals);
    return this.getModel(id);
  }
  deleteModel(id) { return this.db.prepare("DELETE FROM models WHERE id = ?").run(id).changes > 0; }

  // Metrics
  saveMetrics(m) {
    this.db.prepare("INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, active_models, uptime) VALUES (?, ?, ?, ?, ?)").run(
      m.cpu_usage || 0, m.memory_usage || 0, m.disk_usage || 0, m.active_models || 0, m.uptime || 0
    );
  }
  getMetricsHistory(limit = 100) {
    return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT ?").all(limit);
  }
  getLatestMetrics() { return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1").get(); }

  // Logs
  getLogs(limit = 100) { return this.db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?").all(limit); }
  addLog(level, msg, source = "server") {
    this.db.prepare("INSERT INTO logs (level, message, source) VALUES (?, ?, ?)").run(level, String(msg), source);
  }
  clearLogs() { return this.db.prepare("DELETE FROM logs").run().changes; }

  // Config
  getConfig() {
    const def = { serverPath: "/usr/local/bin/llama-server", host: "localhost", port: 8080,
      baseModelsPath: path.join(os.homedir(), "models"), ctx_size: 2048, batch_size: 512, threads: 4 };
    try {
      const saved = this.db.prepare("SELECT value FROM server_config WHERE key = ?").get("config")?.value;
      if (saved) return { ...def, ...JSON.parse(saved) };
    } catch (e) { console.error("Config load error:", e); }
    return def;
  }
  saveConfig(c) { this.db.prepare("INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)").run("config", JSON.stringify(c)); }

  // Metadata
  getMeta(k, def = null) {
    try { const r = this.db.prepare("SELECT value FROM metadata WHERE key = ?").get(k); if (r) return JSON.parse(r.value); } catch (e) {}
    return def;
  }
  setMeta(k, v) {
    this.db.prepare("INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)").run(k, JSON.stringify(v), Math.floor(Date.now() / 1000));
  }
}

// Simple Logger
class Logger {
  constructor() { this.io = null; }
  setIo(io) { this.io = io; }
  log(level, msg) {
    const ts = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${ts}] ${msg}`);
    if (this.io) this.io.emit("logs:entry", { entry: { level, message: String(msg), timestamp: Date.now() } });
  }
  info(msg) { this.log("info", msg); }
  error(msg) { this.log("error", msg); }
}
const logger = new Logger();

// Response helper
function ok(socket, event, data, reqId) {
  socket.emit(event, { success: true, data, requestId: reqId, timestamp: Date.now() });
}
function err(socket, event, message, reqId) {
  socket.emit(event, { success: false, error: { message }, requestId: reqId, timestamp: Date.now() });
}

// Socket handlers
function setupHandlers(io, db) {
  io.on("connection", (socket) => {
    const cid = socket.id;
    logger.info(`Client connected: ${cid}`);

    // Ack connection
    socket.on("connection:ack", () => {
      socket.emit("connection:established", { clientId: cid, timestamp: Date.now() });
    });

    // Models
    socket.on("models:list", (req) => {
      const id = req?.requestId || Date.now();
      try { ok(socket, "models:list:result", { models: db.getModels() }, id); } catch (e) { err(socket, "models:list:result", e.message, id); }
    });
    socket.on("models:get", (req) => {
      const id = req?.requestId || Date.now();
      try { const m = db.getModel(req?.modelId); m ? ok(socket, "models:get:result", { model: m }, id) : err(socket, "models:get:result", "Not found", id); } catch (e) { err(socket, "models:get:result", e.message, id); }
    });
    socket.on("models:create", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const m = db.saveModel(req?.model || {});
        io.emit("models:created", { model: m });
        ok(socket, "models:create:result", { model: m }, id);
      } catch (e) { err(socket, "models:create:result", e.message, id); }
    });
    socket.on("models:update", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const m = db.updateModel(req?.modelId, req?.updates || {});
        if (m) { io.emit("models:updated", { model: m }); ok(socket, "models:update:result", { model: m }, id); }
        else err(socket, "models:update:result", "Not found", id);
      } catch (e) { err(socket, "models:update:result", e.message, id); }
    });
    socket.on("models:delete", (req) => {
      const id = req?.requestId || Date.now();
      try {
        db.deleteModel(req?.modelId);
        io.emit("models:deleted", { modelId: req?.modelId });
        ok(socket, "models:delete:result", { deletedId: req?.modelId }, id);
      } catch (e) { err(socket, "models:delete:result", e.message, id); }
    });
    socket.on("models:start", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const m = db.updateModel(req?.modelId, { status: "running" });
        io.emit("models:status", { modelId: req?.modelId, status: "running", model: m });
        ok(socket, "models:start:result", { model: m }, id);
      } catch (e) { err(socket, "models:start:result", e.message, id); }
    });
    socket.on("models:stop", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const m = db.updateModel(req?.modelId, { status: "idle" });
        io.emit("models:status", { modelId: req?.modelId, status: "idle", model: m });
        ok(socket, "models:stop:result", { model: m }, id);
      } catch (e) { err(socket, "models:stop:result", e.message, id); }
    });

    // Metrics
    socket.on("metrics:get", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const m = db.getLatestMetrics() || {};
        ok(socket, "metrics:get:result", {
          metrics: { cpu: { usage: m.cpu_usage || 0 }, memory: { used: m.memory_usage || 0 }, disk: { used: m.disk_usage || 0 }, uptime: m.uptime || 0 }
        }, id);
      } catch (e) { err(socket, "metrics:get:result", e.message, id); }
    });
    socket.on("metrics:history", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const history = db.getMetricsHistory(req?.limit || 100).map(m => ({
          cpu: { usage: m.cpu_usage || 0 }, memory: { used: m.memory_usage || 0 }, disk: { used: m.disk_usage || 0 }, uptime: m.uptime || 0, timestamp: m.timestamp
        }));
        ok(socket, "metrics:history:result", { history }, id);
      } catch (e) { err(socket, "metrics:history:result", e.message, id); }
    });

    // Logs
    socket.on("logs:get", (req) => {
      const id = req?.requestId || Date.now();
      try { ok(socket, "logs:get:result", { logs: db.getLogs(req?.limit || 100) }, id); } catch (e) { err(socket, "logs:get:result", e.message, id); }
    });
    socket.on("logs:clear", (req) => {
      const id = req?.requestId || Date.now();
      try { ok(socket, "logs:clear:result", { cleared: db.clearLogs() }, id); } catch (e) { err(socket, "logs:clear:result", e.message, id); }
    });

    // Config
    socket.on("config:get", (req) => {
      const id = req?.requestId || Date.now();
      try { ok(socket, "config:get:result", { config: db.getConfig() }, id); } catch (e) { err(socket, "config:get:result", e.message, id); }
    });
    socket.on("config:update", (req) => {
      const id = req?.requestId || Date.now();
      try { db.saveConfig(req?.config || {}); ok(socket, "config:update:result", { config: req?.config }, id); } catch (e) { err(socket, "config:update:result", e.message, id); }
    });

    // Settings
    socket.on("settings:get", (req) => {
      const id = req?.requestId || Date.now();
      try { ok(socket, "settings:get:result", { settings: db.getMeta("user_settings") || {} }, id); } catch (e) { err(socket, "settings:get:result", e.message, id); }
    });
    socket.on("settings:update", (req) => {
      const id = req?.requestId || Date.now();
      try { db.setMeta("user_settings", req?.settings || {}); ok(socket, "settings:update:result", { settings: req?.settings }, id); } catch (e) { err(socket, "settings:update:result", e.message, id); }
    });

    // Llama status (placeholder)
    socket.on("llama:status", (req) => {
      const id = req?.requestId || Date.now();
      try { ok(socket, "llama:status:result", { status: { status: "idle", models: db.getModels() } }, id); } catch (e) { err(socket, "llama:status:result", e.message, id); }
    });
    socket.on("llama:start", (req) => {
      const id = req?.requestId || Date.now();
      io.emit("llama:status", { status: "running" });
      ok(socket, "llama:start:result", { success: true }, id);
    });
    socket.on("llama:stop", (req) => {
      const id = req?.requestId || Date.now();
      io.emit("llama:status", { status: "idle" });
      ok(socket, "llama:stop:result", { success: true }, id);
    });

    // Disconnect
    socket.on("disconnect", (reason) => { logger.info(`Client disconnected: ${cid}, ${reason}`); });
  });
}

// Metrics collection
function startMetrics(io, db) {
  setInterval(() => {
    try {
      const mem = process.memoryUsage();
      const cpu = os.cpus().reduce((acc, c) => acc + (c.times.user + c.times.nice + c.times.sys) / (c.times.idle + c.times.user + c.times.nice + c.times.sys), 0) / os.cpus().length * 100;
      const m = { cpu_usage: cpu, memory_usage: mem.heapUsed, disk_usage: 0, active_models: 0, uptime: process.uptime() };
      db.saveMetrics(m);
      io.emit("metrics:update", { metrics: { cpu: { usage: cpu }, memory: { used: mem.heapUsed }, disk: { used: 0 }, uptime: process.uptime() } });
    } catch (e) { logger.error("Metrics error: " + e.message); }
  }, 10000);
}

// Main
async function main() {
  const port = process.env.PORT || 3000;
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new DB();
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/llamaproxws",
    transports: ["websocket"]
  });

  logger.setIo(io);
  setupHandlers(io, db);
  startMetrics(io, db);

  app.use(express.static(path.join(__dirname, "public")));
  app.use("/socket.io", express.static(path.join(__dirname, "node_modules", "socket.io", "client-dist")));
  app.use((_req, res, next) => {
    if (_req.method === "GET" && !_req.path.startsWith("/socket.io") && !_req.path.startsWith("/llamaproxws")) {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    } else next();
  });

  server.listen(port, () => {
    console.log(`\n== Llama Async Proxy ==\n> http://localhost:${port}\n> Socket.IO: ws://localhost:${port}/llamaproxws\n`);
    logger.info("Server started");
  });

  const shutdown = (sig) => {
    console.log(`\n${sig} received, shutting down...`);
    server.close(() => { console.log("Server closed"); process.exit(0); });
    setTimeout(() => { console.error("Forced shutdown"); process.exit(1); }, 10000);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch(e => { console.error("Failed:", e); process.exit(1); });
