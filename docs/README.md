# Llama Async Proxy Dashboard - Documentation

A modern, lightweight dashboard for managing Llama models built with Vanilla JavaScript, Node.js, and Socket.IO.

## Overview

This project provides a real-time web interface for managing llama.cpp servers running in router mode. The dashboard enables users to:

- **Manage Multiple Models**: Load, unload, and monitor GGUF models with automatic discovery
- **Real-Time Monitoring**: View CPU, memory, disk, and GPU metrics with live updates
- **Configure Presets**: Create and apply parameter configurations for model inference
- **Monitor System Health**: Track resource usage and system status
- **View Logs**: Access real-time application logs with filtering

## Architecture

The application follows an event-driven architecture:

```
Browser (Vanilla JavaScript)
    ⇄ Socket.IO (WebSocket)
        ↓
    Node.js Server
        ├── Express (HTTP static files)
        └── Socket.IO (Real-time communication)
            ↓
        SQLite Database (Configuration & metrics)
            ↓
        llama.cpp (Router mode - external process)
```

### Key Design Principles

1. **Server-Owned State**: Server is the single source of truth for all data
2. **Socket.IO Only**: No REST APIs - all communication via WebSocket
3. **Event-Driven Updates**: Components subscribe to state changes, no polling
4. **Request/Response Pattern**: Client emits intents, server emits state
5. **Real-Time Broadcasts**: Server pushes updates to all connected clients

## Documentation Structure

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture and component details |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines for developers |
| [COVERAGE_GUIDE.md](COVERAGE_GUIDE.md) | Test coverage procedures |
| [API.md](API.md) | Socket.IO API reference |

### Development Documentation

The `development/` folder contains detailed implementation guides:

| Document | Topic |
|----------|-------|
| [QUICKSTART](development/CONSOLIDATED_QUICKSTART.md) | Getting started guide |
| [LLAMA](development/CONSOLIDATED_LLAMA.md) | llama.cpp integration |
| [MODELS](development/CONSOLIDATED_MODELS.md) | Model management |
| [PRESETS](development/CONSOLIDATED_PRESETS.md) | Preset system |
| [UI](development/CONSOLIDATED_UI.md) | Frontend architecture |
| [PERFORMANCE](development/CONSOLIDATED_PERFORMANCE.md) | Performance optimization |
| [COVERAGE](development/CONSOLIDATED_COVERAGE.md) | Testing coverage |

## Quick Reference

### Running the Application

```bash
# Install dependencies
pnpm install

# Start development server (with file watching)
pnpm dev

# Start production server
pnpm start

# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code
pnpm format
```

### Access Points

- **Dashboard**: http://localhost:3000
- **WebSocket**: ws://localhost:3000/socket.io
- **API**: Socket.IO events (see API.md)

## Code Standards

### Golden Rules

1. **Keep files under 200 lines** - Split large files into smaller modules
2. **Single responsibility** - Each component/class should do one thing
3. **No memory leaks** - Always clean up subscriptions and event listeners
4. **Graceful degradation** - Handle missing data gracefully
5. **User feedback** - Show notifications for user actions
6. **Error boundaries** - Catch and display errors to users

### Testing Requirements

- All new features must include tests
- 80% coverage required for statements, branches, functions, and lines
- Tests must pass before merging
- Run `pnpm test:coverage` for full report

## Support

- **Installation**: See INSTALL.md
- **Usage**: See USAGE.md
- **API**: See API.md
- **Architecture**: See docs/ARCHITECTURE.md
- **Deployment**: See docs/DEPLOYMENT.md
