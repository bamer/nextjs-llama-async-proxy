/**
 * Performance Monitor - Tracks application performance metrics
 */
/* global performance */
class PerformanceMonitor {
  /**
   * Create a new PerformanceMonitor instance.
   */
  constructor() {
    this.metrics = {
      frameTimes: [],
      renderTimes: [],
      eventTimes: [],
      stateUpdateTimes: [],
      memoryUsage: []
    };
    this.maxMetrics = 100; // Keep last 100 measurements
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.isMonitoring = false;
  }

  /**
   * Start performance monitoring.
   */
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Reset metrics
    this.metrics = {
      frameTimes: [],
      renderTimes: [],
      eventTimes: [],
      stateUpdateTimes: [],
      memoryUsage: []
    };
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;

    // Start frame monitoring
    this._monitorFrames();

    console.log("[PERF] Performance monitoring started");
  }

  /**
   * Stop performance monitoring.
   */
  stop() {
    this.isMonitoring = false;
    console.log("[PERF] Performance monitoring stopped");
  }

  /**
   * Monitor frame rate internally using requestAnimationFrame.
   * @private
   */
  _monitorFrames() {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Add frame time
    this._addMetric("frameTimes", frameTime);

    // Calculate FPS every 10 frames
    this.frameCount++;
    if (this.frameCount % 10 === 0) {
      const totalTime = this.metrics.frameTimes.reduce((sum, time) => sum + time, 0);
      this.fps = Math.round(10000 / (totalTime / 10));
    }

    requestAnimationFrame(() => this._monitorFrames());
  }

  /**
   * Track render time for a component.
   * @param {string} componentName - Component name
   * @param {number} time - Render time in milliseconds
   */
  trackRender(componentName, time) {
    if (!this.isMonitoring) return;
    this._addMetric("renderTimes", time);
    console.log(`[PERF] ${componentName} render: ${time.toFixed(2)}ms`);
  }

  /**
   * Track event handling time.
   * @param {string} eventName - Event name
   * @param {number} time - Event handling time in milliseconds
   */
  trackEvent(eventName, time) {
    if (!this.isMonitoring) return;
    this._addMetric("eventTimes", time);
    if (time > 50) {
      console.warn(`[PERF] Slow event ${eventName}: ${time.toFixed(2)}ms`);
    }
  }

  /**
   * Track state update time.
   * @param {string} stateKey - State key that was updated
   * @param {number} time - State update time in milliseconds
   */
  trackStateUpdate(stateKey, time) {
    if (!this.isMonitoring) return;
    this._addMetric("stateUpdateTimes", time);
    if (time > 20) {
      console.warn(`[PERF] Slow state update ${stateKey}: ${time.toFixed(2)}ms`);
    }
  }

  /**
   * Track current memory usage from browser API.
   */
  trackMemory() {
    if (!this.isMonitoring || !window.performance || !window.performance.memory) return;

    const memory = window.performance.memory;
    this._addMetric("memoryUsage", {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    });
  }

  /**
   * Add a metric value to the appropriate array (max 100 values).
   * @param {string} type - Metric type (e.g., 'frameTimes', 'renderTimes')
   * @param {*} value - Metric value to add
   * @private
   */
  _addMetric(type, value) {
    this.metrics[type].push(value);
    if (this.metrics[type].length > this.maxMetrics) {
      this.metrics[type].shift();
    }
  }

  /**
   * Get current performance metrics summary.
   * @returns {object} Performance metrics object
   */
  getMetrics() {
    return {
      fps: this.fps,
      avgFrameTime: this._calculateAverage("frameTimes"),
      avgRenderTime: this._calculateAverage("renderTimes"),
      avgEventTime: this._calculateAverage("eventTimes"),
      avgStateUpdateTime: this._calculateAverage("stateUpdateTimes"),
      memory: this._getCurrentMemory()
    };
  }

  /**
   * Calculate average value for a metric type.
   * @param {string} type - Metric type
   * @returns {number} Average value
   * @private
   */
  _calculateAverage(type) {
    if (this.metrics[type].length === 0) return 0;
    const sum = this.metrics[type].reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
    return sum / this.metrics[type].length;
  }

  /**
   * Get current memory usage from performance API.
   * @returns {object|null} Memory object or null if unavailable
   * @private
   */
  _getCurrentMemory() {
    if (!window.performance || !window.performance.memory) return null;
    const memory = window.performance.memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }

  /**
   * Log a formatted performance summary to console.
   */
  logSummary() {
    const metrics = this.getMetrics();
    console.log("[PERF] Performance Summary:");
    console.log(`  FPS: ${metrics.fps}`);
    console.log(`  Avg Frame Time: ${metrics.avgFrameTime.toFixed(2)}ms`);
    console.log(`  Avg Render Time: ${metrics.avgRenderTime.toFixed(2)}ms`);
    console.log(`  Avg Event Time: ${metrics.avgEventTime.toFixed(2)}ms`);
    console.log(`  Avg State Update Time: ${metrics.avgStateUpdateTime.toFixed(2)}ms`);
    if (metrics.memory) {
      console.log(`  Memory Used: ${(metrics.memory.usedJSHeapSize / 1048576).toFixed(2)}MB`);
      console.log(`  Memory Usage: ${metrics.memory.usedPercent.toFixed(1)}%`);
    }
  }
}

// Create global instance
const perfMonitor = new PerformanceMonitor();
window.PerformanceMonitor = PerformanceMonitor;
window.perfMonitor = perfMonitor;

// Start monitoring in development
if (process.env.NODE_ENV === "development" || window.DEBUG_MODE) {
  perfMonitor.start();
}
