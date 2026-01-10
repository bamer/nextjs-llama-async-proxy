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
  }

  onMount() {
    console.log("[CHARTS-SECTION] onMount called");
    // Initialize charts after DOM is ready
    requestAnimationFrame(() => {
      console.log("[CHARTS-SECTION] requestAnimationFrame callback");
      setTimeout(() => {
        console.log("[CHARTS-SECTION] Calling _initCharts");
        this._initCharts();
      }, 100);
    });
  }

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

    // Update tab active states
    const cpuTab = this._el?.querySelector("[data-chart=\"cpu\"]");
    const gpuTab = this._el?.querySelector("[data-chart=\"gpu\"]");
    if (cpuTab && gpuTab) {
      const chartType = this.getChartType();
      cpuTab.classList.toggle("active", chartType === "cpu");
      gpuTab.classList.toggle("active", chartType === "gpu");
    }

    // Update canvas visibility
    this._updateVisibility();
  }

  _initCharts() {
    console.log("[CHARTS-SECTION] _initCharts called");

    if (!this.chartManager) {
      console.log("[CHARTS-SECTION] No chartManager available");
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

    // Wait for canvases to have actual dimensions before creating charts
    this._ensureChartDimensions(usageCanvas, "usage", this.chartManager);
    this._ensureChartDimensions(memoryCanvas, "memory", this.chartManager);
  }

  /**
   * Wait for canvas to have actual dimensions before creating chart
   */
  _ensureChartDimensions(canvas, type, chartManager) {
    console.log(
      "[CHARTS-SECTION] _ensureChartDimensions called for type:",
      type,
      "canvas:",
      !!canvas
    );
    if (!canvas) return;

    let retries = 0;
    const maxRetries = 20; // Max 1 second of retries (20 * 50ms)

    const checkDimensions = () => {
      const rect = canvas.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        console.log(`[CHARTS-SECTION] Canvas ${type} dimensions:`, rect.width, "x", rect.height);
        // Explicitly set canvas width/height attributes
        canvas.width = Math.round(rect.width * (window.devicePixelRatio || 1));
        canvas.height = Math.round(rect.height * (window.devicePixelRatio || 1));

        // Get context with device pixel ratio
        const ctx = canvas.getContext("2d");
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

        // Create the chart
        if (type === "usage") {
          chartManager.createUsageChart(canvas, this.history);
        } else {
          chartManager.createMemoryChart(canvas, this.history);
        }

        // Update visibility
        this._updateVisibility();
      } else if (retries < maxRetries) {
        // Canvas doesn't have dimensions yet, retry
        retries++;
        setTimeout(checkDimensions, 50);
      } else {
        // Give up after max retries
        console.warn(
          `[CHARTS-SECTION] Canvas ${type} failed to get dimensions after ${maxRetries} retries`
        );
      }
    };

    // Start checking dimensions immediately
    checkDimensions();
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

  handleChartTab(event) {
    const tab = event.target.closest("[data-chart]");
    if (!tab) return;

    const newType = tab.dataset.chart;

    // Notify parent - parent will update chartType and trigger visibility update
    if (this.props.onChartTypeChange) {
      this.props.onChartTypeChange(newType);
    }

    if (this.chartManager) {
      const canvas = this._el?.querySelector(newType === "usage" ? "#usageChart" : "#memoryChart");

      if (canvas) {
        // Use requestAnimationFrame to wait for visibility change to take effect
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Use _ensureChartDimensions for consistency with onMount
            // This handles the case where canvas isn't visible yet and needs to wait for dimensions
            this._ensureChartDimensions(canvas, newType, this.chartManager);
          }, 10);
        });
      }
    }
  }

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
              "data-chart": "usage",
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
        hasData
          ? Component.h(
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
              })
            )
          : Component.h(
              "div",
              { className: "chart-empty" },
              Component.h("div", { className: "empty-icon" }, "📈"),
              Component.h("p", {}, "Collecting performance data..."),
              Component.h(
                "p",
                { className: "empty-hint" },
                "Data will appear once metrics are collected"
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
