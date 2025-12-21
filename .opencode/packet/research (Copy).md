# Research Findings: Project Context Mapping

## Project Overview
- **Purpose**: Dual proxy for LM Studio (port 1234) and Ollama (port 11434) backends using llama-server (llama.cpp)
- **Key Features**: Enterprise-grade audio (faster-whisper), CPU-optimized performance, headless architecture
- **Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS, MUI, Socket.io, Winston logging, Recharts

## Existing Services
- **API Routes** (app/api/):
  - `/models` - Model management and discovery (with `/discover` subroute)
  - `/config` - Application configuration
  - `/monitoring` - Performance metrics (with `/history` subroute)
  - `/parameters` - Parameter categories and values (dynamic routes)
  - `/users` - User management (static data)
  - `/notifications` - Notifications (mock data)
  - `/analytics` - Analytics (static data)
  - `/websocket` - Real-time WebSocket connection
- **Backend Services** (src/lib/services/):
  - ModelDiscoveryService.ts - Automated model discovery
  - parameterService.ts - Parameter management
- **Additional Lib Services** (src/lib/):
  - analytics.ts, auth.ts, monitor.ts, ollama.ts, process-manager.ts, etc.

## Incomplete Implementations
- **Static Data Services**: Users, notifications, analytics APIs return mock/static data without real-time updates (docs/01-identify-services.md)
- **Tracking TODOs**: WebSocket and monitoring routes lack request tracking and response time tracking (hardcoded 0 values)
- **Realtime Fetching**: Planned SSE-based streaming not yet implemented for incomplete services
- **Auth**: Marked as "À implémenter" in API docs (JWT authentication needed)

## Documentation Status
- **README.md**: Comprehensive in French, covers features, architecture, installation, API overview, theme, deployment
- **API.md**: Detailed French documentation with examples for all endpoints, WebSocket messages, errors, limits
- **Planning Docs** (docs/):
  - 01-identify-services.md: Lists non-functional services
  - 02-implement-realtime-fetching.md: Next steps for SSE
  - 03-install-plugins.md, 04-documentation.md, 05-audit-mui.md: Additional planning
- **AGENTS.md**: Development standards, build/test/lint, imports, naming, error handling, session completion workflow

## Existing Patterns & APIs
- **API Pattern**: REST endpoints with GET/POST, consistent error responses, dynamic routing for parameters
- **Component Structure**: Layout (Header/Sidebar), pages (Dashboard/Logs/Models/etc.), UI components, WebSocket manager
- **State Management**: ThemeContext for dark/light mode, hooks for WebSocket
- **Testing**: Jest tests for components (ThemeContext, DashboardPage, SidebarHoverVisibility), API routes (auth, models, monitoring), model discovery service
- **File Conventions**: kebab-case dirs, PascalCase components, camelCase funcs, TS strict, no any

## Key Guidelines from AGENTS.md
- Build/Test/Lint: pnpm dev/build/start/test/lint
- Imports: React/Next → third-party → @/...
- Error Handling: Throw clearly, log then re-throw, use AppError
- Session Completion: Mandatory push workflow, file issues for remaining work, run quality gates

## External Resources
- None required (all dependencies are standard libraries already in package.json: Next.js, MUI, Socket.io, etc.)</content>
<parameter name="filePath">/home/bamer/nextjs-llama-async-proxy/.opencode/packet/research.md