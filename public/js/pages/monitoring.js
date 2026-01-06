/**
 * Monitoring Page - Simplified
 */

class MonitoringController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.unsubs = [];
    this.comp = null;
  }

  init() {
    this.unsubs.push(
      stateManager.subscribe("metrics", m => this.comp && this.comp.setState({ metrics: m })),
      stateManager.subscribe("metricsHistory", h => this.comp && this.comp.setState({ history: h }))
    );
    this.load();
  }

  async load() {
    try {
      const d = await stateManager.getMetrics();
      stateManager.set("metrics", d.metrics || null);
      const h = await stateManager.getMetricsHistory({ limit: 100 });
      stateManager.set("metricsHistory", h.history || []);
    } catch (e) { console.error("[Monitoring] Load error:", e); }
  }

  willUnmount() { this.unsubs.forEach(u => u()); this.unsubs = []; if (this.comp) this.comp.destroy(); }
  destroy() { this.willUnmount(); }

  render() {
    this.comp = new MonitoringPage({ metrics: stateManager.get("metrics"), history: stateManager.get("metricsHistory") || [] });
    this.init();
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    return el;
  }

  didMount() { this.comp?.didMount?.(); }
}

class MonitoringPage extends Component {
  constructor(props) {
    super(props);
    this.state = { metrics: props.metrics, history: props.history || [], tab: "overview" };
  }

  render() {
    const tabs = ["overview", "cpu", "memory", "gpu"];
    return Component.h("div", { className: "monitoring-page" },
      Component.h("div", { className: "toolbar" },
        Component.h("select", { className: "time-select", "data-action": "time" },
          Component.h("option", { value: "1h" }, "Last Hour"),
          Component.h("option", { value: "24h" }, "Last 24h")
        ),
        Component.h("button", { className: "btn btn-secondary", "data-action": "refresh" }, "Refresh")
      ),
      Component.h("div", { className: "tabs" },
        tabs.map(t =>
          Component.h("button", {
            className: `tab ${  this.state.tab === t ? "active" : ""}`,
            "data-tab": t
          }, t.toUpperCase())
        )
      ),
      Component.h("div", { className: "monitoring-content" },
        Component.h(MetricCards, { metrics: this.state.metrics }),
        Component.h(PerformanceChart, { data: this.state.history, metric: this.state.tab }),
        Component.h(SystemHealth, { metrics: this.state.metrics })
      )
    );
  }

  getEventMap() {
    return {
      "click [data-tab]": (e, t) => this.setState({ tab: t.dataset.tab }),
      "click [data-action=refresh]": () => { stateManager.getMetrics(); stateManager.getMetricsHistory({ limit: 100 }); }
    };
  }
}

class MetricCards extends Component {
  render() {
    const m = this.props.metrics || { cpu: { usage: 0 }, memory: { used: 0 }, disk: { used: 0 }, uptime: 0 };
    const cards = [
      { title: "CPU", val: `${(m.cpu?.usage || 0).toFixed(1)  }%`, icon: "💻", color: m.cpu?.usage > 80 ? "danger" : "success" },
      { title: "Memory", val: window.AppUtils?.formatBytes?.(m.memory?.used || 0) || "0 B", icon: "🧠", color: "info" },
      { title: "Disk", val: `${(m.disk?.used || 0).toFixed(1)  }%`, icon: "💾", color: m.disk?.used > 80 ? "danger" : "info" },
      { title: "Uptime", val: this._fmtUptime(m.uptime || 0), icon: "⏱️", color: "success" }
    ];
    if (m.gpu) {
      cards.push({ title: "GPU Memory", val: window.AppUtils?.formatBytes?.(m.gpu.memoryUsed || 0) || "0 B", icon: "🎮", color: "info" });
      cards.push({ title: "GPU Usage", val: `${(m.gpu.usage || 0).toFixed(1)  }%`, icon: "🎯", color: m.gpu.usage > 80 ? "danger" : "info" });
    }

    return Component.h("div", { className: "metric-cards" },
      cards.map(c => Component.h("div", { className: `card color-${  c.color}` },
        Component.h("span", { className: "icon" }, c.icon),
        Component.h("div", { className: "content" },
          Component.h("span", { className: "title" }, c.title),
          Component.h("span", { className: "value" }, c.val)
        )
      ))
    );
  }

  _fmtUptime(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h  }h ${  m  }m`;
  }
}

class PerformanceChart extends Component {
  render() {
    const data = this.state.data || [];
    return Component.h("div", { className: "card chart-card" },
      Component.h("h3", {}, `Performance - ${  this.state.metric?.toUpperCase() || "CPU"}`),
      Component.h("div", { className: "chart" },
        data.length > 0 ? Component.h("svg", { viewBox: "0 0 800 200", className: "line-chart" },
          Component.h("polyline", {
            fill: "none", stroke: "#3b82f6", "stroke-width": "2",
            points: this._getPoints()
          })
        ) : Component.h("p", { className: "empty" }, "No data")
      )
    );
  }

  _getPoints() {
    const data = this.state.data || [];
    if (data.length < 2) return "";
    const max = Math.max(...data.map(d => this._val(d))) || 100;
    const w = 800, h = 200, p = 20;
    return data.map((d, i) => {
      const x = p + (i / (data.length - 1)) * (w - p * 2);
      const y = h - p - (this._val(d) / max) * (h - p * 2);
      return `${x  },${  y}`;
    }).join(" ");
  }

  _val(d) {
    const m = this.state.metric;
    if (m === "cpu") return d.cpu?.usage || 0;
    if (m === "memory") return d.memory?.used || 0;
    if (m === "disk") return d.disk?.used || 0;
    return d.cpu?.usage || 0;
  }
}

class SystemHealth extends Component {
  render() {
    const m = this.props.metrics;
    const healthy = this._check(m);
    return Component.h("div", { className: "card health-card" },
      Component.h("h3", {}, "System Health"),
      Component.h("div", { className: `status ${  healthy ? "good" : "warning"}` },
        healthy ? "✓ All systems operational" : "⚠ Some systems need attention"
      ),
      Component.h("div", { className: "checks" },
        this._checkItem("CPU", m?.cpu?.usage, 80),
        this._checkItem("Memory", m?.memory?.used, 85),
        this._checkItem("Disk", m?.disk?.used, 90)
      )
    );
  }

  _check(m) { return !m || (m.cpu?.usage || 0) <= 80 && (m.memory?.used || 0) <= 85 && (m.disk?.used || 0) <= 90; }
  _checkItem(name, val, thresh) {
    const ok = (val || 0) <= thresh;
    return Component.h("div", { className: `check ${  ok ? "good" : "warning"}` },
      Component.h("span", {}, name),
      Component.h("span", {}, `${typeof val === "number" ? val.toFixed(1) : val  }%`),
      Component.h("span", {}, ok ? "✓" : "⚠")
    );
  }
}

window.MonitoringController = MonitoringController;
window.MonitoringPage = MonitoringPage;
window.MetricCards = MetricCards;
window.PerformanceChart = PerformanceChart;
window.SystemHealth = SystemHealth;
