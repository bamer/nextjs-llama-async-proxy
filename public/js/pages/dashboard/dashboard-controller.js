/**
 * Dashboard Controller - Main controller with router actions
 */

class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.chartUpdateInterval = null;
    this.chartManager = null;
    this._stateUnsubscribers = []; // Track state subscriptions for cleanup
  }

  init() {}

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
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval);
      this.chartUpdateInterval = null;
    }
    if (this.chartManager) {
      this.chartManager.destroy();
      this.chartManager = null;
    }
    this._cleanupSubscriptions();
  }

  destroy() {
    this.willUnmount();
  }

  render() {
    // Return element IMMEDIATELY, don't wait for data
    // Data will be loaded in background via onMount

    // Get available data (may be empty initially)
    const models = stateManager.get("models") || [];
    const config = stateManager.get("config") || {};
    const settings = stateManager.get("settings") || {};

    this.chartManager = new window.ChartManager({ state: { chartType: "usage", history: [] } });

    this.comp = new window.DashboardPage({
      models,
      metrics: null,
      status: null,
      routerStatus: null,
      config,
      history: [],
      presets: [],
      maxModelsLoaded: settings.maxModelsLoaded || 4,
      ctxSize: config.ctx_size || 4096,
      chartManager: this.chartManager,
      controller: this,
    });

    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;

    // Start loading data in background (after element is created)
    // Wait for socket connection before making requests
    this._loadDataWhenConnected();

    requestAnimationFrame(() => setTimeout(() => this._startChartUpdates(), 50));
    return el;
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
   * Load all data in background - doesn't block initial render
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
    ]).then(([config, models]) => {
      stateManager.set("config", config.config || {});
      stateManager.set("models", models.models || []);

      // Then load optional data
      return Promise.all([
        stateManager.getMetrics().catch(() => null),
        stateManager.getMetricsHistory({ limit: 60 }).catch(() => []),
        stateManager.getLlamaStatus().catch(() => null),
        stateManager.getSettings().catch(() => ({})),
        stateManager.request("presets:list").catch(() => ({})),
      ]);
    }).then(([metrics, history, status, settings, presets]) => {
      // Update state
      stateManager.set("metrics", metrics?.metrics || null);
      stateManager.set("metricsHistory", history?.history || []);
      stateManager.set("llamaServerStatus", status?.status || null);
      stateManager.set("settings", settings?.settings || {});
      stateManager.set("presets", presets?.presets || []);

      // Update UI if component still mounted
      if (this.comp) {
        this.comp.updateFromController(metrics?.metrics || null, history?.history || []);
      }
    }).catch(e => {
      console.warn("[DASHBOARD] Data load failed:", e.message);
    });
  }

  handleRouterAction(action, data) {
    switch (action) {
      case "start": this._start(); break;
      case "start-with-preset": this._startWithPreset(data); break;
      case "stop": this._stop(); break;
      case "restart": this._restart(); break;
    }
  }

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
}

window.DashboardController = DashboardController;
