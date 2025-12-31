# 🚨 EMERGENCY RESCUE PLAN - Broken Refactoring Fix

**Date**: December 31, 2025
**Pipeline ID**: RESCUE-2025-12-31-001
**Phase**: CRITICAL_RESCUE

---

## 📊 PROBLEM ANALYSIS

### Root Cause
A recent refactoring changed the **SystemMetrics** type structure from flat to nested format, but **tests were never updated**.

### Impact Assessment
- ❌ **60+ TypeScript errors** blocking compilation
- ❌ **All tests failing** (use old property names)
- ❌ **Dashboard metrics not displaying** (GPU fields hardcoded to 0)
- ❌ **Application likely broken** in production

### Type Structure Mismatch

**OLD (deprecated, still used in tests):**
```typescript
interface OldMetrics {
  cpuUsage: number;           // ❌
  memoryUsage: number;        // ❌
  diskUsage: number;           // ❌
  totalRequests: number;       // ❌
  activeModels: number;        // ❌
  avgResponseTime: number;      // ❌
  gpuUsage: number;           // ❌
  gpuMemoryUsage: number;      // ❌
  gpuPowerUsage: number;       // ❌
}
```

**NEW (current, defined in src/types/monitoring.ts):**
```typescript
interface SystemMetrics {
  cpu: {
    usage: number;        // ✅
  };
  memory: {
    used: number;         // ✅
  };
  disk: {
    used: number;         // ✅
  };
  network: {
    rx: number;
    tx: number;
  };
  uptime: number;
  gpu?: {
    usage: number;         // ✅
    memoryUsed: number;   // ✅
    memoryTotal: number;
    powerUsage: number;   // ✅
    powerLimit: number;
    temperature: number;
    name?: string;
  };
}
```

---

## 📋 TASK LIST

### Phase 1: Critical Fixes (Parallel Execution)

| Task | ID | Role | Status | Description | Priority |
|------|-----|--------|-------------|----------|
| Review & Approve Plan | T-001 | 🔄 Reviewer | Analyze and validate rescue plan | High |
| Fix Test Files | T-002 | 🔄 Coder | Update all tests to use nested structure | **CRITICAL** |
| Fix ThemeContext Tests | T-003 | 🔄 Coder | Fix duplicate mock declarations | High |
| Fix FormState Tests | T-004 | 🔄 Coder | Fix type constraint violations | High |
| Create Test Utils | T-005 | 🔄 Coder | Create missing @/test-utils module | High |
| Fix Lint Errors | T-006 | 🔄 Coder | Remove unused vars, fix imports | Medium |
| Run Tests | T-007 | ⏳ Tester | Full test suite + coverage | **CRITICAL** |
| Verify Type Errors | T-008 | ⏳ Reviewer | Confirm all TS errors resolved | **CRITICAL** |
| Review Dashboard | T-009 | ⏳ Reviewer | Verify metrics display correctly | High |
| Document Fix | T-010 | ⏳ Docs | Create RESCUE_PLAN.md | Low |

---

## 🔧 DETAILED FIX INSTRUCTIONS

### Task T-002: Fix Test Files (CRITICAL)

**Files to Update:**
1. `__tests__/components/dashboard/hooks/useDashboardMetrics.test.ts`
2. `__tests__/e2e/user-flows.test.tsx`
3. `__tests__/integration/api-workflow.test.ts`
4. `__tests__/lib/store-normalized.test.ts`

**Changes Required:**
```diff
- import type { SystemMetrics } from '@/types/global';
+ import type { SystemMetrics } from '@/types/monitoring';

- const mockMetrics: SystemMetrics = {
-   cpuUsage: 45.5,
-   memoryUsage: 62.3,
-   diskUsage: 55.0,
-   activeModels: 2,
-   uptime: 3600,
-   totalRequests: 1000,
-   avgResponseTime: 150,
-   timestamp: new Date().toISOString(),
-   gpuUsage: 80.0,
-   gpuMemoryUsage: 12.5,
-   gpuPowerUsage: 200.0,
- };

+ const mockMetrics: SystemMetrics = {
+   cpu: { usage: 45.5 },
+   memory: { used: 62.3 },
+   disk: { used: 55.0 },
+   network: { rx: 100, tx: 50 },
+   uptime: 3600,
+   gpu: {
+     usage: 80.0,
+     memoryUsed: 12.5,
+     memoryTotal: 16,
+     powerUsage: 200.0,
+     powerLimit: 300,
+     temperature: 65,
+   },
+ };

- expect(latestDataPoint.cpu).toBe(mockMetrics.cpuUsage);
- expect(latestDataPoint.memory).toBe(mockMetrics.memoryUsage);
- expect(latestDataPoint.requests).toBe(mockMetrics.totalRequests);
+ expect(latestDataPoint.cpu).toBe(mockMetrics.cpu.usage);
+ expect(latestDataPoint.memory).toBe(mockMetrics.memory.used);
```

---

## 📊 SUCCESS CRITERIA

### Immediate (Phase 1)
- ✅ `pnpm type:check` completes with **0 errors**
- ✅ `pnpm lint` completes with **0 errors** (warnings OK)
- ✅ All test files compile successfully
- ✅ Dashboard metrics display correctly (CPU, Memory, GPU)
- ✅ Test coverage ≥ 70%

### Post-Rescue (Phase 2+)
Refer to [EXTENSIVE CODEBASE IMPROVEMENT.md](../EXTENSIVE%20CODEBASE%20IMPROVEMENT.md) for roadmap.

---

## 📝 LESSONS LEARNED

1. **Type migrations require comprehensive updates** - Changing a core type affects dozens of files
2. **Tests must be updated immediately** - No "fix later" - broken tests block development
3. **Audit references before refactoring** - Should have searched all usages of cpuUsage, memoryUsage, etc.
4. **Use strict type checking** - Would have caught these errors immediately

---

## 🎯 NEXT STEPS

1. ✅ Create TODO list (orchestrator_todo.json)
2. ⏳ Dispatch tasks to specialized agents in parallel
3. ⏳ Monitor agent progress
4. ⏳ Run final test suite
5. ⏳ Generate rescue documentation
6. ⏳ Emit FINAL_SUMMARY token

---

**Orchestrator**: @orchestrator (activated)
**Mode**: Parallel task delegation where possible
