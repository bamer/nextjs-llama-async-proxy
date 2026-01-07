/**
 * Chart Utils Module - Shared utility functions for charts
 */

const ChartUtils = {
  /**
   * Reconstruct usage history from chart data
   * @param {Object} data - Chart data object
   * @returns {Array} Reconstructed history array
   */
  reconstructUsageHistory(data) {
    if (!data || !data.datasets[0]) return [];

    return data.labels.map((_, i) => ({
      cpu: { usage: data.datasets[0].data[i] || 0 },
      gpu: { usage: data.datasets[1]?.data[i] || 0 },
    }));
  },

  /**
   * Reconstruct memory history from chart data
   * @param {Object} data - Chart data object
   * @returns {Array} Reconstructed history array
   */
  reconstructMemoryHistory(data) {
    if (!data || !data.datasets[0]) return [];

    return data.labels.map((_, i) => ({
      memory: { used: (data.datasets[0].data[i] || 0) * 1024 * 1024 },
      gpu: { memoryUsed: data.datasets[1]?.data[i] || 0 },
    }));
  },

  /**
   * Recreate chart with existing data
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {string} type - Chart type ('usage' or 'memory')
   * @param {Object} data - Chart data to restore
   * @param {Object} options - Creation options
   */
  recreateChartWithData(canvas, type, data, options) {
    if (!canvas || !data) return;

    if (type === "usage" && data.datasets[0]) {
      const history = this.reconstructUsageHistory(data);
      options.onCreateUsageChart(canvas, history);
    } else if (type === "memory" && data.datasets[0]) {
      const history = this.reconstructMemoryHistory(data);
      options.onCreateMemoryChart(canvas, history);
    }
  },

  /**
   * Generate gradient for chart
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Primary color
   * @param {number} height - Gradient height
   * @returns {CanvasGradient} Gradient object
   */
  createGradient(ctx, color, height = 180) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${color}0.2)`);
    gradient.addColorStop(1, `${color}0)`);
    return gradient;
  },
};

window.ChartUtils = ChartUtils;
