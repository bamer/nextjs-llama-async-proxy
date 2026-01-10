/**
 * Dashboard Page - Event-Driven DOM Updates
 */

class DashboardPage extends Component {
  constructor(props) {
    super(props);

    this.metrics = props.metrics || { cpu: { usage: 0 }, memory: { used: 0 }, gpu: null };
    this.gpuMetrics = props.gpuMetrics || { usage: 0, memoryUsed: 0, memoryTotal: 0 };
    this.models = props.models || [];
    this.status = props.status || null;
    this.routerStatus = props.routerStatus || null;
    this.presets = props.presets || [];
    this.history = props.history || [];
    this.chartType = "usage";
    this.chartStats = window.DashboardUtils?._calculateStats?.(this.history) || {
      current: 0,
      avg: 0,
      max: 0,
    };
    this.loading = false;
    this.routerLoading = false;
    this.controller = props.controller;
    this.chartManager = props.chartManager;
    this.unsubscribers = [];
    this.routerCardUpdater = null;
  }

  onMount() {
    // Subscribe to state changes
    this.unsubscribers.push(
      stateManager.subscribe("llamaStatus", (status) => {
        this.status = status;
        if (this.routerLoading && status?.port) {
          this.routerLoading = false;
        }
        if (this.routerCardUpdater) {
          this.routerCardUpdater(status);
        }
        this._updateRouterCardUI();
      })
    );

    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        this.routerStatus = rs;
        this._updateRouterCardUI();
      })
    );
  }

  destroy() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  bindEvents() {
    // Refresh button
    this.on("click", "[data-action=refresh]", (e) => {
      e.preventDefault();
      this._refresh();
    });
  }

  _updateRouterCardUI() {
    if (!this._el) return;

    const routerCard = this._el.querySelector(".router-card");
    if (!routerCard) return;

    const isRunning = this.status?.port;

    // Update status badge
    const statusBadge = routerCard.querySelector(".status-badge");
    if (statusBadge) {
      if (this.routerLoading) {
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
      const btn = controls.querySelector('[data-action="start"], [data-action="stop"]');
      if (btn) {
        if (isRunning) {
          btn.setAttribute("data-action", "stop");
          btn.className = "btn btn-danger";
          btn.textContent = this.routerLoading ? "⏹ Stopping..." : "⏹ Stop Router";
        } else {
          btn.setAttribute("data-action", "start");
          btn.className = "btn btn-primary";
          btn.textContent = this.routerLoading ? "▶ Starting..." : "▶ Start Router";
        }
        btn.disabled = this.routerLoading;
      }

      const restartBtn = controls.querySelector('[data-action="restart"]');
      if (restartBtn) {
        restartBtn.disabled = !isRunning || this.routerLoading;
      }
    }
  }

  updateFromController(metrics, history) {
    this.metrics = metrics || this.metrics;
    this.gpuMetrics = metrics?.gpu || this.gpuMetrics;
    this.history = history;

    if (this.chartManager) {
      this.chartManager.updateCharts(metrics, history);
    }

    // Update chart stats in DOM
    const statsEl = this._el?.querySelector(".chart-stats");
    if (statsEl) {
      const statValues = statsEl.querySelectorAll(".chart-stat-value");
      const stats =
        window.DashboardUtils?._calculateStatsForType?.(history, this.chartType) || this.chartStats;
      this.chartStats = stats;
      if (statValues.length >= 3) {
        statValues[0].textContent = `${stats.current.toFixed(1)}%`;
        statValues[1].textContent = `${stats.avg.toFixed(1)}%`;
        statValues[2].textContent = `${stats.max.toFixed(1)}%`;
      }
    }

    // Update chart visibility
    const chartsSection = this._el?.querySelector(".charts-section");
    if (chartsSection) {
      const usageCanvas = chartsSection.querySelector("#usageChart");
      const memoryCanvas = chartsSection.querySelector("#memoryChart");
      if (usageCanvas && memoryCanvas) {
        usageCanvas.style.display = this.chartType === "usage" ? "block" : "none";
        memoryCanvas.style.display = this.chartType === "memory" ? "block" : "none";
      }
    }
  }

  handleChartTypeChange(newType) {
    if (newType === this.chartType) return;

    this.chartType = newType;

    if (this.chartManager) {
      this.chartManager.setChartType(newType);
    }

    // Update DOM
    if (this._el) {
      const usageTab = this._el.querySelector('[data-chart="usage"]');
      const memoryTab = this._el.querySelector('[data-chart="memory"]');
      if (usageTab && memoryTab) {
        usageTab.classList.toggle("active", newType === "usage");
        memoryTab.classList.toggle("active", newType === "memory");
      }

      const usageCanvas = this._el.querySelector("#usageChart");
      const memoryCanvas = this._el.querySelector("#memoryChart");
      if (usageCanvas && memoryCanvas) {
        usageCanvas.style.display = newType === "usage" ? "block" : "none";
        memoryCanvas.style.display = newType === "memory" ? "block" : "none";
      }

      const stats =
        window.DashboardUtils?._calculateStatsForType?.(this.history, newType) || this.chartStats;
      this.chartStats = stats;

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

  async _refresh() {
    this.loading = true;
    try {
      await this.controller?.load();
      showNotification("Dashboard refreshed", "success");
    } catch (e) {
      showNotification("Refresh failed", "error");
    }
    this.loading = false;
  }

  render() {
    const config = stateManager.get("config") || {};
    const settings = stateManager.get("settings") || {};
    const configPort = config.port || 8080;
    const maxModelsLoaded = settings.maxModelsLoaded || 4;
    const ctxSize = config.ctx_size || 4096;

    return Component.h("div", { className: "dashboard-page unified" }, [
      Component.h(window.StatsGrid, {
        metrics: this.metrics,
        gpuMetrics: this.gpuMetrics,
      }),
      Component.h("div", { className: "dashboard-middle-row" }, [
        Component.h(window.RouterCard, {
          status: this.status,
          routerStatus: this.routerStatus,
          models: this.models,
          configPort,
          presets: this.presets,
          maxModelsLoaded,
          ctxSize,
          onAction: (action) => this.controller?.handleRouterAction(action),
          subscribeToUpdates: (cb) => {
            this.routerCardUpdater = cb;
          },
        }),
        Component.h(window.LlamaServerStatusPanel, {
          metrics: stateManager.get("llamaServerMetrics"),
        }),
        Component.h(window.QuickActions, {
          onRefresh: () => this._refresh(),
        }),
      ]),
      Component.h("div", { className: "content-row" }, [
        Component.h(window.ChartsSection, {
          history: this.history,
          chartStats: this.chartStats,
          chartManager: this.chartManager,
          onChartTypeChange: (type) => this.handleChartTypeChange(type),
        }),
        Component.h(window.SystemHealth, {
          metrics: this.metrics,
          gpuMetrics: this.gpuMetrics,
        }),
      ]),
      Component.h("div", { className: "content-row" }, [
        Component.h(window.GpuDetails, {
          gpuList: this.gpuMetrics?.list || [],
        }),
      ]),
    ]);
  }
}

window.DashboardPage = DashboardPage;
