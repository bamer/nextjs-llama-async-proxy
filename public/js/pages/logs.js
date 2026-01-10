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

    // Load logs
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

    const el = this.comp.render();
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
    this.lastSearchValue = "";
    this.lastLevelValue = "all";
  }

  onMount() {
    // Subscribe to log changes
    this._controller.unsubscriber = stateManager.subscribe("logs", (logs) => {
      this.logs = logs || [];
      this._updateLogs();
    });
  }

  destroy() {
    this._controller.unsubscriber?.();
  }

  bindEvents() {
    // Search input
    this.on("input", "[data-field=search]", (e) => {
      this.lastSearchValue = e.target.value;
      this.filters.search = e.target.value;
      this._updateLogs();
    });

    // Level filter
    this.on("change", "[data-field=level]", (e) => {
      this.lastLevelValue = e.target.value;
      this.filters.level = e.target.value;
      this._updateLogs();
    });

    // Clear button
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

    // Export button
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

    container.innerHTML = "";
    visibleLogs.forEach((l) => {
      const entry = Component.h("div", { className: `log-entry level-${l.level || "info"}` }, [
        Component.h("span", { className: "log-time" }, this._time(l.timestamp)),
        Component.h("span", { className: "log-level" }, (l.level || "info").toUpperCase()),
        Component.h("span", { className: "log-msg" }, String(l.message)),
      ]);
      container.appendChild(entry);
    });

    // Update toolbar count
    const toolbar = this.$(".toolbar h2");
    if (toolbar) {
      toolbar.textContent = `Logs (${filtered.length} total, showing ${visibleLogs.length})`;
    }
  }

  render() {
    const filtered = this._getFiltered();
    const visibleLogs = filtered.slice(0, 200);

    return Component.h("div", { className: "logs-page" }, [
      Component.h("div", { className: "toolbar" }, [
        Component.h("h2", {}, `Logs (${filtered.length} total, showing ${visibleLogs.length})`),
        Component.h("button", { className: "btn btn-secondary", "data-action": "export" }, "Export"),
        Component.h("button", { className: "btn btn-danger", "data-action": "clear" }, "Clear"),
        Component.h("select", { "data-field": "level" }, [
          Component.h("option", { value: "all" }, "All Levels"),
          Component.h("option", { value: "info" }, "Info"),
          Component.h("option", { value: "warn" }, "Warning"),
          Component.h("option", { value: "error" }, "Error"),
          Component.h("option", { value: "debug" }, "Debug"),
        ]),
        Component.h("input", {
          type: "text",
          placeholder: "Search logs...",
          "data-field": "search",
          value: this.filters.search,
          autoComplete: "off",
        }),
      ]),
      Component.h("div", { className: "logs-container" }, [
        filtered.length === 0
          ? Component.h("p", { className: "empty" }, "No logs found")
          : Component.h("div", {}, [
            ...visibleLogs.map((l) =>
              Component.h("div", { className: `log-entry level-${l.level || "info"}` }, [
                Component.h("span", { className: "log-time" }, this._time(l.timestamp)),
                Component.h("span", { className: "log-level" }, (l.level || "info").toUpperCase()),
                Component.h("span", { className: "log-msg" }, String(l.message)),
              ])
            ),
          ]),
      ]),
    ]);
  }
}

window.LogsController = LogsController;
window.LogsPage = LogsPage;
console.log("[LOGS] Logs module loaded");
