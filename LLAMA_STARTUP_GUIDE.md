# Llama Server Startup Guide

## The Problem

The application was crashing on startup because it tried to load a specific model file that didn't exist. The solution is to let llama-server start **without** a model, then query it for available models.

## How It Works Now

### 1. **Startup Sequence**

```
┌─────────────────────────────────────────────┐
│  Application Starts                         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  LlamaService Initialized                   │
│  - host: localhost                          │
│  - port: 8134                               │
│  - basePath: ./models (for auto-discovery)  │
│  - NO modelPath specified (IMPORTANT!)      │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  Check if llama-server already running      │
│  - Health check on /health endpoint         │
└────────────┬────────────────────────────────┘
             │
         ┌───┴───┐
         │       │
      YES│       │NO
         │       │
         ▼       ▼
    ┌─────┐  ┌──────────────────────────────┐
    │Skip │  │Spawn llama-server:           │
    │     │  │llama-server --host localhost │
    └─────┘  │           --port 8134        │
             │     --models-dir ./models     │
             └────────────┬─────────────────┘
                          │
                          ▼
             ┌──────────────────────────────┐
             │ Wait for /health endpoint OK │
             └────────────┬─────────────────┘
                          │
                          ▼
             ┌──────────────────────────────┐
             │ Query /api/models endpoint   │
             │ Auto-discover available      │
             │ models in ./models directory │
             └────────────┬─────────────────┘
                          │
                          ▼
             ┌──────────────────────────────┐
             │ Populate UI Model List       │
             │ - Display all found models   │
             │ - Client can select & load   │
             └──────────────────────────────┘
```

### 2. **Key Configuration**

Create/edit `.llama-proxy-config.json`:

```json
{
  "llama_server_host": "localhost",
  "llama_server_port": 8134,
  "llama_server_path": "/home/bamer/llama.cpp/build/bin/llama-server",
  "basePath": "./models"
}
```

**Important Notes:**
- `llama_server_path`: Full path to the llama-server binary
- `basePath`: Directory where your GGUF model files are stored
- **DO NOT** specify `llama_model_path` - let the server auto-discover models

### 3. **Prepare Your Models Directory**

```bash
# Create models directory
mkdir -p ./models

# Copy your GGUF files there
cp /path/to/model.gguf ./models/
cp /path/to/another-model.gguf ./models/

# Verify
ls -lh ./models/
```

### 4. **Start the Application**

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Watch the logs - should see:
# ✅ [CONFIG] Llama config loaded from .llama-proxy-config.json
# 🚀 [LLAMA] Starting Llama service...
# 🚀 Spawning llama-server with args: --host localhost --port 8134 --models-dir ./models
# ✅ Server ready after X checks
# 🔍 Querying llama-server for available models...
# ✅ Loaded X model(s) from llama-server
#   - model1.gguf (4.50 GB)
#   - model2.gguf (7.25 GB)
```

### 5. **Access the UI**

Open [http://localhost:3000](http://localhost:3000)

- **Models Page** will show all auto-discovered models
- Click any model to load it
- Start making requests

## Troubleshooting

### Symptoms: "No models found"

**Solution:**
```bash
# Check models directory exists
ls -la ./models/

# Check for GGUF files
file ./models/*.gguf

# Verify permissions
chmod 644 ./models/*.gguf
```

### Symptoms: "llama-server crashed"

**Check the logs:**
```bash
tail -f server.log | grep -i llama
```

**Common causes:**
- Binary path is wrong (check `llama_server_path`)
- Not enough disk space for models
- GPU memory insufficient (if using GPU)

**Test binary directly:**
```bash
/home/bamer/llama.cpp/build/bin/llama-server --help
/home/bamer/llama.cpp/build/bin/llama-server --host localhost --port 8134 --models-dir ./models
```

### Symptoms: "Connection refused on port 8134"

**Solution:**
```bash
# Check if port is in use
lsof -i :8134

# Try different port in config
echo '{"llama_server_port": 8135}' >> .llama-proxy-config.json
```

### Symptoms: "Socket timeout waiting for server"

**Solution:**
- Increase `healthCheckIntervalMs` in `src/server/services/LlamaService.ts`
- Slow system or large models need more time
- Check if llama-server is consuming CPU: `top | grep llama-server`

## API Endpoints (After Server Starts)

Once llama-server is running, these endpoints are available:

```bash
# List available models
curl http://localhost:8134/api/models

# Get server info
curl http://localhost:8134/info

# Health check
curl http://localhost:8134/health
```

## Architecture

The application has **two separate processes**:

1. **Node.js/Next.js Server** (port 3000)
   - Next.js application
   - Socket.IO real-time updates
   - Proxies requests to llama-server

2. **llama-server** (port 8134)
   - Standalone llama.cpp HTTP API server
   - Loads and runs models
   - Managed by LlamaService class

The application starts llama-server automatically if not running, then queries it for available models.

## Model Loading Workflow

```
User selects model in UI
         │
         ▼
Next.js sends request
         │
         ▼
Proxy forwards to llama-server /api/load
         │
         ▼
llama-server loads model file
         │
         ▼
Model ready for inference
         │
         ▼
User can make completion requests
```

## Performance Tips

1. **Model Directory**: Keep models on fast storage (SSD preferred)
2. **GPU**: Set `gpu_layers` in config for better performance
3. **Memory**: Larger models need more RAM
4. **Port**: Use 8134 unless port conflict

## Environment Variables

```bash
# Override port
PORT=3001 pnpm dev

# Override log level
DEBUG=* pnpm dev
```
