/**
 * Dashboard Controller - Main controller with router actions
 */

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.chartUpdateInterval = null;
    this.chartManager = null; // Will be initialized when component mounts
    this._stateUnsubscribers = []; // Track state subscriptions for cleanup
  }

  init() {}

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
   * Register a state subscription for cleanup
   */
  _subscribe(key, callback) {
    const unsub = stateManager.subscribe(key, callback);
    this._stateUnsubscribers.push(unsub);
    return unsub;
  }

  /**
   * Cleanup all state subscriptions
   */
  _cleanupSubscriptions() {
    if (this._stateUnsubscribers && this._stateUnsubscribers.length > 0) {
      this._stateUnsubscribers.forEach((unsub) => {
        try {
          if (typeof unsub === "function") unsub();
        } catch (e) {
          console.warn("[Dashboard] Error cleaning up subscription:", e);
        }
      });
      this._stateUnsubscribers = [];
    }
  }

  willUnmount() {
    // Clean up chart interval
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval);
      this.chartUpdateInterval = null;
    }

    // Clean up chart manager
    if (this.chartManager) {
      this.chartManager.destroy();
      this.chartManager = null;
    }

    // Clean up subscriptions
    this._cleanupSubscriptions();
  }

  destroy() {
    this.willUnmount();
  }

  /**
   * Start chart updates using state subscription (no polling).
   * Updates the component whenever metrics or history changes.
   * @returns {void}
   */
  _startChartUpdates() {
    // Clean up any existing interval
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval);
      this.chartUpdateInterval = null;
    }

    // Subscribe to metrics and history changes
    this._subscribe("metricsHistory", (history) => {
      if (this.comp && Array.isArray(history) && history.length > 0) {
        const metrics = stateManager.get("metrics");
        this.comp.updateFromController(metrics, history);
      }
    });

    this._subscribe("metrics", (metrics) => {
      if (this.comp) {
        const history = stateManager.get("metricsHistory") || [];
        this.comp.updateFromController(metrics, history);
      }
    });
  }

  /**
    * Load data in parallel - no connection polling needed
    * State-socket handles queuing if not connected yet
    */
  _loadDataWhenConnected() {
    console.log("[DASHBOARD] Loading data (queued if not connected)...");
    this._loadDataAsync();
  }

  /**
    * Load all data in parallel - requests are queued by state-socket if not connected
    * Data updates UI as each piece arrives
    */
  _loadDataAsync() {
    console.log("[DASHBOARD] Starting parallel data requests...");

    // Use direct socket requests (bypass caching for initial load)
    // This ensures promises execute and resolve properly
    
    stateManager.socket.request("config:get")
      .then((config) => {
        console.log("[DASHBOARD] Config loaded");
        if (this.comp) this.comp.updateConfig(config);
      })
      .catch((e) => console.warn("[DASHBOARD] Config load failed:", e.message));

    stateManager.socket.request("models:list")
      .then((models) => {
        console.log("[DASHBOARD] Models loaded:", models?.models?.length || 0);
        if (this.comp) this.comp.updateModels(models);
      })
      .catch((e) => console.warn("[DASHBOARD] Models load failed:", e.message));

    stateManager.socket.request("metrics:get")
      .then((metrics) => {
        console.log("[DASHBOARD] Metrics loaded");
        if (this.comp) {
          const history = stateManager.get("metricsHistory") || [];
          this.comp.updateFromController(metrics?.metrics || null, history);
        }
      })
      .catch((e) => console.warn("[DASHBOARD] Metrics load failed:", e.message));

    stateManager.socket.request("metrics:history", { limit: 60 })
      .then((history) => {
        console.log("[DASHBOARD] History loaded:", history?.history?.length || 0);
        if (this.comp) {
          const metrics = stateManager.get("metrics");
          this.comp.updateFromController(metrics?.metrics || null, history?.history || []);
        }
      })
      .catch((e) => console.warn("[DASHBOARD] History load failed:", e.message));

    stateManager.socket.request("settings:get")
      .then((settings) => {
        console.log("[DASHBOARD] Settings loaded");
        if (this.comp) this.comp.updateSettings(settings);
      })
      .catch((e) => console.warn("[DASHBOARD] Settings load failed:", e.message));

    stateManager.socket.request("presets:list")
      .then((presets) => {
        console.log("[DASHBOARD] Presets loaded:", presets?.presets?.length || 0);
        if (this.comp) this.comp.updatePresets(presets);
      })
      .catch((e) => console.warn("[DASHBOARD] Presets load failed:", e.message));

    console.log("[DASHBOARD] All data requests fired (UI will update as data arrives)");
  }

  /**
    * Subscribe to metrics updates for real-time chart updates
    */
  _subscribeToMetrics() {
    console.log("[DASHBOARD] Setting up metrics subscriptions...");

    // Subscribe to metrics history changes and update charts
    this._stateUnsubscribers.push(
      stateManager.subscribe("metricsHistory", (history) => {
        if (this.comp && Array.isArray(history) && history.length > 0) {
          const metrics = stateManager.get("metrics");
          this.comp.updateFromController(metrics, history);
        }
      })
    );

    this._stateUnsubscribers.push(
      stateManager.subscribe("metrics", (metrics) => {
        if (this.comp) {
          const history = stateManager.get("metricsHistory") || [];
          this.comp.updateFromController(metrics, history);
        }
      })
    );
  }

  /**
   * Handle router actions from the UI (start, stop, restart, start-with-preset).
   * @param {string} action - The action to perform
   * @param {Object} data - Additional data for the action (e.g., preset name)
   * @returns {void}
   */
  handleRouterAction(action, data) {
    switch (action) {
    case "start": this._start(); break;
    case "start-with-preset": this._startWithPreset(data); break;
    case "stop": this._stop(); break;
    case "restart": this._restart(); break;
    }
  }

  /**
   * Set router loading state and update UI accordingly.
   * @param {boolean} loading - Whether router is in loading state
   * @returns {void}
   */
  _setLoading(loading) {
    stateManager.set("routerLoading", !!loading);
    if (this.comp) {
      this.comp.setRouterLoading(!!loading);
    }
  }

  /**
    * Start router with a specific preset configuration.
    * @param {string} presetName - Name of the preset to use
    * @returns {Promise<void>} Promise that resolves when router is started
    */
  async _startWithPreset(presetName) {
    this._setLoading(true);
    try {
      const settings = stateManager.get("settings") || {};
      const config = stateManager.get("config") || {};
      showNotification(`Starting with preset "${presetName}"...`, "info");

      const response = await stateManager.request("llama:start-with-preset", {
        presetName: presetName,
        maxModels: settings.maxModelsLoaded || 4,
        ctxSize: config.ctx_size || 4096,
        threads: 4,
      });

      if (response?.success || response?.port) {
        const port = response?.port || response?.data?.port;
        showNotification(`Server started on port ${port}`, "success");
        // Status will be updated automatically via broadcasts
      } else {
        showNotification(`Error: ${response?.error?.message || "Unknown error"}`, "error");
      }
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    } finally {
      this._setLoading(false);
    }
  }

  /**
     * Start the llama router server.
     * @returns {Promise<void>} Promise that resolves when server is started
     */
  async _start() {
    this._setLoading(true);
    try {
      console.log("[DASHBOARD] Starting router...");
      const response = await stateManager.startLlama();
      console.log("[DASHBOARD] Start response:", response);
      showNotification("Starting router...", "info");

      // Wait for status to become running
      const status = await this._waitForRouterStatus("running", 15000);
      if (status?.status === "running") {
        stateManager.set("llamaServerStatus", status);
        showNotification("Router started successfully", "success");
      } else {
        showNotification("Router start may have failed - please refresh", "warning");
      }
    } catch (e) {
      console.error("[DASHBOARD] Failed to start router:", e);
      showNotification(`Failed: ${e.message}`, "error");
    } finally {
      this._setLoading(false);
    }
  }

  /**
    * Wait for router status change via event subscription (no polling)
    * @private
    * @param {string} targetStatus - Status to wait for (e.g., "running")
    * @param {number} timeoutMs - Timeout in milliseconds
    * @returns {Promise<Object>} Router status object
    */
  async _waitForRouterStatus(targetStatus, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    return new Promise((resolve, reject) => {
      // Check current status first
      const currentStatus = stateManager.get("llamaServerStatus");
      if (currentStatus?.status === targetStatus) {
        clearTimeout(timeoutHandle);
        return resolve(currentStatus);
      }

      // Subscribe to status changes (event-driven, no polling)
      const unsubscribe = stateManager.subscribe("llamaServerStatus", (status) => {
        console.log("[DASHBOARD] Status changed:", status);
        if (status?.status === targetStatus) {
          clearTimeout(timeoutHandle);
          controller.signal.removeEventListener("abort", onAbort);
          unsubscribe();
          resolve(status);
        }
      });

      // Handle timeout
      const onAbort = () => {
        unsubscribe();
        reject(new Error(`Router did not reach "${targetStatus}" status within ${timeoutMs}ms`));
      };

      controller.signal.addEventListener("abort", onAbort);
    });
  }

  /**
     * Stop the llama router server after user confirmation.
     * @returns {Promise<void>} Promise that resolves when server is stopped
     */
  async _stop() {
    if (!confirm("Stop router?")) return;
    this._setLoading(true);
    try {
      console.log("[DASHBOARD] Stopping router...");
      const result = await stateManager.stopLlama();
      console.log("[DASHBOARD] Stop response:", result);
      showNotification("Router stopped", "success");
    } catch (e) {
      console.error("[DASHBOARD] Failed to stop router:", e);
      showNotification(`Failed: ${e.message}`, "error");
    } finally {
      this._setLoading(false);
    }
  }

  /**
     * Restart the llama router server.
     * @returns {Promise<void>} Promise that resolves when server is restarted
     */
  async _restart() {
    this._setLoading(true);
    try {
      console.log("[DASHBOARD] Restarting router...");
      await stateManager.restartLlama();
      showNotification("Router restarted", "success");
    } catch (e) {
      console.error("[DASHBOARD] Failed to restart router:", e);
      showNotification(`Failed: ${e.message}`, "error");
    } finally {
      this._setLoading(false);
    }
  }

  /**
    * Render the dashboard page - called by router
    * @returns {HTMLElement} The rendered page element
    */
  render() {
    console.log("[DASHBOARD] Render - creating page component...");

    // Ensure chartManager is created
    this._ensureChartManager();

    // Create page component with chartManager
    this.comp = new DashboardPage({ controller: this, chartManager: this.chartManager }); // Pass controller and chartManager to page

    // Render component to HTML element (this.comp.render() now returns a DOM element)
    const el = this.comp.render();

    // Ensure el is a valid Node before proceeding
    if (!(el instanceof Node)) {
      console.error("[DASHBOARD] DashboardPage.render() did not return a valid DOM element:", el);
      // Fallback or throw error to trigger error boundary
      return document.createElement("div"); // Return an empty div to prevent further errors
    }

    // Link component to DOM element
    this.comp._el = el;
    el._component = this.comp; // This line will now work as el is a valid Node

    // Bind events
    this.comp.bindEvents();

    // Start chart updates if component supports it
    if (this.comp.updateFromController && typeof this.comp.updateFromController === "function") {
      this._startChartUpdates();
    }

    // Call onMount for the component
    this.comp.onMount?.();

    console.log("[DASHBOARD] Render complete");
    return el;
  }
}

window.DashboardController = DashboardController;
