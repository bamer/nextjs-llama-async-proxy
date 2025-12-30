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
- **MUI v8.3.6** - Material-UI components (@mui/material-nextjs for Next.js 16)
- **@mui/x-charts v8.23.0** - Charts and data visualization
- **Tailwind CSS v4** - Utility-first styling with PostCSS
- **Framer Motion** - Animation library with LazyMotion optimization
- **Zustand v5.0.9** - Lightweight client state management
- **@tanstack/react-query v5** - Server state management with caching
- **React Hook Form v8.69.0** - Form handling with validation
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
- **Coverage** - Target: 98% for branches, functions, lines, statements
- **Recent Achievements**:
  - WebSocket provider at 98% coverage
  - fit-params-service at 97.97% coverage
  - Button component at 100% coverage
  - Comprehensive test suite across all major modules
  - Mock implementations for external dependencies (axios, socket.io-client)

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
- **UI Components**: Buttons, Cards, Charts, Tables, Forms (MUI v8)
- **Animation Components**: Motion wrappers with LazyMotion optimization

### 2. Backend Server (Express + Socket.IO)

#### API Endpoints
- **Config API** (`/api/config`) - GET/POST configuration management (serverConfig + appConfig)
- **Models API** (`/api/models`) - Model registration and discovery
- **Model Control** (`/api/models/[name]/start`) - Start specific model
- **Model Control** (`/api/models/[name]/stop`) - Stop specific model
- **Model Analysis** (`/api/models/[name]/analyze`) - Fit-params analysis
- **Model Templates** (`/api/model-templates`) - Template management
- **Health API** (`/api/health`) - Health checks
- **Monitoring API** (`/api/monitoring`) - Performance metrics
- **Monitoring API** (`/api/monitoring/latest`) - Latest metrics snapshot
- **Logger API** (`/api/logger/config`) - Logger configuration
- **Llama Server API** (`/api/llama-server/rescan`) - Model rescan

#### Real-time Communication

- **Socket.IO Path**: `/llamaproxws`
- **Socket.IO Host**: `localhost:3000` (default, configurable via PORT env var)
- **Server Socket.IO**: `/socket.io` namespace
- **Metrics Streaming**: Performance data (10s intervals)
- **Model Updates**: Model status changes (30s intervals)
- **Log Streaming**: Log entries (15s intervals)

#### WebSocket Reconnection Strategy

- **Exponential Backoff**: 1s → 2s → 4s → 8s → 16s (max 30s)
- **Maximum Retries**: 5 retry attempts
- **Automatic Resubscription**: Re-subscribes to all active subscriptions on reconnect
- **Page Visibility Handling**: Pauses reconnection when tab hidden, resumes when visible
- **Connection State Tracking**: Exposes connection status (connected, connecting, disconnected)
- **Event Listeners**: `connect`, `disconnect`, `reconnect`, `reconnect_attempt`, `reconnect_failed`

#### Process Management
- **Llama Server Lifecycle**: Spawn, monitor, restart on failure
- **Health Checks**: HTTP-based monitoring with configurable timeouts
- **Error Recovery**: Exponential backoff retry logic

### 3. Logging System

#### Winston 3.19.0 Integration

**Single Source of Truth**: All server-side logging uses Winston logger

```typescript
import { getLogger } from "@/lib/logger";
const logger = getLogger();
logger.info("Server started");
logger.error("Failed to connect");
```

#### Logging Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Winston Logger                         │
│                   (src/lib/logger.ts)                   │
└──────────────────────┬──────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────────┐
   │ Console  │  │   File   │  │  WebSocket   │
   │ Transport│  │ Transport│  │  Transport   │
   └────┬─────┘  └────┬─────┘  └──────┬───────┘
        │             │               │
        ▼             ▼               ▼
   ┌──────────┐  ┌──────────┐  ┌──────────────┐
   │ Terminal │  │  logs/   │  │   Browser    │
   │ Output   │  │ *.log    │  │   (UI Logs)  │
   └──────────┘  └──────────┘  └──────────────┘
```

#### Transports

1. **Console Transport**
   - Colorized terminal output
   - Timestamp and log level
   - Development and production

2. **File Transport**
   - Daily rotation: `logs/application-YYYY-MM-DD.log`
   - All log levels
   - Configurable retention

3. **Error File Transport**
   - Daily rotation: `logs/errors-YYYY-MM-DD.log`
   - Error and warning levels only
   - Easier debugging

4. **WebSocket Transport**
   - Real-time streaming to UI
   - Batches messages for efficiency
   - Filters by user preferences

#### Log Levels

- `logger.debug()` - Detailed debugging information
- `logger.info()` - General informational messages
- `logger.warn()` - Warning messages
- `logger.error()` - Error messages

#### Usage Pattern

```typescript
// Get logger instance
const logger = getLogger();

// Log at different levels
logger.debug("Debug details: %o", { data });
logger.info("User connected", { userId: 123 });
logger.warn("High memory usage: %d%%", memoryUsage);
logger.error("Failed to load model", { error, modelName });

// Server-side only
// Client-side components use console.log()
```

### 4. Database System

#### Normalized Schema v2.0

The database uses a fully normalized architecture with separate tables for each configuration type.

**Database Location**: `./data/llama-dashboard.db`
**Schema Version**: 2.0

#### Table Structure

**Core Tables:**
- `models` (34 fields) - Core model data (including fit_params tracking)
- `model_sampling_config` (36 fields) - Sampling parameters
- `model_memory_config` (8 fields) - Memory settings
- `model_gpu_config` (10 fields) - GPU configuration
- `model_advanced_config` (22 fields) - Advanced options
- `model_lora_config` (21 fields) - LoRA adapters
- `model_multimodal_config` (7 fields) - Multimodal settings
- `model_fit_params` (19 fields) - Fit-params analysis results (linked to models)
- `model_server_config` (38 fields) - Global server defaults (independent)

**Supporting Tables:**
- `metrics_history` (13 fields) - Last 10 minutes of metrics
- `metadata` (3 fields) - Dashboard global state

#### Relationships

Each model has 1-to-1 relationships with its configuration tables:

```
models (1) ────────── (1) model_sampling_config
models (1) ────────── (1) model_memory_config
models (1) ────────── (1) model_gpu_config
models (1) ────────── (1) model_advanced_config
models (1) ────────── (1) model_lora_config
models (1) ────────── (1) model_multimodal_config
```

**Cascade Delete**: When a model is deleted, all related configs are automatically deleted.

#### Key Benefits

- **Separation of Concerns**: Each config type has dedicated table
- **Lazy Loading**: Load core data first, configs as needed
- **Type Safety**: Separate TypeScript interfaces per config type
- **Data Integrity**: Foreign key constraints with CASCADE DELETE

### 5. Model Templates System

#### Architecture

The model templates system provides configuration persistence and reusability through:

- **API-Based Management** - Server-side storage (no client-side fs)
- **Zod Validation** - Type-safe schemas for data integrity
- **Client-Side Caching** - Reduces API calls
- **Async/Await Pattern** - Modern async operations

#### Components

**API Endpoints:**
- `GET /api/model-templates` - Load templates from config
- `POST /api/model-templates` - Save templates to config

**Client Library:**
- `src/lib/client-model-templates.ts` - Template management functions
- `src/config/model-templates.json` - Template storage

**Zod Schemas:**
- `modelTemplateSchema` - Individual template validation
- `modelTemplatesConfigSchema` - Complete config validation
- `modelTemplateSaveRequestSchema` - POST request validation
- `modelTemplateResponseSchema` - API response validation

#### Usage Pattern

```typescript
import {
  loadModelTemplates,
  saveModelTemplate,
  getModelTemplate,
  getModelTemplates
} from '@/lib/client-model-templates';

// Load all templates
const templates = await loadModelTemplates();

// Get template for specific model
const template = await getModelTemplate('llama-2-7b');

// Save new template
await saveModelTemplate('mistral-7b', 'chat-template');

// Get all templates (with caching)
const allTemplates = await getModelTemplates();
```

#### Storage Format

```json
{
  "default_model": null,
  "model_templates": {
    "llama2-7b": "llama-2-7b",
    "mistral-7b": "mistral-7b",
    "custom-model": "custom-template"
  }
}
```

#### Integration

**ModelsListCard Component:**
- Loads templates on mount
- Shows template dropdown when model has available templates
- Saves template selection to config
- Displays "Save Template" button for running models

### 6. Configuration Management (Legacy JSON)

#### Llama Server Configuration (TypeScript ESM)
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

### Next.js Configuration Optimizations

Critical performance improvements in `next.config.ts`:

```typescript
const nextConfig = {
  devIndicators: false,         // ↓ 95% reduction in console logs
  logging: 'warn',              // ↓ Only warnings and errors
  reactStrictMode: 'production', // ↓ 50-70% faster than development
  productionBrowserSourceMaps: false, // ↓ Smaller bundles in production
};
```

**Impact:**
- Console spam reduced by 95% (from 10,000 to 50-100 logs/sec)
- Rendering improved by 50-70% faster
- Production mode React instead of dev mode

### Frontend Optimizations

#### React 19.2 Performance Features
- **useTransition**: Non-blocking UI updates during heavy operations
- **useDeferredValue**: Debounced values for performance-critical rendering
- **React Compiler**: Automatic optimization (no manual memoization needed in most cases)
- **useEffectEvent**: Stable event handlers preventing dependency cycles

#### Component-Level Optimizations
- **LazyMotion**: Deferred animation loading for better initial bundle size
- **Code Splitting**: Automatic route-based splitting via Next.js 16 Turbopack
- **Image Optimization**: Next.js built-in image optimization
- **Memoization**: useCallback and useMemo for expensive operations
- **Virtualization**: Efficient rendering of large lists (for logs, models lists)

#### State Management Optimizations
- **React Query Caching**: Automatic caching and deduplication of API calls
- **Zustand Selectors**: Efficient re-render subscriptions to specific state
- **WebSocket Batching**: Batched message updates to reduce re-renders

### Backend Optimizations

#### Database Performance
- **WAL Journal Mode**: Write-Ahead Logging for better concurrency
- **Prepared Statements**: Reusable SQL queries for performance
- **Indexing**: Optimized indexes on frequently queried columns
- **Connection Pooling**: Reused database connections
- **Auto-Vacuum**: Automatic database optimization and cleanup

#### API Layer Optimizations
- **Connection Pooling**: Reused HTTP connections to llama-server
- **In-Memory Caching**: Fast responses for frequently accessed data (e.g., model templates)
- **Streaming**: Real-time data streaming via WebSocket to reduce polling overhead
- **Background Processing**: Non-blocking operations for better responsiveness
- **Request Deduplication**: React Query prevents duplicate API calls

#### Logging Optimizations
- **Daily Rotation**: Automatic log file rotation prevents disk bloat
- **Buffered Writes**: Batches log entries before writing to disk
- **Level Filtering**: Only logs specified level and above
- **WebSocket Streaming**: Efficient batched log streaming to UI

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
- **98% coverage threshold** for branches, functions, lines, statements
- **Proper mocking** of external dependencies (axios, socket.io-client, Winston)
- **Jest with ts-jest** for TypeScript support
- **React Testing Library** for component testing
- **Coverage reports** via `pnpm test:coverage`

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
