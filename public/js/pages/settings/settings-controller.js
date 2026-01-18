/**
 * Settings Controller
 * Event-driven controller using direct socket calls
 */

class SettingsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.unsubscribers = [];
  }

  willUnmount() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    // Create component first (don't wait for data)
    this.comp = new window.SettingsPage({});

    const el = this.comp.render();
    this.comp._el = el;
    this.comp._controller = this;
    this.comp._mounted = true;
    el._component = this.comp;
    this.comp.bindEvents();

    this.comp.didMount && this.comp.didMount();

    // Load data in background (non-blocking)
    this._loadCriticalData().catch(e => {
      console.warn("[SETTINGS] Background data load failed:", e.message);
    });

    return el;
  }

  /**
   * Load critical data (router config and logging config) - non-blocking
   * @returns {Promise<void>}
   */
  async _loadCriticalData() {
    console.log("[SETTINGS] Loading critical config data via socket...");

    try {
      const [routerConfig, loggingConfig, llamaStatus, presets] = await Promise.all([
        socketClient.request("routerConfig:get", {}).then(r => r.success ? r.data.config : null),
        socketClient.request("loggingConfig:get", {}).then(r => r.success ? r.data.config : null),
        socketClient.request("llama:status", {}).then(r => r.success ? r.data : null),
        socketClient.request("presets:list", {}).then(r => r.success ? r.data.presets : [])
      ]);

      // Update component with loaded data
      if (this.comp) {
        if (routerConfig) {
          this.comp.routerConfig = routerConfig;
          this.comp._updateRouterConfigUI();
        }
        if (loggingConfig) {
          this.comp.logLevel = loggingConfig.logLevel || this.comp.logLevel;
          this.comp.maxFileSize = loggingConfig.maxFileSize || this.comp.maxFileSize;
          this.comp.maxFiles = loggingConfig.maxFiles || this.comp.maxFiles;
          this.comp.enableFileLogging = loggingConfig.enableFileLogging !== false;
          this.comp.enableDatabaseLogging = loggingConfig.enableDatabaseLogging !== false;
          this.comp.enableConsoleLogging = loggingConfig.enableConsoleLogging !== false;
          this.comp._updateLoggingConfigUI();
        }
        if (llamaStatus) {
          this.comp.llamaStatus = llamaStatus;
          this.comp.routerStatus = llamaStatus;
          this.comp._updateStatusUI();
        }
        if (presets.length > 0) {
          this.comp.presets = presets;
          this.comp._updatePresetsDropdown();
        }
      }

      console.log("[SETTINGS] Critical data loaded");
    } catch (e) {
      console.error("[SETTINGS] Failed to load critical data:", e);
    }
  }

  /**
   * Save settings via direct socket call (public wrapper)
   */
  async handleSave(data) {
    return this._handleSave(data);
  }

  /**
   * Save settings via direct socket call
   */
  async _handleSave(data) {
    console.log("[SETTINGS] Saving settings via socket...", data);

    try {
      const [routerResult, loggingResult] = await Promise.all([
        socketClient.request("routerConfig:update", { config: data.routerConfig }),
        socketClient.request("loggingConfig:update", { config: data.loggingConfig })
      ]);

      if (routerResult.success && loggingResult.success) {
        showNotification("Settings saved successfully", "success");
        if (this.comp) {
          this.comp.routerConfig = { ...this.comp.routerConfig, ...data.routerConfig };
          this.comp.loggingConfig = { ...this.comp.loggingConfig, ...data.loggingConfig };
          this.comp._localRouterChanges = {};
          this.comp._localLoggingChanges = {};
        }
      } else {
        const errors = [];
        if (!routerResult.success) errors.push(routerResult.error);
        if (!loggingResult.success) errors.push(loggingResult.error);
        showNotification("Save failed: " + errors.join(", "), "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Save error:", e);
      showNotification("Save error: " + e.message, "error");
    }
  }

  /**
   * Reset settings to defaults
   */
  async _handleReset() {
    console.log("[SETTINGS] Resetting settings to defaults...");

    try {
      const [routerResult, loggingResult] = await Promise.all([
        socketClient.request("routerConfig:reset", {}),
        socketClient.request("loggingConfig:reset", {})
      ]);

      if (routerResult.success && loggingResult.success) {
        const routerConfig = routerResult.data?.config || {};
        const loggingConfig = loggingResult.data?.config || {};

        showNotification("Settings reset to defaults", "success");

        if (this.comp) {
          this.comp.routerConfig = routerConfig;
          this.comp.loggingConfig = loggingConfig;
          this.comp._updateRouterConfigUI();
          this.comp._updateLoggingConfigUI();
          this.comp._localRouterChanges = {};
          this.comp._localLoggingChanges = {};
        }
      } else {
        showNotification("Reset failed", "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Reset error:", e);
      showNotification("Reset error: " + e.message, "error");
    }
  }

  /**
   * Start router
   */
  async _handleRouterStart() {
    console.log("[SETTINGS] Starting router via socket...");

    try {
      const response = await socketClient.request("router:start", {});
      if (response.success) {
        showNotification("Router started successfully", "success");
      } else {
        showNotification("Failed to start router: " + response.error, "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Start router error:", e);
      showNotification("Start error: " + e.message, "error");
    }
  }

  /**
   * Start router with preset
   */
  async _handleRouterStartWithPreset(presetName) {
    console.log("[SETTINGS] Starting router with preset:", presetName);

    try {
      const response = await socketClient.request("router:start-preset", { presetName });
      if (response.success) {
        showNotification("Router started with preset: " + presetName, "success");
      } else {
        showNotification("Failed to start router: " + response.error, "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Start with preset error:", e);
      showNotification("Start error: " + e.message, "error");
    }
  }

  /**
   * Restart router
   */
  async _handleRouterRestart() {
    console.log("[SETTINGS] Restarting router via socket...");

    try {
      const response = await socketClient.request("router:restart", {});
      if (response.success) {
        showNotification("Router restarted successfully", "success");
      } else {
        showNotification("Failed to restart router: " + response.error, "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Restart router error:", e);
      showNotification("Restart error: " + e.message, "error");
    }
  }

  /**
   * Stop router
   */
  async _handleRouterStop() {
    console.log("[SETTINGS] Stopping router via socket...");

    try {
      const response = await socketClient.request("router:stop", {});
      if (response.success) {
        showNotification("Router stopped", "success");
      } else {
        showNotification("Failed to stop router: " + response.error, "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Stop router error:", e);
      showNotification("Stop error: " + e.message, "error");
    }
  }

  /**
   * Export config
   */
  async _handleExport() {
    console.log("[SETTINGS] Exporting config via socket...");

    try {
      const response = await socketClient.request("config:export", {});
      if (response.success) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `llama-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification("Configuration exported", "success");
      } else {
        showNotification("Export failed: " + response.error, "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Export error:", e);
      showNotification("Export error: " + e.message, "error");
    }
  }

  /**
   * Import config
   */
  async _handleImport(importedConfig) {
    console.log("[SETTINGS] Importing config via socket...", importedConfig);

    try {
      const response = await socketClient.request("config:import", importedConfig);
      if (response.success) {
        showNotification("Configuration imported successfully", "success");
        // Reload config
        this._loadCriticalData();
      } else {
        showNotification("Import failed: " + response.error, "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Import error:", e);
      showNotification("Import error: " + e.message, "error");
    }
  }
}

window.SettingsController = SettingsController;
