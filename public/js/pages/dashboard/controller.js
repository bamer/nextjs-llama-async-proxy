class DashboardController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.chartUpdateInterval = null;
    this.chartManager = null;
  }

  init() {}

  willUnmount() {
    if (this.chartUpdateInterval) {
      clearInterval(this.chartUpdateInterval);
    }
    if (this.chartManager) {
      this.chartManager.destroy();
    }
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    try {
      await this.load();

      const models = stateManager.get("models") || [];
      const metrics = stateManager.get("metrics");
      const status = stateManager.get("llamaStatus");
      const routerStatus = stateManager.get("routerStatus");
      const config = stateManager.get("config") || {};
      const history = stateManager.get("metricsHistory") || [];
      const presets = stateManager.get("presets") || [];
      const settings = stateManager.get("settings") || {};

      this.chartManager = new window.ChartManager({
        state: { chartType: "usage", history },
      });

      this.comp = new window.DashboardPage({
        models,
        metrics,
        status,
        routerStatus,
        config,
        history,
        presets,
        maxModelsLoaded: settings.maxModelsLoaded || 4,
        ctxSize: config.ctx_size || 4096,
        chartManager: this.chartManager,
        controller: this,
      });

      const el = this.comp.render();

      this.comp._el = el;
      el._component = this.comp;

      this.comp.bindEvents();

      requestAnimationFrame(() => {
        setTimeout(() => {
          this._startChartUpdates();
        }, 50);
      });

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

        if (this.comp) {
          this.comp.updateFromController(d.metrics || null, h.history || []);
        }
      } catch (e) {}
    }, 3000);
  }

  async load() {
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
        } catch (e) {}
      }

      // Load settings
      try {
        const st = await stateManager.getSettings();
        stateManager.set("settings", st.settings || {});
      } catch (e) {}

      // Load presets for preset launcher
      try {
        const p = await stateManager.request("presets:list");
        stateManager.set("presets", p?.presets || []);
      } catch (e) {
        stateManager.set("presets", []);
      }
    } catch (e) {
      console.error("[DASHBOARD] Load error:", e.message);
    }
  }

  async handleRouterAction(action) {
    switch (action) {
    case "start":
      await this._start();
      break;
    case "stop":
      await this._stop();
      break;
    case "restart":
      await this._restart();
      break;
    }
  }

  async _start() {
    if (this.comp) {
      this.comp.state.routerLoading = true;
      this.comp._updateRouterCardUI();
    }
    try {
      await stateManager.startLlama();
      showNotification("Starting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaServerStatus", s.status || null);
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          showNotification("Router started successfully", "success");
        } catch (e) {
          console.error("[DASHBOARD] Error checking status:", e.message);
          showNotification(`Failed to start router: ${  e.message}`, "error");
        } finally {
          // Clear loading state
          if (this.comp) {
            this.comp.state.routerLoading = false;
            this.comp._updateRouterCardUI();
          }
        }
      }, 3000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      // On error, clear loading state manually
      if (this.comp) {
        this.comp.state.routerLoading = false;
        this.comp._updateRouterCardUI();
      }
    }
  }

  async _stop() {
    if (!confirm("Stop router?")) return;
    if (this.comp) {
      this.comp.state.routerLoading = true;
      this.comp._updateRouterCardUI();
    }
    try {
      await stateManager.stopLlama();
      const status = { status: "idle", port: null };
      stateManager.set("llamaServerStatus", status);
      stateManager.set("routerStatus", null);
      showNotification("Router stopped", "success");
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    } finally {
      // Clear loading state
      if (this.comp) {
        this.comp.state.routerLoading = false;
        this.comp._updateRouterCardUI();
      }
    }
  }

  async _restart() {
    if (this.comp) {
      this.comp.state.routerLoading = true;
      this.comp._updateRouterCardUI();
    }
    try {
      await stateManager.restartLlama();
      showNotification("Restarting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaServerStatus", s.status || null);
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          showNotification("Router restarted", "success");
        } catch (e) {
          console.error("[DASHBOARD] Error checking status:", e.message);
          showNotification(`Failed to restart router: ${  e.message}`, "error");
        } finally {
          // Clear loading state
          if (this.comp) {
            this.comp.state.routerLoading = false;
            this.comp._updateRouterCardUI();
          }
        }
      }, 5000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
      // Clear loading state immediately on error
      if (this.comp) {
        this.comp.state.routerLoading = false;
        this.comp._updateRouterCardUI();
      }
    }
  }
}

window.DashboardController = DashboardController;
