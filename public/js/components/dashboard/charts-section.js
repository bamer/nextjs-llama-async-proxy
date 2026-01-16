/**
  * ChartsSection Component - Event-Driven DOM Updates
  * Displays performance history charts with CPU/GPU tabs and stats
  */

class ChartsSection extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.history = props.history || [];
    this.chartStats = props.chartStats || { current: 0, avg: 0, max: 0 };
    this.chartManager = props.chartManager || null;
    this.chartsInitialized = false;
  }

  /**
    * Called after component is mounted to DOM. Initializes chart subscriptions and charts.
    */
  onMount() {
    console.log("[CHARTS-SECTION] onMount called");
    // Subscribe to metrics history updates
    this._historyUnsub = stateManager.subscribe("metricsHistory", (history) => {
      if (Array.isArray(history) && history.length > 0) {
        this.history = history;
        this.updateDOM();
      }
    });
    // Initialize charts immediately without artificial delays
    this._initCharts();
  }

  /**
    * Clean up subscriptions and event listeners.
    */
  destroy() {
    if (this._historyUnsub) {
      this._historyUnsub();
    }
    super.destroy();
  }

  /**
    * Bind event listeners for chart tab interactions.
    */
  bindEvents() {
    // Chart tab clicks
    this.on("click", "[data-chart]", (e) => {
      this.handleChartTab(e);
    });
  }

  /**
    * Get current chart type from parent DashboardPage
    */
  getChartType() {
    const dashboardPage = this._el?.closest(".dashboard-page");
    return dashboardPage?._component?.chartType || "usage";
  }

  /**
    * Update component with new props
    */
  updateData(history, chartStats) {
    let needsUpdate = false;

    if (history !== this.history) {
      this.history = history;
      needsUpdate = true;
    }
    if (chartStats !== this.chartStats) {
      this.chartStats = chartStats;
      needsUpdate = true;
    }

    if (needsUpdate && this._el) {
      this.updateDOM();
    }
  }

  /**
    * Only update the DOM parts that changed, without full re-render
    */
  updateDOM() {
    // Update chart stats
    const statsEl = this._el?.querySelector(".chart-stats");
    if (statsEl) {
      const stats = this.chartStats;
      const statValues = statsEl.querySelectorAll(".chart-stat-value");
      if (statValues.length >= 3) {
        statValues[0].textContent = `${stats.current.toFixed(1)}%`;
        statValues[1].textContent = `${stats.avg.toFixed(1)}%`;
        statValues[2].textContent = `${stats.max.toFixed(1)}%`;
      }
    }

    // Update tab active states - IMMEDIATE update
    this._updateTabStates();

    // Hide overlay when data is available
    const overlay = this._el?.querySelector(".chart-empty-overlay");
    if (overlay && this.history.length > 0) {
      overlay.style.display = "none";
    }

    // Update canvas visibility
    this._updateVisibility();
  }

  /**
    * Update tab button active states immediately
    */
  _updateTabStates() {
    const cpuTab = this._el?.querySelector("[data-chart=\"cpu\"]");
    const gpuTab = this._el?.querySelector("[data-chart=\"memory\"]");
    if (cpuTab && gpuTab) {
      const chartType = this.getChartType();
      cpuTab.classList.toggle("active", chartType === "usage");
      gpuTab.classList.toggle("active", chartType === "memory");
    }
  }

  _initCharts() {
    console.log("[CHARTS-SECTION] _initCharts called");

    if (!this.chartManager) {
      console.log("[CHARTS-SECTION] No chartManager available");
      return;
    }

    if (this.chartsInitialized) {
      console.log("[CHARTS-SECTION] Charts already initialized, skipping");
      return;
    }

    // Get canvases
    const usageCanvas = this._el?.querySelector("#usageChart");
    const memoryCanvas = this._el?.querySelector("#memoryChart");

    console.log(
      "[CHARTS-SECTION] Found canvases - usage:",
      !!usageCanvas,
      "memory:",
      !!memoryCanvas
    );

    // Create charts immediately if canvases are available
    if (usageCanvas && memoryCanvas) {
      this._createChartsImmediately(usageCanvas, memoryCanvas);
    } else {
      // Wait for canvases with minimal delay
      let attempts = 0;
      const maxAttempts = 20; // Max 200ms (10 * 20ms)
      const checkCanvas = () => {
        const usageCanvas = this._el?.querySelector("#usageChart");
        const memoryCanvas = this._el?.querySelector("#memoryChart");
        if (usageCanvas && memoryCanvas) {
          this._createChartsImmediately(usageCanvas, memoryCanvas);
        } else if (attempts < maxAttempts) {
          attempts++;
          requestAnimationFrame(checkCanvas);
        } else {
          console.warn("[CHARTS-SECTION] Canvases not found after max attempts");
        }
      };
      requestAnimationFrame(checkCanvas);
    }
  }

  /**
    * Create charts immediately without dimension polling
    */
  _createChartsImmediately(usageCanvas, memoryCanvas) {
    const dpr = window.devicePixelRatio || 1;

    // Set canvas dimensions based on container
    const setCanvasDimensions = (canvas) => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const width = rect.width || 600;
        const height = 250;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    };

    setCanvasDimensions(usageCanvas);
    setCanvasDimensions(memoryCanvas);

    // Create charts with current history
    if (this.history.length > 0) {
      this.chartManager.createUsageChart(usageCanvas, this.history);
      this.chartManager.createMemoryChart(memoryCanvas, this.history);
    } else {
      this.chartManager.createUsageChart(usageCanvas, []);
      this.chartManager.createMemoryChart(memoryCanvas, []);
    }

    this.chartsInitialized = true;

    // Update visibility based on current chart type
    this._updateVisibility();

    // Hide overlay if we have data
    if (this.history.length > 0) {
      const overlay = this._el?.querySelector(".chart-empty-overlay");
      if (overlay) overlay.style.display = "none";
    }

    console.log("[CHARTS-SECTION] Charts initialized successfully");
  }

  /**
    * Update chart visibility based on current chart type
    */
  _updateVisibility() {
    const chartType = this.getChartType();
    const usageCanvas = this._el?.querySelector("#usageChart");
    const memoryCanvas = this._el?.querySelector("#memoryChart");

    if (usageCanvas) {
      usageCanvas.style.display = chartType === "usage" ? "block" : "none";
    }
    if (memoryCanvas) {
      memoryCanvas.style.display = chartType === "memory" ? "block" : "none";
    }
  }

  /**
    * Handle chart tab click events to switch between usage and memory charts.
    * @param {Event} event - The click event.
    */
  handleChartTab(event) {
    const tab = event.target.closest("[data-chart]");
    if (!tab) return;

    const newType = tab.dataset.chart;

    // Map button type to chart type
    const chartType = newType === "cpu" ? "usage" : "memory";

    // Update parent state
    if (this.props.onChartTypeChange) {
      this.props.onChartTypeChange(chartType);
    }

    // Update button states IMMEDIATELY (no wait for re-render)
    this._updateTabStates();

    // Update canvas visibility (no chart recreation needed)
    this._updateVisibility();
  }

  /**
    * Render the charts section component.
    * @returns {HTMLElement} The rendered component element.
    */
  render() {
    const chartType = this.getChartType();
    const hasData = this.history.length > 0;
    const stats = this.chartStats;

    return Component.h(
      "div",
      { className: "charts-section" },
      Component.h(
        "div",
        { className: "charts-header" },
        Component.h("h3", {}, "Performance History"),
        Component.h(
          "div",
          { className: "chart-tabs" },
          Component.h(
            "button",
            {
              className: `chart-tab ${chartType === "usage" ? "active" : ""}`,
              "data-chart": "cpu",
            },
            "CPU & GPU Usage"
          ),
          Component.h(
            "button",
            {
              className: `chart-tab ${chartType === "memory" ? "active" : ""}`,
              "data-chart": "memory",
            },
            "Memory Usage"
          )
        )
      ),
      Component.h(
        "div",
        { className: "chart-container" },
        // Always create canvases, show placeholder overlay when no data
        Component.h(
          "div",
          { className: "chart-wrapper" },
          Component.h("canvas", {
            id: "usageChart",
            className: "chart-canvas",
            style: `display: ${chartType === "usage" ? "block" : "none"}`,
          }),
          Component.h("canvas", {
            id: "memoryChart",
            className: "chart-canvas",
            style: `display: ${chartType === "memory" ? "block" : "none"}`,
          }),
          // Placeholder overlay when no data
          !hasData &&
            Component.h(
              "div",
              { className: "chart-empty-overlay" },
              Component.h("div", { className: "empty-icon" }, "📈"),
              Component.h("p", {}, "Collecting performance data..."),
              Component.h("p", { className: "empty-hint" }, "Data will appear once metrics are collected")
            )
        )
      ),
      hasData &&
        Component.h(
          "div",
          { className: "chart-stats" },
          Component.h(
            "div",
            { className: "chart-stat" },
            Component.h("span", { className: "chart-stat-label" }, "Current"),
            Component.h("span", { className: "chart-stat-value" }, `${stats.current.toFixed(1)}%`)
          ),
          Component.h(
            "div",
            { className: "chart-stat" },
            Component.h("span", { className: "chart-stat-label" }, "Average"),
            Component.h("span", { className: "chart-stat-value" }, `${stats.avg.toFixed(1)}%`)
          ),
          Component.h(
            "div",
            { className: "chart-stat" },
            Component.h("span", { className: "chart-stat-label" }, "Max"),
            Component.h("span", { className: "chart-stat-value" }, `${stats.max.toFixed(1)}%`)
          )
        )
    );
  }
}

window.ChartsSection = ChartsSection;
