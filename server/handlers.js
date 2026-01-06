/**
 * Socket.IO Event Handlers
 * Extracts all Socket.IO event handlers from server.js into a modular structure.
 */

import fs from "fs";
import path from "path";
import os from "os";
import { spawn, execSync } from "child_process";

// Response helpers
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

// ==================== LLAMA-SERVER MANAGER ====================

let llamaServerProcess = null;
let llamaServerPort = 8080;
const DEFAULT_LLAMA_PORT = 8080;
const MAX_PORT = 8090;

// Find available port for llama-server using a simple TCP connection test
async function findAvailablePort() {
  // Use a simple approach - try ports sequentially
  for (let port = DEFAULT_LLAMA_PORT; port <= MAX_PORT; port++) {
    if (!isPortInUse(port)) {
      return port;
    }
  }
  return MAX_PORT + 1;
}

// Kill existing llama-server process
function killLlamaServer() {
  if (llamaServerProcess) {
    console.log("[LLAMA] Killing existing llama-server process...");
    llamaServerProcess.kill("SIGTERM");
    llamaServerProcess = null;
    return true;
  }
  return false;
}

// Check if a port is in use
function isPortInUse(port) {
  try {
    execSync(`lsof -ti:${port} > /dev/null 2>&1`);
    return true;
  } catch {
    return false;
  }
}

// Find and kill llama-server on a specific port
function killLlamaOnPort(port) {
  try {
    const pid = execSync(`lsof -ti:${port}`).toString().trim();
    if (pid) {
      console.log(`[LLAMA] Killing llama-server on port ${port} (PID: ${pid})`);
      execSync(`kill -9 ${pid}`);
      return true;
    }
  } catch {
    // No process on this port
  }
  return false;
}

// Find llama-server binary
function findLlamaServer() {
  const possiblePaths = [
    "/home/bamer/llama.cpp/build/bin/llama-server",
    "/home/bamer/ik_llama.cpp/build/bin/llama-server",
    "/home/bamer/.local/share/voxd/bin/llama-server",
    "/usr/local/bin/llama-server",
    "/usr/bin/llama-server",
    "/home/bamer/.local/bin/llama-server",
    path.join(os.homedir(), ".local/bin/llama-server"),
    "llama-server", // In PATH
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch {
      // Continue
    }
  }

  // Try which command
  try {
    return execSync("which llama-server").toString().trim();
  } catch {
    return null;
  }
}

// Start llama-server with a model
async function startLlamaServer(modelPath, modelName) {
  console.log("[LLAMA] === STARTING LLAMA-SERVER ===");
  console.log("[LLAMA] Model path:", modelPath);
  console.log("[LLAMA] Model name:", modelName);

  // Find llama-server binary
  const llamaBin = findLlamaServer();
  if (!llamaBin) {
    const error = "llama-server binary not found! Install llama.cpp or add to PATH.";
    console.error("[LLAMA] ERROR:", error);
    return { success: false, error };
  }
  console.log("[LLAMA] Using binary:", llamaBin);

  // Kill any existing llama-server
  console.log("[LLAMA] Cleaning up existing processes...");
  killLlamaServer();
  for (let p = DEFAULT_LLAMA_PORT; p <= MAX_PORT; p++) {
    killLlamaOnPort(p);
  }

  // Find available port
  llamaServerPort = await findAvailablePort();
  console.log("[LLAMA] Using port:", llamaServerPort);

  // Check if model file exists
  if (!fs.existsSync(modelPath)) {
    const error = `Model file not found: ${modelPath}`;
    console.error("[LLAMA] ERROR:", error);
    return { success: false, error };
  }
  console.log("[LLAMA] Model file exists");

  // Build command arguments
  const args = [
    "-m", modelPath,
    "--port", String(llamaServerPort),
    "--host", "127.0.0.1",
    "--threads", "4",
    "--ctx-size", "4096",
    "--temp", "0.7",
    "--repeat-penalty", "1.1",
  ];

  console.log("[LLAMA] Command:", llamaBin, args.join(" "));

  // Spawn llama-server
  try {
    llamaServerProcess = spawn(llamaBin, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    // Capture output
    let stdout = "";
    let stderr = "";

    llamaServerProcess.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      console.log("[LLAMA] stdout:", text.substring(0, 200));
    });

    llamaServerProcess.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      console.log("[LLAMA] stderr:", text.substring(0, 200));
    });

    llamaServerProcess.on("error", (err) => {
      console.error("[LLAMA] Process error:", err.message);
    });

    llamaServerProcess.on("close", (code) => {
      console.log("[LLAMA] Process exited with code:", code);
      if (llamaServerProcess) {
        llamaServerProcess = null;
      }
    });

    // Wait for server to be ready (check port)
    console.log("[LLAMA] Waiting for server to start...");
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
      
      if (isPortInUse(llamaServerPort)) {
        console.log("[LLAMA] Server is ready on port", llamaServerPort);
        return {
          success: true,
          port: llamaServerPort,
          url: `http://127.0.0.1:${llamaServerPort}`,
        };
      }
      
      // Check if process exited
      if (llamaServerProcess && llamaServerProcess.exitCode !== null) {
        const error = `llama-server exited with code ${llamaServerProcess.exitCode}`;
        console.error("[LLAMA] ERROR:", error);
        console.error("[LLAMA] stderr:", stderr);
        return { success: false, error };
      }
    }

    const error = "Timeout waiting for llama-server to start";
    console.error("[LLAMA] ERROR:", error);
    return { success: false, error };

  } catch (e) {
    const error = `Failed to start llama-server: ${e.message}`;
    console.error("[LLAMA] ERROR:", error);
    return { success: false, error };
  }
}

// Stop llama-server
function stopLlamaServer() {
  console.log("[LLAMA] === STOPPING LLAMA-SERVER ===");
  
  const killed = killLlamaServer();
  
  // Also kill by port
  for (let p = DEFAULT_LLAMA_PORT; p <= MAX_PORT; p++) {
    if (killLlamaOnPort(p)) {
      console.log("[LLAMA] Killed llama-server on port", p);
    }
  }
  
  if (killed || isPortInUse(llamaServerPort)) {
    console.log("[LLAMA] Server stopped");
    return { success: true };
  }
  
  console.log("[LLAMA] No server was running");
  return { success: true, message: "No server was running" };
}

// Get llama-server status
function getLlamaStatus() {
  const isRunning = llamaServerProcess !== null && llamaServerProcess.exitCode === null;
  const portInUse = isPortInUse(llamaServerPort);
  
  return {
    status: isRunning || portInUse ? "running" : "idle",
    port: isRunning || portInUse ? llamaServerPort : null,
    url: isRunning || portInUse ? `http://127.0.0.1:${llamaServerPort}` : null,
    processRunning: isRunning,
  };
}

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
    if (this.io) {
      this.io.emit("logs:entry", { entry: { level, message: String(msg), timestamp: Date.now() } });
    }
  }

  info(msg) {
    this.log("info", msg);
  }

  error(msg) {
    this.log("error", msg);
  }
}

const logger = new Logger();

// File type to quantization map
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

/**
 * Register all Socket.IO event handlers
 * @param {Server} io - Socket.IO server instance
 * @param {DB} db - Database instance
 * @param {Function} ggufParser - GGUF metadata parser function
 */
export function registerHandlers(io, db, ggufParser) {
  logger.setIo(io);

  io.on("connection", (socket) => {
    const cid = socket.id;
    logger.info(`Client connected: ${cid}`);

    // Ack connection
    socket.on("connection:ack", () => {
      socket.emit("connection:established", { clientId: cid, timestamp: Date.now() });
    });

    // ==================== MODELS HANDLERS ====================

    /**
     * List all models
     * Event: models:list
     * Response: models:list:result
     */
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

    /**
     * Get a single model by ID
     * Event: models:get
     * Response: models:get:result
     */
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

    /**
     * Create a new model
     * Event: models:create
     * Response: models:create:result
     * Broadcast: models:created
     */
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

    /**
     * Update an existing model
     * Event: models:update
     * Response: models:update:result
     * Broadcast: models:updated
     */
    socket.on("models:update", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const m = db.updateModel(req?.modelId, req?.updates || {});
        if (m) {
          io.emit("models:updated", { model: m });
          ok(socket, "models:update:result", { model: m }, id);
        } else {
          err(socket, "models:update:result", "Not found", id);
        }
      } catch (e) {
        err(socket, "models:update:result", e.message, id);
      }
    });

    /**
     * Delete a model
     * Event: models:delete
     * Response: models:delete:result
     * Broadcast: models:deleted
     */
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

    /**
     * Start a model
     * Event: models:start
     * Response: models:start:result
     * Broadcast: models:status
     */
    socket.on("models:start", (req) => {
      const id = req?.requestId || Date.now();
      const modelId = req?.modelId;
      console.log("[DEBUG] models:start request", { requestId: id, modelId });

      try {
        // Get model from database
        const model = db.getModel(modelId);
        if (!model) {
          console.error("[DEBUG] models:start: Model not found:", modelId);
          err(socket, "models:start:result", "Model not found", id);
          return;
        }

        console.log("[DEBUG] models:start: Starting model:", model.name);
        console.log("[DEBUG] models:start: Model path:", model.model_path);

        // Check if model is already running
        const currentStatus = getLlamaStatus();
        if (currentStatus.status === "running") {
          console.log("[DEBUG] models:start: Another model is already running on port", currentStatus.port);
          // Stop it first
          stopLlamaServer();
        }

        // Start llama-server with the model
        startLlamaServer(model.model_path, model.name)
          .then((result) => {
            if (result.success) {
              console.log("[DEBUG] models:start: SUCCESS on port", result.port);
              // Update model status in database
              db.updateModel(modelId, { status: "running" });
              const updatedModel = db.getModel(modelId);
              // Broadcast status update
              io.emit("models:status", {
                modelId,
                status: "running",
                model: updatedModel,
                llama: result
              });
              // Also emit llama:status update
              io.emit("llama:status", {
                status: "running",
                port: result.port,
                url: result.url,
                modelId,
                modelName: model.name,
              });
              ok(socket, "models:start:result", { model: updatedModel, llama: result }, id);
            } else {
              console.error("[DEBUG] models:start: FAILED:", result.error);
              err(socket, "models:start:result", result.error, id);
            }
          })
          .catch((e) => {
            console.error("[DEBUG] models:start: Exception:", e.message);
            err(socket, "models:start:result", e.message, id);
          });

      } catch (e) {
        console.error("[DEBUG] models:start error:", e.message);
        err(socket, "models:start:result", e.message, id);
      }
    });

    /**
     * Stop a model
     * Event: models:stop
     * Response: models:stop:result
     * Broadcast: models:status
     */
    socket.on("models:stop", (req) => {
      const id = req?.requestId || Date.now();
      const modelId = req?.modelId;
      console.log("[DEBUG] models:stop request", { requestId: id, modelId });

      try {
        const model = db.getModel(modelId);
        if (!model) {
          err(socket, "models:stop:result", "Model not found", id);
          return;
        }

        console.log("[DEBUG] models:stop: Stopping model:", model.name);

        // Stop llama-server
        const result = stopLlamaServer();

        // Update model status
        db.updateModel(modelId, { status: "idle" });
        const updatedModel = db.getModel(modelId);

        // Broadcast
        io.emit("models:status", {
          modelId,
          status: "idle",
          model: updatedModel,
        });
        io.emit("llama:status", { status: "idle" });

        console.log("[DEBUG] models:stop: SUCCESS");
        ok(socket, "models:stop:result", { model: updatedModel }, id);
      } catch (e) {
        console.error("[DEBUG] models:stop error:", e.message);
        err(socket, "models:stop:result", e.message, id);
      }
    });

    /**
     * Scan models directory for new models
     * Event: models:scan
     * Response: models:scan:result
     * Broadcast: models:scanned
     */
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

        let scanned = 0;
        let updated = 0;
        let existingCount = 0;

        if (dirExists) {
          console.log("[DEBUG] Starting file search...");
          const exts = [".gguf", ".bin", ".safetensors", ".pt", ".pth"];

          // Patterns to exclude (non-model files)
          const excludePatterns = [
            /mmproj/i,
            /-proj$/i,
            /\.factory$/i,
            /^_/i,
          ];

          const isValidModelFile = (fileName, fullPath) => {
            if (excludePatterns.some((p) => p.test(fileName))) {
              console.log("[DEBUG] Excluding:", fileName);
              return false;
            }

            if (fileName.toLowerCase().endsWith(".gguf")) {
              try {
                const fd = fs.openSync(fullPath, "r");
                const magicBuf = Buffer.alloc(4);
                fs.readSync(fd, magicBuf, 0, 4, 0);
                fs.closeSync(fd);
                const magic = new DataView(magicBuf.buffer).getUint32(0, true);
                if (magic !== 0x46554747) {
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
                  const meta = await ggufParser(fullPath);
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
                  const meta = await ggufParser(fullPath);
                  const needsBasicUpdate =
                    !existing.params || !existing.quantization || !existing.file_size;
                  const needsGgufUpdate =
                    !existing.ctx_size || !existing.block_count || existing.ctx_size === 4096;
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
                console.warn(
                  "[DEBUG] Error processing file",
                  fullPath,
                  ":",
                  fileError.message
                );
              }
            }
          })();

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

        console.log("[DEBUG] Sending models:scan:result response...");
        ok(socket, "models:scan:result", { scanned, updated, total: allModels.length }, id);
        console.log("[DEBUG] Response sent!");

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

    /**
     * Cleanup models whose files no longer exist
     * Event: models:cleanup
     * Response: models:cleanup:result
     */
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

    // ==================== METRICS HANDLERS ====================

    /**
     * Get latest metrics
     * Event: metrics:get
     * Response: metrics:get:result
     */
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

    /**
     * Get metrics history
     * Event: metrics:history
     * Response: metrics:history:result
     */
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

    // ==================== LOGS HANDLERS ====================

    /**
     * Get logs
     * Event: logs:get
     * Response: logs:get:result
     */
    socket.on("logs:get", (req) => {
      const id = req?.requestId || Date.now();
      try {
        ok(socket, "logs:get:result", { logs: db.getLogs(req?.limit || 100) }, id);
      } catch (e) {
        err(socket, "logs:get:result", e.message, id);
      }
    });

    /**
     * Clear logs
     * Event: logs:clear
     * Response: logs:clear:result
     */
    socket.on("logs:clear", (req) => {
      const id = req?.requestId || Date.now();
      try {
        ok(socket, "logs:clear:result", { cleared: db.clearLogs() }, id);
      } catch (e) {
        err(socket, "logs:clear:result", e.message, id);
      }
    });

    // ==================== CONFIG HANDLERS ====================

    /**
     * Get server configuration
     * Event: config:get
     * Response: config:get:result
     */
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

    /**
     * Update server configuration
     * Event: config:update
     * Response: config:update:result
     */
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

    // ==================== SETTINGS HANDLERS ====================

    /**
     * Get user settings
     * Event: settings:get
     * Response: settings:get:result
     */
    socket.on("settings:get", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const settings = db.getMeta("user_settings") || {};
        ok(socket, "settings:get:result", { settings }, id);
      } catch (e) {
        err(socket, "settings:get:result", e.message, id);
      }
    });

    /**
     * Update user settings
     * Event: settings:update
     * Response: settings:update:result
     */
    socket.on("settings:update", (req) => {
      const id = req?.requestId || Date.now();
      try {
        db.setMeta("user_settings", req?.settings || {});
        ok(socket, "settings:update:result", { settings: req?.settings }, id);
      } catch (e) {
        err(socket, "settings:update:result", e.message, id);
      }
    });

    // ==================== LLAMA HANDLERS ====================

    /**
     * Get llama server status
     * Event: llama:status
     * Response: llama:status:result
     */
    socket.on("llama:status", (req) => {
      const id = req?.requestId || Date.now();
      try {
        const status = getLlamaStatus();
        const models = db.getModels();
        console.log("[DEBUG] llama:status:", status.status, "port:", status.port);
        ok(socket, "llama:status:result", { status, models }, id);
      } catch (e) {
        console.error("[DEBUG] llama:status error:", e.message);
        err(socket, "llama:status:result", e.message, id);
      }
    });

    /**
     * Start llama server (without specific model - uses default)
     * Event: llama:start
     * Response: llama:start:result
     * Broadcast: llama:status
     */
    socket.on("llama:start", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] llama:start request", { requestId: id });

      try {
        const config = db.getConfig();
        const defaultModel = db.getModels()[0];

        if (!defaultModel) {
          err(socket, "llama:start:result", "No models available", id);
          return;
        }

        console.log("[DEBUG] llama:start: Using default model:", defaultModel.name);

        startLlamaServer(defaultModel.model_path, defaultModel.name)
          .then((result) => {
            if (result.success) {
              console.log("[DEBUG] llama:start: SUCCESS on port", result.port);
              io.emit("llama:status", {
                status: "running",
                port: result.port,
                url: result.url,
                modelId: defaultModel.id,
                modelName: defaultModel.name,
              });
              ok(socket, "llama:start:result", { success: true, ...result }, id);
            } else {
              console.error("[DEBUG] llama:start: FAILED:", result.error);
              err(socket, "llama:start:result", result.error, id);
            }
          })
          .catch((e) => {
            console.error("[DEBUG] llama:start: Exception:", e.message);
            err(socket, "llama:start:result", e.message, id);
          });

      } catch (e) {
        console.error("[DEBUG] llama:start error:", e.message);
        err(socket, "llama:start:result", e.message, id);
      }
    });

    /**
     * Stop llama server
     * Event: llama:stop
     * Response: llama:stop:result
     * Broadcast: llama:status
     */
    socket.on("llama:stop", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] llama:stop request", { requestId: id });

      try {
        const result = stopLlamaServer();
        console.log("[DEBUG] llama:stop: SUCCESS");
        io.emit("llama:status", { status: "idle" });
        ok(socket, "llama:stop:result", result, id);
      } catch (e) {
        console.error("[DEBUG] llama:stop error:", e.message);
        err(socket, "llama:stop:result", e.message, id);
      }
    });

    // ==================== DISCONNECT HANDLER ====================

    /**
     * Handle client disconnection
     */
    socket.on("disconnect", (reason) => {
      logger.info(`Client disconnected: ${cid}, ${reason}`);
    });
  });
}

// Export utilities for external use
export { ok, err, logger, fileTypeMap };
