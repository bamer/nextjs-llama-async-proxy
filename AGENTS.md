# AGENTS.md - Agent Guidelines for this Repository

This document provides guidelines for agentic coding assistants working in this **Vanilla JavaScript** Llama Proxy Dashboard application.
**Critical**: never DELETE this file for whatever reason.

## Application Overview

- **Backend**: Node.js + Express + Socket.IO (server.js)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Database**: SQLite with better-sqlite3
- **Real-time**: Socket.IO for live updates
- **Architecture**: Component-based with custom router and state manager

## Build / Run Commands

```bash
# Start development server
npm start                    # Start server with node
npm run dev                  # Start with file watching

# Database operations
npm run db:export            # Export database backup
npm run db:reset             # Reset database

# Testing
npm test                     # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate coverage report

# Linting
npm run lint                 # Run ESLint
npm run lint:fix             # Auto-fix lint issues
```

## Code Style Guidelines

### General Formatting

- Use double quotes only (`"not 'single quotes'"`)
- Always use semicolons
- 2-space indentation
- Trailing commas in multi-line objects/arrays
- Max line width: 100 characters
- Object-curly-spacing: `always` (spaces inside {})
- Array-bracket-spacing: `never` (no spaces inside [])

### Imports & Loading Order

Load scripts in this order (as defined in index.html):
1. Core Framework: component.js, router.js, state.js
2. Services: socket.js
3. Pages: dashboard.js, models.js, monitoring.js, configuration.js, settings.js, logs.js
4. Components: layout/layout.js
5. Main App: app.js

### Naming Conventions

- **Classes/Components**: PascalCase (`DashboardController`, `ModelsPage`)
- **Functions/Variables**: camelCase (`getModels`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`, `API_BASE_URL`)
- **Private class members**: underscore prefix (`_privateMethod`)
- **File names**: match export names (e.g., `layout.js` exports `Layout`)

### Component Class Pattern

All UI components should extend the `Component` base class:

```javascript
class MyComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { /* ... */ };
  }

  /**
   * Lifecycle: Called before mounting
   */
  willMount() {
    // Setup before render
  }

  /**
   * Lifecycle: Render the component
   * Must return HTML string or HTMLElement
   */
  render() {
    return Component.h('div', { className: 'my-component' },
      Component.h('h1', {}, 'Title')
    );
  }

  /**
   * Lifecycle: Called after mounting to DOM
   */
  didMount() {
    // Setup subscriptions, event listeners
  }

  /**
   * Event map - maps DOM events to handlers
   */
  getEventMap() {
    return {
      'click [data-action]': 'handleAction',
      'change [data-field]': 'handleFieldChange'
    };
  }

  handleAction(event) {
    // Handle click on elements with data-action attribute
  }

  handleFieldChange(event) {
    // Handle input changes
  }
}
```

### Using Component.createElement (h)

```javascript
// Create element with tag name
Component.h('div', { className: 'container' }, 'Content');

// With children
Component.h('ul', {},
  Component.h('li', {}, 'Item 1'),
  Component.h('li', {}, 'Item 2')
);

// With attributes and event handlers
Component.h('button', {
  className: 'btn btn-primary',
  'data-id': '123',
  onClick: () => console.log('clicked')
}, 'Click Me');

// With nested components
Component.h(ModelsTable, {
  models: this.state.models,
  onSelect: this.handleSelect.bind(this)
});
```

### Router Patterns

Routes are registered in app.js:

```javascript
router.register('/', () => new DashboardController({}));
router.register('/models', () => new ModelsController({}));
router.register('/monitoring', () => new MonitoringController({}));

// Navigate programmatically
window.router.navigate('/models');

// Get current route info
const path = window.router.getPath();
const params = window.router.getParams();
const query = window.router.getQuery();
```

### State Management

Use the global `stateManager` for shared state:

```javascript
// Subscribe to state changes
stateManager.subscribe('models', (models) => {
  console.log('Models changed:', models);
});

// Update state
stateManager.set('currentModel', model);

// Get state
const models = stateManager.get('models');
const allState = stateManager.getState();

// Make API requests
const data = await stateManager.getModels();
await stateManager.startModel(modelId);
await stateManager.updateConfig(config);
```

### Socket.IO Patterns

The socket client is auto-initialized in app.js:

```javascript
// Connection status
socketClient.isConnected; // true/false

// Listen for events
socketClient.on('models:list', (data) => {
  // Handle broadcast
});

// Send requests (use stateManager.request for better API)
stateManager.request('models:start', { modelId: '123' });
```

### Error Handling

- Wrap async calls in try-catch blocks
- Use `showNotification(message, type)` for user feedback
- Log errors with `console.error()`
- Types: 'info', 'success', 'warning', 'error'

```javascript
try {
  await stateManager.startModel(modelId);
  showNotification('Model started successfully', 'success');
} catch (error) {
  console.error('[Models] Failed to start model:', error);
  showNotification('Failed to start model: ' + error.message, 'error');
}
```

### API Response Format

All Socket.IO responses follow this format:

```javascript
{
  success: boolean,
  data?: any,
  error?: {
    message: string,
    code?: string
  },
  timestamp: string
}
```

## File Organization

```
/home/bamer/nextjs-llama-async-proxy/
├── server.js                    # Main server entry
├── package.json                 # Dependencies & scripts
│
├── public/                      # Static files
│   ├── index.html              # SPA entry point
│   ├── css/
│   │   ├── main.css            # Core styles, variables, layout
│   │   └── components.css      # Component-specific styles
│   └── js/
│       ├── app.js              # Application initialization
│       ├── core/
│       │   ├── component.js    # Base Component class
│       │   ├── router.js       # History API router
│       │   └── state.js        # State manager
│       ├── services/
│       │   └── socket.js       # Socket.IO client
│       ├── pages/
│       │   ├── dashboard.js    # Dashboard page
│       │   ├── models.js       # Models management
│       │   ├── monitoring.js   # Monitoring page
│       │   ├── logs.js         # Logs viewer
│       │   ├── configuration.js # Configuration page
│       │   └── settings.js     # Settings page
│       ├── components/
│       │   └── layout/
│       │       └── layout.js   # Layout components
│       └── utils/              # Utility functions
│
├── data/                        # SQLite database
│   └── llama-dashboard.db
│
└── docs/                        # Documentation
    ├── README.md
    └── ARCHITECTURE.md
```

## Utility Functions

Available in `window.AppUtils`:

```javascript
// Format bytes to human readable
AppUtils.formatBytes(1024 * 1024);  // "1.00 MB"

// Format percentage
AppUtils.formatPercent(0.4567);     // "45.7%"

// Format timestamp
AppUtils.formatTimestamp(Date.now()); // "14:30:25"

// Format relative time
AppUtils.formatRelativeTime(Date.now() - 3600000); // "1h ago"

// Debounce function
const debounced = AppUtils.debounce(fn, 300);

// Throttle function
const throttled = AppUtils.throttle(fn, 1000);

// Generate unique ID
AppUtils.generateId();  // "1704112345_abc123def"

// Deep clone object
const copy = AppUtils.deepClone(obj);

// Check if object is empty
AppUtils.isEmpty({});  // true
```

## Controller Pattern

Pages use a Controller + Component pattern:

```javascript
class ModelsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubscribers = [];
    this.component = null;
  }

  init() {
    // Setup subscriptions
    this.unsubscribers.push(
      stateManager.subscribe('models', this.onModelsChange.bind(this))
    );
    this.loadModels();
  }

  async loadModels() {
    const data = await stateManager.getModels();
    stateManager.set('models', data.models || []);
  }

  onModelsChange(models) {
    if (this.component) {
      this.component.updateModelList(models);
    }
  }

  willUnmount() {
    // Cleanup subscriptions
    this.unsubscribers.forEach(unsub => unsub());
    if (this.component) {
      this.component.destroy();
    }
  }

  destroy() {
    this.willUnmount();
  }

  render() {
    this.component = new ModelsPage({
      models: stateManager.get('models') || []
    });
    this.init();
    return this.component.render();
  }

  didMount() {
    if (this.component && this.component.didMount) {
      this.component.didMount();
    }
  }
}
```

## Event-Driven Logging

The server logs events via Socket.IO broadcasts:

```javascript
// Server emits:
socket.emit('logs:entry', {
  type: 'broadcast',
  data: {
    entry: {
      level: 'info',
      message: 'Model started',
      source: 'models',
      timestamp: Date.now()
    }
  }
});
```

## Testing Patterns

### Jest Configuration

Tests use Jest with jsdom environment:

```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'public/js/**/*.js',
    '!public/js/**/*.test.js'
  ]
};
```

### Test Example

```javascript
// __tests__/core/component.test.js
describe('Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    container = null;
  });

  describe('render', () => {
    it('should create element with correct tag', () => {
      const comp = new TestComponent({});
      const el = comp.render();
      expect(el.tagName).toBe('DIV');
    });
  });
});

class TestComponent extends Component {
  render() {
    return Component.h('div', {}, 'Test');
  }
}
```

## CSS Class Naming

- Use lowercase with hyphens: `.my-component`, `.action-button`
- BEM-style for modifiers: `.card`, `.card--active`, `.card__header`
- Utility classes: `.text-center`, `.mt-2`, `.flex`
- State classes: `.is-loading`, `.has-error`, `.is-active`

## Console Logging

- `console.log()` - General logging (debug info)
- `console.warn()` - Warnings (non-critical issues)
- `console.error()` - Errors (action required)
- Prefix logs with component name: `[Dashboard]`, `[Models]`, `[Router]`

## Best Practices

1. **Keep files under 200 lines** - Split large files into smaller modules
2. **Single responsibility** - Each component/class should do one thing
3. **No memory leaks** - Always clean up subscriptions and event listeners
4. **Graceful degradation** - Handle missing data gracefully
5. **User feedback** - Show notifications for user actions
6. **Error boundaries** - Catch and display errors to users

## Common Patterns

### Conditional Rendering

```javascript
// Ternary for simple conditions
this.state.loading ? Component.h('div', {}, 'Loading...') : Component.h('div', {}, content)

// Logical AND for optional elements
condition && Component.h('div', {}, 'Optional')
```

### List Rendering

```javascript
models.map(model => Component.h(ModelTableRow, {
  key: model.id,
  model
}))
```

### Event Handling

```javascript
// In getEventMap
getEventMap() {
  return {
    'click [data-action]': 'handleClick',
    'change [data-field]': 'handleChange',
    'submit form': 'handleSubmit'
  };
}

handleClick(event) {
  const action = event.target.closest('[data-action]').dataset.action;
  switch (action) {
    case 'start':
      this.handleStart();
      break;
    case 'stop':
      this.handleStop();
      break;
  }
}
```

### Async/Await Pattern

```javascript
async loadData() {
  try {
    this.setState({ loading: true });
    const data = await stateManager.getData();
    this.setState({ data, loading: false });
  } catch (error) {
    console.error('[Page] Failed to load data:', error);
    this.setState({ error: error.message, loading: false });
  }
}
```

## Related Documentation

- [docs/README.md](docs/README.md) - User guide
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture

---

**Remember**: This is a Vanilla JavaScript project. Do not use React, TypeScript, or any bundlers unless explicitly requested.
