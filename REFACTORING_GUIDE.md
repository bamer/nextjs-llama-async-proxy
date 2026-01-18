# Complete Refactoring Guide: Socket-First Architecture

## Summary

We're moving from stateManager-orchestrated to socket-first:

- ❌ **Remove:** stateManager API methods (getModels, startModel, etc.)
- ✅ **Add:** Direct socketClient.request() calls in components
- ✅ **Keep:** stateManager for caching only
- ✅ **Use:** Socket broadcasts for cross-component sync

---

## Pattern 1: Loading Data

### Before (Problematic)
```javascript
// Component relies on stateManager orchestration
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
}
```

**Problems:**
- stateManager.getModels() wraps socketClient, adding a layer of indirection
- If stateManager changes, this breaks
- Component depends on stateManager's internal implementation
- Data flow is unclear

### After (Clear)
```javascript
// Component calls socket directly
class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.models = [];
    this.loading = false;
  }

  async loadModels() {
    try {
      this.loading = true;
      const response = await socketClient.request("models:list", {});
      if (response.success) {
        this.models = response.data || [];
        // Update cache for other components
        stateManager.set("models", this.models);
      } else {
        showNotification(response.error, "error");
      }
    } catch (error) {
      console.error("[ModelsPage] Failed to load models:", error);
      showNotification("Failed to load models", "error");
    } finally {
      this.loading = false;
    }
    this.render();
  }

  onMount() {
    // Load initial data
    this.loadModels();

    // Listen for updates from server
    this.unsub = socketClient.on("models:updated", (data) => {
      this.models = data.models || [];
      stateManager.set("models", this.models);
      this.render();
    });
  }

  destroy() {
    this.unsub?.();
  }
}
```

**Improvements:**
- Direct socket call - crystal clear what's happening
- Component owns its loading state
- Listens to broadcasts for changes
- Error handling is local
- stateManager is optional (just caching)

---

## Pattern 2: Triggering Actions

### Before (Orchestrated)
```javascript
class ModelsPage extends Component {
  async handleLoadModel(modelName) {
    try {
      const result = await stateManager.loadModel(modelName);
      // Assume stateManager updated the cache
      // But what if another component needs to know?
      // stateManager doesn't broadcast, so other components might be out of sync
    } catch (error) {
      console.error("Error:", error);
    }
  }
}
```

**Problems:**
- stateManager.loadModel() wraps socket
- No guarantee other components will see the change
- Error handling is unclear
- Success/failure feedback to user is missing

### After (Direct)
```javascript
class ModelsPage extends Component {
  async handleLoadModel(modelName) {
    try {
      this.loading = true;
      const response = await socketClient.request("models:load", {
        modelName,
      });

      if (response.success) {
        showNotification(`Model ${modelName} started`, "success");
        // Server broadcasts models:updated to all clients
        // Component's socketClient.on("models:updated") will handle it
      } else {
        showNotification(`Failed: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[ModelsPage] Load failed:", error);
      showNotification("Network error: " + error.message, "error");
    } finally {
      this.loading = false;
    }
  }
}
```

**Improvements:**
- Direct socket call
- Clear success/error feedback
- All clients get broadcast automatically
- User sees immediate feedback
- Error handling is comprehensive

---

## Pattern 3: Cross-Component Communication

### Before (Via stateManager)
```javascript
// Component A
class SettingsPage extends Component {
  async handleSaveConfig(config) {
    await stateManager.updateConfig(config);
    stateManager.set("config", config);
  }
}

// Component B
class DashboardPage extends Component {
  onMount() {
    this.unsub = stateManager.subscribe("config", (config) => {
      this.config = config;
      this.render();
    });
  }
}
```

**Problems:**
- Component A must remember to call stateManager.set()
- If they forget, Component B won't know
- Tight coupling through stateManager

### After (Via Broadcasts)
```javascript
// Component A
class SettingsPage extends Component {
  async handleSaveConfig(config) {
    try {
      const response = await socketClient.request("config:update", config);
      if (response.success) {
        showNotification("Config saved", "success");
        // Server broadcasts config:updated to all clients automatically
      } else {
        showNotification(response.error, "error");
      }
    } catch (error) {
      showNotification("Error: " + error.message, "error");
    }
  }
}

// Component B
class DashboardPage extends Component {
  onMount() {
    // Listen for server broadcasts
    this.unsub = socketClient.on("config:updated", (data) => {
      this.config = data.config;
      stateManager.set("config", this.config); // Optional cache
      this.render();
    });
  }
}
```

**Improvements:**
- Server is source of truth
- All clients automatically stay in sync
- No manual cache synchronization needed
- Loose coupling (only care about broadcasts)

---

## Refactoring Checklist

### Step 1: Identify stateManager calls
```bash
grep -r "stateManager\." public/js/pages/your-page.js
```

### Step 2: Map each call to socket handler
- `stateManager.getModels()` → `socketClient.request("models:list", {})`
- `stateManager.loadModel(name)` → `socketClient.request("models:load", {modelName: name})`
- `stateManager.getRouterStatus()` → `socketClient.request("router:status", {})`
- `stateManager.updateConfig()` → `socketClient.request("config:update", {})`
- See SOCKET_CONTRACTS.md for complete mapping

### Step 3: Replace in component

**Old:**
```javascript
const data = await stateManager.getModels();
```

**New:**
```javascript
const response = await socketClient.request("models:list", {});
const data = response.data;
```

### Step 4: Add error handling
```javascript
if (!response.success) {
  showNotification(response.error, "error");
  return;
}
```

### Step 5: Replace stateManager.subscribe()

**Old:**
```javascript
stateManager.subscribe("models", (models) => {
  this.models = models;
});
```

**New:**
```javascript
socketClient.on("models:updated", (data) => {
  this.models = data.models;
  stateManager.set("models", this.models); // Optional cache
  this.render();
});
```

### Step 6: Add cleanup
```javascript
destroy() {
  this.unsubscribers?.forEach(unsub => unsub?.());
}
```

---

## Common Conversions

### Models API
```javascript
// ❌ OLD
const data = await stateManager.getModels();
const model = await stateManager.getModel(id);
const started = await stateManager.loadModel(name);
const stopped = await stateManager.unloadModel(name);
const deleted = await stateManager.deleteModel(id);
const scanned = await stateManager.scanModels();

// ✅ NEW
const response = await socketClient.request("models:list", {});
const response = await socketClient.request("models:get", {modelName});
const response = await socketClient.request("models:load", {modelName});
const response = await socketClient.request("models:unload", {modelName});
const response = await socketClient.request("models:delete", {modelName});
const response = await socketClient.request("models:scan", {});
```

### Router API
```javascript
// ❌ OLD
const status = await stateManager.getRouterStatus();
const restarted = await stateManager.restartLlama();
const config = await stateManager.getConfig();
const updated = await stateManager.updateConfig(config);

// ✅ NEW
const response = await socketClient.request("router:status", {});
const response = await socketClient.request("router:restart", {});
const response = await socketClient.request("config:get", {});
const response = await socketClient.request("config:update", config);
```

### Logs API
```javascript
// ❌ OLD
const logs = await stateManager.getLogs({limit: 100});
const cleared = await stateManager.clearLogs();

// ✅ NEW
const response = await socketClient.request("logs:get", {limit: 100});
const response = await socketClient.request("logs:clear", {});
```

---

## Component Template (New Pattern)

Use this as a template for refactored components:

```javascript
/**
 * [ComponentName] - [Description]
 * 
 * Socket contracts used:
 * - models:list - Load all models
 * - models:load - Start a model
 * - models:updated - Broadcast when models change
 */
class MyPage extends Component {
  constructor(props) {
    super(props);
    // Component state only - no stateManager
    this.items = [];
    this.loading = false;
    this.error = null;
    this.unsubscribers = [];
  }

  async loadData() {
    try {
      this.loading = true;
      this.error = null;
      const response = await socketClient.request("models:list", {});

      if (response.success) {
        this.items = response.data || [];
        stateManager.set("models", this.items); // Optional cache
      } else {
        this.error = response.error;
        showNotification(this.error, "error");
      }
    } catch (error) {
      console.error("[MyPage] Load failed:", error);
      this.error = error.message;
      showNotification("Error: " + error.message, "error");
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async handleAction(actionData) {
    try {
      this.loading = true;
      const response = await socketClient.request("models:load", actionData);

      if (response.success) {
        showNotification("Action succeeded", "success");
        // Server broadcasts will update all components
      } else {
        showNotification(response.error, "error");
      }
    } catch (error) {
      console.error("[MyPage] Action failed:", error);
      showNotification("Error: " + error.message, "error");
    } finally {
      this.loading = false;
    }
  }

  onMount() {
    // Load initial data
    this.loadData();

    // Listen to broadcasts for updates
    this.unsubscribers.push(
      socketClient.on("models:updated", (data) => {
        this.items = data.models || [];
        stateManager.set("models", this.items);
        this.render();
      })
    );

    // Listen to other broadcasts as needed
    this.unsubscribers.push(
      socketClient.on("router:status", (data) => {
        this.routerStatus = data;
        this.render();
      })
    );
  }

  render() {
    if (this.loading) {
      return Component.h("div", {}, "Loading...");
    }

    if (this.error) {
      return Component.h("div", { className: "error" }, this.error);
    }

    return Component.h("div", { className: "my-page" }, [
      // Render items
      this.items.map((item) =>
        Component.h("div", { key: item.id }, item.name)
      ),
    ]);
  }

  destroy() {
    this.unsubscribers.forEach((unsub) => unsub?.());
    this.unsubscribers = [];
  }
}
```

---

## Testing the Refactored Components

```javascript
// Mock socketClient for testing
const mockSocketClient = {
  request: jest.fn(),
  on: jest.fn((event, handler) => {
    // Return unsubscribe function
    return () => {};
  }),
};

// In your test
describe("MyPage", () => {
  it("should load models on mount", async () => {
    mockSocketClient.request.mockResolvedValue({
      success: true,
      data: [{ id: "1", name: "model-1" }],
    });

    const page = new MyPage({});
    await page.loadData();

    expect(mockSocketClient.request).toHaveBeenCalledWith(
      "models:list",
      {}
    );
    expect(page.items).toHaveLength(1);
  });

  it("should show error on failure", async () => {
    mockSocketClient.request.mockResolvedValue({
      success: false,
      error: "Server error",
    });

    const page = new MyPage({});
    await page.loadData();

    expect(page.error).toBe("Server error");
  });
});
```

---

## Migration Status

Track progress here:

- [ ] Models Domain
  - [ ] ModelsPage
  - [ ] ModelsController
  - [ ] ModelsTable
- [ ] Router Domain
  - [ ] RouterCard
  - [ ] RouterControls
- [ ] Config Domain
  - [ ] SettingsPage
  - [ ] ConfigForm
- [ ] Logs Domain
  - [ ] LogsPage
  - [ ] LogsViewer
- [ ] Other
  - [ ] DashboardPage
  - [ ] PresetSelector

---

## Benefits After Refactoring

✅ Clear data flow - Easy to understand and debug
✅ Less coupling - Components don't depend on stateManager implementation
✅ Easier testing - Mock socketClient instead of stateManager
✅ Stable APIs - Socket contracts are frozen, won't change
✅ Cascading fixes - Fix one handler, all components benefit
✅ New features - Add socket handler, all components can use it
