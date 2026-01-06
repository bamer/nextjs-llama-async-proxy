/**
 * Monitoring Page - Simple and native
 */

class MonitoringController {
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
    this.comp = new MonitoringPage({});
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
      const d = await stateManager.getMetrics();
      if (this.comp) this.comp.setState({ metrics: d.metrics || null });
      const h = await stateManager.getMetricsHistory({ limit: 50 });
      if (this.comp) this.comp.setState({ history: h.history || [] });
    } catch (e) {
      console.log("[MONITORING] Load error:", e.message);
    }
  }
}

class MonitoringPage extends Component {
  constructor(props) {
    super(props);
    this.state = { metrics: null, history: [], tab: "cpu" };
  }

  render() {
    const m = this.state.metrics || { cpu: { usage: 0 }, memory: { used: 0 }, disk: { used: 0 }, uptime: 0 };
    const tabs = ["cpu", "memory", "disk"];

    return Component.h("div", { className: "monitoring-page" },
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
        // Cards
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
        // Chart
        Component.h("div", { className: "card chart-card" },
          Component.h("h3", {}, "Performance - " + this.state.tab.toUpperCase()),
          Component.h("div", { className: "chart" }, this._renderChart())
        ),
        // Health
        Component.h("div", { className: "card health-card" },
          Component.h("h3", {}, "System Health"),
          Component.h("div", { className: "status " + (this._healthy(m) ? "good" : "warning") },
            this._healthy(m) ? "All systems operational" : "Some systems need attention"
          )
        )
      )
    );
  }

  _fmtUptime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h + "h " + m + "m";
  }

  _healthy(m) {
    return !m || ((m.cpu?.usage || 0) <= 80 && (m.memory?.used || 0) <= 85 && (m.disk?.used || 0) <= 90);
  }

  _renderChart() {
    const data = this.state.history || [];
    if (data.length === 0) return Component.h("p", { className: "empty" }, "No data");

    const max = 100;
    const w = 800, h = 200, p = 20;
    const points = data.map((d, i) => {
      const val = d.cpu?.usage || 0;
      const x = p + (i / Math.max(data.length - 1, 1)) * (w - p * 2);
      const y = h - p - (val / max) * (h - p * 2);
      return x + "," + y;
    }).join(" ");

    return Component.h("svg", { viewBox: "0 0 " + w + " " + h, className: "line-chart" },
      Component.h("polyline", { fill: "none", stroke: "#3b82f6", "stroke-width": "2", points: points })
    );
  }

  getEventMap() {
    return {
      "click [data-tab]": (e, t) => this.setState({ tab: t.dataset.tab }),
      "click [data-action=refresh]": () => this._controller?.load(),
    };
  }

  _setController(c) {
    this._controller = c;
  }
}

window.MonitoringController = MonitoringController;
window.MonitoringPage = MonitoringPage;
