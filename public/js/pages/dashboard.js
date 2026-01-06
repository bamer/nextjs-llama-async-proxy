/**
 * Dashboard Page - With Comprehensive Debug Logging
 */

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    console.log("[DASHBOARD] DashboardController constructor called");
  }

  init() {
    console.log("[DASHBOARD] DashboardController.init() called");
  }

  willUnmount() {
    console.log("[DASHBOARD] DashboardController.willUnmount() called");
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[DASHBOARD] DashboardController.render() called - START");
    
    await this.load();
    
    const models = stateManager.get("models") || [];
    const metrics = stateManager.get("metrics");
    const status = stateManager.get("llamaStatus");
    const routerStatus = stateManager.get("routerStatus");
    
    console.log("[DASHBOARD] Models:", models.length, "Metrics:", !!metrics, "Status:", status?.status, "Router:", !!routerStatus);
    
    this.comp = new DashboardPage({ models, metrics, status, routerStatus });
    
    console.log("[DASHBOARD] Calling component.render()");
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    
    console.log("[DASHBOARD] DashboardController.render() - END");
    return el;
  }

  async load() {
    console.log("[DASHBOARD] DashboardController.load() called");
    try {
      console.log("[DASHBOARD] Loading models...");
      const d = await stateManager.getModels();
      stateManager.set("models", d.models || []);
      console.log("[DASHBOARD] Loaded", d.models?.length, "models");
      
      console.log("[DASHBOARD] Loading metrics...");
      const m = await stateManager.getMetrics();
      stateManager.set("metrics", m.metrics || null);
      console.log("[DASHBOARD] Metrics loaded:", !!m.metrics);
      
      console.log("[DASHBOARD] Loading llama status...");
      const s = await stateManager.getLlamaStatus();
      stateManager.set("llamaStatus", s.status || null);
      console.log("[DASHBOARD] Llama status:", s.status?.status || "none");
      
      if (s.status?.status === "running") {
        try {
          console.log("[DASHBOARD] Loading router status...");
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          console.log("[DASHBOARD] Router status loaded:", rs.routerStatus?.status);
        } catch (e) {
          console.log("[DASHBOARD] Could not get router status:", e.message);
        }
      }
      console.log("[DASHBOARD] DashboardController.load() - END");
    } catch (e) {
      console.log("[DASHBOARD] Load error:", e.message);
    }
  }
}

class DashboardPage extends Component {
  constructor(props) {
    super(props);
    console.log("[DASHBOARD] DashboardPage constructor called");
    console.log("[DASHBOARD] Props models:", props.models?.length);
    
    this.state = {
      models: props.models || [],
      metrics: props.metrics || null,
      status: props.status || null,
      routerStatus: props.routerStatus || null,
      loading: false,
    };
    console.log("[DASHBOARD] State initialized");
  }

  render() {
    console.log("[DASHBOARD] DashboardPage.render() called");
    
    const m = this.state.metrics || { cpu: { usage: 0 }, memory: { used: 0 } };
    const s = this.state.status?.status || "idle";
    const isRunning = s === "running";
    const routerModels = this.state.routerStatus?.models || [];
    const loadedCount = routerModels.filter((x) => x.state === "loaded").length;
    
    console.log("[DASHBOARD] Status:", s, "Running:", isRunning, "Loaded models:", loadedCount);

    const result = Component.h("div", { className: "dashboard-page" },
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
    
    console.log("[DASHBOARD] DashboardPage.render() - END");
    return result;
  }

  getEventMap() {
    console.log("[DASHBOARD] getEventMap() called");
    return {
      "click [data-action=refresh]": () => this._refresh(),
      "click [data-action=start]": () => this._start(),
      "click [data-action=stop]": () => this._stop(),
      "click [data-action=restart]": () => this._restart(),
    };
  }

  async _refresh() {
    console.log("[DASHBOARD] _refresh() called");
    this.setState({ loading: true });
    try {
      await this._controller?.load();
      console.log("[DASHBOARD] Refresh completed");
      showNotification("Refreshed", "success");
    } catch (e) {
      console.log("[DASHBOARD] Refresh error:", e.message);
      showNotification("Refresh failed", "error");
    }
    this.setState({ loading: false });
  }

  async _start() {
    console.log("[DASHBOARD] _start() called");
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
          console.log("[DASHBOARD] Start callback error:", e.message);
          this.setState({ loading: false });
        }
      }, 3000);
    } catch (e) {
      console.log("[DASHBOARD] Start error:", e.message);
      showNotification("Failed: " + e.message, "error");
      this.setState({ loading: false });
    }
  }

  async _stop() {
    console.log("[DASHBOARD] _stop() called");
    if (!confirm("Stop router?")) return;
    this.setState({ loading: true });
    try {
      await stateManager.stopLlama();
      this.setState({ status: { status: "idle" }, routerStatus: null, loading: false });
      showNotification("Router stopped", "success");
    } catch (e) {
      console.log("[DASHBOARD] Stop error:", e.message);
      showNotification("Failed: " + e.message, "error");
      this.setState({ loading: false });
    }
  }

  async _restart() {
    console.log("[DASHBOARD] _restart() called");
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
          console.log("[DASHBOARD] Restart callback error:", e.message);
          this.setState({ loading: false });
        }
      }, 5000);
    } catch (e) {
      console.log("[DASHBOARD] Restart error:", e.message);
      showNotification("Failed: " + e.message, "error");
      this.setState({ loading: false });
    }
  }

  _setController(c) {
    console.log("[DASHBOARD] _setController() called");
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
console.log("[DASHBOARD] Dashboard module loaded");
