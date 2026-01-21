# Consolidated Llama Router & Server Guide

Complete reference for llama.cpp router mode, server configuration, metrics integration, and router card management.

## Table of Contents

1. [Router Mode Overview](#router-mode-overview)
2. [CLI Flags Reference](#cli-flags-reference)
3. [Initialization Guide](#initialization-guide)
4. [Metrics Implementation](#metrics-implementation)
5. [Router Card Management](#router-card-management)
6. [Configuration Examples](#configuration-examples)
7. [Troubleshooting](#troubleshooting)

---

## Router Mode Overview

### What is Llama Router Mode?

**Router Mode** is a feature in llama.cpp that:

- Runs a **single server process** managing multiple models
- **Auto-discovers** models from a directory
- Loads/unloads models **on-demand** (LRU eviction when max reached)
- Routes requests to the correct model **automatically**
- Eliminates need for multiple server processes (unlike API mode)

### Router Mode vs API Mode

| Feature | Router Mode | API Mode |
|---------|-------------|----------|
| Multiple Models | ✅ Single server | ❌ Multiple servers |
| Dynamic Loading | ✅ On-demand | ❌ Restart required |
| Memory Efficient | ✅ LRU eviction | ❌ All loaded |
| Port Management | ✅ Single port | ❌ Multiple ports |
| Preset Support | ✅ Native | ❌ Manual config |

### Model Status Values

| Status | Description |
|--------|-------------|
| `loaded` | Model is in memory and ready |
| `loading` | Model is being loaded |
| `unloaded` | Model on disk, not in memory |
| `error` | Failed to load |

### API Endpoints

```bash
# List all models with status
GET /models

# Load specific model
POST /models/load
{ "model": "model-name.gguf" }

# Unload model
POST /models/unload
{ "model": "model-name.gguf" }
```

---

## CLI Flags Reference

### Essential Flags

```bash
llama-server \
  --models-dir /path/to/models \
  --models-max 4 \
  -c 8192 \
  -ngl 99 \
  --np 4 \
  --port 8134
```

### Flag Reference Table

| Flag | Default | Description |
|------|---------|-------------|
| `--models-dir` | `~/.cache/llama.cpp` | Directory with GGUF files |
| `--models-max` | 4 | Max concurrent models |
| `-c` | 512 | Context size per model |
| `-ngl` | 0 | GPU layers to offload |
| `--np` | 1 | Parallel processing slots |
| `--threads-http` | 1 | HTTP threads for requests |
| `--port` | 8080 | Server port |
| `--jinja` | false | Enable Jinja template engine |
| `--chat-template` | - | Predefined chat template |
| `--reasoning-budget` | -1 | Max reasoning tokens |
| `--models-autoload` | true | Auto-load models on request |
| `--model-alias` | - | Friendly model name |

### Full Command Example

```bash
llama-server \
  --models-dir ./models \
  --models-max 4 \
  -c 8192 \
  -ngl 99 \
  --np 4 \
  --threads-http 4 \
  --port 8134 \
  --jinja \
  --chat-template deepseek \
  --reasoning-format deepseek \
  --reasoning-budget -1
```

---

## Initialization Guide

### Current Architecture

```json
{
  "host": "localhost",
  "port": 8134,
  "baseModelsPath": "/media/bamer/crucial MX300/llm/llama/models",
  "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
  "ctx_size": 131000,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

### Init File Structure

#### Option 1: JSON Config (`llama-router.init.json`)

```json
{
  "version": "1.0",
  "router": {
    "enabled": true,
    "port": 8134,
    "host": "localhost"
  },
  "models": {
    "directory": "/media/bamer/crucial MX300/llm/llama/models",
    "maxLoaded": 4,
    "autoDiscovery": true,
    "preloadModels": ["model1.gguf", "model2.gguf"]
  },
  "performance": {
    "contextSize": 8192,
    "batchSize": 512,
    "gpuLayers": -1,
    "parallelSlots": 4,
    "httpThreads": 4,
    "threads": -1
  },
  "logging": {
    "level": "debug",
    "enableDebugOutput": true,
    "logFile": "./logs/router.log"
  },
  "startup": {
    "autoStart": true,
    "timeout": 30000,
    "retryAttempts": 3,
    "retryDelay": 2000
  }
}
```

#### Option 2: JavaScript Config Module

```javascript
export const llamaRouterConfig = {
  router: {
    enabled: true,
    port: 8134,
    host: "localhost",
  },
  models: {
    directory: "/media/bamer/crucial MX300/llm/llama/models",
    maxLoaded: 4,
    autoDiscovery: true,
    preloadModels: ["model1.gguf"],
    cache: {
      enabled: true,
      ttl: 3600000, // 1 hour
    },
  },
  performance: {
    contextSize: 8192,
    batchSize: 512,
    gpuLayers: -1,
    parallelSlots: 4,
    httpThreads: 4,
    threads: -1,
  },
  logging: {
    level: "debug",
    enableDebugOutput: true,
    logFile: "./logs/router.log",
  },
  startup: {
    autoStart: true,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 2000,
  },
};
```

### Init Loader Module

**File**: `server/handlers/llama-router/init.js`

```javascript
/**
 * Llama Router Initialization
 * Load and validate router configuration
 */

import fs from "fs";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load router configuration from init file
 */
export function loadRouterConfig(initFilePath = null) {
  const configPath = initFilePath || path.join(process.cwd(), "llama-router.init.json");
  console.log("[ROUTER-INIT] Loading config from:", configPath);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Router init file not found: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(raw);
  validateRouterConfig(config);
  console.log("[ROUTER-INIT] Configuration loaded and validated");

  return config;
}

/**
 * Validate router configuration
 */
export function validateRouterConfig(config) {
  if (!config.router?.port) {
    throw new Error("Missing router.port in configuration");
  }
  if (!config.models?.directory) {
    throw new Error("Missing models.directory in configuration");
  }
  if (!fs.existsSync(config.models.directory)) {
    throw new Error(`Models directory not found: ${config.models.directory}`);
  }
  if (config.performance?.contextSize < 128) {
    throw new Error("Context size must be at least 128");
  }
  return true;
}

/**
 * Build llama-server command line args from config
 */
export function buildRouterArgs(config) {
  const args = [
    "--models-dir",
    config.models.directory,
    "--models-max",
    String(config.models.maxLoaded || 4),
    "-c",
    String(config.performance.contextSize || 8192),
    "-b",
    String(config.performance.batchSize || 512),
    "-ngl",
    String(config.performance.gpuLayers || -1),
    "--np",
    String(config.performance.parallelSlots || 4),
    "--threads-http",
    String(config.performance.httpThreads || 4),
    "-t",
    String(config.performance.threads || -1),
    "--port",
    String(config.router.port || 8134),
  ];

  if (config.logging?.enableDebugOutput) {
    args.push("--verbose");
  }

  return args;
}

/**
 * Get preload models if specified
 */
export function getPreloadModels(config) {
  return config.models?.preloadModels || [];
}

/**
 * Get startup options
 */
export function getStartupOptions(config) {
  return {
    autoStart: config.startup?.autoStart || false,
    timeout: config.startup?.timeout || 30000,
    retryAttempts: config.startup?.retryAttempts || 3,
    retryDelay: config.startup?.retryDelay || 2000,
  };
}
```

### Startup Sequence

```
1. Load config from llama-router.init.json
   ↓
2. Validate configuration
   ↓
3. Check models directory
   ↓
4. Start llama-server with router flags (if autoStart=true)
   ↓
5. Wait for API readiness (health check)
   ↓
6. Preload specified models (optional)
   ↓
7. Server ready for requests
```

### Environment Variables Alternative

```bash
export LLAMA_ROUTER_PORT=8134
export LLAMA_MODELS_DIR=/path/to/models
export LLAMA_MODELS_MAX=4
export LLAMA_CONTEXT_SIZE=8192
export LLAMA_GPU_LAYERS=99
export LLAMA_AUTO_START=true
```

---

## Metrics Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Llama Proxy Dashboard                 │
│  (Existing Node.js + Express + Socket.IO)            │
├─────────────────────────────────────────────────────────────┤
│  Dashboard UI                                           │
│  - System Metrics (CPU, Memory, GPU)                     │
│  - Model Management                                         │
│  - Logs Viewer                                           │
│  - llama-server Metrics (NEW)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Process Manager │
                    │  (NEW MODULE)    │
                    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │     llama-server Process      │
                    │     (Child Process)          │
                    │     HTTP: 8080            │
                    │     + Metrics API            │
                    └──────────────────────────────┘
```

### Process Manager Module

**File**: `server/handlers/llama-router/process-manager.js`

```javascript
/**
 * Process Manager for llama-server
 * Handles spawning, monitoring, and cleanup of llama-server child process
 */

import { spawn, ChildProcess } from "child_process";

export class LlamaServerProcessManager {
  constructor(config) {
    this.config = config;
    this.process = null;
    this.stdoutLines = [];
    this.stderrLines = [];
    this.metrics = null;
    this.isRunning = false;
    this.startTime = null;
    this.pid = null;
  }

  /**
   * Start llama-server as child process
   */
  async start() {
    if (this.isRunning) {
      console.log("[DEBUG] llama-server already running, PID:", this.pid);
      return this.process;
    }

    const args = this._buildArgs();
    console.log("[DEBUG] Starting llama-server with args:", args);

    this.process = spawn("llama-server", args, {
      cwd: this.config.baseModelsPath,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        LLAMA_METRICS_ENABLED: "1",
      },
    });

    this.pid = this.process.pid;
    this.startTime = Date.now();
    this.isRunning = true;

    // Capture stdout
    this.process.stdout.on("data", (data) => {
      const line = data.toString();
      this.stdoutLines.push(line);
      this._parseOutput(line, "stdout");
    });

    // Capture stderr
    this.process.stderr.on("data", (data) => {
      const line = data.toString();
      this.stderrLines.push(line);
      this._parseOutput(line, "stderr");
    });

    // Handle process exit
    this.process.on("exit", (code, signal) => {
      console.log("[DEBUG] llama-server exited:", { code, signal });
      this.isRunning = false;
      this._cleanup();
    });

    return this.process;
  }

  /**
   * Stop llama-server process
   */
  async stop() {
    if (!this.isRunning) {
      console.log("[DEBUG] llama-server not running");
      return;
    }

    console.log("[DEBUG] Stopping llama-server, PID:", this.pid);

    // Try graceful shutdown first
    if (this.process.kill("SIGTERM")) {
      await new Promise((r) => setTimeout(r, 5000));
      if (this.isRunning) {
        console.warn("[DEBUG] Force killing llama-server");
        this.process.kill("SIGKILL");
      }
    }

    this.isRunning = false;
    this._cleanup();
  }

  /**
   * Check if process is running
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: this.pid,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      metrics: this.metrics,
    };
  }

  /**
   * Build command-line arguments for llama-server
   */
  _buildArgs() {
    const args = [];
    args.push("--models-dir", this.config.baseModelsPath);
    args.push("--models-max", String(this.config.modelsMax || 4));
    args.push("--port", String(this.config.port || 8080));
    args.push("--host", this.config.host || "0.0.0.0");

    if (this.config.ctxSize) args.push("--ctx-size", String(this.config.ctxSize));
    if (this.config.batchSize) args.push("--batch-size", String(this.config.batchSize));
    if (this.config.threads) args.push("--threads", String(this.config.threads));
    if (this.config.ngl) args.push("-ngl", String(this.config.ngl));

    args.push("--verbose");
    return args;
  }

  /**
   * Parse output for metrics and logs
   */
  _parseOutput(line, source) {
    const logEntry = {
      level: source === "stderr" ? "error" : "info",
      message: line,
      source: "llama-server",
      timestamp: Date.now(),
    };

    if (global.io) {
      global.io.emit("logs:entry", {
        type: "broadcast",
        data: { entry: logEntry },
      });
    }

    this._tryParseMetrics(line);
  }

  /**
   * Cleanup resources
   */
  _cleanup() {
    if (this.process) {
      this.process.stdout.destroy();
      this.process.stderr.destroy();
    }
  }
}
```

### Socket.IO Process Handlers

**File**: `server/handlers/llama-router/process-handlers.js`

```javascript
/**
 * llama-server process control handlers
 */

export function registerProcessHandlers(socket, io, db, processManager) {
  /**
   * Start llama-server
   */
  socket.on("llama-server:start", async (req) => {
    const id = req?.requestId || Date.now();
    try {
      const config = db.getConfig();
      await processManager.start();
      ok(socket, "llama-server:start:result", {
        pid: processManager.pid,
        message: "llama-server started successfully",
      }, id);

      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "running",
          pid: processManager.pid,
          uptime: 0,
          metrics: processManager.metrics,
        },
      });
    } catch (e) {
      err(socket, "llama-server:start:result", e.message, id);
    }
  });

  /**
   * Stop llama-server
   */
  socket.on("llama-server:stop", async (req) => {
    const id = req?.requestId || Date.now();
    try {
      await processManager.stop();
      ok(socket, "llama-server:stop:result", {
        message: "llama-server stopped successfully",
      }, id);

      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "stopped",
          pid: null,
          uptime: 0,
          metrics: null,
        },
      });
    } catch (e) {
      err(socket, "llama-server:stop:result", e.message, id);
    }
  });

  /**
   * Get llama-server status
   */
  socket.on("llama-server:status", async (req) => {
    const id = req?.requestId || Date.now();
    try {
      const status = processManager.getStatus();
      ok(socket, "llama-server:status:result", status, id);
    } catch (e) {
      err(socket, "llama-server:status:result", e.message, id);
    }
  });
}
```

### Metrics Scraper

**File**: `server/handlers/llama-router/metrics-scraper.js`

```javascript
/**
 * llama-server Metrics Scraper
 * Scrapes llama-server API endpoints for metrics
 */

import http from "http";

export class LlamaServerMetricsScraper {
  constructor(config) {
    this.baseUrl = `http://${config.host || "localhost"}:${config.port || 8080}`;
    this.cache = new Map();
    this.cacheTTL = 5000; // 5 seconds
  }

  /**
   * Get metrics from llama-server API
   */
  async getMetrics() {
    try {
      const cached = this.cache.get("metrics");
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      const endpoints = ["/metrics", "/health", "/stats", "/v1/metrics"];

      for (const endpoint of endpoints) {
        try {
          const data = await this._fetchEndpoint(endpoint);
          if (data) {
            this.cache.set("metrics", { data, timestamp: Date.now() });
            return data;
          }
        } catch (e) {
          console.log(`[DEBUG] Endpoint ${endpoint} not available:`, e.message);
        }
      }

      return null;
    } catch (e) {
      console.error("[METRICS-SCRAPER] Failed to get metrics:", e);
      return null;
    }
  }

  async _fetchEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 8080,
        path: url.pathname,
        method: "GET",
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (e) {
              resolve(this._parseTextMetrics(data));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(5000, () => req.destroy());
    });
  }

  _parseTextMetrics(text) {
    const metrics = {
      uptime: 0,
      activeModels: 0,
      totalRequests: 0,
      tokensPerSecond: 0,
      queueSize: 0,
    };

    const lines = text.split("\n");
    for (const line of lines) {
      const tokenMatch = line.match(/(\d+(?:\.\d+)?)\s+tokens\/s/);
      if (tokenMatch) metrics.tokensPerSecond = parseFloat(tokenMatch[1]);

      const modelMatch = line.match(/active\s+models?:\s*(\d+)/i);
      if (modelMatch) metrics.activeModels = parseInt(modelMatch[1]);

      const queueMatch = line.match(/queue\s+size?:\s*(\d+)/i);
      if (queueMatch) metrics.queueSize = parseInt(queueMatch[1]);
    }

    return metrics;
  }
}
```

---

## Router Card Management

### Unified Router Card Component

**File**: `public/js/components/router-card.js`

The Router Card is the main UI control for managing the llama router. It has been unified to work consistently across Dashboard and Settings pages.

### Router Card Layout

```
┌─────────────────────────────────────────────┐
│ 🦙 Llama Router                [STOPPED]   │
├─────────────────────────────────────────────┤
│ [📋 Select Preset...] [▶ Start Router] [🔄]│
└─────────────────────────────────────────────┘
```

When preset selected:

```
┌─────────────────────────────────────────────┐
│ 🦙 Llama Router                [STOPPED]   │
├─────────────────────────────────────────────┤
│ [📋 fast-inference ▼] [▶ Start with Preset] │
└─────────────────────────────────────────────┘
```

### Features

- ✅ Preset Selection Dropdown - Shows all available presets
- ✅ Integrated Controls - All buttons in one row
- ✅ Smart Disabling - Launch button only enabled when preset selected
- ✅ Loading States - Visual feedback during operations
- ✅ Conditional Rendering - Preset controls hidden if no presets exist
- ✅ Real-time Status - Updates immediately on both Dashboard and Settings

### Smart Start Button Logic

```javascript
async handleStart(event) {
  event.preventDefault();
  event.stopPropagation();
  this.state.routerLoading = true;
  this._updateUI();

  // If preset selected, launch with preset; otherwise start normally
  if (this.state.selectedPreset) {
    await this.handleLaunchPreset(event);
  } else {
    this.state.onAction("start");
  }
}
```

### Dynamic Button Text

```javascript
this.state.routerLoading
  ? "▶ Starting..."
  : this.state.selectedPreset
    ? "▶ Start with Preset"
    : "▶ Start Router";
```

### Event Map

```javascript
{
  "click [data-action=start]": "handleStart",
  "click [data-action=stop]": "handleStop",
  "click [data-action=restart]": "handleRestart",
  "change #preset-select": "handlePresetChange",
}
```

### Usage in Dashboard

```javascript
Component.h(window.RouterCard, {
  status: this.state.status,
  routerStatus: this.state.routerStatus,
  models: this.state.models,
  configPort: this.state.configPort,
  presets: this.state.presets,
  maxModelsLoaded: this.state.maxModelsLoaded,
  ctxSize: this.state.ctxSize,
  onAction: (action) => this.props.controller?.handleRouterAction(action),
});
```

### Usage in Settings

```javascript
Component.h(window.RouterCard, {
  status: this.state.llamaStatus,
  routerStatus: this.state.routerStatus,
  models: this.state.models || [],
  configPort: this.state.port,
  presets: this.state.presets,
  maxModelsLoaded: this.state.maxModelsLoaded,
  ctxSize: this.state.ctx_size,
  onAction: (action) => {
    this.props.controller?.handleRouterAction(action);
  },
});
```

### State Management

```javascript
state = {
  status,              // Current router status
  routerStatus,        // Router models status
  presets,             // Available presets
  selectedPreset,      // Selected preset for launch
  routerLoading,       // Loading state during operations
  maxModelsLoaded,     // Max models for preset launch
  ctxSize,             // Context size for preset launch
};
```

---

## Configuration Examples

### Example 1: Fast Chatbot Preset

```ini
[*]
jinja = true
chat-template = deepseek
reasoning-budget = -1
ctx-size = 8192
temp = 0.7
n-gpu-layers = 33

[fast-model]
model-alias = fast-chatbot
```

### Example 2: Router Mode with Multiple Models

```ini
[*]
models-dir = ./models
models-max = 4
models-autoload = true
threads-http = 4
jinja = true
chat-template = llama3

[model-group-1]
model-alias = inference-fast
n-gpu-layers = 20

[model-group-2]
model-alias = inference-quality
n-gpu-layers = 40
ctx-size = 16384
```

### Example 3: Custom Jinja Template

```ini
[custom-model]
model = ./models/my-model.gguf
jinja = true
chat-template-file = ./templates/my-template.jinja
cache-type-k = q4
cache-type-v = q4
ctx-size = 4096
```

### Example 4: Low Memory Configuration

```ini
[*]
models-dir = ./models
models-max = 2
batch = 256
ubatch = 256
ctx-size = 2048
n-gpu-layers = 10

[small-model]
model-alias = tiny-model
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Check `lsof -i :8134` and update port in config |
| Models not discovered | Verify `models.directory` is correct and contains `.gguf` files |
| Memory issues | Reduce `models.maxLoaded` or increase VRAM |
| Slow startup | Reduce preload models or increase startup timeout |
| Request failures | Check `--np` and `--threads-http` values |

### Best Practices

1. **Configuration Validation**
   - Always validate paths exist
   - Check port availability before startup
   - Validate performance settings are reasonable

2. **Error Handling**
   - Wrap init in try-catch
   - Provide clear error messages
   - Log initialization steps with `[ROUTER-INIT]` prefix

3. **Logging**
   - Use consistent logging format: `[ROUTER-INIT]`
   - Log configuration values (sanitized)
   - Log startup timing information

4. **Performance Tuning**
   - `--np`: Match CPU cores for best throughput
   - `--threads-http`: Set to 2-4 for concurrent requests
   - `-ngl`: Maximum for your GPU memory
   - `--models-max`: Based on VRAM available

5. **Memory Management**
   - Monitor LRU eviction with debug logs
   - Preload frequently-used models
   - Monitor `/metrics` for memory trends

---

## Consolidated From

This document consolidates information from the following files:

1. LLAMA_ROUTER_INIT_GUIDE.md
2. LLAMA_SERVER_METRICS_IMPLEMENTATION_PLAN.md
3. ROUTER_CARD_CONSOLIDATION_COMPLETE.md
4. ROUTER_CARD_RESTORED.md

---

**Last Updated**: 2026-01-11
**Status**: ✅ Ready for Use
