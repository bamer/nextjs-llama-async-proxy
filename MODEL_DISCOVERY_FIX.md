# Model Discovery Real-Time Update Fix

## Problem
When llama-server starts and discovers models, the UI model list doesn't update automatically. Models appear available on the server but are not shown in the client.

## Root Cause
**Frontend** (`ModelsPage.tsx`) was only loading models once on component mount—it did NOT listen to Socket.IO real-time broadcasts from the backend. The backend WAS broadcasting models every 30 seconds, but the client was never receiving/handling them.

## Solution Implemented

### 1. **Frontend WebSocket Subscription** (`src/components/pages/ModelsPage.tsx`)
- Connected `ModelsPage` to WebSocket server
- Added listener for `models` event broadcasts
- Updates model list in real-time when backend emits new data
- Requests models immediately upon WebSocket connect

**Key Changes:**
```typescript
// Subscribe to real-time model updates
websocketServer.on('message', handleModelsUpdate);

// Request models on connect
websocketServer.on('connect', handleConnect);
```

### 2. **Backend Immediate Broadcast** (`server.js`)
- When `LlamaService` state changes and models are discovered, immediately broadcast via Socket.IO
- No longer relies only on 30-second polling interval
- Models now appear instantly when llama-server loads them

**Key Changes:**
- Added broadcast in `onStateChange` callback when `state.models` changes
- Models are sent to all connected clients immediately

### 3. **TypeScript Type Safety**
- Updated `Model` interface to include optional fields (as backend sends various formats)
- Strict type checking for WebSocket messages to prevent `any` type

## How It Works Now

1. **Startup:**
   - Frontend connects to WebSocket
   - Requests current models via `requestModels()`
   - Receives existing models via Socket.IO

2. **When llama-server discovers models:**
   - `LlamaService.loadModels()` queries `/api/models`
   - Updates internal state
   - Calls `emitStateChange()`
   - Backend catches state change and broadcasts models via `io.emit('models', ...)`
   - Frontend listener receives broadcast and updates UI instantly

3. **Periodic sync:**
   - Backend still broadcasts every 30 seconds as fallback
   - Ensures consistency even if state change emission is missed

## Testing

1. Start the app: `pnpm dev`
2. Open Models page
3. Start llama-server in another terminal
4. Models should appear in the UI within seconds (not 30 seconds)

## Files Modified
- `src/components/pages/ModelsPage.tsx` - Added WebSocket listener
- `server.js` - Added immediate broadcast on state change
