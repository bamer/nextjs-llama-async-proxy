# Llama Router Initialization Integration Guide

## Overview

This guide explains how to properly integrate an initialization file for llama-router in your Vanilla JavaScript Llama Proxy Dashboard application. Router mode allows managing multiple AI models in a single server process with on-demand loading/unloading.

---

## What is Llama Router Mode?

**Router Mode** is a feature in llama.cpp that:
- Runs a **single server process** managing multiple models
- **Auto-discovers** models from a directory
- Loads/unloads models **on-demand** (LRU eviction when max reached)
- Routes requests to the correct model **automatically**
- Eliminates need for multiple server processes (unlike API mode)

### Key Benefits

| Feature | Router Mode | API Mode |
|---------|-----------|----------|
| Multiple Models | ✓ Single server | ✗ Multiple servers |
| Dynamic Loading | ✓ On-demand | ✗ Restart required |
| Memory Efficient | ✓ LRU eviction | ✗ All loaded |
| Port Management | ✓ Single port | ✗ Multiple ports |

---

## Current Architecture

Your project uses:
- **Backend**: Node.js + Express + Socket.IO
- **Configuration**: `llama-server-config.json`
- **Router Module**: `/server/handlers/llama-router/`
- **Entry Point**: `server.js`

### Current Config Structure
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

---

## Router Mode CLI Flags

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

| Flag | Purpose | Default |
|------|---------|---------|
| `--models-dir` | Directory with GGUF files | `~/.cache/llama.cpp` |
| `--models-max` | Max concurrent models | 4 |
| `-c` | Context size per model | 512 |
| `-ngl` | GPU layers to offload | 0 |
| `--np` | Parallel processing slots | 1 |
| `--threads-http` | HTTP threads for requests | 1 |
| `--port` | Server port | 8080 |

### Example Full Command
```bash
llama-server \
  --models-dir ./models \
  --models-max 4 \
  -c 8192 \
  -ngl 99 \
  --np 4 \
  --threads-http 4 \
  --port 8134
```

---

## Proposed Init File Structure

### Option 1: JSON Config (`llama-router.init.json`)

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

### Option 2: JavaScript Config Module (`llama-router-config.js`)

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

---

## Integration Steps

### Step 1: Create Init File

Create `llama-router.init.json` at project root:

```bash
cp llama-server-config.json llama-router.init.json
```

Then enhance with router-specific settings.

### Step 2: Create Init Loader Module

Create `/server/handlers/llama-router/init.js`:

```javascript
/**
 * Llama Router Initialization
 * Load and validate router configuration
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load router configuration from init file
 */
export function loadRouterConfig(initFilePath = null) {
  const configPath = 
    initFilePath || 
    path.join(process.cwd(), "llama-router.init.json");
  
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
  // Validate required fields
  if (!config.router?.port) {
    throw new Error("Missing router.port in configuration");
  }
  
  if (!config.models?.directory) {
    throw new Error("Missing models.directory in configuration");
  }
  
  // Validate paths exist
  if (!fs.existsSync(config.models.directory)) {
    throw new Error(`Models directory not found: ${config.models.directory}`);
  }
  
  // Validate performance settings
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
    "--models-dir", config.models.directory,
    "--models-max", String(config.models.maxLoaded || 4),
    "-c", String(config.performance.contextSize || 8192),
    "-b", String(config.performance.batchSize || 512),
    "-ngl", String(config.performance.gpuLayers || -1),
    "--np", String(config.performance.parallelSlots || 4),
    "--threads-http", String(config.performance.httpThreads || 4),
    "-t", String(config.performance.threads || -1),
    "--port", String(config.router.port || 8134),
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

### Step 3: Update Router Start Module

Modify `/server/handlers/llama-router/start.js`:

```javascript
// Add to imports
import {
  loadRouterConfig,
  buildRouterArgs,
  getStartupOptions,
} from "./init.js";

// In startLlamaServerRouter function
export async function startLlamaServerRouter(config = null) {
  try {
    // Load from init file if config not provided
    let routerConfig = config;
    if (!routerConfig) {
      routerConfig = loadRouterConfig();
    }
    
    const args = buildRouterArgs(routerConfig);
    const startupOpts = getStartupOptions(routerConfig);
    
    console.log("[LLAMA] Starting router with args:", args);
    
    // ... rest of startup logic using args and startupOpts
  } catch (error) {
    console.error("[LLAMA-INIT] Failed to start:", error.message);
    throw error;
  }
}
```

### Step 4: Add Init Handler

Create `/server/handlers/router-init.js`:

```javascript
/**
 * Router Initialization Handlers
 * Socket.IO events for init operations
 */

import {
  loadRouterConfig,
  validateRouterConfig,
  buildRouterArgs,
} from "./llama-router/init.js";

export function registerRouterInitHandlers(socket, io) {
  /**
   * Load and validate router configuration
   */
  socket.on("router:init:load", async (data, callback) => {
    try {
      const config = loadRouterConfig(data.configPath);
      callback?.({
        success: true,
        config,
      });
    } catch (error) {
      callback?.({
        success: false,
        error: error.message,
      });
    }
  });
  
  /**
   * Validate router configuration
   */
  socket.on("router:init:validate", async (data, callback) => {
    try {
      validateRouterConfig(data.config);
      const args = buildRouterArgs(data.config);
      callback?.({
        success: true,
        args,
      });
    } catch (error) {
      callback?.({
        success: false,
        error: error.message,
      });
    }
  });
  
  /**
   * Get router configuration status
   */
  socket.on("router:init:status", async (data, callback) => {
    try {
      const config = loadRouterConfig();
      callback?.({
        success: true,
        config: {
          port: config.router.port,
          modelsDir: config.models.directory,
          maxLoaded: config.models.maxLoaded,
          contextSize: config.performance.contextSize,
          autoStart: config.startup.autoStart,
        },
      });
    } catch (error) {
      callback?.({
        success: false,
        error: error.message,
      });
    }
  });
}
```

---

## Frontend Integration

### Add Init UI Component

Create `/public/js/components/router-init-status.js`:

```javascript
class RouterInitStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      config: null,
      error: null,
    };
  }
  
  willMount() {
    this.loadInitStatus();
  }
  
  loadInitStatus() {
    stateManager.request("router:init:status", {}, (response) => {
      if (response.success) {
        this.setState({
          config: response.config,
          loading: false,
        });
      } else {
        this.setState({
          error: response.error,
          loading: false,
        });
      }
    });
  }
  
  render() {
    if (this.state.loading) {
      return Component.h("div", { className: "loading" }, "Loading router config...");
    }
    
    if (this.state.error) {
      return Component.h(
        "div",
        { className: "error" },
        "Error: " + this.state.error
      );
    }
    
    const config = this.state.config;
    
    return Component.h(
      "div",
      { className: "router-init-status" },
      Component.h("h3", {}, "Router Configuration"),
      Component.h("dl", {},
        Component.h("dt", {}, "Port:"),
        Component.h("dd", {}, config.port),
        Component.h("dt", {}, "Models Directory:"),
        Component.h("dd", {}, config.modelsDir),
        Component.h("dt", {}, "Max Loaded:"),
        Component.h("dd", {}, config.maxLoaded),
        Component.h("dt", {}, "Context Size:"),
        Component.h("dd", {}, config.contextSize),
        Component.h("dt", {}, "Auto-Start:"),
        Component.h("dd", {}, config.autoStart ? "Yes" : "No"),
      )
    );
  }
}
```

---

## Startup Sequence

### Recommended Boot Flow

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

### Implementation Example

```javascript
async function initializeRouter() {
  try {
    console.log("[INIT] Starting router initialization...");
    
    // Step 1: Load config
    const config = loadRouterConfig();
    console.log("[INIT] Configuration loaded");
    
    // Step 2: Validate
    validateRouterConfig(config);
    console.log("[INIT] Configuration validated");
    
    // Step 3: Check directory
    const modelsDir = config.models.directory;
    if (!fs.existsSync(modelsDir)) {
      throw new Error(`Models directory not found: ${modelsDir}`);
    }
    console.log("[INIT] Models directory accessible");
    
    // Step 4: Start router (if configured)
    if (config.startup.autoStart) {
      const startOpts = getStartupOptions(config);
      await startLlamaServerRouter(config);
      console.log("[INIT] Router started successfully");
    }
    
    // Step 5: Wait for readiness
    await waitForRouterReady(config.router.port, startOpts.timeout);
    console.log("[INIT] Router is ready");
    
    // Step 6: Preload models
    const preload = getPreloadModels(config);
    for (const model of preload) {
      await loadModel(model);
      console.log("[INIT] Preloaded:", model);
    }
    
    return { success: true, config };
  } catch (error) {
    console.error("[INIT] Initialization failed:", error);
    throw error;
  }
}
```

---

## Model Status Values

Router exposes these status values for models:

- **`loaded`** - Model is in memory and ready
- **`loading`** - Model is being loaded
- **`unloaded`** - Model on disk, not in memory
- **`error`** - Failed to load

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

## Environment Variables Alternative

For Docker/production deployments, support environment variables:

```bash
export LLAMA_ROUTER_PORT=8134
export LLAMA_MODELS_DIR=/path/to/models
export LLAMA_MODELS_MAX=4
export LLAMA_CONTEXT_SIZE=8192
export LLAMA_GPU_LAYERS=99
export LLAMA_AUTO_START=true
```

Update init loader to fallback to env vars:

```javascript
export function loadRouterConfig(initFilePath = null) {
  // Try env vars first
  if (process.env.LLAMA_ROUTER_PORT) {
    return {
      router: { port: parseInt(process.env.LLAMA_ROUTER_PORT) },
      models: { directory: process.env.LLAMA_MODELS_DIR },
      // ... etc
    };
  }
  
  // Fall back to file
  // ...
}
```

---

## Best Practices

### 1. Configuration Validation
- Always validate paths exist
- Check port availability before startup
- Validate performance settings are reasonable

### 2. Error Handling
- Wrap init in try-catch
- Provide clear error messages
- Log initialization steps with `[ROUTER-INIT]` prefix

### 3. Logging
- Use consistent logging format: `[ROUTER-INIT]`
- Log configuration values (sanitized)
- Log startup timing information

### 4. Performance Tuning
- `--np`: Match CPU cores for best throughput
- `--threads-http`: Set to 2-4 for concurrent requests
- `-ngl`: Maximum for your GPU memory
- `--models-max`: Based on VRAM available

### 5. Memory Management
- Monitor LRU eviction with debug logs
- Preload frequently-used models
- Monitor `/metrics` for memory trends

---

## Testing the Init System

```javascript
// Test config loading
import { loadRouterConfig } from "./server/handlers/llama-router/init.js";

const config = loadRouterConfig("./llama-router.init.json");
console.log("Loaded config:", config);

// Test arg building
import { buildRouterArgs } from "./server/handlers/llama-router/init.js";

const args = buildRouterArgs(config);
console.log("Generated args:", args);
```

---

## Migration Path

If upgrading from API mode:

1. Create new `llama-router.init.json`
2. Update `start.js` to use init loader
3. Test model loading/unloading
4. Monitor memory with new LRU eviction
5. Decommission old API-mode config

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Check `lsof -i :8134` and update port in config |
| Models not discovered | Verify `models.directory` is correct and contains `.gguf` files |
| Memory issues | Reduce `models.maxLoaded` or increase VRAM |
| Slow startup | Reduce preload models or increase startup timeout |
| Request failures | Check `--np` and `--threads-http` values |

---

## References

- [llama.cpp Router Mode Documentation](https://github.com/ggml-org/llama.cpp/blob/master/examples/server/README.md#router-mode)
- [llama.cpp GitHub Issues](https://github.com/ggml-org/llama.cpp/issues)
- [Local LLaMA Community Discussions](https://www.reddit.com/r/LocalLLaMA/)
