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
        this.status = status;
        this._updateRouterCardUI();
      })
    );

    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        this.routerStatus = rs;
        this._updateRouterCardUI();
      })
    );

    // Subscribe to presets changes
    this.unsubscribers.push(
      stateManager.subscribe("presets", (presets) => {
        this.presets = presets || [];
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
          this._updateChartsSection();
        }
      })
    );

    // Sync with global loading state
    this.unsubscribers.push(
      stateManager.subscribe("routerLoading", (loading) => {
        this.routerLoading = !!loading;
        this._updateRouterCardUI();
      })
    );
  }

  handleMetricsChange(metrics) {
    this.metrics = metrics || { cpu: { usage: 0 }, memory: { used: 0 }, gpu: null };
    this.gpuMetrics = metrics?.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0, list: [] };
    this.history = stateManager.get("metricsHistory") || [];

    if (this.chartManager && this.history.length > 0) {
      this.chartManager.updateCharts(metrics, this.history);
    }
  }

  destroy() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  bindEvents() {
    this.on("click", "[data-action=refresh]", (e) => {
      e.preventDefault();
      this._refresh();
    });
  }

  setRouterLoading(loading) {
    stateManager.set("routerLoading", !!loading);
  }

  _updateRouterCardUI() {
    // With LlamaRouterCard being event-driven and subscribing to state, 
    // we don't need much manual DOM manipulation here anymore.
  }

  updateFromController(metrics, history) {
    this.metrics = metrics || this.metrics;
    this.gpuMetrics = metrics?.gpu || this.gpuMetrics;
    this.history = history;

    if (this.chartManager) {
      this.chartManager.updateCharts(metrics, this.history);
    }

    // Update sub-components via their direct update methods
    const statsGrid = this._el?.querySelector(".stats-grid")?._component;
    if (statsGrid) statsGrid.updateMetrics(this.metrics, this.gpuMetrics);

    const systemHealth = this._el?.querySelector(".health-section")?._component;
    if (systemHealth) systemHealth.updateMetrics(this.metrics, this.gpuMetrics);

    const gpuDetails = this._el?.querySelector(".gpu-details")?._component;
    if (gpuDetails) {
      gpuDetails.gpuList = this.gpuMetrics?.list || [];
      gpuDetails._updateGPUUI();
    }
  }

  _updateChartsSection() {
    const chartsSection = this._el?.querySelector(".charts-section")?._component;
    if (chartsSection) {
      chartsSection.history = this.history;
      chartsSection.updateDOM();
    }
  }

  handleChartTypeChange(newType) {
    if (newType === this.chartType) return;
    this.chartType = newType;
    if (this.chartManager) this.chartManager.setChartType(newType);
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
    return Component.h("div", { className: "dashboard-page unified" }, [
      Component.h(window.StatsGrid, {
        metrics: this.metrics,
        gpuMetrics: this.gpuMetrics,
      }),
      Component.h("div", { className: "dashboard-middle-row" }, [
        Component.h(window.LlamaRouterCard, {
          status: this.status,
          routerStatus: this.routerStatus,
          models: this.models,
          presets: this.presets,
          metrics: stateManager.get("llamaServerMetrics"),
          onAction: (action, data) => this.controller?.handleRouterAction(action, data),
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
