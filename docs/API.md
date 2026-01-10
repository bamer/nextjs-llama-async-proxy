# Llama Async Proxy Dashboard - API Reference

## Table of Contents

1. [Overview](#1-overview)
2. [Message Envelope Formats](#2-message-envelope-formats)
3. [Event Reference - Models](#3-event-reference---models)
4. [Event Reference - Metrics](#4-event-reference---metrics)
5. [Event Reference - Logs](#5-event-reference---logs)
6. [Event Reference - Config](#6-event-reference---config)
7. [Event Reference - Presets](#7-event-reference---presets)
8. [Event Reference - Router (Llama.cpp)](#8-event-reference---router-llamacpp)
9. [Event Reference - Settings](#9-event-reference---settings)
10. [Event Reference - Connection](#10-event-reference---connection)
11. [Event Reference - Llama Server](#11-event-reference---llama-server)
12. [Error Codes Reference](#12-error-codes-reference)
13. [Connection Management](#13-connection-management)
14. [Rate Limits](#14-rate-limits)

---

## 1. Overview

The Llama Async Proxy Dashboard uses **Socket.IO** as its exclusive communication protocol. There are no REST API endpoints; all client-server communication happens through WebSocket events.

### Communication Patterns

The API supports three communication patterns:

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Request/Response** | Client sends request, server responds with result | CRUD operations, queries |
| **Broadcast (Server→Client)** | Server pushes updates to all connected clients | Real-time metrics, status changes |
| **Event Acknowledgment** | Client sends event with callback | Preset operations |

### Connection Endpoint

```javascript
// WebSocket connection
const socket = io("http://localhost:3000", {
  path: "/llamaproxws",
  transports: ["websocket"],
});

// Or with automatic fallback
const socket = io("http://localhost:3000", {
  path: "/llamaproxws",
  transports: ["websocket", "polling"],
});
```

---

## 2. Message Envelope Formats

All messages follow a consistent envelope structure that wraps the payload and includes metadata for tracking and debugging.

### 2.1 Request Envelope (Client → Server)

Sent by the client when making a request to the server.

```javascript
{
  type: "request",
  event: "event-name",
  data: { /* payload */ },
  requestId: "req_123456_abc",
  timestamp: 1704467890123,
  version: "1.0"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always `"request"` |
| `event` | string | The event name being invoked |
| `data` | object | Request payload (varies by event) |
| `requestId` | string | Unique identifier for request/response matching |
| `timestamp` | number | Unix timestamp in milliseconds |
| `version` | string | API version (currently `"1.0"`) |

**Example Request:**

```javascript
socket.emit("models:list", {
  requestId: "req_1704467890_abc123",
  timestamp: Date.now(),
});
```

### 2.2 Response Envelope (Server → Client)

Returned by the server in response to a request event.

```javascript
{
  type: "response",
  event: "event-name",
  success: true,
  data: { /* result */ },
  error: null,
  requestId: "req_123456_abc",
  timestamp: 1704467890456
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always `"response"` |
| `event` | string | The event name that was invoked |
| `success` | boolean | `true` if successful, `false` if error |
| `data` | object | Response payload (present if `success === true`) |
| `error` | object | Error details (present if `success === false`) |
| `requestId` | string | Matches the request's `requestId` |
| `timestamp` | number | Unix timestamp in milliseconds |

**Error Object Structure:**

```javascript
{
  code: "ERROR_CODE",
  message: "Human-readable error description"
}
```

**Example Response:**

```javascript
// Success response
{
  type: "response",
  event: "models:list:result",
  success: true,
  data: {
    models: [
      { id: 1, name: "llama-2-7b", status: "loaded" },
      { id: 2, name: "mistral-7b", status: "unloaded" }
    ]
  },
  requestId: "req_1704467890_abc123",
  timestamp: 1704467890456
}

// Error response
{
  type: "response",
  event: "models:get:result",
  success: false,
  data: null,
  error: {
    code: "GET_MODEL_FAILED",
    message: "Model not found"
  },
  requestId: "req_1704467890_xyz789",
  timestamp: 1704467890500
}
```

### 2.3 Broadcast Envelope (Server → Client)

Pushed by the server to all connected clients without a specific request.

```javascript
{
  type: "broadcast",
  event: "event-name",
  data: { /* payload */ },
  timestamp: 1704467890678
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always `"broadcast"` |
| `event` | string | The broadcast event name |
| `data` | object | Broadcast payload |
| `timestamp` | number | Unix timestamp in milliseconds |

**Example Broadcast:**

```javascript
{
  type: "broadcast",
  event: "models:status",
  data: {
    modelName: "llama-2-7b",
    status: "loaded"
  },
  timestamp: 1704467890678
}
```

---

## 3. Event Reference - Models

Model-related events for CRUD operations and router management.

### 3.1 List All Models

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:list` | C→S | `{}` | `models:list:result` with `{models: [...]}` |

**Payload:** Empty object

**Response Schema:**

```javascript
{
  success: true,
  data: {
    models: [
      {
        id: number,
        name: string,
        model_path: string,
        type: string,
        status: "loaded" | "loading" | "unloaded" | "error",
        file_size: number,
        params: object,
        quantization: string,
        ctx_size: number,
        is_favorite: boolean,
        created_at: number,
        updated_at: number
      }
    ]
  }
}
```

**Example:**

```javascript
// Request
socket.emit("models:list", { requestId: "req_1" });

// Response
socket.on("models:list:result", (response) => {
  console.log(response.data.models);
});
```

### 3.2 Get Single Model

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:get` | C→S | `{modelId}` | `models:get:result` with `{model}` |

**Payload:**

```javascript
{
  modelId: number  // Required. The model ID to retrieve
}
```

**Response Schema:**

```javascript
{
  success: true,
  data: {
    model: {
      id: number,
      name: string,
      // ... all model fields
    }
  }
}
```

**Error Codes:** `GET_MODEL_FAILED`

### 3.3 Create Model

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:create` | C→S | `{model}` | `models:create:result` with `{model}` |

**Payload:**

```javascript
{
  model: {
    name: string,           // Required. Model display name
    model_path: string,     // Required. Full path to model file
    type?: string,          // Model architecture type
    ctx_size?: number,      // Context window size
    quantization?: string,  // Quantization method
  }
}
```

**Response Schema:**

```javascript
{
  success: true,
  data: {
    model: { /* complete model object */ }
  }
}
```

**Broadcasts:** `models:created` (to all clients)

**Error Codes:** `CREATE_MODEL_FAILED`

### 3.4 Update Model

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:update` | C→S | `{modelId, updates}` | `models:update:result` with `{model}` |

**Payload:**

```javascript
{
  modelId: number,  // Required. Model ID to update
  updates: {
    name?: string,
    ctx_size?: number,
    // ... any updatable fields
  }
}
```

**Response Schema:** Same as `models:get`

**Broadcasts:** `models:updated` (to all clients)

**Error Codes:** `UPDATE_MODEL_FAILED`, `NOT_FOUND`

### 3.5 Delete Model

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:delete` | C→S | `{modelId}` | `models:delete:result` with `{deletedId}` |

**Payload:**

```javascript
{
  modelId: number  // Required. Model ID to delete
}
```

**Response Schema:**

```javascript
{
  success: true,
  data: {
    deletedId: number
  }
}
```

**Broadcasts:** `models:deleted` (to all clients)

**Error Codes:** `DELETE_MODEL_FAILED`

### 3.6 Toggle Model Favorite

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:toggle-favorite` | C→S | `{modelId, favorite}` | `models:toggle-favorite:result` with `{model}` |

**Payload:**

```javascript
{
  modelId: number,  // Required
  favorite: boolean  // Required. Desired favorite state
}
```

### 3.7 Load Model (Router)

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:load` | C→S | `{modelName}` | `models:load:result` |

**Payload:**

```javascript
{
  modelName: string,  // Required. Model name (or modelId)
  requestId?: string
}
```

**Response Schema:**

```javascript
{
  success: true,
  data: {
    modelName: string,
    status: "loaded"
  }
}
```

**Broadcasts:** `models:status` with `{modelName, status: "loaded"}`

**Error Codes:** `LOAD_MODEL_FAILED`

**Example:**

```javascript
socket.emit("models:load", {
  modelName: "llama-2-7b-chat",
  requestId: "req_load_1"
});
```

### 3.8 Unload Model (Router)

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:unload` | C→S | `{modelName}` | `models:unload:result` |

**Payload:** Same as `models:load`

**Response Schema:**

```javascript
{
  success: true,
  data: {
    modelName: string,
    status: "unloaded"
  }
}
```

**Broadcasts:** `models:status` with `{modelName, status: "unloaded"}`

**Error Codes:** `UNLOAD_MODEL_FAILED`

### 3.9 Scan Models Directory

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:scan` | C→S | `{}` | `models:scan:result` |

**Payload:** Empty object

**Response Schema:**

```javascript
{
  success: true,
  data: {
    scanned: number,   // Number of new models found
    updated: number,   // Number of existing models updated
    total: number      // Total models in database
  }
}
```

**Broadcasts:** `models:scanned` (to all clients)

**Process:**
1. Scans the configured models directory
2. Validates GGUF files by checking file magic number
3. Extracts metadata from GGUF headers
4. Creates or updates model records in database

**Error Codes:** `SCAN_MODELS_FAILED`

### 3.10 Cleanup Missing Models

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `models:cleanup` | C→S | `{}` | `models:cleanup:result` |

Removes model records whose files no longer exist on disk.

**Response Schema:**

```javascript
{
  success: true,
  data: {
    deletedCount: number
  }
}
```

### 3.11 Model Status Broadcast

| Event | Direction | Payload |
|-------|-----------|---------|
| `models:status` | S→C (broadcast) | `{modelName, status, error?}` |

**Payload:**

```javascript
{
  modelName: string,
  status: "loaded" | "loading" | "unloaded" | "error",
  error?: string  // Present if status is "error"
}
```

**Broadcasts:** Sent when model load/unload operations complete

---

## 4. Event Reference - Metrics

System and llama-server metrics events.

### 4.1 Get Current Metrics

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `metrics:get` | C→S | `{}` | `metrics:get:result` |

**Payload:** Empty object

**Response Schema:**

```javascript
{
  success: true,
  data: {
    metrics: {
      cpu: { usage: number },              // CPU usage percentage
      memory: { used: number },            // Memory usage percentage
      swap: { used: number },              // Swap usage percentage
      disk: { used: number },              // Disk usage percentage
      gpu: {
        usage: number,                     // GPU usage percentage
        memoryUsed: number,                // GPU memory used in bytes
        memoryTotal: number,               // GPU memory total in bytes
        list: [                            // Array of GPU objects
          {
            name: string,
            usage: number,
            memoryUsed: number,
            memoryTotal: number,
            vendor: string
          }
        ]
      },
      uptime: number                       // Server uptime in seconds
    }
  }
}
```

**Example:**

```javascript
socket.emit("metrics:get", { requestId: "req_m1" });
socket.on("metrics:get:result", (response) => {
  console.log(`CPU: ${response.data.metrics.cpu.usage}%`);
  console.log(`Memory: ${response.data.metrics.memory.used}%`);
});
```

### 4.2 Get Metrics History

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `metrics:history` | C→S | `{limit?, start?, end?}` | `metrics:history:result` |

**Payload:**

```javascript
{
  limit?: number,   // Optional. Max records to return (default: 100)
  start?: number,   // Optional. Start timestamp
  end?: number      // Optional. End timestamp
}
```

**Response Schema:**

```javascript
{
  success: true,
  data: {
    history: [
      {
        cpu: { usage: number },
        memory: { used: number },
        // ... same structure as current metrics
        timestamp: number
      }
    ]
  }
}
```

### 4.3 Metrics Update Broadcast

| Event | Direction | Payload |
|-------|-----------|---------|
| `metrics:update` | S→C (broadcast) | `{metrics}` |

**Payload:** Same structure as `metrics:get:result.data.metrics`

**Frequency:** Every 10 seconds when clients are connected, every 60 seconds when idle

---

## 5. Event Reference - Logs

Log retrieval and management events.

### 5.1 Get Database Logs

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `logs:get` | C→S | `{limit?}` | `logs:get:result` |

**Payload:**

```javascript
{
  limit?: number  // Optional. Max logs to return (default: 100)
}
```

**Response Schema:**

```javascript
{
  success: true,
  data: {
    logs: [
      {
        id: number,
        level: "info" | "warn" | "error" | "debug",
        message: string,
        source: string,
        timestamp: number
      }
    ]
  }
}
```

### 5.2 Read Log File

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `logs:read-file` | C→S | `{fileName?}` | `logs:read-file:result` |

**Payload:**

```javascript
{
  fileName?: string  // Optional. Log filename (uses default if not provided)
}
```

### 5.3 List Log Files

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `logs:list-files` | C→S | `{}` | `logs:list-files:result` |

**Response Schema:**

```javascript
{
  success: true,
  data: {
    files: ["log1.txt", "log2.txt"],
    size: number  // Total size in bytes
  }
}
```

### 5.4 Clear Database Logs

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `logs:clear` | C→S | `{}` | `logs:clear:result` |

**Response Schema:**

```javascript
{
  success: true,
  data: {
    cleared: number  // Number of logs cleared
  }
}
```

### 5.5 Clear Log Files

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `logs:clear-files` | C→S | `{}` | `logs:clear-files:result` |

### 5.6 Read Llama Server Log

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `logs:read-llama-server` | C→S | `{}` | `logs:read-llama-server:result` |

**Response Schema:**

```javascript
{
  success: true,
  data: {
    logs: [
      {
        timestamp: number,
        level: string,
        message: string
      }
    ],
    fileName: "llama-server.log"
  }
}
```

### 5.7 Log Entry Broadcast

| Event | Direction | Payload |
|-------|-----------|---------|
| `logs:entry` | S→C (broadcast) | `{entry}` |

**Payload:**

```javascript
{
  entry: {
    level: string,
    message: string,
    source: string,
    timestamp: number
  }
}
```

---

## 6. Event Reference - Config

Server configuration management.

### 6.1 Get Configuration

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `config:get` | C→S | `{}` | `config:get:result` |

**Response Schema:**

```javascript
{
  success: true,
  data: {
    config: {
      baseModelsPath: string,    // Path to models directory
      ctx_size?: number,         // Default context size
      threads?: number,          // Default thread count
      serverPath?: string,       // Path to llama-server binary
      // ... other config fields
    }
  }
}
```

### 6.2 Update Configuration

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `config:update` | C→S | `{config}` | `config:update:result` |

**Payload:**

```javascript
{
  config: {
    baseModelsPath?: string,
    ctx_size?: number,
    threads?: number,
    serverPath?: string,
    // ... any config fields
  }
}
```

**Error Codes:** `CONFIG_UPDATE_FAILED`

---

## 7. Event Reference - Presets

INI configuration preset management for llama.cpp router mode.

### 7.1 List Presets

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:list` | C→S | `{}` | `presets:list:result` |

**Response Schema:**

```javascript
{
  success: true,
  data: {
    presets: [
      {
        name: string,
        path: string,
        file: string
      }
    ]
  }
}
```

### 7.2 Read Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:read` | C→S | `{filename}` | Callback with preset data |

**Payload:**

```javascript
{
  filename: string  // Preset name (without .ini extension)
}
```

**Response:** Uses callback pattern instead of event response

```javascript
socket.emit("presets:read", { filename: "my-preset" }, (response) => {
  console.log(response.data.parsed);
});
```

### 7.3 Save Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:save` | C→S | `{filename, config}` | Callback result |

**Payload:**

```javascript
{
  filename: string,
  config: {
    "*": {  // Default section
      "ctx-size": 4096,
      "n-gpu-layers": 32
    },
    "model-name": {
      model: "/path/to/model.gguf",
      "ctx-size": 2048
    }
  }
}
```

### 7.4 Create Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:create` | C→S | `{filename, description?}` | Callback result |

### 7.5 Delete Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:delete` | C→S | `{filename}` | Callback result |

### 7.6 Get Models from Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:get-models` | C→S | `{filename}` | Callback result |

**Response includes** model configurations with inheritance from defaults section.

### 7.7 Add Model to Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:add-model` | C→S | `{filename, modelName, config}` | Callback result |

### 7.8 Update Model in Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:update-model` | C→S | `{filename, modelName, config}` | Callback result |

### 7.9 Remove Model from Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:remove-model` | C→S | `{filename, modelName}` | Callback result |

### 7.10 Get Preset Defaults

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:get-defaults` | C→S | `{filename}` | Callback result |

### 7.11 Update Preset Defaults

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:update-defaults` | C→S | `{filename, config}` | Callback result |

### 7.12 Get Available Models Directory

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:get-models-dir` | C→S | `{}` | Callback result |

Scans baseModelsPath for .gguf files and returns with VRAM estimates.

**Response:**

```javascript
{
  success: true,
  data: {
    models: [
      {
        name: string,
        path: string,
        size: number,
        sizeFormatted: string,
        vram: number,
        vramFormatted: string
      }
    ],
    directory: string
  }
}
```

### 7.13 Get Llama.cpp Parameters

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:get-llama-params` | C→S | `{}` | Callback result |

Parses `llama-server --help` to get available parameters with categories.

**Response:**

```javascript
{
  success: true,
  data: {
    categories: {
      "Model Settings": [
        { name: string, type: string, default: string, description: string }
      ],
      "Performance": [...],
      "Sampling": [...],
      // ...
    }
  }
}
```

### 7.14 Validate Preset Config

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:validate-config` | C→S | `{config}` | Callback result |

**Response:**

```javascript
{
  success: true,
  data: {
    valid: boolean,
    errors: ["error message"],
    warnings: ["warning message"]
  }
}
```

### 7.15 Show Config Inheritance

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:show-inheritance` | C→S | `{filename, modelName}` | Callback result |

Shows how a model's final config is computed from default → global → group → model inheritance.

**Response:**

```javascript
{
  success: true,
  data: {
    finalConfig: { /* computed config */ },
    sources: { "ctxSize": "model", "temp": "global" },
    inheritancePath: ["default", "global", "model"]
  }
}
```

### 7.16 Get Available Models

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:available-models` | C→S | `{}` | Callback result |

Alias for `presets:get-models-dir` for frontend compatibility.

### 7.17 Start Server with Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:start-with-preset` | C→S | `{filename, options?}` | Callback result |

**Payload:**

```javascript
{
  filename: string,
  options?: {
    maxModels?: number,
    ctxSize?: number,
    threads?: number
  }
}
```

**Response:**

```javascript
{
  success: true,
  data: {
    port: number,
    url: string,
    mode: string,
    preset: string
  }
}
```

### 7.18 Stop Server

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `presets:stop-server` | C→S | `{}` | Callback result |

---

## 8. Event Reference - Router (Llama.cpp)

Direct llama.cpp server management events.

### 8.1 Get Router Status

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `llama:status` | C→S | `{}` | `llama:status:result` |

**Response Schema:**

```javascript
{
  success: true,
  data: {
    status: "idle" | "running" | "error",
    port?: number,
    url?: string,
    mode?: string,
    preset?: string,
    error?: string
  }
}
```

### 8.2 Start Router

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `llama:start` | C→S | `{}` | `llama:start:result` |

**Response Schema:**

```javascript
{
  success: true,
  data: {
    success: true,
    port: number,
    url: string,
    mode: "router"
  }
}
```

**Broadcasts:** `llama:status` with `{status: "running", port, url, mode: "router"}`

**Error Codes:** `START_LLAMA_FAILED`

### 8.3 Stop Router

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `llama:stop` | C→S | `{}` | `llama:stop:result` |

**Broadcasts:** `llama:status` with `{status: "idle"}`, `models:router-stopped`

**Error Codes:** `STOP_LLAMA_FAILED`

### 8.4 Restart Router

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `llama:restart` | C→S | `{}` | Response via `llama:start:result` |

Stops the server, waits 2 seconds, then starts again.

### 8.5 Configure Router

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `llama:config` | C→S | `{settings}` | `llama:config:result` |

**Payload:**

```javascript
{
  settings: {
    maxModels?: number,
    ctxSize?: number,
    threads?: number
  }
}
```

### 8.6 Start with Preset

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `llama:start-with-preset` | C→S | `{presetName, maxModels?, ctxSize?, threads?}` | `llama:start-with-preset:result` |

---

## 9. Event Reference - Settings

User settings management.

### 9.1 Get Settings

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `settings:get` | C→S | `{}` | `settings:get:result` |

**Response Schema:**

```javascript
{
  success: true,
  data: {
    settings: {
      logLevel?: string,
      autoLoadModels?: boolean,
      maxModelsLoaded?: number,
      threads?: number,
      // ... user preferences
    }
  }
}
```

### 9.2 Update Settings

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `settings:update` | C→S | `{settings}` | `settings:update:result` |

**Special Behavior:** If `logLevel` is changed, it is applied to the FileLogger immediately.

---

## 10. Event Reference - Connection

Connection lifecycle events.

### 10.1 Acknowledge Connection

| Event | Direction | Payload |
|-------|-----------|---------|
| `connection:ack` | C→S | `{}` |

Client sends this after connecting to receive acknowledgment.

### 10.2 Connection Established

| Event | Direction | Payload |
|-------|-----------|---------|
| `connection:established` | S→C | `{clientId, timestamp}` |

**Payload:**

```javascript
{
  clientId: string,    // Socket ID
  timestamp: number
}
```

### 10.3 Disconnect

| Event | Direction | Payload |
|-------|-----------|---------|
| `disconnect` | S→C | `{reason}` |

Standard Socket.IO disconnect event. Reason values:
- `client namespace disconnect`
- `server shutting down`
- `transport close`
- `transport error`

---

## 11. Event Reference - Llama Server

Additional llama-server specific events.

### 11.1 Get Llama Server Status

| Event | Direction | Payload | Response |
|-------|-----------|---------|----------|
| `llama-server:status` | C→S | `{}` | `llama-server:status:result` |

Same as `llama:status` but specifically for the llama-server process.

### 11.2 Llama Server Status Broadcast

| Event | Direction | Payload |
|-------|-----------|---------|
| `llama-server:status` | S→C (broadcast) | `{status, metrics, uptime}` |

**Payload:**

```javascript
{
  status: "running",
  metrics: {
    activeModels: number,
    tokensPerSecond: number,
    queueSize: number,
    totalRequests: number
  },
  uptime: number
}
```

**Frequency:** Every 20 seconds

### 11.3 Llama Server Event

| Event | Direction | Payload |
|-------|-----------|---------|
| `llama:server-event` | S→C (broadcast) | `{type, data}` |

**Payload:**

```javascript
{
  type: "started" | "stopped" | "error" | "closed",
  data: {
    status: "running" | "idle" | "unknown",
    port?: number,
    url?: string,
    mode?: string,
    error?: string
  }
}
```

---

## 12. Error Codes Reference

All error responses include a standardized error code for programmatic handling.

| Code | Meaning | Causes | Resolution |
|------|---------|--------|------------|
| `LIST_MODELS_FAILED` | Failed to list models | Database error, corrupted data | Check database integrity, restart server |
| `GET_MODEL_FAILED` | Model not found or retrieval failed | Invalid modelId, database error | Verify modelId exists |
| `CREATE_MODEL_FAILED` | Model creation failed | Invalid data, database error | Validate model data, check disk space |
| `UPDATE_MODEL_FAILED` | Model update failed | Invalid modelId, invalid updates | Verify modelId and update payload |
| `DELETE_MODEL_FAILED` | Model deletion failed | Invalid modelId, database error | Verify modelId exists |
| `LOAD_MODEL_FAILED` | Model load to router failed | Router not running, invalid model, insufficient memory | Ensure router is running, check memory |
| `UNLOAD_MODEL_FAILED` | Model unload failed | Model not loaded, router error | Verify model is loaded |
| `SCAN_MODELS_FAILED` | Model directory scan failed | Invalid directory path, permission denied, corrupted GGUF | Verify models path, check permissions |
| `START_LLAMA_FAILED` | Failed to start llama-server | Binary not found, port in use, invalid config | Check serverPath, kill conflicting processes |
| `STOP_LLAMA_FAILED` | Failed to stop llama-server | Server not running, process already terminated | Verify server is running |
| `PRESET_NOT_FOUND` | Preset file not found | Invalid preset name, file deleted | Verify preset exists with `presets:list` |
| `PRESET_SAVE_FAILED` | Failed to save preset | Invalid config, disk full, permission denied | Validate config, check disk space |
| `PRESET_INVALID` | Preset validation failed | Missing required fields, invalid values | Check validation errors, fix config |
| `CONFIG_UPDATE_FAILED` | Config update failed | Invalid config, database error | Validate config before sending |
| `CONNECTION_LOST` | WebSocket disconnected unexpectedly | Network issue, server restart | Implement reconnection logic |
| `TIMEOUT` | Request timed out | Server overload, network latency | Retry with backoff |
| `NOT_FOUND` | Resource not found | Invalid ID or path | Verify resource exists |
| `PERMISSION_DENIED` | Operation not permitted | Insufficient permissions | Check file/directory permissions |
| `INVALID_REQUEST` | Malformed request | Missing required fields, invalid types | Validate request payload |

### Handling Errors

```javascript
socket.on("models:list:result", (response) => {
  if (response.success) {
    console.log("Models:", response.data.models);
  } else {
    console.error("Error code:", response.error.code);
    console.error("Error message:", response.error.message);

    // Handle specific error codes
    switch (response.error.code) {
      case "LIST_MODELS_FAILED":
        // Handle database error
        break;
      case "CONNECTION_LOST":
        // Trigger reconnection
        break;
      default:
        // Generic error handling
    }
  }
});
```

---

## 13. Connection Management

### 13.1 Heartbeat Configuration

Socket.IO uses automatic ping/pong heartbeats:

```javascript
const io = new Server(server, {
  pingInterval: 25000,      // Send ping every 25 seconds
  pingTimeout: 20000,       // Wait 20 seconds for pong
  transports: ["websocket"],
});
```

If the client doesn't respond to a ping within the timeout period, the connection is closed.

### 13.2 Reconnection Strategy

The client automatically attempts reconnection with exponential backoff:

```javascript
const socket = io("http://localhost:3000", {
  reconnection: true,
  reconnectionAttempts: Infinity,  // Unlimited attempts
  reconnectionDelay: 1000,         // Start with 1 second
  reconnectionDelayMax: 30000,     // Max 30 seconds between attempts
  timeout: 20000,                  // Connection timeout
});
```

**Reconnection Events:**

| Event | Description |
|-------|-------------|
| `reconnect_attempt` | Attempting to reconnect (includes attempt number) |
| `reconnect` | Successfully reconnected |
| `reconnect_error` | Reconnection attempt failed |
| `reconnect_failed` | All reconnection attempts exhausted |

### 13.3 Disconnection Handling

```javascript
socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);

  switch (reason) {
    case "server shutting down":
      // Server is being restarted
      // Wait and reconnect automatically
      break;
    case "transport close":
      // Network issue
      // Will attempt automatic reconnection
      break;
    case "transport error":
      // WebSocket error
      // Will attempt automatic reconnection
      break;
    default:
      // Handle other disconnect reasons
  }
});
```

### 13.4 Manual Reconnection

```javascript
// Check connection status
if (!socket.connected) {
  // Force reconnection attempt
  socket.connect();
}

// Listen for reconnection
socket.on("reconnect", (attemptNumber) => {
  console.log("Reconnected after", attemptNumber, "attempts");
  // Re-subscribe to state if needed
});
```

### 13.5 Connection State Tracking

```javascript
// Track connection state
let isConnected = false;

socket.on("connect", () => {
  isConnected = true;
  console.log("Connected:", socket.id);
});

socket.on("disconnect", () => {
  isConnected = false;
  console.log("Disconnected");
});

// Check before making requests
if (isConnected) {
  socket.emit("models:list", {...});
} else {
  // Queue request or show offline message
}
```

---

## 14. Rate Limits

### 14.1 Request Guidelines

While there are no hard rate limits, the following guidelines ensure optimal performance:

| Operation | Recommended Frequency | Reason |
|-----------|----------------------|--------|
| `metrics:get` | Every 5+ seconds | Reduces server load |
| `models:list` | On page load + manual refresh | Cached on server |
| `models:scan` | Manual only (expensive) | File system scan |
| `logs:get` | Every 10+ seconds | Database query |
| `presets:*` | On user action | File I/O |

### 14.2 Best Practices

1. **Debounce Rapid Requests:** Group multiple rapid requests into a single batch when possible.

```javascript
// Instead of this
modelIds.forEach(id => socket.emit("models:get", { modelId: id }));

// Use this (if supported) or request sequentially
```

2. **Cache Responses:** Store frequently accessed data locally.

```javascript
let modelCache = null;

async function getModels() {
  if (modelCache) return modelCache;
  const response = await stateManager.getModels();
  modelCache = response.data.models;
  return modelCache;
}
```

3. **Use Broadcasts for Real-time Updates:** Subscribe to broadcast events instead of polling.

```javascript
// Instead of polling
setInterval(() => socket.emit("metrics:get"), 1000);

// Subscribe to broadcast
socket.on("metrics:update", (data) => {
  updateMetricsUI(data.data.metrics);
});
```

4. **Handle Backpressure:** If sending many updates, use a queue with backpressure:

```javascript
const requestQueue = [];
let processing = false;

async function queueRequest(request) {
  requestQueue.push(request);
  processQueue();
}

async function processQueue() {
  if (processing) return;
  processing = true;

  while (requestQueue.length > 0) {
    const req = requestQueue.shift();
    await socket.request(req.event, req.data);
    await new Promise(r => setTimeout(r, 100)); // Rate limit delay
  }

  processing = false;
}
```

---

## Quick Reference

### Common Request Flow

```javascript
// 1. Connect
const socket = io("http://localhost:3000", {
  path: "/llamaproxws",
  transports: ["websocket"]
});

// 2. Wait for connection
socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // 3. Make request
  socket.emit("models:list", { requestId: "req_1" });
});

// 4. Handle response
socket.on("models:list:result", (response) => {
  if (response.success) {
    console.log("Models:", response.data.models);
  } else {
    console.error("Error:", response.error.message);
  }
});

// 5. Listen for broadcasts
socket.on("models:status", (broadcast) => {
  console.log("Model status changed:", broadcast.data);
});

// 6. Handle disconnection
socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
```

### Event Flow Summary

```
Client                           Server
  |                                |
  |-------- connect -------------->|
  |<------- connect ---------------|
  |                                |
  |-------- models:list ---------->|
  |<------ models:list:result -----|
  |                                |
  |-------- models:load ----------->|
  |<------ models:load:result -----|
  |                                |
  |<----- models:status (bc) ------|  (broadcast)
  |                                |
  |<----- metrics:update (bc) -----|  (every 10s)
  |                                |
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-05 | Initial API documentation |

This API reference provides complete documentation for the Llama Async Proxy Dashboard Socket.IO interface. All events, payloads, and error codes are documented above.
