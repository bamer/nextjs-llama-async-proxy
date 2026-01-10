/**
 * llama-server Status Panel Component - With Comprehensive Metrics
 */

class LlamaServerStatusPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: "unknown",
      metrics: null,
      uptime: "00:00:00",
      pid: null,
      collapsed: true,
    };
    this._detailsExpanded = false;
  }

  willMount() {
    console.log("[DEBUG] LlamaServerStatusPanel willMount");
    // Subscribe to llama-server status
    this._unsubscribers = [];
    this._unsubscribers.push(
      stateManager.subscribe("llamaServerStatus", this.handleStatusChange.bind(this))
    );
    this._unsubscribers.push(
      stateManager.subscribe("llamaServerMetrics", this.handleMetricsChange.bind(this))
    );

    // Start metrics scraper if available
    if (window.MetricsScraper) {
      this._setupMetricsScraper();
    }
  }

  _setupMetricsScraper() {
    const serverUrl = window.stateLlamaServer?.getServerUrl?.();
    if (!serverUrl) {
      console.log("[DEBUG] LlamaServerStatusPanel: Server URL not available yet");
      return;
    }

    console.log("[DEBUG] LlamaServerStatusPanel: Starting metrics scraper");
    this._metricsScraper = new window.MetricsScraper(serverUrl, 5000);

    this._metricsScraper.start((metrics) => {
      console.log("[DEBUG] MetricsScraper callback:", metrics);
      stateManager.set("llamaMetrics", metrics);
    });
  }

  _stopMetricsScraper() {
    if (this._metricsScraper) {
      this._metricsScraper.stop();
      this._metricsScraper = null;
    }
  }

  handleStatusChange(status) {
    console.log("[DEBUG] LlamaServerStatusPanel status change:", status);
    const isRunning = status.status === "running";

    this.setState({
      status: status.status || "unknown",
      metrics: status.metrics,
      uptime: status.uptime ? window.FormatUtils.formatUptime(status.uptime / 1000) : "00:00:00",
      pid: status.pid || null,
    });

    // Stop metrics scraper when not running
    if (!isRunning) {
      this._stopMetricsScraper();
    }
  }

  handleMetricsChange(metrics) {
    console.log("[DEBUG] LlamaServerStatusPanel metrics change:", metrics);
    this.setState({ metrics });
  }

  toggleDetails() {
    this._detailsExpanded = !this._detailsExpanded;
    const details = this._el.querySelector(".llama-metrics");
    if (details) {
      details.style.display = this._detailsExpanded ? "block" : "none";
    }
    const chevron = this._el.querySelector(".chevron-icon");
    if (chevron) {
      chevron.style.transform = this._detailsExpanded ? "rotate(90deg)" : "rotate(0deg)";
    }
  }

  render() {
    const { status, metrics, uptime, pid } = this.state;

    const statusIcon = this._getStatusIcon(status);
    const statusText = this._getStatusText(status);

    // Extract metrics with defaults
    const throughputMetrics = {
      promptTokensSeconds: metrics?.promptTokensSeconds ?? 0,
      predictedTokensSeconds: metrics?.predictedTokensSeconds ?? 0,
    };

    const serverMetrics = {
      nCtx: metrics?.nCtx ?? 0,
      nBatch: metrics?.nBatch ?? 0,
      nUbatch: metrics?.nUbatch ?? 0,
      nThreads: metrics?.nThreads ?? 0,
      nParallel: metrics?.nParallel ?? 0,
      nKvReq: metrics?.nKvReq ?? 0,
      nKv: metrics?.nKv ?? 0,
      vramTotal: metrics?.vramTotal ?? 0,
      vramUsed: metrics?.vramUsed ?? 0,
    };

    const tokenMetrics = {
      nTokensProcessed: metrics?.nTokensProcessed ?? 0,
      nTokensPredicted: metrics?.nTokensPredicted ?? 0,
      nTokensTotal: metrics?.nTokensTotal ?? 0,
    };

    const timeMetrics = {
      promptEvalTimeMs: metrics?.promptEvalTimeMs ?? 0,
      tokensEvaluatedPerSecond: metrics?.tokensEvaluatedPerSecond ?? 0,
    };

    return Component.h(
      "div",
      { className: "llama-server-status-panel" },
      Component.h(
        "div",
        { className: "status-header" },
        Component.h("h3", {}, "llama-server"),
        Component.h(
          "div",
          { className: `status-badge status-${  status}` },
          Component.h("span", { className: "status-icon" }, statusIcon),
          Component.h("span", {}, statusText)
        ),
        Component.h(
          "button",
          {
            className: "collapse-btn",
            onClick: () => this.toggleDetails(),
            "aria-label": this._detailsExpanded ? "Hide details" : "Show details",
            "aria-expanded": this._detailsExpanded,
          },
          Component.h("span", { className: "chevron-icon" }, "▶"),
          "Metrics"
        )
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
      ),
      Component.h(
        "div",
        { className: "status-summary" },
        Component.h(
          "div",
          { className: "summary-grid" },
          Component.h(
            "div",
            { className: "summary-item" },
            Component.h("span", { className: "label" }, "Status:"),
            Component.h("span", { className: "value" }, statusText)
          ),
          pid &&
            Component.h(
              "div",
              { className: "summary-item" },
              Component.h("span", { className: "label" }, "PID:"),
              Component.h("span", { className: "value" }, String(pid))
            ),
          Component.h(
            "div",
            { className: "summary-item" },
            Component.h("span", { className: "label" }, "Uptime:"),
            Component.h("span", { className: "value" }, uptime)
          )
        )
      ),
      Component.h(
        "div",
        {
          className: "llama-metrics",
          style: this._detailsExpanded ? "display: block;" : "display: none;",
        },
        this._renderThroughputMetrics(throughputMetrics),
        this._renderServerConfigSection(serverMetrics),
        this._renderTokenMetrics(tokenMetrics),
        this._renderTimeMetrics(timeMetrics)
      )
    );
  }

  _renderThroughputMetrics(metrics) {
    return Component.h(
      "div",
      { className: "metrics-section" },
      Component.h("h4", { className: "section-title" }, "Throughput Metrics"),
      Component.h(
        "div",
        { className: "metrics-grid" },
        this._renderMetric("Prompt Tokens/sec", metrics.promptTokensSeconds, "tokens/s"),
        this._renderMetric("Predicted Tokens/sec", metrics.predictedTokensSeconds, "tokens/s")
      )
    );
  }

  _renderServerConfigSection(metrics) {
    return Component.h(
      "div",
      { className: "metrics-section" },
      Component.h(
        "h4",
        { className: "section-title collapsible-header" },
        Component.h("span", {}, "Server Configuration"),
        Component.h(
          "button",
          {
            className: "collapse-toggle",
            "data-section": "server-config",
            onClick: (e) => this._toggleSection(e),
          },
          Component.h("span", { className: "chevron" }, "▶")
        )
      ),
      Component.h(
        "div",
        {
          className: "metrics-grid collapsible-content",
          id: "server-config-section",
          style: "display: grid;",
        },
        this._renderMetric("Context Size (n_ctx)", metrics.nCtx, "tokens"),
        this._renderMetric("Batch Size (n_batch)", metrics.nBatch, ""),
        this._renderMetric("Upper Batch (n_ubatch)", metrics.nUbatch, ""),
        this._renderMetric("Threads (n_threads)", metrics.nThreads, ""),
        this._renderMetric("Parallel Slots (n_parallel)", metrics.nParallel, ""),
        this._renderMetric("KV Cache Req (n_kv_req)", metrics.nKvReq, ""),
        this._renderMetric("KV Cache Size (n_kv)", metrics.nKv, ""),
        metrics.vramTotal > 0 &&
          this._renderMetric("Total VRAM", `${(metrics.vramTotal / 1024 / 1024).toFixed(2)} GB`),
        metrics.vramUsed > 0 &&
          this._renderMetric("Used VRAM", `${(metrics.vramUsed / 1024 / 1024).toFixed(2)} GB`)
      )
    );
  }

  _renderTokenMetrics(metrics) {
    return Component.h(
      "div",
      { className: "metrics-section" },
      Component.h("h4", { className: "section-title" }, "Token Metrics"),
      Component.h(
        "div",
        { className: "metrics-grid" },
        this._renderMetric("Tokens Processed", metrics.nTokensProcessed, ""),
        this._renderMetric("Tokens Predicted", metrics.nTokensPredicted, ""),
        this._renderMetric("Total Tokens", metrics.nTokensTotal, "")
      )
    );
  }

  _renderTimeMetrics(metrics) {
    return Component.h(
      "div",
      { className: "metrics-section" },
      Component.h("h4", { className: "section-title" }, "Time Metrics"),
      Component.h(
        "div",
        { className: "metrics-grid" },
        this._renderMetric("Prompt Eval Time", metrics.promptEvalTimeMs, "ms"),
        this._renderMetric(
          "Tokens Evaluated/sec",
          metrics.tokensEvaluatedPerSecond.toFixed(2),
          "tokens/s"
        )
      )
    );
  }

  _renderMetric(label, value, unit = "") {
    const displayValue = unit ? `${value} ${unit}` : String(value);
    return Component.h(
      "div",
      { className: "metric-item" },
      Component.h("span", { className: "metric-label" }, label),
      Component.h("span", { className: "metric-value" }, displayValue)
    );
  }

  _toggleSection(event) {
    const section = event.target.closest("[data-section]");
    const sectionId = section?.dataset?.section;
    if (!sectionId) return;

    const content = document.getElementById(`${sectionId}-section`);
    const chevron = section.querySelector(".chevron");

    if (content && chevron) {
      const isExpanded = content.style.display !== "none";
      content.style.display = isExpanded ? "none" : "grid";
      chevron.style.transform = isExpanded ? "rotate(0deg)" : "rotate(90deg)";
      section.setAttribute("aria-expanded", !isExpanded);
    }
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
        showNotification(`Failed to start llama-server: ${  e.message}`, "error");
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
        showNotification(`Failed to stop llama-server: ${  e.message}`, "error");
      });
  }

  willUnmount() {
    console.log("[DEBUG] LlamaServerStatusPanel willUnmount");
    // Stop metrics scraper
    this._stopMetricsScraper();
    // Unsubscribe from state
    if (this._unsubscribers) {
      this._unsubscribers.forEach((unsub) => unsub());
    }
  }
}

window.LlamaServerStatusPanel = LlamaServerStatusPanel;
console.log("[LLAMA-SERVER] Status panel module loaded");
