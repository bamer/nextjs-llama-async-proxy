# Testing Guide

## Overview

This project uses **Jest 30.2.0** with **React Testing Library** for testing React components, hooks, utilities, and server code. The test suite currently includes **842 test files** with comprehensive test coverage.

## Current Coverage Status

### Overall Metrics (as of December 2025)

| Metric | Coverage | Target | Gap |
|--------|----------|--------|-----|
| **Lines** | 67.47% | 98% | -30.53% |
| **Branches** | 54.63% | 98% | -43.37% |
| **Functions** | 58.43% | 98% | -39.57% |
| **Statements** | ~67% | 98% | -31% |

### Coverage by Category

| Category | Lines | Branches | Functions | Status |
|----------|-------|----------|-----------|--------|
| **Hooks & Contexts** | 95%+ | 95%+ | 95%+ | ✅ Excellent |
| **Lib & Services** | 97%+ | 97%+ | 95%+ | ✅ Excellent |
| **Server Code** | 97%+ | 97%+ | 95%+ | ✅ Excellent |
| **Layout & UI** | 80-100% | 80-100% | 80-100% | ✅ Good |
| **Pages & Config** | ~80% | ~75% | ~75% | ⚠️ Needs Work |
| **Dashboard & Charts** | ~55% | ~56% | ~53% | ❌ Needs Improvement |

### High-Achievement Components

- **WebSocket Provider**: 98% coverage ✅
- **fit-params-service**: 97.97% coverage ✅
- **Button Component**: 100% coverage ✅
- **Validators**: 95%+ coverage ✅
- **Database**: 63/65 tests passing ✅

## Testing Infrastructure

### Test Framework

- **Jest 30.2.0** - Test runner and assertion library
- **ts-jest 29.4.6** - TypeScript support for Jest
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest DOM matchers
- **@testing-library/user-event** - User interaction simulation

### Configuration Files

#### jest.config.ts
```typescript
{
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
  },
}
```

#### jest.setup.ts
Provides global mocks and setup:
- **Request/Response classes** for Next.js API routes
- **MUI v7 component mocks** (Box, Grid, Card, etc.)
- **Lucide React icon mocks**
- **Next.js router mocks**
- **TanStack Query mocks**
- **fetch mock** for API calls
- **localStorage mock**
- **ReadableStream mock** for SSE

### Mocking Strategy

#### MUI v7 Mocks
All MUI components are mocked in `jest-mocks.ts`:
```typescript
// Simplified component rendering to test props and children
jest.mock('@mui/material/Box', () => ({
  default: (props: any) => React.createElement('div', filterMUIProps(props), props.children),
}));
```

#### External Dependencies
- **Socket.IO**: Mocked with event emission capabilities
- **Winston**: Mocked to prevent file I/O during tests
- **Axios**: Mocked via fetch
- **Database**: Tests use in-memory database instances

## Test Structure

### Directory Layout

```
__tests__/
├── actions/              # Server actions tests
│   ├── config-actions.test.ts
│   ├── model-actions.test.ts
│   └── import-models.test.ts
├── app/                  # API route tests
│   └── api/
│       ├── config/route.test.ts
│       ├── models/route.test.ts
│       └── ...
├── components/           # Component tests
│   ├── dashboard/
│   │   ├── ModernDashboard.test.tsx
│   │   ├── MetricCard.test.tsx
│   │   └── ...
│   ├── layout/
│   ├── pages/
│   └── ui/
├── hooks/                # Custom hooks tests
│   ├── use-api.test.ts
│   ├── use-websocket.test.ts
│   └── ...
├── lib/                  # Library and utility tests
│   ├── database.test.ts
│   ├── logger.test.ts
│   ├── validators.test.ts
│   └── ...
├── providers/            # React provider tests
│   ├── websocket-provider.test.tsx
│   └── theme-provider.test.tsx
└── server/               # Server-side code tests
    ├── services/
    │   ├── fit-params-service.test.ts
    │   └── ...
    └── ...
```

### Test File Naming Conventions

- **Component tests**: `ComponentName.test.tsx` (e.g., `MetricCard.test.tsx`)
- **Hook tests**: `use-hook-name.test.ts` (e.g., `use-api.test.ts`)
- **Utility tests**: `utility-name.test.ts` (e.g., `validators.test.ts`)
- **Service tests**: `service-name.test.ts` (e.g., `fit-params-service.test.ts`)

## Test Patterns & Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
describe('FeatureName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do X when Y', () => {
    // Arrange - Set up test data and mocks
    const mockProps = { title: 'Test', value: 42 };
    jest.fn().mockReturnValue('result');

    // Act - Execute the code under test
    const result = functionUnderTest(mockProps);

    // Assert - Verify expected outcomes
    expect(result).toBe('expected value');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
```

### 2. Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MetricCard from '@/components/dashboard/MetricCard';

describe('MetricCard', () => {
  it('should render metric with correct value', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MetricCard title="CPU Usage" value={75} unit="%" />
      </QueryClientProvider>
    );

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should handle trend display', () => {
    render(<MetricCard title="Memory" value={8} unit="GB" trend={5.2} />);

    expect(screen.getByText('+5.2%')).toBeInTheDocument();
  });
});
```

### 3. Hook Testing

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi } from '@/hooks/use-api';

describe('useApi', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => useApi('/api/models'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});
```

### 4. Async Testing

```typescript
it('should handle async operations', async () => {
  const mockPromise = Promise.resolve({ data: 'test' });

  await act(async () => {
    await waitFor(() => {
      expect(component).toBeInTheDocument();
    });
  });
});
```

### 5. Mocking External Dependencies

```typescript
// Mock API calls
jest.mock('@/utils/api-client', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock hooks
jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => ({
    sendMessage: jest.fn(),
    isConnected: true,
  }),
}));

// Mock database
jest.mock('@/lib/database', () => ({
  getModels: jest.fn(),
  saveModel: jest.fn(),
}));
```

### 6. Testing Error Handling

```typescript
it('should handle errors gracefully', async () => {
  (apiClient.get as jest.Mock).mockRejectedValue(new Error('API Error'));

  const { result } = renderHook(() => useApi('/api/models'));

  await waitFor(() => {
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('API Error');
  });
});
```

### 7. Testing User Interactions

```typescript
it('should call onToggle when button clicked', () => {
  const onToggle = jest.fn();
  render(<ModelItem onToggle={onToggle} />);

  const button = screen.getByRole('button');
  fireEvent.click(button);

  expect(onToggle).toHaveBeenCalledTimes(1);
});
```

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests without coverage (faster for debugging)
pnpm test --no-coverage

# Run specific test file
pnpm test __tests__/components/dashboard/MetricCard.test.tsx

# Run tests matching a pattern
pnpm test -- test-name-pattern

# Run tests in verbose mode
pnpm test --verbose
```

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML coverage report
open coverage/lcov-report/index.html

# Generate coverage for specific files
pnpm test:coverage -- path/to/file.test.ts
```

### Common Options

```bash
# Stop on first failure
pnpm test --bail

# Run tests matching specific pattern
pnpm test --testNamePattern="should do X"

# Update snapshots
pnpm test -u

# Clear Jest cache
pnpm test --clearCache
```

## Testing Specific Areas

### 1. Testing React Components

**Best Practices:**
- Test behavior, not implementation details
- Use user-centric queries (getByRole, getByLabelText)
- Test user interactions with fireEvent or user-event
- Mock external dependencies (APIs, hooks, contexts)

**Example:**
```typescript
describe('ModelConfigDialog', () => {
  it('should render form with initial values', () => {
    const mockModel = { id: '1', name: 'Test Model', type: 'llama' };

    render(<ModelConfigDialog model={mockModel} />);

    expect(screen.getByLabelText('Model Name')).toHaveValue('Test Model');
  });

  it('should save on form submit', async () => {
    const onSave = jest.fn();
    render(<ModelConfigDialog model={mockModel} onSave={onSave} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
```

### 2. Testing Custom Hooks

**Best Practices:**
- Use `renderHook` from @testing-library/react
- Test hook return values and state changes
- Test hook lifecycle (mount, update, unmount)
- Mock hook dependencies

**Example:**
```typescript
describe('useWebSocket', () => {
  it('should connect and receive messages', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost'));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    act(() => {
      mockSocket.emit('message', { type: 'metrics', data: {} });
    });

    expect(result.current.lastMessage).toEqual({ type: 'metrics', data: {} });
  });
});
```

### 3. Testing API Routes

**Best Practices:**
- Test both success and error cases
- Mock Request/Response objects
- Validate request/response schemas
- Test authentication and authorization

**Example:**
```typescript
import { GET, POST } from '@/app/api/models/route';

describe('/api/models', () => {
  it('GET should return list of models', async () => {
    const mockRequest = new Request('http://localhost/api/models');

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });

  it('POST should create new model', async () => {
    const mockRequest = new Request('http://localhost/api/models', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', type: 'llama' }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});
```

### 4. Testing Database Operations

**Best Practices:**
- Use in-memory database for tests
- Clean up between tests
- Test CRUD operations thoroughly
- Test transactions and rollback

**Example:**
```typescript
describe('Database', () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.initialize();
  });

  afterEach(() => {
    db.close();
  });

  it('should save and retrieve model', () => {
    const model = { name: 'Test', type: 'llama', status: 'running' };
    const id = db.saveModel(model);

    const retrieved = db.getModel(id);
    expect(retrieved).toEqual({ id, ...model });
  });
});
```

### 5. Testing WebSocket Communication

**Best Practices:**
- Mock Socket.IO client
- Test message sending and receiving
- Test reconnection logic
- Test event handlers

**Example:**
```typescript
describe('WebSocketProvider', () => {
  it('should send message on sendMessage call', () => {
    const mockSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    };

    const { result } = renderHook(() => useWebSocket('ws://localhost'));

    act(() => {
      result.current.sendMessage('request_metrics', {});
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('request_metrics', {});
  });
});
```

## Troubleshooting Common Issues

### 1. "ReferenceError: Request is not defined"

**Cause:** Missing Request/Response polyfills for Next.js API routes

**Solution:** Ensure `jest.setup.ts` includes:
```typescript
(global as any).Request = class Request {
  url: string;
  method: string;
  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.method = init?.method ?? 'GET';
  }
};
```

### 2. MUI Component Rendering Issues

**Cause:** Missing MUI mocks or incorrect mock setup

**Solution:** Ensure `jest-mocks.ts` is loaded and components are mocked:
```typescript
jest.mock('@mui/material', () => require('./jest-mocks').muiMocks);
```

### 3. "act() warning" for async operations

**Cause:** State updates outside of act() wrapper

**Solution:** Wrap async operations in `act()`:
```typescript
await act(async () => {
  await waitFor(() => {
    expect(element).toBeInTheDocument();
  });
});
```

### 4. Module Resolution Errors

**Cause:** Incorrect module paths or missing moduleNameMapper

**Solution:** Check `jest.config.ts`:
```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@/app/(.*)$': '<rootDir>/app/$1',
},
```

### 5. Test Timeout Errors

**Cause:** Long-running tests or infinite loops

**Solution:** Increase timeout or fix slow operations:
```typescript
it('should complete operation', async () => {
  // Increase timeout for this test only
}, 10000); // 10 seconds
```

## Maintaining Test Coverage

### Adding New Tests

1. **Identify Uncovered Code:**
   ```bash
   pnpm test:coverage
   open coverage/lcov-report/index.html
   ```

2. **Review Coverage Report:**
   - Click through files to find uncovered lines
   - Prioritize critical paths and error handling

3. **Write Tests for Uncovered Code:**
   ```typescript
   // Example: Test uncovered error path
   it('should handle database connection errors', () => {
     (db.connect as jest.Mock).mockRejectedValue(new Error('Connection failed'));

     const result = loadModels();

     expect(result.error).toBe('Connection failed');
   });
   ```

4. **Verify Coverage Improvement:**
   ```bash
   pnpm test:coverage -- path/to/file.test.ts
   ```

### Coverage Goals

**Phase 1 (Current):**
- ✅ Achieve 67.47% line coverage baseline
- ✅ Hooks and Services: 95%+ coverage ✅
- ⚠️ Layout & UI: 80%+ coverage (in progress)
- ❌ Dashboard & Charts: 55% (needs improvement)

**Phase 2 (Target):**
- 🎯 98% line coverage across all categories
- 🎯 98% branch coverage
- 🎯 98% function coverage
- 🎯 98% statement coverage

### Coverage Improvement Strategies

1. **Focus on Low-Coverage Areas:**
   - Dashboard components (~55% coverage)
   - Chart components
   - Page components

2. **Test Edge Cases:**
   - Null/undefined values
   - Empty arrays/objects
   - Error scenarios
   - Boundary conditions

3. **Test Integration Points:**
   - WebSocket message handling
   - API request/response flow
   - State management interactions

4. **Add Integration Tests:**
   - End-to-end user workflows
   - Component interaction patterns
   - Data flow through application

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test --changed && pnpm lint"
    }
  }
}
```

## Testing Resources

### Official Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [ts-jest](https://kulshekhar.github.io/ts-jest/)

### Testing Best Practices

- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [Write Tests. Not Too Many. Mostly Integration.](https://kentcdodds.com/blog/write-tests)

### Project-Specific Resources

- [AGENTS.md](../AGENTS.md) - Coding guidelines and standards
- [COVERAGE.md](./COVERAGE.md) - Coverage metrics and reporting
- [README.md](../README.md) - Project overview

## Summary

This testing guide provides:
- ✅ Current coverage metrics and status
- ✅ Testing infrastructure setup
- ✅ Test patterns and best practices
- ✅ Running tests and troubleshooting
- ✅ Coverage improvement strategies
- ✅ CI/CD integration examples

**Goal:** Achieve 98% coverage across all metrics (lines, branches, functions, statements) while maintaining test quality and reliability.

**Current Status:** 67.47% line coverage with high-achievement components (WebSocket: 98%, fit-params-service: 97.97%, Button: 100%).
