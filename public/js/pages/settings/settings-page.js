/**
 * Settings Page Component - Event-Driven DOM Updates
 * Composes RouterCard, ServerPathsForm, ModelDefaultsForm, and SaveSection
 */

class SettingsPage extends Component {
  constructor(props) {
    super(props);

    const config = props.config || {};
    const settings = props.settings || {};

    // Unified router configuration object
    this.routerConfig = config || this._getRouterDefaults();

    // Logging settings (kept separate)
    this.logLevel = settings.logLevel || "info";
    this.maxFileSize = settings.maxFileSize || 10485760;
    this.maxFiles = settings.maxFiles || 7;
    this.enableFileLogging = settings.enableFileLogging !== false;
    this.enableDatabaseLogging = settings.enableDatabaseLogging !== false;
    this.enableConsoleLogging = settings.enableConsoleLogging !== false;

    // Status and presets
    this.routerStatus = props.routerStatus || null;
    this.llamaStatus = props.llamaStatus || null;
    this.presets = props.presets || [];

    // Llama server specific settings (not part of routerConfig)
    this.llama_server_enabled = config.llama_server_enabled !== false;
    this.llama_server_port = config.llama_server_port || 8080;
    this.llama_server_host = config.llama_server_host || "0.0.0.0";
    this.llama_server_metrics = config.llama_server_metrics !== false;
    this.auto_start_on_launch = config.auto_start_on_launch !== false;

    this.unsubscribers = [];
  }

  /**
   * Get default router configuration values
   * @returns {Object} Default router configuration
   */
  _getRouterDefaults() {
    return {
      modelsPath: "",
      serverPath: "",
      host: "0.0.0.0",
      port: 8080,
      maxModelsLoaded: 4,
      parallelSlots: 1,
      ctxSize: 4096,
      gpuLayers: 0,
      threads: 4,
      batchSize: 512,
      temperature: 0.7,
      repeatPenalty: 1.1,
    };
  }

  onMount() {
    console.log("[SettingsPage] onMount");

    // Subscribe to state changes
    this.unsubscribers.push(
      stateManager.subscribe("routerConfig", this._onRouterConfigChange.bind(this)),
      stateManager.subscribe("settings", this._onSettingsChange.bind(this)),
      stateManager.subscribe("llamaServerStatus", this._onLlamaStatusChange.bind(this)),
      stateManager.subscribe("routerStatus", this._onRouterStatusChange.bind(this)),
      stateManager.subscribe("presets", this._onPresetsChange.bind(this)),
      stateManager.subscribe("actions:settings:save", this._onSaveAction.bind(this)),
      stateManager.subscribe("actions:router:restart", this._onRestartAction.bind(this))
    );
  }

  /**
   * Handle routerConfig state changes.
   * @param {Object} config - New router config state
   */
  _onRouterConfigChange(config) {
    if (JSON.stringify(config) !== JSON.stringify(this.routerConfig)) {
      this.routerConfig = { ...this.routerConfig, ...config };
      this._updateRouterConfigUI();
    }
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
      maxModelsLoaded: this.routerConfig.maxModelsLoaded,
      parallelSlots: this.routerConfig.parallelSlots,
      gpuLayers: this.routerConfig.gpuLayers,
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
    if (settings.maxModelsLoaded !== undefined) this.routerConfig.maxModelsLoaded = settings.maxModelsLoaded;
    if (settings.parallelSlots !== undefined) this.routerConfig.parallelSlots = settings.parallelSlots;
    if (settings.gpuLayers !== undefined) this.routerConfig.gpuLayers = settings.gpuLayers;
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
   * Update router config UI elements from the unified config object.
   */
  _updateRouterConfigUI() {
    if (!this._el) return;

    const fields = [
      "modelsPath",
      "serverPath",
      "host",
      "port",
      "maxModelsLoaded",
      "parallelSlots",
      "ctxSize",
      "gpuLayers",
      "threads",
      "batchSize",
      "temperature",
      "repeatPenalty",
    ];

    fields.forEach((field) => {
      const input = this._el.querySelector(`[data-field="${field}"]`);
      if (input && this.routerConfig[field] !== undefined) {
        if (input.type === "checkbox") {
          input.checked = !!this.routerConfig[field];
        } else {
          input.value = this.routerConfig[field];
        }
      }
    });
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
    // Convert routerConfig from camelCase to snake_case for backend compatibility
    const config = {
      modelsPath: this.routerConfig.modelsPath,
      serverPath: this.routerConfig.serverPath,
      host: this.routerConfig.host,
      port: this.routerConfig.port,
      ctx_size: this.routerConfig.ctxSize,
      threads: this.routerConfig.threads,
      batch_size: this.routerConfig.batchSize,
      temperature: this.routerConfig.temperature,
      repeatPenalty: this.routerConfig.repeatPenalty,
      llama_server_port: this.llama_server_port,
      llama_server_host: this.llama_server_host,
      llama_server_metrics: this.llama_server_metrics,
      auto_start_on_launch: this.auto_start_on_launch,
    };

    const settings = {
      maxModelsLoaded: this.routerConfig.maxModelsLoaded,
      parallelSlots: this.routerConfig.parallelSlots,
      gpuLayers: this.routerConfig.gpuLayers,
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
    // Update the LlamaRouterCard component's status display
    const routerCard = this._el?.querySelector(".llama-router-status-card");
    if (!routerCard) return;

    const rs = this.routerStatus || {};
    const ls = this.llamaStatus || {};
    const isRunning = rs.port || ls.port;
    const displayPort = rs.port || ls.port || this.routerConfig.port;

    // Update status badge
    const statusBadge = routerCard.querySelector(".status-badge");
    if (statusBadge) {
      statusBadge.textContent = isRunning ? "RUNNING" : "STOPPED";
      statusBadge.className = `status-badge ${isRunning ? "running" : "idle"}`;
    }

    // Update port display in header
    const portDisplay = routerCard.querySelector(".header-title-text");
    if (portDisplay) {
      portDisplay.textContent = isRunning ? `Llama Router : ${displayPort}` : "Llama Router";
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
    const displayPort = rs.port || ls.port || this.routerConfig.port;

    return Component.h("div", { className: "settings-page" }, [
      Component.h("h1", {}, "Settings"),
      Component.h(window.LlamaRouterCard, {
        status: this.llamaStatus,
        routerStatus: this.routerStatus,
        models: this.models || [],
        presets: this.presets,
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
      // Unified Llama Router Configuration component
      Component.h(window.LlamaRouterConfig, {
        config: this.routerConfig,
        onChange: (field, value) => {
          this.routerConfig[field] = value;
          console.log("[DEBUG] SettingsPage LlamaRouterConfig.onChange:", { field, value });
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
