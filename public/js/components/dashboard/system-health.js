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
   * Update metrics data
   */
  updateMetrics(metrics, gpuMetrics) {
    this.metrics = metrics || this.metrics;
    this.gpuMetrics = gpuMetrics || this.gpuMetrics;
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
