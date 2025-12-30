# Contributing to Next.js Llama Async Proxy

Thank you for your interest in contributing to the Next.js Llama Async Proxy project! This document provides guidelines and instructions for contributing effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy toward other contributors

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed (24.11.1 recommended)
- **pnpm** package manager
- **Git** for version control
- **A code editor** (VS Code recommended with extensions)

### Initial Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/nextjs-llama-async-proxy.git
cd nextjs-llama-async-proxy

# 2. Install dependencies
pnpm install

# 3. Create llama-server-config.json
cat > llama-server-config.json << EOF
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/path/to/your/models",
  "serverPath": "/path/to/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
EOF

# 4. Start development server
pnpm dev
```

### Development Environment

The project uses:

- **Next.js 16.1.0** with App Router
- **React 19.2.3** with Server Components
- **TypeScript 5.9.3** with strict mode
- **MUI v8.3.6** for UI components
- **Zustand 5.0.9** for client state
- **@tanstack/react-query 5** for server state
- **Socket.IO 4.8** for real-time communication

---

## Development Workflow

### 1. Create a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b bugfix/issue-number

# Create hotfix branch
git checkout -b hotfix/critical-fix
```

**Branch Naming Convention:**
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or changes

### 2. Make Your Changes

Follow the [Code Standards](#code-standards) and [Testing Guidelines](#testing-guidelines).

### 3. Commit Your Changes

Follow [conventional commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add model auto-discovery feature"

# Bug fix
git commit -m "fix: resolve memory leak in model loading"

# Documentation
git commit -m "docs: update API documentation"

# Refactoring
git commit -m "refactor: simplify config management"

# Performance
git commit -m "perf: optimize database queries"

# Tests
git commit -m "test: add unit tests for logger module"
```

**Commit Message Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### 4. Sync with Upstream

```bash
# Add upstream remote (first time only)
git remote add upstream https://github.com/original-owner/nextjs-llama-async-proxy.git

# Fetch latest changes
git fetch upstream

# Rebase your branch
git rebase upstream/main

# Resolve conflicts if any
# ...
```

---

## Code Standards

### TypeScript & Types

```typescript
// ✅ Use interfaces for objects
interface ModelConfig {
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'loading';
}

// ❌ Avoid type aliases for objects
type ModelConfig = {
  name: string;
  type: string;
};

// ✅ Type function parameters and return types
function getModelById(id: string): Model | null {
  // implementation
}

// ✅ Use proper types instead of any
function processData(data: unknown): Result {
  // implementation
}

// ❌ Never use any
function processData(data: any) {
  // bad practice
}
```

### React Components

```tsx
// ✅ Functional components only
"use client";

import { useState, useEffect } from "react";

export function MetricCard({ value, label }: MetricCardProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // effect logic
  }, []);

  return (
    <div className="card">
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

// ✅ Use hooks for state
const [count, setCount] = useState(0);

// ✅ Use hooks for side effects
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);

// ✅ Use hooks for memoization
const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]);

const handleClick = useCallback(() => {
  doSomething();
}, []);
```

### MUI v8 Components

```tsx
// ✅ CORRECT (MUI v8 syntax)
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
  <Box sx={{ padding: 2 }}>
    <Typography variant="h6">Title</Typography>
  </Box>
</Grid>

// ❌ WRONG (MUI v6 syntax)
<Grid item xs={12} sm={6} md={4}>
  <Box style={{ padding: '16px' }}>
    <Typography variant="h6">Title</Typography>
  </Box>
</Grid>
```

### API Routes

```typescript
// ✅ Use NextResponse
import { NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

export async function GET(): Promise<NextResponse> {
  try {
    const data = await fetchData();
    logger.info("Data fetched successfully");

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Error fetching data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
```

### State Management

```typescript
// ✅ Use Zustand for client state
import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark }))
}));

// ✅ Use React Query for server state
import { useQuery } from '@tanstack/react-query';

function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: fetchModels,
    refetchInterval: 30000, // 30 seconds
    staleTime: 5000
  });
}
```

### Imports & Formatting

```typescript
// ✅ Import order: builtin → external → internal
import { useState, useEffect } from 'react'; // builtin
import axios from 'axios'; // external
import { Button } from '@mui/material'; // external
import { getLogger } from '@/lib/logger'; // internal (@/)
import { fetchModels } from './api'; // sibling

// ✅ Double quotes
import { Component } from "@/components/Component";

// ❌ Single quotes (avoid)
import { Component } from '@/components/Component';

// ✅ Semicolons always
const x = 5;
const y = 10;

// ❌ No semicolons (avoid)
const x = 5
const y = 10
```

### Error Handling

```typescript
// ✅ Proper error handling
async function loadModel(name: string): Promise<void> {
  try {
    await api.startModel(name);
    logger.info(`Model ${name} loaded successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to load model ${name}:`, error);
    throw new Error(`Failed to load model: ${message}`);
  }
}

// ✅ Use ErrorBoundary for React errors
<ErrorBoundary
  fallback={<ErrorFallback message="Something went wrong" />}
>
  <Component />
</ErrorBoundary>
```

---

## Testing Guidelines

### Test Coverage Status

**Current Coverage: 67.47% lines** (Target: 98%)

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Lines** | 67.47% | 98% | -30.53% |
| **Branches** | 54.63% | 98% | -43.37% |
| **Functions** | 58.43% | 98% | -39.57% |
| **Statements** | ~67.47% | 98% | -31% |

### Testing Documentation

For comprehensive testing guidelines, patterns, and best practices:

- **[TESTING.md](TESTING.md)** - Complete testing guide with patterns, examples, and troubleshooting
- **[COVERAGE.md](COVERAGE.md)** - Detailed coverage metrics, reporting, and improvement strategies

### Test Coverage Target

**Goal: 98% coverage** for:
- Statements
- Branches
- Functions
- Lines

**Current Status:**
- ✅ Hooks & Contexts: 95%+ coverage
- ✅ Lib & Services: 97%+ coverage
- ✅ Server Code: 97%+ coverage
- ✅ Layout & UI: 80-100% coverage
- ⚠️ Pages & Config: ~80% coverage (needs improvement)
- ❌ Dashboard & Charts: ~55% coverage (critical)

### Test Structure

```typescript
// __tests__/components/MetricCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MetricCard } from '@/components/dashboard/MetricCard';

describe('MetricCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the metric value and label', () => {
    render(<MetricCard value={75} label="CPU" />);

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<MetricCard value={0} label="CPU" isLoading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    render(<MetricCard value={1500000000} label="Memory" />);

    expect(screen.getByText('1.5 GB')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test __tests__/components/MetricCard.test.tsx

# Run tests matching pattern
pnpm test -- --testNamePattern="should load"
```

### Testing Best Practices

1. **Mock External Dependencies**
```typescript
// ✅ Mock axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
}));

// ✅ Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn()
  }))
}));
```

2. **Test Isolation**
```typescript
beforeEach(() => {
  // Reset state before each test
  jest.clearAllMocks();
  localStorage.clear();
});
```

3. **Descriptive Test Names**
```typescript
// ✅ Good: Describes what should happen
it('should render error message when API fails', () => { });

// ❌ Bad: Doesn't describe behavior
it('test error', () => { });
```

4. **Arrange-Act-Assert Pattern**
```typescript
it('updates model status when stop button is clicked', () => {
  // Arrange
  const model = createMockModel();
  render(<ModelCard model={model} />);

  // Act
  fireEvent.click(screen.getByText('Stop'));

  // Assert
  expect(model.status).toBe('stopped');
});
```

---

## Documentation

### Code Comments

```typescript
// ✅ JSDoc for functions with parameters and return types
/**
 * Fetches model data from the API
 * @param modelId - The unique identifier of the model
 * @returns Promise resolving to model data or null if not found
 * @throws Error if the API request fails
 */
async function getModelById(modelId: string): Promise<Model | null> {
  const response = await api.get(`/models/${modelId}`);
  return response.data;
}

// ✅ Inline comments for complex logic
// Calculate exponential backoff for reconnection
// Formula: min(initialDelay * Math.pow(2, attempt), maxDelay)
const delay = Math.min(
  INITIAL_DELAY * Math.pow(2, attempt),
  MAX_DELAY
);
```

### Documentation Updates

When you add or modify features:

1. **Update `docs/API.md`** for new/changed API endpoints
2. **Update `docs/ARCHITECTURE.md`** for architectural changes
3. **Update inline JSDoc comments** for function/class changes
4. **Add examples** for new features in relevant docs

---

## Pull Request Process

### Before Submitting

1. **Run all tests**
   ```bash
   pnpm test
   ```

2. **Check coverage** (current: 67.47%, target: 98%)
   ```bash
   pnpm test:coverage
   open coverage/lcov-report/index.html  # View detailed report
   ```
   *Note: Coverage should not decrease below current baseline. See [COVERAGE.md](COVERAGE.md) for improvement strategies.*

3. **Run linting**
   ```bash
   pnpm lint
   ```

4. **Type check**
   ```bash
   pnpm type:check
   ```

5. **Build project**
   ```bash
   pnpm build
   ```

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill in the PR template:**

   **Title:** [Type] Brief description

   **Description:**
   - What does this PR do?
   - Why is it needed?
   - What changes are made?

   **Related Issue:** #issue-number

   **Testing:**
   - [ ] All tests pass
   - [ ] Coverage ≥ 98%
   - [ ] No lint errors
   - [ ] TypeScript types pass

   **Checklist:**
   - [ ] Code follows project standards
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)

### PR Review Process

1. **Automated Checks:**
   - CI pipeline runs tests
   - Coverage report generated
   - Linting checks

2. **Code Review:**
   - Maintainers review code
   - Provide feedback and suggestions
   - Address all review comments

3. **Approval & Merge:**
   - At least one maintainer approval
   - All checks pass
   - Merge when ready

### Review Guidelines

When reviewing others' code:

- Be constructive and specific
- Focus on code quality and maintainability
- Ask questions if something is unclear
- Suggest improvements politely
- Test changes locally if possible

---

## Issue Reporting

### Bug Reports

**Template:**

```markdown
**Description:** Brief description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior:** What should happen

**Actual Behavior:** What actually happens

**Screenshots:** If applicable

**Environment:**
- OS: [e.g., Ubuntu 22.04]
- Node.js version: [e.g., 18.17.0]
- Browser: [e.g., Chrome 120]

**Additional Context:** Logs, stack traces, etc.
```

### Feature Requests

**Template:**

```markdown
**Is your feature request related to a problem?**
Brief description of the problem

**Describe the solution you'd like:**
Clear description of what you want to happen

**Describe alternatives you've considered:**
Other solutions or features you considered

**Additional context:**
Any other context, screenshots, or examples
```

---

## Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes for significant contributions
- GitHub contributor badges

---

## Questions?

- Check existing documentation in `/docs`
- Review closed issues for similar problems
- Ask in GitHub discussions
- Contact maintainers via GitHub issues

---

**Happy Contributing! 🚀**
