/**
 * Unified Dashboard Page
 * Combines Dashboard and Monitoring functionality
 */

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.chartInterval = null;
  }

  init() {}

  willUnmount() {
    if (this.chartInterval) {
      clearInterval(this.chartInterval);
    }
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    try {
      await this.load();

      const models = stateManager.get("models") || [];
      const metrics = stateManager.get("metrics");
      const status = stateManager.get("llamaStatus");
      const routerStatus = stateManager.get("routerStatus");
      const config = stateManager.get("config") || {};
      const history = stateManager.get("metricsHistory") || [];

      this.comp = new DashboardPage({ models, metrics, status, routerStatus, config, history });

      const el = this.comp.render();

      this.comp._el = el;
      this.comp._controller = this;
      el._component = this.comp;

      this.comp.bindEvents();

      // Initialize real-time chart updates
      setTimeout(() => {
        this._initChartUpdates();
      }, 1000);

      return el;
    } catch (e) {
      console.error("[DASHBOARD] RENDER ERROR:", e.message);
      throw e;
    }
  }

  _initChartUpdates() {
    // Update charts every 3 seconds
    this.chartInterval = setInterval(async () => {
      try {
        const d = await stateManager.getMetrics();
        const h = await stateManager.getMetricsHistory({ limit: 60 });
        stateManager.set("metrics", d.metrics || null);
        stateManager.set("metricsHistory", h.history || []);

        if (this.comp) {
          this.comp.updateCharts(d.metrics || null, h.history || []);
        }
      } catch (e) {
        // Silently handle update errors
      }
    }, 3000);
  }

  async load() {
    try {
      const c = await stateManager.getConfig();
      stateManager.set("config", c.config || {});

      const d = await stateManager.getModels();
      stateManager.set("models", d.models || []);

      const m = await stateManager.getMetrics();
      stateManager.set("metrics", m.metrics || null);

      const h = await stateManager.getMetricsHistory({ limit: 60 });
      stateManager.set("metricsHistory", h.history || []);

      const s = await stateManager.getLlamaStatus();
      stateManager.set("llamaStatus", s.status || null);

      if (s.status?.status === "running") {
        try {
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
        } catch (e) {
          // Router status not available
        }
      }
    } catch (e) {
      console.error("[DASHBOARD] Load error:", e.message);
    }
  }
}

class DashboardPage extends Component {
  constructor(props) {
    super(props);

    const config = props.config || {};
    const metrics = props.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      gpu: null,
      disk: { used: 0 },
      uptime: 0,
    };
    const gpuMetrics = metrics.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0 };

    this.state = {
      models: props.models || [],
      metrics: metrics,
      gpuMetrics: gpuMetrics,
      status: props.status || null,
      routerStatus: props.routerStatus || null,
      configPort: config.port || 8080,
      history: props.history || [],
      loading: false,
      chartType: "cpu",
    };
  }

  didMount() {
    this.unsubscribers = [];
    this.unsubscribers.push(
      stateManager.subscribe("llamaStatus", (status) => {
        this.setState({ status });
      })
    );
    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        this.setState({ routerStatus: rs });
      })
    );
    this.unsubscribers.push(
      stateManager.subscribe("metrics", (metrics) => {
        const gpuMetrics = metrics?.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0 };
        this.setState({ metrics, gpuMetrics });
      })
    );
  }

  willDestroy() {
    this.unsubscribers?.forEach((unsub) => unsub());
  }

  updateCharts(metrics, history) {
    this.setState({ metrics: metrics || this.state.metrics, history });
  }

  _fmtUptime(s) {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);

    if (d > 0) {
      return `${d}d ${h}h ${m}m`;
    }
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  }

  _getHealthStatus(metrics) {
    const cpuOk = (metrics?.cpu?.usage || 0) <= 80;
    const memoryOk = (metrics?.memory?.used || 0) <= 85;
    const diskOk = (metrics?.disk?.used || 0) <= 90;
    const gpuOk = !metrics?.gpu || (metrics.gpu.usage || 0) <= 85;

    if (cpuOk && memoryOk && diskOk && gpuOk) {
      return {
        status: "good",
        message: "All systems operational",
        checks: { cpuOk, memoryOk, diskOk, gpuOk },
      };
    }
    return {
      status: "warning",
      message: "Some systems need attention",
      checks: { cpuOk, memoryOk, diskOk, gpuOk },
    };
  }

  _renderStatsGrid() {
    const m = this.state.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      disk: { used: 0 },
      uptime: 0,
    };
    const gpu = this.state.gpuMetrics || { usage: 0, memoryUsed: 0, memoryTotal: 0 };
    const isRunning = this.state.status?.status === "running";
    const routerModels = this.state.routerStatus?.models || [];
    const loadedCount = routerModels.filter((x) => x.state === "loaded").length;

    return Component.h(
      "div",
      { className: "stats-grid" },
      // CPU Card
      Component.h(
        "div",
        { className: `stat-card ${m.cpu?.usage > 80 ? "warning" : "good"}` },
        Component.h("div", { className: "stat-icon" }, "🖥️"),
        Component.h(
          "div",
          { className: "stat-content" },
          Component.h("span", { className: "stat-label" }, "CPU Usage"),
          Component.h("span", { className: "stat-value" }, `${(m.cpu?.usage || 0).toFixed(1)}%`),
          Component.h(
            "div",
            { className: "stat-bar" },
            Component.h("div", {
              className: "stat-bar-fill",
              style: `width: ${Math.min(m.cpu?.usage || 0, 100)}%`,
            })
          )
        )
      ),
      // Memory Card
      Component.h(
        "div",
        { className: `stat-card ${m.memory?.used > 85 ? "warning" : "good"}` },
        Component.h("div", { className: "stat-icon" }, "🧠"),
        Component.h(
          "div",
          { className: "stat-content" },
          Component.h("span", { className: "stat-label" }, "Memory"),
          Component.h(
            "span",
            { className: "stat-value" },
            window.AppUtils?.formatBytes?.(m.memory?.used || 0) || "0 B"
          ),
          Component.h(
            "div",
            { className: "stat-bar" },
            Component.h("div", {
              className: "stat-bar-fill",
              style: `width: ${Math.min(m.memory?.used || 0, 100)}%`,
            })
          )
        )
      ),
      // GPU Card
      Component.h(
        "div",
        { className: `stat-card ${(gpu?.usage || 0) > 85 ? "warning" : "good"}` },
        Component.h("div", { className: "stat-icon" }, "🎮"),
        Component.h(
          "div",
          { className: "stat-content" },
          Component.h("span", { className: "stat-label" }, "GPU Usage"),
          Component.h("span", { className: "stat-value" }, `${(gpu?.usage || 0).toFixed(1)}%`),
          Component.h(
            "div",
            { className: "stat-bar" },
            Component.h("div", {
              className: "stat-bar-fill gpu",
              style: `width: ${Math.min(gpu?.usage || 0, 100)}%`,
            })
          )
        )
      ),
      // GPU Memory Card
      Component.h(
        "div",
        { className: "stat-card" },
        Component.h("div", { className: "stat-icon" }, "💾"),
        Component.h(
          "div",
          { className: "stat-content" },
          Component.h("span", { className: "stat-label" }, "GPU Memory"),
          Component.h(
            "span",
            { className: "stat-value" },
            gpu?.memoryTotal > 0
              ? `${window.AppUtils?.formatBytes?.(gpu?.memoryUsed || 0) || "0 B"} / ${window.AppUtils?.formatBytes?.(gpu?.memoryTotal || 0) || "0 B"}`
              : "N/A"
          ),
          gpu?.memoryTotal > 0 &&
            Component.h(
              "div",
              { className: "stat-bar" },
              Component.h("div", {
                className: "stat-bar-fill gpu",
                style: `width: ${(((gpu?.memoryUsed || 0) / (gpu?.memoryTotal || 1)) * 100).toFixed(1)}%`,
              })
            )
        )
      ),
      // Disk Card
      Component.h(
        "div",
        { className: `stat-card ${m.disk?.used > 90 ? "warning" : "good"}` },
        Component.h("div", { className: "stat-icon" }, "💿"),
        Component.h(
          "div",
          { className: "stat-content" },
          Component.h("span", { className: "stat-label" }, "Disk Usage"),
          Component.h("span", { className: "stat-value" }, `${(m.disk?.used || 0).toFixed(1)}%`),
          Component.h(
            "div",
            { className: "stat-bar" },
            Component.h("div", {
              className: "stat-bar-fill",
              style: `width: ${Math.min(m.disk?.used || 0, 100)}%`,
            })
          )
        )
      ),
      // Uptime Card
      Component.h(
        "div",
        { className: "stat-card" },
        Component.h("div", { className: "stat-icon" }, "⏱️"),
        Component.h(
          "div",
          { className: "stat-content" },
          Component.h("span", { className: "stat-label" }, "Uptime"),
          Component.h("span", { className: "stat-value" }, this._fmtUptime(m.uptime || 0))
        )
      )
    );
  }

  _renderCharts() {
    const history = this.state.history || [];
    const chartType = this.state.chartType;

    return Component.h(
      "div",
      { className: "charts-section" },
      Component.h(
        "div",
        { className: "charts-header" },
        Component.h("h3", {}, "Performance History"),
        Component.h(
          "div",
          { className: "chart-tabs" },
          Component.h(
            "button",
            {
              className: `chart-tab ${chartType === "cpu" ? "active" : ""}`,
              "data-chart": "cpu",
            },
            "CPU"
          ),
          Component.h(
            "button",
            {
              className: `chart-tab ${chartType === "gpu" ? "active" : ""}`,
              "data-chart": "gpu",
            },
            "GPU"
          )
        )
      ),
      Component.h(
        "div",
        { className: "chart-container" },
        history.length > 0
          ? this._renderChart(history, chartType)
          : Component.h(
              "div",
              { className: "chart-empty" },
              Component.h("div", { className: "empty-icon" }, "📈"),
              Component.h("p", {}, "Collecting performance data..."),
              Component.h(
                "p",
                { className: "empty-hint" },
                "Data will appear once metrics are collected"
              )
            )
      ),
      Component.h(
        "div",
        { className: "chart-stats" },
        Component.h(
          "div",
          { className: "chart-stat" },
          Component.h("span", { className: "chart-stat-label" }, "Current"),
          Component.h(
            "span",
            { className: "chart-stat-value" },
            `${this._getCurrentValue(history, chartType).toFixed(1)}%`
          )
        ),
        Component.h(
          "div",
          { className: "chart-stat" },
          Component.h("span", { className: "chart-stat-label" }, "Avg"),
          Component.h(
            "span",
            { className: "chart-stat-value" },
            `${this._getAvgValue(history, chartType).toFixed(1)}%`
          )
        ),
        Component.h(
          "div",
          { className: "chart-stat" },
          Component.h("span", { className: "chart-stat-label" }, "Max"),
          Component.h(
            "span",
            { className: "chart-stat-value" },
            `${this._getMaxValue(history, chartType).toFixed(1)}%`
          )
        )
      )
    );
  }

  _getCurrentValue(history, type) {
    if (history.length === 0) return 0;
    const last = history[history.length - 1];
    return type === "gpu" ? last.gpu?.usage || 0 : last.cpu?.usage || 0;
  }

  _getAvgValue(history, type) {
    if (history.length === 0) return 0;
    const values = history.map((h) => (type === "gpu" ? h.gpu?.usage || 0 : h.cpu?.usage || 0));
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  _getMaxValue(history, type) {
    if (history.length === 0) return 0;
    const values = history.map((h) => (type === "gpu" ? h.gpu?.usage || 0 : h.cpu?.usage || 0));
    return Math.max(...values);
  }

  _renderChart(data, type) {
    const max = 100;
    const width = 800;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map((d) => (type === "gpu" ? d.gpu?.usage || 0 : d.cpu?.usage || 0));

    // Generate smooth curve points
    const points = values.map((val, i) => {
      const x = padding.left + (i / Math.max(values.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - (val / max) * chartHeight;
      return { x, y, val };
    });

    // Create smooth SVG path
    const pathD = this._createSmoothPath(points, chartWidth, chartHeight);

    // Generate grid lines
    const gridLines = [0, 25, 50, 75, 100].map((tick) => {
      const y = padding.top + chartHeight - (tick / max) * chartHeight;
      return Component.h(
        "g",
        { key: `grid-${tick}` },
        Component.h("line", {
          x1: padding.left,
          y1: y,
          x2: width - padding.right,
          y2: y,
          stroke: "var(--gray-200)",
        }),
        Component.h(
          "text",
          {
            x: padding.left - 8,
            y: y + 4,
            fill: "var(--gray-400)",
            "text-anchor": "end",
            "font-size": "11",
          },
          `${tick}%`
        )
      );
    });

    // Generate area fill
    const areaD = `${pathD} L${padding.left + chartWidth},${padding.top + chartHeight} L${padding.left},${padding.top + chartHeight} Z`;

    return Component.h(
      "div",
      { className: "chart-wrapper" },
      Component.h(
        "svg",
        { viewBox: `0 0 ${width} ${height}`, className: "modern-chart" },
        Component.h(
          "defs",
          {},
          Component.h(
            "linearGradient",
            {
              id: `chartGradient-${type}`,
              x1: "0%",
              y1: "0%",
              x2: "0%",
              y2: "100%",
            },
            Component.h("stop", {
              offset: "0%",
              "stop-color": "var(--primary)",
              "stop-opacity": 0.3,
            }),
            Component.h("stop", {
              offset: "100%",
              "stop-color": "var(--primary)",
              "stop-opacity": 0,
            })
          )
        ),
        gridLines,
        Component.h("path", {
          d: areaD,
          fill: `url(#chartGradient-${type})`,
        }),
        Component.h("path", {
          d: pathD,
          fill: "none",
          stroke: "var(--primary)",
          "stroke-width": "2.5",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }),
        // Add dots for last few data points
        points.slice(-10).map((p, i) =>
          Component.h("circle", {
            key: i,
            cx: p.x,
            cy: p.y,
            r: i === points.slice(-10).length - 1 ? 5 : 0,
            fill: "var(--primary)",
            stroke: "#fff",
            "stroke-width": 2,
          })
        )
      )
    );
  }

  _createSmoothPath(points, chartWidth, chartHeight) {
    if (points.length < 2) return "";

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const tension = 0.3;

      const cp1x = prev.x + (curr.x - prev.x) * tension;
      const cp1y = prev.y;
      const cp2x = curr.x - (curr.x - prev.x) * tension;
      const cp2y = curr.y;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }

    return path;
  }

  _renderSystemHealth() {
    const m = this.state.metrics || { cpu: { usage: 0 }, memory: { used: 0 }, disk: { used: 0 } };
    const gpu = this.state.gpuMetrics || { usage: 0 };
    const health = this._getHealthStatus(m);

    const checks = [
      {
        name: "CPU Usage",
        ok: health.checks.cpuOk,
        value: `${(m.cpu?.usage || 0).toFixed(1)}%`,
        limit: "80%",
      },
      {
        name: "Memory Usage",
        ok: health.checks.memoryOk,
        value: `${(m.memory?.used || 0).toFixed(1)}%`,
        limit: "85%",
      },
      {
        name: "Disk Usage",
        ok: health.checks.diskOk,
        value: `${(m.disk?.used || 0).toFixed(1)}%`,
        limit: "90%",
      },
      {
        name: "GPU Usage",
        ok: health.checks.gpuOk,
        value: `${(gpu?.usage || 0).toFixed(1)}%`,
        limit: "85%",
      },
    ];

    return Component.h(
      "div",
      { className: "health-section" },
      Component.h("h3", {}, "System Health"),
      Component.h(
        "div",
        { className: `health-status ${health.status}` },
        Component.h("div", { className: "health-icon" }, health.status === "good" ? "✓" : "⚠"),
        Component.h("span", { className: "health-message" }, health.message)
      ),
      Component.h(
        "div",
        { className: "health-checks" },
        checks.map((check) =>
          Component.h(
            "div",
            { key: check.name, className: `health-check ${check.ok ? "ok" : "warning"}` },
            Component.h(
              "div",
              { className: "check-info" },
              Component.h("span", { className: "check-name" }, check.name),
              Component.h("span", { className: "check-value" }, check.value)
            ),
            Component.h(
              "div",
              { className: "check-indicator" },
              check.ok
                ? Component.h("span", { className: "indicator-good" }, "✓")
                : Component.h("span", { className: "indicator-warning" }, `⚠ Limit: ${check.limit}`)
            )
          )
        )
      )
    );
  }

  render() {
    const isRunning = this.state.status?.status === "running";
    const displayPort = this.state.status?.port || this.state.configPort || 8080;
    const routerModels = this.state.routerStatus?.models || [];
    const loadedCount = routerModels.filter((x) => x.state === "loaded").length;

    return Component.h(
      "div",
      { className: "dashboard-page unified" },
      // Router Status & Control Section
      Component.h(
        "div",
        { className: "router-section" },
        Component.h(
          "div",
          { className: `router-card ${isRunning ? "running" : "idle"}` },
          Component.h(
            "div",
            { className: "router-header" },
            Component.h(
              "div",
              { className: "router-title" },
              Component.h("h3", {}, "🦙 Llama Router"),
              Component.h(
                "span",
                { className: `status-badge ${isRunning ? "running" : "idle"}` },
                isRunning ? "RUNNING" : "STOPPED"
              )
            ),
            isRunning &&
              Component.h(
                "div",
                { className: "router-info" },
                Component.h("span", { className: "info-item" }, `Port: ${displayPort}`),
                Component.h(
                  "span",
                  { className: "info-item" },
                  `Models: ${loadedCount}/${this.state.models.length} loaded`
                )
              )
          ),
          Component.h(
            "div",
            { className: "router-controls" },
            isRunning
              ? Component.h(
                  "button",
                  { className: "btn btn-danger", "data-action": "stop" },
                  "⏹ Stop Router"
                )
              : Component.h(
                  "button",
                  { className: "btn btn-primary", "data-action": "start" },
                  "▶ Start Router"
                ),
            Component.h(
              "button",
              {
                className: "btn btn-secondary",
                "data-action": "restart",
                disabled: !isRunning,
              },
              "🔄 Restart"
            )
          )
        )
      ),
      // Stats Grid
      this._renderStatsGrid(),
      // Charts Section
      Component.h(
        "div",
        { className: "content-row" },
        this._renderCharts(),
        this._renderSystemHealth()
      ),
      // Action Buttons
      Component.h(
        "div",
        { className: "actions-section" },
        Component.h("h3", {}, "Quick Actions"),
        Component.h(
          "div",
          { className: "action-buttons" },
          Component.h(
            "button",
            { className: "btn btn-primary", "data-action": "refresh" },
            "🔃 Refresh All"
          ),
          Component.h(
            "button",
            { className: "btn btn-secondary", onClick: () => window.router.navigate("/models") },
            "📁 Manage Models"
          ),
          Component.h(
            "button",
            { className: "btn btn-secondary", onClick: () => window.router.navigate("/settings") },
            "⚙️ Settings"
          ),
          Component.h(
            "button",
            { className: "btn btn-secondary", onClick: () => window.router.navigate("/logs") },
            "📋 Logs"
          )
        )
      )
    );
  }

  getEventMap() {
    return {
      "click [data-action=refresh]": "handleRefresh",
      "click [data-action=start]": "handleStart",
      "click [data-action=stop]": "handleStop",
      "click [data-action=restart]": "handleRestart",
      "click [data-chart]": "handleChartTab",
    };
  }

  handleChartTab(event) {
    const tab = event.target.closest("[data-chart]");
    if (tab) {
      this.setState({ chartType: tab.dataset.chart });
    }
  }

  handleRefresh(event) {
    event.preventDefault();
    this._refresh();
  }

  handleStart(event) {
    event.preventDefault();
    this._start();
  }

  handleStop(event) {
    event.preventDefault();
    this._stop();
  }

  handleRestart(event) {
    event.preventDefault();
    this._restart();
  }

  async _refresh() {
    this.setState({ loading: true });
    try {
      await this._controller?.load();
      showNotification("Dashboard refreshed", "success");
    } catch (e) {
      showNotification("Refresh failed", "error");
    }
    this.setState({ loading: false });
  }

  async _start() {
    this.setState({ loading: true });
    try {
      await stateManager.startLlama();
      showNotification("Starting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaStatus", s.status || null);
          this.setState({ status: s.status });
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          this.setState({ routerStatus: rs.routerStatus, loading: false });
          showNotification("Router started successfully", "success");
        } catch (e) {
          this.setState({ loading: false });
        }
      }, 3000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      this.setState({ loading: false });
    }
  }

  async _stop() {
    if (!confirm("Stop router?")) return;
    this.setState({ loading: true });
    try {
      await stateManager.stopLlama();
      stateManager.set("llamaStatus", { status: "idle", port: null });
      stateManager.set("routerStatus", null);
      this.setState({ status: { status: "idle", port: null }, routerStatus: null, loading: false });
      showNotification("Router stopped", "success");
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      this.setState({ loading: false });
    }
  }

  async _restart() {
    this.setState({ loading: true });
    try {
      await stateManager.restartLlama();
      showNotification("Restarting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaStatus", s.status || null);
          this.setState({ status: s.status });
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          this.setState({ routerStatus: rs.routerStatus, loading: false });
          showNotification("Router restarted", "success");
        } catch (e) {
          this.setState({ loading: false });
        }
      }, 5000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      this.setState({ loading: false });
    }
  }

  _setController(c) {
    this._controller = c;
  }
}

class NotFoundController {
  render() {
    return Component.h(
      "div",
      { className: "not-found-page" },
      Component.h("h1", {}, "404"),
      Component.h("p", {}, "Page not found"),
      Component.h("a", { href: "/", className: "btn btn-primary" }, "Go Home")
    );
  }
}

window.DashboardController = DashboardController;
window.DashboardPage = DashboardPage;
window.NotFoundController = NotFoundController;
