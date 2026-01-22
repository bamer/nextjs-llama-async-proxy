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
    this.cacheTTL = 500; // 0.5 seconds - fast updates during inference
    this._errorLogged = false;
    this._lastInferenceState = null;
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
    // Check cache first (0.5s cache for fast inference updates)
    const cached = this.cache.get("metrics");
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Try multiple endpoints to get metrics
    try {
      let metrics = null;

      // First try /metrics endpoint with model name (most accurate)
      // This returns Prometheus format with real token/s data
      if (this.modelName) {
        try {
          const endpoint = `/metrics?model=${encodeURIComponent(this.modelName)}`;
          const data = await this._fetchEndpoint(endpoint, 2000);
          if (data && typeof data === "object" && !data.raw) {
            metrics = data;
          }
        } catch (e) {
          console.debug("[METRICS] Model-specific metrics failed:", e.message);
        }
      }

      // If we got metrics, also fetch slot info for active/queue data
        if (metrics && this.modelName) {
        try {
          const slotsEndpoint = `/slots?model=${encodeURIComponent(this.modelName)}`;
          const slotsData = await this._fetchEndpoint(slotsEndpoint, 2000);
          if (slotsData && Array.isArray(slotsData)) {
            // Calculate active and queued slots
            const activeSlots = slotsData.filter(s => s.is_processing).length;
            const totalSlots = slotsData.length;

            // Merge slot info into metrics
            metrics.activeModels = activeSlots;
            metrics.queueSize = slotsData.filter(s => !s.is_processing).length;
            // Prefer total slots; keep backward-compatibility with nParallel
            metrics.nParallel = totalSlots;

            // Get context size / parallel / threads from slots data
            if (slotsData.length > 0) {
              const firstSlot = slotsData[0];
              if (firstSlot?.n_ctx) {
                metrics.nCtx = firstSlot.n_ctx;
              } else if (firstSlot?.nCtx) {
                metrics.nCtx = firstSlot.nCtx;
              }
              if (typeof firstSlot?.n_parallel !== "undefined") {
                metrics.nParallel = firstSlot.n_parallel;
              }
              if (typeof firstSlot?.n_threads !== "undefined") {
                metrics.nThreads = firstSlot.n_threads;
              }
              // KV metrics if available
              const kvUsage = firstSlot?.kv_cache_usage ?? firstSlot?.kvCacheUsage;
              if (typeof kvUsage === "number") {
                metrics.kvCacheUsageRatio = kvUsage;
              }
              const kvTokens = firstSlot?.kv_cache_tokens ?? firstSlot?.kvCacheTokens;
              if (typeof kvTokens === "number") {
                metrics.kvCacheTokens = kvTokens;
              }
            }

            // Get tokens decoded from first slot
            if (slotsData.length > 0 && slotsData[0].next_token) {
              const slot = slotsData[0];
              if (slot.next_token && slot.next_token.length > 0) {
                metrics.nTokensPredicted = slot.next_token[0]?.n_decoded || 0;
              }
            }
          }
        } catch (e) {
          console.debug("[METRICS] Slot info fetch failed:", e.message);
        }
      }

      if (metrics) {
        this.cache.set("metrics", { data: metrics, timestamp: Date.now() });
        return metrics;
      }

      // Fallback: Try /health endpoint (may return "ok" only)
      const healthData = await this._fetchEndpoint("/health", 2000);
      const healthMetrics = this._extractMetricsFromHealth(healthData);

      if (healthMetrics && healthMetrics.hasData === true) {
        this.cache.set("metrics", { data: healthMetrics, timestamp: Date.now() });
        return healthMetrics;
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
