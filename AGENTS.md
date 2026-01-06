# AGENTS.md - Agent Guidelines for this Repository

This document provides guidelines for agentic coding assistants working in this **Vanilla JavaScript** Llama Proxy Dashboard application.
**Critical**: never DELETE this file for whatever reason.

## Application Overview

- **Backend**: Node.js + Express + Socket.IO (server.js)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Database**: SQLite with better-sqlite3
- **Real-time**: Socket.IO for live updates
- **Architecture**: Component-based with custom router and state manager

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

### Component Class Pattern

All UI components should extend the `Component` base class:

```javascript
class MyComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      /* ... */
    };
  }

  /**
   * Lifecycle: Called before mounting
   */
  willMount() {
    // Setup before render
  }

  /**
   * Lifecycle: Render the component
   * Must return HTML string or HTMLElement
   */
  render() {
    return Component.h("div", { className: "my-component" }, Component.h("h1", {}, "Title"));
  }

  /**
   * Lifecycle: Called after mounting to DOM
   */
  didMount() {
    // Setup subscriptions, event listeners
  }

  /**
   * Event map - maps DOM events to handlers
   */
  getEventMap() {
    return {
      "click [data-action]": "handleAction",
      "change [data-field]": "handleFieldChange",
    };
  }

  handleAction(event) {
    // Handle click on elements with data-action attribute
  }

  handleFieldChange(event) {
    // Handle input changes
  }
}
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

Use the global `stateManager` for shared state:

```javascript
// Subscribe to state changes
stateManager.subscribe("models", (models) => {
  console.log("Models changed:", models);
});

// Update state
stateManager.set("currentModel", model);

// Get state
const models = stateManager.get("models");
const allState = stateManager.getState();

// Make API requests
const data = await stateManager.getModels();
await stateManager.startModel(modelId);
await stateManager.updateConfig(config);
```

### Socket.IO Patterns

The socket client is auto-initialized in app.js:

```javascript
// Connection status
socketClient.isConnected; // true/false

// Listen for events
socketClient.on("models:list", (data) => {
  // Handle broadcast
});

// Send requests (use stateManager.request for better API)
stateManager.request("models:start", { modelId: "123" });
```

### Error Handling

- Wrap async calls in try-catch blocks
- Use `showNotification(message, type)` for user feedback
- Log errors with `console.error()`
- Types: 'info', 'success', 'warning', 'error'

```javascript
try {
  await stateManager.startModel(modelId);
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

## Controller Pattern

Pages use a Controller + Component pattern:

```javascript
class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubscribers = [];
    this.component = null;
  }

  init() {
    // Setup subscriptions
    this.unsubscribers.push(stateManager.subscribe("models", this.onModelsChange.bind(this)));
    this.loadModels();
  }

  async loadModels() {
    const data = await stateManager.getModels();
    stateManager.set("models", data.models || []);
  }

  onModelsChange(models) {
    if (this.component) {
      this.component.updateModelList(models);
    }
  }

  willUnmount() {
    // Cleanup subscriptions
    this.unsubscribers.forEach((unsub) => unsub());
    if (this.component) {
      this.component.destroy();
    }
  }

  destroy() {
    this.willUnmount();
  }

  render() {
    this.component = new ModelsPage({
      models: stateManager.get("models") || [],
    });
    this.init();
    return this.component.render();
  }

  didMount() {
    if (this.component && this.component.didMount) {
      this.component.didMount();
    }
  }
}
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

## Best Practices

1. **Keep files under 200 lines** - Split large files into smaller modules
2. **Single responsibility** - Each component/class should do one thing
3. **No memory leaks** - Always clean up subscriptions and event listeners
4. **Graceful degradation** - Handle missing data gracefully
5. **User feedback** - Show notifications for user actions
6. **Error boundaries** - Catch and display errors to users

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
    this.setState({ loading: true });
    const data = await stateManager.getData();
    this.setState({ data, loading: false });
  } catch (error) {
    console.error('[Page] Failed to load data:', error);
    this.setState({ error: error.message, loading: false });
  }
}
```

## Related Documentation

- [docs/README.md](docs/README.md) - User guide
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture

---

**Remember**: This is a Vanilla JavaScript project. Do not use React, TypeScript, or any bundlers unless explicitly requested.
