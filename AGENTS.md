# AGENTS.md - Development Guidelines

Coding standards and project conventions for the Next.js Llama Async Proxy application.

## Project Overview

This codebase implements a sophisticated web-based management interface and async proxy for Llama AI models. It provides real-time monitoring, model lifecycle management, and seamless integration with the llama-server binary through a modern Next.js application architecture. The system serves as a complete dashboard for AI model operations, featuring live metrics, WebSocket-based updates, and comprehensive error recovery mechanisms.

### Core Purpose
The application serves as a **real-time web interface for managing Llama AI model deployments** through an async proxy architecture. It acts as an intermediary between users and the llama-server binary, providing:

- **Model Discovery and Management**: Automatic scanning of model directories and API-based loading/unloading
- **Real-time Monitoring**: Live dashboards showing system performance, GPU metrics, and model status
- **Operational Control**: Start/stop model operations through RESTful APIs
- **Health Monitoring**: Continuous health checks and automatic recovery from failures
- **Log Aggregation**: Real-time streaming of system and application logs

### Key User Workflows
1. **Model Operations**: Users can browse available models, start/stop them, and monitor loading status
2. **System Monitoring**: Real-time charts display CPU/memory usage, GPU metrics, and request throughput
3. **Configuration Management**: Settings page allows theme customization and notification preferences
4. **Log Review**: Color-coded activity feed with filtering for troubleshooting

### Technical Highlights
- **Async Proxy Architecture**: Manages llama-server process lifecycle with spawn/kill operations
- **Real-time Communication**: Socket.IO integration for live updates (metrics every 10s, models every 30s, logs every 15s)
- **Error Recovery**: Exponential backoff retry logic with automatic process restart
- **Health Checks**: HTTP-based monitoring with configurable timeouts and retry policies
- **Model Discovery**: Dual approach combining API calls and filesystem scanning for .gguf/.bin files

## Build/Test/Lint Commands

**Package Manager**: pnpm only (not npm or yarn)

### Core Commands
- **Dev**: `pnpm dev` - Start Next.js + Express + Socket.IO server on port 3000
- **Build**: `pnpm build` - Production build
- **Start**: `pnpm start` - Run production server
- **Test**: `pnpm test` - Jest tests
- **Test Watch**: `pnpm test:watch` - Tests with auto-reload
- **Test Single**: `pnpm test -- path/to/test.test.ts` - Run specific test
- **Type Check**: `pnpm type:check` - TypeScript verification
- **Lint**: `pnpm lint` - ESLint check
- **Lint Fix**: `pnpm lint:fix` - Auto-fix linting issues
- **Coverage**: `pnpm test:coverage` - Test coverage report

## Architecture & Structure

### Framework Stack
- **Next.js 16** (App Router + legacy pages/)
- **React 19** (Functional components only)
- **TypeScript** (Strict mode)
- **Tailwind CSS v4** + Emotion + Material-UI v7
- **Socket.IO** for real-time communication
- **Express.js** backend (server.js)

### Directory Organization
- `app/` - Next.js App Router pages (primary)
- `pages/` - Legacy pages (SSE only)
- `src/` - Source code
  - `components/` - React components (layout/, pages/, ui/, websocket/, etc.)
  - `hooks/` - Custom React hooks
  - `services/` - API services
  - `types/` - TypeScript definitions
  - `server/` - Backend logic (config, models, metrics, proxy, etc.)
  - `config/`, `lib/`, `styles/`, `utils/`, `providers/`, `contexts/`
- `public/` - Static assets
- `server.js` - Express + Socket.IO server

### State Management
- **Client**: Zustand (global), React Query (server state)
- **Server**: Node Cache (in-memory), Express session
- **Real-time**: Socket.IO + WebSocket

### Key Technologies
- **Validation**: Zod + React Hook Form
- **Charts**: Recharts + MUI X-Charts
- **Icons**: Lucide React + MUI Icons
- **Logging**: Winston (server), console (client)
- **Build**: Turbopack, Next.js built-in

### Important Notes
- **No authentication** - Project is intentionally open
- **Path aliases**: `@/` → `src/`
- **Server**: Integrated Express server in server.js
- **Real-time**: Socket.IO for metrics/models/logs streaming
- **Llama Integration**: Acts as proxy for llama-server binary with automatic model discovery
- **Error Recovery**: Exponential backoff for process failures (max 5 retries)
- **Health Monitoring**: Continuous HTTP health checks with 5s timeout

## Code Style & Conventions

### TypeScript
- **Strict mode** enabled (strictNullChecks, noImplicitAny, etc.)
- **Explicit return types** required for all functions
- **No `any` type** - use `unknown` if necessary and narrow
- **Avoid `!` operator** - except in test files
- **Optional chaining** and **nullish coalescing** preferred

### Formatting
- **Spaces**: 2 spaces (not tabs)
- **Quotes**: Double quotes `"` (except JSX)
- **Semicolons**: Always required
- **Line width**: 100 characters max (Prettier enforced)
- **Trailing commas**: ES5 style (multiline)
- **Imports alignment**: Alphabetical within groups

### Import Order
1. Built-in Node.js modules (`fs`, `path`, etc.)
2. External packages (`react`, `next`, `zod`, etc.)
3. Internal imports with `@/` prefix (alphabetically)
4. Parent/sibling relative imports

Example:
```typescript
import { useState } from "react";

import axios from "axios";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useApi } from "@/hooks/use-api";

import { sibling } from "../sibling";
import { local } from "./local";
```

### Naming Conventions
- **Functions/variables**: `camelCase` - `getUserData`, `isActive`
- **Components**: `PascalCase` - `Button`, `UserCard`
- **Constants**: `SCREAMING_SNAKE_CASE` - `MAX_RETRIES`, `API_TIMEOUT`
- **Files**: Match export name (e.g., `Button.tsx` for `export Button`)
- **React hooks**: Start with `use` - `useApi`, `useWebSocket`
- **Unused params**: Prefix with `_` - `(_unused, required) => {}`

### React Best Practices
- **Functional components only** - No class components
- **Hooks only** - No HOCs or render props
- **Exhaustive deps** in useEffect - Use ESLint rule
- **No prop-types** - TypeScript provides types
- **Component folder**: Co-locate styles, tests with component

### Error Handling
- **Validation**: Zod for input validation
- **Logging**: Winston (server), console.error (client, logged)
- **No debugger** - Use browser DevTools instead
- **Try/catch**: For async operations
- **Error boundaries**: For React errors

### Testing
- **Framework**: Jest + React Testing Library
- **Test files**: `__tests__/` directory or `*.test.ts(x)`
- **Coverage**: Aim for 80%+ critical paths
- **Naming**: Describe what tests do
- **Mocking**: jest-mock-extended for complex mocks
- **Non-null assertions**: Allowed in test files only

### ESLint Overrides
- Test files (*.test.ts): Can use `@typescript-eslint/no-non-null-assertion`
- Unused parameters: Mark with `_` prefix
- Console: Only `error` and `warn` allowed in production

### Comments
- **Why, not what** - Code shows what it does
- **JSDoc**: For public APIs and complex functions
- **TODO/FIXME**: Format: `// TODO: description` with context
- **Avoid**: Obvious comments like `// increment counter`

## File Structure Template

### React Component
```typescript
import { ReactNode } from "react";

import { Button } from "@/components/ui/Button";

interface ComponentProps {
  title: string;
  children: ReactNode;
}

export function Component({ title, children }: ComponentProps): ReactNode {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
}
```

### Hook
```typescript
import { useCallback } from "react";

export function useCustom(): ReturnType {
  const callback = useCallback(() => {
    // logic
  }, []);

  return callback;
}
```

### Service/Utility
```typescript
import axios from "axios";

export async function fetchData(id: string): Promise<Data> {
  const response = await axios.get(`/api/data/${id}`);
  return response.data;
}
```

## Development Workflow

### Before Committing
1. `pnpm lint:fix` - Auto-fix linting issues
2. `pnpm type:check` - Verify TypeScript
3. `pnpm test` - Run tests
4. `pnpm build` - Verify production build works

### Common Patterns
- **API calls**: Use React Query or Zustand stores
- **WebSocket**: Use Socket.IO via context
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS classes first, then emotion/MUI
- **Async operations**: Promise-based, avoid callbacks

### Performance Tips
- **Code splitting**: Automatic via Next.js
- **Image optimization**: Use next/image
- **Lazy loading**: React.lazy for components
- **Memoization**: useMemo for expensive computations
- **Debouncing**: For search, input handlers

## Configuration Files

- **tsconfig.json** - TypeScript config with strict mode
- **.eslintrc.json** - ESLint rules (Prettier integration)
- **.prettierrc** - Prettier formatting (100 char line width)
- **jest.config.js** - Jest testing framework
- **next.config.ts** - Next.js configuration
- **tailwind.config.js** - Tailwind CSS customization

## Tools & IDE Setup

### Recommended Extensions (VS Code)
- ESLint
- Prettier
- TypeScript Vue Plugin
- Thunder Client or REST Client

### Settings (VS Code)
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Troubleshooting

- **Port 3000 in use**: Change with `PORT=3001 pnpm dev`
- **Dependencies issue**: Delete `node_modules` and `pnpm-lock.yaml`, run `pnpm install`
- **TypeScript errors**: Run `pnpm type:check` to see all issues
- **Tests failing**: Check `jest.setup.ts` configuration
