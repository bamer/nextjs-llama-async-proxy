/**
 * ThresholdSettings Component - Alert threshold configuration
 * User-friendly UI for setting warning and alert thresholds per metric
 */

class ThresholdSettings extends Component {
  constructor(props = {}) {
    super(props);
    this.thresholds = props.thresholds || {
      cpu: { warning: 70, alert: 85 },
      memory: { warning: 75, alert: 90 },
      gpu: { warning: 80, alert: 90 },
      disk: { warning: 80, alert: 95 },
      swap: { warning: 50, alert: 70 },
    };
    this._localChanges = {};
    this.unsubscribers = [];
  }

  onMount() {
    // Listen for broadcast updates
    this.unsubscribers.push(
      socketClient.on("config:thresholds:updated", (data) => {
        if (data.thresholds) {
          this.thresholds = data.thresholds;
          this._updateUI();
        }
      })
    );
  }

  destroy() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  _handleChange(metric, level, value) {
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    this._localChanges[`${metric}.${level}`] = numValue;

    // Update local state for immediate feedback
    if (!this.thresholds[metric]) {
      this.thresholds[metric] = { warning: 70, alert: 85 };
    }
    this.thresholds[metric][level] = numValue;
    this._updateUI();
  }

  async _handleSave() {
    try {
      // Build thresholds object from changes
      const merged = JSON.parse(JSON.stringify(this.thresholds));
      for (const [key, value] of Object.entries(this._localChanges)) {
        const [metric, level] = key.split(".");
        if (!merged[metric]) merged[metric] = {};
        merged[metric][level] = value;
      }

      const response = await socketClient.request("config:thresholds:set", { thresholds: merged });
      if (response.success) {
        this.thresholds = response.data.thresholds;
        this._localChanges = {};
        showNotification("Alert thresholds saved", "success");
      } else {
        console.error("[ThresholdSettings] Save failed:", {
          error: response.error,
          message: response.error?.message || response.error,
          stack: new Error().stack,
          timestamp: new Date().toISOString()
        });
        console.error("[ThresholdSettings] Save failed:", response.error);
        showNotification(`Save failed: ${response.error}`, "error");
      }
    } catch (e) {
      console.error("[ThresholdSettings] Save error:", {
        error: e.message,
        stack: e.stack,
        name: e.name,
        timestamp: new Date().toISOString()
      });
      showNotification(`Save error: ${e.message}`, "error");
    }
  }

  async _handleReset() {
    try {
      const response = await socketClient.request("config:thresholds:reset", {});
      if (response.success) {
        this.thresholds = response.data.thresholds;
        this._localChanges = {};
        this._updateUI();
        showNotification("Thresholds reset to defaults", "success");
      } else {
        console.error("[ThresholdSettings] Reset failed:", {
          error: response.error,
          message: response.error?.message || response.error,
          stack: new Error().stack,
          timestamp: new Date().toISOString()
        });
        showNotification(`Reset failed: ${response.error}`, "error");
      }
    } catch (e) {
      console.error("[ThresholdSettings] Reset error:", {
        error: e.message,
        stack: e.stack,
        name: e.name,
        timestamp: new Date().toISOString()
      });
      showNotification(`Reset error: ${e.message}`, "error");
    }
  }

  bindEvents() {
    // Use delegation for slider changes
    this.on("input", ".threshold-slider", (e, target) => {
      const metric = target.dataset.metric;
      const level = target.dataset.level;
      this._handleChange(metric, level, target.value);
    });

    // Use delegation for button clicks
    this.on("click", "[data-action=save]", () => {
      this._handleSave();
    });

    this.on("click", "[data-action=reset]", () => {
      this._handleReset();
    });
  }

  _updateUI() {
    // Update slider values display
    for (const metric of ["cpu", "memory", "gpu", "disk", "swap"]) {
      const t = this.thresholds[metric] || { warning: 70, alert: 85 };
      const warningInput = this._el?.querySelector(`[data-metric="${metric}"][data-level="warning"]`);
      const alertInput = this._el?.querySelector(`[data-metric="${metric}"][data-level="alert"]`);
      const warningValue = this._el?.querySelector(`[data-metric="${metric}"][data-level="warning"] ~ .threshold-value`);
      const alertValue = this._el?.querySelector(`[data-metric="${metric}"][data-level="alert"] ~ .threshold-value`);

      if (warningInput) warningInput.value = t.warning;
      if (alertInput) alertInput.value = t.alert;
      if (warningValue) warningValue.textContent = `${t.warning}%`;
      if (alertValue) alertValue.textContent = `${t.alert}%`;
    }
  }

  _renderMetricRow(metric, label) {
    const t = this.thresholds[metric] || { warning: 70, alert: 85 };
    const changedWarning = this._localChanges[`${metric}.warning`] !== undefined;
    const changedAlert = this._localChanges[`${metric}.alert`] !== undefined;

    return `
      <div class="threshold-row">
        <div class="threshold-label">${label}</div>
        <div class="threshold-controls">
          <div class="threshold-level ${changedWarning ? "changed" : ""}">
            <span class="level-badge warning">⚠️ Warning</span>
            <input type="range" 
                   class="threshold-slider" 
                   data-metric="${metric}" 
                   data-level="warning" 
                   min="0" max="100" 
                   value="${t.warning}"
                   oninput="this.nextElementSibling.textContent = this.value + '%'"
            >
            <span class="threshold-value">${t.warning}%</span>
          </div>
          <div class="threshold-level ${changedAlert ? "changed" : ""}">
            <span class="level-badge alert">🔴 Alert</span>
            <input type="range" 
                   class="threshold-slider" 
                   data-metric="${metric}" 
                   data-level="alert" 
                   min="0" max="100" 
                   value="${t.alert}"
                   oninput="this.nextElementSibling.textContent = this.value + '%'"
            >
            <span class="threshold-value">${t.alert}%</span>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return `
      <div class="threshold-settings">
        <div class="threshold-header">
          <h3>Alert Thresholds</h3>
          <p class="threshold-desc">Set warning and alert levels for system metrics. Cards will change color when thresholds are exceeded.</p>
        </div>
        <div class="threshold-list">
          ${this._renderMetricRow("cpu", "🖥️ CPU Usage")}
          ${this._renderMetricRow("memory", "🧠 Memory Usage")}
          ${this._renderMetricRow("gpu", "🎮 GPU Usage")}
          ${this._renderMetricRow("disk", "💿 Disk Usage")}
          ${this._renderMetricRow("swap", "💨 Swap Usage")}
        </div>
        <div class="threshold-actions">
          <button class="btn btn-secondary" data-action="reset">Reset Defaults</button>
          <button class="btn btn-primary" data-action="save">Save Changes</button>
        </div>
      </div>
    `;
  }
}

window.ThresholdSettings = ThresholdSettings;
