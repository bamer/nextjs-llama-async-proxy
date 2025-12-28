# Test Configuration Issues Report

## Critical Issues Found

### 1. **Missing Analytics Module Import** (analytics.test.ts)
**Severity**: CRITICAL
**File**: `__tests__/utils/analytics.test.ts`
**Issue**: The test file mocks `@/lib/monitor` and `path`, but **never imports or defines the `analytics` object** that's being tested.

**Lines affected**: All test cases referencing `analytics.*` (lines 25, 35, 48, 64, 77, 92, 110, 120, 140, 152, 162, 178, etc.)

**Error**: `ReferenceError: analytics is not defined`

**Root cause**: Line 1 imports `captureMetrics`, but there's no import for an `analytics` module itself. The test needs to either:
- Import an `analytics` module from a location like `@/lib/analytics` or `@/utils/analytics`
- Mock the analytics module properly

---

### 2. **Undefined Mock Methods** (analytics.test.ts)
**Severity**: HIGH
**File**: `__tests__/utils/analytics.test.ts`
**Issue**: Tests attempt to use methods that don't exist on the mock:
- `mockCaptureMetrics.getEvents.mockResolvedValue()`
- `mockCaptureMetrics.getMetrics.mockResolvedValue()`
- `mockCaptureMetrics.getSessions.mockResolvedValue()`
- `mockCaptureMetrics.clear.mockResolvedValue()`
- `mockCaptureMetrics.clearEvents.mockResolvedValue()`
- `mockCaptureMetrics.clearSessions.mockResolvedValue()`

**Lines affected**: 194, 211, 219, 239, 251, 263, 277, 285, 295, 300, 301

**Error**: `TypeError: Cannot read properties of undefined (reading 'mockResolvedValue')`

**Root cause**: The mock is created as a single function without these method properties. The mock needs to include all expected methods.

---

### 3. **Test Timeout Issues** (Multiple files)
**Severity**: HIGH
**Files**: Multiple test files, especially `client-model-templates-optimized.test.ts`
**Issue**: Tests exceed 5000ms timeout (the default Jest timeout)

**Affected tests**:
- `getModelTemplates › should load model templates`
- `getModelTemplate › should return template for existing model`
- `getModelTemplate › should return undefined for non-existent model`
- `getModelTemplatesSync › should return cached templates if available`
- Error handling tests
- Integration scenario tests

**Root cause**: 
1. Async operations in tests may not be properly awaited
2. No timeout specification added to long-running tests
3. Possible infinite loops or unresolved promises

---

### 4. **Coverage Threshold Too High**
**Severity**: MEDIUM
**File**: `jest.config.ts` (lines 22-27)
**Issue**: Coverage thresholds set to 98% (branches, functions, lines, statements)

```javascript
coverageThreshold: {
  global: {
    branches: 98,      // <- very high
    functions: 98,     // <- very high
    lines: 98,         // <- very high
    statements: 98,    // <- very high
  },
},
```

**Problem**: With 1051 failing tests, achieving 98% coverage is impossible. This is causing test suite failures.

**AGENTS.md specifies**: 70% threshold
**Current config**: 98% threshold

---

### 5. **Dual Setup Files**
**Severity**: MEDIUM
**Files**: `jest.setup.ts` and `jest.setup.js`
**Issue**: Two setup files exist with overlapping functionality

- `jest.setup.ts` (TypeScript): 132 lines - handles Request/Response mocks, ReadableStream, MUI mocks, next-themes, ThemeContext
- `jest.setup.js` (JavaScript): 28 lines - handles @testing-library/jest-dom, next/navigation, fetch, localStorage

**jest.config.ts only references**: `jest.setup.ts`

**Problem**: `jest.setup.js` code is never executed. Features like `@testing-library/jest-dom` initialization might be missing, causing DOM assertion issues.

---

### 6. **Missing Analytics Module**
**Severity**: CRITICAL
**Issue**: The test references an `analytics` module that doesn't seem to exist or isn't properly exported
**Expected locations to check**:
- `src/lib/analytics.ts`
- `src/utils/analytics.ts`
- `src/services/analytics.ts`

---

### 7. **MUI v7 Prop Warnings in Tests**
**Severity**: LOW
**Issue**: Tests render components passing MUI v7 props that aren't recognized by jsdom
**Errors seen**:
- `React does not recognize the 'primaryTypographyProps' prop on a DOM element`
- `React does not recognize the 'disablePadding' prop on a DOM element`

**File**: `__tests__/components/layout/Sidebar.comprehensive.test.tsx` (line 47)

**Root cause**: MUI component props are passed through to DOM elements in tests. The mock components in `jest-mocks.ts` filter some props but not all MUI-specific ones.

---

## Summary Statistics

- **Total test suites**: 188 (102 failed, 86 passed)
- **Total tests**: 4792 (1051 failed, 3741 passed)
- **Success rate**: ~78%

---

## Recommended Actions (in order of priority)

1. **Import the analytics module** or create it if missing
2. **Add missing mock methods** to `mockCaptureMetrics`
3. **Lower coverage threshold** from 98% to 70% (per AGENTS.md)
4. **Consolidate setup files** - merge `jest.setup.js` into `jest.setup.ts`
5. **Add timeout to slow tests** or optimize async code
6. **Filter MUI props** in jest-mocks.ts for jsdom safety
7. **Verify analytics module location** - check src directory structure

---

## Files to Review

- `__tests__/utils/analytics.test.ts` - primary issue file
- `jest.config.ts` - coverage threshold and setup file config
- `jest.setup.ts` and `jest.setup.js` - consolidate these
- `jest-mocks.ts` - add MUI prop filtering
- Source code for `analytics` module - verify it exists
