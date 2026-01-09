/**
 * Presets Page - Event-Driven DOM Updates
 * Components render once, then use events to update specific DOM elements
 */

const LLAMA_PARAMS = [
  {
    key: "ctx-size",
    iniKey: "ctxSize",
    label: "Context Size",
    type: "number",
    default: 0,
    min: 0,
    max: 32768,
    step: 512,
    group: "core",
    description: "Size of the prompt context (0 = loaded from model)",
  },
  {
    key: "batch-size",
    iniKey: "batchSize",
    label: "Batch Size",
    type: "number",
    default: 2048,
    min: 1,
    max: 65536,
    step: 1,
    group: "core",
    description: "Logical maximum batch size",
  },
  {
    key: "ubatch-size",
    iniKey: "ubatchSize",
    label: "Micro Batch Size",
    type: "number",
    default: 512,
    min: 1,
    max: 65536,
    step: 1,
    group: "core",
    description: "Physical maximum batch size",
  },
  {
    key: "n-predict",
    iniKey: "nPredict",
    label: "Max Tokens",
    type: "number",
    default: -1,
    min: -1,
    max: 2147483647,
    step: 1,
    group: "core",
    description: "Number of tokens to predict (-1 = infinite)",
  },
  {
    key: "threads",
    iniKey: "threads",
    label: "Threads",
    type: "number",
    default: 0,
    min: 0,
    max: 256,
    step: 1,
    group: "hardware",
    description: "Number of CPU threads (0 = all CPUs)",
  },
  {
    key: "threads-batch",
    iniKey: "threadsBatch",
    label: "Threads (Batch)",
    type: "number",
    default: 0,
    min: 0,
    max: 256,
    step: 1,
    group: "hardware",
    description: "Threads for batch and prompt processing (0 = same as --threads)",
  },
  {
    key: "n-gpu-layers",
    iniKey: "nGpuLayers",
    label: "GPU Layers",
    type: "number",
    default: -1,
    min: -1,
    max: 256,
    step: 1,
    group: "hardware",
    description: "Max layers to store in VRAM (-1=auto, 0=CPU)",
  },
  {
    key: "split-mode",
    iniKey: "splitMode",
    label: "Split Mode",
    type: "select",
    default: "layer",
    options: ["none", "layer", "row"],
    group: "hardware",
    description: "How to split model across multiple GPUs",
  },
  {
    key: "tensor-split",
    iniKey: "tensorSplit",
    label: "Tensor Split",
    type: "text",
    default: "",
    group: "hardware",
    description: "Fraction of model to offload to each GPU (comma-separated)",
  },
  {
    key: "main-gpu",
    iniKey: "mainGpu",
    label: "Main GPU",
    type: "number",
    default: 0,
    min: 0,
    max: 8,
    step: 1,
    group: "hardware",
    description: "GPU index to use for model/KV",
  },
  {
    key: "temp",
    iniKey: "temperature",
    label: "Temperature",
    type: "number",
    default: 0.8,
    min: 0,
    max: 2,
    step: 0.01,
    group: "sampling",
    description: "Sampling temperature",
  },
  {
    key: "top-k",
    iniKey: "topK",
    label: "Top K",
    type: "number",
    default: 40,
    min: 0,
    max: 1000,
    step: 1,
    group: "sampling",
    description: "Top-k sampling (0 = disabled)",
  },
  {
    key: "top-p",
    iniKey: "topP",
    label: "Top P",
    type: "number",
    default: 0.9,
    min: 0,
    max: 1,
    step: 0.01,
    group: "sampling",
    description: "Top-p sampling (1.0 = disabled)",
  },
  {
    key: "min-p",
    iniKey: "minP",
    label: "Min P",
    type: "number",
    default: 0.1,
    min: 0,
    max: 1,
    step: 0.01,
    group: "sampling",
    description: "Min-p sampling (0.0 = disabled)",
  },
  {
    key: "typical",
    iniKey: "typical",
    label: "Typical",
    type: "number",
    default: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "sampling",
    description: "Locally typical sampling, parameter p (1.0 = disabled)",
  },
  {
    key: "repeat-last-n",
    iniKey: "repeatLastN",
    label: "Repeat Penalty N",
    type: "number",
    default: 64,
    min: 0,
    max: 32768,
    step: 1,
    group: "sampling",
    description: "Last n tokens to consider for repeat penalty (0 = disabled)",
  },
  {
    key: "repeat-penalty",
    iniKey: "repeatPenalty",
    label: "Repeat Penalty",
    type: "number",
    default: 1.0,
    min: 0,
    max: 2,
    step: 0.01,
    group: "sampling",
    description: "Penalize repeat sequences (1.0 = disabled)",
  },
  {
    key: "presence-penalty",
    iniKey: "presencePenalty",
    label: "Presence Penalty",
    type: "number",
    default: 0.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "sampling",
    description: "Repeat alpha presence penalty (0.0 = disabled)",
  },
  {
    key: "frequency-penalty",
    iniKey: "frequencyPenalty",
    label: "Frequency Penalty",
    type: "number",
    default: 0.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "sampling",
    description: "Repeat alpha frequency penalty (0.0 = disabled)",
  },
  {
    key: "seed",
    iniKey: "seed",
    label: "Seed",
    type: "number",
    default: -1,
    min: -1,
    max: 4294967295,
    step: 1,
    group: "sampling",
    description: "RNG seed (-1 = random)",
  },
  {
    key: "grammar",
    iniKey: "grammar",
    label: "Grammar",
    type: "text",
    default: "",
    group: "sampling",
    description: "BNF-like grammar to constrain generations",
  },
  {
    key: "json-schema",
    iniKey: "jsonSchema",
    label: "JSON Schema",
    type: "text",
    default: "",
    group: "sampling",
    description: "JSON schema to constrain generations",
  },
  {
    key: "flash-attn",
    iniKey: "flashAttn",
    label: "Flash Attention",
    type: "select",
    default: "auto",
    options: ["on", "off", "auto"],
    group: "performance",
    description: "Set Flash Attention use",
  },
  {
    key: "cache-type-k",
    iniKey: "cacheTypeK",
    label: "Cache Type K",
    type: "select",
    default: "f16",
    options: ["f32", "f16", "bf16", "q8_0", "q4_0", "q4_1", "iq4_nl", "q5_0", "q5_1"],
    group: "performance",
    description: "KV cache data type for K",
  },
  {
    key: "cache-type-v",
    iniKey: "cacheTypeV",
    label: "Cache Type V",
    type: "select",
    default: "f16",
    options: ["f32", "f16", "bf16", "q8_0", "q4_0", "q4_1", "iq4_nl", "q5_0", "q5_1"],
    group: "performance",
    description: "KV cache data type for V",
  },
  {
    key: "rope-scaling",
    iniKey: "ropeScaling",
    label: "RoPE Scaling",
    type: "select",
    default: "linear",
    options: ["none", "linear", "yarn"],
    group: "context",
    description: "RoPE frequency scaling method",
  },
  {
    key: "rope-scale",
    iniKey: "ropeScale",
    label: "RoPE Scale",
    type: "number",
    default: 0,
    min: 0,
    max: 10,
    step: 0.01,
    group: "context",
    description: "RoPE context scaling factor (0 = model default)",
  },
  {
    key: "rope-freq-base",
    iniKey: "ropeFreqBase",
    label: "RoPE Freq Base",
    type: "number",
    default: 0,
    min: 0,
    max: 1000000,
    step: 1,
    group: "context",
    description: "RoPE base frequency (0 = model default)",
  },
  {
    key: "yarn-orig-ctx",
    iniKey: "yarnOrigCtx",
    label: "YaRN Orig Ctx",
    type: "number",
    default: 0,
    min: 0,
    max: 32768,
    step: 1,
    group: "context",
    description: "YaRN original context size (0 = model training context)",
  },
  {
    key: "yarn-ext-factor",
    iniKey: "yarnExtFactor",
    label: "YaRN Ext Factor",
    type: "number",
    default: -1.0,
    min: -1,
    max: 2,
    step: 0.01,
    group: "context",
    description: "YaRN extrapolation mix factor (-1 = full interpolation)",
  },
  {
    key: "yarn-attn-factor",
    iniKey: "yarnAttnFactor",
    label: "YaRN Attn Factor",
    type: "number",
    default: -1.0,
    min: -1,
    max: 2,
    step: 0.01,
    group: "context",
    description: "YaRN scale sqrt(t) or attention magnitude",
  },
  {
    key: "keep",
    iniKey: "keep",
    label: "Keep Tokens",
    type: "number",
    default: 0,
    min: 0,
    max: 32768,
    step: 1,
    group: "context",
    description: "Number of tokens to keep from initial prompt (0 = all except last, -1 = all)",
  },
  {
    key: "cont-batching",
    iniKey: "contBatching",
    label: "Continuous Batching",
    type: "boolean",
    default: true,
    group: "performance",
    description: "Enable continuous batching (dynamic batching)",
  },
  {
    key: "cache-reuse",
    iniKey: "cacheReuse",
    label: "Cache Reuse",
    type: "number",
    default: 0,
    min: 0,
    max: 8192,
    step: 1,
    group: "performance",
    description: "Min chunk size to attempt reusing from cache via KV shifting",
  },
  {
    key: "parallel",
    iniKey: "parallel",
    label: "Parallel Slots",
    type: "number",
    default: -1,
    min: -1,
    max: 16,
    step: 1,
    group: "server",
    description: "Number of server slots (-1 = auto)",
  },
  {
    key: "draft-max",
    iniKey: "draftMax",
    label: "Draft Max",
    type: "number",
    default: 16,
    min: 0,
    max: 256,
    step: 1,
    group: "speculative",
    description: "Max tokens to draft for speculative decoding",
  },
  {
    key: "draft-min",
    iniKey: "draftMin",
    label: "Draft Min",
    type: "number",
    default: 0,
    min: 0,
    max: 256,
    step: 1,
    group: "speculative",
    description: "Min draft tokens to use for speculative decoding",
  },
  {
    key: "draft-p-min",
    iniKey: "draftPMin",
    label: "Draft P Min",
    type: "number",
    default: 0.8,
    min: 0,
    max: 1,
    step: 0.01,
    group: "speculative",
    description: "Min speculative decoding probability",
  },
  {
    key: "ctx-size-draft",
    iniKey: "ctxSizeDraft",
    label: "Draft Context Size",
    type: "number",
    default: 0,
    min: 0,
    max: 32768,
    step: 1,
    group: "speculative",
    description: "Draft model context size (0 = loaded from model)",
  },
  {
    key: "n-gpu-layers-draft",
    iniKey: "nGpuLayersDraft",
    label: "Draft GPU Layers",
    type: "number",
    default: -1,
    min: -1,
    max: 256,
    step: 1,
    group: "speculative",
    description: "Max draft model layers in VRAM (-1 = auto)",
  },
  {
    key: "cpu-moe",
    iniKey: "cpuMoe",
    label: "CPU MoE",
    type: "boolean",
    default: false,
    group: "hardware",
    description: "Keep all MoE weights in CPU",
  },
  {
    key: "n-cpu-moe",
    iniKey: "nCpuMoe",
    label: "N CPU MoE",
    type: "number",
    default: 0,
    min: 0,
    max: 128,
    step: 1,
    group: "hardware",
    description: "Keep MoE weights of first N layers in CPU",
  },
  {
    key: "pooling",
    iniKey: "pooling",
    label: "Pooling",
    type: "select",
    default: "",
    options: ["", "none", "mean", "cls", "last", "rank"],
    group: "embeddings",
    description: "Pooling type for embeddings",
  },
  {
    key: "reasoning-format",
    iniKey: "reasoningFormat",
    label: "Reasoning Format",
    type: "select",
    default: "auto",
    options: ["none", "auto", "deepseek", "deepseek-legacy"],
    group: "reasoning",
    description: "Controls thought tags in response",
  },
  {
    key: "dry-sequence-breaker",
    iniKey: "drySequenceBreaker",
    label: "DRY Sequence Breaker",
    type: "text",
    default: "",
    group: "sampling",
    description: "Add sequence breaker for DRY sampling (none = no breakers)",
  },
];

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

  init() {}

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
    // Load available models from state before rendering
    let availableModels = window.stateManager?.get("models") || [];

    // If no models in state, try to fetch them
    if (availableModels.length === 0) {
      try {
        const result = await stateManager.getModels();
        availableModels = result.models || [];
        stateManager.set("models", availableModels);
      } catch (error) {
        console.error("[PRESETS] Failed to fetch models on render:", error.message);
      }
    }

    this.comp = new PresetsPage({
      presetsService: this.presetsService,
      controller: this,
      availableModels,
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
    // Subscribe to model changes from models page
    if (window.stateManager) {
      this.unsubscribers.push(
        window.stateManager.subscribe("models", (models) => {
          if (this.comp) {
            this.comp.state.availableModels = models || [];
            if (this.comp.state.selectedPreset) {
              this.comp._updateEditor();
            }
          }
        })
      );
    }
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
      if (this.comp) {
        // Update state directly without re-rendering
        this.comp.state.presets = presets;
        this.comp.state.loading = false;

        // Update DOM without re-rendering
        this.comp._updatePresetsList();

        // Auto-select first preset
        if (presets.length > 0 && !this.comp.state.selectedPreset) {
          this.comp._emit("preset:select", presets[0].name);
        }
      }

      // Load available models from state manager
      this.loadAvailableModels();
    } catch (error) {
      console.error("[PRESETS] Load presets error:", error.message);
      showNotification("Failed to load presets", "error");
      if (this.comp) {
        this.comp.state.loading = false;
      }
    }
  }

  async loadAvailableModels() {
    try {
      const models = stateManager.get("models") || [];
      if (this.comp) {
        this.comp.state.availableModels = models;
        // Re-render editor to update model dropdown
        if (this.comp.state.selectedPreset) {
          this.comp._updateEditor();
        }
      }
    } catch (error) {
      console.error("[PRESETS] Load available models error:", error.message);
    }
  }

  async loadPresetData(preset) {
    const service = this._ensureService();
    if (!service) return;

    try {
      const [modelsResult, defaultsResult] = await Promise.all([
        service.getModelsFromPreset(preset.name),
        service.getDefaults(preset.name),
      ]);

      const models = modelsResult || {};
      const standaloneModels = [];

      // Only include models that are not the defaults section
      for (const modelName of Object.keys(models)) {
        if (modelName === "*") continue;
        standaloneModels.push({ name: modelName, fullName: modelName, ...models[modelName] });
      }

      if (this.comp) {
        this.comp._emit("preset:loaded", {
          preset,
          defaults: defaultsResult || {},
          standaloneModels,
        });
      }
    } catch (error) {
      console.error("[PRESETS] Load preset data error:", error.message);
      showNotification("Failed to load preset data", "error");
    }
  }
}

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
      parameterFilter: "",
    };
    this.controller = props.controller;
    this._domCache = new Map();
    this._eventsBounded = false;
  }

  _getService() {
    return this._presetsService || (this.controller ? this.controller.presetsService : null);
  }

  // Event bus for DOM updates (no re-renders)
  _emit(event, data) {
    if (!this._el) return;

    switch (event) {
    case "preset:select":
      this._handlePresetSelect(data);
      break;
    case "preset:loaded":
      this._handlePresetLoaded(data);
      break;
    case "presets:update":
      this._updatePresetsList(data);
      break;
    case "defaults:toggle":
      this._toggleDefaultsSection();
      break;
    case "param:add":
      this._handleAddParam(data);
      break;
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

  _updatePresetsList() {
    const container = this._domCache.get("presets-items");
    if (!container) return;

    let html = "";
    for (const preset of this.state.presets) {
      const isActive = this.state.selectedPreset?.name === preset.name;
      html += `
        <div class="preset-item ${isActive ? "active" : ""}" data-preset-name="${preset.name}">
          <span class="preset-name">${preset.name}</span>
          ${preset.name !== "default" ? `<span class="preset-delete" data-preset-name="${preset.name}">×</span>` : ""}
        </div>
      `;
    }
    container.innerHTML = html;
    this._bindPresetEvents();
  }

  _updateEditor() {
    const editor = this._domCache.get("editor");
    if (!editor) return;

    // Show loading state
    editor.innerHTML = "<div style=\"padding: 20px; text-align: center;\">Loading editor...</div>";

    // Defer update to avoid blocking UI
    requestAnimationFrame(() => this._renderEditor());
  }

  _renderEditor() {
    const editor = this._domCache.get("editor");
    if (!editor) return;

    // Build param options only for parameters not yet added to defaults
    const defaults = this.state.globalDefaults || {};
    const addedParamKeys = Object.keys(defaults)
      .map((iniKey) => {
        // Find the param with this iniKey
        return LLAMA_PARAMS.find((p) => p.iniKey === iniKey)?.key;
      })
      .filter(Boolean);

    const paramOptions = LLAMA_PARAMS.filter((p) => !addedParamKeys.includes(p.key))
      .map((p) => `<option value="${p.key}">${p.label} (${p.group})</option>`)
      .join("");

    editor.innerHTML = `
      <div class="editor-header">
        <h2>${this.state.selectedPreset.name}</h2>
        <span class="preset-type-badge">${this.state.selectedPreset.name === "default" ? "Built-in" : "Custom"}</span>
      </div>

      <div class="section defaults-section">
        <div class="section-header" id="header-defaults">
          <span class="section-icon">★</span>
          <span class="section-title">Global Defaults</span>
          <span class="section-toggle">${this.state.expandedDefaults ? "▼" : "▶"}</span>
        </div>
        ${
  this.state.expandedDefaults
    ? `
          <div class="section-content" id="content-defaults">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" placeholder="Filter parameters by name..." id="param-filter">
            </div>
            ${
  Object.keys(this.state.globalDefaults || {}).length > 0
    ? `
             <div class="added-params-section">
               <strong>Added Parameters:</strong>
               <div class="added-params-list">
                 ${Object.entries(this.state.globalDefaults)
    .map(([key, value]) => {
      const param = LLAMA_PARAMS.find((p) => p.iniKey === key);
      // Format value for display: handle arrays/strings properly
      let displayValue = value;
      if (typeof value === "string") {
        displayValue = value;
      } else if (Array.isArray(value)) {
        displayValue = value.join(",");
      } else {
        displayValue = String(value);
      }
      // Escape HTML special characters in the value
      const escaped = displayValue
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      return `
                        <div class="param-item-display" data-param-key="${key}">
                          <div class="param-name"><strong>${param?.label || key}</strong></div>
                          <div class="param-controls">
                            <input type="text" class="param-value-input" value="${escaped}" data-param-key="${key}" placeholder="Value">
                            <button class="btn-param-delete" data-param-key="${key}" title="Delete parameter">×</button>
                          </div>
                        </div>
                      `;
    })
    .join("")}
               </div>
             </div>
            `
    : "<p class=\"defaults-hint\">Default preset starts empty - all default values are in llama-router</p>"
}
            <label class="add-param-label">Add Parameter to Defaults</label>
            <select class="param-add-select" id="select-add-param" data-section="defaults" data-name="*">
              <option value="">-- Select parameter to add --</option>
              ${paramOptions}
            </select>
          </div>
        `
    : ""
}
      </div>

      <div class="section standalone-section">
        <h3>Models</h3>
        <div class="add-model-controls">
          <select class="model-select" id="select-add-model">
            <option value="">-- Select a model --</option>
            ${(this.state.availableModels || [])
    .map(
      (model) =>
        `<option value="${this._escapeHtml(model.name)}">${this._escapeHtml(model.name)}</option>`
    )
    .join("")}
          </select>
          <button class="btn btn-secondary" id="btn-add-standalone">+ Add Selected Model</button>
        </div>
        <div class="standalone-list" id="standalone-list">
          ${this.state.standaloneModels.length === 0 ? "<p>No models added yet</p>" : this._renderStandaloneHtml()}
        </div>
      </div>
    `;

    this._bindEditorEvents();
    this._bindParamInputs();
  }

  _bindParamInputs() {
    const inputs = this._el?.querySelectorAll(".param-value-input") || [];
    inputs.forEach((input) => {
      input.onchange = (e) => this._handleParamChange(e.target);
      input.onblur = (e) => this._handleParamChange(e.target);
    });

    // Bind delete buttons
    const deleteButtons = this._el?.querySelectorAll(".btn-param-delete") || [];
    deleteButtons.forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        const paramKey = btn.dataset.paramKey;
        this._handleDeleteParam(paramKey);
      };
    });
  }

  async _handleParamChange(input) {
    const paramKey = input.dataset.paramKey;
    const newValue = input.value;

    if (!paramKey || !this.state.selectedPreset) return;

    try {
      // Find the param to get its type and details
      const param = LLAMA_PARAMS.find((p) => p.iniKey === paramKey);
      if (!param) return;

      // Parse the value based on parameter type
      let value;
      if (param.type === "number") {
        value = parseFloat(newValue);
        if (isNaN(value)) {
          throw new Error(`Invalid number: ${newValue}`);
        }
      } else if (param.type === "select") {
        value = newValue; // Select values stay as strings
      } else {
        // For text and other types, keep as string
        value = newValue;
      }

      // Update the parameter
      await this._getService().addModel(this.state.selectedPreset.name, "*", {
        [paramKey]: value,
      });

      // Update state
      this.state.globalDefaults[paramKey] = value;
      showNotification("Parameter updated", "success");
    } catch (error) {
      console.error("[PRESETS] Parameter update error:", error);
      showNotification(`Error updating parameter: ${error.message}`, "error");
    }
  }

  async _handleDeleteParam(paramKey) {
    if (!paramKey || !this.state.selectedPreset) return;

    const param = LLAMA_PARAMS.find((p) => p.iniKey === paramKey);
    if (!param) return;

    try {
      // Create new defaults without the parameter to delete
      const newDefaults = { ...this.state.globalDefaults };
      delete newDefaults[paramKey];

      // Update the defaults in the preset
      await this._getService().updateDefaults(this.state.selectedPreset.name, newDefaults);

      // Update state
      this.state.globalDefaults = newDefaults;
      showNotification(`Parameter "${param.label}" deleted`, "success");

      // Re-render editor to update the UI
      this._updateEditor();
    } catch (error) {
      console.error("[PRESETS] Delete parameter error:", error);
      showNotification(`Error deleting parameter: ${error.message}`, "error");
    }
  }

  _escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  _renderStandaloneHtml() {
    return this.state.standaloneModels
      .map(
        (model) => `
      <div class="model-item" data-model="${model.name}">
        <span>📄</span>
        <span>${model.name}</span>
        <span class="model-toggle">▶</span>
      </div>
    `
      )
      .join("");
  }

  _toggleDefaultsSection() {
    this.state.expandedDefaults = !this.state.expandedDefaults;
    this._updateEditor();
  }

  _bindPresetEvents() {
    const container = this._domCache.get("presets-items");
    if (!container) return;

    container.querySelectorAll(".preset-item").forEach((item) => {
      item.onclick = () => this._emit("preset:select", item.dataset.presetName);
    });

    container.querySelectorAll(".preset-delete").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this._handleDeletePreset(btn.dataset.presetName);
      };
    });
  }

  _bindEditorEvents() {
    // Defaults toggle
    const defaultsHeader = document.getElementById("header-defaults");
    defaultsHeader && (defaultsHeader.onclick = () => this._emit("defaults:toggle"));

    // Add param dropdown
    const addParamSelect = document.getElementById("select-add-param");
    if (addParamSelect) {
      addParamSelect.onchange = (e) => {
        if (e.target.value) {
          this._emit("param:add", {
            paramKey: e.target.value,
            section: e.target.dataset.section,
            name: e.target.dataset.name,
          });
          e.target.value = "";
        }
      };
    }

    // Add standalone button
    const addStandaloneBtn = document.getElementById("btn-add-standalone");
    addStandaloneBtn && (addStandaloneBtn.onclick = () => this._handleAddStandalone());

    // Filter input
    const filterInput = document.getElementById("param-filter");
    filterInput && (filterInput.oninput = (e) => this._filterParams(e.target.value));
  }

  _filterParams(query) {
    const items = this._el?.querySelectorAll(".param-item") || [];
    const lower = query.toLowerCase();
    items.forEach((item) => {
      const label = item.querySelector(".param-label")?.textContent.toLowerCase() || "";
      item.style.display = label.includes(lower) ? "" : "none";
    });
  }

  async _handleAddParam(data) {
    const { paramKey, section, name } = data;
    const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
    if (!param) return;

    const modelName = section === "defaults" ? "*" : name;
    if (!modelName || !this.state.selectedPreset) return;

    try {
      await this._getService().addModel(this.state.selectedPreset.name, modelName, {
        [param.iniKey]: param.default,
      });
      showNotification(`Parameter "${param.label}" added`, "success");

      // Optimistically update the UI immediately
      if (section === "defaults") {
        this.state.globalDefaults[param.iniKey] = param.default;
        this._updateEditor(); // Re-render editor with new parameter
      } else {
        // For non-defaults, reload full data
        this.controller?.loadPresetData(this.state.selectedPreset);
      }
    } catch (error) {
      console.error("[PRESETS] Add param error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  async _handleDeletePreset(name) {
    if (!confirm(`Delete preset "${name}"?`)) return;

    try {
      await this._getService().deletePreset(name);
      showNotification(`Preset "${name}" deleted`, "success");
      const newPresets = this.state.presets.filter((p) => p.name !== name);
      this.setState({ presets: newPresets });

      if (this.state.selectedPreset?.name === name) {
        this.state.selectedPreset = newPresets[0] || null;
        if (this.state.selectedPreset) {
          this._emit("preset:select", this.state.selectedPreset.name);
        } else {
          this._domCache.get("editor").innerHTML =
            "<div class=\"empty-state\">Select a preset to edit</div>";
        }
      }
    } catch (error) {
      console.error("[PRESETS] Delete error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  async _handleAddStandalone() {
    const select = document.getElementById("select-add-model");
    const modelName = select?.value?.trim();

    if (!modelName) {
      showNotification("Please select a model from the dropdown", "warning");
      return;
    }

    try {
      await this._getService().addModel(this.state.selectedPreset.name, modelName, {});
      showNotification(`Model "${modelName}" added`, "success");
      select.value = "";
      this.controller?.loadPresetData(this.state.selectedPreset);
    } catch (error) {
      console.error("[PRESETS] Add model error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  render() {
    return Component.h(
      "div",
      { className: "presets-page" },
      Component.h(
        "div",
        { className: "presets-container" },
        Component.h(
          "div",
          { className: "presets-list" },
          Component.h(
            "div",
            { className: "presets-card-header" },
            Component.h("h1", {}, "Model Presets"),
            Component.h("p", { className: "presets-subtitle" }, "Configure llama.cpp parameters")
          ),
          Component.h("h3", { className: "list-title" }, "Presets"),
          Component.h(
            "button",
            { className: "btn btn-secondary add-preset-btn", id: "btn-new-preset" },
            "+ New Preset"
          ),
          Component.h("div", {
            className: "presets-items",
            ref: (el) => this._domCache.set("presets-items", el),
          })
        ),
        Component.h(
          "div",
          { className: "presets-editor", ref: (el) => this._domCache.set("editor", el) },
          Component.h("div", { className: "empty-state" }, "Select a preset to edit")
        )
      )
    );
  }

  bindEvents() {
    // New preset button
    const newBtn = document.getElementById("btn-new-preset");
    newBtn && (newBtn.onclick = () => this._handleNewPreset());
  }

  async _handleNewPreset() {
    const name = prompt("Preset name:");
    if (!name) return;

    try {
      await this._getService().createPreset(name);
      showNotification(`Preset "${name}" created with empty configuration`, "success");
      const newPresets = [...this.state.presets, { name }];
      this.setState({ presets: newPresets });
      this._emit("preset:select", name);
    } catch (error) {
      console.error("[PRESETS] Create error:", error);
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  didMount() {
    // Loading is handled by controller's loadPresetsData()
    // Just ensure refs are cached
  }
}

window.PresetsController = PresetsController;
window.PresetsPage = PresetsPage;
window.LLAMA_PARAMS = LLAMA_PARAMS;
