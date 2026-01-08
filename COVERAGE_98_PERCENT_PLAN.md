# Parallel Test Coverage Plan: Target 98%

## Current Coverage Analysis

| Metric     | Current | Target | Gap    |
| ---------- | ------- | ------ | ------ |
| Lines      | 89.47%  | 98%    | 8.53%  |
| Statements | 88.92%  | 98%    | 9.08%  |
| Functions  | 93.10%  | 98%    | 4.90%  |
| Branches   | 80.18%  | 98%    | 17.82% |

**Total lines to cover**: 1,634  
**Currently covered**: 1,462  
**Lines remaining**: 172  
**Lines needed for 98%**: 1,602 (need +140 lines)

---

## Coverage Gap Analysis (excluding server.js)

| File                    | Coverage % | Uncovered Lines | Uncovered Branches | Priority |
| ----------------------- | ---------- | --------------- | ------------------ | -------- |
| `state-socket.js`       | 60.00%     | 22              | 7                  | 🔴 P1    |
| `llama-router/start.js` | 67.27%     | 18              | 13                 | 🔴 P1    |
| `metadata-parser.js`    | 80.70%     | 11              | 23                 | 🔴 P1    |
| `state-requests.js`     | 72.72%     | 6               | 3                  | 🔴 P1    |
| `component.js`          | 90.96%     | 14              | 28                 | 🟡 P2    |
| `file-logger.js`        | 86.90%     | 11              | 4                  | 🟡 P2    |
| `header-parser.js`      | 98.55%     | 1               | 8                  | 🟡 P2    |
| `models-repository.js`  | 92.31%     | 3               | 9                  | 🟡 P2    |
| `filename-parser.js`    | 100% lines | 0               | 6 branches         | 🟡 P2    |
| `socket.js`             | 92.59%     | 4               | 1                  | 🟢 P3    |
| `logger.js`             | 92.31%     | 2               | 2                  | 🟢 P3    |
| `state-models.js`       | 100% lines | 0               | 5 branches         | 🟢 P3    |
| `config.js`             | 92.86%     | 2               | 1                  | 🟢 P3    |
| `metrics.js`            | 93.33%     | 1               | 2                  | 🟢 P3    |
| `llama-router/api.js`   | 100% lines | 0               | 1 branch           | 🟢 P3    |
| `db/index.js`           | 100% lines | 0               | 1 branch           | 🟢 P3    |

---

## Parallel Agent Execution Plan

### Agent 1: Frontend State Specialist

**Focus**: Frontend state management modules (highest gaps)

**Files to test**:

- `public/js/core/state/state-socket.js`
- `public/js/core/state/state-requests.js`
- `public/js/core/state/state-models.js`

**New test files to create**:

```
__tests__/frontend/core/state-socket.test.js
__tests__/frontend/core/state-requests.test.js
__tests__/frontend/core/state-models-branches.test.js
```

**Test scenarios**:

1. Socket connection states (connected, disconnected, reconnecting, error)
2. Request queue handling (pending, success, failure, timeout, retry)
3. State model validation edge cases
4. Event handlers for all state transitions

**Estimated new coverage**: +35 lines, +15 branches

---

### Agent 2: Backend Llama Router Specialist

**Focus**: Llama router process management

**Files to test**:

- `server/handlers/llama-router/start.js`
- `server/handlers/llama-router/stop.js`
- `server/handlers/llama-router/status.js`

**New test files to create**:

```
__tests__/server/handlers/llama-router/start-coverage.test.js
__tests__/server/handlers/llama-router/stop-full.test.js
```

**Test scenarios**:

1. Process start with various configurations
2. Process stop with graceful and force scenarios
3. Status check during loading, ready, error states
4. Timeout handling
5. Error recovery paths

**Estimated new coverage**: +20 lines, +15 branches

---

### Agent 3: GGUF Parser Specialist

**Focus**: GGUF metadata and header parsing edge cases

**Files to test**:

- `server/gguf/metadata-parser.js`
- `server/gguf/header-parser.js`
- `server/gguf/filename-parser.js`

**New test files to create**:

```
__tests__/server/gguf/metadata-full.test.js
__tests__/server/gguf/header-branches.test.js
__tests__/server/gguf/filename-branches.test.js
```

**Test scenarios**:

1. All metadata field types (string, number, array, bool)
2. Malformed headers
3. Edge case tensor information
4. Version-specific parsing
5. Custom/vendor-specific metadata keys

**Estimated new coverage**: +12 lines, +40 branches

---

### Agent 4: Component & Frontend Specialist

**Focus**: Component rendering and event handling branches

**Files to test**:

- `public/js/core/component.js`

**New test files to create**:

```
__tests__/frontend/core/component-branches.test.js
__tests__/frontend/core/component-events.test.js
```

**Test scenarios**:

1. All conditional rendering branches
2. Event delegation edge cases
3. Component lifecycle transitions
4. Error boundary paths
5. State update batching

**Estimated new coverage**: +14 lines, +28 branches

---

### Agent 5: Backend Handlers Specialist

**Focus**: File logger, config, and metrics handlers

**Files to test**:

- `server/handlers/file-logger.js`
- `server/handlers/config.js`
- `server/handlers/metrics.js`
- `server/handlers/logger.js`

**New test files to create**:

```
__tests__/server/handlers/file-logger-branches.test.js
__tests__/server/handlers/config-branches.test.js
__tests__/server/handlers/metrics-branches.test.js
```

**Test scenarios**:

1. File rotation and size limits
2. Config validation all paths
3. Metrics aggregation edge cases
4. Logger level filtering
5. Write failures and recovery

**Estimated new coverage**: +16 lines, +9 branches

---

### Agent 6: Repository & DB Specialist

**Focus**: Models repository and DB index branches

**Files to test**:

- `server/db/models-repository.js`
- `server/db/index.js`

**New test files to create**:

```
__tests__/server/db/models-repository-branches.test.js
__tests__/server/db/index-branches.test.js
```

**Test scenarios**:

1. All CRUD operation branches
2. Transaction rollback scenarios
3. Concurrent access patterns
4. Error handling paths
5. Cache invalidation

**Estimated new coverage**: +5 lines, +10 branches

---

### Agent 7: Socket Service Specialist

**Focus**: Socket service edge cases

**Files to test**:

- `public/js/services/socket.js`

**New test files to create**:

```
__tests__/frontend/services/socket-branches.test.js
```

**Test scenarios**:

1. Reconnection with exponential backoff
2. Event listener cleanup
3. Heartbeat timeout handling
4. Binary data handling
5. Multiple simultaneous connections

**Estimated new coverage**: +4 lines, +1 branch

---

### Agent 8: Integration & Edge Cases Specialist

**Focus**: Cross-module integration tests for remaining branches

**Files to test**:

- Multiple modules for integration coverage

**New test files to create**:

```
__tests__/integration/state-router.test.js
__tests__/integration/handlers-middleware.test.js
```

**Test scenarios**:

1. State change → UI update flow
2. Handler chain execution
3. Error propagation across layers
4. Session management integration
5. Configuration inheritance

**Estimated new coverage**: +10 lines, +15 branches

---

## Execution Order (Parallel Groups)

### Group A (Can run in parallel - no dependencies)

| Agent                   | Duration | Files Modified          |
| ----------------------- | -------- | ----------------------- |
| Agent 1: Frontend State | ~25 min  | state-\*.test.js        |
| Agent 2: Llama Router   | ~20 min  | llama-router/\*.test.js |
| Agent 3: GGUF Parser    | ~20 min  | gguf/\*.test.js         |

### Group B (Can run in parallel - no dependencies)

| Agent               | Duration | Files Modified      |
| ------------------- | -------- | ------------------- |
| Agent 4: Components | ~20 min  | component\*.test.js |
| Agent 5: Handlers   | ~20 min  | handlers/\*.test.js |

### Group C (Can run in parallel - no dependencies)

| Agent                 | Duration | Files Modified   |
| --------------------- | -------- | ---------------- |
| Agent 6: Repositories | ~15 min  | db/\*.test.js    |
| Agent 7: Socket       | ~15 min  | socket\*.test.js |

### Group D (After Groups A-C complete)

| Agent                | Duration | Files Modified         |
| -------------------- | -------- | ---------------------- |
| Agent 8: Integration | ~20 min  | integration/\*.test.js |

**Total estimated time**: ~45-60 minutes (parallel execution)

---

## Success Criteria

After all agents complete:

| Metric             | Target | Validation             |
| ------------------ | ------ | ---------------------- |
| Line Coverage      | ≥98%   | `pnpm test:coverage`   |
| Statement Coverage | ≥98%   | Check coverage summary |
| Function Coverage  | ≥98%   | Check coverage summary |
| Branch Coverage    | ≥98%   | Check coverage summary |

---

## Validation Commands

```bash
# Run full coverage report
pnpm test:coverage

# View detailed HTML report
open coverage/index.html

# View JSON summary
cat coverage/coverage-summary.json

# Quick check (fail fast if below target)
pnpm test -- --coverage --coverageThreshold='{"global":{"lines":98}}'
```

---

## Rollback Plan

If coverage does not reach 98% after all tasks:

1. **Identify remaining gaps**: `pnpm test:coverage | grep -A5 "Below threshold"`
2. **Create focused tasks** for uncovered lines/branches
3. **Prioritize by impact**: Cover lines first, then branches
4. **Repeat** until target is met

---

## Notes

- All tests must follow TDD principles: write failing test first
- Each test file must have 100% pass rate
- No tests should be skipped or commented out
- Use descriptive test names explaining the edge case being covered
- Mock external dependencies (llama-server, file system, sockets)
