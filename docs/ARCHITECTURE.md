# Architecture Documentation

## Overview

The Llama Async Proxy Dashboard is a real-time web interface for managing llama.cpp servers running in router mode. The application uses a clean, event-driven architecture with Vanilla JavaScript on the frontend and Node.js on the backend.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Vanilla JavaScript                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ Component │  │  Router  │  │    StateManager  │   │   │
│  │  │   Base    │  │          │  │                  │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  │        │              │                │              │   │
│  │  ┌─────┴──────────────┴────────────────┴──────────┐  │   │
│  │  │           Socket.IO Service                     │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                     Socket.IO / WebSocket                    │
│                            │                                 │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                      Node.js Server                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Express Server                     │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │              Socket.IO Handler                  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                          │                             │   │
│  │  ┌───────────┬───────────┴───────────┬────────────┐  │   │
│  │  │ Llama     │  Models   │  Presets  │  Config   │  │   │
│  │  │ Router    │  Handler  │  Handler  │  Handler  │  │   │
│  │  └───────────┴───────────┴───────────┴────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│              ┌───────────┴───────────┐                       │
│              │     SQLite DB         │                       │
│              │  (better-sqlite3)     │                       │
│              └───────────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
                             │
                             │ (External Process)
              ┌──────────────┴──────────────┐
              │      llama.cpp Server       │
              │      (Router Mode)          │
              └─────────────────────────────┘
```

## Recent Improvements and Bug Fixes (January 2026)

This section summarizes key architectural improvements and bug fixes implemented to enhance stability, maintainability, and correctness.

### Frontend Component Refactoring

The main `layout.js` component was refactored to adhere to the "200 lines per file" and "single responsibility" rules.

**Modular Layout Structure:**

| File | Purpose |
|------|---------|
| `layout.js` | Layout orchestrator |
| `header.js` | Top navigation header |
| `sidebar.js` | Navigation sidebar |
| `main-content.js` | Main content area wrapper |

**Component Lifecycle:**

The base `Component` class includes comprehensive lifecycle hooks:

- `constructor(props)` - Initialize component
- `render()` - Return virtual DOM element
- `bindEvents()` - Set up event listeners
- `onMount()` - Called when added to DOM (before children mounted)
- `didMount()` - Called after component and all children mounted (NEW)
- `destroy()` - Cleanup when component is removed

**Deferred Child Mounting:**

To ensure proper initialization order, child components are queued during render and mounted in parent's `onMount()`:

```javascript
class ParentComponent extends Component {
  onMount() {
    // Mount children FIRST - they need parent ready
    this._mountChildren();

    // THEN set up parent subscriptions
    // State changes will now correctly notify children
    stateManager.subscribe("data", this._onDataChange.bind(this));
  }
}
```

**DOM Helper Improvements:**

- `Component.prototype.$` - Enhanced to query root element itself if it matches
- `Component.prototype._htmlToElement` - Stricter validation, throws on invalid content
- `Component.prototype.on` - Correctly resolves string method names to component methods

**Component.h() Factory:**

Filters out `null`, `undefined`, or `false` children earlier in rendering. Special handling for `select` and `textarea` elements.

### Backend Stability Improvements

**Dynamic Socket.IO Loading:**

`public/js/services/socket.js` dynamically loads the Socket.IO client script if `window.io` is not initially available.

**File Logger:**

Fixed `readLogFile` method to use `this.logsDir` instead of global `LOGS_DIR`. 38 file logger tests now passing.

**Handler Registration:**

`registerLlamaHandlers` is registered globally (not per-socket), improving consistency across connections.

### Component Lifecycle Refactoring (January 2026)

The component system was enhanced to properly handle nested component mounting order and state synchronization when navigating between pages.

#### Child Component Mounting Order

**Problem:** Child components' `onMount()` was called BEFORE the parent was fully initialized, causing subscriptions to be set up before data was synced from stateManager.

**Solution:** Implemented a deferred mounting system:

| File | Purpose |
|------|---------|
| `component-base.js` | Added `_pendingChildMounts` queue and `_mountChildren()` method |
| `component-h.js` | Modified to queue child `onMount()` calls instead of calling immediately |
| `page.js` (dashboard) | Calls `_mountChildren()` FIRST in `onMount()`, then sets up subscriptions |

**Mounting Sequence (FIXED):**

```
1. Parent.render() creates child component instances
2. component-h.js queues children in _pendingChildMounts
3. Parent.onMount() is called
4. Parent calls this._mountChildren() FIRST
5. Children.onMount() runs (parent subscriptions already set up)
6. State changes trigger child subscriptions correctly
```

#### didMount() Lifecycle Method

Added a new `didMount()` lifecycle hook that runs AFTER the component and all children are mounted:

```javascript
// Base Component class
didMount() {}

// DashboardController
didMount() {
  if (this.comp && this.comp.didMount) {
    this.comp.didMount();
  }
}

// DashboardPage
didMount() {
  this._syncStateToUI();  // Sync cached state when returning to page
}
```

**Router Integration:** The router calls `controller.didMount()` after navigation completes.

#### State Sync on Page Return

Added `_syncStateToUI()` method to handle cached state when returning to a page:

```javascript
_syncStateToUI() {
  const metrics = stateManager.get("metrics");
  const presets = stateManager.get("presets");
  // ... sync all state data to UI

  // This handles the case where:
  // 1. Data is already in stateManager (from previous visit)
  // 2. But subscriptions didn't trigger (no "change" event)
}
```

**Why This Matters:**
- When navigating from Dashboard → Models → Dashboard
- Presets are already in `stateManager.get("presets")`
- But the state subscription callback won't fire (same reference)
- `_syncStateToUI()` ensures UI updates with cached data

#### Preset Selector Bug Fix

Fixed a critical bug where presets didn't load when navigating back to Dashboard:

**Root Cause:** Wrong CSS class selector
- Code used: `.llama-router-card`
- Actual class: `.llama-router-status-card`

**Files Modified:**
- `public/js/pages/dashboard/page.js` - Fixed selector and added debug logging

### Metrics Scraping Improvements

Added missing Prometheus metric mappings in `metrics-scraper.js`:
- `prompt_tokens_total`
- `tokens_predicted_total`
- `n_busy_slots_per_decode`
- `prompt_seconds_total`
- `tokens_predicted_seconds_total`
- `n_tokens_max`

### Settings Page Refactoring (January 2026)

The settings page was refactored to unify scattered router configuration parameters into a clean, streamlined schema.

#### Problem Identified

The settings page had confusing parameter placement across three separate components:
- **RouterConfig**: maxModelsLoaded, parallelSlots, ctx_size, gpuLayers
- **ServerPathsForm**: baseModelsPath, serverPath, host, port, autoStartOnLaunch, metricsEnabled
- **ModelDefaultsForm**: threads, batch_size, temperature, repeatPenalty

Parameters were split between `server_config` and `user_settings` tables with no clear organization.

#### Solution: Unified Schema

**New Database Schema:**

| Table | Key | Type | Description |
|-------|-----|------|-------------|
| `router_config` | `config` | TEXT | JSON object containing all router settings |
| `logging_config` | `config` | TEXT | JSON object containing all logging settings |

**router_config fields (stored in single JSON config):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `modelsPath` | TEXT | `/path/to/models` | Directory containing GGUF model files |
| `serverPath` | TEXT | `/path/to/llama-server` | Path to llama-server binary |
| `host` | TEXT | `0.0.0.0` | Listen interface |
| `port` | INTEGER | `8080` | HTTP listen port |
| `maxModelsLoaded` | INTEGER | `4` | Maximum models to keep in memory |
| `parallelSlots` | INTEGER | `1` | Number of parallel processing slots |
| `ctxSize` | INTEGER | `4096` | Token context window size |
| `gpuLayers` | INTEGER | `0` | Model layers to offload to GPU |
| `threads` | INTEGER | `4` | CPU threads for inference |
| `batchSize` | INTEGER | `512` | Processing batch size |
| `temperature` | REAL | `0.8` | Response randomness |
| `repeatPenalty` | REAL | `1.1` | Penalize repeated tokens |

**logging_config fields (stored in single JSON config):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `logLevel` | TEXT | `info` | Log verbosity (debug, info, warning, error) |
| `maxFileSizeMb` | INTEGER | `10` | Per log file size limit |
| `maxLogFiles` | INTEGER | `7` | Number of days to retain |
| `fileLogging` | BOOLEAN | `true` | Write to logs/app-YYYYMMDD.log |
| `databaseLogging` | BOOLEAN | `true` | Store in SQLite |
| `consoleLogging` | BOOLEAN | `true` | Output to server stdout |

#### New Frontend Components

| File | Purpose |
|------|---------|
| `llama-router-config.js` | Unified router configuration form (replaces 3 components) |
| `logging-config.js` | Logging configuration form |
| `save-section.js` | Save configuration section |

#### API Methods

| Method | Description |
|--------|-------------|
| `getRouterConfig()` | Fetch router configuration |
| `updateRouterConfig(config)` | Update router configuration |
| `resetRouterConfig()` | Reset to defaults |
| `getLoggingConfig()` | Fetch logging configuration |
| `updateLoggingConfig(config)` | Update logging configuration |
| `resetLoggingConfig()` | Reset to defaults |

#### Migration Script

Migration `004_unify_router_config.js` handles the transition from the old schema to the new unified schema, preserving backward compatibility.

## Key Components

### Frontend Structure

```
public/js/
├── core/
│   ├── component-base.js     # Base Component class with lifecycle
│   ├── component-h.js        # Virtual DOM element creation
│   ├── router.js             # History API router with didMount support
│   ├── state.js              # Event-driven state manager
│   └── state/
│       ├── state-core.js     # Core get/set/subscribe/notify
│       ├── state-api.js      # API request methods
│       ├── state-models.js   # Model operations
│       ├── state-socket.js   # Socket.IO wrapper
│       └── state-requests.js # Request queuing
├── services/
│   └── socket.js             # Socket.IO client
├── pages/
│   ├── dashboard/
│   │   ├── page.js           # Dashboard page (with _syncStateToUI)
│   │   ├── dashboard-controller.js # Controller (with didMount)
│   │   └── components/       # Dashboard-specific components
│   ├── models/               # Models page controller
│   ├── monitoring/           # Monitoring page controller
│   ├── logs/                 # Logs page controller
│   ├── configuration/        # Configuration page
│   └── settings/             # Settings page
└── components/
    ├── layout/               # Layout components
    ├── dashboard/            # Dashboard widgets
    ├── models/               # Model components
    ├── presets/              # Preset components
    └── llama-router-card.js  # Router status and control
```

### Server Handlers

```
server/handlers/
├── llama.js              # Main llama handler orchestration
├── llama-router/
│   ├── index.js          # Router handler registration
│   ├── start.js          # Router startup logic
│   ├── stop.js           # Router shutdown logic
│   ├── status.js         # Router status queries
│   ├── process.js        # Process management
│   ├── process-manager.js# Process lifecycle
│   ├── metrics-scraper.js# Metrics collection
│   └── api.js            # Router API endpoints
├── models/
│   ├── crud.js           # Model CRUD operations
│   └── scan.js           # Model discovery
├── presets/
│   ├── handlers.js       # Preset handlers
│   └── utils.js          # Preset utilities
├── config.js             # Configuration handler
├── logs.js               # Log management
├── metrics.js            # Metrics handler
├── file-logger.js        # File-based logging
└── logger.js             # Logger utilities
```

### Component File Size Summary

**Dashboard Components:**

| File | Approx. Lines | Purpose |
|------|---------------|---------|
| `chart-manager.js` | 100 | Chart orchestration |
| `chart-usage.js` | 80 | CPU/Memory charts |
| `chart-memory.js` | 80 | Memory usage charts |
| `stats-grid.js` | 100 | Metrics grid display |
| `system-health.js` | 80 | Health status indicator |
| `quick-actions.js` | 50 | Quick action buttons |

**Llama Router Components:**

| File | Approx. Lines | Purpose |
|------|---------------|---------|
| `llama-router-card.js` | 340 | Router status and control with metrics scraping |
| `llama-server-config.js` | 50 | Server configuration |

**Settings Components:**

| File | Approx. Lines | Purpose |
|------|---------------|---------|
| `llama-router-config.js` | 200 | Unified router configuration form |
| `logging-config.js` | 120 | Logging configuration form |
| `save-section.js` | 80 | Save configuration section |
| `config-export-import.js` | 100 | Export/import configuration |

**Preset Components:**

| File | Approx. Lines | Purpose |
|------|---------------|---------|
| `parameters.js` | 350 | Parameters orchestration |
| `parameter-form.js` | 350 | Parameter form handling |
| `parameter-input.js` | 300 | Input field components |
| `parameter-section.js` | 150 | Section organization |
| `llama-params.js` | 250 | Llama-specific parameters |

**Utility Components:**

| File | Approx. Lines | Purpose |
|------|---------------|---------|
| `command-palette.js` | 200 | Command palette UI |
| `table.js` | 180 | Table component |
| `modal.js` | 100 | Modal dialog |
| `toast.js` | 120 | Toast notifications |
| `badge.js` | 70 | Status badges |
| `spinner.js` | 40 | Loading spinner |

## Socket.IO Communication

### Request-Response Pattern

```
Client                          Server
  │                               │
  │─── models:list ──────────────>│
  │                               │─── Process request
  │<──── models:list:result ──────│
```

### Broadcast Pattern

```
Server ───> All Clients
   │
   ├─── models:status ──────────────>
   ├─── metrics:update ─────────────>
   └─── logs:entry ─────────────────>
```

### Event Reference

**Client → Server:**

| Event | Description |
|-------|-------------|
| `models:list` | List all models |
| `models:load` | Load a model |
| `models:unload` | Unload a model |
| `presets:list` | List all presets |
| `presets:save` | Save a preset |
| `llama:status` | Get router status |
| `llama:start` | Start router |
| `llama:stop` | Stop router |
| `routerConfig:get` | Get router configuration |
| `routerConfig:update` | Update router configuration |
| `routerConfig:reset` | Reset router configuration |
| `loggingConfig:get` | Get logging configuration |
| `loggingConfig:update` | Update logging configuration |
| `loggingConfig:reset` | Reset logging configuration |

**Server → Client:**

| Event | Description |
|-------|-------------|
| `models:status` | Model status changed |
| `models:loaded` | Model loaded |
| `models:unloaded` | Model unloaded |
| `metrics:update` | Metrics broadcast (10s) |
| `logs:entry` | New log entry |
| `llama:status` | Router status update |
| `llama:started` | Router started |
| `llama:stopped` | Router stopped |

## Database Schema

### Models Table

```sql
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'llama',
  status TEXT DEFAULT 'idle',
  parameters TEXT DEFAULT '{}',
  model_path TEXT,
  ctx_size INTEGER DEFAULT 2048,
  batch_size INTEGER DEFAULT 512,
  threads INTEGER DEFAULT 4,
  created_at INTEGER,
  updated_at INTEGER
);
```

### Router Config Table (Unified Schema)

```sql
CREATE TABLE router_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config TEXT DEFAULT '{"modelsPath":"/path/to/models","serverPath":"/path/to/llama-server","host":"0.0.0.0","port":8080,"maxModelsLoaded":4,"parallelSlots":1,"ctxSize":4096,"gpuLayers":0,"threads":4,"batchSize":512,"temperature":0.8,"repeatPenalty":1.1}'
);
```

### Logging Config Table

```sql
CREATE TABLE logging_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config TEXT DEFAULT '{"logLevel":"info","maxFileSizeMb":10,"maxLogFiles":7,"fileLogging":true,"databaseLogging":true,"consoleLogging":true}'
);
```

### Metrics Table

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cpu_usage REAL,
  memory_usage REAL,
  disk_usage REAL,
  gpu_usage REAL,
  gpu_temperature REAL,
  gpu_memory_used REAL,
  gpu_memory_total REAL,
  active_models INTEGER,
  uptime REAL,
  timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### Logs Table

```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  context TEXT,
  timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);
```

## Performance Characteristics

| Operation | Typical Time | Notes |
|-----------|--------------|-------|
| Server startup | <1 second | No build step required |
| Model discovery | <100ms | Directory scan |
| Metrics collection | <50ms | Every 10 seconds |
| Socket broadcast | <10ms | To all connected clients |

## Error Handling Strategy

1. **Try-Catch Wrapping**: All async operations wrapped in try-catch
2. **User Feedback**: Toast notifications for user-facing errors
3. **Logging**: All errors logged with context
4. **Graceful Degradation**: UI handles missing data gracefully
5. **Error Boundaries**: Components catch and display errors locally

## Code Quality Standards

### Golden Rules

1. **Keep files under 200 lines** - Split large files into smaller modules
2. **Single responsibility** - Each component/class should do one thing
3. **No memory leaks** - Always clean up subscriptions and event listeners
4. **Graceful degradation** - Handle missing data gracefully
5. **User feedback** - Show notifications for user actions
6. **Error boundaries** - Catch and display errors to users

### Testing Requirements

- Minimum 80% coverage on all metrics
- All new features must include tests
- Tests must pass before merging
- Run `pnpm test:coverage` for full report

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes/Components | PascalCase | `DashboardController` |
| Functions/Variables | camelCase | `getModels()` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_CONFIG` |
| Private members | underscore prefix | `_init()` |
| File names | Match export | `layout.js` exports `Layout` |

## Related Documentation

- [README.md](../README.md) - Project overview
- [API.md](API.md) - Socket.IO API reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [COVERAGE_GUIDE.md](COVERAGE_GUIDE.md) - Test coverage procedures
