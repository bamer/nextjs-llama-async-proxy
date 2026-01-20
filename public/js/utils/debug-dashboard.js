/**
 * Debug Dashboard - Real-time monitoring interface for the logging system
 * Displays performance metrics, event traces, and system status
 */

class DebugDashboard {
  constructor() {
    this.visible = false;
    this.container = null;
    this.autoRefresh = true;
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (this.visible) return;

    this.visible = true;
    this.createDashboard();
    console.log("🔍 Debug Dashboard shown");
  }

  hide() {
    if (!this.visible) return;

    this.visible = false;

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    console.log("🔍 Debug Dashboard hidden");
  }

  createDashboard() {
    // Create container
    this.container = document.createElement("div");
    this.container.id = "debug-dashboard";
    this.container.innerHTML = `
      <div class="debug-dashboard-overlay">
        <div class="debug-dashboard-panel">
          <div class="debug-dashboard-header">
            <h3>🔍 Debug Dashboard</h3>
            <div class="debug-dashboard-controls">
              <button id="debug-refresh" class="btn btn-sm">🔄 Refresh</button>
              <button id="debug-clear" class="btn btn-sm">🗑️ Clear</button>
              <button id="debug-run-tests" class="btn btn-sm">🧪 Run Tests</button>
              <button id="debug-close" class="btn btn-danger btn-sm">✕ Close</button>
            </div>
          </div>
          <div class="debug-dashboard-content">
            <div class="debug-section">
              <h4>📊 System Status</h4>
              <div id="system-status"></div>
            </div>
            <div class="debug-section">
              <h4>⚡ Performance Metrics</h4>
              <div id="performance-metrics"></div>
            </div>
            <div class="debug-section">
              <h4>📡 Socket.IO Stats</h4>
              <div id="socket-stats"></div>
            </div>
            <div class="debug-section">
              <h4>📝 Logging Stats</h4>
              <div id="logging-stats"></div>
            </div>
            <div class="debug-section">
              <h4>🎯 Recent Events</h4>
              <div id="recent-events"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .debug-dashboard-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .debug-dashboard-panel {
        background: var(--bg-primary, #fff);
        border: 2px solid var(--border-color, #ddd);
        border-radius: 8px;
        width: 90%;
        max-width: 1200px;
        height: 80%;
        max-height: 800px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }

      .debug-dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid var(--border-color, #ddd);
        background: var(--bg-secondary, #f5f5f5);
        border-radius: 6px 6px 0 0;
      }

      .debug-dashboard-header h3 {
        margin: 0;
        color: var(--text-primary, #333);
      }

      .debug-dashboard-controls {
        display: flex;
        gap: 10px;
      }

      .debug-dashboard-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .debug-section {
        margin-bottom: 20px;
        padding: 15px;
        border: 1px solid var(--border-color, #ddd);
        border-radius: 6px;
        background: var(--bg-primary, #fff);
      }

      .debug-section h4 {
        margin: 0 0 10px 0;
        color: var(--text-primary, #333);
        border-bottom: 1px solid var(--border-color, #eee);
        padding-bottom: 5px;
      }

      .debug-metric {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid var(--border-color, #f0f0f0);
      }

      .debug-metric:last-child {
        border-bottom: none;
      }

      .debug-metric-value {
        font-weight: bold;
        color: var(--primary-color, #007bff);
      }

      .debug-metric-value.error {
        color: var(--error-color, #dc3545);
      }

      .debug-metric-value.success {
        color: var(--success-color, #28a745);
      }

      .debug-event {
        padding: 8px;
        margin: 5px 0;
        border-left: 3px solid var(--primary-color, #007bff);
        background: var(--bg-secondary, #f8f9fa);
        font-family: monospace;
        font-size: 12px;
      }

      .debug-event.error {
        border-left-color: var(--error-color, #dc3545);
        background: #ffe6e6;
      }

      .debug-event.success {
        border-left-color: var(--success-color, #28a745);
        background: #e6ffe6;
      }

      .btn-sm {
        padding: 5px 10px;
        font-size: 12px;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);

    // Add event listeners
    this.container.querySelector("#debug-refresh").addEventListener("click", () => this.update());
    this.container.querySelector("#debug-clear").addEventListener("click", () => this.clear());
    this.container.querySelector("#debug-run-tests").addEventListener("click", () => this.runTests());
    this.container.querySelector("#debug-close").addEventListener("click", () => this.hide());

    document.body.appendChild(this.container);

    // Initial update
    this.update();
  }

  // Auto-refresh mechanics removed to enforce event-driven updates

  update() {
    if (!this.visible || !this.container) return;

    try {
      this.updateSystemStatus();
      this.updatePerformanceMetrics();
      this.updateSocketStats();
      this.updateLoggingStats();
      this.updateRecentEvents();
    } catch (error) {
      console.error("Debug dashboard update failed:", error);
    }
  }

  updateSystemStatus() {
    const statusEl = this.container.querySelector("#system-status");
    if (!statusEl) return;

    const status = {
      "Debug System": window.DEBUG_SYSTEM ? "✅ Active" : "❌ Inactive",
      "Client Logger": window.clientLogger ? "✅ Active" : "❌ Inactive",
      "Socket Client": window.socketClient ? "✅ Active" : "❌ Inactive",
      "Socket Connected": window.socketClient?.isConnected ? "✅ Connected" : "❌ Disconnected",
      "Page Ready": document.readyState === "complete" ? "✅ Complete" : "⏳ Loading"
    };

    statusEl.innerHTML = Object.entries(status)
      .map(([key, value]) => `<div class="debug-metric"><span>${key}:</span><span class="debug-metric-value">${value}</span></div>`)
      .join("");
  }

  updatePerformanceMetrics() {
    const metricsEl = this.container.querySelector("#performance-metrics");
    if (!metricsEl || !window.DEBUG_SYSTEM?.timing) return;

    const report = window.DEBUG_SYSTEM.timing.getReport();
    const metrics = {
      "Total Marks": report.summary.totalMarks,
      "Total Measures": report.summary.totalMeasures,
      "Avg Duration": report.summary.avgDuration ? `${report.summary.avgDuration.toFixed(2)}ms` : "N/A"
    };

    metricsEl.innerHTML = Object.entries(metrics)
      .map(([key, value]) => `<div class="debug-metric"><span>${key}:</span><span class="debug-metric-value">${value}</span></div>`)
      .join("");
  }

  updateSocketStats() {
    const statsEl = this.container.querySelector("#socket-stats");
    if (!statsEl || !window.DEBUG_SYSTEM?.socket) return;

    const stats = window.DEBUG_SYSTEM.socket.getStats();
    const displayStats = {
      "Connected": stats.connected ? "✅ Yes" : "❌ No",
      "Messages Sent": stats.sent,
      "Messages Received": stats.received,
      "Errors": stats.errors,
      "Reconnects": stats.reconnects,
      "Uptime": stats.uptime ? `${Math.floor(stats.uptime / 1000)}s` : "N/A",
      "Events/sec": stats.eventsPerSecond,
      "Error Rate": stats.errorRate
    };

    statsEl.innerHTML = Object.entries(displayStats)
      .map(([key, value]) => {
        const cssClass = key === "Connected" ? (stats.connected ? "success" : "error") : "";
        return `<div class="debug-metric"><span>${key}:</span><span class="debug-metric-value ${cssClass}">${value}</span></div>`;
      })
      .join("");
  }

  updateLoggingStats() {
    const statsEl = this.container.querySelector("#logging-stats");
    if (!statsEl || !window.DEBUG_SYSTEM?.logging) return;

    const stats = window.DEBUG_SYSTEM.logging.getStats();
    const displayStats = {
      "Logs Captured": stats.captured,
      "Logs Displayed": stats.displayed,
      "Logs Lost": stats.lost,
      "Avg Latency": stats.avgLatency ? `${stats.avgLatency.toFixed(2)}ms` : "N/A",
      "Efficiency": stats.efficiency
    };

    statsEl.innerHTML = Object.entries(displayStats)
      .map(([key, value]) => `<div class="debug-metric"><span>${key}:</span><span class="debug-metric-value">${value}</span></div>`)
      .join("");
  }

  updateRecentEvents() {
    const eventsEl = this.container.querySelector("#recent-events");
    if (!eventsEl || !window.DEBUG_SYSTEM?.tracer) return;

    const events = window.DEBUG_SYSTEM.tracer.getEvents().slice(-10);
    eventsEl.innerHTML = events.length > 0
      ? events.map(event => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        const cssClass = event.event.includes("error") || event.event.includes("fail") ? "error" :
          event.event.includes("success") || event.event.includes("connect") ? "success" : "";
        return `<div class="debug-event ${cssClass}">[${time}] ${event.event}</div>`;
      }).join("")
      : "<div class=\"debug-event\">No recent events</div>";
  }

  clear() {
    if (window.DEBUG_SYSTEM) {
      window.DEBUG_SYSTEM.clear();
      console.log("🧹 Debug data cleared");
    }
    this.update();
  }

  async runTests() {
    if (window.LoggingSystemIntegrationTests) {
      const tests = new window.LoggingSystemIntegrationTests();
      await tests.runAllTests();
      this.update(); // Update after tests complete
    } else {
      console.error("Integration tests not available");
    }
  }
}

// Global debug dashboard instance
window.debugDashboard = new DebugDashboard();

// Add keyboard shortcut to toggle debug dashboard (Ctrl+Shift+D)
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === "D") {
    e.preventDefault();
    window.debugDashboard.toggle();
  }
});

console.log("🔍 Debug Dashboard loaded. Press Ctrl+Shift+D to toggle.");
