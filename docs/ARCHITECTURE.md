# Architecture Documentation

This document describes the technical architecture of the Llama Async Proxy Dashboard.

## System Overview

The application follows a clean client-server architecture with all communication flowing through Socket.IO:

```
┌─────────────────────────────────────┐
│           Browser Client            │
│  ┌─────────────────────────────┐   │
│  │      Vanilla JavaScript     │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐  │   │
│  │  │Router│ │State│ │UI   │  │   │
│  │  └─────┘ └─────┘ └─────┘  │   │
│  └───────────┬───────────────┘   │
│              │ Socket.IO         │
└──────────────│──────────────────┘
                │
         WebSocket / HTTP
                │
┌──────────────│──────────────────┐
│     Node.js Server             │
│  ┌───────────────┬───────────┐ │
│  │   Express    │Socket.IO  │ │
│  │  (static)    │ (API)     │ │
│  └──────┬────────┴─────┬──────┘ │
│         │              │        │
│         ▼              ▼        │
│  ┌──────────────────────────┐  │
│  │     SQLite Database      │  │
│  └──────────────────────────┘  │
└───────────────────────────────┘
```

## Llama.cpp Router Mode (Multi-Model Support)

**NEW (December 2025)**: The application now uses llama.cpp's **router mode** to support multiple models in a single server instance.

### Router Mode Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           llama-server --models-dir ./models                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Router                            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────┐  │   │
│  │  │ Slot 0  │  │ Slot 1  │  │ Slot 2  │  │ Slot  │  │   │
│  │  │ Model A │  │ Model B │  │ Model C │  │ ...   │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └───────┘  │   │
│  │         │          │          │                    │   │
│  │         └──────────┴──────────┘                    │   │
│  │                      │                             │   │
│  │              Request Routing                        │   │
│  │         (model field in request)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                │
│              Single Port (8080 by default)                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature               | Description                                         | CLI Flag                      |
| --------------------- | --------------------------------------------------- | ----------------------------- |
| **Model Discovery**   | Auto-discovers GGUF files from directory            | `--models-dir`                |
| **Multiple Models**   | Load multiple models simultaneously                 | `--models-max N` (default: 4) |
| **Parallel Requests** | Handle concurrent requests                          | `--np N`, `--threads-http N`  |
| **LRU Eviction**      | Least-recently-used model unloaded when max reached | Automatic                     |
| **On-Demand Loading** | Models load when first requested                    | `/models/load`                |

### API Endpoints

Router mode exposes these HTTP endpoints:

| Endpoint               | Method | Description                                           |
| ---------------------- | ------ | ----------------------------------------------------- |
| `/models`              | GET    | List all models with status (loaded/loading/unloaded) |
| `/models/load`         | POST   | Manually load a model                                 |
| `/models/unload`       | POST   | Unload a model                                        |
| `/v1/chat/completions` | POST   | OpenAI-compatible chat completions                    |

### Configuration Options

| Setting           | CLI Flag         | Default              | Description                         |
| ----------------- | ---------------- | -------------------- | ----------------------------------- |
| Models Directory  | `--models-dir`   | `~/.cache/llama.cpp` | Directory containing GGUF files     |
| Max Models Loaded | `--models-max`   | 4                    | Maximum models in memory            |
| Parallel Slots    | `--np`           | 1                    | Number of parallel processing slots |
| HTTP Threads      | `--threads-http` | 1                    | HTTP threads for parallel requests  |
| Context Size      | `-c`             | 512                  | Default context window size         |
| GPU Layers        | `-ngl`           | 0                    | Layers to offload to GPU            |

### Model Status Values

| Status     | Description                                    |
| ---------- | ---------------------------------------------- |
| `loaded`   | Model is loaded in memory, ready for inference |
| `loading`  | Model is currently being loaded                |
| `unloaded` | Model is on disk, not in memory                |
| `error`    | Model failed to load                           |

## Key Architectural Decisions

### 1. Server-Owned State

The server is the single source of truth for all application state:

- **Models**: Stored in SQLite, modified only via Socket.IO events
- **Metrics**: Collected by server, broadcast to all clients
- **Logs**: Generated by server's Winston logger, broadcast to clients
- **Configuration**: Stored in SQLite, retrieved via Socket.IO

Clients never modify state directly. They emit "intents" and the server broadcasts the resulting state.

### 2. Socket.IO-Only Communication

No REST APIs exist in this application. All data flows through Socket.IO:

- **Request-Response**: Client sends request, server responds to that specific client
- **Broadcasts**: Server pushes updates to all connected clients

This eliminates:

- CORS issues
- Separate API server requirements
- REST endpoint maintenance

### 3. Event-Driven Architecture

Components subscribe to state changes rather than polling:

```javascript
// Frontend state manager
stateManager.subscribe("models", (models) => {
  // Called whenever models change
  this.updateModelList(models);
});
```

The server broadcasts state changes automatically:

```javascript
// Backend
function broadcastState(models) {
  io.emit("models:list", {
    type: "broadcast",
    event: "models:list",
    data: { models },
    timestamp: Date.now(),
  });
}
```

### 4. Vanilla JavaScript Frontend

No frameworks on the frontend:

| Feature    | Implementation                |
| ---------- | ----------------------------- |
| Components | Custom `Component` base class |
| Routing    | History API-based `Router`    |
| State      | Event-driven `StateManager`   |
| Styling    | Pure CSS with CSS variables   |
| Templating | JavaScript template literals  |

## Component Model

### Component Class Hierarchy

```
Component (base class)
├── DashboardPage
├── ModelsPage
├── MonitoringPage
├── ConfigurationPage
├── SettingsPage
├── LogsPage
└── Layout Components
```

### Component Lifecycle

```
┌─────────────────────────────────────────────────────┐
│ init()          - Initialize state                  │
├─────────────────────────────────────────────────────┤
│ mount(parent)   - Create DOM, bind events          │
├─────────────────────────────────────────────────────┤
│ render()        - Return DOM element               │
├─────────────────────────────────────────────────────┤
│ update()        - Patch DOM, rebind events         │
├─────────────────────────────────────────────────────┤
│ destroy()       - Cleanup, remove DOM             │
└─────────────────────────────────────────────────────┘
```

### Example Component

```javascript
class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: props.models || [],
      metrics: props.metrics || null,
    };
  }

  getInitialState() {
    return { models: [], metrics: null };
  }

  render() {
    return Component.h(
      "div",
      { className: "dashboard-page" },
      Component.h("h1", {}, "Dashboard"),
      Component.h(MetricsGrid, { metrics: this.state.metrics })
    );
  }

  getEventMap() {
    return {
      'click [data-action="refresh"]': "handleRefresh",
    };
  }

  handleRefresh() {
    stateManager.getMetrics();
  }
}
```

## State Management

### StateManager

The `StateManager` class provides:

1. **State Storage**: Centralized state object
2. **Subscriptions**: Components subscribe to state changes
3. **Socket.IO Integration**: Requests and broadcasts
4. **Request Queue**: Queue requests during disconnection

```javascript
class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.socket = null;
  }

  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
  }

  // Update state and notify listeners
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this._notify(key, value, oldValue);
  }

  // Request-response via Socket.IO
  async request(event, data) {
    if (this.connectionStatus !== "connected") {
      this.requestQueue.push({ event, data });
      return;
    }
    return this.socket.request(event, data);
  }
}
```

### State Flow

```
┌──────────────┐     Socket.IO      ┌──────────────┐
│  Component   │ ───────────────── │ StateManager │
│              │ ◄── subscribe ─── │              │
└──────────────┘                   └──────┬───────┘
                                        │
                                        │ set(key, value)
                                        ▼
                                ┌──────────────┐
                                │   _notify()  │
                                └──────┬───────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
            │ Listener 1 │    │ Listener 2 │    │ Listener 3 │
            └─────────────┘    └─────────────┘    └─────────────┘
```

## Routing

### Router Class

Uses the History API for client-side routing:

```javascript
class Router {
  constructor(options = {}) {
    this.routes = new Map();
    this.rootElement = options.root;
    this.beforeHooks = [];
    this.afterHooks = [];
  }

  register(path, handler) {
    const pattern = this._pathToRegex(path);
    this.routes.set(pattern, { path, pattern, handler });
    return this;
  }

  navigate(path) {
    window.history.pushState({}, "", path);
    this._handleRouteChange(path);
  }

  start() {
    window.addEventListener("popstate", (e) => {
      this._handleRouteChange(window.location.pathname);
    });
  }
}
```

### Route Definition

```javascript
router.register("/", () => new DashboardController({}));
router.register("/models", () => new ModelsController({}));
router.register("/monitoring", () => new MonitoringController({}));
router.register("/configuration", () => new ConfigurationController({}));
router.register("/settings", () => new SettingsController({}));
router.register("/logs", () => new LogsController({}));
```

## Server Architecture

### Request Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Socket.IO Server                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Connection Handler                  │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                                │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐          │
│  │  Models   │   │  Metrics  │   │   Logs    │          │
│  │ Handlers │   │ Handlers │   │ Handlers │          │
│  └─────┬─────┘   └─────┬─────┘   └─────┬─────┘          │
│        │               │               │                 │
│        └───────────────┴───────────────┘                 │
│                          │                              │
│                          ▼                              │
│               ┌─────────────────────┐                  │
│               │    Database        │                  │
│               │  (better-sqlite3)  │                  │
│               └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Event Handler Pattern

```javascript
function setupEventHandlers(io, db) {
  io.on("connection", (socket) => {
    // Handle request
    socket.on("models:list", async (request) => {
      const requestId = request?.requestId || generateRequestId();
      try {
        const models = db.getModels();
        socket.emit("models:list:result", {
          type: "response",
          event: "models:list",
          success: true,
          data: { models },
          requestId,
          timestamp: Date.now(),
        });
      } catch (error) {
        socket.emit("models:list:result", {
          type: "response",
          event: "models:list",
          success: false,
          error: { code: "LIST_MODELS_FAILED", message: error.message },
          requestId,
          timestamp: Date.now(),
        });
      }
    });
  });
}
```

### Metrics Collection

```javascript
function startMetricsCollection(io, db) {
  setInterval(async () => {
    const metrics = {
      cpu_usage: getCpuUsage(),
      memory_usage: getMemoryUsage(),
      disk_usage: getDiskUsage(),
      uptime: process.uptime(),
    };

    db.saveMetrics(metrics);

    io.emit("metrics:update", {
      type: "broadcast",
      event: "metrics:update",
      data: { metrics },
      timestamp: Date.now(),
    });
  }, 10000); // Every 10 seconds
}
```

## Database Schema

### SQLite Database

The application uses SQLite via `better-sqlite3` for persistence:

```
data/
└── llama-dashboard.db
    ├── models          # Model configurations
    ├── metrics        # Historical metrics
    ├── logs           # Application logs
    ├── server_config  # Server configuration
    └── metadata       # Arbitrary key-value storage
```

### Modular Database Architecture (January 2026)

The database layer has been refactored into modular components following the **Repository Pattern**:

```
server/db/
├── index.js              # Main DB orchestrator (186 lines)
├── db-base.js            # Base class initialization (45 lines)
├── schema.js             # Table definitions, indexes, migrations (176 lines)
├── model-validator.js    # GGUF file validation utilities (90 lines)
├── models-repository.js  # Models CRUD (168 lines)
├── metrics-repository.js # Metrics CRUD + pruning (81 lines)
├── logs-repository.js    # Logs CRUD (43 lines)
├── config-repository.js  # Configuration management (53 lines)
└── metadata-repository.js # Key-value metadata storage (42 lines)
```

#### Benefits

| Feature                   | Before (Monolithic) | After (Modular)                          |
| ------------------------- | ------------------- | ---------------------------------------- |
| **File Size**             | 532 lines (1 file)  | 884 lines (9 files, all <200 lines)      |
| **Single Responsibility** | Mixed concerns      | Each module has one role                 |
| **Testing**               | All tests coupled   | Repositories can be tested independently |
| **Maintenance**           | Change affects file | Changes scoped to module                 |

#### Usage

```javascript
import DB from "./server/db/index.js";

const db = new DB();

// Access repositories directly
const models = db.models.getAll();
const latestMetrics = db.metrics.getLatest();

// Or use delegated methods
const models = db.getModels();
db.saveMetrics({ cpu_usage: 50 });
```

#### Repository API

Each repository follows a consistent pattern:

```javascript
// Models Repository
db.models.getAll()              // Get all models
db.models.getById(id)           // Get single model
db.models.save(model)           // Insert/update model
db.models.update(id, updates)   // Partial update
db.models.delete(id)            // Delete model
db.models.cleanupMissingFiles() // Remove invalid entries

// Metrics Repository
db.metrics.save(metrics)              // Insert metrics
db.metrics.getHistory(limit)          // Get historical data
db.metrics.getLatest()                // Get most recent
db.metrics.prune(maxRecords)          // Remove old records

// Logs Repository
db.logs.getAll(limit)           // Get logs
db.logs.add(level, msg, source) // Add entry
db.logs.clear()                 // Clear all logs

// Config Repository
db.config.get()    // Get with defaults
db.config.save(c)  // Save config

// Metadata Repository
db.meta.get(key, default)  // Get value
db.meta.set(key, value)    // Set value
```

## Performance Considerations

### Frontend Optimizations

1. **Component Patching**: DOM diffing algorithm updates only changed elements
2. **Event Delegation**: Events bound at container level, not individual elements
3. **State Subscriptions**: Only affected components re-render

### Backend Optimizations

1. **Metrics Interval**: 10-second collection interval balances freshness and performance
2. **Log Queue**: Maximum 500 entries prevents memory bloat
3. **Connection Recovery**: 2-minute window allows reconnection after network issues

### Socket.IO Tuning

```javascript
const io = new Server(server, {
  path: "/llamaproxws",
  pingTimeout: 60000, // 60s ping timeout
  pingInterval: 25000, // 25s ping interval
  maxHttpBufferSize: 1e8, // 100MB max message
  transports: ["websocket"], // WebSocket only
});
```

## Performance Optimizations (January 2026)

The application has been simplified to remove redundant workflows and improve performance:

### Simplifications Applied

| Category     | Change                                                           | Impact                            |
| ------------ | ---------------------------------------------------------------- | --------------------------------- |
| **Backend**  | Removed deprecated `models:start` and `models:stop` handlers     | -37 lines, cleaner API            |
| **Backend**  | Consolidated `llama:status` and `models:router:status` endpoints | Single source of truth            |
| **Frontend** | Removed unused components (`ModelTableRow`, `ModelDetailsPanel`) | -209 lines dead code              |
| **Frontend** | Reduced debug logging by 94% in StateManager                     | Faster execution, cleaner console |
| **Frontend** | Removed queue logic from StateManager                            | Simplified request flow           |
| **Settings** | Fixed direct DOM reading - now uses component state              | Better state management           |
| **Utils**    | Removed duplicate `formatFileSize` and unused `formatCurrency`   | -14 lines                         |
| **DB**       | Removed duplicate `updateConfig` method                          | No-op cleanup                     |

### Lines of Code Removed

```
Backend handlers.js:    ~60 lines removed
Frontend components:    ~209 lines removed
Frontend state.js:      ~75 lines removed (logging + queue)
Frontend settings.js:   ~35 lines removed (logging)
Utils format.js:        ~14 lines removed
Server db.js:           ~6 lines removed
────────────────────────────────────────
Total:                  ~400 lines removed
```

### API Changes

| Old Endpoint                | New Endpoint    | Notes           |
| --------------------------- | --------------- | --------------- |
| `models:start` (deprecated) | `models:load`   | Forward removed |
| `models:stop` (deprecated)  | `models:unload` | Forward removed |
| `models:router:status`      | `llama:status`  | Consolidated    |

## Security Considerations

1. **No Authentication**: Application is designed for local/network use only
2. **CORS Open**: `origin: '*'` allows any origin
3. **No Input Validation**: Minimal validation in demo implementation
4. **No Rate Limiting**: Could be added for production

For production deployment, consider:

- Adding authentication middleware
- Implementing rate limiting
- Adding input validation
- Using CORS restrictions

## Extensibility

### Adding New Features

1. **New Page**: Create controller in `public/js/pages/`, register route
2. **New API Event**: Add handler in `server.js`
3. **New Database Table**: Add to `server/db/schema.js`, create new repository

### Adding a New Repository

1. Create `server/db/<name>-repository.js`:

```javascript
export class NameRepository {
  constructor(db) {
    this.db = db;
  }

  getAll() {
    return this.db.prepare("SELECT * FROM table_name").all();
  }

  save(data) {
    // ...
  }
}
```

2. Import and instantiate in `server/db/index.js`:

```javascript
import { NameRepository } from "./name-repository.js";

class DB {
  constructor() {
    this.db = new Database(dbPath);
    this.name = new NameRepository(this.db);
    // ...
  }
}
```

3. Export from `server/db/index.js`:

```javascript
export { DB, NameRepository };
```

### Database Migration

```javascript
class Database {
  // Check current version
  getVersion() {
    return this.db.prepare("PRAGMA user_version").get()?.version || 0;
  }

  migrate() {
    const current = this.getVersion();
    if (current < 1) {
      // Run migration to version 1
      this.db.exec("ALTER TABLE models ADD COLUMN new_field TEXT");
      this.db.pragma("user_version = 1");
    }
  }
}
```
