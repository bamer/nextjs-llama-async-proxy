# Llama Async Proxy Dashboard - Installation Guide

## Prerequisites

### System Requirements
- **Node.js:** >= 18.0.0
- **Package Manager:** pnpm (recommended) or npm
- **Operating System:** Linux, macOS, or Windows with WSL
- **Memory:** 4GB RAM minimum (8GB recommended)
- **Storage:** 1GB free space for application + space for models

### Required Software
1. **Node.js** - Download from https://nodejs.org/
2. **pnpm** - Install with: `npm install -g pnpm`
3. **llama.cpp** - Required for LLM model serving

## llama.cpp Installation

### Option 1: Build from Source
```bash
# Clone llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Build with GPU support (optional)
make LLAMA_BUILD_METAL=1  # macOS
make LLAMA_BUILD_CUBLAS=1 # Linux with CUDA

# Or build without GPU support
make
```

### Option 2: Download Pre-built Binary
```bash
# Download latest release from GitHub
wget https://github.com/ggerganov/llama.cpp/releases/latest/download/llama-server-linux-x64
chmod +x llama-server-linux-x64
mv llama-server-linux-x64 /usr/local/bin/llama-server
```

### Verify Installation
```bash
llama-server --version
```

## Application Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/llama-async-proxy.git
cd llama-async-proxy
```

### 2. Install Dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Configure the Application

Create a configuration file in `config/app.config.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0"
  },
  "llama": {
    "serverPath": "/path/to/llama-server",
    "modelsDir": "/path/to/models",
    "port": 8080,
    "maxModels": 4
  },
  "database": {
    "path": "./data/llama-dashboard.db"
  },
  "logging": {
    "level": "info",
    "path": "./logs"
  }
}
```

### 4. Prepare Models Directory

```bash
# Create models directory
mkdir -p /path/to/models

# Download or copy GGUF model files to this directory
# Example: cp model.gguf /path/to/models/
```

### 5. Start the Application

```bash
# Start in development mode (with file watching)
pnpm dev

# Or start in production mode
pnpm start
```

## Verification

### 1. Check Server Status
```bash
# Server should be running at:
curl http://localhost:3000

# Should return HTML page
```

### 2. Verify Socket.IO Connection
```bash
# Check WebSocket endpoint
curl -I http://localhost:3000/socket.io/

# Should return 200 OK
```

### 3. Check Logs
```bash
# View application logs
tail -f logs/app-*.log
```

## Docker Installation (Optional)

### 1. Build the Image
```bash
docker build -t llama-async-proxy .
```

### 2. Run the Container
```bash
docker run -p 3000:3000 \
  -v /path/to/models:/app/models \
  -v /path/to/config:/app/config \
  llama-async-proxy
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process or change port in config
```

### Permission Denied
```bash
# Fix permissions for logs directory
chmod -R 755 ./logs

# Fix permissions for data directory  
chmod -R 755 ./data
```

### Database Errors
```bash
# Reset database
pnpm db:reset

# Or export existing data first
pnpm db:export
```

### llama-server Not Found
```bash
# Verify llama-server is in PATH
which llama-server

# Or set full path in configuration
```

## Next Steps

After successful installation, proceed to [USAGE.md](USAGE.md) for instructions on using the dashboard.

## Support

- **Documentation:** See [docs/README.md](docs/README.md)
- **Architecture:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **API Reference:** See [API.md](API.md)
