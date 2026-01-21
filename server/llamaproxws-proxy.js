"use strict";

/**
 * LlamaProxy - Dedicated WebSocket proxy for llamaproxws path
 * 
 * This module creates a Socket.IO server on a dedicated path (/llamaproxws)
 * with startup watchdog and presets loading reliability.
 */

const fs = require("fs");
const path = require("path");

/**
 * Create a dedicated Socket.IO server on the llamaproxws path
 * @param {http.Server} httpServer - HTTP server to attach to
 * @param {Object} options - Configuration options
 * @param {string} options.path - WebSocket path (default: /llamaproxws)
 * @param {string} options.presetsDir - Directory containing preset files
 * @param {number} options.startupTimeoutMs - Startup watchdog timeout (default: 15000)
 * @param {Object} options.ioOptions - Additional Socket.IO options
 * @returns {Server} Socket.IO server instance
 */
function setupLlamaProxy(httpServer, options = {}) {
  const {
    path: WEBSOCKET_PATH = "/llamaproxws",
    presetsDir,
    startupTimeoutMs = 15000,
    ioOptions = {}
  } = options;

  const { Server } = require("socket.io");

  // Create Socket.IO instance with dedicated path
  const io = new Server(httpServer, {
    path: WEBSOCKET_PATH,
    transports: ["websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 10000,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    ...ioOptions
  });

  console.log("[LLAMAPROXY] Socket.IO initialized on path:", WEBSOCKET_PATH);

  // Presets loading state
  let presetsLoaded = false;
  let presetsLoadError = null;
  let presets = [];

  // Startup watchdog
  let startupWatchdog = null;
  let watchdogTriggered = false;

  /**
   * Load presets from directory with retry logic
   */
  async function loadPresetsWithRetry() {
    if (!presetsDir) {
      console.log("[LLAMAPROXY] No presets directory configured");
      return [];
    }

    const maxRetries = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        console.log(`[LLAMAPROXY] Loading presets attempt ${attempt}/${maxRetries}`);

        // Ensure directory exists
        if (!fs.existsSync(presetsDir)) {
          console.warn("[LLAMAPROXY] Presets directory not found:", presetsDir);
          return [];
        }

        // Read all preset files
        const files = fs.readdirSync(presetsDir);
        const presetFiles = files.filter(f => 
          f.endsWith(".json") || f.endsWith(".ini") || f.endsWith(".conf")
        );

        const loadedPresets = [];
        for (const file of presetFiles) {
          const filePath = path.join(presetsDir, file);
          try {
            const content = fs.readFileSync(filePath, "utf8");
            loadedPresets.push({
              name: path.basename(file, path.extname(file)),
              file: file,
              content: content,
              loadedAt: new Date().toISOString()
            });
          } catch (readErr) {
            console.error(`[LLAMAPROXY] Failed to read preset file ${file}:`, readErr.message);
          }
        }

        console.log(`[LLAMAPROXY] Loaded ${loadedPresets.length} presets`);
        return loadedPresets;

      } catch (err) {
        lastError = err;
        console.error(`[LLAMAPROXY] Preset load attempt ${attempt} failed:`, err.message);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error("Failed to load presets after max retries");
  }

  /**
   * Initialize presets loading
   */
  async function initializePresets() {
    try {
      presets = await loadPresetsWithRetry();
      presetsLoaded = true;
      presetsLoadError = null;
      console.log("[LLAMAPROXY] Presets loaded successfully:", presets.length);
      
      // Broadcast presets:loaded event
      io.emit("presets:loaded", {
        success: true,
        count: presets.length,
        presets: presets.map(p => ({ name: p.name, file: p.file })),
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      presetsLoadError = err;
      presetsLoaded = false;
      console.error("[LLAMAPROXY] Presets loading failed:", err.message);
      
      // Broadcast error but continue
      io.emit("presets:loadError", {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Start startup watchdog
   */
  function startStartupWatchdog() {
    if (startupWatchdog) {
      clearTimeout(startupWatchdog);
    }
    
    watchdogTriggered = false;
    startupWatchdog = setTimeout(() => {
      watchdogTriggered = true;
      console.error("[LLAMAPROXY-WATCHDOG] Startup timeout reached:", startupTimeoutMs, "ms");
      console.error("[LLAMAPROXY-WATCHDOG] Presets loaded:", presetsLoaded);
      
      // Emit watchdog event
      io.emit("startup:watchdog", {
        ok: false,
        reason: "presets load timeout",
        timeoutMs: startupTimeoutMs,
        presetsLoaded,
        timestamp: new Date().toISOString()
      });
    }, startupTimeoutMs);
    
    console.log("[LLAMAPROXY] Startup watchdog started:", startupTimeoutMs, "ms");
  }

  /**
   * Clear startup watchdog
   */
  function clearStartupWatchdog() {
    if (startupWatchdog) {
      clearTimeout(startupWatchdog);
      startupWatchdog = null;
    }
    
    if (!watchdogTriggered) {
      console.log("[LLAMAPROXY] Startup completed within timeout");
      
      io.emit("startup:completed", {
        ok: true,
        presetsLoaded,
        presetCount: presets.length,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle new socket connections
   */
  function handleConnection(socket) {
    console.log("[LLAMAPROXY] Client connected:", socket.id);
    
    // Send welcome/handshake
    socket.emit("handshake", {
      status: "connected",
      path: WEBSOCKET_PATH,
      clientId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Handle client handshake acknowledgment
    socket.on("handshake:ack", (payload) => {
      console.log("[LLAMAPROXY] Client handshake ack:", socket.id, payload);
    });

    // Handle presets:reload request
    socket.on("presets:reload", async (req, callback) => {
      console.log("[LLAMAPROXY] Presets reload requested by:", socket.id);
      
      presetsLoaded = false;
      try {
        presets = await loadPresetsWithRetry();
        presetsLoaded = true;
        
        callback({
          success: true,
          count: presets.length,
          timestamp: new Date().toISOString()
        });
        
        // Broadcast to all clients
        io.emit("presets:loaded", {
          success: true,
          count: presets.length,
          presets: presets.map(p => ({ name: p.name, file: p.file })),
          timestamp: new Date().toISOString()
        });
        
      } catch (err) {
        callback({
          success: false,
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle presets:list request
    socket.on("presets:list", (req, callback) => {
      callback({
        success: true,
        data: {
          presets: presets.map(p => ({ name: p.name, file: p.file })),
          loaded: presetsLoaded,
          loadError: presetsLoadError?.message || null
        },
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log("[LLAMAPROXY] Client disconnected:", socket.id, reason);
    });
  }

  // Register connection handler
  io.on("connection", handleConnection);

  // Initialize startup sequence
  console.log("[LLAMAPROXY] Starting initialization...");
  startStartupWatchdog();
  
  initializePresets().then(() => {
    clearStartupWatchdog();
  }).catch((err) => {
    console.error("[LLAMAPROXY] Initialization error:", err.message);
    clearStartupWatchdog();
  });

  // Return io instance for external use
  return io;
}

/**
 * Get presets registry (for external access)
 * @param {Server} io - Socket.IO instance
 * @returns {Object} Presets registry
 */
function getPresetsRegistry(io) {
  return {
    getPresets: () => {
      // This would need to be enhanced to access internal state
      return io.emit("presets:list", {});
    },
    reload: () => {
      return io.emit("presets:reload", {});
    }
  };
}

module.exports = {
  setupLlamaProxy,
  getPresetsRegistry
};
