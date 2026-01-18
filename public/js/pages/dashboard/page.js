/**
 * Dashboard Page - Event-Driven DOM Updates
 */

class DashboardPage extends Component {
  constructor(props = {}) {
    super(props);

    // Local component state (no controller reference)
    this.state = {
      initialized: false,
      connected: false,
      metrics: null,
      history: [],
      gpuMetrics: null,
      models: [],
      presets: [],
      config: {},
      settings: {},
      llamaStatus: null,
      routerStatus: null,
      routerLoading: false,
    };

    // Chart and UI state
    this.chartType = "usage";
    this.chartStats = {
      current: 0,
      avg: 0,
      max: 0,
    };
    this.loading = false;
    this.selectedPreset = null;
    this.chartManager = props.chartManager;
    this.unsubscribers = [];
    this.routerCardUpdater = null;
  }

  onMount() {
    console.log("[DashboardPage] onMount - subscribing to state");

    // Remove GPU section loading skeleton immediately for instant loading
    this._updateGPUSection();

    // Skeleton UI is already applied during render(), but ensure it's there
    this._renderSkeletonUI();

    // Subscribe to all state changes
    this.unsubscribers.push(
      stateManager.subscribe("metrics", this._onMetricsChange.bind(this)),
      stateManager.subscribe("metricsHistory", this._onHistoryChange.bind(this)),
      stateManager.subscribe("models", this._onModelsChange.bind(this)),
      stateManager.subscribe("presets", this._onPresetsChange.bind(this)),
      stateManager.subscribe("config", this._onConfigChange.bind(this)),
      stateManager.subscribe("settings", this._onSettingsChange.bind(this)),
      stateManager.subscribe("llamaServerStatus", this._onLlamaStatusChange.bind(this)),
      stateManager.subscribe("routerStatus", this._onRouterStatusChange.bind(this)),
      stateManager.subscribe("routerLoading", this._onRouterLoadingChange.bind(this)),
      stateManager.subscribe("actions:dashboard:refresh", this._onRefreshAction.bind(this))
    );

    // Emit event to trigger data load (controller listens and fetches fresh data)
    stateManager.emit("action:dashboard:refresh");

    // Also check if state already has data and update UI immediately
    // This handles the case where we returned to the page and state has data
    // but subscriptions didn't trigger because data hasn't changed
    this._syncStateToUI();
  }

  /**
   * Sync all state data to UI - called on mount to ensure fresh data is displayed
   */
  _syncStateToUI() {
    const metrics = stateManager.get("metrics");
    const history = stateManager.get("metricsHistory");
    const models = stateManager.get("models");
    const presets = stateManager.get("presets");
    const config = stateManager.get("config");
    const settings = stateManager.get("settings");
    const llamaStatus = stateManager.get("llamaServerStatus");
    const routerStatus = stateManager.get("routerStatus");

    // Update local state and UI for each data source
    if (metrics) {
      this.state.metrics = metrics;
      this.state.gpuMetrics = metrics?.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0, list: [] };
      this._updateMetricsUI();
    }

    if (history && history.length > 0) {
      this.state.history = history;
      this._updateHistoryUI();
    }

    if (models) {
      this.state.models = models;
      this._updateModelsUI();
    }

    if (presets) {
      this.state.presets = presets;
      this._updatePresetsUI();
    }

    if (config) {
      this.state.config = config;
      this._updateConfigUI();
    }

    if (settings) {
      this.state.settings = settings;
      this._updateSettingsUI();
    }

    if (llamaStatus) {
      this.state.llamaStatus = llamaStatus;
      this._updateLlamaStatusUI();
    }

    if (routerStatus) {
      this.state.routerStatus = routerStatus;
      this._updateRouterStatusUI();
    }

    console.log("[DashboardPage] _syncStateToUI - state synced from stateManager");
  }

  _onMetricsChange(metrics) {
    console.log("[DashboardPage] _onMetricsChange:", metrics);
    if (JSON.stringify(metrics) !== JSON.stringify(this.state.metrics)) {
      this.state.metrics = metrics;
      this.state.gpuMetrics = metrics?.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0, list: [] };
      this._updateMetricsUI();
    }
  }

  _onHistoryChange(history) {
    if (JSON.stringify(history) !== JSON.stringify(this.state.history)) {
      this.state.history = history || [];
      this._updateHistoryUI();
    }
  }

  _onModelsChange(models) {
    this.state.models = models || [];
    this._updateModelsUI();
  }

  _onPresetsChange(presets) {
    this.state.presets = presets || [];
    this._updatePresetsUI();
  }

  _onConfigChange(config) {
    this.state.config = config || {};
    this._updateConfigUI();
  }

  _onSettingsChange(settings) {
    this.state.settings = settings || {};
    this._updateSettingsUI();
  }

  _onLlamaStatusChange(status) {
    this.state.llamaStatus = status;
    this._updateLlamaStatusUI();
  }

  _onRouterStatusChange(status) {
    this.state.routerStatus = status;
    this._updateRouterStatusUI();
  }

  _onRouterLoadingChange(loading) {
    this.state.routerLoading = !!loading;
    this._updateRouterStatusUI();
  }

  _onRefreshAction(action) {
    if (action?.status === "loading") {
      this._setLoading(true);
    } else {
      this._setLoading(false);
    }
  }

  _updateMetricsUI() {
    // Update SystemHealth and GpuDetails components directly
    this._updateSystemHealthAndGPU();

    // Update StatsGrid component
    const statsGrid = this._el?.querySelector(".stats-grid")?._component;
    if (statsGrid) {
      statsGrid.updateMetrics(this.state.metrics, this.state.gpuMetrics);
    }

    // Update charts with new metrics
    if (this.chartManager && this.state.history.length > 0) {
      this.chartManager.updateCharts(this.state.metrics, this.state.history);
    }

    // Remove loading skeleton for metrics
    this._updateMetricsSection();
  }

  _updateHistoryUI() {
    // Update charts section
    this._updateChartsSection();

    // Update ChartsSection component
    const chartsSection = this._el?.querySelector(".charts-section")?._component;
    if (chartsSection) {
      chartsSection.history = this.state.history;
      chartsSection.updateDOM();
      // Ensure charts are initialized if they haven't been yet
      if (!chartsSection.chartsInitialized && this.chartManager) {
        chartsSection._initCharts();
      }
    }

    // Update chart stats - guard against undefined/null history
    const history = this.state.history || [];
    this.chartStats = (history.length > 0 && window.DashboardUtils?._calculateStats)
      ? window.DashboardUtils._calculateStats(history)
      : {
          current: 0,
          avg: 0,
          max: 0,
        };
  }

  _updateModelsUI() {
    // Models are displayed in LlamaRouterCard which subscribes to state
    console.log("[DashboardPage] _updateModelsUI - models updated:", this.state.models.length);
  }

  _updatePresetsUI() {
    // Update LlamaRouterCard with presets data
    const routerCard = this.$(".llama-router-card")?._component;
    if (routerCard) {
      routerCard.props.presets = this.state.presets || [];
      // Force update if the method exists
      if (typeof routerCard._updatePresetSelect === "function") {
        routerCard._updatePresetSelect();
      }
    }
    this._updatePresetsSection();
    console.log("[DashboardPage] _updatePresetsUI - presets updated:", this.state.presets.length);
  }

  _updateConfigUI() {
    console.log("[DashboardPage] _updateConfigUI - config updated");
  }

  _updateSettingsUI() {
    console.log("[DashboardPage] _updateSettingsUI - settings updated");
  }

  _updateLlamaStatusUI() {
    // LlamaRouterCard subscribes to state, no direct update needed
    console.log("[DashboardPage] _updateLlamaStatusUI - status:", this.state.llamaStatus);
  }

  _updateRouterStatusUI() {
    // LlamaRouterCard subscribes to state, no direct update needed
    console.log("[DashboardPage] _updateRouterStatusUI - routerStatus:", this.state.routerStatus);
  }

  _setLoading(loading) {
    this.loading = loading;
    const refreshBtn = this.$("[data-action=refresh]");
    if (refreshBtn) {
      if (loading) {
        refreshBtn.disabled = true;
        refreshBtn.classList.add("loading");
      } else {
        refreshBtn.disabled = false;
        refreshBtn.classList.remove("loading");
      }
    }
  }

  _renderSkeletonUI() {
    // Skeleton UI is now included in render() method
    // This method ensures it stays applied if needed
    const root = this.$(".dashboard-main");
    if (!root) return;

    // Verify skeletons are still applied (in case of re-renders)
    const metricsSection = this.$("[data-section=\"metrics\"]");
    const chartsSection = this.$("[data-section=\"charts\"]");
    const gpuSection = this.$("[data-section=\"gpu\"]");

    // GPU section should load instantly - remove skeleton immediately
    if (gpuSection) {
      gpuSection.classList.remove("loading-skeleton");
      gpuSection.setAttribute("aria-busy", "false");
    }

    // Only add skeleton if data hasn't loaded yet
    if (metricsSection && !stateManager.get("metrics")) {
      metricsSection.classList.add("loading-skeleton");
    }
    if (chartsSection && !stateManager.get("metricsHistory")) {
      chartsSection.classList.add("loading-skeleton");
    }

    // Check if we have cached GPU data and update immediately
    const cachedMetrics = stateManager.get("metrics");
    if (cachedMetrics?.gpu?.list) {
      this._updateGPUWithCachedData(cachedMetrics);
    }
  }

  _updateMetricsSection() {
    const section = this.$("[data-section='metrics']");
    if (section) {
      console.log("[DashboardPage] _updateMetricsSection - removing skeleton");
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
    }
  }

  _updateChartsSection() {
    const section = this.$("[data-section='charts']");
    if (section) {
      console.log("[DashboardPage] _updateChartsSection - removing skeleton");
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
    }
  }

  _updateGPUSection() {
    const section = this.$("[data-section='gpu']");
    if (section) {
      console.log("[DashboardPage] _updateGPUSection - removing skeleton");
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
    }
  }

  _updatePresetsSection() {
    const section = this.$("[data-section='presets']");
    if (section) {
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
    }
  }

  /**
   * Update GPU component with cached data if available
   */
  _updateGPUWithCachedData(metrics) {
    const gpuDetails = this._el?.querySelector(".gpu-details")?._component;
    if (gpuDetails) {
      gpuDetails.gpuList = metrics?.gpu?.list || [];
      gpuDetails._updateGPUUI();
      console.log("[DashboardPage] Updated GPU with cached data:", metrics?.gpu?.list?.length || 0);
    }
  }

  _updateSystemHealthAndGPU() {
    // Update SystemHealth component
    const systemHealth = this._el?.querySelector(".health-section")?._component;
    if (systemHealth) {
      systemHealth.updateMetrics(this.state.metrics, this.state.gpuMetrics);
    }

    // Update GpuDetails component
    const gpuDetails = this._el?.querySelector(".gpu-details")?._component;
    if (gpuDetails) {
      gpuDetails.gpuList = this.state.gpuMetrics?.list || [];
      gpuDetails._updateGPUUI();
    }

    // Remove loading skeletons
    this._updateGPUSection();
  }

  destroy() {
    console.log("[DashboardPage] destroy - cleaning up");
    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    }

    if (this.chartManager) {
      this.chartManager.destroy();
    }

    super.destroy();
  }

  bindEvents() {
    this.on("click", "[data-action=refresh]", (e) => {
      e.preventDefault();
      this._handleRefreshClick();
    });
  }

  _handleChartZoom(range) {
    stateManager.emit("action:dashboard:chartZoom", { range });
  }

  _handleRefreshClick() {
    stateManager.emit("action:dashboard:refresh");
  }

  _handleExportMetrics() {
    const data = {
      metrics: this.state.metrics,
      history: this.state.history,
      exportedAt: new Date().toISOString(),
    };
    stateManager.emit("action:dashboard:export", { data });
  }

  handleChartTypeChange(newType) {
    if (newType === this.chartType) return;
    this.chartType = newType;
    if (this.chartManager) this.chartManager.setChartType(newType);
  }

  render() {
    return Component.h("div", { className: "dashboard-main dashboard-page unified" }, [
      // Metrics section - loads independently
      // START WITH LOADING SKELETON
      Component.h("div", {
        className: "metrics-section loading-skeleton",
        "data-section": "metrics",
        "aria-busy": "true",
      }, [
        Component.h(window.StatsGrid, {
          metrics: this.state.metrics || this.metrics,
          gpuMetrics: this.state.gpuMetrics || this.gpuMetrics,
        }),
      ]),

      // Router & Quick Actions section - ALWAYS VISIBLE (no loading state)
      Component.h("div", { className: "dashboard-middle-row", "data-section": "router" }, [
        Component.h(window.LlamaRouterCard, {
          status: this.state.llamaStatus || this.status,
          routerStatus: this.state.routerStatus || this.routerStatus,
          models: this.state.models || this.models,
          presets: this.state.presets || this.presets,
          metrics: stateManager.get("llamaServerMetrics"),
          onAction: (action, data) => this._handleRouterAction(action, data),
        }),
        Component.h(window.QuickActions, {
          onRefresh: () => this._handleRefreshClick(),
        }),
      ]),

      // Charts & Health section - loads independently
      // START WITH LOADING SKELETON
      Component.h("div", {
        className: "content-row loading-skeleton",
        "data-section": "charts",
        "aria-busy": "true",
      }, [
        Component.h(window.ChartsSection, {
          history: this.state.history || this.history,
          chartStats: this.chartStats,
          chartManager: this.chartManager,
          onChartTypeChange: (type) => this.handleChartTypeChange(type),
        }),
        Component.h(window.SystemHealth, {
          metrics: this.state.metrics || this.metrics,
          gpuMetrics: this.state.gpuMetrics || this.gpuMetrics,
        }),
      ]),

      // GPU Details section - loads independently
      // START WITH LOADING SKELETON
      Component.h("div", {
        className: "content-row loading-skeleton",
        "data-section": "gpu",
        "aria-busy": "true",
      }, [
        Component.h(window.GpuDetails, {
          gpuList: (this.state.gpuMetrics || this.gpuMetrics)?.list || [],
        }),
      ]),
    ]);
  }

  _handleRouterAction(action, data) {
    // Emit action events for router interactions
    stateManager.emit("action:dashboard:routerAction", { action, data });
  }
}

window.DashboardPage = DashboardPage;
