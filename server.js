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
        embedding_size INTEGER DEFAULT 0,
        block_count INTEGER DEFAULT 0,
        head_count INTEGER DEFAULT 0,
        head_count_kv INTEGER DEFAULT 0,
        ffn_dim INTEGER DEFAULT 0,
        file_type INTEGER DEFAULT 0,
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
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER
      );
    `);

    // Migration: Add missing columns to existing models table
    this._migrateModelsTable();
  }

  _migrateModelsTable() {
    try {
      // Check if column exists
      const columns = this.db.prepare("PRAGMA table_info(models)").all();
      const columnNames = columns.map(c => c.name);

      const migrations = [
        { name: "embedding_size", type: "INTEGER DEFAULT 0" },
        { name: "block_count", type: "INTEGER DEFAULT 0" },
        { name: "head_count", type: "INTEGER DEFAULT 0" },
        { name: "head_count_kv", type: "INTEGER DEFAULT 0" },
        { name: "ffn_dim", type: "INTEGER DEFAULT 0" },
        { name: "file_type", type: "INTEGER DEFAULT 0" },
      ];

      for (const mig of migrations) {
        if (!columnNames.includes(mig.name)) {
          console.log(`[MIGRATION] Adding column: ${mig.name}`);
          this.db.exec(`ALTER TABLE models ADD COLUMN ${mig.name} ${mig.type}`);
        }
      }
    } catch (e) {
      console.warn("[MIGRATION] Failed:", e.message);
    }
  }

  // Models
  getModels() {
    return this.db.prepare("SELECT * FROM models ORDER BY created_at DESC").all();
  }
  getModel(id) {
    return this.db.prepare("SELECT * FROM models WHERE id = ?").get(id);
  }
  saveModel(model) {
    const id = model.id || `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    // Columns in same order as table schema
    const query = `INSERT OR REPLACE INTO models (id, name, type, status,
      parameters, model_path, file_size, params, quantization, ctx_size,
      batch_size, threads, created_at, updated_at,
      embedding_size, block_count, head_count, head_count_kv, ffn_dim, file_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    // Helper to handle array values
    const getValue = (val, defaultVal = 0) => {
      if (Array.isArray(val)) return val[0] || defaultVal;
      if (val === undefined || val === null) return defaultVal;
      return val;
    };

    this.db
      .prepare(query)
      .run(
        id,
        model.name,
        model.type || "llama",
        model.status || "idle",
        JSON.stringify(model.parameters || {}),
        model.model_path || model.path || null,
        model.file_size || null,
        model.params || null,
        model.quantization || null,
        model.ctx_size || 4096,
        model.batch_size || 512,
        model.threads || 4,
        model.created_at || now,
        now,
        model.embedding_size || 0,
        model.block_count || 0,
        model.head_count || 0,
        model.head_count_kv || 0,
        model.ffn_dim || 0,
        model.file_type || 0
      );
    return this.getModel(id);
  }
  updateModel(id, updates) {
    // Columns in table schema order
    const allowed = [
      "name",
      "type",
      "status",
      "parameters",
      "model_path",
      "file_size",
      "params",
      "quantization",
      "ctx_size",
      "batch_size",
      "threads",
      "embedding_size",
      "block_count",
      "head_count",
      "head_count_kv",
      "ffn_dim",
      "file_type",
    ];
    const set = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      if (allowed.includes(k)) {
        set.push(`${k} = ?`);
        // Handle array values (store as JSON string)
        if (Array.isArray(v)) {
          vals.push(JSON.stringify(v));
        } else if (k === "parameters") {
          vals.push(JSON.stringify(v));
        } else {
          vals.push(v);
        }
      }
    }
    if (set.length === 0) return null;
    vals.push(Math.floor(Date.now() / 1000), id);
    const query = `UPDATE models SET ${set.join(", ")}, updated_at = ? WHERE id = ?`;
    this.db.prepare(query).run(...vals);
    return this.getModel(id);
  }
  deleteModel(id) {
    return this.db.prepare("DELETE FROM models WHERE id = ?").run(id).changes > 0;
  }
  
  // Delete models whose files no longer exist
  cleanupMissingFiles() {
    const models = this.getModels();
    let deleted = 0;
    for (const m of models) {
      if (m.model_path && !fs.existsSync(m.model_path)) {
        console.log("[DEBUG] Removing missing model:", m.name);
        this.deleteModel(m.id);
        deleted++;
      }
    }
    console.log("[DEBUG] Cleaned up", deleted, "missing models");
    return deleted;
  }

  // Metrics
  saveMetrics(m) {
    const query = `INSERT INTO metrics (cpu_usage, memory_usage,
      disk_usage, active_models, uptime) VALUES (?, ?, ?, ?, ?)`;
    this.db
      .prepare(query)
      .run(
        m.cpu_usage || 0,
        m.memory_usage || 0,
        m.disk_usage || 0,
        m.active_models || 0,
        m.uptime || 0
      );
  }
  getMetricsHistory(limit = 100) {
    return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT ?").all(limit);
  }
  getLatestMetrics() {
    return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1").get();
  }

  // Logs
  getLogs(limit = 100) {
    return this.db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?").all(limit);
  }
  addLog(level, msg, source = "server") {
    const query = "INSERT INTO logs (level, message, source) VALUES (?, ?, ?)";
    this.db.prepare(query).run(level, String(msg), source);
  }
  clearLogs() {
    return this.db.prepare("DELETE FROM logs").run().changes;
  }

  // Config
  getConfig() {
    const def = {
      serverPath: "/usr/local/bin/llama-server",
      host: "localhost",
      port: 8080,
      baseModelsPath: path.join(os.homedir(), "models"),
      ctx_size: 2048,
      batch_size: 512,
      threads: 4,
    };
    try {
      const saved = this.db
        .prepare("SELECT value FROM server_config WHERE key = ?")
        .get("config")?.value;
      if (saved) return { ...def, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Config load error:", e);
    }
    return def;
  }
  saveConfig(c) {
    const query = "INSERT OR REPLACE INTO server_config (key, value) VALUES (?, ?)";
    this.db.prepare(query).run("config", JSON.stringify(c));
  }

  // Metadata
  getMeta(k, def = null) {
    try {
      const r = this.db.prepare("SELECT value FROM metadata WHERE key = ?").get(k);
      if (r) return JSON.parse(r.value);
    } catch {
      // Silently ignore JSON parse errors
    }
    return def;
  }
  setMeta(k, v) {
    // Handle null/undefined by storing as empty object instead of null string
    const valueToStore = v === null || v === undefined ? "{}" : JSON.stringify(v);
    const query = "INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)";
    this.db.prepare(query).run(k, valueToStore, Math.floor(Date.now() / 1000));
  }
}

// GGUF Metadata Parser using @huggingface/gguf
import { gguf, ggufAllShards } from "@huggingface/gguf";

// Simple GGUF parser that doesn't depend on the buggy library
function parseGgufHeaderSync(filePath) {
  const metadata = {
    architecture: "",
    params: "",
    ctxSize: 4096,
    embeddingLength: 0,
    blockCount: 0,
    headCount: 0,
    headCountKv: 0,
    ffnDim: 0,
    fileType: 0,
  };

  try {
    const fd = fs.openSync(filePath, "r");
    
    // Read header (24 bytes)
    const headerBuf = Buffer.alloc(24);
    fs.readSync(fd, headerBuf, 0, 24, 0);
    const headerView = new DataView(headerBuf.buffer, headerBuf.byteOffset, headerBuf.byteLength);
    
    // Check magic number (GGUF = 0x46554747)
    const magic = headerView.getUint32(0, true);
    if (magic !== 0x46554747) {
      fs.closeSync(fd);
      return null; // Not a GGUF file
    }
    
    const version = headerView.getUint32(4, true);
    const tensorCount = Number(headerView.getBigUint64(8, true));
    const metadataCount = Number(headerView.getBigUint64(16, true));
    
    // Read metadata
    let offset = 24;
    const ggufMeta = {};
    
    for (let i = 0; i < metadataCount; i++) {
      // Key length (uint64)
      const lenBuf = Buffer.alloc(8);
      fs.readSync(fd, lenBuf, 0, 8, offset);
      const keyLen = Number(new DataView(lenBuf.buffer).getBigUint64(0, true));
      offset += 8;
      
      // Key string (including null terminator)
      const keyBuf = Buffer.alloc(keyLen);
      fs.readSync(fd, keyBuf, 0, keyLen, offset);
      const key = keyBuf.toString("utf8", 0, keyLen - 1);
      offset += keyLen;
      
      // Value type (uint32)
      const typeBuf = Buffer.alloc(4);
      fs.readSync(fd, typeBuf, 0, 4, offset);
      const type = new DataView(typeBuf.buffer).getUint32(0, true);
      offset += 4;
      
      // Value based on type
      if (type === 0) { // uint32
        const valBuf = Buffer.alloc(4);
        fs.readSync(fd, valBuf, 0, 4, offset);
        ggufMeta[key] = new DataView(valBuf.buffer).getUint32(0, true);
        offset += 4;
      } else if (type === 8) { // string
        const strLenBuf = Buffer.alloc(8);
        fs.readSync(fd, strLenBuf, 0, 8, offset);
        const strLen = Number(new DataView(strLenBuf.buffer).getBigUint64(0, true));
        offset += 8;
        const strBuf = Buffer.alloc(strLen);
        fs.readSync(fd, strBuf, 0, strLen, offset);
        ggufMeta[key] = strBuf.toString("utf8", 0, strLen - 1);
        offset += strLen;
      } else if (type === 4) { // float32
        const valBuf = Buffer.alloc(4);
        fs.readSync(fd, valBuf, 0, 4, offset);
        ggufMeta[key] = new DataView(valBuf.buffer).getFloat32(0, true);
        offset += 4;
      } else {
        // Skip unknown types
        ggufMeta[key] = `<type:${type}>`;
      }
    }
    
    fs.closeSync(fd);
    
    // Extract key metadata
    metadata.architecture = ggufMeta["general.architecture"] || "";
    metadata.params = ggufMeta["general.size_label"] || "";
    const arch = metadata.architecture;
    
    // Access metadata using flat key format with architecture prefix
    const getMetaValue = (key, defaultVal = 0) => {
      const val = ggufMeta[key];
      if (Array.isArray(val)) return val[0] || defaultVal;
      if (val === undefined || val === null) return defaultVal;
      return val;
    };
    
    metadata.ctxSize = getMetaValue(`${arch}.context_length`, 4096);
    metadata.embeddingLength = getMetaValue(`${arch}.embedding_length`, 0);
    metadata.blockCount = getMetaValue(`${arch}.block_count`, 0);
    metadata.headCount = getMetaValue(`${arch}.attention.head_count`, 0);
    metadata.headCountKv = getMetaValue(`${arch}.attention.head_count_kv`, 0);
    metadata.ffnDim = getMetaValue(`${arch}.feed_forward_length`, 0);
    metadata.fileType = ggufMeta["general.file_type"] || 0;
    
    return metadata;
  } catch (e) {
    return null;
  }
}

// Map file_type integer to quantization string
const fileTypeMap = {
  0: "F32",
  1: "F16",
  2: "Q4_0",
  3: "Q4_1",
  6: "Q5_0",
  7: "Q5_1",
  8: "Q8_0",
  9: "Q8_1",
  10: "Q2_K",
  11: "Q3_K_S",
  12: "Q3_K_M",
  13: "Q3_K_L",
  14: "Q4_K_S",
  15: "Q4_K_M",
  16: "Q5_K_S",
  17: "Q5_K_M",
  18: "Q6_K",
  19: "Q8_K",
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
    headCount: 0,
    headCountKv: 0,
    ffnDim: 0,
    fileType: 0,
  };

  try {
    const stats = fs.statSync(filePath);
    metadata.size = stats.size;

    // Try our simple synchronous parser first (handles all cases)
    const simpleResult = parseGgufHeaderSync(filePath);
    
    if (simpleResult && simpleResult.architecture) {
      // Successfully parsed with simple parser
      Object.assign(metadata, simpleResult);
      
      // Map file_type to quantization
      if (metadata.fileType !== undefined && fileTypeMap[metadata.fileType]) {
        metadata.quantization = fileTypeMap[metadata.fileType];
      }
      
      console.log("[DEBUG] Used simple GGUF parser for:", path.basename(filePath));
      console.log("[DEBUG] GGUF metadata extracted:", {
        architecture: metadata.architecture,
        params: metadata.params,
        ctxSize: metadata.ctxSize,
        blockCount: metadata.blockCount,
        headCount: metadata.headCount,
      });
      
      return metadata;
    }
    
    // Fallback to @huggingface/gguf library for advanced features
    console.log("[DEBUG] Simple parser failed or no architecture, trying @huggingface/gguf for:", path.basename(filePath));
    
    let ggufMeta = {};
    let tensorInfos = [];

    try {
      const info = await gguf(filePath, { allowLocalFile: true });
      if (info.metadata && Object.keys(info.metadata).length > 0) {
        ggufMeta = info.metadata;
        tensorInfos = info.tensorInfos || [];
        console.log("[DEBUG] Used gguf() for:", path.basename(filePath));
      } else {
        throw new Error("Empty metadata from gguf()");
      }
    } catch (ggufErr) {
      console.log("[DEBUG] gguf() failed, trying ggufAllShards() for:", path.basename(filePath), ggufErr.message);
      try {
        const allShardsInfo = await ggufAllShards(filePath, { allowLocalFile: true });
        if (allShardsInfo.shards && allShardsInfo.shards.length > 0) {
          const firstShard = allShardsInfo.shards[0];
          ggufMeta = firstShard.metadata || {};
          tensorInfos = firstShard.tensorInfos || [];
          console.log("[DEBUG] Used ggufAllShards() for:", path.basename(filePath));
        } else {
          throw new Error("No shards found");
        }
      } catch (shardsErr) {
        // Both failed, use regex fallback
        console.log("[DEBUG] Both gguf() and ggufAllShards() failed, using filename fallback for:", path.basename(filePath));
        const fileName = path.basename(filePath);
        metadata.architecture = extractArchitecture(fileName);
        metadata.params = extractParams(fileName);
        metadata.quantization = extractQuantization(fileName);
        const ctxMatch = fileName.match(/(\d+)k?ctx/i) || fileName.match(/ctx[-_]?(\d+)/i);
        if (ctxMatch) metadata.ctxSize = parseInt(ctxMatch[1]) * 1000;
        return metadata;
      }
    }

    // Extract key metadata - GGUF stores keys with architecture prefix as flat keys
    // e.g., "llama.block_count", "llama.context_length", not nested objects
    metadata.architecture = ggufMeta["general.architecture"] || "";
    metadata.params = ggufMeta["general.size_label"] || "";
    const arch = metadata.architecture;

    // Access metadata using flat key format with architecture prefix
    // Handle array values (convert to first element or JSON string)
    const getMetaValue = (key, defaultVal = 0) => {
      const val = ggufMeta[key];
      if (Array.isArray(val)) return val[0] || defaultVal; // Take first element for arrays
      if (val === undefined || val === null) return defaultVal;
      return val;
    };
    metadata.ctxSize = getMetaValue(`${arch}.context_length`, 4096);
    metadata.embeddingLength = getMetaValue(`${arch}.embedding_length`, 0);
    metadata.blockCount = getMetaValue(`${arch}.block_count`, 0);
    metadata.headCount = getMetaValue(`${arch}.attention.head_count`, 0);
    metadata.headCountKv = getMetaValue(`${arch}.attention.head_count_kv`, 0);
    metadata.ffnDim = getMetaValue(`${arch}.feed_forward_length`, 0);
    metadata.fileType = ggufMeta["general.file_type"] || 0;

    // Map file_type to quantization
    if (metadata.fileType !== undefined && fileTypeMap[metadata.fileType]) {
      metadata.quantization = fileTypeMap[metadata.fileType];
    }

    console.log("[DEBUG] GGUF metadata extracted:", {
      name: ggufMeta["general.name"],
      architecture: metadata.architecture,
      params: metadata.params,
      quantization: metadata.quantization,
      ctxSize: metadata.ctxSize,
      embeddingLength: metadata.embeddingLength,
      blockCount: metadata.blockCount,
      headCount: metadata.headCount,
      headCountKv: metadata.headCountKv,
      ffnDim: metadata.ffnDim,
      totalTensors: tensorInfos?.length || 0,
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
  if (match) return `${match[1]}B`;
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
  const endMatch = filename.match(
    /[-_](Q[0-9]+[_A-Z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/i
  );
  if (endMatch) return endMatch[1].toUpperCase();

  const iqEndMatch = filename.match(
    /[-_](IQ[0-9]+(?:_[A-Za-z0-9]+)?[A-Za-z0-9]*)(?=\.(?:gguf|bin|safetensors|pt|pth)|$)/
  );
  if (iqEndMatch) return iqEndMatch[1].toUpperCase();

  const directMatch =
    filename.match(/[-_](Q[0-9]+[_A-Z0-9]*)\.gguf/i) ||
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
  constructor() {
    this.io = null;
  }
  setIo(io) {
    this.io = io;
  }
  log(level, msg) {
    const ts = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${ts}] ${msg}`);
    if (this.io)
      this.io.emit("logs:entry", { entry: { level, message: String(msg), timestamp: Date.now() } });
  }
  info(msg) {
    this.log("info", msg);
  }
  error(msg) {
    this.log("error", msg);
  }
}
const logger = new Logger();

// Response helper
function ok(socket, event, data, reqId) {
  socket.emit(event, { success: true, data, requestId: reqId, timestamp: Date.now() });
}
function err(socket, event, message, reqId) {
  socket.emit(event, {
    success: false,
    error: { message },
    requestId: reqId,
    timestamp: Date.now(),
  });
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
      try {
        const m = db.getModel(req?.modelId);
        m
          ? ok(socket, "models:get:result", { model: m }, id)
          : err(socket, "models:get:result", "Not found", id);
      } catch (e) {
        err(socket, "models:get:result", e.message, id);
      }
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
        if (m) {
          io.emit("models:updated", { model: m });
          ok(socket, "models:update:result", { model: m }, id);
        } else err(socket, "models:update:result", "Not found", id);
      } catch (e) {
        err(socket, "models:update:result", e.message, id);
      }
    });
    socket.on("models:delete", (req) => {
      const id = req?.requestId || Date.now();
      try {
        db.deleteModel(req?.modelId);
        io.emit("models:deleted", { modelId: req?.modelId });
        ok(socket, "models:delete:result", { deletedId: req?.modelId }, id);
      } catch (e) {
        err(socket, "models:delete:result", e.message, id);
      }
    });
    socket.on("models:cleanup", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] models:cleanup request received", { requestId: id });
      try {
        const deletedCount = db.cleanupMissingFiles();
        console.log("[DEBUG] Cleanup complete:", deletedCount, "models removed");
        ok(socket, "models:cleanup:result", { deletedCount }, id);
      } catch (e) {
        console.error("[DEBUG] models:cleanup error:", e.message);
        err(socket, "models:cleanup:result", e.message, id);
      }
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
        const modelsDir = config.baseModelsPath;
        console.log("[DEBUG] === SCAN START ===");
        console.log("[DEBUG] requestId:", id);
        console.log("[DEBUG] baseModelsPath:", modelsDir);
        const dirExists = fs.existsSync(modelsDir);
        console.log("[DEBUG] dirExists:", dirExists);

        // Scan can take a while with many models - no timeout
        // const timeoutMs = 90000;
        // const timeoutPromise = new Promise((_, reject) => {
        //   setTimeout(() => reject(new Error("Scan timeout")), timeoutMs);
        // });

        let scanned = 0;
        let updated = 0;
        let existingCount = 0;
        let scanError = null;

        if (dirExists) {
          console.log("[DEBUG] Starting file search...");
          const exts = [".gguf", ".bin", ".safetensors", ".pt", ".pth"];
          
          // Patterns to exclude (non-model files)
          const excludePatterns = [
            /mmproj/i,           // Multimodal projector files
            /-proj$/i,           // Projector files ending with -proj
            /\.factory$/i,       // Factory config files
            /^\_/i,              // Files starting with underscore
          ];

          const isValidModelFile = (fileName, fullPath) => {
            // Check exclude patterns
            if (excludePatterns.some(p => p.test(fileName))) {
              console.log("[DEBUG] Excluding:", fileName);
              return false;
            }
            
            // For .gguf files, verify they have valid GGUF magic bytes
            if (fileName.toLowerCase().endsWith(".gguf")) {
              try {
                const fd = fs.openSync(fullPath, "r");
                const magicBuf = Buffer.alloc(4);
                fs.readSync(fd, magicBuf, 0, 4, 0);
                fs.closeSync(fd);
                const magic = new DataView(magicBuf.buffer).getUint32(0, true);
                if (magic !== 0x46554747) { // GGUF magic
                  console.log("[DEBUG] Excluding non-GGUF file:", fileName);
                  return false;
                }
              } catch (e) {
                return false;
              }
            }
            
            return true;
          };

          const findModelFiles = (dir) => {
            const results = [];
            try {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                  results.push(...findModelFiles(fullPath));
                } else if (
                  entry.isFile() &&
                  exts.some((e) => entry.name.toLowerCase().endsWith(e)) &&
                  isValidModelFile(entry.name, fullPath)
                ) {
                  results.push(fullPath);
                }
              }
            } catch (e) {
              console.warn("[DEBUG] Cannot read directory:", dir, e.message);
            }
            return results;
          };

          const scanPromise = (async () => {
            const modelFiles = findModelFiles(modelsDir);
            console.log("[DEBUG] Found", modelFiles.length, "model files");
            const existingModels = db.getModels();

            for (const fullPath of modelFiles) {
              try {
                const fileName = path.basename(fullPath);
                const existing = existingModels.find((m) => m.model_path === fullPath);
                if (!existing) {
                  console.log("[DEBUG] Adding NEW model:", fileName);
                  const meta = await parseGgufMetadata(fullPath);
                  db.saveModel({
                    name: fileName.replace(/\.[^/.]+$/, ""),
                    type: meta.architecture || "llama",
                    status: "idle",
                    model_path: fullPath,
                    file_size: meta.size,
                    params: meta.params,
                    quantization: meta.quantization,
                    ctx_size: meta.ctxSize || 4096,
                    embedding_size: meta.embeddingLength || 0,
                    block_count: meta.blockCount || 0,
                    head_count: meta.headCount || 0,
                    head_count_kv: meta.headCountKv || 0,
                    ffn_dim: meta.ffnDim || 0,
                    file_type: meta.fileType || 0,
                  });
                  scanned++;
                } else {
                  const meta = await parseGgufMetadata(fullPath);
                  const needsBasicUpdate = !existing.params || !existing.quantization || !existing.file_size;
                  const needsGgufUpdate = !existing.ctx_size || !existing.block_count || existing.ctx_size === 4096;
                  if (needsBasicUpdate || needsGgufUpdate) {
                    db.updateModel(existing.id, {
                      file_size: meta.size || existing.file_size,
                      params: meta.params || existing.params,
                      quantization: meta.quantization || existing.quantization,
                      type: meta.architecture || existing.type,
                      ctx_size: meta.ctxSize || existing.ctx_size,
                      embedding_size: meta.embeddingLength || existing.embedding_size,
                      block_count: meta.blockCount || existing.block_count,
                      head_count: meta.headCount || existing.head_count,
                      head_count_kv: meta.headCountKv || existing.head_count_kv,
                      ffn_dim: meta.ffnDim || existing.ffn_dim,
                      file_type: meta.fileType || existing.file_type,
                    });
                    updated++;
                  }
                  existingCount++;
                }
              } catch (fileError) {
                console.warn("[DEBUG] Error processing file", fullPath, ":", fileError.message);
              }
            }
          })();

          // Wait for scan to complete (no timeout)
          await scanPromise;
        } else {
          console.log("[DEBUG] Directory does not exist:", modelsDir);
        }

        const allModels = db.getModels();
        console.log("[DEBUG] Scan complete:");
        console.log("[DEBUG]   scanned:", scanned);
        console.log("[DEBUG]   updated:", updated);
        console.log("[DEBUG]   total in DB:", allModels.length);
        console.log("[DEBUG] === SCAN END ===");

        // Send response FIRST, before broadcast
        console.log("[DEBUG] Sending models:scan:result response...");
        ok(socket, "models:scan:result", { scanned, updated, total: allModels.length }, id);
        console.log("[DEBUG] Response sent!");

        // Then broadcast
        console.log("[DEBUG] Emitting models:scanned broadcast...");
        io.emit("models:scanned", { scanned, updated, total: allModels.length });
      } catch (e) {
        console.error("[DEBUG] Scan error:", e.message);
        console.error("[DEBUG] Scan stack:", e.stack);
        try {
          err(socket, "models:scan:result", e.message, id);
        } catch (sendErr) {
          console.error("[DEBUG] Failed to send error response:", sendErr.message);
        }
      }
    });

    // Metrics
    socket.on("metrics:get", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const m = db.getLatestMetrics() || {};
        const metrics = {
          cpu: { usage: m.cpu_usage || 0 },
          memory: { used: m.memory_usage || 0 },
          disk: { used: m.disk_usage || 0 },
          uptime: m.uptime || 0,
        };
        ok(socket, "metrics:get:result", { metrics }, id);
      } catch (e) {
        err(socket, "metrics:get:result", e.message, id);
      }
    });
    socket.on("metrics:history", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const history = db.getMetricsHistory(req?.limit || 100).map((m) => ({
          cpu: { usage: m.cpu_usage || 0 },
          memory: { used: m.memory_usage || 0 },
          disk: { used: m.disk_usage || 0 },
          uptime: m.uptime || 0,
          timestamp: m.timestamp,
        }));
        ok(socket, "metrics:history:result", { history }, id);
      } catch (e) {
        err(socket, "metrics:history:result", e.message, id);
      }
    });

    // Logs
    socket.on("logs:get", (req) => {
      const id = req?.requestId || Date.now();
      try {
        ok(socket, "logs:get:result", { logs: db.getLogs(req?.limit || 100) }, id);
      } catch (e) {
        err(socket, "logs:get:result", e.message, id);
      }
    });
    socket.on("logs:clear", (req) => {
      const id = req?.requestId || Date.now();
      try {
        ok(socket, "logs:clear:result", { cleared: db.clearLogs() }, id);
      } catch (e) {
        err(socket, "logs:clear:result", e.message, id);
      }
    });

    // Config
    socket.on("config:get", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] config:get request", { requestId: id });
      try {
        const config = db.getConfig();
        const configSample = JSON.stringify(config).substring(0, 100);
        console.log("[DEBUG] config:get result:", `${configSample}...`);
        ok(socket, "config:get:result", { config }, id);
      } catch (e) {
        console.error("[DEBUG] config:get error:", e.message);
        err(socket, "config:get:result", e.message, id);
      }
    });
    socket.on("config:update", (req) => {
      const id = req?.requestId || Date.now();
      const configStr = JSON.stringify(req?.config || {});
      const configSample = configStr.substring(0, 200);
      console.log("[DEBUG] config:update request", {
        requestId: id,
        config: configSample,
      });
      try {
        db.saveConfig(req?.config || {});
        const savedConfig = db.getConfig();
        const savedSample = JSON.stringify(savedConfig).substring(0, 200);
        console.log("[DEBUG] config:update saved, current config:", savedSample);
        ok(socket, "config:update:result", { config: req?.config }, id);
      } catch (e) {
        console.error("[DEBUG] config:update error:", e.message);
        err(socket, "config:update:result", e.message, id);
      }
    });

    // Settings
    socket.on("settings:get", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const settings = db.getMeta("user_settings") || {};
        ok(socket, "settings:get:result", { settings }, id);
      } catch (e) {
        err(socket, "settings:get:result", e.message, id);
      }
    });
    socket.on("settings:update", (req) => {
      const id = req?.requestId || Date.now();
      try {
        db.setMeta("user_settings", req?.settings || {});
        ok(socket, "settings:update:result", { settings: req?.settings }, id);
      } catch (e) {
        err(socket, "settings:update:result", e.message, id);
      }
    });

    // Llama status (placeholder)
    socket.on("llama:status", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const status = { status: "idle", models: db.getModels() };
        ok(socket, "llama:status:result", { status }, id);
      } catch (e) {
        err(socket, "llama:status:result", e.message, id);
      }
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
    socket.on("disconnect", (reason) => {
      logger.info(`Client disconnected: ${cid}, ${reason}`);
    });
  });
}

// Metrics collection
function startMetrics(io, db) {
  setInterval(() => {
    try {
      const mem = process.memoryUsage();
      const cpuTimes = os.cpus().map((c) => {
        const total = c.times.user + c.times.nice + c.times.sys + c.times.idle;
        const used = c.times.user + c.times.nice + c.times.sys;
        return used / total;
      });
      const cpu = (cpuTimes.reduce((a, c) => a + c, 0) / cpuTimes.length) * 100;
      const m = {
        cpu_usage: cpu,
        memory_usage: mem.heapUsed,
        disk_usage: 0,
        active_models: 0,
        uptime: process.uptime(),
      };
      db.saveMetrics(m);
      const metrics = {
        cpu: { usage: cpu },
        memory: { used: mem.heapUsed },
        disk: { used: 0 },
        uptime: process.uptime(),
      };
      io.emit("metrics:update", { metrics });
    } catch (e) {
      logger.error(`Metrics error: ${e.message}`);
    }
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
    transports: ["websocket"],
  });

  logger.setIo(io);
  setupHandlers(io, db);
  startMetrics(io, db);

  app.use(express.static(path.join(__dirname, "public")));
  app.use(
    "/socket.io",
    express.static(path.join(__dirname, "node_modules", "socket.io", "client-dist"))
  );
  app.use((_req, res, next) => {
    if (
      _req.method === "GET" &&
      !_req.path.startsWith("/socket.io") &&
      !_req.path.startsWith("/llamaproxws")
    ) {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    } else {
      next();
    }
  });

  server.listen(port, () => {
    console.log(
      `\n== Llama Async Proxy ==\n> http://localhost:${port}\n> ` +
        `Socket.IO: ws://localhost:${port}/llamaproxws\n`
    );
    logger.info("Server started");
  });

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

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
