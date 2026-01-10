# Consolidated INI & WebSocket Integration Guide

Complete reference for INI file configuration, WebSocket event handling, and Jinja parameter integration with the Llama Proxy Dashboard.

## Table of Contents

1. [INI File Configuration](#ini-file-configuration)
2. [WebSocket Events Reference](#websocket-events-reference)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Service](#frontend-service)
5. [Jinja Parameters](#jinja-parameters)
6. [Usage Examples](#usage-examples)
7. [Data Type Conversions](#data-type-conversions)
8. [Error Handling](#error-handling)

---

## INI File Configuration

### Overview

All INI file operations go through Socket.IO events:

```
Frontend → WebSocket Event → Server Handler → File System → WebSocket Response → Frontend
```

### INI File Location

```
config/
├── preset1.ini      Created by you
├── preset2.ini      Created by you
└── ...
```

### INI File Format

```ini
LLAMA_CONFIG_VERSION = 1

[model-name]
model = ./models/model.gguf
ctx-size = 8192
temp = 0.7
n-gpu-layers = 99
threads = 8
batch = 512
```

### INI Structure

Each `.ini` file contains:

- Preset name as filename
- INI format with model sections
- Full model configurations
- Ready to use with llama-server

### INI Parameters Reference

| Parameter | INI Key | Type | Default | Description |
|-----------|---------|------|---------|-------------|
| Model path | `model` | string | - | Path to GGUF file |
| Context size | `ctx-size` | number | 2048 | Context window size |
| Temperature | `temp` | number | 0.7 | Generation temperature |
| GPU layers | `n-gpu-layers` | number | 0 | Layers offloaded to GPU |
| Threads | `threads` | number | 0 | CPU threads |
| Batch size | `batch` | number | 512 | Batch processing size |
| UBatch size | `ubatch` | number | 512 | Micro-batch size |
| Tensor split | `tensor-split` | string | - | Multi-GPU split |
| MMP | `mmp` | string | - | Multimodal projector path |

### Jinja Parameters

| Parameter | INI Key | Type | Description |
|-----------|---------|------|-------------|
| Enable Jinja | `jinja` | boolean | Enable template engine |
| Chat template | `chat-template` | string | Predefined template name |
| Template file | `chat-template-file` | string | Custom template path |
| Reasoning format | `reasoning-format` | string | Reasoning output format |
| Reasoning budget | `reasoning-budget` | number | Max reasoning tokens |
| Thinking forced | `thinking-forced-open` | boolean | Force reasoning display |

### Router Parameters

| Parameter | INI Key | Type | Description |
|-----------|---------|------|-------------|
| Models directory | `models-dir` | string | Auto-discovery directory |
| Max models | `models-max` | number | Concurrent loaded models |
| Auto-load | `models-autoload` | boolean | Load on first request |
| Model alias | `model-alias` | string | Friendly name |
| Slot save path | `slot-save-path` | string | KV cache save path |
| Cache type K | `cache-type-k` | string | KV cache quantization (K) |
| Cache type V | `cache-type-v` | string | KV cache quantization (V) |

---

## WebSocket Events Reference

### Event Types (10 Total)

#### CRUD Operations

| Event | Direction | Description |
|-------|-----------|-------------|
| `presets:list` | Client → Server | List all preset files |
| `presets:read` | Client → Server | Read specific INI file |
| `presets:create` | Client → Server | Create new INI file |
| `presets:save` | Client → Server | Save INI file |
| `presets:delete` | Client → Server | Delete INI file |

#### Model Operations

| Event | Direction | Description |
|-------|-----------|-------------|
| `presets:get-models` | Client → Server | Get all model configs from INI |
| `presets:add-model` | Client → Server | Add model to INI |
| `presets:update-model` | Client → Server | Update model config in INI |
| `presets:remove-model` | Client → Server | Remove model from INI |

#### Validation

| Event | Direction | Description |
|-------|-----------|-------------|
| `presets:validate` | Client → Server | Validate INI syntax |

### Standard Response Format

```javascript
{
  success: boolean,      // true or false
  data?: any,            // result data (only if success=true)
  error?: {
    message: string,     // error message
    code?: string        // error code (optional)
  },                     // only if success=false
  timestamp: string      // ISO timestamp
}
```

### Event Payloads

#### presets:list

```javascript
// Request
socket.emit("presets:list", {});

// Response
{
  success: true,
  data: {
    presets: [
      { name: "fast-inference", path: "fast-inference.ini", file: "/path/to/fast-inference.ini" },
      { name: "gpu-heavy", path: "gpu-heavy.ini", file: "/path/to/gpu-heavy.ini" }
    ]
  },
  timestamp: "2026-01-11T10:30:00.000Z"
}
```

#### presets:read

```javascript
// Request
socket.emit("presets:read", { filename: "fast-inference" });

// Response
{
  success: true,
  data: {
    filename: "fast-inference",
    content: "LLAMA_CONFIG_VERSION = 1\n\n[model1]...",
    parsed: {
      "LLAMA_CONFIG_VERSION": { "1": "" },
      "model1": { "model": "./models/model1.gguf", "ctx-size": "8192" }
    }
  },
  timestamp: "2026-01-11T10:30:00.000Z"
}
```

#### presets:create

```javascript
// Request
socket.emit("presets:create", { filename: "my-preset", description: "My custom preset" });

// Response
{
  success: true,
  data: { filename: "my-preset", path: "/path/to/my-preset.ini" },
  timestamp: "2026-01-11T10:30:00.000Z"
}
```

#### presets:save

```javascript
// Request
socket.emit("presets:save", {
  filename: "my-preset",
  config: {
    "LLAMA_CONFIG_VERSION": { "1": "" },
    "model1": { "model": "./models/model.gguf", "ctx-size": "4096" }
  }
});

// Response
{
  success: true,
  data: { filename: "my-preset", path: "/path/to/my-preset.ini" },
  timestamp: "2026-01-11T10:30:00.000Z"
}
```

#### presets:validate

```javascript
// Request
socket.emit("presets:validate", {
  content: "LLAMA_CONFIG_VERSION = 1\n\n[model]\nmodel = ./test.gguf"
});

// Response
{
  success: true,
  data: { valid: true, errors: [] },
  timestamp: "2026-01-11T10:30:00.000Z"
}
```

---

## Backend Implementation

### INI Handler Module

**File**: `server/handlers/presets.js`

```javascript
/**
 * Socket.IO Handlers for .INI Configuration Presets
 * Manages llama.cpp router mode model configurations
 */

import fs from "fs";
import path from "path";
import { ok, err } from "./response.js";

const PRESETS_DIR = path.join(process.cwd(), "config");

// Ensure config directory exists
if (!fs.existsSync(PRESETS_DIR)) {
  fs.mkdirSync(PRESETS_DIR, { recursive: true });
}

/**
 * Parse INI file content
 */
function parseIni(content) {
  const result = {};
  let currentSection = null;

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";")) continue;

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      currentSection = trimmed.slice(1, -1);
      result[currentSection] = {};
      continue;
    }

    if (currentSection && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const k = key.trim();
      const v = valueParts.join("=").trim();
      result[currentSection][k] = v;
    }
  }

  return result;
}

/**
 * Generate INI file content
 */
function generateIni(config) {
  let content = "LLAMA_CONFIG_VERSION = 1\n\n";

  for (const [section, params] of Object.entries(config)) {
    if (section === "LLAMA_CONFIG_VERSION") continue;
    content += `[${section}]\n`;
    for (const [key, value] of Object.entries(params)) {
      content += `${key} = ${value}\n`;
    }
    content += "\n";
  }

  return content;
}

/**
 * Convert model config object to INI format
 */
function modelToIniSection(modelName, config) {
  const section = { model: config.model || "" };

  if (config.ctxSize) section["ctx-size"] = String(config.ctxSize);
  if (config.temperature !== undefined) section["temp"] = String(config.temperature);
  if (config.nGpuLayers !== undefined) section["n-gpu-layers"] = String(config.nGpuLayers);
  if (config.threads !== undefined) section["threads"] = String(config.threads);
  if (config.batchSize !== undefined) section["batch"] = String(config.batchSize);
  if (config.ubatchSize !== undefined) section["ubatch"] = String(config.ubatchSize);
  if (config.tensorSplit) section["tensor-split"] = config.tensorSplit;
  if (config.mmp) section["mmp"] = config.mmp;

  return section;
}

/**
 * Convert INI section to model config object
 */
function iniSectionToModel(section) {
  return {
    model: section.model || "",
    ctxSize: section["ctx-size"] ? parseInt(section["ctx-size"]) : 2048,
    temperature: section.temp ? parseFloat(section.temp) : 0.7,
    nGpuLayers: section["n-gpu-layers"] ? parseInt(section["n-gpu-layers"]) : 0,
    threads: section.threads ? parseInt(section.threads) : 0,
    batchSize: section.batch ? parseInt(section.batch) : 512,
    ubatchSize: section.ubatch ? parseInt(section.ubatch") : 512,
    tensorSplit: section["tensor-split"] || null,
    mmp: section.mmp || null,
  };
}

/**
 * List all INI preset files
 */
function listPresets() {
  try {
    if (!fs.existsSync(PRESETS_DIR)) {
      return [];
    }

    const files = fs.readdirSync(PRESETS_DIR);
    return files
      .filter((f) => f.endsWith(".ini"))
      .map((f) => ({
        name: f.replace(".ini", ""),
        path: f,
        file: path.join(PRESETS_DIR, f),
      }));
  } catch (error) {
    throw new Error(`Failed to list presets: ${error.message}`);
  }
}

/**
 * Read INI file
 */
function readPreset(filename) {
  try {
    const filepath = path.join(PRESETS_DIR, `${filename}.ini`);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Preset file not found: ${filename}`);
    }

    const content = fs.readFileSync(filepath, "utf-8");
    const parsed = parseIni(content);

    return { filename, content, parsed };
  } catch (error) {
    throw new Error(`Failed to read preset: ${error.message}`);
  }
}

/**
 * Save INI file
 */
function savePreset(filename, config) {
  try {
    const filepath = path.join(PRESETS_DIR, `${filename}.ini`);
    const content = generateIni(config);
    fs.writeFileSync(filepath, content, "utf-8");
    return { filename, path: filepath };
  } catch (error) {
    throw new Error(`Failed to save preset: ${error.message}`);
  }
}

/**
 * Delete INI file
 */
function deletePreset(filename) {
  try {
    const filepath = path.join(PRESETS_DIR, `${filename}.ini`);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Preset file not found: ${filename}`);
    }

    fs.unlinkSync(filepath);
    return { filename };
  } catch (error) {
    throw new Error(`Failed to delete preset: ${error.message}`);
  }
}

/**
 * Validate INI syntax
 */
function validateIni(content) {
  const errors = [];

  try {
    const parsed = parseIni(content);

    for (const [section, params] of Object.entries(parsed)) {
      if (!params.model) {
        errors.push(`[${section}]: Missing required 'model' parameter`);
      }

      const numericKeys = ["ctx-size", "n-gpu-layers", "threads", "batch", "ubatch", "temp"];
      for (const key of numericKeys) {
        if (params[key]) {
          const value = key === "temp" ? parseFloat(params[key]) : parseInt(params[key]);
          if (isNaN(value)) {
            errors.push(`[${section}]: Invalid ${key} value: ${params[key]}`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    return { valid: false, errors: [`Parse error: ${error.message}`] };
  }
}

/**
 * Get all models from a preset
 */
function getModelsFromPreset(filename) {
  try {
    const { parsed } = readPreset(filename);
    const models = {};

    for (const [section, params] of Object.entries(parsed)) {
      if (section === "LLAMA_CONFIG_VERSION") continue;
      models[section] = iniSectionToModel(params);
    }

    return models;
  } catch (error) {
    throw new Error(`Failed to get models: ${error.message}`);
  }
}

/**
 * Add or update model in preset
 */
function updateModelInPreset(filename, modelName, config) {
  try {
    const preset = readPreset(filename);
    const iniSection = modelToIniSection(modelName, config);
    preset.parsed[modelName] = iniSection;
    savePreset(filename, preset.parsed);

    return { filename, modelName, config: iniSectionToModel(iniSection) };
  } catch (error) {
    throw new Error(`Failed to update model: ${error.message}`);
  }
}

/**
 * Remove model from preset
 */
function removeModelFromPreset(filename, modelName) {
  try {
    const preset = readPreset(filename);

    if (!preset.parsed[modelName]) {
      throw new Error(`Model not found: ${modelName}`);
    }

    delete preset.parsed[modelName];
    savePreset(filename, preset.parsed);

    return { filename, modelName };
  } catch (error) {
    throw new Error(`Failed to remove model: ${error.message}`);
  }
}

/**
 * Register Socket.IO handlers
 */
export function registerPresetsHandlers(socket, db) {
  socket.on("presets:list", (data, callback) => {
    try {
      const presets = listPresets();
      callback(ok({ presets }));
    } catch (error) {
      callback(err(error.message));
    }
  });

  socket.on("presets:read", (data, callback) => {
    try {
      const { filename } = data;
      const preset = readPreset(filename);
      callback(ok(preset));
    } catch (error) {
      callback(err(error.message));
    }
  });

  socket.on("presets:get-models", (data, callback) => {
    try {
      const { filename } = data;
      const models = getModelsFromPreset(filename);
      callback(ok({ models }));
    } catch (error) {
      callback(err(error.message));
    }
  });

  socket.on("presets:save", (data, callback) => {
    try {
      const { filename, config } = data;
      const result = savePreset(filename, config);
      callback(ok(result));
    } catch (error) {
      callback(err(error.message));
    }
  });

  socket.on("presets:create", (data, callback) => {
    try {
      const { filename } = data;
      const config = { LLAMA_CONFIG_VERSION: "1" };
      const result = savePreset(filename, config);
      callback(ok(result));
    } catch (error) {
      callback(err(error.message));
    }
  });

  socket.on("presets:delete", (data, callback) => {
    try {
      const { filename } = data;
      const result = deletePreset(filename);
      callback(ok(result));
    } catch (error) {
      callback(err(error.message));
    }
  });

  socket.on("presets:validate", (data, callback) => {
    try {
      const { content } = data;
      const validation = validateIni(content);
      callback(ok(validation));
    } catch (error) {
      callback(err(error.message));
    }
  });

  socket.on("presets:add-model", (data, callback) => {
    try {
      const { filename, modelName, config } = data;
      const result = updateModelInPreset(filename, modelName, config);
      callback(ok(result));
    } catch (error) {
      callback(err(error.message));
    }
  });

  socket.on("presets:update-model", (data, callback) => {
    try {
      const { filename, modelName, config } = data;
      const result = updateModelInPreset(filename, modelName, config);
      callback(ok(result));
    } catch (error) {
      callback(err(error.message));
    }
  });

  socket.on("presets:remove-model", (data, callback) => {
    try {
      const { filename, modelName } = data;
      const result = removeModelFromPreset(filename, modelName);
      callback(ok(result));
    } catch (error) {
      callback(err(error.message));
    }
  });
}
```

### Register Handler in Main Handlers File

**File**: `server/handlers.js`

```javascript
// Add import
import { registerPresetsHandlers } from "./handlers/presets.js";

// In registerHandlers function
export function registerHandlers(io, db, ggufParser) {
  io.on("connection", (socket) => {
    registerPresetsHandlers(socket, db);
    // ... other handlers
  });
}
```

---

## Frontend Service

### PresetsService Class

**File**: `public/js/services/presets.js`

```javascript
/**
 * Preset Configuration Service
 * Handles communication with backend for INI file management
 */

class PresetsService {
  constructor(socket) {
    this.socket = socket;
  }

  /**
   * List all preset files
   */
  listPresets() {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:list", {}, (response) => {
        if (response.success) {
          resolve(response.data.presets);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Read preset file
   */
  readPreset(filename) {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:read", { filename }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Save preset file
   */
  savePreset(filename, config) {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:save", { filename, config }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Create new preset
   */
  createPreset(filename, description) {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:create", { filename, description }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Delete preset
   */
  deletePreset(filename) {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:delete", { filename }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Validate INI syntax
   */
  validateIni(content) {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:validate", { content }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Get all models from preset
   */
  getModelsFromPreset(filename) {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:get-models", { filename }, (response) => {
        if (response.success) {
          resolve(response.data.models);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Add model to preset
   */
  addModel(filename, modelName, config) {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:add-model", { filename, modelName, config }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Update model in preset
   */
  updateModel(filename, modelName, config) {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:update-model", { filename, modelName, config }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Remove model from preset
   */
  removeModel(filename, modelName) {
    return new Promise((resolve, reject) => {
      this.socket.emit("presets:remove-model", { filename, modelName }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }
}

export default PresetsService;
```

---

## Jinja Parameters

### Chat Template Options

Available templates for `chat-template` parameter:

| Template | Description |
|----------|-------------|
| `chatml` | ChatML format |
| `llama2` | Llama 2 chat format |
| `llama3` | Llama 3 chat format |
| `llama3-1` | Llama 3.1 chat format |
| `llama3-2` | Llama 3.2 chat format |
| `mistral` | Mistral AI format |
| `phi` | Phi series format |
| `phi3` | Phi-3 format |
| `phi4` | Phi-4 format |
| `gemma` | Gemma format |
| `zephyr` | Zephyr format |
| `deepseek` | DeepSeek format |
| `qwen` | Qwen format |
| `openchat` | OpenChat format |
| `neural-chat` | Neural Chat format |
| `stablelm` | StableLM format |
| `cohere` | Command R format |
| `command` | Command R+ format |

### Reasoning Format Options

| Option | Description |
|--------|-------------|
| `default` | No reasoning (standard output) |
| `deepseek` | DeepSeek reasoning format |
| `none` | Raw output without reasoning wrapper |

### Example: Enable Jinja with DeepSeek Reasoning

```ini
[deepseek-model]
model = ./models/deepseek-r1-distill-llama-8b.gguf
jinja = true
chat-template = deepseek
reasoning-format = deepseek
reasoning-budget = -1
n-gpu-layers = 33
```

### Example: Custom Jinja Template

```ini
[custom-model]
model = ./models/my-model.gguf
jinja = true
chat-template-file = ./templates/my-template.jinja
cache-type-k = q4
cache-type-v = q4
```

---

## Usage Examples

### Pattern 1: List and Display Presets

```javascript
try {
  const presets = await service.listPresets();

  presets.forEach((preset) => {
    console.log(`${preset.name} - ${preset.file}`);
  });
} catch (error) {
  console.error(error.message);
}
```

### Pattern 2: Load Preset Models

```javascript
try {
  const models = await service.getModelsFromPreset("default");

  for (const [name, config] of Object.entries(models)) {
    console.log(`${name}: ${config.model}`);
  }
} catch (error) {
  console.error(error.message);
}
```

### Pattern 3: Create and Configure Preset

```javascript
// 1. Create new preset
await service.createPreset("my-models");

// 2. Add first model
await service.addModel("my-models", "gemma-4b", {
  model: "./models/gemma-4b.gguf",
  ctxSize: 8192,
  temperature: 0.7,
  nGpuLayers: 99,
});

// 3. Add second model
await service.addModel("my-models", "llama-70b", {
  model: "./models/llama-70b.gguf",
  ctxSize: 4096,
  temperature: 0.8,
  nGpuLayers: 50,
  tensorSplit: "0.5,0.5",
});

// 4. Verify
const models = await service.getModelsFromPreset("my-models");
console.log(models);
```

### Pattern 4: Modify and Save

```javascript
try {
  const preset = await service.readPreset("default");

  preset.parsed["new-model"] = {
    model: "./models/new.gguf",
    "ctx-size": "8192",
    temp: "0.7",
  };

  await service.savePreset("default", preset.parsed);
} catch (error) {
  console.error(error.message);
}
```

### Pattern 5: Create from Template

```javascript
const createPresetFromTemplate = async (name, template) => {
  try {
    await service.createPreset(name);

    for (const [modelName, config] of Object.entries(template)) {
      await service.addModel(name, modelName, config);
    }

    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
};

const gpuHeavyTemplate = {
  "large-model": { model: "./models/llama-70b.gguf", ctxSize: 4096, nGpuLayers: 99 },
  "tiny-model": { model: "./models/tinyllama.gguf", ctxSize: 2048, nGpuLayers: 99 },
};

await createPresetFromTemplate("gpu-heavy", gpuHeavyTemplate);
```

---

## Data Type Conversions

### JavaScript Config Object → INI Section

```javascript
// JavaScript config
{
  model: "./models/model.gguf",      // string
  ctxSize: 8192,                     // number
  temperature: 0.7,                  // number
  nGpuLayers: 99,                    // number
  threads: 8,                        // number
  batchSize: 512,                    // number
  ubatchSize: 512,                   // number
  tensorSplit: "0.5,0.5",            // string (optional)
  mmp: "./mmproj.gguf"              // string (optional)
}
```

```ini
; INI section
[model-name]
model = ./models/model.gguf
ctx-size = 8192
temp = 0.7
n-gpu-layers = 99
threads = 8
batch = 512
ubatch = 512
tensor-split = 0.5,0.5
mmp = ./mmproj.gguf
```

**Key Differences:**
- JavaScript uses camelCase (ctxSize, nGpuLayers)
- INI uses kebab-case (ctx-size, n-gpu-layers)
- Service handles conversion automatically
- Numeric values stored as strings in INI

---

## Error Handling

### Standard Error Responses

| Error Message | Cause |
|---------------|-------|
| `Preset file not found` | INI file doesn't exist |
| `Failed to read preset` | File read error |
| `Invalid INI syntax` | Parse error |
| `Missing required 'model' parameter` | Model path not specified |
| `Invalid numeric value` | Non-numeric value in number field |

### Try-Catch Pattern

```javascript
try {
  const preset = await service.readPreset("nonexistent");
} catch (error) {
  // error.message = "Failed to read preset: Preset file not found: nonexistent"
  showNotification(error.message, "error");
}
```

### Validation Errors

```javascript
try {
  const validation = await service.validateIni(content);

  if (!validation.valid) {
    validation.errors.forEach((err) => {
      console.error(err);
      // "[model]: Missing required 'model' parameter"
      // "[model]: Invalid ctx-size value: abc"
    });
  }
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

---

## File Structure

```
project-root/
├── config/                          # INI preset files (auto-created)
│   ├── default.ini
│   ├── gpu-heavy.ini
│   └── balanced.ini
│
├── server/
│   ├── handlers.js                  # Registers presets handlers
│   └── handlers/
│       ├── presets.js               # Backend handler
│       └── response.js
│
├── public/js/
│   ├── services/
│   │   ├── presets.js               # Frontend service
│   │   ├── socket.js
│   │   └── ...
│   └── app.js
│
└── docs/
    └── CONSOLIDATED_INI.md          # This document
```

---

## Consolidated From

This document consolidates information from the following files:

1. INI_WEBSOCKET_INTEGRATION.md
2. WEBSOCKET_INI_REFERENCE.md
3. JINJA_PARAMETERS_COMPLETE.md
4. JINJA_PARAMS_ADDED.md

---

**Last Updated**: 2026-01-11
**Status**: ✅ Ready for Use
