# Research Findings: Next.js Application State Analysis

## Key Directories
- **app/**: Next.js App Router structure with pages (dashboard, logs, models, monitoring, settings) and API routes (analytics, config, models, monitoring, notifications, users, websocket).
- **src/**: Source code including components (layout, pages, ui, websocket), contexts, hooks, lib (services, analytics, auth, etc.), types, and middleware.
- **__tests__/** and **tests/**: Test suites for components, API routes, and e2e.
- **docs/**: Documentation files.
- **pages/**: Legacy Pages Router API routes (sse.ts, websocket.ts).
- **data/**: Static data files (e.g., monitoring-history.json).
- **logs/**: Application logs and exceptions.
- **screenshots/**: UI screenshots for various themes and devices.

## Key Configuration Files
- **package.json**: Defines dependencies (Next.js 16.1.0, React 19.2.3, MUI, Socket.IO, etc.), scripts (dev uses server.js, build/start via Next.js), and type as "module" (ESM).
- **next.config.ts**: Minimal configuration.
- **tsconfig.json**: TypeScript config with paths "@/*": ["./src/*"], strict: false, moduleResolution: "bundler".
- **tailwind.config.js**: Tailwind CSS config (CommonJS format, conflicting with ESM package.json).
- **eslint.config.mjs**: ESLint configuration.
- **jest.config.js** and **jest.setup.js**: Jest testing setup.
- **server.js**: Custom server script for dev/start.

## Recent Changes (Git History)
- Recent commits (last 10):
  - "etablissement du plan BEADS"
  - "feat: enable real model discovery, real users API, and real monitoring endpoints" (appears twice)
  - "format code"
  - "template presque ok"
  - "MUIU theme andIHM improvement"
  - "implement real time"
  - "Optimize model start endpoint: add strict name validation, in-memory state cache, async atomic writes"
  - "le model est plus stable"
  - "componement nextjs add"
- Uncommitted changes: Modified package.json, src/app/api/notifications/route.ts, app/api/notifications/route.ts, .beads/issues.jsonl, .opencode/packet/plan.md, @AGENTS.md, AGENTS.md.
- Branch up-to-date with origin/main.

## Potential Issues Preventing App Startup/Compilation
### Build Errors (pnpm build fails)
1. **Module Format Mismatch**: tailwind.config.js uses CommonJS syntax but package.json specifies "type": "module" (ESM). Exports will cause runtime errors.
2. **Router Conflict**: Both App Router (app/api/websocket/route.ts) and Pages Router (pages/api/websocket.ts) match /api/websocket. Next.js requires removal of one.
3. **Client Component Required**: src/components/pages/MonitoringPage.tsx uses useState/useEffect but lacks "use client" directive, causing server component errors.
4. **Duplicate Export**: ServerSentEventStream class defined multiple times in src/lib/analytics.ts.
5. **Middleware Issues**: Winston logger imports causing Edge Middleware errors with winston-daily-rotate-file and related modules.

### Test Failures (pnpm test fails)
- **Provider Missing**: DashboardPage.test.tsx and SidebarHoverVisibility.test.tsx fail because useWebSocket and useSidebar require providers (WebSocketProvider, SidebarProvider) not wrapped in tests.
- **Missing Dependency**: ThemeContext.test.tsx fails due to missing @testing-library/react-hooks.
- **Mock Issues**: API tests (monitoring/history, models/[name]) have mock setup problems (e.g., mockedFs.existsSync.mockReturnValue not a function, handler not a function, Response.json issues).
- **Empty Test Suite**: tests/api/auth/auth.test.ts has no tests.
- **Environment Issues**: tests/e2e/ui.spec.ts fails with TransformStream undefined, likely Node.js version or JSDOM config.
- **Import Errors**: Some test files have incorrect import paths (e.g., ModelDiscoveryService).

### Runtime Logs
- **Exceptions.log**: Empty (no recent errors).
- **Application log**: Only a test entry from 2025-12-16 (Winston logger working).

### Other Observations
- **TypeScript Strictness**: tsconfig.json has "strict": false, allowing potential type issues.
- **Dual Proxy Purpose**: Project emulates LM Studio (port 1234) and Ollama (port 11434) with llama-server backend.
- **Dependencies**: Recent versions (Next.js 16, React 19), but some may be incompatible (e.g., React 19 with older MUI?).

## Recommendations
- Resolve build errors: Fix tailwind.config.js to ESM, remove conflicting router route, add "use client" to MonitoringPage.tsx, deduplicate ServerSentEventStream, address middleware imports.
- Fix test setup: Add providers in test renders, install missing deps, correct mocks, add tests to empty suites.
- Review uncommitted changes for breaking modifications.
- Update dependencies if needed for compatibility.</content>
<parameter name="filePath">.opencode/packet/research.md