/**
 * Stats Grid Component
 * Displays system metrics with icons, values, and progress bars
 */

class StatsGrid extends Component {
  constructor(props) {
    super(props);

    const metrics = props.metrics || {
      cpu: { usage: 0 },
      memory: { used: 0 },
      disk: { used: 0 },
      uptime: 0,
    };
    const gpuMetrics = props.gpuMetrics || { usage: 0, memoryUsed: 0, memoryTotal: 0 };

    this.state = { metrics, gpuMetrics };
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

  render() {
    const m = this.state.metrics;
    const gpu = this.state.gpuMetrics;

    const stats = [
      {
        icon: "🖥️",
        label: "CPU Usage",
        value: `${(m.cpu?.usage || 0).toFixed(1)}%`,
        percent: Math.min(m.cpu?.usage || 0, 100),
        warning: m.cpu?.usage > 80,
        showBar: true,
      },
      {
        icon: "🧠",
        label: "Memory Usage",
        value: `${(m.memory?.used || 0).toFixed(1)}%`,
        percent: Math.min(m.memory?.used || 0, 100),
        warning: m.memory?.used > 85,
        showBar: true,
      },
      {
        icon: "💨",
        label: "Swap Usage",
        value: `${(m.swap?.used || 0).toFixed(1)}%`,
        percent: Math.min(m.swap?.used || 0, 100),
        warning: m.swap?.used > 50,
        showBar: true,
      },
      {
        icon: "🎮",
        label: "GPU Usage",
        value: `${(gpu?.usage || 0).toFixed(1)}%`,
        percent: Math.min(gpu?.usage || 0, 100),
        warning: gpu?.usage > 85,
        isGpu: true,
        showBar: true,
      },
      {
        icon: "💾",
        label: "GPU Memory",
        value:
          gpu?.memoryTotal > 0
            ? `${window.AppUtils?.formatBytes?.(gpu?.memoryUsed || 0)} / ${window.AppUtils?.formatBytes?.(
                gpu?.memoryTotal || 0
              )}`
            : `${(gpu?.usage || 0).toFixed(1)}%`,
        percent:
          gpu?.memoryTotal > 0
            ? (gpu?.memoryUsed / gpu?.memoryTotal) * 100
            : Math.min(gpu?.usage || 0, 100),
        isGpu: true,
        showBar: true,
      },
      {
        icon: "💿",
        label: "Disk Usage",
        value: `${(m.disk?.used || 0).toFixed(1)}%`,
        percent: Math.min(m.disk?.used || 0, 100),
        warning: m.disk?.used > 90,
        showBar: true,
      },
      {
        icon: "⏱️",
        label: "Uptime",
        value: this._fmtUptime(m.uptime || 0),
        percent: 0,
        showBar: false,
      },
    ];

    return Component.h(
      "div",
      { className: "stats-grid" },
      stats.map((stat) =>
        Component.h(
          "div",
          { key: stat.label, className: `stat-card ${stat.warning ? "warning" : ""}` },
          Component.h("div", { className: "stat-icon" }, stat.icon),
          Component.h(
            "div",
            { className: "stat-content" },
            Component.h("span", { className: "stat-label" }, stat.label),
            Component.h("span", { className: "stat-value" }, stat.value),
            stat.showBar &&
              Component.h(
                "div",
                { className: "stat-bar" },
                Component.h("div", {
                  className: `stat-bar-fill ${stat.isGpu ? "gpu" : ""}`,
                  style: `width: ${stat.percent}%`,
                })
              )
          )
        )
      )
    );
  }
}

window.StatsGrid = StatsGrid;
