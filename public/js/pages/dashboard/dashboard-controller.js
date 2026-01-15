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
   * Start periodic chart updates by subscribing to metricsHistory state changes.
   * Updates the component with metrics and history data at regular intervals.
   * @returns {void}
   */
  _startChartUpdates() {
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval);
    }

    // Subscribe to metrics updates from broadcast
    this._subscribe("metricsHistory", (history) => {
      if (this.comp && Array.isArray(history) && history.length > 0) {
        const metrics = stateManager.get("metrics");
        this.comp.updateFromController(metrics, history);
      }
    });

    // Periodic full refresh as fallback (every 30s instead of 3s for better performance)
    this.chartUpdateInterval = setInterval(async () => {
      try {
        // Use cached data from broadcast when available
        const cachedHistory = stateManager.get("metricsHistory") || [];
        if (cachedHistory.length > 0) {
          const metrics = stateManager.get("metrics");
          if (this.comp) {
            this.comp.updateFromController(metrics, cachedHistory);
          }
          return;
        }

        // Fallback to API call only if no cached data
        const h = await stateManager.getMetricsHistory({ limit: 60 });
        if (this.comp) {
          const metrics = stateManager.get("metrics");
          this.comp.updateFromController(metrics, h.history || []);
        }
      } catch (e) {
        console.debug("[Dashboard] Chart update failed:", e.message);
      }
    }, 30000); // 30s instead of 3s for better performance
  }

  /**
   * Load data when socket is connected
   */
  _loadDataWhenConnected() {
    // Check if already connected
    if (stateManager.isConnected()) {
      this._loadData();
      return;
    }

    // Wait for connection, then load
    const unsub = stateManager.subscribe("connectionStatus", (status) => {
      if (status === "connected") {
        unsub();
        this._loadData();
      }
    });

    // Safety timeout - load anyway after 5 seconds
    setTimeout(() => {
      unsub();
      if (stateManager.isConnected()) {
        this._loadData();
      } else {
        console.warn("[DASHBOARD] Socket not connected after 5s, skipping data load");
      }
    }, 5000);
  }

  /**
   * Load all data in background - doesn't block initial render.
   * Fetches config, models, metrics, settings, and presets from stateManager.
   * @returns {Promise<void>} Promise that resolves when data is loaded
   */
  _loadData() {
    if (!stateManager.isConnected()) {
      console.warn("[DASHBOARD] Cannot load data - socket not connected");
      return;
    }

    // Load critical data first
    Promise.all([
      stateManager.getConfig().catch(() => ({})),
      stateManager.getModels().catch(() => []),
    ])
      .then(([configResponse, modelsResponse]) => {
        // Store config and models
        const config = configResponse?.config || {};
        const models = modelsResponse?.models || [];
        stateManager.set("config", config);
        stateManager.set("models", models);

        // Then load optional data (with shorter timeout for status checks)
        return Promise.all([
          stateManager.getMetrics().catch((e) => {
            console.debug("[DASHBOARD] Metrics unavailable:", e.message);
            return null;
          }),
          stateManager.getMetricsHistory({ limit: 60 }).catch(() => ({ history: [] })),
          // Status checks will timeout faster now (3s instead of 15s)
          stateManager.getLlamaStatus().catch((e) => {
            console.debug("[DASHBOARD] Llama status unavailable:", e.message);
            return null;
          }),
          stateManager.getSettings().catch(() => ({})),
          stateManager.request("presets:list").catch(() => ({})),
        ]).then(([metricsResponse, historyResponse, status, settings, presets]) => {
          // Fix: status IS the status object, not status.status
          // status can be null from catch block, handle both cases
          const llamaStatus =
            status && typeof status === "object" ? status : { status: "idle", port: null, url: null };
          stateManager.set("llamaServerStatus", llamaStatus);
          stateManager.set("metricsHistory", historyResponse?.history || []);
          stateManager.set("metrics", metricsResponse?.metrics || null);
          stateManager.set("settings", settings?.settings || {});
          stateManager.set("presets", presets?.presets || []);

          // Update UI if component still mounted - pass history to charts
          if (this.comp) {
            this.comp.updateFromController(metricsResponse?.metrics || null, historyResponse?.history || []);
          }
        });
      })
      .catch((e) => {
        console.warn("[DASHBOARD] Data load failed:", e.message);
      });
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
   * Start router with a specific preset configuration.
   * @param {string} presetName - Name of the preset to use
   * @returns {Promise<void>} Promise that resolves when router is started
   */
  _startWithPreset(presetName) {
    if (this.comp) this.comp.setRouterLoading(true);
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
        setTimeout(async () => {
          try {
            const s = await stateManager.getLlamaStatus();
            stateManager.set("llamaServerStatus", s.status || null);
            const rs = await stateManager.getRouterStatus();
            stateManager.set("routerStatus", rs.routerStatus);
          } finally {
            if (this.comp) this.comp.setRouterLoading(false);
          }
        }, 3000);
      } else {
        showNotification(`Error: ${response?.error?.message || "Unknown error"}`, "error");
        if (this.comp) this.comp.setRouterLoading(false);
      }
    }).catch((e) => {
      showNotification(`Failed: ${e.message}`, "error");
      if (this.comp) this.comp.setRouterLoading(false);
    });
  }

  /**
   * Start the llama router server.
   * @returns {Promise<void>} Promise that resolves when server is started
   */
  _start() {
    if (this.comp) this.comp.setRouterLoading(true);
    stateManager.startLlama().then(() => {
      showNotification("Starting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaServerStatus", s.status || null);
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          showNotification("Router started successfully", "success");
        } finally {
          if (this.comp) this.comp.setRouterLoading(false);
        }
      }, 3000);
    }).catch((e) => {
      showNotification(`Failed: ${e.message}`, "error");
      if (this.comp) this.comp.setRouterLoading(false);
    });
  }

  /**
   * Stop the llama router server after user confirmation.
   * @returns {Promise<void>} Promise that resolves when server is stopped
   */
  _stop() {
    if (!confirm("Stop router?")) return;
    if (this.comp) this.comp.setRouterLoading(true);
    stateManager.stopLlama().then(() => {
      stateManager.set("llamaServerStatus", { status: "idle", port: null });
      stateManager.set("routerStatus", null);
      showNotification("Router stopped", "success");
    }).catch((e) => {
      showNotification(`Failed: ${e.message}`, "error");
    }).finally(() => {
      if (this.comp) this.comp.setRouterLoading(false);
    });
  }

  /**
   * Restart the llama router server.
   * @returns {Promise<void>} Promise that resolves when server is restarted
   */
  _restart() {
    if (this.comp) this.comp.setRouterLoading(true);
    stateManager.restartLlama().then(() => {
      showNotification("Restarting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaServerStatus", s.status || null);
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          showNotification("Router restarted", "success");
        } finally {
          if (this.comp) this.comp.setRouterLoading(false);
        }
      }, 5000);
    }).catch((e) => {
      showNotification(`Failed: ${e.message}`, "error");
      if (this.comp) this.comp.setRouterLoading(false);
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
