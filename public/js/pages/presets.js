/**
 * Presets Page - Sparse Configuration for llama.cpp Router Mode
 * Shows only user-configured parameters (not defaults from llama.cpp)
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

const PRESET_PARAMS = [
  {
    key: "model",
    iniKey: "model",
    label: "Model Path",
    type: "string",
    default: "",
    category: "model",
  },
  {
    key: "ctx-size",
    iniKey: "ctxSize",
    label: "Context Size",
    type: "number",
    default: 2048,
    min: 1,
    max: 131072,
    category: "model",
  },
  {
    key: "ctx-checkpoints",
    iniKey: "ctxCheckpoints",
    label: "Context Checkpoints",
    type: "number",
    default: 8,
    min: 1,
    max: 256,
    category: "model",
  },
  {
    key: "n-gpu-layers",
    iniKey: "nGpuLayers",
    label: "GPU Layers",
    type: "number",
    default: 0,
    min: 0,
    max: 1000,
    category: "model",
  },
  {
    key: "split-mode",
    iniKey: "splitMode",
    label: "Split Mode",
    type: "select",
    options: ["none", "layer", "row"],
    default: "none",
    category: "model",
  },
  {
    key: "tensor-split",
    iniKey: "tensorSplit",
    label: "Tensor Split",
    type: "string",
    default: "",
    category: "model",
  },
  {
    key: "main-gpu",
    iniKey: "mainGpu",
    label: "Main GPU",
    type: "number",
    default: 0,
    min: 0,
    max: 16,
    category: "model",
  },
  {
    key: "temp",
    iniKey: "temperature",
    label: "Temperature",
    type: "number",
    step: "0.01",
    default: 0.7,
    min: 0.0,
    max: 2.0,
    category: "sampling",
  },
  {
    key: "top-p",
    iniKey: "topP",
    label: "Top-P",
    type: "number",
    step: "0.01",
    default: 0.9,
    min: 0.0,
    max: 1.0,
    category: "sampling",
  },
  {
    key: "top-k",
    iniKey: "topK",
    label: "Top-K",
    type: "number",
    default: 40,
    min: 1,
    max: 100,
    category: "sampling",
  },
  {
    key: "min-p",
    iniKey: "minP",
    label: "Min-P",
    type: "number",
    step: "0.01",
    default: 0.0,
    min: 0.0,
    max: 1.0,
    category: "sampling",
  },
  {
    key: "typ-p",
    iniKey: "typP",
    label: "Typical P",
    type: "number",
    step: "0.01",
    default: 1.0,
    min: 0.0,
    max: 1.0,
    category: "sampling",
  },
  {
    key: "seed",
    iniKey: "seed",
    label: "Random Seed",
    type: "number",
    default: -1,
    min: -1,
    max: 4294967295,
    category: "sampling",
  },
  {
    key: "mirostat",
    iniKey: "mirostat",
    label: "Mirostat",
    type: "select",
    options: ["0", "1", "2"],
    default: "0",
    category: "sampling",
  },
  {
    key: "mirostat-lr",
    iniKey: "mirostat_lr",
    label: "Mirostat LR",
    type: "number",
    step: "0.01",
    default: 0.1,
    min: 0.0,
    max: 1.0,
    category: "sampling",
  },
  {
    key: "mirostat-ent",
    iniKey: "mirostat_ent",
    label: "Mirostat Entropy",
    type: "number",
    step: "0.01",
    default: 5.0,
    min: 0.0,
    max: 10.0,
    category: "sampling",
  },
  {
    key: "repeat-penalty",
    iniKey: "repeat_penalty",
    label: "Repeat Penalty",
    type: "number",
    step: "0.01",
    default: 1.0,
    min: 0.0,
    max: 2.0,
    category: "sampling",
  },
  {
    key: "repeat-last-n",
    iniKey: "repeat_last_n",
    label: "Repeat Last N",
    type: "number",
    default: 64,
    min: 0,
    max: 4096,
    category: "sampling",
  },
  {
    key: "presence-penalty",
    iniKey: "presence_penalty",
    label: "Presence Penalty",
    type: "number",
    step: "0.01",
    default: 0.0,
    min: -2.0,
    max: 2.0,
    category: "sampling",
  },
  {
    key: "frequency-penalty",
    iniKey: "frequency_penalty",
    label: "Frequency Penalty",
    type: "number",
    step: "0.01",
    default: 0.0,
    min: -2.0,
    max: 2.0,
    category: "sampling",
  },
  {
    key: "threads",
    iniKey: "threads",
    label: "Threads",
    type: "number",
    default: 0,
    min: 0,
    max: 256,
    category: "performance",
  },
  {
    key: "batch",
    iniKey: "batchSize",
    label: "Batch Size",
    type: "number",
    default: 512,
    min: 1,
    max: 8192,
    category: "performance",
  },
  {
    key: "ubatch",
    iniKey: "ubatchSize",
    label: "Micro Batch",
    type: "number",
    default: 512,
    min: 1,
    max: 8192,
    category: "performance",
  },
  {
    key: "threads-http",
    iniKey: "threadsHttp",
    label: "HTTP Threads",
    type: "number",
    default: 1,
    min: 1,
    max: 64,
    category: "performance",
  },
  {
    key: "cache-ram",
    iniKey: "cacheRam",
    label: "RAM Cache (MB)",
    type: "number",
    default: 8192,
    min: 0,
    max: 131072,
    category: "server",
  },
  {
    key: "load-on-startup",
    iniKey: "loadOnStartup",
    label: "Load on Startup",
    type: "boolean",
    default: false,
    category: "server",
  },
  {
    key: "mmp",
    iniKey: "mmp",
    label: "Model Memory Pointer",
    type: "string",
    default: "",
    category: "server",
  },
  {
    key: "draft-min",
    iniKey: "draft_min",
    label: "Draft Min Tokens",
    type: "number",
    default: 5,
    min: 1,
    max: 100,
    category: "speculative",
  },
  {
    key: "draft-max",
    iniKey: "draft_max",
    label: "Draft Max Tokens",
    type: "number",
    default: 10,
    min: 1,
    max: 100,
    category: "speculative",
  },
  {
    key: "draft-p-min",
    iniKey: "draft_p_min",
    label: "Draft P Min",
    type: "number",
    step: "0.01",
    default: 0.8,
    min: 0.0,
    max: 1.0,
    category: "speculative",
  },
  {
    key: "jinja",
    iniKey: "jinja",
    label: "Use Jinja Template",
    type: "boolean",
    default: false,
    category: "chat",
  },
  {
    key: "chat-template",
    iniKey: "chatTemplate",
    label: "Chat Template",
    type: "string",
    default: "",
    category: "chat",
  },
];

class PresetsPage extends Component {
  constructor(props) {
    super(props);
    this._presetsService = props.presetsService || null;
    this.state = {
      presets: props.presets || [],
      selectedPreset: null,
      globalDefaults: {},
      groups: [],
      standaloneModels: [],
      availableModels: [],
      loading: props.loading !== undefined ? props.loading : true,
      expandedDefaults: true,
      expandedGroups: {},
      expandedModels: {},
    };
    this.controller = props.controller;
    this._isUnmounting = false;
  }

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
        "Sparse configuration - only explicitly set parameters are saved"
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
      this.renderGlobalDefaults(),
      this.renderGroupsSection(),
      this.renderStandaloneSection()
    );
  }

  renderGlobalDefaults() {
    const params = this.state.globalDefaults;
    const hasParams = Object.keys(params).length > 0;

    return Component.h(
      "div",
      { className: "collapsible-section defaults-section" },
      Component.h(
        "div",
        {
          className: `section-header ${this.state.expandedDefaults ? "expanded" : ""}`,
          "data-action": "toggle-defaults",
        },
        Component.h("span", { className: "section-icon" }, "★"),
        Component.h("span", { className: "section-title" }, "Global Defaults (*)"),
        Component.h(
          "span",
          { className: "section-toggle" },
          this.state.expandedDefaults ? "▼" : "▶"
        )
      ),
      this.state.expandedDefaults
        ? Component.h(
            "div",
            { className: "section-content" },
            hasParams
              ? Component.h(
                  "div",
                  { className: "params-grid" },
                  Object.entries(params).map(([key, value]) =>
                    this.renderParamItem(key, value, "defaults", "*")
                  )
                )
              : Component.h(
                  "div",
                  { className: "section-hint" },
                  "No parameters set. All use llama.cpp defaults."
                ),
            this.renderAddParamDropdown("defaults", "*")
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
            groups.map((group) => this.renderGroup(group))
          ),
      Component.h(
        "button",
        { className: "btn btn-secondary btn-sm add-group-btn", "data-action": "new-group" },
        "+ Add Group"
      )
    );
  }

  renderGroup(group) {
    const isExpanded = this.state.expandedGroups[group.name] || false;
    const hasParams = Object.keys(group.params || {}).length > 0;

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
            Component.h(
              "div",
              { className: "group-models-section" },
              Component.h("h4", { className: "subsection-title" }, "Applies to"),
              group.models && group.models.length > 0
                ? Component.h(
                    "div",
                    { className: "models-tags" },
                    group.models.map((model) =>
                      Component.h(
                        "span",
                        { className: "model-tag" },
                        model,
                        Component.h(
                          "button",
                          {
                            className: "btn-remove-model",
                            "data-action": "remove-model-from-group",
                            "data-model-name": model,
                            "data-group-name": group.name,
                          },
                          "×"
                        )
                      )
                    )
                  )
                : Component.h("div", { className: "empty-list" }, "No models in this group"),
              Component.h(
                "button",
                {
                  className: "btn btn-secondary btn-sm",
                  "data-action": "add-model-to-group",
                  "data-group-name": group.name,
                },
                "+ Add Model to Group"
              )
            ),
            Component.h(
              "div",
              { className: "group-params-section" },
              Component.h("h4", { className: "subsection-title" }, "Group Parameters"),
              hasParams
                ? Component.h(
                    "div",
                    { className: "params-grid" },
                    Object.entries(group.params).map(([key, value]) =>
                      this.renderParamItem(key, value, "group", group.name)
                    )
                  )
                : Component.h(
                    "div",
                    { className: "section-hint" },
                    "No parameters set. Uses global defaults."
                  ),
              this.renderAddParamDropdown("group", group.name)
            )
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
            models.map((model) => this.renderStandaloneModel(model))
          )
        : Component.h("div", { className: "empty-list" }, "No standalone models yet")
    );
  }

  renderStandaloneModel(model) {
    const fullName = model.name;
    const isExpanded = this.state.expandedModels[fullName] || false;
    const hasParams = Object.keys(model.params || {}).length > 0;

    return Component.h(
      "div",
      { className: `model-section ${isExpanded ? "expanded" : ""}` },
      Component.h(
        "div",
        {
          className: `section-header model-header ${isExpanded ? "expanded" : ""}`,
          "data-action": "toggle-model",
          "data-model-name": model.name,
          "data-group-name": "",
        },
        Component.h("span", { className: "section-icon" }, "📄"),
        Component.h(
          "div",
          { className: "model-title-wrapper" },
          Component.h("span", { className: "section-title" }, model.name),
          Component.h(
            "button",
            {
              className: "delete-model-btn",
              "data-action": "delete-model",
              "data-model-name": model.name,
              "data-group-name": "",
              title: "Delete model",
            },
            "×"
          )
        ),
        Component.h("span", { className: "section-toggle" }, isExpanded ? "▼" : "▶")
      ),
      isExpanded
        ? Component.h(
            "div",
            { className: "section-content" },
            hasParams
              ? Component.h(
                  "div",
                  { className: "params-grid" },
                  Object.entries(model.params).map(([key, value]) =>
                    this.renderParamItem(key, value, "model", fullName)
                  )
                )
              : Component.h(
                  "div",
                  { className: "section-hint" },
                  "No parameters set. Uses global defaults."
                ),
            this.renderAddParamDropdown("model", fullName)
          )
        : null
    );
  }

  renderParamItem(key, value, sectionType, sectionName) {
    const paramDef = PRESET_PARAMS.find((p) => p.iniKey === key);
    if (!paramDef) return null;

    return Component.h(
      "div",
      { className: "param-item" },
      Component.h("label", { className: "param-label" }, paramDef.label),
      Component.h(
        "div",
        { className: "param-input-wrapper" },
        paramDef.type === "select"
          ? Component.h(
              "select",
              {
                className: "param-input",
                "data-param": key,
                "data-section": sectionType,
                "data-name": sectionName,
              },
              paramDef.options.map((opt) =>
                Component.h("option", { value: opt, selected: opt === String(value) }, opt)
              )
            )
          : Component.h("input", {
              type: paramDef.type,
              className: "param-input",
              step: paramDef.step || "1",
              value: value !== undefined && value !== null ? value : "",
              "data-param": key,
              "data-section": sectionType,
              "data-name": sectionName,
              placeholder: String(paramDef.default),
              min: paramDef.min,
              max: paramDef.max,
            }),
        Component.h(
          "button",
          {
            className: "btn-remove-param",
            "data-action": "remove-param",
            "data-param": key,
            "data-section": sectionType,
            "data-name": sectionName,
            title: "Remove parameter",
          },
          "×"
        )
      ),
      Component.h(
        "span",
        { className: "param-info" },
        `default: ${paramDef.default}, min: ${paramDef.min}, max: ${paramDef.max}`
      )
    );
  }

  renderAddParamDropdown(sectionType, sectionName) {
    const currentParams = this.getSectionParams(sectionType, sectionName);
    const availableParams = PRESET_PARAMS.filter((p) => !(p.iniKey in currentParams));

    return Component.h(
      "div",
      { className: "add-param-section" },
      Component.h(
        "select",
        {
          className: "param-add-select",
          "data-action": "add-param-select",
          "data-section": sectionType,
          "data-name": sectionName,
          defaultValue: "",
        },
        Component.h("option", { value: "" }, "-- Add Parameter --"),
        availableParams.map((param) =>
          Component.h("option", { value: param.key }, `${param.label} (default: ${param.default})`)
        )
      )
    );
  }

  getSectionParams(sectionType, sectionName) {
    if (sectionType === "defaults") {
      return this.state.globalDefaults;
    } else if (sectionType === "group") {
      const group = this.state.groups.find((g) => g.name === sectionName);
      return group?.params || {};
    } else if (sectionType === "model") {
      const model = this.state.standaloneModels.find((m) => m.name === sectionName);
      return model?.params || {};
    }
    return {};
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
      "click [data-action=delete-group]": "handleDeleteGroup",
      "click [data-action=new-model]": "handleNewModel",
      "click [data-action=delete-model]": "handleDeleteModel",
      "click [data-action=remove-param]": "handleRemoveParam",
      "change [data-action=add-param-select]": "handleAddParam",
      "input .param-input": "handleParamChange",
      "click [data-action=add-model-to-group]": "handleAddModelToGroup",
      "click [data-action=remove-model-from-group]": "handleRemoveModelFromGroup",
    };
  }

  handleToggleDefaults() {
    this.setState({ expandedDefaults: !this.state.expandedDefaults });
  }

  handleToggleGroup(e) {
    if (e.target.closest("[data-action=delete-group]")) return;

    const el = e.target.closest("[data-action=toggle-group]");
    if (!el) return;
    const groupName = el.dataset.groupName;

    this.setState({
      expandedGroups: {
        ...this.state.expandedGroups,
        [groupName]: !this.state.expandedGroups[groupName],
      },
    });
  }

  handleToggleModel(e) {
    if (e.target.closest("[data-action=delete-model]")) return;

    const el = e.target.closest("[data-action=toggle-model]");
    if (!el) return;
    const modelName = el.dataset.modelName;

    this.setState({
      expandedModels: {
        ...this.state.expandedModels,
        [modelName]: !this.state.expandedModels[modelName],
      },
    });
  }

  handleAddParam(e) {
    const select = e.target.closest("[data-action=add-param-select]");
    if (!select || !select.value) return;

    const paramKey = select.value;
    const param = PRESET_PARAMS.find((p) => p.key === paramKey);
    if (!param) return;

    const sectionType = select.dataset.section;
    const sectionName = select.dataset.name;

    this.updateSectionParam(sectionType, sectionName, param.iniKey, param.default);

    select.value = "";
  }

  handleParamChange(e) {
    const input = e.target.closest(".param-input");
    if (!input) return;

    const paramKey = input.dataset.param;
    const sectionType = input.dataset.section;
    const sectionName = input.dataset.name;
    const param = PRESET_PARAMS.find((p) => p.iniKey === paramKey);
    if (!param) return;

    let value = input.value;
    if (param.type === "number") {
      value = parseFloat(value);
      if (isNaN(value)) value = param.default;
    } else if (param.type === "boolean") {
      value = input.checked;
    }

    this.updateSectionParam(sectionType, sectionName, paramKey, value);
  }

  handleRemoveParam(e) {
    const btn = e.target.closest("[data-action=remove-param]");
    if (!btn) return;

    const paramKey = btn.dataset.param;
    const sectionType = btn.dataset.section;
    const sectionName = btn.dataset.name;

    this.removeSectionParam(sectionType, sectionName, paramKey);
  }

  updateSectionParam(sectionType, sectionName, paramKey, value) {
    let newState = {};

    if (sectionType === "defaults") {
      newState.globalDefaults = { ...this.state.globalDefaults, [paramKey]: value };
    } else if (sectionType === "group") {
      const groups = [...this.state.groups];
      const groupIndex = groups.findIndex((g) => g.name === sectionName);
      if (groupIndex >= 0) {
        groups[groupIndex] = {
          ...groups[groupIndex],
          params: { ...groups[groupIndex].params, [paramKey]: value },
        };
        newState.groups = groups;
      }
    } else if (sectionType === "model") {
      const models = [...this.state.standaloneModels];
      const modelIndex = models.findIndex((m) => m.name === sectionName);
      if (modelIndex >= 0) {
        models[modelIndex] = {
          ...models[modelIndex],
          params: { ...models[modelIndex].params, [paramKey]: value },
        };
        newState.standaloneModels = models;
      }
    }

    this.setState(newState);
    this.scheduleSave();
  }

  removeSectionParam(sectionType, sectionName, paramKey) {
    let newState = {};

    if (sectionType === "defaults") {
      const params = { ...this.state.globalDefaults };
      delete params[paramKey];
      newState.globalDefaults = params;
    } else if (sectionType === "group") {
      const groups = [...this.state.groups];
      const groupIndex = groups.findIndex((g) => g.name === sectionName);
      if (groupIndex >= 0) {
        const params = { ...groups[groupIndex].params };
        delete params[paramKey];
        groups[groupIndex] = { ...groups[groupIndex], params };
        newState.groups = groups;
      }
    } else if (sectionType === "model") {
      const models = [...this.state.standaloneModels];
      const modelIndex = models.findIndex((m) => m.name === sectionName);
      if (modelIndex >= 0) {
        const params = { ...models[modelIndex].params };
        delete params[paramKey];
        models[modelIndex] = { ...models[modelIndex], params };
        newState.standaloneModels = models;
      }
    }

    this.setState(newState);
    this.scheduleSave();
  }

  scheduleSave() {
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => this.savePreset(), 500);
  }

  async savePreset() {
    const preset = this.state.selectedPreset;
    if (!preset) return;

    const config = this.buildIniConfig();

    try {
      await this._getService().savePreset(preset.name, config);
      console.log("[PRESETS] Saved preset:", preset.name);
    } catch (error) {
      console.error("[PRESETS] Save error:", error.message);
      showNotification("Failed to save preset: " + error.message, "error");
    }
  }

  buildIniConfig() {
    const config = {
      LLAMA_CONFIG_VERSION: "1",
    };

    if (Object.keys(this.state.globalDefaults).length > 0) {
      config["*"] = this.state.globalDefaults;
    }

    for (const group of this.state.groups) {
      config[group.name] = { ...group.params, _is_group: "true" };
      for (const modelName of group.models) {
        config[`${group.name}/${modelName}`] = { model: "" };
      }
    }

    for (const model of this.state.standaloneModels) {
      config[model.name] = { ...model.params };
    }

    return config;
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

      const groups = [];
      const standalone = [];

      for (const [modelName, modelConfig] of Object.entries(models)) {
        if (modelName === "*") continue;

        if (modelName.includes("/")) {
          const [groupName, modelOnlyName] = modelName.split("/");
          let group = groups.find((g) => g.name === groupName);
          if (!group) {
            group = { name: groupName, params: {}, models: [] };
            groups.push(group);
          }
          if (!group.models.includes(modelOnlyName)) {
            group.models.push(modelOnlyName);
          }
        } else if (modelConfig._is_group) {
          let group = groups.find((g) => g.name === modelName);
          if (!group) {
            group = { name: modelName, params: {}, models: [] };
            groups.push(group);
          }
          const { _is_group, ...cleanParams } = modelConfig;
          group.params = cleanParams;
        } else {
          standalone.push({ name: modelName, params: modelConfig });
        }
      }

      this.setState({
        selectedPreset: preset,
        globalDefaults: defaults,
        groups,
        standaloneModels: standalone,
        expandedDefaults: true,
        expandedGroups: groups.length > 0 ? { [groups[0]?.name]: true } : {},
        expandedModels: {},
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
      .then(() => {
        const preset = this.state.presets.find((p) => p.name === name);
        if (preset) this.loadPresetData(preset);
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

    const groupName = name.trim();
    const newGroup = { name: groupName, params: {}, models: [] };

    this.setState({
      groups: [...this.state.groups, newGroup],
      expandedGroups: { ...this.state.expandedGroups, [groupName]: true },
    });

    this.scheduleSave();
    showNotification(`Group "${groupName}" created`, "success");
  }

  handleDeleteGroup(e) {
    const el = e.target.closest("[data-action=delete-group]");
    if (!el) return;
    const groupName = el.dataset.groupName;

    if (!confirm(`Delete group "${groupName}"?`)) return;

    const groups = this.state.groups.filter((g) => g.name !== groupName);
    const expandedGroups = { ...this.state.expandedGroups };
    delete expandedGroups[groupName];

    this.setState({ groups, expandedGroups });
    this.scheduleSave();
    showNotification(`Group "${groupName}" deleted`, "success");
  }

  handleNewModel(e) {
    const el = e.target.closest("[data-action=new-model]");
    const groupName = el?.dataset.groupName || "";
    const models = this.state.availableModels;

    if (models.length === 0) {
      showNotification("No models available. Please scan for models first.", "warning");
      return;
    }

    this.showModelSelectDialog(groupName, models);
  }

  showModelSelectDialog(groupName, models) {
    const selectHtml = `
      <div class="model-select-modal">
        <div class="model-select-backdrop"></div>
        <div class="model-select-dialog">
          <h3>Add Model to ${groupName || "standalone"}</h3>
          <select id="model-select">
            <option value="">-- Select Model --</option>
            ${models.map((m) => `<option value="${m.name}">${m.name}</option>`).join("")}
          </select>
          <input type="text" id="model-name-input" placeholder="Model name (optional, uses filename if empty)">
          <div class="model-select-actions">
            <button id="model-select-cancel" class="btn btn-secondary">Cancel</button>
            <button id="model-select-confirm" class="btn btn-primary">Add</button>
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
      const modelName = nameInput.value.trim() || select.value;
      if (!modelName) {
        showNotification("Please select a model", "warning");
        return;
      }

      closeModal();

      if (groupName) {
        this.addModelToGroup(groupName, modelName);
      } else {
        this.addStandaloneModel(modelName);
      }
    };
  }

  addModelToGroup(groupName, modelName) {
    const groups = [...this.state.groups];
    const group = groups.find((g) => g.name === groupName);
    if (group && !group.models.includes(modelName)) {
      group.models.push(modelName);
      this.setState({ groups });
      this.scheduleSave();
      showNotification(`Model "${modelName}" added to group`, "success");
    }
  }

  addStandaloneModel(modelName) {
    const models = [...this.state.standaloneModels];
    if (!models.find((m) => m.name === modelName)) {
      models.push({ name: modelName, params: {} });
      this.setState({
        standaloneModels: models,
        expandedModels: { ...this.state.expandedModels, [modelName]: true },
      });
      this.scheduleSave();
      showNotification(`Standalone model "${modelName}" created`, "success");
    }
  }

  handleAddModelToGroup(e) {
    const el = e.target.closest("[data-action=add-model-to-group]");
    const groupName = el?.dataset.groupName;
    const models = this.state.availableModels;

    if (models.length === 0) {
      showNotification("No models available", "warning");
      return;
    }

    this.showModelSelectDialog(groupName, models);
  }

  handleRemoveModelFromGroup(e) {
    const el = e.target.closest("[data-action=remove-model-from-group]");
    if (!el) return;
    const modelName = el.dataset.modelName;
    const groupName = el.dataset.groupName;

    const groups = [...this.state.groups];
    const group = groups.find((g) => g.name === groupName);
    if (group) {
      group.models = group.models.filter((m) => m !== modelName);
      this.setState({ groups });
      this.scheduleSave();
      showNotification(`Model "${modelName}" removed from group`, "success");
    }
  }

  handleDeleteModel(e) {
    const el = e.target.closest("[data-action=delete-model]");
    if (!el) return;
    const modelName = el.dataset.modelName;
    const groupName = el.dataset.groupName;

    if (!confirm(`Delete model "${modelName}"?`)) return;

    if (groupName) {
      const groups = [...this.state.groups];
      const group = groups.find((g) => g.name === groupName);
      if (group) {
        group.models = group.models.filter((m) => m !== modelName);
        this.setState({ groups });
        this.scheduleSave();
      }
    } else {
      const models = this.state.standaloneModels.filter((m) => m.name !== modelName);
      const expandedModels = { ...this.state.expandedModels };
      delete expandedModels[modelName];
      this.setState({ standaloneModels: models, expandedModels });
      this.scheduleSave();
    }

    showNotification(`Model "${modelName}" deleted`, "success");
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

  didMount() {
    this.loadAvailableModels();
  }
}

window.PresetsController = PresetsController;
window.PresetsPage = PresetsPage;
