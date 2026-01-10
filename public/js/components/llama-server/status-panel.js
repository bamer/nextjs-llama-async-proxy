/**
 * llama-server Status Panel Component
 */

class LlamaServerStatusPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: "unknown",
      metrics: null,
      uptime: "00:00:00",
      pid: null,
    };
  }

  willMount() {
    console.log("[DEBUG] LlamaServerStatusPanel willMount");
    // Subscribe to llama-server status
    this._unsubscribers = [];
    this._unsubscribers.push(
      stateManager.subscribe("llamaServerStatus", this.handleStatusChange.bind(this))
    );
  }

  handleStatusChange(status) {
    console.log("[DEBUG] LlamaServerStatusPanel status change:", status);
    this.setState({
      status: status.status || "unknown",
      metrics: status.metrics,
      uptime: status.uptime ? window.FormatUtils.formatUptime(status.uptime / 1000) : "00:00:00",
      pid: status.pid || null,
    });
  }

  render() {
    const { status, metrics, uptime, pid } = this.state;

    const statusIcon = this._getStatusIcon(status);
    const statusText = this._getStatusText(status);

    return Component.h(
      "div",
      { className: "llama-server-status-panel" },
      Component.h(
        "div",
        { className: "status-header" },
        Component.h("h3", {}, "llama-server"),
        Component.h(
          "div",
          { className: "status-badge status-" + status },
          Component.h("span", { className: "status-icon" }, statusIcon),
          Component.h("span", {}, statusText)
        ),
        Component.h(
          "div",
          { className: "controls" },
          Component.h(
            "button",
            {
              className: "btn btn-start",
              style: status === "stopped" ? "" : "display: none;",
              onClick: () => this.startServer(),
            },
            "Start"
          ),
          Component.h(
            "button",
            {
              className: "btn btn-stop",
              style: status === "running" ? "" : "display: none;",
              onClick: () => this.stopServer(),
            },
            "Stop"
          )
        )
      ),

      Component.h(
        "div",
        { className: "status-details" },
        Component.h(
          "div",
          { className: "detail-row" },
          Component.h("span", { className: "label" }, "Status:"),
          Component.h("span", { className: "value" }, statusText)
        ),

        pid &&
          Component.h(
            "div",
            { className: "detail-row" },
            Component.h("span", { className: "label" }, "PID:"),
            Component.h("span", { className: "value" }, String(pid))
          ),

        Component.h(
          "div",
          { className: "detail-row" },
          Component.h("span", { className: "label" }, "Uptime:"),
          Component.h("span", { className: "value" }, uptime)
        ),

        metrics && this._renderMetrics(metrics)
      )
    );
  }

  _renderMetrics(metrics) {
    return Component.h(
      "div",
      { className: "llama-metrics" },
      Component.h("h4", {}, "llama-server Metrics"),

      metrics.activeModels !== undefined &&
        Component.h(
          "div",
          { className: "metric-row" },
          Component.h("span", { className: "metric-label" }, "Active Models:"),
          Component.h("span", { className: "metric-value" }, String(metrics.activeModels))
        ),

      metrics.tokensPerSecond !== undefined &&
        Component.h(
          "div",
          { className: "metric-row" },
          Component.h("span", { className: "metric-label" }, "Tokens/s:"),
          Component.h(
            "span",
            { className: "metric-value" },
            String(metrics.tokensPerSecond.toFixed(2))
          )
        ),

      metrics.queueSize !== undefined &&
        Component.h(
          "div",
          { className: "metric-row" },
          Component.h("span", { className: "metric-label" }, "Queue:"),
          Component.h("span", { className: "metric-value" }, String(metrics.queueSize))
        ),

      metrics.totalRequests !== undefined &&
        Component.h(
          "div",
          { className: "metric-row" },
          Component.h("span", { className: "metric-label" }, "Total Requests:"),
          Component.h(
            "span",
            { className: "metric-value" },
            `${window.FormatUtils.formatNumber(metrics.totalRequests)}`
          )
        )
    );
  }

  _getStatusIcon(status) {
    switch (status) {
      case "running":
        return "🟢";
      case "stopped":
        return "🔴";
      default:
        return "⚪";
    }
  }

  _getStatusText(status) {
    switch (status) {
      case "running":
        return "Running";
      case "stopped":
        return "Stopped";
      default:
        return "Unknown";
    }
  }

  startServer() {
    console.log("[DEBUG] Starting llama-server from UI");
    window.stateLlamaServer
      .start()
      .then(() => {
        showNotification("llama-server starting...", "info");
      })
      .catch((e) => {
        console.error("[LLAMA-SERVER] Failed to start:", e);
        showNotification("Failed to start llama-server: " + e.message, "error");
      });
  }

  stopServer() {
    console.log("[DEBUG] Stopping llama-server from UI");
    window.stateLlamaServer
      .stop()
      .then(() => {
        showNotification("llama-server stopping...", "info");
      })
      .catch((e) => {
        console.error("[LLAMA-SERVER] Failed to stop:", e);
        showNotification("Failed to stop llama-server: " + e.message, "error");
      });
  }

  willUnmount() {
    console.log("[DEBUG] LlamaServerStatusPanel willUnmount");
    if (this._unsubscribers) {
      this._unsubscribers.forEach((unsub) => unsub());
    }
  }
}

window.LlamaServerStatusPanel = LlamaServerStatusPanel;
