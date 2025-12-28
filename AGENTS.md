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

- **Critical**:it's mandatory that you don't make <tool_call> inside  <thinking> block if you do this opencode bug
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

### TypeScript & Types

- Strict mode enabled - always type function parameters, return types preferred but not required
- Prefer interfaces over type aliases for objects (use `interface ModelConfig` not `type ModelConfig`)
- Use Zod schemas for runtime validation (see `src/lib/config-service.ts`)
- Use global type definitions in `src/types/global.d.ts`
- Export types from `src/types/index.ts` for reusability
- Utility types: `Nullable<T>`, `Optional<T>`, `AsyncReturnType<T>` available globally
- Never use `any` - use `unknown` or specific types instead

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

### MUI v7 Specific Rules

**Critical**: MUI v7 deprecated the `item` prop on Grid components. Always use `size` prop instead:

```tsx
// ❌ WRONG (MUI v6 syntax)
<Grid item xs={12} sm={6} md={4}>

// ✅ CORRECT (MUI v7 syntax)
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
