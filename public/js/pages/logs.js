/**
 * Logs Page - With Real-time Log Loading
 */

class LogsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.loading = true;
  }

  init() {
    // Setup subscriptions
    this.unsubscriber = stateManager.subscribe("logs", (logs) => {
      if (this.comp && !this.loading) {
        this.comp.setState({ logs });
      }
    });
  }

  willUnmount() {
    if (this.unsubscriber) {
      this.unsubscriber();
    }
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[DEBUG] LogsController.render() called");
    this.loading = true;

    // Load logs
    try {
      console.log("[DEBUG] Attempting to read log file...");
      const d = await stateManager.readLogFile();
      console.log("[DEBUG] readLogFile response:", {
        logsCount: d.logs?.length || 0,
        fileName: d.fileName,
      });
      stateManager.set("logs", d.logs || []);
      console.log("[DEBUG] Loaded", d.logs?.length || 0, "logs from file");
    } catch (e) {
      console.log("[DEBUG] File load failed:", e.message);
      console.log("[DEBUG] Attempting to read from database...");
      try {
        const d = await stateManager.getLogs({ limit: 100 });
        console.log("[DEBUG] getLogs response:", { logsCount: d.logs?.length || 0 });
        stateManager.set("logs", d.logs || []);
        console.log("[DEBUG] Loaded", d.logs?.length || 0, "logs from database");
      } catch (e2) {
        console.error("[DEBUG] Load error:", e2.message);
        stateManager.set("logs", []);
      }
    }

    const logs = stateManager.get("logs") || [];
    this.comp = new LogsPage({ logs });

    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp._controller = this;
    this.comp.bindEvents();
    this.comp._mounted = true;

    this.init();
    this.loading = false;

    return el;
  }

  didMount() {
    // Called by router after component is mounted
  }
}

class LogsPage extends Component {
  constructor(props) {
    super(props);
    this.state = { logs: props.logs || [], filters: { level: "all", search: "" } };
    this.lastSearchValue = "";
    this.lastLevelValue = "all";
  }

  didUpdate() {
    // Restore focus and cursor position to search input after update
    const searchInput = this._el?.querySelector("[data-field=\"search\"]");
    if (searchInput && document.activeElement === searchInput) {
      // Focus already restored by browser, no action needed
    } else if (searchInput && this.lastSearchValue === this.state.filters.search) {
      // Only restore if value hasn't changed (user is still typing)
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  }

  render() {
    const filtered = this._getFiltered();
    const visibleLogs = filtered.slice(0, 200); // Show max 200 logs (pagination would be better)

    return Component.h(
      "div",
      { className: "logs-page" },
      Component.h(
        "div",
        { className: "toolbar" },
        Component.h("h2", {}, `Logs (${filtered.length} total, showing ${visibleLogs.length})`),
        Component.h(
          "button",
          { className: "btn btn-secondary", "data-action": "export" },
          "Export"
        ),
        Component.h("button", { className: "btn btn-danger", "data-action": "clear" }, "Clear"),
        Component.h(
          "select",
          { "data-field": "level", value: this.state.filters.level },
          Component.h("option", { value: "all" }, "All Levels"),
          Component.h("option", { value: "info" }, "Info"),
          Component.h("option", { value: "warn" }, "Warning"),
          Component.h("option", { value: "error" }, "Error"),
          Component.h("option", { value: "debug" }, "Debug")
        ),
        Component.h("input", {
          type: "text",
          placeholder: "Search logs...",
          "data-field": "search",
          value: this.state.filters.search,
          autoComplete: "off",
        })
      ),
      Component.h(
        "div",
        { className: "logs-container" },
        filtered.length === 0
          ? Component.h("p", { className: "empty" }, "No logs found")
          : Component.h(
            "div",
            {},
            ...visibleLogs.map((l) =>
              Component.h(
                "div",
                { className: `log-entry level-${l.level || "info"}` },
                Component.h("span", { className: "log-time" }, this._time(l.timestamp)),
                Component.h(
                  "span",
                  { className: "log-level" },
                  (l.level || "info").toUpperCase()
                ),
                Component.h("span", { className: "log-msg" }, String(l.message))
              )
            )
          )
      )
    );
  }

  _getFiltered() {
    let ls = [...(this.state.logs || [])];

    if (this.state.filters.level && this.state.filters.level !== "all") {
      ls = ls.filter((l) => l.level === this.state.filters.level);
    }

    if (this.state.filters.search) {
      const s = this.state.filters.search.toLowerCase();
      ls = ls.filter((l) => String(l.message).toLowerCase().includes(s));
    }

    return ls;
  }

  _time(ts) {
    if (!ts) return "--:--:--";
    // Handle both formats: database (seconds) and file (milliseconds)
    // If timestamp is less than 1e11, it's in seconds; otherwise milliseconds
    const ms = ts < 1e11 ? ts * 1000 : ts;
    const d = new Date(ms);
    return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(3, "0")}`;
  }

  getEventMap() {
    return {
      "input [data-field=search]": (e) => {
        this.lastSearchValue = e.target.value;
        this.setState({ filters: { ...this.state.filters, search: e.target.value } });
      },
      "change [data-field=level]": (e) => {
        this.lastLevelValue = e.target.value;
        this.setState({ filters: { ...this.state.filters, level: e.target.value } });
      },
      "click [data-action=clear]": "onClear",
      "click [data-action=export]": "onExport",
    };
  }

  onClear() {
    if (confirm("Clear all logs?")) {
      Promise.all([
        stateManager.clearLogs().catch((e) => {
          console.warn("[LOGS] Database clear error:", e.message);
        }),
        stateManager.clearLogFiles().catch((e) => {
          console.warn("[LOGS] File clear error:", e.message);
        }),
      ]).then(() => {
        this.setState({ logs: [] });
        showNotification("Logs cleared", "success");
      });
    }
  }

  onExport() {
    const d = JSON.stringify(this.state.logs, null, 2);
    const b = new Blob([d], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    showNotification("Logs exported", "success");
  }

  _setController(c) {
    this._controller = c;
  }
}

window.LogsController = LogsController;
window.LogsPage = LogsPage;
console.log("[LOGS] Logs module loaded");
