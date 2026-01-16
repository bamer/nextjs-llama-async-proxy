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

- `willMount()` - Before component is added to DOM
- `didMount()` - After component is added to DOM
- `willDestroy()` - Before component is removed from DOM
- `didDestroy()` - After component is removed from DOM

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

## Key Components

### Frontend Structure

```
public/js/
├── core/
│   ├── component.js      # Base Component class
│   ├── router.js         # History API router
│   ├── state.js          # Event-driven state manager
│   └── component-h.js    # Element factory
├── services/
│   └── socket.js         # Socket.IO client
├── pages/
│   ├── dashboard/        # Dashboard controller
│   ├── models/           # Models page controller
│   ├── monitoring/       # Monitoring page controller
│   ├── logs/             # Logs page controller
│   ├── configuration/    # Configuration page
│   └── settings/         # Settings page
└── components/
    ├── layout/           # Layout components
    ├── dashboard/        # Dashboard widgets
    ├── models/           # Model components
    ├── presets/          # Preset components
    └── llama-server/     # Llama server components
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
| `llama-router-card.js` | 250 | Router status and control |
| `llama-server-config.js` | 50 | Server configuration |

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
| `config:get` | Get configuration |
| `config:update` | Update configuration |

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
