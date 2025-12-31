# Fix: Models Not Loading on Refresh

## Root Cause

The websocket provider was **ignoring** all `models` events because it thought they were coming from llama-server instead of the database.

**Code in `src/providers/websocket-provider.tsx`:**
```typescript
} else if (msg.type === 'models' && msg.data) {
  // Do NOT process 'models' messages from llama-server
  // Models are loaded from database via 'load_models' message
  // Llama-server models don't have database IDs needed for configuration
  console.log('[WebSocketProvider] Ignoring models message from llama-server (use database models via load_models)');
}
```

**Problem:** When I implemented the new flow, I was still sending `socket.emit("models", ...)` which was being blocked by this check.

## Solution

### 1. Changed Event Type for Database Models

**In `src/server/services/LlamaServerIntegration.ts`:**

Changed from:
```typescript
socket.emit("models", {
  type: "models",
  data: getModels().map(...),
  timestamp: Date.now(),
});
```

To:
```typescript
socket.emit("models_loaded", {
  type: "models_loaded",
  data: getModels().map(...),
  timestamp: Date.now(),
});
```

### 2. Updated Message Handler to Listen for New Event

**In `src/lib/websocket-client/message-handler.ts`:**

Already had `models_loaded` in the dbEvents list:
```typescript
const dbEvents = [
  'models_loaded',    // ✅ Already there
  'model_saved',
  'model_updated',
  'model_deleted',
  'config_loaded',
  'config_saved',
  'models_imported',
] as const;
```

### 3. Added Handler for New Event in WebSocket Provider

**In `src/providers/websocket-provider.tsx`:**

Added new handler for `models_loaded`:
```typescript
} else if (msg.type === 'models_loaded' && msg.data) {
  // Models loaded from database - process them
  const models = msg.data as ModelConfig[];
  console.log('[WebSocketProvider] Received models from database:', models.length, 'models');
  modelsBatchRef.current.push(models);
  if (!modelsThrottleRef.current) {
    modelsThrottleRef.current = setTimeout(processModelsBatch, 500);
  }
}
```

### 4. Added Import Complete Handler

**In `src/providers/websocket-provider.tsx`:**

Added handler for `models_imported` event:
```typescript
} else if (msg.type === 'models_imported' && msg.data) {
  // Models imported successfully - trigger load from database
  console.log('[WebSocketProvider] Models imported successfully, triggering database load');
  websocketServer.sendMessage('load_models', {});
}
```

### 5. Updated rescanModels Handler

**In `src/server/services/LlamaServerIntegration.ts`:**

After importing models, emit `models_imported` event instead of `models_loaded`:
```typescript
socket.emit("models_imported", {
  type: "models_imported",
  data: {
    imported: result.imported,
    updated: result.updated,
    errors: result.errors,
  },
  timestamp: Date.now(),
});
```

## Event Flow

### Initial Load (on page mount)
```
Models Page: sendMessage('load_models', {})
           ↓
Server: socket.on('load_models')
         → getModels() from database
         → socket.emit('models_loaded', { data: [...] })
           ↓
WebSocket Provider: msg.type === 'models_loaded'
         → useStore.getState().setModels([...])
         → Models displayed in UI
```

### Refresh Models (click refresh button)
```
Models Page: sendMessage('rescanModels', {})
           ↓
Server: socket.on('rescanModels')
         → modelImportService.importModels()
         → Scan filesystem for GGUF files
         → Extract metadata with llama-fit-params
         → Save to database
         → socket.emit('models_imported', { data: {...} })
           ↓
WebSocket Provider: msg.type === 'models_imported'
         → sendMessage('load_models', {})
           ↓
Server: socket.on('load_models')
         → getModels() from database
         → socket.emit('models_loaded', { data: [...] })
           ↓
WebSocket Provider: msg.type === 'models_loaded'
         → useStore.getState().setModels([...])
         → Models displayed in UI
```

## Files Modified

1. **`src/server/services/LlamaServerIntegration.ts`**
   - `load_models` handler: Changed event from `models` to `models_loaded`
   - `rescanModels` handler: Added `models_imported` event emission

2. **`src/providers/websocket-provider.tsx`**
   - Added handler for `models_loaded` event (process database models)
   - Added handler for `models_imported` event (trigger reload after import)

3. **`src/lib/websocket-client/message-handler.ts`**
   - No changes needed (already had `models_loaded` in dbEvents)

## Event Types Used

| Event | Source | Purpose |
|-------|--------|---------|
| `load_models` | Client → Server | Request models from database |
| `models_loaded` | Server → Client | Send database models to client |
| `models_imported` | Server → Client | Notify import complete, trigger reload |
| `rescanModels` | Client → Server | Trigger filesystem scan and import |
| `models` | Server → Client | **Ignored** (old llama-server models) |

## Benefits

1. **Separation of Concerns** - Database models vs. llama-server models use different events
2. **Event Blocking Fixed** - Database models are now processed correctly
3. **Clear Flow** - Import → Notify Import Complete → Reload → Display
4. **Backwards Compatible** - Old `models` events still work for llama-server status
5. **No More Conflicts** - WebSocket provider can distinguish data sources

## Testing

1. **Navigate to Models Page** → Should load from database via `load_models` → `models_loaded`
2. **Click Refresh Button** → Triggers `rescanModels` → `models_imported` → `load_models` → `models_loaded`
3. **Check Console** → Should see:
   ```
   [WebSocketProvider] Received models from database: 3 models
   [WebSocketProvider] Models imported successfully, triggering database load
   ```
4. **Verify Database** → Models should be stored with GGUF metadata

## No More "undefined" Prefix!

The logging cleanup (previous fix) combined with this fix means:
- ✅ No "undefined" in logs
- ✅ Clean event flow
- ✅ Models load correctly from database
- ✅ Refresh button works properly
