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

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: Bash("openskills read <skill-name>")
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>algorithmic-art</name>
<description>Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems. Create original algorithmic art rather than copying existing artists' work to avoid copyright violations.</description>
<location>project</location>
</skill>

<skill>
<name>brand-guidelines</name>
<description>Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit from having Anthropic's look-and-feel. Use it when brand colors or style guidelines, visual formatting, or company design standards apply.</description>
<location>project</location>
</skill>

<skill>
<name>canvas-design</name>
<description>Create beautiful visual art in .png and .pdf documents using design philosophy. You should use this skill when the user asks to create a poster, piece of art, design, or other static piece. Create original visual designs, never copying existing artists' work to avoid copyright violations.</description>
<location>project</location>
</skill>

<skill>
<name>dev-browser</name>
<description>Browser automation with persistent page state. Use when users ask to navigate websites, fill forms, take screenshots, extract web data, test web apps, or automate browser workflows. Trigger phrases include "go to [url]", "click on", "fill out the form", "take a screenshot", "scrape", "automate", "test the website", "log into", or any browser interaction request.</description>
<location>project</location>
</skill>

<skill>
<name>doc-coauthoring</name>
<description>Guide users through a structured workflow for co-authoring documentation. Use when user wants to write documentation, proposals, technical specs, decision docs, or similar structured content. This workflow helps users efficiently transfer context, refine content through iteration, and verify the doc works for readers. Trigger when user mentions writing docs, creating proposals, drafting specs, or similar documentation tasks.</description>
<location>project</location>
</skill>

<skill>
<name>docx</name>
<description>"Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. When Claude needs to work with professional documents (.docx files) for: (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks"</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.</description>
<location>project</location>
</skill>

<skill>
<name>gastown</name>
<description>Multi-agent orchestrator for Claude Code. Use when user mentions gastown, gas town, gt commands, bd commands, convoys, polecats, crew, rigs, slinging work, multi-agent coordination, beads, hooks, molecules, workflows, the witness, the mayor, the refinery, the deacon, dogs, escalation, or wants to run multiple AI agents on projects simultaneously. Handles installation, workspace setup, work tracking, agent lifecycle, crash recovery, and all gt/bd CLI operations.</description>
<location>project</location>
</skill>

<skill>
<name>internal-comms</name>
<description>A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use. Claude should use this skill whenever asked to write some sort of internal communications (status reports, leadership updates, 3P updates, company newsletters, FAQs, incident reports, project updates, etc.).</description>
<location>project</location>
</skill>

<skill>
<name>mcp-builder</name>
<description>Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK).</description>
<location>project</location>
</skill>

<skill>
<name>pdf</name>
<description>Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms. When Claude needs to fill in a PDF form or programmatically process, generate, or analyze PDF documents at scale.</description>
<location>project</location>
</skill>

<skill>
<name>pptx</name>
<description>"Presentation creation, editing, and analysis. When Claude needs to work with presentations (.pptx files) for: (1) Creating new presentations, (2) Modifying or editing content, (3) Working with layouts, (4) Adding comments or speaker notes, or any other presentation tasks"</description>
<location>project</location>
</skill>

<skill>
<name>skill-creator</name>
<description>Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.</description>
<location>project</location>
</skill>

<skill>
<name>slack-gif-creator</name>
<description>Knowledge and utilities for creating animated GIFs optimized for Slack. Provides constraints, validation tools, and animation concepts. Use when users request animated GIFs for Slack like "make me a GIF of X doing Y for Slack."</description>
<location>project</location>
</skill>

<skill>
<name>template</name>
<description>Replace with description of the skill and when Claude should use it.</description>
<location>project</location>
</skill>

<skill>
<name>theme-factory</name>
<description>Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML landing pages, etc. There are 10 pre-set themes with colors/fonts that you can apply to any artifact that has been creating, or can generate a new theme on-the-fly.</description>
<location>project</location>
</skill>

<skill>
<name>web-artifacts-builder</name>
<description>Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or shadcn/ui components - not for simple single-file HTML/JSX artifacts.</description>
<location>project</location>
</skill>

<skill>
<name>webapp-testing</name>
<description>Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.</description>
<location>project</location>
</skill>

<skill>
<name>xlsx</name>
<description>"Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis, and visualization. When Claude needs to work with spreadsheets (.xlsx, .xlsm, .csv, .tsv, etc) for: (1) Creating new spreadsheets with formulas and formatting, (2) Reading or analyzing data, (3) Modify existing spreadsheets while preserving formulas, (4) Data analysis and visualization in spreadsheets, or (5) Recalculating formulas"</description>
<location>project</location>
</skill>

<skill>
<name>zai-cli</name>
<description>|</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
