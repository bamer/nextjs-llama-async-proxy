# AGENTS.md - Agent Guidelines

This document provides guidelines for agentic coding assistants working on this **Vanilla JavaScript** Llama Proxy Dashboard.

**Critical**: Never DELETE this file.

## Application Overview

- **Backend**: Node.js + Express + Socket.IO (server.js)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Database**: SQLite with better-sqlite3
- **Architecture**: Event-Driven DOM Updates via Socket.IO
- **LLM Backend**: llama.cpp in router mode (multi-model support)
- **Forbidden**: setTimeout/setInterval for state updates (use Socket.IO broadcasts only)

## Mandatory Rules

1. **Keep files under 200 lines** - Split large files into smaller modules
2. **Single responsibility** - Each component/class does one thing
3. **No memory leaks** - Always cleanup subscriptions and event listeners
4. **Graceful degradation** - Handle missing data gracefully
5. **User feedback** - Show notifications for user actions
6. **Error boundaries** - Catch and display errors to users
7. **Never write outside project dir** - You will lose time for nothing

## Build / Run Commands

**Always use `pnpm` for package management:**

```bash
pnpm start              # Start development server
pnpm dev                # Start with file watching
pnpm test               # Run all tests
pnpm test:watch         # Run tests in watch mode
pnpm test:coverage      # Generate coverage report (100% required)
pnpm lint               # Run ESLint
pnpm lint:fix           # Auto-fix lint issues
pnpm format             # Format all files with Prettier
pnpm format:check       # Check formatting without modifying
pnpm db:export          # Export database backup
pnpm db:reset           # Reset database
```

## Code Style Guidelines

- Use double quotes only (`"not 'single'"`)
- Always use semicolons
- 2-space indentation
- Trailing commas in multi-line objects/arrays
- Max line width: 80 characters
- Object-curly-spacing: `always` (spaces inside {})
- Array-bracket-spacing: `never` (no spaces inside [])

## Naming Conventions

- **Classes/Components**: PascalCase (`DashboardController`, `ModelsPage`)
- **Functions/Variables**: camelCase (`getModels`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`, `API_BASE_URL`)
- **Private class members**: underscore prefix (`_privateMethod`)
- **File names**: match export names (e.g., `layout.js` exports `Layout`)

## Component Pattern (Event-Driven)

All UI components extend the `Component` base class:

```javascript
class MyComponent extends Component {
  constructor(props) {
    super(props);
    this.data = props.data || [];
    this.loading = false;
  }

  render() {
    return Component.h("div", { className: "my-component" }, [
      Component.h("h1", {}, "Title"),
      this.loading
        ? Component.h("div", { className: "loading" }, "Loading...")
        : this._renderContent(),
    ]);
  }

  onMount() {
    this.unsubscribers = [
      socketClient.on("data:updated", (data) => {
        this.data = data || [];
        this._updateUI();
      }),
    ];
  }

  destroy() {
    this.unsubscribers?.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  _updateUI() {
    const content = this.$(".content");
    if (content) {
      content.innerHTML = "";
      const wrapper = this.render();
      content.appendChild(wrapper);
    }
  }
}
```

## Socket.IO Architecture (Socket-First, Event-Driven)

**Core Principle**: All data flows through Socket.IO broadcasts. Components subscribe to events, never poll.

### Request/Response Pattern

```javascript
// Make request (for user actions)
const response = await socketClient.request("models:list", {});
if (response.success) {
  this.models = response.data || [];
}

// Listen for broadcasts (for state updates)
socketClient.on("models:updated", (data) => {
  this.models = data.models || [];
  this._updateUI();
});
```

### Subscription Lifecycle

```javascript
onMount() {
  // Store all unsubscribers
  this.unsubscribers = [
    socketClient.on("event1", handler1),
    socketClient.on("event2", handler2),
  ];
}

destroy() {
  // ALWAYS cleanup in destroy()
  this.unsubscribers?.forEach((unsub) => unsub());
  this.unsubscribers = [];
}
```

### Handler Contracts

All Socket.IO handlers are stable contracts:

```javascript
socket.on("models:list", (req, callback) => {
  const models = db.getModels();
  callback({ success: true, data: models });

  // Broadcast to all clients for sync
  socket.broadcast.emit("models:updated", { models });
});
```

### Response Format

All responses follow:

```javascript
{
  success: boolean,
  data?: any,
  error?: { message: string, code?: string },
  timestamp: string
}
```

## Forbidden Patterns

**❌ NO Timer-Based Polling:**

```javascript
// FORBIDDEN - uses setInterval/setTimeout
setInterval(async () => {
  const response = await socketClient.request("metrics:get", {});
  this.metrics = response.data;
}, 2000);
```

**❌ NO Direct HTTP:**

```javascript
// FORBIDDEN - uses fetch/XHR
const response = await fetch("/api/metrics");
const data = await response.json();
```

**❌ NO REST Endpoints:**

```javascript
// FORBIDDEN - REST API instead of Socket.IO
app.get("/api/models", handler);
app.post("/api/models/load", handler);
```

**✅ CORRECT - Event-Driven Updates:**

```javascript
// Listen to broadcasts - NO polling
socketClient.on("metrics:updated", (data) => {
  this.metrics = data.metrics;
  this._updateUI();
});

// Subscribe to cadence
socketClient.emit("metrics:subscribe", {}, (response) => {
  if (response.success) {
    console.log("[DEBUG] Subscribed to metrics");
  }
});
```

## Llama.cpp Router Mode

The application uses llama.cpp's router mode for multi-model support.

**Key Features:**

- Single llama-server process manages all models
- Auto-discovery of models from `--models-dir`
- On-demand loading (lazy loading)
- LRU eviction when `--models-max` reached

**Model Status Values:**

- `loaded` - Model is loaded and ready
- `loading` - Model is being loaded
- `unloaded` - Model is on disk, not in memory
- `error` - Model failed to load

**CLI Options:**

```bash
llama-server --models-dir ./models --models-max 4 -c 8192 -ngl 99 --np 4
```

## File Organization

```text
/project-root/
├── server.js                    # Main server
├── package.json                 # Dependencies
├── public/
│   ├── index.html              # SPA entry
│   ├── css/
│   │   ├── main.css            # Core styles
│   │   └── components.css      # Component styles
│   └── js/
│       ├── app.js              # Initialization
│       ├── core/
│       │   ├── component.js    # Base class
│       │   ├── router.js       # Router
│       │   └── state.js        # State manager
│       ├── services/
│       │   └── socket.js       # Socket.IO client
│       ├── pages/              # Page controllers
│       ├── components/         # UI components
│       └── utils/              # Utilities
├── server/                      # Server modules
├── data/                        # SQLite database
└── docs/                        # Documentation
```

## Error Handling

```javascript
// ✅ REQUIRED - Log to console AND show toast
try {
  await socketClient.request("models:load", { modelName: "model" });
  showNotification("Model loaded", "success");
} catch (error) {
  console.error("[Module] Operation failed:", error);
  showNotification(`Error: ${error.message}`, "error");
}

// ❌ FORBIDDEN - Show toast without logging
showNotification("Save failed", "error");
```

## Testing

**Critical**: If tests fail, the code is broken. Fix the code, not the tests.

```bash
pnpm test                  # Run all tests
pnpm test:coverage         # Check coverage (100% required)
pnpm test -- file.test.js  # Run specific test
```

## Related Documentation

- **docs/README.md** - User guide
- **docs/ARCHITECTURE.md** - Technical architecture
- **SOCKET_CONTRACTS.md** - Stable Socket.IO API reference
- **CONTRACTS.md** - API contracts
- **API.md** - API documentation
- **USAGE.md** - Usage guide

## Utility Functions

Available in `window.AppUtils`:

```javascript
AppUtils.formatBytes(1024 * 1024)        // "1.00 MB"
AppUtils.formatPercent(0.4567)           // "45.7%"
AppUtils.formatTimestamp(Date.now())     // "14:30:25"
AppUtils.formatRelativeTime(Date.now())  // "1s ago"
AppUtils.debounce(fn, 300)               // Debounced function
AppUtils.throttle(fn, 1000)              // Throttled function
AppUtils.generateId()                    // Unique ID
AppUtils.deepClone(obj)                  // Deep copy
AppUtils.isEmpty({})                     // Check if empty
```

## State Management

The `stateManager` is cache-only. All data flows through Socket.IO:

```javascript
// ✅ CORRECT - Direct socket calls
const response = await socketClient.request("models:list", {});
this.models = response.data || [];

socketClient.on("models:updated", (data) => {
  this.models = data.models || [];
  stateManager.set("models", this.models); // Optional cache
});

// ❌ FORBIDDEN - Using stateManager as gatekeeper
const data = await stateManager.getModels();
```

## Debug Logging

All debug output uses `[DEBUG]` prefix:

```javascript
// Server
console.log("[DEBUG SERVER] Event:", { event: "models:load" });

// Frontend
console.log("[DEBUG CLIENT] Controller init");
```

## Deployment

See **DEPLOYMENT_CHECKLIST.md** for production checklist.

## Performance Considerations

1. Keep components under 200 lines
2. Lazy-load models on-demand (llama.cpp router)
3. Use delta-driven updates (not timer-based)
4. Cleanup subscriptions properly (prevent memory leaks)
5. Compress responses and minimize payloads

## Quick Links

- **GitHub**: <https://github.com/bamer/nextjs-llama-async-proxy>
- **Config**: llama-server-config.json
- **Database**: data/llama-dashboard.db
