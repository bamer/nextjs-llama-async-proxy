/**
 * Settings Page Component
 * Composes RouterCard, ServerPathsForm, ModelDefaultsForm, and SaveSection
 */

class SettingsPage extends Component {
  constructor(props) {
    super(props);

    const config = props.config || {};
    const settings = props.settings || {};

    this.state = {
      serverPath: config.serverPath || "",
      host: config.host || "localhost",
      port: config.port || 8080,
      baseModelsPath: config.baseModelsPath || "",
      ctx_size: config.ctx_size || 4096,
      threads: config.threads || 4,
      batch_size: config.batch_size || 512,
      temperature: config.temperature || 0.7,
      repeatPenalty: config.repeatPenalty || 1.1,
      maxModelsLoaded: settings.maxModelsLoaded || 4,
      parallelSlots: settings.parallelSlots || 1,
      gpuLayers: settings.gpuLayers || 0,
      logLevel: settings.logLevel || "info",
      maxFileSize: settings.maxFileSize || 10485760,
      maxFiles: settings.maxFiles || 7,
      enableFileLogging: settings.enableFileLogging !== false,
      enableDatabaseLogging: settings.enableDatabaseLogging !== false,
      enableConsoleLogging: settings.enableConsoleLogging !== false,
      routerStatus: props.routerStatus || null,
      llamaStatus: props.llamaStatus || null,
      presets: props.presets || [],
      llama_server_enabled: config.llama_server_enabled !== false,
      llama_server_port: config.llama_server_port || 8080,
      llama_server_host: config.llama_server_host || "0.0.0.0",
      llama_server_metrics: config.llama_server_metrics !== false,
    };
  }

  async _save() {
    const btn = this._el?.querySelector('[data-action="save"]');
    if (btn) {
      btn.textContent = "Saving...";
      btn.disabled = true;
    }

    try {
      if (!stateManager.connected) {
        throw new Error("Not connected to server");
      }

      const config = {
        serverPath: this.state.serverPath,
        host: this.state.host,
        port: this.state.port,
        baseModelsPath: this.state.baseModelsPath,
        ctx_size: this.state.ctx_size,
        threads: this.state.threads,
        batch_size: this.state.batch_size,
        temperature: this.state.temperature,
        repeatPenalty: this.state.repeatPenalty,
        llama_server_enabled: this.state.llama_server_enabled,
        llama_server_port: this.state.llama_server_port,
        llama_server_host: this.state.llama_server_host,
        llama_server_metrics: this.state.llama_server_metrics,
      };

      const settings = {
        maxModelsLoaded: this.state.maxModelsLoaded,
        parallelSlots: this.state.parallelSlots,
        gpuLayers: this.state.gpuLayers,
        logLevel: this.state.logLevel,
        maxFileSize: this.state.maxFileSize,
        maxFiles: this.state.maxFiles,
        enableFileLogging: this.state.enableFileLogging,
        enableDatabaseLogging: this.state.enableDatabaseLogging,
        enableConsoleLogging: this.state.enableConsoleLogging,
      };

      // Update config with ctx_size
      config.ctx_size = this.state.ctx_size;

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

  getEventMap() {
    return {
      "click [data-action=save]": "handleSave",
    };
  }

  handleSave(event) {
    event.preventDefault();
    this._save();
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

    // Validate configuration
    if (!importedConfig.config || !importedConfig.settings) {
      showNotification("Invalid configuration file", "error");
      return;
    }

    try {
      // Apply imported config
      const { config, settings } = importedConfig;

      // Update settings
      if (config.serverPath !== undefined) {
        this.setState({ serverPath: config.serverPath });
      }
      if (config.host !== undefined) {
        this.setState({ host: config.host });
      }
      if (config.port !== undefined) {
        this.setState({ port: config.port });
      }
      if (config.ctx_size !== undefined) {
        this.setState({ ctx_size: config.ctx_size });
      }
      if (config.threads !== undefined) {
        this.setState({ threads: config.threads });
      }
      if (config.batch_size !== undefined) {
        this.setState({ batch_size: config.batch_size });
      }
      if (config.temperature !== undefined) {
        this.setState({ temperature: config.temperature });
      }
      if (config.repeatPenalty !== undefined) {
        this.setState({ repeatPenalty: config.repeatPenalty });
      }
      if (config.llama_server_enabled !== undefined) {
        this.setState({ llama_server_enabled: config.llama_server_enabled });
      }
      if (config.llama_server_port !== undefined) {
        this.setState({ llama_server_port: config.llama_server_port });
      }
      if (config.llama_server_host !== undefined) {
        this.setState({ llama_server_host: config.llama_server_host });
      }
      if (config.llama_server_metrics !== undefined) {
        this.setState({ llama_server_metrics: config.llama_server_metrics });
      }

      // Apply imported settings
      if (settings.maxModelsLoaded !== undefined) {
        this.setState({ maxModelsLoaded: settings.maxModelsLoaded });
      }
      if (settings.parallelSlots !== undefined) {
        this.setState({ parallelSlots: settings.parallelSlots });
      }
      if (settings.gpuLayers !== undefined) {
        this.setState({ gpuLayers: settings.gpuLayers });
      }
      if (settings.logLevel !== undefined) {
        this.setState({ logLevel: settings.logLevel });
      }
      if (settings.maxFileSize !== undefined) {
        this.setState({ maxFileSize: settings.maxFileSize });
      }
      if (settings.maxFiles !== undefined) {
        this.setState({ maxFiles: settings.maxFiles });
      }
      if (settings.enableFileLogging !== undefined) {
        this.setState({ enableFileLogging: settings.enableFileLogging });
      }
      if (settings.enableDatabaseLogging !== undefined) {
        this.setState({ enableDatabaseLogging: settings.enableDatabaseLogging });
      }
      if (settings.enableConsoleLogging !== undefined) {
        this.setState({ enableConsoleLogging: settings.enableConsoleLogging });
      }

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
    const rs = this.state.routerStatus || {};
    const ls = this.state.llamaStatus || {};
    const isRunning = rs.port || ls.port;
    const displayPort = rs.port || ls.port || this.state.port;

    return Component.h(
      "div",
      { className: "settings-page" },
      Component.h("h1", {}, "Settings"),
      Component.h(window.RouterCard, {
        status: this.state.llamaStatus,
        routerStatus: this.state.routerStatus,
        models: this.state.models || [],
        configPort: this.state.port,
        presets: this.state.presets,
        maxModelsLoaded: this.state.maxModelsLoaded,
        ctxSize: this.state.ctx_size,
        onAction: (action) => {
          this.props.controller?.handleRouterAction(action);
        },
      }),
      Component.h(window.RouterConfig, {
        maxModelsLoaded: this.state.maxModelsLoaded,
        parallelSlots: this.state.parallelSlots,
        ctx_size: this.state.ctx_size,
        gpuLayers: this.state.gpuLayers,
        onMaxModelsLoadedChange: (val) => this.setState({ maxModelsLoaded: val }),
        onParallelSlotsChange: (val) => this.setState({ parallelSlots: val }),
        onCtxSizeChange: (val) => this.setState({ ctx_size: val }),
        onGpuLayersChange: (val) => this.setState({ gpuLayers: val }),
      }),
      Component.h(window.ServerPathsForm, {
        baseModelsPath: this.state.baseModelsPath,
        serverPath: this.state.serverPath,
        host: this.state.host,
        port: this.state.port,
        onBaseModelsPathChange: (val) => this.setState({ baseModelsPath: val }),
        onServerPathChange: (val) => this.setState({ serverPath: val }),
        onHostChange: (val) => this.setState({ host: val }),
        onPortChange: (val) => this.setState({ port: val }),
      }),
      Component.h(window.ModelDefaultsForm, {
        threads: this.state.threads,
        batch_size: this.state.batch_size,
        temperature: this.state.temperature,
        repeatPenalty: this.state.repeatPenalty,
        onThreadsChange: (val) => this.setState({ threads: val }),
        onBatchSizeChange: (val) => this.setState({ batch_size: val }),
        onTemperatureChange: (val) => this.setState({ temperature: val }),
        onRepeatPenaltyChange: (val) => this.setState({ repeatPenalty: val }),
      }),
      Component.h(window.LlamaServerConfig, {
        enabled: this.state.llama_server_enabled,
        port: this.state.llama_server_port,
        host: this.state.llama_server_host,
        metricsEnabled: this.state.llama_server_metrics,
        onEnabledChange: (val) => this.setState({ llama_server_enabled: val }),
        onPortChange: (val) => this.setState({ llama_server_port: val }),
        onHostChange: (val) => this.setState({ llama_server_host: val }),
        onMetricsEnabledChange: (val) => this.setState({ llama_server_metrics: val }),
      }),
      Component.h(window.LoggingConfig, {
        logLevel: this.state.logLevel,
        maxFileSize: this.state.maxFileSize,
        maxFiles: this.state.maxFiles,
        enableFileLogging: this.state.enableFileLogging,
        enableDatabaseLogging: this.state.enableDatabaseLogging,
        enableConsoleLogging: this.state.enableConsoleLogging,
        onLogLevelChange: (val) => {
          console.log("[DEBUG] SettingsPage.onLogLevelChange:", {
            val,
            oldValue: this.state.logLevel,
          });
          this.setState({ logLevel: val });
        },
        onMaxFileSizeChange: (val) => this.setState({ maxFileSize: val }),
        onMaxFilesChange: (val) => this.setState({ maxFiles: val }),
        onEnableFileLoggingChange: (val) => this.setState({ enableFileLogging: val }),
        onEnableDatabaseLoggingChange: (val) => this.setState({ enableDatabaseLogging: val }),
        onEnableConsoleLoggingChange: (val) => this.setState({ enableConsoleLogging: val }),
      }),
      Component.h(window.ConfigExportImport, {
        onExport: this._exportConfig.bind(this),
        onImport: this._importConfig.bind(this),
      }),
      Component.h(window.SaveSection)
    );
  }
}

window.SettingsPage = SettingsPage;
