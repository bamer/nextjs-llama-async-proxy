/**
 * Charts Section Component
 * Displays performance history charts with CPU/GPU tabs and stats
 * Fully controlled component - chartType comes from parent DashboardPage
 */

class ChartsSection extends Component {
  constructor(props) {
    super(props);

    this.state = {
      history: props.history || [],
      chartStats: props.chartStats || { current: 0, avg: 0, max: 0 },
    };
  }

  /**
   * Get current chart type from parent DashboardPage
   */
  getChartType() {
    const dashboardPage = this._el?.closest(".dashboard-page");
    return dashboardPage?._component?.state?.chartType || "usage";
  }

  /**
   * Called when parent updates props
   */
  willReceiveProps(newProps) {
    let needsUpdate = false;

    if (newProps.history !== this.state.history) {
      this.state.history = newProps.history;
      needsUpdate = true;
    }
    if (newProps.chartStats !== this.state.chartStats) {
      this.state.chartStats = newProps.chartStats;
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
      const stats = this.state.chartStats;
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

  didMount() {
    console.log("[CHARTS-SECTION] didMount called");
    // Initialize charts after DOM is ready
    requestAnimationFrame(() => {
      console.log("[CHARTS-SECTION] requestAnimationFrame callback");
      setTimeout(() => {
        console.log("[CHARTS-SECTION] Calling _initCharts");
        this._initCharts();
      }, 100);
    });
  }

  _initCharts() {
    console.log("[CHARTS-SECTION] _initCharts called");
    // Use chartManager from props (passed by DashboardPage)
    const chartManager = this.props.chartManager;

    if (!chartManager) {
      console.log("[CHARTS-SECTION] No chartManager in props");
      return;
    }

    // Store for later use
    this.state.chartManager = chartManager;

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
    this._ensureChartDimensions(usageCanvas, "usage", chartManager);
    this._ensureChartDimensions(memoryCanvas, "memory", chartManager);
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
          chartManager.createUsageChart(canvas, this.state.history);
        } else {
          chartManager.createMemoryChart(canvas, this.state.history);
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
    const chartManager = this.props.chartManager || this.state.chartManager;
    const usageCanvas = this._el?.querySelector("#usageChart");
    const memoryCanvas = this._el?.querySelector("#memoryChart");

    if (usageCanvas) {
      usageCanvas.style.display = chartType === "usage" ? "block" : "none";
    }
    if (memoryCanvas) {
      memoryCanvas.style.display = chartType === "memory" ? "block" : "none";
    }
  }

  getEventMap() {
    return {
      "click [data-chart]": "handleChartTab",
    };
  }

  handleChartTab(event) {
    const tab = event.target.closest("[data-chart]");
    if (!tab) return;

    const newType = tab.dataset.chart;

    // Notify parent - parent will update chartType and trigger visibility update
    if (this.props.onChartTypeChange) {
      this.props.onChartTypeChange(newType);
    }

    // Use chartManager from props
    const chartManager = this.props.chartManager || this.state.chartManager;

    if (chartManager) {
      const canvas = this._el?.querySelector(newType === "usage" ? "#usageChart" : "#memoryChart");

      if (canvas) {
        // Use requestAnimationFrame to wait for visibility change to take effect
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Use _ensureChartDimensions for consistency with didMount
            // This handles the case where canvas isn't visible yet and needs to wait for dimensions
            this._ensureChartDimensions(canvas, newType, chartManager);
          }, 10);
        });
      }
    }
  }

  render() {
    const history = this.state.history;
    const chartType = this.getChartType();
    const hasData = history.length > 0;
    const stats = this.state.chartStats;

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
