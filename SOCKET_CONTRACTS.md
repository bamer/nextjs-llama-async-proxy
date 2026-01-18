# Socket.IO Contracts - Stable API Reference

This document defines all Socket.IO handlers and their contracts. These are frozen once defined - components can rely on them not changing.

## Contract Format

```javascript
{
  success: boolean,        // Whether operation succeeded
  data?: any,             // Response data if success=true
  error?: string,         // Error message if success=false
  timestamp: string       // ISO timestamp
}
```

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
