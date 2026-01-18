# Migration to Socket-First Architecture

## Overview

We're moving from **stateManager-centric** to **socket-first** architecture:

### Before (Problems)
- stateManager is a bottleneck that orchestrates everything
- Components go through stateManager for every operation
- Changing stateManager breaks multiple components
- Hard to understand data flow
- Tight coupling everywhere

### After (Solution)
- Components call Socket.IO handlers directly
- stateManager is optional, used only for caching
- Clear, stable socket contracts
- Components are independent but coordinated via broadcasts
- Easy to understand and debug

---

## Migration Strategy

### Phase 1: Document Server Handlers
- Define stable socket contracts
- Document request/response formats
- Document broadcast events
- Ensure all handlers follow contract format

**Status:** [See SOCKET_CONTRACTS.md]

### Phase 2: Refactor socketClient
- Add helper methods for common patterns
- Improve error handling
- Add connection waiting logic
- Ensure broadcasts are properly forwarded

**Status:** In progress

### Phase 3: Refactor Components (by domain)

#### Models Domain
1. ModelsPage - Remove stateManager dependency
2. ModelsController - Remove stateManager.getModels()
3. Dashboard - Direct socket calls for model status
4. Settings - Direct socket calls for router config

#### Router Domain
1. RouterStatusCard - Direct socket calls
2. RouterControls - Direct socket calls
3. PresetSelector - Direct socket calls

#### Config Domain
1. SettingsPage - Direct socket calls
2. ConfigForm - Direct socket calls

#### Logs Domain
1. LogsPage - Direct socket calls
2. LogsViewer - Direct socket calls

### Phase 4: Simplify stateManager
- Remove domain-specific methods (getModels, startModel, etc.)
- Keep only cache/state methods
- Remove request() method (use socketClient.request)
- Reduce to <100 lines

### Phase 5: Remove stateManager dependency
- Audit all components
- Migrate from stateManager.subscribe() to socketClient.on()
- Migrate from stateManager.set() to direct state updates
- Test and verify

---

## Example Migration

### Before: stateManager-centric

```javascript
class ModelsPage extends Component {
  async loadModels() {
    try {
      const data = await stateManager.getModels();
      stateManager.set("models", data.models || []);
    } catch (error) {
      console.error("Failed to load models:", error);
    }
  }

  onMount() {
    this.unsubscribers = [
      stateManager.subscribe("models", (models) => {
        this.models = models;
        this.render();
      }),
    ];
    this.loadModels();
  }

  async handleStartModel(modelName) {
    const result = await stateManager.loadModel(modelName);
    // Assume stateManager will broadcast the change
    // But it doesn't - so other components might be out of sync
  }
}
```

**Problems:**
- Component waits for stateManager.getModels() which wraps socketClient
- If stateManager changes, this breaks
- State update flow is unclear
- No guarantee other components will see the change

### After: Socket-first

```javascript
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
      this.models = response.data || [];
      this.render();
    } catch (error) {
      console.error("[ModelsPage] Failed to load:", error);
      showNotification("Failed to load models", "error");
    } finally {
      this.loading = false;
    }
  }

  onMount() {
    // Load initial data
    this.loadModels();

    // Listen for updates from server
    this.unsubscribers = [
      socketClient.on("models:updated", (data) => {
        this.models = data.models || [];
        this.render();
      }),
    ];
  }

  async handleStartModel(modelName) {
    try {
      this.loading = true;
      const response = await socketClient.request("models:load", {
        modelName,
      });

      if (response.success) {
        showNotification("Model started", "success");
        // Server broadcast handler will update all components
        // No need to manually sync
      } else {
        showNotification(response.error, "error");
      }
    } finally {
      this.loading = false;
    }
  }

  destroy() {
    this.unsubscribers?.forEach((unsub) => unsub());
  }
}
```

**Improvements:**
- Direct call to socket handler - crystal clear
- Component owns its loading state
- Listens to broadcasts for changes
- All components automatically stay in sync
- Easy to test (mock socketClient)
- Easy to debug (clear data flow)

---

## Conversion Checklist

For each component being migrated:

### Preparation
- [ ] Identify all stateManager calls in component
- [ ] Map each to corresponding socket handler (see SOCKET_CONTRACTS.md)
- [ ] Identify all subscriptions
- [ ] Identify all broadcasts needed

### Implementation
- [ ] Replace stateManager.get[X]() with socketClient.request()
- [ ] Replace stateManager.subscribe() with socketClient.on()
- [ ] Replace stateManager.set() with direct property assignment
- [ ] Ensure error handling for all requests
- [ ] Update notifications for user feedback
- [ ] Add loading states where appropriate

### Testing
- [ ] Verify component loads and displays data
- [ ] Verify actions trigger correct socket calls
- [ ] Verify broadcasts update component
- [ ] Verify cleanup on destroy
- [ ] Test error scenarios
- [ ] Test connection loss/recovery

### Documentation
- [ ] Add JSDoc comments for socket calls
- [ ] Document which broadcasts component listens to
- [ ] Add [DEBUG] logs for development

---

## Server-Side Checklist

For each handler being standardized:

- [ ] Accept request object (ignore if not needed)
- [ ] Return callback with {success, data/error} format
- [ ] Broadcast state changes to all clients
- [ ] Log important operations
- [ ] Handle errors gracefully
- [ ] Don't call other handlers
- [ ] Document in SOCKET_CONTRACTS.md

---

## Breaking Changes

### Components no longer use stateManager for:
- getModels() → socketClient.request("models:list", {})
- startModel() → socketClient.request("models:load", {modelName})
- stopModel() → socketClient.request("models:unload", {modelName})
- getRouterStatus() → socketClient.request("router:status", {})
- getConfig() → socketClient.request("config:get", {})
- updateConfig() → socketClient.request("config:update", {key, value})
- getLogs() → socketClient.request("logs:get", {limit, offset})

### stateManager still provides:
- get(key) - Read cached state
- set(key, value) - Update cache
- subscribe(key, callback) - Listen to cache changes

---

## Benefits

### Immediate
✓ Clear data flow
✓ Less tight coupling
✓ Easier to test
✓ Easier to debug
✓ Cascading failures reduced

### Long-term
✓ Easier to add new features
✓ Easier to onboard developers
✓ Easier to refactor
✓ Better performance (no orchestration overhead)
✓ Stable APIs (socket contracts frozen)

---

## Timeline

- **Phase 1-2:** 1-2 hours (setup)
- **Phase 3:** 4-6 hours (per domain)
- **Phase 4:** 1 hour (simplify stateManager)
- **Phase 5:** 2-3 hours (audit & test)

Total: ~15-20 hours for complete migration

---

## Questions & Troubleshooting

### Q: What if a component needs to trigger an action in another component?
A: Use broadcasts. Component A emits a request, server broadcasts response, all components listen.

### Q: What if I need to cache multiple pieces of data?
A: Use stateManager.set("key", value) after receiving socket response.

### Q: What if the socket handler takes time to execute?
A: Show loading state while waiting. Use socketClient.request() which returns a Promise.

### Q: Should I keep stateManager?
A: Yes. Use it for caching shared state only. Components should not depend on it.

### Q: What about error handling?
A: Wrap requests in try-catch, catch callback errors from socketClient.request().
