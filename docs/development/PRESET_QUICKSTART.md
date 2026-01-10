# INI Preset Configuration - Quick Start Guide

WebSocket-based INI file management for llama.cpp router mode.

## What Was Added

### Backend (Server)

- `server/handlers/presets.js` - Socket.IO event handlers for INI file operations
- Updated `server/handlers.js` to register preset handlers

### Frontend (Client)

- `public/js/services/presets.js` - PresetsService for socket communication

## File Location

All INI preset files are stored in: `config/` directory (auto-created on first use)

```
/project/
├── config/
│   ├── default.ini
│   ├── gpu-heavy.ini
│   └── balanced.ini
```

## How to Use

### 1. Import the Service

```javascript
import PresetsService from "./services/presets.js";

// In your controller/page
const presetsService = new PresetsService(socket);
```

### 2. List All Presets

```javascript
try {
  const presets = await presetsService.listPresets();
  console.log(presets);
  // [
  //   { name: "default", path: "default.ini", file: "..." },
  //   { name: "gpu-heavy", path: "gpu-heavy.ini", file: "..." }
  // ]
} catch (error) {
  console.error(error.message);
}
```

### 3. Create a New Preset

```javascript
try {
  const result = await presetsService.createPreset("my-preset");
  // { filename: "my-preset", path: "/path/to/config/my-preset.ini" }
} catch (error) {
  console.error(error.message);
}
```

### 4. Add Model to Preset

```javascript
const modelConfig = {
  model: "./models/gemma-4b.gguf",
  ctxSize: 8192,
  temperature: 0.7,
  nGpuLayers: 99,
  threads: 8,
};

try {
  const result = await presetsService.addModel("my-preset", "gemma-4b", modelConfig);
  console.log(result);
  // {
  //   filename: "my-preset",
  //   modelName: "gemma-4b",
  //   config: { model: "./models/gemma-4b.gguf", ctxSize: 8192, ... }
  // }
} catch (error) {
  console.error(error.message);
}
```

### 5. Get All Models from Preset

```javascript
try {
  const models = await presetsService.getModelsFromPreset("my-preset");
  console.log(models);
  // {
  //   "gemma-4b": { model: "...", ctxSize: 8192, ... },
  //   "llama-70b": { model: "...", ctxSize: 4096, ... }
  // }
} catch (error) {
  console.error(error.message);
}
```

### 6. Update Model Config

```javascript
const updatedConfig = {
  model: "./models/gemma-4b.gguf",
  ctxSize: 16384,
  temperature: 0.5,
  nGpuLayers: 99,
};

try {
  const result = await presetsService.updateModel("my-preset", "gemma-4b", updatedConfig);
  console.log(result);
} catch (error) {
  console.error(error.message);
}
```

### 7. Validate INI Syntax

```javascript
const iniContent = `[my-model]
model = ./models/model.gguf
ctx-size = 8192
temp = 0.7
`;

try {
  const validation = await presetsService.validateIni(iniContent);
  console.log(validation);
  // { valid: true, errors: [] }
  // or
  // { valid: false, errors: ["[my-model]: Missing required 'model' parameter"] }
} catch (error) {
  console.error(error.message);
}
```

### 8. Delete Preset

```javascript
try {
  const result = await presetsService.deletePreset("my-preset");
  console.log(result);
  // { filename: "my-preset" }
} catch (error) {
  console.error(error.message);
}
```

### 9. Save Preset Programmatically

```javascript
const config = {
  LLAMA_CONFIG_VERSION: "1",
  "gemma-4b": {
    model: "./models/gemma-4b.gguf",
    "ctx-size": "8192",
    temp: "0.7",
    "n-gpu-layers": "99",
  },
  "llama-70b": {
    model: "./models/llama-70b.gguf",
    "ctx-size": "4096",
    temp: "0.8",
    "n-gpu-layers": "50",
  },
};

try {
  const result = await presetsService.savePreset("my-preset", config);
  console.log(result);
} catch (error) {
  console.error(error.message);
}
```

## INI File Format Example

Generated INI files look like this:

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

## Configuration Parameters

Supported parameters in model config:

| Parameter     | Type   | Default | Description                        |
| ------------- | ------ | ------- | ---------------------------------- |
| `model`       | string | -       | Path to GGUF model file (required) |
| `ctxSize`     | number | 2048    | Context size                       |
| `temperature` | number | 0.7     | Temperature for sampling           |
| `nGpuLayers`  | number | 0       | GPU layers to offload              |
| `threads`     | number | 0       | Number of threads (0 = auto)       |
| `batchSize`   | number | 512     | Batch size                         |
| `ubatchSize`  | number | 512     | Ubatch size                        |
| `tensorSplit` | string | null    | GPU split ratio (e.g., "0.5,0.5")  |
| `mmp`         | string | null    | Multimodal project path            |

## Error Handling

All methods reject with errors like:

- `Preset file not found: my-preset`
- `Failed to read preset: [error details]`
- `Invalid INI syntax: [error details]`
- `[model-name]: Missing required 'model' parameter`
- `[model-name]: Invalid ctx-size value: abc`

Example:

```javascript
try {
  await presetsService.readPreset("nonexistent");
} catch (error) {
  console.error(error.message);
  // "Failed to read preset: Preset file not found: nonexistent"
  showNotification(error.message, "error");
}
```

## Integration Example

Full example in a controller:

```javascript
class PresetsController {
  constructor(options = {}) {
    this.socket = options.socket;
    this.presetsService = new PresetsService(this.socket);
  }

  async loadPresets() {
    try {
      const presets = await this.presetsService.listPresets();
      stateManager.set("presets", presets);
    } catch (error) {
      showNotification(`Failed to load presets: ${error.message}`, "error");
    }
  }

  async saveNewPreset(name, models) {
    try {
      // Create preset
      await this.presetsService.createPreset(name);

      // Add models
      for (const [modelName, config] of Object.entries(models)) {
        await this.presetsService.addModel(name, modelName, config);
      }

      showNotification(`Preset "${name}" saved successfully`, "success");
      await this.loadPresets();
    } catch (error) {
      showNotification(`Failed to save preset: ${error.message}`, "error");
    }
  }
}
```

## WebSocket Events Reference

### Request → Server

```
presets:list              →  List all presets
presets:read              →  Read specific preset
presets:create            →  Create new preset
presets:save              →  Save preset with full config
presets:delete            →  Delete preset
presets:validate          →  Validate INI syntax
presets:get-models        →  Get all models from preset
presets:add-model         →  Add/update model in preset
presets:update-model      →  Update existing model
presets:remove-model      →  Remove model from preset
```

### Response ← Server

All responses follow standard format:

```javascript
{
  success: true|false,
  data: { /* response data */ },
  error: { message: "error text" },
  timestamp: "ISO timestamp"
}
```

## Troubleshooting

### Config directory not created

- Automatically created on first operation
- Check file permissions in project root

### INI parsing errors

- Use `validateIni()` before saving
- Ensure each model section has `model` parameter
- Check numeric values for correctness

### WebSocket connection issues

- Ensure socket is connected before calling service methods
- Check browser console for connection errors
- Verify Socket.IO path: `/llamaproxws`

## Starting llama-server with Presets

Once presets are created, use them with llama-server:

```bash
llama-server --models-preset ./config/my-preset.ini --models-max 4
```

This will load model configurations from the INI file and manage them via router mode.
