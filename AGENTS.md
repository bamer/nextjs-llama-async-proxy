# AGENTS.md - Agent Guidelines for this Repository

This document provides guidelines for agentic coding assistants working in this **Vanilla JavaScript** Llama Proxy Dashboard application.
**Critical**: never DELETE this file for whatever reason.

- **Critical**:it's mandatory that you don't make <tool_call> inside  <thinking> block if you do the whole server will crash this is a bench marking evaluating framework bug.

## Application Overview

- **Backend**: Node.js + Express + Socket.IO (server.js)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Database**: SQLite with better-sqlite3
- **Architecture**: Simplify to pure Event-Driven DOM Updates
- **event-driven patterns**
- **Communications FrontEnd BackEnd**: **Complete Socket.IO -First and Only** 
- **Define stable Socket.IO contracts** - clear in/out on server
- **Real-time**: Socket.IO for live updates
- **LLM Backend**: llama.cpp server in **router mode** (multi-model support) with presets file .ini.
- **timeout and set-interval** crappy pattern are !!!! FORBIDDEN !!!!!.


## Llama.cpp Router Mode

## Project Mandatory Rules

1. **Keep files under 200 lines** - Split large files into smaller modules
2. **Single responsibility** - Each component/class should do one thing
3. **No memory leaks** - Always clean up subscriptions and event listeners
4. **Graceful degradation** - Handle missing data gracefully
5. **User feedback** - Show notifications for user actions
6. **Error boundaries** - Catch and display errors to users
7. **NEVER WRITE OUTSIDE THE PROJECT DIR** it will be deny and you will loose time for nothing.

**Important**: The application uses llama.cpp's router mode to support multiple models in a single server.

### Router Mode Key Facts

- **Single llama-server process** manages all models
- **Auto-discovery** of models from `--models-dir` directory
- **On-demand loading** - models load when first requested
- **LRU eviction** - least-recently-used model unloaded when `--models-max` reached
- **Single port** - all models accessed through the same endpoint

### CLI Options

```bash
# Start router mode (auto-discovers models)
llama-server --models-dir ./models --models-max 4

# With custom settings
llama-server --models-dir ./models --models-max 4 -c 8192 -ngl 99 --np 4
```

### Important CLI Flags

| Flag             | Default              | Description                        |
| ---------------- | -------------------- | ---------------------------------- |
| `--models-dir`   | `~/.cache/llama.cpp` | Directory containing GGUF files    |
| `--models-max`   | 4                    | Max models loaded simultaneously   |
| `-c`             | 512                  | Context size per model             |
| `-ngl`           | 0                    | GPU layers to offload              |
| `--np`           | 1                    | Parallel processing slots          |
| `--threads-http` | 1                    | HTTP threads for parallel requests |

### Model Status Values

When working with models, use these status values:

- `loaded` - Model is loaded and ready
- `loading` - Model is being loaded
- `unloaded` - Model is on disk, not in memory
- `error` - Model failed to load

### API Endpoints

The router exposes these endpoints:

- `GET /models` - List all models with status
- `POST /models/load` - Load a specific model
- `POST /models/unload` - Unload a model

## Build / Run Commands

**IMPORTANT: Always use `pnpm` instead of `npm`. This project uses pnpm for all package management.**

```bash
# Start development server
pnpm start                    # Start server with node
pnpm dev                      # Start with file watching (uses --watch flag)

# Database operations
pnpm db:export                # Export database backup
pnpm db:reset                 # Reset database

# Testing
pnpm test                     # Run all tests
pnpm test:watch               # Run tests in watch mode
pnpm test:coverage            # Generate coverage report (100% coverage required)

# Linting
pnpm lint                     # Run ESLint
pnpm lint:fix                 # Auto-fix lint issues

# Code Formatting
pnpm format                   # Format all files with Prettier
pnpm format:check             # Check formatting without modifying files

# Package management (ALWAYS use pnpm)
pnpm add <package>            # Add a dependency
pnpm add -D <package>         # Add a dev dependency
pnpm remove <package>         # Remove a dependency
pnpm install                  # Install all dependencies
pnpm update                   # Update all dependencies
```

## Code Style Guidelines

### General Formatting

- Use double quotes only (`"not 'single quotes'"`)
- Always use semicolons
- 2-space indentation
- Trailing commas in multi-line objects/arrays
- Max line width: 100 characters
- Object-curly-spacing: `always` (spaces inside {})
- Array-bracket-spacing: `never` (no spaces inside [])

### Code Formatting with Prettier

This project uses Prettier for automatic code formatting.

```bash
# Format all files
pnpm format

# Check formatting (without modifying files)
pnpm format:check

# Format specific files
pnpm format -- src/**/*.js
```

### Prettier Configuration

The project uses `.prettierrc` with these settings:

- `semi: true` - Always use semicolons
- `singleQuote: false` - Use double quotes
- `tabWidth: 2` - 2-space indentation
- `trailingComma: "es5"` - Trailing commas in objects/arrays
- `printWidth: 100` - Max 100 characters per line

### VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "prettier.configPath": ".prettierrc"
}
```

### Imports & Loading Order

Load scripts in this order (as defined in index.html):

1. Core Framework: component.js, router.js, state.js
2. Services: socket.js
3. Pages: dashboard.js, models.js, monitoring.js, configuration.js, settings.js, logs.js
4. Components: layout/layout.js
5. Main App: app.js

### Naming Conventions

- **Classes/Components**: PascalCase (`DashboardController`, `ModelsPage`)
- **Functions/Variables**: camelCase (`getModels`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`, `API_BASE_URL`)
- **Private class members**: underscore prefix (`_privateMethod`)
- **File names**: match export names (e.g., `layout.js` exports `Layout`)

### Component Class Pattern (Event-Driven)

All UI components extend the `Component` base class with a simplified event-driven approach:

```javascript
class MyComponent extends Component {
  constructor(props) {
    super(props);
    // Direct property assignment - no setState()
    this.data = props.data || [];
    this.loading = false;
  }

  /**
   * Render the component
   * Must return HTML string or HTMLElement or Component.h()
   */
  render() {
    return Component.h("div", { className: "my-component" }, [
      Component.h("h1", {}, "Title"),
      this.loading
        ? Component.h("div", { className: "loading" }, "Loading...")
        : this._renderContent(),
    ]);
  }

  /**
   * Bind event handlers - use this.on() for delegation
   */
  bindEvents() {
    // Direct event binding with delegation
    this.on("click", "[data-action]", (e, target) => {
      const action = target.dataset.action;
      this.handleAction(action);
    });

    this.on("change", "[data-field]", (e) => {
      this.handleFieldChange(e.target.value);
    });
  }

  /**
   * Called after mounting to DOM
   */
  onMount() {
    // Setup subscriptions, start intervals, etc.
    this.unsubscribers = [
      // Listen to socket broadcasts for real-time updates
      socketClient.on("models:updated", (data) => {
        this.models = data.models || [];
        this._updateUI();
      }),
    ];
  }

  /**
   * Cleanup - always unsubscribe and remove listeners
   */
  destroy() {
    this.unsubscribers?.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  handleAction(action) {
    // Handle actions
  }

  _updateUI() {
    // Direct DOM manipulation - no re-render
    const content = this.$(".content");
    if (content) {
      content.innerHTML = this._renderContent();
    }
  }
}
```

#### Event-Driven DOM Updates

Instead of `setState()` and re-rendering, use direct DOM updates:

```javascript
// OLD (React-like):
this.setState({ loading: true });
this.setState({ data: newData });

// NEW (Event-Driven):
this.loading = true;
this.$btn.disabled = true;
this.$btn.textContent = "Loading...";
```

#### DOM Helper Methods

```javascript
// Query elements
this.$(".my-element"); // Single element
this.$$(".items"); // Array of elements

// Update content
this.setText(".label", "New Text");
this.setHTML(".container", "<div>...</div>");

// Update attributes
this.setAttr(".btn", "disabled", true);
this.setAttr(".btn", "disabled", null); // Remove attribute

// Toggle classes
this.toggleClass(".item", "active", true);
this.toggleClass(".item", "hidden", false);

// Show/hide
this.show(".element");
this.hide(".element");

// Full replacement
this.replaceWith(newHtmlOrElement);
```

#### Event Binding

```javascript
// Simple click handler
this.on("click", ".btn", () => {
  console.log("Clicked!");
});

// With event delegation
this.on("click", "[data-action]", (e, target) => {
  console.log("Action:", target.dataset.action);
});

// Change handler
this.on("input", "[data-field=search]", (e) => {
  this.searchTerm = e.target.value;
  this._filterResults();
});
```

### Using Component.createElement (h)

```javascript
// Create element with tag name
Component.h("div", { className: "container" }, "Content");

// With children
Component.h("ul", {}, Component.h("li", {}, "Item 1"), Component.h("li", {}, "Item 2"));

// With attributes and event handlers
Component.h(
  "button",
  {
    className: "btn btn-primary",
    "data-id": "123",
    onClick: () => console.log("clicked"),
  },
  "Click Me"
);

// With nested components
Component.h(ModelsTable, {
  models: this.state.models,
  onSelect: this.handleSelect.bind(this),
});
```

### Router Patterns

Routes are registered in app.js:

```javascript
router.register("/", () => new DashboardController({}));
router.register("/models", () => new ModelsController({}));
router.register("/monitoring", () => new MonitoringController({}));

// Navigate programmatically
window.router.navigate("/models");

// Get current route info
const path = window.router.getPath();
const params = window.router.getParams();
const query = window.router.getQuery();
```

### State Management

**IMPORTANT**: stateManager is now **cache-only**. Use `socketClient.request()` directly for all API calls.

```javascript
// ❌ OLD - Don't do this anymore
const data = await stateManager.getModels();
const models = await stateManager.loadModel(name);
stateManager.subscribe("models", callback);

// ✅ NEW - Direct socket calls
const response = await socketClient.request("models:list", {});
this.models = response.data || [];

const response = await socketClient.request("models:load", { modelName: name });
if (response.success) {
  showNotification("Model loaded", "success");
}

socketClient.on("models:updated", (data) => {
  this.models = data.models || [];
  stateManager.set("models", this.models); // Optional cache
});
```

**stateManager is now used only for caching**:
```javascript
// Get cached state
const models = stateManager.get("models") || [];

// Set cached state (after loading from socket)
stateManager.set("models", this.models);

// Subscribe to state changes (rarely needed with broadcasts)
stateManager.subscribe("models", (models) => {
  console.log("Models changed:", models);
});
```

## Golden Rules: Socket.IO-First Architecture

The project follows a strict Socket.IO-first architecture. These rules are **absolutely critical** and violations will result in immediate code review rejection.

### Rule 1: Pure Event-Driven DOM Updates

All UI updates MUST be driven by Socket.IO events. The following patterns are **FORBIDDEN**:

**❌ FORBIDDEN - Timer-based polling:**
```javascript
// NEVER use setInterval or setTimeout for state updates
setInterval(() => {
  socketClient.request("metrics:get", {});
}, 2000);

setTimeout(() => {
  fetch("/api/metrics").then(...);
}, 1000);
```

**❌ FORBIDDEN - HTTP polling:**
```javascript
// NEVER use fetch/XHR for state updates
setInterval(async () => {
  const response = await fetch("/metrics");
  this.metrics = await response.json();
}, 5000);

function pollGpuMetrics() {
  fetch("/gpu-metrics").then(handleGpuData);
  setTimeout(pollGpuMetrics, 2000);
}
```

**❌ FORBIDDEN - Direct DOM manipulation outside Component helpers:**
```javascript
// NEVER manipulate DOM directly without using Component helpers
document.getElementById("cpu-usage").textContent = "75%";
document.querySelector(".model-status").classList.add("loaded");
document.body.insertAdjacentHTML("beforeend", htmlString);
```

**✅ REQUIRED - Event-driven updates via Socket.IO broadcasts:**
```javascript
// Listen for broadcasts - NO polling
onMount() {
  this.unsubscribers = [
    socketClient.on("metrics:updated", (data) => {
      this.metrics = data;
      this._updateUI();
    }),
    socketClient.on("gpu:updated", (data) => {
      this.gpu = data;
      this._updateGPUUI();
    }),
  ];
}

_updateUI() {
  // Use Component helpers for DOM updates
  this.setText(".cpu-usage", this.metrics.cpu + "%");
  this.setAttr(".status-indicator", "class", "status-" + this.metrics.state);
}
```

### Rule 2: Socket.IO-First and Only

All frontend-backend communication MUST use Socket.IO exclusively:

**❌ FORBIDDEN - REST API endpoints:**
```javascript
// NEVER create or use REST endpoints for state
app.get("/api/models", handler);
app.post("/api/models/load", handler);
```

**❌ FORBIDDEN - Direct fetch/XHR calls:**
```javascript
// NEVER use fetch or XHR directly
const response = await fetch("/api/status");
const data = await response.json();

const xhr = new XMLHttpRequest();
xhr.open("GET", "/api/metrics");
xhr.send();
```

**❌ FORBIDDEN - Direct HTTP calls to llama-server:**
```javascript
// NEVER call llama-server HTTP endpoints directly
const response = await fetch("http://localhost:8080/completion", {
  method: "POST",
  body: JSON.stringify({ prompt: "..." }),
});
```

**✅ REQUIRED - Socket.IO for all communication:**
```javascript
// Use socketClient.request() for requests
const response = await socketClient.request("models:list", {});
const response = await socketClient.request("models:load", { modelName: "llama-7b" });

// Listen for broadcasts for real-time updates
socketClient.on("metrics:updated", (data) => {
  this.metrics = data;
  this._updateUI();
});

socketClient.on("models:status", (data) => {
  this.models = data.models || [];
});
```

### Required Broadcast Events

All state comes via Socket.IO broadcasts. Components must subscribe to these events:

| Event | Purpose | Data |
|-------|---------|------|
| `metrics:updated` | System metrics (CPU, memory) | `{ cpu, memory, disk }` |
| `gpu:updated` | GPU metrics | `{ gpus: [...] }` |
| `models:status` | Model status changes | `{ models: [...] }` |
| `logs:entry` | New log entries | `{ entry: {...} }` |
| `config:updated` | Configuration changes | `{ config: {...} }` |
| `router:status` | Llama router status | `{ status: {...} }` |

### Subscription Lifecycle

Components MUST properly manage subscriptions:

```javascript
class MetricsComponent extends Component {
  onMount() {
    this.unsubscribers = [
      socketClient.on("metrics:updated", (data) => {
        this.metrics = data;
        this._updateUI();
      }),
      socketClient.on("gpu:updated", (data) => {
        this.gpu = data;
        this._updateGPUUI();
      }),
    ];
  }

  destroy() {
    // ALWAYS cleanup subscriptions
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
```

---

## Centralized Cadence Architecture

The project uses a centralized cadence pattern for efficient real-time updates.

### Old Pattern (FORBIDDEN)

The old architecture used per-socket timers, which caused issues:

```javascript
// ❌ FORBIDDEN - Per-socket timers
socket.on("connect", () => {
  // Each client starts its own timer
  this.metricsInterval = setInterval(() => {
    socket.emit("metrics:get", {}, (response) => {
      this.updateMetrics(response.data);
    });
  }, 2000);

  this.gpuInterval = setInterval(() => {
    socket.emit("gpu:get", {}, (response) => {
      this.updateGPU(response.data);
    });
  }, 5000);
});
```

Problems with the old pattern:
- Duplicate work across clients
- Race conditions between timers
- No coordination between clients
- Wasted resources when clients are idle

### New Pattern (REQUIRED)

The new architecture uses a single global cadence timer on the server:

```javascript
// ✅ REQUIRED - Single centralized cadence
let cadenceSubscribers = new Set();
let cadenceInterval = null;
const CADENCE_INTERVAL = 2000;

function getCadenceSubscribers() {
  return cadenceSubscribers;
}

function startCadenceIfNeeded() {
  if (cadenceSubscribers.size > 0 && !cadenceInterval) {
    cadenceInterval = setInterval(() => {
      broadcastMetrics();
      broadcastGPU();
    }, CADENCE_INTERVAL);
    console.log("[CADENCE] Started global cadence timer");
  }
}

function stopCadenceIfNeeded() {
  if (cadenceSubscribers.size === 0 && cadenceInterval) {
    clearInterval(cadenceInterval);
    cadenceInterval = null;
    console.log("[CADENCE] Stopped global cadence timer (no subscribers)");
  }
}

socket.on("metrics:subscribe", () => {
  cadenceSubscribers.add(socket.id);
  startCadenceIfNeeded();
  console.log("[CADENCE] Subscriber added:", { count: cadenceSubscribers.size });
});

socket.on("metrics:unsubscribe", () => {
  cadenceSubscribers.delete(socket.id);
  stopCadenceIfNeeded();
  console.log("[CADENCE] Subscriber removed:", { count: cadenceSubscribers.size });
});

function broadcastMetrics() {
  const metrics = collectMetrics();
  io.emit("metrics:updated", { metrics, timestamp: Date.now() });
}
```

### Subscription API

Clients subscribe to receive real-time updates:

```javascript
// Client subscribes to metrics updates
socketClient.on("connect", () => {
  socketClient.emit("metrics:subscribe", {}, (response) => {
    if (response.success) {
      console.log("[DEBUG] Subscribed to metrics");
    }
  });
});

// Client unsubscribes when leaving the metrics page
socketClient.emit("metrics:unsubscribe", {});
```

### Server Cadence Handler Pattern

```javascript
// In server.js - Centralized cadence management
const cadenceBroker = {
  subscribers: new Map(),
  interval: null,
  intervalMs: 2000,

  subscribe(socketId) {
    this.subscribers.set(socketId, { lastUpdate: null });
    this._maybeStart();
    console.log("[CADENCE] Subscribe:", { count: this.subscribers.size });
  },

  unsubscribe(socketId) {
    this.subscribers.delete(socketId);
    this._maybeStop();
    console.log("[CADENCE] Unsubscribe:", { count: this.subscribers.size });
  },

  _maybeStart() {
    if (this.subscribers.size > 0 && !this.interval) {
      this.interval = setInterval(() => this._tick(), this.intervalMs);
      console.log("[CADENCE] Global cadence started");
    }
  },

  _maybeStop() {
    if (this.subscribers.size === 0 && this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("[CADENCE] Global cadence stopped (no subscribers)");
    }
  },

  _tick() {
    const metrics = this._collectMetrics();
    const gpu = this._collectGPU();
    io.emit("metrics:updated", { metrics, gpu, timestamp: Date.now() });
  },

  _collectMetrics() {
    return { cpu: os.loadavg(), memory: process.memoryUsage() };
  },

  _collectGPU() {
    return { gpus: nvidiaSmi.query() };
  },
};

socket.on("metrics:subscribe", (req, cb) => {
  cadenceBroker.subscribe(socket.id);
  cb({ success: true });
});

socket.on("metrics:unsubscribe", (req, cb) => {
  cadenceBroker.unsubscribe(socket.id);
  cb({ success: true });
});
```

---

## Frontend: Socket-Driven Component Pattern

All frontend components must follow the socket-driven pattern.

### Required Pattern

```javascript
class MetricsDashboard extends Component {
  constructor(props) {
    super(props);
    this.metrics = null;
    this.gpu = null;
    this.loading = false;
    this.unsubscribers = [];
  }

  render() {
    return Component.h("div", { className: "metrics-dashboard" }, [
      Component.h("h2", {}, "System Metrics"),
      this.loading
        ? Component.h("div", { className: "loading" }, "Loading metrics...")
        : this._renderContent(),
    ]);
  }

  _renderContent() {
    if (!this.metrics) {
      return Component.h("div", { className: "no-data" }, "No metrics available");
    }

    return Component.h("div", { className: "metrics-grid" }, [
      Component.h("div", { className: "metric-card" }, [
        Component.h("span", { className: "metric-label" }, "CPU Usage"),
        Component.h("span", { className: "metric-value" }, this.metrics.cpu + "%"),
      ]),
      Component.h("div", { className: "metric-card" }, [
        Component.h("span", { className: "metric-label" }, "Memory"),
        Component.h("span", { className: "metric-value" }, this._formatBytes(this.metrics.memory)),
      ]),
    ]);
  }

  _formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  }

  onMount() {
    // Subscribe to socket broadcasts - NO polling
    this.unsubscribers = [
      socketClient.on("metrics:updated", (data) => {
        console.log("[DEBUG] Metrics updated received:", { cpu: data.metrics.cpu });
        this.metrics = data.metrics;
        this.loading = false;
        this._updateUI();
      }),
      socketClient.on("gpu:updated", (data) => {
        console.log("[DEBUG] GPU updated received:", { gpuCount: data.gpu?.length });
        this.gpu = data.gpu;
        this._updateGPUUI();
      }),
    ];

    // Request initial subscription
    socketClient.emit("metrics (response) => {
      if:subscribe", {}, (response.success) {
        console.log("[DEBUG] Subscribed to metrics cadence");
      }
    });
  }

  _updateUI() {
    const content = this.$(".metrics-grid");
    if (content) {
      content.innerHTML = "";
      const rows = this._renderContent();
      const wrapper = Component.h("div", {}, rows);
      content.appendChild(wrapper.firstElementChild);
    }
  }

  _updateGPUUI() {
    const gpuContainer = this.$(".gpu-container");
    if (gpuContainer) {
      this._renderGPU(gpuContainer);
    }
  }

  destroy() {
    // ALWAYS cleanup subscriptions
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Unsubscribe from cadence
    socketClient.emit("metrics:unsubscribe", {}, (response) => {
      console.log("[DEBUG] Unsubscribed from metrics:", response);
    });
  }
}
```

### Forbidden Patterns

**❌ FORBIDDEN - setInterval polling:**
```javascript
// NEVER use setInterval for state updates
onMount() {
  this.pollInterval = setInterval(async () => {
    const response = await socketClient.request("metrics:get", {});
    this.metrics = response.data;
    this._updateUI();
  }, 2000);
}
```

**❌ FORBIDDEN - setTimeout polling:**
```javascript
// NEVER use recursive setTimeout
onMount() {
  const poll = async () => {
    const response = await socketClient.request("metrics:get", {});
    this.metrics = response.data;
    this._updateUI();
    setTimeout(poll, 5000);
  };
  poll();
}
```

**❌ FORBIDDEN - HTTP polling:**
```javascript
// NEVER poll via HTTP
onMount() {
  setInterval(async () => {
    const response = await fetch("/api/metrics");
    const data = await response.json();
    this.updateFromData(data);
  }, 5000);
}
```

**❌ FORBIDDEN - Direct socket emit in timer:**
```javascript
// NEVER use setInterval with socket.emit
onMount() {
  setInterval(() => {
    socket.emit("metrics:get", {}, (response) => {
      this.updateMetrics(response.data);
    });
  }, 2000);
}
```

**❌ FORBIDDEN - Missing subscription cleanup:**
```javascript
// NEVER forget to cleanup
onMount() {
  this.unsubscribers = [
    socketClient.on("metrics:updated", handler),
  ];
}

// Forgot destroy() or cleanup
destroy() {
  // Missing unsubscribers cleanup
}
```

### Correct Subscription Cleanup

```javascript
class MetricsComponent extends Component {
  onMount() {
    // Store all unsubscribers
    this.unsubscribers = [
      socketClient.on("metrics:updated", this._handleMetrics.bind(this)),
      socketClient.on("gpu:updated", this._handleGPU.bind(this)),
    ];

    // Subscribe to cadence
    socketClient.emit("metrics:subscribe", {}, (response) => {
      if (response.success) {
        console.log("[DEBUG] Subscribed to cadence");
      }
    });
  }

  destroy() {
    // ALWAYS cleanup in destroy()
    if (this.unsubscribers && this.unsubscribers.length > 0) {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    }

    // Unsubscribe from cadence
    socketClient.emit("metrics:unsubscribe", {}, (response) => {
      console.log("[DEBUG] Unsubscribed from cadence");
    });
  }
}
```

---

## Socket.IO Patterns

The socket client is auto-initialized in app.js. Use `socketClient.request()` for API calls and `socketClient.on()` for broadcasts:

```javascript
// Connection status
socketClient.isConnected; // true/false

// Make a request (returns Promise with {success, data?, error?, timestamp})
const response = await socketClient.request("models:list", {});
if (response.success) {
  console.log("Models:", response.data.models);
} else {
  showNotification(response.error, "error");
}

// Listen for broadcasts (real-time updates) - PRIMARY way to get data
socketClient.on("models:updated", (data) => {
  console.log("Models updated:", data.models);
  // Update UI without re-fetching - use broadcast data directly
});

socketClient.on("metrics:updated", (data) => {
  console.log("Metrics updated:", data.metrics);
  // Use data.metrics directly - NO additional request needed
});

socketClient.on("router:status", (data) => {
  console.log("Router status:", data.status);
});

// Subscribe to cadence (required for real-time updates)
socketClient.emit("metrics:subscribe", {}, (response) => {
  if (response.success) {
    console.log("[DEBUG] Subscribed to metrics cadence");
  }
});

// Unsubscribe when no longer needed
socketClient.emit("metrics:unsubscribe", {});

// Unsubscribe when done
const unsub = socketClient.on("event", handler);
unsub(); // Cleanup
```

### Broadcast-First Data Flow

**All state updates come via broadcasts.** Only use `socketClient.request()` for actions:

```javascript
// ✅ CORRECT - Listen for broadcasts for data
socketClient.on("metrics:updated", (data) => {
  this.metrics = data.metrics;
  this._updateUI();
});

// ✅ CORRECT - Request for actions (user triggered)
const response = await socketClient.request("models:load", { modelName: "llama-7b" });
if (response.success) {
  showNotification("Model loaded", "success");
}

// ❌ INCORRECT - Polling for data
setInterval(async () => {
  const response = await socketClient.request("metrics:get", {});
  this.metrics = response.data;
}, 2000);
```

### Response Format

All Socket.IO responses follow this format:

```javascript
{
  success: boolean,
  data?: any,
  error?: {
    message: string,
    code?: string
  },
  timestamp: string
}
```

---

## Forbidden Patterns

The following patterns are explicitly forbidden:

### Communication Patterns

- **NO REST API endpoints** - All communication via Socket.IO
- **NO fetch/XHR for state updates** - Use Socket.IO broadcasts only
- **NO direct HTTP calls to llama-server** - All communication via server handlers
- **NO polling (setInterval/setTimeout for state)** - Use subscriptions and broadcasts

### State Management Patterns

- **NO setState or re-rendering** - Direct DOM updates via Component helpers
- **NO timer-based state refresh** - Event-driven updates only
- **NO MetricsScraper HTTP polling** - Use centralized cadence

### Component Patterns

- **NO memory leaks** - Always cleanup subscriptions and listeners
- **NO missing subscription cleanup** - Unsubscribe in destroy()
- **NO direct DOM manipulation** - Use Component helper methods

### Example of Forbidden Code

```javascript
// ❌ FORBIDDEN - MetricsScraper HTTP polling (OLD PATTERN)
class MetricsScraper {
  constructor() {
    this.interval = null;
  }

  start() {
    // Polls HTTP endpoint - FORBIDDEN
    this.interval = setInterval(async () => {
      const response = await fetch("/api/metrics");
      const data = await response.json();
      this.notifyListeners(data);
    }, 2000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// ✅ CORRECT - Socket-driven updates
class MetricsReceiver {
  onMount() {
    this.unsubscribers = [
      socketClient.on("metrics:updated", (data) => {
        this.handleMetrics(data);
      }),
    ];
  }

  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
  }
}
```

---

## Architecture: Decentralized Socket-First Design

**KEY PRINCIPLE**: Components call stable Socket.IO handlers directly. stateManager is optional for caching, not gating. All real-time updates come via broadcasts from the centralized cadence.

```
┌─────────────────┐
│   Components    │ Listen to broadcasts only
└────────┬────────┘
         │ socketClient.on("metrics:updated", handler)
         ↓
┌─────────────────┐
│  Socket.IO      │ Stable contracts, broadcasts
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Central Cadence │ Single timer, broadcasts to all
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Server Handlers │ Business logic, state management
└─────────────────┘
```

### Socket Handler Contracts

All Socket.IO handlers are stable, documented contracts:

```javascript
// Server handler - crystal clear input/output
socket.on("models:list", (req, callback) => {
  const models = db.getModels();
  callback({ success: true, data: models });

  // Broadcast to all clients for cross-component sync
  socket.broadcast.emit("models:updated", { models });
});

socket.on("models:load", (req, callback) => {
  try {
    const result = loadModel(req.modelName);
    callback({ success: true, data: result });
    socket.broadcast.emit("models:status", { models: getModels() });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});

// Cadence subscription handlers
socket.on("metrics:subscribe", (req, callback) => {
  cadenceBroker.subscribe(socket.id);
  callback({ success: true });
});

socket.on("metrics:unsubscribe", (req, callback) => {
  cadenceBroker.unsubscribe(socket.id);
  callback({ success: true });
});
```

### Component Pattern: Socket-Driven Updates

Components receive all state via broadcasts and never poll:

```javascript
class DashboardController extends Component {
  constructor(props) {
    super(props);
    this.metrics = null;
    this.models = [];
    this.loading = true;
    this.unsubscribers = [];
  }

  async onMount() {
    // Listen to broadcasts - NO polling
    this.unsubscribers = [
      socketClient.on("metrics:updated", (data) => {
        console.log("[DEBUG] Metrics broadcast received:", { cpu: data.metrics?.cpu });
        this.metrics = data.metrics;
        this._updateMetricsUI();
      }),
      socketClient.on("models:status", (data) => {
        console.log("[DEBUG] Models status broadcast received:", { count: data.models?.length });
        this.models = data.models || [];
        this._updateModelsUI();
      }),
      socketClient.on("logs:entry", (data) => {
        console.log("[DEBUG] Log entry received:", { level: data.entry?.level });
        this._handleLogEntry(data.entry);
      }),
    ];

    // Subscribe to cadence
    socketClient.emit("metrics:subscribe", {}, (response) => {
      if (response.success) {
        console.log("[DEBUG] Subscribed to metrics cadence");
      }
    });

    // Initial load via request (one-time)
    try {
      const response = await socketClient.request("models:list", {});
      if (response.success) {
        this.models = response.data || [];
      }
    } catch (error) {
      console.error("[DEBUG] Failed to load models:", error);
    } finally {
      this.loading = false;
    }
  }

  _updateMetricsUI() {
    if (!this.metrics) return;
    this.setText(".cpu-value", this.metrics.cpu + "%");
    this.setText(".memory-value", this._formatBytes(this.metrics.memory));
  }

  _updateModelsUI() {
    const container = this.$(".models-list");
    if (container) {
      container.innerHTML = this.models.map((m) =>
        Component.h("div", { className: `model-item status-${m.status}` }, m.name)
      ).join("");
    }
  }

  destroy() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Unsubscribe from cadence
    socketClient.emit("metrics:unsubscribe", {});
  }
}
```

### stateManager Role: Minimal Cache Only

Use stateManager **only** for caching shared state, not for gating requests:

```javascript
// In a component that needs cached state
onMount() {
  // Try cache first for initial render
  this.metrics = stateManager.get("metrics") || null;

  // Then listen to broadcasts for updates
  socketClient.on("metrics:updated", (data) => {
    this.metrics = data.metrics;
    stateManager.set("metrics", this.metrics); // Update cache
    this._updateUI();
  });
}
```

### Rules for Stable Contracts

1. **One handler = one job** - `models:list` lists, `models:load` loads
2. **Handler signature is frozen** - once defined, don't change input/output
3. **Always return callback with {success, data/error}** format
4. **Broadcast for shared state changes** - don't rely on requestor to propagate
5. **No business logic in stateManager** - only in handlers
6. **No handler calls other handlers** - chain on client side if needed
7. **Real-time data via broadcasts only** - no polling, no HTTP

### Handler Naming Convention

```
<domain>:<action>

models:list         // GET all models
models:load         // POST start model
models:unload       // POST stop model
models:delete       // DELETE model
models:scan         // POST scan disk
metrics:subscribe   // POST subscribe to cadence
metrics:unsubscribe // POST unsubscribe from cadence
router:status       // GET router status
router:restart      // POST restart
config:get          // GET config
config:update       // POST update config
```

---

## Event-Driven Logging

The server logs events via Socket.IO broadcasts:

```javascript
// Server emits logs as broadcasts
socket.broadcast.emit("logs:entry", {
  type: "broadcast",
  data: {
    entry: {
      level: "info",
      message: "Model started",
      source: "models",
      timestamp: Date.now(),
    },
  },
});

// Frontend listens for log broadcasts
socketClient.on("logs:entry", (data) => {
  this.logs.unshift(data.entry);
  if (this.logs.length > 100) {
    this.logs.pop();
  }
  this._updateLogsUI();
});
```

---

## Testing Guidelines

**Critical Principle**: If tests fail, the code is broken - fix the code, not the tests.

### Socket.IO Testing

Test both request-response and broadcast patterns:

```javascript
// Test request handler
test("models:list returns all models", async () => {
  const mockSocket = { emit: jest.fn() };
  handleModelsList(mockSocket, {});

  expect(mockSocket.emit).toHaveBeenCalledWith(
    "models:list:response",
    expect.objectContaining({
      success: true,
      data: expect.objectContaining({ models: expect.any(Array) }),
    })
  );
});

// Test broadcast emission
test("models:load broadcasts status update", async () => {
  const mockSocket = {
    emit: jest.fn(),
    broadcast: { emit: jest.fn() },
  };

  handleModelsLoad(mockSocket, { modelName: "test-model" });

  expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(
    "models:status",
    expect.objectContaining({
      models: expect.any(Array),
    })
  );
});
```

### Coverage Summary

This project has **473+ comprehensive tests** covering:

| Test File | Tests | Coverage |
| --------- | ----- | -------- |
| `__tests__/server/db.test.js` | 84 tests | 100% DB operations |
| `__tests__/server/metadata.test.js` | 60 tests | 100% metadata parsing |
| `__tests__/utils/validation.test.js` | 230 tests | 100% validation functions |
| `__tests__/utils/format.test.js` | 93 tests | 100% formatting functions |

---

## Common Patterns

### Conditional Rendering

```javascript
// Ternary for simple conditions
this.state.loading ? Component.h("div", {}, "Loading...") : Component.h("div", {}, content);

// Logical AND for optional elements
condition && Component.h("div", {}, "Optional");
```

### List Rendering

```javascript
models.map((model) =>
  Component.h(ModelTableRow, {
    key: model.id,
    model,
  })
);
```

### Event Handling

```javascript
// In getEventMap
getEventMap() {
  return {
    'click [data-action]': 'handleClick',
    'change [data-field]': 'handleChange',
    'submit form': 'handleSubmit'
  };
}

handleClick(event) {
  const action = event.target.closest('[data-action]').dataset.action;
  switch (action) {
    case 'start':
      this.handleStart();
      break;
    case 'stop':
      this.handleStop();
      break;
  }
}
```

### Async/Await Pattern

```javascript
async loadData() {
  try {
    this.loading = true;
    const response = await socketClient.request("data:list", {});
    this.data = response.data || [];
    this.loading = false;
  } catch (error) {
    console.error('[Page] Failed to load data:', error);
    this.error = error.message;
    this.loading = false;
  }
}
```

---

## Related Documentation

- [docs/README.md](docs/README.md) - User guide
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture
- [SOCKET_CONTRACTS.md](SOCKET_CONTRACTS.md) - **IMPORTANT** Stable socket API reference
- [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) - How to refactor components to socket-first
- [SERVER_HANDLER_TEMPLATE.md](SERVER_HANDLER_TEMPLATE.md) - Server handler best practices
- [MIGRATION_TO_SOCKET_FIRST.md](MIGRATION_TO_SOCKET_FIRST.md) - Full migration plan

---

**Remember**: This is a Vanilla JavaScript project. Do not use React, TypeScript, or any bundlers unless explicitly requested.

**Golden Rules Summary**:
1. **Pure Event-Driven DOM Updates** - All UI updates via Socket.IO broadcasts
2. **Socket.IO-First and Only** - No REST, fetch, or HTTP polling
3. **Centralized Cadence** - Single server timer, not per-client timers
4. **Proper Subscription Cleanup** - Unsubscribe in destroy() method

### Error Handling

- Wrap async calls in try-catch blocks
- Use `showNotification(message, type)` for user feedback
- Log errors with `console.error()`
- Types: 'info', 'success', 'warning', 'error'

```javascript
try {
  await socketClient.request("models:load", { modelName: "mistral-7b" });
  showNotification("Model started successfully", "success");
} catch (error) {
  console.error("[Models] Failed to start model:", error);
  showNotification("Failed to start model: " + error.message, "error");
}
```

### API Response Format

All Socket.IO responses follow this format:

```javascript
{
  success: boolean,
  data?: any,
  error?: {
    message: string,
    code?: string
  },
  timestamp: string
}
```

---

## State Management

**IMPORTANT**: stateManager is now **cache-only**. Use `socketClient.request()` directly for all API calls.

```javascript
// ❌ OLD - Don't do this anymore
const data = await stateManager.getModels();
const models = await stateManager.loadModel(name);
stateManager.subscribe("models", callback);

// ✅ NEW - Direct socket calls
const response = await socketClient.request("models:list", {});
this.models = response.data || [];

const response = await socketClient.request("models:load", { modelName: name });
if (response.success) {
  showNotification("Model loaded", "success");
}

socketClient.on("models:updated", (data) => {
  this.models = data.models || [];
  stateManager.set("models", this.models); // Optional cache
});
```

**stateManager is now used only for caching**:
```javascript
// Get cached state
const models = stateManager.get("models") || [];

// Set cached state (after loading from socket)
stateManager.set("models", this.models);

// Subscribe to state changes (rarely needed with broadcasts)
stateManager.subscribe("models", (models) => {
  console.log("Models changed:", models);
});
```

## File Organization

```
/home/bamer/nextjs-llama-async-proxy/
├── server.js                    # Main server entry
├── package.json                 # Dependencies & scripts
│
├── public/                      # Static files
│   ├── index.html              # SPA entry point
│   ├── css/
│   │   ├── main.css            # Core styles, variables, layout
│   │   └── components.css      # Component-specific styles
│   └── js/
│       ├── app.js              # Application initialization
│       ├── core/
│       │   ├── component.js    # Base Component class
│       │   ├── router.js       # History API router
│       │   └── state.js        # State manager
│       ├── services/
│       │   └── socket.js       # Socket.IO client
│       ├── pages/
│       │   ├── dashboard.js    # Dashboard page
│       │   ├── models.js       # Models management
│       │   ├── monitoring.js   # Monitoring page
│       │   ├── logs.js         # Logs viewer
│       │   ├── configuration.js # Configuration page
│       │   └── settings.js     # Settings page
│       ├── components/
│       │   └── layout/
│       │       └── layout.js   # Layout components
│       └── utils/              # Utility functions
│
├── data/                        # SQLite database
│   └── llama-dashboard.db
│
└── docs/                        # Documentation
    ├── README.md
    └── ARCHITECTURE.md
```

## Utility Functions

Available in `window.AppUtils`:

```javascript
// Format bytes to human readable
AppUtils.formatBytes(1024 * 1024); // "1.00 MB"

// Format percentage
AppUtils.formatPercent(0.4567); // "45.7%"

// Format timestamp
AppUtils.formatTimestamp(Date.now()); // "14:30:25"

// Format relative time
AppUtils.formatRelativeTime(Date.now() - 3600000); // "1h ago"

// Debounce function
const debounced = AppUtils.debounce(fn, 300);

// Throttle function
const throttled = AppUtils.throttle(fn, 1000);

// Generate unique ID
AppUtils.generateId(); // "1704112345_abc123def"

// Deep clone object
const copy = AppUtils.deepClone(obj);

// Check if object is empty
AppUtils.isEmpty({}); // true
```

## Architecture: Decentralized Socket-First Design

**KEY PRINCIPLE**: Components call stable Socket.IO handlers directly. stateManager is optional for caching, not gating.

```
┌─────────────────┐
│   Components    │ Direct socket calls
└────────┬────────┘
         │ socketClient.request("models:list", {})
         ↓
┌─────────────────┐
│  Socket.IO      │ Stable contracts
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Server Handler  │ Business logic, broadcasts
└─────────────────┘
```

### Socket Handler Contracts

All Socket.IO handlers are stable, documented contracts:

```javascript
// Server handler - crystal clear input/output
socket.on("models:list", (req, callback) => {
  const models = db.getModels();
  callback({ success: true, data: models });
  
  // Broadcast to all clients for cross-component sync
  socket.broadcast.emit("models:updated", { models });
});

socket.on("models:load", (req, callback) => {
  try {
    const result = loadModel(req.modelName);
    callback({ success: true, data: result });
    socket.broadcast.emit("models:updated", { models: getModels() });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});
```

### Component Pattern: Direct Socket Calls

Components call socket handlers directly and listen to broadcasts:

```javascript
class ModelsPage extends Component {
  constructor(props) {
    super(props);
    this.models = [];
    this.loading = false;
  }

  async onMount() {
    // Direct socket call - no stateManager gating
    try {
      this.loading = true;
      const response = await socketClient.request("models:list", {});
      this.models = response.data || [];
      this.render();
    } catch (error) {
      console.error("[ModelsPage] Failed to load:", error);
    } finally {
      this.loading = false;
    }

    // Listen to broadcasts for cross-component sync
    this.unsubscribers = [
      socketClient.on("models:updated", (data) => {
        this.models = data.models || [];
        this.render();
      }),
    ];
  }

  async handleLoadModel(modelName) {
    try {
      this.loading = true;
      const response = await socketClient.request("models:load", {
        modelName,
      });
      if (response.success) {
        showNotification("Model loaded", "success");
        // Broadcast handler will update other components
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

### stateManager Role: Minimal Cache Only

Use stateManager **only** for caching shared state, not for gating requests:

```javascript
// In a component that needs cached state
onMount() {
  // Try cache first
  this.models = stateManager.get("models") || [];
  
  // Then refresh from server
  socketClient.request("models:list", {}).then((response) => {
    this.models = response.data;
    // Update cache for other components
    stateManager.set("models", this.models);
    this.render();
  });
}
```

### Rules for Stable Contracts

1. **One handler = one job** - `models:list` lists, `models:load` loads
2. **Handler signature is frozen** - once defined, don't change input/output
3. **Always return callback with {success, data/error}** format
4. **Broadcast for shared state changes** - don't rely on requestor to propagate
5. **No business logic in stateManager** - only in handlers
6. **No handler calls other handlers** - chain on client side if needed

### Handler Naming Convention

```
<domain>:<action>

models:list         // GET all models
models:load         // POST start model
models:unload       // POST stop model
models:delete       // DELETE model
models:scan         // POST scan disk
router:status       // GET router status
router:restart      // POST restart
config:get          // GET config
config:update       // POST update config
```

### Old Controller Pattern (Deprecated)

Don't do this anymore:

```javascript
// ❌ OLD - stateManager as gatekeeper
async loadModels() {
  const data = await stateManager.getModels();
  stateManager.set("models", data.models || []);
}

// ✅ NEW - direct socket call
async loadModels() {
  const response = await socketClient.request("models:list", {});
  this.models = response.data || [];
}
```
```

## Event-Driven Logging

The server logs events via Socket.IO broadcasts:

```javascript
// Server emits:
socket.emit("logs:entry", {
  type: "broadcast",
  data: {
    entry: {
      level: "info",
      message: "Model started",
      source: "models",
      timestamp: Date.now(),
    },
  },
});
```

## Testing Guidelines

**Critical Principle**: If tests fail, the code is broken - fix the code, not the tests. Tests are written to verify correct behavior; when tests fail, it indicates a bug in the implementation.

### Test Coverage Summary

This project has **473+ comprehensive tests** covering:

| Test File                            | Tests     | Coverage                  |
| ------------------------------------ | --------- | ------------------------- |
| `__tests__/server/db.test.js`        | 84 tests  | 100% DB operations        |
| `__tests__/server/metadata.test.js`  | 60 tests  | 100% metadata parsing     |
| `__tests__/utils/validation.test.js` | 230 tests | 100% validation functions |
| `__tests__/utils/format.test.js`     | 93 tests  | 100% formatting functions |

### Bugs Found and Fixed by Tests

1. **isNumber** - Added `!isFinite(value)` check to properly reject Infinity/-Infinity
2. **hasRequiredKeys** - Added `Array.isArray()` validation for obj and requiredKeys
3. **validateAllValues** - Added type checks for object and predicate
4. **formatBytes/formatFileSize** - Extended size array to support Yottabytes
5. **formatPercent** - Added null/undefined handling
6. **formatRelativeTime** - Fixed future timestamp handling using `Math.trunc`

### Test Organization

```bash
__tests__/
├── server/                    # Server-side tests
│   ├── db.test.js            # Database layer tests (84 tests)
│   └── metadata.test.js      # GGUF metadata parsing tests (60 tests)
└── utils/                     # Utility tests
    ├── validation.test.js    # Validation function tests (230 tests)
    └── format.test.js        # Formatting function tests (93 tests)
```

### Test Principles

1. **Write tests first (TDD)** - Define expected behavior before implementing
2. **Test behavior, not implementation** - Focus on what the function does, not how
3. **Use descriptive test names** - Test names should describe the expected behavior
4. **Each test one assertion** - Makes debugging easier
5. **Mock external dependencies** - Database, file system, network calls

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific test file
pnpm test -- utils/validation.test.js
```

### Coverage Enforcement

The project enforces high coverage standards. Coverage reports are generated in the `coverage/` directory.

```bash
# View coverage HTML report
open coverage/index.html

# View coverage JSON summary
cat coverage/coverage-summary.json
```

## CSS Class Naming

- Use lowercase with hyphens: `.my-component`, `.action-button`
- BEM-style for modifiers: `.card`, `.card--active`, `.card__header`
- Utility classes: `.text-center`, `.mt-2`, `.flex`
- State classes: `.is-loading`, `.has-error`, `.is-active`

## Console Logging

- `console.log()` - General logging (debug info)
- `console.warn()` - Warnings (non-critical issues)
- `console.error()` - Errors (action required)
- Prefix logs with component name: `[Dashboard]`, `[Models]`, `[Router]`

## Debug Logging (Development Mode)

This project uses comprehensive debug logging to aid development. **Do NOT remove debug logs** - they stay in the codebase permanently.

### Backend (server.js)

Use `[DEBUG]` prefix for all debug output:

```javascript
// In socket handlers
console.log("[DEBUG] Event received:", { event: "models:scan", data: req });
console.log("[DEBUG] Scan result:", { found: files.length, path: modelsDir });
console.error("[DEBUG] Error details:", error.message);

// In scan/discover operations
console.log("[DEBUG] Directory exists:", dirExists);
console.log("[DEBUG] Files in directory:", files.length, files);
```

### Frontend (public/js/)

Use `[DEBUG]` prefix consistently:

```javascript
// Controllers
console.log("[DEBUG] Controller created");
console.log("[DEBUG] Controller init");
console.log("[DEBUG] Controller willUnmount");

// State operations
console.log("[DEBUG] State changed:", key, value);
console.log("[DEBUG] API request:", event, data);
console.log("[DEBUG] API response:", data);

// Component lifecycle
console.log("[DEBUG] Component created, props:", props);
console.log("[DEBUG] Component willReceiveProps:", newProps);
console.log("[DEBUG] Button clicked:", action);

// Error handling
console.error("[DEBUG] Error:", error);
```

### What to Debug

Always log:

1. **Lifecycle events**: constructor, init, willUnmount, destroy
2. **API requests/responses**: what was sent, what was received
3. **State changes**: before/after values
4. **User actions**: button clicks, form submissions
5. **Scan/discover operations**: paths, file counts, results
6. **Errors**: full error details with stack trace

### Debug Log Format

```
[DEBUG] <Component/Module> <Action> [details as JSON]
```

Examples:

```
[DEBUG] ModelsController init
[DEBUG] API getConfig { requestId: "req_123_abc" }
[DEBUG] Scan result: { new: 5, total: 10 }
[DEBUG] File check: { name: "model.gguf", isFile: true, extMatch: true }
[DEBUG] models:list request { requestId: 123456789 }
```

## Common Patterns

### Conditional Rendering

```javascript
// Ternary for simple conditions
this.state.loading ? Component.h("div", {}, "Loading...") : Component.h("div", {}, content);

// Logical AND for optional elements
condition && Component.h("div", {}, "Optional");
```

### List Rendering

```javascript
models.map((model) =>
  Component.h(ModelTableRow, {
    key: model.id,
    model,
  })
);
```

### Event Handling

```javascript
// In getEventMap
getEventMap() {
  return {
    'click [data-action]': 'handleClick',
    'change [data-field]': 'handleChange',
    'submit form': 'handleSubmit'
  };
}

handleClick(event) {
  const action = event.target.closest('[data-action]').dataset.action;
  switch (action) {
    case 'start':
      this.handleStart();
      break;
    case 'stop':
      this.handleStop();
      break;
  }
}
```

### Async/Await Pattern

```javascript
async loadData() {
  try {
    this.loading = true;
    const response = await socketClient.request("data:list", {});
    this.data = response.data || [];
    this.loading = false;
  } catch (error) {
    console.error('[Page] Failed to load data:', error);
    this.error = error.message;
    this.loading = false;
  }
}
```

## Related Documentation

- [docs/README.md](docs/README.md) - User guide
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture
- [SOCKET_CONTRACTS.md](SOCKET_CONTRACTS.md) - **IMPORTANT** Stable socket API reference
- [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) - How to refactor components to socket-first
- [SERVER_HANDLER_TEMPLATE.md](SERVER_HANDLER_TEMPLATE.md) - Server handler best practices
- [MIGRATION_TO_SOCKET_FIRST.md](MIGRATION_TO_SOCKET_FIRST.md) - Full migration plan

---

**Remember**: This is a Vanilla JavaScript project. Do not use React, TypeScript, or any bundlers unless explicitly requested.


**Golden Rules Summary**:
1. **Pure Event-Driven DOM Updates** - All UI updates via Socket.IO broadcasts
2. **Socket.IO-First and Only** - No REST, fetch, or HTTP polling
3. **Decentralized And decoupled autonomous atomic components** - one component == work everywhere
4. **Proper Subscription Cleanup** - Unsubscribe in destroy() method
