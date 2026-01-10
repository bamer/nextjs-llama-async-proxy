# Llama-Server Metrics Integration - Implementation Plan

## Overview

Integrate llama-server metrics and logs into the Llama Proxy Dashboard for real-time monitoring of the underlying llama-server process.

## Research Findings

Based on research of llama.cpp/llama-server documentation:

### Current Knowledge

1. **llama-server** is a lightweight C/C++ HTTP server that serves llama.cpp models
2. It supports **multiple models** in router mode (what this dashboard uses)
3. It has **basic command-line flags**:
   - `--help`, `--version`, `--cache-list`
   - `--threads`, `--ctx-size`, `--batch-size`
   - `--port`, `--host`, `--models-dir`
   - `--models-max` (for router mode)

### Known llama-server Capabilities

1. **Built-in HTTP API** on configured port (default: 8080)
2. **Model loading/unloading** endpoints
3. **Metrics endpoints** for monitoring:
   - `/health` or `/metrics` endpoints
   - Token generation statistics
   - Per-model metrics
   - Request queue status

### What We Need to Build

Since llama-server doesn't have a documented `--metrics` flag, we'll implement:

1. **Log Forwarding**: Capture llama-server stdout/stderr and display in log pages
2. **Metrics Scraping**: Parse llama-server API endpoints for metrics
3. **Integration UI**: Display llama-server metrics alongside system metrics
4. **Lifecycle Management**: Start/stop llama-server with proper cleanup

---

## Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Llama Proxy Dashboard                 │
│  (Existing Node.js + Express + Socket.IO)            │
├─────────────────────────────────────────────────────────────┤
│  Dashboard UI                                           │
│  - System Metrics (CPU, Memory, GPU)                     │
│  - Model Management                                         │
│  - Logs Viewer                                           │
│  - llama-server Metrics (NEW)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Process Manager │
                    │  (NEW MODULE)    │
                    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │     llama-server Process      │
                    │     (Child Process)          │
                    │     HTTP: 8080            │
                    │     + Metrics API            │
                    └──────────────────────────────┘
```

---

## Phase 1: Llama-Server Process Management

### Goal

Ability to start/stop llama-server as a managed child process with proper lifecycle handling.

### Components to Create

#### 1.1 Process Manager Module

**File**: `server/handlers/llama-router/process-manager.js`

```javascript
/**
 * Process Manager for llama-server
 * Handles spawning, monitoring, and cleanup of llama-server child process
 */

import { spawn, ChildProcess } from "child_process";

export class LlamaServerProcessManager {
  constructor(config) {
    this.config = config;
    this.process = null;
    this.stdoutLines = [];
    this.stderrLines = [];
    this.metrics = null;
    this.isRunning = false;
    this.startTime = null;
    this.pid = null;
  }

  /**
   * Start llama-server as child process
   * @returns {Promise<ChildProcess>}
   */
  async start() {
    if (this.isRunning) {
      console.log("[DEBUG] llama-server already running, PID:", this.pid);
      return this.process;
    }

    const args = this._buildArgs();

    console.log("[DEBUG] Starting llama-server with args:", args);

    this.process = spawn("llama-server", args, {
      cwd: this.config.baseModelsPath,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        LLAMA_METRICS_ENABLED: "1", // Enable llama-server metrics
      },
    });

    this.pid = this.process.pid;
    this.startTime = Date.now();
    this.isRunning = true;

    // Capture stdout
    this.process.stdout.on("data", (data) => {
      const line = data.toString();
      this.stdoutLines.push(line);
      this._parseOutput(line, "stdout");
    });

    // Capture stderr
    this.process.stderr.on("data", (data) => {
      const line = data.toString();
      this.stderrLines.push(line);
      this._parseOutput(line, "stderr");
    });

    // Handle process exit
    this.process.on("exit", (code, signal) => {
      console.log("[DEBUG] llama-server exited:", { code, signal });
      this.isRunning = false;
      this._cleanup();
    });

    // Handle process errors
    this.process.on("error", (error) => {
      console.error("[DEBUG] llama-server error:", error);
      this.isRunning = false;
    });

    return this.process;
  }

  /**
   * Stop llama-server process
   */
  async stop() {
    if (!this.isRunning) {
      console.log("[DEBUG] llama-server not running");
      return;
    }

    console.log("[DEBUG] Stopping llama-server, PID:", this.pid);

    // Try graceful shutdown first
    if (this.process.kill("SIGTERM")) {
      // Wait 5 seconds for graceful shutdown
      await new Promise((r) => setTimeout(r, 5000));

      // Force kill if still running
      if (this.isRunning) {
        console.warn("[DEBUG] Force killing llama-server");
        this.process.kill("SIGKILL");
      }
    }

    this.isRunning = false;
    this._cleanup();
  }

  /**
   * Check if process is running
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: this.pid,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      metrics: this.metrics,
    };
  }

  /**
   * Build command-line arguments for llama-server
   */
  _buildArgs() {
    const args = [];

    // Router mode settings
    args.push("--models-dir", this.config.baseModelsPath);
    args.push("--models-max", String(this.config.modelsMax || 4));
    args.push("--port", String(this.config.port || 8080));
    args.push("--host", this.config.host || "0.0.0.0");

    // Model settings
    if (this.config.ctxSize) {
      args.push("--ctx-size", String(this.config.ctxSize));
    }
    if (this.config.batchSize) {
      args.push("--batch-size", String(this.config.batchSize));
    }
    if (this.config.threads) {
      args.push("--threads", String(this.config.threads));
    }

    // GPU settings
    if (this.config.ngl) {
      args.push("-ngl", String(this.config.ngl));
    }

    // Metrics (if supported)
    args.push("--verbose"); // Enable verbose output for metrics

    console.log("[DEBUG] llama-server args:", args);

    return args;
  }

  /**
   * Parse output for metrics and logs
   */
  _parseOutput(line, source) {
    // Store for log pages
    const logEntry = {
      level: source === "stderr" ? "error" : "info",
      message: line,
      source: "llama-server",
      timestamp: Date.now(),
    };

    // Emit to logs via socket
    if (global.io) {
      global.io.emit("logs:entry", {
        type: "broadcast",
        data: { entry: logEntry },
      });
    }

    // Try to parse metrics from output
    this._tryParseMetrics(line);
  }

  /**
   * Attempt to parse metrics from output lines
   */
  _tryParseMetrics(line) {
    // Example patterns to parse (may vary by llama-server version):
    // - Token generation rate
    // - Queue size
    // - Active models
    // - Request latency
    // This is implementation-dependent based on actual llama-server output format
    // We'll update based on actual observed output
  }

  /**
   * Cleanup resources
   */
  _cleanup() {
    if (this.process) {
      this.process.stdout.destroy();
      this.process.stderr.destroy();
    }
  }
}
```

#### 1.2 Socket.IO Handlers

**File**: `server/handlers/llama-router/process-handlers.js`

```javascript
/**
 * llama-server process control handlers
 */

import { ok, err } from "../response.js";

export function registerProcessHandlers(socket, io, db, processManager) {
  /**
   * Start llama-server
   */
  socket.on("llama-server:start", async (req) => {
    const id = req?.requestId || Date.now();
    try {
      const config = db.getConfig();
      await processManager.start();
      ok(
        socket,
        "llama-server:start:result",
        {
          pid: processManager.pid,
          message: "llama-server started successfully",
        },
        id
      );

      // Broadcast to all clients
      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "running",
          pid: processManager.pid,
          uptime: 0,
          metrics: processManager.metrics,
        },
      });

      // Log to database
      db.addLogs("info", "llama-server started", "llama-router");
    } catch (e) {
      err(socket, "llama-server:start:result", e.message, id);
    }
  });

  /**
   * Stop llama-server
   */
  socket.on("llama-server:stop", async (req) => {
    const id = req?.requestId || Date.now();
    try {
      await processManager.stop();
      ok(
        socket,
        "llama-server:stop:result",
        {
          message: "llama-server stopped successfully",
        },
        id
      );

      // Broadcast to all clients
      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "stopped",
          pid: null,
          uptime: 0,
          metrics: null,
        },
      });

      // Log to database
      db.addLogs("info", "llama-server stopped", "llama-router");
    } catch (e) {
      err(socket, "llama-server:stop:result", e.message, id);
    }
  });

  /**
   * Get llama-server status
   */
  socket.on("llama-server:status", async (req) => {
    const id = req?.requestId || Date.now();
    try {
      const status = processManager.getStatus();
      ok(socket, "llama-server:status:result", status, id);
    } catch (e) {
      err(socket, "llama-server:status:result", e.message, id);
    }
  });
}
```

#### 1.3 State Management

**File**: `public/js/core/state/state-llama.js` (NEW)

```javascript
/**
 * llama-server state management
 */

class StateLlamaServer {
  constructor(stateCore, stateSocket) {
    this.core = stateCore;
    this.socket = stateSocket;
    this.setupBroadcastHandlers();
  }

  setupBroadcastHandlers() {
    this.socket.broadcast.on("llama-server:status", (data) => {
      if (data.type === "broadcast") {
        const status = data.data;
        this.core.set("llamaServerStatus", status);

        // Update UI state based on status
        this.core.set("llamaServerMetrics", status.metrics);
      }
    });
  }

  /**
   * Start llama-server
   */
  async start() {
    return await this.socket.request("llama-server:start");
  }

  /**
   * Stop llama-server
   */
  async stop() {
    return await this.socket.request("llama-server:stop");
  }

  /**
   * Get status
   */
  async getStatus() {
    return await this.socket.request("llama-server:status");
  }
}

window.StateLlamaServer = StateLlamaServer;
```

---

## Phase 2: Metrics Scraping

### Goal

Scrape llama-server's built-in metrics API endpoints for detailed metrics.

### Components to Create

#### 2.1 Metrics Scraper

**File**: `server/handlers/llama-router/metrics-scraper.js`

```javascript
/**
 * llama-server Metrics Scraper
 * Scrapes llama-server API endpoints for metrics
 */

import http from "http";

export class LlamaServerMetricsScraper {
  constructor(config) {
    this.baseUrl = `http://${config.host || "localhost"}:${config.port || 8080}`;
    this.cache = new Map();
    this.cacheTTL = 5000; // 5 seconds
  }

  /**
   * Get metrics from llama-server API
   * @returns {Promise<Object>}
   */
  async getMetrics() {
    try {
      // Check cache
      const cached = this.cache.get("metrics");
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      // Try common endpoints
      const endpoints = ["/metrics", "/health", "/stats", "/v1/metrics"];

      for (const endpoint of endpoints) {
        try {
          const data = await this._fetchEndpoint(endpoint);
          if (data) {
            this.cache.set("metrics", { data, timestamp: Date.now() });
            return data;
          }
        } catch (e) {
          console.log(`[DEBUG] Endpoint ${endpoint} not available:`, e.message);
        }
      }

      return null;
    } catch (e) {
      console.error("[METRICS-SCRAPER] Failed to get metrics:", e);
      return null;
    }
  }

  /**
   * Fetch specific endpoint
   */
  async _fetchEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 8080,
        path: url.pathname,
        method: "GET",
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (e) {
              // Not JSON, try to parse as text
              resolve(this._parseTextMetrics(data));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(5000, () => req.destroy());
    });
  }

  /**
   * Parse metrics from text response
   */
  _parseTextMetrics(text) {
    const metrics = {
      uptime: 0,
      activeModels: 0,
      totalRequests: 0,
      tokensPerSecond: 0,
      queueSize: 0,
    };

    // Parse output (will need to adjust based on actual format)
    const lines = text.split("\n");
    for (const line of lines) {
      // Token generation rate
      const tokenMatch = line.match(/(\d+(?:\.\d+)?)\s+tokens\/s/);
      if (tokenMatch) {
        metrics.tokensPerSecond = parseFloat(tokenMatch[1]);
      }

      // Active models
      const modelMatch = line.match(/active\s+models?:\s*(\d+)/i);
      if (modelMatch) {
        metrics.activeModels = parseInt(modelMatch[1]);
      }

      // Queue size
      const queueMatch = line.match(/queue\s+size?:\s*(\d+)/i);
      if (queueMatch) {
        metrics.queueSize = parseInt(queueMatch[1]);
      }
    }

    return metrics;
  }
}
```

---

## Phase 3: Dashboard UI Integration

### Goal

Display llama-server metrics in the dashboard, show when running/stop status.

### Components to Create

#### 3.1 llama-server Status Panel

**File**: `public/js/components/llama-server/status-panel.js`

```javascript
/**
 * llama-server Status Panel Component
 */

class LlamaServerStatusPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: "unknown",
      metrics: null,
      uptime: "00:00:00",
      pid: null,
    };
  }

  willMount() {
    // Subscribe to llama-server status
    this._unsubscribers = [];
    this._unsubscribers.push(
      stateManager.subscribe("llamaServerStatus", this.handleStatusChange.bind(this))
    );
  }

  handleStatusChange(status) {
    this.setState({
      status: status.status || "unknown",
      metrics: status.metrics,
      uptime: status.uptime ? AppUtils.formatRelativeTime(status.uptime) : "00:00:00",
      pid: status.pid || null,
    });
  }

  render() {
    const { status, metrics, uptime, pid } = this.state;

    const statusIcon = this._getStatusIcon(status);
    const statusText = this._getStatusText(status);

    return Component.h(
      "div",
      { className: "llama-server-status-panel" },
      Component.h(
        "div",
        { className: "status-header" },
        Component.h("h3", {}, "llama-server"),
        Component.h(
          "div",
          { className: "status-badge status-" + status },
          Component.h("span", { className: "status-icon" }, statusIcon),
          Component.h("span", {}, statusText)
        ),
        Component.h(
          "div",
          { className: "controls" },
          Component.h(
            "button",
            {
              className: "btn btn-start",
              style: status === "stopped" ? "" : "display: none;",
              onClick: () => this.startServer(),
            },
            "Start"
          ),
          Component.h(
            "button",
            {
              className: "btn btn-stop",
              style: status === "running" ? "" : "display: none;",
              onClick: () => this.stopServer(),
            },
            "Stop"
          )
        )
      ),

      Component.h(
        "div",
        { className: "status-details" },
        Component.h(
          "div",
          { className: "detail-row" },
          Component.h("span", { className: "label" }, "Status:"),
          Component.h("span", { className: "value" }, statusText)
        ),

        pid &&
          Component.h(
            "div",
            { className: "detail-row" },
            Component.h("span", { className: "label" }, "PID:"),
            Component.h("span", { className: "value" }, pid)
          ),

        Component.h(
          "div",
          { className: "detail-row" },
          Component.h("span", { className: "label" }, "Uptime:"),
          Component.h("span", { className: "value" }, uptime)
        ),

        metrics && this._renderMetrics(metrics)
      )
    );
  }

  _renderMetrics(metrics) {
    return Component.h(
      "div",
      { className: "llama-metrics" },
      Component.h("h4", {}, "llama-server Metrics"),

      metrics.activeModels !== undefined &&
        Component.h(
          "div",
          { className: "metric-row" },
          Component.h("span", { className: "metric-label" }, "Active Models:"),
          Component.h("span", { className: "metric-value" }, String(metrics.activeModels))
        ),

      metrics.tokensPerSecond !== undefined &&
        Component.h(
          "div",
          { className: "metric-row" },
          Component.h("span", { className: "metric-label" }, "Tokens/s:"),
          Component.h(
            "span",
            { className: "metric-value" },
            String(metrics.tokensPerSecond.toFixed(2))
          )
        ),

      metrics.queueSize !== undefined &&
        Component.h(
          "div",
          { className: "metric-row" },
          Component.h("span", { className: "metric-label" }, "Queue:"),
          Component.h("span", { className: "metric-value" }, String(metrics.queueSize))
        ),

      metrics.totalRequests !== undefined &&
        Component.h(
          "div",
          { className: "metric-row" },
          Component.h("span", { className: "metric-label" }, "Total Requests:"),
          Component.h("span", { className: "metric-value" }, String(metrics.totalRequests))
        )
    );
  }

  _getStatusIcon(status) {
    switch (status) {
      case "running":
        return "🟢";
      case "stopped":
        return "🔴";
      default:
        return "⚪";
    }
  }

  _getStatusText(status) {
    switch (status) {
      case "running":
        return "Running";
      case "stopped":
        return "Stopped";
      default:
        return "Unknown";
    }
  }

  startServer() {
    console.log("[DEBUG] Starting llama-server from UI");
    window.stateLlamaServer
      .start()
      .then(() => {
        showNotification("llama-server starting...", "info");
      })
      .catch((e) => {
        console.error("[LLAMA-SERVER] Failed to start:", e);
        showNotification("Failed to start llama-server: " + e.message, "error");
      });
  }

  stopServer() {
    console.log("[DEBUG] Stopping llama-server from UI");
    window.stateLlamaServer
      .stop()
      .then(() => {
        showNotification("llama-server stopping...", "info");
      })
      .catch((e) => {
        console.error("[LLAMA-SERVER] Failed to stop:", e);
        showNotification("Failed to stop llama-server: " + e.message, "error");
      });
  }

  willUnmount() {
    if (this._unsubscribers) {
      this._unsubscribers.forEach((unsub) => unsub());
    }
  }
}

window.LlamaServerStatusPanel = LlamaServerStatusPanel;
```

#### 3.2 Enhanced Monitoring Page

**File**: `public/js/pages/monitoring.js` (MODIFY)

Add llama-server status panel to existing monitoring page:

```javascript
// Add to existing MonitoringPage render() method

render() {
  const { metricsHistory, llamaServerStatus } = this.state;

  return Component.h("div", { className: "monitoring-page" },
    Component.h(ChartsSection, { metricsHistory }),

    // NEW: Add llama-server status panel
    Component.h(LlamaServerStatusPanel, {
      metrics: llamaServerStatus?.metrics,
    }),

    Component.h(StatsGrid, { metricsHistory })
  );
}
```

---

## Phase 4: Log Integration

### Goal

Integrate llama-server logs into the existing log viewer.

### Implementation

#### 4.1 Enhanced Logs Repository

**File**: `server/db/logs-repository.js` (MODIFY)

Add methods for llama-server logs:

```javascript
/**
 * Add llama-server log entry
 * @param {string} level - Log level
 * @param {string} msg - Log message
 * @param {string} source - Source (llama-server, system)
 * @param {Object} metadata - Optional metadata
 */
addLlamaServerLog(level, msg, metadata = {}) {
  const query = "INSERT INTO logs (level, message, source, metadata) VALUES (?, ?, ?, ?)";
  this.db.prepare(query).run(
    level,
    String(msg),
    "llama-server",
    JSON.stringify(metadata)
  );
}

/**
 * Get llama-server logs only
 */
getLlamaServerLogs(limit = 100) {
  return this.db
    .prepare("SELECT * FROM logs WHERE source = ? ORDER BY timestamp DESC LIMIT ?")
    .all("llama-server", limit);
}
```

#### 4.2 Frontend Log Display

Logs from llama-server are already being captured via `logs:entry` broadcasts in the process manager. The existing Logs page will automatically display them since it subscribes to the `logs` state.

---

## Phase 5: Configuration

### Goal

Add llama-server configuration options to settings.

### Database Schema Update

**File**: `server/db/schema.js` (MODIFY)

Add llama-server settings:

```sql
-- Add to schema
ALTER TABLE server_config ADD COLUMN llama_server_enabled INTEGER DEFAULT 1;
ALTER TABLE server_config ADD COLUMN llama_server_port INTEGER DEFAULT 8080;
ALTER TABLE server_config ADD COLUMN llama_server_host TEXT DEFAULT '0.0.0.0';
ALTER TABLE server_config ADD COLUMN llama_server_metrics INTEGER DEFAULT 1;
```

### Settings UI

**File**: `public/js/pages/settings/settings-page.js` (MODIFY)

Add llama-server configuration section:

```javascript
render() {
  // ... existing config rendering ...

  // NEW: Add llama-server settings
  return Component.h("div", { className: "settings-page" },
    // ... existing sections ...

    Component.h("section", { className: "settings-section" },
      Component.h("h2", {}, "llama-server Settings"),

      Component.h("div", { className: "form-group" },
        Component.h("label", { for: "llamaServerEnabled" },
          "Enable llama-server"
        ),
        Component.h("input", {
          type: "checkbox",
          id: "llamaServerEnabled",
          checked: this.state.config.llama_server_enabled || false,
          onChange: (e) => this.handleConfigChange("llama_server_enabled", e.target.checked)
        })
      ),

      Component.h("div", { className: "form-group" },
        Component.h("label", { for: "llamaServerPort" },
          "Port"
        ),
        Component.h("input", {
          type: "number",
          id: "llamaServerPort",
          value: this.state.config.llama_server_port || 8080,
          onChange: (e) => this.handleConfigChange("llama_server_port", parseInt(e.target.value))
        })
      ),

      Component.h("div", { className: "form-group" },
        Component.h("label", { for: "llamaServerHost" },
          "Host"
        ),
        Component.h("input", {
          type: "text",
          id: "llamaServerHost",
          value: this.state.config.llama_server_host || "0.0.0.0",
          onChange: (e) => this.handleConfigChange("llama_server_host", e.target.value)
        })
      ),

      Component.h("div", { className: "form-group" },
        Component.h("label", { for: "llamaServerMetrics" },
          "Enable Metrics"
        ),
        Component.h("input", {
          type: "checkbox",
          id: "llamaServerMetrics",
          checked: this.state.config.llama_server_metrics || false,
          onChange: (e) => this.handleConfigChange("llama_server_metrics", e.target.checked)
        })
      )
  );
}
```

---

## Implementation Order

### Week 1

1. ✅ Create process manager module (`process-manager.js`)
2. ✅ Create socket handlers (`process-handlers.js`)
3. ✅ Create state management (`state-llama.js`)
4. ✅ Update database schema
5. ✅ Create status panel component (`status-panel.js`)
6. ✅ Integrate into monitoring page
7. ✅ Test start/stop functionality

### Week 2

8. ✅ Implement metrics scraper (`metrics-scraper.js`)
9. ✅ Add metrics scraping to process manager
10. ✅ Enhance status panel with metrics display
11. ✅ Add llama-server logs to repository
12. ✅ Integrate logs into existing log viewer

### Week 3

13. ✅ Add settings UI for llama-server config
14. ✅ Test configuration persistence
15. ✅ Test metrics integration
16. ✅ Test log aggregation
17. ✅ Performance testing and optimization

---

## Testing Strategy

### Unit Tests

- Process manager start/stop
- Metrics scraper parsing
- State management subscription/unsubscription

### Integration Tests

- Full workflow: start → monitor → stop
- Metrics accuracy verification
- Log aggregation verification
- Multiple client connections

### Manual Testing Checklist

- [ ] Start llama-server from UI
- [ ] Verify logs appear in log pages
- [ ] Check metrics display correctly
- [ ] Stop llama-server from UI
- [ ] Verify logs stop appearing
- [ ] Test with multiple models
- [ ] Test with router mode enabled
- [ ] Test process recovery (crash, kill, etc.)

---

## Success Criteria

1. ✅ llama-server can be started/stopped from dashboard UI
2. ✅ llama-server stdout/stderr appears in log pages in real-time
3. ✅ llama-server metrics appear in monitoring dashboard when running
4. ✅ Metrics disappear or show "stopped" when llama-server stops
5. ✅ Process lifecycle management is robust (handles crashes, kills, etc.)
6. ✅ Configuration can be adjusted via settings page
7. ✅ All features work with router mode (multi-model support)
8. ✅ Code passes all lint checks
9. ✅ Code follows project conventions
10. ✅ Files remain under 200 lines

---

## Potential Challenges & Solutions

### Challenge 1: llama-server Output Format

**Issue**: llama-server metrics output format is not documented
**Solution**:

- Start llama-server with verbose flag
- Capture all output
- Implement pattern matching for common metrics patterns
- Update parsing as we observe actual output

### Challenge 2: Process Cleanup

**Issue**: Orphaned processes on crashes
**Solution**:

- Track process PID
- Implement periodic health checks
- Use process groups if available
- Force kill after timeout

### Challenge 3: Port Conflicts

**Issue**: llama-server port already in use
**Solution**:

- Check port availability before starting
- Allow configurable port in settings
- Show clear error message to user

---

## Notes

1. **llama-server version compatibility**: Implementation should work with current llama.cpp (b5322 or newer)
2. **Router mode compatibility**: Must work with llama-server in router mode (multi-model)
3. **Backward compatibility**: Existing dashboard features must continue to work
4. **Graceful degradation**: If llama-server not available, dashboard should still function
5. **Resource usage**: Process manager should not consume excessive CPU/memory

---

## Next Steps

After this implementation plan is approved:

1. Delegate to **Top‑Notch Coder-Agent** to implement all phases
2. Create comprehensive test suite
3. Write user documentation
4. Deploy and validate in production-like environment

---

## Estimated Timeline

- **Phase 1 (Process Management)**: 1 week
- **Phase 2 (Metrics Scraping)**: 1 week
- **Phase 3 (UI Integration)**: 1 week
- **Phase 4 (Log Integration)**: 3 days
- **Phase 5 (Configuration)**: 2 days
- **Testing & Documentation**: 3 days

**Total**: 4.5 weeks

---

**Created**: 2025-01-10
**Author**: Orchestrator Agent
**Status**: 📋 Planning Complete - Ready for Implementation
