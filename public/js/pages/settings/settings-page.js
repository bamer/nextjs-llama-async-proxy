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
    };
  }

  async didMount() {
    this.unsubscribers = [];
    this.routerCardUpdater = null;

    // Provide subscription callback to RouterCard
    if (this.routerCardComponent) {
      this.routerCardComponent.props.subscribeToUpdates = (callback) => {
        this.routerCardUpdater = callback;
      };
    }

    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        this.setState({ routerStatus: rs });
      })
    );
    this.unsubscribers.push(
      stateManager.subscribe("llamaStatus", (ls) => {
        this.setState({ llamaStatus: ls });
        // Notify RouterCard of status update
        if (this.routerCardUpdater) {
          this.routerCardUpdater(ls);
        }
      })
    );
  }

  willDestroy() {
    this.unsubscribers?.forEach((unsub) => unsub());
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

  async _refreshStatus() {
    try {
      const rs = await stateManager.getRouterStatus();
      stateManager.set("routerStatus", rs.routerStatus);
      this.setState({ routerStatus: rs.routerStatus });
    } catch (e) {
      // Ignore status refresh errors
    }
  }

  getEventMap() {
    return {
      "click [data-action=start]": "handleStart",
      "click [data-action=stop]": "handleStop",
      "click [data-action=restart]": "handleRestart",
      "click [data-action=save]": "handleSave",
    };
  }

  handleStart(event) {
    event.preventDefault();
    stateManager.startLlama();
    showNotification("Starting router...", "info");
    setTimeout(() => this._refreshStatus(), 2000);
  }

  handleStop(event) {
    event.preventDefault();
    if (!confirm("Stop router?")) return;
    stateManager.stopLlama();
    showNotification("Router stopped", "success");
    stateManager.set("routerStatus", null);
    this.setState({ routerStatus: null });
  }

  handleRestart(event) {
    event.preventDefault();
    stateManager.restartLlama();
    showNotification("Restarting...", "info");
    setTimeout(() => this._refreshStatus(), 3000);
  }

  handleSave(event) {
    event.preventDefault();
    this._save();
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
        onAction: (action) => {
          if (action === "start") {
            this.handleStart({ preventDefault: () => {} });
          } else if (action === "stop") {
            this.handleStop({ preventDefault: () => {} });
          } else if (action === "restart") {
            this.handleRestart({ preventDefault: () => {} });
          }
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
      Component.h(window.SaveSection)
    );
  }
}

window.SettingsPage = SettingsPage;
