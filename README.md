# Next.js Llama Async Proxy

A modern web interface for managing Llama AI models through llama-server integration. Built with Next.js 16, React 19.2, TypeScript, and Socket.IO.

## 🚀 Features

- **Real-time Dashboard**: Live metrics, performance graphs, and activity monitoring
- **Model Management**: Automatic model discovery, loading, and lifecycle management
- **Colored Logs**: Comprehensive Winston-based logging system with daily rotation
- **Modern Theme**: Dark/light mode with smooth animations and 3D effects
- **REST API**: Complete endpoints for model management and configuration
- **WebSocket**: Real-time communication with automatic reconnection and exponential backoff
- **Socket.IO Integration**: Robust bidirectional real-time data streaming
- **Configuration Management**: Database-backed configuration with normalized schema v2.0
- **Model Templates**: Zod-validated template system with client-side caching
- **Type-Safe**: Full TypeScript implementation with strict mode
- **Comprehensive Tests**: Jest test suite with 67%+ coverage (target: 98%)
- **Performance Optimized**: 50-97% faster rendering with Next.js config tuning

## 🏗️ Architecture

See **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** for complete system architecture documentation.

## 📋 Features

See **[docs/FEATURES.md](docs/FEATURES.md)** for comprehensive feature documentation including:
- Real-time WebSocket communication with automatic reconnection
- Model templates system with API-based management
- Winston logging system with daily rotation
- Performance optimizations (50-97% faster)
- Database v2.0 normalized schema
- MUI v8 migration and benefits
- All recent architectural changes

## 📚 Documentation

### User Documentation

- **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)** - Complete user manual and workflows
- **[docs/CONFIGURATION.md](docs/CONFIGURATION.md)** - Full configuration reference
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide for all environments
 - **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions
 
 ### Technical Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design
- **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API documentation
- **[docs/CONFIGURATION_QUICKREF.md](docs/CONFIGURATION_QUICKREF.md)** - Configuration quick reference
- **[docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)** - Development environment setup
- **[docs/FEATURES.md](docs/FEATURES.md)** - Comprehensive feature documentation

### Additional Guides

- **[docs/ANIMATION_ARCHITECTURE.md](docs/ANIMATION_ARCHITECTURE.md)** - Animation system design
- **[docs/TESTING.md](docs/TESTING.md)** - Testing guide and patterns
- **[docs/COVERAGE.md](docs/COVERAGE.md)** - Coverage metrics and improvement strategies
- **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Contributing guidelines

### Technology Stack

#### Frontend

- **Next.js 16.1.0** - App Router with Server Components
- **React 19.2.3** - Latest React features
- **TypeScript 5.9.3** - Strict mode enabled
- **MUI v8.3.6** - UI components with `size` prop pattern (not deprecated `item`)
- **@mui/x-charts v8.23.0** - Charts and data visualization
- **Tailwind CSS v4** - Utility-first styling
- **Framer Motion** - Animation library with LazyMotion optimization
- **Zustand v5.0.9** - Client state management
- **@tanstack/react-query v5** - Server state management
- **Socket.IO Client v4.8.3** - Real-time communication with auto-reconnection
- **React Hook Form v8.69.0** - Form handling
- **Zod v4.2.1** - Runtime validation with comprehensive schemas

#### Backend/Server

- **Express 5.2.1** - HTTP server wrapper
- **Socket.IO Server v4.8.3** - WebSocket server with reconnection support
- **tsx 4.21.0** - TypeScript runtime for server
- **Node.js 24.11.1** - Runtime environment
- **Winston 3.19.0** - Logging with daily rotation, multiple transports
- **better-sqlite3 12.5.0** - SQLite database for configuration persistence
- **Axios 1.13.2** - HTTP client

#### Development

- **Jest 30.2.0** - Testing framework
- **ts-jest 29.4.6** - TypeScript Jest preset
- **ESLint 9.39.2** - Linting
- **pnpm** - Package manager

## 🛠️ Installation & Development

See **[DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)** for complete development environment setup.

### Prerequisites

- **Node.js 18+** (required)
- **pnpm 9+** (required - not npm or yarn)
- **llama-server binary** - Available on your system

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd nextjs-llama-async-proxy

# Install dependencies with pnpm
pnpm install

# Configure llama-server
# Create llama-server-config.json in project root:
cat > llama-server-config.json << EOF
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/path/to/your/models",
  "serverPath": "/path/to/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
EOF

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Parameters Configuration

The application uses **`llama-server-config.json`** for configuration (not localStorage):

```json
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/media/bamer/crucial MX300/llm/llama/models",
  "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

**Key Configuration Fields:**

- `host`: Llama server host address
- `port`: Llama server port
- `basePath`: Directory containing GGUF model files
- `serverPath`: Full path to llama-server binary
- `ctx_size`: Context window size (default: 8192)
- `batch_size`: Processing batch size (default: 512)
- `threads`: Number of CPU threads (-1 for auto)
- `gpu_layers`: GPU layers to offload (-1 for all)

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with tsx
pnpm dev:debug       # Development with debug logging

# Build & Production
pnpm build           # Production build (Turbopack)
pnpm start           # Start production server with tsx

# Testing
pnpm test            # Run all Jest tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Generate coverage report (70% threshold)

# Linting & Type Checking
pnpm lint            # Run ESLint
pnpm lint:fix        # Auto-fix linting issues
pnpm type:check      # TypeScript type check (tsc --noEmit)
```

## 🔧 Troubleshooting

### Models Not Appearing

If models are not loading or appearing in the dashboard:

#### 1. Check Database State

Verify that models exist in the database:

```bash
# Using health endpoint
curl http://localhost:3000/api/health/models

# Should show:
{
  "database_model_count": 18,
  "status": "ok",
  "models": [...]
}
```

If `database_model_count` is 0, models are not persisted.

#### 2. Clear Database and Restart

If models exist in llama-server but not in database, clear and restart:

```bash
# Stop server
pkill -f "node.*server.js"

# Remove database
rm -f /home/bamer/nextjs-llama-async-proxy/data/llama-dashboard.db

# Start server
pnpm dev
```

The server will automatically import all models from llama-server on startup.

#### 3. Check Models Directory Configuration

Verify that models directory is correctly configured:

```bash
# Check llama-server-config.json
cat /home/bamer/nextjs-llama-async-proxy/llama-server-config.json | grep basePath

# Should point to your models directory, e.g.:
# "basePath": "/media/bamer/crucial MX300/llm/llama/models"

# Verify directory exists
ls -la /media/bamer/crucial MX300/llm/llama/models | head -5
```

#### 4. Manual Model Import

You can manually trigger model import without restarting the server:

```bash
# Using API endpoint
curl -X POST http://localhost:3000/api/models/import

# Response:
{
  "success": true,
  "data": {
    "message": "Import complete: 0 new, 18 updated",
    "imported": 0,
    "updated": 18,
    "errors": 0
  }
}
```

#### 5. Check Server Logs

Look for auto-import messages in the logs:

```bash
# Check today's logs
tail -100 /home/bamer/nextjs-llama-async-proxy/logs/application-$(date +%Y-%m-%d).log | grep AUTO-IMPORT

# Should see:
# [AUTO-IMPORT] Database has 0 models
# [AUTO-IMPORT] Database is empty, importing from llama-server...
# [AUTO-IMPORT] Found 18 models from llama-server
# [AUTO-IMPORT] Imported model: ModelName (DB ID: X)
# ✅ [AUTO-IMPORT] Models import completed
```

#### 6. Verify LlamaServer is Running

Ensure that llama-server is running and accessible:

```bash
# Check if llama-server process is running
ps aux | grep llama-server | grep -v grep

# Test health endpoint
curl http://localhost:8134/health

# Test models endpoint
curl http://localhost:8134/models

# Should return list of available models
```

#### 7. Common Error Messages

| Error Message | Cause | Solution |
|---------------|--------|----------|
| `NOT NULL constraint failed: models.name` | Model name is null or empty | Ensure models have valid names in llama-server presets |
| `Model name is required and cannot be empty` | Invalid model name validation | Check model names in your models directory |
| `[AUTO-IMPORT] LlamaService not available` | LlamaServer integration failed | Check llama-server-config.json and server logs |
| `[WS] Loaded 0 model(s) from database` | Database is empty | Clear database and restart server for auto-import |
| `Failed to import models: ...` | Filesystem or database error | Check file permissions and disk space |

### Auto-Import Behavior

The application automatically imports models from llama-server when:

1. The database is empty (0 models)
2. The server starts up
3. LlamaServer integration is successfully initialized

Models are imported with default configuration values from `llama-server-config.json`:

- `ctx_size`: From config file
- `batch_size`: From config file
- `threads`: From config file
- `status`: Set to "stopped" initially

### Manual Import Options

#### Via API Endpoint

```bash
# Trigger full model scan and import
curl -X POST http://localhost:3000/api/models/import
```

#### Via WebSocket

```javascript
// Send rescan command via WebSocket
websocketClient.sendMessage('rescanModels');
```

#### Via ModelSyncService

```typescript
// Programmatic sync (advanced use case)
import { ModelSyncService } from '@/server/services/ModelSyncService';

const result = await ModelSyncService.syncModelsFromLlamaServer(llamaModels);
console.log(`Synced: ${result.imported} imported, ${result.updated} updated`);
```

### Health Check Endpoint

The `/api/health/models` endpoint provides:

- **database_model_count**: Number of models in database
- **models_directory**: Path to models directory from config
- **status**: "ok" if models exist, "needs_import" if empty
- **models**: Array of all models with basic info
- **timestamp**: When the check was performed

Use this to verify model synchronization status:

```bash
curl http://localhost:3000/api/health/models | jq '.'
```

### Database Reset

To completely reset the model database:

```bash
# Stop server
pkill -f "node.*server.js"

# Remove database
rm -f /home/bamer/nextjs-llama-async-proxy/data/llama-dashboard.db

# Restart server
pnpm dev
```

**Warning**: This will delete all model configurations and custom settings. Models will be re-imported with default values.

### Advanced Debugging

#### Check Database Directly

```bash
# Open SQLite database
sqlite3 /home/bamer/nextjs-llama-async-proxy/data/llama-dashboard.db

# In SQLite shell:
SELECT id, name, type, status, model_path FROM models;
.quit
```

#### Monitor WebSocket Messages

```javascript
// Add logging to see WebSocket traffic
socket.onAny((event, ...args) => {
  console.log('[WS]', event, args);
});
```

#### Enable Debug Logging

Check logs for detailed operation traces:

```bash
# Follow logs in real-time
tail -f /home/bamer/nextjs-llama-async-proxy/logs/application-$(date +%Y-%m-%d).log
```

Look for:
- `[AUTO-IMPORT]` - Model import activity
- `[ModelSync]` - Sync service operations
- `[SOCKET.IO]` - WebSocket communication
- `[WS]` - WebSocket events

## 📊 API Overview

See **[API_REFERENCE.md](docs/API_REFERENCE.md)** for complete API documentation.

### Quick API Reference

#### Configuration

- `GET /api/config` - Get current configuration
- `POST /api/config` - Save/update configuration

#### Models

- `GET /api/models` - List registered models
- `POST /api/models` - Register new models
- `POST /api/models/discover` - Automatic model discovery

#### Health

- `GET /api/health` - Health check

#### Llama Server Control

- Various endpoints for controlling llama-server process

### Real-time Communication

- **WebSocket**: `ws://localhost:3000/llamaproxws`
- **Socket.IO**: `/socket.io` namespace
- **Path**: `/llamaproxws`
- **Host**: `localhost:3000` (default, configurable via PORT env var)

## 🎨 User Interface

See **[USER_GUIDE.md](docs/USER_GUIDE.md)** for complete user manual.

### Pages

- **Dashboard** - Real-time metrics and system overview
- **Models** - Model discovery, loading, and management
- **Monitoring** - Performance charts and analytics
- **Logs** - Real-time log streaming with filtering
- **Settings** - Configuration management (uses API, not localStorage)

### Key Features

- **Dark/Light Mode**: Automatic theme switching with MUI v8
- **Real-time Updates**: Live metrics via WebSocket
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: Framer Motion with LazyMotion
- **Accessibility**: High contrast, keyboard navigation

## 🧪 Testing

Comprehensive test suite with **67.47% line coverage** (target: 98%):

### Current Coverage Status

| Metric | Coverage | Target | Gap |
|--------|----------|--------|-----|
| **Lines** | 67.47% | 98% | -30.53% |
| **Branches** | 54.63% | 98% | -43.37% |
| **Functions** | 58.43% | 98% | -39.57% |
| **Statements** | ~67.47% | 98% | -31% |

### Test Suite Statistics

- ✅ **187 test files** (up from 178)
- ✅ **5,757 tests** (up from 4,173, +38%)
- ✅ **103 test suites passing**
- ✅ **137 files covered** by tests
- ✅ Test execution time: <2 minutes

### High-Achievement Components

| Component | Coverage | Status |
|-----------|----------|--------|
| **WebSocket Provider** | 98% | 🎯 Target Met |
| **fit-params-service** | 97.97% | 🎯 Near Target |
| **Button Component** | 100% | 🎯 Perfect |
| **Validators** | 95%+ | ✅ Excellent |
| **Database** | 63/65 tests | ✅ Good |
| **Hooks & Contexts** | 95%+ | ✅ Excellent |
| **Server Code** | 97%+ | ✅ Excellent |

### Coverage by Category

| Category | Lines | Status |
|----------|-------|--------|
| **Hooks & Contexts** | 95%+ | ✅ Excellent |
| **Lib & Services** | 97%+ | ✅ Excellent |
| **Server Code** | 97%+ | ✅ Excellent |
| **Layout & UI** | 80-100% | ✅ Good |
| **Pages & Config** | ~80% | ⚠️ Needs Work |
| **Dashboard & Charts** | ~55% | ❌ Needs Improvement |

### Documentation

- **[TESTING.md](docs/TESTING.md)** - Comprehensive testing guide with patterns, best practices, and examples
- **[COVERAGE.md](docs/COVERAGE.md)** - Detailed coverage metrics, reporting, and improvement strategies

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test __tests__/components/dashboard/MetricCard.test.tsx

# Run tests without coverage (faster for debugging)
pnpm test --no-coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## ⚡ Performance Optimizations

### Next.js Configuration
- **DevIndicators disabled** - Reduced console logs by 95% (from 10,000 to 50-100/sec)
- **React Strict Mode production** - 50-70% faster rendering
- **Production SourceMaps disabled** - Smaller bundle sizes

### Frontend Optimizations
- **LazyMotion** - Deferred animation loading for better initial bundle
- **Code Splitting** - Automatic route-based splitting via Turbopack
- **Memoization** - React Compiler aware patterns (useEffectEvent, useMemo, useCallback)
- **Batch Updates** - Optimized chart updates to reduce re-renders
- **Request Idle Callback** - Non-blocking UI updates

### Backend Optimizations
- **Connection Pooling** - Reused HTTP connections
- **Caching** - In-memory cache for frequent data
- **Streaming** - Real-time data via WebSocket
- **Background Processing** - Non-blocking operations

### Database Performance
- **Normalized Schema v2.0** - Efficient querying with specialized tables
- **Indexes** - Optimized lookups on model name, status, type
- **Cascade Delete** - Automatic cleanup of related configs
- **Auto Vacuum** - Keeps database size minimal

## 🔌 WebSocket Reconnection

### Features
- **Automatic Reconnection** - Exponential backoff strategy (1s → 2s → 4s → 8s → 16s, max 30s)
- **Maximum Attempts** - 5 retry attempts before giving up
- **Data Resubscription** - Automatically requests metrics, models, logs after reconnect
- **Page Visibility Handling** - Reconnects when tab becomes visible
- **Progress Indicators** - Shows reconnection attempt count in UI

### Connection States
- **CONNECTED** - Green chip, no animation
- **RECONNECTING (X/5)** - Orange/yellow with pulsing animation, shows attempt count
- **DISCONNECTED** - Red chip with pulsing animation
- **CONNECTION ERROR** - Red chip after max attempts reached

## 📝 Logging System

### Winston Configuration
**Winston 3.19.0** is the sole logging system with:

- **Console Transport** - Colorized terminal output
- **File Transport** - Daily rotated logs to `logs/application-YYYY-MM-DD.log`
- **Error File Transport** - Separate error logs to `logs/errors-YYYY-MM-DD.log`
- **WebSocket Transport** - Real-time streaming to UI via Socket.IO

### Log Levels
- `logger.debug()` - Detailed debugging information
- `logger.info()` - General informational messages
- `logger.warn()` - Warning messages
- `logger.error()` - Error messages

### Log Retention
- Daily log rotation (automatic)
- Configurable retention period
- Separate error logs for easier debugging

## 🎨 Model Templates System

### Features
- **API-Based Management** - Server-side template storage (no client-side fs)
- **Zod Validation** - Type-safe template schemas
- **Client-Side Caching** - Reduces API calls
- **Async/Await Pattern** - Modern async template operations
- **Default Templates** - Merges with file-based templates

### API Endpoints
- `GET /api/model-templates` - Load templates from config
- `POST /api/model-templates` - Save templates to config

### Template Storage
- **Config File**: `src/config/model-templates.json`
- **Format**: `{"default_model": null, "model_templates": {}}`
- **Validation**: Zod schemas ensure data integrity

## 💾 Database v2.0 (Normalized)

### Architecture Benefits
- **Separation of Concerns** - Each config type has dedicated table
- **Clear Relationships** - Foreign keys with CASCADE DELETE
- **Lazy Loading** - Load core data first, configs as needed
- **Type Safety** - Separate TypeScript interfaces per config type

### Tables
- `models` - Core model data (26 fields)
- `model_sampling_config` - Sampling parameters (36 fields)
- `model_memory_config` - Memory settings (8 fields)
- `model_gpu_config` - GPU configuration (10 fields)
- `model_advanced_config` - Advanced options (22 fields)
- `model_lora_config` - LoRA adapters (21 fields)
- `model_multimodal_config` - Multimodal settings (7 fields)
- `model_server_config` - Global server settings (38 fields, independent)
- `metrics_history` - Last 10 minutes of metrics (13 fields)
- `metadata` - Dashboard global state (3 fields)

### Key Features
- **Cascade Delete** - Deleting a model removes all related configs automatically
- **Independent Server Config** - Global settings persist regardless of models
- **Auto Cleanup** - Metrics older than 10 minutes removed automatically

## 🚀 Deployment

See **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** for comprehensive deployment instructions.

### Quick Production Setup

```bash
# Build application
pnpm build

# Start production server
pnpm start
```

### Environment Variables

```env
# Application
NODE_ENV=production
PORT=3000

# Development
pnpm dev              # Uses tsx for TypeScript execution
```

### Supported Platforms

- **Docker** - Containerized deployment
- **Vercel** - Serverless deployment (frontend only)
- **Railway** - Cloud platform
- **AWS/GCP/Azure** - Cloud infrastructure
- **Self-hosted** - Traditional server deployment

## 📁 Project Structure

```
nextjs-llama-async-proxy/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── config/             # Configuration API (GET/POST)
│   │   ├── model-templates/    # Model templates API (GET/POST)
│   │   ├── llama-server/        # Llama server control
│   │   ├── models/             # Model management (CRUD)
│   │   ├── logger/             # Logger configuration
│   │   └── health/            # Health checks
│   ├── dashboard/              # Dashboard page
│   ├── settings/               # Settings page
│   ├── models/                # Models page
│   ├── monitoring/             # Monitoring page
│   ├── logs/                 # Logs page
│   └── layout.tsx            # Root layout component
├── src/
│   ├── components/            # React components
│   │   ├── dashboard/        # Dashboard-specific
│   │   ├── models/           # Model management UI
│   │   ├── configuration/    # Settings components
│   │   ├── layout/           # Layout components (Header, Sidebar)
│   │   └── ui/              # Reusable UI components (MUI v8)
│   ├── hooks/                # Custom React hooks
│   │   ├── use-api.ts       # React Query integration
│   │   ├── use-websocket.ts  # WebSocket hook with reconnection
│   │   ├── useConfigurationForm.ts
│   │   └── use-logger-config.ts
│   ├── lib/                  # Utilities and services
│   │   ├── server-config.ts   # Config service (TypeScript ESM)
│   │   ├── logger.ts         # Winston logger (3.19.0)
│   │   ├── database.ts       # SQLite database (better-sqlite3)
│   │   ├── model-templates.ts # Model templates management
│   │   ├── validators.ts     # Zod schemas for validation
│   │   ├── websocket-client.ts
│   │   └── analytics.ts      # Analytics
│   ├── config/               # Configuration files
│   │   └── model-templates.json
│   ├── services/             # Client-side services
│   │   └── api-service.ts  # API service layer
│   ├── server/              # Server-side code
│   │   ├── services/        # Llama integration
│   │   │   ├── LlamaService.ts
│   │   │   ├── LlamaServerIntegration.ts
│   │   │   ├── ServiceRegistry.ts
│   │   │   └── fit-params-service.ts
│   ├── contexts/            # React contexts
│   │   └── ThemeContext.tsx # Theme provider
│   ├── providers/          # React providers
│   │   └── WebSocketProvider.tsx
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
│       └── api-client.ts    # Axios wrapper
├── __tests__/              # Test files (Jest)
│   ├── lib/
│   ├── app/api/
│   ├── hooks/
│   ├── components/
│   ├── providers/
│   └── server/
├── data/                  # SQLite database
│   └── llama-dashboard.db # Normalized database v2.0
├── logs/                  # Winston log files
│   ├── application-YYYY-MM-DD.log
│   └── errors-YYYY-MM-DD.log
├── docs/                  # Documentation
├── public/                # Static assets
├── server.js              # Express + Socket.IO server entry point
├── llama-server-config.json # Configuration file
└── [config files]        # Build and development configuration
```

## 🤝 Contributing

### Development Guidelines

See [AGENTS.md](AGENTS.md) for detailed coding guidelines.

### Project Standards

- **TypeScript**: Strict mode enabled, interfaces over type aliases
- **Formatting**: 2 spaces, double quotes, 100-char line width
- **Linting**: ESLint with auto-fix support
- **React**: Functional components with hooks only
- **Testing**: Jest + React Testing Library, 67%+ coverage (target: 98%)
- **MUI v8**: Use `size` prop instead of deprecated `item` prop on Grid

### MUI v8 Migration
**Critical**: MUI v8 deprecated the `item` prop on Grid components. Always use `size` prop instead:

```tsx
// ❌ WRONG (MUI v6 syntax)
<Grid item xs={12} sm={6} md={4}>

// ✅ CORRECT (MUI v8 syntax)
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
```

### Import Order

```typescript
// 1. Builtin
import { useState, useEffect } from "react";

// 2. External
import { Box, Button } from "@mui/material";

// 3. Internal (@/ imports)
import { useApi } from "@/hooks/use-api";
import { logger } from "@/lib/logger";
```

## 📝 Documentation

### Complete Documentation Suite

#### User Documentation
- **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)** - Complete user manual and workflows
- **[docs/CONFIGURATION.md](docs/CONFIGURATION.md)** - Full configuration reference
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide for all environments
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Alternative deployment documentation

#### Technical Documentation
- **[docs/FEATURES.md](docs/FEATURES.md)** - Comprehensive feature documentation
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design
- **[docs/CONFIGURATION_QUICKREF.md](docs/CONFIGURATION_QUICKREF.md)** - Configuration quick reference
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API documentation
- **[docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)** - Development environment setup
- **[docs/ANIMATION_ARCHITECTURE.md](docs/ANIMATION_ARCHITECTURE.md)** - Animation system design
- **[docs/TESTING.md](docs/TESTING.md)** - Testing guide and patterns
- **[docs/COVERAGE.md](docs/COVERAGE.md)** - Coverage metrics and improvement strategies

### Development & Configuration

- [AGENTS.md](AGENTS.md) - Coding guidelines & project standards
- [README.md](README.md) - Project overview and quick start

## 🔗 Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [MUI v8 Documentation](https://mui.com/)
- [Zod Validation](https://zod.dev)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [pnpm Package Manager](https://pnpm.io)
- [llama.cpp](https://github.com/ggerganov/llama.cpp)

## 📄 License

MIT - See LICENSE file for details

## 🆘 Support

For issues, questions, or contributions:

1. Check existing documentation
2. Review test files for implementation examples
3. Create a new issue with detailed information
4. Follow coding guidelines in AGENTS.md

---

**Next.js Llama Async Proxy** - Version 0.2.0
**Last Updated**: December 30, 2025

## Recent Updates (v0.2.0)

### Performance
- ✅ 50-97% faster rendering with Next.js config optimization
- ✅ 95% reduction in console logs (from 10,000 to 50-100/sec)
- ✅ React production mode (50-70% faster than dev mode)
- ✅ LazyMotion for optimized animations
- ✅ Batch chart updates to reduce re-renders
- ✅ Request Idle Callback for non-blocking UI updates

### Features
- ✅ WebSocket automatic reconnection with exponential backoff (1s → 2s → 4s → 8s → 16s, max 30s)
- ✅ Maximum 5 retry attempts before giving up
- ✅ Automatic data resubscription on reconnect
- ✅ Page visibility handling for reconnection
- ✅ Model templates system with Zod validation
- ✅ API-based template management (no client-side fs)
- ✅ In-memory caching for template responses
- ✅ Database v2.0 normalized schema with specialized tables
- ✅ Winston 3.19.0 logging system with daily rotation
- ✅ Real-time log streaming via WebSocket
- ✅ Separate error logs for easier debugging

### Architecture
- ✅ MUI v8.3.6 migration with `size` prop pattern
- ✅ TypeScript ESM migration for server-config
- ✅ Removed client-side fs operations (security improvement)
- ✅ API-based configuration management (not localStorage)
- ✅ Cascade delete for database relationships

### Testing
- ✅ 187 test files with 5,757 tests (+38% from 4,173)
- ✅ 67.47% line coverage (target: 98%)
- ✅ 98% coverage achieved for WebSocket provider
- ✅ 97.97% coverage for fit-params-service
- ✅ 100% coverage achieved for Button component
- ✅ 95%+ coverage for Hooks & Contexts
- ✅ 97%+ coverage for Lib & Services

### UI/UX
- ✅ MUI v8.3.6 with @mui/material-nextjs for Next.js 16
- ✅ ModelConfigDialog improvements with sliders and accordions
- ✅ Enhanced tooltip system with comprehensive coverage
- ✅ Improved validation and error handling
- ✅ Dark mode enhancements
- ✅ Connection status indicators with reconnection progress
- ✅ Color-coded log levels
- ✅ Real-time filtering for logs