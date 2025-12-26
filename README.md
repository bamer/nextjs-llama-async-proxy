# Next.js Llama Async Proxy

A modern web interface for managing Llama AI models through llama-server integration. Built with Next.js 16, React 19.2, TypeScript, and Socket.IO.

## 🚀 Features

- **Real-time Dashboard**: Live metrics, performance graphs, and activity monitoring
- **Model Management**: Automatic model discovery, loading, and lifecycle management
- **Colored Logs**: Comprehensive log system with distinct color levels
- **Modern Theme**: Dark/light mode with smooth animations and 3D effects
- **REST API**: Complete endpoints for model management and configuration
- **WebSocket**: Real-time communication for metrics, logs, and status updates
- **Socket.IO Integration**: Robust bidirectional real-time data streaming
- **Configuration Management**: JSON-based configuration with API persistence
- **Type-Safe**: Full TypeScript implementation with strict mode
- **Comprehensive Tests**: Jest test suite with 70%+ coverage

## 🏗️ Architecture

See **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** for complete system architecture documentation.

### Technology Stack

#### Frontend
- **Next.js 16.1.0** - App Router with Server Components
- **React 19.2.3** - Latest React features
- **TypeScript 5.9.3** - Strict mode enabled
- **MUI v7.3.6** - UI components (@mui/material-nextjs)
- **@mui/x-charts v8.23.0** - Charts and data visualization
- **Tailwind CSS v4** - Utility-first styling
- **Framer Motion** - Animation library with LazyMotion optimization
- **Zustand v5.0.9** - Client state management
- **@tanstack/react-query v5** - Server state management
- **Socket.IO Client v4.8.1** - Real-time communication
- **React Hook Form v7.69.0** - Form handling
- **Zod v4.2.1** - Runtime validation

#### Backend/Server
- **Express 5.2.1** - HTTP server wrapper
- **Socket.IO Server v4.8.1** - WebSocket server
- **tsx 4.21.0** - TypeScript runtime for server
- **Node.js 24.11.1** - Runtime environment
- **Winston 3.19.0** - Logging with winston-daily-rotate-file
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

### Configuration

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

- **Dark/Light Mode**: Automatic theme switching with MUI v7
- **Real-time Updates**: Live metrics via WebSocket
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: Framer Motion with LazyMotion
- **Accessibility**: High contrast, keyboard navigation

## 🧪 Testing

Comprehensive test suite achieving 70%+ coverage:

### Test Structure
```
__tests__/
├── lib/
│   ├── server-config.test.ts      # Config loading/saving
│   └── logger.test.ts              # Winston logger
├── app/api/
│   └── config/
│       └── route.test.ts           # Config API
├── hooks/
│   └── use-logger-config.test.ts    # Logger config hook
├── components/configuration/
│   └── hooks/
│       └── useConfigurationForm.test.ts  # Settings form
└── server/
    └── ServiceRegistry.test.ts     # Service registry
```

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Run specific test file
pnpm test __tests__/lib/server-config.test.ts
```

## 🚀 Deployment

See **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** for comprehensive deployment instructions.

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
│   │   ├── llama-server/        # Llama server control
│   │   ├── models/             # Model management
│   │   ├── logger/             # Logger config
│   │   └── health/            # Health checks
│   ├── dashboard/              # Dashboard page
│   ├── settings/               # Settings page
│   ├── models/                # Models page
│   ├── monitoring/             # Monitoring page
│   ├── logs/                 # Logs page
│   └── layout.tsx            # Root layout
├── src/
│   ├── components/            # React components
│   │   ├── dashboard/        # Dashboard-specific
│   │   ├── configuration/    # Settings components
│   │   ├── layout/           # Layout components
│   │   └── ui/              # Reusable UI
│   ├── hooks/                # Custom React hooks
│   │   ├── use-api.ts       # React Query integration
│   │   ├── use-websocket.ts  # WebSocket hook
│   │   └── use-logger-config.ts
│   ├── lib/                  # Utilities and services
│   │   ├── server-config.ts # Config service (TypeScript ESM)
│   │   ├── logger.ts        # Winston logger
│   │   └── analytics.ts     # Analytics
│   ├── services/             # Client-side services
│   │   └── api-service.ts  # API service layer
│   ├── server/              # Server-side code
│   │   ├── services/        # Llama integration
│   │   │   ├── LlamaService.ts
│   │   │   ├── LlamaServerIntegration.ts
│   │   │   └── ServiceRegistry.ts
│   ├── contexts/            # React contexts
│   │   └── ThemeContext.tsx
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
│       └── api-client.ts    # Axios wrapper
├── __tests__/              # Test files (Jest)
│   ├── lib/
│   ├── app/api/
│   ├── hooks/
│   ├── components/
│   └── server/
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
- **Testing**: Jest + React Testing Library, 70%+ coverage
- **MUI v7**: Use `size` prop instead of `item` on Grid

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

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API documentation
- **[USER_GUIDE.md](docs/USER_GUIDE.md)** - User manual and workflows
- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Deployment and production setup
- **[DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)** - Development environment setup
- **[ANIMATION_ARCHITECTURE.md](docs/ANIMATION_ARCHITECTURE.md)** - Animation system design

### Development & Configuration

- [AGENTS.md](AGENTS.md) - Coding guidelines & project standards
- [README.md](README.md) - Project overview and quick start

## 🔗 Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [MUI v7 Documentation](https://mui.com/)
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

**Next.js Llama Async Proxy** - Version 0.1.0
**Last Updated**: December 27, 2025
