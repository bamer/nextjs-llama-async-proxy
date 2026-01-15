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
    this.selectedPreset = null;
    this.controller = props.controller;
    this.chartManager = props.chartManager;
    this.unsubscribers = [];
    this.routerCardUpdater = null;
  }

  onMount() {
    console.log("[DEBUG] DashboardPage: onMount");
    // Load data when connected
    this.controller?._loadDataWhenConnected();

    // Subscribe to state changes
    this.unsubscribers.push(
      stateManager.subscribe("llamaServerStatus", (status) => {
        console.log("[DEBUG] DashboardPage: llamaServerStatus changed:", status);
        this.status = status;
        if (this.routerLoading && status?.port) {
          this.routerLoading = false;
          this._updateRouterCardUI();
        }
        if (this.routerCardUpdater) {
          this.routerCardUpdater(status);
        }
        this._updateRouterCardUI();
      })
    );

    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        console.log("[DEBUG] DashboardPage: routerStatus changed:", rs);
        this.routerStatus = rs;
        this._updateRouterCardUI();
      })
    );

    // Subscribe to presets changes (presets load after initial render)
    this.unsubscribers.push(
      stateManager.subscribe("presets", (presets) => {
        console.log("[DEBUG] DashboardPage: presets changed:", presets?.length || 0);
        this.presets = presets || [];
        // Update RouterCard if it exists
        const routerCard = this._el?.querySelector(".router-card");
        if (routerCard) {
          const select = routerCard.querySelector("#preset-select");
          if (select) {
            select.innerHTML = `<option value="">Select Preset...</option>${
              this.presets.map((p) => `<option value="${p.name}">${p.name}</option>`).join("")}`;
          }
        }
      })
    );

    // Subscribe to metrics updates
    this.unsubscribers.push(
      stateManager.subscribe("metrics", (m) => {
        this.handleMetricsChange(m);
      })
    );

    // Subscribe to metrics history updates (for charts)
    this.unsubscribers.push(
      stateManager.subscribe("metricsHistory", (history) => {
        if (Array.isArray(history) && history.length > 0 && this.chartManager) {
          const metrics = stateManager.get("metrics") || {};
          this.history = history;
          this.chartManager.updateCharts(metrics, history);
          // Also update ChartsSection's internal history
          this._updateChartsSection();
        }
      })
    );

    // Setup initial metrics
    this._setupInitialMetrics();
  }

  _setupInitialMetrics() {
    const metrics = stateManager.get("metrics");
    if (metrics && typeof metrics !== "undefined") {
      console.log("[DEBUG] Dashboard: Using metrics:", metrics);
      this._metrics = metrics;
    }
  }

  handleMetricsChange(metrics) {
    this.metrics = metrics || { cpu: { usage: 0 }, memory: { used: 0 }, gpu: null };
    this.gpuMetrics = metrics?.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0, list: [] };
    // Get history from state manager (updated via broadcast _addMetric)
    // Don't rely on metrics.history as broadcast doesn't include it
    this.history = stateManager.get("metricsHistory") || [];

    if (this.chartManager && this.history.length > 0) {
      this.chartManager.updateCharts(metrics, this.history);
    }
  }

  destroy() {
    console.log("[DEBUG] DashboardPage: destroy");
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

  setRouterLoading(loading) {
    this.routerLoading = loading;
    this._updateRouterCardUI();
  }

  _updateRouterCardUI() {
    if (!this._el) return;

    const routerCard = this._el.querySelector(".router-card");
    if (!routerCard) return;

    // Check both llamaServerStatus (status field) and routerStatus (port field)
    const isRunning = this.status?.port || this.status?.status === "running";
    const loadedCount = (this.routerStatus?.models || []).filter(
      (x) => x.state === "loaded"
    ).length;

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

    // Update loaded count text if present
    const modelsText = routerCard.querySelector(".router-info .models-info");
    if (modelsText && isRunning) {
      modelsText.textContent = `Models: ${loadedCount}/${this.models.length} loaded`;
    }

    // Update button
    const controls = routerCard.querySelector(".router-controls");
    if (controls) {
      const btn = controls.querySelector("[data-action=\"start\"], [data-action=\"stop\"]");
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

      const restartBtn = controls.querySelector("[data-action=\"restart\"]");
      if (restartBtn) {
        restartBtn.disabled = !isRunning || this.routerLoading;
        restartBtn.textContent = this.routerLoading ? "🔄 Restarting..." : "🔄 Restart";
      }

      const launchPresetBtn = controls.querySelector("[data-action=\"launch-preset\"]");
      if (launchPresetBtn) {
        launchPresetBtn.disabled = this.routerLoading;
        launchPresetBtn.textContent = this.routerLoading
          ? "🚀 Starting..."
          : "🚀 Launch Server with Preset";
      }
    }
  }

  updateFromController(metrics, history) {
    this.metrics = metrics || this.metrics;
    this.gpuMetrics = metrics?.gpu || this.gpuMetrics;
    this.history = history;

    if (this.chartManager) {
      this.chartManager.updateCharts(metrics, this.history);
    }

    // Update StatsGrid component
    const statsGrid = this._el?.querySelector(".stats-grid");
    if (statsGrid && statsGrid._component) {
      statsGrid._component.updateMetrics(this.metrics, this.gpuMetrics);
    }

    // Update SystemHealth component
    const systemHealth = this._el?.querySelector(".health-section");
    if (systemHealth && systemHealth._component) {
      systemHealth._component.updateMetrics(this.metrics, this.gpuMetrics);
    }

    // Update GpuDetails component
    const gpuDetails = this._el?.querySelector(".gpu-details");
    if (gpuDetails && gpuDetails._component) {
      gpuDetails._component.gpuList = this.gpuMetrics?.list || [];
      gpuDetails._component._updateGPUUI();
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

      // Update ChartsSection's internal history reference
      const chartsSectionComponent = chartsSection._component;
      if (chartsSectionComponent) {
        chartsSectionComponent.history = this.history;
        chartsSectionComponent.updateDOM();
      }
    }
  }

  /**
   * Update ChartsSection with new history
   */
  _updateChartsSection() {
    const chartsSection = this._el?.querySelector(".charts-section");
    if (chartsSection) {
      const chartsSectionComponent = chartsSection._component;
      if (chartsSectionComponent) {
        chartsSectionComponent.history = this.history;
        chartsSectionComponent.updateDOM();
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
      const usageTab = this._el.querySelector("[data-chart=\"usage\"]");
      const memoryTab = this._el.querySelector("[data-chart=\"memory\"]");
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
    console.log("[DEBUG] DashboardPage: render");
    const config = stateManager.get("config") || {};
    const settings = stateManager.get("settings") || {};
    const configPort = config.port || 8080;
    const maxModelsLoaded = settings.maxModelsLoaded || 4;
    const ctxSize = config.ctx_size || 4096;

    const metrics = stateManager.get("metrics");
    console.log("[DEBUG] DashboardPage: metrics:", metrics);

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
          onAction: (action, data) => this.controller?.handleRouterAction(action, data),
          subscribeToUpdates: (cb) => {
            this.routerCardUpdater = cb;
          },
        }),
        Component.h(window.LlamaServerStatusPanel, {
          status: this.status,
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
