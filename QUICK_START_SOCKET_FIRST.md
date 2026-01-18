# Quick Start: Socket-First Architecture

## TL;DR

**Old way (broken):**
```javascript
// stateManager is a bottleneck
const data = await stateManager.getModels();
stateManager.set("models", data);
stateManager.subscribe("models", (m) => this.models = m);
```

**New way (clear):**
```javascript
// Call socket directly
const response = await socketClient.request("models:list", {});
this.models = response.data;

// Listen for updates
socketClient.on("models:updated", (data) => {
  this.models = data.models;
});
```

---

## The Problem

Your project has **tight coupling everywhere**:

1. Components depend on stateManager
2. stateManager depends on socket handlers
3. Change stateManager = break multiple components
4. Change handler = stateManager breaks = components break
5. **Result:** Cascading failures, hard to debug

## The Solution

**Decouple all layers:**

- Components talk directly to Socket.IO
- Socket.IO handlers broadcast changes
- All components listen to broadcasts
- stateManager is just a cache (optional)
- **Result:** Clear data flow, independent components

## Architecture

```
┌──────────────────────────────────────────┐
│   Component A       Component B           │
│   Call models:list  Listen models:updated │
└──────────────────────────────────────────┘
         ↓                    ↑
┌────────────────────────────────────────────┐
│  Socket.IO (Stable Contracts)              │
│  models:list, models:load, models:updated  │
└────────────────────────────────────────────┘
         ↓                    ↑
┌────────────────────────────────────────────┐
│  Server (Business Logic)                   │
│  Broadcasts to all clients                 │
└────────────────────────────────────────────┘
```

## Implementation Pattern

### 1. Component calls socket directly

```javascript
async loadModels() {
  try {
    const response = await socketClient.request("models:list", {});
    if (response.success) {
      this.models = response.data;
      this.render();
    } else {
      showNotification(response.error, "error");
    }
  } catch (error) {
    showNotification("Error: " + error.message, "error");
  }
}
```

### 2. Component listens to broadcasts

```javascript
onMount() {
  this.unsub = socketClient.on("models:updated", (data) => {
    this.models = data.models;
    this.render();
  });
}

destroy() {
  this.unsub?.();
}
```

### 3. Server broadcasts on changes

```javascript
socket.on("models:load", (req, callback) => {
  const model = startModel(req.modelName);
  callback({ success: true, data: model });
  
  // Broadcast to all clients
  socket.broadcast.emit("models:updated", {
    models: db.getModels(),
  });
});
```

## Socket Contracts

See [SOCKET_CONTRACTS.md](SOCKET_CONTRACTS.md) for all handler definitions.

**Models:**
```
models:list          Get all models
models:load          Start a model
models:unload        Stop a model
models:delete        Delete a model
models:scan          Scan disk for models
models:updated       [BROADCAST] Models changed
```

**Router:**
```
router:status        Get router status
router:restart       Restart llama server
router:status        [BROADCAST] Status changed
```

**Config:**
```
config:get          Get configuration
config:update       Update configuration
config:updated      [BROADCAST] Config changed
```

**Logs:**
```
logs:get            Get log entries
logs:clear          Clear logs
logs:cleared        [BROADCAST] Logs cleared
```

## How to Refactor a Component

### Step 1: Identify stateManager calls

```bash
grep -n "stateManager\." your-component.js
```

### Step 2: Replace with socket calls

| Old | New |
|-----|-----|
| `stateManager.getModels()` | `socketClient.request("models:list", {})` |
| `stateManager.loadModel(name)` | `socketClient.request("models:load", {modelName: name})` |
| `stateManager.getRouterStatus()` | `socketClient.request("router:status", {})` |

### Step 3: Add error handling

```javascript
if (!response.success) {
  showNotification(response.error, "error");
  return;
}
```

### Step 4: Replace subscriptions

| Old | New |
|-----|-----|
| `stateManager.subscribe("models", ...)` | `socketClient.on("models:updated", ...)` |
| `stateManager.subscribe("routerStatus", ...)` | `socketClient.on("router:status", ...)` |

### Step 5: Add cleanup

```javascript
destroy() {
  this.unsubscribers?.forEach(unsub => unsub?.());
}
```

See [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) for complete step-by-step guide.

## Example: Before & After

### Before (Broken)

```javascript
class ModelsPage extends Component {
  async init() {
    const data = await stateManager.getModels();
    stateManager.set("models", data.models || []);
  }

  onMount() {
    this.unsub = stateManager.subscribe("models", (models) => {
      this.models = models;
      this.render();
    });
    this.init();
  }

  async handleLoadModel(name) {
    await stateManager.loadModel(name);
    // Hope stateManager updated the cache...
  }
}
```

**Problems:**
- stateManager.getModels() wraps socket
- stateManager.loadModel() wraps socket
- If stateManager changes, this breaks
- Other components don't know about loadModel
- No error feedback to user

### After (Clear)

```javascript
class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.models = [];
    this.loading = false;
    this.unsubscribers = [];
  }

  async loadModels() {
    try {
      this.loading = true;
      const response = await socketClient.request("models:list", {});
      if (response.success) {
        this.models = response.data;
        stateManager.set("models", this.models); // Optional cache
      } else {
        showNotification(response.error, "error");
      }
    } catch (error) {
      showNotification("Error: " + error.message, "error");
    } finally {
      this.loading = false;
      this.render();
    }
  }

  onMount() {
    this.loadModels();
    this.unsubscribers.push(
      socketClient.on("models:updated", (data) => {
        this.models = data.models;
        stateManager.set("models", this.models);
        this.render();
      })
    );
  }

  async handleLoadModel(modelName) {
    try {
      this.loading = true;
      const response = await socketClient.request("models:load", {
        modelName,
      });
      if (response.success) {
        showNotification("Model loaded", "success");
        // Server broadcast will update all components
      } else {
        showNotification(response.error, "error");
      }
    } finally {
      this.loading = false;
    }
  }

  destroy() {
    this.unsubscribers.forEach(unsub => unsub?.());
  }
}
```

**Improvements:**
- Direct socket calls (no middleman)
- Clear loading state
- Proper error handling
- User feedback
- All components automatically sync
- Easy to test

## Testing

### Mock socketClient

```javascript
const mockSocketClient = {
  request: jest.fn(),
  on: jest.fn((event, handler) => () => {}),
};

// In your test
it("should load models", async () => {
  mockSocketClient.request.mockResolvedValue({
    success: true,
    data: [{ id: "1", name: "model-1" }],
  });

  const page = new ModelsPage({});
  await page.loadModels();

  expect(mockSocketClient.request).toHaveBeenCalledWith("models:list", {});
  expect(page.models).toHaveLength(1);
});
```

## FAQ

### Q: What about performance?
A: **Better.** No middleware overhead, direct socket calls.

### Q: What about shared state?
A: Use broadcasts. Server is source of truth, all clients stay in sync.

### Q: Can I still use stateManager?
A: Yes, but only for caching. Call socketClient directly, then cache:
```javascript
const response = await socketClient.request("models:list", {});
stateManager.set("models", response.data); // Optional cache
```

### Q: What if the socket handler takes time?
A: Show loading state while waiting:
```javascript
this.loading = true;
const response = await socketClient.request(...);
this.loading = false;
```

### Q: How do I know which broadcasts to listen to?
A: Check SOCKET_CONTRACTS.md. Each handler documents its broadcasts.

### Q: What if I need to trigger an action in another component?
A: Use broadcasts. Component A makes request, server broadcasts response, all components listen.

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| [SOCKET_CONTRACTS.md](SOCKET_CONTRACTS.md) | Stable handler APIs | ✅ Ready |
| [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) | Step-by-step conversion | ✅ Ready |
| [SERVER_HANDLER_TEMPLATE.md](SERVER_HANDLER_TEMPLATE.md) | Handler implementation rules | ✅ Ready |
| [MIGRATION_TO_SOCKET_FIRST.md](MIGRATION_TO_SOCKET_FIRST.md) | Migration plan | ✅ Ready |
| public/js/services/socket.js | Enhanced SocketClient | ✅ Updated |
| public/js/core/state-simplified.js | New minimal StateManager | ✅ Created |

---

## Next Steps

1. **Read** [SOCKET_CONTRACTS.md](SOCKET_CONTRACTS.md) - Understand all handlers
2. **Choose** a component to refactor (start small)
3. **Follow** [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) - Step-by-step
4. **Test** thoroughly (unit + integration)
5. **Repeat** for all components

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Data Flow** | Unclear | Clear |
| **Coupling** | Tight | Loose |
| **Testing** | Hard | Easy |
| **Debugging** | Difficult | Simple |
| **Cascading Failures** | Common | Rare |
| **New Features** | Risky | Safe |

**Result:** A more stable, maintainable, debuggable codebase.
