# Socket.IO Standard

This document defines the **ONLY** acceptable pattern for using Socket.IO in this project.

---

## Golden Rules

1. **USE `socket` FOR SENDING TO CLIENTS** - Always use the `socket` object passed to your handler
2. **USE `io` FOR BROADCASTING** - Use the `io` (Server) instance passed to your handler registration
3. **NEVER USE `global.io`** - This is a forbidden anti-pattern
4. **PASS `io` VIA PARAMETERS** - If your function needs to broadcast, receive `io` as a parameter

---

## Correct Patterns

### Pattern 1: Handler Function (RECEIVES `socket` AND `io`)

```javascript
// In handlers.js
export function registerMyHandler(socket, io, db) {
  // Respond to the client that sent the request
  socket.on("my:event", (data, ack) => {
    socket.emit("my:response", { data });
  });

  // Broadcast to ALL clients (including sender)
  io.emit("broadcast:event", { message: "hello all" });

  // Broadcast to ALL CLIENTS EXCEPT sender (recommended for metrics)
  socket.broadcast.emit("metrics:update", { usage: 42 });
}
```

### Pattern 2: Function That Needs to Broadcast

```javascript
// BAD - Using global.io (FORBIDDEN)
function notifyClients() {
  global.io.emit("event", data); // ❌ FORBIDDEN
}

// GOOD - Receive io via parameter
function notifyClients(io, data) {
  io.emit("event", data); // ✅ CORRECT
}

// GOOD - Use class setter
class MyManager {
  setIo(io) {
    this.io = io;
  }

  notifyClients(data) {
    this.io.emit("event", data); // ✅ CORRECT
  }
}
```

### Pattern 3: Metrics Collection (USE `socket.broadcast.emit`)

```javascript
// In metrics.js
async function collectAndEmitMetrics(socket, db) {
  const metrics = await collectMetrics();

  // Broadcast to all clients EXCEPT the one that triggered this
  socket.broadcast.emit("metrics:update", {
    type: "broadcast",
    data: { metrics },
  });
}
```

---

## Registration Flow

```
server.js
  ├─ Creates: io = new Server()
  ├─ Calls: registerHandlers(io, db, ...)
  │   └─ handlers.js
  │       ├─ registerConnectionHandlers(socket, logger)
  │       ├─ registerModelsHandlers(socket, io, db, ggufParser)
  │       │   └─ registerModelsCrudHandlers(socket, io, db)
  │       │   └─ registerModelsRouterHandlers(socket, io)
  │       │   └─ registerModelsScanHandlers(socket, io, db, ggufParser)
  │       ├─ registerMetricsHandlers(socket, db)
  │       ├─ registerLogsHandlers(socket, db)
  │       ├─ registerConfigHandlers(socket, db)
  │       ├─ registerPresetsHandlers(socket, db)
  │       └─ registerLlamaHandlers(socket, io, db, initializeLlamaMetrics)
  └─ Calls: startMetricsCollection(io, db)
```

---

## Handler Signature Reference

| Handler | Parameters | Needs io? | Purpose |
|---------|-----------|-----------|---------|
| `registerConnectionHandlers` | `(socket, logger)` | ❌ | Connection events |
| `registerModelsHandlers` | `(socket, io, db, ggufParser)` | ✅ | Model CRUD + broadcast |
| `registerMetricsHandlers` | `(socket, db)` | ❌ | Metrics requests only |
| `registerLogsHandlers` | `(socket, db)` | ❌ | Log requests only |
| `registerConfigHandlers` | `(socket, db)` | ❌ | Config requests only |
| `registerPresetsHandlers` | `(socket, db)` | ❌ | Preset requests only |
| `registerLlamaHandlers` | `(socket, io, db, initializeLlamaMetrics)` | ✅ | Llama server control |

---

## Common Errors

### Error: "io is not defined"

**Cause:** Using `io.emit()` without receiving `io` as a parameter.

```javascript
// ❌ WRONG - io not in scope
export function myHandler(socket, db) {
  io.emit("event", data); // io is undefined!
}

// ✅ CORRECT - receive io as parameter
export function myHandler(socket, io, db) {
  io.emit("event", data);
}
```

### Error: "Cannot read property 'emit' of undefined"

**Cause:** `io` was not passed when calling the function.

```javascript
// ❌ WRONG - called without io
registerMyHandler(socket, db); // Missing io!

// ✅ CORRECT - pass all required parameters
registerMyHandler(socket, io, db);
```

---

## File Organization

```
server/
├── server.js                    # Creates io = new Server()
├── handlers.js                  # Registers all handlers with io
├── handlers/
│   ├── connection.js            # (socket) - no io needed
│   ├── config.js                # (socket, db) - no io needed
│   ├── logs.js                  # (socket, db) - no io needed
│   ├── metrics.js               # (socket, db) - no io needed
│   ├── presets/
│   │   └── handlers.js          # (socket, db) - no io needed
│   ├── models/
│   │   ├── index.js             # (socket, io, db, ggufParser)
│   │   ├── crud.js              # (socket, io, db)
│   │   ├── router-ops.js        # (socket, io)
│   │   └── scan.js              # (socket, io, db, ggufParser)
│   ├── llama.js                 # (socket, io, db, initializeLlamaMetrics)
│   └── llama-router/
│       ├── process-handlers.js  # (socket, io, db, processManager)
│       └── ...
└── metrics.js                   # Uses socket.broadcast.emit()
```

---

## Testing Checklist

Before committing any socket.io changes:

- [ ] Handler receives `io` if it calls `io.emit()`
- [ ] Handler receives `socket` for all Socket.IO operations
- [ ] No `global.io` references exist
- [ ] Metrics use `socket.broadcast.emit()` for updates
- [ ] All handler registrations pass the correct parameters

---

## Forbidden Patterns

```javascript
// ❌ FORBIDDEN: global.io
if (global.io) {
  global.io.emit("event", data);
}

// ❌ FORBIDDEN: module-level io
let io;
export function setIo(i) { io = i; } // Never use this pattern

// ❌ FORBIDDEN: requiring socket.io in multiple places
import { Server } from "socket.io"; // Only in server.js!

// ❌ FORBIDDEN: creating new Server instances
const io = new Server(); // Creates new server, breaks connections!
```

---

## Client-Side (public/js/services/socket.js)

The client uses the Socket.IO client library:

```javascript
// Connect to server
const socket = io({
  path: "/llamaproxws",
  transports: ["websocket"],
});

// Listen for events
socket.on("metrics:update", (data) => {
  console.log("Received metrics:", data);
});

// Send events
socket.emit("metrics:subscribe", { interval: 2000 });
```

**Client rule:** Always use `this.socket` from the SocketService class - never create direct Socket.IO connections.

---

## Summary

| What | Use |
|------|-----|
| Respond to requester | `socket.emit("event", data)` |
| Broadcast to all | `io.emit("event", data)` |
| Broadcast to others | `socket.broadcast.emit("event", data)` |
| Receive in handler | `(socket, io, db) => {...}` |
| Pass to function | `myFunction(socket, io, db)` |
| **NEVER** | `global.io` |
