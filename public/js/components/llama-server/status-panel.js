/**
 * llama-server Status Panel Component - Event-Driven DOM Updates
 */

class LlamaServerStatusPanel extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.status = "unknown";
    this.metrics = null;
    this.uptime = "00:00:00";
    this.pid = null;
    this._detailsExpanded = false;
    this._unsubscribers = [];
  }

  onMount() {
    console.log("[DEBUG] LlamaServerStatusPanel onMount");

    // Subscribe to llama-server status
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

  destroy() {
    console.log("[DEBUG] LlamaServerStatusPanel destroy");
    this._stopMetricsScraper();
    this._unsubscribers.forEach((unsub) => unsub());
    this._unsubscribers = [];
  }

  bindEvents() {
    // Collapse button
    this.on("click", ".collapse-btn", () => this.toggleDetails());

    // Start button
    this.on("click", ".btn-start", () => this.startServer());

    // Stop button
    this.on("click", ".btn-stop", () => this.stopServer());

    // Section toggle
    this.on("click", ".collapse-toggle", (e) => this._toggleSection(e));
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

    this.status = status.status || "unknown";
    this.metrics = status.metrics;
    this.uptime = status.uptime
      ? window.FormatUtils.formatUptime(status.uptime / 1000)
      : "00:00:00";
    this.pid = status.pid || null;

    // Stop metrics scraper when not running
    if (!isRunning) {
      this._stopMetricsScraper();
    }

    this._updateUI();
  }

  handleMetricsChange(metrics) {
    console.log("[DEBUG] LlamaServerStatusPanel metrics change:", metrics);
    this.metrics = metrics;
    this._updateUI();
  }

  _updateUI() {
    if (!this._el) return;

    // Update status badge
    const statusBadge = this._el.querySelector(".status-badge");
    if (statusBadge) {
      statusBadge.className = `status-badge status-${this.status}`;
      statusBadge.querySelector(".status-icon").textContent = this._getStatusIcon(this.status);
      statusBadge.querySelector(".value").textContent = this._getStatusText(this.status);
    }

    // Update start/stop buttons visibility
    const startBtn = this._el.querySelector(".btn-start");
    const stopBtn = this._el.querySelector(".btn-stop");
    if (startBtn) startBtn.style.display = this.status === "stopped" ? "" : "none";
    if (stopBtn) stopBtn.style.display = this.status === "running" ? "" : "none";

    // Update summary
    const uptimeEl = this._el.querySelector(".summary-item:nth-child(2) .value");
    if (uptimeEl) uptimeEl.textContent = this.uptime;

    if (this.pid) {
      const pidEl = this._el.querySelector(".summary-item:first-child .value");
      if (pidEl) pidEl.textContent = this._getStatusText(this.status);
    }
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
        showNotification(`Failed to start llama-server: ${e.message}`, "error");
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
        showNotification(`Failed to stop llama-server: ${e.message}`, "error");
      });
  }

  render() {
    const statusIcon = this._getStatusIcon(this.status);
    const statusText = this._getStatusText(this.status);

    // Extract metrics with defaults
    const throughputMetrics = {
      promptTokensSeconds: this.metrics?.promptTokensSeconds ?? 0,
      predictedTokensSeconds: this.metrics?.predictedTokensSeconds ?? 0,
    };

    const serverMetrics = {
      nCtx: this.metrics?.nCtx ?? 0,
      nBatch: this.metrics?.nBatch ?? 0,
      nUbatch: this.metrics?.nUbatch ?? 0,
      nThreads: this.metrics?.nThreads ?? 0,
      nParallel: this.metrics?.nParallel ?? 0,
      nKvReq: this.metrics?.nKvReq ?? 0,
      nKv: this.metrics?.nKv ?? 0,
      vramTotal: this.metrics?.vramTotal ?? 0,
      vramUsed: this.metrics?.vramUsed ?? 0,
    };

    const tokenMetrics = {
      nTokensProcessed: this.metrics?.nTokensProcessed ?? 0,
      nTokensPredicted: this.metrics?.nTokensPredicted ?? 0,
      nTokensTotal: this.metrics?.nTokensTotal ?? 0,
    };

    const timeMetrics = {
      promptEvalTimeMs: this.metrics?.promptEvalTimeMs ?? 0,
      tokensEvaluatedPerSecond: this.metrics?.tokensEvaluatedPerSecond ?? 0,
    };

    return Component.h("div", { className: "llama-server-status-panel" }, [
      Component.h("div", { className: "status-header" }, [
        Component.h("h3", {}, "llama-server"),
        Component.h("div", { className: `status-badge status-${this.status}` }, [
          Component.h("span", { className: "status-icon" }, statusIcon),
          Component.h("span", { className: "value" }, statusText),
        ]),
        Component.h(
          "button",
          {
            className: "collapse-btn",
            "aria-label": this._detailsExpanded ? "Hide details" : "Show details",
            "aria-expanded": this._detailsExpanded,
          },
          [Component.h("span", { className: "chevron-icon" }, "▶"), "Metrics"]
        ),
      ]),
      Component.h("div", { className: "controls" }, [
        Component.h(
          "button",
          {
            className: "btn btn-start",
            style: this.status === "stopped" ? "" : "display: none;",
          },
          "Start"
        ),
        Component.h(
          "button",
          {
            className: "btn btn-stop",
            style: this.status === "running" ? "" : "display: none;",
          },
          "Stop"
        ),
      ]),
      Component.h("div", { className: "status-summary" }, [
        Component.h("div", { className: "summary-grid" }, [
          Component.h("div", { className: "summary-item" }, [
            Component.h("span", { className: "label" }, "Status:"),
            Component.h("span", { className: "value" }, statusText),
          ]),
          this.pid &&
            Component.h("div", { className: "summary-item" }, [
              Component.h("span", { className: "label" }, "PID:"),
              Component.h("span", { className: "value" }, String(this.pid)),
            ]),
          Component.h("div", { className: "summary-item" }, [
            Component.h("span", { className: "label" }, "Uptime:"),
            Component.h("span", { className: "value" }, this.uptime),
          ]),
        ]),
      ]),
      Component.h(
        "div",
        {
          className: "llama-metrics",
          style: this._detailsExpanded ? "display: block;" : "display: none;",
        },
        [
          this._renderThroughputMetrics(throughputMetrics),
          this._renderServerConfigSection(serverMetrics),
          this._renderTokenMetrics(tokenMetrics),
          this._renderTimeMetrics(timeMetrics),
        ]
      ),
    ]);
  }

  _renderThroughputMetrics(metrics) {
    return Component.h("div", { className: "metrics-section" }, [
      Component.h("h4", { className: "section-title" }, "Throughput Metrics"),
      Component.h("div", { className: "metrics-grid" }, [
        this._renderMetric("Prompt Tokens/sec", metrics.promptTokensSeconds, "tokens/s"),
        this._renderMetric("Predicted Tokens/sec", metrics.predictedTokensSeconds, "tokens/s"),
      ]),
    ]);
  }

  _renderServerConfigSection(metrics) {
    return Component.h("div", { className: "metrics-section" }, [
      Component.h("h4", { className: "section-title collapsible-header" }, [
        Component.h("span", {}, "Server Configuration"),
        Component.h(
          "button",
          {
            className: "collapse-toggle",
            "data-section": "server-config",
          },
          Component.h("span", { className: "chevron" }, "▶")
        ),
      ]),
      Component.h(
        "div",
        {
          className: "metrics-grid collapsible-content",
          id: "server-config-section",
          style: "display: grid;",
        },
        [
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
            this._renderMetric("Used VRAM", `${(metrics.vramUsed / 1024 / 1024).toFixed(2)} GB`),
        ]
      ),
    ]);
  }

  _renderTokenMetrics(metrics) {
    return Component.h("div", { className: "metrics-section" }, [
      Component.h("h4", { className: "section-title" }, "Token Metrics"),
      Component.h("div", { className: "metrics-grid" }, [
        this._renderMetric("Tokens Processed", metrics.nTokensProcessed, ""),
        this._renderMetric("Tokens Predicted", metrics.nTokensPredicted, ""),
        this._renderMetric("Total Tokens", metrics.nTokensTotal, ""),
      ]),
    ]);
  }

  _renderTimeMetrics(metrics) {
    return Component.h("div", { className: "metrics-section" }, [
      Component.h("h4", { className: "section-title" }, "Time Metrics"),
      Component.h("div", { className: "metrics-grid" }, [
        this._renderMetric("Prompt Eval Time", metrics.promptEvalTimeMs, "ms"),
        this._renderMetric(
          "Tokens Evaluated/sec",
          metrics.tokensEvaluatedPerSecond.toFixed(2),
          "tokens/s"
        ),
      ]),
    ]);
  }

  _renderMetric(label, value, unit = "") {
    const displayValue = unit ? `${value} ${unit}` : String(value);
    return Component.h("div", { className: "metric-item" }, [
      Component.h("span", { className: "metric-label" }, label),
      Component.h("span", { className: "metric-value" }, displayValue),
    ]);
  }
}

window.LlamaServerStatusPanel = LlamaServerStatusPanel;
console.log("[LLAMA-SERVER] Status panel module loaded");
