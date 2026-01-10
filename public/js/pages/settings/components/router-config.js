/**
 * Router Configuration Component
 * Displays and manages router-specific settings
 */

class RouterConfig extends Component {
  constructor(props) {
    super(props);

    this.state = {
      maxModelsLoaded: props.maxModelsLoaded || 4,
      parallelSlots: props.parallelSlots || 1,
      ctx_size: props.ctx_size || 4096,
      gpuLayers: props.gpuLayers || 0,
    };
  }

  willReceiveProps(newProps) {
    // Update state from new props
    const updates = {};
    const newMaxModels = newProps.maxModelsLoaded || 4;
    const newParallelSlots = newProps.parallelSlots || 1;
    const newCtxSize = newProps.ctx_size || 4096;
    const newGpuLayers = newProps.gpuLayers || 0;

    if (newMaxModels !== this.state.maxModelsLoaded) updates.maxModelsLoaded = newMaxModels;
    if (newParallelSlots !== this.state.parallelSlots) updates.parallelSlots = newParallelSlots;
    if (newCtxSize !== this.state.ctx_size) updates.ctx_size = newCtxSize;
    if (newGpuLayers !== this.state.gpuLayers) updates.gpuLayers = newGpuLayers;

    if (Object.keys(updates).length > 0) {
      this.setState(updates);
    }
  }

  render() {
    return Component.h(
      "div",
      { className: "settings-section" },
      Component.h("h2", {}, "Router Configuration"),
      Component.h("p", { className: "section-desc" }, "Configure llama.cpp router behavior"),
      Component.h(
        "div",
        { className: "card" },
        Component.h(
          "div",
          { className: "router-grid" },
          // Max Models Loaded
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Max Models Loaded"),
            Component.h("input", {
              type: "number",
              min: "1",
              max: "16",
              value: this.state.maxModelsLoaded,
              id: "maxModelsLoaded",
              onChange: (e) => {
                const val = parseInt(e.target.value) || 4;
                this.setState({ maxModelsLoaded: val });
                this.props.onMaxModelsLoadedChange?.(val);
              },
            }),
            Component.h("small", {}, "Maximum number of models to keep in memory")
          ),
          // Parallel Slots
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Parallel Slots"),
            Component.h("input", {
              type: "number",
              min: "1",
              max: "16",
              value: this.state.parallelSlots,
              id: "parallelSlots",
              onChange: (e) => {
                const val = parseInt(e.target.value) || 1;
                this.setState({ parallelSlots: val });
                this.props.onParallelSlotsChange?.(val);
              },
            }),
            Component.h("small", {}, "Number of parallel processing slots")
          ),
          // Context Size
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Context Size"),
            Component.h("input", {
              type: "number",
              min: "512",
              max: "32768",
              step: "512",
              value: this.state.ctx_size,
              id: "ctx_size",
              onChange: (e) => {
                const val = parseInt(e.target.value) || 4096;
                this.setState({ ctx_size: val });
                this.props.onCtxSizeChange?.(val);
              },
            }),
            Component.h("small", {}, "Token context window size")
          ),
          // GPU Layers
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "GPU Layers"),
            Component.h("input", {
              type: "number",
              min: "0",
              max: "200",
              value: this.state.gpuLayers,
              id: "gpuLayers",
              onChange: (e) => {
                const val = parseInt(e.target.value) || 0;
                this.setState({ gpuLayers: val });
                this.props.onGpuLayersChange?.(val);
              },
            }),
            Component.h("small", {}, "Number of model layers to offload to GPU (0 = CPU only)")
          )
        )
      )
    );
  }
}

window.RouterConfig = RouterConfig;
