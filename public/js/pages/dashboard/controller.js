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
      // Lazy load chart scripts before rendering
      await ChartLoader.load();

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
      this.comp.onMount();

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
      } catch (e) {
        console.debug("[DASHBOARD] Metrics update failed:", e.message);
      }
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
        } catch (e) {
          console.debug("[DASHBOARD] Router status fetch failed:", e.message);
        }
      }

      // Load settings
      try {
        const st = await stateManager.getSettings();
        stateManager.set("settings", st.settings || {});
      } catch (e) {
        console.debug("[DASHBOARD] Settings fetch failed:", e.message);
      }

      // Load presets for preset launcher
      try {
        const p = await stateManager.request("presets:list");
        stateManager.set("presets", p?.presets || []);
      } catch (e) {
        console.debug("[DASHBOARD] Presets fetch failed:", e.message);
        stateManager.set("presets", []);
      }
    } catch (e) {
      console.error("[DASHBOARD] Load error:", e.message);
    }
  }

  handleRouterAction(action, data) {
    switch (action) {
      case "start":
        this._start();
        break;
      case "start-with-preset":
        this._startWithPreset(data);
        break;
      case "stop":
        this._stop();
        break;
      case "restart":
        this._restart();
        break;
    }
  }

  _startWithPreset(presetName) {
    console.log("[DEBUG] _startWithPreset called with:", presetName);
    if (this.comp) {
      this.comp.setRouterLoading(true);
    }

    const settings = stateManager.get("settings") || {};
    const config = stateManager.get("config") || {};
    const maxModelsLoaded = settings.maxModelsLoaded || 4;
    const ctxSize = config.ctx_size || 4096;

    showNotification(`Starting llama-server with preset "${presetName}"...`, "info");

    stateManager
      .request("llama:start-with-preset", {
        presetName: presetName,
        maxModels: maxModelsLoaded,
        ctxSize: ctxSize,
        threads: 4,
      })
      .then((response) => {
        console.log("[DEBUG] _startWithPreset response:", response);
        if (response?.success || response?.port) {
          const port = response?.port || response?.data?.port;
          showNotification(`✓ Server started on port ${port}`, "success");
          // Check status after starting
          setTimeout(async () => {
            try {
              const s = await stateManager.getLlamaStatus();
              stateManager.set("llamaServerStatus", s.status || null);
              const rs = await stateManager.getRouterStatus();
              stateManager.set("routerStatus", rs.routerStatus);
            } catch (e) {
              console.error("[DASHBOARD] Error checking status:", e.message);
            } finally {
              if (this.comp) {
                this.comp.setRouterLoading(false);
              }
            }
          }, 3000);
        } else {
          showNotification(`Error: ${response?.error?.message || "Unknown error"}`, "error");
          if (this.comp) {
            this.comp.setRouterLoading(false);
          }
        }
      })
      .catch((e) => {
        console.error("[DASHBOARD] _startWithPreset error:", e);
        showNotification(`Failed: ${e.message}`, "error");
        if (this.comp) {
          this.comp.setRouterLoading(false);
        }
      });
  }

  _start() {
    if (this.comp) {
      this.comp.setRouterLoading(true);
    }
    stateManager
      .startLlama()
      .then(() => {
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
            showNotification(`Failed to start router: ${e.message}`, "error");
          } finally {
            if (this.comp) {
              this.comp.setRouterLoading(false);
            }
          }
        }, 3000);
      })
      .catch((e) => {
        showNotification(`Failed: ${e.message}`, "error");
        if (this.comp) {
          this.comp.setRouterLoading(false);
        }
      });
  }

  _stop() {
    if (!confirm("Stop router?")) return;
    if (this.comp) {
      this.comp.setRouterLoading(true);
    }
    stateManager
      .stopLlama()
      .then(() => {
        const status = { status: "idle", port: null };
        stateManager.set("llamaServerStatus", status);
        stateManager.set("routerStatus", null);
        showNotification("Router stopped", "success");
      })
      .catch((e) => {
        showNotification(`Failed: ${e.message}`, "error");
      })
      .finally(() => {
        if (this.comp) {
          this.comp.setRouterLoading(false);
        }
      });
  }

  _restart() {
    if (this.comp) {
      this.comp.setRouterLoading(true);
    }
    stateManager
      .restartLlama()
      .then(() => {
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
            showNotification(`Failed to restart router: ${e.message}`, "error");
          } finally {
            if (this.comp) {
              this.comp.setRouterLoading(false);
            }
          }
        }, 5000);
      })
      .catch((e) => {
        showNotification(`Failed: ${e.message}`, "error");
        if (this.comp) {
          this.comp.setRouterLoading(false);
        }
      });
  }
}

window.DashboardController = DashboardController;
