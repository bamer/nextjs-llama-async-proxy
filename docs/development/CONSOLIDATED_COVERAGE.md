# Test Coverage - Complete Documentation

Comprehensive documentation for test coverage, parallel testing strategies, and quality assurance.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Coverage Metrics](#coverage-metrics)
4. [Parallel Testing Strategy](#parallel-testing-strategy)
5. [Coverage by Module](#coverage-by-module)
6. [Test Organization](#test-organization)
7. [Running Tests](#running-tests)
8. [Coverage Goals](#coverage-goals)
9. [WAR Plans](#war-plans)
10. [Consolidated From](#consolidated-from)

---

## Overview

This document covers the test coverage strategy for the Llama Proxy Dashboard, including parallel execution plans, coverage targets, and quality assurance guidelines.

### Current Status

| Metric | Status |
|--------|--------|
| Total Tests | 467+ passing |
| Test Suites | 28+ suites |
| Code Coverage | ~73% (improving) |
| Frontend Coverage | 100% on core files |
| Backend Coverage | Varies by module |

### Test Categories

1. **Server DB Layer** - 84 tests (~90% coverage)
2. **Server Handlers** - 600+ tests (~75% coverage)
3. **Server GGUF/Metadata** - 60 tests (100% coverage)
4. **Utils/Validation** - 230 tests (100% coverage)
5. **Utils/Format** - 93 tests (100% coverage)
6. **Utils/Dashboard** - 491 tests (100% coverage)
7. **Frontend Core** - 1800+ lines (100% coverage)

---

## Quick Start

### One Command Coverage Report

```bash
pnpm test:coverage
```

This generates a comprehensive coverage report.

### What You'll See

**Terminal Output:**

```
═══════════════════════════════════════════════════════════════
               COVERAGE REPORT - TEST SUMMARY
═══════════════════════════════════════════════════════════════

  Metric          |  Statements  |  Branches  |  Functions  |  Lines
───────────────────────────────────────────────────────────────
  Coverage        |   85.3%      |   82.1%    |   88.9%     |   86.5%
───────────────────────────────────────────────────────────────
  Statements    : 1234/1444
  Branches      : 567/690
  Functions     : 234/263
  Lines         : 1200/1388
```

**HTML Report:**

- Interactive HTML report opens automatically
- Click files to see line-by-line coverage
- Green = tested, Red = untested

### View Reports Manually

```bash
# Open HTML report
open coverage/index.html

# View JSON summary
cat coverage/coverage-summary.json

# See uncovered lines
cat coverage/coverage-summary.json | grep -v total
```

---

## Coverage Metrics

### Current Coverage Analysis

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Lines | 89.47% | 98% | 8.53% |
| Statements | 88.92% | 98% | 9.08% |
| Functions | 93.10% | 98% | 4.90% |
| Branches | 80.18% | 98% | 17.82% |

### Coverage by File

| File | Coverage % | Uncovered Lines | Priority |
|------|------------|-----------------|----------|
| `state-socket.js` | 60.00% | 22 | 🔴 P1 |
| `llama-router/start.js` | 67.27% | 18 | 🔴 P1 |
| `metadata-parser.js` | 80.70% | 11 | 🔴 P1 |
| `state-requests.js` | 72.72% | 6 | 🔴 P1 |
| `component.js` | 90.96% | 14 | 🟡 P2 |
| `file-logger.js` | 86.90% | 11 | 🟡 P2 |
| `header-parser.js` | 98.55% | 1 | 🟡 P2 |
| `models-repository.js` | 92.31% | 3 | 🟡 P2 |
| `socket.js` | 92.59% | 4 | 🟢 P3 |
| `logger.js` | 92.31% | 2 | 🟢 P3 |
| `config.js` | 92.86% | 2 | 🟢 P3 |

### Socket Client Coverage

**File**: `public/js/services/socket.js`

| Metric | Coverage | Target | Status |
|--------|----------|--------|--------|
| Statements | 98.24% | ≥90% | ✅ EXCEEDS |
| Branches | 100% | ≥90% | ✅ EXCEEDS |
| Functions | 94.44% | ≥90% | ✅ EXCEEDS |
| Lines | 100% | ≥98% | ✅ EXCEEDS |

---

## Parallel Testing Strategy

### Coverage Gap Analysis (Total)

- **Total lines to cover**: 1,634
- **Currently covered**: 1,462
- **Lines remaining**: 172
- **Lines needed for 98%**: 1,602 (need +140 lines)

### Agent Teams

#### Agent 1: Frontend State Specialist

**Focus**: Frontend state management modules

**Files to test**:
- `public/js/core/state/state-socket.js`
- `public/js/core/state/state-requests.js`
- `public/js/core/state/state-models.js`

**Test scenarios**:
1. Socket connection states (connected, disconnected, reconnecting, error)
2. Request queue handling (pending, success, failure, timeout, retry)
3. State model validation edge cases
4. Event handlers for all state transitions

**Estimated new coverage**: +35 lines, +15 branches

#### Agent 2: Backend Llama Router Specialist

**Focus**: Llama router process management

**Files to test**:
- `server/handlers/llama-router/start.js`
- `server/handlers/llama-router/stop.js`
- `server/handlers/llama-router/status.js`

**Test scenarios**:
1. Process start with various configurations
2. Process stop with graceful and force scenarios
3. Status check during loading, ready, error states
4. Timeout handling
5. Error recovery paths

**Estimated new coverage**: +20 lines, +15 branches

#### Agent 3: GGUF Parser Specialist

**Focus**: GGUF metadata and header parsing edge cases

**Files to test**:
- `server/gguf/metadata-parser.js`
- `server/gguf/header-parser.js`
- `server/gguf/filename-parser.js`

**Test scenarios**:
1. All metadata field types (string, number, array, bool)
2. Malformed headers
3. Edge case tensor information
4. Version-specific parsing
5. Custom/vendor-specific metadata keys

**Estimated new coverage**: +12 lines, +40 branches

#### Agent 4: Component & Frontend Specialist

**Focus**: Component rendering and event handling branches

**Files to test**:
- `public/js/core/component.js`

**Test scenarios**:
1. All conditional rendering branches
2. Event delegation edge cases
3. Component lifecycle transitions
4. Error boundary paths
5. State update batching

**Estimated new coverage**: +14 lines, +28 branches

#### Agent 5: Backend Handlers Specialist

**Focus**: File logger, config, and metrics handlers

**Files to test**:
- `server/handlers/file-logger.js`
- `server/handlers/config.js`
- `server/handlers/metrics.js`
- `server/handlers/logger.js`

**Test scenarios**:
1. File rotation and size limits
2. Config validation all paths
3. Metrics aggregation edge cases
4. Logger level filtering
5. Write failures and recovery

**Estimated new coverage**: +16 lines, +9 branches

#### Agent 6: Repository & DB Specialist

**Focus**: Models repository and DB index branches

**Files to test**:
- `server/db/models-repository.js`
- `server/db/index.js`

**Test scenarios**:
1. All CRUD operation branches
2. Transaction rollback scenarios
3. Concurrent access patterns
4. Error handling paths
5. Cache invalidation

**Estimated new coverage**: +5 lines, +10 branches

#### Agent 7: Socket Service Specialist

**Focus**: Socket service edge cases

**Files to test**:
- `public/js/services/socket.js`

**Test scenarios**:
1. Reconnection with exponential backoff
2. Event listener cleanup
3. Heartbeat timeout handling
4. Binary data handling
5. Multiple simultaneous connections

**Estimated new coverage**: +4 lines, +1 branch

#### Agent 8: Integration & Edge Cases Specialist

**Focus**: Cross-module integration tests

**Files to test**:
- Multiple modules for integration coverage

**Test scenarios**:
1. State change → UI update flow
2. Handler chain execution
3. Error propagation across layers
4. Session management integration
5. Configuration inheritance

**Estimated new coverage**: +10 lines, +15 branches

---

## Coverage by Module

### Server DB Layer

**Test File**: `__tests__/server/db.test.js`

- **Tests**: 84 tests
- **Coverage**: ~90%
- **Focus**: All database operations

### Server GGUF/Metadata

**Test File**: `__tests__/server/metadata.test.js`

- **Tests**: 60 tests
- **Coverage**: 100%
- **Focus**: GGUF file parsing and metadata extraction

### Utils/Validation

**Test File**: `__tests__/utils/validation.test.js`

- **Tests**: 230 tests
- **Coverage**: 100%
- **Focus**: Input validation functions

### Utils/Format

**Test File**: `__tests__/utils/format.test.js`

- **Tests**: 93 tests
- **Coverage**: 100%
- **Focus**: Formatting utilities

### Frontend Socket

**Test File**: `__tests__/frontend/services/socket-branches.test.js`

- **Tests**: 62 comprehensive tests
- **Coverage**: 100% lines, 100% branches

### Socket Test Scenarios Covered

1. **Reconnection with exponential backoff**
   - Multiple connect/disconnect cycles
   - Rapid reconnection attempts
   - Script-based connection fallback

2. **Event listener cleanup**
   - Specific handler removal (`off(event, handler)`)
   - Bulk handler removal (`off(event)`)
   - Handler cleanup for non-existent events
   - Concurrent handler registration and removal

3. **Heartbeat timeout handling**
   - `connect_error` event handling
   - Multiple error event scenarios
   - Error logging verification

4. **Binary data handling**
   - ArrayBuffer forwarding
   - Blob data handling
   - Uint8Array data
   - Mixed binary and JSON events

5. **Multiple simultaneous connections**
   - Independent socket clients
   - Independent event handlers per client
   - Concurrent emit from multiple clients
   - Independent disconnect/connect cycles

---

## Test Organization

### Directory Structure

```
__tests__/
├── server/
│   ├── db.test.js                  # Database layer tests (84 tests)
│   ├── metadata.test.js            # GGUF metadata parsing (60 tests)
│   └── handlers/
│       ├── llama.test.js           # Llama handler tests
│       └── llama-router/
│           ├── start.test.js       # Router start tests
│           ├── stop.test.js        # Router stop tests
│           └── status.test.js      # Router status tests
│
├── frontend/
│   ├── core/
│   │   ├── component.test.js       # Component tests
│   │   ├── router.test.js          # Router tests
│   │   └── state.test.js           # State management tests
│   ├── services/
│   │   ├── socket.test.js          # Socket tests (56 tests)
│   │   └── socket-branches.test.js # Socket branch tests (62 tests)
│   └── utils/
│       ├── format.test.js          # Format utilities (93 tests)
│       └── validation.test.js      # Validation (230 tests)
│
└── integration/
    └── handlers.test.js            # Integration tests
```

### Test Pattern

#### Server Handler Test Pattern

```javascript
describe('HandlerName', () => {
  let mockSocket;
  let mockDb;

  beforeEach(() => {
    mockSocket = createMockSocket();
    mockDb = createMockDatabase();
  });

  describe('handlerName', () => {
    it('should handle SUCCESS case', async () => {
      // Arrange
      mockDb.methodName.resolves({ success: true });

      // Act
      const result = await handlerName(mockSocket, mockDb, req);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDb.methodName).toHaveBeenCalledWith(...);
    });

    it('should handle ERROR case', async () => {
      // Arrange
      mockDb.methodName.rejects(new Error('Test error'));

      // Act & Assert
      await expect(handlerName(mockSocket, mockDb, req))
        .rejects.toThrow('Test error');
    });
  });
});
```

#### Repository Test Pattern

```javascript
describe("RepositoryName", () => {
  let db;
  let repo;

  beforeEach(() => {
    db = createInMemoryDb();
    repo = new RepositoryName(db);
  });

  describe("methodName", () => {
    it("should insert record and return id", () => {
      const result = repo.methodName(data);
      expect(result).toHaveProperty("id");
    });

    it("should throw on invalid input", () => {
      expect(() => repo.methodName(invalidData)).toThrow();
    });
  });
});
```

---

## Running Tests

### Commands

```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific test file
pnpm test -- utils/validation.test.js

# Run branch coverage tests only
pnpm test -- __tests__/frontend/services/socket-branches.test.js

# Run all socket tests
pnpm test -- __tests__/frontend/services/socket.test.js \
            __tests__/frontend/services/socket-branches.test.js
```

### VSCode Integration

1. Install "Coverage Gutters" extension
2. Open any `.js` file
3. Press **Cmd+Shift+P** (or Ctrl+Shift+P on Linux/Windows)
4. Type: `Coverage Gutters: Display Coverage`
5. See green/red highlights for covered/uncovered code

### Color Meanings

**Terminal percentages:**
- 🟢 Green (≥90%) = Excellent coverage
- 🟡 Yellow (≥80%) = Good coverage
- 🔴 Red (<80%) = Needs improvement

**VSCode Coverage Gutters:**
- 🟢 Green highlight = Code is tested
- 🔴 Red highlight = Code is not tested
- 🟡 Yellow highlight = Branch not tested

---

## Coverage Goals

### Minimum Thresholds

| Metric | Minimum |
|--------|---------|
| Lines | 80% |
| Statements | 80% |
| Functions | 80% |
| Branches | 80% |

### Target Goals

| Metric | Target |
|--------|--------|
| Lines | 98% |
| Statements | 98% |
| Functions | 98% |
| Branches | 98% |

---

## WAR Plans

### WAR PLAN: Parallel Test Coverage Offensive

#### Objective
Achieve 100% test coverage across all modules

#### Strategy
Deploy specialized testing agents in parallel waves

#### Current State

| Category | Status | Tests | Coverage |
|----------|--------|-------|----------|
| Server DB Layer | ✅ Well Tested | 84 tests | ~90% |
| Server Handlers | ⚠️ Partial | 600+ tests | ~75% |
| Server GGUF/Metadata | ✅ Well Tested | 60 tests | 100% |
| Utils/Validation | ✅ Well Tested | 230 tests | 100% |
| Utils/Format | ❌ Broken | 93 tests | 100% (env issue) |
| Utils/Dashboard | ✅ Well Tested | 491 tests | 100% |
| Frontend Core | ✅ Well Tested | 1800+ lines | 100% |
| **TOTAL** | **1319 passing** | **28 suites** | **~73%** |

#### Missions (Coverage Gaps)

##### PRIORITY 1: CRITICAL

**MISSION 1.1**: `server/handlers/llama.js` - Complete Coverage
- Target: 100% coverage for all 6 handlers
- Current: 0%
- Functions: status, start, restart, stop, config, registration

**MISSION 1.2**: `server/handlers/llama-router/status.js` - Complete Coverage
- Target: 100% coverage
- Current: 25%
- Functions: getLlamaStatus, loadModel, unloadModel

**MISSION 1.3**: `server/handlers/llama-router/start.js` - Missing Scenarios
- Target: 100% coverage
- Current: 44.64%
- Missing: Binary not found, port in use, timeout, spawn failures

**MISSION 1.4**: `server.js` - Main Entry Point
- Target: 100% coverage
- Current: ~20%
- Functions: startMetrics, setupShutdown, main

**MISSION 1.5**: Fix `format.test.js` Environment Issue
- Target: Working tests
- Current: ReferenceError: window is not defined
- Fix: Add jsdom environment setup

##### PRIORITY 2: MAJOR GAPS

**MISSION 2.1**: `server/handlers/models/router-ops.js` - Finish Coverage
- Target: 100% coverage
- Current: 68.42%
- Missing: loadModel/unloadModel edge cases

**MISSION 2.2**: `server/handlers/llama-router/process.js` - Finish Coverage
- Target: 100% coverage
- Current: 63.88%
- Missing: findAvailablePort, isPortInUse, findLlamaServer

**MISSION 2.3**: `server/db/index.js` - Composition Layer
- Target: 100% coverage
- Current: 0%

**MISSION 2.4**: `server/db/schema.js` - Complete Coverage
- Target: 100% coverage
- Current: 0%

##### PRIORITY 3: NICE TO HAVE

**MISSION 3.1**: `public/js/services/socket.js` - Coverage
- Target: 100% coverage
- Current: Minimal

**MISSION 3.2**: Frontend Components - Coverage
- Target: 80% coverage
- Current: 0%

#### Parallel Execution Strategy

**WAVE 1**: Independent Missions

| Agent | Mission | Files | Estimated Time |
|-------|---------|-------|----------------|
| Tester-Agent-1 | MISSION 1.1: llama.js | server/handlers/llama.js | 15 min |
| Tester-Agent-2 | MISSION 1.2: router-status | server/handlers/llama-router/status.js | 10 min |
| Tester-Agent-3 | MISSION 1.3: router-start | server/handlers/llama-router/start.js | 10 min |
| Tester-Agent-4 | MISSION 1.4: server.js | server.js | 15 min |
| Tester-Agent-5 | MISSION 2.1: router-ops | server/handlers/models/router-ops.js | 10 min |
| Tester-Agent-6 | MISSION 2.2: router-process | server/handlers/llama-router/process.js | 10 min |

**WAVE 2**: Dependent Missions

| Agent | Mission | Files | Estimated Time |
|-------|---------|-------|----------------|
| Tester-Agent-7 | MISSION 2.3: db-index | server/db/index.js | 10 min |
| Tester-Agent-8 | MISSION 2.4: db-schema | server/db/schema.js | 15 min |
| Tester-Agent-9 | MISSION 1.5: fix-format | **tests**/utils/format.test.js | 5 min |
| Tester-Agent-10 | MISSION 3.1: socket.js | public/js/services/socket.js | 15 min |

**WAVE 3**: Verification & Cleanup

| Agent | Mission | Files | Estimated Time |
|-------|---------|-------|----------------|
| Tester-Agent | Full test suite run | All tests | 5 min |
| Reviewer-Agent | Coverage validation | coverage report | 5 min |
| Janitor-Agent | Cleanup artifacts | dist/, coverage/ | 2 min |

#### Execution Timeline

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

#### Success Criteria

| Metric | Target | Validation |
|--------|--------|------------|
| Line Coverage | ≥98% | `pnpm test:coverage` |
| Statement Coverage | ≥98% | Check coverage summary |
| Function Coverage | ≥98% | Check coverage summary |
| Branch Coverage | ≥98% | Check coverage summary |

#### Victory Conditions

✅ **MISSION ACCOMPLISHED** when:

1. All missions complete successfully
2. `pnpm test:coverage` shows 100% coverage
3. No test failures in any suite
4. Coverage report generated in `coverage/`

---

## Testing Best Practices

### Critical Principle

> If tests fail, the code is broken - fix the code, not the tests. Tests are written to verify correct behavior; when tests fail, it indicates a bug in the implementation.

### Guidelines

1. **Write tests first (TDD)** - Define expected behavior before implementing
2. **Test behavior, not implementation** - Focus on what the function does
3. **Use descriptive test names** - Test names should describe expected behavior
4. **Each test one assertion** - Makes debugging easier
5. **Mock external dependencies** - Database, file system, network calls

### Test Pattern Compliance

✅ Follows existing test patterns from `socket.test.js`  
✅ Uses Jest with proper mocking of Socket.IO  
✅ Uses `describe()`, `test()` patterns  
✅ Mock socket.io-client appropriately  
✅ Arrange-Act-Assert pattern in all tests  
✅ All tests deterministic (no network/time dependencies)  
✅ Proper beforeEach/afterEach cleanup

---

## Rollback Plan

If coverage decreases or tests fail:

1. **Revert Jest config changes** - keep inline tests as fallback
2. **Run original test suite** - verify tests still pass
3. **Fix incrementally** - add one file at a time
4. **Use feature flags** - enable new tests selectively

---

## Tips

- Run coverage before committing code
- Use the HTML report to find untested code
- Use VSCode Coverage Gutters to see coverage while coding
- Aim for >90% on critical files (validation, database, handlers)

---

## Consolidated From

This document was consolidated from the following source files:

1. `COVERAGE_SUMMARY.md` - Socket client branch coverage results
2. `COVERAGE_QUICK_START.md` - Quick start coverage guide
3. `COVERAGE_98_PERCENT_PLAN.md` - Plan for 98% coverage target
4. `WAR_PLAN_COVERAGE.md` - Parallel test coverage offensive (425 lines)
5. `WAR_PLAN_PARALLEL_TESTS.md` - Parallel test coverage initiative (844 lines)

---

**Last Updated**: January 2026  
**Version**: 1.0 (Consolidated)
