/**
 * llama-server Metrics Scraper
 * Scrapes llama-server API endpoints for metrics
 */

import http from "http";

export class LlamaServerMetricsScraper {
  constructor(config) {
    this.baseUrl = `http://${config.host || "localhost"}:${config.port || 8080}`;
    this.cache = new Map();
    this.cacheTTL = 5000; // 5 seconds
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

      // Try common endpoints
      const endpoints = ["/metrics", "/health", "/stats", "/v1/metrics"];

      for (const endpoint of endpoints) {
        try {
          console.log("[DEBUG] MetricsScraper: Trying endpoint:", endpoint);
          const data = await this._fetchEndpoint(endpoint);
          if (data) {
            this.cache.set("metrics", { data, timestamp: Date.now() });
            console.log("[DEBUG] MetricsScraper: Got metrics from:", endpoint);
            return data;
          }
        } catch (e) {
          console.log(`[DEBUG] Endpoint ${endpoint} not available:`, e.message);
        }
      }

      console.warn("[DEBUG] MetricsScraper: All endpoints failed");
      return null;
    } catch (e) {
      console.error("[METRICS-SCRAPER] Failed to get metrics:", e);
      return null;
    }
  }

  /**
   * Fetch specific endpoint
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
   * Parse metrics from text response
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
