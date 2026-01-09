/**
 * Presets Page - Hierarchical Preset Management
 * Global Defaults → Groups → Models
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

  init() {
    this.unsubscribers.push(
      stateManager.subscribe("settings", async (settings) => {
        if (settings && this.comp) {
          await this.comp.loadAvailableModels();
        }
      })
    );
  }

  willUnmount() {
    this.unsubscribers.forEach((unsub) => unsub());
  }

  destroy() {
    this.willUnmount();
    if (this.comp && this.comp.destroy) {
      this.comp.destroy();
    }
  }

  async render() {
    const service = this._ensureService();
    if (!service) {
      // Socket not ready - show loading, will load when didMount is called
      this.comp = new PresetsPage({ presetsService: null, controller: this, loading: true });
      const el = this.comp.render();
      this.comp._el = el;
      el._component = this.comp;
      this.comp.bindEvents();
      return el;
    }

    await this.load();
    const presets = stateManager.get("presets") || [];
    this.comp = new PresetsPage({
      presets,
      presetsService: service,
      controller: this,
    });
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    return el;
  }

  didMount() {
    if (this.comp && this.comp.didMount) {
      this.comp.didMount();
    }
    this.loadPresetsData();
  }

  async loadPresetsData() {
    const service = this._ensureService();
    if (!service) {
      // Wait for socket connection
      const checkSocket = () => {
        if (window.socketClient?.socket?.connected) {
          this.loadPresetsData();
        } else {
          setTimeout(checkSocket, 100);
        }
      };
      checkSocket();
      return;
    }

    try {
      const presets = await service.listPresets();
      console.log(
        "[PRESETS] Loaded",
        presets.length,
        "presets:",
        presets.map((p) => p.name)
      );
      stateManager.set("presets", presets);
      if (this.comp) {
        this.comp.setState({ presets, loading: false });
      }
    } catch (error) {
      console.error("[PRESETS] Load presets error:", error.message);
      showNotification("Failed to load presets", "error");
      if (this.comp) {
        this.comp.setState({ loading: false });
      }
    }
  }

  async load() {
    const service = this._ensureService();
    if (!service) return;

    try {
      const presets = await service.listPresets();
      stateManager.set("presets", presets);
    } catch (error) {
      console.error("[PRESETS] Load error:", error.message);
      stateManager.set("presets", []);
    }
  }
}

class PresetsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      presets: props.presets || [],
      selectedPreset: null,
      globalDefaults: null,
      groups: [],
      standaloneModels: [],
      availableModels: [],
      showGlobalModal: false,
      showGroupModal: false,
      showModelModal: false,
      showInheritanceModal: false,
      editingGroup: null,
      editingModel: null,
      currentGroup: {},
      currentModel: {},
      inheritanceData: null,
      validationErrors: {},
      loading: props.loading !== undefined ? props.loading : false,
    };
    this.presetsService = props.presetsService;
    this.controller = props.controller;
  }

  render() {
    return Component.h(
      "div",
      { className: "presets-page" },
      this.renderHeader(),
      this.renderContent(),
      this.renderModals()
    );
  }

  renderHeader() {
    return Component.h(
      "div",
      { className: "presets-header" },
      Component.h("h1", {}, "Model Presets"),
      Component.h(
        "p",
        { className: "presets-subtitle" },
        "Configure llama.cpp parameters with global defaults, groups, and per-model settings"
      )
    );
  }

  renderContent() {
    // Show loading state
    if (this.state.loading) {
      return Component.h(
        "div",
        { className: "presets-loading" },
        Component.h("div", { className: "loading-spinner" }),
        Component.h("p", {}, "Loading presets...")
      );
    }

    const presets = this.state.presets;

    if (presets.length === 0) {
      return Component.h(
        "div",
        { className: "presets-empty" },
        Component.h("div", { className: "empty-icon" }, "⚙"),
        Component.h("h2", {}, "No Presets Yet"),
        Component.h("p", {}, "Create your first preset to get started"),
        Component.h(
          "button",
          { className: "btn btn-primary", "data-action": "new-preset" },
          "Create First Preset"
        )
      );
    }

    return Component.h(
      "div",
      { className: "presets-container" },
      this.renderPresetList(),
      this.renderEditor()
    );
  }

  renderPresetList() {
    return Component.h(
      "div",
      { className: "presets-list" },
      Component.h("h3", { className: "list-title" }, "Presets"),
      this.state.presets.map((preset) =>
        Component.h(
          "div",
          {
            className: `preset-item ${this.state.selectedPreset?.name === preset.name ? "active" : ""}`,
            "data-action": "select-preset",
            "data-preset-name": preset.name,
          },
          Component.h("span", { className: "preset-name" }, preset.name)
        )
      ),
      Component.h(
        "button",
        {
          className: "btn btn-secondary add-preset-btn",
          "data-action": "new-preset",
        },
        "+ New Preset"
      )
    );
  }

  renderEditor() {
    if (!this.state.selectedPreset) {
      return Component.h(
        "div",
        { className: "presets-editor empty" },
        Component.h("div", { className: "empty-state" }, "Select a preset to edit")
      );
    }

    return Component.h(
      "div",
      { className: "presets-editor" },
      Component.h(
        "div",
        { className: "editor-header" },
        Component.h("h2", {}, this.state.selectedPreset.name),
        Component.h(
          "div",
          { className: "editor-actions" },
          Component.h(
            "button",
            { className: "btn btn-secondary btn-sm", "data-action": "edit-defaults" },
            "Global Defaults"
          ),
          Component.h(
            "button",
            { className: "btn btn-secondary btn-sm", "data-action": "new-group" },
            "+ Add Group"
          ),
          Component.h(
            "button",
            { className: "btn btn-secondary btn-sm", "data-action": "new-model" },
            "+ Add Model"
          )
        )
      ),
      this.renderGroups(),
      this.renderStandaloneModels()
    );
  }

  renderGroups() {
    const groups = this.state.groups;

    if (groups.length === 0 && this.state.standaloneModels.length === 0) {
      return Component.h(
        "div",
        { className: "presets-empty-state" },
        Component.h("p", {}, "No groups or models yet. Add one to get started.")
      );
    }

    return Component.h(
      "div",
      { className: "presets-groups" },
      groups.map((group) => this.renderGroup(group))
    );
  }

  renderGroup(group) {
    return Component.h(
      "div",
      { className: "card group-card" },
      Component.h(
        "div",
        { className: "group-header" },
        Component.h("h3", { className: "group-title" }, group.name),
        Component.h(
          "span",
          { className: "model-count" },
          `${group.models?.length || 0} model${group.models?.length !== 1 ? "s" : ""}`
        ),
        Component.h(
          "div",
          { className: "group-actions" },
          Component.h(
            "button",
            {
              className: "btn btn-secondary btn-sm",
              "data-action": "edit-group",
              "data-group-name": group.name,
            },
            "Edit"
          ),
          Component.h(
            "button",
            {
              className: "btn btn-danger btn-sm",
              "data-action": "delete-group",
              "data-group-name": group.name,
            },
            "Delete"
          )
        )
      ),
      group.models && group.models.length > 0
        ? Component.h(
            "div",
            { className: "group-models" },
            group.models.map((model) => this.renderModelItem(model, group.name))
          )
        : null,
      Component.h(
        "button",
        {
          className: "btn btn-secondary btn-sm add-model-btn",
          "data-action": "new-model",
          "data-group-name": group.name,
        },
        "+ Add Model"
      )
    );
  }

  renderStandaloneModels() {
    const models = this.state.standaloneModels;

    if (models.length === 0) return null;

    return Component.h(
      "div",
      { className: "card standalone-section" },
      Component.h("h3", { className: "section-title" }, "Standalone Models"),
      models.map((model) => this.renderModelItem(model, null))
    );
  }

  renderModelItem(model, groupName) {
    return Component.h(
      "div",
      { className: "model-item" },
      Component.h(
        "div",
        { className: "model-info" },
        Component.h("span", { className: "model-name" }, model.name || "Unnamed"),
        Component.h("span", { className: "model-path" }, model.model || "No model set")
      ),
      Component.h(
        "div",
        { className: "model-actions" },
        Component.h(
          "button",
          {
            className: "btn btn-secondary btn-sm",
            "data-action": "edit-model",
            "data-group-name": groupName || "",
            "data-model-name": model.name,
          },
          "Edit"
        ),
        Component.h(
          "button",
          {
            className: "btn btn-danger btn-sm",
            "data-action": "delete-model",
            "data-group-name": groupName || "",
            "data-model-name": model.name,
          },
          "×"
        )
      )
    );
  }

  renderModals() {
    if (!this.state.showGlobalModal && !this.state.showGroupModal && !this.state.showModelModal) {
      return null;
    }

    return Component.h(
      "div",
      { className: "modals-container" },
      this.state.showGlobalModal ? this.renderGlobalModal() : null,
      this.state.showGroupModal ? this.renderGroupModal() : null,
      this.state.showModelModal ? this.renderModelModal() : null
    );
  }

  renderGlobalModal() {
    return Component.h(
      "div",
      { className: "modal-overlay", "data-action": "close-modal" },
      Component.h(
        "div",
        { className: "modal-content" },
        Component.h(
          "div",
          { className: "modal-header" },
          Component.h("h2", {}, "Global Defaults"),
          Component.h("button", { className: "modal-close", "data-action": "close-modal" }, "×")
        ),
        Component.h(
          "div",
          { className: "modal-body" },
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Context Size"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              value: this.state.globalDefaults?.ctxSize || 2048,
              "data-field": "ctxSize",
            }),
            Component.h("label", {}, "Temperature"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              step: "0.1",
              value: this.state.globalDefaults?.temperature || 0.7,
              "data-field": "temperature",
            }),
            Component.h("label", {}, "GPU Layers"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              value: this.state.globalDefaults?.nGpuLayers || 0,
              "data-field": "nGpuLayers",
            }),
            Component.h("label", {}, "Threads"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              value: this.state.globalDefaults?.threads || 0,
              "data-field": "threads",
            }),
            Component.h("label", {}, "Batch Size"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              value: this.state.globalDefaults?.batchSize || 512,
              "data-field": "batchSize",
            })
          )
        ),
        Component.h(
          "div",
          { className: "modal-footer" },
          Component.h(
            "button",
            { className: "btn btn-secondary", "data-action": "close-modal" },
            "Cancel"
          ),
          Component.h(
            "button",
            { className: "btn btn-primary", "data-action": "save-defaults" },
            "Save"
          )
        )
      )
    );
  }

  renderGroupModal() {
    const isEditing = !!this.state.editingGroup;
    const group = this.state.currentGroup || {};

    return Component.h(
      "div",
      { className: "modal-overlay", "data-action": "close-modal" },
      Component.h(
        "div",
        { className: "modal-content" },
        Component.h(
          "div",
          { className: "modal-header" },
          Component.h("h2", {}, isEditing ? "Edit Group" : "New Group"),
          Component.h("button", { className: "modal-close", "data-action": "close-modal" }, "×")
        ),
        Component.h(
          "div",
          { className: "modal-body" },
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Group Name"),
            Component.h("input", {
              type: "text",
              className: "form-input",
              value: group.name || "",
              "data-field": "name",
              disabled: isEditing,
            }),
            Component.h("label", {}, "Context Size"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              value: group.ctxSize || "",
              "data-field": "ctxSize",
            }),
            Component.h("label", {}, "Temperature"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              step: "0.1",
              value: group.temperature || "",
              "data-field": "temperature",
            }),
            Component.h("label", {}, "GPU Layers"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              value: group.nGpuLayers || "",
              "data-field": "nGpuLayers",
            }),
            Component.h("label", {}, "Threads"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              value: group.threads || "",
              "data-field": "threads",
            })
          )
        ),
        Component.h(
          "div",
          { className: "modal-footer" },
          Component.h(
            "button",
            { className: "btn btn-secondary", "data-action": "close-modal" },
            "Cancel"
          ),
          Component.h(
            "button",
            { className: "btn btn-primary", "data-action": "save-group" },
            isEditing ? "Update" : "Create"
          )
        )
      )
    );
  }

  renderModelModal() {
    const isEditing = !!this.state.editingModel;
    const model = this.state.currentModel || {};
    const models = this.state.availableModels || [];

    return Component.h(
      "div",
      { className: "modal-overlay", "data-action": "close-modal" },
      Component.h(
        "div",
        { className: "modal-content" },
        Component.h(
          "div",
          { className: "modal-header" },
          Component.h("h2", {}, isEditing ? "Edit Model" : "New Model"),
          Component.h("button", { className: "modal-close", "data-action": "close-modal" }, "×")
        ),
        Component.h(
          "div",
          { className: "modal-body" },
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Model Name"),
            Component.h("input", {
              type: "text",
              className: "form-input",
              value: model.name || "",
              "data-field": "name",
              disabled: isEditing,
            }),
            Component.h("label", {}, "Group"),
            Component.h(
              "select",
              {
                className: "form-input",
                value: model.groupName || "",
                "data-field": "groupName",
                disabled: isEditing,
              },
              Component.h("option", { value: "" }, "-- Select Group --"),
              ...this.state.groups.map((g) =>
                Component.h(
                  "option",
                  { value: g.name, selected: g.name === model.groupName },
                  g.name
                )
              )
            ),
            Component.h("label", {}, "Model File"),
            Component.h(
              "select",
              {
                className: "form-input",
                value: model.model || "",
                "data-field": "model",
              },
              Component.h("option", { value: "" }, "-- Select Model --"),
              ...models.map((m) =>
                Component.h(
                  "option",
                  { value: m.path, selected: m.path === model.model },
                  `${m.name} (${AppUtils.formatBytes(m.size)})`
                )
              )
            ),
            Component.h("label", {}, "Context Size"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              value: model.ctxSize || "",
              "data-field": "ctxSize",
            }),
            Component.h("label", {}, "Temperature"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              step: "0.1",
              value: model.temperature || "",
              "data-field": "temperature",
            }),
            Component.h("label", {}, "GPU Layers"),
            Component.h("input", {
              type: "number",
              className: "form-input",
              value: model.nGpuLayers || "",
              "data-field": "nGpuLayers",
            })
          )
        ),
        Component.h(
          "div",
          { className: "modal-footer" },
          Component.h(
            "button",
            { className: "btn btn-secondary", "data-action": "close-modal" },
            "Cancel"
          ),
          Component.h(
            "button",
            { className: "btn btn-primary", "data-action": "save-model" },
            isEditing ? "Update" : "Create"
          )
        )
      )
    );
  }

  getEventMap() {
    return {
      "click [data-action=select-preset]": "handleSelectPreset",
      "click [data-action=new-preset]": "handleNewPreset",
      "click [data-action=delete-preset]": "handleDeletePreset",
      "click [data-action=edit-defaults]": "handleEditDefaults",
      "click [data-action=new-group]": "handleNewGroup",
      "click [data-action=edit-group]": "handleEditGroup",
      "click [data-action=save-group]": "handleSaveGroup",
      "click [data-action=delete-group]": "handleDeleteGroup",
      "click [data-action=new-model]": "handleNewModel",
      "click [data-action=edit-model]": "handleEditModel",
      "click [data-action=save-model]": "handleSaveModel",
      "click [data-action=delete-model]": "handleDeleteModel",
      "click [data-action=close-modal]": "handleCloseModal",
      "change [data-field]": "handleFieldChange",
      "input [data-field]": "handleFieldChange",
    };
  }

  handleFieldChange(e) {
    const el = e.target.closest("[data-field]");
    if (!el) return;

    const field = el.dataset.field;
    const value = el.type === "checkbox" ? el.checked : el.value;
    const numValue = el.type === "number" ? (value === "" ? null : Number(value)) : value;

    // Update the appropriate state based on which modal is open
    if (this.state.showGlobalModal) {
      this.setState({
        globalDefaults: {
          ...this.state.globalDefaults,
          [field]: numValue !== null ? numValue : value,
        },
      });
    } else if (this.state.showGroupModal) {
      this.setState({
        currentGroup: {
          ...this.state.currentGroup,
          [field]: numValue !== null ? numValue : value,
        },
      });
    } else if (this.state.showModelModal) {
      this.setState({
        currentModel: {
          ...this.state.currentModel,
          [field]: numValue !== null ? numValue : value,
        },
      });
    }
  }

  async handleSelectPreset(e) {
    const el = e.target.closest("[data-action=select-preset]");
    if (!el) return;

    const name = el.dataset.presetName;
    const preset = this.state.presets.find((p) => p.name === name);
    if (!preset) return;

    this.setState({ loading: true });
    try {
      await this.loadPresetData(preset);
    } finally {
      this.setState({ loading: false });
    }
  }

  async loadPresetData(preset) {
    if (!this.presetsService) {
      console.error("[PRESETS] Service not available");
      return;
    }

    try {
      const models = await this.presetsService.getModelsFromPreset(preset.name);
      const defaults = await this.presetsService.getDefaults(preset.name);

      const groups = {};
      const standalone = [];

      for (const [modelName, modelConfig] of Object.entries(models)) {
        if (modelName === "*") continue;

        const parts = modelName.split("/");
        if (parts.length === 2) {
          const groupName = parts[0];
          if (!groups[groupName]) {
            groups[groupName] = { name: groupName, models: [] };
          }
          groups[groupName].models.push({
            name: parts[1],
            ...modelConfig,
          });
        } else {
          standalone.push({
            name: modelName,
            ...modelConfig,
          });
        }
      }

      this.setState({
        selectedPreset: preset,
        globalDefaults: defaults,
        groups: Object.values(groups),
        standaloneModels: standalone,
      });
    } catch (error) {
      console.error("[PRESETS] Error loading preset:", error);
      showNotification(`Error loading preset: ${error.message}`, "error");
    }
  }

  handleNewPreset() {
    const name = prompt("Preset name:");
    if (!name) return;

    this.createPreset(name);
  }

  async createPreset(name) {
    this.setState({ loading: true });
    try {
      await this.presetsService.createPreset(name);
      showNotification(`Preset "${name}" created`, "success");
      await this.controller.loadPresetsData();
    } catch (error) {
      console.error("[PRESETS] Create error:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      this.setState({ loading: false });
    }
  }

  handleDeletePreset(e) {
    const el = e.target.closest("[data-action=delete-preset]");
    if (!el) return;
    const name = el.dataset.presetName;

    if (!confirm(`Delete preset "${name}"?`)) return;
    this.deletePreset(name);
  }

  async deletePreset(name) {
    this.setState({ loading: true });
    try {
      await this.presetsService.deletePreset(name);
      showNotification("Preset deleted", "success");
      this.setState({
        selectedPreset: null,
        groups: [],
        standaloneModels: [],
        globalDefaults: null,
      });
      await this.controller.loadPresetsData();
    } catch (error) {
      console.error("[PRESETS] Delete error:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      this.setState({ loading: false });
    }
  }

  handleEditDefaults() {
    this.setState({ showGlobalModal: true });
  }

  async handleSaveDefaults() {
    try {
      const { globalDefaults, selectedPreset } = this.state;
      await this.presetsService.updateDefaults(selectedPreset.name, globalDefaults);
      showNotification("Global defaults saved", "success");
      await this.loadPresetData(selectedPreset);
    } catch (error) {
      console.error("[PRESETS] Save defaults error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
    this.setState({ showGlobalModal: false });
  }

  handleNewGroup() {
    this.setState({ showGroupModal: true, editingGroup: null, currentGroup: { name: "" } });
  }

  handleEditGroup(e) {
    const el = e.target.closest("[data-action=edit-group]");
    if (!el) return;
    const groupName = el.dataset.groupName;
    const group = this.state.groups.find((g) => g.name === groupName);
    if (!group) return;

    this.setState({
      showGroupModal: true,
      editingGroup: groupName,
      currentGroup: { ...group },
    });
  }

  async handleSaveGroup() {
    try {
      const { currentGroup, editingGroup, selectedPreset } = this.state;
      const groupName = currentGroup.name;

      if (!groupName || groupName.trim() === "") {
        showNotification("Group name is required", "error");
        return;
      }

      const config = {
        ctxSize: currentGroup.ctxSize,
        temperature: currentGroup.temperature,
        nGpuLayers: currentGroup.nGpuLayers,
        threads: currentGroup.threads,
        batchSize: currentGroup.batchSize,
      };

      await this.presetsService.addModel(selectedPreset.name, groupName, config);
      showNotification(`Group "${groupName}" saved`, "success");
      await this.loadPresetData(selectedPreset);
    } catch (error) {
      console.error("[PRESETS] Save group error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
    this.setState({ showGroupModal: false, editingGroup: null, currentGroup: {} });
  }

  async handleDeleteGroup(e) {
    const el = e.target.closest("[data-action=delete-group]");
    if (!el) return;
    const groupName = el.dataset.groupName;

    if (!confirm(`Delete group "${groupName}"?`)) return;

    try {
      await this.presetsService.removeModel(this.state.selectedPreset.name, groupName);
      showNotification(`Group "${groupName}" deleted`, "success");
      await this.loadPresetData(this.state.selectedPreset);
    } catch (error) {
      console.error("[PRESETS] Delete group error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  handleNewModel(e) {
    const el = e.target.closest("[data-action=new-model]");
    const groupName = el?.dataset.groupName || "";

    this.setState({
      showModelModal: true,
      editingModel: null,
      currentModel: { name: "", model: "", groupName },
    });
  }

  handleEditModel(e) {
    const el = e.target.closest("[data-action=edit-model]");
    if (!el) return;
    const groupName = el.dataset.groupName;
    const modelName = el.dataset.modelName;

    let model;
    if (groupName) {
      const group = this.state.groups.find((g) => g.name === groupName);
      model = group?.models?.find((m) => m.name === modelName);
    } else {
      model = this.state.standaloneModels.find((m) => m.name === modelName);
    }

    if (!model) return;

    this.setState({
      showModelModal: true,
      editingModel: modelName,
      currentModel: { ...model, groupName },
    });
  }

  async handleSaveModel() {
    try {
      const { currentModel, editingModel, selectedPreset } = this.state;
      const { name, model: modelPath, groupName } = currentModel;

      if (!name || name.trim() === "") {
        showNotification("Model name is required", "error");
        return;
      }

      if (!modelPath || modelPath.trim() === "") {
        showNotification("Model path is required", "error");
        return;
      }

      const fullName = groupName ? `${groupName}/${name}` : name;
      const config = {
        model: modelPath,
        ctxSize: currentModel.ctxSize,
        temperature: currentModel.temperature,
        nGpuLayers: currentModel.nGpuLayers,
        threads: currentModel.threads,
        batchSize: currentModel.batchSize,
      };

      await this.presetsService.addModel(selectedPreset.name, fullName, config);
      showNotification("Model saved", "success");
      await this.loadPresetData(selectedPreset);
    } catch (error) {
      console.error("[PRESETS] Save model error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
    this.setState({ showModelModal: false, editingModel: null, currentModel: {} });
  }

  async handleDeleteModel(e) {
    const el = e.target.closest("[data-action=delete-model]");
    if (!el) return;
    const groupName = el.dataset.groupName;
    const modelName = el.dataset.modelName;
    const fullName = groupName ? `${groupName}/${modelName}` : modelName;

    if (!confirm(`Delete model "${modelName}"?`)) return;

    try {
      await this.presetsService.removeModel(this.state.selectedPreset.name, fullName);
      showNotification(`Model "${modelName}" deleted`, "success");
      await this.loadPresetData(this.state.selectedPreset);
    } catch (error) {
      console.error("[PRESETS] Delete model error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  handleCloseModal(e) {
    if (e.target.dataset.action === "close-modal") {
      this.setState({
        showGlobalModal: false,
        showGroupModal: false,
        showModelModal: false,
        showInheritanceModal: false,
      });
    }
  }

  async loadAvailableModels() {
    if (!this.presetsService) return;

    try {
      const models = await this.presetsService.getAvailableModels();
      this.setState({ availableModels: models });
    } catch (error) {
      console.error("[PRESETS] Failed to load models:", error.message);
    }
  }

  didMount() {
    this.loadAvailableModels();
  }
}

window.PresetsController = PresetsController;
window.PresetsPage = PresetsPage;
