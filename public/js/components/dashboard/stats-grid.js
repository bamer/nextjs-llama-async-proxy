/**
 * StatsGrid Component - Event-Driven DOM Updates
 * Displays system metrics with icons, values, and progress bars
 * Uses configurable thresholds from settings for warning/alert styling
 */

class StatsGrid extends Component {
  constructor(props) {
    super(props);

    this.metrics = props.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      disk: { used: 0 },
      swap: { used: 0 },
      uptime: 0,
    };
    this.gpuMetrics = props.gpuMetrics || { usage: 0, memoryUsed: 0, memoryTotal: 0 };
    this.thresholds = props.thresholds || {
      cpu: { warning: 70, alert: 85 },
      memory: { warning: 75, alert: 90 },
      gpu: { warning: 80, alert: 90 },
      disk: { warning: 80, alert: 95 },
      swap: { warning: 50, alert: 70 },
    };
    this.unsubscribers = [];
  }

  onMount() {
    this.unsubscribers.push(
      socketClient.on("metrics:updated", (data) => {
        if (data && data.metrics) {
          this.updateMetrics(data.metrics, data.gpuMetrics);
        }
      }),
      socketClient.on("config:thresholds:updated", (data) => {
        if (data.thresholds) {
          this.thresholds = data.thresholds;
          this._updateDOM();
        }
      })
    );

    // Load thresholds from server
    this._loadThresholds();
  }

  async _loadThresholds() {
    try {
      const response = await socketClient.request("config:thresholds:get", {});
      if (response.success && response.data.thresholds) {
        this.thresholds = response.data.thresholds;
        this._updateDOM();
      }
    } catch (e) {
      console.error("[StatsGrid] Failed to load thresholds:", e);
    }
  }

  destroy() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  _fmtUptime(s) {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  _getStatus(usage, metric) {
    const t = this.thresholds[metric] || { warning: 70, alert: 85 };
    if (usage >= t.alert) return "alert";
    if (usage >= t.warning) return "warning";
    return "normal";
  }

  updateMetrics(metrics, gpuMetrics) {
    this.metrics = metrics || this.metrics;
    this.gpuMetrics = gpuMetrics || this.gpuMetrics;
    this._updateDOM();
  }

  _updateDOM() {
    if (!this._el) return;

    const m = this.metrics;
    const gpu = this.gpuMetrics;

    // Get status for each metric
    const cpuStatus = this._getStatus(m.cpu?.usage || 0, "cpu");
    const memStatus = this._getStatus(m.memory?.used || 0, "memory");
    const swapStatus = this._getStatus(m.swap?.used || 0, "swap");
    const gpuStatus = this._getStatus(gpu?.usage || 0, "gpu");
    const diskStatus = this._getStatus(m.disk?.used || 0, "disk");

    const statCards = this._el.querySelectorAll(".stat-card");

    // Update classes
    if (statCards[0]) statCards[0].className = `stat-card ${cpuStatus}`;
    if (statCards[1]) statCards[1].className = `stat-card ${memStatus}`;
    if (statCards[2]) statCards[2].className = `stat-card ${swapStatus}`;
    if (statCards[3]) statCards[3].className = `stat-card ${gpuStatus}`;
    if (statCards[5]) statCards[5].className = `stat-card ${diskStatus}`;

    // Update values
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

  render() {
    const m = this.metrics;
    const gpu = this.gpuMetrics;

    const cpuStatus = this._getStatus(m.cpu?.usage || 0, "cpu");
    const memStatus = this._getStatus(m.memory?.used || 0, "memory");
    const swapStatus = this._getStatus(m.swap?.used || 0, "swap");
    const gpuStatus = this._getStatus(gpu?.usage || 0, "gpu");
    const diskStatus = this._getStatus(m.disk?.used || 0, "disk");

    return `
      <div class="stats-grid">
        <div class="stat-card ${cpuStatus}">
          <div class="stat-icon">🖥️</div>
          <div class="stat-content">
            <span class="stat-label">CPU Usage</span>
            <span class="stat-value">${(m.cpu?.usage || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill ${cpuStatus}" style="width: ${Math.min(m.cpu?.usage || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card ${memStatus}">
          <div class="stat-icon">🧠</div>
          <div class="stat-content">
            <span class="stat-label">Memory Usage</span>
            <span class="stat-value">${(m.memory?.used || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill ${memStatus}" style="width: ${Math.min(m.memory?.used || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card ${swapStatus}">
          <div class="stat-icon">💨</div>
          <div class="stat-content">
            <span class="stat-label">Swap Usage</span>
            <span class="stat-value">${(m.swap?.used || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill ${swapStatus}" style="width: ${Math.min(m.swap?.used || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card ${gpuStatus}">
          <div class="stat-icon">🎮</div>
          <div class="stat-content">
            <span class="stat-label">GPU Usage</span>
            <span class="stat-value">${(gpu?.usage || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill gpu ${gpuStatus}" style="width: ${Math.min(gpu?.usage || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💾</div>
          <div class="stat-content">
            <span class="stat-label">GPU Memory</span>
            <span class="stat-value">${gpu?.memoryTotal > 0 ? window.AppUtils?.formatBytes?.(gpu?.memoryUsed || 0) + " / " + window.AppUtils?.formatBytes?.(gpu?.memoryTotal || 0) : (gpu?.usage || 0).toFixed(1) + "%"}</span>
            <div class="stat-bar">
              <div class="stat-bar-fill gpu" style="width: ${gpu?.memoryTotal > 0 ? (gpu?.memoryUsed / gpu?.memoryTotal) * 100 : Math.min(gpu?.usage || 0, 100)}%"></div>
            </div>
          </div>
        </div>
        <div class="stat-card ${diskStatus}">
          <div class="stat-icon">💿</div>
          <div class="stat-content">
            <span class="stat-label">Disk Usage</span>
            <span class="stat-value">${(m.disk?.used || 0).toFixed(1)}%</span>
            <div class="stat-bar">
              <div class="stat-bar-fill ${diskStatus}" style="width: ${Math.min(m.disk?.used || 0, 100)}%"></div>
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
