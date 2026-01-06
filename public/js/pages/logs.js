/**
 * Logs Page - With Comprehensive Debug Logging
 */

class LogsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    console.log("[LOGS] LogsController constructor called");
  }

  init() {
    console.log("[LOGS] LogsController.init() called");
  }

  willUnmount() {
    console.log("[LOGS] LogsController.willUnmount() called");
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[LOGS] LogsController.render() called - START");

    await this.load();

    const logs = stateManager.get("logs") || [];
    console.log("[LOGS] Found", logs.length, "logs");

    this.comp = new LogsPage({ logs: logs });

    console.log("[LOGS] Calling component.render()");
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();

    console.log("[LOGS] LogsController.render() - END");
    return el;
  }

  async load() {
    console.log("[LOGS] LogsController.load() called");
    try {
      console.log("[LOGS] Loading logs...");
      const d = await stateManager.getLogs({ limit: 100 });
      stateManager.set("logs", d.logs || []);
      console.log("[LOGS] Loaded", d.logs?.length || 0, "logs");
      console.log("[LOGS] LogsController.load() - END");
    } catch (e) {
      console.log("[LOGS] Load error:", e.message);
    }
  }
}

class LogsPage extends Component {
  constructor(props) {
    super(props);
    console.log("[LOGS] LogsPage constructor called");
    console.log("[LOGS] Props logs:", props.logs?.length);

    this.state = { logs: props.logs || [], filters: { level: "all", search: "" } };
    console.log("[LOGS] State initialized");
  }

  render() {
    console.log("[LOGS] LogsPage.render() called");
    const filtered = this._getFiltered();
    console.log("[LOGS] Filtered logs:", filtered.length);

    const result = Component.h("div", { className: "logs-page" },
      Component.h("div", { className: "toolbar" },
        Component.h("button", { className: "btn btn-secondary", "data-action": "export" }, "Export"),
        Component.h("button", { className: "btn btn-danger", "data-action": "clear" }, "Clear"),
        Component.h("select", { "data-field": "level" },
          Component.h("option", { value: "all" }, "All"),
          Component.h("option", { value: "info" }, "Info"),
          Component.h("option", { value: "warn" }, "Warning"),
          Component.h("option", { value: "error" }, "Error")
        ),
        Component.h("input", { type: "text", placeholder: "Search...", "data-field": "search", value: this.state.filters.search })
      ),
      Component.h("div", { className: "logs-container" },
        filtered.length === 0
          ? Component.h("p", { className: "empty" }, "No logs")
          : filtered.map((l) => {
            console.log("[LOGS] Rendering log:", l.level, l.message?.substring(0, 30));
            return Component.h("div", { className: `log-entry level-${  l.level || "info"}` },
              Component.h("span", { className: "log-time" }, this._time(l.timestamp)),
              Component.h("span", { className: "log-level" }, (l.level || "info").toUpperCase()),
              Component.h("span", { className: "log-msg" }, String(l.message))
            );
          })
      )
    );

    console.log("[LOGS] LogsPage.render() - END");
    return result;
  }

  _getFiltered() {
    console.log("[LOGS] _getFiltered() called");
    let ls = [...(this.state.logs || [])];
    console.log("[LOGS] Starting with", ls.length, "logs");

    if (this.state.filters.level && this.state.filters.level !== "all") {
      console.log("[LOGS] Filtering by level:", this.state.filters.level);
      ls = ls.filter((l) => l.level === this.state.filters.level);
    }

    if (this.state.filters.search) {
      console.log("[LOGS] Filtering by search:", this.state.filters.search);
      const s = this.state.filters.search.toLowerCase();
      ls = ls.filter((l) => String(l.message).toLowerCase().includes(s));
    }

    console.log("[LOGS] Returning", ls.length, "filtered logs");
    return ls;
  }

  _time(ts) {
    if (!ts) return "--:--:--";
    const d = new Date(ts);
    const result = `${d.toLocaleTimeString()  }.${  String(d.getMilliseconds()).padStart(3, "0")}`;
    console.log("[LOGS] _time:", ts, "->", result);
    return result;
  }

  getEventMap() {
    console.log("[LOGS] getEventMap() called");
    return {
      "change [data-field=level]": (e) => {
        console.log("[LOGS] Level filter changed:", e.target.value);
        this.setState({ filters: { ...this.state.filters, level: e.target.value } });
      },
      "input [data-field=search]": (e) => {
        console.log("[LOGS] Search input changed:", e.target.value);
        this.setState({ filters: { ...this.state.filters, search: e.target.value } });
      },
      "click [data-action=clear]": () => {
        console.log("[LOGS] Clear clicked");
        if (confirm("Clear all logs?")) {
          stateManager.clearLogs().then(() => {
            this.setState({ logs: [] });
            showNotification("Logs cleared", "success");
            console.log("[LOGS] Logs cleared");
          });
        }
      },
      "click [data-action=export]": () => {
        console.log("[LOGS] Export clicked, logs count:", this.state.logs.length);
        const d = JSON.stringify(this.state.logs, null, 2);
        const b = new Blob([d], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `logs-${  new Date().toISOString()  }.json`;
        a.click();
        showNotification("Logs exported", "success");
        console.log("[LOGS] Logs exported");
      },
    };
  }

  _setController(c) {
    console.log("[LOGS] _setController() called");
    this._controller = c;
  }
}

window.LogsController = LogsController;
window.LogsPage = LogsPage;
console.log("[LOGS] Logs module loaded");
