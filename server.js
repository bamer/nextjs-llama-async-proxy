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
        file_size INTEGER,
        params TEXT,
        quantization TEXT,
        ctx_size INTEGER DEFAULT 4096,
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
    this.db.prepare(`INSERT OR REPLACE INTO models (id, name, type, status, parameters, model_path, file_size, params, quantization, ctx_size, batch_size, threads, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, model.name, model.type || "llama", model.status || "idle",
      JSON.stringify(model.parameters || {}), model.model_path || model.path || null,
      model.file_size || null, model.params || null, model.quantization || null,
      model.ctx_size || 4096, model.batch_size || 512, model.threads || 4,
      model.created_at || now, now
    );
    return this.getModel(id);
  }
  updateModel(id, updates) {
    const allowed = ["name", "type", "status", "parameters", "model_path", "file_size", "params", "quantization", "ctx_size", "batch_size", "threads"];
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
    try { const r = this.db.prepare("SELECT value FROM metadata WHERE key = ?").get(k); if (r) return JSON.parse(r.value); } catch {
      // Silently ignore JSON parse errors
    }
    return def;
  }
  setMeta(k, v) {
    // Handle null/undefined by storing as empty object instead of null string
    const valueToStore = v === null || v === undefined ? "{}" : JSON.stringify(v);
    this.db.prepare("INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)").run(k, valueToStore, Math.floor(Date.now() / 1000));
  }
}

// GGUF Metadata Parser using @huggingface/gguf
import { gguf } from "@huggingface/gguf";

// Map file_type integer to quantization string
const fileTypeMap = {
  0: "F32", 1: "F16", 2: "Q4_0", 3: "Q4_1", 6: "Q5_0", 7: "Q5_1",
  8: "Q8_0", 9: "Q8_1", 10: "Q2_K", 11: "Q3_K_S", 12: "Q3_K_M",
  13: "Q3_K_L", 14: "Q4_K_S", 15: "Q4_K_M", 16: "Q5_K_S", 17: "Q5_K_M",
  18: "Q6_K", 19: "Q8_K",
};

async function parseGgufMetadata(filePath) {
  const metadata = {
    size: 0,
    architecture: "",
    params: "",
    quantization: "",
    ctxSize: 0,
    embeddingLength: 0,
    blockCount: 0,
  };

  try {
    const stats = fs.statSync(filePath);
    metadata.size = stats.size;

    // Read metadata from GGUF file
    const { metadata: ggufMeta, tensorInfos } = await gguf(filePath, { allowLocalFile: true });

    // Extract key metadata
    metadata.architecture = ggufMeta["general.architecture"] || "";
    metadata.params = ggufMeta["general.size_label"] || "";
    metadata.ctxSize = ggufMeta[metadata.architecture]?.context_length || 4096;
    metadata.embeddingLength = ggufMeta[metadata.architecture]?.embedding_length || 0;
    metadata.blockCount = ggufMeta[metadata.architecture]?.block_count || 0;

    // Map file_type to quantization
    const fileType = ggufMeta["general.file_type"];
    if (fileType !== undefined && fileTypeMap[fileType]) {
      metadata.quantization = fileTypeMap[fileType];
    }

    console.log("[DEBUG] GGUF metadata extracted:", {
      name: ggufMeta["general.name"],
      architecture: metadata.architecture,
      params: metadata.params,
      quantization: metadata.quantization,
      ctxSize: metadata.ctxSize,
      totalTensors: tensorInfos.length,
    });

  } catch (e) {
    console.warn("[DEBUG] Failed to parse GGUF metadata:", e.message);
    // Fallback: try regex-based parsing from filename
    try {
      const fileName = path.basename(filePath);
      metadata.architecture = extractArchitecture(fileName);
      metadata.params = extractParams(fileName);
      metadata.quantization = extractQuantization(fileName);
      const ctxMatch = fileName.match(/(\d+)k?ctx/i) || fileName.match(/ctx[-_]?(\d+)/i);
      if (ctxMatch) metadata.ctxSize = parseInt(ctxMatch[1]) * 1000;
    } catch (fallbackErr) {
      console.warn("[DEBUG] Fallback parsing also failed:", fallbackErr.message);
    }
  }

  return metadata;
}

// Fallback: regex-based filename parsing (for non-GGUF files)
function extractArchitecture(filename) {
  const lower = filename.toLowerCase();
  const patterns = [
    { regex: /(deepseek[-_]?r1)/i, name: "DeepSeek-R1" },
    { regex: /(deepseek[-_]?coder)/i, name: "DeepSeek-Coder" },
    { regex: /(deepseek)/i, name: "DeepSeek" },
    { regex: /(codellama)/i, name: "CodeLlama" },
    { regex: /(codegemma)/i, name: "CodeGemma" },
    { regex: /(mistral[-_]?moe)/i, name: "Mistral-MOE" },
    { regex: /(mistral)/i, name: "Mistral" },
    { regex: /(qwen[0-9]?)/i, name: "Qwen" },
    { regex: /(llama[0-9]?)/i, name: "Llama" },
    { regex: /(gemma[0-9]?)/i, name: "Gemma" },
    { regex: /(nemotron)/i, name: "Nemotron" },
    { regex: /(granite)/i, name: "Granite" },
    { regex: /(phi[0-9]?)/i, name: "Phi" },
    { regex: /(starcoder)/i, name: "StarCoder" },
    { regex: /(solar)/i, name: "Solar" },
    { regex: /(command[_-]?r)/i, name: "Command-R" },
    { regex: /(devstral)/i, name: "Devstral" },
    { regex: /(dbrx)/i, name: "DBRX" },
    { regex: /(mixtral)/i, name: "Mixtral" },
    { regex: /(yi[-_]?34b)/i, name: "Yi" },
    { regex: /(orca[0-9]?)/i, name: "Orca" },
    { regex: /(gpt-oss)/i, name: "GPT-OSS" },
    { regex: /(WizardCoder)/i, name: "WizardCoder" },
  ];

  for (const p of patterns) {
    if (p.regex.test(lower)) return p.name;
  }

  return "LLM";
}

function extractParams(filename) {
  const match = filename.match(/(\d+(?:\.\d+)?)[bB](?=[-._\s]|$)/);
  if (match) return `${match[1]  }B`;
  const lower = filename.toLowerCase();
  if (/phi[-_]?3/i.test(lower)) return "3B";
  if (/yi[-_]?34b/i.test(lower)) return "34B";
  if (/dbrx/i.test(lower)) return "132B";
  if (/nemotron[-_]?8b/i.test(lower)) return "8B";
  if (/nemotron[-_]?5b/i.test(lower)) return "5B";
  if (/mixtral[-_]?8x/i.test(lower)) return "12B";
  return "";
}

function extractQuantization(filename) {
  const endMatch = filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/i);
  if (endMatch) return endMatch[1].toUpperCase();

  const iqEndMatch = filename.match(/[-_](IQ[0-9]+(?:_[A-Za-z0-9]+)?[A-Za-z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/);
  if (iqEndMatch) return iqEndMatch[1].toUpperCase();

  const directMatch = filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)\.gguf/i) ||
                      filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)\.bin/i);
  if (directMatch) return directMatch[1].toUpperCase();

  const endOfStringMatch = filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)$/i);
  if (endOfStringMatch) return endOfStringMatch[1].toUpperCase();

  return "";
}

// Utility function for formatting bytes (not currently used but kept for reference)
// function formatBytesDb(bytes) {
//   if (bytes === 0) return "0 B";
//   const k = 1024;
//   const sizes = ["B", "KB", "MB", "GB", "TB"];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
// }

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
      console.log("[DEBUG] models:list request", { requestId: id });
      try {
        const models = db.getModels();
        console.log("[DEBUG] models:list result:", models.length, "models");
        ok(socket, "models:list:result", { models }, id);
      } catch (e) {
        console.error("[DEBUG] models:list error:", e.message);
        err(socket, "models:list:result", e.message, id);
      }
    });
    socket.on("models:get", (req) => {
      const id = req?.requestId || Date.now();
      try { const m = db.getModel(req?.modelId); m ? ok(socket, "models:get:result", { model: m }, id) : err(socket, "models:get:result", "Not found", id); } catch (e) { err(socket, "models:get:result", e.message, id); }
    });
    socket.on("models:create", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] models:create request", { requestId: id, model: req?.model });
      try {
        const m = db.saveModel(req?.model || {});
        console.log("[DEBUG] model created:", m.id, m.name);
        io.emit("models:created", { model: m });
        ok(socket, "models:create:result", { model: m }, id);
      } catch (e) {
        console.error("[DEBUG] models:create error:", e.message);
        err(socket, "models:create:result", e.message, id);
      }
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
      console.log("[DEBUG] models:start request", { requestId: id, modelId: req?.modelId });
      try {
        const m = db.updateModel(req?.modelId, { status: "running" });
        console.log("[DEBUG] model started:", req?.modelId, m ? "success" : "not found");
        io.emit("models:status", { modelId: req?.modelId, status: "running", model: m });
        ok(socket, "models:start:result", { model: m }, id);
      } catch (e) {
        console.error("[DEBUG] models:start error:", e.message);
        err(socket, "models:start:result", e.message, id);
      }
    });
    socket.on("models:stop", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] models:stop request", { requestId: id, modelId: req?.modelId });
      try {
        const m = db.updateModel(req?.modelId, { status: "idle" });
        console.log("[DEBUG] model stopped:", req?.modelId, m ? "success" : "not found");
        io.emit("models:status", { modelId: req?.modelId, status: "idle", model: m });
        ok(socket, "models:stop:result", { model: m }, id);
      } catch (e) {
        console.error("[DEBUG] models:stop error:", e.message);
        err(socket, "models:stop:result", e.message, id);
      }
    });
    socket.on("models:scan", async (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] models:scan request received", { requestId: id });
      try {
        const config = db.getConfig();
        const modelsDir = config.baseModelsPath || path.join(os.homedir(), "models");
        console.log("[DEBUG] === SCAN DEBUG ===");
        console.log("[DEBUG] Config baseModelsPath:", config.baseModelsPath);
        console.log("[DEBUG] Resolved modelsDir:", modelsDir);
        console.log("[DEBUG] Current DB models count:", db.getModels().length);
        const exts = [".gguf", ".bin", ".safetensors", ".pt", ".pth"];
        let scanned = 0;
        let existingCount = 0;
        const dirExists = fs.existsSync(modelsDir);
        console.log("[DEBUG] Directory exists:", dirExists);
        if (dirExists) {
          const findModelFiles = (dir) => {
            const results = [];
            try {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                  results.push(...findModelFiles(fullPath));
                } else if (entry.isFile() && exts.some(e => entry.name.toLowerCase().endsWith(e))) {
                  results.push(fullPath);
                }
              }
            } catch (e) {
              console.warn("[DEBUG] Cannot read directory:", dir, e.message);
            }
            return results;
          };

          const modelFiles = findModelFiles(modelsDir);
          console.log("[DEBUG] Found model files:", modelFiles.length);
          const existingModels = db.getModels();

          for (const fullPath of modelFiles) {
            const fileName = path.basename(fullPath);
            const existing = existingModels.find(m => m.model_path === fullPath);
            if (!existing) {
              console.log("[DEBUG] Adding NEW model:", fileName);
              // Use async GGUF parser
              const meta = await parseGgufMetadata(fullPath);
              console.log("[DEBUG] Model metadata:", meta);
              db.saveModel({
                name: fileName.replace(/\.[^/.]+$/, ""),
                type: meta.architecture || "llama",
                status: "idle",
                model_path: fullPath,
                file_size: meta.size,
                params: meta.params,
                quantization: meta.quantization,
                ctx_size: meta.ctxSize || 4096
              });
              scanned++;
            } else {
              existingCount++;
            }
          }
        } else {
          console.log("[DEBUG] ERROR: Directory does not exist!");
        }
        const allModels = db.getModels();
        console.log("[DEBUG] Scan complete:", { new: scanned, existing: existingCount, total: allModels.length });
        console.log("[DEBUG] === END SCAN DEBUG ===");
        io.emit("models:scanned", { scanned, total: allModels.length });
        ok(socket, "models:scan:result", { scanned, models: allModels }, id);
      } catch (e) {
        console.error("[DEBUG] Scan error:", e.message, e.stack);
        err(socket, "models:scan:result", e.message, id);
      }
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
      console.log("[DEBUG] config:get request", { requestId: id });
      try {
        const config = db.getConfig();
        console.log("[DEBUG] config:get result:", `${JSON.stringify(config).substring(0, 100)  }...`);
        ok(socket, "config:get:result", { config }, id);
      } catch (e) {
        console.error("[DEBUG] config:get error:", e.message);
        err(socket, "config:get:result", e.message, id);
      }
    });
    socket.on("config:update", (req) => {
      const id = req?.requestId || Date.now();
      const configStr = JSON.stringify(req?.config || {});
      console.log("[DEBUG] config:update request", { requestId: id, config: configStr.substring(0, 200) });
      try {
        db.saveConfig(req?.config || {});
        const savedConfig = db.getConfig();
        console.log("[DEBUG] config:update saved, current config:", JSON.stringify(savedConfig).substring(0, 200));
        ok(socket, "config:update:result", { config: req?.config }, id);
      } catch (e) {
        console.error("[DEBUG] config:update error:", e.message);
        err(socket, "config:update:result", e.message, id);
      }
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
    } catch (e) { logger.error(`Metrics error: ${  e.message}`); }
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
