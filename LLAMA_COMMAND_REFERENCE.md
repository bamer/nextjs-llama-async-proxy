# Llama Server Command Reference

## Correct llama-server Arguments

### ✅ CORRECT

```bash
llama-server --host localhost --port 8134 --models-dir ./models
```

**What each argument does:**
- `--host localhost` - Listen on localhost (change for network access)
- `--port 8134` - Listen on port 8134
- `--models-dir ./models` - Auto-discover GGUF files in this directory

### ❌ WRONG (will crash)

```bash
# These will cause "invalid argument" errors:
llama-server --host localhost --port 8134 --model-dir ./models     # WRONG!
llama-server --host localhost --port 8134 --modeldir ./models      # WRONG!
llama-server --host localhost --port 8134 --model ./models         # WRONG!
```

## Application Startup

### Option 1: Let Application Manage llama-server (Recommended)

```bash
# Just start the app - it handles llama-server
pnpm dev
```

**What happens:**
1. App checks if llama-server is running
2. If not, spawns it with: `llama-server --host localhost --port 8134 --models-dir ./models`
3. Waits for `/health` endpoint
4. Queries `/api/models` for available models
5. Displays models in UI

### Option 2: Start llama-server Manually

```bash
# Terminal 1: Start llama-server manually
llama-server --host localhost --port 8134 --models-dir ./models

# Terminal 2: Start the application
pnpm dev
```

**Advantages:**
- App detects running llama-server
- Won't try to spawn new process
- Can restart app without restarting server

## Testing Commands

### Check llama-server Health

```bash
curl http://localhost:8134/health
# Should return: 200 OK
```

### List Available Models

```bash
curl http://localhost:8134/api/models
# Returns JSON array of discovered models
```

### Test Direct Connection

```bash
# Manual startup test
/path/to/llama-server --host localhost --port 8134 --models-dir ./models

# In another terminal, verify it works
curl http://localhost:8134/health
# Should respond immediately
```

## Configuration File

### Create `.llama-proxy-config.json`

```json
{
  "llama_server_host": "localhost",
  "llama_server_port": 8134,
  "llama_server_path": "/home/bamer/llama.cpp/build/bin/llama-server",
  "basePath": "./models"
}
```

**Important fields:**
- `llama_server_path`: Full path to binary (find with: `which llama-server`)
- `basePath`: Directory with GGUF files (relative or absolute path)

## Environment Setup

### 1. Verify llama-server Binary

```bash
# Check if installed
which llama-server

# Check version
llama-server --version

# Get help (shows all available arguments)
llama-server --help
```

### 2. Prepare Models Directory

```bash
# Create directory
mkdir -p ./models

# Copy GGUF files
cp /path/to/*.gguf ./models/

# Verify files
ls -lh ./models/
file ./models/*.gguf  # Check they're GGUF format
```

### 3. Update Config

```bash
# Edit .llama-proxy-config.json with:
# - Correct llama_server_path (from "which llama-server")
# - Correct basePath (where your GGUF files are)
```

### 4. Start Application

```bash
pnpm dev
```

## Common Issues & Fixes

### Port Already in Use

```bash
# Check what's using port 8134
lsof -i :8134

# Change port in .llama-proxy-config.json
{
  "llama_server_port": 8135
}
```

### llama-server Not Found

```bash
# Verify binary exists
which llama-server
# If empty:
find ~ -name "llama-server" -type f

# Update .llama-proxy-config.json with full path
```

### No Models Found

```bash
# Check models directory
ls -la ./models/

# Check for GGUF files
file ./models/*.gguf

# Permissions
chmod 644 ./models/*.gguf

# Update basePath in .llama-proxy-config.json
# Must point to directory containing your GGUF files
```

### "Connection refused on port 8134"

```bash
# Verify llama-server is actually running
ps aux | grep llama-server

# Try starting manually
llama-server --host localhost --port 8134 --models-dir ./models

# Check for errors in console output
```

## Optional Arguments

You can add these to `.llama-proxy-config.json`:

```json
{
  "ctx_size": 2048,           // Context window size
  "gpu_layers": 32,           // Number of layers to offload to GPU
  "threads": 8,               // CPU threads (default: auto-detect)
  "batch_size": 512,          // Batch size
  "temperature": 0.7,         // Sampling temperature
  "verbose": false            // Enable verbose logging
}
```

These are passed as command-line args to llama-server.

## API Endpoints (After Startup)

Once llama-server is running:

```bash
# Get health status
GET http://localhost:8134/health

# List available models
GET http://localhost:8134/api/models

# Get server info
GET http://localhost:8134/info

# Load a specific model (specific endpoint may vary by llama-server version)
POST http://localhost:8134/api/models/<model-id>/load
```

## Debugging

### Check Application Logs

```bash
# Watch logs for llama-server startup
pnpm dev 2>&1 | grep -i llama

# Full output
pnpm dev
# Look for:
# ✅ Llama config loaded
# 🚀 Spawning llama-server
# ✅ Server ready
# 🔍 Querying for models
# ✅ Loaded X models
```

### Test llama-server Binary Directly

```bash
# Simple test
llama-server --help

# Full startup test
llama-server \
  --host localhost \
  --port 8134 \
  --models-dir ./models

# Watch output - should see model discovery
# Press Ctrl+C to stop
```

### Check Process

```bash
# List running llama-server processes
ps aux | grep llama-server

# Kill if stuck
pkill llama-server

# Check which port it's on
lsof -i :8134
```

## Quick Checklist

- [ ] Created `.llama-proxy-config.json` with correct paths
- [ ] `llama_server_path` points to valid binary
- [ ] `basePath` points to directory with GGUF files
- [ ] GGUF files exist in models directory
- [ ] Run `pnpm dev`
- [ ] See "✅ Loaded X models" in logs
- [ ] Open http://localhost:3000
- [ ] Models appear in Models page
- [ ] Can select and load a model

## Success Indicators

✅ Console shows: `Spawning llama-server with args: --host localhost --port 8134 --models-dir ./models`

✅ Server health endpoint responds: `curl http://localhost:8134/health` → `200 OK`

✅ Models are discovered: `curl http://localhost:8134/api/models` → returns JSON array

✅ Web UI shows models in Models page

✅ Can select a model without errors
