/**
 * Dashboard Page - Simplified
 */

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubs = [];
    this.comp = null;
  }

  init() {
    this.unsubs.push(
      stateManager.subscribe("models", m => this.comp?.setState({ models: m })),
      stateManager.subscribe("metrics", m => this.comp?.setState({ metrics: m })),
      stateManager.subscribe("llamaStatus", s => this.comp?.setState({ status: s }))
    );
    this.load();
  }

  async load() {
    try {
      const d = await stateManager.getModels();
      stateManager.set("models", d.models || []);
      const m = await stateManager.getMetrics();
      stateManager.set("metrics", m.metrics || null);
      const s = await stateManager.getLlamaStatus();
      stateManager.set("llamaStatus", s.status || null);
    } catch (e) { console.error("[Dashboard] Load error:", e); }
  }

  willUnmount() { this.unsubs.forEach(u => u()); this.unsubs = []; if (this.comp) this.comp.destroy(); }
  destroy() { this.willUnmount(); }

  render() {
    this.comp = new DashboardPage({ models: stateManager.get("models") || [], metrics: stateManager.get("metrics"), status: stateManager.get("llamaStatus") });
    this.init();
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    return el;
  }

  didMount() { this.comp?.didMount?.(); }
}

class DashboardPage extends Component {
  render() {
    const m = this.state.metrics || { cpu: { usage: 0 }, memory: { used: 0 }, disk: { used: 0 } };
    const s = this.state.status?.status || "idle";
    const running = (this.state.models || []).filter(x => x.status === "running").length;
    const total = (this.state.models || []).length;

    return Component.h("div", { className: "dashboard-page" },
      Component.h("div", { className: "dashboard-grid" },
        Component.h("div", { className: `card status-card ${s === "running" ? "running" : "idle"}` },
          Component.h("h3", {}, "Server Status"),
          Component.h("div", { className: "status-badge" }, s.toUpperCase())
        ),
        Component.h("div", { className: "card" },
          Component.h("h3", {}, "CPU"),
          Component.h("p", { className: "big-value" }, `${(m.cpu?.usage || 0).toFixed(1)}%`)
        ),
        Component.h("div", { className: "card" },
          Component.h("h3", {}, "Memory"),
          Component.h("p", { className: "big-value" }, window.AppUtils?.formatBytes?.(m.memory?.used || 0) || "0 B")
        ),
        Component.h("div", { className: "card" },
          Component.h("h3", {}, "Models"),
          Component.h("p", { className: "big-value" }, `${running}/${total}`)
        )
      ),
      Component.h("div", { className: "dashboard-actions" },
        Component.h("button", { className: "btn btn-primary", "data-action": "refresh" }, "Refresh"),
        Component.h("button", { className: "btn btn-secondary", onClick: () => window.router.navigate("/models") }, "Manage Models")
      )
    );
  }

  getEventMap() {
    return { "click [data-action=refresh]": () => stateManager.getModels() || stateManager.getMetrics() };
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
