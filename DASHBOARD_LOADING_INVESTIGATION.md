# Dashboard Loading Performance Investigation

## Current Issues Identified

### 1. **Socket Connection Delay (Main Bottleneck)**
**File**: `public/js/app-init.js` lines 51-60

The dashboard waits for `DOMContentLoaded` to establish socket connection:
```javascript
document.addEventListener("DOMContentLoaded", () => {
  socketClient.connect();
  stateManager.init(socketClient);
});
```

- **Problem**: If app.js (which includes app-init.js) is loaded near the end of HTML, socket doesn't connect until DOM is fully parsed
- **Impact**: 1-3 seconds minimum delay before any network requests can happen

### 2. **Connection Guard Polling (Secondary Bottleneck)**
**File**: `public/js/core/state/state-socket.js` lines 117-131

```javascript
request(event, data = {}) {
  return new Promise((resolve, reject) => {
    if (!this.connection.isConnected()) {
      const checkConnection = setInterval(() => {
        if (this.connection.isConnected()) {
          clearInterval(checkConnection);
          this._doRequest(event, data, resolve, reject);
        }
      }, 100);  // Polls every 100ms
    }
    this._doRequest(event, data, resolve, reject);
  });
}
```

- **Problem**: Every request polls connection status every 100ms until connected
- **Impact**: Additional 100-500ms delay per request if socket isn't connected

### 3. **Controller Initialization Timing Issue**
**File**: `public/js/pages/dashboard/dashboard-controller.js` lines 104-147

```javascript
_loadDataWhenConnected() {
  if (stateManager.isConnected()) {
    this._loadData();
    return;
  }
  
  const unsub = stateManager.subscribe("connectionStatus", (status) => {
    if (status === "connected") {
      unsub();
      this._loadData();
    }
  });
}

_loadData() {
  if (!stateManager.isConnected()) {
    const checkConnection = setInterval(() => {
      if (stateManager.isConnected()) {
        clearInterval(checkConnection);
        this._loadDataAsync();
      }
    }, 100);  // Another 100ms polling loop!
    return;
  }
  this._loadDataAsync();
}
```

- **Problem**: DOUBLE polling - both state-socket.js AND dashboard-controller.js poll connection
- **Impact**: 500ms - 1+ seconds of redundant polling

### 4. **No Concurrent Data Loading**
**File**: `public/js/pages/dashboard/dashboard-controller.js` lines 152-206

```javascript
_loadDataAsync() {
  stateManager.getConfig()...
  stateManager.getModels()...
  stateManager.getMetrics()...
  stateManager.getMetricsHistory({ limit: 60 })...
  stateManager.getSettings()...
  stateManager.request("presets:list")...
}
```

- **Good**: Requests are parallel (no `await` blocking)
- **Issue**: But they all wait for socket connection individually first

### 5. **Component Rendering Before Data**
**File**: `public/js/pages/dashboard/page.js` lines 31-34

```javascript
onMount() {
  // Load data when connected
  this.controller?._loadDataWhenConnected();
}
```

- **Problem**: Component renders first (with empty state), THEN data loads
- **Impact**: User sees loading spinners/empty state for 5+ seconds

### 6. **No Initial Data Cache**
- **Problem**: No way to restore previously persisted data before socket connects
- **Impact**: Dashboard blank until server responds

## Root Cause Summary

1. **Socket connection takes 1-3 seconds** (waiting for DOMContentLoaded)
2. **Double-polling for connection** adds 500ms-1s unnecessarily
3. **No persisted data restoration** before socket connects
4. **Sequential connection waits** in multiple layers

**Total delay: 5+ seconds**

## Solution Architecture

### Phase 1: Instant Socket Connection
- Move socket initialization to `<head>` script tag (before DOM parsing)
- Use `window.io` immediately when available

### Phase 2: Eliminate Double Polling
- Remove polling from dashboard-controller.js
- Let state-socket.js handle connection queue internally
- Queue requests before connection, execute when ready

### Phase 3: Parallel Data Loading
- Start all requests immediately (queued if not connected)
- No sequential waiting between requests

### Phase 4: Instant UI with Persisted Data
- Load chart data from localStorage instantly
- Show stats with cached values while live data loads
- Update UI as each piece of data arrives

### Phase 5: Smart Data Caching
- Auto-save metrics to localStorage every 60s
- Auto-save config/models/settings on update
- Load on startup before socket connects

## Expected Timeline After Fixes
- Socket connect: **~200-400ms** (parallel with page load)
- Dashboard renders: **~0-100ms** (with cached data)
- Live data starts updating: **~400-600ms**
- **Total**: ~600-700ms (vs 5000ms+ now)

## Files to Modify
1. `public/index.html` - Add socket script to `<head>`
2. `public/js/app-init.js` - Move socket init before DOMContentLoaded
3. `public/js/core/state/state-socket.js` - Smart request queuing
4. `public/js/pages/dashboard/dashboard-controller.js` - Simplify load logic
5. `public/js/pages/dashboard/page.js` - Add persisted data restoration
6. Create `public/js/utils/cache-manager.js` - Data persistence layer
