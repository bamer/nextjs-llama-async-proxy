# Llama Async Proxy Dashboard - API Documentation

## Overview

The Llama Async Proxy Dashboard provides a real-time API via Socket.IO for all operations. All API communication uses JSON objects with a consistent response format.

## Connection

### WebSocket Endpoint
```
ws://localhost:3000/llamaproxws
```

### Connection Example (JavaScript)
```javascript
const socket = io("http://localhost:3000/llamaproxws", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
```

## Response Format

All API responses follow this format:

```javascript
{
  success: boolean,
  data?: any,
  error?: {
    message: string,
    code?: string
  },
  timestamp: string  // ISO 8601 format
}
```

### Success Response Example
```javascript
{
  success: true,
  data: {
    models: ["model1.gguf", "model2.gguf"]
  },
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

### Error Response Example
```javascript
{
  success: false,
  error: {
    message: "Model not found",
    code: "MODEL_NOT_FOUND"
  },
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

## Models API

### List Models
Get all available models in the models directory.

**Request:**
```javascript
socket.emit("models:list", {}, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    models: [
      {
        id: "qwen-7b",
        name: "qwen-7b.gguf",
        path: "/models/qwen-7b.gguf",
        size: 4580140000,
        status: "unloaded",
        parameters: null
      }
    ],
    total: 1
  }
}
```

### Load Model
Load a model into memory for inference.

**Request:**
```javascript
socket.emit("models:load", { id: "qwen-7b" }, (response) => {
  console.log(response);
});
```

**Parameters:**
- `id` (string): Model identifier

**Response:**
```javascript
{
  success: true,
  data: {
    id: "qwen-7b",
    status: "loaded",
    memoryUsage: 6448742400,
    loadedAt: "2024-01-15T10:30:00.000Z"
  }
}
```

### Unload Model
Unload a model from memory.

**Request:**
```javascript
socket.emit("models:unload", { id: "qwen-7b" }, (response) => {
  console.log(response);
});
```

**Parameters:**
- `id` (string): Model identifier

**Response:**
```javascript
{
  success: true,
  data: {
    id: "qwen-7b",
    status: "unloaded",
    unloadedAt: "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Model Info
Get detailed information about a specific model.

**Request:**
```javascript
socket.emit("models:info", { id: "qwen-7b" }, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    id: "qwen-7b",
    name: "qwen-7b.gguf",
    path: "/models/qwen-7b.gguf",
    size: 4580140000,
    status: "loaded",
    parameters: {
      "General": { ... },
      "Model": { ... },
      "Tokenizer": { ... }
    },
    memoryUsage: 6448742400,
    loadedAt: "2024-01-15T10:30:00.000Z"
  }
}
```

## Presets API

### List Presets
Get all available presets.

**Request:**
```javascript
socket.emit("presets:list", {}, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    presets: [
      {
        filename: "default",
        name: "Default",
        description: "Default preset",
        models: { "*": { "ctx-size": "2048" } }
      }
    ]
  }
}
```

### Read Preset
Get detailed preset configuration.

**Request:**
```javascript
socket.emit("presets:read", { filename: "default" }, (response) => {
  console.log(response);
});
```

**Parameters:**
- `filename` (string): Preset filename (without .ini extension)

**Response:**
```javascript
{
  success: true,
  data: {
    filename: "default",
    name: "Default",
    description: "Default preset",
    content: "[*]\nctx-size=2048\n...",
    models: { "*": { "ctx-size": "2048" } }
  }
}
```

### Save Preset
Create or update a preset.

**Request:**
```javascript
socket.emit("presets:save", {
  filename: "my-preset",
  config: {
    "*": { "ctx-size": "4096", "temp": "0.7" }
  }
}, (response) => {
  console.log(response);
});
```

**Parameters:**
- `filename` (string): Preset filename (without .ini extension)
- `config` (object): Configuration object with INI structure

**Response:**
```javascript
{
  success: true,
  data: {
    filename: "my-preset",
    savedAt: "2024-01-15T10:30:00.000Z"
  }
}
```

### Delete Preset
Delete a preset.

**Request:**
```javascript
socket.emit("presets:delete", { filename: "my-preset" }, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  success: true,
  data: { deleted: true }
}
```

### Get Llama Parameters
Get available Llama.cpp parameters organized by category.

**Request:**
```javascript
socket.emit("presets:get-llama-params", {}, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    parameters: {
      "Model Settings": [
        { name: "ctx-size", type: "int", default: "2048", description: "Context size" },
        { name: "n-gpu-layers", type: "int", default: "0", description: "GPU layers" }
      ],
      "Performance": [
        { name: "threads", type: "int", default: "0", description: "Number of threads" }
      ],
      "Sampling": [
        { name: "temp", type: "float", default: "0.7", description: "Temperature" }
      ]
    }
  }
}
```

### Validate Configuration
Validate a preset configuration.

**Request:**
```javascript
socket.emit("presets:validate-config", {
  filename: "my-preset",
  config: { "*": { "ctx-size": "4096" } }
}, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    valid: true,
    errors: [],
    warnings: ["Consider setting ctx-size to at least 4096"]
  }
}
```

## Configuration API

### Get Configuration
Get current server configuration.

**Request:**
```javascript
socket.emit("config:get", {}, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    server: {
      port: 3000,
      host: "0.0.0.0"
    },
    llama: {
      serverPath: "/usr/local/bin/llama-server",
      modelsDir: "/models",
      port: 8080,
      maxModels: 4
    },
    logging: {
      level: "info",
      path: "./logs"
    }
  }
}
```

### Update Configuration
Update server configuration.

**Request:**
```javascript
socket.emit("config:update", {
  server: { port: 3001 },
  llama: { maxModels: 8 }
}, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    updated: true,
    restartRequired: true
  }
}
```

## Metrics API

### Get Metrics
Get current system and llama-server metrics.

**Request:**
```javascript
socket.emit("metrics:get", {}, (response) => {
  console.log(response);
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    system: {
      cpu: { usage: 45.2, cores: 8 },
      memory: { used: 8589934592, total: 17179869184 },
      disk: { used: 53687091200, total: 107374182400 }
    },
    llama: {
      activeConnections: 2,
      requestsProcessed: 150,
      averageResponseTime: 45.2
    },
    gpu: [
      {
        name: "NVIDIA RTX 3080",
        usage: 65.5,
        memoryUsed: 6448742400,
        memoryTotal: 10737418240
      }
    ],
    timestamp: "2024-01-15T10:30:00.000Z"
  }
}
```

## Logs API

### Get Logs
Retrieve application logs.

**Request:**
```javascript
socket.emit("logs:get", {
  level: "info",
  limit: 100,
  since: "2024-01-15T00:00:00.000Z"
}, (response) => {
  console.log(response);
});
```

**Parameters:**
- `level` (string): Log level filter (debug, info, warn, error)
- `limit` (number): Maximum number of log entries
- `since` (string): Only get logs after this timestamp

**Response:**
```javascript
{
  success: true,
  data: {
    logs: [
      {
        timestamp: "2024-01-15T10:30:00.000Z",
        level: "info",
        source: "server",
        message: "Client connected"
      }
    ],
    total: 1
  }
}
```

## Events

The server emits events to connected clients:

### Connection Events
```javascript
// When a client connects
socket.on("client:connected", (data) => {
  console.log("New client:", data.clientId);
});

// When a client disconnects
socket.on("client:disconnected", (data) => {
  console.log("Client disconnected:", data.clientId);
});
```

### Model Events
```javascript
// Model status changed
socket.on("models:status", (data) => {
  console.log("Model status changed:", data);
});

// Model loaded
socket.on("models:loaded", (data) => {
  console.log("Model loaded:", data.modelId);
});

// Model unloaded
socket.on("models:unloaded", (data) => {
  console.log("Model unloaded:", data.modelId);
});
```

### Metrics Events
```javascript
// Metrics update (every 10 seconds when clients connected)
socket.on("metrics:update", (data) => {
  console.log("New metrics:", data);
});
```

### Log Events
```javascript
// New log entry
socket.on("logs:entry", (data) => {
  console.log("New log:", data.entry);
});
```

## Error Codes

| Code | Description |
|------|-------------|
| `MODEL_NOT_FOUND` | Requested model does not exist |
| `MODEL_LOAD_FAILED` | Failed to load model |
| `MODEL_UNLOAD_FAILED` | Failed to unload model |
| `PRESET_NOT_FOUND` | Requested preset does not exist |
| `PRESET_SAVE_FAILED` | Failed to save preset |
| `CONFIG_INVALID` | Invalid configuration |
| `PERMISSION_DENIED` | Permission denied for operation |
| `SERVER_ERROR` | Internal server error |

## Rate Limiting

- No explicit rate limiting implemented
- Practical limits based on Socket.IO message handling
- Client-side debouncing recommended for frequent updates

## Version Compatibility

- **API Version:** 1.0.0
- **Socket.IO Protocol:** v4
- **Compatible with:** Socket.IO client 4.x

## Examples

### Complete Model Loading Flow
```javascript
// Connect
const socket = io("http://localhost:3000/llamaproxws");

socket.on("connect", async () => {
  // List models
  socket.emit("models:list", {}, (listResponse) => {
    if (listResponse.success) {
      const models = listResponse.data.models;
      
      // Load first model
      if (models.length > 0) {
        socket.emit("models:load", { id: models[0].id }, (loadResponse) => {
          if (loadResponse.success) {
            console.log("Model loaded:", loadResponse.data);
          }
        });
      }
    }
  });
});
```

### Real-Time Monitoring
```javascript
const socket = io("http://localhost:3000/llamaproxws");

// Subscribe to metrics updates
socket.emit("metrics:subscribe", {}, (response) => {
  if (response.success) {
    console.log("Subscribed to metrics");
  }
});

// Handle metrics updates
socket.on("metrics:update", (data) => {
  document.getElementById("cpu-usage").textContent = data.system.cpu.usage + "%";
  document.getElementById("memory-usage").textContent = 
    Math.round(data.system.memory.used / 1024 / 1024 / 1024) + "GB";
});
```

## Support

- **Documentation:** See INSTALL.md and USAGE.md
- **Architecture:** See docs/ARCHITECTURE.md
- **Issues:** Report via project issue tracker
