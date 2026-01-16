/**
 * llama-server Metrics Scraper.
 * Scrapes llama-server API endpoints for metrics and performance data.
 * @class
 */
export class LlamaServerMetricsScraper {
  /**
   * Create a new LlamaServerMetricsScraper.
   * @param {Object} config - Configuration for the scraper.
   * @param {string} [config.host="localhost"] - Server hostname.
   * @param {number} [config.port=8080] - Server port number.
   */
  constructor(config) {
    this.baseUrl = `http://${config.host || "localhost"}:${config.port || 8080}`;
    this.cache = new Map();
    this.cacheTTL = 5000; // 5 seconds
    this._errorLogged = false;
  }

  /**
   * Get metrics from llama-server API
   * @returns {Promise<Object>}
   */
  async getMetrics() {
    try {
      // Check cache
      const cached = this.cache.get("metrics");
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        console.log("[DEBUG] MetricsScraper: Using cached metrics");
        return cached.data;
      }

      // Try common endpoints - llama-server with --metrics flag exposes /metrics
      const endpoints = [
        "/metrics",           // Prometheus endpoint (requires --metrics flag)
        "/v1/metrics",        // Alternative Prometheus endpoint
        "/health",            // Health check (might have some info)
        "/props",             // Server properties (has some config)
      ];

      for (const endpoint of endpoints) {
        try {
          console.log("[DEBUG] MetricsScraper: Trying endpoint:", endpoint);
          const data = await this._fetchEndpoint(endpoint);
          if (data) {
            // If we got Prometheus format text, parse it
            if (endpoint === "/metrics" && typeof data === "string") {
              const parsed = this._parsePrometheusMetrics(data);
              if (Object.keys(parsed).length > 0) {
                this.cache.set("metrics", { data: parsed, timestamp: Date.now() });
                console.log("[DEBUG] MetricsScraper: Parsed Prometheus metrics:", Object.keys(parsed).length, "metrics");
                return parsed;
              }
            }
            
            // For JSON endpoints, use as-is
            this.cache.set("metrics", { data, timestamp: Date.now() });
            console.log("[DEBUG] MetricsScraper: Got metrics from:", endpoint);
            return data;
          }
        } catch (e) {
          console.log(`[DEBUG] Endpoint ${endpoint} not available:`, e.message);
        }
      }

      if (!this._errorLogged) {
        console.warn("[DEBUG] MetricsScraper: All endpoints failed");
        console.warn("[DEBUG] MetricsScraper: Ensure llama-server is started with --metrics flag");
        this._errorLogged = true;
      }
      return null;
    } catch (e) {
      console.error("[METRICS-SCRAPER] Failed to get metrics:", e.message);
      return null;
    }
  }

  /**
   * Parse Prometheus metrics text format
   * @param {string} text - Raw Prometheus metrics text
   * @returns {Object} Parsed metrics
   */
  _parsePrometheusMetrics(text) {
    const metrics = {
      uptime: 0,
      activeModels: 0,
      totalRequests: 0,
      tokensPerSecond: 0,
      queueSize: 0,
    };

    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Parse metric line: metric_name{labels} value
      const spaceIndex = trimmed.lastIndexOf(" ");
      if (spaceIndex === -1) continue;
      
      const metricName = trimmed.substring(0, spaceIndex);
      const valueStr = trimmed.substring(spaceIndex + 1);
      const value = parseFloat(valueStr);
      
      if (isNaN(value)) continue;

      // Map Prometheus metric names to our internal format
      if (metricName === "llamacpp:prompt_tokens_seconds") {
        metrics.tokensPerSecond = value; // Use prompt tokens as main metric
      } else if (metricName === "llamacpp:predicted_tokens_seconds") {
        metrics.tokensPerSecond = Math.max(metrics.tokensPerSecond, value);
      } else if (metricName === "llamacpp:prompt_tokens_total") {
        metrics.promptTokensTotal = value;
      } else if (metricName === "llamacpp:tokens_predicted_total") {
        metrics.tokensPredictedTotal = value;
      } else if (metricName === "llamacpp:requests_processing") {
        metrics.activeModels = value;
      } else if (metricName === "llamacpp:requests_deferred") {
        metrics.queueSize = value;
      }
    }

    return metrics;
  }

  /**
   * Fetch specific endpoint from llama-server.
   * @param {string} endpoint - API endpoint path to fetch.
   * @returns {Promise<Object>} Parsed response data.
   * @throws {Error} If request fails or returns non-200 status.
   */
  async _fetchEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 8080,
        path: url.pathname,
        method: "GET",
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (e) {
              // Not JSON, try to parse as text
              resolve(this._parseTextMetrics(data));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(5000, () => req.destroy());
      req.end();
    });
  }

  /**
   * Parse metrics from text response.
   * Extracts tokens per second, active models, and queue size from text.
   * @param {string} text - Raw text response to parse.
   * @returns {Object} Parsed metrics object with uptime, activeModels, etc.
   */
  _parseTextMetrics(text) {
    const metrics = {
      uptime: 0,
      activeModels: 0,
      totalRequests: 0,
      tokensPerSecond: 0,
      queueSize: 0,
    };

    // Parse output (will need to adjust based on actual format)
    const lines = text.split("\n");
    for (const line of lines) {
      // Token generation rate
      const tokenMatch = line.match(/(\d+(?:\.\d+)?)\s+tokens\/s/);
      if (tokenMatch) {
        metrics.tokensPerSecond = parseFloat(tokenMatch[1]);
      }

      // Active models
      const modelMatch = line.match(/active\s+models?:\s*(\d+)/i);
      if (modelMatch) {
        metrics.activeModels = parseInt(modelMatch[1]);
      }

      // Queue size
      const queueMatch = line.match(/queue\s+size?:\s*(\d+)/i);
      if (queueMatch) {
        metrics.queueSize = parseInt(queueMatch[1]);
      }
    }

    return metrics;
  }
}
