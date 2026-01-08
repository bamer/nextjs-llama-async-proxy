/**
 * GPU Details Component
 * Displays detailed information about all available GPUs
 */

class GpuDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gpuList: props.gpuList || [],
      expanded: false,
    };
    this.unsubscriber = null;
  }

  didMount() {
    // Subscribe to metrics changes to update GPU list
    this.unsubscriber = stateManager.subscribe("metrics", (metrics) => {
      const newList = metrics?.gpu?.list || [];
      if (JSON.stringify(newList) !== JSON.stringify(this.state.gpuList)) {
        this.setState({ gpuList: newList });
      }
    });
  }

  willDestroy() {
    if (this.unsubscriber) {
      this.unsubscriber();
    }
  }

  getEventMap() {
    return {
      "click .gpu-header": "handleToggle",
    };
  }

  handleToggle(event) {
    event.preventDefault();
    this.setState({ expanded: !this.state.expanded });
  }

  render() {
    const { gpuList, expanded } = this.state;

    if (!gpuList || gpuList.length === 0) {
      return Component.h(
        "div",
        { className: "gpu-details" },
        Component.h("p", { className: "gpu-no-data" }, "No GPU detected")
      );
    }

    return Component.h(
      "div",
      { className: `gpu-details ${expanded ? "expanded" : "collapsed"}` },
      // Summary header
      Component.h(
        "div",
        { className: "gpu-header", "data-action": "toggle-gpu" },
        Component.h("span", { className: "gpu-title" }, `GPU Devices (${gpuList.length})`),
        Component.h(
          "span",
          { className: `gpu-toggle ${expanded ? "open" : "closed"}` },
          expanded ? "▼" : "▶"
        )
      ),

      // Detailed GPU list
      expanded &&
        Component.h(
          "div",
          { className: "gpu-list" },
          gpuList.map((gpu, idx) =>
            Component.h(
              "div",
              {
                key: `gpu-${idx}`,
                className: `gpu-card ${gpu.usage > 75 || gpu.memoryUsed / gpu.memoryTotal > 0.75 ? "high-usage" : ""}`,
              },
              // GPU name and vendor
              Component.h(
                "div",
                { className: "gpu-info" },
                Component.h("strong", {}, gpu.name),
                Component.h("span", { className: "gpu-vendor" }, gpu.vendor)
              ),

              // Usage bar
              Component.h(
                "div",
                { className: "gpu-metric" },
                Component.h("span", {}, "Usage"),
                Component.h(
                  "div",
                  { className: "metric-bar" },
                  Component.h("div", {
                    className: "metric-fill",
                    style: `width: ${Math.min(gpu.usage, 100)}%`,
                  }),
                  Component.h("span", { className: "metric-text" }, `${gpu.usage.toFixed(1)}%`)
                )
              ),

              // Memory bar
              gpu.memoryTotal > 0 &&
                Component.h(
                  "div",
                  { className: "gpu-metric" },
                  Component.h("span", {}, "Memory"),
                  Component.h(
                    "div",
                    { className: "metric-bar" },
                    Component.h("div", {
                      className: "metric-fill",
                      style: `width: ${(gpu.memoryUsed / gpu.memoryTotal) * 100}%`,
                    }),
                    Component.h(
                      "span",
                      { className: "metric-text" },
                      `${AppUtils?.formatBytes?.(gpu.memoryUsed)} / ${AppUtils?.formatBytes?.(
                        gpu.memoryTotal
                      )}`
                    )
                  )
                )
            )
          )
        )
    );
  }
}

window.GpuDetails = GpuDetails;
