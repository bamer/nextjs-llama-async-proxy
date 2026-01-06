/**
 * Chart Manager - Handles Chart.js chart creation, updates, and destruction
 */

class ChartManager {
  constructor(options = {}) {
    this.usageChart = null;
    this.memoryChart = null;
    this.state = options.state || { chartType: "usage", history: [] };
  }

  /**
   * Set the current chart type (usage or memory)
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
   * Check if usage chart exists and is visible
   * @returns {boolean} True if usage chart is visible
   */
  isUsageChartVisible() {
    return this.usageChart && this.state.chartType === "usage";
  }

  /**
   * Check if memory chart exists and is visible
   * @returns {boolean} True if memory chart is visible
   */
  isMemoryChartVisible() {
    return this.memoryChart && this.state.chartType === "memory";
  }

  /**
   * Create usage chart (CPU + GPU) - destroys existing first if needed
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {Array} history - Historical metrics data
   */
  createUsageChart(canvas, history = []) {
    console.log(
      "[CHART-MANAGER] createUsageChart called, canvas:",
      canvas,
      "history length:",
      history.length
    );
    // Destroy existing chart if it exists
    if (this.usageChart) {
      try {
        this.usageChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.usageChart = null;
    }

    if (!canvas) {
      console.log("[CHART-MANAGER] No canvas for usage chart");
      return;
    }

    console.log(
      "[CHART-MANAGER] Creating usage chart with canvas size:",
      canvas.width,
      "x",
      canvas.height
    );

    const ctx = canvas.getContext("2d");

    const labels = history.map((_, i) => i.toString());
    const cpuData = history.map((h) => h.cpu?.usage || 0);
    const gpuData = history.map((h) => h.gpu?.usage || 0);

    // CPU gradient (blue)
    const cpuGradient = ctx.createLinearGradient(0, 0, 0, 180);
    cpuGradient.addColorStop(0, "rgba(59, 130, 246, 0.2)");
    cpuGradient.addColorStop(1, "rgba(59, 130, 246, 0)");

    // GPU gradient (purple)
    const gpuGradient = ctx.createLinearGradient(0, 0, 0, 180);
    gpuGradient.addColorStop(0, "rgba(139, 92, 246, 0.2)");
    gpuGradient.addColorStop(1, "rgba(139, 92, 246, 0)");

    this.usageChart = new Chart(ctx, {
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { intersect: false, mode: "index" },
        devicePixelRatio: window.devicePixelRatio || 1,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12, weight: "500" },
              color: "#374151",
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            displayColors: true,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { display: false },
            title: {
              display: true,
              text: "Time (seconds ago)",
              font: { size: 12, weight: "500" },
              color: "#374151",
              padding: { top: 10 },
            },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: { stepSize: 25, font: { size: 11 }, color: "#6b7280" },
            title: {
              display: true,
              text: "Usage (%)",
              font: { size: 12, weight: "500" },
              color: "#374151",
              padding: { bottom: 10 },
            },
          },
        },
      },
    });
  }

  /**
   * Create memory chart (System + GPU memory) - destroys existing first if needed
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {Array} history - Historical metrics data
   */
  createMemoryChart(canvas, history = []) {
    // Destroy existing chart if it exists
    if (this.memoryChart) {
      try {
        this.memoryChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.memoryChart = null;
    }

    if (!canvas) {
      console.log("[CHART-MANAGER] No canvas for memory chart");
      return;
    }

    const ctx = canvas.getContext("2d");

    const labels = history.map((_, i) => i.toString());
    // Convert bytes to MB for system memory
    const systemMemData = history.map((h) => (h.memory?.used || 0) / (1024 * 1024));
    // GPU memory is already in MB
    const gpuMemData = history.map((h) => h.gpu?.memoryUsed || 0);

    // System memory gradient (teal)
    const sysGradient = ctx.createLinearGradient(0, 0, 0, 180);
    sysGradient.addColorStop(0, "rgba(20, 184, 166, 0.2)");
    sysGradient.addColorStop(1, "rgba(20, 184, 166, 0)");

    // GPU memory gradient (orange)
    const gpuMemGradient = ctx.createLinearGradient(0, 0, 0, 180);
    gpuMemGradient.addColorStop(0, "rgba(249, 115, 22, 0.2)");
    gpuMemGradient.addColorStop(1, "rgba(249, 115, 22, 0)");

    this.memoryChart = new Chart(ctx, {
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { intersect: false, mode: "index" },
        devicePixelRatio: window.devicePixelRatio || 1,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12, weight: "500" },
              color: "#374151",
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            displayColors: true,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)} MB`,
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { display: false },
            title: {
              display: true,
              text: "Time (seconds ago)",
              font: { size: 12, weight: "500" },
              color: "#374151",
              padding: { top: 10 },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0, 0, 0, 0.05)" },
            ticks: { font: { size: 11 }, color: "#6b7280" },
            title: {
              display: true,
              text: "Memory (MB)",
              font: { size: 12, weight: "500" },
              color: "#374151",
              padding: { bottom: 10 },
            },
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

    // Update usage chart (CPU + GPU)
    if (this.usageChart) {
      const labels = history.map((_, i) => i.toString());
      const cpuData = history.map((h) => h.cpu?.usage || 0);
      const gpuData = history.map((h) => h.gpu?.usage || 0);
      this.usageChart.data.labels = labels;
      this.usageChart.data.datasets[0].data = cpuData;
      this.usageChart.data.datasets[1].data = gpuData;
      this.usageChart.update("none");
    }

    // Update memory chart (System + GPU memory)
    if (this.memoryChart) {
      const labels = history.map((_, i) => i.toString());
      const systemMemData = history.map((h) => (h.memory?.used || 0) / (1024 * 1024));
      const gpuMemData = history.map((h) => h.gpu?.memoryUsed || 0);
      this.memoryChart.data.labels = labels;
      this.memoryChart.data.datasets[0].data = systemMemData;
      this.memoryChart.data.datasets[1].data = gpuMemData;
      this.memoryChart.update("none");
    }
  }

  /**
   * Destroy all chart instances
   */
  destroy() {
    if (this.usageChart) {
      try {
        this.usageChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.usageChart = null;
    }
    if (this.memoryChart) {
      try {
        this.memoryChart.destroy();
      } catch (e) {
        // Ignore
      }
      this.memoryChart = null;
    }
  }
}

window.ChartManager = ChartManager;
