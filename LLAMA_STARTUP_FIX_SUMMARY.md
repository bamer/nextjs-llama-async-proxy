# Llama Server Startup Fix Summary

## Problem Statement

The application crashed on startup when trying to load llama-server because:
1. It attempted to load a specific model file at startup
2. If the model file path was invalid or didn't exist, llama-server crashed
3. The application depended on the server being ready with a loaded model

## Solution Implemented

Changed from **model-first** startup to **server-first** startup:

### Before (Broken)
```
App Start → Load llama-server with specific model file → CRASH if file missing
```

### After (Fixed)
```
App Start → Start llama-server without model → Query for available models → Display list → Client selects model
```

## Changes Made

### 1. **server.js** (Main Entry Point)

**Changed:**
- Removed `modelPath: llamaConfig.llama_model_path` from LlamaService config
- Added `basePath: llamaConfig.basePath || './models'` for auto-discovery
- Added explanatory comments about the fix

**Impact:** llama-server now starts without trying to load a specific model file

### 2. **src/server/services/LlamaService.ts** (Model Loading)

**Enhanced:**
- Improved `loadModels()` method with better logging
- Shows detailed model information when loaded
- Better error messages if models not found
- Logs each discovered model with size

**Impact:** Clearer feedback during model discovery phase

### 3. **New Documentation**

- Created `LLAMA_STARTUP_GUIDE.md` with complete setup instructions
- Includes troubleshooting guide
- Shows the startup sequence with diagrams

## Configuration

Create `.llama-proxy-config.json`:

```json
{
  "llama_server_host": "localhost",
  "llama_server_port": 8134,
  "llama_server_path": "/path/to/llama-server",
  "basePath": "./models"
}
```

**Key Points:**
- `llama_server_path`: Must be the full path to llama-server binary
- `basePath`: Directory containing your GGUF model files
- Do NOT include `llama_model_path` - removed intentionally

## Startup Sequence (New)

1. **Health Check**: Is llama-server already running on configured host:port?
   - YES → Skip spawn, proceed to model discovery
   - NO → Continue to step 2

2. **Spawn Server**: Start llama-server process with arguments:
   ```bash
   llama-server --host localhost --port 8134 --models-dir ./models
   ```

3. **Wait for Ready**: Poll `/health` endpoint until server responds

4. **Query Models**: Request `/api/models` from running server
   - Auto-discovers all GGUF files in `./models` directory
   - Builds model list for UI

5. **Display to UI**: Models appear in Models section
   - User can select which model to load
   - Loading happens on-demand, not at startup

## Benefits

✅ **No startup crashes** - server runs without loading model first
✅ **Flexible model selection** - user chooses which model to load
✅ **Better error handling** - clear messages if issues occur
✅ **Faster startup** - don't load large models immediately
✅ **Production ready** - can run without any pre-loaded models

## Testing the Fix

### 1. Verify Configuration
```bash
cat .llama-proxy-config.json
```

### 2. Prepare Models Directory
```bash
mkdir -p ./models
cp /path/to/model.gguf ./models/
ls -lh ./models/
```

### 3. Start Application
```bash
pnpm dev
```

### 4. Check Logs
```bash
# Should see:
# 🚀 Spawning llama-server with args: --host localhost --port 8134 --models-dir ./models
# ✅ Server ready after X checks
# 🔍 Querying llama-server for available models...
# ✅ Loaded X model(s) from llama-server
#   - model1.gguf (4.50 GB)
```

### 5. Open UI
Visit [http://localhost:3000](http://localhost:3000) → Models section should show discovered models

## Backwards Compatibility

✅ Existing configurations will still work
✅ No breaking changes to API
✅ Models can still be loaded programmatically via `/api/models/{id}/load`

## Files Modified

1. `server.js` - Startup configuration (lines 80-107)
2. `src/server/services/LlamaService.ts` - Model loading (lines 276-316)

## Files Created

1. `LLAMA_STARTUP_GUIDE.md` - Complete setup and troubleshooting guide
2. `LLAMA_STARTUP_FIX_SUMMARY.md` - This file

## Next Steps

1. Update your `.llama-proxy-config.json` with correct paths
2. Ensure models are in the `basePath` directory
3. Start the application with `pnpm dev`
4. Verify llama-server starts and models are discovered
5. Test model loading through the UI

## Support

If issues persist:
1. Check `LLAMA_STARTUP_GUIDE.md` troubleshooting section
2. Review server logs with: `tail -f server.log | grep -i llama`
3. Test llama-server binary directly:
   ```bash
   /path/to/llama-server --host localhost --port 8134 --models-dir ./models
   ```
