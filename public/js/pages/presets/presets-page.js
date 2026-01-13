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
    this.controller = props.controller;
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
      this._boundHandleNewPreset = this._handleNewPreset.bind(this);
      newBtn.addEventListener("click", this._boundHandleNewPreset);
    }

    const launchBtn = document.getElementById("btn-launch-server");
    launchBtn && (launchBtn.onclick = () => this._handleLaunchServer());

    const stopBtn = document.getElementById("btn-stop-server");
    stopBtn && (stopBtn.onclick = () => this._handleStopServer());

    this._subscribeToServerStatus();

    if (window.stateManager?.subscribe) {
      this.unsubscribers.push(
        window.stateManager.subscribe("llamaServerStatus", (status) => {
          if (status) {
            this.state.serverRunning = status.status === "running";
            this.state.serverPort = status.port || null;
            this.state.serverUrl = status.url || null;
            this._updateRouterCardHTML();
          }
        })
      );
    }

    this._bindRouterCardEvents();
  }

  _subscribeToServerStatus() {
    if (!window.socketClient?.socket) return;

    window.socketClient.socket.on("llama:status", (data) => {
      if (data?.status) {
        this.state.serverRunning = data.status === "running";
        this.state.serverPort = data.port || null;
        this.state.serverUrl = data.url || null;
        this._updateServerStatusPanel();
        this._updateRouterCard();
      }
    });

    window.socketClient.socket.on("llama-server:status", (data) => {
      if (data?.type === "broadcast" && data?.data) {
        const status = data.data;
        this.state.serverRunning = status.status === "running";
        this.state.serverPort = status.port || null;
        this.state.serverUrl = status.url || null;
        this._updateServerStatusPanel();
        this._updateRouterCard();
      }
    });
  }

  _getService() {
    return this._presetsService || (this.controller ? this.controller.presetsService : null);
  }

  _emit(event, data) {
    if (!this._el) return;
    switch (event) {
      case "preset:select": this._handlePresetSelect(data); break;
      case "preset:loaded": this._handlePresetLoaded(data); break;
      case "defaults:toggle": this._toggleDefaultsSection(); break;
      case "param:add": this._handleAddParam(data); break;
    }
  }

  _handlePresetSelect(presetName) {
    const preset = this.state.presets.find((p) => p.name === presetName);
    if (!preset) return;
    this.state.selectedPreset = preset;
    this._updatePresetsList();
    this.controller?.loadPresetData(preset);
  }

  _handlePresetLoaded(data) {
    this.state.globalDefaults = data.defaults;
    this.state.standaloneModels = data.standaloneModels;
    this._updateEditor();
  }

  _handleFilter(query) {
    this._filterParams(query);
  }

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
        this.controller?.loadPresetData(this.state.selectedPreset);
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  async _handleNewPreset() {
    const name = prompt("Preset name:");
    if (!name) return;
    try {
      await this._getService().createPreset(name);
      showNotification(`Preset "${name}" created`, "success");
      this.state.presets = [...this.state.presets, { name }];
      this._updatePresetsList();
      this._emit("preset:select", name);
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  _toggleDefaultsSection() {
    this.state.expandedDefaults = !this.state.expandedDefaults;
    this._updateEditor();
  }

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

  bindEvents() {}
  didMount() {}
}

window.PresetsPage = PresetsPage;
