/**
 * llama-server Metrics Scraper - Simplified & Robust
 * FIXED: Reduced timeouts, fewer endpoints, minimal debug logging
 */
import http from "http";

export class LlamaServerMetricsScraper {
  constructor(config) {
    this.host = config.host || "localhost";
    this.port = config.port || 8080;
    this.baseUrl = `http://${this.host}:${this.port}`;
    this.cache = new Map();
    this.cacheTTL = 10000; // 10 seconds
    this._errorLogged = false;
  }

  updatePort(port) {
    if (port && port !== this.port) {
      this.port = port;
      this.baseUrl = `http://${this.host}:${this.port}`;
      this.cache.clear();
    }
  }

  async getMetrics() {
    // Check cache first
    const cached = this.cache.get("metrics");
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Try only /health endpoint (fastest) - we only need tokens/s for now
    try {
      const data = await this._fetchEndpoint("/health", 2000);
      if (data && typeof data === "object") {
        // Extract what we can from health response
        const metrics = {
          tokensPerSecond: data.tokens_per_second || 0,
          predictedTokensSeconds: data.tokens_per_second || 0,
          uptime: 0,
          activeModels: 0,
          totalRequests: 0,
          queueSize: 0,
          vramTotal: 0,
          vramUsed: 0,
          nCtx: 0,
          nParallel: 0,
          nThreads: 0,
        };
        this.cache.set("metrics", { data: metrics, timestamp: Date.now() });
        return metrics;
      }
    } catch (e) {
      // Health endpoint not available
    }

    // Return cached or null
    return cached?.data || null;
  }

  _parsePrometheusMetrics(text) {
    const metrics = {
      uptime: 0,
      activeModels: 0,
      totalRequests: 0,
      tokensPerSecond: 0,
      predictedTokensSeconds: 0,
      queueSize: 0,
      vramTotal: 0,
      vramUsed: 0,
      nCtx: 0,
      nParallel: 0,
      nThreads: 0,
      promptTokensTotal: 0,
      predictedTokensTotal: 0,
      promptSecondsTotal: 0,
      predictedSecondsTotal: 0,
      nDecodeTotal: 0,
      nBusySlotsPerDecode: 0,
      nTokensMax: 0,
    };

    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const spaceIndex = trimmed.lastIndexOf(" ");
      if (spaceIndex === -1) continue;

      const metricName = trimmed.substring(0, spaceIndex);
      const valueStr = trimmed.substring(spaceIndex + 1);
      const value = parseFloat(valueStr);
      if (isNaN(value)) continue;

      // Map common metrics
      if (metricName === "llamacpp:prompt_tokens_seconds") {
        metrics.tokensPerSecond = value;
      } else if (metricName === "llamacpp:predicted_tokens_seconds") {
        metrics.predictedTokensSeconds = value;
      } else if (metricName === "llamacpp:server_uptime_ms") {
        metrics.uptime = value / 1000;
      } else if (metricName === "llamacpp:requests_processing") {
        metrics.activeModels = value;
      } else if (metricName === "llamacpp:requests_deferred") {
        metrics.queueSize = value;
      } else if (metricName === "llamacpp:llm_server_vram_total") {
        metrics.vramTotal = value;
      } else if (metricName === "llamacpp:llm_server_vram_used") {
        metrics.vramUsed = value;
      } else if (metricName === "llamacpp:llm_server_n_ctx") {
        metrics.nCtx = value;
      } else if (metricName === "llamacpp:llm_server_n_parallel") {
        metrics.nParallel = value;
      } else if (metricName === "llamacpp:llm_server_n_threads") {
        metrics.nThreads = value;
      } else if (metricName === "llamacpp:n_decode_total") {
        metrics.nDecodeTotal = value;
        metrics.totalRequests = value;
      }
    }

    return metrics;
  }

  async _fetchEndpoint(endpoint, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 8080,
        path: url.pathname + url.search,
        method: "GET",
        timeout: timeoutMs,
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          if (res.statusCode === 200) {
            if (endpoint.includes("/metrics")) {
              resolve(this._parsePrometheusMetrics(data));
            } else {
              try {
                resolve(JSON.parse(data));
              } catch {
                resolve({ raw: data });
              }
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(timeoutMs, () => req.destroy());
      req.end();
    });
  }
}
