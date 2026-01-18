/**
 * Logs Page - Socket-First Architecture
 *
 * Socket contracts:
 * - logs:get           GET log entries
 * - logs:clear         CLEAR all logs
 * - logs:updated       [BROADCAST] Logs changed
 * - logs:cleared       [BROADCAST] Logs cleared
 */

class LogsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
  }

  willUnmount() {
    this.comp?.destroy();
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[DEBUG] LogsController.render() - loading logs...");

    // Load initial logs from socket
    let logs = [];
    try {
      const response = await socketClient.request("logs:get", { limit: 100 });

      if (response.success) {
        logs = response.data.logs || [];
      } else {
        console.error("[LogsController] Failed to load logs:", response.error);
      }
    } catch (error) {
      console.error("[LogsController] Load error:", error);
    }

    this.comp = new LogsPage({ logs });
    this.comp._controller = this;

    const html = this.comp.render();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const el = wrapper.firstElementChild;

    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    this.comp.onMount();

    return el;
  }
}

class LogsPage extends Component {
  constructor(props) {
    super(props);
    this.logs = props.logs || [];
    this.filters = { level: "all", search: "" };
    this.unsubscribers = [];
  }

  onMount() {
    console.log("[DEBUG] LogsPage.onMount() - subscribing to broadcasts");

    // Listen to socket broadcasts for updates
    this.unsubscribers.push(
      socketClient.on("logs:updated", (data) => {
        console.log("[DEBUG] logs:updated broadcast received");
        this.logs = Array.isArray(data?.logs) ? data.logs : [];
        this._updateLogs();
      })
    );

    this.unsubscribers.push(
      socketClient.on("logs:cleared", () => {
        console.log("[DEBUG] logs:cleared broadcast received");
        this.logs = [];
        this._updateLogs();
      })
    );
  }

  destroy() {
    console.log("[DEBUG] LogsPage.destroy() - cleanup");
    this.unsubscribers.forEach((unsub) => unsub?.());
    this.unsubscribers = [];
  }

  bindEvents() {
    this.on("input", "[data-field=search]", (e) => {
      this.filters.search = e.target.value;
      this._updateLogs();
    });

    this.on("change", "[data-field=level]", (e) => {
      this.filters.level = e.target.value;
      this._updateLogs();
    });

    this.on("click", "[data-action=clear]", () => {
      if (confirm("Clear all logs?")) {
        this._clearLogs();
      }
    });

    this.on("click", "[data-action=export]", () => {
      this._exportLogs();
    });
  }

  async _clearLogs() {
    try {
      console.log("[DEBUG] Clearing logs");

      const response = await socketClient.request("logs:clear", {});

      if (response.success) {
        showNotification("Logs cleared", "success");
        // Server broadcasts logs:cleared
      } else {
        showNotification(`Failed: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[LogsPage] Clear failed:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  _exportLogs() {
    try {
      const data = JSON.stringify(this.logs, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logs-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showNotification("Logs exported", "success");
    } catch (error) {
      console.error("[LogsPage] Export failed:", error);
      showNotification("Export failed", "error");
    }
  }

  /**
   * Get filtered logs based on current filter settings.
   * @returns {Array} Filtered array of log entries
   */
  _getFiltered() {
    // Ensure logs is always an array
    let logsArray = [];
    if (Array.isArray(this.logs)) {
      logsArray = this.logs;
    } else if (this.logs && typeof this.logs === "object") {
      // Convert object to array if needed
      logsArray = Object.values(this.logs);
    }

    let ls = [...logsArray];

    if (this.filters.level && this.filters.level !== "all") {
      ls = ls.filter((l) => l.level === this.filters.level);
    }

    if (this.filters.search) {
      const s = this.filters.search.toLowerCase();
      ls = ls.filter((l) => String(l.message).toLowerCase().includes(s));
    }

    return ls;
  }

  /**
   * Format a timestamp to display time with milliseconds.
   * @param {number} ts - Timestamp in seconds or milliseconds
   * @returns {string} Formatted time string (HH:MM:SS.mmm)
   */
  _time(ts) {
    if (!ts) return "--:--:--";
    const ms = ts < 1e11 ? ts * 1000 : ts;
    const d = new Date(ms);
    return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(3, "0")}`;
  }

  _updateLogs() {
    const container = this.$(".logs-container");
    if (!container) return;

    const filtered = this._getFiltered();
    const visibleLogs = filtered.slice(0, 200);

    if (filtered.length === 0) {
      container.innerHTML = "<p class=\"empty\">No logs found</p>";
    } else {
      container.innerHTML = visibleLogs
        .map(
          (l) =>
            `<div class="log-entry level-${l.level || "info"}"><span class="log-time">${this._time(l.timestamp)}</span><span class="log-level">${(l.level || "info").toUpperCase()}</span><span class="log-msg">${String(l.message)}</span></div>`
        )
        .join("");
    }

    const toolbar = this.$(".toolbar h2");
    if (toolbar) {
      toolbar.textContent = `Logs (${filtered.length} total, showing ${visibleLogs.length})`;
    }
  }

  render() {
    const filtered = this._getFiltered();
    const visibleLogs = filtered.slice(0, 200);

    return `
      <div class="logs-page">
        <div class="toolbar">
          <h2>Logs (${filtered.length} total, showing ${visibleLogs.length})</h2>
          <button class="btn btn-secondary" data-action="export">Export</button>
          <button class="btn btn-danger" data-action="clear">Clear</button>
          <select data-field="level">
            <option value="all" ${this.filters.level === "all" ? "selected" : ""}>All Levels</option>
            <option value="info" ${this.filters.level === "info" ? "selected" : ""}>Info</option>
            <option value="warn" ${this.filters.level === "warn" ? "selected" : ""}>Warning</option>
            <option value="error" ${this.filters.level === "error" ? "selected" : ""}>Error</option>
            <option value="debug" ${this.filters.level === "debug" ? "selected" : ""}>Debug</option>
          </select>
          <input type="text" placeholder="Search logs..." data-field="search" value="${this.filters.search}" autocomplete="off">
        </div>
        <div class="logs-container">
          ${
            filtered.length === 0
              ? "<p class=\"empty\">No logs found</p>"
              : visibleLogs
                .map(
                  (l) =>
                    `<div class="log-entry level-${l.level || "info"}"><span class="log-time">${this._time(l.timestamp)}</span><span class="log-level">${(l.level || "info").toUpperCase()}</span><span class="log-msg">${String(l.message)}</span></div>`
                )
                .join("")
          }
        </div>
      </div>
    `;
  }
}

window.LogsController = LogsController;
window.LogsPage = LogsPage;
console.log("[LOGS] Logs module loaded");
