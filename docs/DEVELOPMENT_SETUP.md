# Development Setup Guide - Next.js Llama Async Proxy

Complete guide for setting up a development environment for the Next.js Llama Async Proxy project.

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows (WSL recommended)
- **Node.js**: Version 18.0 or higher (24.11.1 recommended)
- **Package Manager**: pnpm (recommended), npm, or yarn
- **Git**: Version control system
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: 20GB+ free space for dependencies and models
- **llama-server binary**: From llama.cpp build

### Hardware Recommendations

- **CPU**: Multi-core processor (4+ cores recommended)
- **GPU**: NVIDIA GPU with CUDA support (optional but recommended)
- **Storage**: SSD for faster build times

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd nextjs-llama-async-proxy
```

### 2. Install Node.js

#### Using Node Version Manager (nvm) - Recommended

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.bashrc

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### Using Package Managers

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS (Homebrew):**
```bash
brew install node@18
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/) or use Chocolatey:
```powershell
choco install nodejs-lts
```

### 3. Install pnpm

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version  # Should show 9.x.x or higher
```

### 4. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm list
```

## Configuration

### 1. llama-server Configuration

Create `llama-server-config.json` in the project root:

```json
{
  "host": "localhost",
  "port": 8134,
  "basePath": "/path/to/your/models",
  "serverPath": "/home/bamer/llama.cpp/build/bin/llama-server",
  "ctx_size": 8192,
  "batch_size": 512,
  "threads": -1,
  "gpu_layers": -1
}
```

**Configuration Fields:**
- `host`: Llama server host address (default: "localhost")
- `port`: Llama server port (default: 8134)
- `basePath`: Directory containing GGUF model files
- `serverPath`: Full path to llama-server binary
- `ctx_size`: Context window size (default: 8192)
- `batch_size`: Processing batch size (default: 512)
- `threads`: Number of CPU threads (-1 for auto)
- `gpu_layers`: GPU layers to offload (-1 for all)

### 2. Environment Configuration

Create `.env.local` in the project root:

```env
# Application Settings
NODE_ENV=development
PORT=3000

# WebSocket Settings
WEBSOCKET_PATH=/llamaproxws

# Development Settings
METRICS_INTERVAL=10000
MODELS_INTERVAL=30000
LOGS_INTERVAL=15000

# Logging
LOG_LEVEL=debug
LOG_COLORS=true
LOG_VERBOSE=true
```

### 3. Llama Server Setup

#### Build llama.cpp

```bash
# Clone llama.cpp repository
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp

# Build llama-server with tsx compatibility
make server

# Copy binary to system path (optional)
sudo cp llama-server /usr/local/bin/
```

#### Alternative: Pre-built Binaries

For easier setup, you can download pre-built binaries:

```bash
# Linux
wget https://github.com/ggerganov/llama.cpp/releases/download/master/llama-server-linux-x64.zip
unzip llama-server-linux-x64.zip
sudo mv llama-server /usr/local/bin/

# macOS
wget https://github.com/ggerganov/llama.cpp/releases/download/master/llama-server-macos-x64.zip
unzip llama-server-macos-x64.zip
sudo mv llama-server /usr/local/bin/
```

### 4. Model Setup

#### Download Sample Models

```bash
# Create models directory
mkdir -p models

# Download a small test model (example)
# Visit https://huggingface.co/models?search=gguf for available models
# Example: Download a small Llama model
wget https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q4_K_M.gguf -O models/llama-2-7b.gguf
```

#### Model Directory Structure

```
models/
├── llama-2-7b-chat.gguf
├── mistral-7b-instruct.gguf
├── codellama-7b.gguf
└── ...
```

## Development Workflow

### 1. Start Development Server

```bash
# Start the development server with tsx
pnpm dev

# Server will start on http://localhost:3000
# API available at http://localhost:3000/api
# WebSocket available at ws://localhost:3000/llamaproxws
```

**Important**: The development server uses `tsx` for TypeScript runtime execution, not `node server.js`.

### 2. Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm type:check
```

### 3. Development Tools

#### VS Code Extensions (Recommended)

Install these VS Code extensions for better development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "christian-kohler.path-intelligence",
    "ms-vscode-remote.remote-containers"
  ]
}
```

#### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

#### MUI v7 Grid Component Pattern

**CRITICAL**: MUI v7 deprecated the `item` prop on Grid components. Always use `size` prop instead:

```tsx
// ❌ WRONG (MUI v6 syntax - deprecated)
<Grid item xs={12} sm={6} md={4}>

// ✅ CORRECT (MUI v7 syntax)
<Grid size={{ xs: 12, sm: 6, md: 4 }}>
```

**Migration Benefits:**
- Improved TypeScript support and type inference
- Better performance with smaller bundle size
- Cleaner, more intuitive component API
- Enhanced theming system
- Long-term support with active development

**All Grid components** throughout the codebase have been updated to use the `size` prop.

## Testing

### Test Coverage

This project has comprehensive test coverage with **187 test files** and **5,757 tests**.

**Current Coverage: 67.47% lines** (Target: 98%)

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Lines** | 67.47% | 98% | -30.53% |
| **Branches** | 54.63% | 98% | -43.37% |
| **Functions** | 58.43% | 98% | -39.57% |
| **Statements** | ~67.47% | 98% | -31% |

### Coverage Achievements

**High-Achievement Components:**
- ✅ WebSocket provider: 98% coverage (target met)
- ✅ fit-params-service: 97.97% coverage (near target)
- ✅ Button component: 100% coverage (perfect)
- ✅ Hooks & Contexts: 95%+ coverage
- ✅ Lib & Services: 97%+ coverage
- ✅ Server Code: 97%+ coverage

**Areas for Improvement:**
- ⚠️ Dashboard & Charts: ~55% coverage (needs +43%)
- ⚠️ Pages & Config: ~80% coverage (needs +18%)
- ⚠️ Layout & UI: 80-100% coverage (needs +18%)

### Testing Documentation

For detailed testing information:
- **[TESTING.md](TESTING.md)** - Comprehensive testing guide with patterns and best practices
- **[COVERAGE.md](COVERAGE.md)** - Coverage metrics, reporting, and improvement strategies

### Test Infrastructure

- **Jest 30.2.0** - Test runner with TypeScript support
- **React Testing Library** - Component testing utilities
- **MUI v7 Mocks** - Complete MUI component mocking
- **Proper Mocking** - axios, socket.io-client, Winston, Next.js utilities

### 1. Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test __tests__/lib/server-config.test.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="should load config"
```

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

### 2. Manual Testing

#### API Testing

Use tools like Postman, Insomnia, or curl:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test config endpoint
curl http://localhost:3000/api/config

# Test models endpoint
curl http://localhost:3000/api/models
```

#### WebSocket Testing

Test real-time features using browser developer tools or WebSocket clients:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  path: '/llamaproxws'
});

socket.on('connect', () => console.log('Connected'));
socket.on('metrics_update', (data) => console.log('Metrics:', data));
socket.on('disconnect', () => console.log('Disconnected'));
```

## Debugging

### 1. Application Debugging

#### Debug Mode

```bash
# Start with debug logging
DEBUG=* pnpm dev

# Start with specific debug namespace
DEBUG=llama-proxy:* pnpm dev
```

#### Node.js Inspector

```bash
# Start with inspector
node --inspect server.js

# Or with specific port
node --inspect=0.0.0.0:9229 server.js
```

### 2. Browser Debugging

- Open browser DevTools (F12)
- Check Console tab for client-side errors
- Check Network tab for API requests
- Use React DevTools for component debugging
- Check WebSocket connections in Network tab

### 3. Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

#### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear pnpm cache
pnpm store prune

# Rebuild
pnpm build
```

## Code Quality

### 1. Linting

```bash
# Check linting
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

### 2. Type Checking

```bash
# Run TypeScript compiler
pnpm type:check

# Watch mode
pnpm type:check -- --watch
```

### 3. Code Formatting

```bash
# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check
```

## Advanced Development

### 1. Development with GPU

#### CUDA Setup (NVIDIA)

```bash
# Install CUDA toolkit
# Follow instructions at: https://developer.nvidia.com/cuda-downloads

# Verify installation
nvidia-smi

# Build llama.cpp with CUDA
cd llama.cpp
make LLAMA_CUDA=1 server
```

#### Environment Variables for GPU

```env
# GPU Configuration
LLAMA_GPU_LAYERS=35
LLAMA_MAIN_GPU=0
LLAMA_TENSOR_SPLIT=7,7,7,7
```

### 2. Configuration Management

#### Settings Page (Uses API, Not localStorage)

The Settings page now uses the API for configuration management:

- **GET /api/config**: Read configuration from JSON file
- **POST /api/config**: Save configuration to JSON file

Configuration is stored in `llama-server-config.json`, not localStorage.

### 3. Docker Development

#### Development Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000

# Start development server
CMD ["pnpm", "dev"]
```

#### Docker Compose for Development

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3000
      - WEBSOCKET_PATH=/llamaproxws
    command: pnpm dev

  llama-server:
    image: llama-server:latest
    ports:
      - "8134:8134"
    volumes:
      - ./models:/models
```

## Contributing

### 1. Branching Strategy

```bash
# Create feature branch
git checkout -b feature/new-feature

# Create bug fix branch
git checkout -b bugfix/issue-number

# Create hotfix branch
git checkout -b hotfix/critical-fix
```

### 2. Commit Guidelines

Follow conventional commit format:

```bash
# Feature commits
git commit -m "feat: add model auto-discovery"

# Bug fixes
git commit -m "fix: resolve memory leak in model loading"

# Documentation
git commit -m "docs: update API reference"

# Refactoring
git commit -m "refactor: simplify config management"
```

### 3. Pull Request Process

1. Create a feature branch
2. Make your changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Type check: `pnpm type:check`
6. Create pull request
7. Wait for review and approval

### 4. Code Review Checklist

- [ ] Tests pass (98%+ coverage)
- [ ] Code is linted
- [ ] TypeScript types are correct
- [ ] Documentation is updated
- [ ] Breaking changes are documented
- [ ] Performance impact is considered

## Troubleshooting

### Common Development Issues

#### 1. Build Failures

**Issue**: `Module not found` errors

**Solutions**:
```bash
# Clear caches
rm -rf .next node_modules/.cache
pnpm install
```

#### 2. Hot Reload Not Working

**Issue**: Changes not reflecting in browser

**Solutions**:
```bash
# Restart dev server
pnpm dev

# Clear Next.js cache
rm -rf .next
```

#### 3. Port Conflicts

**Issue**: `Error: listen EADDRINUSE: address already in use`

**Solutions**:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

#### 4. Configuration Issues

**Issue**: Configuration not loading or saving

**Solutions**:
- Verify `llama-server-config.json` exists in project root
- Check JSON syntax is valid
- Ensure file permissions allow reading/writing
- Check server logs for error messages

#### 5. TypeScript Errors

**Issue**: Type checking failures

**Solutions**:
```bash
# Check specific file
pnpm type:check -- --noEmit src/components/Example.tsx

# Check all types
pnpm type:check
```

### Getting Help

1. **Check Documentation**
   - Read this guide thoroughly
   - Check inline code comments
   - Review existing issues

2. **Debugging Steps**
   - Enable debug logging
   - Check browser console
   - Review server logs
   - Test API endpoints manually

3. **Community Support**
   - Create GitHub issue
   - Check existing issues
   - Join community discussions

---

**Development Setup Guide - Next.js Llama Async Proxy**
**Version 0.1.0 - December 27, 2025**
