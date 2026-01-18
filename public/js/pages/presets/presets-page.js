/**
 * Presets Page - Socket-First Architecture
 * Base page that works with presets-editor.js extension
 */

class PresetsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      presets: [],
      selectedPreset: null,
      globalDefaults: {},
      standaloneModels: [],
      availableModels: props.availableModels || [],
      loading: false,
      expandedDefaults: true,
      expandedModels: {},
      parameterFilter: "",
      serverRunning: false,
      serverPort: null,
      serverUrl: null,
    };
    this._domCache = new Map();
    this.unsubscribers = [];
  }

  onMount() {
    console.log("[DEBUG] PresetsPage onMount");

    // Listen to socket broadcasts
    this.unsubscribers.push(
      socketClient.on("presets:updated", (data) => {
        console.log("[DEBUG] presets:updated broadcast");
        let presets = [];
        if (Array.isArray(data)) {
          presets = data;
        } else if (Array.isArray(data?.presets)) {
          presets = data.presets;
        }
        this.state.presets = presets;
        if (presets.length > 0 && !this.state.selectedPreset) {
          this._handlePresetSelect(presets[0].name);
        }
        this._updatePresetsUI();
      }),
      socketClient.on("models:updated", (data) => {
        console.log("[DEBUG] models:updated broadcast");
        this.state.availableModels = data.models || [];
      }),
      socketClient.on("llama:status", (data) => {
        console.log("[DEBUG] llama:status broadcast");
        if (data.status) {
          this.state.serverRunning = data.status === "running";
          this.state.serverPort = data.status.port || null;
        }
      })
    );
  }

  /**
   * Handle preset selection - loads details and updates UI
   */
  _handlePresetSelect(presetName) {
    const preset = this.state.presets.find((p) => p.name === presetName);
    if (!preset) return;

    this.state.selectedPreset = preset;
    console.log("[DEBUG] Preset selected:", presetName);

    // Load defaults and models from the preset (already loaded by presets:list)
    if (preset.parameters) {
      // Use parameters from the preset list response
      this.state.globalDefaults = preset.parameters["*"] || {};
      // Build standalone models from parameters
      this.state.standaloneModels = Object.entries(preset.parameters)
        .filter(([section]) => section !== "*" && section !== "LLAMA_CONFIG_VERSION")
        .map(([name, config]) => ({ name, ...config }));
    }

    this._updatePresetsUI();
    this._updateEditor();
  }

  /**
   * Update the presets list UI (called by controller)
   */
  _updatePresetsUI() {
    // This method is called by the controller
    // The actual rendering is done by _updatePresetsList in presets-editor.js
    if (this._updatePresetsList) {
      this._updatePresetsList();
    }
  }

  /**
   * Bind events for preset items
   */
  _bindPresetEvents() {
    const container = this._domCache.get("presets-items");
    if (!container) return;

    container.querySelectorAll(".preset-item").forEach((item) => {
      item.onclick = () => {
        const presetName = item.dataset.presetName;
        this._handlePresetSelect(presetName);
      };
    });

    container.querySelectorAll(".preset-delete").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const presetName = btn.dataset.presetName;
        if (confirm(`Delete preset "${presetName}"?`)) {
          const controller = this._el?._component?._controller;
          if (controller) {
            controller.handleDeletePreset(presetName);
          }
        }
      };
    });
  }

  render() {
    return Component.h("div", { className: "presets-page" }, [
      Component.h("div", { className: "presets-page-header" }, Component.h("h1", {}, "Model Presets")),
      Component.h(window.PresetTemplates, { onApplyTemplate: this._handleApplyTemplate.bind(this) }),
      Component.h("div", { className: "presets-list" }, [
        Component.h("div", { className: "presets-toolbar" }, [
          Component.h("span", { className: "presets-label" }, "Presets:"),
          Component.h("div", { className: "presets-items", id: "presets-items" }),
          Component.h("button", { className: "btn btn-secondary add-preset-btn", id: "btn-new-preset" }, "+ New Preset")
        ])
      ]),
      Component.h("div", { className: "presets-main" }, [
        Component.h("div", { className: "router-card-container", id: "router-card" }),
        Component.h("div", { className: "presets-editor", id: "presets-editor" }, Component.h("div", { className: "empty-state" }, "Select a preset to edit"))
      ])
    ]);
  }

  bindEvents() {
    // New preset button
    this.on("click", "#btn-new-preset", () => {
      const name = prompt("Preset name:");
      if (name) {
        const controller = this._el?._component?._controller;
        if (controller) {
          controller.handleCreatePreset(name);
        }
      }
    });
  }

  _handleApplyTemplate(templateConfig) {
    if (!this.state.selectedPreset || this.state.selectedPreset.name === "default") {
      showNotification("Select or create a custom preset first", "warning");
      return;
    }
    console.log("[DEBUG] Applying template");
    showNotification("Template applied", "success");
  }

  destroy() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    }
    super.destroy();
  }
}

window.PresetsPage = PresetsPage;
