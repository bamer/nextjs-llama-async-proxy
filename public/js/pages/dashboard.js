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
        state: { chartType: "usage", history },
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
    if (this.comp) {
      this.comp.state.routerLoading = true;
      this.comp._updateRouterCardUI();
    }
    try {
      await stateManager.startLlama();
      showNotification("Starting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaStatus", s.status || null);
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          showNotification("Router started successfully", "success");
        } catch (e) {
          console.error("[DASHBOARD] Error checking status:", e.message);
          // On error, clear loading state manually
          if (this.comp) {
            this.comp.state.routerLoading = false;
            this.comp._updateRouterCardUI();
          }
        }
      }, 3000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      // On error, clear loading state manually
      if (this.comp) {
        this.comp.state.routerLoading = false;
        this.comp._updateRouterCardUI();
      }
    }
  }

  async _stop() {
    if (!confirm("Stop router?")) return;
    if (this.comp) {
      this.comp.state.routerLoading = true;
      this.comp._updateRouterCardUI();
    }
    try {
      await stateManager.stopLlama();
      const status = { status: "idle", port: null };
      stateManager.set("llamaStatus", status);
      stateManager.set("routerStatus", null);
      showNotification("Router stopped", "success");
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      // On error, clear loading state manually
      if (this.comp) {
        this.comp.state.routerLoading = false;
        this.comp._updateRouterCardUI();
      }
    }
  }

  async _restart() {
    if (this.comp) {
      this.comp.state.routerLoading = true;
      this.comp._updateRouterCardUI();
    }
    try {
      await stateManager.restartLlama();
      showNotification("Restarting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaStatus", s.status || null);
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          showNotification("Router restarted", "success");
        } catch (e) {
          console.error("[DASHBOARD] Error checking status:", e.message);
          // On error, clear loading state manually
          if (this.comp) {
            this.comp.state.routerLoading = false;
            this.comp._updateRouterCardUI();
          }
        }
      }, 5000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      // On error, clear loading state manually
      if (this.comp) {
        this.comp.state.routerLoading = false;
        this.comp._updateRouterCardUI();
      }
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
      routerLoading: false,
      chartType: "usage",
      chartStats: window.DashboardUtils._calculateStats(history),
    };
  }

  didMount() {
    this.unsubscribers = [];
    this.unsubscribers.push(
      stateManager.subscribe("llamaStatus", (status) => {
        // Update state directly without setState to preserve charts
        this.state.status = status;
        // Clear loading state if status changed
        if (this.state.routerLoading) {
          // Clear loading when port changes (started or stopped)
          this.state.routerLoading = false;
        }
        // Update RouterCard UI only (not full page re-render)
        this._updateRouterCardUI();
      })
    );
    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        // Update state directly without setState to preserve charts
        this.state.routerStatus = rs;
        // Update RouterCard UI only (not full page re-render)
        this._updateRouterCardUI();
      })
    );
  }

  willDestroy() {
    this.unsubscribers?.forEach((unsub) => unsub());
  }

  _updateRouterCardUI() {
    if (!this._el) return;

    const routerCard = this._el.querySelector(".router-card");
    if (!routerCard) return;

    const status = this.state.status;
    const routerLoading = this.state.routerLoading;
    const isRunning = status?.port;

    // Update status badge
    const statusBadge = routerCard.querySelector(".status-badge");
    if (statusBadge) {
      if (routerLoading) {
        statusBadge.textContent = isRunning ? "STOPPING..." : "STARTING...";
        statusBadge.className = "status-badge loading";
      } else {
        statusBadge.textContent = isRunning ? "RUNNING" : "STOPPED";
        statusBadge.className = `status-badge ${isRunning ? "running" : "idle"}`;
      }
    }

    // Update router info visibility
    const routerInfo = routerCard.querySelector(".router-info");
    if (routerInfo) {
      routerInfo.style.display = isRunning ? "flex" : "none";
    }

    // Update button
    const controls = routerCard.querySelector(".router-controls");
    if (controls) {
      const btn = controls.querySelector("[data-action=\"start\"], [data-action=\"stop\"]");
      if (btn) {
        if (isRunning) {
          // Switch to Stop button
          btn.setAttribute("data-action", "stop");
          btn.className = "btn btn-danger";
          btn.textContent = routerLoading ? "⏹ Stopping..." : "⏹ Stop Router";
        } else {
          // Switch to Start button
          btn.setAttribute("data-action", "start");
          btn.className = "btn btn-primary";
          btn.textContent = routerLoading ? "▶ Starting..." : "▶ Start Router";
        }
        btn.disabled = routerLoading;
      }

      // Update restart button
      const restartBtn = controls.querySelector("[data-action=\"restart\"]");
      if (restartBtn) {
        restartBtn.disabled = !isRunning || routerLoading;
      }
    }
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
        const usageCanvas = chartsSection.querySelector("#usageChart");
        const memoryCanvas = chartsSection.querySelector("#memoryChart");
        if (usageCanvas && memoryCanvas) {
          usageCanvas.style.display = this.state.chartType === "usage" ? "block" : "none";
          memoryCanvas.style.display = this.state.chartType === "memory" ? "block" : "none";
        }

        const usageTab = chartsSection.querySelector("[data-chart=\"usage\"]");
        const memoryTab = chartsSection.querySelector("[data-chart=\"memory\"]");
        if (usageTab && memoryTab) {
          usageTab.classList.toggle("active", this.state.chartType === "usage");
          memoryTab.classList.toggle("active", this.state.chartType === "memory");
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
      const usageTab = this._el.querySelector("[data-chart=\"usage\"]");
      const memoryTab = this._el.querySelector("[data-chart=\"memory\"]");
      if (usageTab && memoryTab) {
        usageTab.classList.toggle("active", newType === "usage");
        memoryTab.classList.toggle("active", newType === "memory");
      }

      // Update canvas visibility
      const usageCanvas = this._el.querySelector("#usageChart");
      const memoryCanvas = this._el.querySelector("#memoryChart");
      if (usageCanvas && memoryCanvas) {
        usageCanvas.style.display = newType === "usage" ? "block" : "none";
        memoryCanvas.style.display = newType === "memory" ? "block" : "none";
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
