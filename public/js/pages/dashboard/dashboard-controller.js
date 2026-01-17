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
    * Load data when socket is connected - truly async, no waiting
    */
  _loadDataWhenConnected() {
    console.log("[DASHBOARD] _loadDataWhenConnected called, isConnected:", stateManager.isConnected());

    // If already connected, load data immediately
    if (stateManager.isConnected()) {
      console.log("[DASHBOARD] Already connected, loading data in background...");
      this._loadData();
      return;
    }

    // Subscribe to connection and load when ready (no await, no blocking)
    console.log("[DASHBOARD] Will load data when connected...");
    const unsub = stateManager.subscribe("connectionStatus", (status) => {
      if (status === "connected") {
        unsub();
        console.log("[DASHBOARD] Connection established, loading data in background...");
        this._loadData();
      }
    });
  }

  /**
    * Load all data in background - truly async, parallel requests, no timeouts.
    * Data updates UI as it arrives, no waiting for all requests to complete.
    */
  _loadData() {
    console.log("[DASHBOARD] _loadData() called");

    // If not connected yet, schedule it for later (don't block)
    if (!stateManager.isConnected()) {
      console.log("[DASHBOARD] Not connected yet, scheduling data load...");
      const checkConnection = setInterval(() => {
        if (stateManager.isConnected()) {
          clearInterval(checkConnection);
          console.log("[DASHBOARD] Now connected, starting data load...");
          this._loadDataAsync();
        }
      }, 100);
      return;
    }

    // Connected, load data immediately
    this._loadDataAsync();
  }

  /**
    * Actual data loading - parallel requests, no waiting, update UI as data arrives
    */
  _loadDataAsync() {
    console.log("[DASHBOARD] Starting data loading (truly async)...");

    // Fire ALL requests in parallel - no await, no blocking
    // Each request updates the UI independently when it completes
    stateManager.getConfig()
      .then((config) => {
        console.log("[DASHBOARD] Config loaded");
        if (this.comp) this.comp.updateConfig(config);
      })
      .catch((e) => console.warn("[DASHBOARD] Config load failed:", e.message));

    stateManager.getModels()
      .then((models) => {
        console.log("[DASHBOARD] Models loaded:", models?.models?.length || 0, "models");
        if (this.comp) this.comp.updateModels(models);
      })
      .catch((e) => console.warn("[DASHBOARD] Models load failed:", e.message));

    stateManager.getMetrics()
      .then((metrics) => {
        console.log("[DASHBOARD] Metrics loaded");
        if (this.comp) {
          const history = stateManager.get("metricsHistory") || [];
          this.comp.updateFromController(metrics?.metrics || null, history);
        }
      })
      .catch((e) => console.warn("[DASHBOARD] Metrics load failed:", e.message));

    stateManager.getMetricsHistory({ limit: 60 })
      .then((history) => {
        console.log("[DASHBOARD] History loaded:", history?.history?.length || 0, "records");
        if (this.comp) {
          const metrics = stateManager.get("metrics");
          this.comp.updateFromController(metrics?.metrics || null, history?.history || []);
        }
      })
      .catch((e) => console.warn("[DASHBOARD] History load failed:", e.message));

    stateManager.getSettings()
      .then((settings) => {
        console.log("[DASHBOARD] Settings loaded");
        if (this.comp) this.comp.updateSettings(settings);
      })
      .catch((e) => console.warn("[DASHBOARD] Settings load failed:", e.message));

    stateManager.request("presets:list")
      .then((presets) => {
        console.log("[DASHBOARD] Presets loaded:", presets?.presets?.length || 0, "presets");
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
  _startWithPreset(presetName) {
    this._setLoading(true);
    const settings = stateManager.get("settings") || {};
    const config = stateManager.get("config") || {};
    showNotification(`Starting with preset "${presetName}"...`, "info");

    stateManager.request("llama:start-with-preset", {
      presetName: presetName,
      maxModels: settings.maxModelsLoaded || 4,
      ctxSize: config.ctx_size || 4096,
      threads: 4,
    }).then((response) => {
      if (response?.success || response?.port) {
        const port = response?.port || response?.data?.port;
        showNotification(`Server started on port ${port}`, "success");
        // Status will be updated automatically via broadcasts
        // No manual status update needed - StateLlamaServer handles it
        setTimeout(() => {
          this._setLoading(false);
        }, 3000);
      } else {
        showNotification(`Error: ${response?.error?.message || "Unknown error"}`, "error");
        this._setLoading(false);
      }
    }).catch((e) => {
      showNotification(`Failed: ${e.message}`, "error");
      this._setLoading(false);
    });
  }

  /**
    * Start the llama router server.
    * @returns {Promise<void>} Promise that resolves when server is started
    */
  _start() {
    this._setLoading(true);
    console.log("[DASHBOARD] Starting router...");
    stateManager.startLlama().then((response) => {
      console.log("[DASHBOARD] Start response:", response);
      showNotification("Starting router...", "info");

      // Poll for status until running or timeout
      let attempts = 0;
      const maxAttempts = 15; // 15 seconds max
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const s = await stateManager.getLlamaStatus();
          console.log(`[DASHBOARD] Status check ${attempts}:`, s);

          if (s?.status === "running") {
            clearInterval(pollInterval);
            stateManager.set("llamaServerStatus", s);
            showNotification("Router started successfully", "success");
            this._setLoading(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            console.warn("[DASHBOARD] Timeout waiting for router to start");
            showNotification("Router start may have failed - please refresh", "warning");
            this._setLoading(false);
          }
        } catch (e) {
          console.warn(`[DASHBOARD] Status check ${attempts} failed:`, e.message);
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            this._setLoading(false);
          }
        }
      }, 1000);
    }).catch((e) => {
      console.error("[DASHBOARD] Failed to start router:", e);
      showNotification(`Failed: ${e.message}`, "error");
      this._setLoading(false);
    });
  }

  /**
    * Stop the llama router server after user confirmation.
    * @returns {Promise<void>} Promise that resolves when server is stopped
    */
  _stop() {
    if (!confirm("Stop router?")) return;
    this._setLoading(true);
    console.log("[DASHBOARD] Stopping router...");

    stateManager.stopLlama()
      .then((result) => {
        console.log("[DASHBOARD] Stop response:", result);
        showNotification("Stopping router...", "info");
        // Status will be updated automatically via broadcasts
        // No manual status update needed
        setTimeout(() => {
          this._setLoading(false);
          showNotification("Router stopped", "success");
        }, 2000);
      })
      .catch((e) => {
        console.error("[DASHBOARD] Failed to stop router:", e);
        showNotification(`Failed: ${e.message}`, "error");
        this._setLoading(false);
      });
  }

  /**
    * Restart the llama router server.
    * @returns {Promise<void>} Promise that resolves when server is restarted
    */
  _restart() {
    this._setLoading(true);
    console.log("[DASHBOARD] Restarting router...");
    stateManager.restartLlama().then(() => {
      showNotification("Restarting router...", "info");
      // Status will be updated automatically via broadcasts
      // No manual status update needed
      setTimeout(() => {
        this._setLoading(false);
        showNotification("Router restarted", "success");
      }, 5000);
    }).catch((e) => {
      console.error("[DASHBOARD] Failed to restart router:", e);
      showNotification(`Failed: ${e.message}`, "error");
      this._setLoading(false);
    });
  }

  /**
    * Render the dashboard page - called by router
    * @returns {HTMLElement} The rendered page element
    */
  render() {
    console.log("[DASHBOARD] Render - creating page component...");

    // Load initial data
    // this._loadData(); // Removed direct call

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
