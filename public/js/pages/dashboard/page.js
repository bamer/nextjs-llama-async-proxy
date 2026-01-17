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
    console.log("[DashboardPage] onMount called");
    console.log("[DashboardPage] controller exists:", !!this.controller);

    // Remove GPU section loading skeleton immediately for instant loading
    this._updateGPUSection();

    // Skeleton UI is already applied during render(), but ensure it's there
    this._renderSkeletonUI();

    // Start loading data asynchronously - fire and forget, updates arrive independently
    console.log("[DashboardPage] Calling controller._loadDataWhenConnected()");
    if (this.controller) {
      this.controller._loadDataWhenConnected();
    } else {
      console.warn("[DashboardPage] Controller is undefined!");
    }

    // Subscribe to state changes - updates will flow in as data arrives
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
        this._updatePresetsSection();
      })
    );

    // Subscribe to metrics updates - arrive independently
    this.unsubscribers.push(
      stateManager.subscribe("metrics", (m) => {
        console.log("[DashboardPage] Metrics subscription fired with:", m);
        this.handleMetricsChange(m);
        this._updateMetricsSection();
      })
    );

    // Subscribe to metrics history updates (for charts) - arrives independently
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

  handleMetricsChange(metrics) {
    this.metrics = metrics || { cpu: { usage: 0 }, memory: { used: 0 }, gpu: null };
    this.gpuMetrics = metrics?.gpu || { usage: 0, memoryUsed: 0, memoryTotal: 0, list: [] };
    this.history = stateManager.get("metricsHistory") || [];

    if (this.chartManager && this.history.length > 0) {
      this.chartManager.updateCharts(metrics, this.history);
    }

    // Update SystemHealth and GpuDetails components directly
    this._updateSystemHealthAndGPU();
  }

  _updateSystemHealthAndGPU() {
    // Update SystemHealth component
    const systemHealth = this._el?.querySelector(".health-section")?._component;
    if (systemHealth) {
      systemHealth.updateMetrics(this.metrics, this.gpuMetrics);
    }

    // Update GpuDetails component
    const gpuDetails = this._el?.querySelector(".gpu-details")?._component;
    if (gpuDetails) {
      gpuDetails.gpuList = this.gpuMetrics?.list || [];
      gpuDetails._updateGPUUI();
    }

    // Remove loading skeletons
    this._updateGPUSection();
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

  updatePresets(presetsData) {
    // Handle both direct preset list and wrapped response
    const presets = presetsData?.presets || presetsData || [];
    console.log("[DASHBOARD] updatePresets called with:", {
      hasPresetsKey: !!presetsData?.presets,
      dataType: typeof presetsData,
      count: presets.length,
      presets: presets.map((p) => ({ name: p.name || p })),
    });
    stateManager.set("presets", presets);
    this._updatePresetsSection();
    console.log("[DASHBOARD] Presets updated:", presets.length);
  }

  updateSettings(settings) {
    stateManager.set("settings", settings);
    console.log("[DASHBOARD] Settings updated");
  }

  updateConfig(config) {
    stateManager.set("config", config);
    console.log("[DASHBOARD] Config updated");
  }

  updateModels(modelsData) {
    const models = modelsData?.models || modelsData || [];
    stateManager.set("models", models);
    console.log("[DASHBOARD] Models updated:", models.length);
  }

  updateFromController(metrics, history) {
    this.metrics = metrics || this.metrics;
    this.gpuMetrics = metrics?.gpu || this.gpuMetrics;
    this.history = history;

    if (this.chartManager) {
      this.chartManager.updateCharts(metrics, history);
    }

    // Remove loading skeleton for metrics
    this._updateMetricsSection();

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

    // Update charts section
    this._updateChartsSection();

    // Update GPU section loading state
    this._updateGPUSection();
  }

  _updateChartsSection() {
    const section = this.$("[data-section='charts']");
    if (section) {
      console.log("[DashboardPage] _updateChartsSection - removing skeleton");
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
    }

    const chartsSection = this._el?.querySelector(".charts-section")?._component;
    if (chartsSection) {
      chartsSection.history = this.history;
      chartsSection.updateDOM();
      // Ensure charts are initialized if they haven't been yet
      if (!chartsSection.chartsInitialized && this.chartManager) {
        chartsSection._initCharts();
      }
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
    return Component.h("div", { className: "dashboard-main dashboard-page unified" }, [
      // Metrics section - loads independently
      // START WITH LOADING SKELETON
      Component.h("div", {
        className: "metrics-section loading-skeleton",
        "data-section": "metrics",
        "aria-busy": "true",
      }, [
        Component.h(window.StatsGrid, {
          metrics: this.metrics,
          gpuMetrics: this.gpuMetrics,
        }),
      ]),

      // Router & Quick Actions section - ALWAYS VISIBLE (no loading state)
      Component.h("div", { className: "dashboard-middle-row", "data-section": "router" }, [
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

      // Charts & Health section - loads independently
      // START WITH LOADING SKELETON
      Component.h("div", {
        className: "content-row loading-skeleton",
        "data-section": "charts",
        "aria-busy": "true",
      }, [
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

      // GPU Details section - loads independently
      // START WITH LOADING SKELETON
      Component.h("div", {
        className: "content-row loading-skeleton",
        "data-section": "gpu",
        "aria-busy": "true",
      }, [
        Component.h(window.GpuDetails, {
          gpuList: this.gpuMetrics?.list || [],
        }),
      ]),
    ]);
  }
}

window.DashboardPage = DashboardPage;
