/**
 * StatsGrid Component - Event-Driven DOM Updates
 * Displays system metrics with icons, values, and progress bars
 */

class StatsGrid extends Component {
  /**
   * Creates a StatsGrid component instance.
   * @param {Object} props - Component properties.
   * @param {Object} props.metrics - System metrics object containing CPU, memory, disk, swap, and uptime.
   * @param {Object} props.gpuMetrics - GPU metrics object containing usage and memory information.
   */
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.metrics = props.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      disk: { used: 0 },
      swap: { used: 0 },
      uptime: 0,
    };
    this.gpuMetrics = props.gpuMetrics || { usage: 0, memoryUsed: 0, memoryTotal: 0 };
  }

  /**
   * Format uptime in human-readable format
   * @param {number} s - Seconds
   * @returns {string} Formatted uptime (e.g., "2d 5h 30m")
   */
  _fmtUptime(s) {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  /**
   * Update metrics data and DOM
   */
  updateMetrics(metrics, gpuMetrics) {
    this.metrics = metrics || this.metrics;
    this.gpuMetrics = gpuMetrics || this.gpuMetrics;
    this._updateDOM();
  }

  /**
   * Update the DOM with current metrics values
   */
  _updateDOM() {
    if (!this._el) return;

    const statCards = this._el.querySelectorAll(".stat-card");
    const m = this.metrics;
    const gpu = this.gpuMetrics;

    // Define the values for each stat card by index
    const statValues = [
      { value: `${(m.cpu?.usage || 0).toFixed(1)}%`, percent: Math.min(m.cpu?.usage || 0, 100) },
      { value: `${(m.memory?.used || 0).toFixed(1)}%`, percent: Math.min(m.memory?.used || 0, 100) },
      { value: `${(m.swap?.used || 0).toFixed(1)}%`, percent: Math.min(m.swap?.used || 0, 100) },
      { value: `${(gpu?.usage || 0).toFixed(1)}%`, percent: Math.min(gpu?.usage || 0, 100) },
      {
        value: gpu?.memoryTotal > 0
          ? `${window.AppUtils?.formatBytes?.(gpu?.memoryUsed || 0)} / ${window.AppUtils?.formatBytes?.(gpu?.memoryTotal || 0)}`
          : `${(gpu?.usage || 0).toFixed(1)}%`,
        percent: gpu?.memoryTotal > 0
          ? (gpu?.memoryUsed / gpu?.memoryTotal) * 100
          : Math.min(gpu?.usage || 0, 100)
      },
      { value: `${(m.disk?.used || 0).toFixed(1)}%`, percent: Math.min(m.disk?.used || 0, 100) },
      { value: this._fmtUptime(m.uptime || 0), percent: 0 },
    ];

    statCards.forEach((card, index) => {
      if (index < statValues.length) {
        const stat = statValues[index];
        const valueEl = card.querySelector(".stat-value");
        const barFill = card.querySelector(".stat-bar-fill");
        if (valueEl) valueEl.textContent = stat.value;
        if (barFill && stat.percent > 0) barFill.style.width = `${stat.percent}%`;
      }
    });
  }

  /**
   * Renders the stats grid component with all metric cards.
   * @returns {string} HTML string containing the stats grid with CPU, memory, swap, GPU, disk, and uptime cards.
   */
  render() {
    const m = this.metrics;
    const gpu = this.gpuMetrics;

    return `
      <div class="stats-grid">
        <div class="stat-card ${m.cpu?.usage > 80 ? "warning" : ""}">
          <div class="stat-icon">🖥️</div>
          <div class="stat-content">
            <span class="stat-label">CPU Usage</span>
            <span class="stat-value">${(m.cpu?.usage || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill" style="width: ${Math.min(m.cpu?.usage || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card ${m.memory?.used > 85 ? "warning" : ""}">
          <div class="stat-icon">🧠</div>
          <div class="stat-content">
            <span class="stat-label">Memory Usage</span>
            <span class="stat-value">${(m.memory?.used || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill" style="width: ${Math.min(m.memory?.used || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card ${m.swap?.used > 50 ? "warning" : ""}">
          <div class="stat-icon">💨</div>
          <div class="stat-content">
            <span class="stat-label">Swap Usage</span>
            <span class="stat-value">${(m.swap?.used || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill" style="width: ${Math.min(m.swap?.used || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card ${gpu?.usage > 85 ? "warning" : ""}">
          <div class="stat-icon">🎮</div>
          <div class="stat-content">
            <span class="stat-label">GPU Usage</span>
            <span class="stat-value">${(gpu?.usage || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill gpu" style="width: ${Math.min(gpu?.usage || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💾</div>
          <div class="stat-content">
            <span class="stat-label">GPU Memory</span>
            <span class="stat-value">${
  gpu?.memoryTotal > 0
    ? `${window.AppUtils?.formatBytes?.(gpu?.memoryUsed || 0)} / ${window.AppUtils?.formatBytes?.(gpu?.memoryTotal || 0)}`
    : `${(gpu?.usage || 0).toFixed(1)}%`
}</span>
            <div class="stat-bar">
              <div class="stat-bar-fill gpu" style="width: ${
  gpu?.memoryTotal > 0 ? (gpu?.memoryUsed / gpu?.memoryTotal) * 100 : Math.min(gpu?.usage || 0, 100)
}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card ${m.disk?.used > 90 ? "warning" : ""}">
          <div class="stat-icon">💿</div>
          <div class="stat-content">
            <span class="stat-label">Disk Usage</span>
            <span class="stat-value">${(m.disk?.used || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill" style="width: ${Math.min(m.disk?.used || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <span class="stat-label">Uptime</span>
            <span class="stat-value">${this._fmtUptime(m.uptime || 0)}</span>
          </div>
        </div>
      </div>
    `;
  }
}

window.StatsGrid = StatsGrid;
