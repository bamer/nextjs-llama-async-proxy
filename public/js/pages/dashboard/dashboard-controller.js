/**
 * Dashboard Controller - Socket-First Architecture
 *
 * Socket contracts:
 * - metrics:get           GET current metrics
 * - metrics:history       GET historical metrics
 * - models:list           GET all models
 * - config:get            GET configuration
 * - settings:get          GET application settings
 * - presets:list          GET all presets
 * - router:start          POST start router
 * - router:stop           POST stop router
 * - router:restart        POST restart router
 * - router:start-preset   POST start with preset
 * - metrics:updated       [BROADCAST] Metrics changed
 * - router:status         [BROADCAST] Router status changed
 */

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.chartManager = null;
    this.socketUnsubscribers = [];
    this.routerLoading = false; // Local state instead of stateManager
  }

  /**
   * Initialize the ChartManager when first needed
   */
  _ensureChartManager() {
    if (!this.chartManager && typeof ChartManager !== "undefined") {
      console.log("[DASHBOARD] Creating ChartManager instance");
      this.chartManager = new ChartManager({});
    }
    return this.chartManager;
  }

  /**
   * Handle config update action from component
   */
  _handleConfigUpdate(config) {
    // No-op: config is not cached
  }

  /**
   * Handle chart zoom action from component
   */
  _handleChartZoom(range) {
    // No-op: zoom is local state
  }

  /**
   * Handle export action from component
   */
  _handleExport(data) {
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-metrics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  willUnmount() {
    // Clean up socket subscriptions
    if (this.socketUnsubscribers && this.socketUnsubscribers.length > 0) {
      this.socketUnsubscribers.forEach((unsub) => {
        try {
          if (typeof unsub === "function") unsub();
        } catch (e) {
          console.warn("[Dashboard] Error cleaning up subscription:", e);
        }
      });
      this.socketUnsubscribers = [];
    }

    // Clean up chart manager
    if (this.chartManager) {
      this.chartManager.destroy();
      this.chartManager = null;
    }

    // Clean up component
    if (this.comp) {
      this.comp.destroy?.();
      this.comp = null;
    }
  }

  destroy() {
    this.willUnmount();
  }

  /**
   * Load all data in parallel via socket calls
   */
  async _loadDataAsync() {
    try {
      console.log("[DASHBOARD] Loading data via socket...");

      const [configRes, modelsRes, metricsRes, historyRes, settingsRes, presetsRes] =
        await Promise.all([
          socketClient.request("config:get", {}),
          socketClient.request("models:list", {}),
          socketClient.request("metrics:get", {}),
          socketClient.request("metrics:history", { limit: 60 }),
          socketClient.request("settings:get", {}),
          socketClient.request("presets:list", {}),
        ]);

      // Return loaded data (no caching)
      const data = {
        config: configRes.success ? configRes.data.config || {} : {},
        models: modelsRes.success ? modelsRes.data || [] : [],
        metrics: metricsRes.success ? metricsRes.data : null,
        metricsHistory: historyRes.success ? historyRes.data || [] : [],
        settings: settingsRes.success ? settingsRes.data || {} : {},
        presets: presetsRes.success ? presetsRes.data.presets || [] : [],
      };

      console.log("[DASHBOARD] All data loaded successfully");
      return data;
    } catch (e) {
      console.error("[DASHBOARD] Failed to load data:", e);
      showNotification("Failed to load dashboard data", "error");
      return null;
    }
  }

  /**
   * Start router with a specific preset configuration
   */
  async _startWithPreset(presetName) {
    this.routerLoading = true;

    try {
      console.log("[DEBUG] Starting router with preset:", presetName);
      showNotification(`Starting with preset "${presetName}"...`, "info");

      const response = await socketClient.request("router:start-preset", {
        presetName,
      });

      if (response.success) {
        showNotification(
          `Router started with preset "${presetName}"`,
          "success"
        );
        // Server broadcasts router:status
      } else {
        showNotification(`Failed: ${response.error}`, "error");
      }
    } catch (e) {
      console.error("[DASHBOARD] Failed to start with preset:", e);
      showNotification(`Error: ${e.message}`, "error");
    } finally {
      this.routerLoading = false;
    }
  }

  /**
   * Start the llama router server
   */
  async _start() {
    this.routerLoading = true;

    try {
      console.log("[DEBUG] Starting router");
      showNotification("Starting router...", "info");

      const response = await socketClient.request("router:start", {});

      if (response.success) {
        showNotification("Router started successfully", "success");
        // Server broadcasts router:status
      } else {
        showNotification(`Failed: ${response.error}`, "error");
      }
    } catch (e) {
      console.error("[DASHBOARD] Failed to start router:", e);
      showNotification(`Error: ${e.message}`, "error");
    } finally {
      this.routerLoading = false;
    }
  }

  /**
   * Stop the llama router server
   */
  async _stop() {
    if (!confirm("Stop router?")) return;

    this.routerLoading = true;

    try {
      console.log("[DEBUG] Stopping router");

      const response = await socketClient.request("router:stop", {});

      if (response.success) {
        showNotification("Router stopped", "success");
        // Server broadcasts router:status
      } else {
        showNotification(`Failed: ${response.error}`, "error");
      }
    } catch (e) {
      console.error("[DASHBOARD] Failed to stop router:", e);
      showNotification(`Error: ${e.message}`, "error");
    } finally {
      this.routerLoading = false;
    }
  }

  /**
   * Restart the llama router server
   */
  async _restart() {
    this.routerLoading = true;

    try {
      console.log("[DEBUG] Restarting router");

      const response = await socketClient.request("router:restart", {});

      if (response.success) {
        showNotification("Router restarted successfully", "success");
        // Server broadcasts router:status
      } else {
        showNotification(`Failed: ${response.error}`, "error");
      }
    } catch (e) {
      console.error("[DASHBOARD] Failed to restart router:", e);
      showNotification(`Error: ${e.message}`, "error");
    } finally {
      this.routerLoading = false;
    }
  }

  /**
   * Render the dashboard page
   */
  render() {
    console.log("[DASHBOARD] Render - creating page component...");

    // Ensure chartManager is created
    this._ensureChartManager();

    // Create page component with chartManager
    this.comp = new DashboardPage({ chartManager: this.chartManager });

    // Render component to DOM
    const el = this.comp.render();

    if (!(el instanceof Node)) {
      console.error("[DASHBOARD] DashboardPage.render() did not return a valid DOM element");
      return document.createElement("div");
    }

    // Link component to DOM element
    this.comp._el = el;
    el._component = this.comp;

    // Bind events
    this.comp.bindEvents();

    // Load initial data
    this._loadDataAsync();

    // Call onMount
    this.comp.onMount?.();

    console.log("[DASHBOARD] Render complete");
    return el;
  }

  /**
   * Called after component is mounted to DOM
   */
  didMount() {
    console.log("[DASHBOARD] didMount");
    if (this.comp && this.comp.didMount) {
      this.comp.didMount();
    }
  }
}

window.DashboardController = DashboardController;
