# 🧹 Lint Errors Fix Plan - Complete Project Cleanup

**Status:** 📋 READY FOR VALIDATION

**Lint Summary:**
- **Total Errors:** 350+
- **Total Warnings:** 80+
- **Files Affected:** 40+ files
- **Primary Issue Categories:**
  1. `@typescript-eslint/no-explicit-any` (80% of errors)
  2. `@typescript-eslint/no-require-imports` (10% of errors)
  3. `@typescript-eslint/no-unused-vars` (8% of errors/warnings)
  4. Other minor issues (2%)

---

## 📊 Error Breakdown by Category

### 1. **`@typescript-eslint/no-explicit-any`** - 300+ errors

**Pattern:** Test files using `any` type for mock data

**Locations:**
- `__tests__/components/charts/GPUMetricsCard.test.tsx` (20 errors)
- `__tests__/components/charts/PerformanceChart.test.tsx` (24 errors)
- `__tests__/components/charts/PerformanceChart.coverage.test.tsx` (2 errors)
- `__tests__/components/charts/PerformanceChart.integration.test.tsx` (31 errors)
- `__tests__/components/dashboard/ModernDashboard.test.tsx` (35 errors)
- `__tests__/components/dashboard/QuickActionsCard.test.tsx` (3 errors)
- `__tests__/components/configuration/*.test.tsx` (25+ errors)
- `__tests__/components/dashboard/hooks/*.test.ts` (5+ errors)
- `__tests__/components/layout/*.test.tsx` (20+ errors)
- `__tests__/components/critical-path.test.tsx` (1 error)

**Fix Strategy:**
Replace `any` with proper TypeScript types or create mock interfaces.

---

### 2. **`@typescript-eslint/no-require-imports`** - 40+ errors

**Pattern:** Test files using CommonJS `require()` instead of ES6 imports

**Locations:**
- `__tests__/components/charts/PerformanceChart.integration.test.tsx` (1 error)
- `__tests__/components/configuration/AdvancedSettingsTab.test.tsx` (2 errors)
- `__tests__/components/configuration/ConfigurationHeader.test.tsx` (3 errors)
- `__tests__/components/configuration/ConfigurationStatusMessages.test.tsx` (3 errors)
- `__tests__/components/configuration/ConfigurationTabs.test.tsx` (1 error)
- `__tests__/components/configuration/GeneralSettingsTab.test.tsx` (2 errors)
- `__tests__/components/configuration/LlamaServerSettingsTab.test.tsx` (2 errors)
- `__tests__/components/configuration/LoggerSettingsTab.test.tsx` (1 error)
- `__tests__/components/configuration/ModernConfiguration.test.tsx` (1 error)
- `__tests__/components/layout/*.test.tsx` (20+ errors)

**Fix Strategy:**
Replace `require()` with ES6 `import` statements.

**Example:**
```typescript
// ❌ BEFORE
const { render } = require('@testing-library/react');

// ✅ AFTER
import { render } from '@testing-library/react';
```

---

### 3. **`@typescript-eslint/no-unused-vars`** - 35+ warnings

**Pattern:** Variables defined but never used

**Locations:**
- `__tests__/api/*.test.ts` (18 warnings - `json` variables)
- `__tests__/components/charts/PerformanceChart.integration.test.tsx` (2 warnings - `_ref`, `e`)
- `__tests__/components/configuration/ModernConfiguration.test.tsx` (1 warning - `framerMotion`)
- `__tests__/components/dashboard/MetricCard.test.tsx` (2 warnings - `container` x2)
- `__tests__/components/dashboard/ModelsListCard.test.tsx` (2 errors - `response` used)
- `__tests__/components/layout/Sidebar.test.tsx` (9 warnings - `container` x4, `disablePadding`, `variant`, `waitFor`)
- `__tests__/components/layout/Sidebar.comprehensive.test.tsx` (3 warnings - `container`)
- `__tests__/components/layout/Header.test.tsx` (6 warnings - `container` x4, `CustomThemeProvider`)
- `__tests__/components/layout/Layout.test.tsx` (3 warnings - `container` x2)
- `__tests__/components/layout/MainLayout.test.tsx` (1 warning)

**Fix Strategy:**
Remove unused variables or prefix with underscore if intentionally unused.

---

### 4. **Other Issues** - 20+ errors

**react/display-name:**
- `__tests__/components/charts/PerformanceChart.integration.test.tsx` (1 error)

**Unexpected any. Specify a different type:**
- `__tests__/api/model-templates/route.test.ts` (1 error)

**Parsing error:**
- `__tests__/api/model-templates.test.ts` (1 error) - Line 52:21

**jsx-a11y/role-supports-aria-props:**
- `__tests__/components/layout/Sidebar.test.tsx` (1 warning)

---

## 🎯 Fix Strategy by Priority

### Priority 1: **High Impact, Low Risk** (30 minutes)

**Batch 1: Fix `@typescript-eslint/no-require-imports`** (15 files, 40 errors)

**Approach:** Global find-and-replace for all `require()` in test files

**Command:**
```bash
# Find all require() in test files
find __tests__ -name "*.test.tsx" -o -name "*.test.ts" | xargs grep -n "require("

# Replace with ES6 imports (manual review needed)
```

**File Pattern:**
```typescript
// ❌ BEFORE (CommonJS)
const { render, screen, fireEvent } = require('@testing-library/react');

// ✅ AFTER (ES6)
import { render, screen, fireEvent } from '@testing-library/react';
```

**Impact:**
- Modern ES6 syntax
- Better tree-shaking
- Follows Next.js 16 best practices

---

### Priority 2: **High Impact, Medium Risk** (2-3 hours)

**Batch 2: Fix `@typescript-eslint/no-explicit-any`** (40+ files, 300+ errors)

**Approach:** Create mock type definitions and replace `any`

**Strategy:**

**Option A: Create Mock Interfaces** (Recommended)
```typescript
// Create file: __tests__/types/mock-types.ts
export interface MockModelConfig {
  id: string;
  name: string;
  status: 'idle' | 'loading' | 'running' | 'error';
  type: "llama" | "mistral" | "other";
  template?: string;
  availableTemplates?: string[];
}

export interface MockMetrics {
  cpuUsage: number;
  memoryUsage: number;
  totalRequests: number;
  uptime?: number;
  gpuUsage?: number;
  gpuPowerUsage?: number;
}

// Use in test files
const mockModel: MockModelConfig = {
  id: '1',
  name: 'test-model',
  status: 'running',
  type: 'llama'
} as any; // Type assertion instead of any
```

**Option B: Use Type Assertions** (Quick)
```typescript
// Instead of: const mock: any = { ... }
// Use: const mock = { ... } as ModelConfig;
```

**Option C: Use Generic Types** (Safe)
```typescript
// Instead of: const data: any = mockData;
// Use: const data = mockData as Record<string, unknown>;
```

**Files to Fix:**
1. `__tests__/components/charts/GPUMetricsCard.test.tsx`
2. `__tests__/components/charts/PerformanceChart.test.tsx`
3. `__tests__/components/charts/PerformanceChart.integration.test.tsx`
4. `__tests__/components/dashboard/ModernDashboard.test.tsx`
5. `__tests__/components/dashboard/QuickActionsCard.test.tsx`
6. `__tests__/components/configuration/*.test.tsx` (all 9 files)
7. `__tests__/components/dashboard/hooks/useDashboardMetrics.test.ts`
8. `__tests__/components/layout/*.test.tsx` (all 6 files)
9. `__tests__/components/critical-path.test.tsx`

---

### Priority 3: **Medium Impact, Low Risk** (30 minutes)

**Batch 3: Fix `@typescript-eslint/no-unused-vars`** (30 files, 35 warnings)

**Approach:** Remove or prefix unused variables

**Strategy:**

**Case 1: Remove Unused** (most common)
```typescript
// ❌ BEFORE
const json = await response.json();
// ... json never used

// ✅ AFTER
await response.json();
```

**Case 2: Prefix with Underscore** (if needed for cleanup)
```typescript
// ❌ BEFORE
let container: HTMLElement | null = null;
// ... container never used

// ✅ AFTER
let _container: HTMLElement | null = null; // Intentionally unused
```

**Pattern to Apply:**
- `json` variables in API test files (18 occurrences)
- `container` variables in test files (10 occurrences)
- `act`, `waitFor`, `rerender` in test files (7 occurrences)
- `response` in tests where only status is needed (2 occurrences)

---

### Priority 4: **Low Impact, Low Risk** (15 minutes)

**Batch 4: Fix Other Issues** (5 errors)

**1. Parsing Error** - `__tests__/api/model-templates.test.ts`
```typescript
// Line 52:21 - Parsing error: ',' expected
// Likely missing closing brace or parenthesis
// Fix: Check syntax and add missing delimiter
```

**2. Missing Display Name** - `__tests__/components/charts/PerformanceChart.integration.test.tsx`
```typescript
// ❌ BEFORE
const TestComponent = () => { ... };

// ✅ AFTER
const TestComponent = () => { ... };
TestComponent.displayName = 'TestComponent';
```

**3. Unexpected Any Type** - `__tests__/api/model-templates/route.test.ts`
```typescript
// ❌ BEFORE
const mockData: any = { ... };

// ✅ AFTER
const mockData = { ... } as ApiResponse<MockType>;
```

**4. ARIA Prop Warning** - `__tests__/components/layout/Sidebar.test.tsx`
```typescript
// Line 35:5 - aria-selected not supported on button
// Fix: Remove unsupported aria prop or use correct role
```

---

## 📋 Detailed Implementation Plan

### Phase 1: Fix `require()` Imports (15 minutes)

**Agent:** `coder-agent`

**Tasks:**
1. Create list of all test files with `require()` imports
2. For each file:
   a. Identify all `require()` statements
   b. Convert to ES6 `import` statements
   c. Update variable destructuring to use imports
   d. Test changes don't break functionality
3. Run linter to verify fixes

**Expected Result:** 40 errors eliminated

---

### Phase 2: Create Mock Type Definitions (20 minutes)

**Agent:** `coder-agent`

**Tasks:**
1. Create `__tests__/types/mock-types.ts` with interfaces:
   - `MockModelConfig`
   - `MockMetrics`
   - `MockLogEntry`
   - `MockApiResponse`
   - `MockComponentProps`
   - `MockChartDataPoint`
2. Export all interfaces for reuse across tests
3. Add JSDoc comments for clarity
4. Ensure interfaces match actual component props

**Expected Result:** 150 errors eliminated by using typed mocks

---

### Phase 3: Replace `any` with Type Assertions (1-2 hours)

**Agent:** `coder-agent`

**Tasks:**
1. For each file with `@typescript-eslint/no-explicit-any`:
   a. Identify all `any` type usages
   b. Determine appropriate type to use
   c. Replace with type assertion: `as ModelConfig`
   d. Or use mock interfaces from Phase 2
2. Group files by similarity (same fix for similar files)
3. Test each fix runs properly
4. Run linter to verify all `any` errors resolved

**Files to Process:**
- All component test files (40 files)
- 5-10 errors per file average
- Total: 300+ `any` replacements

**Expected Result:** 300+ errors eliminated

---

### Phase 4: Remove Unused Variables (30 minutes)

**Agent:** `coder-agent`

**Tasks:**
1. For each file with `@typescript-eslint/no-unused-vars`:
   a. Identify unused variable
   b. Remove variable if safe (not used anywhere)
   c. Or prefix with underscore if needed for cleanup
   d. For `json` variables: just inline the `await response.json()`
2. Test changes don't break functionality
3. Verify tests still pass after cleanup

**Pattern Application:**
```typescript
// Pattern 1: Inline unused awaits
const data = await fetch('/api/test'); // ❌ Unused
await fetch('/api/test'); // ✅ Better

// Pattern 2: Remove destructured variables
const { json } = await response.json(); // ❌ json unused
await response.json(); // ✅ Better
```

**Expected Result:** 35 warnings eliminated

---

### Phase 5: Fix Parsing and Display Name (10 minutes)

**Agent:** `coder-agent`

**Tasks:**
1. Fix parsing error in `__tests__/api/model-templates.test.ts`
2. Add `displayName` to anonymous components in `PerformanceChart.integration.test.tsx`
3. Fix ARIA warning in `Sidebar.test.tsx`
4. Verify fixes don't break tests

**Expected Result:** 4 errors/warnings eliminated

---

### Phase 6: Final Validation (15 minutes)

**Agent:** `coder-agent` + automated scripts

**Tasks:**
1. Run `pnpm lint` to count remaining errors
2. Run `pnpm type:check` to ensure no TypeScript errors
3. Run `pnpm test` to ensure all tests still pass
4. Create summary report of fixes
5. Verify build succeeds with `pnpm build`

**Expected Result:** Zero lint errors, clean project

---

## 🤖 Automated Fix Commands

### Command 1: Generate Summary Report
```bash
pnpm lint 2>&1 | tee /tmp/lint-summary.txt
```

### Command 2: Count Errors by File
```bash
pnpm lint 2>&1 | grep -E "^/home/bamer" | awk '{print $1}' | sort | uniq -c | sort -rn
```

### Command 3: Find All `any` Types
```bash
grep -rn "any>" __tests__/ --include="*.test.*" | head -20
```

### Command 4: Find All `require()`
```bash
grep -rn "require(" __tests__/ --include="*.test.*" | head -20
```

---

## 📊 Expected Results After All Phases

### Before Fixing
- **Total Errors:** 350+
- **Total Warnings:** 80+
- **Clean Project:** ❌ NO

### After Fixing
- **Total Errors:** 0 ✅
- **Total Warnings:** 0 ✅
- **Clean Project:** ✅ YES

### Code Quality Metrics

| Metric | Before | After | Target |
|---------|---------|--------|--------|
| **Lint Errors** | 350+ | 0 | 0 |
| **Lint Warnings** | 80+ | 0 | 0 |
| **`any` Types** | 300+ | 0 | 0 |
| **`require()`** imports | 40+ | 0 | 0 |
| **Unused Variables** | 35+ | 0 | 0 |
| **Type Safety** | Poor | Excellent | Excellent |

---

## ⚠️ Risk Assessment

### Low Risk (Safe to Fix)
- ✅ Removing unused variables
- ✅ Converting `require()` to `import` (pure syntax change)
- ✅ Adding `displayName` to components

### Medium Risk (Test Thoroughly)
- ⚠️ Replacing `any` with type assertions (may break if wrong type)
- ⚠️ Fixing parsing errors (ensure logic unchanged)

### High Risk (Manual Review Required)
- 🔴 Changing mock data structure (may break dependent tests)
- 🔴 Removing variables used in assertions (verify not actually unused)

**Mitigation:**
1. Run tests after each phase
2. Commit after each successful phase
3. Rollback if tests fail
4. Use `pnpm lint --fix` where safe

---

## 🚀 Implementation Order

### Sequential Execution (Recommended)
1. **Phase 1: Fix `require()`** (15 min) → Run tests → Verify
2. **Phase 2: Create mock types** (20 min) → Run tests → Verify
3. **Phase 3: Replace `any` with types** (2 hours) → Run tests after batch → Verify
4. **Phase 4: Remove unused variables** (30 min) → Run tests → Verify
5. **Phase 5: Fix parsing/display name** (10 min) → Run tests → Verify
6. **Phase 6: Final validation** (15 min) → Full test suite → Build

**Total Estimated Time:** 3.5 hours

---

## 🎯 Success Criteria

### Phase Completion Criteria
- ✅ All phases completed without errors
- ✅ Tests still passing (100% pass rate)
- ✅ `pnpm lint` shows 0 errors
- ✅ `pnpm type:check` shows 0 errors
- ✅ `pnpm build` succeeds
- ✅ No breaking changes to functionality

### Final Validation Checklist
- ✅ Lint error count: 0
- ✅ Lint warning count: 0
- ✅ TypeScript compilation: Success
- ✅ All tests passing
- ✅ Build successful
- ✅ No console errors during tests
- ✅ Code follows AGENTS.md guidelines

---

## 📋 Phase-by-Phase Execution Plan

### Phase 1: Fix `require()` Imports
**Agent:** coder-agent
**Time Estimate:** 15 minutes
**Files:** 15 files
**Command:** `pnpm lint --fix` for auto-fixable issues, then manual review
**Validation:** `pnpm test` after fixes

### Phase 2: Create Mock Type Definitions
**Agent:** coder-agent
**Time Estimate:** 20 minutes
**New File:** `__tests__/types/mock-types.ts`
**Validation:** Import test file, verify types compile

### Phase 3: Replace `any` with Type Assertions
**Agent:** coder-agent
**Time Estimate:** 1-2 hours
**Approach:** Process 5-10 files at a time, validate with tests
**Validation:** `pnpm lint` after each batch

### Phase 4: Remove Unused Variables
**Agent:** coder-agent
**Time Estimate:** 30 minutes
**Approach:** Automated search + manual review
**Validation:** `pnpm test` to ensure no regressions

### Phase 5: Fix Other Issues
**Agent:** coder-agent
**Time Estimate:** 10 minutes
**Files:** 3 files
**Validation:** `pnpm lint` + `pnpm type:check`

### Phase 6: Final Validation
**Agent:** coder-agent
**Time Estimate:** 15 minutes
**Commands:** Full test suite, build, lint validation
**Validation:** All success criteria met

---

## 🔄 Rollback Plan

If any phase causes test failures:

1. **Identify Failed Files:**
   ```bash
   pnpm test 2>&1 | grep "FAIL"
   ```

2. **Rollback Strategy:**
   ```bash
   # Revert to last working commit
   git revert HEAD

   # Or restore backup
   cp -r __tests__.backup __tests__
   ```

3. **Debug Strategy:**
   - Run single failing test: `pnpm test <file>`
   - Check console for detailed error messages
   - Fix issue incrementally
   - Re-run affected tests

4. **Re-apply Fixes:**
   - Once test passes, re-apply remaining fixes
   - Continue to next phase

---

## 📈 Progress Tracking

### Metrics to Track
| Metric | Current | Target | Status |
|---------|---------|--------|--------|
| Lint Errors | 350+ | 0 | 🔄 In Progress |
| Lint Warnings | 80+ | 0 | 🔄 In Progress |
| `any` Types | 300+ | 0 | 🔄 In Progress |
| Files Modified | 0 | 40+ | 🔄 In Progress |
| Test Pass Rate | N/A | 100% | ⏳ Pending |

### Phase Tracking
- [ ] Phase 1: Fix `require()` (0/15 files)
- [ ] Phase 2: Create mock types (0/1 files)
- [ ] Phase 3: Replace `any` (0/40 files)
- [ ] Phase 4: Remove unused vars (0/30 files)
- [ ] Phase 5: Fix other issues (0/3 files)
- [ ] Phase 6: Final validation (0/1)

---

## ✅ Ready to Execute?

**This plan is READY for your validation.**

**Do you want me to:**
1. ✅ **Execute this plan as-is** - Proceed with all phases sequentially
2. 📝 **Modify specific phases** - Tell me which phases to change
3. 🗑️ **Add more phases** - Any additional cleanup needed?
4. 📊 **Start fresh with different approach** - Alternative strategy?
5. 🎯 **Approve and launch agents** - Deploy to specialized agents now

**Please confirm by saying one of:**
- "Execute plan"
- "Modify phase [X]"
- "Add phase [description]"
- "Different approach"
- "Start with phase [1-6]"

**I will wait for your confirmation before proceeding.** 🎯
