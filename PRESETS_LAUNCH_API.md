# Presets Launch API Reference

Complete API documentation for launching and managing llama-server via preset configurations.

## Socket.IO Events

### `presets:start-with-preset`

Start llama-server with a preset configuration file.

**Request:**

```javascript
{
  filename: string,    // Preset name (without .ini extension)
  options?: {
    maxModels?: number;    // Max models loaded simultaneously (default: 4)
    threads?: number;      // CPU threads (default: 4)
    ctxSize?: number;      // Context size (default: 4096)
    noAutoLoad?: boolean;  // Don't auto-load models on startup
  }
}
```

**Response (Success):**

```javascript
{
  success: true,
  data: {
    port: number;           // Port llama-server is listening on
    url: string;            // Full URL (http://127.0.0.1:PORT)
    mode: "router";         // Router mode
    preset: string;         // Preset name used
  }
}
```

**Response (Error):**

```javascript
{
  success: false,
  error: {
    message: string;  // Error description
  }
}
```

**Example:**

```javascript
const response = await stateManager.request("presets:start-with-preset", {
  filename: "production",
  options: {
    maxModels: 4,
    threads: 8,
    ctxSize: 4096,
  },
});

if (response.success) {
  console.log(`Server on port ${response.data.port}`);
} else {
  console.error(response.error.message);
}
```

**Possible Errors:**

- `"Preset file not found: {filename}"` - File doesn't exist in ./config/
- `"llama-server binary not found!"` - llama-server not in PATH
- `"Timeout waiting for llama-server router to start"` - Server failed to start
- `"llama-server exited with code {code}"` - Process crashed

---

### `presets:stop-server`

Stop the running llama-server instance.

**Request:**

```javascript
{
  // No parameters required
}
```

**Response (Success):**

```javascript
{
  success: true,
  data: {
    // Stop details
  }
}
```

**Response (Error):**

```javascript
{
  success: false,
  error: {
    message: string;
  }
}
```

**Example:**

```javascript
const response = await stateManager.request("presets:stop-server");

if (response.success) {
  console.log("Server stopped");
} else {
  console.error(response.error.message);
}
```

**Possible Errors:**

- `"No server running"` - Nothing to stop

---

### `presets:list`

List all available presets.

**Request:**

```javascript
{
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    presets: Array<{
      name: string;       // Preset name (without .ini)
      path: string;       // Filename (with .ini)
      file: string;       // Full file path
    }>
  }
}
```

**Example:**

```javascript
const response = await stateManager.request("presets:list");
console.log(response.data.presets);
// Output:
// [
//   { name: "production", path: "production.ini", file: "/full/path/..." },
//   { name: "testing", path: "testing.ini", file: "/full/path/..." }
// ]
```

---

### `presets:create`

Create a new empty preset.

**Request:**

```javascript
{
  filename: string;        // Preset name (without .ini)
  description?: string;    // Optional description
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    filename: string;
    path: string;
  }
}
```

**Example:**

```javascript
const response = await stateManager.request("presets:create", {
  filename: "my-preset",
});
// Creates ./config/my-preset.ini with empty config
```

---

### `presets:save`

Save/overwrite a preset with new configuration.

**Request:**

```javascript
{
  filename: string;
  config: {
    LLAMA_CONFIG_VERSION?: string;
    "*"?: { /* default parameters */ };
    [modelName]: { /* model parameters */ }
  }
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    filename: string;
    path: string;
  }
}
```

**Example:**

```javascript
const response = await stateManager.request("presets:save", {
  filename: "my-preset",
  config: {
    "*": {
      "ctx-size": 4096,
      "n-gpu-layers": 33,
      threads: 8,
    },
    model1: {
      model: "/models/model1.gguf",
      temperature: 0.7,
    },
  },
});
```

---

### `presets:read`

Read a preset file and get its content.

**Request:**

```javascript
{
  filename: string; // Without .ini extension
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    filename: string;
    content: string;   // Raw INI content
    parsed: {
      // Parsed INI as object
      "*": { /* defaults */ },
      [modelName]: { /* model config */ }
    }
  }
}
```

**Example:**

```javascript
const response = await stateManager.request("presets:read", {
  filename: "production",
});

console.log(response.data.content); // Raw INI text
console.log(response.data.parsed); // Parsed object
```

---

### `presets:delete`

Delete a preset file.

**Request:**

```javascript
{
  filename: string;
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    filename: string;
  }
}
```

**Example:**

```javascript
await stateManager.request("presets:delete", {
  filename: "old-preset",
});
```

---

### `presets:add-model` / `presets:update-model`

Add or update a model in a preset.

**Request:**

```javascript
{
  filename: string;
  modelName: string;
  config: {
    model?: string;              // Path to .gguf file
    ctxSize?: number;           // Context size
    temperature?: number;       // Sampling temperature
    nGpuLayers?: number;       // GPU layers to offload
    threads?: number;          // CPU threads
    batchSize?: number;        // Batch size
    ubatchSize?: number;       // Micro batch size
    topP?: number;             // Top-p sampling
    topK?: number;             // Top-k sampling
    minP?: number;             // Min-p sampling
    seed?: number;             // Random seed
    // ... and many other parameters
  }
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    filename: string;
    modelName: string;
    config: { /* updated config */ }
  }
}
```

**Example:**

```javascript
const response = await stateManager.request("presets:add-model", {
  filename: "my-preset",
  modelName: "llama2-7b",
  config: {
    model: "/models/llama2-7b.gguf",
    ctxSize: 2048,
    nGpuLayers: 33,
    temperature: 0.7,
    topP: 0.9,
  },
});
```

---

### `presets:remove-model`

Remove a model from a preset.

**Request:**

```javascript
{
  filename: string;
  modelName: string;
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    filename: string;
    modelName: string;
  }
}
```

---

### `presets:get-models`

Get all models from a preset.

**Request:**

```javascript
{
  filename: string;
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    models: {
      [modelName]: { /* model config */ }
    }
  }
}
```

---

### `presets:get-defaults`

Get global defaults section ("\*") from a preset.

**Request:**

```javascript
{
  filename: string;
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    defaults: { /* default parameters */ }
  }
}
```

---

### `presets:update-defaults`

Update global defaults section in a preset.

**Request:**

```javascript
{
  filename: string;
  config: {
    /* default parameters */
  }
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    filename: string;
    defaults: { /* updated defaults */ }
  }
}
```

---

### `presets:validate`

Validate INI file syntax.

**Request:**

```javascript
{
  content: string; // Raw INI content
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    valid: boolean;
    errors: string[];     // Validation errors
  }
}
```

---

### `presets:validate-config`

Validate a complete preset configuration.

**Request:**

```javascript
{
  config: {
    "*": { /* defaults */ },
    [modelName]: { /* model config */ }
  }
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    valid: boolean;
    errors: string[];     // Critical errors
    warnings: string[];   // Non-critical warnings
  }
}
```

**Example:**

```javascript
const response = await stateManager.request("presets:validate-config", {
  config: {
    "*": { "ctx-size": 4096 },
    model1: {
      model: "/path/to/model.gguf",
      "n-gpu-layers": 33,
    },
  },
});

if (!response.data.valid) {
  console.error("Validation failed:", response.data.errors);
}
```

---

### `presets:get-models-dir`

Scan and list available models from the configured models directory.

**Request:**

```javascript
{
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    models: Array<{
      name: string;              // Model name (without .gguf)
      path: string;              // Full file path
      size: number;              // Size in bytes
      sizeFormatted: string;     // "1.5 GB"
      vram: number;              // Estimated VRAM in bytes
      vramFormatted: string;     // "2.3 GB"
    }>,
    directory: string;           // Models directory path
  }
}
```

---

### `presets:get-llama-params`

Get all available llama.cpp parameters grouped by category.

**Request:**

```javascript
{
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    categories: {
      "Model Settings": [
        { name: "ctx-size", type: "int", default: "2048" },
        { name: "model", type: "string", default: "" }
      ],
      "Performance": [ /* ... */ ],
      "Sampling": [ /* ... */ ],
      // ... other categories
    }
  }
}
```

---

### `presets:show-inheritance`

Calculate and show how configuration values are inherited.

**Request:**

```javascript
{
  filename: string;
  modelName: string;
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    finalConfig: { /* merged configuration */ },
    sources: {
      ctxSize: "global",      // Where value came from
      nGpuLayers: "model",
      // ...
    },
    inheritancePath: ["default", "global", "model"]
  }
}
```

---

## Data Models

### Preset Configuration Object

```typescript
interface PresetConfig {
  // Global defaults - applied to all models
  "*": {
    "ctx-size"?: number;
    "n-gpu-layers"?: number;
    threads?: number;
    batch?: number;
    ubatch?: number;
    temperature?: number;
    // ... other parameters
  };

  // Model configurations
  [modelName: string]: {
    model: string; // REQUIRED: path to .gguf file
    "ctx-size"?: number;
    temperature?: number;
    "n-gpu-layers"?: number;
    // ... other parameters
  };
}
```

### INI File Format

```ini
LLAMA_CONFIG_VERSION = 1

; Global defaults applied to all models
[*]
ctx-size = 4096
n-gpu-layers = 33
threads = 8

; Individual model configuration
[llama2-7b]
model = /models/llama2-7b.gguf
temperature = 0.7
top-p = 0.9

[mistral-7b]
model = /models/mistral-7b.gguf
temperature = 0.5
n-gpu-layers = 40
```

## Parameter Reference

### Core Parameters

| Parameter      | Type   | Default | Range    | Description              |
| -------------- | ------ | ------- | -------- | ------------------------ |
| `model`        | string | ""      | N/A      | Path to .gguf file       |
| `ctx-size`     | int    | 2048    | 1-131072 | Context size in tokens   |
| `n-gpu-layers` | int    | 0       | 0-256    | Layers to offload to GPU |
| `threads`      | int    | 0       | 0-256    | CPU threads (0=all)      |
| `batch`        | int    | 512     | 1-8192   | Batch size               |
| `ubatch`       | int    | 512     | 1-8192   | Micro batch size         |

### Sampling Parameters

| Parameter     | Type  | Default | Range  | Description              |
| ------------- | ----- | ------- | ------ | ------------------------ |
| `temperature` | float | 0.7     | 0-2.0  | Sampling temperature     |
| `top-p`       | float | 0.9     | 0-1    | Top-p (nucleus) sampling |
| `top-k`       | int   | 40      | 0-1000 | Top-k sampling           |
| `min-p`       | float | 0.0     | 0-1    | Minimum probability      |
| `seed`        | int   | -1      | -1-max | Random seed (-1=random)  |

### GPU/Hardware Parameters

| Parameter      | Type   | Default | Range            | Description          |
| -------------- | ------ | ------- | ---------------- | -------------------- |
| `split-mode`   | string | "none"  | none\|layer\|row | Multi-GPU split mode |
| `tensor-split` | string | ""      | N/A              | Tensor split ratios  |
| `main-gpu`     | int    | 0       | 0-16             | Primary GPU index    |
| `threads-http` | int    | 1       | 1-256            | HTTP server threads  |

## Complete Example

### Create and Launch a Production Preset

```javascript
// 1. Create preset
await stateManager.request("presets:create", {
  filename: "production",
});

// 2. Add models
await stateManager.request("presets:add-model", {
  filename: "production",
  modelName: "llama2-13b",
  config: {
    model: "/models/llama2-13b.gguf",
    ctxSize: 8192,
    nGpuLayers: 40,
    temperature: 0.7,
    topP: 0.95,
  },
});

await stateManager.request("presets:add-model", {
  filename: "production",
  modelName: "mistral-7b",
  config: {
    model: "/models/mistral-7b.gguf",
    ctxSize: 4096,
    nGpuLayers: 33,
    temperature: 0.5,
  },
});

// 3. Update defaults
await stateManager.request("presets:update-defaults", {
  filename: "production",
  config: {
    "ctx-size": 4096,
    threads: 8,
    "n-gpu-layers": 30,
  },
});

// 4. Validate
const validation = await stateManager.request("presets:validate-config", {
  config: {
    /* full config */
  },
});

if (validation.data.valid) {
  // 5. Launch
  const response = await stateManager.request("presets:start-with-preset", {
    filename: "production",
    options: {
      maxModels: 8,
      threads: 16,
      ctxSize: 8192,
    },
  });

  if (response.success) {
    console.log(`Server running on ${response.data.url}`);
  }
}
```

## Error Codes

| Error        | Cause              | Solution                               |
| ------------ | ------------------ | -------------------------------------- |
| `ENOENT`     | File not found     | Check filename and ./config/ directory |
| `EACCES`     | Permission denied  | Check file permissions                 |
| `EINVAL`     | Invalid INI syntax | Run `presets:validate` event           |
| `EADDRINUSE` | Port in use        | System auto-selects next port          |
| `ENOMEM`     | Out of memory      | Reduce context size or max models      |

---

**API Version**: 1.0  
**Last Updated**: January 2026  
**Status**: Production Ready
