/**
 * LlamaRouterCard - Modern Unified Component
 * Pure Event-Driven DOM Updates
 * FIXED: Single toggle button, respects correct port from config
 */
class LlamaRouterCard extends Component {
  constructor(props) {
    super(props);
    this.routerLoading = false;
    this.unsubscribers = [];
    this.selectedPreset = "";
  }

  onMount() {
    if (this._el) this._el._component = this;
    this._updateUI();
    this._updatePresetSelect();

    this.unsubscribers = [
      stateManager.subscribe("llamaServerStatus", (s) => { 
        this.props.status = s; 
        this._updateUI(); 
      }),
      stateManager.subscribe("routerStatus", (rs) => { 
        this.props.routerStatus = rs; 
        this._updateUI(); 
      }),
      stateManager.subscribe("llamaServerMetrics", (m) => { 
        this.props.metrics = m; 
        this._updateDetailedMetrics(); 
      }),
      stateManager.subscribe("presets", (p) => { 
        this.props.presets = p || []; 
        this._updatePresetSelect(); 
      }),
      stateManager.subscribe("routerLoading", (loading) => { 
        this.routerLoading = !!loading; 
        this._updateUI(); 
      })
    ];

    if (window.MetricsScraper) this._setupScraper();
  }

  destroy() {
    this.unsubscribers.forEach(u => u());
    if (this._scraper) this._scraper.stop();
  }

  _setupScraper() {
    const url = window.stateLlamaServer?.getServerUrl?.();
    if (!url) return;
    this._scraper = new window.MetricsScraper(url, 5000);
    this._scraper.start(m => stateManager.set("llamaServerMetrics", m));
  }

  _updateUI() {
    if (!this._el) return;
    
    // Maintain component link
    if (this._el._component !== this) this._el._component = this;

    const status = this.props.status || {};
    const rs = this.props.routerStatus || {};
    
    // FIXED: Only consider running if status is explicitly "running"
    // The port being set doesn't mean the router is running - check processRunning
    const isRunning = status.status === "running" || status.processRunning === true;
    const loading = this.routerLoading;

    // 1. Status Indicator & Text
    const indicator = this.$(".status-indicator");
    if (indicator) {
      indicator.className = `status-indicator ${loading ? "loading" : (isRunning ? "running" : "stopped")}`;
    }
    
    this.setText(".badge-text", loading 
      ? (isRunning ? "STOPPING..." : "STARTING...") 
      : (isRunning ? "RUNNING" : "STOPPED")
    );

    // Header Port (RESPECT SETTINGS)
    const config = window.stateManager.get("config") || {};
    const displayPort = config.port || status.port || 8080;
    const titleText = isRunning ? `Llama Router : ${displayPort}` : "Llama Router";
    this.setText(".header-title-text", titleText);

    // 2. Glance Grid
    this.setText("[data-glance=\"prompt-ts\"]", `${(this.props.metrics?.promptTokensSeconds || 0).toFixed(1)} t/s`);
    const loadedCount = (rs.models || []).filter(m => m.state === "loaded").length;
    const totalModels = (this.props.models || []).length || 0;
    this.setText("[data-glance=\"models\"]", `${loadedCount}/${totalModels}`);
    this.setText("[data-glance=\"uptime\"]", window.FormatUtils.formatUptime((status.uptime || 0)/1000));
    
    const vramTotal = this.props.metrics?.vramTotal || 0;
    this.setText("[data-glance=\"vram\"]", vramTotal > 0 ? window.FormatUtils.formatBytes(vramTotal) : "N/A");

    // 3. Single Unified Toggle Button
    const mainBtn = this.$("[data-action=\"toggle\"]");
    const restartBtn = this.$("[data-action=\"restart\"]");

    if (mainBtn) {
      mainBtn.disabled = loading;
      if (isRunning) {
        mainBtn.textContent = loading ? "Stopping..." : "Stop Router";
        mainBtn.className = "btn btn-danger btn-stop";
        mainBtn.setAttribute("data-action-type", "stop");
      } else {
        mainBtn.textContent = loading ? "Starting..." : "Start Router";
        mainBtn.className = "btn btn-primary btn-start";
        mainBtn.setAttribute("data-action-type", "start");
      }
    }
    
    if (restartBtn) {
      restartBtn.disabled = !isRunning || loading;
      restartBtn.textContent = loading ? "Restarting..." : "Restart";
    }
  }

  _updateDetailedMetrics() {
    if (!this._el || !this.props.metrics) return;
    const m = this.props.metrics;
    this.setText("[data-metric=\"prompt-ts\"]", `${(m.promptTokensSeconds || 0).toFixed(2)} t/s`);
    this.setText("[data-metric=\"pred-ts\"]", `${(m.predictedTokensSeconds || 0).toFixed(2)} t/s`);
    this.setText("[data-metric=\"vram-total\"]", window.FormatUtils.formatBytes(m.vramTotal || 0));
    this.setText("[data-metric=\"vram-used\"]", window.FormatUtils.formatBytes(m.vramUsed || 0));
    this.setText("[data-metric=\"n-ctx\"]", m.nCtx || "N/A");
    this.setText("[data-metric=\"n-parallel\"]", m.nParallel || "N/A");
    this.setText("[data-metric=\"n-threads\"]", m.nThreads || "N/A");
    this.setText("[data-glance=\"prompt-ts\"]", `${(m.promptTokensSeconds || 0).toFixed(1)} t/s`);
    
    const vramTotal = m.vramTotal || 0;
    this.setText("[data-glance=\"vram\"]", vramTotal > 0 ? window.FormatUtils.formatBytes(vramTotal) : "N/A");
  }

  _updatePresetSelect() {
    const select = this.$("#preset-select");
    if (!select) return;
    const presets = this.props.presets || [];
    const currentVal = this.selectedPreset;
    let html = "<option value=\"\">Select Preset...</option>";
    presets.forEach(p => {
      html += `<option value="${p.name}" ${p.name === currentVal ? "selected" : ""}>${p.name}</option>`;
    });
    if (select.innerHTML !== html) select.innerHTML = html;
  }

  bindEvents() {
    this.on("click", ".details-toggle-btn", () => {
      const area = this.$(".detailed-metrics-area");
      const isExpanded = area.classList.toggle("expanded");
      this.toggleClass(".details-toggle-btn", "expanded", isExpanded);
    });
    this.on("change", "#preset-select", (e) => { this.selectedPreset = e.target.value; });
    
    this.on("click", "[data-action=\"toggle\"]", (e, target) => {
      if (this.routerLoading) return;
      const type = target.getAttribute("data-action-type");
      
      if (type === "start") {
        if (this.selectedPreset) this.props.onAction("start-with-preset", this.selectedPreset);
        else this.props.onAction("start");
      } else {
        this.props.onAction("stop");
      }
    });

    this.on("click", "[data-action=\"restart\"]", () => {
      if (this.routerLoading) return;
      this.props.onAction("restart");
    });
  }

  render() {
    return Component.h("div", { className: "llama-router-status-card" }, [
      Component.h("div", { className: "status-card-header" }, [
        Component.h("div", { className: "header-main" }, [
          Component.h("h3", { className: "header-title" }, [
            Component.h("i", { className: "ri-server-line" }), 
            Component.h("span", { className: "header-title-text" }, "Llama Router")
          ]),
          Component.h("div", { className: "status-badge-container" }, [
            Component.h("span", { className: "status-indicator stopped" }),
            Component.h("span", { className: "badge-text" }, "STOPPED")
          ])
        ])
      ]),
      Component.h("div", { className: "status-glance-grid" }, [
        this._renderGlanceItem("Prompt", "prompt-ts"),
        this._renderGlanceItem("Models", "models"),
        this._renderGlanceItem("VRAM", "vram"),
        this._renderGlanceItem("Uptime", "uptime")
      ]),
      Component.h("div", { className: "status-controls-bar" }, [
        Component.h("div", { className: "preset-group" }, [
          Component.h("select", { id: "preset-select", className: "preset-dropdown" }),
          Component.h("button", { 
            className: "btn btn-primary btn-start", 
            "data-action": "toggle", 
            "data-action-type": "start" 
          }, "Start Router")
        ]),
        Component.h("div", { className: "action-group" }, [
          Component.h("button", { 
            className: "btn btn-secondary", 
            "data-action": "restart", 
            disabled: true 
          }, "Restart")
        ])
      ]),
      Component.h("button", { className: "details-toggle-btn" }, [
        Component.h("span", { className: "chevron" }, "▼"), " Detailed Metrics"
      ]),
      Component.h("div", { className: "detailed-metrics-area" }, [
        this._renderMetricsGroup("Throughput", { "Prompt": "prompt-ts", "Predicted": "pred-ts" }),
        this._renderMetricsGroup("Memory (VRAM)", { "Total": "vram-total", "Used": "vram-used" }),
        this._renderMetricsGroup("Server Config", { "Ctx Size": "n-ctx", "Parallel": "n-parallel", "Threads": "n-threads" })
      ])
    ]);
  }

  _renderGlanceItem(label, key) {
    return Component.h("div", { className: "glance-item" }, [
      Component.h("span", { className: "glance-label" }, label),
      Component.h("span", { className: "glance-value", "data-glance": key }, "...")
    ]);
  }

  _renderMetricsGroup(title, metricsMap) {
    return Component.h("div", { className: "metrics-group" }, [
      Component.h("h4", {}, title),
      Component.h("div", { className: "metrics-subgrid" }, 
        Object.entries(metricsMap).map(([name, dataKey]) => Component.h("div", { className: "metric-row" }, [
          Component.h("span", { className: "metric-name" }, name),
          Component.h("span", { className: "metric-data", "data-metric": dataKey }, "...")
        ]))
      )
    ]);
  }
}

window.LlamaRouterCard = LlamaRouterCard;
