# Project Rules - GOLDEN

**Non-negotiable rules for this project. Violations = broken code.**

---

## Rule 1: ONLY Socket.IO

**Law:** Socket.IO is the ONLY allowed real-time communication layer.

### Forbidden
```javascript
// ❌ FORBIDDEN - WebSocket directly
const ws = new WebSocket("ws://...");

// ❌ FORBIDDEN - Any other library
import io from "socket.io-client"; // WRONG import style
import { Server } from "socket.io"; // In client code

// ❌ FORBIDDEN - Wrapper classes
class MySocketWrapper {
  constructor() {
    this.socket = null;
  }
  connect() { /* ... */ }
  send() { /* ... */ }
}

// ❌ FORBIDDEN - global.io hacks
global.io.emit("event", data);
```

### Required Pattern
```javascript
// ✅ REQUIRED - Server: single Server instance
// In server.js ONLY
import { Server } from "socket.io";
const io = new Server(server, { transports: ["websocket"] });

// ✅ REQUIRED - Pass io to functions that need broadcasting
function myHandler(socket, io, db) {
  socket.emit("response", data);      // To sender only
  socket.broadcast.emit("update", {}); // To all EXCEPT sender
  io.emit("broadcast", data);          // To ALL (rare)
}

// ✅ REQUIRED - Client: use SocketService
import { SocketService } from "./services/socket.js";
const socket = new SocketService();
socket.connect();
socket.emit("event", data);
socket.on("response", handler);
```

### Where Each Pattern Lives

| File | What | Why |
|------|------|-----|
| `server.js` | `new Server()` | Single entry point |
| `handlers/*.js` | `socket` + `io` params | Request/response |
| `metrics.js` | `socket.broadcast.emit()` | Live updates |
| `public/js/services/socket.js` | `io()` from client lib | Connection |
| `**/*.test.js` | Test files can import | Testing only |

### Semantic Rules

```javascript
// ✅ GOOD - Clear intent
socket.on("models:list", handler);        // Listen
socket.emit("models:list:result", data);  // Respond
io.emit("models:updated", data);          // Broadcast

// ❌ BAD - Wrapper hides Socket.IO
mySocket.send("models:list");             // What is mySocket?
mySocket.send("response", data);          // Non-standard API
```

---

## Rule 2: NO setInterval - Real Async Only

**Law:** Use event-driven patterns, NOT polling loops.

### Forbidden
```javascript
// ❌ FORBIDDEN - setInterval for periodic tasks
setInterval(() => {
  collectMetrics();
}, 2000);

// ❌ FORBIDDEN - setTimeout loop
function poll() {
  setTimeout(() => {
    fetchData();
    poll();
  }, 1000);
}

// ❌ FORBIDDEN - Polling anywhere
while (true) {
  checkStatus();
  sleep(1000);
}
```

### Required Pattern: Event-Driven

```javascript
// ✅ REQUIRED - Client subscribes, server pushes
// Client:
socket.emit("metrics:subscribe", { interval: 2000 });
socket.on("metrics:update", (data) => {
  // Received new metrics
});

// Server:
const subscriptions = new Map(); // socket.id -> { interval, timeoutId }

socket.on("metrics:subscribe", (req) => {
  const interval = req.interval || 2000;
  
  // Store subscription
  subscriptions.set(socket.id, {
    interval,
    timeoutId: setInterval(() => {
      collectAndEmitMetrics(socket);
    }, interval)
  });
});

socket.on("metrics:unsubscribe", () => {
  const sub = subscriptions.get(socket.id);
  if (sub?.timeoutId) clearInterval(sub.timeoutId);
  subscriptions.delete(socket.id);
});

socket.on("disconnect", () => {
  // Cleanup on disconnect
  const sub = subscriptions.get(socket.id);
  if (sub?.timeoutId) clearInterval(sub.timeoutId);
  subscriptions.delete(socket.id);
});
```

### Event-Driven Patterns

| Use Case | Pattern | Example |
|----------|---------|---------|
| Live metrics | Subscribe → Push | `metrics:subscribe` → `metrics:update` |
| Real-time logs | Subscribe → Stream | `logs:subscribe` → `logs:entry` |
| Status changes | Event emission | `model:loaded` → broadcast |
| One-time request | Request → Response | `config:get` → `config:get:result` |

### Correct Async Flow

```javascript
// ✅ CORRECT - Event-driven architecture
// 1. Client connects
socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

// 2. Client subscribes to updates
socket.emit("metrics:subscribe", { interval: 2000 });

// 3. Server emits when data changes (NOT on interval)
io.on("connection", (socket) => {
  // On connection, send initial data
  socket.emit("initial:data", getData());
  
  // Listen for client commands
  socket.on("command", async (req) => {
    const result = await processCommand(req);
    socket.emit("command:result", result);
  });
  
  // Broadcast to others when something changes
  socket.on("update", (data) => {
    socket.broadcast.emit("data:updated", data);
  });
});

// ❌ WRONG - Polling
setInterval(async () => {
  const data = await fetch("/api/data");
  updateUI(data);
}, 1000);
```

### When setInterval IS Allowed

Only for **internal** timers (not communication):

```javascript
// ✅ OK - Cleanup timers
const timeoutId = setTimeout(() => {
  cleanup();
}, 60000);

// ✅ OK - Retry logic (with limit)
const retry = setInterval(() => {
  attempts++;
  if (attempts >= 3 || success) {
    clearInterval(retry);
  }
}, 1000);

// ✅ OK - Heartbeat (internal only)
setInterval(() => {
  checkHealth();
}, 30000);
```

---

## Rule 3: Async/Await Only

**Law:** Use async/await for all asynchronous operations.

### Forbidden
```javascript
// ❌ FORBIDDEN - Callback hell
fs.readFile("file.txt", (err, data) => {
  if (err) throw err;
  parse(data, (err, result) => {
    if (err) throw err;
    save(result, (err) => {
      if (err) throw err;
      done();
    });
  });
});

// ❌ FORBIDDEN - .then() chains for complex logic
fetchData()
  .then(parse)
  .then(save)
  .then(() => fetchMore())
  .then(process);
```

### Required
```javascript
// ✅ REQUIRED - async/await everywhere
async function handleRequest(req) {
  try {
    const data = await fs.readFile("file.txt");
    const result = await parse(data);
    await save(result);
    return result;
  } catch (e) {
    console.error("Failed:", e);
    throw e;
  }
}

// ✅ OK - Simple .then() for trivial cases
fetchData().then(ui.update);

// ✅ OK - Promise.all() for parallel
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);
```

---

## Rule 4: Clean Event Names

**Law:** Event names follow semantic patterns.

### Pattern
```
<domain>:<action>           // Request
<domain>:<action>:result    // Response
<domain>:<action>:error     // Error
<domain>:<action>:subscribe // Subscribe to updates
```

### Examples

| Event | Meaning |
|-------|---------|
| `models:list` | Request model list |
| `models:list:result` | Response with models |
| `models:list:error` | Error response |
| `metrics:subscribe` | Subscribe to metrics |
| `metrics:update` | Pushed metrics update |
| `logs:entry` | Single log entry |
| `llama:status` | Llama server status |

### Forbidden
```javascript
// ❌ BAD - Random names
socket.on("hey", () => {});
socket.emit("stuff", {});
socket.on("data", {});

// ❌ BAD - Mixed patterns
socket.on("getModels", () => {});     // camelCase
socket.on("models:list", () => {});   // colon notation
socket.emit("LIST_MODELS", {});       // SCREAMING_SNAKE
```

---

## Rule 5: No Memory Leaks

**Law:** Always clean up subscriptions and timers.

### Forbidden
```javascript
// ❌ FORBIDDEN - No cleanup
socket.on("event", handler);  // Never removed
setInterval(fn, 1000);        // Never cleared
```

### Required
```javascript
// ✅ REQUIRED - Store for cleanup
const handlers = [];

function onEvent(handler) {
  socket.on("event", handler);
  handlers.push({ type: "on", event: "event", handler });
}

function cleanup() {
  handlers.forEach(({ event, handler }) => {
    socket.off(event, handler);
  });
  handlers.length = 0;
}

// ✅ REQUIRED - Clear intervals on unsubscribe
const subscriptions = new Map();

socket.on("metrics:subscribe", (req) => {
  const interval = req.interval || 2000;
  const timeoutId = setInterval(() => {
    emitMetrics(socket);
  }, interval);
  
  subscriptions.set(socket.id, { timeoutId });
});

socket.on("metrics:unsubscribe", () => {
  const sub = subscriptions.get(socket.id);
  if (sub?.timeoutId) clearInterval(sub.timeoutId);
  subscriptions.delete(socket.id);
});

socket.on("disconnect", () => {
  // Always cleanup on disconnect
  subscriptions.forEach((sub) => {
    if (sub?.timeoutId) clearInterval(sub.timeoutId);
  });
  subscriptions.clear();
});
```

---

## Quick Reference

| Rule | What | Example |
|------|------|---------|
| 1 | Only Socket.IO | `socket.emit()`, `io.emit()` |
| 2 | No setInterval | Event-driven subscriptions |
| 3 | Async/await | `await fn()` not `fn(fn)` |
| 4 | Clean events | `domain:action:result` |
| 5 | Cleanup | Remove handlers, clear intervals |

---

## Violation = Fix Required

**If you see violations, fix them immediately:**

1. Found `new WebSocket()` → Replace with Socket.IO
2. Found `setInterval(fn, ms)` → Convert to event-driven
3. Found `global.io` → Pass `io` as parameter
4. Found wrapper class → Use Socket.IO directly
5. Found callbacks → Convert to async/await
6. Found no cleanup → Add cleanup on disconnect
