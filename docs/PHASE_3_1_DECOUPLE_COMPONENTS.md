# Phase 3.1: Detailed Implementation Plan - Decouple Components

## Executive Summary

**Goal:** Transform tightly-coupled Controller→Component relationships into event-driven architecture where components are fully decoupled and communicate via a centralized event bus.

**Current State:** Controllers pass `this` reference to components; components store controller references; direct method calls in both directions.

**Target State:** Components subscribe to state/events and update themselves autonomously. Controllers only manage page lifecycle and data loading.

---

## Part A: New Event-Driven Architecture Design

### A.1 Event Channel Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EVENT BUS (stateManager)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PUBLISHERS                        SUBSCRIBERS                          │
│  ──────────                        ───────────                          │
│  • Controllers                     • Components                         │
│  • Socket handlers                 • Child components                   │
│  • Server broadcasts               • Cross-page listeners               │
│  • Services (presetsService)                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

Event Naming Convention:
  • Page events:      "page:{page}:{action}"     (e.g., "page:dashboard:refresh")
  • Data events:      "data:{resource}:{op}"     (e.g., "data:models:updated")
  • UI events:        "ui:{component}:{action}"  (e.g., "ui:chart:resize")
  • Lifecycle events: "lifecycle:{phase}"        (e.g., "lifecycle:mount")
```

### A.2 State Store Structure

```javascript
// New state store entries to be added
stateManager.getState(); // Will return:
{
  // Existing
  models: [...],
  metrics: {...},
  config: {...},
  settings: {...},
  
  // NEW - Page-specific state
  page: {
    dashboard: {
      charts: [...],           // Chart data/history
      refreshInterval: 5000,   // User-configured refresh rate
      lastRefresh: timestamp,  // Last refresh time
    },
    models: {
      viewMode: "grid|table",
      sortBy: "name|size|date",
      filterBy: "all|loaded|unloaded",
    },
    presets: {
      selectedPresetId: null,
      editMode: false,
    },
    settings: {
      unsavedChanges: false,
      activeSection: "general",
    }
  },
  
  // NEW - Action status for components to react
  actions: {
    modelScan: { status: "idle|scanning|complete", message: "", progress: 0 },
    modelLoad: { status: "idle|loading|complete|error", modelId: "", message: "" },
    configSave: { status: "idle|saving|complete|error", message: "" },
  }
}
```

### A.3 Component Communication Patterns

#### Pattern 1: Self-Updating Component (No Controller Methods)

```javascript
// BEFORE (coupled)
class DashboardPage {
  constructor(props) {
    this.controller = props.controller;  // ❌ Tight coupling
  }
  
  onMount() {
    this.controller._loadDataWhenConnected();  // ❌ Calls controller
  }
  
  updateMetrics(metrics, history) {  // ❌ Called by controller
    this.metrics = metrics;
    this._render();
  }
}

// AFTER (decoupled)
class DashboardPage {
  constructor(props = {}) {
    // No controller reference needed
    this.unsubscribers = [];
  }
  
  onMount() {
    // Subscribe to state changes
    this.unsubscribers.push(
      stateManager.subscribe("metrics", this._onMetricsChange.bind(this)),
      stateManager.subscribe("metricsHistory", this._onHistoryChange.bind(this)),
      stateManager.subscribe("page:dashboard", this._onPageStateChange.bind(this))
    );
    
    // Emit event to request data load
    stateManager.emit("action:dashboard:refresh");
  }
  
  _onMetricsChange(metrics) {
    this.metrics = metrics;
    this._updateUIMetrics();
  }
  
  _onHistoryChange(history) {
    this.history = history;
    this._updateUIHistory();
  }
  
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
```

#### Pattern 2: Action Handling via Events (No Controller Callbacks)

```javascript
// BEFORE (coupled)
class ModelsPage {
  bindEvents() {
    this.on("click", "[data-action=scan]", () => {
      this.controller?.handleScan();  // ❌ Direct controller call
    });
  }
}

// AFTER (decoupled)
class ModelsPage {
  bindEvents() {
    this.on("click", "[data-action=scan]", () => {
      // Emit event - controller listens and handles
      stateManager.emit("action:models:scan", { 
        path: this.currentPath 
      });
    });
    
    this.on("click", "[data-action=load]", (e) => {
      const modelId = e.target.closest("[data-action=load]").dataset.name;
      stateManager.emit("action:models:load", { modelId });
    });
  }
}
```

#### Pattern 3: Child Component Communication via Parent Events

```javascript
// Parent component emits events that children subscribe to
class DashboardPage {
  _onMetricsChange(metrics) {
    this.metrics = metrics;
    this._updateUI();
    
    // Emit for child components to react
    stateManager.set("page:dashboard:metrics", metrics);
  }
}

// Child component subscribes
class ChartsSection {
  onMount() {
    this.unsubscribers.push(
      stateManager.subscribe("page:dashboard:metrics", (metrics) => {
        this._updateCharts(metrics);
      })
    );
  }
}
```

---

## Part B: File-by-File Implementation Plan

### B.1 Controller Changes

#### B.1.1 `dashboard-controller.js` (HIGH PRIORITY)

**Current Issues:**
- Passes `this` to DashboardPage
- Calls `this.comp.updateFromController()`, `updateConfig()`, `updateModels()`, etc.
- Subscribes to events and updates component directly

**New Responsibilities:**
- Page lifecycle management only
- Load initial data on mount
- Listen for action events and perform operations
- Update state (components auto-update)

**Changes:**

```javascript
// Lines 30-50: Simplify constructor
constructor(options = {}) {
  super(options);  // If extending base controller
  
  this.chartManager = new ChartManager({});
  this.unsubscribers = [];
}

// Lines 60-80: init() - just load data, don't render
init() {
  // Subscribe to action events
  this.unsubscribers.push(
    stateManager.subscribe("action:dashboard:refresh", () => this._loadData()),
    stateManager.subscribe("action:dashboard:config", (config) => this._handleConfigUpdate(config))
  );
  
  // Load initial data
  this._loadData();
}

// Lines 90-200: Remove all this.comp.update* calls
// Replace with state updates
async _loadData() {
  try {
    // Set loading state
    stateManager.set("actions:dashboard:refresh", { status: "loading" });
    
    const metrics = await stateManager.getMetrics();
    const history = await stateManager.getMetricsHistory();
    const config = await stateManager.getConfig();
    const models = await stateManager.getModels();
    const settings = await stateManager.getSettings();
    
    // Update state - components will react
    stateManager.set("metrics", metrics);
    stateManager.set("metricsHistory", history);
    stateManager.set("config", config);
    stateManager.set("models", models);
    stateManager.set("settings", settings);
    
    stateManager.set("actions:dashboard:refresh", { status: "complete" });
  } catch (error) {
    stateManager.set("actions:dashboard:refresh", { 
      status: "error", 
      error: error.message 
    });
  }
}

// Lines 370-400: Remove controller: this from props
render() {
  const el = Component.h(DashboardPage, {
    chartManager: this.chartManager,  // Only pass services, not this
    // REMOVE: controller: this
  });
  this.comp = el._component;
  return el;
}

// Lines 410-440: Add action event handlers (new)
_handleConfigUpdate(config) {
  // Handle config updates from UI events
  stateManager.set("config", config);
}

willUnmount() {
  this.unsubscribers.forEach(unsub => unsub());
  this.chartManager.destroy();
  if (this.comp) this.comp.destroy();
}
```

**Lines to Change:** 30-50, 60-200, 370-400, 410-440
**Lines to Remove:** 89-235 (direct component updates)

---

#### B.1.2 `models/controller.js` (HIGH PRIORITY)

**Current Issues:**
- Passes `this` to ModelsPage
- Direct method calls: `updateModelList()`, `setModelLoading()`, `setScanning()`
- Handles UI events via callbacks

**New Responsibilities:**
- Model scanning, loading, unloading via action events
- Update model state (components auto-update)

**Changes:**

```javascript
// Lines 50-70: Simplified init
init() {
  this.unsubscribers.push(
    stateManager.subscribe("action:models:scan", (data) => this._handleScan(data)),
    stateManager.subscribe("action:models:load", (data) => this._handleLoad(data)),
    stateManager.subscribe("action:models:unload", (data) => this._handleUnload(data)),
    stateManager.subscribe("action:models:delete", (data) => this._handleDelete(data))
  );
  
  this._loadModels();
}

// Lines 100-150: Replace direct component calls with state updates
async _handleScan(data) {
  try {
    stateManager.set("actions:models:scan", { 
      status: "scanning", 
      message: "Scanning for models...",
      progress: 0 
    });
    
    const result = await stateManager.scanModels(data?.path);
    
    stateManager.set("models", result.models);
    stateManager.set("actions:models:scan", { 
      status: "complete", 
      message: `Found ${result.models.length} models` 
    });
  } catch (error) {
    stateManager.set("actions:models:scan", { 
      status: "error", 
      error: error.message 
    });
  }
}

async _handleLoad(data) {
  try {
    const { modelId } = data;
    stateManager.set("actions:models:load", { 
      status: "loading", 
      modelId,
      message: `Loading ${modelId}...` 
    });
    
    await stateManager.startModel(modelId);
    
    stateManager.set("actions:models:load", { 
      status: "complete", 
      modelId 
    });
    
    // Refresh models list to show loaded status
    this._loadModels();
  } catch (error) {
    stateManager.set("actions:models:load", { 
      status: "error", 
      modelId: data.modelId,
      error: error.message 
    });
  }
}

// Lines 370-400: Remove controller: this from props
render() {
  const el = Component.h(ModelsPage, {
    models: stateManager.get("models") || [],
    // REMOVE: controller: this
  });
  this.comp = el._component;
  return el;
}
```

**Lines to Change:** 50-70, 100-150, 370-400
**Lines to Remove:** 140-180 (direct component calls)

---

#### B.1.3 `presets/presets-controller.js` (MEDIUM PRIORITY)

**Current Issues:**
- Passes `this` to PresetsPage
- Direct method calls via `this.comp`
- PresetsService coupling

**New Responsibilities:**
- Preset CRUD operations via action events
- Update preset state (components auto-update)

**Changes:**

```javascript
// Lines 40-60: Simplified init
init() {
  this.unsubscribers.push(
    stateManager.subscribe("action:presets:load", () => this._loadPresets()),
    stateManager.subscribe("action:presets:save", (data) => this._handleSave(data)),
    stateManager.subscribe("action:presets:delete", (data) => this._handleDelete(data)),
    stateManager.subscribe("action:presets:apply", (data) => this._handleApply(data))
  );
  
  this._loadPresets();
}

// Lines 100-150: Replace this.comp calls with state updates
async _handleSave(data) {
  try {
    const { preset, isNew } = data;
    
    stateManager.set("actions:presets:save", { 
      status: "saving", 
      presetId: preset.id 
    });
    
    if (isNew) {
      await this.presetsService.createPreset(preset);
    } else {
      await this.presetsService.updatePreset(preset);
    }
    
    // Reload and update state
    await this._loadPresets();
    
    stateManager.set("actions:presets:save", { 
      status: "complete", 
      presetId: preset.id 
    });
    
    showNotification("Preset saved successfully", "success");
  } catch (error) {
    stateManager.set("actions:presets:save", { 
      status: "error", 
      error: error.message 
    });
    showNotification(`Failed to save preset: ${error.message}`, "error");
  }
}

// Lines 50-60: Remove controller: this from props
render() {
  const el = Component.h(window.PresetsPage, {
    presets: stateManager.get("presets") || [],
    presetsService: this.presetsService,  // Keep service for component use
    availableModels,
    // REMOVE: controller: this
  });
  this.comp = el._component;
  return el;
}
```

**Lines to Change:** 40-60, 100-150, 50-60
**Lines to Remove:** Direct component method calls throughout

---

#### B.1.4 `settings/settings-controller.js` (MEDIUM PRIORITY)

**Current Issues:**
- Passes `this` to SettingsPage
- Direct component updates
- Complex router configuration handling

**New Responsibilities:**
- Config loading/saving via action events
- Router state management
- Update settings state (components auto-update)

**Changes:**

```javascript
// Lines 70-90: Simplified init
init() {
  this.unsubscribers.push(
    stateManager.subscribe("action:settings:save", (data) => this._handleSave(data)),
    stateManager.subscribe("action:settings:reset", () => this._handleReset()),
    stateManager.subscribe("action:router:restart", () => this._handleRouterRestart()),
    stateManager.subscribe("action:config:import", (data) => this._handleImport(data))
  );
  
  this._loadSettings();
}

// Lines 150-200: Replace component calls with state updates
async _handleSave(data) {
  try {
    const { config, settings } = data;
    
    stateManager.set("actions:settings:save", { status: "saving" });
    
    await stateManager.updateConfig(config);
    await stateManager.updateSettings(settings);
    
    stateManager.set("config", config);
    stateManager.set("settings", settings);
    
    stateManager.set("actions:settings:save", { status: "complete" });
    
    showNotification("Settings saved successfully", "success");
  } catch (error) {
    stateManager.set("actions:settings:save", { 
      status: "error", 
      error: error.message 
    });
    showNotification(`Failed to save settings: ${error.message}`, "error");
  }
}

// Lines 75-85: Remove controller: this from props
render() {
  const el = Component.h(window.SettingsPage, {
    config: stateManager.get("config"),
    settings: stateManager.get("settings"),
    llamaStatus: stateManager.get("llamaServerStatus"),
    routerStatus: stateManager.get("routerStatus"),
    presets: stateManager.get("presets"),
    // REMOVE: controller: this
  });
  this.comp = el._component;
  return el;
}
```

---

### B.2 Component Changes

#### B.2.1 `dashboard/page.js` (HIGH PRIORITY)

**Current Issues:**
- Stores `this.controller` from props
- Calls `this.controller._loadDataWhenConnected()` in onMount
- Has `updateFromController()` method called by controller
- Has `updateConfig()`, `updateModels()`, `updatePresets()` methods

**New Behavior:**
- No controller reference
- Subscribes to state changes
- Emits action events for data requests

**Changes:**

```javascript
// Lines 20-30: Remove controller from constructor
constructor(props = {}) {
  super(props);
  // REMOVE: this.controller = props.controller;
  // REMOVE: this.chartManager = props.chartManager;
  
  // Keep only local component state
  this.state = {
    initialized: false,
    connected: false,
    metrics: null,
    history: [],
    gpuMetrics: null,
    models: [],
    presets: [],
    config: {},
    settings: {},
  };
  
  this.unsubscribers = [];
}

// Lines 40-60: onMount - Subscribe to state, emit refresh event
onMount() {
  console.log("[DashboardPage] onMount - subscribing to state");
  
  // Subscribe to all state changes
  this.unsubscribers.push(
    stateManager.subscribe("metrics", this._onMetricsChange.bind(this)),
    stateManager.subscribe("metricsHistory", this._onHistoryChange.bind(this)),
    stateManager.subscribe("models", this._onModelsChange.bind(this)),
    stateManager.subscribe("presets", this._onPresetsChange.bind(this)),
    stateManager.subscribe("config", this._onConfigChange.bind(this)),
    stateManager.subscribe("settings", this._onSettingsChange.bind(this)),
    stateManager.subscribe("llamaServerStatus", this._onLlamaStatusChange.bind(this)),
    stateManager.subscribe("routerStatus", this._onRouterStatusChange.bind(this)),
    stateManager.subscribe("actions:dashboard:refresh", this._onRefreshAction.bind(this))
  );
  
  // Emit event to trigger data load
  stateManager.emit("action:dashboard:refresh");
}

// Lines 80-120: Add state change handlers
_onMetricsChange(metrics) {
  if (JSON.stringify(metrics) !== JSON.stringify(this.state.metrics)) {
    this.state.metrics = metrics;
    this._updateMetricsUI();
  }
}

_onHistoryChange(history) {
  if (JSON.stringify(history) !== JSON.stringify(this.state.history)) {
    this.state.history = history || [];
    this._updateHistoryUI();
  }
}

_onModelsChange(models) {
  this.state.models = models || [];
  this._updateModelsUI();
}

_onPresetsChange(presets) {
  this.state.presets = presets || [];
  this._updatePresetsUI();
}

_onConfigChange(config) {
  this.state.config = config || {};
  this._updateConfigUI();
}

_onSettingsChange(settings) {
  this.state.settings = settings || {};
  this._updateSettingsUI();
}

_onLlamaStatusChange(status) {
  this.state.llamaStatus = status;
  this._updateLlamaStatusUI();
}

_onRouterStatusChange(status) {
  this.state.routerStatus = status;
  this._updateRouterStatusUI();
}

_onRefreshAction(action) {
  // Could show loading indicator
  if (action.status === "loading") {
    this._setLoading(true);
  } else {
    this._setLoading(false);
  }
}

// Lines 350-400: REMOVE updateFromController(), updateConfig(), etc.
// These are no longer needed - components update via state subscriptions

// Lines 400-450: Add action emission methods
_handleChartZoom(range) {
  stateManager.emit("action:dashboard:chartZoom", { range });
}

_handleRefreshClick() {
  stateManager.emit("action:dashboard:refresh");
}

_handleExportMetrics() {
  const data = {
    metrics: this.state.metrics,
    history: this.state.history,
    exportedAt: new Date().toISOString(),
  };
  stateManager.emit("action:dashboard:export", { data });
}

// Lines 450-500: destroy() - Clean up subscriptions
destroy() {
  console.log("[DashboardPage] destroy - cleaning up");
  this.unsubscribers.forEach(unsub => unsub());
  this.unsubscribers = [];
  
  if (this.chartManager) {
    this.chartManager.destroy();
  }
  
  super.destroy();
}
```

**Lines to Remove:** 25-26, 43-44, all `update*` methods, `setRouterLoading()`
**Lines to Add:** All `_on*` handlers, action emission methods

---

#### B.2.2 `models/page.js` (HIGH PRIORITY)

**Current Issues:**
- Stores `this.controller` from props
- Calls `this.controller.handleScan()`, `handleLoad()`, etc.
- Has `updateModelList()`, `setModelLoading()`, `setScanning()` methods

**New Behavior:**
- No controller reference
- Emits action events for model operations
- Subscribes to model state and actions

**Changes:**

```javascript
// Lines 25-30: Remove controller
constructor(props = {}) {
  super(props);
  // REMOVE: this.controller = props.controller;
  
  this.state = {
    models: props.models || [],
    loading: false,
    scanning: false,
    scanMessage: "",
  };
  
  this.unsubscribers = [];
}

// Lines 50-70: onMount - Subscribe to state, emit load event
onMount() {
  console.log("[ModelsPage] onMount");
  
  this.unsubscribers.push(
    stateManager.subscribe("models", this._onModelsChange.bind(this)),
    stateManager.subscribe("actions:models:scan", this._onScanAction.bind(this)),
    stateManager.subscribe("actions:models:load", this._onLoadAction.bind(this)),
    stateManager.subscribe("actions:models:unload", this._onUnloadAction.bind(this))
  );
  
  // Initial load
  stateManager.emit("action:models:load");
}

// Lines 80-100: Add state handlers
_onModelsChange(models) {
  if (JSON.stringify(models) !== JSON.stringify(this.state.models)) {
    this.state.models = models || [];
    this._updateModelListUI();
  }
}

_onScanAction(action) {
  this.state.scanning = action.status === "scanning";
  this.state.scanMessage = action.message || "";
  this._updateScanningUI();
}

_onLoadAction(action) {
  if (action.status === "loading") {
    this._setModelLoading(action.modelId, true);
  } else {
    this._setModelLoading(action.modelId, false);
    if (action.status === "error") {
      showNotification(`Failed to load model: ${action.error}`, "error");
    }
  }
}

_onUnloadAction(action) {
  this._setModelLoading(action.modelId, false);
}

// Lines 200-260: Change click handlers to emit events
bindEvents() {
  this.on("click", "[data-action=scan]", () => {
    stateManager.emit("action:models:scan", { 
      path: this._getCurrentPath() 
    });
  });
  
  this.on("click", "[data-action=load]", (e) => {
    const modelId = e.target.closest("[data-action=load]").dataset.name;
    stateManager.emit("action:models:load", { modelId });
  });
  
  this.on("click", "[data-action=unload]", (e) => {
    const modelId = e.target.closest("[data-action=unload]").dataset.name;
    stateManager.emit("action:models:unload", { modelId });
  });
  
  this.on("click", "[data-action=delete]", (e) => {
    const modelId = e.target.closest("[data-action=delete]").dataset.name;
    stateManager.emit("action:models:delete", { modelId });
  });
}

// REMOVE: updateModelList(), setModelLoading(), setScanning() methods
// These are replaced by state subscriptions and direct UI updates

// Lines 350-400: destroy()
destroy() {
  this.unsubscribers.forEach(unsub => unsub());
  this.unsubscribers = [];
  super.destroy();
}
```

**Lines to Remove:** 25, all controller method calls, `updateModelList()`, `setModelLoading()`, `setScanning()`
**Lines to Add:** All `_on*` handlers, event emissions in bindEvents

---

#### B.2.3 `presets/presets-page.js` (MEDIUM PRIORITY)

**Current Issues:**
- Stores `this.controller` from props
- Calls `this.controller.handle*()` methods
- Direct socket event handling

**New Behavior:**
- No controller reference
- Emits action events
- Subscribes to preset state

**Changes:**

```javascript
// Lines 20-30: Remove controller
constructor(props = {}) {
  super(props);
  // REMOVE: this.controller = props.controller;
  
  this.state = {
    presets: props.presets || [],
    selectedPreset: null,
    editing: false,
    serverRunning: false,
  };
  
  this.unsubscribers = [];
}

// Lines 60-80: onMount - Subscribe to state
onMount() {
  this.unsubscribers.push(
    stateManager.subscribe("presets", this._onPresetsChange.bind(this)),
    stateManager.subscribe("llamaServerStatus", this._onServerStatusChange.bind(this)),
    stateManager.subscribe("actions:presets:save", this._onSaveAction.bind(this)),
    stateManager.subscribe("actions:presets:delete", this._onDeleteAction.bind(this))
  );
  
  // Socket events through state (controller handles actual socket)
  // Components just emit events
}

// Lines 150-200: Change handlers to emit events
_handlePresetClick(preset) {
  stateManager.emit("action:presets:select", { presetId: preset.id });
}

_handleLoadPreset(preset) {
  stateManager.emit("action:presets:apply", { preset });
}

_handleSavePreset() {
  const preset = this._gatherPresetData();
  stateManager.emit("action:presets:save", { 
    preset, 
    isNew: !preset.id 
  });
}

_handleDeletePreset(preset) {
  stateManager.emit("action:presets:delete", { presetId: preset.id });
}

// REMOVE: All this.controller calls
// REMOVE: Direct socket.on handlers - move to controller
```

---

#### B.2.4 `settings/settings-page.js` (MEDIUM PRIORITY)

**Current Issues:**
- Stores `this.controller` from props
- Calls `this.controller.handleRouterAction()`, `handleSave()`
- Complex save/config handling

**New Behavior:**
- No controller reference
- Emits action events for save, router restart, import
- Subscribes to settings state

**Changes:**

```javascript
// Lines 35-45: Remove controller
constructor(props = {}) {
  super(props);
  // REMOVE: this.controller = props.controller;
  
  this.state = {
    config: props.config || {},
    settings: props.settings || {},
    llamaStatus: props.llamaStatus || {},
    routerStatus: props.routerStatus || {},
    presets: props.presets || [],
    unsavedChanges: false,
    saving: false,
  };
  
  this.unsubscribers = [];
}

// Lines 70-90: onMount - Subscribe to state
onMount() {
  this.unsubscribers.push(
    stateManager.subscribe("config", this._onConfigChange.bind(this)),
    stateManager.subscribe("settings", this._onSettingsChange.bind(this)),
    stateManager.subscribe("llamaServerStatus", this._onLlamaStatusChange.bind(this)),
    stateManager.subscribe("routerStatus", this._onRouterStatusChange.bind(this)),
    stateManager.subscribe("actions:settings:save", this._onSaveAction.bind(this))
  );
}

// Lines 200-250: Change handlers to emit events
_handleSave() {
  stateManager.emit("action:settings:save", {
    config: this.state.config,
    settings: this.state.settings,
  });
}

_handleReset() {
  stateManager.emit("action:settings:reset");
}

_handleRouterRestart() {
  stateManager.emit("action:router:restart");
}

_handleConfigImport(config) {
  stateManager.emit("action:config:import", { config });
}

_handleExportConfig() {
  const data = {
    config: this.state.config,
    settings: this.state.settings,
    exportedAt: new Date().toISOString(),
  };
  stateManager.emit("action:config:export", { data });
}

// REMOVE: All this.controller calls
```

---

### B.3 Child Component Changes

#### B.3.1 `dashboard/stats-grid.js` (MEDIUM PRIORITY)

**Current:** Subscribes to `metrics` state - already good!

**Changes:** None required - already follows the pattern

```javascript
// Already correct:
this.unsubscriber = stateManager.subscribe("metrics", (metrics) => {
  if (metrics) {
    this.updateMetrics(metrics);
  }
});
```

#### B.3.2 `dashboard/system-health.js` (MEDIUM PRIORITY)

**Current:** Subscribes to `metrics` state - already good!

**Changes:** None required

#### B.3.3 `dashboard/gpu-details.js` (MEDIUM PRIORITY)

**Current:** Subscribes to `metrics` state - already good!

**Changes:** None required

#### B.3.4 `dashboard/charts-section.js` (MEDIUM PRIORITY)

**Current:** Called by parent component

**Changes:** Subscribe to chart data state

```javascript
// Add to onMount:
this.unsubscribers.push(
  stateManager.subscribe("metricsHistory", (history) => {
    this._updateCharts(history);
  }),
  stateManager.subscribe("page:dashboard:refreshInterval", (interval) => {
    this._updateRefreshInterval(interval);
  })
);
```

#### B.3.5 `components/models/model-table-row.js` (MEDIUM PRIORITY)

**Current:** Called by parent

**Changes:** Subscribe to model state changes

```javascript
constructor(props = {}) {
  super(props);
  this.model = props.model;
  this.unsubscribers = [];
}

onMount() {
  this.unsubscribers.push(
    stateManager.subscribe(`actions:models:load`, (action) => {
      if (action.modelId === this.model.name) {
        this._setLoading(action.status === "loading");
      }
    })
  );
}
```

#### B.3.6 `components/llama-router-card.js` (MEDIUM PRIORITY)

**Current:** Already subscribes to state - good!

**Changes:** Minor - ensure pattern consistency

---

## Part C: State Manager Extensions

### C.1 Add Event Emission Methods

File: `public/js/core/state/state-manager.js`

```javascript
class StateManager {
  // ... existing methods ...
  
  /**
   * Emit an action event that components can listen to
   * @param {string} event - Event name (e.g., "action:models:scan")
   * @param {any} data - Event data
   */
  emit(event, data = null) {
    const key = `actions:${event}`;
    this._set(key, { 
      data, 
      timestamp: Date.now(),
      event 
    });
  }
  
  /**
   * Subscribe to action events
   * @param {string} event - Event pattern (e.g., "actions:models:*")
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeAction(event, callback) {
    // Use pattern matching for wildcards
    const pattern = new RegExp(`^actions:${event.replace(/\*/g, ".*")}$`);
    
    return this.subscribe("actions", (actions) => {
      if (pattern.test(actions.event)) {
        callback(actions);
      }
    });
  }
  
  /**
   * Set page-specific state
   * @param {string} page - Page name (e.g., "dashboard")
   * @param {string} key - State key
   * @param {any} value - State value
   */
  setPageState(page, key, value) {
    const pageKey = `page:${page}`;
    const current = this.get(pageKey) || {};
    current[key] = value;
    this._set(pageKey, current);
  }
  
  /**
   * Get page-specific state
   * @param {string} page - Page name
   * @returns {Object} Page state
   */
  getPageState(page) {
    return this.get(`page:${page}`) || {};
  }
}
```

### C.2 Add Action Status Tracking

```javascript
/**
 * Set action status for components to display
 * @param {string} action - Action identifier (e.g., "models:scan")
 * @param {Object} status - Status object { status, message, progress, error }
 */
setActionStatus(action, status) {
  this._set(`actions:${action}`, {
    ...status,
    timestamp: Date.now(),
  });
}

/**
 * Get action status
 * @param {string} action - Action identifier
 * @returns {Object|null} Status object or null
 */
getActionStatus(action) {
  return this.get(`actions:${action}`);
}
```

---

## Part D: Implementation Order

### Phase 3.1.1: State Manager Extensions (Start Here)
| Task | File | Changes |
|------|------|---------|
| D.1.1 | `state-manager.js` | Add `emit()`, `subscribeAction()` methods |
| D.1.2 | `state-manager.js` | Add `setPageState()`, `getPageState()` methods |
| D.1.3 | `state-manager.js` | Add `setActionStatus()`, `getActionStatus()` methods |
| D.1.4 | `state-manager.js` | Add JSDoc documentation |

**Testing:** Verify events are published and subscribed correctly

---

### Phase 3.1.2: Dashboard Decoupling (Highest Priority)
| Task | File | Changes |
|------|------|---------|
| D.2.1 | `dashboard-controller.js` | Remove `controller: this` from props, add event listeners |
| D.2.2 | `dashboard-controller.js` | Replace `this.comp.update*()` with `stateManager.set()` |
| D.2.3 | `dashboard-controller.js` | Add action handlers for refresh, config updates |
| D.2.4 | `dashboard/page.js` | Remove controller reference, add state subscriptions |
| D.2.5 | `dashboard/page.js` | Replace `updateFromController()` with `_on*` handlers |
| D.2.6 | `dashboard/page.js` | Add action emission for user interactions |

**Testing:** Verify dashboard loads and updates via events

---

### Phase 3.1.3: Models Decoupling (High Priority)
| Task | File | Changes |
|------|------|---------|
| D.3.1 | `models/controller.js` | Remove `controller: this` from props |
| D.3.2 | `models/controller.js` | Replace component calls with state updates |
| D.3.3 | `models/controller.js` | Add action handlers for scan, load, unload |
| D.3.4 | `models/page.js` | Remove controller reference |
| D.3.5 | `models/page.js` | Replace `updateModelList()` with `_onModelsChange()` |
| D.3.6 | `models/page.js` | Emit action events instead of controller calls |

**Testing:** Verify models page scan/load/unload works via events

---

### Phase 3.1.4: Presets Decoupling (Medium Priority)
| Task | File | Changes |
|------|------|---------|
| D.4.1 | `presets/presets-controller.js` | Remove `controller: this` from props |
| D.4.2 | `presets/presets-controller.js` | Replace component calls with state updates |
| D.4.3 | `presets/presets-controller.js` | Add action handlers for save, delete, apply |
| D.4.4 | `presets/presets-page.js` | Remove controller reference |
| D.4.5 | `presets/presets-page.js` | Replace controller calls with action emissions |

**Testing:** Verify presets CRUD works via events

---

### Phase 3.1.5: Settings Decoupling (Medium Priority)
| Task | File | Changes |
|------|------|---------|
| D.5.1 | `settings/settings-controller.js` | Remove `controller: this` from props |
| D.5.2 | `settings/settings-controller.js` | Replace component calls with state updates |
| D.5.3 | `settings/settings-controller.js` | Add action handlers for save, reset, restart |
| D.5.4 | `settings/settings-page.js` | Remove controller reference |
| D.5.5 | `settings/settings-page.js` | Replace controller calls with action emissions |

**Testing:** Verify settings save/reset works via events

---

### Phase 3.1.6: Child Component Updates (Lower Priority)
| Task | File | Changes |
|------|------|---------|
| D.6.1 | `dashboard/charts-section.js` | Add state subscriptions for chart data |
| D.6.2 | `components/models/model-table-row.js` | Add loading state subscriptions |
| D.6.3 | All child components | Verify pattern consistency |

**Testing:** Verify child components update correctly

---

## Part E: Validation Checklist

### E.1 Functional Tests
- [ ] Dashboard loads and displays data without controller direct calls
- [ ] Models page scan/load/unload works via action events
- [ ] Presets page save/delete/apply works via events
- [ ] Settings page save/reset works via events
- [ ] Child components update when parent state changes
- [ ] No JavaScript errors in console

### E.2 Architecture Tests
- [ ] No component has `this.controller` reference
- [ ] No controller calls `this.comp.update*()` methods
- [ ] All components use `stateManager.subscribe()` for data
- [ ] All user actions emit `stateManager.emit()` events
- [ ] All controllers use action handlers for operations

### E.3 Performance Tests
- [ ] Same or better page load times
- [ ] No memory leaks from unsubscribed listeners
- [ ] Event handling is efficient (no event storms)

---

## Part F: Rollback Plan

If issues arise, these files can be quickly reverted:

1. **Keep backups:** `cp dashboard-controller.js dashboard-controller.js.bak`
2. **Revert order:** Controllers → Pages → Child Components
3. **Quick fix:** Add back `controller: this` temporarily if needed

---

## Part G: Estimated Effort

| Phase | Files | Estimated Time |
|-------|-------|----------------|
| 3.1.1 State Manager | 1 file | 30 minutes |
| 3.1.2 Dashboard | 2 files | 2 hours |
| 3.1.3 Models | 2 files | 2 hours |
| 3.1.4 Presets | 2 files | 1.5 hours |
| 3.1.5 Settings | 2 files | 1.5 hours |
| 3.1.6 Child Components | 3 files | 1 hour |
| **Total** | **~12 files** | **~8.5 hours** |

---

## Part H: Key Success Metrics

1. **Zero controller references in components** - All `this.controller` removed
2. **Zero direct component updates** - No `this.comp.update*()` in controllers
3. **Event-driven data flow** - All data via `stateManager.subscribe()`
4. **Event-driven actions** - All user actions via `stateManager.emit()`
5. **Same or better test coverage** - All Playwright tests pass
6. **No performance regression** - Page load times maintained

---

## Part I: Dependencies & Prerequisites

**Must complete before starting:**
- [ ] Phase 1 (async file I/O) - ✅ Already done
- Phase 2 (event-driven metrics) - ✅ Already done
- Phase 3 (memory safety) - ✅ Already done

**Prerequisites for this phase:**
- [ ] stateManager event methods implemented
- [ ] Playwright test suite ready for validation
- [ ] All controllers and components identified

---

*Document Version: 3.1.0*
*Created: 2026-01-18*
*Last Updated: 2026-01-18*
