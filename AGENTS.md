# AGENTS.md - Development Guidelines

Coding standards and project conventions for the Next.js Llama Async Proxy application.

## Project Overview

Web-based management interface and async proxy for Llama AI models with real-time monitoring, WebSocket-based updates, and automatic error recovery.

## Build/Test/Lint Commands

**Package Manager**: pnpm only (not npm or yarn)

- **Dev**: `pnpm dev` - Start Next.js + Express + Socket.IO server on port 3000
- **Build**: `pnpm build` - Production build
- **Start**: `pnpm start` - Run production server
- **Test**: `pnpm test` - Jest tests
- **Test Watch**: `pnpm test:watch` - Tests with auto-reload
- **Test Single**: `pnpm test -- path/to/test.test.ts` - Run specific test file
- **Test Coverage**: `pnpm test:coverage` - Coverage report
- **Type Check**: `pnpm type:check` - TypeScript verification
- **Lint**: `pnpm lint` - ESLint check
- **Lint Fix**: `pnpm lint:fix` - Auto-fix linting issues

## Architecture

- **Next.js 16** (App Router + legacy pages/), **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4** + Emotion + Material-UI v7
- **Socket.IO** for real-time communication
- **Express.js** backend (server.js)
- **Path aliases**: `@/` → `src/`
- **State**: Zustand (client), React Query, Socket.IO
- **No authentication** - Project is intentionally open

## Code Style & Conventions

### TypeScript
- **Strict mode** enabled (strictNullChecks, noImplicitAny, exactOptionalPropertyTypes)
- **Explicit return types** required for all functions
- **No `any` type** - use `unknown` if necessary and narrow
- **Avoid `!` operator** - except in test files (allowed via override)
- **Optional chaining** (`?.`) and **nullish coalescing** (`??`) preferred

### Formatting (Prettier)
- **Spaces**: 2 spaces (not tabs)
- **Quotes**: Double quotes `"` (single quotes in JSX)
- **Semicolons**: Always required
- **Line width**: 100 characters max
- **Trailing commas**: ES5 style (multiline objects/arrays)
- **Arrow parens**: Always `(params) => {}`

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
- **Exhaustive deps** in useEffect - ESLint rule enforced
- **No prop-types** - TypeScript provides types
- **Use ReactNode** for JSX returns, not `JSX.Element`

### Error Handling
- **Validation**: Zod for input validation
- **Logging**: Winston (server), console.error (client, logged)
- **No debugger** - Use browser DevTools instead
- **Try/catch**: For async operations with proper error typing
- **Error boundaries**: For React errors

### Testing
- **Framework**: Jest + React Testing Library
- **Test files**: `__tests__/` directory or `*.test.ts(x)`
- **Coverage**: Aim for 80%+ critical paths
- **Mocking**: jest-mock-extended for complex mocks
- **Non-null assertions**: Allowed in test files only

### ESLint Overrides
- Test files (*.test.ts): `@typescript-eslint/no-non-null-assertion` off
- Unused parameters: Mark with `_` prefix to avoid warnings
- Console: Only `error` and `warn` allowed in production

### Comments
- **Why, not what** - Code shows what it does
- **JSDoc**: For public APIs and complex functions
- **TODO/FIXME**: Format: `// TODO: description` with context
- **Avoid**: Obvious comments like `// increment counter`

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

### Troubleshooting
- **Port 3000 in use**: Change with `PORT=3001 pnpm dev`
- **Dependencies issue**: Delete `node_modules` and `pnpm-lock.yaml`, run `pnpm install`
- **TypeScript errors**: Run `pnpm type:check` to see all issues
- **Tests failing**: Check `jest.setup.ts` configuration
