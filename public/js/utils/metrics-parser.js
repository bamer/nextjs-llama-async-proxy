/**
 * Prometheus Metrics Parser
 * Parses Prometheus-style metrics from llama-server /metrics endpoint
 */

class MetricsParser {
  /**
   * Parse Prometheus metrics text format
   * @param {string} metricsText - Raw metrics text
   * @returns {Object} Parsed metrics object
   */
  static parse(metricsText) {
    if (!metricsText || typeof metricsText !== "string") {
      return {};
    }

    const lines = metricsText.split("\n");
    const metrics = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#") || trimmed.length === 0) {
        continue;
      }

      // Parse metric line
      const parsed = this._parseMetricLine(trimmed);
      if (parsed) {
        // Merge into metrics object
        Object.assign(metrics, parsed);
      }
    }

    return metrics;
  }

  /**
   * Parse a single Prometheus metric line
   * @param {string} line - Metric line
   * @returns {Object|null} Parsed metric or null
   */
  static _parseMetricLine(line) {
    // Format: metric_name{labels} value
    // Example: llamacpp:prompt_tokens_seconds 0.0123

    try {
      // Split metric name and value
      const firstBrace = line.indexOf("{");
      const lastSpace = line.lastIndexOf(" ");

      let metricName = "";
      let labels = {};
      let value = 0;

      if (firstBrace !== -1) {
        // Has labels
        metricName = line.substring(0, firstBrace);
        const labelsPart = line.substring(firstBrace, lastSpace);
        const lastBrace = labelsPart.lastIndexOf("}");

        if (lastBrace !== -1) {
          labels = this._parseLabels(labelsPart.substring(1, lastBrace));
        }
        value = parseFloat(line.substring(lastSpace));
      } else {
        // No labels
        const parts = line.split(" ");
        metricName = parts[0];
        value = parseFloat(parts[parts.length - 1]);
      }

      if (isNaN(value)) {
        return null;
      }

      return { [metricName]: value };
    } catch (e) {
      console.warn("[MetricsParser] Failed to parse line:", line, e);
      return null;
    }
  }

  /**
   * Parse Prometheus labels
   * @param {string} labelsStr - Labels string like 'n_ctx="4096",n_threads="4"'
   * @returns {Object} Labels object
   */
  static _parseLabels(labelsStr) {
    const labels = {};

    // Remove outer quotes and split by comma
    const cleanStr = labelsStr.replace(/^"|"$/g, "");
    const parts = cleanStr.split("\",\"");

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key && value !== undefined) {
        labels[key] = value;
      }
    }

    return labels;
  }

  /**
   * Extract specific llamacpp metrics
   * @param {Object} metrics - All parsed metrics
   * @returns {Object} Organized llamacpp metrics
   */
  static extractLlamaCppMetrics(metrics) {
    return {
      // Throughput metrics
      promptTokensSeconds: metrics["llamacpp:prompt_tokens_seconds"] || 0,
      predictedTokensSeconds: metrics["llamacpp:predicted_tokens_seconds"] || 0,

      // Server configuration
      nCtx: metrics["llamacpp:llm_server_n_ctx"] || 0,
      nBatch: metrics["llamacpp:llm_server_n_batch"] || 0,
      nUbatch: metrics["llamacpp:llm_server_n_ubatch"] || 0,
      nThreads: metrics["llamacpp:llm_server_n_threads"] || 0,
      nParallel: metrics["llamacpp:llm_server_n_parallel"] || 0,
      nKvReq: metrics["llamacpp:llm_server_n_kv_req"] || 0,
      nKv: metrics["llamacpp:llm_server_n_kv"] || 0,
      vramTotal: metrics["llamacpp:llm_server_vram_total"] || 0,
      vramUsed: metrics["llamacpp:llm_server_vram_used"] || 0,

      // Token counts
      nTokensProcessed: metrics["llamacpp:n_tokens_processed"] || 0,
      nTokensPredicted: metrics["llamacpp:n_tokens_predicted"] || 0,
      nTokensTotal: metrics["llamacpp:n_tokens_total"] || 0,

      // Time metrics
      promptEvalTimeMs: metrics["llamacpp:prompt_eval_time_ms"] || 0,
      tokensEvaluatedPerSecond: metrics["llamacpp:tokens_evaluated_per_second"] || 0,
    };
  }
}

/**
 * Metrics Scraper
 * Fetches metrics from llama-server /metrics endpoint
 */

class MetricsScraper {
  constructor(serverUrl, pollIntervalMs = 5000) {
    this.serverUrl = serverUrl;
    this.pollIntervalMs = pollIntervalMs;
    this.intervalId = null;
    this.onUpdate = null;
    this.lastMetrics = {};
  }

  /**
   * Start polling metrics
   * @param {Function} onUpdate - Callback function with metrics
   */
  start(onUpdate) {
    if (this.intervalId) {
      this.stop();
    }

    this.onUpdate = onUpdate;
    console.log("[MetricsScraper] Starting metrics scraper for", this.serverUrl);

    // Immediate fetch
    this._fetchMetrics();

    // Start polling
    this.intervalId = setInterval(() => {
      this._fetchMetrics();
    }, this.pollIntervalMs);
  }

  /**
   * Stop polling metrics
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[MetricsScraper] Stopped metrics scraper");
    }
  }

  /**
   * Fetch metrics from /metrics endpoint
   */
  async _fetchMetrics() {
    try {
      const metricsUrl = `${this.serverUrl}/metrics`;
      const response = await fetch(metricsUrl);

      if (!response.ok) {
        console.warn("[MetricsScraper] Failed to fetch metrics:", response.status);
        return;
      }

      const metricsText = await response.text();
      const parsedMetrics = MetricsParser.parse(metricsText);
      const llamaMetrics = MetricsParser.extractLlamaCppMetrics(parsedMetrics);

      // Only notify if metrics changed
      if (this._hasMetricsChanged(llamaMetrics)) {
        this.lastMetrics = llamaMetrics;
        console.log("[DEBUG] MetricsScraper got new metrics:", llamaMetrics);

        if (this.onUpdate) {
          this.onUpdate(llamaMetrics);
        }
      }
    } catch (error) {
      console.error("[MetricsScraper] Error fetching metrics:", error);
    }
  }

  /**
   * Check if metrics have changed
   */
  _hasMetricsChanged(newMetrics) {
    const keys = Object.keys(newMetrics);

    for (const key of keys) {
      if (newMetrics[key] !== this.lastMetrics[key]) {
        return true;
      }
    }

    return false;
  }
}

window.MetricsParser = MetricsParser;
window.MetricsScraper = MetricsScraper;
console.log("[METRICS] Metrics parser module loaded");
