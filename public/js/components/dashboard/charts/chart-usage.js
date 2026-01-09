/**
 * Usage Chart Module - Handles CPU and GPU usage charts
 */
/* global ChartConfigBuilder ChartColors */

class UsageChart {
  constructor(chartConfig, chartColors) {
    this.chart = null;
    this.chartConfig = chartConfig;
    this.chartColors = chartColors;
  }

  /**
   * Create CPU/GPU usage chart
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Array} history - Historical metrics data
   */
  create(canvas, history = []) {
    console.log("[USAGE-CHART] Creating usage chart, history length:", history.length);

    this.destroy();

    if (!canvas) {
      console.log("[USAGE-CHART] No canvas provided");
      return;
    }

    console.log("[USAGE-CHART] Canvas size:", canvas.width, "x", canvas.height);

    const ctx = canvas.getContext("2d");
    const labels = history.map((_, i) => i.toString());
    const cpuData = history.map((h) => h.cpu?.usage || 0);
    const gpuData = history.map((h) => h.gpu?.usage || 0);

    const cpuGradient = ctx.createLinearGradient(0, 0, 0, 180);
    cpuGradient.addColorStop(0, "rgba(59, 130, 246, 0.2)");
    cpuGradient.addColorStop(1, "rgba(59, 130, 246, 0)");

    const gpuGradient = ctx.createLinearGradient(0, 0, 0, 180);
    gpuGradient.addColorStop(0, "rgba(139, 92, 246, 0.2)");
    gpuGradient.addColorStop(1, "rgba(139, 92, 246, 0)");

    const colors = this.chartColors.getColors();
    const configBuilder = new ChartConfigBuilder(colors);

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "CPU Usage %",
            data: cpuData,
            borderColor: "#3b82f6",
            backgroundColor: cpuGradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
          {
            label: "GPU Usage %",
            data: gpuData,
            borderColor: "#8b5cf6",
            backgroundColor: gpuGradient,
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
          y: {
            max: 100,
            ticks: {
              callback: function (value) {
                return `${value.toFixed(0)  }%`;
              },
            },
          },
        }),
        plugins: {
          tooltip: configBuilder.buildTooltipOptions(
            (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
          ),
          legend: {
            display: true,
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              padding: 15,
              font: { size: 12, weight: "500" },
              color: colors.textColor,
            },
          },
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
    const cpuData = history.map((h) => h.cpu?.usage || 0);
    const gpuData = history.map((h) => h.gpu?.usage || 0);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = cpuData;
    this.chart.data.datasets[1].data = gpuData;
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

window.UsageChart = UsageChart;
