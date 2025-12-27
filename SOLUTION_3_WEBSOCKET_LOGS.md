# Solution 3: Real-Time Log Streaming via WebSocket

## Overview

This solution implements a custom Winston transport that broadcasts application logs in real-time to all connected WebSocket clients. Logs are written to disk (rotated files) AND streamed live to the UI without blocking the UI path with disk I/O.

## Architecture

```
Winston Logger
    ↓
Custom WebSocketTransport
    ├→ Disk (DailyRotateFile transport) - Persisted logs
    ├→ Console transport
    └→ WebSocket broadcast - Real-time UI updates
        ↓
Socket.IO Server
    ↓
Connected Clients
    ↓
Zustand Store (UI State)
    ↓
Logs Page Display
```

## Files Created/Modified

### 1. **New File: `src/lib/websocket-transport.ts`**
Custom Winston transport that extends `transports.Stream`:
- Broadcasts logs via Socket.IO to all connected clients
- Maintains an in-memory queue (500 logs) for reconnection scenarios
- Provides `getCachedLogs()` for on-demand log retrieval
- Typed using the global `LogEntry` interface

**Key Methods:**
- `log(info, callback)` - Called by Winston on every log event
- `setSocketIOInstance(io)` - Register Socket.IO instance (called from server)
- `getCachedLogs()` - Returns queued logs for requestLogs events
- `getLogsByLevel(level)` - Filter logs by level

### 2. **Modified: `src/lib/logger.ts`**
- Import `WebSocketTransport` and `Server` from socket.io
- Create global `wsTransport` instance
- Initialize `WebSocketTransport` in `initLogger()`
- Add new function `setSocketIOInstance(io)` to register Socket.IO
- Add new function `getWebSocketTransport()` to access the transport

### 3. **Modified: `server.js`**
- Import `setSocketIOInstance` from logger
- Call `setSocketIOInstance(io)` after Socket.IO initialization
- Logs message confirming registration

### 4. **Modified: `src/server/services/LlamaServerIntegration.ts`**
- Import `getWebSocketTransport` from logger
- Update `requestLogs` handler to:
  - Retrieve cached logs from WebSocket transport
  - Send them back to requesting client
  - Returns array of logs with full details

### 5. **Modified: `src/lib/websocket-client.ts`**
- Add listener for new `log` event (individual real-time logs)
- Existing `logs` event handles batch retrieval on requestLogs

### 6. **Modified: `src/hooks/use-websocket.ts`**
- Handle `type: 'log'` messages → call `addLog()` for real-time
- Handle `type: 'logs'` messages → call `setLogs()` for batch loads

## How It Works

### Real-Time Flow
```
1. Application calls logger.info("message")
   ↓
2. Winston passes to all transports (console, file, WebSocketTransport)
   ↓
3. WebSocketTransport.log() is called
   ├→ Adds to in-memory queue (max 500)
   └→ Emits 'log' event via Socket.IO to all connected clients
   ↓
4. Client receives 'log' event via websocket-client
   ↓
5. use-websocket.ts handles type:'log'
   ↓
6. Calls store.addLog() → Zustand updates state
   ↓
7. app/logs/page.tsx re-renders with new log
```

### On-Demand Retrieval (Reconnection/Initial Load)
```
1. Client calls websocketServer.requestLogs()
   ↓
2. Server's LlamaServerIntegration receives 'requestLogs' event
   ↓
3. Calls getWebSocketTransport().getCachedLogs()
   ↓
4. Returns array of up to 500 recent logs
   ↓
5. Emits 'logs' event with batch data
   ↓
6. Client receives 'logs' event
   ↓
7. use-websocket.ts handles type:'logs'
   ↓
8. Calls store.setLogs() → replaces all logs in store
   ↓
9. app/logs/page.tsx displays logs
```

## Configuration

No additional configuration needed! The WebSocket transport:
- Automatically initializes when logger is imported
- Registers Socket.IO instance on server startup
- Maintains 500-log queue (adjust `maxQueueSize` in websocket-transport.ts if needed)

## Benefits

✅ **Real-time log display** - See logs as they're generated
✅ **Disk persistence** - Logs still written to rotated files
✅ **No UI blocking** - WebSocket broadcast doesn't wait for disk I/O
✅ **Scalable** - Can handle many connected clients
✅ **Memory efficient** - Keeps only last 500 logs in memory
✅ **Automatic recovery** - Reconnecting clients get cached logs
✅ **Integrates with existing Winston** - No changes to log configuration
✅ **Typed** - Uses global LogEntry interface

## Testing

### Manual Testing
1. Start the server: `pnpm dev`
2. Open the application in browser
3. Generate logs by performing actions
4. Navigate to /logs page - should see real-time logs appearing
5. Disconnect/reconnect WebSocket - should get cached logs on reconnect

### Checking Disk Logs
Logs still written to `logs/` directory:
```bash
tail -f logs/application-2025-12-27.log
tail -f logs/errors-2025-12-27.log
```

## Performance Considerations

- **Memory**: 500 logs × ~200 bytes = ~100KB per server
- **Network**: One message per log event + timestamp
- **CPU**: Minimal - just array operations and JSON serialization

## Future Enhancements

1. Add log filtering/search via WebSocket
2. Implement log persistence in database
3. Add log export functionality
4. Implement log retention policies
5. Add log severity-based alerts
