/**
 * Presets Controller - Handles presets page lifecycle
 */

class PresetsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.presetsService = null;
    this.unsubscribers = [];
  }

  /**
   * Ensure presets service is initialized with socket connection.
   * @returns {Object|null} PresetsService instance or null if not available
   */
  _ensureService() {
    if (!this.presetsService && window.socketClient?.socket) {
      this.presetsService = new PresetsService(window.socketClient.socket);
    }
    return this.presetsService;
  }

  willUnmount() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    }
  }

  destroy() {
    this.willUnmount();
    if (this.comp && this.comp.destroy) {
      this.comp.destroy();
    }
    this.comp = null;
  }

  async render() {
    this._ensureService();
    let availableModels = window.stateManager?.get("models") || [];

    if (availableModels.length === 0) {
      try {
        const result = await stateManager.getModels();
        availableModels = result.models || [];
        stateManager.set("models", availableModels);
      } catch (error) {
        console.error("[PRESETS] Failed to fetch models on render:", error.message);
      }
    }

    this.comp = new window.PresetsPage({
      presetsService: this.presetsService,
      availableModels,
    });
    this.init();
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    return el;
  }

  init() {
    console.log("[PRESETS] Controller init");

    // Subscribe to action events from the page component
    this.unsubscribers.push(
      stateManager.subscribe("action:presets:load", () => this._loadPresets()),
      stateManager.subscribe("action:presets:loadData", (data) => this._handleLoadData(data)),
      stateManager.subscribe("action:presets:save", (data) => this._handleSave(data)),
      stateManager.subscribe("action:presets:delete", (data) => this._handleDelete(data)),
      stateManager.subscribe("action:presets:apply", (data) => this._handleApply(data)),
      stateManager.subscribe("action:presets:select", (data) => this._handleSelect(data)),
      stateManager.subscribe("action:presets:new", () => this._handleNew())
    );
  }

  async _loadPresets() {
    console.log("[PRESETS] _loadPresets called");
    const service = this._ensureService();

    if (!service) {
      let attempts = 0;
      const checkSocket = () => {
        attempts++;
        if (window.socketClient?.socket?.connected) {
          this._loadPresets();
        } else if (attempts < 50) {
          setTimeout(checkSocket, 100);
        }
      };
      checkSocket();
      return;
    }

    try {
      const result = await service.listPresets();
      const presets = result?.presets || result || [];
      stateManager.set("presets", presets);
      stateManager.setActionStatus("presets:load", { status: "complete" });
    } catch (error) {
      console.error("[PRESETS] Load presets error:", error.message, error.stack);
      stateManager.setActionStatus("presets:load", { status: "error", error: error.message });
      ToastManager.error("Failed to load presets", {
        action: { label: "Retry", handler: () => this._loadPresets() }
      });
    }
  }

  async _handleLoadData(data) {
    const { presetId } = data;
    const service = this._ensureService();
    if (!service) return;

    try {
      const [modelsResult, defaultsResult] = await Promise.all([
        service.getModelsFromPreset(presetId),
        service.getDefaults(presetId),
      ]);

      const models = modelsResult || {};
      const standaloneModels = [];

      for (const modelName of Object.keys(models)) {
        if (modelName === "*") continue;
        standaloneModels.push({ name: modelName, fullName: modelName, ...models[modelName] });
      }

      // Emit event with preset data
      stateManager.emit("action:presets:loaded", {
        preset: { name: presetId },
        defaults: defaultsResult || {},
        standaloneModels,
      });
    } catch (error) {
      console.error("[PRESETS] Load preset data error:", error.message);
      showNotification("Failed to load preset data", "error");
    }
  }

  async _handleSave(data) {
    const { preset, isNew } = data;
    try {
      stateManager.setActionStatus("presets:save", {
        status: "saving",
        presetId: preset.id
      });

      const service = this._ensureService();
      if (isNew) {
        await service.createPreset(preset.name);
      } else {
        await service.updatePreset(preset);
      }

      await this._loadPresets();

      stateManager.setActionStatus("presets:save", {
        status: "complete",
        presetId: preset.id
      });

      showNotification("Preset saved successfully", "success");
    } catch (error) {
      stateManager.setActionStatus("presets:save", {
        status: "error",
        error: error.message
      });
      showNotification(`Failed to save preset: ${error.message}`, "error");
    }
  }

  async _handleDelete(data) {
    const { presetId } = data;
    try {
      stateManager.setActionStatus("presets:delete", {
        status: "loading",
        presetId
      });

      const service = this._ensureService();
      await service.deletePreset(presetId);
      await this._loadPresets();

      stateManager.setActionStatus("presets:delete", {
        status: "complete",
        presetId
      });

      showNotification("Preset deleted", "success");
    } catch (error) {
      stateManager.setActionStatus("presets:delete", {
        status: "error",
        error: error.message
      });
      showNotification(`Failed to delete preset: ${error.message}`, "error");
    }
  }

  async _handleApply(data) {
    const { preset } = data;
    try {
      stateManager.setActionStatus("presets:apply", {
        status: "applying",
        presetId: preset.id
      });

      // Apply preset to llama.cpp
      await stateManager.applyPreset(preset);

      stateManager.setActionStatus("presets:apply", {
        status: "complete",
        presetId: preset.id
      });

      showNotification(`Preset "${preset.name}" applied`, "success");
    } catch (error) {
      stateManager.setActionStatus("presets:apply", {
        status: "error",
        error: error.message
      });
      showNotification(`Failed to apply preset: ${error.message}`, "error");
    }
  }

  _handleSelect(data) {
    const { presetId } = data;
    stateManager.setPageState("presets", "selectedPresetId", presetId);
  }

  async _handleNew() {
    const name = prompt("Preset name:");
    if (!name) return;

    try {
      const service = this._ensureService();
      await service.createPreset(name);
      showNotification(`Preset "${name}" created`, "success");
      await this._loadPresets();

      // Emit select event for the new preset
      stateManager.emit("action:presets:select", { presetId: name });
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  didMount() {
    const newBtn = document.getElementById("btn-new-preset");
    if (newBtn) {
      newBtn.onclick = () => stateManager.emit("action:presets:new");
    }
  }

  /**
   * Load data for a specific preset (models and defaults).
   * @param {string|Object} presetName - Name of preset or preset object with name property
   * @returns {Promise<void>} Promise that resolves when preset data is loaded
   */
  async loadPresetData(presetName) {
    const service = this._ensureService();
    if (!service) return;

    // Handle both string (preset name) and object (preset with name property)
    const name = typeof presetName === "string" ? presetName : presetName?.name;
    if (!name) {
      console.error("[PRESETS] Invalid preset:", presetName);
      return;
    }

    try {
      const [modelsResult, defaultsResult] = await Promise.all([
        service.getModelsFromPreset(name),
        service.getDefaults(name),
      ]);

      const models = modelsResult || {};
      const standaloneModels = [];

      for (const modelName of Object.keys(models)) {
        if (modelName === "*") continue;
        standaloneModels.push({ name: modelName, fullName: modelName, ...models[modelName] });
      }

      // Emit event with preset data
      stateManager.emit("action:presets:loaded", {
        preset: { name },
        defaults: defaultsResult || {},
        standaloneModels,
      });
    } catch (error) {
      console.error("[PRESETS] Load preset data error:", error.message);
      showNotification("Failed to load preset data", "error");
    }
  }
}

window.PresetsController = PresetsController;
