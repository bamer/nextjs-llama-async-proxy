/**
 * Presets Page - INI Configuration Management
 * Manage llama.cpp router mode model presets via WebSocket
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
    console.log("[PRESETS] PresetsController.init() called");
  }

  willUnmount() {
    console.log("[PRESETS] PresetsController.willUnmount() called");
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
      console.error("[PRESETS] Socket not ready, will retry");
      // Return empty element, will retry when socket connects
      const presets = stateManager.get("presets") || [];
      this.comp = new PresetsPage({
        presets,
        presetsService: null,
        controller: this,
      });
      const el = this.comp.render();
      this.comp._el = el;
      el._component = this.comp;
      this.comp.bindEvents();
      console.log("[PRESETS] PresetsController.render() END (socket not ready)");
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
    console.log("[PRESETS] PresetsController.didMount() called");
    if (this.comp && this.comp.didMount) {
      this.comp.didMount();
    }
    // If socket wasn't ready on render, wait for it to connect
    if (!this.presetsService) {
      console.log("[PRESETS] Waiting for socket to connect");
      const checkSocket = () => {
        if (window.socketClient?.socket?.connected) {
          console.log("[PRESETS] Socket now available, loading presets");
          this._ensureService();
          this.loadPresetsData();
        } else {
          setTimeout(checkSocket, 100);
        }
      };
      checkSocket();
    } else {
      // Socket was ready during render
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
      showNotification(`Failed to load presets: ${  error.message}`, "error");
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
      showNotification(`Failed to load presets: ${  error.message}`, "error");
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
      selectedPresetName: null,
      showCreateModal: false,
      showModelModal: false,
      newPresetName: "",
      newModelName: "",
      modelForm: {
        model: "",
        ctxSize: "2048",
        temperature: "0.7",
        nGpuLayers: "0",
        threads: "0",
        batchSize: "512",
      },
      editingModel: null,
      loading: false,
      models: {},
    };
    this.presetsService = props.presetsService;
    this.controller = props.controller;
  }

  render() {
    return Component.h(
      "div",
      { className: "presets-page" },
      this.renderHeader(),
      this.renderContent()
    );
  }

  renderHeader() {
    return Component.h(
      "div",
      { className: "page-header" },
      Component.h("h1", {}, "Model Presets"),
      Component.h(
        "p",
        { className: "subtitle" },
        "Create and manage llama.cpp router mode configuration presets"
      ),
      Component.h(
        "button",
        {
          className: "btn btn-primary",
          "data-action": "new-preset",
        },
        "+ New Preset"
      )
    );
  }

  renderContent() {
    return Component.h(
      "div",
      { className: "presets-content" },
      this.renderPresetsList(),
      this.renderPresetDetail(),
      this.renderModals()
    );
  }

  renderPresetsList() {
    const presets = this.state.presets;

    if (presets.length === 0) {
      return Component.h(
        "div",
        { className: "presets-list" },
        Component.h(
          "div",
          { className: "presets-empty" },
          Component.h("p", {}, "No presets yet. Click '+ New Preset' to create one.")
        )
      );
    }

    return Component.h(
      "div",
      { className: "presets-list" },
      presets.map((preset) =>
        Component.h(
          "div",
          {
            className: `preset-item ${
              this.state.selectedPresetName === preset.name ? "active" : ""
            }`,
            "data-preset-name": preset.name,
            "data-action": "select-preset",
          },
          Component.h("div", { className: "preset-name" }, preset.name),
          Component.h(
            "button",
            {
              className: "btn btn-small btn-danger",
              "data-action": "delete-preset",
              "data-preset-name": preset.name,
            },
            "×"
          )
        )
      )
    );
  }

  renderPresetDetail() {
    const preset = this.state.selectedPreset;

    if (!preset) {
      return Component.h(
        "div",
        { className: "preset-detail empty" },
        Component.h("p", {}, "Select a preset or create a new one")
      );
    }

    const models = this.state.models;
    const modelCount = Object.keys(models).length;

    return Component.h(
      "div",
      { className: "preset-detail" },
      Component.h(
        "div",
        { className: "detail-header" },
        Component.h("h2", {}, preset.name),
        Component.h("p", { className: "model-count" }, `${modelCount} model(s)`)
      ),
      Component.h(
        "button",
        {
          className: "btn btn-success",
          "data-action": "add-model",
        },
        "+ Add Model"
      ),
      this.renderModelsList(models),
      this.renderPresetActions(preset)
    );
  }

  renderModelsList(models) {
    const modelEntries = Object.entries(models);

    if (modelEntries.length === 0) {
      return Component.h(
        "div",
        { className: "models-empty" },
        Component.h("p", {}, "No models in this preset")
      );
    }

    return Component.h(
      "div",
      { className: "models-table" },
      Component.h(
        "table",
        {},
        Component.h(
          "thead",
          {},
          Component.h(
            "tr",
            {},
            Component.h("th", {}, "Model Name"),
            Component.h("th", {}, "Path"),
            Component.h("th", {}, "Context Size"),
            Component.h("th", {}, "GPU Layers"),
            Component.h("th", {}, "Actions")
          )
        ),
        Component.h(
          "tbody",
          {},
          modelEntries.map(([name, config]) =>
            Component.h(
              "tr",
              {},
              Component.h("td", {}, name),
              Component.h("td", { className: "path" }, config.model || ""),
              Component.h("td", {}, config.ctxSize || ""),
              Component.h("td", {}, config.nGpuLayers || ""),
              Component.h(
                "td",
                { className: "actions" },
                Component.h(
                  "button",
                  {
                    className: "btn btn-small btn-info",
                    "data-action": "edit-model",
                    "data-model-name": name,
                  },
                  "Edit"
                ),
                Component.h(
                  "button",
                  {
                    className: "btn btn-small btn-danger",
                    "data-action": "delete-model",
                    "data-model-name": name,
                  },
                  "Delete"
                )
              )
            )
          )
        )
      )
    );
  }

  renderPresetActions(preset) {
    return Component.h(
      "div",
      { className: "preset-actions" },
      Component.h(
        "button",
        {
          className: "btn btn-secondary",
          "data-action": "download-preset",
          "data-preset-name": preset.name,
        },
        "⬇ Download"
      ),
      Component.h(
        "button",
        {
          className: "btn btn-secondary",
          "data-action": "copy-command",
          "data-preset-name": preset.name,
        },
        "📋 Copy Command"
      )
    );
  }

  renderModals() {
    return Component.h(
      "div",
      {},
      this.state.showCreateModal ? this.renderCreateModal() : null,
      this.state.showModelModal ? this.renderModelModal() : null
    );
  }

  renderCreateModal() {
    return Component.h(
      "div",
      { className: "modal-overlay", "data-action": "close-modal" },
      Component.h(
        "div",
        { className: "modal", onClick: (e) => e.stopPropagation() },
        Component.h(
          "div",
          { className: "modal-header" },
          Component.h("h2", {}, "Create New Preset")
        ),
        Component.h(
          "div",
          { className: "modal-body" },
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Preset Name:"),
            Component.h("input", {
              type: "text",
              placeholder: "e.g., gpu-heavy",
              value: this.state.newPresetName,
              "data-field": "presetName",
            })
          )
        ),
        Component.h(
          "div",
          { className: "modal-footer" },
          Component.h(
            "button",
            {
              className: "btn btn-secondary",
              "data-action": "cancel-create",
            },
            "Cancel"
          ),
          Component.h(
            "button",
            {
              className: "btn btn-primary",
              "data-action": "create-preset",
            },
            "Create"
          )
        )
      )
    );
  }

  renderModelModal() {
    const isEditing = !!this.state.editingModel;

    return Component.h(
      "div",
      { className: "modal-overlay", "data-action": "close-modal" },
      Component.h(
        "div",
        { className: "modal", onClick: (e) => e.stopPropagation() },
        Component.h(
          "div",
          { className: "modal-header" },
          Component.h("h2", {}, isEditing ? "Edit Model" : "Add Model to Preset")
        ),
        Component.h(
          "div",
          { className: "modal-body" },
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Model Name:"),
            Component.h("input", {
              type: "text",
              disabled: isEditing,
              placeholder: "e.g., gemma-4b",
              value: this.state.newModelName,
              "data-field": "modelName",
            })
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Model Path:"),
            Component.h("input", {
              type: "text",
              placeholder: "./models/model.gguf",
              value: this.state.modelForm.model,
              "data-field": "model",
            })
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Context Size:"),
            Component.h("input", {
              type: "number",
              value: this.state.modelForm.ctxSize,
              "data-field": "ctxSize",
            })
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Temperature:"),
            Component.h("input", {
              type: "number",
              step: "0.1",
              min: "0",
              max: "2",
              value: this.state.modelForm.temperature,
              "data-field": "temperature",
            })
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "GPU Layers:"),
            Component.h("input", {
              type: "number",
              value: this.state.modelForm.nGpuLayers,
              "data-field": "nGpuLayers",
            })
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Threads:"),
            Component.h("input", {
              type: "number",
              value: this.state.modelForm.threads,
              "data-field": "threads",
            })
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Batch Size:"),
            Component.h("input", {
              type: "number",
              value: this.state.modelForm.batchSize,
              "data-field": "batchSize",
            })
          )
        ),
        Component.h(
          "div",
          { className: "modal-footer" },
          Component.h(
            "button",
            {
              className: "btn btn-secondary",
              "data-action": "cancel-model",
            },
            "Cancel"
          ),
          Component.h(
            "button",
            {
              className: "btn btn-primary",
              "data-action": isEditing ? "update-model" : "add-model",
            },
            isEditing ? "Update" : "Add"
          )
        )
      )
    );
  }

  getEventMap() {
    return {
      "click [data-action=new-preset]": "handleNewPreset",
      "click [data-action=select-preset]": "handleSelectPreset",
      "click [data-action=delete-preset]": "handleDeletePreset",
      "click [data-action=add-model]": "handleShowAddModel",
      "click [data-action=edit-model]": "handleEditModel",
      "click [data-action=delete-model]": "handleDeleteModel",
      "click [data-action=download-preset]": "handleDownloadPreset",
      "click [data-action=copy-command]": "handleCopyCommand",
      "click [data-action=close-modal]": "handleCloseModal",
      "click [data-action=cancel-create]": "handleCloseModal",
      "click [data-action=cancel-model]": "handleCloseModal",
      "click [data-action=create-preset]": "handleCreatePreset",
      "click [data-action=update-model]": "handleUpdateModel",
      "change input[data-field]": "handleFieldChange",
    };
  }

  handleNewPreset(e) {
    console.log("[PRESETS] New preset clicked");
    this.setState({ showCreateModal: true, newPresetName: "" });
  }

  handleSelectPreset(e) {
    const el = e.target.closest("[data-action=select-preset]");
    if (!el) return;
    const name = el.dataset.presetName;
    console.log("[PRESETS] Selected preset:", name);
    this.selectPreset(name);
  }

  async selectPreset(name) {
    const preset = this.state.presets.find((p) => p.name === name);
    if (!preset) return;

    this.setState({
      selectedPreset: preset,
      selectedPresetName: name,
      models: {},
      loading: true,
    });

    try {
      const models = await this.presetsService.getModelsFromPreset(name);
      console.log("[PRESETS] Loaded models:", Object.keys(models).length);
      this.setState({ models, loading: false });
    } catch (error) {
      console.error("[PRESETS] Error loading models:", error.message);
      showNotification(`Error: ${  error.message}`, "error");
      this.setState({ loading: false });
    }
  }

  handleDeletePreset(e) {
    const el = e.target.closest("[data-action=delete-preset]");
    if (!el) return;
    const name = el.dataset.presetName;
    e.stopPropagation();

    if (!confirm(`Delete preset "${name}"?`)) return;

    this.deletePreset(name);
  }

  async deletePreset(name) {
    this.setState({ loading: true });
    try {
      await this.presetsService.deletePreset(name);
      showNotification(`Preset "${name}" deleted`, "success");
      await this.controller.load();
      const presets = stateManager.get("presets") || [];
      this.setState({
        presets,
        selectedPreset: null,
        selectedPresetName: null,
        models: {},
        loading: false,
      });
    } catch (error) {
      console.error("[PRESETS] Delete error:", error.message);
      showNotification(`Error: ${  error.message}`, "error");
      this.setState({ loading: false });
    }
  }

  handleCreatePreset(e) {
    this.createPreset();
  }

  handleAddModelForm(e) {
    const el = e.target.closest("[data-action=add-model-form]");
    if (!el || this.state.editingModel) return;
    this.addModel();
  }

  async createPreset() {
    const name = this.state.newPresetName.trim();
    if (!name) {
      showNotification("Please enter a preset name", "error");
      return;
    }

    this.setState({ loading: true });
    try {
      await this.presetsService.createPreset(name);
      showNotification(`Preset "${name}" created`, "success");
      await this.controller.load();
      const presets = stateManager.get("presets") || [];
      this.setState({
        presets,
        showCreateModal: false,
        newPresetName: "",
        loading: false,
      });
    } catch (error) {
      console.error("[PRESETS] Create error:", error.message);
      showNotification(`Error: ${  error.message}`, "error");
      this.setState({ loading: false });
    }
  }

  handleShowAddModel(e) {
    if (!this.state.selectedPreset) {
      showNotification("Please select a preset first", "error");
      return;
    }
    this.setState({
      showModelModal: true,
      editingModel: null,
      newModelName: "",
      modelForm: {
        model: "",
        ctxSize: "2048",
        temperature: "0.7",
        nGpuLayers: "0",
        threads: "0",
        batchSize: "512",
      },
    });
  }

  handleUpdateModel(e) {
    const el = e.target.closest("[data-action=update-model]");
    if (!el) return;
    this.updateModel();
  }

  async addModel() {
    const presetName = this.state.selectedPresetName;
    const modelName = this.state.newModelName.trim();

    if (!presetName || !modelName) {
      showNotification("Model name required", "error");
      return;
    }
    if (!this.state.modelForm.model) {
      showNotification("Model path required", "error");
      return;
    }

    this.setState({ loading: true });
    try {
      const config = {
        model: this.state.modelForm.model,
        ctxSize: parseInt(this.state.modelForm.ctxSize),
        temperature: parseFloat(this.state.modelForm.temperature),
        nGpuLayers: parseInt(this.state.modelForm.nGpuLayers),
        threads: parseInt(this.state.modelForm.threads),
        batchSize: parseInt(this.state.modelForm.batchSize),
      };
      await this.presetsService.addModel(presetName, modelName, config);
      showNotification(`Model "${modelName}" added`, "success");
      await this.selectPreset(presetName);
      this.resetModelForm();
    } catch (error) {
      console.error("[PRESETS] Add model error:", error.message);
      showNotification(`Error: ${  error.message}`, "error");
      this.setState({ loading: false });
    }
  }

  handleEditModel(e) {
    const el = e.target.closest("[data-action=edit-model]");
    if (!el) return;
    const modelName = el.dataset.modelName;
    const model = this.state.models[modelName];

    if (!model) return;

    this.setState({
      showModelModal: true,
      editingModel: modelName,
      newModelName: modelName,
      modelForm: {
        model: model.model || "",
        ctxSize: String(model.ctxSize || 2048),
        temperature: String(model.temperature || 0.7),
        nGpuLayers: String(model.nGpuLayers || 0),
        threads: String(model.threads || 0),
        batchSize: String(model.batchSize || 512),
      },
    });
  }

  async updateModel() {
    const presetName = this.state.selectedPresetName;
    const modelName = this.state.editingModel;

    if (!presetName || !modelName) {
      showNotification("Preset and model required", "error");
      return;
    }

    this.setState({ loading: true });
    try {
      const config = {
        model: this.state.modelForm.model,
        ctxSize: parseInt(this.state.modelForm.ctxSize),
        temperature: parseFloat(this.state.modelForm.temperature),
        nGpuLayers: parseInt(this.state.modelForm.nGpuLayers),
        threads: parseInt(this.state.modelForm.threads),
        batchSize: parseInt(this.state.modelForm.batchSize),
      };
      await this.presetsService.updateModel(presetName, modelName, config);
      showNotification(`Model "${modelName}" updated`, "success");
      await this.selectPreset(presetName);
      this.resetModelForm();
    } catch (error) {
      console.error("[PRESETS] Update error:", error.message);
      showNotification(`Error: ${  error.message}`, "error");
      this.setState({ loading: false });
    }
  }

  handleDeleteModel(e) {
    const el = e.target.closest("[data-action=delete-model]");
    if (!el) return;
    const modelName = el.dataset.modelName;

    if (!confirm(`Delete model "${modelName}"?`)) return;

    this.deleteModel(modelName);
  }

  async deleteModel(modelName) {
    const presetName = this.state.selectedPresetName;
    this.setState({ loading: true });

    try {
      await this.presetsService.removeModel(presetName, modelName);
      showNotification(`Model "${modelName}" deleted`, "success");
      await this.selectPreset(presetName);
    } catch (error) {
      console.error("[PRESETS] Delete model error:", error.message);
      showNotification(`Error: ${  error.message}`, "error");
      this.setState({ loading: false });
    }
  }

  handleDownloadPreset(e) {
    const el = e.target.closest("[data-action=download-preset]");
    if (!el) return;
    const name = el.dataset.presetName;
    this.downloadPreset(name);
  }

  async downloadPreset(name) {
    try {
      const preset = await this.presetsService.readPreset(name);
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        `data:text/plain;charset=utf-8,${  encodeURIComponent(preset.content)}`
      );
      element.setAttribute("download", `${name}.ini`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showNotification("Preset downloaded", "success");
    } catch (error) {
      showNotification(`Error: ${  error.message}`, "error");
    }
  }

  handleCopyCommand(e) {
    const el = e.target.closest("[data-action=copy-command]");
    if (!el) return;
    const name = el.dataset.presetName;
    const command = `llama-server --models-preset ./config/${name}.ini --models-max 4`;
    navigator.clipboard.writeText(command);
    showNotification("Command copied to clipboard", "success");
  }

  handleCloseModal(e) {
    if (e.target.dataset.action === "close-modal") {
      this.setState({
        showCreateModal: false,
        showModelModal: false,
      });
    }
  }

  handlePresetNameChange(e) {
    this.setState({ newPresetName: e.target.value });
  }

  handleFieldChange(e) {
    const field = e.target.dataset.field;
    if (field === "presetName") {
      this.setState({ newPresetName: e.target.value });
    } else if (field === "modelName") {
      this.setState({ newModelName: e.target.value });
    } else {
      this.setState({
        modelForm: {
          ...this.state.modelForm,
          [field]: e.target.value,
        },
      });
    }
  }

  resetModelForm() {
    this.setState({
      showModelModal: false,
      editingModel: null,
      newModelName: "",
      modelForm: {
        model: "",
        ctxSize: "2048",
        temperature: "0.7",
        nGpuLayers: "0",
        threads: "0",
        batchSize: "512",
      },
    });
  }
}

window.PresetsController = PresetsController;
window.PresetsPage = PresetsPage;
