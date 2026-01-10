/**
 * GpuDetails Component - Event-Driven DOM Updates
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
      return `<div class="gpu-details"><p class="gpu-no-data">No GPU detected</p></div>`;
    }

    return `
      <div class="gpu-details ${this.expanded ? "expanded" : "collapsed"}">
        <div class="gpu-header" data-action="toggle-gpu">
          <span class="gpu-title">GPU Devices (${this.gpuList.length})</span>
          <span class="gpu-toggle ${this.expanded ? "open" : "closed"}">${this.expanded ? "▼" : "▶"}</span>
        </div>
        ${this.expanded ? `
          <div class="gpu-list">
            ${this.gpuList
              .map(
                (gpu, idx) => `
              <div class="gpu-card ${gpu.usage > 75 || gpu.memoryUsed / gpu.memoryTotal > 0.75 ? "high-usage" : ""}">
                <div class="gpu-info">
                  <strong>${gpu.name}</strong>
                  <span class="gpu-vendor">${gpu.vendor}</span>
                </div>
                <div class="gpu-metric">
                  <span>Usage</span>
                  <div class="metric-bar">
                    <div class="metric-fill" style="width: ${Math.min(gpu.usage, 100)}%"></div>
                    <span class="metric-text">${gpu.usage.toFixed(1)}%</span>
                  </div>
                </div>
                ${gpu.memoryTotal > 0 ? `
                <div class="gpu-metric">
                  <span>Memory</span>
                  <div class="metric-bar">
                    <div class="metric-fill" style="width: ${(gpu.memoryUsed / gpu.memoryTotal) * 100}%"></div>
                    <span class="metric-text">${AppUtils?.formatBytes?.(gpu.memoryUsed)} / ${AppUtils?.formatBytes?.(gpu.memoryTotal)}</span>
                  </div>
                </div>
                ` : ""}
              </div>
            `
              )
              .join("")}
          </div>
        ` : ""}
      </div>
    `;
  }
}

window.GpuDetails = GpuDetails;
