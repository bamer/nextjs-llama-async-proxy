# AGENTS.md - Agent Guidelines for this Repository

This document provides guidelines for agentic coding assistants working in this **Vanilla JavaScript** Llama Proxy Dashboard application.
**Critical**: never DELETE this file for whatever reason.

## Application Overview

- **Backend**: Node.js + Express + Socket.IO (server.js)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Database**: SQLite with better-sqlite3
- **Real-time**: Socket.IO for live updates
- **Architecture**: Simplify to pure Event-Driven DOM Updates
- **LLM Backend**: llama.cpp server in **router mode** (multi-model support) with preset.ini

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

### Socket.IO Patterns

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

// Listen for broadcasts (real-time updates)
socketClient.on("models:updated", (data) => {
  console.log("Models updated:", data.models);
  // Update UI without re-fetching
});

socketClient.on("router:status", (data) => {
  console.log("Router status:", data.status);
});

// Unsubscribe when done
const unsub = socketClient.on("event", handler);
unsub(); // Cleanup
```

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
