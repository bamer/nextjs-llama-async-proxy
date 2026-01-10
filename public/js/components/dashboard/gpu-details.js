/**
 * GPU Details Component - Event-Driven DOM Updates
 */

class GpuDetails extends Component {
  constructor(props) {
    super(props);
    this.gpuList = props.gpuList || [];
    this.expanded = false;
    this.unsubscriber = null;
  }

  onMount() {
    // Subscribe to metrics changes to update GPU list
    this.unsubscriber = stateManager.subscribe("metrics", (metrics) => {
      const newList = metrics?.gpu?.list || [];
      const oldList = this.gpuList || [];
      if (JSON.stringify(newList) !== JSON.stringify(oldList)) {
        this.gpuList = newList;
        this._updateUI();
      }
    });
  }

  destroy() {
    this.unsubscriber?.();
  }

  bindEvents() {
    // Toggle GPU details
    this.on("click", ".gpu-header", (e) => {
      e.preventDefault();
      this.expanded = !this.expanded;
      this._updateUI();
    });
  }

  _updateUI() {
    if (!this._el) return;

    // Update expanded state on container
    if (this.expanded) {
      this._el.classList.add("expanded");
      this._el.classList.remove("collapsed");
    } else {
      this._el.classList.add("collapsed");
      this._el.classList.remove("expanded");
    }

    // Update toggle icon
    const toggle = this._el.querySelector(".gpu-toggle");
    if (toggle) {
      toggle.textContent = this.expanded ? "▼" : "▶";
      toggle.className = `gpu-toggle ${this.expanded ? "open" : "closed"}`;
    }

    // Show/hide GPU list
    const gpuList = this._el.querySelector(".gpu-list");
    if (gpuList) {
      gpuList.style.display = this.expanded ? "block" : "none";
    }
  }

  render() {
    if (!this.gpuList || this.gpuList.length === 0) {
      return Component.h("div", { className: "gpu-details" }, [
        Component.h("p", { className: "gpu-no-data" }, "No GPU detected"),
      ]);
    }

    return Component.h("div", { className: `gpu-details ${this.expanded ? "expanded" : "collapsed"}` }, [
      // Summary header
      Component.h("div", { className: "gpu-header", "data-action": "toggle-gpu" }, [
        Component.h("span", { className: "gpu-title" }, `GPU Devices (${this.gpuList.length})`),
        Component.h("span", { className: `gpu-toggle ${this.expanded ? "open" : "closed"}` }, this.expanded ? "▼" : "▶"),
      ]),
      // Detailed GPU list
      this.expanded && Component.h("div", { className: "gpu-list" }, [
        ...this.gpuList.map((gpu, idx) =>
          Component.h("div", {
            key: `gpu-${idx}`,
            className: `gpu-card ${gpu.usage > 75 || gpu.memoryUsed / gpu.memoryTotal > 0.75 ? "high-usage" : ""}`,
          }, [
            // GPU name and vendor
            Component.h("div", { className: "gpu-info" }, [
              Component.h("strong", {}, gpu.name),
              Component.h("span", { className: "gpu-vendor" }, gpu.vendor),
            ]),
            // Usage bar
            Component.h("div", { className: "gpu-metric" }, [
              Component.h("span", {}, "Usage"),
              Component.h("div", { className: "metric-bar" }, [
                Component.h("div", {
                  className: "metric-fill",
                  style: `width: ${Math.min(gpu.usage, 100)}%`,
                }),
                Component.h("span", { className: "metric-text" }, `${gpu.usage.toFixed(1)}%`),
              ]),
            ]),
            // Memory bar
            gpu.memoryTotal > 0 && Component.h("div", { className: "gpu-metric" }, [
              Component.h("span", {}, "Memory"),
              Component.h("div", { className: "metric-bar" }, [
                Component.h("div", {
                  className: "metric-fill",
                  style: `width: ${(gpu.memoryUsed / gpu.memoryTotal) * 100}%`,
                }),
                Component.h("span", { className: "metric-text" }, `${AppUtils?.formatBytes?.(gpu.memoryUsed)} / ${AppUtils?.formatBytes?.(gpu.memoryTotal)}`),
              ]),
            ]),
          ])
        ),
      ]),
    ]);
  }
}

window.GpuDetails = GpuDetails;
