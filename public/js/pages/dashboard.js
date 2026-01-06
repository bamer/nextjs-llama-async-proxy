/**
 * Dashboard Page - Simple and native
 */

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.loaded = false;
  }

  init() {}

  willUnmount() {}

  destroy() {
    this.willUnmount();
  }

  render() {
    this.comp = new DashboardPage({});
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();

    if (!this.loaded) {
      this.loaded = true;
      this.load();
    }

    return el;
  }

  async load() {
    try {
      // Load models
      const d = await stateManager.getModels();
      stateManager.set("models", d.models || []);
      if (this.comp) this.comp.setState({ models: d.models || [] });

      // Load metrics
      const m = await stateManager.getMetrics();
      stateManager.set("metrics", m.metrics || null);
      if (this.comp) this.comp.setState({ metrics: m.metrics || null });

      // Load llama status
      const s = await stateManager.getLlamaStatus();
      stateManager.set("llamaStatus", s.status || null);
      if (this.comp) this.comp.setState({ status: s.status });

      // Load router status if running
      if (s.status?.status === "running") {
        try {
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          if (this.comp) this.comp.setState({ routerStatus: rs.routerStatus });
        } catch (e) {}
      }
    } catch (e) {
      console.log("[DASHBOARD] Load error:", e.message);
    }
  }
}

class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      models: [],
      metrics: null,
      status: null,
      routerStatus: null,
      loading: false,
    };
  }

  render() {
    const m = this.state.metrics || { cpu: { usage: 0 }, memory: { used: 0 } };
    const s = this.state.status?.status || "idle";
    const isRunning = s === "running";
    const routerModels = this.state.routerStatus?.models || [];
    const loadedCount = routerModels.filter((x) => x.state === "loaded").length;

    return Component.h("div", { className: "dashboard-page" },
      Component.h("div", { className: "dashboard-grid" },
        Component.h("div", { className: "card status-card " + (isRunning ? "running" : "idle") },
          Component.h("h3", {}, "Llama Router"),
          Component.h("div", { className: "status-badge" }, isRunning ? "RUNNING" : "STOPPED"),
          isRunning && Component.h("p", { className: "info" }, "Port: " + (this.state.status?.port || 8080) + " | Loaded: " + loadedCount)
        ),
        Component.h("div", { className: "card" },
          Component.h("h3", {}, "CPU"),
          Component.h("p", { className: "big-value" }, (m.cpu?.usage || 0).toFixed(1) + "%")
        ),
        Component.h("div", { className: "card" },
          Component.h("h3", {}, "Memory"),
          Component.h("p", { className: "big-value" }, window.AppUtils?.formatBytes?.(m.memory?.used || 0) || "0 B")
        ),
        Component.h("div", { className: "card" },
          Component.h("h3", {}, "Models"),
          Component.h("p", { className: "big-value" }, isRunning ? loadedCount + "/" + this.state.models.length : "0/" + this.state.models.length)
        )
      ),
      Component.h("div", { className: "card", style: "margin-bottom: 1.5rem;" },
        Component.h("h2", {}, "Llama Server Control"),
        Component.h("div", { className: "server-control" },
          Component.h("div", { className: "control-info" },
            isRunning
              ? Component.h("span", { className: "router-indicator success" }, "Router Active on Port " + (this.state.status?.port || 8080))
              : Component.h("span", { className: "router-indicator default" }, "Router is Not Running")
          ),
          Component.h("div", { className: "control-buttons" },
            isRunning
              ? Component.h("button", { className: "btn btn-danger", "data-action": "stop", disabled: this.state.loading }, this.state.loading ? "Stopping..." : "Stop Router")
              : Component.h("button", { className: "btn btn-primary", "data-action": "start", disabled: this.state.loading }, this.state.loading ? "Starting..." : "Start Router"),
            Component.h("button", { className: "btn btn-secondary", "data-action": "restart", disabled: this.state.loading || !isRunning }, "Restart")
          )
        )
      ),
      Component.h("div", { className: "dashboard-actions" },
        Component.h("button", { className: "btn btn-primary", "data-action": "refresh" }, "Refresh All"),
        Component.h("button", { className: "btn btn-secondary", onClick: () => window.router.navigate("/models") }, "Manage Models"),
        Component.h("button", { className: "btn btn-secondary", onClick: () => window.router.navigate("/settings") }, "Settings")
      )
    );
  }

  getEventMap() {
    return {
      "click [data-action=refresh]": () => this._refresh(),
      "click [data-action=start]": () => this._start(),
      "click [data-action=stop]": () => this._stop(),
      "click [data-action=restart]": () => this._restart(),
    };
  }

  async _refresh() {
    this.setState({ loading: true });
    try {
      await this._controller?.load();
      showNotification("Refreshed", "success");
    } catch (e) {
      showNotification("Refresh failed", "error");
    }
    this.setState({ loading: false });
  }

  async _start() {
    this.setState({ loading: true });
    try {
      await stateManager.startLlama();
      showNotification("Starting...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          this.setState({ status: s.status });
          const rs = await stateManager.getRouterStatus();
          this.setState({ routerStatus: rs.routerStatus, loading: false });
          showNotification("Router started", "success");
        } catch (e) {
          this.setState({ loading: false });
        }
      }, 3000);
    } catch (e) {
      showNotification("Failed: " + e.message, "error");
      this.setState({ loading: false });
    }
  }

  async _stop() {
    if (!confirm("Stop router?")) return;
    this.setState({ loading: true });
    try {
      await stateManager.stopLlama();
      this.setState({ status: { status: "idle" }, routerStatus: null, loading: false });
      showNotification("Router stopped", "success");
    } catch (e) {
      showNotification("Failed: " + e.message, "error");
      this.setState({ loading: false });
    }
  }

  async _restart() {
    this.setState({ loading: true });
    try {
      await stateManager.restartLlama();
      showNotification("Restarting...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          this.setState({ status: s.status });
          const rs = await stateManager.getRouterStatus();
          this.setState({ routerStatus: rs.routerStatus, loading: false });
          showNotification("Router restarted", "success");
        } catch (e) {
          this.setState({ loading: false });
        }
      }, 5000);
    } catch (e) {
      showNotification("Failed: " + e.message, "error");
      this.setState({ loading: false });
    }
  }

  _setController(c) {
    this._controller = c;
  }
}

class NotFoundController {
  render() {
    return Component.h("div", { className: "not-found-page" },
      Component.h("h1", {}, "404"),
      Component.h("p", {}, "Page not found"),
      Component.h("a", { href: "/", className: "btn btn-primary" }, "Go Home")
    );
  }
}

window.DashboardController = DashboardController;
window.DashboardPage = DashboardPage;
window.NotFoundController = NotFoundController;
