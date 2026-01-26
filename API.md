# Llama Async Proxy Dashboard - API Documentation

## Overview

The Llama Async Proxy Dashboard provides a real-time API via Socket.IO for all operations. This is a **socket-first architecture** - components call `socketClient.request()` directly and listen to broadcasts for updates.

**See SOCKET_CONTRACTS.md for the complete, authoritative API reference.**

## Quick Start

```javascript
// Using socketClient (recommended - returns Promises)
const response = await socketClient.request("models:list", {});
if (response.success) {
  console.log("Models:", response.data.models);
}

// Listen for broadcasts
socketClient.on("models:updated", (data) => {
  console.log("Models changed:", data.models);
});
```

## Response Format

All API responses follow this format:

```javascript
{
  success: boolean,
  data?: any,
  error?: string,
  timestamp: string  // ISO 8601 format
}
```

## Connection

### WebSocket Endpoint

```text
ws://localhost:3000/llamaproxws
```

### Using socketClient (Recommended)

The application provides a global `socketClient` that handles connection automatically:

```javascript
// socketClient is auto-initialized in app.js
// Connection status
socketClient.isConnected; // true/false

// Make a request (returns Promise)
const response = await socketClient.request("models:list", {});

// Listen for broadcasts
socketClient.on("models:updated", (data) => {
  // Handle update
});

// Unsubscribe
const unsub = socketClient.on("event", handler);
unsub();
```

### Direct Socket.IO Connection

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

// Use callback pattern for direct socket
socket.emit("models:list", {}, (response) => {
  console.log(response);
});
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

### Save Preset

Save a new or update existing preset.

**Request:**

```javascript
socket.emit("presets:save", {
  filename: "my-preset",
  name: "My Preset",
  description: "My custom preset",
  models: {
    "qwen-7b": { "ctx-size": "2048", "batch": "512" },
    "*": { "ctx-size": "1024" }
  }
}, (response) => {
  console.log(response);
});
```

**Parameters:**

- `filename` (string): Preset file name (no .json extension)
- `name` (string): Display name
- `description` (string): Preset description
- `models` (object): Per-model config overrides

**Response:**

```javascript
{
  success: true,
  data: {
    filename: "my-preset",
    path: "/presets/my-preset.json",
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

**Parameters:**

- `filename` (string): Preset file name

**Response:**

```javascript
{
  success: true,
  data: {
    filename: "my-preset",
    deletedAt: "2024-01-15T10:30:00.000Z"
  }
}
```

### Apply Preset

Apply a preset to current configuration.

**Request:**

```javascript
socket.emit("presets:apply", { filename: "my-preset" }, (response) => {
  console.log(response);
});
```

**Parameters:**

- `filename` (string): Preset file name

**Response:**

```javascript
{
  success: true,
  data: {
    appliedAt: "2024-01-15T10:30:00.000Z",
    config: {
      // Applied configuration
    }
  }
}
```

## Configuration API

### Get Configuration

Get current llama.cpp router configuration.

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
    modelsDir: "./models",
    modelsMax: 4,
    contextSize: 8192,
    gpuLayers: 99,
    threads: 4,
    ...
  }
}
```

### Update Configuration

Update llama.cpp router configuration.

**Request:**

```javascript
socket.emit("config:update", {
  contextSize: 4096,
  threads: 8
}, (response) => {
  console.log(response);
});
```

**Response:**

```javascript
{
  success: true,
  data: {
    updated: ["contextSize", "threads"],
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

### Llama Router Events

```javascript
// Llama router status changed
socket.on("llama:status", (data) => {
  console.log("Router status:", data);
});

// Llama router process started
socket.on("llama:started", (data) => {
  console.log("Router started:", data);
});

// Llama router process stopped
socket.on("llama:stopped", (data) => {
  console.log("Router stopped:", data);
});

// Llama router error
socket.on("llama:error", (data) => {
  console.log("Router error:", data);
});
```

### Configuration Events

```javascript
// Configuration changed
socket.on("config:changed", (data) => {
  console.log("Config updated:", data);
});
```

### Settings Events

```javascript
// Settings changed
socket.on("settings:changed", (data) => {
  console.log("Settings updated:", data);
});
```

## Error Codes

| Code | Description |
| --- | --- |
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

- **API Version:** 1.1.0
- **Socket.IO Protocol:** v4
- **Compatible with:** Socket.IO client 4.x
- **llama.cpp**: Router mode with multiple model support

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
