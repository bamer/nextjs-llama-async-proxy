/**
 * Presets Controller - Socket-First
 * Direct socket calls for presets operations
 */

class PresetsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.unsubscribers = [];
  }

  willUnmount() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsub) => unsub?.());
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
    console.log("[DEBUG] PresetsController render");

    // Load models via socket - use local state instead of stateManager
    let availableModels = [];
    try {
      const response = await socketClient.request("models:list", {});
      availableModels = response.success ? response.data : [];
    } catch (error) {
      console.error("[DEBUG] Failed to fetch models:", error.message);
    }

    this.comp = new window.PresetsPage({ availableModels });

    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    this.comp.onMount?.();

    return el;
  }

  /**
     * Load presets via socket
     */
  async _loadPresetsAsync() {
    console.log("[DEBUG] Loading presets");
    try {
      const response = await socketClient.request("presets:list", {});
      if (response.success) {
        console.log("[DEBUG] Presets loaded:", response.data.length);
        // Update component directly instead of stateManager
        if (this.comp) {
          this.comp.state.presets = response.data || [];
          this.comp._updatePresetsUI();
        }
      }
    } catch (error) {
      console.error("[DEBUG] Failed to load presets:", error.message);
    }
  }

  /**
     * Save preset via socket
     */
  async handleSavePreset(preset) {
    console.log("[DEBUG] Saving preset:", preset.name);
    try {
      showNotification("Saving preset...", "info");
      const response = await socketClient.request("presets:save", { preset });

      if (response.success) {
        showNotification(`Preset "${preset.name}" saved`, "success");
        // Server broadcasts presets:updated
      } else {
        showNotification(`Error: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[DEBUG] Save error:", error.message);
      showNotification(`Failed to save preset: ${error.message}`, "error");
    }
  }

  /**
     * Delete preset via socket
     */
  async handleDeletePreset(presetName) {
    console.log("[DEBUG] Deleting preset:", presetName);
    if (!confirm(`Delete preset "${presetName}"?`)) return;

    try {
      showNotification("Deleting preset...", "info");
      const response = await socketClient.request("presets:delete", { presetName });

      if (response.success) {
        showNotification("Preset deleted", "success");
      } else {
        showNotification(`Error: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[DEBUG] Delete error:", error.message);
      showNotification(`Failed to delete preset: ${error.message}`, "error");
    }
  }

  /**
     * Apply preset via socket
     */
  async handleApplyPreset(presetName) {
    console.log("[DEBUG] Applying preset:", presetName);
    try {
      showNotification("Applying preset...", "info");
      const response = await socketClient.request("presets:apply", { presetName });

      if (response.success) {
        showNotification(`Preset "${presetName}" applied`, "success");
      } else {
        showNotification(`Error: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[DEBUG] Apply error:", error.message);
      showNotification(`Failed to apply preset: ${error.message}`, "error");
    }
  }

  /**
     * Create new preset via socket
     */
  async handleCreatePreset(presetName) {
    console.log("[DEBUG] Creating preset:", presetName);
    try {
      showNotification("Creating preset...", "info");
      const response = await socketClient.request("presets:save", {
        preset: { name: presetName },
      });

      if (response.success) {
        showNotification(`Preset "${presetName}" created`, "success");
      } else {
        showNotification(`Error: ${response.error}`, "error");
      }
    } catch (error) {
      console.error("[DEBUG] Create error:", error.message);
      showNotification(`Failed to create preset: ${error.message}`, "error");
    }
  }
}

window.PresetsController = PresetsController;
