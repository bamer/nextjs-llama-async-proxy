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

  _ensureService() {
    if (!this.presetsService && window.socketClient?.socket) {
      this.presetsService = new PresetsService(window.socketClient.socket);
    }
    return this.presetsService;
  }

  willUnmount() {
    this.unsubscribers.forEach((unsub) => unsub());
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

    this.comp = new PresetsPage({
      presetsService: this.presetsService,
      controller: this,
      availableModels,
    });
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    return el;
  }

  didMount() {
    const newBtn = document.getElementById("btn-new-preset");
    if (newBtn) {
      newBtn.onclick = () => this.comp._handleNewPreset();
    }
    this.loadPresetsData();
  }

  async loadPresetsData() {
    console.log("[PRESETS] loadPresetsData called");
    const service = this._ensureService();

    if (!service) {
      let attempts = 0;
      const checkSocket = () => {
        attempts++;
        if (window.socketClient?.socket?.connected) {
          this.loadPresetsData();
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
      if (this.comp) {
        this.comp.state.presets = presets;
        this.comp.state.loading = false;
        this.comp._updatePresetsList();
        if (presets.length > 0 && !this.comp.state.selectedPreset) {
          this.comp._emit("preset:select", presets[0].name);
        }
      }
      this.loadAvailableModels();
    } catch (error) {
      console.error("[PRESETS] Load presets error:", error.message, error.stack);
      ToastManager.error("Failed to load presets", {
        action: { label: "Retry", handler: () => this.loadPresetsData() }
      });
      if (this.comp) {
        this.comp.state.loading = false;
      }
    }
  }

  async loadAvailableModels() {
    try {
      const models = stateManager.get("models") || [];
      if (this.comp) {
        this.comp.state.availableModels = models;
        if (this.comp.state.selectedPreset) {
          this.comp._updateEditor();
        }
      }
    } catch (error) {
      console.error("[PRESETS] Load available models error:", error.message);
    }
  }

  async loadPresetData(preset) {
    const service = this._ensureService();
    if (!service) return;

    try {
      const [modelsResult, defaultsResult] = await Promise.all([
        service.getModelsFromPreset(preset.name),
        service.getDefaults(preset.name),
      ]);

      const models = modelsResult || {};
      const standaloneModels = [];

      for (const modelName of Object.keys(models)) {
        if (modelName === "*") continue;
        standaloneModels.push({ name: modelName, fullName: modelName, ...models[modelName] });
      }

      if (this.comp) {
        this.comp._emit("preset:loaded", {
          preset,
          defaults: defaultsResult || {},
          standaloneModels,
        });
      }
    } catch (error) {
      console.error("[PRESETS] Load preset data error:", error.message);
      showNotification("Failed to load preset data", "error");
    }
  }
}

window.PresetsController = PresetsController;
