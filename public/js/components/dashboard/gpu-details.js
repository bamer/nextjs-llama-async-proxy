/**
 * GpuDetails Component - Real-time Multi-GPU Display
 * Socket.IO-first, no persistence
 */

class GpuDetails extends Component {
  constructor(props = {}) {
    super(props);
    this.gpuList = props.gpuList || [];
    this.expanded = true;
    this.unsubscribers = [];
    this.loading = true;
    this.gpuExpanded = new Map();
  }

  onMount() {
    this.unsubscribers.push(
      socketClient.on("gpu:updated", this._onGpuUpdated.bind(this))
    );
    this._loadInitialStatus();
  }

  async _loadInitialStatus() {
    try {
      console.debug("[GpuDetails] Requesting gpu:status from socket...");
      const response = await socketClient.request("gpu:status", {});
      console.debug("[GpuDetails] gpu:status response:", response);

      if (response && response.success && response.data) {
        console.debug("[GpuDetails] Got GPU data:", response.data);
        this._handleGpuUpdate(response.data);
      } else {
        console.warn("[GpuDetails] Invalid response structure:", response);
        this.loading = false;
        this._updateGPUUI();
      }
    } catch (error) {
      console.error("[GpuDetails] Failed to load:", error);
      this.loading = false;
      this._updateGPUUI();
    }
  }

  _onGpuUpdated(data) {
    console.debug("[GpuDetails] gpu:updated broadcast received:", data);
    if (data && data.list) {
      // Direct format: { list: [...] }
      this._handleGpuUpdate(data);
    } else if (data && data.data && data.data.list) {
      // Wrapped format: { type, timestamp, data: { list: [...] } }
      this._handleGpuUpdate(data.data);
    } else if (data) {
      console.debug("[GpuDetails] Broadcast data format:", Object.keys(data || {}));
    }
  }

  _handleGpuUpdate(data) {
    console.debug("[GpuDetails] Handling GPU update with", data?.list?.length || 0, "GPUs");
    this.loading = false;
    this.gpuList = data.list || [];
    console.debug("[GpuDetails] Updated gpuList to:", this.gpuList);
    this._updateGPUUI();
  }

  // Auto-refresh removed: rely on GPU updates via socket broadcasts

  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }

  bindEvents() {
    this.on("click", ".gpu-header", (e) => {
      e.preventDefault();
      this.expanded = !this.expanded;
      this._updateUI();
    });

    this.on("click", ".gpu-card-header", (e) => {
      const deviceId = e.currentTarget.dataset.deviceId;
      const current = this.gpuExpanded.get(deviceId);
      this.gpuExpanded.set(deviceId, !current);
      // Re-render GPU cards to show/hide metrics
      this._renderGpuCards();
    });

    this.on("click", "[data-action=gpu-refresh]", async (e) => {
      e.preventDefault();
      this.loading = true;
      this._updateUI();
      try {
        await socketClient.request("gpu:detect", {});
      } catch (error) {
        this.loading = false;
        this._updateUI();
      }
    });
  }

  _updateUI() {
    if (!this._el) return;

    this._el.classList.toggle("expanded", this.expanded);
    this._el.classList.toggle("collapsed", !this.expanded);

    const toggle = this._el.querySelector(".gpu-toggle");
    if (toggle) {
      toggle.textContent = this.expanded ? "▼" : "▶";
      toggle.className = `gpu-toggle ${this.expanded ? "open" : "closed"}`;
    }

    const gpuList = this._el.querySelector(".gpu-list");
    if (gpuList) {
      gpuList.style.display = this.expanded ? "block" : "none";
    }
  }

  _updateGPUUI() {
    if (!this._el) return;

    const loadingEl = this._el.querySelector(".gpu-loading");
    if (loadingEl) loadingEl.remove();

    if (this.loading) {
      this._renderLoading();
      return;
    }

    if (this.gpuList.length === 0) {
      this._renderNoGpu();
      return;
    }

    this._renderGpuCards();
  }

  _renderLoading() {
    let container = this._el.querySelector(".gpu-container");
    if (!container) {
      this._el.innerHTML = "<div class=\"gpu-container\"></div>";
      container = this._el.querySelector(".gpu-container");
    }

    container.innerHTML = `
      <div class="gpu-header">
        <span class="gpu-title">GPU Devices</span>
        <span class="gpu-toggle">▼</span>
      </div>
      <div class="gpu-list">
        <div class="gpu-loading">
          <div class="gpu-loading-spinner"></div>
          <span>Detecting GPUs...</span>
        </div>
      </div>
    `;
  }

  _renderNoGpu() {
    let container = this._el.querySelector(".gpu-container");
    if (!container) {
      this._el.innerHTML = "<div class=\"gpu-container\"></div>";
      container = this._el.querySelector(".gpu-container");
    }

    container.innerHTML = `
      <div class="gpu-header" data-action="toggle-gpu">
        <span class="gpu-title">GPU Devices (0)</span>
        <span class="gpu-toggle ${this.expanded ? "open" : "closed"}">${this.expanded ? "▼" : "▶"}</span>
      </div>
      <div class="gpu-list" style="display: ${this.expanded ? "block" : "none"}">
        <div class="gpu-empty">
          <span class="gpu-empty-icon">🎮</span>
          <p>No GPU detected</p>
          <p class="gpu-empty-hint">Install NVIDIA or AMD drivers for GPU monitoring</p>
        </div>
      </div>
    `;
  }

  _renderGpuCards() {
    let container = this._el.querySelector(".gpu-container");
    if (!container) {
      this._el.innerHTML = "<div class=\"gpu-container\"></div>";
      container = this._el.querySelector(".gpu-container");
      // Only bind events once when container is created
      this.bindEvents();
    }

    const totalVram = this._getTotalVram();
    const avgUtil = this._getAvgUtilization();

    container.innerHTML = `
      <div class="gpu-header" data-action="toggle-gpu">
        <div class="gpu-title-row">
          <span class="gpu-title">GPU Devices (${this.gpuList.length})</span>
          ${this.gpuList.length > 1 ? `
            <span class="gpu-total-summary">
              Total: ${this._formatBytes(totalVram)} · ${avgUtil.toFixed(0)}% avg
            </span>
          ` : ""}
        </div>
        <div class="gpu-header-actions">
          <button class="gpu-refresh-btn" data-action="gpu-refresh" title="Refresh">⟳</button>
          <span class="gpu-toggle ${this.expanded ? "open" : "closed"}">${this.expanded ? "▼" : "▶"}</span>
        </div>
      </div>
      <div class="gpu-list" style="display: ${this.expanded ? "block" : "none"}">
        ${this.gpuList.map(gpu => this._renderGpuCard(gpu)).join("")}
      </div>
    `;
  }

  _renderGpuCard(gpu) {
    const isExpanded = this.gpuExpanded.get(gpu.deviceId);
    const m = gpu.metrics || {};
    const usage = m.utilizationPercent || 0;
    const memoryUsed = m.memoryUsedBytes || 0;
    const memoryTotal = m.memoryTotalBytes || gpu.vramTotalBytes || 0;
    const memoryPercent = memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0;

    const usageClass = usage > 85 ? "high" : usage > 50 ? "medium" : "low";
    const hasWarning = usage > 85 || memoryPercent > 90 || m.temperatureCelsius > 85;
    const vendorInfo = this._getVendorInfo(gpu.vendor);
    const gpuTypeLabel = this._getGpuTypeLabel(gpu);
    const hasMetrics = gpu.vendor === "NVIDIA" || gpu.isRocmCapable;

    return `
      <div class="gpu-card ${hasWarning ? "warning" : ""}">
        <div class="gpu-card-header" data-device-id="${gpu.deviceId}">
          <div class="gpu-card-title">
            <div class="gpu-vendor-badge ${vendorInfo.badgeClass}">${vendorInfo.icon}</div>
            <div class="gpu-name-info">
              <strong class="gpu-name">${gpu.name}</strong>
              <span class="gpu-vendor-detail">${gpu.vendor}${gpu.isIntegrated ? " (Integrated)" : ""}</span>
              ${!gpu.isIntegrated ? `<span class="gpu-type-badge">${gpuTypeLabel}</span>` : ""}
            </div>
          </div>
          <div class="gpu-card-status">
            ${hasMetrics ? `
              <span class="gpu-usage-badge ${usageClass}">${usage.toFixed(1)}%</span>
            ` : `
              <span class="gpu-usage-badge inactive">N/A</span>
            `}
            <span class="gpu-expand-icon ${isExpanded ? "expanded" : ""}">${isExpanded ? "▼" : "▶"}</span>
          </div>
        </div>
        ${isExpanded ? this._renderMetrics(gpu, usage, memoryUsed, memoryTotal, memoryPercent, m) : this._renderPreview(gpu, usage, memoryUsed, memoryTotal, m)}
      </div>
    `;
  }

  _renderPreview(gpu, usage, memoryUsed, memoryTotal, m) {
    const memoryPercent = memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0;
    const hasFullMetrics = gpu.vendor === "NVIDIA" || gpu.isRocmCapable;

    return `
      <div class="gpu-card-preview">
        <div class="gpu-preview-grid">
          <div class="gpu-preview-item">
            <span class="gpu-preview-label">GPU Usage</span>
            <span class="gpu-preview-value">${usage > 0 ? usage.toFixed(1) + "%" : "N/A"}</span>
          </div>
          ${usage > 0 ? `
            <div class="gpu-preview-bar gpu-usage">
              <div class="gpu-preview-bar-fill" style="width: ${Math.min(usage, 100)}%"></div>
            </div>
          ` : `
            <div class="gpu-preview-bar gpu-usage">
              <div class="gpu-preview-bar-fill" style="width: 0%"></div>
            </div>
          `}
          <div class="gpu-preview-item">
            <span class="gpu-preview-label">Memory</span>
            <span class="gpu-preview-value">${this._formatBytes(memoryUsed)} / ${this._formatBytes(memoryTotal)}</span>
          </div>
          ${m.temperatureCelsius ? `
            <div class="gpu-preview-item">
              <span class="gpu-preview-label">Temp</span>
              <span class="gpu-preview-value ${m.temperatureCelsius > 85 ? "danger" : ""}">${m.temperatureCelsius.toFixed(0)}°C</span>
            </div>
          ` : `
            <div class="gpu-preview-item">
              <span class="gpu-preview-label">Temp</span>
              <span class="gpu-preview-value">--</span>
            </div>
          `}
          ${m.powerDrawWatts ? `
            <div class="gpu-preview-item">
              <span class="gpu-preview-label">Power</span>
              <span class="gpu-preview-value">${m.powerDrawWatts.toFixed(1)} W</span>
            </div>
          ` : `
            <div class="gpu-preview-item">
              <span class="gpu-preview-label">Power</span>
              <span class="gpu-preview-value">--</span>
            </div>
          `}
          <div class="gpu-preview-bar memory">
            <div class="gpu-preview-bar-fill" style="width: ${Math.min(memoryPercent, 100)}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  _renderMetrics(gpu, usage, memoryUsed, memoryTotal, memoryPercent, m) {
    const hasFullMetrics = gpu.vendor === "NVIDIA" || gpu.isRocmCapable;
    const isIntegratedGpu = gpu.isIntegrated;

    return `
      <div class="gpu-card-details">
        <div class="gpu-metrics-grid">
          <div class="gpu-metric">
            <div class="gpu-metric-header">
              <span class="gpu-metric-label">GPU Usage</span>
              ${hasFullMetrics ? `
                <span class="gpu-metric-value ${usage > 85 ? "danger" : ""}">${usage.toFixed(1)}%</span>
              ` : `
                <span class="gpu-metric-value inactive">${isIntegratedGpu ? "Integrated" : "N/A"}</span>
              `}
            </div>
            <div class="gpu-metric-bar-container">
              ${hasFullMetrics ? `
                <div class="gpu-metric-bar usage ${usage > 85 ? "danger" : ""}" style="width: ${Math.min(usage, 100)}%"></div>
              ` : `
                <div class="gpu-metric-bar usage inactive" style="width: 0%"></div>
              `}
            </div>
          </div>

          <div class="gpu-metric">
            <div class="gpu-metric-header">
              <span class="gpu-metric-label">Memory Usage</span>
              <span class="gpu-metric-value ${memoryPercent > 90 ? "danger" : ""}">${this._formatBytes(memoryUsed)} / ${this._formatBytes(memoryTotal)}</span>
            </div>
            <div class="gpu-metric-bar-container">
              <div class="gpu-metric-bar vram ${memoryPercent > 90 ? "danger" : ""}" style="width: ${Math.min(memoryPercent, 100)}%"></div>
            </div>
            <div class="gpu-metric-percent">${memoryPercent.toFixed(1)}% used</div>
          </div>
          ${m.temperatureCelsius ? `
            <div class="gpu-metric">
              <div class="gpu-metric-header">
                <span class="gpu-metric-label">Temperature</span>
                <span class="gpu-metric-value ${m.temperatureCelsius > 85 ? "danger" : m.temperatureCelsius > 70 ? "warning" : ""}">
                  ${m.temperatureCelsius.toFixed(0)}°C${m.temperatureCelsius > 85 ? " ⚠️" : ""}
                </span>
              </div>
            </div>
          ` : ""}
          ${m.powerDrawWatts ? `
            <div class="gpu-metric">
              <div class="gpu-metric-header">
                <span class="gpu-metric-label">Power</span>
                <span class="gpu-metric-value">${m.powerDrawWatts.toFixed(1)} W</span>
              </div>
            </div>
          ` : ""}
          ${m.fanSpeedPercent ? `
            <div class="gpu-metric">
              <div class="gpu-metric-header">
                <span class="gpu-metric-label">Fan</span>
                <span class="gpu-metric-value">${m.fanSpeedPercent.toFixed(0)}%</span>
              </div>
              <div class="gpu-metric-bar-container">
                <div class="gpu-metric-bar fan" style="width: ${Math.min(m.fanSpeedPercent, 100)}%"></div>
              </div>
            </div>
          ` : ""}
          ${m.clockSpeedMhz ? `
            <div class="gpu-metric">
              <div class="gpu-metric-header">
                <span class="gpu-metric-label">Core Clock</span>
                <span class="gpu-metric-value">${m.clockSpeedMhz.toFixed(0)} MHz</span>
              </div>
            </div>
          ` : ""}
          ${m.memoryClockMhz ? `
            <div class="gpu-metric">
              <div class="gpu-metric-header">
                <span class="gpu-metric-label">Memory Clock</span>
                <span class="gpu-metric-value">${m.memoryClockMhz.toFixed(0)} MHz</span>
              </div>
            </div>
          ` : ""}
          <div class="gpu-metric">
            <div class="gpu-metric-header">
              <span class="gpu-metric-label">Total VRAM</span>
              <span class="gpu-metric-value">${this._formatBytes(gpu.vramTotalBytes)}</span>
            </div>
          </div>
          ${gpu.driverVersion || gpu.cudaVersion ? `
            <div class="gpu-metric">
              <div class="gpu-metric-header">
                <span class="gpu-metric-label">Info</span>
                <span class="gpu-metric-value info">
                  ${gpu.driverVersion ? `Driver ${gpu.driverVersion}` : ""}
                  ${gpu.cudaVersion ? `CUDA ${gpu.cudaVersion}` : ""}
                </span>
              </div>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  _getVendorInfo(vendor) {
    const map = {
      "NVIDIA": { icon: "🔲", badgeClass: "nvidia" },
      "AMD": { icon: "🔺", badgeClass: "amd" },
      "Intel": { icon: "▢", badgeClass: "intel" },
    };
    return map[vendor] || { icon: "🎮", badgeClass: "unknown" };
  }

  _getGpuTypeLabel(gpu) {
    if (gpu.isIntegrated) return "Integrated";
    if (gpu.isRocmCapable) return "ROCm";
    return "Discrete";
  }

  _formatBytes(bytes) {
    if (!bytes) return "0 B";
    if (typeof window.AppUtils?.formatBytes === "function") {
      return window.AppUtils.formatBytes(bytes);
    }
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(0)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  _getTotalVram() {
    return this.gpuList.reduce((sum, gpu) => sum + (gpu.vramTotalBytes || 0), 0);
  }

  _getAvgUtilization() {
    if (this.gpuList.length === 0) return 0;
    const total = this.gpuList.reduce((sum, gpu) => sum + (gpu.metrics?.utilizationPercent || 0), 0);
    return total / this.gpuList.length;
  }

  render() {
    return Component.h("div", { className: "gpu-details expanded" }, [
      Component.h("div", { className: "gpu-container" }, [
        Component.h("div", { className: "gpu-header", "data-action": "toggle-gpu" }, [
          Component.h("span", { className: "gpu-title" }, "GPU Devices"),
          Component.h("span", { className: "gpu-toggle" }, "▼"),
        ]),
        Component.h("div", { className: "gpu-list" }, [
          Component.h("div", { className: "gpu-loading" }, [
            Component.h("div", { className: "gpu-loading-spinner" }),
            Component.h("span", {}, "Detecting GPUs..."),
          ]),
        ]),
      ]),
    ]);
  }
}

window.GpuDetails = GpuDetails;
