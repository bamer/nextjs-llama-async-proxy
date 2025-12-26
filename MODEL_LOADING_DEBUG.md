# Model Loading Debug Guide

## Issue: Models Not Loading

If clicking "Load" on the Models page shows "OK" but nothing happens, follow this debug guide.

## Prerequisites

1. **llama-server must be running separately** on the configured host:port
   ```bash
   llama-server -m /path/to/your/model.gguf --port 8134 --host localhost
   ```

2. **Check .llama-proxy-config.json**
   ```json
   {
     "llama_server_host": "localhost",
     "llama_server_port": 8134,
     "llama_server_path": "/path/to/llama-server",
     ...
   }
   ```

## Step-by-Step Debug

### 1. Verify llama-server is running

```bash
# Check if llama-server process is running
ps aux | grep llama-server

# Test llama-server directly
curl http://localhost:8134/health

# Get available models from llama-server
curl http://localhost:8134/api/models
```

### 2. Check Next.js app is running

```bash
# Start the app (if not already running)
pnpm dev

# Should start on http://localhost:3000
```

### 3. Test the API routes directly

#### Get list of models
```bash
curl -X GET http://localhost:3000/api/models \
  -H "Content-Type: application/json"
```

Should return:
```json
{
  "models": [
    {
      "id": "model-name",
      "name": "model-name",
      "type": "unknown",
      "status": "available",
      "size": 4294967296,
      "createdAt": "2025-12-26T...",
      "updatedAt": "2025-12-26T..."
    }
  ]
}
```

#### Load a model
```bash
curl -X POST http://localhost:3000/api/models/your-model-name/start \
  -H "Content-Type: application/json" \
  -d '{}'
```

Should return:
```json
{
  "model": "your-model-name",
  "status": "loaded",
  "message": "Model your-model-name loaded successfully",
  "data": {...}
}
```

### 4. Check browser console

Open DevTools (F12) → Console tab:

1. Look for API call logs
2. Check for CORS errors
3. Look for network errors in Network tab

### 5. Check server logs

When the app is running in dev mode (`pnpm dev`), you should see logs like:

```
[API] Loading model: my-model
[API] Current llama-server status: ready
[API] Forwarding model load to llama-server at localhost:8134
[API] Model my-model loaded successfully
```

## Common Issues & Solutions

### Issue: "Llama service not initialized"

**Cause:** The global `llamaService` is not available

**Solution:**
1. Restart the dev server: `pnpm dev`
2. Make sure `server.js` is being used (check logs for "LlamaService exposed globally")
3. Check that you're not using standalone build (use dev mode with `pnpm dev`)

### Issue: "Failed to connect to llama-server"

**Cause:** llama-server is not running or wrong host/port configured

**Solution:**
1. Start llama-server: `llama-server -m model.gguf --port 8134 --host localhost`
2. Verify host:port in `.llama-proxy-config.json`
3. Test directly: `curl http://localhost:8134/health`
4. Check firewall/network between services

### Issue: "Llama server is not ready"

**Cause:** llama-server is initializing or crashed

**Solution:**
1. Wait a few seconds for llama-server to fully start
2. Check llama-server logs for errors
3. Restart llama-server
4. Check available system memory

### Issue: HTTP error from llama-server (e.g., 400, 404)

**Cause:** llama-server API doesn't recognize the request format

**Solution:**
1. Verify llama-server version is up to date
2. Check llama-server API documentation
3. Try loading model directly: `curl -X POST http://localhost:8134/api/models -d '{"model":"name"}'`

## Configuration

### Environment Variables (Optional)

Set these if llama-server is on different host/port than configured:

```bash
export LLAMA_SERVER_HOST=192.168.1.100
export LLAMA_SERVER_PORT=9000
pnpm dev
```

### .llama-proxy-config.json

All settings here affect model loading and llama-server behavior:

```json
{
  "llama_server_host": "localhost",      // llama-server host
  "llama_server_port": 8134,              // llama-server port
  "llama_server_path": "/path/to/llama-server",  // binary path
  "basePath": "/models",                  // where to look for models
  "ctx_size": 4096,                       // context window
  "batch_size": 2048,                     // batch size
  "gpu_layers": -1,                       // GPU layers (-1 = all)
  ...
}
```

## Flow Diagram

```
User clicks "Load" on Models page
  ↓
Frontend sends: POST /api/models/{name}/start
  ↓
API route at: app/api/models/[name]/start/route.ts
  ↓
Checks LlamaService.getState() == "ready"
  ↓
Forwards to: http://llama-server:8134/api/models
  ↓
llama-server loads the model
  ↓
Returns success response to frontend
  ↓
Frontend updates UI to show model as "loaded"
```

## Troubleshooting Checklist

- [ ] llama-server is running: `ps aux | grep llama-server`
- [ ] llama-server port is correct: `curl http://localhost:8134/health`
- [ ] Next.js app is running: Check http://localhost:3000
- [ ] Check browser console (F12) for errors
- [ ] Check server logs for "[API]" messages
- [ ] Verify `.llama-proxy-config.json` has correct host/port
- [ ] Try API directly with curl (see Step 3)
- [ ] Check system memory/GPU memory
- [ ] Check firewall between services
- [ ] Restart both services: Stop llama-server, stop app, restart both

## Getting More Debug Info

Edit the API route to add more logging:

In `app/api/models/[name]/start/route.ts`, the code already includes comprehensive logging. Check your terminal/console for:

```
[API] Loading model: ...
[API] Current llama-server status: ...
[API] Forwarding model load to llama-server at ...
[API] Model ... loaded successfully
```

If you don't see these messages, add `console.log` statements to trace the issue.

## Next Steps

Once model loading works:
1. Test model unloading: POST `/api/models/{name}/stop`
2. Monitor model status in the UI
3. Check GPU memory usage during loading
4. Test with different model sizes
