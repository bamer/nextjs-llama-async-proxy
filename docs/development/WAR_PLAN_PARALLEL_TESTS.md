# WAR PLAN: Parallel Test Coverage Initiative

**Generated:** 2026-01-07  
**Objective:** Achieve 100% test coverage by writing all missing tests in parallel  
**Strategy:** Specialized agent teams working simultaneously on different modules

---

## Executive Summary

| Metric               | Current State          | Target State |
| -------------------- | ---------------------- | ------------ |
| Tests Passing        | 467 ✅                 | 467+         |
| Source File Coverage | 0% ❌                  | 100%         |
| Files with Coverage  | 3 (out of 25+)         | 25+          |
| Test Strategy        | Inline implementations | Real imports |

---

## Phase 0: Infrastructure Fix (P0)

### Task: Fix Jest Configuration

**File:** `jest.config.js`

**Problem:** Tests use inline implementations instead of importing source files, resulting in 0% coverage.

**Solution:** Refactor all tests to import actual source files, then update Jest config to collect coverage from source files.

**Execution Order:**

1. Read current jest.config.js
2. Update `collectCoverageFrom` to target source files
3. Refactor `format.test.js` to import from `public/js/utils/format.js`
4. Refactor `validation.test.js` to import from actual validation module
5. Refactor `db.test.js` to import from `server/db/`
6. Refactor `metadata.test.js` to import from `server/gguf-parser.js`

**Agent Assignment:** `tester-agent` (infrastructure specialist)

---

## Phase 1: Utility Functions (P0)

### Task 1.1: Test `public/js/utils/format.js`

**File:** `public/js/utils/format.js`  
**Current Coverage:** 0% (0/35 statements, 0/20 branches)  
**Functions to Test:** 6

| Function                         | Branches to Cover | Edge Cases                                               |
| -------------------------------- | ----------------- | -------------------------------------------------------- |
| `formatBytes(bytes)`             | 7                 | 0, negative, KB, MB, GB, TB, PB boundary                 |
| `formatPercent(value, decimals)` | 5                 | 0, 100, decimals=0, decimals=20, null                    |
| `formatTimestamp(timestamp)`     | 3                 | Valid, zero, negative                                    |
| `formatRelativeTime(timestamp)`  | 8                 | Future, past, zero, seconds, minutes, hours, days, years |
| `formatUptime(seconds)`          | 4                 | Seconds, minutes, hours, days                            |
| `formatFileSize(bytes)`          | 5                 | Same as formatBytes, special handling                    |

**Test Count Estimate:** 25 tests  
**Agent Assignment:** `tester-agent` (utilities specialist)

### Task 1.2: Test `public/js/utils/dashboard-utils.js`

**File:** `public/js/utils/dashboard-utils.js`  
**Current Coverage:** 0% (0/34 statements, 0/36 branches)  
**Functions to Test:** 8

| Function                                | Branches to Cover | Edge Cases                            |
| --------------------------------------- | ----------------- | ------------------------------------- |
| `_fmtUptime(seconds)`                   | 4                 | All time units                        |
| `_calculateStats(metrics)`              | 12                | Null, empty, single, multiple entries |
| `_calculateStatsForType(metrics, type)` | 8                 | Each metric type                      |
| `_getHealthStatus(metrics)`             | 6                 | Critical, warning, healthy, null      |
| `_generateId()`                         | 2                 | Uniqueness check                      |
| `formatNumber(value)`                   | 2                 | Large numbers                         |
| `deepClone(obj)`                        | 4                 | Nested objects, null, primitives      |
| `isEmpty(obj)`                          | 3                 | Empty object, null, with keys         |

**Test Count Estimate:** 40 tests  
**Agent Assignment:** `tester-agent` (utilities specialist)

---

## Phase 2: Server Entry Point (P0)

### Task 2.1: Test `server.js`

**File:** `server.js`  
**Current Coverage:** 0% (0/76 statements, 0/29 branches)  
**Functions to Test:** 13

| Function            | Branches to Cover | Complexity              |
| ------------------- | ----------------- | ----------------------- |
| `startMetrics(io)`  | 8                 | Metric collection loop  |
| `setupShutdown(io)` | 6                 | SIGTERM/SIGINT handlers |
| `main()`            | 10                | Server initialization   |
| Socket handlers (7) | 5                 | Each event handler      |

**Key Areas to Test:**

1. Server initialization and port binding
2. Socket.IO connection handling
3. Model scanning functionality
4. Metrics collection and broadcasting
5. Configuration loading
6. Shutdown graceful handling
7. Error handling paths

**Test Count Estimate:** 35 tests  
**Mock Dependencies:**

- Mock `express` server
- Mock `socket.io` server
- Mock `better-sqlite3` database
- Mock `systeminformation` calls
- Mock file system operations

**Agent Assignment:** `tester-agent` (backend specialist)

---

## Phase 3: Server Handlers (P1)

### Task 3.1: Test `server/handlers/models/scan.js`

**File:** `server/handlers/models/scan.js`  
**Complexity:** Medium (154 lines)  
**Functions to Test:** 4

| Function                   | Purpose             |
| -------------------------- | ------------------- |
| `handleModelScan(req)`     | Main scan handler   |
| `discoverModelsInDir(dir)` | Directory traversal |
| `validateModelFile(path)`  | File validation     |
| `parseModelMetadata(path)` | GGUF parsing        |

**Test Count Estimate:** 30 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 3.2: Test `server/handlers/models/crud.js`

**File:** `server/handlers/models/crud.js`  
**Complexity:** Medium  
**Functions to Test:** 6

| Function                 | Purpose               |
| ------------------------ | --------------------- |
| `handleGetModels(req)`   | List all models       |
| `handleGetModel(req)`    | Get single model      |
| `handleSaveModel(req)`   | Save new model        |
| `handleUpdateModel(req)` | Update model          |
| `handleDeleteModel(req)` | Delete model          |
| `handleLoadModel(req)`   | Load model via router |

**Test Count Estimate:** 30 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 3.3: Test `server/handlers/models/router-ops.js`

**File:** `server/handlers/models/router-ops.js`  
**Complexity:** Medium  
**Functions to Test:** 5

| Function                  | Purpose            |
| ------------------------- | ------------------ |
| `handleRouterStatus(req)` | Get router status  |
| `handleRouterLoad(req)`   | Load model         |
| `handleRouterUnload(req)` | Unload model       |
| `handleRouterList(req)`   | List loaded models |
| `handleRouterConfig(req)` | Configure router   |

**Test Count Estimate:** 25 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 3.4: Test `server/handlers/connection.js`

**File:** `server/handlers/connection.js`  
**Complexity:** Low  
**Functions to Test:** 3

| Function                   | Purpose             |
| -------------------------- | ------------------- |
| `handleConnection(socket)` | New connection      |
| `handleDisconnect(reason)` | Disconnect handling |
| `handlePing()`             | Keepalive check     |

**Test Count Estimate:** 15 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 3.5: Test `server/handlers/config.js`

**File:** `server/handlers/config.js`  
**Complexity:** Low  
**Functions to Test:** 4

| Function                     | Purpose           |
| ---------------------------- | ----------------- |
| `handleGetConfig(req)`       | Get config        |
| `handleSaveConfig(req)`      | Save config       |
| `handleResetConfig(req)`     | Reset to defaults |
| `handleConfigUpdate(config)` | Handle updates    |

**Test Count Estimate:** 20 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 3.6: Test `server/handlers/llama.js`

**File:** `server/handlers/llama.js`  
**Complexity:** Medium  
**Functions to Test:** 5

| Function                  | Purpose              |
| ------------------------- | -------------------- |
| `handleLlamaStart(req)`   | Start llama-server   |
| `handleLlamaStop(req)`    | Stop llama-server    |
| `handleLlamaRestart(req)` | Restart llama-server |
| `handleLlamaStatus(req)`  | Get llama status     |
| `handleLlamaLogs(req)`    | Get llama logs       |

**Test Count Estimate:** 25 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 3.7: Test `server/handlers/logs.js`

**File:** `server/handlers/logs.js`  
**Complexity:** Low  
**Functions to Test:** 4

| Function                | Purpose       |
| ----------------------- | ------------- |
| `handleGetLogs(req)`    | Get logs      |
| `handleAddLog(req)`     | Add log entry |
| `handleClearLogs(req)`  | Clear logs    |
| `handleExportLogs(req)` | Export logs   |

**Test Count Estimate:** 20 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 3.8: Test `server/handlers/metrics.js`

**File:** `server/handlers/metrics.js`  
**Complexity:** Low  
**Functions to Test:** 4

| Function                       | Purpose             |
| ------------------------------ | ------------------- |
| `handleGetMetrics(req)`        | Get metrics         |
| `handleGetMetricsHistory(req)` | Get metrics history |
| `handleExportMetrics(req)`     | Export metrics      |
| `handleMetricsStream(req)`     | Stream metrics      |

**Test Count Estimate:** 20 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 3.9: Test `server/handlers/response.js`

**File:** `server/handlers/response.js`  
**Complexity:** Low  
**Functions to Test:** 3

| Function               | Purpose                          |
| ---------------------- | -------------------------------- |
| `success(data)`        | Create success response          |
| `error(message, code)` | Create error response            |
| `wrap(handler)`        | Wrap handler with error catching |

**Test Count Estimate:** 15 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 3.10: Test `server/handlers/logger.js`

**File:** `server/handlers/logger.js`  
**Complexity:** Low  
**Functions to Test:** 3

| Function                    | Purpose     |
| --------------------------- | ----------- |
| `log(level, message, data)` | Log entry   |
| `info(message, data)`       | Info level  |
| `error(message, data)`      | Error level |

**Test Count Estimate:** 15 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

---

## Phase 4: Llama Router Handlers (P1)

### Task 4.1: Test `server/handlers/llama-router/start.js`

**File:** `server/handlers/llama-router/start.js`  
**Complexity:** Medium  
**Functions to Test:** 3

| Function                  | Purpose              |
| ------------------------- | -------------------- |
| `startRouter(config)`     | Start router process |
| `waitForRouterReady()`    | Wait for ready       |
| `handleStartError(error)` | Error handling       |

**Test Count Estimate:** 20 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 4.2: Test `server/handlers/llama-router/stop.js`

**File:** `server/handlers/llama-router/stop.js`  
**Complexity:** Low  
**Functions to Test:** 2

| Function                 | Purpose        |
| ------------------------ | -------------- |
| `stopRouter()`           | Stop router    |
| `handleStopError(error)` | Error handling |

**Test Count Estimate:** 10 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 4.3: Test `server/handlers/llama-router/status.js`

**File:** `server/handlers/llama-router/status.js`  
**Complexity:** Low  
**Functions to Test:** 3

| Function             | Purpose       |
| -------------------- | ------------- |
| `getRouterStatus()`  | Get status    |
| `isRouterRunning()`  | Check running |
| `getRouterMetrics()` | Get metrics   |

**Test Count Estimate:** 15 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

### Task 4.4: Test `server/handlers/llama-router/api.js`

**File:** `server/handlers/llama-router/api.js`  
**Complexity:** Medium  
**Functions to Test:** 4

| Function                  | Purpose              |
| ------------------------- | -------------------- |
| `apiLoadModel(modelId)`   | Load model via API   |
| `apiUnloadModel(modelId)` | Unload model via API |
| `apiGetModels()`          | List models via API  |
| `apiHealthCheck()`        | Health check         |

**Test Count Estimate:** 20 tests  
**Agent Assignment:** `tester-agent` (backend specialist)

---

## Phase 5: Database Repositories (P2)

### Task 5.1: Test `server/db/models-repository.js`

**File:** `server/db/models-repository.js`  
**Complexity:** Medium (169 lines)  
**Functions to Test:** 8

| Function               | Purpose        |
| ---------------------- | -------------- |
| `getAll()`             | Get all models |
| `getById(id)`          | Get by ID      |
| `getByPath(path)`      | Get by path    |
| `create(model)`        | Create model   |
| `update(id, data)`     | Update model   |
| `delete(id)`           | Delete model   |
| `count()`              | Count models   |
| `findByStatus(status)` | Find by status |

**Test Count Estimate:** 40 tests  
**Agent Assignment:** `tester-agent` (database specialist)

### Task 5.2: Test `server/db/metrics-repository.js`

**File:** `server/db/metrics-repository.js`  
**Complexity:** Low  
**Functions to Test:** 5

| Function                     | Purpose           |
| ---------------------------- | ----------------- |
| `insert(metrics)`            | Insert metrics    |
| `getLatest()`                | Get latest        |
| `getHistory(limit)`          | Get history       |
| `getByTimeRange(start, end)` | Get by time range |
| `cleanup(olderThan)`         | Cleanup old       |

**Test Count Estimate:** 25 tests  
**Agent Assignment:** `tester-agent` (database specialist)

### Task 5.3: Test `server/db/logs-repository.js`

**File:** `server/db/logs-repository.js`  
**Complexity:** Low  
**Functions to Test:** 5

| Function            | Purpose        |
| ------------------- | -------------- |
| `insert(log)`       | Insert log     |
| `getAll(limit)`     | Get all logs   |
| `getByLevel(level)` | Get by level   |
| `clear()`           | Clear logs     |
| `countByLevel()`    | Count by level |

**Test Count Estimate:** 20 tests  
**Agent Assignment:** `tester-agent` (database specialist)

### Task 5.4: Test `server/db/config-repository.js`

**File:** `server/db/config-repository.js`  
**Complexity:** Low  
**Functions to Test:** 4

| Function          | Purpose       |
| ----------------- | ------------- |
| `get(key)`        | Get config    |
| `set(key, value)` | Set config    |
| `getAll()`        | Get all       |
| `delete(key)`     | Delete config |

**Test Count Estimate:** 15 tests  
**Agent Assignment:** `tester-agent` (database specialist)

### Task 5.5: Test `server/db/metadata-repository.js`

**File:** `server/db/metadata-repository.js`  
**Complexity:** Low  
**Functions to Test:** 4

| Function          | Purpose         |
| ----------------- | --------------- |
| `get(key)`        | Get metadata    |
| `set(key, value)` | Set metadata    |
| `getAll()`        | Get all         |
| `delete(key)`     | Delete metadata |

**Test Count Estimate:** 15 tests  
**Agent Assignment:** `tester-agent` (database specialist)

---

## Phase 6: Frontend Components (P3)

### Task 6.1: Test `public/js/core/component.js`

**File:** `public/js/core/component.js`  
**Complexity:** High (230 lines)  
**Environment:** Requires DOM  
**Functions to Test:** 12

| Function               | Purpose          |
| ---------------------- | ---------------- |
| `constructor(props)`   | Initialize       |
| `render()`             | Render component |
| `setState(state)`      | Update state     |
| `update(partialState)` | Partial update   |
| `bindEvents()`         | Bind DOM events  |
| `destroy()`            | Cleanup          |
| `on(event, handler)`   | Event emitter    |
| `off(event, handler)`  | Remove handler   |
| `emit(event, data)`    | Emit event       |
| `willMount()`          | Lifecycle        |
| `didMount()`           | Lifecycle        |
| `willUnmount()`        | Lifecycle        |

**Test Count Estimate:** 50 tests  
**Environment Setup:** jest-environment-jsdom  
**Agent Assignment:** `tester-agent` (frontend specialist)

### Task 6.2: Test `public/js/core/router.js`

**File:** `public/js/core/router.js`  
**Complexity:** High (225 lines)  
**Environment:** Requires DOM + History API  
**Functions to Test:** 10

| Function                  | Purpose               |
| ------------------------- | --------------------- |
| `register(path, handler)` | Register route        |
| `navigate(path)`          | Navigate              |
| `navigate(path, options)` | Navigate with options |
| `back()`                  | Go back               |
| `forward()`               | Go forward            |
| `getPath()`               | Get current path      |
| `getParams()`             | Get params            |
| `getQuery()`              | Get query             |
| `start()`                 | Start routing         |
| `stop()`                  | Stop routing          |

**Test Count Estimate:** 45 tests  
**Environment Setup:** jest-environment-jsdom with History API mock  
**Agent Assignment:** `tester-agent` (frontend specialist)

### Task 6.3: Test `public/js/core/state.js`

**File:** `public/js/core/state.js`  
**Complexity:** Very High (406 lines)  
**Environment:** Requires Socket.IO mock  
**Functions to Test:** 15

| Function                     | Purpose          |
| ---------------------------- | ---------------- |
| `get(key)`                   | Get state        |
| `set(key, value)`            | Set state        |
| `getState()`                 | Get all state    |
| `subscribe(key, callback)`   | Subscribe        |
| `unsubscribe(key, callback)` | Unsubscribe      |
| `request(event, data)`       | Send request     |
| `connect()`                  | Connect          |
| `disconnect()`               | Disconnect       |
| `isConnected()`              | Check connection |
| `getModels()`                | Get models       |
| `startModel(id)`             | Start model      |
| `stopModel(id)`              | Stop model       |
| `updateConfig(config)`       | Update config    |
| `getLogs(filters)`           | Get logs         |
| `getMetrics(period)`         | Get metrics      |

**Test Count Estimate:** 60 tests  
**Environment Setup:** Socket.IO client mock  
**Agent Assignment:** `tester-agent` (frontend specialist)

### Task 6.4: Test `public/js/services/socket.js`

**File:** `public/js/services/socket.js`  
**Complexity:** Medium  
**Environment:** Requires Socket.IO server mock  
**Functions to Test:** 8

| Function               | Purpose          |
| ---------------------- | ---------------- |
| `connect()`            | Connect          |
| `disconnect()`         | Disconnect       |
| `on(event, callback)`  | Listen           |
| `off(event, callback)` | Remove listener  |
| `emit(event, data)`    | Send             |
| `request(event, data)` | Request-response |
| `isConnected()`        | Check status     |
| `getSocketId()`        | Get socket ID    |

**Test Count Estimate:** 35 tests  
**Environment Setup:** Socket.IO server mock  
**Agent Assignment:** `tester-agent` (frontend specialist)

---

## Phase 7: GGUF Parser (P2)

### Task 7.1: Test `server/gguf-parser.js`

**File:** `server/gguf-parser.js`  
**Complexity:** High (400 lines)  
**Functions to Test:** 8

| Function                    | Purpose              |
| --------------------------- | -------------------- |
| `parseFile(filePath)`       | Parse GGUF file      |
| `extractArchitecture(name)` | Extract model family |
| `extractParams(name)`       | Extract parameters   |
| `extractQuantization(name)` | Extract quantization |
| `getFileType(quant)`        | Get file type        |
| `parseMetadata(buffer)`     | Parse metadata       |
| `getModelInfo(filePath)`    | Get full info        |
| `isValidGGUF(buffer)`       | Validate GGUF        |

**Test Count Estimate:** 50 tests  
**Mock Dependencies:** Mock file system and GGUF buffer parsing  
**Agent Assignment:** `tester-agent` (backend specialist)

---

## Parallel Execution Strategy

### Wave 1 (Parallel - All P0 Tasks)

| Task                    | Agent                | Dependencies    |
| ----------------------- | -------------------- | --------------- |
| Fix Jest Config         | Infrastructure Agent | None            |
| Test format.js          | Utilities Agent      | Fix Jest Config |
| Test dashboard-utils.js | Utilities Agent      | Fix Jest Config |
| Test server.js          | Backend Agent        | Fix Jest Config |

### Wave 2 (Parallel - All P1 Tasks)

| Task                        | Agent         | Dependencies   |
| --------------------------- | ------------- | -------------- |
| Test models/scan.js         | Backend Agent | Test server.js |
| Test models/crud.js         | Backend Agent | Test server.js |
| Test models/router-ops.js   | Backend Agent | Test server.js |
| Test handlers/connection.js | Backend Agent | Test server.js |
| Test handlers/config.js     | Backend Agent | Test server.js |
| Test handlers/llama.js      | Backend Agent | Test server.js |
| Test handlers/logs.js       | Backend Agent | Test server.js |
| Test handlers/metrics.js    | Backend Agent | Test server.js |
| Test handlers/response.js   | Backend Agent | Test server.js |
| Test handlers/logger.js     | Backend Agent | Test server.js |
| Test llama-router/\*.js     | Backend Agent | Test server.js |

### Wave 3 (Parallel - P2 Tasks)

| Task                        | Agent          | Dependencies    |
| --------------------------- | -------------- | --------------- |
| Test gguf-parser.js         | Backend Agent  | Wave 1 complete |
| Test models-repository.js   | Database Agent | Wave 1 complete |
| Test metrics-repository.js  | Database Agent | Wave 1 complete |
| Test logs-repository.js     | Database Agent | Wave 1 complete |
| Test config-repository.js   | Database Agent | Wave 1 complete |
| Test metadata-repository.js | Database Agent | Wave 1 complete |

### Wave 4 (Sequential - P3 Tasks)

| Task              | Agent          | Dependencies            |
| ----------------- | -------------- | ----------------------- |
| Test component.js | Frontend Agent | Wave 1 + DOM setup      |
| Test router.js    | Frontend Agent | component.js tests pass |
| Test state.js     | Frontend Agent | router.js tests pass    |
| Test socket.js    | Frontend Agent | state.js tests pass     |

---

## Test Infrastructure Requirements

### Mock Objects Needed

```javascript
// server.js mocks
mockServer = {
  listen: jest.fn(),
  close: jest.fn(),
  use: jest.fn(),
};

mockIo = {
  on: jest.fn(),
  emit: jest.fn(),
  sockets: { emit: jest.fn() },
};

// Socket mocks
mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  id: "test-socket-id",
};

// Database mocks
mockDb = {
  prepare: jest.fn(),
  exec: jest.fn(),
  close: jest.fn(),
};

// File system mocks
mockFs = {
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
};
```

### Jest Environment Setup

```javascript
// jest.setup.js
import { jest } from "@jest/globals";

// Mock DOM for frontend tests
Object.defineProperty(window, "history", {
  value: { pushState: jest.fn(), replaceState: jest.fn() },
  writable: true,
});

Object.defineProperty(window, "location", {
  value: { pathname: "/", search: "" },
  writable: true,
});

// Mock WebSocket for socket.io-client
global.WebSocket = jest.fn();
```

---

## Coverage Targets by Phase

| Phase     | Files                | Target Coverage | New Tests     |
| --------- | -------------------- | --------------- | ------------- |
| Phase 0   | jest.config.js       | N/A             | 0             |
| Phase 1   | 2 utility files      | 100%            | 65            |
| Phase 2   | server.js            | 100%            | 35            |
| Phase 3   | 10 handler files     | 100%            | 185           |
| Phase 4   | 4 llama-router files | 100%            | 65            |
| Phase 5   | 5 repository files   | 100%            | 115           |
| Phase 6   | 4 frontend files     | 100%            | 190           |
| Phase 7   | gguf-parser.js       | 100%            | 50            |
| **TOTAL** | **31 files**         | **100%**        | **705 tests** |

---

## Execution Timeline

```
Week 1:
├── Day 1-2: Phase 0 (Infrastructure)
├── Day 3-4: Phase 1 (Utilities)
└── Day 5: Phase 2 (server.js)

Week 2:
├── Day 1-2: Phase 3 (Handlers)
├── Day 3: Phase 4 (Llama Router)
└── Day 4-5: Phase 5 (Repositories)

Week 3:
├── Day 1-2: Phase 6 (Frontend)
└── Day 3-4: Phase 7 (GGUF Parser)

Week 4:
├── Day 1-2: Integration tests
├── Day 3: Coverage validation
└── Day 4-5: Bug fixes and polish
```

---

## Success Criteria

### Quantitative Metrics

- [ ] 100% statement coverage on all source files
- [ ] 100% branch coverage on all source files
- [ ] 100% function coverage on all source files
- [ ] 705+ total tests (current 467 + 238 new)
- [ ] All tests pass with zero failures
- [ ] Test execution time < 60 seconds

### Qualitative Metrics

- [ ] Tests use real source file imports (no inline implementations)
- [ ] Each test has clear assertions and expectations
- [ ] Tests cover edge cases and error conditions
- [ ] Tests are isolated and can run independently
- [ ] Tests have meaningful descriptions

---

## Rollback Plan

If coverage decreases or tests fail:

1. **Revert Jest config changes** - keep inline tests as fallback
2. **Run original test suite** - verify 467 tests still pass
3. **Fix incrementally** - add one file at a time
4. **Use feature flags** - enable new tests selectively

---

## Additional Resources

### Testing Best Practices (from AGENTS.md)

> **Critical Principle**: If tests fail, the code is broken - fix the code, not the tests. Tests are written to verify correct behavior; when tests fail, it indicates a bug in the implementation.

### Test Organization

```
__tests__/
├── server/
│   ├── server.test.js        # server.js tests
│   ├── handlers/
│   │   ├── connection.test.js
│   │   ├── config.test.js
│   │   ├── models/
│   │   │   ├── scan.test.js
│   │   │   ├── crud.test.js
│   │   │   └── router-ops.test.js
│   │   └── llama-router/
│   │       ├── start.test.js
│   │       ├── stop.test.js
│   │       ├── status.test.js
│   │       └── api.test.js
│   ├── repositories/
│   │   ├── models.test.js
│   │   ├── metrics.test.js
│   │   ├── logs.test.js
│   │   ├── config.test.js
│   │   └── metadata.test.js
│   └── gguf-parser.test.js
├── frontend/
│   ├── core/
│   │   ├── component.test.js
│   │   ├── router.test.js
│   │   └── state.test.js
│   ├── services/
│   │   └── socket.test.js
│   └── utils/
│       ├── format.test.js
│       └── dashboard-utils.test.js
└── integration/
    └── handlers.test.js      # Integration tests
```

---

## War Room Commands

```bash
# Phase 0: Fix infrastructure
pnpm test -- --listTests
pnpm test -- --showConfig

# Phase 1: Utility tests
pnpm test utils/format.test.js
pnpm test utils/dashboard-utils.test.js

# Phase 2: Server tests
pnpm test server/server.test.js

# Phase 3-4: Handler tests
pnpm test server/handlers/
pnpm test server/llama-router/

# Phase 5: Repository tests
pnpm test server/repositories/

# Phase 6: Frontend tests
pnpm test frontend/

# Phase 7: GGUF parser tests
pnpm test server/gguf-parser.test.js

# Full coverage run
pnpm test:coverage

# Generate detailed coverage report
pnpm test:coverage -- --coverageReporters=json,lcov,html
```

---

**Plan Approved:** Ready for execution  
**Next Action:** Begin Phase 0 - Fix Jest Configuration
