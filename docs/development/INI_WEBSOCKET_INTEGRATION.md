# INI File Configuration Integration via WebSocket

Complete guide for integrating llama.cpp router mode `.ini` file configuration management through Socket.IO.

## Architecture Overview

All INI file operations go through Socket.IO events:

```
Frontend → WebSocket Event → Server Handler → File System → WebSocket Response → Frontend
```

## Socket.IO Event Structure

### Backend Listens For (Client → Server)

```javascript
// Read operations
socket.on("presets:list", (data) => {}); // List all INI files
socket.on("presets:read", (data) => {}); // Read specific INI file
socket.on("presets:get-models", (data) => {}); // Get all model configs from INI

// Write operations
socket.on("presets:create", (data) => {}); // Create new INI file
socket.on("presets:save", (data) => {}); // Save INI file
socket.on("presets:delete", (data) => {}); // Delete INI file
socket.on("presets:validate", (data) => {}); // Validate INI syntax

// Model-specific operations
socket.on("presets:add-model", (data) => {}); // Add model to INI
socket.on("presets:update-model", (data) => {}); // Update model config in INI
socket.on("presets:remove-model", (data) => {}); // Remove model from INI
```

### Server Responds With (Server → Client)

Standard response format:

```javascript
{
  success: boolean,
  data?: any,
  error?: {
    message: string,
    code?: string
  },
  timestamp: string
}
```

## Implementation Steps

### 1. Create INI Handler Module

Create `server/handlers/presets.js`:

```javascript
/**
 * Socket.IO Handlers for .INI Configuration Presets
 * Manages llama.cpp router mode model configurations
 */

import fs from "fs";
import path from "path";
import { ok, err } from "./response.js";
import { logger } from "./logger.js";

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
    // Trim and skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";")) continue;

    // Section header
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      currentSection = trimmed.slice(1, -1);
      result[currentSection] = {};
      continue;
    }

    // Key-value pair
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
  const section = {
    model: config.model || "",
  };

  // Map common parameters
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

    return {
      filename,
      content,
      parsed,
    };
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

    logger.info(`Preset saved: ${filename}`);

    return {
      filename,
      path: filepath,
    };
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
    logger.info(`Preset deleted: ${filename}`);

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

    // Validate each section
    for (const [section, params] of Object.entries(parsed)) {
      if (!params.model) {
        errors.push(`[${section}]: Missing required 'model' parameter`);
      }

      // Validate numeric values
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

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Parse error: ${error.message}`],
    };
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

    logger.info(`Model updated in preset: ${filename}/${modelName}`);

    return {
      filename,
      modelName,
      config: iniSectionToModel(iniSection),
    };
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

    logger.info(`Model removed from preset: ${filename}/${modelName}`);

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
      const { filename, description } = data;
      const config = {
        LLAMA_CONFIG_VERSION: "1",
      };
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

### 2. Register Handler in Main Handlers File

Edit `server/handlers.js`:

```javascript
// Add import
import { registerPresetsHandlers } from "./handlers/presets.js";

// In registerHandlers function, add:
export function registerHandlers(io, db, ggufParser) {
  logger.setIo(io);
  logger.setDb(db);

  io.on("connection", (socket) => {
    const cid = socket.id;
    logger.info(`Client connected: ${cid}`);

    // Register all handler groups
    registerConnectionHandlers(socket, logger);
    registerModelsHandlers(socket, io, db, ggufParser);
    registerMetricsHandlers(socket, db);
    registerLogsHandlers(socket, db);
    registerConfigHandlers(socket, db);
    registerLlamaHandlers(socket, io, db);
    registerPresetsHandlers(socket, db); // ADD THIS LINE
  });
}
```

### 3. Create Frontend Service

Create `public/js/services/presets.js`:

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

### 4. Usage Example in Controller

```javascript
// In any controller
async loadPreset() {
  try {
    const models = await this.presetsService.getModelsFromPreset("my-preset");
    // Use models data
  } catch (error) {
    showNotification(error.message, "error");
  }
}
```

## File Structure

```
/project/
├── config/                           # INI preset files (auto-created)
│   ├── default.ini
│   ├── gpu-heavy.ini
│   └── balanced.ini
│
├── server/
│   └── handlers/
│       ├── presets.js               # NEW: INI handler
│       └── ...
│
├── public/js/
│   ├── services/
│   │   ├── presets.js               # NEW: Frontend service
│   │   └── ...
│   └── ...
```

## Example INI File Format

```ini
LLAMA_CONFIG_VERSION = 1

[gemma-4b-vision]
model = ./models/gemma-4b.gguf
ctx-size = 8192
temp = 0.7
n-gpu-layers = 99

[llama-70b]
model = ./models/llama-70b.gguf
ctx-size = 4096
temp = 0.8
n-gpu-layers = 50
tensor-split = 0,1
```

## Error Handling

Standard error responses:

- `Preset file not found`
- `Failed to read preset`
- `Invalid INI syntax`
- `Missing required 'model' parameter`
- `Invalid numeric value`

## Next Steps

1. Create `server/handlers/presets.js`
2. Update `server/handlers.js` to register handlers
3. Create `public/js/services/presets.js`
4. Create UI component for preset management
5. Integrate into existing pages (models, configuration, etc.)
