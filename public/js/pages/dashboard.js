/**
 * Unified Dashboard Page with Chart.js
 * Combines Dashboard and Monitoring functionality
 */

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.chartUpdateInterval = null;
  }

  init() {}

  willUnmount() {
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval);
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

      this.comp = new DashboardPage({
        models,
        metrics,
        status,
        routerStatus,
        config,
        history,
        controller: this,
      });

      const el = this.comp.render();

      this.comp._el = el;
      el._component = this.comp;

      this.comp.bindEvents();

      // Initialize charts after DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.comp.initCharts();
          this._startChartUpdates();
        }, 50);
      });

      return el;
    } catch (e) {
      console.error("[DASHBOARD] RENDER ERROR:", e.message);
      throw e;
    }
  }

  _startChartUpdates() {
    this.chartUpdateInterval = setInterval(async () => {
      try {
        const d = await stateManager.getMetrics();
        const h = await stateManager.getMetricsHistory({ limit: 60 });
        stateManager.set("metrics", d.metrics || null);
        stateManager.set("metricsHistory", h.history || []);

        if (this.comp) {
          this.comp.updateChartsDirectly(d.metrics || null, h.history || []);
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

    // Chart instances stored as instance variables
    this.cpuChart = null;
    this.gpuChart = null;
    this.chartsReady = false;

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
      chartStats: this._calculateStats(props.history || []),
    };
  }

  _calculateStats(history) {
    if (history.length === 0) {
      return { current: 0, avg: 0, max: 0 };
    }
    const values = history.map((h) => h.cpu?.usage || 0);
    const current = values[values.length - 1] || 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    return { current, avg, max };
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
  }

  willDestroy() {
    this.destroyCharts();
    this.unsubscribers?.forEach((unsub) => unsub());
  }

  destroyCharts() {
    if (this.cpuChart) {
      try {
        this.cpuChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.cpuChart = null;
    }
    if (this.gpuChart) {
      try {
        this.gpuChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.gpuChart = null;
    }
    this.chartsReady = false;
  }

  initCharts() {
    if (this.chartsReady) return;

    // Get CPU canvas
    const cpuCanvas = document.getElementById("cpuChart");
    if (!cpuCanvas) {
      setTimeout(() => this.initCharts(), 100);
      return;
    }

    // Create CPU chart
    this._createCpuChart(cpuCanvas);

    // Try to create GPU chart (might not exist yet in DOM)
    // We'll create it lazily when needed
    this.chartsReady = true;

    // Pre-create GPU chart after a short delay
    setTimeout(() => {
      const gpuCanvas = document.getElementById("gpuChart");
      if (gpuCanvas && !this.gpuChart) {
        this._createGpuChart(gpuCanvas);
      }
    }, 200);
  }

  _createCpuChart(canvas) {
    if (this.cpuChart) return;

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

    const history = this.state.history || [];
    const labels = history.map((_, i) => i.toString());
    const data = history.map((h) => h.cpu?.usage || 0);

    this.cpuChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "CPU %",
            data: data,
            borderColor: "#3b82f6",
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            displayColors: false,
            callbacks: {
              label: (context) => `CPU: ${context.parsed.y.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: { display: true, grid: { display: false }, ticks: { display: false } },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: { stepSize: 25, font: { size: 11 }, color: "#6b7280" },
          },
        },
      },
    });
  }

  _createGpuChart() {
    const canvas = document.getElementById("gpuChart");
    if (!canvas || this.gpuChart) return;

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, "rgba(139, 92, 246, 0.4)");
    gradient.addColorStop(1, "rgba(139, 92, 246, 0)");

    const history = this.state.history || [];
    const labels = history.map((_, i) => i.toString());
    const data = history.map((h) => h.gpu?.usage || 0);

    this.gpuChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "GPU %",
            data: data,
            borderColor: "#8b5cf6",
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            displayColors: false,
            callbacks: {
              label: (context) => `GPU: ${context.parsed.y.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: { display: true, grid: { display: false }, ticks: { display: false } },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: { stepSize: 25, font: { size: 11 }, color: "#6b7280" },
          },
        },
      },
    });
  }

  updateChartsDirectly(metrics, history) {
    if (!history || history.length === 0) return;

    // Update CPU chart if it exists and is visible
    if (this.cpuChart && this.state.chartType === "cpu") {
      const labels = history.map((_, i) => i.toString());
      const data = history.map((h) => h.cpu?.usage || 0);
      this.cpuChart.data.labels = labels;
      this.cpuChart.data.datasets[0].data = data;
      this.cpuChart.update("none");
    }

    // Update GPU chart if it exists and is visible
    if (this.gpuChart && this.state.chartType === "gpu") {
      const labels = history.map((_, i) => i.toString());
      const data = history.map((h) => h.gpu?.usage || 0);
      this.gpuChart.data.labels = labels;
      this.gpuChart.data.datasets[0].data = data;
      this.gpuChart.update("none");
    }

    // Update chart stats without triggering full re-render
    const stats = this._calculateStatsForType(history, this.state.chartType);
    this._updateChartStatsDOM(stats);
  }

  _calculateStatsForType(history, type) {
    if (history.length === 0) {
      return { current: 0, avg: 0, max: 0 };
    }
    const values = history.map((h) => (type === "gpu" ? h.gpu?.usage || 0 : h.cpu?.usage || 0));
    const current = values[values.length - 1] || 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    return { current, avg, max };
  }

  _updateChartStatsDOM(stats) {
    const statsEl = this._el?.querySelector(".chart-stats");
    if (!statsEl) return;

    const statValues = statsEl.querySelectorAll(".chart-stat-value");
    if (statValues.length >= 3) {
      statValues[0].textContent = `${stats.current.toFixed(1)}%`;
      statValues[1].textContent = `${stats.avg.toFixed(1)}%`;
      statValues[2].textContent = `${stats.max.toFixed(1)}%`;
    }
  }

  _fmtUptime(s) {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
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

    const stats = [
      {
        icon: "🖥️",
        label: "CPU Usage",
        value: `${(m.cpu?.usage || 0).toFixed(1)}%`,
        percent: Math.min(m.cpu?.usage || 0, 100),
        warning: m.cpu?.usage > 80,
      },
      {
        icon: "🧠",
        label: "Memory",
        value: window.AppUtils?.formatBytes?.(m.memory?.used || 0) || "0 B",
        percent: Math.min(m.memory?.used || 0, 100),
        warning: m.memory?.used > 85,
      },
      {
        icon: "🎮",
        label: "GPU Usage",
        value: `${(gpu?.usage || 0).toFixed(1)}%`,
        percent: Math.min(gpu?.usage || 0, 100),
        warning: gpu?.usage > 85,
        isGpu: true,
      },
      {
        icon: "💾",
        label: "GPU Memory",
        value:
          gpu?.memoryTotal > 0
            ? `${window.AppUtils?.formatBytes?.(gpu?.memoryUsed || 0)} / ${window.AppUtils?.formatBytes?.(gpu?.memoryTotal || 0)}`
            : "N/A",
        percent: gpu?.memoryTotal > 0 ? (gpu?.memoryUsed / gpu?.memoryTotal) * 100 : 0,
        isGpu: true,
      },
      {
        icon: "💿",
        label: "Disk Usage",
        value: `${(m.disk?.used || 0).toFixed(1)}%`,
        percent: Math.min(m.disk?.used || 0, 100),
        warning: m.disk?.used > 90,
      },
      {
        icon: "⏱️",
        label: "Uptime",
        value: this._fmtUptime(m.uptime || 0),
        percent: 0,
      },
    ];

    return Component.h(
      "div",
      { className: "stats-grid" },
      stats.map((stat) =>
        Component.h(
          "div",
          { key: stat.label, className: `stat-card ${stat.warning ? "warning" : ""}` },
          Component.h("div", { className: "stat-icon" }, stat.icon),
          Component.h(
            "div",
            { className: "stat-content" },
            Component.h("span", { className: "stat-label" }, stat.label),
            Component.h("span", { className: "stat-value" }, stat.value),
            stat.percent > 0 &&
              Component.h(
                "div",
                { className: "stat-bar" },
                Component.h("div", {
                  className: `stat-bar-fill ${stat.isGpu ? "gpu" : ""}`,
                  style: `width: ${stat.percent}%`,
                })
              )
          )
        )
      )
    );
  }

  _renderCharts() {
    const history = this.state.history || [];
    const chartType = this.state.chartType;
    const hasData = history.length > 0;
    const stats = this.state.chartStats;

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
            { className: `chart-tab ${chartType === "cpu" ? "active" : ""}`, "data-chart": "cpu" },
            "CPU"
          ),
          Component.h(
            "button",
            { className: `chart-tab ${chartType === "gpu" ? "active" : ""}`, "data-chart": "gpu" },
            "GPU"
          )
        )
      ),
      Component.h(
        "div",
        { className: "chart-container" },
        hasData
          ? Component.h(
            "div",
            { className: "chart-wrapper" },
            Component.h("canvas", { id: `${chartType}Chart`, className: "chart-canvas" })
          )
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
      hasData &&
        Component.h(
          "div",
          { className: "chart-stats" },
          Component.h(
            "div",
            { className: "chart-stat" },
            Component.h("span", { className: "chart-stat-label" }, "Current"),
            Component.h("span", { className: "chart-stat-value" }, `${stats.current.toFixed(1)}%`)
          ),
          Component.h(
            "div",
            { className: "chart-stat" },
            Component.h("span", { className: "chart-stat-label" }, "Average"),
            Component.h("span", { className: "chart-stat-value" }, `${stats.avg.toFixed(1)}%`)
          ),
          Component.h(
            "div",
            { className: "chart-stat" },
            Component.h("span", { className: "chart-stat-label" }, "Max"),
            Component.h("span", { className: "chart-stat-value" }, `${stats.max.toFixed(1)}%`)
          )
        )
    );
  }

  _renderSystemHealth() {
    const m = this.state.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      disk: { used: 0 },
    };
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
              { className: "btn btn-secondary", "data-action": "restart", disabled: !isRunning },
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
      const newType = tab.dataset.chart;
      if (newType !== this.state.chartType) {
        this.setState({ chartType: newType });

        // Ensure the chart for the new type exists
        setTimeout(() => {
          if (newType === "cpu") {
            if (!this.cpuChart) {
              const canvas = document.getElementById("cpuChart");
              if (canvas) {
                this._createCpuChart(canvas);
              }
            }
          } else {
            if (!this.gpuChart) {
              const canvas = document.getElementById("gpuChart");
              if (canvas) {
                this._createGpuChart(canvas);
              } else {
                // Retry a few times if canvas not ready
                let attempts = 0;
                const tryCreate = () => {
                  attempts++;
                  const c = document.getElementById("gpuChart");
                  if (c) {
                    this._createGpuChart(c);
                  } else if (attempts < 5) {
                    setTimeout(tryCreate, 100);
                  }
                };
                setTimeout(tryCreate, 100);
              }
            }
          }
        }, 50);
      }
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
      await this.props.controller?.load();
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
    // No-op, controller passed via props
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
