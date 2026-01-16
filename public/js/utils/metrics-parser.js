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
   * Handles both old-style metrics (n_tokens_*) and new Prometheus metrics (prompt_tokens_*, etc.)
   * @param {Object} metrics - All parsed metrics
   * @returns {Object} Organized llamacpp metrics
   */
  static extractLlamaCppMetrics(metrics) {
    return {
      // Throughput metrics - handle both old and new formats
      // Old: llamacpp:n_tokens_processed, llamacpp:n_tokens_predicted
      // New: llamacpp:prompt_tokens_seconds, llamacpp:predicted_tokens_seconds
      promptTokensSeconds:
        metrics["llamacpp:prompt_tokens_seconds"] ||
        metrics["llamacpp:tokens_predicted_seconds"] || 0,
      predictedTokensSeconds:
        metrics["llamacpp:predicted_tokens_seconds"] ||
        metrics["llamacpp:tokens_predicted_seconds"] || 0,

      // Token totals - handle both old and new formats
      // Old: llamacpp:n_tokens_processed, llamacpp:n_tokens_predicted, llamacpp:n_tokens_total
      // New: llamacpp:prompt_tokens_total, llamacpp:tokens_predicted_total
      nTokensProcessed:
        metrics["llamacpp:n_tokens_processed"] ||
        metrics["llamacpp:prompt_tokens_total"] || 0,
      nTokensPredicted:
        metrics["llamacpp:n_tokens_predicted"] ||
        metrics["llamacpp:tokens_predicted_total"] || 0,
      nTokensTotal:
        metrics["llamacpp:n_tokens_total"] || 0,

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

      // Time metrics
      promptEvalTimeMs: metrics["llamacpp:prompt_eval_time_ms"] || 0,
      tokensEvaluatedPerSecond: metrics["llamacpp:tokens_evaluated_per_second"] || 0,

      // Additional Prometheus metrics (if enabled)
      kvCacheUsageRatio: metrics["llamacpp:kv_cache_usage_ratio"] || 0,
      kvCacheTokens: metrics["llamacpp:kv_cache_tokens"] || 0,
      requestsProcessing: metrics["llamacpp:requests_processing"] || 0,
      requestsDeferred: metrics["llamacpp:requests_deferred"] || 0,
    };
  }
}

/**
 * Metrics Scraper - Async-first implementation
 * Fetches metrics from llama-server /metrics endpoint
 */

class MetricsScraper {
  constructor(serverUrl, pollIntervalMs = 2000) {
    this.serverUrl = serverUrl;
    this.pollIntervalMs = Math.max(1000, pollIntervalMs); // Min 1s
    this.abortController = null;
    this.onUpdate = null;
    this.lastMetrics = {};
    this.isRunning = false;
    this.consecutiveErrors = 0;
    this.maxErrors = 5; // Stop after 5 consecutive errors
  }

  /**
   * Start polling metrics with async loop
   * @param {Function} onUpdate - Callback function with metrics
   */
  start(onUpdate) {
    if (this.isRunning) {
      console.log("[MetricsScraper] Already running");
      return;
    }

    this.onUpdate = onUpdate;
    this.isRunning = true;
    this.abortController = new AbortController();
    this.consecutiveErrors = 0;

    console.log("[MetricsScraper] Starting metrics scraper for", this.serverUrl);

    // Start async polling loop
    this._pollLoop();
  }

  /**
   * Stop polling metrics
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    console.log("[MetricsScraper] Stopped metrics scraper");
  }

  /**
   * Main async polling loop
   * @private
   */
  async _pollLoop() {
    while (this.isRunning) {
      try {
        await this._fetchMetrics();
        this.consecutiveErrors = 0; // Reset error count on success

        // Wait before next fetch
        await this._delay(this.pollIntervalMs);
      } catch (error) {
        if (error.name === "AbortError") {
          break; // Stop was called
        }

        this.consecutiveErrors++;
        if (this.consecutiveErrors >= this.maxErrors) {
          console.error("[MetricsScraper] Too many errors, stopping scraper");
          this.stop();
          break;
        }

        // Exponential backoff: wait longer between retries
        const backoffTime = Math.min(10000, 1000 * this.consecutiveErrors);
        await this._delay(backoffTime);
      }
    }
  }

  /**
   * Fetch metrics from /metrics endpoint
   * @private
   */
  async _fetchMetrics() {
    const metricsUrl = `${this.serverUrl}/metrics`;
    const signal = this.abortController?.signal;

    const response = await fetch(metricsUrl, { signal, timeout: 5000 });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch metrics`);
    }

    const metricsText = await response.text();
    const parsedMetrics = MetricsParser.parse(metricsText);
    const llamaMetrics = MetricsParser.extractLlamaCppMetrics(parsedMetrics);

    // Only notify if metrics changed
    if (this._hasMetricsChanged(llamaMetrics)) {
      this.lastMetrics = { ...llamaMetrics };

      if (this.onUpdate) {
        try {
          this.onUpdate(llamaMetrics);
        } catch (error) {
          console.error("[MetricsScraper] Error in onUpdate callback:", error);
        }
      }
    }
  }

  /**
   * Helper to delay execution
   * @private
   */
  _delay(ms) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      this.abortController?.signal.addEventListener("abort", () => {
        clearTimeout(timeout);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }

  /**
   * Check if metrics have changed significantly
   * @private
   */
  _hasMetricsChanged(newMetrics) {
    const keys = Object.keys(newMetrics);

    for (const key of keys) {
      // For performance metrics, allow small changes to reduce noise
      const oldVal = this.lastMetrics[key] || 0;
      const newVal = newMetrics[key] || 0;

      // Allow 0.5% change threshold for token rates
      if (key.includes("Seconds")) {
        const threshold = Math.max(0.1, Math.abs(oldVal) * 0.005);
        if (Math.abs(newVal - oldVal) > threshold) {
          return true;
        }
      } else if (newVal !== oldVal) {
        return true;
      }
    }

    return false;
  }
}

window.MetricsParser = MetricsParser;
window.MetricsScraper = MetricsScraper;
console.log("[METRICS] Metrics parser module loaded");
