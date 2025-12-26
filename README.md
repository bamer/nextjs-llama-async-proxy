# Llama Runner Async Proxy

A modern, elegant web interface for managing Llama models with Ollama and LMStudio support. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## ⚠️ SECURITY WARNING

**🔓 THIS PROJECT IS INTENTIONALLY WITHOUT AUTHENTICATION**

This system is designed for **public access** without authentication mechanisms. All endpoints (WebSocket, SSE, API) are open and accessible without credentials. This is integral to the architectural design.

📄 [Read the complete security document](SECURITY_NOTICE.md)

## 🚀 Features

- **Real-time Dashboard**: Metrics, performance graphs, live activity
- **Model Management**: Automatic discovery, management, and monitoring
- **Colored Logs**: Log system with distinct color levels
- **Modern Theme**: Dark/light design with smooth animations and 3D effects
- **REST API**: Complete endpoints for model management and configuration
- **WebSocket**: Real-time communication for metrics and logs
- **Socket.IO Integration**: Robust real-time data streaming

## 🏗️ Architecture

See **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** for complete system architecture documentation.

### Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Emotion, Material-UI v7
- **Real-time**: Socket.IO + WebSocket, Server-Sent Events (SSE)
- **Forms & Validation**: React Hook Form, Zod
- **Charts**: Recharts, MUI X-Charts
- **State Management**: Zustand, React Query
- **Server**: Express.js, Node.js
- **Package Manager**: pnpm (required)
- **Build**: Turbopack (Next.js built-in)
- **Testing**: Jest, React Testing Library
- **Logging**: Winston

## 🛠️ Installation & Development

See **[DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)** for complete development environment setup.

### Prerequisites

- **Node.js 18+** (required)
- **pnpm 9+** (required - not npm or yarn)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd nextjs-llama-async-proxy

# Install dependencies with pnpm
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 📋 Configuration (Important)

Before starting the application, create `.llama-proxy-config.json`:

```json
{
  "llama_server_host": "localhost",
  "llama_server_port": 8134,
  "llama_server_path": "/path/to/llama-server",
  "basePath": "./models"
}
```

**Key Points:**
- `llama_server_path`: Full path to llama-server binary
- `basePath`: Directory containing your GGUF model files
- **DO NOT** specify `llama_model_path` (removed to fix startup crashes)

The application now starts llama-server **without** loading a model, then auto-discovers available models from the `basePath` directory.

👉 **See [LLAMA_STARTUP_GUIDE.md](LLAMA_STARTUP_GUIDE.md) for complete setup instructions.**

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server (Next.js + Express + Socket.IO)
pnpm dev:debug       # Development with debug logging

# Build & Production
pnpm build           # Build for production
pnpm start           # Start production server

# Testing
pnpm test            # Run Jest tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Run tests with coverage report

# Linting & Type Checking
pnpm lint            # Run ESLint
pnpm lint:fix        # Auto-fix linting issues
pnpm type:check      # Type check with TypeScript

# Other
pnpm format          # Format code (if available)
```

## 📊 API Overview

See **[API_REFERENCE.md](docs/API_REFERENCE.md)** for complete API documentation including REST endpoints, WebSocket events, and examples.

### Quick API Reference

### Models Management
- `GET /api/models` - List registered models
- `POST /api/models` - Register new models
- `POST /api/models/discover` - Automatic model discovery
- `DELETE /api/models/:id` - Remove a model

### Configuration
- `GET /api/config` - Get application configuration
- `POST /api/config` - Update configuration

### Monitoring
- `GET /api/monitoring` - Performance metrics
- `GET /api/monitoring/history` - Metrics history

### Real-time Communication
- **WebSocket** (`/socket.io`): Socket.IO for metrics, models, logs
- **SSE** (`/api/sse`): Server-Sent Events endpoint

## 🎨 User Interface

See **[USER_GUIDE.md](docs/USER_GUIDE.md)** for complete user manual including workflows, interface guide, and advanced usage.

### Interface Overview

- **Dashboard** - Real-time metrics and system overview
- **Models** - Model discovery, loading, and management
- **Monitoring** - Performance charts and analytics
- **Logs** - Real-time log streaming with filtering
- **Settings** - Configuration and preferences

### Key Features

- **Dark/Light Mode**: Automatic theme switching
- **Real-time Updates**: Live metrics and status updates
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: Framer Motion with LazyMotion optimization
- **Accessibility**: High contrast, keyboard navigation

## 🚀 Deployment

See **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** for comprehensive deployment instructions including Docker, cloud platforms, and production setup.

### Quick Production Setup

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Frontend
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Backend (optional)
NODE_ENV=production
PORT=3000
```

### Supported Platforms

- **Docker** - Containerized deployment
- **Vercel** - Serverless deployment
- **Railway** - Cloud platform
- **AWS/GCP/Azure** - Cloud infrastructure
- **Self-hosted** - Traditional server deployment

## 🤝 Contributing

### Development Guidelines

See [AGENTS.md](AGENTS.md) for detailed coding guidelines, including:
- Code style conventions
- TypeScript requirements
- Import ordering
- Testing expectations

### Project Standards

- **TypeScript**: Strict mode enabled
- **Formatting**: 2 spaces, double quotes, 100-char line width
- **Linting**: ESLint with auto-fix support
- **React**: Functional components with hooks only
- **Testing**: Jest + React Testing Library

## 📝 Documentation

### 📚 Complete Documentation Suite

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API documentation
- **[USER_GUIDE.md](docs/USER_GUIDE.md)** - User manual and workflows
- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Deployment and production setup
- **[DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md)** - Development environment setup

### 🛠️ Development & Configuration

- [AGENTS.md](AGENTS.md) - Coding guidelines & project standards
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration options
- [docs/ANIMATION_ARCHITECTURE.md](docs/ANIMATION_ARCHITECTURE.md) - Animation system design

### 🔒 Security & Operations

- [SECURITY_NOTICE.md](SECURITY_NOTICE.md) - Security considerations
- [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) - Production deployment guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues & solutions

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Socket.IO Documentation](https://socket.io/docs)
- [Zod Validation](https://zod.dev)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [pnpm Package Manager](https://pnpm.io)

## 📄 License

MIT - See LICENSE file for details

## 🆘 Support

For issues, questions, or contributions:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review existing GitHub issues
3. Create a new issue with detailed information
4. Check the security notice before reporting security issues
