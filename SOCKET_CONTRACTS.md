# Socket.IO Contracts - Stable API Reference

This document defines all Socket.IO handlers and their contracts. These are frozen once defined - components can rely on them not changing.

## Contract Format

```javascript
{
  success: boolean,        // Whether operation succeeded
  data?: any,             // Response data if success=true
  error?: string,         // Error message if success=false
  timestamp: string       // ISO timestamp (always included)
}
```

## Common Patterns

### Request Pattern
All requests accept an optional `requestId` for tracking:
```javascript
socketClient.request("models:list", { requestId: "req_123_abc" });
```

### Response Pattern
```javascript
{
  success: true,
  data: { /* domain-specific data */ },
  timestamp: new Date().toISOString()
}
```

### Error Response
```javascript
{
  success: false,
  error: "Human-readable error message",
  timestamp: new Date().toISOString()
}
```

### Broadcast Pattern
```javascript
socket.broadcast.emit("<domain>:<action>", {
  /* domain-specific payload */,
  timestamp: new Date().toISOString()
});
```

---

## Models Domain

### `models:list` - List all models

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { models: [...] },
  timestamp: new Date().toISOString()
}
```

**Broadcast on change:** `models:updated` with `{ models: [...] }`

---

### `models:get` - Get a single model by ID

**Request:**
```javascript
{ modelId: "model-123" }
```

**Response:**
```javascript
{
  success: true,
  data: { model: { ... } },
  timestamp: new Date().toISOString()
}
```

**Error:** `{ success: false, error: "Not found", timestamp: ... }`

---

### `models:create` - Create a new model

**Request:**
```javascript
{
  model: {
    name: "mistral-7b.gguf",
    path: "/models/mistral-7b.gguf",
    // ... other fields
  }
}
```

**Response:**
```javascript
{
  success: true,
  data: { model: { ... } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `models:created` with `{ model: { ... }, timestamp: ... }`

---

### `models:update` - Update a model

**Request:**
```javascript
{
  modelId: "model-123",
  updates: { favorite: true }
}
```

**Response:**
```javascript
{
  success: true,
  data: { model: { ... } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `models:updated` with `{ model: { ... }, timestamp: ... }`

---

### `models:delete` - Delete a model

**Request:**
```javascript
{ modelId: "model-123" }
```

**Response:**
```javascript
{
  success: true,
  data: { deletedId: "model-123" },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `models:deleted` with `{ modelId: "model-123", timestamp: ... }`

---

### `models:toggle-favorite` - Toggle model favorite status

**Request:**
```javascript
{ modelId: "model-123", favorite: true }
```

**Response:**
```javascript
{
  success: true,
  data: { model: { ... } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `models:updated` with `{ model: { ... }, timestamp: ... }`

---

### `models:scan` - Scan disk for new models

**Request:**
```javascript
{ path?: "/custom/path" }
```

**Response:**
```javascript
{
  success: true,
  data: { scanned: true },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `models:updated` with `{ models: [...], timestamp: ... }`

---

### `models:load` - Load/start a model in router

**Request:**
```javascript
{ modelName: "mistral-7b" }
```

**Response:**
```javascript
{
  success: true,
  data: { model: { ... }, status: "loaded" },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `models:updated` with `{ models: [...], timestamp: ... }`

---

### `models:unload` - Unload/stop a model from router

**Request:**
```javascript
{ modelName: "mistral-7b" }
```

**Response:**
```javascript
{
  success: true,
  data: { model: { ... }, status: "unloaded" },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `models:updated` with `{ models: [...], timestamp: ... }`

---

### `models:router-stopped` - Router stopped notification (broadcast only)

**Type:** Broadcast only (no request)
**Payload:**
```javascript
{}
```

---

## Llama Router Domain

### `llama:status` - Get llama server status

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: {
    status: "idle" | "running" | "starting" | "stopping" | "error",
    port: number | null,
    url: string | null,
    mode: "router",
    error?: string
  },
  timestamp: new Date().toISOString()
}
```

---

### `llama:start` - Start llama server

**Request:**
```javascript
{
  maxModels?: 4,
  ctxSize?: 4096,
  threads?: 4
}
```

**Response:**
```javascript
{
  success: true,
  data: { port: 8080, url: "http://localhost:8080" },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `llama:status` with `{ status: "running", port, url, mode: "router", timestamp }`

---

### `llama:stop` - Stop llama server

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { stopped: true },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `llama:status` with `{ status: "idle", port: null, url: null, mode: "router", timestamp }`
**Broadcast:** `models:router-stopped` with `{}`

---

### `llama:restart` - Restart llama server

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { port: 8080, url: "http://localhost:8080" },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `llama:status` (idle during stop, running during start)

---

### `llama:start-with-preset` - Start with preset

**Request:**
```javascript
{
  presetName: "high-performance",
  maxModels?: 4,
  ctxSize?: 4096,
  threads?: 4
}
```

**Response:**
```javascript
{
  success: true,
  data: { port: 8080, url: "http://localhost:8080" },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `llama:status` with `{ status: "running", port, url, mode: "router", timestamp }`

---

### `llama:config` - Configure llama settings

**Request:**
```javascript
{
  settings: { /* settings object */ }
}
```

**Response:**
```javascript
{
  success: true,
  data: { settings: { /* settings */ } },
  timestamp: new Date().toISOString()
}
```

---

### `llama:server-event` - Generic llama server event (broadcast)

**Type:** Broadcast only
**Payload:**
```javascript
{
  type: "event-type",
  data: { /* event data */ }
}
```

---

## Config Domain

### `config:get` - Get server configuration

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { config: { /* config object */ } },
  timestamp: new Date().toISOString()
}
```

---

### `config:update` - Update server configuration

**Request:**
```javascript
{
  config: { /* config object */ }
}
```

**Response:**
```javascript
{
  success: true,
  data: { config: { /* config */ } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `config:updated` with `{ config: { /* config */ }, timestamp }`

---

### `settings:get` - Get user settings

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { settings: { /* settings */ } },
  timestamp: new Date().toISOString()
}
```

---

### `settings:update` - Update user settings

**Request:**
```javascript
{
  settings: { /* settings */ }
}
```

**Response:**
```javascript
{
  success: true,
  data: { settings: { /* settings */ } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `settings:updated` with `{ settings: { /* settings */ }, timestamp }`

---

### `routerConfig:get` - Get router config (unified)

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { config: { /* router config */ } },
  timestamp: new Date().toISOString()
}
```

---

### `routerConfig:update` - Update router config (unified)

**Request:**
```javascript
{
  config: { /* router config */ }
}
```

**Response:**
```javascript
{
  success: true,
  data: { config: { /* router config */ } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `routerConfig:updated` with `{ config: { /* config */ }, timestamp }`

---

### `routerConfig:reset` - Reset router config to defaults

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { config: { /* default config */ } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `routerConfig:updated` with `{ config: { /* config */ }, timestamp }`

---

### `loggingConfig:get` - Get logging config

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { config: { /* logging config */ } },
  timestamp: new Date().toISOString()
}
```

---

### `loggingConfig:update` - Update logging config

**Request:**
```javascript
{
  config: { /* logging config */ }
}
```

**Response:**
```javascript
{
  success: true,
  data: { config: { /* logging config */ } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `loggingConfig:updated` with `{ config: { /* config */ }, timestamp }`

---

### `loggingConfig:reset` - Reset logging config

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { config: { /* default logging config */ } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `loggingConfig:updated` with `{ config: { /* config */ }, timestamp }`

---

## Logs Domain

### `logs:get` - Get log entries

**Request:**
```javascript
{
  limit?: 100  // Default: 100
}
```

**Response:**
```javascript
{
  success: true,
  data: { logs: [...] },
  timestamp: new Date().toISOString()
}
```

---

### `logs:clear` - Clear logs from database

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { cleared: true },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `logs:cleared` with `{ count: number, timestamp: ... }`

---

### `logs:read-file` - Read specific log file

**Request:**
```javascript
{ fileName: "app.log" }
```

**Response:**
```javascript
{
  success: true,
  data: { logs: [...], fileName: "app.log" },
  timestamp: new Date().toISOString()
}
```

---

### `logs:list-files` - List available log files

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { files: [...], size: 1234567 },
  timestamp: new Date().toISOString()
}
```

---

### `logs:read-llama-server` - Read llama-server.log

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { logs: [...], fileName: "llama-server.log" },
  timestamp: new Date().toISOString()
}
```

---

### `logs:entry` - Client log entry (one-way)

**Type:** Client → Server (no response)
**Request:**
```javascript
{
  entry: {
    level: "info",
    message: "User performed action",
    source: "client"
  }
}
```

---

### `logs:cleared` - Logs cleared notification (broadcast)

**Type:** Broadcast only
**Payload:**
```javascript
{
  count: 100,
  timestamp: new Date().toISOString()
}
```

---

## Metrics Domain

### `metrics:get` - Get current metrics

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { metrics: { /* metrics object */ } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `metrics:updated` with `{ metrics: { /* metrics */ }, timestamp }`

---

### `metrics:history` - Get historical metrics

**Request:**
```javascript
{
  limit?: 60,
  offset?: 0
}
```

**Response:**
```javascript
{
  success: true,
  data: { history: [...] },
  timestamp: new Date().toISOString()
}
```

---

## Presets Domain

### `presets:list` - List all presets

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: { presets: [...] },
  timestamp: new Date().toISOString()
}
```

---

### `presets:get` - Get a preset

**Request:**
```javascript
{ name: "high-performance" }
```

**Response:**
```javascript
{
  success: true,
  data: { preset: { /* preset object */ } },
  timestamp: new Date().toISOString()
}
```

---

### `presets:save` - Save a preset

**Request:**
```javascript
{
  preset: { /* preset object */ }
}
```

**Response:**
```javascript
{
  success: true,
  data: { preset: { /* preset */ } },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `presets:updated` with `{ presets: [...], timestamp }`

---

### `presets:delete` - Delete a preset

**Request:**
```javascript
{ name: "high-performance" }
```

**Response:**
```javascript
{
  success: true,
  data: { name: "high-performance" },
  timestamp: new Date().toISOString()
}
```

**Broadcast:** `presets:updated` with `{ presets: [...], timestamp }`

---

## Broadcasting Rules

1. **Always broadcast on shared state changes** - Don't rely on requester to forward
2. **Use specific event names** - `<domain>:updated`, `<domain>:created`, `<domain>:deleted`
3. **Include full current state** - Receivers should not need additional requests
4. **All clients see broadcasts** - Except the sender (use `socket.broadcast.emit`)
5. **Always include timestamp** - Enables clients to detect stale data

---

## Implementation Checklist

For each handler:
- [x] Document request schema
- [x] Document response schema
- [x] Define broadcast events
- [ ] Validate all inputs
- [ ] Handle errors gracefully
- [ ] Log important operations
- [ ] Don't call other handlers
- [ ] Return consistent response format

---

## Migration Mapping: stateManager → socket

| Old (stateManager) | New (socketClient.request) |
|-------------------|---------------------------|
| `stateManager.getModels()` | `socketClient.request("models:list", {})` |
| `stateManager.getModel(id)` | `socketClient.request("models:get", { modelId: id })` |
| `stateManager.loadModel(name)` | `socketClient.request("models:load", { modelName: name })` |
| `stateManager.unloadModel(name)` | `socketClient.request("models:unload", { modelName: name })` |
| `stateManager.deleteModel(id)` | `socketClient.request("models:delete", { modelId: id })` |
| `stateManager.scanModels()` | `socketClient.request("models:scan", {})` |
| `stateManager.getRouterStatus()` | `socketClient.request("llama:status", {})` |
| `stateManager.startLlama()` | `socketClient.request("llama:start", {})` |
| `stateManager.stopLlama()` | `socketClient.request("llama:stop", {})` |
| `stateManager.restartLlama()` | `socketClient.request("llama:restart", {})` |
| `stateManager.getConfig()` | `socketClient.request("config:get", {})` |
| `stateManager.updateConfig(c)` | `socketClient.request("config:update", { config: c })` |
| `stateManager.getLogs(p)` | `socketClient.request("logs:get", p)` |
| `stateManager.clearLogs()` | `socketClient.request("logs:clear", {})` |
| `stateManager.getMetrics()` | `socketClient.request("metrics:get", {})` |
| `stateManager.getSettings()` | `socketClient.request("settings:get", {})` |
| `stateManager.updateSettings(s)` | `socketClient.request("settings:update", { settings: s })` |
| `stateManager.getRouterConfig()` | `socketClient.request("routerConfig:get", {})` |
| `stateManager.updateRouterConfig(c)` | `socketClient.request("routerConfig:update", { config: c })` |
| `stateManager.getLoggingConfig()` | `socketClient.request("loggingConfig:get", {})` |
| `stateManager.updateLoggingConfig(c)` | `socketClient.request("loggingConfig:update", { config: c })` |

### `models:list` - List all models

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: [
    {
      id: "model-123",
      name: "mistral-7b.gguf",
      size: 4294967296,
      status: "loaded|loading|unloaded|error",
      loadedAt: 1704112345000,
      metadata: { ... }
    }
  ]
}
```

**Broadcast on change:**
```javascript
socket.broadcast.emit("models:updated", {
  models: [ ... ]
});
```

---

### `models:scan` - Scan disk for new models

**Request:**
```javascript
{
  path?: string  // Optional custom scan path
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    found: 5,
    added: 2,
    updated: 1,
    models: [ ... ]
  }
}
```

**Broadcast:**
```javascript
socket.broadcast.emit("models:updated", {
  models: [ ... ]
});
```

---

### `models:load` - Load/start a model

**Request:**
```javascript
{
  modelName: "mistral-7b.gguf"
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    model: { ... },
    status: "loaded"
  }
}
```

**Broadcast:**
```javascript
socket.broadcast.emit("models:updated", {
  models: [ ... ]
});
socket.broadcast.emit("router:status", {
  status: "ready",
  loadedModel: "mistral-7b.gguf"
});
```

---

### `models:unload` - Unload/stop a model

**Request:**
```javascript
{
  modelName: "mistral-7b.gguf"
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    model: { ... },
    status: "unloaded"
  }
}
```

**Broadcast:**
```javascript
socket.broadcast.emit("models:updated", {
  models: [ ... ]
});
socket.broadcast.emit("router:status", {
  status: "idle"
});
```

---

### `models:delete` - Delete a model file

**Request:**
```javascript
{
  modelName: "mistral-7b.gguf"
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    modelName: "mistral-7b.gguf",
    deleted: true
  }
}
```

**Broadcast:**
```javascript
socket.broadcast.emit("models:updated", {
  models: [ ... ]
});
```

---

## Router Domain

### `router:status` - Get router/llama status

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: {
    status: "ready|loading|stopping|error",
    loadedModel: "mistral-7b.gguf",
    uptime: 3600000,
    cpuUsage: 45.2,
    memoryUsage: 2147483648,
    timestamp: 1704112345000
  }
}
```

---

### `router:restart` - Restart the llama server

**Request:**
```javascript
{
  signal?: "SIGTERM"  // Optional signal to send
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    status: "restarting"
  }
}
```

**Broadcast (on completion):**
```javascript
socket.broadcast.emit("router:status", {
  status: "ready"
});
```

---

### `router:start-with-preset` - Start router with preset config

**Request:**
```javascript
{
  presetName: "high-performance"
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    preset: "high-performance",
    status: "starting"
  }
}
```

**Broadcast:**
```javascript
socket.broadcast.emit("router:status", {
  status: "loading"
});
```

---

## Config Domain

### `config:get` - Get server configuration

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: {
    modelsDir: "/models",
    modelsMax: 4,
    contextSize: 8192,
    gpuLayers: 99,
    threads: 4
  }
}
```

---

### `config:update` - Update server configuration

**Request:**
```javascript
{
  key: "modelsDir",
  value: "/home/user/models"
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    key: "modelsDir",
    value: "/home/user/models"
  }
}
```

**Broadcast:**
```javascript
socket.broadcast.emit("config:updated", {
  config: { ... }
});
```

---

## Logs Domain

### `logs:get` - Get log entries

**Request:**
```javascript
{
  limit?: 100,
  offset?: 0,
  level?: "debug"  // Optional filter by level
}
```

**Response:**
```javascript
{
  success: true,
  data: [
    {
      timestamp: 1704112345000,
      level: "info",
      message: "Model loaded",
      source: "server"
    }
  ]
}
```

---

### `logs:clear` - Clear in-memory logs

**Request:**
```javascript
{}
```

**Response:**
```javascript
{
  success: true,
  data: {
    cleared: true
  }
}
```

**Broadcast:**
```javascript
socket.broadcast.emit("logs:cleared", {});
```

---

## Broadcasting Rules

1. **Always broadcast on shared state changes** - Don't rely on requester to forward
2. **Use specific event names** - `<domain>:updated`, `<domain>:created`, `<domain>:deleted`
3. **Include full current state** - Receivers should not need additional requests
4. **All clients see broadcasts** - Except the sender (use `socket.broadcast.emit`)

---

## Implementation Checklist

For each handler:
- [ ] Document request schema
- [ ] Document response schema
- [ ] Define broadcast events
- [ ] Validate all inputs
- [ ] Handle errors gracefully
- [ ] Log important operations
- [ ] Don't call other handlers
- [ ] Return consistent response format
