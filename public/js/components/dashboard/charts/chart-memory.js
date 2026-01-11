/**
 * Memory Chart Module - Handles system and GPU memory charts
 */
/* global ChartConfigBuilder ChartColors */

if (typeof MemoryChart === "undefined") {
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
      // memory.used is percentage (0-100), gpu.memoryUsed is bytes
      const systemMemData = history.map((h) => h.memory?.used || 0);
      // Note: Currently shows primary GPU only. Full multi-GPU support requires database schema changes
      const gpuMemData = history.map((h) => (h.gpu?.memoryUsed || 0) / (1024 * 1024));

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
              label: "System Memory (%)",
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
              label: "GPU Memory (Primary) (%)",
              data: gpuMemData.map((mb, idx) => {
                // Get GPU memory total from history (primary GPU only)
                const gpuTotal = history[idx]?.gpu?.memoryTotal || 1;
                return ((mb * 1024 * 1024) / gpuTotal) * 100;
              }),
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
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 25,
                callback: function (value) {
                  return `${value.toFixed(0)}%`;
                },
              },
            },
          }),
          plugins: {
            tooltip: configBuilder.buildTooltipOptions((context) => {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }),
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
      // memory.used is percentage (0-100), gpu.memoryUsed is bytes
      const systemMemData = history.map((h) => h.memory?.used || 0);
      const gpuMemData = history.map((h) => (h.gpu?.memoryUsed || 0) / (1024 * 1024));
      const gpuMemPercent = gpuMemData.map((mb, idx) => {
        // Convert GPU memory MB to percentage
        const gpuTotal = history[idx]?.gpu?.memoryTotal || 1;
        return ((mb * 1024 * 1024) / gpuTotal) * 100;
      });

      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = systemMemData;
      this.chart.data.datasets[1].data = gpuMemPercent;
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
}
