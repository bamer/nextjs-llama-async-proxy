/**
 * Monitoring Page - With Comprehensive Debug Logging
 */

class MonitoringController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    console.log("[MONITORING] MonitoringController constructor called");
  }

  init() {
    console.log("[MONITORING] MonitoringController.init() called");
  }

  willUnmount() {
    console.log("[MONITORING] MonitoringController.willUnmount() called");
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[MONITORING] MonitoringController.render() called - START");
    
    await this.load();
    
    const metrics = stateManager.get("metrics");
    const history = stateManager.get("metricsHistory") || [];
    
    console.log("[MONITORING] Metrics:", !!metrics, "History:", history.length);
    
    this.comp = new MonitoringPage({ metrics, history });
    
    console.log("[MONITORING] Calling component.render()");
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    
    console.log("[MONITORING] MonitoringController.render() - END");
    return el;
  }

  async load() {
    console.log("[MONITORING] MonitoringController.load() called");
    try {
      console.log("[MONITORING] Loading metrics...");
      const d = await stateManager.getMetrics();
      stateManager.set("metrics", d.metrics || null);
      console.log("[MONITORING] Metrics loaded:", !!d.metrics);
      
      console.log("[MONITORING] Loading history...");
      const h = await stateManager.getMetricsHistory({ limit: 50 });
      stateManager.set("metricsHistory", h.history || []);
      console.log("[MONITORING] History loaded:", h.history?.length || 0, "entries");
      
      console.log("[MONITORING] MonitoringController.load() - END");
    } catch (e) {
      console.log("[MONITORING] Load error:", e.message);
    }
  }
}

class MonitoringPage extends Component {
  constructor(props) {
    super(props);
    console.log("[MONITORING] MonitoringPage constructor called");
    console.log("[MONITORING] Props metrics:", !!props.metrics, "history:", props.history?.length);
    
    this.state = { metrics: props.metrics || null, history: props.history || [], tab: "cpu" };
    console.log("[MONITORING] State initialized");
  }

  render() {
    console.log("[MONITORING] MonitoringPage.render() called, tab:", this.state.tab);
    
    const m = this.state.metrics || { cpu: { usage: 0 }, memory: { used: 0 }, disk: { used: 0 }, uptime: 0 };
    const tabs = ["cpu", "memory", "disk"];
    
    console.log("[MONITORING] CPU:", m.cpu?.usage, "%, Memory:", m.memory?.used, "%, Disk:", m.disk?.used, "%");

    const result = Component.h("div", { className: "monitoring-page" },
      Component.h("div", { className: "toolbar" },
        Component.h("button", { className: "btn btn-secondary", "data-action": "refresh" }, "Refresh")
      ),
      Component.h("div", { className: "tabs" },
        tabs.map((t) => Component.h("button", {
          className: "tab " + (this.state.tab === t ? "active" : ""),
          "data-tab": t
        }, t.toUpperCase()))
      ),
      Component.h("div", { className: "monitoring-content" },
        Component.h("div", { className: "metric-cards" },
          Component.h("div", { className: "card color-" + (m.cpu?.usage > 80 ? "danger" : "success") },
            Component.h("span", { className: "icon" }, "💻"),
            Component.h("div", { className: "content" },
              Component.h("span", { className: "title" }, "CPU"),
              Component.h("span", { className: "value" }, (m.cpu?.usage || 0).toFixed(1) + "%")
            )
          ),
          Component.h("div", { className: "card color-info" },
            Component.h("span", { className: "icon" }, "🧠"),
            Component.h("div", { className: "content" },
              Component.h("span", { className: "title" }, "Memory"),
              Component.h("span", { className: "value" }, window.AppUtils?.formatBytes?.(m.memory?.used || 0) || "0 B")
            )
          ),
          Component.h("div", { className: "card color-" + (m.disk?.used > 80 ? "danger" : "info") },
            Component.h("span", { className: "icon" }, "💾"),
            Component.h("div", { className: "content" },
              Component.h("span", { className: "title" }, "Disk"),
              Component.h("span", { className: "value" }, (m.disk?.used || 0).toFixed(1) + "%")
            )
          ),
          Component.h("div", { className: "card color-success" },
            Component.h("span", { className: "icon" }, "⏱️"),
            Component.h("div", { className: "content" },
              Component.h("span", { className: "title" }, "Uptime"),
              Component.h("span", { className: "value" }, this._fmtUptime(m.uptime || 0))
            )
          )
        ),
        Component.h("div", { className: "card chart-card" },
          Component.h("h3", {}, "Performance - " + this.state.tab.toUpperCase()),
          Component.h("div", { className: "chart" }, this._renderChart())
        ),
        Component.h("div", { className: "card health-card" },
          Component.h("h3", {}, "System Health"),
          Component.h("div", { className: "status " + (this._healthy(m) ? "good" : "warning") },
            this._healthy(m) ? "All systems operational" : "Some systems need attention"
          )
        )
      )
    );
    
    console.log("[MONITORING] MonitoringPage.render() - END");
    return result;
  }

  _fmtUptime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    const result = h + "h " + m + "m";
    console.log("[MONITORING] _fmtUptime:", s, "->", result);
    return result;
  }

  _healthy(m) {
    const result = !m || ((m.cpu?.usage || 0) <= 80 && (m.memory?.used || 0) <= 85 && (m.disk?.used || 0) <= 90);
    console.log("[MONITORING] _healthy:", result);
    return result;
  }

  _renderChart() {
    const data = this.state.history || [];
    console.log("[MONITORING] _renderChart() - data points:", data.length);
    
    if (data.length === 0) {
      console.log("[MONITORING] No data for chart");
      return Component.h("p", { className: "empty" }, "No data");
    }

    const max = 100;
    const w = 800, h = 200, p = 20;
    const points = data.map((d, i) => {
      const val = d.cpu?.usage || 0;
      const x = p + (i / Math.max(data.length - 1, 1)) * (w - p * 2);
      const y = h - p - (val / max) * (h - p * 2);
      return x + "," + y;
    }).join(" ");

    console.log("[MONITORING] Chart points generated:", points.substring(0, 50) + "...");
    return Component.h("svg", { viewBox: "0 0 " + w + " " + h, className: "line-chart" },
      Component.h("polyline", { fill: "none", stroke: "#3b82f6", "stroke-width": "2", points: points })
    );
  }

  getEventMap() {
    console.log("[MONITORING] getEventMap() called");
    return {
      "click [data-tab]": (e, t) => {
        console.log("[MONITORING] Tab clicked:", t.dataset.tab);
        this.setState({ tab: t.dataset.tab });
      },
      "click [data-action=refresh]": () => {
        console.log("[MONITORING] Refresh clicked");
        this._controller?.load();
      },
    };
  }

  _setController(c) {
    console.log("[MONITORING] _setController() called");
    this._controller = c;
  }
}

window.MonitoringController = MonitoringController;
window.MonitoringPage = MonitoringPage;
console.log("[MONITORING] Monitoring module loaded");
