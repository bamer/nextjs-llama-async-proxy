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

### Directory Structure

```
├── app/                        # Next.js App Router (new pages)
│   ├── api/                   # API routes (legacy, for SSE)
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   ├── dashboard/             # Dashboard page
│   ├── logs/                  # Logs page
│   ├── models/                # Models management page
│   ├── monitoring/            # Monitoring page
│   ├── settings/              # Settings page
│   └── not-found.tsx          # 404 page
├── pages/
│   └── api/                   # SSE endpoint
├── src/
│   ├── components/            # React components
│   │   ├── layout/           # Header, Sidebar, Layout
│   │   ├── pages/            # Page-specific components
│   │   ├── ui/               # Reusable UI components
│   │   ├── seo/              # SEO components
│   │   ├── animate/          # Animation components
│   │   └── websocket/        # WebSocket manager
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API services & utilities
│   ├── contexts/             # React contexts (theme, etc.)
│   ├── types/                # TypeScript type definitions
│   ├── config/               # Configuration
│   ├── lib/                  # Utility libraries
│   ├── styles/               # Global styles
│   ├── providers/            # Context providers
│   └── utils/                # Helper functions
├── src/server/               # Backend logic
│   ├── config.js             # Configuration management
│   ├── config-schema.js      # Config validation schema
│   ├── models.js             # Model management
│   ├── metrics.js            # Metrics collection
│   ├── logs.js               # Log management
│   ├── llama-server.js       # Llama server integration
│   ├── proxy.js              # Proxy utilities
│   └── runtime-config.js     # Runtime configuration
├── public/                   # Static assets
├── server.js                 # Express + Socket.IO server
└── [config files]           # tsconfig.json, tailwind.config.ts, etc.
```

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

## 📊 API Routes

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

### Parameters
- `GET /api/parameters` - List parameter categories
- `GET /api/parameters/[category]` - Category parameters
- `GET /api/parameters/category/[paramName]` - Specific parameter value

### Real-time Communication
- **WebSocket** (`/socket.io`): Socket.IO for metrics, models, logs
- **SSE** (`/api/sse`): Server-Sent Events endpoint

## 🎨 Theme & Design

### Color Palette
- **Primary**: Modern warm grays
- **Secondary**: Red accents
- **Success/Error**: Standard green/red
- **Background**: White/cream (light), dark gray (dark)

### UI Features
- **Dark/Light Mode**: Automatic toggle
- **Smooth Animations**: CSS transitions with cubic-bezier easing
- **3D Effects**: Layered shadows, hover transforms
- **Responsive Design**: Mobile-first approach
- **Accessibility**: High contrast, keyboard navigation

### Key Components
- **Sidebar**: Navigation with active states and hover effects
- **Cards**: Glass effect with depth
- **Charts**: Real-time updating graphs
- **Logs**: Color-coded by severity level

## 🚀 Deployment

### Production Build

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

### Deployment Platforms

**Vercel** (recommended for Next.js):
1. Connect GitHub repository
2. Configure environment variables in Vercel dashboard
3. Push to deploy automatically

**Docker**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

**Self-hosted**:
1. Build with `pnpm build`
2. Deploy with `pnpm start`
3. Use a reverse proxy (nginx/caddy) for SSL/TLS

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

- [AGENTS.md](AGENTS.md) - Coding guidelines & project standards
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration options
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
