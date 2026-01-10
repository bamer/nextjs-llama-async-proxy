# 🛡️ WAR PLAN: Parallel Test Coverage Offensive

**Date:** January 7, 2026  
**Objective:** Achieve 100% test coverage across all modules  
**Strategy:** Deploy specialized testing agents in parallel waves

---

## 📊 COVERAGE BATTLEFIELD MAP

### Current State (Before Offensive)

| Category             | Status           | Tests         | Coverage         |
| -------------------- | ---------------- | ------------- | ---------------- |
| Server DB Layer      | ✅ Well Tested   | 84 tests      | ~90%             |
| Server Handlers      | ⚠️ Partial       | 600+ tests    | ~75%             |
| Server GGUF/Metadata | ✅ Well Tested   | 60 tests      | 100%             |
| Utils/Validation     | ✅ Well Tested   | 230 tests     | 100%             |
| Utils/Format         | ❌ Broken        | 93 tests      | 100% (env issue) |
| Utils/Dashboard      | ✅ Well Tested   | 491 tests     | 100%             |
| Frontend Core        | ✅ Well Tested   | 1800+ lines   | 100%             |
| **TOTAL**            | **1319 passing** | **28 suites** | **~73%**         |

---

## 🎯 MISSIONS (Coverage Gaps)

### 🚨 PRIORITY 1: CRITICAL (Zero/Low Coverage)

#### MISSION 1.1: `server/handlers/llama.js` - Complete Coverage

**Target:** 100% coverage for all 6 handlers  
**Current:** 0%  
**Functions to Test:**

- `llama:status` - Get llama router status
- `llama:start` - Start llama router
- `llama:restart` - Restart llama router
- `llama:stop` - Stop llama router
- `llama:config` - Get/set llama config
- `registerLlamaHandlers()` - Registration function

#### MISSION 1.2: `server/handlers/llama-router/status.js` - Complete Coverage

**Target:** 100% coverage  
**Current:** 25%  
**Functions to Test:**

- `getLlamaStatus()` - Main status function
- `loadModel()` - Model loading logic
- `unloadModel()` - Model unloading logic
- Error handling paths

#### MISSION 1.3: `server/handlers/llama-router/start.js` - Missing Scenarios

**Target:** 100% coverage  
**Current:** 44.64%  
**Missing Scenarios:**

- Binary not found error handling
- Port already in use scenarios
- Timeout scenarios
- Process spawn failures

#### MISSION 1.4: `server.js` - Main Entry Point

**Target:** 100% coverage  
**Current:** ~20%  
**Functions to Test:**

- `startMetrics()` - Metrics initialization
- `setupShutdown()` - Graceful shutdown handlers
- `main()` - Main startup logic
- CLI argument parsing

#### MISSION 1.5: Fix `format.test.js` Environment Issue

**Target:** Working tests  
**Current:** ReferenceError: window is not defined  
**Fix:** Add jsdom environment setup

---

### ⚠️ PRIORITY 2: MAJOR GAPS (Partial Coverage)

#### MISSION 2.1: `server/handlers/models/router-ops.js` - Finish Coverage

**Target:** 100% coverage  
**Current:** 68.42%  
**Missing:**

- `loadModel` handler edge cases
- `unloadModel` handler edge cases

#### MISSION 2.2: `server/handlers/llama-router/process.js` - Finish Coverage

**Target:** 100% coverage  
**Current:** 63.88%  
**Missing:**

- `findAvailablePort()` full scenarios
- `isPortInUse()` edge cases
- `findLlamaServer()` path scenarios
- `stopLlamaServer()` error cases

#### MISSION 2.3: `server/db/index.js` - Composition Layer

**Target:** 100% coverage  
**Current:** 0%  
**Functions:**

- All composed repository methods
- Connection pooling methods

#### MISSION 2.4: `server/db/schema.js` - Complete Coverage

**Target:** 100% coverage  
**Current:** 0%  
**Functions:**

- `getSchemaDefinition()`
- `getIndexesDefinition()`
- `getModelsMigrations()`
- `getMetricsMigrations()`
- `initSchema()`
- `createIndexes()`
- `runMigrations()`

---

### 📋 PRIORITY 3: NICE TO HAVE (Frontend)

#### MISSION 3.1: `public/js/services/socket.js` - Coverage

**Target:** 100% coverage  
**Current:** Minimal  
**Functions:**

- Socket connection management
- Event emission/reception
- Reconnection logic

#### MISSION 3.2: Frontend Components - Coverage

**Target:** 80% coverage  
**Current:** 0%  
**Targets:**

- Layout components
- Dashboard components
- Pages (models, logs, settings)

---

## ⚔️ PARALLEL OFFENSIVE STRATEGY

### WAVE 1: Independent Missions (No Dependencies)

| Agent              | Mission                     | Files                                   | Estimated Time |
| ------------------ | --------------------------- | --------------------------------------- | -------------- |
| **Tester-Agent-1** | MISSION 1.1: llama.js       | server/handlers/llama.js                | 15 min         |
| **Tester-Agent-2** | MISSION 1.2: router-status  | server/handlers/llama-router/status.js  | 10 min         |
| **Tester-Agent-3** | MISSION 1.3: router-start   | server/handlers/llama-router/start.js   | 10 min         |
| **Tester-Agent-4** | MISSION 1.4: server.js      | server.js                               | 15 min         |
| **Tester-Agent-5** | MISSION 2.1: router-ops     | server/handlers/models/router-ops.js    | 10 min         |
| **Tester-Agent-6** | MISSION 2.2: router-process | server/handlers/llama-router/process.js | 10 min         |

### WAVE 2: Dependent Missions (After Wave 1)

| Agent               | Mission                 | Files                          | Estimated Time |
| ------------------- | ----------------------- | ------------------------------ | -------------- |
| **Tester-Agent-7**  | MISSION 2.3: db-index   | server/db/index.js             | 10 min         |
| **Tester-Agent-8**  | MISSION 2.4: db-schema  | server/db/schema.js            | 15 min         |
| **Tester-Agent-9**  | MISSION 1.5: fix-format | **tests**/utils/format.test.js | 5 min          |
| **Tester-Agent-10** | MISSION 3.1: socket.js  | public/js/services/socket.js   | 15 min         |

### WAVE 3: Verification & Cleanup

| Agent              | Mission             | Files            | Estimated Time |
| ------------------ | ------------------- | ---------------- | -------------- |
| **Tester-Agent**   | Full test suite run | All tests        | 5 min          |
| **Reviewer-Agent** | Coverage validation | coverage report  | 5 min          |
| **Janitor-Agent**  | Cleanup artifacts   | dist/, coverage/ | 2 min          |

---

## 📝 TEST PATTERN TEMPLATES

### Server Handler Test Pattern

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

### Repository Test Pattern

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

## 📦 AGENT TASK ENVELOPES

### Task Envelope: MISSION 1.1 (llama.js)

```json
{
  "taskId": "T-LLAMA-001",
  "role": "tester",
  "description": "Write complete test coverage for server/handlers/llama.js",
  "filesAffected": ["server/handlers/llama.js", "__tests__/server/handlers/llama.test.js"],
  "inputs": {
    "targetCoverage": "100%",
    "testPatterns": [
      "handlerRegistration",
      "llamaStatus",
      "llamaStart",
      "llamaRestart",
      "llamaStop",
      "llamaConfig"
    ]
  },
  "successCriteria": [
    "pnpm test -- server/handlers/llama.test.js",
    "100% branch coverage on llama.js",
    "All 6 handlers tested with success/error paths"
  ],
  "dependsOn": [],
  "timeoutSeconds": 300
}
```

### Task Envelope: MISSION 1.2 (router-status)

```json
{
  "taskId": "T-ROUTER-STATUS-001",
  "role": "tester",
  "description": "Write complete test coverage for router status handlers",
  "filesAffected": [
    "server/handlers/llama-router/status.js",
    "__tests__/server/handlers/llama-router/status.test.js"
  ],
  "inputs": {
    "targetCoverage": "100%",
    "testPatterns": ["getLlamaStatus", "loadModel", "unloadModel", "errorHandling"]
  },
  "successCriteria": [
    "pnpm test -- server/handlers/llama-router/status.test.js",
    "100% branch coverage on status.js",
    "All status scenarios tested"
  ],
  "dependsOn": [],
  "timeoutSeconds": 300
}
```

### Task Envelope: MISSION 2.3 (db-index)

```json
{
  "taskId": "T-DB-INDEX-001",
  "role": "tester",
  "description": "Write complete test coverage for db composition layer",
  "filesAffected": ["server/db/index.js", "__tests__/server/db/index.test.js"],
  "inputs": {
    "targetCoverage": "100%",
    "testPatterns": ["allRepositories", "connectionPooling", "composedMethods"]
  },
  "successCriteria": ["pnpm test -- server/db/index.test.js", "100% branch coverage on index.js"],
  "dependsOn": [],
  "timeoutSeconds": 300
}
```

---

## 📈 SUCCESS METRICS

### Coverage Targets

| Module                             | Current  | Target   | Delta    |
| ---------------------------------- | -------- | -------- | -------- |
| server/handlers/llama.js           | 0%       | 100%     | +100%    |
| server/handlers/llama-router/\*.js | 60%      | 100%     | +40%     |
| server/db/\*.js                    | 70%      | 100%     | +30%     |
| server.js                          | 20%      | 100%     | +80%     |
| **OVERALL**                        | **~73%** | **100%** | **+27%** |

### Test Count Targets

| Current | Target | Delta |
| ------- | ------ | ----- |
| 1319    | 1800+  | +500  |

---

## 🚀 EXECUTION ORDERS

### Phase 1: Initialize (2 min)

```
1. Create workspace directory
2. Lock mission files
3. Dispatch Wave 1 agents (6 parallel)
```

### Phase 2: Wave 1 Execution (15 min)

```
Agents 1-6 execute in parallel:
- Agent 1: llama.js handlers
- Agent 2: router-status
- Agent 3: router-start
- Agent 4: server.js
- Agent 5: router-ops
- Agent 6: router-process
```

### Phase 3: Wave 2 Execution (15 min)

```
After Wave 1 complete:
- Agent 7: db-index
- Agent 8: db-schema
- Agent 9: fix-format
- Agent 10: socket.js
```

### Phase 4: Verification (10 min)

```
1. Run full test suite
2. Generate coverage report
3. Validate 100% coverage
4. Fix any failures
```

### Phase 5: Cleanup (5 min)

```
1. Review code changes
2. Cleanup temporary files
3. Generate final report
4. Commit changes
```

---

## ⚠️ RISK MITIGATION

| Risk                    | Probability | Impact | Mitigation                             |
| ----------------------- | ----------- | ------ | -------------------------------------- |
| Test environment issues | Medium      | High   | Pre-configure jsdom for frontend tests |
| Mock complexity         | High        | Medium | Create shared mock utilities           |
| Circular dependencies   | Low         | High   | Use dependency injection in tests      |
| Test execution time     | Medium      | Low    | Run in parallel, increase timeout      |

---

## 🎖️ VICTORY CONDITIONS

✅ **MISSION ACCOMPLISHED** when:

1. All 10 missions complete successfully
2. `pnpm test:coverage` shows 100% coverage
3. No test failures in any suite
4. Coverage report generated in `coverage/`

---

**PLAN APPROVED FOR EXECUTION**  
**Waiting for COMMANDER authorization to proceed...**
