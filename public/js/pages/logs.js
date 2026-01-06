/**
 * Logs Page - Simplified
 */

class LogsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubs = [];
    this.comp = null;
  }

  init() {
    this.unsubs.push(stateManager.subscribe("logs", (l) => this.comp?.setState({ logs: l })));
    this.load();
  }

  async load() {
    try {
      const d = await stateManager.getLogs({ limit: 100 });
      stateManager.set("logs", d.logs || []);
    } catch (e) {
      console.error("[Logs] Load error:", e);
    }
  }

  willUnmount() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    if (this.comp) this.comp.destroy();
  }
  destroy() {
    this.willUnmount();
  }

  render() {
    this.comp = new LogsPage({ logs: stateManager.get("logs") || [] });
    this.init();
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    return el;
  }
}

class LogsPage extends Component {
  render() {
    const filtered = this._getFiltered();
    return Component.h(
      "div",
      { className: "logs-page" },
      Component.h(
        "div",
        { className: "toolbar" },
        Component.h(
          "button",
          { className: "btn btn-secondary", "data-action": "export" },
          "Export"
        ),
        Component.h("button", { className: "btn btn-danger", "data-action": "clear" }, "Clear"),
        Component.h(
          "select",
          { "data-field": "level" },
          Component.h("option", { value: "all" }, "All"),
          Component.h("option", { value: "info" }, "Info"),
          Component.h("option", { value: "warn" }, "Warning"),
          Component.h("option", { value: "error" }, "Error")
        ),
        Component.h("input", { type: "text", placeholder: "Search...", "data-field": "search" })
      ),
      Component.h(
        "div",
        { className: "logs-container" },
        filtered.length === 0
          ? Component.h("p", { className: "empty" }, "No logs")
          : filtered.map((l) =>
            Component.h(
              "div",
              { className: `log-entry level-${l.level || "info"}`, key: l.id || Math.random() },
              Component.h("span", { className: "log-time" }, this._time(l.timestamp)),
              Component.h("span", { className: "log-level" }, (l.level || "info").toUpperCase()),
              Component.h("span", { className: "log-msg" }, String(l.message))
            )
          )
      )
    );
  }

  _getFiltered() {
    let ls = [...(this.state.logs || [])];
    if (this.state.filters?.level && this.state.filters.level !== "all")
      ls = ls.filter((l) => l.level === this.state.filters.level);
    if (this.state.filters?.search) {
      const s = this.state.filters.search.toLowerCase();
      ls = ls.filter((l) => String(l.message).toLowerCase().includes(s));
    }
    return ls;
  }

  _time(ts) {
    if (!ts) return "--:--:--";
    const d = new Date(ts);
    return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(3, "0")}`;
  }

  getEventMap() {
    return {
      "change [data-field=level]": (e) =>
        this.setState({ filters: { ...this.state.filters, level: e.target.value } }),
      "input [data-field=search]": (e) =>
        this.setState({ filters: { ...this.state.filters, search: e.target.value } }),
      "click [data-action=clear]": () => {
        if (confirm("Clear all logs?"))
          stateManager.clearLogs().then(() => {
            stateManager.set("logs", []);
            showNotification("Logs cleared", "success");
          });
      },
      "click [data-action=export]": () => {
        const d = JSON.stringify(this.state.logs, null, 2);
        const b = new Blob([d], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `logs-${new Date().toISOString()}.json`;
        a.click();
        showNotification("Logs exported", "success");
      },
    };
  }
}

window.LogsController = LogsController;
window.LogsPage = LogsPage;
