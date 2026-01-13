/**
 * Compute Worker Service
 * Offloads heavy computations to a Web Worker
 * Follows AGENTS.md rules: single responsibility, no memory leaks
 */

class ComputeWorkerService {
  constructor() {
    this.worker = null;
    this.pending = new Map();
    this.idCounter = 0;
  }

  /**
   * Get or create the worker
   */
  _getWorker() {
    if (!this.worker) {
      this.worker = new Worker("/js/workers/compute-worker.js");
      this.worker.onmessage = (e) => this._handleMessage(e);
      this.worker.onerror = (error) => {
        console.error("[COMPUTE-WORKER] Error:", error);
      };
    }
    return this.worker;
  }

  /**
   * Handle worker message
   */
  _handleMessage(e) {
    const { success, result, error, id } = e.data;
    const pending = this.pending.get(id);
    if (pending) {
      if (success) {
        pending.resolve(result);
      } else {
        pending.reject(new Error(error));
      }
      this.pending.delete(id);
    }
  }

  /**
   * Send request to worker
   */
  _request(type, payload) {
    return new Promise((resolve, reject) => {
      const id = ++this.idCounter;
      this.pending.set(id, { resolve, reject });
      this._getWorker().postMessage({ type, payload, id });
    });
  }

  /**
   * Validate preset configuration
   */
  async validatePreset(preset) {
    return this._request("validate:preset", preset);
  }

  /**
   * Validate parameters
   */
  async validateParameters(params) {
    return this._request("validate:parameters", params);
  }

  /**
   * Validate a single value by type
   */
  async validateValue(value, type, options = {}) {
    return this._request("validate:value", { value, type, options });
  }

  /**
   * Format bytes (async wrapper)
   */
  async formatBytes(bytes) {
    return this._request("format:bytes", bytes);
  }

  /**
   * Format percent (async wrapper)
   */
  async formatPercent(value) {
    return this._request("format:percent", value);
  }

  /**
   * Format timestamp (async wrapper)
   */
  async formatTimestamp(timestamp) {
    return this._request("format:timestamp", timestamp);
  }

  /**
   * Format relative time (async wrapper)
   */
  async formatRelativeTime(timestamp) {
    return this._request("format:relative", timestamp);
  }

  /**
   * Parse INI content
   */
  async parseIni(content) {
    return this._request("parse:ini", content);
  }

  /**
   * Parse JSON content
   */
  async parseJson(content) {
    return this._request("parse:json", content);
  }

  /**
   * Generate unique ID
   */
  async generateId() {
    return this._request("generate:id", null);
  }

  /**
   * Deep clone object
   */
  async deepClone(obj) {
    return this._request("deep:clone", obj);
  }

  /**
   * Check if value is empty
   */
  async isEmpty(value) {
    return this._request("is:empty", value);
  }

  /**
   * Generate simple hash
   */
  async simpleHash(str) {
    return this._request("hash:simple", str);
  }

  /**
   * Terminate worker (cleanup)
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pending.clear();
  }
}

// Create singleton instance
const computeWorkerService = new ComputeWorkerService();

// Export as global for backwards compatibility
window.ComputeWorker = computeWorkerService;
