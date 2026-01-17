/**
 * Chart Manager - Orchestrates chart creation, updates, and lifecycle
 */
/* global ChartColors UsageChart MemoryChart ChartUtils */

if (typeof ChartManager === "undefined") {
  class ChartManager {
    constructor(options = {}) {
      this.state = options.state || { chartType: "usage", history: [] };
      this.chartColors = new ChartColors(document.documentElement.classList.contains("dark-mode"));
      this.usageChart = new UsageChart(null, this.chartColors);
      this.memoryChart = new MemoryChart(null, this.chartColors);
      this.themeObserver = this._observeThemeChanges();
    }

    /**
     * Observe theme changes and update charts
     */
    _observeThemeChanges() {
      return this.chartColors.createThemeObserver((isDark) => {
        this._recreateCharts();
      });
    }

    /**
     * Recreate charts with current theme colors
     */
    _recreateCharts() {
      const usageData = this.usageChart.getData();
      const memoryData = this.memoryChart.getData();

      this.usageChart.destroy();
      this.memoryChart.destroy();

      if (usageData) {
        const canvas = this._getChartCanvas("usage");
        if (canvas) {
          this.usageChart = new UsageChart(null, this.chartColors);
          ChartUtils.recreateChartWithData(canvas, "usage", usageData, {
            onCreateUsageChart: (c, h) => this.usageChart.create(c, h),
            onCreateMemoryChart: null,
          });
        }
      }

      if (memoryData) {
        const canvas = this._getChartCanvas("memory");
        if (canvas) {
          this.memoryChart = new MemoryChart(null, this.chartColors);
          ChartUtils.recreateChartWithData(canvas, "memory", memoryData, {
            onCreateUsageChart: null,
            onCreateMemoryChart: (c, h) => this.memoryChart.create(c, h),
          });
        }
      }
    }

    /**
     * Get canvas element for chart type
     * @param {string} type - Chart type
     * @returns {HTMLCanvasElement} Canvas element
     */
    _getChartCanvas(type) {
      const canvases = document.querySelectorAll("canvas");
      if (type === "usage" && canvases.length > 0) return canvases[0];
      if (type === "memory" && canvases.length > 1) return canvases[1];
      return null;
    }

    /**
     * Set the current chart type (usage or memory).
     * @param {string} type - The chart type to set.
     */
    setChartType(type) {
      this.state.chartType = type;
    }

    /**
     * Get the current chart type.
     * @returns {string} The current chart type.
     */
    getChartType() {
      return this.state.chartType;
    }

    /**
     * Check if usage chart exists and is visible
     * @returns {boolean} True if usage chart is visible
     */
    isUsageChartVisible() {
      return this.usageChart.exists() && this.state.chartType === "usage";
    }

    /**
     * Check if memory chart exists and is visible
     * @returns {boolean} True if memory chart is visible
     */
    isMemoryChartVisible() {
      return this.memoryChart.exists() && this.state.chartType === "memory";
    }

    /**
     * Create usage chart (CPU + GPU).
     * @param {HTMLCanvasElement} canvas - The canvas element.
     * @param {Array} history - Historical metrics data.
     */
    createUsageChart(canvas, history = []) {
      this.usageChart.create(canvas, history);
    }

    /**
     * Create memory chart (System + GPU memory).
     * @param {HTMLCanvasElement} canvas - The canvas element.
     * @param {Array} history - Historical metrics data.
     */
    createMemoryChart(canvas, history = []) {
      this.memoryChart.create(canvas, history);
    }

    /**
     * Update charts with new metrics data.
     * @param {Object} metrics - Current metrics data.
     * @param {Array} history - Historical metrics data.
     */
    updateCharts(metrics, history) {
      if (!history) return;

      console.log(`[ChartManager] updateCharts called with ${history.length} records`);

      if (history.length > 0) {
        // Get canvases
        const usageCanvas = this._getChartCanvas("usage");
        const memoryCanvas = this._getChartCanvas("memory");
        
        // Recreate charts with historical data (this ensures proper rendering)
        if (usageCanvas && usageCanvas.width > 0 && usageCanvas.height > 0) {
          console.log("[ChartManager] Recreating usage chart with historical data");
          this.usageChart.create(usageCanvas, history);
        }
        
        if (memoryCanvas && memoryCanvas.width > 0 && memoryCanvas.height > 0) {
          console.log("[ChartManager] Recreating memory chart with historical data");
          this.memoryChart.create(memoryCanvas, history);
        }
      } else {
        // Create charts with empty data if they don't exist yet
        if (!this.usageChart.exists()) {
          const canvas = this._getChartCanvas("usage");
          if (canvas && canvas.width > 0 && canvas.height > 0) {
            this.usageChart.create(canvas, []);
          }
        }
        if (!this.memoryChart.exists()) {
          const canvas = this._getChartCanvas("memory");
          if (canvas && canvas.width > 0 && canvas.height > 0) {
            this.memoryChart.create(canvas, []);
          }
        }
      }
    }

    /**
     * Destroy all chart instances and clean up observers.
     */
    destroy() {
      if (this.themeObserver) {
        this.themeObserver.disconnect();
        this.themeObserver = null;
      }

      this.usageChart.destroy();
      this.memoryChart.destroy();
    }
  }

  window.ChartManager = ChartManager;
}
