# Llama Async Proxy Dashboard

A modern, lightweight dashboard for managing Llama models built with Vanilla JavaScript, Node.js, and Socket.IO.

## Features

- **Real-time Monitoring**: Live system metrics with automatic updates
- **Model Management**: CRUD operations for Llama models with start/stop controls
- **System Monitoring**: CPU, memory, disk, and GPU metrics visualization
- **Configuration**: Server and model configuration management
- **Logging**: Real-time log viewer with filtering and export
- **Settings**: Application settings (appearance, logging, features)
- **Modern UI**: Clean, responsive interface with smooth animations
- **Offline Capable**: No external dependencies or CDN requirements

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

The server will be available at `http://localhost:3000`

## Project Structure

```
├── server.js              # Main server entry point
├── package.json           # Dependencies and scripts
├── data/                  # SQLite database storage
└── public/                # Static frontend files
    ├── index.html         # SPA entry point
    ├── css/
    │   ├── main.css      # Core styles and design tokens
    │   └── components.css # Component-specific styles
    └── js/
        ├── core/          # Core framework
        │   ├── component.js  # Base Component class
        │   ├── router.js     # History API router
        │   └── state.js      # Event-driven state manager
        ├── services/      # Frontend services
        │   └── socket.js   # Socket.IO client
        ├── pages/         # Page controllers
        │   ├── dashboard.js
        │   ├── models.js
        │   ├── monitoring.js
        │   ├── configuration.js
        │   ├── settings.js
        │   └── logs.js
        └── components/    # UI components
            └── layout/
                └── layout.js
```

## Architecture

```
Browser (Vanilla JS)
    ⇄ Socket.IO
        ↓
    Node.js Server
        ├── Express (HTTP static files)
        └── Socket.IO (WebSocket communication)
            ↓
        SQLite Database
```

### Key Design Principles

1. **Server-Owned State**: Server is the single source of truth for all data
2. **Socket.IO Only**: No REST APIs - all communication via WebSocket
3. **Event-Driven**: Components subscribe to state changes, not polling
4. **Request/Response Pattern**: Client emits intents, server emits state
5. **Real-time Broadcasts**: Server pushes updates to all connected clients

## Pages

### Dashboard (`/` or `/dashboard`)

Overview of system status with:

- Server status indicator
- CPU, Memory, Disk, GPU metrics cards
- Models summary (running/loading/idle counts)
- Performance chart placeholder
- Quick actions bar

### Models (`/models`)

Model management interface with:

- Model list with search and filtering
- Start/Stop/Delete actions
- Model details panel
- Import models functionality

### Monitoring (`/monitoring`)

Real-time system monitoring with:

- Metric cards with live updates
- Performance charts
- System health summary
- Time range selection

### Configuration (`/configuration`)

Server and model configuration:

- General settings (auto-start)
- Server settings (path, host, port)
- Model defaults (context size, batch size, threads)
- Advanced settings

### Settings (`/settings`)

Application settings:

- Appearance (theme, compact mode)
- Logging (log level, max entries)
- Features (auto-refresh, notifications)
- System info and actions

### Logs (`/logs`)

Real-time log viewer with:

- Log entries with timestamps
- Level filtering (info, warn, error, debug)
- Search functionality
- Export to JSON
- Auto-scroll toggle

## Socket.IO API

All communication happens via Socket.IO at `/llamaproxws`.

### Message Envelopes

**Request:**

```javascript
{
  type: 'request',
  event: 'models:list',
  data: { /* payload */ },
  requestId: 'req_123456_abc',
  timestamp: 1704467890123,
  version: '1.0'
}
```

**Response:**

```javascript
{
  type: 'response',
  event: 'models:list',
  success: true,
  data: { models: [...] },
  error: null,
  requestId: 'req_123456_abc',
  timestamp: 1704467890456
}
```

**Broadcast:**

```javascript
{
  type: 'broadcast',
  event: 'models:status',
  data: { modelId, status, ... },
  timestamp: 1704467890678
}
```

### Events Reference

#### Models

| Event                | Direction       | Description      |
| -------------------- | --------------- | ---------------- |
| `models:list`        | Client → Server | List all models  |
| `models:list:result` | Server → Client | List response    |
| `models:get`         | Client → Server | Get single model |
| `models:create`      | Client → Server | Create model     |
| `models:update`      | Client → Server | Update model     |
| `models:delete`      | Client → Server | Delete model     |
| `models:start`       | Client → Server | Start model      |
| `models:stop`        | Client → Server | Stop model       |
| `models:status`      | Server → Client | Status broadcast |
| `models:created`     | Server → Client | Model created    |
| `models:updated`     | Server → Client | Model updated    |
| `models:deleted`     | Server → Client | Model deleted    |

#### Metrics

| Event             | Direction       | Description                      |
| ----------------- | --------------- | -------------------------------- |
| `metrics:get`     | Client → Server | Get current metrics              |
| `metrics:history` | Client → Server | Get metrics history              |
| `metrics:update`  | Server → Client | Metrics broadcast (10s interval) |

#### Logs

| Event        | Direction       | Description         |
| ------------ | --------------- | ------------------- |
| `logs:get`   | Client → Server | Get logs            |
| `logs:clear` | Client → Server | Clear logs          |
| `logs:entry` | Server → Client | Log entry broadcast |

#### Configuration

| Event           | Direction       | Description   |
| --------------- | --------------- | ------------- |
| `config:get`    | Client → Server | Get config    |
| `config:update` | Client → Server | Update config |

#### Settings

| Event             | Direction       | Description     |
| ----------------- | --------------- | --------------- |
| `settings:get`    | Client → Server | Get settings    |
| `settings:update` | Client → Server | Update settings |

#### Llama Server

| Event          | Direction       | Description        |
| -------------- | --------------- | ------------------ |
| `llama:status` | Client → Server | Get Llama status   |
| `llama:start`  | Client → Server | Start Llama server |
| `llama:stop`   | Client → Server | Stop Llama server  |
| `llama:rescan` | Client → Server | Rescan models      |

#### System

| Event           | Direction       | Description     |
| --------------- | --------------- | --------------- |
| `system:info`   | Client → Server | Get system info |
| `system:health` | Client → Server | Health check    |

## Database Schema

### Models Table

```sql
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'llama',
  status TEXT DEFAULT 'idle',
  parameters TEXT DEFAULT '{}',
  model_path TEXT,
  model_url TEXT,
  ctx_size INTEGER DEFAULT 2048,
  batch_size INTEGER DEFAULT 512,
  threads INTEGER DEFAULT 4,
  created_at INTEGER,
  updated_at INTEGER
);
```

### Metrics Table

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cpu_usage REAL,
  memory_usage REAL,
  disk_usage REAL,
  gpu_usage REAL,
  gpu_temperature REAL,
  gpu_memory_used REAL,
  gpu_memory_total REAL,
  gpu_power_usage REAL,
  active_models INTEGER,
  uptime REAL,
  requests_per_minute INTEGER,
  timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### Logs Table

```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  context TEXT,
  timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This enables file watching and auto-restart on changes.

### Adding New Pages

1. Create a new controller file in `public/js/pages/`:

```javascript
class NewPageController {
  constructor(options) {
    this.router = options.router || window.router;
  }

  init() {
    // Subscribe to state changes
  }

  render() {
    return Component.h("div", { className: "new-page" }, Component.h("h1", {}, "New Page"));
  }

  destroy() {
    // Cleanup
  }
}

window.NewPageController = NewPageController;
```

2. Register the route in `public/js/app.js`:

```javascript
router.register("/new-page", () => new NewPageController({}));
```

3. Add to navigation in `public/js/components/layout/layout.js`:

```javascript
Component.h('a', {
  href: '/new-page',
  className: 'nav-link',
  'data-page': 'new-page'
}, '📄 New Page'),
```

### Adding New Socket.IO Events

Add handlers in `server.js`:

```javascript
socket.on('domain:action', async (request) => {
  const requestId = request?.requestId || generateRequestId();
  try {
    // Process request
    socket.emit('domain:action:result', {
      type: 'response',
      event: 'domain:action',
      success: true,
      data: { result: ... },
      error: null,
      requestId,
      timestamp: Date.now()
    });
  } catch (error) {
    socket.emit('domain:action:result', {
      type: 'response',
      event: 'domain:action',
      success: false,
      data: null,
      error: { code: 'ACTION_FAILED', message: error.message },
      requestId,
      timestamp: Date.now()
    });
  }
});
```

## Deployment

### Production Build

The application has no build step - it's pure JavaScript.

### Environment Variables

| Variable   | Default     | Description      |
| ---------- | ----------- | ---------------- |
| `PORT`     | 3000        | Server port      |
| `NODE_ENV` | development | Environment mode |

### Running Behind a Proxy

Configure your reverse proxy to:

1. Serve static files from `/public`
2. Proxy WebSocket connections to `/llamaproxws`

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name localhost;

    # Static files
    location / {
        root /path/to/public;
        try_files $uri $uri/ /index.html;
    }

    # WebSocket
    location /llamaproxws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # API
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY server.js ./
COPY public ./public
COPY data ./data

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t llama-proxy .
docker run -p 3000:3000 -v data:/app/data llama-proxy
```

## Performance

- **Metrics Collection**: Every 10 seconds
- **Max Log Queue**: 500 entries
- **Connection Recovery**: Enabled (2 minute window)
- **WebSocket Ping**: 25s interval, 60s timeout
- **Max Message Size**: 100MB

## License

MIT
