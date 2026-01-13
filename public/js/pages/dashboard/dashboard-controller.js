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

  async render() {
    try {
      if (window.ChartLoader) await ChartLoader.load();
      await this.load();

      const models = stateManager.get("models") || [];
      const metrics = stateManager.get("metrics");
      const status = stateManager.get("llamaStatus");
      const routerStatus = stateManager.get("routerStatus");
      const config = stateManager.get("config") || {};
      const history = stateManager.get("metricsHistory") || [];
      const presets = stateManager.get("presets") || [];
      const settings = stateManager.get("settings") || {};

      this.chartManager = new window.ChartManager({ state: { chartType: "usage", history } });

      this.comp = new window.DashboardPage({
        models, metrics, status, routerStatus, config, history, presets,
        maxModelsLoaded: settings.maxModelsLoaded || 4,
        ctxSize: config.ctx_size || 4096,
        chartManager: this.chartManager,
        controller: this,
      });

      const el = this.comp.render();
      this.comp._el = el;
      el._component = this.comp;
      this.comp.bindEvents();
      this.comp.onMount();

      requestAnimationFrame(() => setTimeout(() => this._startChartUpdates(), 50));
      return el;
    } catch (e) {
      console.error("[DASHBOARD] RENDER ERROR:", e.message);
      throw e;
    }
  }

  _startChartUpdates() {
    this.chartUpdateInterval = setInterval(async () => {
      try {
        const d = await stateManager.getMetrics();
        const h = await stateManager.getMetricsHistory({ limit: 60 });
        stateManager.set("metrics", d.metrics || null);
        stateManager.set("metricsHistory", h.history || []);
        if (this.comp) this.comp.updateFromController(d.metrics || null, h.history || []);
      } catch (e) {
        console.debug("[DASHBOARD] Metrics update failed:", e.message);
      }
    }, 3000);
  }

  async load() {
    const loadError = (label, error) => {
      console.debug(`[DASHBOARD] ${label} fetch failed:`, error.message);
      ToastManager.error(`${label} load failed`, { action: { label: "Retry", handler: () => this.load() } });
    };

    try {
      const c = await stateManager.getConfig();
      stateManager.set("config", c.config || {});
      const d = await stateManager.getModels();
      stateManager.set("models", d.models || []);
      const m = await stateManager.getMetrics();
      stateManager.set("metrics", m.metrics || null);
      const h = await stateManager.getMetricsHistory({ limit: 60 });
      stateManager.set("metricsHistory", h.history || []);
      const s = await stateManager.getLlamaStatus();
      stateManager.set("llamaServerStatus", s.status || null);

      if (s.status?.status === "running") {
        try {
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
        } catch (e) { loadError("Router status", e); }
      }

      try {
        const st = await stateManager.getSettings();
        stateManager.set("settings", st.settings || {});
      } catch (e) { loadError("Settings", e); }

      try {
        const p = await stateManager.request("presets:list");
        stateManager.set("presets", p?.presets || []);
      } catch (e) {
        loadError("Presets", e);
        stateManager.set("presets", []);
      }
    } catch (e) {
      console.error("[DASHBOARD] Load error:", e.message);
      ToastManager.error("Dashboard load failed", { action: { label: "Retry", handler: () => this.load() } });
    }
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
