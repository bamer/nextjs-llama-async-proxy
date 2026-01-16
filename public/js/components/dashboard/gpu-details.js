/**
 * GpuDetails Component - Event-Driven DOM Updates
 */

class GpuDetails extends Component {
  /**
   * Creates a GpuDetails component instance.
   * @param {Object} props - Component properties.
   * @param {Array} props.gpuList - Array of GPU device objects with name, vendor, usage, and memory details.
   */
  constructor(props) {
    super(props);
    this.gpuList = props.gpuList || [];
    this.expanded = false;
    this.unsubscriber = null;
  }

  /**
   * Called after component is mounted to DOM. Subscribes to metrics state changes.
   */
  onMount() {
    // Subscribe to metrics changes to update GPU list
    this.unsubscriber = stateManager.subscribe("metrics", (metrics) => {
      const newList = metrics?.gpu?.list || [];
      if (JSON.stringify(newList) !== JSON.stringify(this.gpuList || [])) {
        this.gpuList = newList;
        this._updateGPUUI();
      }
    });
  }

  /**
   * Cleans up subscriptions when component is destroyed.
   */
  destroy() {
    this.unsubscriber?.();
  }

  /**
   * Binds event handlers for user interactions.
   */
  bindEvents() {
    // Toggle GPU details - event delegation on this._el
    this.on("click", ".gpu-header", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.expanded = !this.expanded;
      this._updateUI();
    });
  }

  /**
   * Updates the UI based on the expanded/collapsed state of the GPU details section.
   */
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

  /**
   * Updates the GPU list UI when GPU data changes.
   */
  _updateGPUUI() {
    if (!this._el) return;

    const noDataEl = this._el.querySelector(".gpu-no-data");
    const headerEl = this._el.querySelector(".gpu-header");

    if (this.gpuList && this.gpuList.length > 0) {
      // GPUs detected - replace "No GPU detected" with actual content
      if (noDataEl) {
        noDataEl.remove();
      }

      // Create header if it doesn't exist
      if (!headerEl) {
        const headerHtml = `
          <div class="gpu-header" data-action="toggle-gpu">
            <span class="gpu-title">GPU Devices (${this.gpuList.length})</span>
            <span class="gpu-toggle ${this.expanded ? "open" : "closed"}">${this.expanded ? "▼" : "▶"}</span>
          </div>
        `;

        // Insert header at the beginning
        this._el.insertAdjacentHTML("afterbegin", headerHtml);
      }

      // Update title
      const titleEl = this._el.querySelector(".gpu-title");
      if (titleEl) {
        titleEl.textContent = `GPU Devices (${this.gpuList.length})`;
      }

      // Update toggle icon
      const toggle = this._el.querySelector(".gpu-toggle");
      if (toggle) {
        toggle.textContent = this.expanded ? "▼" : "▶";
        toggle.className = `gpu-toggle ${this.expanded ? "open" : "closed"}`;
      }

      // Create or update GPU list
      let gpuList = this._el.querySelector(".gpu-list");
      if (!gpuList) {
        gpuList = document.createElement("div");
        gpuList.className = "gpu-list";
        this._el.appendChild(gpuList);
      }

      gpuList.innerHTML = this.gpuList
        .map(
          (gpu) => {
            // Check if we have valid utilization data
            const hasUtilization = gpu.usage > 0 || gpu.memoryTotal > 0;
            const usageDisplay = hasUtilization ? `${gpu.usage.toFixed(1)}%` : "N/A";
            const usageWidth = hasUtilization ? Math.min(gpu.usage, 100) : 0;
            const usageClass = hasUtilization ? "" : "metric-na";

            return `
        <div class="gpu-card ${gpu.usage > 75 || (gpu.memoryTotal > 0 && gpu.memoryUsed / gpu.memoryTotal > 0.75) ? "high-usage" : ""}">
          <div class="gpu-info">
            <strong>${gpu.name}</strong>
            <span class="gpu-vendor">${gpu.vendor}</span>
          </div>
          <div class="gpu-metric">
            <span>Usage</span>
            <div class="metric-bar">
              <div class="metric-fill ${usageClass}" style="width: ${usageWidth}%"></div>
              <span class="metric-text">${usageDisplay}</span>
            </div>
          </div>
          ${gpu.memoryTotal > 0 ? `
          <div class="gpu-metric">
            <span>Memory</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${(gpu.memoryUsed / gpu.memoryTotal) * 100}%"></div>
              <span class="metric-text">${window.AppUtils?.formatBytes?.(gpu.memoryUsed)} / ${window.AppUtils?.formatBytes?.(gpu.memoryTotal)}</span>
            </div>
          </div>
          ` : ""}
        </div>
      `;
          }
        )
        .join("");

      // Show/hide based on expanded state
      gpuList.style.display = this.expanded ? "block" : "none";
    }
  }

  /**
   * Renders the GPU details component showing GPU devices or "No GPU detected" message.
   * @returns {string} HTML string containing the GPU details section.
   */
  render() {
    if (!this.gpuList || this.gpuList.length === 0) {
      return "<div class=\"gpu-details\"><p class=\"gpu-no-data\">No GPU detected</p></div>";
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
      (gpu) => {
        // Check if we have valid utilization data
        const hasUtilization = gpu.usage > 0 || gpu.memoryTotal > 0;
        const usageDisplay = hasUtilization ? `${gpu.usage.toFixed(1)}%` : "N/A";
        const usageWidth = hasUtilization ? Math.min(gpu.usage, 100) : 0;
        const usageClass = hasUtilization ? "" : "metric-na";

        return `
              <div class="gpu-card ${gpu.usage > 75 || (gpu.memoryTotal > 0 && gpu.memoryUsed / gpu.memoryTotal > 0.75) ? "high-usage" : ""}">
                <div class="gpu-info">
                  <strong>${gpu.name}</strong>
                  <span class="gpu-vendor">${gpu.vendor}</span>
                </div>
                <div class="gpu-metric">
                  <span>Usage</span>
                  <div class="metric-bar">
                    <div class="metric-fill ${usageClass}" style="width: ${usageWidth}%"></div>
                    <span class="metric-text">${usageDisplay}</span>
                  </div>
                </div>
                ${gpu.memoryTotal > 0 ? `
                <div class="gpu-metric">
                  <span>Memory</span>
                  <div class="metric-bar">
                    <div class="metric-fill" style="width: ${(gpu.memoryUsed / gpu.memoryTotal) * 100}%"></div>
                    <span class="metric-text">${window.AppUtils?.formatBytes?.(gpu.memoryUsed)} / ${window.AppUtils?.formatBytes?.(gpu.memoryTotal)}</span>
                  </div>
                </div>
                ` : ""}
              </div>
            `;
      }
    )
    .join("")}
          </div>
        ` : ""}
      </div>
    `;
  }
}

window.GpuDetails = GpuDetails;
