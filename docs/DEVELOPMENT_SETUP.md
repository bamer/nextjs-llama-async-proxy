# Development Setup Guide - Next.js Llama Async Proxy

Complete guide for setting up a development environment for the Next.js Llama Async Proxy project.

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows (WSL recommended)
- **Node.js**: Version 18.0 or higher
- **Package Manager**: pnpm (recommended), npm, or yarn
- **Git**: Version control system
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: 20GB+ free space for dependencies and models

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
node --version  # Should show v18.x.x
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
pnpm --version  # Should show 8.x.x or higher
```

### 4. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm list
```

## Configuration

### 1. Environment Configuration

Create `.env.local` in the project root:

```env
# Application Settings
NODE_ENV=development
PORT=3000

# Llama Server Configuration
LLAMA_SERVER_HOST=localhost
LLAMA_SERVER_PORT=8134
LLAMA_SERVER_PATH=/usr/local/bin/llama-server
LLAMA_SERVER_TIMEOUT=30000

# Model Configuration
LLAMA_MODELS_DIR=./models
LLAMA_DEFAULT_MODEL=

# Development Settings
METRICS_INTERVAL=10000
MODELS_INTERVAL=30000
LOGS_INTERVAL=15000

# Logging
LOG_LEVEL=debug
LOG_COLORS=true
LOG_VERBOSE=true
```

### 2. Llama Server Setup

#### Download llama.cpp

```bash
# Clone llama.cpp repository
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp

# Build llama-server
make server

# Copy binary to system path (optional)
sudo cp llama-server /usr/local/bin/
```

#### Alternative: Pre-built Binaries

For easier setup, you can download pre-built binaries:

```bash
# Linux
wget https://github.com/ggerganov/llama.cpp/releases/download/master-abc123/llama-server-linux-x64.zip
unzip llama-server-linux-x64.zip
sudo mv llama-server /usr/local/bin/

# macOS
wget https://github.com/ggerganov/llama.cpp/releases/download/master-abc123/llama-server-macos-x64.zip
unzip llama-server-macos-x64.zip
sudo mv llama-server /usr/local/bin/
```

### 3. Model Setup

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

### 4. Application Configuration

Create `.llama-proxy-config.json`:

```json
{
  "llama_server_host": "localhost",
  "llama_server_port": 8134,
  "llama_server_path": "/usr/local/bin/llama-server",
  "basePath": "./models",
  "timeout": 30000,
  "maxConcurrentModels": 3,
  "autoDiscovery": true
}
```

## Development Workflow

### 1. Start Development Server

```bash
# Start the development server
pnpm dev

# Server will start on http://localhost:3000
# API available at http://localhost:3000/api
```

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

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm type:check

# Format code
pnpm format
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

## Testing

### 1. Unit Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- path/to/test.test.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="should load model"
```

### 2. Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Test API endpoints
pnpm test -- --testPathPattern=api
```

### 3. E2E Tests

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui

# Generate test
npx playwright codegen http://localhost:3000
```

### 4. Manual Testing

#### API Testing

Use tools like Postman, Insomnia, or curl:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test models endpoint
curl http://localhost:3000/api/models

# Test configuration
curl http://localhost:3000/api/config
```

#### WebSocket Testing

Test real-time features using browser developer tools or WebSocket clients.

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

### 2. Multi-Environment Setup

#### Development Environment

```bash
# Create development-specific config
cp .env.local .env.development
```

#### Testing Environment

```bash
# Create testing environment
cp .env.local .env.test
# Modify settings for testing
```

#### Production Environment

```bash
# Create production config
cp .env.local .env.production
# Modify for production settings
```

### 3. Database Setup (Future)

If the application adds database support:

```bash
# Install database
# PostgreSQL example
sudo apt install postgresql

# Create database
createdb llama_proxy_dev

# Run migrations (when implemented)
pnpm db:migrate
```

### 4. Docker Development

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

- [ ] Tests pass
- [ ] Code is linted
- [ ] TypeScript types are correct
- [ ] Documentation is updated
- [ ] Breaking changes are documented
- [ ] Performance impact is considered

## Performance Optimization

### 1. Development Performance

#### Fast Refresh

Next.js Fast Refresh is enabled by default for instant updates.

#### Build Optimization

```javascript
// next.config.ts
module.exports = {
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};
```

### 2. Bundle Analysis

```bash
# Analyze bundle size
pnpm build
npx @next/bundle-analyzer

# Or use webpack-bundle-analyzer
pnpm add -D webpack-bundle-analyzer
```

### 3. Memory Optimization

```bash
# Monitor memory usage
node --max-old-space-size=4096 server.js

# Use clinic.js for profiling
npm install -g clinic
clinic doctor -- pnpm dev
```

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

#### 4. Memory Issues

**Issue**: Out of memory during build

**Solutions**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# Or add to package.json scripts
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

#### 5. TypeScript Errors

**Issue**: Type checking failures

**Solutions**:
```bash
# Check specific file
pnpm type:check -- --noEmit src/components/Example.tsx

# Generate types (if applicable)
pnpm type:gen
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

*Development Setup Guide - Next.js Llama Async Proxy*
*Version 0.1.0 - December 26, 2025*