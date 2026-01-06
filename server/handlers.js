/**
 * Socket.IO Event Handlers
 * Extracts all Socket.IO event handlers from server.js into a modular structure.
 * Supports llama.cpp router mode for multi-model management.
 */

import fs from "fs";
import path from "path";
import os from "os";
import { spawn, execSync } from "child_process";
import http from "http";

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

// ==================== LLAMA-SERVER ROUTER MODE MANAGER ====================

let llamaServerProcess = null;
let llamaServerPort = 8080;
const DEFAULT_LLAMA_PORT = 8080;
const MAX_PORT = 8090;
let llamaServerUrl = null;

// Find available port for llama-server using a simple TCP connection test
async function findAvailablePort() {
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

// Make HTTP request to llama-server API
async function llamaApiRequest(endpoint, method = "GET", body = null) {
  if (!llamaServerUrl) {
    throw new Error("llama-server not running");
  }

  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, llamaServerUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

  // Start llama-server in ROUTER MODE (multi-model support)
  async function startLlamaServerRouter(modelsDir, db, options = {}) {
    console.log("[LLAMA] === STARTING LLAMA-SERVER IN ROUTER MODE ===");
    console.log("[LLAMA] Models directory:", modelsDir);
    console.log("[LLAMA] Options:", options);

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

  // Get port from config, or find available port
  const config = db.getConfig();
  const configuredPort = config.port || 8080;
  console.log("[LLAMA] Configured port:", configuredPort);
  
  // Check if configured port is available, otherwise find another
  if (!(await isPortInUse(configuredPort))) {
    llamaServerPort = configuredPort;
    console.log("[LLAMA] Using configured port:", llamaServerPort);
  } else {
    llamaServerPort = await findAvailablePort();
    console.log("[LLAMA] Configured port not available, using:", llamaServerPort);
  }
  
  llamaServerUrl = `http://127.0.0.1:${llamaServerPort}`;
  console.log("[LLAMA] Final port:", llamaServerPort);

  // Check if models directory exists
  if (!fs.existsSync(modelsDir)) {
    const error = `Models directory not found: ${modelsDir}`;
    console.error("[LLAMA] ERROR:", error);
    return { success: false, error };
  }
  console.log("[LLAMA] Models directory exists");

  // Build command arguments for router mode
  const args = [
    "--port", String(llamaServerPort),
    "--host", "127.0.0.1",
    "--models-dir", modelsDir,
    "--models-max", String(options.maxModels || 4),
    "--threads", String(options.threads || 4),
    "--ctx-size", String(options.ctxSize || 4096),
  ];

  // Disable auto-load if specified
  if (options.noAutoLoad) {
    args.push("--no-models-autoload");
  }

  console.log("[LLAMA] Command:", llamaBin, args.join(" "));

  // Spawn llama-server in router mode
  try {
    console.log("[LLAMA] About to spawn llama-server...");
    console.log("[LLAMA] Binary:", llamaBin, fs.existsSync(llamaBin) ? "(exists)" : "(NOT FOUND)");
    
    llamaServerProcess = spawn(llamaBin, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    console.log("[LLAMA] Process spawned, PID:", llamaServerProcess?.pid);
    console.log("[LLAMA] Process connected:", llamaServerProcess?.connected);

    // Check if process immediately fails
    llamaServerProcess.on('error', (err) => {
      console.error("[LLAMA] Process ERROR:", err.message);
    });

    llamaServerProcess.on('close', (code) => {
      console.log("[LLAMA] Process CLOSED with code:", code);
    });

    // Check stdout/stderr immediately
    llamaServerProcess.stdout.on('data', (data) => {
      console.log("[LLAMA] stdout:", data.toString().substring(0, 100));
    });

    llamaServerProcess.stderr.on('data', (data) => {
      const text = data.toString();
      console.log("[LLAMA] stderr:", text.substring(0, 100));
      // Check for listening message
      if (text.includes("router server is listening")) {
        console.log("[LLAMA] Server is listening!");
      }
    });

    console.log("[LLAMA] Event listeners attached, starting wait loop...");

    llamaServerProcess.on("error", (err) => {
      console.error("[LLAMA] Process error:", err.message);
    });

    llamaServerProcess.on("close", (code) => {
      console.log("[LLAMA] Process exited with code:", code);
      if (llamaServerProcess) {
        llamaServerProcess = null;
      }
    });

    // Wait for server to be ready
    console.log("[LLAMA] Waiting for router server to start...");
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
      console.log("[LLAMA] Attempt", attempts, "- Checking port", llamaServerPort);

      if (isPortInUse(llamaServerPort)) {
        console.log("[LLAMA] Port is in use, checking API...");

        // Try to get models list to confirm API is working
        try {
          console.log("[LLAMA] Calling llamaApiRequest /models...");
          const result = await llamaApiRequest("/models");
          console.log("[LLAMA] API confirmed working:", JSON.stringify(result).substring(0, 100));
        } catch (e) {
          console.log("[LLAMA] API not ready yet:", e.message);
          continue;
        }

        console.log("[LLAMA] Router server successfully started on port", llamaServerPort);
        return {
          success: true,
          port: llamaServerPort,
          url: llamaServerUrl,
          mode: "router",
        };
      }

      // Check if process exited
      if (llamaServerProcess && llamaServerProcess.exitCode !== null) {
        const error = `llama-server exited with code ${llamaServerProcess.exitCode}`;
        console.error("[LLAMA] ERROR:", error);
        console.error("[LLAMA] stderr:", stderr.substring(0, 500));
        return { success: false, error };
      }
    }

    const error = "Timeout waiting for llama-server router to start";
    console.error("[LLAMA] ERROR:", error);
    return { success: false, error };

  } catch (e) {
    const error = `Failed to start llama-server router: ${e.message}`;
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

  llamaServerUrl = null;

  if (killed || isPortInUse(llamaServerPort)) {
    console.log("[LLAMA] Server stopped");
    return { success: true };
  }

  console.log("[LLAMA] No server was running");
  return { success: true, message: "No server was running" };
}

// Get llama-server status (router mode)
async function getLlamaStatus() {
  const isRunning = llamaServerProcess !== null && llamaServerProcess.exitCode === null;
  const portInUse = isPortInUse(llamaServerPort);

  let modelsStatus = null;

  if (isRunning || portInUse) {
    try {
      modelsStatus = await llamaApiRequest("/models");
      console.log("[LLAMA] Models status:", modelsStatus);
    } catch (e) {
      console.warn("[LLAMA] Failed to get models status:", e.message);
    }
  }

  return {
    status: isRunning || portInUse ? "running" : "idle",
    port: isRunning || portInUse ? llamaServerPort : null,
    url: isRunning || portInUse ? llamaServerUrl : null,
    processRunning: isRunning,
    mode: "router",
    models: modelsStatus?.models || [],
  };
}

// Load a model (router mode)
async function loadModel(modelName) {
  console.log("[LLAMA] Loading model:", modelName);

  if (!llamaServerUrl) {
    return { success: false, error: "llama-server not running" };
  }

  try {
    const result = await llamaApiRequest("/models/load", "POST", { model: modelName });
    console.log("[LLAMA] Load result:", result);
    return { success: true, result };
  } catch (e) {
    console.error("[LLAMA] Failed to load model:", e.message);
    return { success: false, error: e.message };
  }
}

// Unload a model (router mode)
async function unloadModel(modelName) {
  console.log("[LLAMA] Unloading model:", modelName);

  if (!llamaServerUrl) {
    return { success: false, error: "llama-server not running" };
  }

  try {
    const result = await llamaApiRequest("/models/unload", "POST", { model: modelName });
    console.log("[LLAMA] Unload result:", result);
    return { success: true, result };
  } catch (e) {
    console.error("[LLAMA] Failed to unload model:", e.message);
    return { success: false, error: e.message };
  }
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
     * Load a model (router mode)
     * Event: models:load
     * Response: models:load:result
     * Broadcast: models:status
     */
    socket.on("models:load", (req) => {
      const id = req?.requestId || Date.now();
      const modelName = req?.modelName || req?.modelId;
      console.log("[DEBUG] models:load request", { requestId: id, modelName });

      if (!llamaServerUrl) {
        err(socket, "models:load:result", "llama-server not running", id);
        return;
      }

      loadModel(modelName)
        .then((result) => {
          if (result.success) {
            console.log("[DEBUG] models:load: SUCCESS");
            io.emit("models:status", {
              modelName,
              status: "loaded",
            });
            ok(socket, "models:load:result", { modelName, status: "loaded" }, id);
          } else {
            console.error("[DEBUG] models:load: FAILED:", result.error);
            io.emit("models:status", {
              modelName,
              status: "error",
              error: result.error,
            });
            err(socket, "models:load:result", result.error, id);
          }
        })
        .catch((e) => {
          console.error("[DEBUG] models:load: Exception:", e.message);
          err(socket, "models:load:result", e.message, id);
        });
    });

    /**
     * Unload a model (router mode)
     * Event: models:unload
     * Response: models:unload:result
     * Broadcast: models:status
     */
    socket.on("models:unload", (req) => {
      const id = req?.requestId || Date.now();
      const modelName = req?.modelName || req?.modelId;
      console.log("[DEBUG] models:unload request", { requestId: id, modelName });

      if (!llamaServerUrl) {
        err(socket, "models:unload:result", "llama-server not running", id);
        return;
      }

      unloadModel(modelName)
        .then((result) => {
          if (result.success) {
            console.log("[DEBUG] models:unload: SUCCESS");
            io.emit("models:status", {
              modelName,
              status: "unloaded",
            });
            ok(socket, "models:unload:result", { modelName, status: "unloaded" }, id);
          } else {
            console.error("[DEBUG] models:unload: FAILED:", result.error);
            err(socket, "models:unload:result", result.error, id);
          }
        })
        .catch((e) => {
          console.error("[DEBUG] models:unload: Exception:", e.message);
          err(socket, "models:unload:result", e.message, id);
        });
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
                    status: "unloaded",
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

    // ==================== LLAMA ROUTER HANDLERS ====================

    /**
     * Get llama server status (router mode)
     * Event: llama:status
     * Response: llama:status:result
     */
    socket.on("llama:status", (req) => {
      const id = req?.requestId || Date.now();
      try {
        getLlamaStatus()
          .then((status) => {
            console.log("[DEBUG] llama:status:", status.status, "port:", status.port);
            ok(socket, "llama:status:result", { status }, id);
          })
          .catch((e) => {
            console.error("[DEBUG] llama:status error:", e.message);
            err(socket, "llama:status:result", e.message, id);
          });
      } catch (e) {
        console.error("[DEBUG] llama:status error:", e.message);
        err(socket, "llama:status:result", e.message, id);
      }
    });

    /**
     * Start llama server in router mode
     * Event: llama:start
     * Response: llama:start:result
     * Broadcast: llama:status
     */
    socket.on("llama:start", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[LLAMA] *** llama:start EVENT RECEIVED *** requestId:", id);
      console.log("[LLAMA] *** Request data:", JSON.stringify(req).substring(0, 200));

      try {
        const config = db.getConfig();
        const settings = db.getMeta("user_settings") || {};

        console.log("[DEBUG] llama:start: config.port =", config.port);
        console.log("[DEBUG] llama:start: config.baseModelsPath =", config.baseModelsPath);
        console.log("[DEBUG] llama:start: settings =", JSON.stringify(settings).substring(0, 200));

        const modelsDir = config.baseModelsPath;
        if (!modelsDir) {
          console.log("[DEBUG] llama:start: ERROR - No models directory configured");
          err(socket, "llama:start:result", "No models directory configured", id);
          return;
        }

        console.log("[DEBUG] llama:start: Starting router with dir:", modelsDir);

        // Start llama-server in router mode
        startLlamaServerRouter(modelsDir, db, {
          maxModels: settings.maxModelsLoaded || 4,
          ctxSize: config.ctx_size || 4096,
          threads: config.threads || 4,
          noAutoLoad: !settings.autoLoadModels,
        })
          .then((result) => {
            if (result.success) {
              console.log("[DEBUG] llama:start: SUCCESS on port", result.port);
              io.emit("llama:status", {
                status: "running",
                port: result.port,
                url: result.url,
                mode: "router",
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
     * Restart llama server (router mode)
     * Event: llama:restart
     * Response: llama:restart:result
     * Broadcast: llama:status
     */
    socket.on("llama:restart", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] llama:restart request (router mode)", { requestId: id });

      // First stop, then start
      stopLlamaServer();

      // Emit llama:start with same requestId
      setTimeout(() => {
        socket.emit("llama:start", { requestId: id });
      }, 2000);
    });

    /**
     * Stop llama server
     * Event: llama:stop
     * Response: llama:stop:result
     * Broadcast: llama:status
     * Broadcast: models:router-stopped (to reset all model statuses)
     */
    socket.on("llama:stop", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] llama:stop request", { requestId: id });

      try {
        const result = stopLlamaServer();
        console.log("[DEBUG] llama:stop: SUCCESS");
        io.emit("llama:status", { status: "idle" });
        // Broadcast that router stopped so clients reset model statuses
        io.emit("models:router-stopped", {});
        ok(socket, "llama:stop:result", result, id);
      } catch (e) {
        console.error("[DEBUG] llama:stop error:", e.message);
        err(socket, "llama:stop:result", e.message, id);
      }
    });

    /**
     * Configure llama server settings
     * Event: llama:config
     * Response: llama:config:result
     */
    socket.on("llama:config", (req) => {
      const id = req?.requestId || Date.now();
      console.log("[DEBUG] llama:config request", { requestId: id, settings: req?.settings });

      try {
        // Save router settings to user_settings
        const settings = req?.settings || {};
        db.setMeta("router_settings", settings);
        console.log("[DEBUG] llama:config: Settings saved");
        ok(socket, "llama:config:result", { settings }, id);
      } catch (e) {
        console.error("[DEBUG] llama:config error:", e.message);
        err(socket, "llama:config:result", e.message, id);
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
