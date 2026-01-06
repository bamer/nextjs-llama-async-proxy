/**
 * Chart Manager - Handles Chart.js chart creation, updates, and destruction
 */

class ChartManager {
  constructor(options = {}) {
    this.cpuChart = null;
    this.gpuChart = null;
    this.state = options.state || { chartType: "cpu", history: [] };
  }

  /**
   * Set the current chart type (cpu or gpu)
   * @param {string} type - The chart type to set
   */
  setChartType(type) {
    this.state.chartType = type;
  }

  /**
   * Get the current chart type
   * @returns {string} The current chart type
   */
  getChartType() {
    return this.state.chartType;
  }

  /**
   * Check if CPU chart exists and is visible
   * @returns {boolean} True if CPU chart is visible
   */
  isCpuChartVisible() {
    return this.cpuChart && this.state.chartType === "cpu";
  }

  /**
   * Check if GPU chart exists and is visible
   * @returns {boolean} True if GPU chart is visible
   */
  isGpuChartVisible() {
    return this.gpuChart && this.state.chartType === "gpu";
  }

  /**
   * Create CPU chart - destroys existing first if needed
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {Array} history - Historical metrics data
   */
  createCpuChart(canvas, history = []) {
    // Destroy existing chart if it exists
    if (this.cpuChart) {
      try {
        this.cpuChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.cpuChart = null;
    }

    if (!canvas) {
      console.log("[CHART-MANAGER] No canvas for CPU chart");
      return;
    }

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

    const labels = history.map((_, i) => i.toString());
    const data = history.map((h) => h.cpu?.usage || 0);

    this.cpuChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "CPU %",
            data: data,
            borderColor: "#3b82f6",
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { intersect: false, mode: "index" },
        devicePixelRatio: window.devicePixelRatio || 1,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            displayColors: false,
            callbacks: {
              label: (context) => `CPU: ${context.parsed.y.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: { display: true, grid: { display: false }, ticks: { display: false } },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: { stepSize: 25, font: { size: 11 }, color: "#6b7280" },
          },
        },
      },
    });
  }

  /**
   * Create GPU chart - destroys existing first if needed
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {Array} history - Historical metrics data
   */
  createGpuChart(canvas, history = []) {
    // Destroy existing chart if it exists
    if (this.gpuChart) {
      try {
        this.gpuChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.gpuChart = null;
    }

    if (!canvas) {
      console.log("[CHART-MANAGER] No canvas for GPU chart");
      return;
    }

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, "rgba(139, 92, 246, 0.4)");
    gradient.addColorStop(1, "rgba(139, 92, 246, 0)");

    const labels = history.map((_, i) => i.toString());
    const data = history.map((h) => h.gpu?.usage || 0);

    this.gpuChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "GPU %",
            data: data,
            borderColor: "#8b5cf6",
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            displayColors: false,
            callbacks: {
              label: (context) => `GPU: ${context.parsed.y.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: { display: true, grid: { display: false }, ticks: { display: false } },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: { stepSize: 25, font: { size: 11 }, color: "#6b7280" },
          },
        },
      },
    });
  }

  /**
   * Update charts with new metrics data
   * @param {Object} metrics - Current metrics data
   * @param {Array} history - Historical metrics data
   */
  updateCharts(metrics, history) {
    if (!history || history.length === 0) return;

    // Always update CPU chart data (for when it becomes visible)
    if (this.cpuChart) {
      const labels = history.map((_, i) => i.toString());
      const data = history.map((h) => h.cpu?.usage || 0);
      this.cpuChart.data.labels = labels;
      this.cpuChart.data.datasets[0].data = data;
      this.cpuChart.update("none");
    }

    // Always update GPU chart data (for when it becomes visible)
    if (this.gpuChart) {
      const labels = history.map((_, i) => i.toString());
      const data = history.map((h) => h.gpu?.usage || 0);
      this.gpuChart.data.labels = labels;
      this.gpuChart.data.datasets[0].data = data;
      this.gpuChart.update("none");
    }
  }

  /**
   * Destroy all chart instances
   */
  destroy() {
    if (this.cpuChart) {
      try {
        this.cpuChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.cpuChart = null;
    }
    if (this.gpuChart) {
      try {
        this.gpuChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.gpuChart = null;
    }
  }
}

window.ChartManager = ChartManager;
