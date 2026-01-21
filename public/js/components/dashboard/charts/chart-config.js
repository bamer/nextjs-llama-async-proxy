/**
 * Chart Config Module - Builds Chart.js configuration options
 */

if (typeof ChartConfigBuilder === "undefined") {
  class ChartConfigBuilder {
    constructor(colors) {
      this.colors = colors;
    }

    /**
     * Build common chart options
     * @param {Object} options - Override options
     * @returns {Object} Complete chart options
     */
    buildCommonOptions(options = {}) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { intersect: false, mode: "index" },
        devicePixelRatio: window.devicePixelRatio || 1,
        plugins: {
          legend: this.buildLegendOptions(),
          tooltip: this.buildTooltipOptions(),
        },
        scales: this.buildScalesOptions(),
        ...options,
      };
    }

    /**
     * Build legend configuration
     * @returns {Object} Legend options
     */
    buildLegendOptions() {
      return {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12, weight: "500" },
          color: this.colors.textColor,
        },
      };
    }

    /**
     * Build tooltip configuration
     * @param {Function} labelCallback - Custom label formatter
     * @returns {Object} Tooltip options
     */
    buildTooltipOptions(labelCallback = null) {
      return {
        backgroundColor: this.colors.isDarkMode ? "rgba(45, 45, 45, 0.95)" : "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        displayColors: true,
        titleColor: this.colors.textColor,
        bodyColor: this.colors.textColor,
        borderColor: this.colors.gridColor,
        borderWidth: 1,
        callbacks: {
          label:
            labelCallback ||
            ((context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`),
        },
      };
    }

    /**
     * Build scales configuration
     * @param {Object} yConfig - Y-axis specific config
     * @returns {Object} Scales options
     */
    buildScalesOptions(yConfig = {}) {
      return {
        x: {
          display: true,
          grid: { display: false },
          ticks: { display: false },
          title: {
            display: true,
            text: "Time (seconds ago)",
            font: { size: 12, weight: "500" },
            color: this.colors.textColor,
            padding: { top: 10 },
          },
        },
        y: {
          min: 0,
          grid: { color: this.colors.gridColor },
          ticks: { stepSize: 25, font: { size: 11 }, color: this.colors.tickColor },
          title: {
            display: true,
            text: "Usage (%)",
            font: { size: 12, weight: "500" },
            color: this.colors.textColor,
            padding: { bottom: 10 },
          },
          ...yConfig,
        },
      };
    }

    /**
     * Update colors and refresh options
     * @param {Object} newColors - New colors object
     */
    updateColors(newColors) {
      this.colors = newColors;
    }
  }

  window.ChartConfigBuilder = ChartConfigBuilder;
}
