/**
 * Llama Router Config Component - Unified Configuration
 * Replaces RouterConfig, ServerPathsForm, and ModelDefaultsForm
 * Event-Driven DOM Updates with state subscriptions
 */

class LlamaRouterConfig extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.config = props.config || this._getDefaults();
    this.unsubscribers = [];
  }

  /**
   * Get default configuration values
   * @returns {Object} Default configuration
   */
  _getDefaults() {
    return {
      modelsPath: "",
      serverPath: "",
      host: "0.0.0.0",
      port: 8080,
      maxModelsLoaded: 4,
      parallelSlots: 1,
      ctxSize: 4096,
      gpuLayers: 0,
      threads: 4,
      batchSize: 512,
      temperature: 0.7,
      repeatPenalty: 1.1,
    };
  }

  onMount() {
    // Subscribe to routerConfig state changes
    this.unsubscribers.push(
      stateManager.subscribe("routerConfig", this._onConfigChange.bind(this))
    );
  }

  /**
   * Handle routerConfig state changes
   * @param {Object} config - New config from state
   */
  _onConfigChange(config) {
    if (config && typeof config === "object") {
      this.config = { ...this.config, ...config };
      this._updateUI();
    }
  }

  /**
   * Update form fields directly to match component state
   * Uses direct DOM manipulation for performance
   */
  _updateUI() {
    if (!this._el) return;

    const fields = [
      "modelsPath",
      "serverPath",
      "host",
      "port",
      "maxModelsLoaded",
      "parallelSlots",
      "ctxSize",
      "gpuLayers",
      "threads",
      "batchSize",
      "temperature",
      "repeatPenalty",
    ];

    fields.forEach((field) => {
      const input = this._el.querySelector(`[data-field="${field}"]`);
      if (input && this.config[field] !== undefined) {
        if (input.type === "checkbox") {
          input.checked = !!this.config[field];
        } else {
          input.value = this.config[field];
        }
      }
    });
  }

  bindEvents() {
    // Unified event delegation for all form fields
    this.on("change", "[data-field]", (e) => {
      const target = e.target;
      const field = target.dataset.field;

      if (field === undefined) return;

      // Get value based on input type
      let value;
      if (target.type === "checkbox") {
        value = target.checked;
      } else if (target.type === "number") {
        // Check if it's a float or int
        const parsed = target.step && target.step.includes(".")
          ? parseFloat(target.value)
          : parseInt(target.value, 10);
        value = isNaN(parsed) ? 0 : parsed;
      } else {
        value = target.value;
      }

      // Update local config
      this.config[field] = value;

      // Add visual feedback for changed value
      target.classList.add("changed");
      setTimeout(() => target.classList.remove("changed"), 500);

      // Call change callback if provided
      this.props.onChange?.(field, value);
    });
  }

  /**
   * Clean up subscriptions on destroy
   */
  destroy() {
    this.unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.warn("[LlamaRouterConfig] Error unsubscribing:", e);
      }
    });
    this.unsubscribers = [];
    super.destroy();
  }

  /**
   * Render a form field with label and help text
   * @param {string} field - Field name (data-field attribute)
   * @param {string} label - Field label text
   * @param {string} type - Input type (text, number)
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Form group element
   */
  _renderField(field, label, type, options = {}) {
    const {
      value = "",
      min,
      max,
      step,
      placeholder = "",
      helpText = "",
    } = options;

    return Component.h("div", { className: "form-group" }, [
      Component.h("label", { for: `router-${field}`, className: "field-label" }, label),
      Component.h("input", {
        type,
        id: `router-${field}`,
        "data-field": field,
        value: value,
        min,
        max,
        step,
        placeholder,
        className: "field-input",
      }),
      helpText ? Component.h("small", { className: "field-help" }, helpText) : null,
    ]);
  }

  render() {
    const c = this.config;

    return Component.h("div", { className: "settings-section" }, [
      Component.h("h2", { className: "section-title" }, "Llama Router Configuration"),
      Component.h("p", { className: "section-desc" }, "Configure llama.cpp router paths, network, and inference defaults"),

      // ===== Section 1: Paths =====
      Component.h("div", { className: "card settings-card" }, [
        Component.h("h3", { className: "card-title" }, "Paths"),
        Component.h("div", { className: "form-grid paths-grid" }, [
          this._renderField("modelsPath", "Models Path", "text", {
            value: c.modelsPath,
            placeholder: "/path/to/models",
            helpText: "Directory containing GGUF model files",
          }),
          this._renderField("serverPath", "Server Path", "text", {
            value: c.serverPath,
            placeholder: "/path/to/llama-server",
            helpText: "Path to llama-server binary",
          }),
        ]),
      ]),

      // ===== Section 2: Network =====
      Component.h("div", { className: "card settings-card" }, [
        Component.h("h3", { className: "card-title" }, "Network"),
        Component.h("div", { className: "form-grid network-grid" }, [
          this._renderField("host", "Host", "text", {
            value: c.host,
            placeholder: "0.0.0.0",
            helpText: "Listen interface (0.0.0.0 = all interfaces)",
          }),
          this._renderField("port", "Port", "number", {
            value: c.port,
            min: 1,
            max: 65535,
            helpText: "HTTP listen port",
          }),
        ]),
      ]),

      // ===== Section 3: Router Behavior =====
      Component.h("div", { className: "card settings-card" }, [
        Component.h("h3", { className: "card-title" }, "Router Behavior"),
        Component.h("div", { className: "form-grid router-grid" }, [
          this._renderField("maxModelsLoaded", "Max Models", "number", {
            value: c.maxModelsLoaded,
            min: 1,
            max: 16,
            helpText: "Maximum models in memory",
          }),
          this._renderField("parallelSlots", "Parallel Slots", "number", {
            value: c.parallelSlots,
            min: 1,
            max: 16,
            helpText: "Processing slots",
          }),
        ]),
      ]),

      // ===== Section 4: Inference Defaults =====
      Component.h("div", { className: "card settings-card" }, [
        Component.h("h3", { className: "card-title" }, "Inference Defaults"),
        Component.h("div", { className: "form-grid inference-grid" }, [
          this._renderField("ctxSize", "Context Size", "number", {
            value: c.ctxSize,
            min: 512,
            max: 32768,
            step: 512,
            helpText: "Token window size",
          }),
          this._renderField("gpuLayers", "GPU Layers", "number", {
            value: c.gpuLayers,
            min: 0,
            max: 200,
            helpText: "GPU layers (0 = CPU)",
          }),
          this._renderField("threads", "Threads", "number", {
            value: c.threads,
            min: 1,
            max: 64,
            helpText: "CPU threads",
          }),
          this._renderField("batchSize", "Batch Size", "number", {
            value: c.batchSize,
            min: 1,
            max: 8192,
            helpText: "Processing batch",
          }),
          this._renderField("temperature", "Temperature", "number", {
            value: c.temperature,
            min: 0,
            max: 2,
            step: 0.1,
            helpText: "Response randomness",
          }),
          this._renderField("repeatPenalty", "Repeat Penalty", "number", {
            value: c.repeatPenalty,
            min: 0,
            max: 2,
            step: 0.1,
            helpText: "Token repetition",
          }),
        ]),
      ]),
    ]);
  }
}

window.LlamaRouterConfig = LlamaRouterConfig;
