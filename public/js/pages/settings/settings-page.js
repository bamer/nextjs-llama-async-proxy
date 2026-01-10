/**
 * Settings Page Component - Event-Driven DOM Updates
 * Composes RouterCard, ServerPathsForm, ModelDefaultsForm, and SaveSection
 */

class SettingsPage extends Component {
  constructor(props) {
    super(props);

    const config = props.config || {};
    const settings = props.settings || {};

    // Direct properties instead of state
    this.serverPath = config.serverPath || "";
    this.host = config.host || "localhost";
    this.port = config.port || 8080;
    this.baseModelsPath = config.baseModelsPath || "";
    this.ctx_size = config.ctx_size || 4096;
    this.threads = config.threads || 4;
    this.batch_size = config.batch_size || 512;
    this.temperature = config.temperature || 0.7;
    this.repeatPenalty = config.repeatPenalty || 1.1;
    this.maxModelsLoaded = settings.maxModelsLoaded || 4;
    this.parallelSlots = settings.parallelSlots || 1;
    this.gpuLayers = settings.gpuLayers || 0;
    this.logLevel = settings.logLevel || "info";
    this.maxFileSize = settings.maxFileSize || 10485760;
    this.maxFiles = settings.maxFiles || 7;
    this.enableFileLogging = settings.enableFileLogging !== false;
    this.enableDatabaseLogging = settings.enableDatabaseLogging !== false;
    this.enableConsoleLogging = settings.enableConsoleLogging !== false;
    this.routerStatus = props.routerStatus || null;
    this.llamaStatus = props.llamaStatus || null;
    this.presets = props.presets || [];
    this.llama_server_enabled = config.llama_server_enabled !== false;
    this.llama_server_port = config.llama_server_port || 8080;
    this.llama_server_host = config.llama_server_host || "0.0.0.0";
    this.llama_server_metrics = config.llama_server_metrics !== false;
    this.controller = props.controller;
  }

  async _save() {
    const btn = this.$("[data-action=\"save\"]");
    if (btn) {
      btn.textContent = "Saving...";
      btn.disabled = true;
    }

    try {
      if (!stateManager.connected) {
        throw new Error("Not connected to server");
      }

      const config = {
        serverPath: this.serverPath,
        host: this.host,
        port: this.port,
        baseModelsPath: this.baseModelsPath,
        ctx_size: this.ctx_size,
        threads: this.threads,
        batch_size: this.batch_size,
        temperature: this.temperature,
        repeatPenalty: this.repeatPenalty,
        llama_server_enabled: this.llama_server_enabled,
        llama_server_port: this.llama_server_port,
        llama_server_host: this.llama_server_host,
        llama_server_metrics: this.llama_server_metrics,
      };

      const settings = {
        maxModelsLoaded: this.maxModelsLoaded,
        parallelSlots: this.parallelSlots,
        gpuLayers: this.gpuLayers,
        logLevel: this.logLevel,
        maxFileSize: this.maxFileSize,
        maxFiles: this.maxFiles,
        enableFileLogging: this.enableFileLogging,
        enableDatabaseLogging: this.enableDatabaseLogging,
        enableConsoleLogging: this.enableConsoleLogging,
      };

      console.log("[DEBUG] Saving config and settings", { config, settings });

      await stateManager.updateConfig(config);
      await stateManager.updateSettings(settings);

      stateManager.set("config", config);
      stateManager.set("settings", settings);

      showNotification("Settings saved successfully", "success");
    } catch (e) {
      console.error("[DEBUG] Save failed:", e.message);
      showNotification(`Save failed: ${e.message}`, "error");
    } finally {
      if (btn) {
        btn.textContent = "Save All Settings";
        btn.disabled = false;
      }
    }
  }

  bindEvents() {
    // Save button
    this.on("click", "[data-action=save]", (e) => {
      e.preventDefault();
      this._save();
    });
  }

  async _exportConfig() {
    console.log("[DEBUG] Exporting configuration");

    try {
      const config = stateManager.get("config") || {};
      const settings = stateManager.get("settings") || {};

      const fullConfig = {
        config,
        settings,
        exportDate: new Date().toISOString(),
        version: "1.0",
      };

      const data = JSON.stringify(fullConfig, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `llama-dashboard-config-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("[DEBUG] Configuration exported successfully");
      showNotification("Configuration exported successfully", "success");
    } catch (error) {
      console.error("[DEBUG] Export error:", error);
      showNotification(`Export failed: ${error.message}`, "error");
    }
  }

  async _importConfig(importedConfig) {
    console.log("[DEBUG] Importing configuration:", importedConfig);

    if (!importedConfig.config || !importedConfig.settings) {
      showNotification("Invalid configuration file", "error");
      return;
    }

    try {
      const { config, settings } = importedConfig;

      // Apply imported config
      if (config.serverPath !== undefined) this.serverPath = config.serverPath;
      if (config.host !== undefined) this.host = config.host;
      if (config.port !== undefined) this.port = config.port;
      if (config.ctx_size !== undefined) this.ctx_size = config.ctx_size;
      if (config.threads !== undefined) this.threads = config.threads;
      if (config.batch_size !== undefined) this.batch_size = config.batch_size;
      if (config.temperature !== undefined) this.temperature = config.temperature;
      if (config.repeatPenalty !== undefined) this.repeatPenalty = config.repeatPenalty;
      if (config.llama_server_enabled !== undefined) this.llama_server_enabled = config.llama_server_enabled;
      if (config.llama_server_port !== undefined) this.llama_server_port = config.llama_server_port;
      if (config.llama_server_host !== undefined) this.llama_server_host = config.llama_server_host;
      if (config.llama_server_metrics !== undefined) this.llama_server_metrics = config.llama_server_metrics;

      // Apply imported settings
      if (settings.maxModelsLoaded !== undefined) this.maxModelsLoaded = settings.maxModelsLoaded;
      if (settings.parallelSlots !== undefined) this.parallelSlots = settings.parallelSlots;
      if (settings.gpuLayers !== undefined) this.gpuLayers = settings.gpuLayers;
      if (settings.logLevel !== undefined) this.logLevel = settings.logLevel;
      if (settings.maxFileSize !== undefined) this.maxFileSize = settings.maxFileSize;
      if (settings.maxFiles !== undefined) this.maxFiles = settings.maxFiles;
      if (settings.enableFileLogging !== undefined) this.enableFileLogging = settings.enableFileLogging;
      if (settings.enableDatabaseLogging !== undefined) this.enableDatabaseLogging = settings.enableDatabaseLogging;
      if (settings.enableConsoleLogging !== undefined) this.enableConsoleLogging = settings.enableConsoleLogging;

      // Save to server
      await this._save();

      console.log("[DEBUG] Configuration imported successfully");
      showNotification("Configuration imported successfully", "success");
    } catch (error) {
      console.error("[DEBUG] Import error:", error);
      showNotification(`Import failed: ${error.message}`, "error");
    }
  }

  render() {
    const rs = this.routerStatus || {};
    const ls = this.llamaStatus || {};
    const isRunning = rs.port || ls.port;
    const displayPort = rs.port || ls.port || this.port;

    return Component.h("div", { className: "settings-page" }, [
      Component.h("h1", {}, "Settings"),
      Component.h(window.RouterCard, {
        status: this.llamaStatus,
        routerStatus: this.routerStatus,
        models: this.models || [],
        configPort: this.port,
        presets: this.presets,
        maxModelsLoaded: this.maxModelsLoaded,
        ctxSize: this.ctx_size,
        onAction: (action) => this.controller?.handleRouterAction(action),
      }),
      Component.h(window.RouterConfig, {
        maxModelsLoaded: this.maxModelsLoaded,
        parallelSlots: this.parallelSlots,
        ctx_size: this.ctx_size,
        gpuLayers: this.gpuLayers,
        onMaxModelsLoadedChange: (val) => { this.maxModelsLoaded = val; },
        onParallelSlotsChange: (val) => { this.parallelSlots = val; },
        onCtxSizeChange: (val) => { this.ctx_size = val; },
        onGpuLayersChange: (val) => { this.gpuLayers = val; },
      }),
      Component.h(window.ServerPathsForm, {
        baseModelsPath: this.baseModelsPath,
        serverPath: this.serverPath,
        host: this.host,
        port: this.port,
        onBaseModelsPathChange: (val) => { this.baseModelsPath = val; },
        onServerPathChange: (val) => { this.serverPath = val; },
        onHostChange: (val) => { this.host = val; },
        onPortChange: (val) => { this.port = val; },
      }),
      Component.h(window.ModelDefaultsForm, {
        threads: this.threads,
        batch_size: this.batch_size,
        temperature: this.temperature,
        repeatPenalty: this.repeatPenalty,
        onThreadsChange: (val) => { this.threads = val; },
        onBatchSizeChange: (val) => { this.batch_size = val; },
        onTemperatureChange: (val) => { this.temperature = val; },
        onRepeatPenaltyChange: (val) => { this.repeatPenalty = val; },
      }),
      Component.h(window.LlamaServerConfig, {
        enabled: this.llama_server_enabled,
        port: this.llama_server_port,
        host: this.llama_server_host,
        metricsEnabled: this.llama_server_metrics,
        onEnabledChange: (val) => { this.llama_server_enabled = val; },
        onPortChange: (val) => { this.llama_server_port = val; },
        onHostChange: (val) => { this.llama_server_host = val; },
        onMetricsEnabledChange: (val) => { this.llama_server_metrics = val; },
      }),
      Component.h(window.LoggingConfig, {
        logLevel: this.logLevel,
        maxFileSize: this.maxFileSize,
        maxFiles: this.maxFiles,
        enableFileLogging: this.enableFileLogging,
        enableDatabaseLogging: this.enableDatabaseLogging,
        enableConsoleLogging: this.enableConsoleLogging,
        onLogLevelChange: (val) => {
          console.log("[DEBUG] SettingsPage.onLogLevelChange:", { val, oldValue: this.logLevel });
          this.logLevel = val;
        },
        onMaxFileSizeChange: (val) => { this.maxFileSize = val; },
        onMaxFilesChange: (val) => { this.maxFiles = val; },
        onEnableFileLoggingChange: (val) => { this.enableFileLogging = val; },
        onEnableDatabaseLoggingChange: (val) => { this.enableDatabaseLogging = val; },
        onEnableConsoleLoggingChange: (val) => { this.enableConsoleLogging = val; },
      }),
      Component.h(window.ConfigExportImport, {
        onExport: this._exportConfig.bind(this),
        onImport: this._importConfig.bind(this),
      }),
      Component.h(window.SaveSection),
    ]);
  }
}

window.SettingsPage = SettingsPage;
