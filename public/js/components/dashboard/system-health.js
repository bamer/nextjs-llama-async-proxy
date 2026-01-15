/**
 * SystemHealth Component - Event-Driven DOM Updates
 * Displays system health status and checks
 */

class SystemHealth extends Component {
  /**
   * Creates a SystemHealth component instance.
   * @param {Object} props - Component properties.
   * @param {Object} props.metrics - System metrics object containing CPU, memory, and disk usage.
   * @param {Object} props.gpuMetrics - GPU metrics object containing usage information.
   */
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.metrics = props.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      disk: { used: 0 },
    };
    this.gpuMetrics = props.gpuMetrics || { usage: 0 };
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

    const m = this.metrics;
    const gpu = this.gpuMetrics;
    const health = window.DashboardUtils._getHealthStatus(m);

    // Update health status
    const statusEl = this._el.querySelector(".health-status");
    if (statusEl) {
      statusEl.className = `health-status ${health.status}`;
      const iconEl = statusEl.querySelector(".health-icon");
      const messageEl = statusEl.querySelector(".health-message");
      if (iconEl) iconEl.textContent = health.status === "good" ? "✓" : "⚠";
      if (messageEl) messageEl.textContent = health.message;
    }

    // Update check values
    const checkValues = [
      { value: `${(m.cpu?.usage || 0).toFixed(1)}%`, ok: health.checks.cpuOk, limit: "80%" },
      { value: `${(m.memory?.used || 0).toFixed(1)}%`, ok: health.checks.memoryOk, limit: "85%" },
      { value: `${(m.disk?.used || 0).toFixed(1)}%`, ok: health.checks.diskOk, limit: "90%" },
      { value: `${(gpu?.usage || 0).toFixed(1)}%`, ok: health.checks.gpuOk, limit: "85%" },
    ];

    const checkEls = this._el.querySelectorAll(".health-check");
    checkEls.forEach((checkEl, index) => {
      if (index < checkValues.length) {
        const check = checkValues[index];
        const valueEl = checkEl.querySelector(".check-value");
        if (valueEl) valueEl.textContent = check.value;

        // Update OK/warning status
        checkEl.className = `health-check ${check.ok ? "ok" : "warning"}`;

        const indicatorEl = checkEl.querySelector(".check-indicator");
        if (indicatorEl) {
          indicatorEl.innerHTML = check.ok
            ? "<span class=\"indicator-good\">✓</span>"
            : `<span class="indicator-warning">⚠ Limit: ${check.limit}</span>`;
        }
      }
    });
  }

  /**
   * Renders the system health component with status and individual health checks.
   * @returns {string} HTML string containing the health status, message, and check items.
   */
  render() {
    const m = this.metrics;
    const gpu = this.gpuMetrics;
    const health = window.DashboardUtils._getHealthStatus(m);

    return `
      <div class="health-section">
        <h3>System Health</h3>
        <div class="health-status ${health.status}">
          <div class="health-icon">${health.status === "good" ? "✓" : "⚠"}</div>
          <span class="health-message">${health.message}</span>
        </div>
        <div class="health-checks">
          <div class="health-check ${health.checks.cpuOk ? "ok" : "warning"}">
            <div class="check-info">
              <span class="check-name">CPU Usage</span>
              <span class="check-value">${(m.cpu?.usage || 0).toFixed(1)}%</span>
            </div>
            <div class="check-indicator">
              ${health.checks.cpuOk
    ? "<span class=\"indicator-good\">✓</span>"
    : "<span class=\"indicator-warning\">⚠ Limit: 80%</span>"}
            </div>
          </div>
          <div class="health-check ${health.checks.memoryOk ? "ok" : "warning"}">
            <div class="check-info">
              <span class="check-name">Memory Usage</span>
              <span class="check-value">${(m.memory?.used || 0).toFixed(1)}%</span>
            </div>
            <div class="check-indicator">
              ${health.checks.memoryOk
    ? "<span class=\"indicator-good\">✓</span>"
    : "<span class=\"indicator-warning\">⚠ Limit: 85%</span>"}
            </div>
          </div>
          <div class="health-check ${health.checks.diskOk ? "ok" : "warning"}">
            <div class="check-info">
              <span class="check-name">Disk Usage</span>
              <span class="check-value">${(m.disk?.used || 0).toFixed(1)}%</span>
            </div>
            <div class="check-indicator">
              ${health.checks.diskOk
    ? "<span class=\"indicator-good\">✓</span>"
    : "<span class=\"indicator-warning\">⚠ Limit: 90%</span>"}
            </div>
          </div>
          <div class="health-check ${health.checks.gpuOk ? "ok" : "warning"}">
            <div class="check-info">
              <span class="check-name">GPU Usage</span>
              <span class="check-value">${(gpu?.usage || 0).toFixed(1)}%</span>
            </div>
            <div class="check-indicator">
              ${health.checks.gpuOk
    ? "<span class=\"indicator-good\">✓</span>"
    : "<span class=\"indicator-warning\">⚠ Limit: 85%</span>"}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

window.SystemHealth = SystemHealth;
