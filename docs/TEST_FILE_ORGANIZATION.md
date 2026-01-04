# Test File Organization Pattern

## Overview

This guide documents the test file organization pattern implemented through the **200-line refactoring pipeline** (tasks T-001 through T-046, completed January 2026). This pattern splits large test files into categorized test files under 200 lines each, improving maintainability, readability, and testability.

**Completed**: 46 test refactoring tasks
**Files Refactored**: ~47 test files
**New Test Files Created**: ~100 test files

## Directory Structure

Large test files are split into categorized test files under 200 lines each:

```
Before:
__tests__/hooks/useFormState.test.ts (400+ lines, 50+ tests)

After:
__tests__/hooks/useFormState/
├── test-utils.ts                (55 lines) - Shared helpers
├── initialization.test.ts        (40 lines) - 8 tests
├── field-operations.test.ts      (181 lines) - 15 tests
├── form-operations.test.ts       (199 lines) - 20 tests
└── edge-cases.test.ts           (82 lines) - 7 tests
```

### Real-World Examples

#### useFormState Hook Tests

```
__tests__/hooks/useFormState/
├── test-utils.ts                (55 lines)
├── initialization.test.ts        (40 lines)
├── field-operations.test.ts      (181 lines)
├── form-operations.test.ts       (199 lines)
└── edge-cases.test.ts           (82 lines)
```

#### useNotification Hook Tests

```
__tests__/hooks/useNotification/
├── test-utils.ts                (36 lines)
├── initialization.test.ts        (45 lines)
├── show-hide.test.ts            (118 lines)
├── auto-hide.test.ts            (111 lines)
├── sequential-persistence.test.ts (73 lines)
├── close-reasons.test.ts        (63 lines)
└── edge-cases.test.ts           (51 lines)
```

#### useWebSocket Hook Tests

```
__tests__/hooks/
├── use-websocket.connection.test.ts (3007 lines - needs split)
├── use-websocket.error-handling.test.ts (1219 lines)
├── use-websocket.events.test.ts (1416 lines)
├── use-websocket.requests.test.ts (2285 lines)
└── use-websocket.test.ts (4849 lines - needs split)
```

## File Naming Convention

### Test Files

Pattern: `{ComponentName}.{category}.test.{ts,tsx}`

**Examples**:
- `MetricCard.rendering.test.tsx`
- `useFormState.field-operations.test.ts`
- `useNotification.auto-hide.test.ts`

### Categories

**Standard Categories**:
- `rendering` - Visual rendering tests
- `data` - Data handling/formatting tests
- `state` - Loading/error state tests
- `integration` - Component integration tests
- `accessibility` - A11y tests
- `performance` - Memoization/performance tests

**Hook-Specific Categories**:
- `initialization` - Hook/component initialization tests
- `operations` - Core functionality operations
- `field-operations` - Field-level operations (forms)
- `form-operations` - Form-specific operations
- `edge-cases` - Boundary conditions and exceptional scenarios

**Feature-Specific Categories**:
- `auto-hide` - Auto-hide functionality
- `show-hide` - Show/hide visibility tests
- `close-reasons` - Close event handling tests
- `sequential-persistence` - State persistence tests
- `connection` - Connection state tests (websockets, APIs)
- `events` - Event handling tests

### Utility Files

- `test-utils.ts` - Shared test helpers and mocks (not a test file)

## Test Utils Export Guidelines (CRITICAL!)

**CRITICAL**: All functions used in test files MUST be exported from test-utils.ts

### ✅ CORRECT: Export all mock data and helper functions

```typescript
// __tests__/hooks/useFormState/test-utils.ts
export interface TestFormValues {
  username: string;
  email: string;
  age: number;
  active: boolean;
  [key: string]: unknown;
}

export const initialValues: TestFormValues = {
  username: "",
  email: "",
  age: 0,
  active: false,
};

export function setupFormHook<T = TestFormValues>(
  values: T = initialValues as T
) {
  return renderHook(() => useFormState<T>(values));
}

export function updateField<T = TestFormValues>(
  hook: ReturnType<typeof setupFormHook<T>>,
  field: keyof T,
  value: unknown
): void {
  act(() => {
    hook.result.current.setValue(field as string, value);
  });
}

export function setError<T = TestFormValues>(
  hook: ReturnType<typeof setupFormHook<T>>,
  errors: Partial<Record<string, string>>
): void {
  act(() => {
    hook.result.current.setErrors(errors);
  });
}

export function resetForm<T = TestFormValues>(
  hook: ReturnType<typeof setupFormHook<T>>
): void {
  act(() => {
    hook.result.current.resetForm();
  });
}
```

### ❌ WRONG: Define but forget to export

```typescript
// __tests__/hooks/useFormState/test-utils.ts
const initialValues = { /* ... */ };        // ❌ Not exported!
const setupFormHook = (values) => { /* ... */ };  // ❌ Not exported!
```

## Example Usage in Test Files

```typescript
// __tests__/hooks/useFormState/form-operations.test.ts
import { setupFormHook, updateField, setError, resetForm } from "./test-utils";

describe("Form Operations", () => {
  it("should update field value", () => {
    const hook = setupFormHook();

    updateField(hook, "username", "testuser");

    expect(hook.result.current.values.username).toBe("testuser");
  });

  it("should reset form to initial values", () => {
    const hook = setupFormHook({ username: "test" });

    resetForm(hook);

    expect(hook.result.current.values.username).toBe("");
  });
});
```

## Common Test Utils Patterns

### 1. Hook Setup Helpers

```typescript
export function setupHook() {
  return renderHook(() => useHook());
}
```

### 2. Mock Data Objects

```typescript
export const mockModels = [
  { id: "1", name: "Model 1", type: "llama" },
  { id: "2", name: "Model 2", type: "llama" },
];

export const mockOptions = {
  ctx_size: 8192,
  batch_size: 512,
};
```

### 3. Action Wrappers

```typescript
export function performAction(hook, ...args) {
  act(() => {
    hook.result.current.action(...args);
  });
}
```

### 4. Assertion Helpers

```typescript
export function assertState(hook, expected) {
  expect(hook.result.current.state).toEqual(expected);
}
```

### 5. Timer Helpers

```typescript
export function advanceTimers(ms: number): void {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}
```

## Success Criteria

When refactoring test files, ensure:

1. ✅ All new test files must be under 200 lines
2. ✅ Original large test files deleted or replaced
3. ✅ All tests pass: `pnpm test <directory>/`
4. ✅ `pnpm lint` passes for all new files
5. ✅ `pnpm type:check` passes
6. ✅ test-utils.ts contains shared mocks and helpers
7. ✅ **CRITICAL**: ALL functions exported from test-utils.ts that test files use
8. ✅ Test coverage is maintained or improved
9. ✅ Test execution time remains acceptable (<2 minutes for full suite)

## Best Practices

### File Organization

- ✅ Extract shared mocks and helpers to test-utils.ts
- ✅ Categorize tests by logical concern (rendering, interactions, errors, edge-cases)
- ✅ Each test file under 200 lines
- ✅ Use descriptive file names indicating test category
- ✅ Maintain same test coverage after split
- ✅ Export ALL helpers from test-utils.ts (critical!)

### Test Structure

```typescript
describe("Feature Category", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should do X", () => {
    const hook = setupHook();

    performAction(hook, "arg1", "arg2");

    assertState(hook, expectedState);
  });
});
```

### Running Tests

```bash
# Run all tests in a directory
pnpm test __tests__/hooks/useFormState/

# Run specific test file
pnpm test __tests__/hooks/useFormState/form-operations.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="should update field"
```

## Benefits of Split Test Organization

### 1. Maintainability
- Each file has single responsibility
- Easier to locate specific test categories
- Clearer code organization

### 2. Testability
- Easier to test individual components/hooks
- Better isolation between test categories
- Simpler test setup and teardown

### 3. Performance
- Faster test execution (can run specific category)
- Reduced test memory footprint
- Parallel test execution potential

### 4. Development
- Faster feedback loops when debugging
- Easier to understand test failures
- Better code reviews (smaller PRs)

## Migration Path for Existing Tests

### Step 1: Identify Large Files

```bash
# Find test files over 200 lines
find __tests__ -name "*.test.ts" -o -name "*.test.tsx" | xargs wc -l | awk '$1 > 200'
```

### Step 2: Analyze Test Categories

Review test file to identify logical boundaries:
- Initialization tests
- Core operations
- Error handling
- Edge cases
- Integration tests

### Step 3: Create Directory Structure

```bash
mkdir -p __tests__/hooks/UseHookName
```

### Step 4: Create test-utils.ts

Extract all shared mocks and helpers:
```typescript
// test-utils.ts
export const mockData = { /* ... */ };
export function setupHook() { /* ... */ };
export function performAction(hook, ...args) { /* ... */ };
```

### Step 5: Split Tests into Categories

Create separate test files for each category:
```typescript
// initialization.test.ts
describe("Hook Initialization", () => {
  // 8 initialization tests
});

// operations.test.ts
describe("Core Operations", () => {
  // 20 operation tests
});

// edge-cases.test.ts
describe("Edge Cases", () => {
  // 7 edge case tests
});
```

### Step 6: Verify and Clean Up

```bash
# Run tests in new directory
pnpm test __tests__/hooks/UseHookName/

# Run lint
pnpm lint __tests__/hooks/UseHookName/

# Run type check
pnpm type:check

# Remove old monolithic file
rm __tests__/hooks/useHookName.test.ts
```

## Related Documentation

- [AGENTS.md](../AGENTS.md) - Complete coding guidelines and 200-line refactoring rules
- [TESTING.md](./TESTING.md) - Comprehensive testing guide with patterns and best practices
- [COVERAGE.md](./COVERAGE.md) - Coverage metrics and improvement strategies

## Summary

The test file organization pattern from the 200-line refactoring pipeline provides:

- ✅ **Structure**: Clear directory-based organization for test files
- ✅ **Consistency**: Standardized naming conventions and categories
- ✅ **Maintainability**: Each file under 200 lines with single responsibility
- ✅ **Quality**: Shared test-utils with exported helpers for reuse
- ✅ **Scalability**: Easy to add new test categories as features grow

**Completed**: 46 test refactoring tasks (T-001 through T-046)
**Impact**: ~47 large test files split into ~100 categorized test files
**Result**: Improved maintainability, faster test execution, better code organization
