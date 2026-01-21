# Socket-First Component Architecture

## Problem: The Old Coupled Pattern

**What was wrong:**
```javascript
// ❌ OLD - God Controller Pattern
class DashboardPage extends Component {
  render() {
    return [
      // Charts received state from parent
      Component.h(ChartsSection, {
        history: this.history,           // ← Props
        chartStats: this.chartStats,
        onChartTypeChange: this.handleChartChange  // ← Callbacks
      }),
    ];
  }
}

// ❌ ChartsSection depended on parent
class ChartsSection extends Component {
  constructor(props) {
    this.history = props.history;      // ← From parent
    this.onChartTypeChange = props.onChartTypeChange;  // ← Parent callback
  }

  handleTabSwitch(type) {
    this.onChartTypeChange(type);  // ← Calls parent
  }
}
```

**Problems:**
- DashboardPage managed ALL state for ALL children
- ChartsSection couldn't work independently
- Props drilling = tight coupling
- Any parent state change = potential child re-render
- Child couldn't load data on its own

---

## Solution: Socket-First Independent Components

**Architecture:**
```
┌─────────────────────────────────────────┐
│         Socket.IO Broadcasts            │
│  metrics:history:updated                │
│  metrics:updated                        │
└────────┬─────────────┬─────────────┬────┘
         │             │             │
    ┌────▼────┐    ┌────▼────┐    ┌─▼─────┐
    │ Charts  │    │ Metrics │    │  GPU  │
    │ Section │    │ Section │    │Section│
    └─────────┘    └─────────┘    └───────┘
    ✓ Independent ✓ Independent ✓ Independent
    ✓ Self-subscribes
    ✓ Loads own data
    ✓ No props
    ✓ No callbacks
```

### ChartsSection - Pure Socket-First

```javascript
// ✓ NEW - Completely Independent
class ChartsSection extends Component {
  constructor(props) {
    super(props);
    // NO PROPS - Initialize with own data
    this.history = [];
    this.metrics = null;
    this.chartManager = null;
    this.unsubscribers = [];
  }

  render() {
    // Render ONLY structure, not data
    return Component.h("div", { className: "charts-section" }, [
      // Tab buttons for switching charts
      Component.h("div", { className: "charts-tabs" }, [...]),
      // Chart containers
      Component.h("div", { className: "charts-container" }, [...]),
      // Stats display
      Component.h("div", { className: "chart-stats" }, [...]),
    ]);
  }

  onMount() {
    // Step 1: Subscribe to socket broadcasts - PRIMARY DATA SOURCE
    this.unsubscribers = [
      socketClient.on("metrics:history:updated", (data) => {
        this.history = data.history || [];
        this._updateCharts();  // Update charts with new data
      }),
      socketClient.on("metrics:updated", (data) => {
        this.metrics = data.metrics || this.metrics;
        this._updateStats();
      }),
    ];

    // Step 2: Load initial data - ONE TIME ONLY
    this._loadInitialData();
  }

  async _loadInitialData() {
    // Load history via socket request
    const historyResponse = await socketClient.request(
      "metrics:history",
      { limit: 60 }
    );
    this.history = historyResponse.data || [];

    // Load metrics via socket request
    const metricsResponse = await socketClient.request("metrics:get", {});
    this.metrics = metricsResponse.data || null;

    // Initialize charts with data
    this._initCharts();
  }

  _updateCharts() {
    // Update charts with new history - NO parent involvement
    if (this.chartManager) {
      this.chartManager.updateCharts(this.history, this.chartType);
    }
  }

  destroy() {
    // Always cleanup - MANDATORY
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    if (this.chartManager) {
      this.chartManager.destroy?.();
    }
  }
}

// Export to window
window.ChartsSection = ChartsSection;
```

### Parent Usage - Just Instantiate

```javascript
// ✓ DashboardPage - Now just a layout
class DashboardPage extends Component {
  render() {
    return Component.h("div", { className: "dashboard" }, [
      // No props, no callbacks
      // Each component is completely independent
      Component.h(window.MetricsSection, {}),
      Component.h(window.ChartsSection, {}),
      Component.h(window.GPUSection, {}),
    ]);
  }
}
```

---

## Key Principles

### 1. No Props for Data

**❌ FORBIDDEN:**
```javascript
Component.h(ChartsSection, {
  history: this.history,  // ❌ Props
  metrics: this.metrics,  // ❌ Props
})
```

**✓ REQUIRED:**
```javascript
Component.h(ChartsSection, {})  // No props
```

### 2. Direct Socket Subscriptions

**❌ FORBIDDEN:**
```javascript
// Component waits for parent to give it data
this.history = props.history;

// Component calls parent callback
this.onTypeChange(type);
```

**✓ REQUIRED:**
```javascript
// Component subscribes to socket
socketClient.on("metrics:history:updated", (data) => {
  this.history = data.history;
  this._updateUI();
});

// Component handles its own events
this.on("click", "[data-tab]", (e, btn) => {
  this._switchTab(btn.dataset.tab);
});
```

### 3. Autonomous Lifecycle

**❌ FORBIDDEN:**
```javascript
// Parent manages child state
this.state.chartType = "cpu";
this.state.charts = [];

// Parent coordinates updates
_onSocketUpdate() {
  this.state.metrics = data;
  this.children.forEach(c => c.update(data));
}
```

**✓ REQUIRED:**
```javascript
// Each component manages itself
onMount() {
  // Self-subscribe
  this.unsubscribers = [
    socketClient.on("event", this._handleEvent.bind(this)),
  ];
}

destroy() {
  // Self-cleanup
  this.unsubscribers.forEach(unsub => unsub());
}
```

---

## Migration Checklist

For each component that needs refactoring:

### 1. Remove Props from Constructor
```javascript
// ❌ Before
constructor(props) {
  this.data = props.data;
  this.callback = props.callback;
}

// ✓ After
constructor(props) {
  this.data = [];
  this.unsubscribers = [];
}
```

### 2. Add Socket Subscriptions in onMount
```javascript
onMount() {
  this.unsubscribers = [
    socketClient.on("event:updated", (data) => {
      this.data = data.value;
      this._updateUI();
    }),
  ];

  // Load initial data
  this._loadInitialData();
}
```

### 3. Add Cleanup in destroy
```javascript
destroy() {
  this.unsubscribers.forEach(unsub => unsub());
  this.unsubscribers = [];
}
```

### 4. Handle Events Directly
```javascript
bindEvents() {
  // Handle events locally
  this.on("click", "[data-action]", (e, btn) => {
    const action = btn.dataset.action;
    this._handleAction(action);
  });
}

_handleAction(action) {
  // NO parent callbacks
  // Just do the action
  socketClient.request("action", { action });
}
```

### 5. Update Parent to Not Pass Props
```javascript
// ✓ Old way
Component.h(MyComponent, { data: this.data, callback: this.cb })

// ✓ New way
Component.h(MyComponent, {})
```

---

## Testing Socket-First Components

### 1. Components Can Instantiate with Empty Props
```javascript
const component = new ChartsSection({});
// Should NOT throw
```

### 2. Components Load Own Data
```javascript
// Should call socketClient.request in onMount
const component = new ChartsSection({});
component.onMount();
// Should have loaded data
```

### 3. Components Subscribe to Broadcasts
```javascript
// Should listen to socket events
const component = new ChartsSection({});
component.onMount();
// Broadcast event should trigger update
socketClient.emit("metrics:updated", { ... });
```

### 4. Components Cleanup Properly
```javascript
const component = new ChartsSection({});
component.onMount();
component.destroy();
// All subscriptions should be unsubscribed
```

---

## Benefits

### ✓ Decoupled Architecture
- Components don't depend on parent
- Easy to move components between pages
- Easy to test independently
- Easy to add/remove components

### ✓ Autonomous Components
- Each component controls its own lifecycle
- Each component manages its own subscriptions
- No parent state management needed
- No prop drilling

### ✓ Real-Time Updates
- All data flows via socket broadcasts
- No polling, no timers
- Automatic synchronization across all components
- Components always have latest data

### ✓ No Memory Leaks
- Each component handles its own cleanup
- No global state holding references
- No forgotten subscriptions
- No circular dependencies

---

## Example: Full Socket-First Component

See `public/js/components/dashboard/charts-section.js` for a complete example:

- ✓ No props required
- ✓ Loads own data via socket
- ✓ Subscribes to broadcasts
- ✓ Handles events directly
- ✓ Updates DOM in-place
- ✓ Proper cleanup in destroy()

---

## Next Steps

### Components to Refactor
1. ✓ ChartsSection (DONE)
2. MetricsSection - remove parent state
3. SystemHealth - remove parent state
4. GPUSection - remove parent state
5. RouterCardSection - remove parent state

### Files to Update
- `public/js/pages/dashboard/page.js` - No props to children ✓
- `public/js/pages/dashboard/health-section.js` - No props to ChartsSection ✓
- All component files - Add socket subscriptions
- All parent files - Remove state passing

---

## Related Documentation

- [AGENTS.md](AGENTS.md) - Socket-First Golden Rules
- [SOCKET_CONTRACTS.md](SOCKET_CONTRACTS.md) - Socket API Reference
- [QUICK_START_SOCKET_FIRST.md](QUICK_START_SOCKET_FIRST.md) - Quick Start Guide
