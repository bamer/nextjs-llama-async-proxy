/**
 * Logs Page - Event-Driven DOM Updates
 */

class LogsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.unsubscriber = null;
  }

  willUnmount() {
    this.unsubscriber?.();
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[DEBUG] LogsController.render() called");

    try {
      const d = await stateManager.readLogFile();
      stateManager.set("logs", d.logs || []);
    } catch (e) {
      try {
        const d = await stateManager.getLogs({ limit: 100 });
        stateManager.set("logs", d.logs || []);
      } catch (e2) {
        stateManager.set("logs", []);
      }
    }

    const logs = stateManager.get("logs") || [];
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
  }

  onMount() {
    this._controller.unsubscriber = stateManager.subscribe("logs", (logs) => {
      this.logs = logs || [];
      this._updateLogs();
    });
  }

  destroy() {
    this._controller.unsubscriber?.();
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
        Promise.all([
          stateManager.clearLogs().catch(() => {}),
          stateManager.clearLogFiles().catch(() => {}),
        ]).then(() => {
          this.logs = [];
          stateManager.set("logs", []);
          showNotification("Logs cleared", "success");
        });
      }
    });

    this.on("click", "[data-action=export]", () => {
      const d = JSON.stringify(this.logs, null, 2);
      const b = new Blob([d], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `logs-${new Date().toISOString()}.json`;
      a.click();
      showNotification("Logs exported", "success");
    });
  }

  _getFiltered() {
    let ls = [...(this.logs || [])];

    if (this.filters.level && this.filters.level !== "all") {
      ls = ls.filter((l) => l.level === this.filters.level);
    }

    if (this.filters.search) {
      const s = this.filters.search.toLowerCase();
      ls = ls.filter((l) => String(l.message).toLowerCase().includes(s));
    }

    return ls;
  }

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
      return;
    }

    container.innerHTML = visibleLogs
      .map(
        (l) =>
          `<div class="log-entry level-${l.level || "info"}"><span class="log-time">${this._time(l.timestamp)}</span><span class="log-level">${(l.level || "info").toUpperCase()}</span><span class="log-msg">${String(l.message)}</span></div>`
      )
      .join("");

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
