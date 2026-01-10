/**
 * Router Configuration Component - Event-Driven DOM Updates
 */

class RouterConfig extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.maxModelsLoaded = props.maxModelsLoaded || 4;
    this.parallelSlots = props.parallelSlots || 1;
    this.ctx_size = props.ctx_size || 4096;
    this.gpuLayers = props.gpuLayers || 0;
  }

  bindEvents() {
    // Max models loaded
    this.on("change", "#maxModelsLoaded", (e) => {
      const val = parseInt(e.target.value) || 4;
      this.maxModelsLoaded = val;
      this._updateUI();
      this.props.onMaxModelsLoadedChange?.(val);
    });

    // Parallel slots
    this.on("change", "#parallelSlots", (e) => {
      const val = parseInt(e.target.value) || 1;
      this.parallelSlots = val;
      this._updateUI();
      this.props.onParallelSlotsChange?.(val);
    });

    // Context size
    this.on("change", "#ctx_size", (e) => {
      const val = parseInt(e.target.value) || 4096;
      this.ctx_size = val;
      this._updateUI();
      this.props.onCtxSizeChange?.(val);
    });

    // GPU layers
    this.on("change", "#gpuLayers", (e) => {
      const val = parseInt(e.target.value) || 0;
      this.gpuLayers = val;
      this._updateUI();
      this.props.onGpuLayersChange?.(val);
    });
  }

  _updateUI() {
    if (!this._el) return;

    const maxModelsInput = this._el.querySelector("#maxModelsLoaded");
    if (maxModelsInput && parseInt(maxModelsInput.value) !== this.maxModelsLoaded) {
      maxModelsInput.value = this.maxModelsLoaded;
    }

    const parallelSlotsInput = this._el.querySelector("#parallelSlots");
    if (parallelSlotsInput && parseInt(parallelSlotsInput.value) !== this.parallelSlots) {
      parallelSlotsInput.value = this.parallelSlots;
    }

    const ctxSizeInput = this._el.querySelector("#ctx_size");
    if (ctxSizeInput && parseInt(ctxSizeInput.value) !== this.ctx_size) {
      ctxSizeInput.value = this.ctx_size;
    }

    const gpuLayersInput = this._el.querySelector("#gpuLayers");
    if (gpuLayersInput && parseInt(gpuLayersInput.value) !== this.gpuLayers) {
      gpuLayersInput.value = this.gpuLayers;
    }
  }

  render() {
    return Component.h("div", { className: "settings-section" }, [
      Component.h("h2", {}, "Router Configuration"),
      Component.h("p", { className: "section-desc" }, "Configure llama.cpp router behavior"),
      Component.h("div", { className: "card" }, [
        Component.h("div", { className: "router-grid" }, [
          // Max Models Loaded
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Max Models Loaded"),
            Component.h("input", {
              type: "number",
              min: "1",
              max: "16",
              value: this.maxModelsLoaded,
              id: "maxModelsLoaded",
            }),
            Component.h("small", {}, "Maximum number of models to keep in memory"),
          ]),
          // Parallel Slots
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Parallel Slots"),
            Component.h("input", {
              type: "number",
              min: "1",
              max: "16",
              value: this.parallelSlots,
              id: "parallelSlots",
            }),
            Component.h("small", {}, "Number of parallel processing slots"),
          ]),
          // Context Size
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Context Size"),
            Component.h("input", {
              type: "number",
              min: "512",
              max: "32768",
              step: "512",
              value: this.ctx_size,
              id: "ctx_size",
            }),
            Component.h("small", {}, "Token context window size"),
          ]),
          // GPU Layers
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "GPU Layers"),
            Component.h("input", {
              type: "number",
              min: "0",
              max: "200",
              value: this.gpuLayers,
              id: "gpuLayers",
            }),
            Component.h("small", {}, "Number of model layers to offload to GPU (0 = CPU only)"),
          ]),
        ]),
      ]),
    ]);
  }
}

window.RouterConfig = RouterConfig;
