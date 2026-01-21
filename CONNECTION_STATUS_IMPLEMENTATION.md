# Connection Status Implementation

This document describes the real-time connection status indicators implemented for the Llama Async Proxy Dashboard.

## Features Implemented

### 1. Enhanced Socket Client (`public/js/services/socket-client.js`)

#### Connection State Tracking
- **States**: `disconnected`, `connecting`, `connected`, `reconnecting`
- **New Events**:
  - `socket:state_changed` - Emitted when connection state changes
  - `socket:reconnecting` - Emitted during reconnection attempts with delay info
  - `socket:reconnected` - Emitted when reconnection succeeds
  - `socket:reconnect_failed` - Emitted when all reconnection attempts exhausted

#### Exponential Backoff
- **Base delay**: 1000ms (1 second)
- **Max delay**: 16000ms (16 seconds)  
- **Backoff formula**: `base * 2^(attempt-1)`, capped at max
- **Jitter**: ±10% random delay to prevent thundering herd

#### User Notifications
- **Disconnection**: Warning toast notification (except intentional disconnect)
- **Reconnection**: Success toast notification
- **Reconnection failed**: Error toast notification with guidance to refresh

#### New Properties & Methods
- `connectionState` - Get current connection state
- `reconnectAttempts` - Get current reconnection attempt number
- `setNotificationsEnabled(bool)` - Enable/disable notifications
- Enhanced `connect()` - Implements exponential backoff

### 2. Enhanced Sidebar (`public/js/components/layout/sidebar.js`)

#### Connection Status Display
- **Visual indicator** with colored dot and text
- **States displayed**:
  - `Connected` (green) - Socket connected
  - `Disconnected` (red) - Socket disconnected
  - `Connecting...` (yellow, pulsing) - Initial connection attempt
  - `Reconnecting (X/Y)...` (yellow, pulsing) - Reconnection with attempt counter

#### Event Handling
- Listens to all socket connection state events
- Updates UI immediately on state changes
- Shows attempt counter during reconnection (e.g., "Reconnecting (3/10)...")
- Cleans up subscriptions on destroy

### 3. Enhanced CSS (`public/css/layout/sidebar.css`)

#### New Styles
- **`.connection-status.connecting`** - Connecting state styling
- **`.connection-status.reconnecting`** - Reconnecting state styling
- **`@keyframes pulse-warning`** - Pulsing animation for connecting/reconnecting states

#### Animation Details
- **Connecting**: 1s pulse cycle (faster)
- **Reconnecting**: 1.5s pulse cycle (slower)
- **Visual**: Opacity and scale animation with yellow glow

## Usage

### Connection State Events

```javascript
// Listen for connection state changes
socketClient.on("socket:state_changed", (data) => {
  console.log("State changed:", data.previous, "->", data.current);
});

// Listen for reconnection attempts
socketClient.on("socket:reconnecting", (data) => {
  console.log(`Reconnecting: attempt ${data.attempt}/${data.maxAttempts}`);
  console.log(`Next attempt in ${data.delay}ms`);
});

// Listen for successful reconnection
socketClient.on("socket:reconnected", (data) => {
  console.log(`Reconnected after ${data.attempt} attempts`);
});

// Listen for reconnection failure
socketClient.on("socket:reconnect_failed", () => {
  console.error("Failed to reconnect after all attempts");
});
```

### Programmatic Access

```javascript
// Get current connection state
const state = socketClient.connectionState;
console.log("Current state:", state); // "connected", "disconnected", "connecting", "reconnecting"

// Get reconnection attempts
const attempts = socketClient.reconnectAttempts;
console.log("Reconnection attempt:", attempts);

// Check if connected
const isConnected = socketClient.isConnected;

// Enable/disable notifications
socketClient.setNotificationsEnabled(false); // Disable notifications
socketClient.setNotificationsEnabled(true);  // Enable notifications
```

## Visual States

### Sidebar Connection Status

1. **Disconnected** (red, static)
   - Dot color: Red (`--danger`)
   - Text: "Disconnected"
   - Animation: None

2. **Connecting** (yellow, pulsing)
   - Dot color: Yellow (`--warning`)
   - Text: "Connecting..."
   - Animation: Pulse every 1 second

3. **Connected** (green, static)
   - Dot color: Green (`--success`)
   - Text: "Connected"
   - Animation: None (steady glow)

4. **Reconnecting** (yellow, pulsing)
   - Dot color: Yellow (`--warning`)
   - Text: "Reconnecting (3/10)..."
   - Animation: Pulse every 1.5 seconds
   - Shows attempt counter

## Backoff Schedule

| Attempt | Delay (ms) | Delay with jitter (±10%) |
|---------|-----------|--------------------------|
| 1       | 1000      | 900-1100                 |
| 2       | 2000      | 1800-2200                |
| 3       | 4000      | 3600-4400                |
| 4       | 8000      | 7200-8800                |
| 5       | 16000     | 14400-17600              |
| 6+      | 16000     | 14400-17600              |

## Testing

### Manual Testing

1. **Initial connection**: Open browser console, reload page, observe "Connecting..." state
2. **Connection success**: After connection, observe "Connected" state
3. **Disconnection**: Stop server, observe "Disconnected" state and warning notification
4. **Reconnection**: Restart server, observe "Reconnecting (X/10)..." state and reconnection with success notification
5. **Reconnection failure**: After 10 failed attempts, observe "Disconnected" state and error notification

### Console Logging

```bash
# Connection events
[SocketClient] Connecting...
[SocketClient] Connected! ID: abc123
[SocketClient] Disconnected: transport close
[SocketClient] Reconnect attempt: 1
[SocketClient] Reconnecting in 2000ms (attempt 1)
[SocketClient] Reconnected after 3 attempts
[SocketClient] Reconnection failed after 10 attempts
```

## Files Modified

1. `public/js/services/socket-client.js` - Enhanced with exponential backoff and state tracking
2. `public/js/components/layout/sidebar.js` - Enhanced with connection state UI
3. `public/css/layout/sidebar.css` - Added connecting/reconnecting styles

## Backward Compatibility

- All existing socket client functionality preserved
- Existing event listeners continue to work
- `socket:connected` and `socket:disconnected` events still emitted
- `isConnected` property still available
- Only additions: new events, new properties, enhanced behavior

## Performance Considerations

- **Minimal overhead**: State changes only emit events when actually changed
- **Efficient animations**: CSS animations use GPU acceleration
- **Cleanup**: Subscriptions properly cleaned up on component destroy
- **Jitter**: Prevents thundering herd on server restart
