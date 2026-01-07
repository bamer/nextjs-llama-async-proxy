/**
 * Memory Chart Module - Handles system and GPU memory charts
 */
/* global ChartConfigBuilder ChartColors */

class MemoryChart {
  constructor(chartConfig, chartColors) {
    this.chart = null;
    this.chartConfig = chartConfig;
    this.chartColors = chartColors;
  }

  /**
   * Create system/GPU memory chart
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Array} history - Historical metrics data
   */
  create(canvas, history = []) {
    console.log("[MEMORY-CHART] Creating memory chart, history length:", history.length);

    this.destroy();

    if (!canvas) {
      console.log("[MEMORY-CHART] No canvas provided");
      return;
    }

    const ctx = canvas.getContext("2d");
    const labels = history.map((_, i) => i.toString());
    const systemMemData = history.map((h) => (h.memory?.used || 0) / (1024 * 1024));
    const gpuMemData = history.map((h) => h.gpu?.memoryUsed || 0);

    const sysGradient = ctx.createLinearGradient(0, 0, 0, 180);
    sysGradient.addColorStop(0, "rgba(20, 184, 166, 0.2)");
    sysGradient.addColorStop(1, "rgba(20, 184, 166, 0)");

    const gpuMemGradient = ctx.createLinearGradient(0, 0, 0, 180);
    gpuMemGradient.addColorStop(0, "rgba(249, 115, 22, 0.2)");
    gpuMemGradient.addColorStop(1, "rgba(249, 115, 22, 0)");

    const colors = this.chartColors.getColors();
    const configBuilder = new ChartConfigBuilder(colors);

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "System Memory (MB)",
            data: systemMemData,
            borderColor: "#14b8a6",
            backgroundColor: sysGradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
          {
            label: "GPU Memory (MB)",
            data: gpuMemData,
            borderColor: "#f97316",
            backgroundColor: gpuMemGradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: configBuilder.buildCommonOptions({
        scales: configBuilder.buildScalesOptions({
          y: { beginAtZero: true },
        }),
        plugins: {
          tooltip: configBuilder.buildTooltipOptions(
            (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} MB`
          ),
        },
      }),
    });
  }

  /**
   * Update chart with new data
   * @param {Array} history - Historical metrics data
   */
  update(history) {
    if (!this.chart) return;

    const labels = history.map((_, i) => i.toString());
    const systemMemData = history.map((h) => (h.memory?.used || 0) / (1024 * 1024));
    const gpuMemData = history.map((h) => h.gpu?.memoryUsed || 0);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = systemMemData;
    this.chart.data.datasets[1].data = gpuMemData;
    this.chart.update("none");
  }

  /**
   * Get chart data for theme recreation
   * @returns {Object} Chart data
   */
  getData() {
    return this.chart?.data;
  }

  /**
   * Destroy chart instance
   */
  destroy() {
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch (_e) {
        // Ignore
      }
      this.chart = null;
    }
  }

  /**
   * Check if chart exists
   * @returns {boolean} Chart exists
   */
  exists() {
    return this.chart !== null;
  }
}

window.MemoryChart = MemoryChart;
