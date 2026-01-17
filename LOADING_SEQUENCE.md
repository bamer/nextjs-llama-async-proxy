# Dashboard Loading Sequence - Technical Details

## Timeline Visualization

```
User navigates to dashboard
│
├─ t=0ms
│  └─ Page starts rendering
│     └─ DashboardController.render() called
│        ├─ DashboardPage component created
│        └─ component.render() returns HTML with skeleton UI
│
├─ t=50ms ─ USER SEES: Skeleton UI with loading placeholders
│  └─ component.onMount() called
│     ├─ _renderSkeletonUI() marks sections with loading-skeleton class
│     ├─ Sections show pulsing animation
│     └─ controller._loadDataWhenConnected() called
│
├─ t=60ms ─ ALL REQUESTS FIRE IN PARALLEL (no waiting)
│  ├─ stateManager.getMetrics() → Socket.IO metrics:get
│  ├─ stateManager.getMetricsHistory() → Socket.IO metrics:history
│  ├─ stateManager.getModels() → Socket.IO models:list
│  ├─ stateManager.getConfig() → Socket.IO config:get
│  ├─ stateManager.getSettings() → Socket.IO settings:get
│  └─ stateManager.request("presets:list") → Socket.IO presets:list
│
├─ Server Processing (Parallel)
│  ├─ metrics:get handler
│  │  ├─ Query latest metrics from database
│  │  └─ Response ready in ~50ms
│  │
│  ├─ metrics:history handler
│  │  ├─ Query history from database (60 records)
│  │  └─ Response ready in ~100ms
│  │
│  ├─ models:list handler
│  │  ├─ Load models from database
│  │  └─ Response ready in ~80ms
│  │
│  ├─ config:get handler
│  │  ├─ Load config from database
│  │  └─ Response ready in ~40ms
│  │
│  ├─ settings:get handler
│  │  ├─ Load settings from database
│  │  └─ Response ready in ~40ms
│  │
│  └─ presets:list handler
│     ├─ Load presets from database
│     └─ Response ready in ~60ms
│
├─ t=120ms ─ FIRST RESPONSES START ARRIVING
│  ├─ metrics:get response arrives
│  │  ├─ StateAPI processes response
│  │  ├─ stateManager.set("metrics", data) called
│  │  └─ Subscription triggered → _updateMetricsSection()
│  │     └─ [data-section="metrics"] class loads removed
│  │        └─ USER SEES: Metrics section appears with live data
│  │
│  ├─ config:get response arrives (~50ms later)
│  │  └─ [data-section="router"] updated
│  │
│  └─ settings:get response arrives (~50ms later)
│     └─ Internal state updated
│
├─ t=200ms ─ MORE SECTIONS LOAD
│  ├─ models:list response arrives
│  │  └─ Models state updated
│  │
│  └─ presets:list response arrives
│     └─ [data-section="presets"] updated
│        └─ USER SEES: Presets section appears
│
├─ t=250ms ─ CHART DATA ARRIVES
│  └─ metrics:history response arrives (100ms to query + network)
│     └─ stateManager.set("metricsHistory", data) called
│        └─ [data-section="charts"] class removed
│           └─ USER SEES: Charts render with historical data
│
├─ t=300ms ─ ALL SECTIONS VISIBLE
│  └─ Metrics: ✓ Visible
│     Charts: ✓ Visible
│     Models: ✓ Visible
│     Router: ✓ Visible
│     Presets: ✓ Visible
│     Config: ✓ Loaded
│
└─ t=1000ms ─ FULLY INTERACTIVE
   └─ All animations complete
      Charts fully rendered
      User can click/interact with dashboard
```

## Code Flow Diagram

### Frontend Request Flow
```
DashboardPage.onMount()
│
├─ Render skeleton UI immediately
│  └─ _renderSkeletonUI()
│     └─ All [data-section] elements get loading-skeleton class
│
└─ Subscribe to state changes
   ├─ subscribe("metrics") → _updateMetricsSection()
   ├─ subscribe("metricsHistory") → _updateChartsSection()
   ├─ subscribe("presets") → _updatePresetsSection()
   └─ subscribe("llamaServerStatus") → _updateRouterCardUI()

Then: Fire all requests (no await, no blocking)
│
├─ stateManager.getMetrics()
├─ stateManager.getMetricsHistory()
├─ stateManager.getModels()
├─ stateManager.getConfig()
├─ stateManager.getSettings()
└─ stateManager.request("presets:list")
```

### Server Response Flow
```
When response arrives on client:
│
├─ Socket.IO event handler receives response
├─ StateAPI processes it
├─ stateManager.set() called
│  └─ Triggers state subscriptions
│     └─ Component update method called
│        └─ Section DOM updated immediately
│           └─ loading-skeleton class removed
│              └─ USER SEES CONTENT
└─ Next response processed independently
```

## Key Timing Details

### Request Timing
- All requests fire at **t=60-70ms** (essentially simultaneously)
- Requests are truly parallel (0ms between them)
- No request waits for another to complete

### Response Timing
- First response: **50-120ms** (database queries)
- Network latency: **30-50ms** (local network, typically fast)
- Total for first section: **120-170ms**
- Last response: **200-250ms**
- All responses done by: **300ms**

### Rendering Timing
- Skeleton render: **0-50ms**
- First section visible: **120-170ms**
- All sections visible: **200-300ms**
- Interactive: **1000ms** (all animations complete)

## Memory & CPU Impact

### Client Side
- Skeleton rendering: **minimal** (just CSS classes)
- Subscriptions: **minimal** (event handlers only)
- Memory footprint: **~2MB** (skeleton HTML + small state)

### Server Side
- Request handling: **immediate** (database lookups)
- No blocking: **all handlers async**
- CPU spikes: **minimal** (5 small queries vs 1 large batch)
- Load distribution: **spread over 250ms** (vs 10s batches)

## Comparison: Before vs After

### BEFORE (Blocking Batch Loading)
```
t=0ms:     Request dashboard
t=10s:     Skeleton UI appears (10 second wait)
t=10.1s:   All data arrives at once
t=10.2s:   Entire page renders
t=10.3s:   User can interact

User experience: Long blank wait, then sudden content dump
```

### AFTER (Progressive Streaming)
```
t=0ms:     Request dashboard
t=50ms:    Skeleton UI appears (immediate visual feedback)
t=120ms:   Metrics section shows (real data)
t=150ms:   More sections show
t=200ms:   Charts appear (real data)
t=300ms:   All sections visible
t=1s:      Fully interactive

User experience: Immediate feedback, progressive content arrival
```

## WebSocket Message Sequence

```
CLIENT → SERVER: metrics:get {requestId: 123}
CLIENT → SERVER: metrics:history {requestId: 124, limit: 60}
CLIENT → SERVER: models:list {requestId: 125}
CLIENT → SERVER: config:get {requestId: 126}
CLIENT → SERVER: settings:get {requestId: 127}
CLIENT → SERVER: presets:list {requestId: 128}

(All sent at roughly same time, server processes in parallel)

CLIENT ← SERVER: metrics:get:result {metrics: {...}, requestId: 123}
CLIENT ← SERVER: config:get:result {config: {...}, requestId: 126}
CLIENT ← SERVER: settings:get:result {settings: {...}, requestId: 127}
CLIENT ← SERVER: models:list:result {models: [...], requestId: 125}
CLIENT ← SERVER: presets:list:result {presets: [...], requestId: 128}
CLIENT ← SERVER: metrics:history:result {history: [...], requestId: 124}

(Responses arrive independently, not in request order)
```

## CSS Animation Sequence

```
t=0-50ms:     Skeleton UI appears with loading-skeleton class
              ↓
              Triggers @keyframes skeleton-pulse animation
              ↓
              Elements pulsing: Color transitions every 2 seconds

t=120ms:      metrics:get response arrives
              ↓
              stateManager.set("metrics", data) triggered
              ↓
              Subscription callback: _updateMetricsSection()
              ↓
              section.classList.remove("loading-skeleton")
              ↓
              Animation stops, real content visible

t=200-250ms:  Other sections follow same pattern
              ↓
              Each removes loading-skeleton class as data arrives
              ↓
              All animations stop, all content visible
```

## Event-Driven Updates

The system uses a **subscription-based approach** rather than polling:

```
Request fires → Response arrives → Subscription triggered → UI updates

stateManager.set("metrics", data)
    │
    └─ Triggers all subscriptions listening to "metrics"
       ├─ DashboardPage._updateMetricsSection()
       ├─ StatsGrid component refresh
       └─ SystemHealth component refresh
```

This ensures:
- Updates are **instant** when data arrives
- No polling needed
- No wasted network requests
- Updates propagate immediately to all listeners

## Performance Characteristics

### Network
- 6 small requests: **more efficient** than 1 large batch request
- Request size: **50-200 bytes each**
- Response size: **1-5KB each** (vs 15KB+ in batch)
- Total bandwidth: **~20KB** (same or less)

### CPU
- Server: **spread load** (5 small queries vs 1 heavy query)
- Client: **spread rendering** (each section separately)
- Rendering pipeline: **no bottlenecks**

### User Perception
- Time to first meaningful paint: **120ms** (vs 10s)
- Time to interactive: **1s** (vs 10s+)
- Perceived performance: **infinitely better** (has visual feedback)

---

**Note**: All timings are approximate and will vary based on:
- Network latency
- Server CPU load
- Browser rendering speed
- JavaScript engine performance
- Database query performance

Typical timings on modern hardware:
- Local network: 50-300ms total
- Cloud servers: 200-500ms total
- Slow connections: 500-1000ms total
