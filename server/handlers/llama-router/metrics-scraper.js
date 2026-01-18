/**
 * llama-server Metrics Scraper - Simplified & Robust
 * FIXED: Supports model-specific metrics from llama-server
 */
import http from "http";

export class LlamaServerMetricsScraper {
  constructor(config) {
    this.host = config.host || "localhost";
    this.port = config.port || 8080;
    this.baseUrl = `http://${this.host}:${this.port}`;
    this.modelName = config.modelName || null;
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

  updateModel(modelName) {
    if (modelName && modelName !== this.modelName) {
      this.modelName = modelName;
      this.cache.clear();
    }
  }

  async getMetrics() {
    // Check cache first
    const cached = this.cache.get("metrics");
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Try multiple endpoints to get metrics
    try {
      // First try /health endpoint (might return JSON or plain text)
      const healthData = await this._fetchEndpoint("/health", 2000);
      let metrics = this._extractMetricsFromHealth(healthData);

      // If health endpoint returned valid data (hasData: true), use it
      // Even if tokens are 0, we have valid uptime from server
      if (metrics && metrics.hasData === true) {
        this.cache.set("metrics", { data: metrics, timestamp: Date.now() });
        return metrics;
      }

      // Try /metrics endpoint if health didn't return valid data
      metrics = await this._tryMetricsEndpoint();
      if (metrics) {
        this.cache.set("metrics", { data: metrics, timestamp: Date.now() });
        return metrics;
      }

      // Return cached data or null
      return cached?.data || null;
    } catch (e) {
      console.debug("[LlamaMetrics] Failed to fetch metrics:", e.message);
    }

    // Return cached or null
    return cached?.data || null;
  }

  /**
   * Extract metrics from health endpoint response
   * Handles both JSON and plain text responses
   */
  _extractMetricsFromHealth(data) {
    // If data is plain text "ok", return empty metrics
    if (typeof data === "string") {
      return {
        tokensPerSecond: 0,
        predictedTokensSeconds: 0,
        uptime: 0,
        activeModels: 0,
        totalRequests: 0,
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
        hasData: true,
      };
    }

    // If data is an object with raw text (from failed JSON parse), treat as "ok"
    if (data && typeof data === "object" && data.raw !== undefined) {
      return {
        tokensPerSecond: 0,
        predictedTokensSeconds: 0,
        uptime: 0,
        activeModels: 0,
        totalRequests: 0,
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
        hasData: true,
      };
    }

    // Try to extract from JSON response
    if (data && typeof data === "object") {
      return {
        tokensPerSecond: data.tokens_per_second || data.tokensPerSecond || 0,
        predictedTokensSeconds: data.predicted_tokens_seconds || data.predictedTokensSeconds || data.tokens_per_second || 0,
        uptime: data.uptime || data.uptime_s || data.server_uptime || data["server-uptime"] || 0,
        activeModels: data.active_models || data.activeModels || 0,
        totalRequests: data.total_requests || data.totalRequests || 0,
        queueSize: data.queue_size || data.queueSize || 0,
        vramTotal: data.vram_total || data.vramTotal || 0,
        vramUsed: data.vram_used || data.vramUsed || 0,
        nCtx: data.n_ctx || data.nCtx || 0,
        nParallel: data.n_parallel || data.nParallel || 0,
        nThreads: data.n_threads || data.nThreads || 0,
        promptTokensTotal: data.prompt_tokens_total || 0,
        predictedTokensTotal: data.predicted_tokens_total || 0,
        promptSecondsTotal: data.prompt_seconds_total || 0,
        predictedSecondsTotal: data.predicted_seconds_total || 0,
        nDecodeTotal: data.n_decode_total || 0,
        nBusySlotsPerDecode: data.n_busy_slots_per_decode || 0,
        nTokensMax: data.n_tokens_max || 0,
        hasData: true,
      };
    }

    return null;
  }

  /**
   * Try to get metrics from /metrics endpoint
   * llama-server requires a model name: /metrics?model=ModelName
   */
  async _tryMetricsEndpoint() {
    // FIRST: Try with model name if available (most accurate)
    if (this.modelName) {
      try {
        const endpoint = `/metrics?model=${encodeURIComponent(this.modelName)}`;
        const data = await this._fetchEndpoint(endpoint, 3000);
        if (data && typeof data === "object") {
          console.debug(`[METRICS] Got metrics for model: ${this.modelName}`);
          return data;
        }
      } catch (e) {
        console.debug(`[METRICS] Model-specific metrics failed: ${e.message}`);
      }
    }

    // SECOND: Try common model paths (legacy support)
    const modelPaths = ["/default", "/current"];

    for (const modelPath of modelPaths) {
      try {
        const endpoint = `/metrics${modelPath}`;
        const data = await this._fetchEndpoint(endpoint, 3000);
        if (data && typeof data === "object") {
          return data;
        }
      } catch (e) {
        // Continue to next model path
      }
    }

    return null;
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
      } else if (metricName === "llamacpp:n_busy_slots_per_decode") {
        metrics.nBusySlotsPerDecode = value;
      } else if (metricName === "llamacpp:prompt_tokens_total") {
        metrics.promptTokensTotal = value;
        metrics.nTokensProcessed = value;
      } else if (metricName === "llamacpp:tokens_predicted_total") {
        metrics.predictedTokensTotal = value;
        metrics.nTokensPredicted = value;
      } else if (metricName === "llamacpp:prompt_seconds_total") {
        metrics.promptSecondsTotal = value;
      } else if (metricName === "llamacpp:tokens_predicted_seconds_total") {
        metrics.predictedSecondsTotal = value;
      } else if (metricName === "llamacpp:n_tokens_max") {
        metrics.nTokensMax = value;
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
