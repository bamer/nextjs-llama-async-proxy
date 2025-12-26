# Architecture Overview - Next.js Llama Async Proxy

## System Overview

The Next.js Llama Async Proxy is a sophisticated web-based management interface and async proxy for Llama AI models. It provides real-time monitoring, model lifecycle management, and seamless integration with the llama-server binary through a modern Next.js application architecture.

### Core Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Express API   │    │  Llama Server   │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (AI Models)   │
│                 │    │                 │    │                 │
│ • React 19.2    │    │ • REST API      │    │ • llama.cpp     │
│ • TypeScript     │    │ • Socket.IO     │    │ • GGUF models   │
│ • Tailwind CSS  │    │ • Model Mgmt    │    │ • GPU/CPU accel │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                     ┌─────────────────┐
                     │   Socket.IO     │
                     │   (/llamaproxws)│
                     │ Real-time Comm  │
                     └─────────────────┘
```

## Technology Stack

### Frontend Layer
- **Next.js 16.1.0** - React framework with App Router and Turbopack
- **React 19.2.3** - UI library with concurrent features and Server Components
- **TypeScript 5.9.3** - Type-safe development with strict mode
- **MUI v7.3.6** - Material-UI components (@mui/material-nextjs for Next.js 16)
- **@mui/x-charts v8.23.0** - Charts and data visualization
- **Tailwind CSS v4** - Utility-first styling with PostCSS
- **Framer Motion** - Animation library with LazyMotion optimization
- **Zustand v5.0.9** - Lightweight client state management
- **@tanstack/react-query v5** - Server state management with caching
- **React Hook Form v7.69.0** - Form handling with validation
- **Zod v4.2.1** - Runtime validation and schema definition
- **Socket.IO Client v4.8.1** - Real-time bidirectional communication

### Backend Layer
- **Express 5.2.1** - REST API server wrapper
- **Socket.IO Server v4.8.1** - WebSocket server with real-time streaming
- **Winston 3.19.0** - Structured logging with daily rotation
- **Axios 1.13.2** - HTTP client for external requests
- **tsx 4.21.0** - TypeScript runtime for server execution

### Configuration System
- **llama-server-config.json** - JSON-based configuration file
- **server-config.ts** - TypeScript ESM configuration service (replaced CommonJS)
- **API Endpoints** - GET/POST /api/config for configuration management
- **Dynamic Loading** - Config loaded at server startup with logging

### Testing
- **Jest 30.2.0** - Testing framework
- **ts-jest 29.4.6** - TypeScript Jest preset
- **React Testing Library** - Component testing utilities
- **Coverage** - 70%+ threshold achieved

## Directory Structure

```
nextjs-llama-async-proxy/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── config/             # Configuration API (GET/POST)
│   │   ├── llama-server/        # Llama server control endpoints
│   │   ├── models/             # Model management
│   │   ├── logger/             # Logger configuration
│   │   └── health/            # Health checks
│   ├── dashboard/              # Dashboard page
│   ├── settings/               # Settings page (uses API, not localStorage)
│   ├── models/                # Models page
│   ├── monitoring/             # Monitoring page
│   ├── logs/                  # Logs page
│   ├── layout.tsx             # Root layout component
│   ├── page.tsx               # Home page
│   └── globals.css           # Global styles
├── src/
│   ├── components/           # React components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   ├── configuration/  # Settings components
│   │   ├── layout/         # Layout components (Header, Sidebar)
│   │   ├── ui/             # Reusable UI components
│   │   ├── animate/        # Animation components (Framer Motion)
│   │   └── websocket/      # WebSocket connection management
│   ├── hooks/              # Custom React hooks
│   │   ├── use-api.ts      # React Query integration
│   │   ├── use-websocket.ts # WebSocket hook
│   │   └── use-logger-config.ts
│   ├── lib/                # Utilities and services
│   │   ├── server-config.ts # Config service (TypeScript ESM)
│   │   ├── logger.ts       # Winston logger
│   │   ├── analytics.ts    # Analytics
│   │   └── services/       # Server-side services
│   ├── services/           # Client-side services
│   │   └── api-service.ts # API service layer
│   ├── server/             # Server-side code
│   │   ├── services/       # Llama integration
│   │   │   ├── LlamaService.ts
│   │   │   ├── LlamaServerIntegration.ts
│   │   │   └── ServiceRegistry.ts
│   │   └── [other server modules]
│   ├── contexts/           # React contexts
│   │   └── ThemeContext.tsx # Theme provider
│   ├── types/              # TypeScript definitions
│   │   └── global.d.ts   # Global types
│   ├── config/             # Configuration utilities
│   ├── styles/            # Global styles and themes
│   ├── providers/         # Context providers
│   └── utils/             # Utility functions
│       └── api-client.ts   # Axios wrapper
├── __tests__/            # Test files (Jest)
│   ├── lib/
│   │   ├── server-config.test.ts  # Config loading/saving
│   │   └── logger.test.ts       # Winston logger
│   ├── app/api/
│   │   └── config/
│   │       └── route.test.ts      # Config API
│   ├── hooks/
│   │   └── use-logger-config.test.ts
│   ├── components/
│   │   └── configuration/
│   │       └── hooks/
│   │           └── useConfigurationForm.test.ts
│   └── server/
│       └── ServiceRegistry.test.ts  # Service registry
├── public/              # Static assets
├── docs/               # Documentation
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── API_REFERENCE.md
│   ├── DEVELOPMENT_SETUP.md
│   ├── USER_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── ANIMATION_ARCHITECTURE.md
├── server.js           # Express + Socket.IO server entry point
├── llama-server-config.json  # Configuration file
└── [config files]      # Build and development configuration
```

## Core Components

### 1. Frontend Application (Next.js 16)

#### App Router Structure
- **`/dashboard`** - Main dashboard with real-time metrics
- **`/models`** - Model discovery, loading, and management
- **`/monitoring`** - Performance charts and system health
- **`//logs`** - Real-time log streaming with filtering
- **`/settings`** - Configuration (uses API endpoints, not localStorage)

#### Key Components
- **Layout Components**: Header, Sidebar, Navigation
- **Page Components**: Dashboard, Models, Monitoring, Logs, Settings
- **UI Components**: Buttons, Cards, Charts, Tables, Forms (MUI v7)
- **Animation Components**: Motion wrappers with LazyMotion optimization

### 2. Backend Server (Express + Socket.IO)

#### API Endpoints
- **Config API** (`/api/config`) - GET/POST configuration management
- **Models API** (`/api/models`) - Model registration and discovery
- **Health API** (`/api/health`) - Health checks
- **Logger API** (`/api/logger`) - Logger configuration

#### Real-time Communication
- **Socket.IO Path**: `/llamaproxws`
- **Socket.IO Host**: `localhost:3000` (default, configurable via PORT env var)
- **Server Socket.IO**: `/socket.io` namespace
- **Metrics Streaming**: Performance data (10s intervals)
- **Model Updates**: Model status changes (30s intervals)
- **Log Streaming**: Log entries (15s intervals)

#### Process Management
- **Llama Server Lifecycle**: Spawn, monitor, restart on failure
- **Health Checks**: HTTP-based monitoring with configurable timeouts
- **Error Recovery**: Exponential backoff retry logic

### 3. Configuration Management

#### Configuration Service (TypeScript ESM)
```typescript
// src/lib/server-config.ts
export interface LlamaServerConfig {
  host: string;
  port: number;
  basePath: string;
  serverPath: string;
  ctx_size: number;
  batch_size: number;
  threads: number;
  gpu_layers: number;
}

// Load configuration from JSON file
export async function loadConfig(): Promise<LlamaServerConfig> { }

// Save configuration to JSON file
export async function saveConfig(config: LlamaServerConfig): Promise<void> { }
```

**Key Changes:**
- Migrated from CommonJS `server-config.js` to TypeScript ESM `server-config.ts`
- Removed deprecated `config-service.ts` (deleted)
- Configuration stored in `llama-server-config.json`
- Server loads config dynamically at startup with logging
- API endpoints: `GET/POST /api/config`
- Settings page uses API (not localStorage) for llama config

#### Configuration File Structure
```json
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/path/to/models",
  "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

### 4. Llama Server Integration

#### Process Management
```typescript
// Server-side process spawning
const spawnLlamaServer = (config: LlamaServerConfig) => {
  const process = spawn(config.serverPath, [
    `--port ${config.port}`,
    `--host ${config.host}`,
    `--model-path ${config.basePath}`,
    `--ctx-size ${config.ctx_size}`,
    `--batch-size ${config.batch_size}`,
    config.threads !== -1 ? `--threads ${config.threads}` : '',
    config.gpu_layers !== -1 ? `--gpu-layers ${config.gpu_layers}` : ''
  ].filter(Boolean), {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Monitor stdout/stderr for logs
  // Handle process events (exit, error, etc.)
  // Implement health checks and auto-restart
};
```

#### Model Discovery
- **Filesystem Scanning**: Automatic detection of `.gguf` and `.bin` files
- **API-based Discovery**: Query llama-server for loaded models
- **Hybrid Approach**: Combine filesystem and API methods for reliability

#### Service Registry Pattern
```typescript
// ServiceRegistry manages all background services
class ServiceRegistry {
  private services: Map<string, Service> = new Map();

  register(name: string, service: Service): void {
    this.services.set(name, service);
  }

  start(name: string): Promise<void> { }
  stop(name: string): Promise<void> { }
  stopAll(): Promise<void> { }
}
```

## Data Flow Architecture

### 1. Configuration Flow
```
llama-server-config.json
    ↓
Server startup → server-config.ts (TypeScript ESM)
    ↓
Load config with logging → API endpoint: GET /api/config
    ↓
Settings page → POST /api/config (updates JSON file)
```

### 2. Model Loading Flow
```
User Request → API Endpoint → Model Discovery → Llama Server → Process Spawn → Health Check → Status Update → WebSocket Broadcast
```

### 3. Real-time Metrics Flow
```
System Metrics → Collection Service → Socket.IO → Frontend → Charts Update (every 10s)
```

### 4. Log Streaming Flow
```
Llama Server Logs → Winston Logger → Socket.IO → Frontend → Log Display (every 15s)
```

## State Management

### Client State (Zustand)
- **Theme Store**: Dark/light mode, color preferences
- **UI Store**: Sidebar state, modal visibility

### Server State (React Query)
- **Config Data**: Application configuration from API
- **Models Data**: Cached model information with background updates
- **Metrics Data**: Real-time performance data with polling

### Real-time State (Socket.IO)
- **Live Metrics**: CPU, memory, GPU usage
- **Model Status**: Loading progress, active models
- **Log Stream**: Real-time application and system logs

## Performance Optimizations

### Frontend Optimizations
- **LazyMotion**: Deferred animation loading for better initial bundle size
- **Code Splitting**: Automatic route-based splitting via Next.js 16 Turbopack
- **Image Optimization**: Next.js built-in image optimization
- **Memoization**: React Compiler awareness (no manual memoization needed)

### Backend Optimizations
- **Connection Pooling**: Reused HTTP connections to llama-server
- **Caching**: In-memory cache for frequently accessed data
- **Streaming**: Real-time data streaming to reduce polling overhead
- **Background Processing**: Non-blocking operations for better responsiveness

### Animation Architecture
- **Framer Motion with LazyMotion**: Optimized animation loading
- **Component-level Animations**: Scoped animations for better performance
- **Reduced Motion Support**: Respects user accessibility preferences
- **GPU Acceleration**: Hardware-accelerated animations where possible

## Testing Architecture

### Test Structure
```
__tests__/
├── lib/
│   ├── server-config.test.ts      # Config loading/saving
│   └── logger.test.ts              # Winston logger
├── app/api/
│   └── config/
│       └── route.test.ts           # Config API (enhanced)
├── hooks/
│   └── use-logger-config.test.ts    # Logger config hook
├── components/configuration/
│   └── hooks/
│       └── useConfigurationForm.test.ts  # Settings form
└── server/
    └── ServiceRegistry.test.ts     # Service registry
```

### Test Coverage
- **70%+ coverage threshold** for branches, functions, lines, statements
- **Proper mocking** of external dependencies
- **Jest with ts-jest** for TypeScript support

## Security Considerations

### Current State
- **No Authentication**: Intentionally open for development
- **CORS Configuration**: Configurable cross-origin policies
- **Input Validation**: Zod schemas for API input validation
- **Process Isolation**: Llama server runs in separate process

### Production Security (Planned)
- **JWT Authentication**: Token-based API access
- **Rate Limiting**: Request throttling and abuse prevention
- **HTTPS/TLS**: Encrypted communication channels
- **Input Sanitization**: Comprehensive input validation and sanitization

## Development Workflow

### Build Process
1. **TypeScript Compilation**: Type checking with tsc --noEmit
2. **Next.js Build**: Frontend optimization via Turbopack
3. **Asset Optimization**: Image compression and bundle splitting
4. **Testing**: Jest test execution with coverage

### Server Execution
```bash
# Development (uses tsx)
pnpm dev

# Production (uses tsx)
pnpm start
```

**Note**: Server uses `tsx` for TypeScript runtime execution, not `node server.js`

## WebSocket Communication

### Connection Details
- **Path**: `/llamaproxws`
- **Host**: `localhost:3000` (default, configurable via PORT env var)
- **Transport**: WebSocket with HTTP polling fallback
- **Events**: Metrics, models, logs, status updates

### Message Format
```typescript
interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
  requestId?: string;
}
```

This architecture provides a robust, scalable foundation for AI model management with excellent developer experience and production readiness, comprehensive testing, and modern React 19.2 patterns.

---

**Architecture Overview - Next.js Llama Async Proxy**
**Version 0.1.0 - December 27, 2025**
