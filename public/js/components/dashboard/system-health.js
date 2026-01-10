/**
 * SystemHealth Component - Event-Driven DOM Updates
 * Displays system health status and checks
 */

class SystemHealth extends Component {
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
      `${(m.cpu?.usage || 0).toFixed(1)}%`,
      `${(m.memory?.used || 0).toFixed(1)}%`,
      `${(m.disk?.used || 0).toFixed(1)}%`,
      `${(gpu?.usage || 0).toFixed(1)}%`,
    ];

    const checkEls = this._el.querySelectorAll(".health-check");
    checkEls.forEach((checkEl, index) => {
      if (index < checkValues.length) {
        const valueEl = checkEl.querySelector(".check-value");
        if (valueEl) valueEl.textContent = checkValues[index];

        // Update OK/warning status
        const checkOk = health.checks?.[index === 0 ? "cpuOk" : index === 1 ? "memoryOk" : index === 2 ? "diskOk" : "gpuOk"];
        checkEl.className = `health-check ${checkOk ? "ok" : "warning"}`;

        const indicatorEl = checkEl.querySelector(".check-indicator");
        if (indicatorEl) {
          indicatorEl.innerHTML = checkOk
            ? '<span class="indicator-good">✓</span>'
            : `<span class="indicator-warning">⚠ Limit: ${index === 0 ? "80%" : index === 1 ? "85%" : index === 2 ? "90%" : "85%"}</span>`;
        }
      }
    });
  }

  render() {
    const m = this.metrics;
    const gpu = this.gpuMetrics;
    const health = window.DashboardUtils._getHealthStatus(m);

    const checks = [
      {
        name: "CPU Usage",
        ok: health.checks.cpuOk,
        value: `${(m.cpu?.usage || 0).toFixed(1)}%`,
        limit: "80%",
      },
      {
        name: "Memory Usage",
        ok: health.checks.memoryOk,
        value: `${(m.memory?.used || 0).toFixed(1)}%`,
        limit: "85%",
      },
      {
        name: "Disk Usage",
        ok: health.checks.diskOk,
        value: `${(m.disk?.used || 0).toFixed(1)}%`,
        limit: "90%",
      },
      {
        name: "GPU Usage",
        ok: health.checks.gpuOk,
        value: `${(gpu?.usage || 0).toFixed(1)}%`,
        limit: "85%",
      },
    ];

    return Component.h(
      "div",
      { className: "health-section" },
      Component.h("h3", {}, "System Health"),
      Component.h(
        "div",
        { className: `health-status ${health.status}` },
        Component.h("div", { className: "health-icon" }, health.status === "good" ? "✓" : "⚠"),
        Component.h("span", { className: "health-message" }, health.message)
      ),
      Component.h(
        "div",
        { className: "health-checks" },
        checks.map((check) =>
          Component.h(
            "div",
            { key: check.name, className: `health-check ${check.ok ? "ok" : "warning"}` },
            Component.h(
              "div",
              { className: "check-info" },
              Component.h("span", { className: "check-name" }, check.name),
              Component.h("span", { className: "check-value" }, check.value)
            ),
            Component.h(
              "div",
              { className: "check-indicator" },
              check.ok
                ? Component.h("span", { className: "indicator-good" }, "✓")
                : Component.h("span", { className: "indicator-warning" }, `⚠ Limit: ${check.limit}`)
            )
          )
        )
      )
    );
  }
}

window.SystemHealth = SystemHealth;
