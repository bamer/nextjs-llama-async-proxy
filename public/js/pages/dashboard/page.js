/**
 * Dashboard Page - Socket-First Event-Driven DOM Updates
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

    // Track which sections have been initialized (skeleton removed)
    this._sectionsInitialized = {
      metrics: false,
      charts: false,
      gpu: false,
      presets: false,
    };
    this.loading = false;
    this.selectedPreset = null;
    this.chartManager = props.chartManager;
    this.unsubscribers = [];
    this.routerCardUpdater = null;
  }

  onMount() {
    console.log("[DashboardPage] onMount - subscribing to socket broadcasts");

    // Remove GPU section loading skeleton immediately for instant loading
    this._updateGPUSection();

    // Skeleton UI is already applied during render(), but ensure it's there
    this._renderSkeletonUI();

    // Subscribe to socket broadcasts for real-time updates
    this.unsubscribers.push(
      socketClient.on("metrics:updated", (data) => {
        this._onMetricsChange(data.metrics);
      }),
      socketClient.on("metrics:history:updated", (data) => {
        this._onHistoryChange(data.history);
      }),
      socketClient.on("models:updated", (data) => {
        this._onModelsChange(data.models);
      }),
      socketClient.on("presets:updated", (data) => {
        this._onPresetsChange(data.presets);
      }),
      socketClient.on("config:updated", (data) => {
        this._onConfigChange(data.config);
      }),
      socketClient.on("settings:updated", (data) => {
        this._onSettingsChange(data.settings);
      }),
      socketClient.on("llama:status", (data) => {
        this._onLlamaStatusChange(data.status);
      }),
      socketClient.on("router:status", (data) => {
        this._onRouterStatusChange(data);
      })
    );

    // Load initial data via socketClient
    this._loadInitialData();
  }

  async _loadInitialData() {
    try {
      // Load all data in parallel using socketClient
      const [metricsRes, historyRes, modelsRes, presetsRes, routerConfig, settingsRes, llamaStatusRes] =
        await Promise.all([
          socketClient.request("metrics:get", {}),
          socketClient.request("metrics:history", { limit: 60 }),
          socketClient.request("models:list", {}),
          socketClient.request("presets:list", {}),
          socketClient.request("routerConfig:get", {}),
          socketClient.request("settings:get", {}),
          socketClient.request("llama:status", {}),
        ]);

      // Update local state from responses
      if (metricsRes.success) {
        this.state.metrics = metricsRes.data || null;
        this.state.gpuMetrics = metricsRes.data?.gpu || {
          usage: 0,
          memoryUsed: 0,
          memoryTotal: 0,
          list: [],
        };
      }

      if (historyRes.success) {
        this.state.history = historyRes.data || [];
      }

      if (modelsRes.success) {
        this.state.models = modelsRes.data || [];
      }

      if (presetsRes.success) {
        this.state.presets = presetsRes.data.presets || [];
      }

      if (routerConfig.success) {
        this.state.config = routerConfig.data.config || {};
      }

      if (settingsRes.success) {
        this.state.settings = settingsRes.data || {};
      }

      if (llamaStatusRes.success) {
        this.state.llamaStatus = llamaStatusRes.data || null;
        this.state.routerStatus = llamaStatusRes.data || null;
      }

      // Update UI with loaded data
      this._syncStateToUI();
    } catch (error) {
      console.error("[DashboardPage] Failed to load initial data:", error);
    }
  }

  /**
   * Sync all local state data to UI - called on mount and after initial load
   */
  _syncStateToUI() {
    // Use local state instead of stateManager
    const metrics = this.state.metrics;
    const history = this.state.history;
    const models = this.state.models;
    const presets = this.state.presets;
    const config = this.state.config;
    const settings = this.state.settings;
    const llamaStatus = this.state.llamaStatus;
    const routerStatus = this.state.routerStatus;

    // Update UI for each data source
    if (metrics) {
      this._updateMetricsUI();
      this._updateSystemHealthAndGPU();
    }

    if (history && history.length > 0) {
      this._updateHistoryUI();
    }

    if (models) {
      this._updateModelsUI();
    }

    if (presets) {
      this._updatePresetsUI();
    }

    if (config) {
      this._updateConfigUI();
    }

    if (settings) {
      this._updateSettingsUI();
    }

    if (llamaStatus) {
      this._updateLlamaStatusUI();
    }

    if (routerStatus) {
      this._updateRouterStatusUI();
    }

    console.log("[DashboardPage] _syncStateToUI - state synced from socket responses");
  }

  _onMetricsChange(metrics) {
    if (metrics !== this.state.metrics) {
      this.state.metrics = metrics;
      this.state.gpuMetrics =
        metrics?.gpu || {
          usage: 0,
          memoryUsed: 0,
          memoryTotal: 0,
          list: [],
        };
      this._updateMetricsUI();
      this._updateSystemHealthAndGPU();
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
    this.chartStats =
      history.length > 0 && window.DashboardUtils?._calculateStats
        ? window.DashboardUtils._calculateStats(history)
        : {
            current: 0,
            avg: 0,
            max: 0,
          };
  }

  _updateModelsUI() {
    // Models are displayed in LlamaRouterCard
    console.log(
      "[DashboardPage] _updateModelsUI - models updated:",
      this.state.models.length
    );
  }

  _updatePresetsUI() {
    // Update LlamaRouterCard with presets data
    const routerCard = this.$(".llama-router-status-card")?._component;
    if (routerCard) {
      const currentPresets = this.state.presets || [];
      routerCard.props.presets = currentPresets;
      // Force update if the method exists
      if (typeof routerCard._updatePresetSelect === "function") {
        routerCard._updatePresetSelect();
      }
      console.log(
        "[DashboardPage] _updatePresetsUI - directly updated routerCard:",
        currentPresets.length
      );
    } else {
      console.warn(
        "[DashboardPage] _updatePresetsUI - routerCard not found!"
      );
      // Debug: list all components with _component reference
      const allComponents = this._el?.querySelectorAll("[class*='llama']");
      if (allComponents) {
        console.log(
          "[DashboardPage] Found elements with 'llama' class:",
          allComponents.length
        );
        Array.from(allComponents).forEach((el) => {
          console.log(
            "  -",
            el.className,
            "has _component:",
            !!el._component
          );
        });
      }
    }
    this._updatePresetsSection();
  }

  _updateConfigUI() {
    console.log("[DashboardPage] _updateConfigUI - config updated");
  }

  _updateSettingsUI() {
    console.log("[DashboardPage] _updateSettingsUI - settings updated");
  }

  _updateLlamaStatusUI() {
    // LlamaRouterCard subscribes to state, no direct update needed
    console.log(
      "[DashboardPage] _updateLlamaStatusUI - status:",
      this.state.llamaStatus
    );
  }

  _updateRouterStatusUI() {
    // LlamaRouterCard subscribes to state, no direct update needed
    console.log(
      "[DashboardPage] _updateRouterStatusUI - routerStatus:",
      this.state.routerStatus
    );
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
    const metricsSection = this.$('[data-section="metrics"]');
    const chartsSection = this.$('[data-section="charts"]');
    const gpuSection = this.$('[data-section="gpu"]');

    // GPU section should load instantly - remove skeleton immediately
    if (gpuSection) {
      gpuSection.classList.remove("loading-skeleton");
      gpuSection.setAttribute("aria-busy", "false");
    }

    // Only add skeleton if data hasn't loaded yet (check local state)
    if (metricsSection && !this.state.metrics) {
      metricsSection.classList.add("loading-skeleton");
    }
    if (chartsSection && (!this.state.history || this.state.history.length === 0)) {
      chartsSection.classList.add("loading-skeleton");
    }

    // Check if we have cached GPU data and update immediately
    if (this.state.metrics?.gpu?.list) {
      this._updateGPUWithCachedData(this.state.metrics);
    }
  }

  _updateMetricsSection() {
    if (this._sectionsInitialized.metrics) return; // Already initialized
    const section = this.$("[data-section='metrics']");
    if (section) {
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
      this._sectionsInitialized.metrics = true;
    }
  }

  _updateChartsSection() {
    if (this._sectionsInitialized.charts) return; // Already initialized
    const section = this.$("[data-section='charts']");
    if (section) {
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
      this._sectionsInitialized.charts = true;
    }
  }

  _updateGPUSection() {
    if (this._sectionsInitialized.gpu) return; // Already initialized
    const section = this.$("[data-section='gpu']");
    if (section) {
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
      this._sectionsInitialized.gpu = true;
    }
  }

  _updatePresetsSection() {
    if (this._sectionsInitialized.presets) return; // Already initialized
    const section = this.$("[data-section='presets']");
    if (section) {
      section.classList.remove("loading-skeleton");
      section.setAttribute("aria-busy", "false");
      this._sectionsInitialized.presets = true;
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
      console.log(
        "[DashboardPage] Updated GPU with cached data:",
        metrics?.gpu?.list?.length || 0
      );
    }
  }

  _updateSystemHealthAndGPU() {
    // Update SystemHealth component
    const systemHealth = this._el?.querySelector(".health-section")?._component;
    if (systemHealth) {
      systemHealth.updateMetrics(this.state.metrics, this.state.gpuMetrics);
    }

    // Remove GPU section skeleton
    this._updateGPUSection();

    // Update GpuDetails component - with robust error handling
    const gpuContainer = this._el?.querySelector('[data-section="gpu"]');
    const gpuDetailsEl = gpuContainer?.querySelector(".gpu-details");
    const gpuDetails = gpuDetailsEl?._component;

    if (gpuDetails) {
      // Create synthetic GPU entry from aggregate metrics if list is empty
      let gpuList = this.state.gpuMetrics?.list || [];
      if (
        gpuList.length === 0 &&
        this.state.gpuMetrics?.usage !== undefined
      ) {
        // No per-GPU data available, create synthetic entry from aggregate metrics
        gpuList = [
          {
            name: "GPU",
            vendor: "Unknown",
            usage: this.state.gpuMetrics.usage,
            memoryUsed: this.state.gpuMetrics.memoryUsed,
            memoryTotal: this.state.gpuMetrics.memoryTotal,
          },
        ];
      }
      gpuDetails.gpuList = gpuList;
      // Ensure the component has its _el set before updating UI
      if (!gpuDetails._el && gpuDetailsEl) {
        gpuDetails._el = gpuDetailsEl;
      }
      gpuDetails._updateGPUUI();
    } else if (gpuDetailsEl) {
      // Fallback: Direct DOM update if component reference is missing
      const noDataEl = gpuDetailsEl.querySelector(".gpu-no-data");
      if (noDataEl) {
        noDataEl.remove();
      }
      // Create synthetic GPU entry from aggregate metrics if list is empty
      let gpuList = this.state.gpuMetrics?.list || [];
      if (
        gpuList.length === 0 &&
        this.state.gpuMetrics?.usage !== undefined
      ) {
        gpuList = [
          {
            name: "GPU",
            vendor: "Unknown",
            usage: this.state.gpuMetrics.usage,
            memoryUsed: this.state.gpuMetrics.memoryUsed,
            memoryTotal: this.state.gpuMetrics.memoryTotal,
          },
        ];
      }
      // Re-render the GPU component
      const newGpuDetails = new window.GpuDetails({
        gpuList: gpuList,
      });
      gpuDetailsEl.innerHTML = newGpuDetails.render();
      gpuDetailsEl._component = newGpuDetails;
      newGpuDetails._el = gpuDetailsEl;
      newGpuDetails.bindEvents();
      newGpuDetails.onMount?.();
      console.log("[DashboardPage] GpuDetails recreated via fallback");
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

  /**
   * Called after component is fully mounted to DOM - sync state to UI
   * This runs after all child components are mounted, so routerCard is available
   */
  didMount() {
    console.log("[DashboardPage] didMount - syncing state to UI");
    this._syncStateToUI();
  }

  _handleChartZoom(range) {
    // Use direct socket call instead of stateManager.emit
    console.log("[DashboardPage] _handleChartZoom - range:", range);
    // Trigger chart zoom via direct UI update
    if (this.chartManager) {
      this.chartManager.setZoomRange(range);
    }
  }

  async _handleRefreshClick() {
    // Use direct socket call instead of stateManager.emit
    console.log("[DashboardPage] _handleRefreshClick - reloading data");
    this._setLoading(true);
    await this._loadInitialData();
    this._setLoading(false);
  }

  _handleExportMetrics() {
    // Export metrics data directly
    const data = {
      metrics: this.state.metrics,
      history: this.state.history,
      exportedAt: new Date().toISOString(),
    };
    console.log("[DashboardPage] _handleExportMetrics - exporting data");
    // Trigger download directly
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  handleChartTypeChange(newType) {
    if (newType === this.chartType) return;
    this.chartType = newType;
    if (this.chartManager) this.chartManager.setChartType(newType);
  }

  render() {
    return Component.h(
      "div",
      { className: "dashboard-main dashboard-page unified" },
      [
        // Metrics section - loads independently
        // START WITH LOADING SKELETON
        Component.h(
          "div",
          {
            className: "metrics-section loading-skeleton",
            "data-section": "metrics",
            "aria-busy": "true",
          },
          [
            Component.h(window.StatsGrid, {
              metrics: this.state.metrics || this.metrics,
              gpuMetrics: this.state.gpuMetrics || this.gpuMetrics,
            }),
          ]
        ),

        // Router & Quick Actions section - ALWAYS VISIBLE (no loading state)
        Component.h(
          "div",
          { className: "dashboard-middle-row", "data-section": "router" },
          [
            Component.h(window.LlamaRouterCard, {
              status: this.state.llamaStatus || this.status,
              routerStatus: this.state.routerStatus || this.routerStatus,
              models: this.state.models || this.models,
              presets: this.state.presets || this.presets,
              metrics: this.state.metrics || null,
              onAction: (action, data) => this._handleRouterAction(action, data),
            }),
            Component.h(window.QuickActions, {
              onRefresh: () => this._handleRefreshClick(),
            }),
          ]
        ),

        // Charts & Health section - loads independently
        // START WITH LOADING SKELETON
        Component.h(
          "div",
          {
            className: "content-row loading-skeleton",
            "data-section": "charts",
            "aria-busy": "true",
          },
          [
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
          ]
        ),

        // GPU Details section - loads independently
        // START WITH LOADING SKELETON
        Component.h(
          "div",
          {
            className: "content-row loading-skeleton",
            "data-section": "gpu",
            "aria-busy": "true",
          },
          [
            Component.h(window.GpuDetails, {
              gpuList: (this.state.gpuMetrics || this.gpuMetrics)?.list || [],
            }),
          ]
        ),
      ]
    );
  }

  _handleRouterAction(action, data) {
    // Delegate to router-actions handler (global function)
    if (typeof window.handleRouterAction === "function") {
      window
        .handleRouterAction(action, data)
        .catch((err) => {
          console.error("[DashboardPage] Router action error:", err);
        });
    } else {
      console.error("[DashboardPage] handleRouterAction not found!");
    }
  }
}

window.DashboardPage = DashboardPage;
