# StateManager Complete Removal

## Summary

StateManager has been completely removed from the application. All components now use **pure socket-first architecture** with direct `socketClient.request()` and `socketClient.on()` calls. No caching layer.

## Changes Made

### 1. Removed Files
- `/public/js/core/state.js` - StateManager class definition removed

### 2. Updated index.html
- Removed script tag loading `/js/core/state.js`

### 3. Updated App Loader
- Removed `stateManager.set("connectionStatus")` initialization
- Components now initialize directly with socket calls

### 4. Page-by-Page Updates

#### Settings Page (`settings-page.js`)
- **Before**: Loaded config from stateManager cache, used stateManager.subscribe()
- **After**: Direct socket calls in `onMount()`
  - `socketClient.request("config:get", {})` loads initial config
  - Subscribes directly to socket broadcasts: `socketClient.on("config:updated", ...)`
  - No stateManager involved anywhere

#### Settings Controller (`settings-controller.js`)
- Simplified to pure socket-first
- No stateManager initialization
- Calls to `handleExport()` and `handleImport()` work directly with component properties
- Config saved via `socketClient.request("config:update", ...)`

#### Models Page (`models.js`)
- **Before**: Used stateManager.set/get for models and routerStatus caching
- **After**: Direct socket calls
  - Loads models in controller via `socketClient.request("models:list", {})`
  - Listens to broadcasts: `socketClient.on("models:updated", ...)` and `socketClient.on("router:status", ...)`
  - All state stored in component local variables

#### Logs Page (`logs.js`)
- **Before**: Used stateManager.set/get for logs caching
- **After**: Direct socket calls
  - Loads logs via `socketClient.request("logs:get", { limit: 100 })`
  - Listens to broadcasts: `socketClient.on("logs:updated", ...)` and `socketClient.on("logs:cleared", ...)`

#### Dashboard Controller (`dashboard-controller.js`)
- **Before**: Used stateManager for caching all dashboard data
- **After**: Returns loaded data from `_loadDataAsync()` which passes to component as props
  - All data loaded in `render()` method before component creation
  - No caching, fresh data on every page load
  - Component receives all data as constructor props

### 5. Architecture Pattern

All pages now follow this socket-first pattern:

```javascript
class MyPage extends Component {
  constructor(props) {
    super(props);
    // Store data as local instance variables
    this.models = props.models || [];
    this.unsubscribers = [];
  }

  onMount() {
    // Listen to socket broadcasts for real-time updates
    this.unsubscribers.push(
      socketClient.on("models:updated", (data) => {
        this.models = data.models || [];
        this._updateUI();
      })
    );
  }

  destroy() {
    // Clean up all subscriptions
    this.unsubscribers?.forEach((unsub) => unsub());
  }
}

class MyController {
  async render() {
    // Load initial data via socket
    const response = await socketClient.request("models:list", {});
    const models = response.success ? response.data : [];

    // Pass data to component as props
    const comp = new MyPage({ models });
    // ... mount component
  }
}
```

## Benefits

1. **No Cache Confusion** - Single source of truth: server state
2. **Simpler Code** - No subscribe/unsubscribe to state changes
3. **Real-time Updates** - Always get fresh data from broadcasts
4. **No Sync Issues** - No stale cache vs server state conflicts
5. **Easier Testing** - No mock stateManager needed
6. **Less Memory** - No unnecessary caching layer

## Socket Contracts

All APIs remain the same. The change is purely in how data is loaded and stored:

| API | Usage |
|-----|-------|
| `config:get` | Load config (settings page) |
| `config:update` | Save config |
| `models:list` | Load all models |
| `models:load` | Load specific model |
| `models:unload` | Unload model |
| `models:scan` | Scan disk for models |
| `logs:get` | Load logs |
| `logs:clear` | Clear logs |
| `metrics:get` | Get current metrics |
| `metrics:history` | Get historical metrics |

## Testing

The application should still work exactly the same from user perspective:
- Settings page loads values on page load ✓
- Pages receive real-time broadcast updates ✓
- All forms save correctly ✓
- No console errors ✓

## Future Development

New pages should follow this pattern:
1. Load initial data in controller's `render()` method
2. Pass data to component as props
3. Listen to relevant socket broadcasts in `onMount()`
4. Never use stateManager

