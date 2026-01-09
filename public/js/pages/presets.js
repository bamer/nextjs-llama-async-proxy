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
    key: "dry-multiplier",
    iniKey: "dryMultiplier",
    label: "DRY Multiplier",
    type: "number",
    default: 0.0,
    min: 0,
    max: 2,
    step: 0.01,
    group: "sampling",
    description: "DRY sampling multiplier (0.0 = disabled)",
  },
  {
    key: "dry-base",
    iniKey: "dryBase",
    label: "DRY Base",
    type: "number",
    default: 1.75,
    min: 1,
    max: 3,
    step: 0.01,
    group: "sampling",
    description: "DRY sampling base value",
  },
  {
    key: "dry-allowed-length",
    iniKey: "dryAllowedLength",
    label: "DRY Allowed Length",
    type: "number",
    default: 2,
    min: 0,
    max: 100,
    step: 1,
    group: "sampling",
    description: "Allowed length for DRY sampling",
  },
  {
    key: "dry-penalty-last-n",
    iniKey: "dryPenaltyLastN",
    label: "DRY Penalty Last N",
    type: "number",
    default: -1,
    min: -1,
    max: 32768,
    step: 1,
    group: "sampling",
    description: "DRY penalty for last n tokens (-1 = disable)",
  },
  {
    key: "dynatemp-range",
    iniKey: "dynatempRange",
    label: "Dynatemp Range",
    type: "number",
    default: 0.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "sampling",
    description: "Dynamic temperature range (0.0 = disabled)",
  },
  {
    key: "dynatemp-exp",
    iniKey: "dynatempExp",
    label: "Dynatemp Exp",
    type: "number",
    default: 1.0,
    min: 0,
    max: 2,
    step: 0.01,
    group: "sampling",
    description: "Dynamic temperature exponent",
  },
  {
    key: "mirostat",
    iniKey: "mirostat",
    label: "Mirostat",
    type: "number",
    default: 0,
    min: 0,
    max: 2,
    step: 1,
    group: "sampling",
    description: "Use Mirostat sampling (0 = disabled, 1 = Mirostat, 2 = Mirostat 2.0)",
  },
  {
    key: "mirostat-lr",
    iniKey: "mirostatLr",
    label: "Mirostat LR",
    type: "number",
    default: 0.1,
    min: 0,
    max: 1,
    step: 0.001,
    group: "sampling",
    description: "Mirostat learning rate (eta)",
  },
  {
    key: "mirostat-ent",
    iniKey: "mirostatEnt",
    label: "Mirostat Ent",
    type: "number",
    default: 5.0,
    min: 0,
    max: 10,
    step: 0.1,
    group: "sampling",
    description: "Mirostat target entropy (tau)",
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
    key: "kv-offload",
    iniKey: "kvOffload",
    label: "KV Offload",
    type: "boolean",
    default: true,
    group: "performance",
    description: "Enable KV cache offloading",
  },
  {
    key: "no-mmap",
    iniKey: "noMmap",
    label: "Disable MMAP",
    type: "boolean",
    default: false,
    group: "performance",
    description: "Disable memory-mapping (slower load, may reduce pageouts)",
  },
  {
    key: "mlock",
    iniKey: "mlock",
    label: "MLock",
    type: "boolean",
    default: false,
    group: "performance",
    description: "Force system to keep model in RAM",
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
    key: "yarn-beta-slow",
    iniKey: "yarnBetaSlow",
    label: "YaRN Beta Slow",
    type: "number",
    default: -1.0,
    min: -1,
    max: 2,
    step: 0.01,
    group: "context",
    description: "YaRN high correction dim or alpha",
  },
  {
    key: "yarn-beta-fast",
    iniKey: "yarnBetaFast",
    label: "YaRN Beta Fast",
    type: "number",
    default: -1.0,
    min: -1,
    max: 2,
    step: 0.01,
    group: "context",
    description: "YaRN low correction dim or beta",
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
    key: "swa-full",
    iniKey: "swaFull",
    label: "SWA Full",
    type: "boolean",
    default: false,
    group: "context",
    description: "Use full-size SWA cache",
  },
  {
    key: "logit-bias",
    iniKey: "logitBias",
    label: "Logit Bias",
    type: "text",
    default: "",
    group: "sampling",
    description: "Modify token likelihood (format: TOKEN_ID(+/-)BIAS)",
  },
  {
    key: "ignore-eos",
    iniKey: "ignoreEos",
    label: "Ignore EOS",
    type: "boolean",
    default: false,
    group: "sampling",
    description: "Ignore end of stream token and continue generating",
  },
  {
    key: "top-nsigma",
    iniKey: "topNsigma",
    label: "Top N Sigma",
    type: "number",
    default: -1.0,
    min: -1,
    max: 10,
    step: 0.1,
    group: "sampling",
    description: "Top-n-sigma sampling (-1 = disabled)",
  },
  {
    key: "xtc-probability",
    iniKey: "xtcProbability",
    label: "XTC Probability",
    type: "number",
    default: 0.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "sampling",
    description: "XTC probability (0 = disabled)",
  },
  {
    key: "xtc-threshold",
    iniKey: "xtcThreshold",
    label: "XTC Threshold",
    type: "number",
    default: 0.1,
    min: 0,
    max: 1,
    step: 0.01,
    group: "sampling",
    description: "XTC threshold (1 = disabled)",
  },
  {
    key: "min-p-keep",
    iniKey: "minPKeep",
    label: "Min P Keep",
    type: "number",
    default: 0,
    min: 0,
    max: 32768,
    step: 1,
    group: "sampling",
    description: "Min P keeps at least this many tokens",
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
      Component.h(
        "button",
        { className: "btn btn-secondary add-preset-btn", "data-action": "new-preset" },
        "+ New Preset"
      ),
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
            // Always in edit mode for defaults
            this.renderEditableParams(editingData, "defaults", null)
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
            // Group parameters section - always editable
            Component.h(
              "div",
              { className: "group-params-section" },
              Component.h("h4", { className: "subsection-title" }, "Group Parameters"),
              this.renderEditableParams(editingData, "group", group.name)
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
            // Standalone models always show editable params
            groupName === null
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
    const filteredParams = LLAMA_PARAMS.filter(
      (param) =>
        param.label.toLowerCase().includes(filter) || param.key.toLowerCase().includes(filter)
    );

    return Component.h(
      "div",
      { className: "params-list" },
      filteredParams.map((param) => {
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
    const setParams = LLAMA_PARAMS.filter((param) => data[param.iniKey] !== undefined);
    const availableToAdd = LLAMA_PARAMS.filter((param) => data[param.iniKey] === undefined);
    const isDefaults = sectionType === "defaults";
    const paramsToShow = isDefaults ? [] : setParams;

    return Component.h(
      "div",
      { className: "params-list" },
      paramsToShow.length > 0
        ? paramsToShow.map((param) => {
            const value = data[param.iniKey];
            const displayValue = value !== undefined && value !== null ? value : param.default;

            return Component.h(
              "div",
              {
                className: `param-item param-${param.group} param-editable`,
                "data-param-key": param.key,
              },
              Component.h(
                "div",
                { className: "param-header" },
                Component.h("label", { className: "param-label" }, param.label),
                Component.h(
                  "button",
                  {
                    className: "btn-remove-param",
                    "data-action": "remove-param",
                    "data-param": param.key,
                    "data-section": sectionType,
                    "data-name": sectionName,
                    title: "Remove parameter",
                  },
                  "×"
                )
              ),
              param.type === "select"
                ? Component.h(
                    "select",
                    {
                      className: "param-input",
                      "data-section": sectionType,
                      "data-name": sectionName,
                      "data-param": param.key,
                    },
                    param.options.map((opt) =>
                      Component.h(
                        "option",
                        { value: opt, selected: String(displayValue) === opt },
                        opt
                      )
                    )
                  )
                : Component.h("input", {
                    type: param.type === "boolean" ? "checkbox" : param.type,
                    className: "param-input",
                    step: param.step || (param.type === "number" ? "0.01" : "1"),
                    min: param.min !== undefined ? param.min : undefined,
                    max: param.max !== undefined ? param.max : undefined,
                    value:
                      displayValue !== undefined
                        ? displayValue
                        : param.type === "boolean"
                          ? false
                          : "",
                    "data-section": sectionType,
                    "data-name": sectionName,
                    "data-param": param.key,
                  }),
              Component.h(
                "div",
                { className: "param-meta" },
                (param.min !== undefined || param.max !== undefined) &&
                  Component.h(
                    "span",
                    { className: "param-range" },
                    param.min !== undefined && param.max !== undefined
                      ? `Range: ${param.min} - ${param.max}`
                      : param.min !== undefined
                        ? `Min: ${param.min}`
                        : `Max: ${param.max}`
                  ),
                param.default !== undefined &&
                  Component.h("span", { className: "param-default" }, `Default: ${param.default}`),
                param.description &&
                  Component.h(
                    "span",
                    { className: "param-description", title: param.description },
                    param.description
                  )
              )
            );
          })
        : null,
      !isDefaults && availableToAdd.length > 0
        ? Component.h(
            "div",
            { className: "add-param-section" },
            Component.h("label", {}, "Add Parameter"),
            Component.h(
              "select",
              {
                className: "param-add-select",
                "data-action": "add-param-select",
                "data-section": sectionType,
                "data-name": sectionName,
                defaultValue: "",
              },
              Component.h("option", { value: "" }, "-- Select parameter to add --"),
              availableToAdd.map((param) =>
                Component.h("option", { value: param.key }, `${param.label} (${param.group})`)
              )
            )
          )
        : null,
      isDefaults
        ? Component.h(
            "div",
            { className: "param-actions defaults-actions" },
            Component.h(
              "p",
              { className: "defaults-hint" },
              "Default preset starts empty - all default values are in llama-router"
            ),
            Component.h("label", { className: "add-param-label" }, "Add Parameter to Defaults"),
            Component.h(
              "select",
              {
                className: "param-add-select",
                "data-action": "add-param-select",
                "data-section": sectionType,
                "data-name": sectionName,
                defaultValue: "",
              },
              Component.h("option", { value: "" }, "-- Select parameter to add --"),
              LLAMA_PARAMS.map((param) =>
                Component.h("option", { value: param.key }, `${param.label} (${param.group})`)
              )
            )
          )
        : sectionType === "group" || sectionType === "model"
          ? Component.h(
              "div",
              { className: "param-actions" },
              Component.h(
                "p",
                { className: "section-hint" },
                sectionType === "group" && sectionName
                  ? `Models in group "${sectionName}" inherit group parameters. To override, move to standalone.`
                  : "Model parameters override group defaults."
              ),
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
          : null
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
      "change [data-action=add-param-select]": "handleAddParam",
      "click [data-action=remove-param]": "handleRemoveParam",
      "change [data-action=new-model-select]": "handleModelSelectChange",
      "input [data-action=search-params]": "handleSearchParams",
      "input [data-action=search-defaults]": "handleSearchParams",
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
        "Models in groups inherit group parameters. Edit the group or move model to standalone to set parameters.",
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

    const config = {};
    const inputs = this._el?.querySelectorAll(".param-input") || [];

    for (const input of inputs) {
      const paramKey = input.dataset.param;
      const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
      if (!param) continue;

      let value;
      if (param.type === "boolean") {
        value = input.checked;
      } else if (param.type === "select") {
        value = input.value;
      } else {
        value = input.value?.trim();
      }

      if (value !== undefined && value !== "" && value !== null) {
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

  handleAddParam(e) {
    const select = e.target.closest("[data-action=add-param-select]");
    if (!select || !select.value) return;

    const paramKey = select.value;
    const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
    if (!param) return;

    // Add parameter with its default value to editingData
    const newData = { ...this.state.editingData };
    newData[param.iniKey] = param.default;

    this.setState({
      editingData: newData,
    });

    // Reset select
    setTimeout(() => {
      select.value = "";
    }, 0);
  }

  handleRemoveParam(e) {
    const btn = e.target.closest("[data-action=remove-param]");
    if (!btn) return;

    const paramKey = btn.dataset.param;
    const param = LLAMA_PARAMS.find((p) => p.key === paramKey);
    if (!param) return;

    // Remove parameter from editingData
    const newData = { ...this.state.editingData };
    delete newData[param.iniKey];

    this.setState({
      editingData: newData,
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
      // 2. Entries explicitly marked as groups (having is_group flag)
      const groupNames = new Set();

      for (const modelName of Object.keys(models)) {
        if (modelName === "*") continue;

        if (modelName.includes("/")) {
          // model/submodel format - this is a model in a group
          groupNames.add(modelName.split("/")[0]);
        } else if (models[modelName].is_group) {
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
          // Merge config if present (exclude internal is_group flag)
          const { is_group, ...cleanConfig } = modelConfig;
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
        showNotification(`Preset "${name}" created with empty configuration`, "success");
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
    // Mark this as a group with the is_group flag
    this._getService()
      .addModel(this.state.selectedPreset.name, name.trim(), { is_group: true })
      .then(() => {
        showNotification(`Group "${name}" created. Now add parameters.`, "success");
        return this.loadPresetData(this.state.selectedPreset);
      })
      .then(() => {
        const groupName = name.trim();
        // Expand the group and automatically start editing
        this.setState({
          expandedGroups: { ...this.state.expandedGroups, [groupName]: true },
          editingGroup: groupName,
          editingData: {}, // Start with empty parameters
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
      showNotification(`Model "${name}" created. Now add parameters.`, "success");
      await this.loadPresetData(this.state.selectedPreset);
      const fullKey = groupName ? `${groupName}/${name}` : name;
      // Expand the model and automatically start editing (only for standalone)
      this.setState({
        expandedModels: { ...this.state.expandedModels, [fullKey]: true },
        ...(groupName === "" && {
          editingModel: fullKey,
          editingData: {}, // Start with empty parameters
        }),
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
