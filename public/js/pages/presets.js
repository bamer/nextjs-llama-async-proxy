/**
 * Presets Page - Hierarchical Collapsible Parameter Management
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
    this.comp = null;
  }

  async render() {
    this._ensureService();
    const presets = stateManager.get("presets") || [];
    this.comp = new PresetsPage({
      presets,
      presetsService: this.presetsService,
      controller: this,
    });
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    this.comp.didMount();
    return el;
  }

  didMount() {
    this.loadPresetsData();
  }

  async loadPresetsData() {
    const service = this._ensureService();
    if (!service) {
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
      console.log("[PRESETS] Loaded", presets.length, "presets");
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
}

// Parameter definitions - iniKey is the key sent to backend, key is what's displayed
const PRESET_PARAMS = [
  {
    key: "ctx-size",
    iniKey: "ctxSize",
    label: "Context Size",
    type: "number",
    default: 2048,
    group: "core",
  },
  {
    key: "batch",
    iniKey: "batchSize",
    label: "Batch Size",
    type: "number",
    default: 512,
    group: "core",
  },
  {
    key: "ubatch",
    iniKey: "ubatchSize",
    label: "Micro Batch",
    type: "number",
    default: 512,
    group: "core",
  },
  {
    key: "temp",
    iniKey: "temperature",
    label: "Temperature",
    type: "number",
    step: "0.01",
    default: 0.7,
    group: "sampling",
  },
  {
    key: "n-gpu-layers",
    iniKey: "nGpuLayers",
    label: "GPU Layers",
    type: "number",
    default: 0,
    group: "hardware",
  },
  {
    key: "threads",
    iniKey: "threads",
    label: "Threads",
    type: "number",
    default: 0,
    group: "hardware",
  },
];

class PresetsPage extends Component {
  constructor(props) {
    super(props);
    this._knownGroups = props.knownGroups || new Set();
    this._presetsService = props.presetsService || null;
    this.state = {
      presets: props.presets || [],
      selectedPreset: null,
      globalDefaults: {},
      groups: [],
      standaloneModels: [],
      availableModels: [],
      loading: props.loading !== undefined ? props.loading : true,
      // Expanded state
      expandedDefaults: true,
      expandedGroups: {},
      expandedModels: {},
      // Editing state
      editingDefaults: false,
      editingGroup: null,
      editingModel: null,
      editingData: null,
      // Search/filter state
      parameterFilter: "",
      // Copy feedback
      copiedParam: null,
    };
    this.controller = props.controller;
    this._isUnmounting = false;
  }

  // Get service - use controller's service if available
  _getService() {
    return this._presetsService || (this.controller ? this.controller.presetsService : null);
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
      { className: "presets-header" },
      Component.h("h1", {}, "Model Presets"),
      Component.h(
        "p",
        { className: "presets-subtitle" },
        "Configure llama.cpp parameters - Global Defaults → Groups → Models"
      )
    );
  }

  renderContent() {
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
          Component.h("span", { className: "preset-name" }, preset.name),
          preset.name !== "default"
            ? Component.h(
              "span",
              {
                className: "preset-delete",
                "data-action": "delete-preset",
                "data-preset-name": preset.name,
              },
              "×"
            )
            : null
        )
      ),
      Component.h(
        "button",
        { className: "btn btn-secondary add-preset-btn", "data-action": "new-preset" },
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
          "span",
          { className: "preset-type-badge" },
          this.state.selectedPreset.name === "default" ? "Built-in" : "Custom"
        )
      ),
      this.renderDefaultsSection(),
      this.renderGroupsSection(),
      this.renderStandaloneSection()
    );
  }

  renderDefaultsSection() {
    const defaults = this.state.globalDefaults || {};
    const isExpanded = this.state.expandedDefaults;
    const isEditing = this.state.editingDefaults;
    const editingData = isEditing && this.state.editingData ? this.state.editingData : defaults;

    return Component.h(
      "div",
      { className: "collapsible-section defaults-section" },
      Component.h(
        "div",
        {
          className: `section-header ${isExpanded ? "expanded" : ""}`,
          "data-action": "toggle-defaults",
        },
        Component.h("span", { className: "section-icon" }, "★"),
        Component.h("span", { className: "section-title" }, "Global Defaults"),
        Component.h("span", { className: "section-toggle" }, isExpanded ? "▼" : "▶")
      ),
      isExpanded
        ? Component.h(
          "div",
          { className: "section-content" },
          this.renderParameterSearch(),
          isEditing
            ? this.renderEditableParams(editingData, "defaults", null)
            : this.renderReadOnlyParams(defaults, "defaults", null)
        )
        : null
    );
  }

  renderParameterSearch() {
    return Component.h(
      "div",
      { className: "params-search-wrapper" },
      Component.h("span", { className: "params-search-icon" }, "🔍"),
      Component.h("input", {
        type: "text",
        className: "params-search-input",
        placeholder: "Filter parameters by name...",
        value: this.state.parameterFilter,
        "data-action": "search-params",
      }),
      this.state.parameterFilter
        ? Component.h(
          "button",
          {
            className: "params-search-clear",
            "data-action": "clear-search",
            title: "Clear search",
          },
          "×"
        )
        : null
    );
  }

  renderGroupsSection() {
    const groups = this.state.groups;

    return Component.h(
      "div",
      { className: "collapsible-section groups-section" },
      Component.h("h3", { className: "section-label" }, "Groups"),
      groups.length === 0
        ? Component.h(
          "div",
          { className: "section-empty" },
          Component.h("p", {}, "No groups defined"),
          Component.h(
            "button",
            { className: "btn btn-secondary btn-sm", "data-action": "new-group" },
            "+ Add Group"
          )
        )
        : Component.h(
          "div",
          { className: "groups-list" },
          groups.map((group) => this.renderGroupSection(group))
        ),
      Component.h(
        "button",
        { className: "btn btn-secondary btn-sm add-group-btn", "data-action": "new-group" },
        "+ Add Group"
      )
    );
  }

  renderGroupSection(group) {
    const isExpanded = this.state.expandedGroups[group.name] || false;
    const isEditing = this.state.editingGroup === group.name;
    const editingData = isEditing && this.state.editingData ? this.state.editingData : group;

    return Component.h(
      "div",
      { className: `group-section ${isExpanded ? "expanded" : ""}` },
      Component.h(
        "div",
        {
          className: `section-header group-header ${isExpanded ? "expanded" : ""}`,
          "data-action": "toggle-group",
          "data-group-name": group.name,
        },
        Component.h("span", { className: "section-icon" }, "📁"),
        Component.h("span", { className: "section-title" }, group.name),
        Component.h(
          "span",
          { className: "model-count-badge" },
          `${group.models?.length || 0} model${group.models?.length !== 1 ? "s" : ""}`
        ),
        Component.h("span", { className: "section-toggle" }, isExpanded ? "▼" : "▶"),
        Component.h(
          "span",
          { className: "section-actions" },
          Component.h(
            "button",
            {
              className: "action-btn danger",
              "data-action": "delete-group",
              "data-group-name": group.name,
            },
            "Delete"
          )
        )
      ),
      isExpanded
        ? Component.h(
          "div",
          { className: "section-content" },
          // Models list section
          Component.h(
            "div",
            { className: "group-models-section" },
            Component.h("h4", { className: "subsection-title" }, "Applies to"),
            group.models && group.models.length > 0
              ? Component.h(
                "div",
                { className: "models-list-compact" },
                group.models.map((model) =>
                  Component.h(
                    "div",
                    { className: "model-list-item" },
                    Component.h("span", { className: "model-name" }, model.name),
                    Component.h(
                      "button",
                      {
                        className: "btn-remove-model",
                        "data-action": "delete-model",
                        "data-model-name": model.name,
                        "data-group-name": group.name,
                      },
                      "×"
                    )
                  )
                )
              )
              : Component.h("div", { className: "empty-list" }, "No models in this group yet"),
            Component.h(
              "button",
              {
                className: "btn btn-secondary btn-sm add-model-inline-btn",
                "data-action": "new-model",
                "data-group-name": group.name,
              },
              "+ Add Model"
            )
          ),
          // Group parameters section
          Component.h(
            "div",
            { className: "group-params-section" },
            Component.h("h4", { className: "subsection-title" }, "Group Parameters"),
            isEditing
              ? this.renderEditableParams(editingData, "group", group.name)
              : this.renderReadOnlyParams(editingData, "group", group.name)
          )
        )
        : null
    );
  }

  renderModelSection(model, groupName = null) {
    const fullName = groupName ? `${groupName}/${model.name}` : model.name;
    const isExpanded = this.state.expandedModels[fullName] || false;
    // Only standalone models (groupName = null) can be edited
    const isEditing = groupName === null && this.state.editingModel === fullName;
    const editingData = isEditing && this.state.editingData ? this.state.editingData : model;

    return Component.h(
      "div",
      { className: `model-section ${isExpanded ? "expanded" : ""}` },
      Component.h(
        "div",
        {
          className: `section-header model-header ${isExpanded ? "expanded" : ""}`,
          "data-action": "toggle-model",
          "data-model-name": model.name,
          "data-group-name": groupName || "",
        },
        Component.h("span", { className: "section-icon" }, "📄"),
        Component.h(
          "div",
          { className: "model-title-delete-wrapper" },
          Component.h("span", { className: "section-title" }, model.name),
          Component.h(
            "button",
            {
              type: "button",
              className: "delete-model-btn",
              "data-action": "delete-model",
              "data-model-name": model.name,
              "data-group-name": groupName || "",
              title: "Delete model",
            },
            "×"
          )
        ),
        Component.h("span", { className: "model-path-badge" }, model.model || "No model"),
        Component.h("span", { className: "section-toggle" }, isExpanded ? "▼" : "▶")
      ),
      isExpanded
        ? Component.h(
          "div",
          { className: "section-content" },
          isEditing
            ? this.renderEditableParams(editingData, "model", fullName)
            : this.renderReadOnlyParams(editingData, "model", fullName)
        )
        : null
    );
  }

  renderStandaloneSection() {
    const models = this.state.standaloneModels;

    return Component.h(
      "div",
      { className: "collapsible-section standalone-section" },
      Component.h("h3", { className: "section-label" }, "Standalone Models"),
      Component.h(
        "button",
        {
          className: "btn btn-secondary btn-sm",
          "data-action": "new-model",
          "data-group-name": "",
        },
        "+ Add Standalone Model"
      ),
      models.length > 0
        ? Component.h(
          "div",
          { className: "standalone-list" },
          models.map((model) => this.renderModelSection(model, null))
        )
        : Component.h("div", { className: "empty-list" }, "No standalone models yet")
    );
  }

  renderReadOnlyParams(data, sectionType, sectionName = null) {
    const filter = this.state.parameterFilter.toLowerCase();
    const filteredParams = PRESET_PARAMS.filter(
      (param) =>
        param.label.toLowerCase().includes(filter) || param.key.toLowerCase().includes(filter)
    );

    return Component.h(
      "div",
      { className: "params-list" },
      filteredParams.map((param) => {
        // data uses iniKey (camelCase) from backend
        const value = data[param.iniKey];
        const hasValue = value !== undefined && value !== null;
        const displayValue = hasValue ? value : param.default;
        const paramId = `${sectionType}-${sectionName || "root"}-${param.key}`;

        return Component.h(
          "div",
          { className: `param-item param-${param.group}`, "data-param-key": param.key },
          Component.h("label", { className: "param-label" }, param.label),
          Component.h(
            "div",
            { className: "param-value-wrapper" },
            Component.h(
              "span",
              {
                className: `param-value ${!hasValue ? "param-inherited" : ""}`,
                "data-action": "start-edit",
                "data-section": sectionType,
                "data-name": sectionName,
                "data-param": param.key,
              },
              displayValue !== undefined ? String(displayValue) : "-"
            ),
            Component.h(
              "button",
              {
                className: `copy-btn ${this.state.copiedParam === paramId ? "copied" : ""}`,
                "data-action": "copy-value",
                "data-param-id": paramId,
                "data-value": displayValue !== undefined ? String(displayValue) : "",
                title: "Copy value",
              },
              this.state.copiedParam === paramId ? "✓" : "Copy"
            )
          )
        );
      })
    );
  }

  renderEditableParams(data, sectionType, sectionName = null) {
    return Component.h(
      "div",
      { className: "params-list" },
      PRESET_PARAMS.map((param) => {
        // data uses iniKey (camelCase) from backend
        const value = data[param.iniKey];
        const displayValue = value !== undefined && value !== null ? value : param.default;

        return Component.h(
          "div",
          { className: `param-item param-${param.group}`, "data-param-key": param.key },
          Component.h("label", { className: "param-label" }, param.label),
          Component.h("input", {
            type: param.type,
            className: "param-input",
            step: param.step || "1",
            value: displayValue !== undefined ? displayValue : "",
            "data-section": sectionType,
            "data-name": sectionName,
            "data-param": param.key,
            placeholder: String(param.default),
          })
        );
      }),
      Component.h(
        "div",
        { className: "param-actions" },
        Component.h(
          "button",
          { className: "btn btn-primary btn-sm", "data-action": "save-edit" },
          "Save"
        ),
        Component.h(
          "button",
          { className: "btn btn-secondary btn-sm", "data-action": "cancel-edit" },
          "Cancel"
        )
      )
    );
  }

  getEventMap() {
    return {
      "click [data-action=select-preset]": "handleSelectPreset",
      "click [data-action=new-preset]": "handleNewPreset",
      "click [data-action=delete-preset]": "handleDeletePreset",
      "click [data-action=toggle-defaults]": "handleToggleDefaults",
      "click [data-action=toggle-group]": "handleToggleGroup",
      "click [data-action=toggle-model]": "handleToggleModel",
      "click [data-action=new-group]": "handleNewGroup",
      "click [data-action=save-group]": "handleSaveGroup",
      "click [data-action=delete-group]": "handleDeleteGroup",
      "click [data-action=new-model]": "handleNewModel",
      "click [data-action=save-model]": "handleSaveModel",
      "click [data-action=delete-model]": "handleDeleteModel",
      "click [data-action=start-edit]": "handleStartEdit",
      "click [data-action=save-edit]": "handleSaveEdit",
      "click [data-action=cancel-edit]": "handleCancelEdit",
      "change [data-action=new-model-select]": "handleModelSelectChange",
      "input [data-action=search-params]": "handleSearchParams",
      "click [data-action=clear-search]": "handleClearSearch",
      "click [data-action=copy-value]": "handleCopyValue",
    };
  }

  handleToggleDefaults() {
    if (this.state.editingDefaults) {
      this.setState({ editingDefaults: false, editingData: null });
    }
    this.setState({ expandedDefaults: !this.state.expandedDefaults });
  }

  handleToggleGroup(e) {
    // Don't toggle if delete button was clicked
    if (e.target.closest("[data-action=delete-group]")) {
      return;
    }

    const el = e.target.closest("[data-action=toggle-group]");
    if (!el) return;
    const groupName = el.dataset.groupName;

    if (this.state.editingGroup === groupName) {
      this.setState({ editingGroup: null, editingData: null });
    }
    this.setState({
      expandedGroups: {
        ...this.state.expandedGroups,
        [groupName]: !this.state.expandedGroups[groupName],
      },
    });
  }

  handleToggleModel(e) {
    // Don't toggle if delete button was clicked
    if (e.target.closest("[data-action=delete-model]")) {
      return;
    }

    const el = e.target.closest("[data-action=toggle-model]");
    if (!el) return;
    const modelName = el.dataset.modelName;
    const groupName = el.dataset.groupName || "";
    const fullName = groupName ? `${groupName}/${modelName}` : modelName;

    if (this.state.editingModel === fullName) {
      this.setState({ editingModel: null, editingData: null });
    }
    this.setState({
      expandedModels: {
        ...this.state.expandedModels,
        [fullName]: !this.state.expandedModels[fullName],
      },
    });
  }

  handleStartEdit(e) {
    const el = e.target.closest("[data-action=start-edit]");
    if (!el) return;

    const section = el.dataset.section;
    const name = el.dataset.name;
    const param = el.dataset.param;

    // Prevent editing models in groups - they're read-only
    if (section === "model" && name?.includes("/")) {
      showNotification(
        "Models in groups inherit group parameters. Edit the group or move the model to standalone.",
        "info"
      );
      return;
    }

    let data;
    if (section === "defaults") {
      data = { ...this.state.globalDefaults };
    } else if (section === "group") {
      const group = this.state.groups.find((g) => g.name === name);
      data = group ? { ...group } : {};
    } else if (section === "model") {
      const model = this.getModelByFullName(name);
      data = model ? { ...model } : {};
    }

    this.setState({
      editingDefaults: section === "defaults",
      editingGroup: section === "group" ? name : null,
      editingModel: section === "model" ? name : null,
      editingData: data,
    });
  }

  handleSaveEdit() {
    const { editingDefaults, editingGroup, editingModel, selectedPreset } = this.state;
    if (!selectedPreset) return;

    // Read values from input elements instead of editingData
    const config = {};
    const inputs = this._el?.querySelectorAll(".param-input") || [];

    for (const input of inputs) {
      const paramKey = input.dataset.param;
      const param = PRESET_PARAMS.find((p) => p.key === paramKey);
      if (!param) continue;

      const value = input.value?.trim();
      if (value !== undefined && value !== "" && value !== null) {
        // Convert to appropriate type
        if (param.type === "number") {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            config[param.iniKey] = numValue;
          }
        } else {
          config[param.iniKey] = value;
        }
      }
    }

    let modelName;
    if (editingDefaults) {
      modelName = "*";
    } else if (editingGroup) {
      modelName = editingGroup;
    } else if (editingModel) {
      modelName = editingModel;
    }

    if (!modelName) return;

    this._getService()
      .addModel(selectedPreset.name, modelName, config)
      .then(() => {
        showNotification("Saved successfully", "success");
        this.loadPresetData(selectedPreset);
        this.setState({
          editingDefaults: false,
          editingGroup: null,
          editingModel: null,
          editingData: null,
        });
      })
      .catch((error) => {
        console.error("[PRESETS] Save error:", error);
        showNotification(`Error: ${error.message}`, "error");
      });
  }

  handleCancelEdit() {
    this.setState({
      editingDefaults: false,
      editingGroup: null,
      editingModel: null,
      editingData: null,
    });
  }

  getModelByFullName(fullName) {
    for (const group of this.state.groups) {
      const model = group.models?.find((m) => `${group.name}/${m.name}` === fullName);
      if (model) return { ...model, groupName: group.name };
    }
    return this.state.standaloneModels.find((m) => m.name === fullName);
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
    const service = this._getService();
    if (!service) return;

    try {
      const [models, defaults] = await Promise.all([
        service.getModelsFromPreset(preset.name),
        service.getDefaults(preset.name),
      ]);

      const groups = {};
      const standalone = [];

      // Collect all group names:
      // 1. Entries with "/" in the name: split and take the first part (group/model)
      // 2. Entries explicitly marked as groups (having _is_group flag)
      const groupNames = new Set();

      for (const modelName of Object.keys(models)) {
        if (modelName === "*") continue;

        if (modelName.includes("/")) {
          // model/submodel format - this is a model in a group
          groupNames.add(modelName.split("/")[0]);
        } else if (models[modelName]._is_group) {
          // Explicitly marked as a group
          groupNames.add(modelName);
        }
      }

      // Now organize entries into groups and standalone
      for (const [modelName, modelConfig] of Object.entries(models)) {
        if (modelName === "*") continue;

        if (modelName.includes("/")) {
          // This is a model in a group: group/model
          const [groupName, modelOnlyName] = modelName.split("/");
          if (!groups[groupName]) {
            groups[groupName] = { name: groupName, models: [] };
          }
          groups[groupName].models.push({ name: modelOnlyName, ...modelConfig });
        } else if (groupNames.has(modelName)) {
          // This is a group entry
          if (!groups[modelName]) {
            groups[modelName] = { name: modelName, models: [] };
          }
          // Merge config if present (exclude internal _is_group flag)
          const { _is_group, ...cleanConfig } = modelConfig;
          if (Object.keys(cleanConfig).length > 0) {
            groups[modelName] = { ...groups[modelName], ...cleanConfig };
          }
        } else {
          // Standalone model (no children, not a group)
          standalone.push({ name: modelName, ...modelConfig });
        }
      }

      const groupNamesList = Object.keys(groups);
      const expandedGroups = {};
      if (groupNamesList.length > 0) {
        expandedGroups[groupNamesList[0]] = true;
      }

      this.setState({
        selectedPreset: preset,
        globalDefaults: defaults,
        groups: groupNamesList.map((name) => groups[name]),
        standaloneModels: standalone,
        expandedDefaults: true,
        expandedGroups,
        expandedModels: {},
        editingDefaults: false,
        editingGroup: null,
        editingModel: null,
        editingData: null,
      });
    } catch (error) {
      console.error("[PRESETS] Error loading preset:", error);
      showNotification(`Error loading preset: ${error.message}`, "error");
    }
  }

  handleNewPreset() {
    const name = prompt("Preset name:");
    if (!name) return;

    this.setState({ loading: true });
    this._getService()
      .createPreset(name)
      .then(() => {
        showNotification(`Preset "${name}" created`, "success");
        return this.controller.loadPresetsData();
      })
      .catch((error) => {
        console.error("[PRESETS] Create error:", error);
        showNotification(`Error: ${error.message}`, "error");
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  handleDeletePreset(e) {
    const el = e.target.closest("[data-action=delete-preset]");
    if (!el) return;
    const name = el.dataset.presetName;

    if (!confirm(`Delete preset "${name}"?`)) return;

    this.setState({ loading: true });
    this._getService()
      .deletePreset(name)
      .then(() => {
        showNotification("Preset deleted", "success");
        this.setState({
          selectedPreset: null,
          groups: [],
          standaloneModels: [],
          globalDefaults: {},
        });
        return this.controller.loadPresetsData();
      })
      .catch((error) => {
        console.error("[PRESETS] Delete error:", error);
        showNotification(`Error: ${error.message}`, "error");
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  handleNewGroup() {
    const name = prompt("Group name:");
    if (!name || !name.trim()) return;

    this.setState({ loading: true });
    // Mark this as a group with the _is_group flag
    this._getService()
      .addModel(this.state.selectedPreset.name, name.trim(), { _is_group: true })
      .then(() => {
        showNotification(`Group "${name}" created`, "success");
        return this.loadPresetData(this.state.selectedPreset);
      })
      .then(() => {
        this.setState({
          expandedGroups: { ...this.state.expandedGroups, [name.trim()]: true },
        });
      })
      .catch((error) => {
        console.error("[PRESETS] Create group error:", error);
        showNotification(`Error: ${error.message}`, "error");
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  handleDeleteGroup(e) {
    const el = e.target.closest("[data-action=delete-group]");
    if (!el) return;
    const groupName = el.dataset.groupName;

    if (!confirm(`Delete group "${groupName}"? This will also delete all models in this group.`))
      return;

    this.setState({ loading: true });
    this._getService()
      .removeModel(this.state.selectedPreset.name, groupName)
      .then(() => {
        showNotification(`Group "${groupName}" deleted`, "success");
        return this.loadPresetData(this.state.selectedPreset);
      })
      .catch((error) => {
        console.error("[PRESETS] Delete group error:", error);
        showNotification(`Error: ${error.message}`, "error");
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  handleNewModel(e) {
    const el = e.target.closest("[data-action=new-model]");
    const groupName = el?.dataset.groupName || "";
    const models = this.state.availableModels;

    if (models.length === 0) {
      showNotification("No models available. Please scan for models first.", "warning");
      return;
    }

    // Create a modal-like select dialog
    const selectHtml = `
      <div class="model-select-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      ">
        <div style="
          background: var(--card-bg);
          border-radius: var(--radius);
          padding: var(--lg);
          max-width: 400px;
          width: 90%;
        ">
          <h3 style="margin: 0 0 var(--md) 0;">Add Model to ${groupName || "standalone"}</h3>
          <select id="model-select" style="
            width: 100%;
            padding: var(--sm) var(--md);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 0.875rem;
            margin-bottom: var(--md);
          ">
            <option value="">-- Select Model --</option>
            ${models.map((m) => `<option value="${m.path}">${m.name} (${AppUtils.formatBytes(m.size)})</option>`).join("")}
          </select>
          <input type="text" id="model-name-input" placeholder="Model name (optional, uses filename if empty)" style="
            width: 100%;
            padding: var(--sm) var(--md);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 0.875rem;
            margin-bottom: var(--md);
          ">
          <div style="display: flex; gap: var(--sm); justify-content: flex-end;">
            <button id="model-select-cancel" class="btn btn-secondary btn-sm">Cancel</button>
            <button id="model-select-confirm" class="btn btn-primary btn-sm">Add</button>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = selectHtml;
    document.body.appendChild(container);

    const select = container.querySelector("#model-select");
    const nameInput = container.querySelector("#model-name-input");
    const confirmBtn = container.querySelector("#model-select-confirm");
    const cancelBtn = container.querySelector("#model-select-cancel");

    const closeModal = () => {
      document.body.removeChild(container);
    };

    cancelBtn.onclick = closeModal;

    confirmBtn.onclick = () => {
      const modelPath = select.value;
      if (!modelPath) {
        showNotification("Please select a model", "warning");
        return;
      }
      const modelName = nameInput.value.trim() || modelPath.split("/").pop();
      const fullName = groupName ? `${groupName}/${modelName}` : modelName;

      closeModal();
      this.createModel(modelName, groupName, fullName, modelPath);
    };
  }

  async createModel(name, groupName, fullName, modelPath) {
    this.setState({ loading: true });
    try {
      const service = this._getService();
      await service.addModel(this.state.selectedPreset.name, fullName, {
        model: modelPath,
      });
      showNotification(`Model "${name}" created`, "success");
      await this.loadPresetData(this.state.selectedPreset);
      const fullKey = groupName ? `${groupName}/${name}` : name;
      this.setState({
        expandedModels: { ...this.state.expandedModels, [fullKey]: true },
      });
    } catch (error) {
      console.error("[PRESETS] Create model error:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      this.setState({ loading: false });
    }
  }

  handleDeleteModel(e) {
    e.stopPropagation();
    const el = e.target.closest("[data-action=delete-model]");
    if (!el) return;
    const groupName = el.dataset.groupName;
    const modelName = el.dataset.modelName;
    const fullName = groupName ? `${groupName}/${modelName}` : modelName;

    console.log("[DEBUG] Delete model clicked:", { groupName, modelName, fullName });

    if (!confirm(`Delete model "${modelName}"?`)) return;

    this.setState({ loading: true });
    this._getService()
      .removeModel(this.state.selectedPreset.name, fullName)
      .then(() => {
        showNotification(`Model "${modelName}" deleted`, "success");
        return this.loadPresetData(this.state.selectedPreset);
      })
      .catch((error) => {
        console.error("[PRESETS] Delete model error:", error);
        showNotification(`Error: ${error.message}`, "error");
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  async loadAvailableModels() {
    const service = this._getService();
    if (!service) return;

    try {
      const models = await service.getAvailableModels();
      this.setState({ availableModels: models });
    } catch (error) {
      console.error("[PRESETS] Failed to load models:", error.message);
    }
  }

  handleSearchParams(e) {
    const input = e.target.closest("[data-action=search-params]");
    if (!input) return;
    this.setState({ parameterFilter: input.value });
  }

  handleClearSearch() {
    this.setState({ parameterFilter: "" });
  }

  handleCopyValue(e) {
    const btn = e.target.closest("[data-action=copy-value]");
    if (!btn) return;

    const value = btn.dataset.value;
    const paramId = btn.dataset.paramId;

    navigator.clipboard
      .writeText(value)
      .then(() => {
        this.setState({ copiedParam: paramId });
        // Reset after 2 seconds
        setTimeout(() => {
          if (this.state.copiedParam === paramId) {
            this.setState({ copiedParam: null });
          }
        }, 2000);
        showNotification(`Copied: ${value}`, "success");
      })
      .catch((error) => {
        console.error("[PRESETS] Copy failed:", error);
        showNotification("Failed to copy value", "error");
      });
  }

  didMount() {
    this.loadAvailableModels();
  }
}

window.PresetsController = PresetsController;
window.PresetsPage = PresetsPage;
