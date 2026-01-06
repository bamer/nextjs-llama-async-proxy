// Dashboard modules are loaded via script tags and attached to window object
// Components: ChartManager, StatsGrid, ChartsSection, SystemHealth, RouterCard, QuickActions
// Utilities: DashboardUtils._calculateStats, DashboardUtils._calculateStatsForType

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.chartUpdateInterval = null;
    this.chartManager = null;
  }

  init() {}

  willUnmount() {
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval);
    }
    if (this.chartManager) {
      this.chartManager.destroy();
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

      this.chartManager = new window.ChartManager({
        state: { chartType: "cpu", history },
      });

      this.comp = new window.DashboardPage({
        models,
        metrics,
        status,
        routerStatus,
        config,
        history,
        chartManager: this.chartManager,
        controller: this,
      });

      const el = this.comp.render();

      this.comp._el = el;
      el._component = this.comp;

      this.comp.bindEvents();

      requestAnimationFrame(() => {
        setTimeout(() => {
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
          this.comp.updateFromController(d.metrics || null, h.history || []);
        }
      } catch (e) {}
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
        } catch (e) {}
      }
    } catch (e) {
      console.error("[DASHBOARD] Load error:", e.message);
    }
  }

  async handleRouterAction(action) {
    switch (action) {
      case "start":
        await this._start();
        break;
      case "stop":
        await this._stop();
        break;
      case "restart":
        await this._restart();
        break;
    }
  }

  async _start() {
    this.comp?.setState({ loading: true });
    try {
      await stateManager.startLlama();
      showNotification("Starting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaStatus", s.status || null);
          this.comp?.setState({ status: s.status });
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          this.comp?.setState({ routerStatus: rs.routerStatus, loading: false });
          showNotification("Router started successfully", "success");
        } catch (e) {
          this.comp?.setState({ loading: false });
        }
      }, 3000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      this.comp?.setState({ loading: false });
    }
  }

  async _stop() {
    if (!confirm("Stop router?")) return;
    this.comp?.setState({ loading: true });
    try {
      await stateManager.stopLlama();
      stateManager.set("llamaStatus", { status: "idle", port: null });
      stateManager.set("routerStatus", null);
      this.comp?.setState({
        status: { status: "idle", port: null },
        routerStatus: null,
        loading: false,
      });
      showNotification("Router stopped", "success");
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      this.comp?.setState({ loading: false });
    }
  }

  async _restart() {
    this.comp?.setState({ loading: true });
    try {
      await stateManager.restartLlama();
      showNotification("Restarting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaStatus", s.status || null);
          this.comp?.setState({ status: s.status });
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          this.comp?.setState({ routerStatus: rs.routerStatus, loading: false });
          showNotification("Router restarted", "success");
        } catch (e) {
          this.comp?.setState({ loading: false });
        }
      }, 5000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      this.comp?.setState({ loading: false });
    }
  }
}

class DashboardPage extends Component {
  constructor(props) {
    super(props);

    const metrics = props.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      gpu: null,
      disk: { used: 0 },
      uptime: 0,
    };
    const gpuMetrics = metrics.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0 };
    const history = props.history || [];

    this.state = {
      models: props.models || [],
      metrics,
      gpuMetrics,
      status: props.status || null,
      routerStatus: props.routerStatus || null,
      configPort: (props.config || {}).port || 8080,
      history,
      loading: false,
      chartType: "cpu",
      chartStats: window.DashboardUtils._calculateStats(history),
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
  }

  willDestroy() {
    this.unsubscribers?.forEach((unsub) => unsub());
  }

  updateFromController(metrics, history) {
    const gpuMetrics = metrics?.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0 };
    const stats = window.DashboardUtils._calculateStatsForType(history, this.state.chartType);

    // Update chart manager with new data (without re-rendering)
    if (this.props.chartManager) {
      this.props.chartManager.updateCharts(metrics, history);
    }

    // Update DOM directly instead of setState to avoid full re-render
    if (this._el) {
      // Update chart stats in DOM
      const statsEl = this._el.querySelector(".chart-stats");
      if (statsEl) {
        const statValues = statsEl.querySelectorAll(".chart-stat-value");
        if (statValues.length >= 3) {
          statValues[0].textContent = `${stats.current.toFixed(1)}%`;
          statValues[1].textContent = `${stats.avg.toFixed(1)}%`;
          statValues[2].textContent = `${stats.max.toFixed(1)}%`;
        }
      }

      // Update ChartsSection DOM directly
      const chartsSection = this._el.querySelector(".charts-section");
      if (chartsSection) {
        const cpuCanvas = chartsSection.querySelector("#cpuChart");
        const gpuCanvas = chartsSection.querySelector("#gpuChart");
        if (cpuCanvas && gpuCanvas) {
          cpuCanvas.style.display = this.state.chartType === "cpu" ? "block" : "none";
          gpuCanvas.style.display = this.state.chartType === "gpu" ? "block" : "none";
        }

        const cpuTab = chartsSection.querySelector('[data-chart="cpu"]');
        const gpuTab = chartsSection.querySelector('[data-chart="gpu"]');
        if (cpuTab && gpuTab) {
          cpuTab.classList.toggle("active", this.state.chartType === "cpu");
          gpuTab.classList.toggle("active", this.state.chartType === "gpu");
        }
      }
    }

    // Only update state that affects other parts
    this.state.metrics = metrics;
    this.state.gpuMetrics = gpuMetrics;
    this.state.history = history;
    this.state.chartStats = stats;
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

  getEventMap() {
    return {
      "click [data-action=refresh]": "handleRefresh",
    };
  }

  handleChartTypeChange(newType) {
    if (newType === this.state.chartType) return;

    // Update chart manager state
    if (this.props.chartManager) {
      this.props.chartManager.setChartType(newType);
    }

    // Update local state variable (without setState to avoid re-render)
    this.state.chartType = newType;

    // Update DOM directly to avoid full re-render
    if (this._el) {
      // Update tab active states
      const cpuTab = this._el.querySelector('[data-chart="cpu"]');
      const gpuTab = this._el.querySelector('[data-chart="gpu"]');
      if (cpuTab && gpuTab) {
        cpuTab.classList.toggle("active", newType === "cpu");
        gpuTab.classList.toggle("active", newType === "gpu");
      }

      // Update canvas visibility
      const cpuCanvas = this._el.querySelector("#cpuChart");
      const gpuCanvas = this._el.querySelector("#gpuChart");
      if (cpuCanvas && gpuCanvas) {
        cpuCanvas.style.display = newType === "cpu" ? "block" : "none";
        gpuCanvas.style.display = newType === "gpu" ? "block" : "none";
      }

      // Update chart stats based on new type
      const history = this.state.history;
      const stats = window.DashboardUtils._calculateStatsForType(history, newType);
      this.state.chartStats = stats;

      const statsEl = this._el.querySelector(".chart-stats");
      if (statsEl) {
        const statValues = statsEl.querySelectorAll(".chart-stat-value");
        if (statValues.length >= 3) {
          statValues[0].textContent = `${stats.current.toFixed(1)}%`;
          statValues[1].textContent = `${stats.avg.toFixed(1)}%`;
          statValues[2].textContent = `${stats.max.toFixed(1)}%`;
        }
      }
    }
  }

  handleRefresh(event) {
    event.preventDefault();
    this._refresh();
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

  render() {
    return Component.h(
      "div",
      { className: "dashboard-page unified" },
      Component.h(window.RouterCard, {
        status: this.state.status,
        routerStatus: this.state.routerStatus,
        models: this.state.models,
        configPort: this.state.configPort,
        onAction: (action) => this.props.controller?.handleRouterAction(action),
      }),
      Component.h(window.StatsGrid, {
        metrics: this.state.metrics,
        gpuMetrics: this.state.gpuMetrics,
      }),
      Component.h(
        "div",
        { className: "content-row" },
        Component.h(window.ChartsSection, {
          history: this.state.history,
          chartStats: this.state.chartStats,
          chartManager: this.props.chartManager,
          onChartTypeChange: (type) => this.handleChartTypeChange(type),
        }),
        Component.h(window.SystemHealth, {
          metrics: this.state.metrics,
          gpuMetrics: this.state.gpuMetrics,
        })
      ),
      Component.h(window.QuickActions, {
        onRefresh: () => this._refresh(),
      })
    );
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
