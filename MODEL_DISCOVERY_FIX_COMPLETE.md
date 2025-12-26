# Model Discovery Complete Fix

## Problems Identified & Resolved

### Issue 1: Wrong llama-server Endpoint
**Problem**: Code was querying `/api/models` but llama-server uses `/models` (OpenAI-compatible endpoint)

**Solution**: Updated `LlamaService.loadModels()` to use correct endpoint `/models`

**Endpoint Details**:
- llama-server follows OpenAI-compatible API
- Endpoint: `GET /models` - Lists all available models
- Response includes model info (id, name, size, etc.)

### Issue 2: Frontend Not Listening to Real-Time Updates
**Problem**: ModelsPage only loaded models once on mount, never listened to WebSocket broadcasts

**Solution**: 
- Connected ModelsPage to WebSocket server
- Added listener for `models` event from Socket.IO
- Updates UI when backend broadcasts new models
- Requests models immediately on WebSocket connect

### Issue 3: Backend Broadcast Not Triggered on Model Discovery
**Problem**: Models discovered by llama-server weren't immediately broadcast to clients

**Solution**:
- Added immediate broadcast in `onStateChange` callback
- When LlamaService state changes (models discovered), broadcasts via Socket.IO
- No longer depends solely on 30-second polling interval

## How It Works Now

### Startup Flow
1. **Backend**: LlamaService starts and queries `GET /models` from llama-server
2. **Backend**: emitStateChange() is called when models load
3. **Backend**: server.js listens to state changes and broadcasts via Socket.IO
4. **Frontend**: WebSocket connects and listens for `models` event
5. **Frontend**: Models appear in UI within seconds

### Model Loading Process
```
llama-server startup
    ↓
LlamaService.loadModels() 
    ↓
Queries: GET /models (correct endpoint)
    ↓
Updates state.models
    ↓
Calls emitStateChange()
    ↓
server.js broadcasts: io.emit('models', ...)
    ↓
Frontend receives and updates UI
```

### Fallback Mechanism
- If `/models` endpoint fails, falls back to filesystem scanning
- Scans `basePath` for .gguf and .bin files
- Ensures models are always discoverable

## Files Modified

1. **src/server/services/LlamaService.ts**
   - Fixed endpoint from `/api/models` → `/models`
   - Added fallback filesystem scanning
   - Improved error handling

2. **src/components/pages/ModelsPage.tsx**
   - Added WebSocket connection and listener
   - Real-time model list updates
   - Proper TypeScript typing

3. **server.js**
   - Immediate broadcast on state change
   - Models sent to clients when discovered

## Testing

```bash
# Terminal 1: Start next.js app
pnpm dev

# Terminal 2: Start llama-server  
llama-server --models-dir /path/to/models --host localhost --port 8134

# Expected: Models appear in UI within 2-3 seconds
```

## Notes

- llama-server is OpenAI-compatible
- The `/models` endpoint returns available models
- WebSocket broadcasts every 30 seconds as fallback
- Filesystem scanning is emergency fallback only
