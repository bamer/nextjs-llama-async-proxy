# AGENTS.md - Agent Guidelines for this Repository

This document provides guidelines for agentic coding assistants working in this Next.js 16 + React 19.2 codebase.
**Critical**: never DELETE this file for whatever reason.

## Build / Lint / Test Commands

```bash
# Development
pnpm dev              # Start dev server with tsx

# Build
pnpm build            # Production build (Next.js 16 uses Turbopack, not webpack)

# Linting
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix lint issues

# Type Checking
pnpm type:check       # TypeScript type check (tsc --noEmit)

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Generate coverage report (70% threshold)

# Run single test file
pnpm test <test-file-path>
# Example: pnpm test src/components/dashboard/MetricCard.test.tsx
```

## Code Style Guidelines

### Imports & Formatting

- **Critical**:it's mandatory that you don't make <tool_call> inside  <thinking> block if you do the whole server will crash this is a benchmarking evaluating framework bug.
- the dev server is always already launched and refresh, don't kill the dev server for spawn a new one, use the one already launched.,
- Use `"use client";` directive at the top of client-side components (first line)
- Import order: builtin → external → internal (@/ imports) → parent → sibling → index
- Group internal imports by path (@/components, @/hooks, @/services, etc.)
- Use path aliases defined in tsconfig.json: `@/components/*`, `@/lib/*`, `@/hooks/*`, etc.
- Double quotes only (`"not 'single quotes'"`)
- Always use semicolons
- 2-space indentation
- Trailing commas in multi-line objects/arrays
- Max line width: 100 characters
- Object-curly-spacing: `always` (spaces inside {})
- Array-bracket-spacing: `never` (no spaces inside [])
- **Keep all files < 200 lines** (see "200-Line Refactoring Guidelines" below)
- Use composition pattern
- Each module should have single responsibility

###  Service Layer State and API call

- Pure API calls only


### TypeScript & Types

- Strict mode enabled - always type function parameters, return types preferred but not required
- Prefer interfaces over type aliases for objects (use `interface ModelConfig` not `type ModelConfig`)
- Use Zod schemas for runtime validation (see `src/lib/config-service.ts`)
- Use global type definitions in `src/types/global.d.ts`
- Export types from `src/types/index.ts` for reusability
- Utility types: `Nullable<T>`, `Optional<T>`, `AsyncReturnType<T>` available globally
- Never use `any` - use specific types instead or `unknown`

### Naming Conventions

- Components: PascalCase (`MetricCard.tsx`, `ModernDashboard.tsx`)
- Hooks: camelCase with `use` prefix (`useApi.ts`, `useWebSocket.ts`)
- Services/Classes: PascalCase (`ApiService`, `ConfigService`)
- Functions/Variables: camelCase (`getModels`, `isLoading`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`, `API_BASE_URL`)
- Private class members: underscore prefix (`_privateMethod`)
- File names match export names: `MetricCard.tsx` exports `MetricCard`
- Test files: `*.test.ts` or `*.test.tsx` in `__tests__/` directories

### Error Handling

- API responses use `ApiResponse<T>` interface: `{ success: boolean; data?: T; error?: {...}; timestamp: string }`
- Wrap async API calls in try-catch blocks
- Throw descriptive errors: `throw new Error("Failed to fetch models")`
- Use ErrorBoundary component for catching React errors (`src/components/ui/error-boundary.tsx`)
- Console logging: only `console.error()` and `console.warn()` allowed
- No debugger statements in production code

### React Patterns

- Functional components only (no class components except ErrorBoundary)
- Use hooks for state and side effects (`useState`, `useEffect`, `useMemo`, `useCallback`)
- Use `useStore` from Zustand for global state
- Use `@tanstack/react-query` for server state (see `useApi.ts`)
- Memoize expensive computations and event handlers
- Use `NextResponse.json()` for API routes, not `res.json()`
- Client components must have `"use client";` at the very top

### API Patterns

- Use `apiClient` from `src/utils/api-client.ts` for HTTP requests
- Service layer pattern: `src/services/api-service.ts` wraps `apiClient` with typed methods
- API routes in `app/api/` directory (Next.js 16 App Router)
- Use Zod for request validation in API routes
- Query keys in React Query: `['models']`, `['metrics']`, `['logs']`
- Refetch intervals: models 30s, metrics 10s, logs 15s

### MUI v8 Specific Rules

**Critical**: MUI v8 deprecated the `item` prop on Grid components. Always use `size` prop instead:

```tsx
// ❌ WRONG (MUI v6 syntax)
<Grid item xs={12} sm={6} md={4}>

// ✅ CORRECT (MUI v8 syntax)
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
```

- Use `sx` prop for styling, avoid inline style objects
- Use `@mui/material-nextjs` for Next.js 16 integration
- Use `@mui/x-charts` for charts (version 8.23.0+)
- Theme from `@/contexts/ThemeContext` provides `isDark` boolean

### Testing Patterns

- Use Jest with `jsdom` environment
- Test files: `__tests__/**/*.{test,spec}.{ts,tsx}` or `**/*.test.{ts,tsx}`
- Use `jest.mock()` for external dependencies
- Describe blocks for grouping, `it()` or `test()` for individual tests
- BeforeEach for resetting state
- Expectations: `expect(...).toBe()`, `expect(...).toHaveProperty()`
- Mock functions with `jest.fn()` and `.mockReturnValue()`
- Test coverage threshold: 70% for branches, functions, lines, statements
- **Split large test files** by logical category (see "200-Line Refactoring Guidelines")
- Test file naming: `{ComponentName}.{category}.test.{ts,tsx}` (e.g., `MetricCard.rendering.test.tsx`)

### File Organization

```
src/
├── components/          # React components
│   ├── dashboard/      # Dashboard-specific components
│   ├── layout/         # Layout components (Header, Sidebar)
│   ├── ui/             # Reusable UI components
│   └── pages/          # Page-level components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries (analytics, logger, monitor)
├── services/           # API service layer
├── contexts/           # React contexts (Theme)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions (api-client)
└── config/             # Configuration files
```

### 200-Line Refactoring Guidelines

**Critical Rule**: All source files must be kept under 200 lines to maintain maintainability, readability, and testability. When a file approaches this limit, it must be refactored using the patterns below.

#### When to Refactor

Refactor when:
- A component file approaches 200 lines (aim for <180 lines to be safe)
- A test file has more than 20-25 test cases
- Multiple logical concerns are mixed in one file
- Test setup code exceeds 50 lines
- Component has complex nested sub-components (>3 levels)

#### Component Extraction Pattern

Extract sub-components into their own files following this pattern:

```tsx
// ❌ BEFORE: Large component with inline sub-components
// src/pages/models/ModelsPage.tsx (220+ lines)
export default function ModelsPage() {
  return (
    <div>
      <Header />
      <Grid>
        {models.map(model => (
          <div key={model.id}>
            <Typography>{model.name}</Typography>
            <ModelActions model={model} />
            <ModelConfig model={model} />
          </div>
        ))}
      </Grid>
    </div>
  );
}

// ✅ AFTER: Extracted sub-components
// src/pages/models/ModelsPage.tsx (<150 lines)
import { MemoizedModelItem } from '@/components/models/MemoizedModelItem';

export default function ModelsPage() {
  return (
    <div>
      <Header />
      <Grid>
        {models.map(model => (
          <MemoizedModelItem key={model.id} model={model} />
        ))}
      </Grid>
    </div>
  );
}

// src/components/models/MemoizedModelItem.tsx (new file)
export const MemoizedModelItem = React.memo(function ModelItem({ model }) {
  return (
    <div>
      <ModelInfo model={model} />
      <ModelActions model={model} />
      <ModelConfig model={model} />
    </div>
  );
});
```

**Key benefits**:
- Each component has single responsibility
- Easier to test individual components
- Better performance with memoization
- Clearer code organization

#### Test File Splitting Pattern

When test files grow large, split them by logical category:

```typescript
// ❌ BEFORE: One monolithic test file
// __tests__/src/components/dashboard/MetricCard.test.tsx (400+ lines, 50+ tests)

describe('MetricCard', () => {
  // Rendering tests (15 tests)
  // Metric data tests (12 tests)
  // Loading state tests (8 tests)
  // Error handling tests (6 tests)
  // Theme tests (5 tests)
  // Accessibility tests (4 tests)
});

// ✅ AFTER: Split by logical category
// __tests__/src/components/dashboard/MetricCard/MetricCard.rendering.test.tsx
describe('MetricCard Rendering', () => {
  it('renders correctly', () => { /* ... */ });
  it('displays title', () => { /* ... */ });
  // 15 rendering tests
});

// __tests__/src/components/dashboard/MetricCard/MetricCard.data.test.tsx
describe('MetricCard Data Handling', () => {
  it('displays metric value', () => { /* ... */ });
  it('formats numbers correctly', () => { /* ... */ });
  // 12 data tests
});

// __tests__/src/components/dashboard/MetricCard/MetricCard.state.test.tsx
describe('MetricCard State Management', () => {
  it('shows loading indicator', () => { /* ... */ });
  it('handles error state', () => { /* ... */ });
  // 14 state/error tests
});

// __tests__/src/components/dashboard/MetricCard/MetricCard.test-utils.ts
export const mockMetric = { /* shared mock data */ };
export const renderMetricCard = (props) => { /* shared render helper */ };
```

**File naming pattern**: `{ComponentName}.{category}.test.{ts,tsx}`

Categories:
- `rendering` - Visual rendering tests
- `data` - Data handling/formatting tests
- `state` - Loading/error state tests
- `integration` - Component integration tests
- `accessibility` - A11y tests
- `performance` - Memoization/performance tests
- `test-utils` - Shared test helpers (not a test file)

#### Composition Pattern Usage

Use composition to build complex UIs from small, reusable components:

```tsx
// ✅ GOOD: Composed UI from small components
<PageLayout>
  <DashboardHeader title="Overview" />
  <MetricsGrid>
    <MetricCard metric={metric1} />
    <MetricCard metric={metric2} />
    <MetricCard metric={metric3} />
  </MetricsGrid>
  <ChartsSection>
    <LineChart data={chartData} />
  </ChartsSection>
</PageLayout>

// Each component is 50-150 lines and can be tested independently
```

#### Best Practices for Refactoring

1. **Extract Sub-Components**
   - Identify logical UI sections (headers, cards, lists, actions)
   - Extract to separate files in appropriate directory
   - Use memoization (`React.memo`) for performance-critical components
   - Pass props only (avoid prop drilling with contexts when needed)

2. **Create Helper Files for Shared Setup**
   ```typescript
   // __tests__/src/components/dashboard/test-setup.ts
   export const mockDashboardData = { /* ... */ };
   export const renderWithProviders = (component) => { /* ... */ };
   export const waitForDataLoad = async () => { /* ... */ };
   ```

3. **Use Descriptive File Naming**
   - Components: `{ComponentName}.tsx` (PascalCase)
   - Test files: `{ComponentName}.{category}.test.{ts,tsx}`
   - Helpers: `{FeatureName}.helpers.ts` or `{FeatureName}-utils.ts`
   - Hooks: `use{FeatureName}.ts` (camelCase with "use" prefix)
   - Types: `{FeatureName}.types.ts` or `{FeatureName}.types.d.ts`

4. **Maintain Import Organization**
   - Group imports logically (built-in → external → internal)
   - Use path aliases consistently (`@/components/*`, `@/hooks/*`)
   - Export types explicitly for reusability

5. **Preserve Functionality During Refactoring**
   - Run tests before and after refactoring
   - Use git to verify only structural changes, not behavior changes
   - Keep commit messages focused on the refactoring

#### Refactoring Workflow

1. **Identify** - Use `wc -l` to find files approaching 200 lines
2. **Analyze** - Identify logical boundaries and extraction points
3. **Extract** - Create new files for sub-components or test categories
4. **Update Imports** - Add/modify imports in affected files
5. **Verify** - Run `pnpm test` and `pnpm type:check`
6. **Commit** - Create focused commits for each extraction

#### Example Refactoring Commit Messages

```
feat: extract MemoizedModelItem from ModelsPage

- Created src/components/models/MemoizedModelItem.tsx
- Extracted 4 inline sub-components into separate files
- Improved testability and code organization
- Maintained all existing functionality

Closes: [task-id]
```

```
refactor: split MetricCard tests by category

- Created MetricCard.rendering.test.tsx (15 tests)
- Created MetricCard.data.test.tsx (12 tests)
- Created MetricCard.state.test.tsx (14 tests)
- Extracted shared test utilities to test-utils.ts
- Improved test organization and maintainability
```

### WebSocket Patterns

- Use `useWebSocket` hook for real-time communication
- Message format: `{ type: string, data: unknown, timestamp: number, requestId?: string }`
- Send messages: `sendMessage('request_metrics', {})`
- Handle events in component's `useEffect` or useWebSocket's event handlers

### Additional Notes

- Use Turbopack (Next.js 16 native bundler) - no webpack config needed
- Server runtime: Node.js with tsx
- Logging: Winston with daily rotation (see `src/lib/logger.ts`)
- State management: Zustand for client state, React Query for server state
- No Redux or Context API for state (except ThemeContext)
- Use pnpm as package manager
- Always run `pnpm type:check` and `pnpm lint` before committing changes
