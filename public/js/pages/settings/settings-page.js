/**
 * Settings Page Component - Event-Driven DOM Updates
 * Composes RouterCard, RouterConfig, LoggingConfig, and SaveSection
 */

console.log("[DEBUG] settings-page.js loaded");

class SettingsPage extends Component {
  constructor(props) {
    super(props);

    const config = props.config || {};
    const settings = props.settings || {};

    // Unified router configuration object - single source of truth
    this.routerConfig = config || this._getRouterDefaults();

    // Local change tracking - accumulates ALL changes before save
    // This fixes the issue where only changed fields were saved
    this._localRouterChanges = {};
    this._localLoggingChanges = {};

    // Logging settings (separate from router config)
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
    console.log("[DEBUG] SettingsPage onMount");

    // CRITICAL: Mount child components FIRST so bindEvents() is called
    // This ensures LlamaRouterCard, LlamaRouterConfig, LoggingConfig, etc. work
    this._mountChildren();

    // Listen to socket broadcasts directly (replaces stateManager.subscribe)
    this.unsubscribers.push(
      socketClient.on("routerConfig:updated", (data) => {
        console.log("[DEBUG] routerConfig:updated received");
        if (data.config) {
          this.routerConfig = { ...this._getRouterDefaults(), ...this.routerConfig, ...data.config };
          this._updateRouterConfigUI();
        }
      }),
      socketClient.on("loggingConfig:updated", (data) => {
        console.log("[DEBUG] loggingConfig:updated received");
        if (data.config) {
          this.logLevel = data.config.logLevel || this.logLevel;
          this.maxFileSize = data.config.maxFileSize || this.maxFileSize;
          this.maxFiles = data.config.maxFiles || this.maxFiles;
          this.enableFileLogging = data.config.enableFileLogging !== false;
          this.enableDatabaseLogging = data.config.enableDatabaseLogging !== false;
          this.enableConsoleLogging = data.config.enableConsoleLogging !== false;
          this._updateLoggingConfigUI();
        }
      }),
      socketClient.on("llama:status", (data) => {
        console.log("[DEBUG] llama:status received");
        this.routerStatus = data || {};
        this.llamaStatus = data.status || {};
        this._updateStatusUI();
      }),
      socketClient.on("presets:updated", (data) => {
        console.log("[DEBUG] presets:updated received");
        this.presets = data.presets || [];
        this._updatePresetsDropdown();
      })
    );
  }

  /**
     * Handle routerConfig state changes.
     * @param {Object} config - New router config state
     */
  _onRouterConfigChange(config) {
    if (config && typeof config === "object") {
      // Merge with existing to preserve all fields
      this.routerConfig = { ...this._getRouterDefaults(), ...this.routerConfig, ...config };
      this._updateRouterConfigUI();
    }
  }

  /**
     * Handle logging config state changes.
     * @param {Object} config - New logging config state
     */
  _onLoggingConfigChange(config) {
    if (config && typeof config === "object") {
      this.logLevel = config.logLevel || this.logLevel;
      this.maxFileSize = config.maxFileSize || this.maxFileSize;
      this.maxFiles = config.maxFiles || this.maxFiles;
      this.enableFileLogging = config.enableFileLogging !== false;
      this.enableDatabaseLogging = config.enableDatabaseLogging !== false;
      this.enableConsoleLogging = config.enableConsoleLogging !== false;
      this._updateLoggingConfigUI();
    }
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
      showNotification("Settings saved successfully", "success");
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
     * Update logging config UI elements.
     */
  _updateLoggingConfigUI() {
    if (!this._el) return;

    // Update log level select
    const logLevelSelect = this._el.querySelector("[data-field=log-level]");
    if (logLevelSelect && logLevelSelect.value !== this.logLevel) {
      logLevelSelect.value = this.logLevel;
    }

    // Update max file size input
    const maxFileSizeInput = this._el.querySelector("[data-field=max-file-size]");
    if (maxFileSizeInput) {
      const mb = Math.round(this.maxFileSize / 1024 / 1024);
      if (parseInt(maxFileSizeInput.value) !== mb) {
        maxFileSizeInput.value = mb;
      }
    }

    // Update max files input
    const maxFilesInput = this._el.querySelector("[data-field=max-files]");
    if (maxFilesInput && parseInt(maxFilesInput.value) !== this.maxFiles) {
      maxFilesInput.value = this.maxFiles;
    }

    // Update checkboxes
    const checkboxes = [
      { field: "enable-file-logging", value: this.enableFileLogging },
      { field: "enable-database-logging", value: this.enableDatabaseLogging },
      { field: "enable-console-logging", value: this.enableConsoleLogging },
    ];

    checkboxes.forEach(({ field, value }) => {
      const checkbox = this._el.querySelector(`[data-field="${field}"]`);
      if (checkbox && checkbox.checked !== value) {
        checkbox.checked = value;
      }
    });
  }

  /**
     * Update presets dropdown.
     */
  _updatePresetsDropdown() {
    const presetSelect = this._el?.querySelector("[data-field=\"activePreset\"]");
    if (presetSelect) {
      const currentValue = presetSelect.value;
      presetSelect.innerHTML = "<option value=\"\">-- Select Preset --</option>";
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
     * Update the status UI display based on current router and llama server status.
     */
  async _updateStatusUI() {
    const routerCard = this._el?.querySelector(".llama-router-status-card");
    if (!routerCard) return;

    const rs = this.routerStatus || {};
    const ls = this.llamaStatus || {};
    const isRunning = rs.port || ls.port;
    const displayPort = rs.port || ls.port || this.routerConfig.port;

    const statusBadge = routerCard.querySelector(".status-badge");
    if (statusBadge) {
      statusBadge.textContent = isRunning ? "RUNNING" : "STOPPED";
      statusBadge.className = `status-badge ${isRunning ? "running" : "idle"}`;
    }

    const portDisplay = routerCard.querySelector(".header-title-text");
    if (portDisplay) {
      portDisplay.textContent = isRunning ? `Llama Router : ${displayPort}` : "Llama Router";
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
     * Save all settings via socket
     */
  _save() {
    // Use local component state instead of stateManager.get()
    const currentRouterConfig = this.routerConfig || this._getRouterDefaults();
    const currentLoggingConfig = {
      logLevel: this.logLevel || "info",
      maxFileSize: this.maxFileSize || 10485760,
      maxFiles: this.maxFiles || 7,
      enableFileLogging: this.enableFileLogging !== false,
      enableDatabaseLogging: this.enableDatabaseLogging !== false,
      enableConsoleLogging: this.enableConsoleLogging !== false,
    };

    // Merge local changes with current state values
    const routerConfig = {
      ...currentRouterConfig,
      ...this._localRouterChanges,
      modelsPath: this._localRouterChanges.modelsPath !== undefined
        ? this._localRouterChanges.modelsPath
        : (currentRouterConfig.modelsPath || ""),
      serverPath: this._localRouterChanges.serverPath !== undefined
        ? this._localRouterChanges.serverPath
        : (currentRouterConfig.serverPath || ""),
      host: this._localRouterChanges.host !== undefined
        ? this._localRouterChanges.host
        : (currentRouterConfig.host || "0.0.0.0"),
      port: parseInt(this._localRouterChanges.port) || parseInt(currentRouterConfig.port) || 8080,
      maxModelsLoaded: parseInt(this._localRouterChanges.maxModelsLoaded) || parseInt(currentRouterConfig.maxModelsLoaded) || 4,
      parallelSlots: parseInt(this._localRouterChanges.parallelSlots) || parseInt(currentRouterConfig.parallelSlots) || 1,
      ctxSize: parseInt(this._localRouterChanges.ctxSize) || parseInt(currentRouterConfig.ctxSize) || 4096,
      gpuLayers: parseInt(this._localRouterChanges.gpuLayers) || parseInt(currentRouterConfig.gpuLayers) || 0,
      threads: parseInt(this._localRouterChanges.threads) || parseInt(currentRouterConfig.threads) || 4,
      batchSize: parseInt(this._localRouterChanges.batchSize) || parseInt(currentRouterConfig.batchSize) || 512,
      temperature: parseFloat(this._localRouterChanges.temperature) || parseFloat(currentRouterConfig.temperature) || 0.7,
      repeatPenalty: parseFloat(this._localRouterChanges.repeatPenalty) || parseFloat(currentRouterConfig.repeatPenalty) || 1.1,
    };

    const loggingConfig = {
      ...currentLoggingConfig,
      ...this._localLoggingChanges,
      logLevel: this._localLoggingChanges.logLevel !== undefined
        ? this._localLoggingChanges.logLevel
        : (currentLoggingConfig.logLevel || "info"),
      maxFileSize: (parseInt(this._localLoggingChanges.maxFileSize) || parseInt(currentLoggingConfig.maxFileSize) || 10) * 1024 * 1024,
      maxFiles: parseInt(this._localLoggingChanges.maxFiles) || parseInt(currentLoggingConfig.maxFiles) || 7,
      enableFileLogging: this._localLoggingChanges.enableFileLogging !== undefined
        ? this._localLoggingChanges.enableFileLogging
        : (currentLoggingConfig.enableFileLogging !== false),
      enableDatabaseLogging: this._localLoggingChanges.enableDatabaseLogging !== undefined
        ? this._localLoggingChanges.enableDatabaseLogging
        : (currentLoggingConfig.enableDatabaseLogging !== false),
      enableConsoleLogging: this._localLoggingChanges.enableConsoleLogging !== undefined
        ? this._localLoggingChanges.enableConsoleLogging
        : (currentLoggingConfig.enableConsoleLogging !== false),
    };

    console.log("[DEBUG] Saving via socket");

    // Clear local changes
    this._localRouterChanges = {};
    this._localLoggingChanges = {};

    // Call controller handler directly
    const controller = this._el?._component?._controller;
    if (controller) {
      controller.handleSave({ routerConfig, loggingConfig });
    }
  }

  bindEvents() {
    // Save button
    this.on("click", "[data-action=save]", (e) => {
      e.preventDefault();
      this._save();
    });

    // Router config changes - track in localChanges instead of directly modifying routerConfig
    this.on("change", "[data-field]", (e) => {
      const target = e.target;
      const field = target.dataset.field;
      if (!field) return;

      let value;
      if (target.type === "checkbox") {
        value = target.checked;
      } else if (target.type === "number") {
        value = target.step && target.step.includes(".")
          ? parseFloat(target.value)
          : parseInt(target.value, 10);
        value = isNaN(value) ? 0 : value;
      } else {
        value = target.value;
      }

      // Track change in localChanges (will be merged with state on save)
      this._localRouterChanges[field] = value;
      console.log("[DEBUG] SettingsPage field change tracked:", { field, value, totalChanges: Object.keys(this._localRouterChanges).length });

      // Visual feedback
      target.classList.add("changed");
      setTimeout(() => target.classList.remove("changed"), 500);
    });
  }

  /**
     * Emit export action - use direct socket call
     */
  async _exportConfig() {
    console.log("[DEBUG] Exporting config via socket");
    try {
      const response = await socketClient.request("config:export", {});
      if (response.success) {
        // Trigger download of exported config
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
      console.error("[DEBUG] Export error:", e);
      showNotification("Export error: " + e.message, "error");
    }
  }

  /**
     * Emit import action with imported config - use direct socket call
     * @param {Object} importedConfig - Configuration object
     */
  async _importConfig(importedConfig) {
    console.log("[DEBUG] Importing config via socket:", importedConfig);

    if (!importedConfig.routerConfig && !importedConfig.loggingConfig) {
      showNotification("Invalid configuration file", "error");
      return;
    }

    try {
      // Apply imported configs via socket request
      if (importedConfig.routerConfig) {
        this.routerConfig = { ...this.routerConfig, ...importedConfig.routerConfig };
        this._updateRouterConfigUI();
      }
      if (importedConfig.loggingConfig) {
        this.logLevel = importedConfig.loggingConfig.logLevel || this.logLevel;
        this.maxFileSize = importedConfig.loggingConfig.maxFileSize || this.maxFileSize;
        this.maxFiles = importedConfig.loggingConfig.maxFiles || this.maxFiles;
        this.enableFileLogging = importedConfig.loggingConfig.enableFileLogging !== false;
        this.enableDatabaseLogging = importedConfig.loggingConfig.enableDatabaseLogging !== false;
        this.enableConsoleLogging = importedConfig.loggingConfig.enableConsoleLogging !== false;
        this._updateLoggingConfigUI();
      }

      // Request server to save imported config
      const response = await socketClient.request("config:import", importedConfig);
      if (response.success) {
        showNotification("Configuration imported successfully", "success");
      } else {
        showNotification("Import failed: " + response.error, "error");
      }
    } catch (e) {
      console.error("[DEBUG] Import error:", e);
      showNotification("Import error: " + e.message, "error");
    }
  }

  render() {
    const rs = this.routerStatus || {};
    const ls = this.llamaStatus || {};
    const isRunning = rs.port || ls.port;
    const displayPort = rs.port || ls.port || this.routerConfig.port;

    return Component.h("div", { className: "settings-page" }, [
      // Llama Router Card with status and controls
      Component.h("div", { className: "settings-card" }, [
        Component.h("div", { className: "router-card-wrapper" }, [
          Component.h(window.LlamaRouterCard, {
            status: this.llamaStatus,
            routerStatus: this.routerStatus,
            models: this.models || [],
            presets: this.presets,
            onAction: (action, data) => {
              console.log("[DEBUG] settings-page onAction:", { action, data });
              const controller = this._el?._component?._controller;
              switch (action) {
              case "start":
                controller?.handleRouterStart();
                break;
              case "start-with-preset":
                controller?.handleRouterStartWithPreset(data);
                break;
              case "stop":
                controller?.handleRouterStop();
                break;
              case "restart":
                controller?.handleRouterRestart();
                break;
              }
            },
          }),
        ]),
      ]),

      // Unified Llama Router Configuration
      Component.h("div", { className: "settings-section" }, [
        Component.h("h2", { className: "section-title" }, "Router Configuration"),
        Component.h("p", { className: "section-desc" }, "Configure llama.cpp router paths, network, behavior, and inference defaults"),
        Component.h(window.LlamaRouterConfig, {
          config: this.routerConfig,
          onSave: this._handleSaveRouter.bind(this),
          onChange: (field, value) => {
            this._localRouterChanges[field] = value;
            console.log("[DEBUG] SettingsPage LlamaRouterConfig.onChange:", { field, value, totalChanges: Object.keys(this._localRouterChanges).length });
          },
        }),
      ]),

      // Logging Configuration
      Component.h("div", { className: "settings-section" }, [
        Component.h("h2", { className: "section-title" }, "Logging Configuration"),
        Component.h("p", { className: "section-desc" }, "Configure log collection and retention"),
        Component.h(window.LoggingConfig, {
          logLevel: this.logLevel,
          maxFileSize: this.maxFileSize,
          maxFiles: this.maxFiles,
          enableFileLogging: this.enableFileLogging,
          enableDatabaseLogging: this.enableDatabaseLogging,
          enableConsoleLogging: this.enableConsoleLogging,
          onSave: this._handleSaveLogging.bind(this),
          onLogLevelChange: (val) => {
            this._localLoggingChanges.logLevel = val;
            this.logLevel = val;
          },
          onMaxFileSizeChange: (val) => {
            this._localLoggingChanges.maxFileSize = val;
            this.maxFileSize = val;
          },
          onMaxFilesChange: (val) => {
            this._localLoggingChanges.maxFiles = val;
            this.maxFiles = val;
          },
          onEnableFileLoggingChange: (val) => {
            this._localLoggingChanges.enableFileLogging = val;
            this.enableFileLogging = val;
          },
          onEnableDatabaseLoggingChange: (val) => {
            this._localLoggingChanges.enableDatabaseLogging = val;
            this.enableDatabaseLogging = val;
          },
          onEnableConsoleLoggingChange: (val) => {
            this._localLoggingChanges.enableConsoleLogging = val;
            this.enableConsoleLogging = val;
          },
        }),
      ]),

      // Export/Import
      Component.h("div", { className: "settings-section" }, [
        Component.h(window.ConfigExportImport, {
          onExport: this._exportConfig.bind(this),
          onImport: this._importConfig.bind(this),
        }),
      ]),

      // About Card
      Component.h("div", { className: "settings-section" }, [
        Component.h("div", { className: "card settings-card" }, [
          Component.h("h3", { className: "card-title" }, "Llama Async Proxy Dashboard"),
          Component.h("p", { className: "card-desc" }, "Version 1.2"),
        ]),
      ]),
    ]);
  }

  /**
   * Save only router configuration
   */
  async _handleSaveRouter() {
    console.log("[SETTINGS] Saving router config...");
    const currentRouterConfig = this.routerConfig || {};
    const config = {
      modelsPath: this._localRouterChanges.modelsPath !== undefined
        ? this._localRouterChanges.modelsPath
        : (currentRouterConfig.modelsPath || ""),
      serverPath: this._localRouterChanges.serverPath !== undefined
        ? this._localRouterChanges.serverPath
        : (currentRouterConfig.serverPath || ""),
      host: this._localRouterChanges.host !== undefined
        ? this._localRouterChanges.host
        : (currentRouterConfig.host || "0.0.0.0"),
      port: parseInt(this._localRouterChanges.port) || parseInt(currentRouterConfig.port) || 8080,
      maxModelsLoaded: parseInt(this._localRouterChanges.maxModelsLoaded) || parseInt(currentRouterConfig.maxModelsLoaded) || 4,
      parallelSlots: parseInt(this._localRouterChanges.parallelSlots) || parseInt(currentRouterConfig.parallelSlots) || 1,
      ctxSize: parseInt(this._localRouterChanges.ctxSize) || parseInt(currentRouterConfig.ctxSize) || 4096,
      gpuLayers: parseInt(this._localRouterChanges.gpuLayers) || parseInt(currentRouterConfig.gpuLayers) || 0,
      threads: parseInt(this._localRouterChanges.threads) || parseInt(currentRouterConfig.threads) || 4,
      batchSize: parseInt(this._localRouterChanges.batchSize) || parseInt(currentRouterConfig.batchSize) || 512,
      temperature: parseFloat(this._localRouterChanges.temperature) || parseFloat(currentRouterConfig.temperature) || 0.7,
      repeatPenalty: parseFloat(this._localRouterChanges.repeatPenalty) || parseFloat(currentRouterConfig.repeatPenalty) || 1.1,
      metricsEnabled: this._localRouterChanges.metricsEnabled !== undefined
        ? this._localRouterChanges.metricsEnabled
        : (currentRouterConfig.metricsEnabled !== false),
      autoStartOnLaunch: this._localRouterChanges.autoStartOnLaunch !== undefined
        ? this._localRouterChanges.autoStartOnLaunch
        : (currentRouterConfig.autoStartOnLaunch === true),
    };

    try {
      const response = await socketClient.request("routerConfig:update", { config });
      if (response.success) {
        showNotification("Router settings saved successfully", "success");
        this._localRouterChanges = {};
        this.routerConfig = { ...this.routerConfig, ...config };
        this._updateRouterConfigUI();
      } else {
        showNotification("Save failed: " + response.error, "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Router save error:", e);
      showNotification("Save error: " + e.message, "error");
    }
  }

  /**
   * Save only logging configuration
   */
  async _handleSaveLogging() {
    console.log("[SETTINGS] Saving logging config...");
    const config = {
      logLevel: this.logLevel,
      maxFileSize: this.maxFileSize,
      maxFiles: this.maxFiles,
      enableFileLogging: this.enableFileLogging,
      enableDatabaseLogging: this.enableDatabaseLogging,
      enableConsoleLogging: this.enableConsoleLogging,
    };

    try {
      const response = await socketClient.request("loggingConfig:update", { config });
      if (response.success) {
        showNotification("Logging settings saved successfully", "success");
        this._localLoggingChanges = {};
      } else {
        showNotification("Save failed: " + response.error, "error");
      }
    } catch (e) {
      console.error("[SETTINGS] Logging save error:", e);
      showNotification("Save error: " + e.message, "error");
    }
  }
}

window.SettingsPage = SettingsPage;
