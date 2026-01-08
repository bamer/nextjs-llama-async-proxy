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
    console.log("[PRESETS] PresetsController initialized");
  }

  _ensureService() {
    if (!this.presetsService && window.socketClient?.socket) {
      this.presetsService = new PresetsService(window.socketClient.socket);
    }
    return this.presetsService;
  }

  init() {
    console.log("[PRESETS] PresetsController.init()");
  }

  willUnmount() {
    console.log("[PRESETS] PresetsController.willUnmount()");
    this.unsubscribers.forEach((unsub) => unsub());
  }

  destroy() {
    this.willUnmount();
    if (this.comp && this.comp.destroy) {
      this.comp.destroy();
    }
  }

  async render() {
    console.log("[PRESETS] PresetsController.render() START");
    const service = this._ensureService();
    if (!service) {
      console.error("[PRESETS] Socket not ready");
      this.comp = new PresetsPage({ presetsService: null, controller: this });
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
    console.log("[PRESETS] PresetsController.render() END");
    return el;
  }

  didMount() {
    console.log("[PRESETS] PresetsController.didMount()");
    if (this.comp && this.comp.didMount) {
      this.comp.didMount();
    }
    if (!this.presetsService) {
      const checkSocket = () => {
        if (window.socketClient?.socket?.connected) {
          console.log("[PRESETS] Socket ready, loading presets");
          this._ensureService();
          this.loadPresetsData();
        } else {
          setTimeout(checkSocket, 100);
        }
      };
      checkSocket();
    } else {
      this.loadPresetsData();
    }
  }

  async loadPresetsData() {
    const service = this._ensureService();
    if (!service) return;

    try {
      const presets = await service.listPresets();
      console.log("[PRESETS] Loaded", presets.length, "presets");
      stateManager.set("presets", presets);
      if (this.comp) {
        this.comp.setState({ presets });
      }
    } catch (error) {
      console.error("[PRESETS] Load error:", error.message);
      showNotification(`Failed to load presets: ${error.message}`, "error");
    }
  }

  async load() {
    console.log("[PRESETS] Loading presets...");
    try {
      const presets = await this.presetsService.listPresets();
      console.log("[PRESETS] Loaded", presets.length, "presets");
      stateManager.set("presets", presets);
    } catch (error) {
      console.error("[PRESETS] Load error:", error.message);
      showNotification(`Failed to load presets: ${error.message}`, "error");
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
      showGlobalModal: false,
      showGroupModal: false,
      showModelModal: false,
      globalDefaults: null,
      groups: [],
      currentGroup: null,
      currentModel: null,
      editingGroup: null,
      editingModel: null,
      loading: false,
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
      Component.h(
        "div",
        { className: "presets-header-content" },
        Component.h("h1", { className: "presets-title" }, "Model Presets"),
        Component.h(
          "p",
          { className: "presets-subtitle" },
          "Configure llama.cpp parameters with global defaults, groups, and per-model settings"
        )
      ),
      Component.h(
        "div",
        { className: "presets-header-actions" },
        Component.h(
          "button",
          {
            className: "btn btn-primary btn-sm",
            "data-action": "new-preset",
          },
          "+ New Preset"
        )
      )
    );
  }

  renderContent() {
    const presets = this.state.presets;

    if (presets.length === 0) {
      return Component.h(
        "div",
        { className: "presets-empty-state" },
        Component.h(
          "div",
          { className: "empty-icon" },
          "⚙"
        ),
        Component.h("h2", {}, "No Presets Yet"),
        Component.h(
          "p",
          {},
          "Create your first preset to get started"
        ),
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
      this.renderPresetSelector(),
      this.state.selectedPreset ? this.renderPresetEditor() : this.renderSelectPrompt()
    );
  }

  renderSelectPrompt() {
    return Component.h(
      "div",
      { className: "presets-prompt" },
      Component.h("div", { className: "prompt-icon" }, "→"),
      Component.h("p", {}, "Select a preset to edit")
    );
  }

  renderPresetSelector() {
    return Component.h(
      "div",
      { className: "presets-sidebar" },
      this.state.presets.map((preset) =>
        Component.h(
          "div",
          {
            className: `preset-card ${this.state.selectedPreset?.name === preset.name ? "active" : ""}`,
            "data-action": "select-preset",
            "data-preset-name": preset.name,
          },
          Component.h(
            "div",
            { className: "preset-card-main" },
            Component.h("span", { className: "preset-name" }, preset.name)
          ),
          Component.h(
            "button",
            {
              className: "preset-delete",
              "data-action": "delete-preset",
              "data-preset-name": preset.name,
              title: "Delete preset",
            },
            "×"
          )
        )
      ),
      Component.h(
        "button",
        {
          className: "preset-add-btn",
          "data-action": "new-preset",
        },
        "+ Add Preset"
      )
    );
  }

  renderPresetEditor() {
    const preset = this.state.selectedPreset;
    const groups = this.state.groups || [];

    return Component.h(
      "div",
      { className: "presets-editor" },
      Component.h(
        "div",
        { className: "editor-section" },
        this.renderGlobalDefaults(),
        this.renderGroupsList(groups)
      )
    );
  }

  renderGlobalDefaults() {
    const defaults = this.state.globalDefaults;

    return Component.h(
      "div",
      { className: "section-card global-section" },
      Component.h(
        "div",
        { className: "section-header" },
        Component.h("div", { className: "section-icon" }, "⭐"),
        Component.h(
          "div",
          { className: "section-title-group" },
          Component.h("h2", { className: "section-title" }, "Global Defaults"),
          Component.h(
            "p",
            { className: "section-desc" },
            "Applied to all groups and models unless overridden"
          )
        ),
        Component.h(
          "button",
          {
            className: "btn btn-outline btn-sm",
            "data-action": "edit-defaults",
          },
          "Edit"
        )
      ),
      defaults
        ? Component.h(
            "div",
            { className: "defaults-summary" },
            this.renderDefaultsSummary(defaults)
          )
        : Component.h(
            "div",
            { className: "empty-summary" },
            "No defaults set"
          )
    );
  }

  renderDefaultsSummary(defaults) {
    const items = [
      { label: "Context Size", value: defaults.ctxSize || "—" },
      { label: "Temperature", value: defaults.temperature || "—" },
      { label: "GPU Layers", value: defaults.nGpuLayers || "—" },
      { label: "Threads", value: defaults.threads || "—" },
      { label: "Batch Size", value: defaults.batchSize || "—" },
    ];

    return items.map((item) =>
      Component.h(
        "div",
        { className: "summary-item" },
        Component.h("span", { className: "label" }, item.label),
        Component.h("span", { className: "value" }, String(item.value))
      )
    );
  }

  renderGroupsList(groups) {
    return Component.h(
      "div",
      { className: "groups-section" },
      Component.h(
        "div",
        { className: "section-card groups-header" },
        Component.h("div", { className: "section-icon" }, "📦"),
        Component.h(
          "div",
          { className: "section-title-group" },
          Component.h("h2", { className: "section-title" }, "Groups"),
          Component.h(
            "p",
            { className: "section-desc" },
            "Organize models into groups with shared settings"
          )
        ),
        Component.h(
          "button",
          {
            className: "btn btn-outline btn-sm",
            "data-action": "new-group",
          },
          "+ Add Group"
        )
      ),
      groups.length === 0
        ? Component.h(
            "div",
            { className: "section-card empty-groups" },
            Component.h("p", {}, "No groups yet. Create one to get started.")
          )
        : groups.map((group) => this.renderGroupCard(group))
    );
  }

  renderGroupCard(group) {
    const models = group.models || [];

    return Component.h(
      "div",
      { className: "section-card group-card" },
      Component.h(
        "div",
        { className: "group-header" },
        Component.h("div", { className: "group-title-area" },
          Component.h("h3", { className: "group-name" }, group.name),
          Component.h(
            "p",
            { className: "group-desc" },
            `${models.length} model${models.length !== 1 ? "s" : ""}`
          )
        ),
        Component.h(
          "div",
          { className: "group-actions" },
          Component.h(
            "button",
            {
              className: "btn btn-outline btn-sm",
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
      models.length > 0
        ? Component.h(
            "div",
            { className: "models-list" },
            Component.h("div", { className: "models-header" }, "Models"),
            models.map((model) => this.renderModelItem(model, group.name))
          )
        : null,
      Component.h(
        "button",
        {
          className: "btn btn-text btn-sm add-model-btn",
          "data-action": "new-model",
          "data-group-name": group.name,
        },
        "+ Add Model"
      )
    );
  }

  renderModelItem(model, groupName) {
    return Component.h(
      "div",
      { className: "model-item" },
      Component.h("div", { className: "model-icon" }, "🤖"),
      Component.h(
        "div",
        { className: "model-info" },
        Component.h("span", { className: "model-name" }, model.name || "Unnamed"),
        Component.h(
          "span",
          { className: "model-path" },
          model.model || "No model set"
        )
      ),
      Component.h(
        "div",
        { className: "model-actions" },
        Component.h(
          "button",
          {
            className: "btn btn-outline btn-sm",
            "data-action": "edit-model",
            "data-group-name": groupName,
            "data-model-name": model.name,
          },
          "Edit"
        ),
        Component.h(
          "button",
          {
            className: "btn btn-danger btn-sm",
            "data-action": "delete-model",
            "data-group-name": groupName,
            "data-model-name": model.name,
          },
          "×"
        )
      )
    );
  }

  renderModals() {
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
          Component.h(
            "button",
            {
              className: "modal-close",
              "data-action": "close-modal",
            },
            "×"
          )
        ),
        Component.h(
          "div",
          { className: "modal-body" },
          this.renderDefaultsForm()
        ),
        Component.h(
          "div",
          { className: "modal-footer" },
          Component.h(
            "button",
            {
              className: "btn btn-outline",
              "data-action": "close-modal",
            },
            "Cancel"
          ),
          Component.h(
            "button",
            {
              className: "btn btn-primary",
              "data-action": "save-defaults",
            },
            "Save"
          )
        )
      )
    );
  }

  renderDefaultsForm() {
    const defaults = this.state.globalDefaults || {};

    return Component.h(
      "div",
      { className: "form-group" },
      this.renderFormField("ctxSize", "Context Size", "number", defaults.ctxSize || 2048),
      this.renderFormField("temperature", "Temperature", "number", defaults.temperature || 0.7, 0.1),
      this.renderFormField("nGpuLayers", "GPU Layers", "number", defaults.nGpuLayers || 0),
      this.renderFormField("threads", "Threads", "number", defaults.threads || 0),
      this.renderFormField("batchSize", "Batch Size", "number", defaults.batchSize || 512)
    );
  }

  renderGroupModal() {
    return Component.h(
      "div",
      { className: "modal-overlay", "data-action": "close-modal" },
      Component.h(
        "div",
        { className: "modal-content" },
        Component.h(
          "div",
          { className: "modal-header" },
          Component.h(
            "h2",
            {},
            this.state.editingGroup ? "Edit Group" : "New Group"
          ),
          Component.h(
            "button",
            {
              className: "modal-close",
              "data-action": "close-modal",
            },
            "×"
          )
        ),
        Component.h(
          "div",
          { className: "modal-body" },
          this.renderGroupForm()
        ),
        Component.h(
          "div",
          { className: "modal-footer" },
          Component.h(
            "button",
            {
              className: "btn btn-outline",
              "data-action": "close-modal",
            },
            "Cancel"
          ),
          Component.h(
            "button",
            {
              className: "btn btn-primary",
              "data-action": "save-group",
            },
            "Save"
          )
        )
      )
    );
  }

  renderGroupForm() {
    const group = this.state.currentGroup || {};

    return Component.h(
      "div",
      { className: "form-group" },
      this.renderFormField("groupName", "Group Name", "text", group.name || ""),
      this.renderFormField("ctxSize", "Context Size", "number", group.ctxSize, 0.1),
      this.renderFormField("temperature", "Temperature", "number", group.temperature, 0.1),
      this.renderFormField("nGpuLayers", "GPU Layers", "number", group.nGpuLayers),
      this.renderFormField("threads", "Threads", "number", group.threads),
      this.renderFormField("batchSize", "Batch Size", "number", group.batchSize)
    );
  }

  renderModelModal() {
    return Component.h(
      "div",
      { className: "modal-overlay", "data-action": "close-modal" },
      Component.h(
        "div",
        { className: "modal-content" },
        Component.h(
          "div",
          { className: "modal-header" },
          Component.h(
            "h2",
            {},
            this.state.editingModel ? "Edit Model" : "New Model"
          ),
          Component.h(
            "button",
            {
              className: "modal-close",
              "data-action": "close-modal",
            },
            "×"
          )
        ),
        Component.h(
          "div",
          { className: "modal-body" },
          this.renderModelForm()
        ),
        Component.h(
          "div",
          { className: "modal-footer" },
          Component.h(
            "button",
            {
              className: "btn btn-outline",
              "data-action": "close-modal",
            },
            "Cancel"
          ),
          Component.h(
            "button",
            {
              className: "btn btn-primary",
              "data-action": "save-model",
            },
            "Save"
          )
        )
      )
    );
  }

  renderModelForm() {
    const model = this.state.currentModel || {};

    return Component.h(
      "div",
      { className: "form-group" },
      this.renderFormField("modelName", "Model Name", "text", model.name || ""),
      this.renderFormField("modelPath", "Model File Path", "text", model.model || ""),
      this.renderFormField("temperature", "Temperature", "number", model.temperature, 0.1),
      this.renderFormField("ctxSize", "Context Size", "number", model.ctxSize),
      this.renderFormField("nGpuLayers", "GPU Layers", "number", model.nGpuLayers),
      this.renderFormField("threads", "Threads", "number", model.threads),
      this.renderFormField("batchSize", "Batch Size", "number", model.batchSize)
    );
  }

  renderFormField(name, label, type, value, step = "1") {
    return Component.h(
      "div",
      { className: "form-field" },
      Component.h("label", { htmlFor: `field-${name}` }, label),
      Component.h("input", {
        id: `field-${name}`,
        type,
        className: "form-input",
        value: String(value || ""),
        step,
        "data-field": name,
        "data-action": "field-change",
      })
    );
  }

  getEventMap() {
    return {
      "click [data-action=select-preset]": "handleSelectPreset",
      "click [data-action=new-preset]": "handleNewPreset",
      "click [data-action=delete-preset]": "handleDeletePreset",
      "click [data-action=edit-defaults]": "handleEditDefaults",
      "click [data-action=save-defaults]": "handleSaveDefaults",
      "click [data-action=new-group]": "handleNewGroup",
      "click [data-action=edit-group]": "handleEditGroup",
      "click [data-action=save-group]": "handleSaveGroup",
      "click [data-action=delete-group]": "handleDeleteGroup",
      "click [data-action=new-model]": "handleNewModel",
      "click [data-action=edit-model]": "handleEditModel",
      "click [data-action=save-model]": "handleSaveModel",
      "click [data-action=delete-model]": "handleDeleteModel",
      "click [data-action=close-modal]": "handleCloseModal",
      "change [data-action=field-change]": "handleFieldChange",
    };
  }

  handleSelectPreset(e) {
    const el = e.target.closest("[data-action=select-preset]");
    if (!el) return;
    const name = el.dataset.presetName;
    const preset = this.state.presets.find((p) => p.name === name);
    if (!preset) return;

    console.log("[PRESETS] Selected preset:", name);
    this.loadPresetData(preset);
  }

  async loadPresetData(preset) {
    try {
      const service = this.presetsService;
      const models = await service.getModelsFromPreset(preset.name);
      const defaults = await service.getDefaults(preset.name);

      const groups = {};
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
        }
      }

      this.setState({
        selectedPreset: preset,
        globalDefaults: defaults,
        groups: Object.values(groups),
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
      showNotification(`Preset deleted`, "success");
      this.setState({ selectedPreset: null, groups: [], globalDefaults: null, loading: false });
      await this.controller.loadPresetsData();
    } catch (error) {
      console.error("[PRESETS] Delete error:", error);
      showNotification(`Error: ${error.message}`, "error");
      this.setState({ loading: false });
    }
  }

  handleEditDefaults() {
    this.setState({ showGlobalModal: true });
  }

  handleSaveDefaults() {
    this.setState({ showGlobalModal: false });
  }

  handleNewGroup() {
    this.setState({ showGroupModal: true, editingGroup: null, currentGroup: {} });
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

  handleSaveGroup() {
    this.setState({ showGroupModal: false });
  }

  handleDeleteGroup(e) {
    const el = e.target.closest("[data-action=delete-group]");
    if (!el) return;
    const groupName = el.dataset.groupName;

    if (!confirm(`Delete group "${groupName}"?`)) return;
  }

  handleNewModel(e) {
    const el = e.target.closest("[data-action=new-model]");
    if (!el) return;
    const groupName = el.dataset.groupName;

    this.setState({
      showModelModal: true,
      editingModel: null,
      currentModel: { groupName },
    });
  }

  handleEditModel(e) {
    const el = e.target.closest("[data-action=edit-model]");
    if (!el) return;
    const groupName = el.dataset.groupName;
    const modelName = el.dataset.modelName;

    const group = this.state.groups.find((g) => g.name === groupName);
    if (!group) return;
    const model = group.models.find((m) => m.name === modelName);
    if (!model) return;

    this.setState({
      showModelModal: true,
      editingModel: modelName,
      currentModel: { ...model, groupName },
    });
  }

  handleSaveModel() {
    this.setState({ showModelModal: false });
  }

  handleDeleteModel(e) {
    const el = e.target.closest("[data-action=delete-model]");
    if (!el) return;
    const groupName = el.dataset.groupName;
    const modelName = el.dataset.modelName;

    if (!confirm(`Delete model "${modelName}"?`)) return;
  }

  handleCloseModal(e) {
    if (e.target.dataset.action === "close-modal") {
      this.setState({
        showGlobalModal: false,
        showGroupModal: false,
        showModelModal: false,
      });
    }
  }

  handleFieldChange(e) {
    const field = e.target.dataset.field;
    const value = e.target.value;

    if (this.state.showGlobalModal) {
      this.setState({
        globalDefaults: {
          ...this.state.globalDefaults,
          [field]: isNaN(value) ? value : parseFloat(value),
        },
      });
    } else if (this.state.showGroupModal) {
      this.setState({
        currentGroup: {
          ...this.state.currentGroup,
          [field]: isNaN(value) ? value : parseFloat(value),
        },
      });
    } else if (this.state.showModelModal) {
      this.setState({
        currentModel: {
          ...this.state.currentModel,
          [field]: isNaN(value) ? value : parseFloat(value),
        },
      });
    }
  }
}

window.PresetsController = PresetsController;
window.PresetsPage = PresetsPage;
