# WebSocket Provider Fix - Client/Server Architecture Separation

## Problem
The `src/providers/websocket-provider.tsx` file was incorrectly importing and calling database functions directly from a client component, which caused Next.js build failures because:
- Database functions use `better-sqlite3` which requires Node.js APIs (fs, path)
- Client components cannot bundle Node.js APIs for the browser
- This violated Next.js 16's client/server boundary

## Solution Applied

### 1. Removed All Database Imports
```typescript
// REMOVED:
import {
  saveMetrics,
  getMetricsHistory,
  getModels,
  saveModel,
  getModelById,
  updateModel,
  deleteModel,
  getModelByName,
  saveModelSamplingConfig,
  getModelSamplingConfig,
  saveModelMemoryConfig,
  getModelMemoryConfig,
  saveModelGpuConfig,
  getModelGpuConfig,
  saveModelAdvancedConfig,
  getModelAdvancedConfig,
  saveModelLoraConfig,
  getModelLoraConfig,
  saveModelMultimodalConfig,
  getModelMultimodalConfig,
} from "@/lib/database";
import type { ModelConfig as DatabaseModelConfig } from "@/lib/database";
```

### 2. Simplified `processMetricsBatch`
- Removed `saveMetrics()` call and all related data transformation logic
- Kept batch processing and Zustand store updates
- Metrics are now only stored in memory, not persisted to database

**Before:**
```typescript
const processMetricsBatch = useCallback(() => {
  if (metricsBatchRef.current.length > 0) {
    const latestMetrics = metricsBatchRef.current[metricsBatchRef.current.length - 1];
    useStore.getState().setMetrics(latestMetrics);

    // Save to database for persistence (non-blocking)
    try {
      const metricsData = { /* ...transform data... */ };
      saveMetrics(metricsData);
    } catch (error) {
      console.error('[WebSocketProvider] Failed to save metrics to database:', error);
    }

    metricsBatchRef.current = [];
  }
  metricsThrottleRef.current = null;
}, []);
```

**After:**
```typescript
const processMetricsBatch = useCallback(() => {
  if (metricsBatchRef.current.length > 0) {
    const latestMetrics = metricsBatchRef.current[metricsBatchRef.current.length - 1];
    useStore.getState().setMetrics(latestMetrics);

    metricsBatchRef.current = [];
  }
  metricsThrottleRef.current = null;
}, []);
```

### 3. Removed Helper Functions
- Removed `storeToDatabaseModel()` - no longer needed
- Removed `databaseToStoreModel()` - no longer needed

### 4. Simplified `processModelsBatch`
- Removed all database sync logic
- Kept batch processing and Zustand store updates
- Models are now only managed by backend, not synced to database from client

### 5. Updated `handleConnect`
- Removed `getModels()` call to load models from database
- Removed `getMetricsHistory()` call to load metrics history
- Added TODO comments for future backend integration

**Before:**
```typescript
const handleConnect = () => {
  console.log('[WebSocketProvider] WebSocket connected');
  setIsConnected(true);
  setConnectionState('connected');

  // Load models from database on connect
  try {
    const dbModels = getModels();
    const storeModels = dbModels.map(databaseToStoreModel);
    if (storeModels.length > 0) {
      useStore.getState().setModels(storeModels);
      console.log('[WebSocketProvider] Loaded models from database:', storeModels.length, 'models');
    }
  } catch (err) {
    console.error('[WebSocketProvider] Failed to load models from database:', err);
  }

  // Load metrics history from database (last 10 minutes)
  try {
    const metricsHistory = getMetricsHistory(10);
    // ... set initial metrics from history ...
  } catch (error) {
    console.error('[WebSocketProvider] Failed to load metrics history:', error);
  }

  // Request initial data after connection
  websocketServer.requestMetrics();
  websocketServer.requestModels();
  websocketServer.requestLogs();
};
```

**After:**
```typescript
const handleConnect = () => {
  console.log('[WebSocketProvider] WebSocket connected');
  setIsConnected(true);
  setConnectionState('connected');

  // TODO: Load models from backend via WebSocket if needed
  // Backend should send initial 'models' message on connection

  // TODO: Load metrics history from backend via WebSocket if needed
  // Backend should send initial 'metrics' message on connection

  // Request initial data after connection
  websocketServer.requestMetrics();
  websocketServer.requestModels();
  websocketServer.requestLogs();
};
```

### 6. Simplified Database Message Handlers
Replaced all database function calls with TODO comments and warnings:

**Before:**
```typescript
} else if (msg.type === 'save_model') {
  // Save model to database
  (async () => {
    try {
      const model = await saveModel(msg.data as any);
      websocketServer.sendMessage('model_saved', { success: true, data: model, timestamp: Date.now() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      websocketServer.sendMessage('model_saved', {
        success: false,
        error: { code: 'SAVE_FAILED', message: errorMessage },
        timestamp: Date.now()
      });
    }
  })();
}
// ... similar handlers for update_model, delete_model, load_config, save_config ...
```

**After:**
```typescript
} else if (msg.type === 'save_model') {
  // TODO: Forward to backend API route to save model
  console.warn('[WebSocketProvider] save_model message requires backend API endpoint');
} else if (msg.type === 'update_model') {
  // TODO: Forward to backend API route to update model
  console.warn('[WebSocketProvider] update_model message requires backend API endpoint');
} else if (msg.type === 'delete_model') {
  // TODO: Forward to backend API route to delete model
  console.warn('[WebSocketProvider] delete_model message requires backend API endpoint');
} else if (msg.type === 'load_config') {
  // TODO: Forward to backend API route to load model config
  console.warn('[WebSocketProvider] load_config message requires backend API endpoint');
} else if (msg.type === 'save_config') {
  // TODO: Forward to backend API route to save model config
  console.warn('[WebSocketProvider] save_config message requires backend API endpoint');
}
```

## What Was Preserved

✅ All WebSocket connection logic
✅ All message sending/receiving logic
✅ All state management (useState)
✅ All Zustand store updates
✅ All batch processing (metrics, models, logs)
✅ All event listeners and cleanup logic
✅ All non-database message handlers (metrics, models, logs, llamaServerStatus)

## Build Verification

✅ **TypeScript compilation:** No errors in websocket-provider.tsx
✅ **Next.js build:** Completed successfully
✅ **Static page generation:** All 15 pages generated successfully

## Next Steps (TODOs)

To restore full functionality, you'll need to implement:

1. **Backend API Routes** for model CRUD operations:
   - `POST /api/models` - Create model
   - `PUT /api/models/[id]` - Update model
   - `DELETE /api/models/[id]` - Delete model

2. **Backend API Routes** for model config:
   - `GET /api/models/[id]/config/[type]` - Load config (sampling, memory, gpu, etc.)
   - `PUT /api/models/[id]/config/[type]` - Save config

3. **Backend WebSocket Handlers**:
   - Handle `save_model` messages and forward to API route
   - Handle `update_model` messages and forward to API route
   - Handle `delete_model` messages and forward to API route
   - Handle `load_config` messages and forward to API route
   - Handle `save_config` messages and forward to API route

4. **Initial Data Loading**:
   - Backend should send initial `models` message when client connects
   - Backend should send initial `metrics` message when client connects

## Architecture

### Before (Incorrect)
```
Client Component (websocket-provider.tsx)
  ├── WebSocket Client
  └── ❌ Direct Database Calls (better-sqlite3) ← PROBLEM
```

### After (Correct)
```
Client Component (websocket-provider.tsx)
  ├── WebSocket Client
  └── WebSocket Messages

Backend (API Routes / WebSocket Server)
  ├── Database Operations (better-sqlite3) ← Moved here
  └── Business Logic
```

## Summary

The websocket-provider is now a **pure WebSocket client** that:
- Connects to backend via WebSocket
- Sends and receives messages
- Updates client-side state via Zustand
- Does NOT touch the database directly
- Can be bundled for the browser without Node.js dependencies

All database operations must now be handled by:
- Next.js API routes (for REST endpoints)
- Backend WebSocket server (for WebSocket message handlers)
- Server Actions (if using Next.js Server Actions)

This follows Next.js 16's client/server boundary and will build successfully.
