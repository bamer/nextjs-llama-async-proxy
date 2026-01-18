/**
 * Presets Page - Main page component (render and state)
 */

class PresetsPage extends Component {
  constructor(props) {
    super(props);
    this._presetsService = props.presetsService || null;
    this.state = {
      presets: props.presets || [],
      selectedPreset: null,
      globalDefaults: {},
      standaloneModels: [],
      availableModels: props.availableModels || [],
      loading: true,
      expandedDefaults: true,
      expandedModels: {},
      parameterFilter: "",
      serverRunning: false,
      serverPort: null,
      serverUrl: null,
    };
    this._domCache = new Map();
    this._eventsBounded = false;
    this.debouncedFilter = AppUtils.debounce(this._handleFilter.bind(this), 300);
  }

  onMount() {
    console.log("[PRESETS] onMount called");
    this._domCache.set("presets-items", document.getElementById("presets-items"));
    this._domCache.set("server-status", document.getElementById("server-status"));
    this._domCache.set("editor", document.getElementById("presets-editor"));

    const routerContainer = document.getElementById("router-card");
    if (routerContainer) {
      routerContainer.innerHTML = this._renderRouterCard();
    }
    this._domCache.set("router-card-container", document.getElementById("router-card-container"));

    const newBtn = document.getElementById("btn-new-preset");
    if (newBtn) {
      newBtn.removeEventListener("click", this._boundHandleNewPreset);
      this._boundHandleNewPreset = () => stateManager.emit("action:presets:new");
      newBtn.addEventListener("click", this._boundHandleNewPreset);
    }

    const launchBtn = document.getElementById("btn-launch-server");
    launchBtn && (launchBtn.onclick = () => this._handleLaunchServer());

    const stopBtn = document.getElementById("btn-stop-server");
    stopBtn && (stopBtn.onclick = () => this._handleStopServer());

    // Subscribe to state changes instead of socket events
    this.unsubscribers.push(
      stateManager.subscribe("presets", this._onPresetsChange.bind(this)),
      stateManager.subscribe("pageState:presets", this._onPresetsStateChange.bind(this)),
      stateManager.subscribe("llamaServerStatus", this._onServerStatusChange.bind(this)),
      stateManager.subscribe("actions:presets:save", this._onSaveAction.bind(this)),
      stateManager.subscribe("actions:presets:delete", this._onDeleteAction.bind(this)),
      stateManager.subscribe("actions:presets:apply", this._onApplyAction.bind(this)),
      stateManager.subscribe("action:presets:loaded", this._onPresetLoaded.bind(this))
    );

    // Emit event to trigger initial load
    stateManager.emit("action:presets:load");
  }

  _onPresetsChange(presets) {
    if (JSON.stringify(presets) !== JSON.stringify(this.state.presets)) {
      this.state.presets = presets || [];
      this._updatePresetsList();
      // Auto-select first preset if none selected
      if (presets.length > 0 && !this.state.selectedPreset) {
        stateManager.emit("action:presets:select", { presetId: presets[0].name });
      }
    }
  }

  _onPresetsStateChange(state) {
    if (state?.selectedPresetId) {
      const preset = this.state.presets.find((p) => p.name === state.selectedPresetId);
      if (preset && this.state.selectedPreset?.name !== preset.name) {
        this.state.selectedPreset = preset;
        this._updatePresetsList();
        stateManager.emit("action:presets:loadData", { presetId: preset.name });
      }
    }
  }

  _onServerStatusChange(status) {
    if (status) {
      this.state.serverRunning = status.status === "running";
      this.state.serverPort = status.port || null;
      this.state.serverUrl = status.url || null;
      this._updateRouterCard();
    }
  }

  _onSaveAction(action) {
    if (action.status === "loading") {
      this._setSaving(true);
    } else {
      this._setSaving(false);
      if (action.status === "error") {
        showNotification(`Save failed: ${action.error}`, "error");
      }
    }
  }

  _onDeleteAction(action) {
    if (action.status === "complete") {
      this._updatePresetsList();
    } else if (action.status === "error") {
      showNotification(`Delete failed: ${action.error}`, "error");
    }
  }

  _onApplyAction(action) {
    if (action.status === "applying") {
      this._setApplying(true, action.presetId);
    } else {
      this._setApplying(false);
      if (action.status === "error") {
        showNotification(`Apply failed: ${action.error}`, "error");
      }
    }
  }

  _onPresetLoaded(data) {
    this.state.globalDefaults = data.defaults;
    this.state.standaloneModels = data.standaloneModels;
    // Auto-expand models section when models are present
    if (data.standaloneModels && data.standaloneModels.length > 0) {
      this.state.expandedModels = {};
      data.standaloneModels.forEach((m) => {
        this.state.expandedModels[m.name] = true;
      });
    }
    this._updateEditor();
  }

  /**
   * Get the presets service instance from props.
   * @returns {Object|null} PresetsService instance or null
   */
  _getService() {
    return this._presetsService;
  }

  /**
   * Handle preset selection event from the UI.
   * @param {string} presetName - Preset name to select
   * @returns {void}
   */
  _handlePresetSelect(presetName) {
    const preset = this.state.presets.find((p) => p.name === presetName);
    if (!preset) return;
    this.state.selectedPreset = preset;
    this._updatePresetsList();
    stateManager.emit("action:presets:loadData", { presetId: preset.name });
  }

  _handleFilter(query) {
    this._filterParams(query);
  }

  /**
   * Handle adding a new parameter to defaults or a specific model.
   * @param {Object} data - Data object with paramKey, section, and name properties
   * @returns {Promise<void>} Promise that resolves when add is complete
   */
  async _handleAddParam(data) {
    const { paramKey, section, name } = data;
    const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
    if (!param) return;
    const modelName = section === "defaults" ? "*" : name;
    if (!modelName || !this.state.selectedPreset) return;

    try {
      await this._getService().addModel(this.state.selectedPreset.name, modelName, { [param.iniKey]: param.default });
      showNotification(`Parameter "${param.label}" added`, "success");
      if (section === "defaults") {
        this.state.globalDefaults[param.iniKey] = param.default;
        this._updateEditor();
      } else {
        stateManager.emit("action:presets:loadData", { presetId: this.state.selectedPreset.name });
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  /**
   * Handle creating a new preset with user-provided name.
   * @returns {Promise<void>} Promise that resolves when preset is created
   */
  async _handleNewPreset() {
    stateManager.emit("action:presets:new");
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
   * Apply a template configuration to the current preset's defaults.
   * @param {Object} templateConfig - Template configuration object with parameter key-value pairs
   * @returns {Promise<void>} Promise that resolves when template is applied
   */
  async _handleApplyTemplate(templateConfig) {
    if (!this.state.selectedPreset || this.state.selectedPreset.name === "default") {
      showNotification("Select or create a custom preset first", "warning");
      return;
    }
    try {
      for (const [key, value] of Object.entries(templateConfig)) {
        await this._getService().updateDefaults(this.state.selectedPreset.name, { ...this.state.globalDefaults, [key]: value });
        this.state.globalDefaults[key] = value;
      }
      showNotification("Template applied", "success");
      this._updateEditor();
    } catch (error) {
      showNotification(`Failed: ${error.message}`, "error");
    }
  }

  destroy() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    }
    super.destroy();
  }

  bindEvents() {}
  didMount() {}
}

window.PresetsPage = PresetsPage;
