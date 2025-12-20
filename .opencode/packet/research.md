# Research Findings: Next.js Llama Async Proxy Application State

## Existing Patterns Found
- **App Router Structure**: Uses Next.js 16 with App Router for routing (app/ directory with pages like dashboard, models, monitoring, settings).
- **API Routes**: RESTful API endpoints under app/api/ (models, monitoring, users, websocket, etc.) with some using Server-Sent Events (SSE) for streaming.
- **Component Architecture**: Organized in src/components/ with layout (Header, Sidebar), pages (DashboardPage, etc.), UI components (Button, Card), and websocket (WebSocketManager).
- **Service Layer**: Services in src/lib/services/ (ModelDiscoveryService, parameterService) for business logic.
- **State Management**: React hooks (useWebSocket), contexts (ThemeContext), and external config files (models_config.json).
- **Realtime Integrations**: WebSocket via socket.io for bidirectional communication, SSE for server-to-client updates.
- **Authentication**: Basic auth setup in src/lib/auth.ts, with middleware.ts for route protection.
- **Monitoring & Logging**: Winston logger, monitoring types, and history data in JSON files.
- **Theming**: ThemeContext for light/dark modes, with Tailwind CSS and MUI for styling.

## Relevant Code Examples from Codebase
- **ModelDiscoveryService.ts**: Real filesystem scanning for model files (.bin, .quant.bin), with validation and metadata loading.
- **WebSocketManager.tsx**: Manages WebSocket connections for realtime updates in components.
- **useWebSocket.ts**: Custom hook for WebSocket state and event handling.
- **models/route.tsx**: GET fetches from Ollama API, POST simulates model discovery with hardcoded models.
- **users/route.ts**: SSE stream with real system processes, fallback to mock user data.
- **ApiRoutes.tsx**: Mock metricsService returning static data for monitoring.

## Key Guidelines from AGENTS.md
- **Build/Test/Lint**: pnpm dev/start/build, pnpm test/lint.
- **Imports**: Group React/Next → third-party → @/ imports.
- **Naming**: camelCase for funcs/vars, PascalCase for components, kebab-case dirs.
- **Purpose**: Dual proxy for LM Studio (port 1234) and Ollama (port 11434), faster-whisper audio transcription, CPU-optimized.
- **Error Handling**: Throw clearly, log then re-throw, use AppError.
- **Session Completion**: Mandatory git push after work, file issues for remaining work.

## External Resources
None required - all findings from internal codebase analysis.

## Services Not Fully Functional (No Mock/Simulated Data)
- **Model Discovery (POST /api/models)**: Uses simulated models array instead of real filesystem scanning despite ModelDiscoveryService being available.
- **Users API (/api/users)**: Falls back to mock user data if system process fetching fails.
- **Monitoring Metrics**: metricsService in ApiRoutes.tsx is entirely mock, returning static uptime/CPU/memory values.
- **Analytics API**: Likely mock, as not fully implemented.

## Existing Material-UI Components Used
- **Box**: Layout container in EnhancedMetricCard, RealTimeStatusBadge, Card.
- **Typography**: Text styling in same components.
- **Card, CardActions, CardContent**: Card structure in Card.tsx.
- **Button**: Interactive elements in Card.tsx.

## Realtime Service Integrations Already Present
- **WebSocket**: Full integration via socket.io (client/server), WebSocketManager component, useWebSocket hook for realtime model updates and monitoring.
- **Server-Sent Events (SSE)**: Implemented in users/route.ts for streaming system process data, and pages/api/sse.ts for general SSE endpoint.

## Project Structure Summary
- **Pages**: Dashboard, Models, Monitoring, Settings, Logs (app/ and src/app/).
- **API Routes**: Analytics, Config, Models (discover, [name]/start/stop), Monitoring (history, latest), Notifications, Parameters ([category]), Users, WebSocket.
- **Components**: Layout (Header, Sidebar, Layout), Pages (ApiRoutes, ConfigurationPage, etc.), UI (Button, Card, Charts, EnhancedMetricCard, etc.), WebSocket (WebSocketManager).
- **Services**: ModelDiscoveryService, parameterService, auth, binary-lookup, constants, logger, monitor, ollama, process-manager, state-file, types, validators.
- **Other**: Contexts (ThemeContext), Hooks (useWebSocket), Types (monitoring), Config files (app_config.json, models_config.json), Tests (Jest for components and API).