# Server Handler Template

Every Socket.IO handler must follow this template to ensure stable contracts.

## Handler Template

```javascript
/**
 * Stable Socket.IO Handler
 * 
 * Domain: <domain> (models, router, config, logs)
 * Action: <action> (list, load, delete, etc.)
 * 
 * CONTRACT:
 * - Input: { <field>: <type>, ... }
 * - Output: { success: bool, data?: any, error?: string }
 * - Broadcasts: <event-name> with { <fields> }
 * 
 * @param {SocketIO.Socket} socket - Socket.IO socket instance
 * @param {Object} db - Database instance
 */
function registerModelsList(socket, db) {
  socket.on("models:list", (req, callback) => {
    try {
      // [DEBUG] Log for development
      console.log("[DEBUG] models:list request", { requestId: req.requestId });

      // Validate input (if needed)
      // - Usually list operations have no required input

      // Execute business logic
      const models = db.getModels();

      // Return success response
      callback({
        success: true,
        data: models,
        timestamp: new Date().toISOString(),
      });

      // [DEBUG] Log result
      console.log("[DEBUG] models:list response", {
        requestId: req.requestId,
        count: models.length,
      });
    } catch (error) {
      // Log error
      console.error("[ERROR] models:list failed:", error.message);

      // Return error response
      callback({
        success: false,
        error: error.message || "Failed to list models",
        timestamp: new Date().toISOString(),
      });
    }
  });
}
```

## Complete Example: models:load

```javascript
/**
 * Load/start a model
 * 
 * CONTRACT:
 * - Input: { modelName: string }
 * - Output: { success: bool, data?: {model, status}, error?: string }
 * - Broadcasts: models:updated, router:status
 */
function registerModelsLoad(socket, db) {
  socket.on("models:load", (req, callback) => {
    try {
      console.log("[DEBUG] models:load request", {
        requestId: req.requestId,
        modelName: req.modelName,
      });

      // Validate input
      if (!req.modelName || typeof req.modelName !== "string") {
        return callback({
          success: false,
          error: "Invalid modelName",
          timestamp: new Date().toISOString(),
        });
      }

      // Business logic
      const model = db.getModelByName(req.modelName);
      if (!model) {
        return callback({
          success: false,
          error: `Model not found: ${req.modelName}`,
          timestamp: new Date().toISOString(),
        });
      }

      // Start the model (async operation)
      const result = startModel(model);

      // Update database
      db.updateModel(model.id, { status: "loaded", loadedAt: Date.now() });

      // Return success response
      callback({
        success: true,
        data: {
          model: db.getModel(model.id),
          status: "loaded",
        },
        timestamp: new Date().toISOString(),
      });

      // Broadcast to all clients for sync
      // Note: Use socket.broadcast (not socket.emit) to exclude sender
      socket.broadcast.emit("models:updated", {
        models: db.getModels(),
        timestamp: new Date().toISOString(),
      });

      socket.broadcast.emit("router:status", {
        status: "ready",
        loadedModel: model.name,
        timestamp: new Date().toISOString(),
      });

      console.log("[DEBUG] models:load response", {
        requestId: req.requestId,
        modelName: req.modelName,
        success: true,
      });
    } catch (error) {
      console.error("[ERROR] models:load failed:", error.message);

      callback({
        success: false,
        error: error.message || "Failed to load model",
        timestamp: new Date().toISOString(),
      });
    }
  });
}
```

## Key Rules

### 1. Always Use Callback Format
```javascript
callback({
  success: true,        // or false
  data: {...},          // Only if success=true
  error: "message",     // Only if success=false
  timestamp: "ISO"      // Always include
});
```

### 2. Validate Input
```javascript
if (!req.modelName || typeof req.modelName !== "string") {
  return callback({
    success: false,
    error: "Invalid modelName: must be a non-empty string",
  });
}
```

### 3. Handle Errors Gracefully
```javascript
try {
  // business logic
} catch (error) {
  console.error("[ERROR] handler-name failed:", error);
  callback({
    success: false,
    error: error.message || "Operation failed",
  });
}
```

### 4. Broadcast on State Changes
```javascript
// Use socket.broadcast.emit to exclude the sender
socket.broadcast.emit("models:updated", {
  models: db.getModels(),
  timestamp: new Date().toISOString(),
});
```

### 5. Never Call Other Handlers
```javascript
// ❌ WRONG
socket.emit("models:list", {}, (models) => {
  // ...
});

// ✅ CORRECT
const models = db.getModels();
```

### 6. Log Important Operations
```javascript
// [DEBUG] for development logs
console.log("[DEBUG] handler-name request", { field: value });

// [INFO] for important events
console.log("[INFO] Model loaded:", { modelName });

// [ERROR] for errors
console.error("[ERROR] handler-name failed:", error);
```

### 7. Don't Expose Sensitive Data
```javascript
// ❌ WRONG - exposes API keys
return callback({
  success: true,
  data: {
    apiKey: config.apiKey,
  },
});

// ✅ CORRECT - only expose what clients need
return callback({
  success: true,
  data: {
    modelCount: models.length,
    status: "ready",
  },
});
```

## Handler Registration

All handlers must be registered in a single place (server/handlers/index.js):

```javascript
export function registerHandlers(io, db, parseGgufMetadata, initializeLlamaMetrics) {
  io.on("connection", (socket) => {
    // Register all handlers for this socket
    registerModelsList(socket, db);
    registerModelsLoad(socket, db);
    registerModelsUnload(socket, db);
    registerModelsDelete(socket, db);
    registerModelsScan(socket, db);
    registerRouterStatus(socket, db);
    registerRouterRestart(socket, db);
    registerConfigGet(socket, db);
    registerConfigUpdate(socket, db);
    registerLogsGet(socket, db);
    registerLogsClear(socket, db);
  });
}
```

## Testing Handler Contract

```javascript
describe("models:load handler", () => {
  let socket, io, db;

  beforeEach(() => {
    // Mock socket
    socket = new MockSocket();
    // Register handler
    registerModelsLoad(socket, db);
  });

  it("should return success on valid input", (done) => {
    socket.emit("models:load", { modelName: "mistral-7b" }, (response) => {
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.timestamp).toBeDefined();
      done();
    });
  });

  it("should return error on invalid input", (done) => {
    socket.emit("models:load", {}, (response) => {
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      done();
    });
  });

  it("should broadcast models:updated on success", (done) => {
    socket.broadcast.on("models:updated", (data) => {
      expect(data.models).toBeDefined();
      done();
    });

    socket.emit("models:load", { modelName: "mistral-7b" }, () => {});
  });
});
```

## Handler Lifecycle

```
Client              Socket Handler           Database           Broadcast
  |                     |                        |                  |
  |--request----------->|                        |                  |
  |                     |--read/write---------->|                  |
  |                     |<--result-----------<-|                  |
  |                     |--broadcast------------------------------------------->
  |<--response---------|                        |                  |
  |                     |                        |                 |<--all clients
```

## Handler Naming Convention

```
<domain>:<action>

models:list       - Get all models
models:scan       - Scan disk for new models
models:load       - Load/start a model
models:unload     - Unload/stop a model
models:delete     - Delete a model file

router:status     - Get router status
router:restart    - Restart the llama server

config:get        - Get configuration
config:update     - Update configuration

logs:get          - Get logs
logs:clear        - Clear logs
```

## Broadcast Naming Convention

```
<domain>:updated      - Entity was updated
<domain>:created      - Entity was created
<domain>:deleted      - Entity was deleted
<domain>:status       - Status changed
```

## Anti-Patterns

### ❌ Tight Coupling (Don't Do This)
```javascript
socket.on("models:load", (req, callback) => {
  // Calls another handler - bad!
  socket.emit("metrics:start", {}, () => {
    // ...
  });
});
```

### ❌ Inconsistent Response (Don't Do This)
```javascript
socket.on("models:list", (req, callback) => {
  // Returns different formats - confuses clients
  if (success) {
    callback({ models: [...] });  // No success field!
  } else {
    callback({ error: "Failed" });
  }
});
```

### ❌ Not Broadcasting (Don't Do This)
```javascript
socket.on("models:load", (req, callback) => {
  // Only responds to sender - other clients don't know
  const model = loadModel(req.modelName);
  callback({ success: true, model });
  // Missing: socket.broadcast.emit("models:updated", ...)
});
```

### ❌ Silent Failures (Don't Do This)
```javascript
socket.on("models:load", (req, callback) => {
  try {
    loadModel(req.modelName);
    callback({ success: true });
  }
  // Missing: catch block!
});
```

## Handler Checklist

For each handler, verify:

- [ ] Accepts request object with requestId
- [ ] Returns callback with {success, data/error, timestamp}
- [ ] Validates all inputs
- [ ] Handles errors with try-catch
- [ ] Broadcasts on state changes
- [ ] Doesn't call other handlers
- [ ] Logs with [DEBUG], [INFO], or [ERROR]
- [ ] Documented in SOCKET_CONTRACTS.md
- [ ] Registered in registerHandlers()
- [ ] Unit tested

---

## Summary

Every handler is a contract between client and server:
1. **Clear inputs** - Validate everything
2. **Consistent response** - Always {success, data/error}
3. **Broadcast updates** - All clients stay in sync
4. **No coupling** - Standalone business logic
5. **Proper logging** - Easy to debug
