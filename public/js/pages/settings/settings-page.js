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
    this.auto_start_on_launch = config.auto_start_on_launch !== false;
    this.unsubscribers = [];
  }

  onMount() {
    console.log("[SettingsPage] onMount");

    // Subscribe to state changes
    this.unsubscribers.push(
      stateManager.subscribe("config", this._onConfigChange.bind(this)),
      stateManager.subscribe("settings", this._onSettingsChange.bind(this)),
      stateManager.subscribe("llamaServerStatus", this._onLlamaStatusChange.bind(this)),
      stateManager.subscribe("routerStatus", this._onRouterStatusChange.bind(this)),
      stateManager.subscribe("presets", this._onPresetsChange.bind(this)),
      stateManager.subscribe("actions:settings:save", this._onSaveAction.bind(this)),
      stateManager.subscribe("actions:router:restart", this._onRestartAction.bind(this))
    );
  }

  /**
   * Handle config state changes.
   * @param {Object} config - New config state
   */
  _onConfigChange(config) {
    if (JSON.stringify(config) !== JSON.stringify(this._getConfig())) {
      this._applyConfig(config || {});
    }
  }

  /**
   * Get current config from properties.
   * @returns {Object} Current config object
   */
  _getConfig() {
    return {
      serverPath: this.serverPath,
      host: this.host,
      port: this.port,
      baseModelsPath: this.baseModelsPath,
      ctx_size: this.ctx_size,
      threads: this.threads,
      batch_size: this.batch_size,
      temperature: this.temperature,
      repeatPenalty: this.repeatPenalty,
      llama_server_port: this.llama_server_port,
      llama_server_host: this.llama_server_host,
      llama_server_metrics: this.llama_server_metrics,
      auto_start_on_launch: this.auto_start_on_launch,
    };
  }

  /**
   * Apply config changes to properties.
   * @param {Object} config - Config to apply
   */
  _applyConfig(config) {
    if (config.serverPath !== undefined) this.serverPath = config.serverPath;
    if (config.host !== undefined) this.host = config.host;
    if (config.port !== undefined) this.port = config.port;
    if (config.baseModelsPath !== undefined) this.baseModelsPath = config.baseModelsPath;
    if (config.ctx_size !== undefined) this.ctx_size = config.ctx_size;
    if (config.threads !== undefined) this.threads = config.threads;
    if (config.batch_size !== undefined) this.batch_size = config.batch_size;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    if (config.repeatPenalty !== undefined) this.repeatPenalty = config.repeatPenalty;
    if (config.llama_server_port !== undefined) this.llama_server_port = config.llama_server_port;
    if (config.llama_server_host !== undefined) this.llama_server_host = config.llama_server_host;
    if (config.llama_server_metrics !== undefined) this.llama_server_metrics = config.llama_server_metrics;
    if (config.auto_start_on_launch !== undefined) this.auto_start_on_launch = config.auto_start_on_launch;
    this._updateConfigUI();
  }

  /**
   * Handle settings state changes.
   * @param {Object} settings - New settings state
   */
  _onSettingsChange(settings) {
    if (JSON.stringify(settings) !== JSON.stringify(this._getSettings())) {
      this._applySettings(settings || {});
    }
  }

  /**
   * Get current settings from properties.
   * @returns {Object} Current settings object
   */
  _getSettings() {
    return {
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
  }

  /**
   * Apply settings changes to properties.
   * @param {Object} settings - Settings to apply
   */
  _applySettings(settings) {
    if (settings.maxModelsLoaded !== undefined) this.maxModelsLoaded = settings.maxModelsLoaded;
    if (settings.parallelSlots !== undefined) this.parallelSlots = settings.parallelSlots;
    if (settings.gpuLayers !== undefined) this.gpuLayers = settings.gpuLayers;
    if (settings.logLevel !== undefined) this.logLevel = settings.logLevel;
    if (settings.maxFileSize !== undefined) this.maxFileSize = settings.maxFileSize;
    if (settings.maxFiles !== undefined) this.maxFiles = settings.maxFiles;
    if (settings.enableFileLogging !== undefined) this.enableFileLogging = settings.enableFileLogging;
    if (settings.enableDatabaseLogging !== undefined) this.enableDatabaseLogging = settings.enableDatabaseLogging;
    if (settings.enableConsoleLogging !== undefined) this.enableConsoleLogging = settings.enableConsoleLogging;
    this._updateSettingsUI();
  }

  /**
   * Handle llama server status changes.
   * @param {Object} status - New llama status
   */
  _onLlamaStatusChange(status) {
    this.llamaStatus = status || {};
    this._updateStatusUI();
  }

  /**
   * Handle router status changes.
   * @param {Object} status - New router status
   */
  _onRouterStatusChange(status) {
    this.routerStatus = status || {};
    this._updateStatusUI();
  }

  /**
   * Handle presets changes.
   * @param {Array} presets - New presets list
   */
  _onPresetsChange(presets) {
    this.presets = presets || [];
    this._updatePresetsDropdown();
  }

  /**
   * Handle save action status changes.
   * @param {Object} action - Action status
   */
  _onSaveAction(action) {
    const btn = this.$("[data-action=\"save\"]");
    if (btn) {
      if (action.status === "saving") {
        btn.textContent = "Saving...";
        btn.disabled = true;
      } else {
        btn.textContent = "Save All Settings";
        btn.disabled = false;
      }
    }

    if (action.status === "complete") {
      showNotification("Settings saved", "success");
    } else if (action.status === "error") {
      showNotification(`Save failed: ${action.error}`, "error");
    }
  }

  /**
   * Handle restart action status changes.
   * @param {Object} action - Action status
   */
  _onRestartAction(action) {
    const restartBtn = this.$("[data-action=\"restart-router\"]");
    if (restartBtn) {
      if (action.status === "restarting") {
        restartBtn.disabled = true;
        restartBtn.textContent = "Restarting...";
      } else {
        restartBtn.disabled = false;
        restartBtn.textContent = "Restart Router";
      }
    }

    if (action.status === "error") {
      showNotification(`Restart failed: ${action.error}`, "error");
    }
  }

  /**
   * Update config-related UI elements.
   */
  _updateConfigUI() {
    const elements = this._el?.querySelectorAll("[data-field]");
    if (elements) {
      elements.forEach((el) => {
        const field = el.dataset.field;
        if (this[field] !== undefined) {
          if (el.type === "checkbox") {
            el.checked = this[field];
          } else {
            el.value = this[field];
          }
        }
      });
    }
  }

  /**
   * Update settings-related UI elements.
   */
  _updateSettingsUI() {
    const elements = this._el?.querySelectorAll("[data-setting]");
    if (elements) {
      elements.forEach((el) => {
        const field = el.dataset.setting;
        if (this[field] !== undefined) {
          if (el.type === "checkbox") {
            el.checked = this[field];
          } else {
            el.value = this[field];
          }
        }
      });
    }
  }

  /**
   * Update presets dropdown.
   */
  _updatePresetsDropdown() {
    const presetSelect = this._el?.querySelector("[data-field=\"activePreset\"]");
    if (presetSelect) {
      const currentValue = presetSelect.value;
      presetSelect.innerHTML = '<option value="">-- Select Preset --</option>';
      this.presets.forEach((preset) => {
        const option = document.createElement("option");
        option.value = preset.id;
        option.textContent = preset.name;
        presetSelect.appendChild(option);
      });
      if (currentValue) {
        presetSelect.value = currentValue;
      }
    }
  }

  /**
   * Clean up subscriptions.
   */
  destroy() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    }
    super.destroy();
  }

  /**
   * Emit save action with current config and settings.
   */
  _save() {
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
      llama_server_port: this.llama_server_port,
      llama_server_host: this.llama_server_host,
      llama_server_metrics: this.llama_server_metrics,
      auto_start_on_launch: this.auto_start_on_launch,
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

    console.log("[DEBUG] Emitting save action", { config, settings });
    stateManager.emit("action:settings:save", { config, settings });
  }

  /**
   * Update the status UI display based on current router and llama server status.
   * @returns {void}
   */
  async _updateStatusUI() {
    // Update the RouterCard component's status display
    const routerCard = this._el?.querySelector(".router-card");
    if (!routerCard) return;

    const rs = this.routerStatus || {};
    const ls = this.llamaStatus || {};
    const isRunning = rs.port || ls.port;
    const displayPort = rs.port || ls.port || this.port;

    // Update status badge
    const statusBadge = routerCard.querySelector(".status-badge");
    if (statusBadge) {
      statusBadge.textContent = isRunning ? "RUNNING" : "STOPPED";
      statusBadge.className = `status-badge ${isRunning ? "running" : "idle"}`;
    }

    // Update port display
    const portDisplay = routerCard.querySelector(".router-port-display");
    if (portDisplay) {
      portDisplay.textContent = displayPort || "?";
    }
  }

  bindEvents() {
    // Save button
    this.on("click", "[data-action=save]", (e) => {
      e.preventDefault();
      this._save();
    });
  }

  /**
   * Emit export action.
   */
  _exportConfig() {
    console.log("[DEBUG] Emitting export action");
    stateManager.emit("action:config:export");
  }

  /**
   * Emit import action with imported config.
   * @param {Object} importedConfig - Configuration object with config and settings properties
   */
  _importConfig(importedConfig) {
    console.log("[DEBUG] Emitting import action:", importedConfig);

    if (!importedConfig.config || !importedConfig.settings) {
      showNotification("Invalid configuration file", "error");
      return;
    }

    stateManager.emit("action:config:import", { config: importedConfig.config });
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
        onAction: (action) => {
          switch (action) {
          case "start":
            stateManager.emit("action:router:start");
            break;
          case "stop":
            stateManager.emit("action:router:stop");
            break;
          case "restart":
            stateManager.emit("action:router:restart");
            break;
          }
        },
      }),
      Component.h(window.RouterConfig, {
        maxModelsLoaded: this.maxModelsLoaded,
        parallelSlots: this.parallelSlots,
        ctx_size: this.ctx_size,
        gpuLayers: this.gpuLayers,
        onMaxModelsLoadedChange: (val) => {
          this.maxModelsLoaded = val;
        },
        onParallelSlotsChange: (val) => {
          this.parallelSlots = val;
        },
        onCtxSizeChange: (val) => {
          this.ctx_size = val;
        },
        onGpuLayersChange: (val) => {
          this.gpuLayers = val;
        },
      }),
      Component.h(window.ServerPathsForm, {
        baseModelsPath: this.baseModelsPath,
        serverPath: this.serverPath,
        host: this.host,
        port: this.port,
        autoStartOnLaunch: this.auto_start_on_launch,
        metricsEnabled: this.llama_server_metrics,
        onBaseModelsPathChange: (val) => {
          this.baseModelsPath = val;
        },
        onServerPathChange: (val) => {
          this.serverPath = val;
        },
        onHostChange: (val) => {
          this.host = val;
        },
        onPortChange: (val) => {
          this.port = val;
        },
        onAutoStartOnLaunchChange: (val) => {
          this.auto_start_on_launch = val;
        },
        onMetricsEnabledChange: (val) => {
          this.llama_server_metrics = val;
        },
      }),
      Component.h(window.ModelDefaultsForm, {
        threads: this.threads,
        batch_size: this.batch_size,
        temperature: this.temperature,
        repeatPenalty: this.repeatPenalty,
        onThreadsChange: (val) => {
          this.threads = val;
        },
        onBatchSizeChange: (val) => {
          this.batch_size = val;
        },
        onTemperatureChange: (val) => {
          this.temperature = val;
        },
        onRepeatPenaltyChange: (val) => {
          this.repeatPenalty = val;
        },
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
        onMaxFileSizeChange: (val) => {
          this.maxFileSize = val;
        },
        onMaxFilesChange: (val) => {
          this.maxFiles = val;
        },
        onEnableFileLoggingChange: (val) => {
          this.enableFileLogging = val;
        },
        onEnableDatabaseLoggingChange: (val) => {
          this.enableDatabaseLogging = val;
        },
        onEnableConsoleLoggingChange: (val) => {
          this.enableConsoleLogging = val;
        },
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
