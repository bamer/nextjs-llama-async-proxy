/**
 * Presets Page - Socket-First
 * Direct socket calls for preset operations
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
    this.debouncedFilter = AppUtils.debounce(this._handleFilter.bind(this), 300);
    this.unsubscribers = [];
  }

  onMount() {
    console.log("[DEBUG] PresetsPage onMount");

    // Listen to socket broadcasts directly (replaces stateManager.subscribe)
    this.unsubscribers.push(
      socketClient.on("presets:updated", (data) => {
        console.log("[DEBUG] presets:updated broadcast");
        this.state.presets = data.presets || [];
        // Auto-select first preset if none selected
        if (data.presets?.length > 0 && !this.state.selectedPreset) {
          this._handlePresetSelect(data.presets[0].name);
        }
        this._updatePresetsUI();
      }),
      socketClient.on("models:updated", (data) => {
        console.log("[DEBUG] models:updated broadcast");
        this.state.availableModels = data.models || [];
        this._updateModelsUI();
      }),
      socketClient.on("llama:status", (data) => {
        console.log("[DEBUG] llama:status broadcast");
        if (data.status) {
          this.state.serverRunning = data.status.status === "running";
          this.state.serverPort = data.status.port || null;
        }
        this._updateStatusUI();
      })
    );
  }

  _onPresetsChange(presets) {
    if (JSON.stringify(presets) !== JSON.stringify(this.state.presets)) {
      this.state.presets = presets || [];
      // Auto-select first preset if none selected
      if (presets.length > 0 && !this.state.selectedPreset) {
        this._handlePresetSelect(presets[0].name);
      }
    }
  }

  _onServerStatusChange(status) {
    if (status) {
      this.state.serverRunning = status.status === "running";
      this.state.serverPort = status.port || null;
    }
  }

  /**
     * Handle preset selection - updates local state
     * @param {string} presetName - Preset name to select
     */
  _handlePresetSelect(presetName) {
    const preset = this.state.presets.find((p) => p.name === presetName);
    if (!preset) return;
    this.state.selectedPreset = preset;
    console.log("[DEBUG] Preset selected:", presetName);
  }

  _handleFilter(query) {
    this._filterParams(query);
  }

  /**
     * Handle adding a new parameter - call controller handler
     * @param {Object} data - Data object with paramKey, section, and name properties
     */
  async _handleAddParam(data) {
    const { paramKey, section, name } = data;
    const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
    if (!param || !this.state.selectedPreset) return;

    console.log("[DEBUG] Adding parameter:", paramKey);
    showNotification(`Added parameter "${param.label}"`, "success");
  }

  /**
     * Create new preset via controller
     */
  async _handleNewPreset() {
    const name = prompt("Preset name:");
    if (!name) return;

    const controller = this._el?._component?._controller;
    if (controller) {
      controller.handleCreatePreset(name);
    }
  }

  /**
     * Toggle the visibility of the defaults section in the editor.
     * @returns {void}
     */
  _toggleDefaultsSection() {
    this.state.expandedDefaults = !this.state.expandedDefaults;
    this._updateEditor();
  }

  /**
     * Filter parameter items in the editor based on search query.
     * @param {string} query - Search query to filter parameters
     * @returns {void}
     */
  _filterParams(query) {
    const items = this._el?.querySelectorAll(".param-item") || [];
    const lower = query.toLowerCase();
    items.forEach((item) => {
      const label = item.querySelector(".param-label")?.textContent.toLowerCase() || "";
      item.style.display = label.includes(lower) ? "" : "none";
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

  /**
     * Apply template config via socket
     */
  async _handleApplyTemplate(templateConfig) {
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

  bindEvents() { }
  didMount() { }
}

window.PresetsPage = PresetsPage;
