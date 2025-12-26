# Architecture Overview - Next.js Llama Async Proxy

## System Overview

The Next.js Llama Async Proxy is a sophisticated web-based management interface and async proxy for Llama AI models. It provides real-time monitoring, model lifecycle management, and seamless integration with the llama-server binary through a modern Next.js application architecture.

### Core Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Express API   │    │  Llama Server   │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (AI Models)   │
│                 │    │                 │    │                 │
│ • React 19      │    │ • REST API      │    │ • llama.cpp     │
│ • TypeScript    │    │ • WebSocket     │    │ • GGUF models   │
│ • Tailwind CSS  │    │ • Model Mgmt    │    │ • GPU/CPU accel │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │   Socket.IO     │
                    │ Real-time Comm  │
                    └─────────────────┘
```

## Technology Stack

### Frontend Layer
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Framer Motion** - Animation library with LazyMotion optimization
- **Material-UI v7** - Component library
- **Zustand** - Lightweight state management
- **React Query** - Server state management

### Backend Layer
- **Express.js** - REST API server
- **Socket.IO** - Real-time bidirectional communication
- **Winston** - Structured logging
- **Node Cache** - In-memory caching
- **Axios** - HTTP client for llama-server communication

### External Dependencies
- **llama-server** - C++ binary for model inference
- **GGUF models** - Quantized model format
- **GPU/CPU acceleration** - Hardware-accelerated inference

## Directory Structure

```
├── app/                          # Next.js App Router pages
│   ├── api/                     # API routes (legacy SSE)
│   ├── dashboard/               # Main dashboard page
│   ├── logs/                    # Logs monitoring page
│   ├── models/                  # Model management page
│   ├── monitoring/              # Performance monitoring page
│   ├── settings/                # Configuration page
│   └── layout.tsx               # Root layout component
├── pages/                        # Legacy pages (SSE only)
├── src/
│   ├── components/               # React components
│   │   ├── layout/              # Layout components (Header, Sidebar)
│   │   ├── pages/               # Page-specific components
│   │   ├── ui/                  # Reusable UI components
│   │   ├── animate/             # Animation components
│   │   └── websocket/           # WebSocket connection management
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # API service functions
│   ├── contexts/                # React contexts (theme, etc.)
│   ├── types/                   # TypeScript type definitions
│   ├── config/                  # Configuration utilities
│   ├── lib/                     # Utility libraries
│   ├── styles/                  # Global styles and themes
│   ├── providers/               # Context providers
│   └── utils/                   # Helper functions
├── src/server/                   # Backend server logic
│   ├── config.js                # Server configuration
│   ├── models.js                # Model management logic
│   ├── metrics.js               # Performance metrics collection
│   ├── logs.js                  # Log aggregation and streaming
│   ├── llama-server.js          # Llama server process management
│   ├── proxy.js                 # Proxy utilities
│   └── runtime-config.js        # Runtime configuration management
├── public/                       # Static assets
├── server.js                     # Express + Socket.IO server entry point
└── [config files]               # Build and development configuration
```

## Core Components

### 1. Frontend Application (Next.js)

#### App Router Structure
- **`/dashboard`** - Main dashboard with real-time metrics
- **`/models`** - Model discovery, loading, and management
- **`/monitoring`** - Performance charts and system health
- **`/logs`** - Real-time log streaming with filtering
- **`/settings`** - Configuration and theme management

#### Key Components
- **Layout Components**: Header, Sidebar, Navigation
- **Page Components**: Dashboard, Models, Monitoring, Logs, Settings
- **UI Components**: Buttons, Cards, Charts, Tables, Forms
- **Animation Components**: Motion wrappers with LazyMotion optimization

### 2. Backend Server (Express + Socket.IO)

#### API Endpoints
- **Models API** (`/api/models`) - Model registration and discovery
- **Config API** (`/api/config`) - Configuration management
- **Monitoring API** (`/api/monitoring`) - Performance metrics
- **Parameters API** (`/api/parameters`) - Model parameter management

#### Real-time Communication
- **Socket.IO Namespaces**:
  - `/metrics` - Performance data streaming (10s intervals)
  - `/models` - Model status updates (30s intervals)
  - `/logs` - Log streaming (15s intervals)

#### Process Management
- **Llama Server Lifecycle**: Spawn, monitor, restart on failure
- **Health Checks**: HTTP-based monitoring with configurable timeouts
- **Error Recovery**: Exponential backoff retry logic

### 3. Llama Server Integration

#### Process Management
```javascript
// Server-side process spawning
const spawnLlamaServer = (config) => {
  const process = spawn(llamaPath, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...config }
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

#### Configuration Management
- **Runtime Config**: Dynamic parameter updates without restart
- **Environment Variables**: Static configuration via `.env`
- **File-based Config**: JSON configuration files for persistence

## Data Flow Architecture

### 1. Model Loading Flow
```
User Request → API Endpoint → Model Discovery → Llama Server → Process Spawn → Health Check → Status Update
```

### 2. Real-time Metrics Flow
```
System Metrics → Collection Service → Socket.IO → Frontend → Charts Update
```

### 3. Log Streaming Flow
```
Llama Server Logs → Log Parser → Socket.IO → Frontend → Log Display
```

## State Management

### Client State (Zustand)
- **Theme Store**: Dark/light mode, color preferences
- **UI Store**: Sidebar state, modal visibility
- **Config Store**: User preferences and settings

### Server State (React Query)
- **Models Data**: Cached model information with background updates
- **Metrics Data**: Real-time performance data with polling
- **Config Data**: Application configuration with optimistic updates

### Real-time State (Socket.IO)
- **Live Metrics**: CPU, memory, GPU usage
- **Model Status**: Loading progress, active models
- **Log Stream**: Real-time application and system logs

## Performance Optimizations

### Frontend Optimizations
- **LazyMotion**: Deferred animation loading for better initial bundle size
- **Code Splitting**: Automatic route-based splitting via Next.js
- **Image Optimization**: Next.js built-in image optimization
- **Memoization**: React.memo and useMemo for expensive computations

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

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: API servers can be scaled independently
- **Shared Storage**: Model files on network storage
- **Load Balancing**: Multiple proxy instances behind load balancer

### Vertical Scaling
- **GPU Utilization**: Multiple GPU support with tensor splitting
- **Memory Management**: Efficient model loading and unloading
- **Process Optimization**: CPU thread optimization for concurrent requests

### Monitoring and Observability
- **Performance Metrics**: CPU, memory, GPU, and request throughput
- **Health Checks**: Automated monitoring with alerts
- **Log Aggregation**: Centralized logging with structured data
- **Error Tracking**: Comprehensive error reporting and analysis

## Development Workflow

### Build Process
1. **TypeScript Compilation**: Type checking and transpilation
2. **Next.js Build**: Frontend optimization and static generation
3. **Asset Optimization**: Image compression and bundle splitting
4. **Testing**: Unit and integration test execution

### Deployment Process
1. **Container Build**: Docker image creation with multi-stage builds
2. **Configuration**: Environment-specific configuration injection
3. **Health Checks**: Pre-deployment validation
4. **Rolling Updates**: Zero-downtime deployment with health monitoring

This architecture provides a robust, scalable foundation for AI model management with excellent developer experience and production readiness.