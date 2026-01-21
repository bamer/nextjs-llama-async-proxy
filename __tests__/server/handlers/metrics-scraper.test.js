/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("LlamaServerMetricsScraper", () => {
  let mockHttp;
  let mockUrl;

  /**
   * Mock http module before importing the scraper
   */
  beforeEach(() => {
    jest.resetModules();
    
    // Mock http.request
    mockHttp = {
      request: jest.fn(),
    };
    
    // Provide the mock
    jest.doMock("http", () => mockHttp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe("constructor", () => {
    it("should initialize with default config", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({});
      
      expect(scraper.host).toBe("localhost");
      expect(scraper.port).toBe(8080);
      expect(scraper.baseUrl).toBe("http://localhost:8080");
    });

    it("should initialize with custom config", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({
        host: "127.0.0.1",
        port: 8134,
      });
      
      expect(scraper.host).toBe("127.0.0.1");
      expect(scraper.port).toBe(8134);
      expect(scraper.baseUrl).toBe("http://127.0.0.1:8134");
    });
  });

  describe("updatePort", () => {
    it("should update port and rebuild baseUrl", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({
        host: "localhost",
        port: 8080,
      });
      
      scraper.updatePort(8134);
      
      expect(scraper.port).toBe(8134);
      expect(scraper.baseUrl).toBe("http://localhost:8134");
    });

    it("should not update if port is the same", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({
        host: "localhost",
        port: 8080,
      });
      
      scraper.updatePort(8080);
      
      expect(scraper.port).toBe(8080);
    });
  });

  describe("_parsePrometheusMetrics", () => {
    it("should parse basic Prometheus metrics", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({});
      
      const prometheusText = `# HELP llamacpp:prompt_tokens_seconds Average prompt throughput in tokens/s.
# TYPE llamacpp:prompt_tokens_seconds gauge
llamacpp:prompt_tokens_seconds 12.5
# HELP llamacpp:predicted_tokens_seconds Average generation throughput in tokens/s.
# TYPE llamacpp:predicted_tokens_seconds gauge
llamacpp:predicted_tokens_seconds 45.2
# HELP llamacpp:requests_processing Number of requests processing.
# TYPE llamacpp:requests_processing gauge
llamacpp:requests_processing 1
# HELP llamacpp:requests_deferred Number of requests waiting.
# TYPE llamacpp:requests_deferred gauge
llamacpp:requests_deferred 0`;

      const metrics = scraper._parsePrometheusMetrics(prometheusText);
      
      expect(metrics.tokensPerSecond).toBe(12.5);
      expect(metrics.predictedTokensSeconds).toBe(45.2);
      expect(metrics.activeModels).toBe(1);
      expect(metrics.queueSize).toBe(0);
    });

    it("should parse token totals", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({});
      
      const prometheusText = `llamacpp:prompt_tokens_total 1500
llamacpp:tokens_predicted_total 45000`;

      const metrics = scraper._parsePrometheusMetrics(prometheusText);
      
      expect(metrics.promptTokensTotal).toBe(1500);
      expect(metrics.nTokensProcessed).toBe(1500);
      expect(metrics.predictedTokensTotal).toBe(45000);
      expect(metrics.nTokensPredicted).toBe(45000);
    });

    it("should parse advanced metrics", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({});
      
      const prometheusText = `llamacpp:n_decode_total 100
llamacpp:n_busy_slots_per_decode 4.5
llamacpp:n_tokens_max 2048
llamacpp:prompt_seconds_total 15.5
llamacpp:tokens_predicted_seconds_total 450.2`;

      const metrics = scraper._parsePrometheusMetrics(prometheusText);
      
      expect(metrics.nDecodeTotal).toBe(100);
      expect(metrics.totalRequests).toBe(100);
      expect(metrics.nBusySlotsPerDecode).toBe(4.5);
      expect(metrics.nTokensMax).toBe(2048);
      expect(metrics.promptSecondsTotal).toBe(15.5);
      expect(metrics.predictedSecondsTotal).toBe(450.2);
    });

    it("should parse server configuration metrics", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({});
      
      const prometheusText = `llamacpp:llm_server_vram_total 8589934592
llamacpp:llm_server_vram_used 2147483648
llamacpp:llm_server_n_ctx 4096
llamacpp:llm_server_n_parallel 4
llamacpp:llm_server_n_threads 8`;

      const metrics = scraper._parsePrometheusMetrics(prometheusText);
      
      expect(metrics.vramTotal).toBe(8589934592);
      expect(metrics.vramUsed).toBe(2147483648);
      expect(metrics.nCtx).toBe(4096);
      expect(metrics.nParallel).toBe(4);
      expect(metrics.nThreads).toBe(8);
    });

    it("should skip comments and empty lines", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({});
      
      const prometheusText = `# HELP comment
# TYPE comment gauge
# This is a multi-line comment
llamacpp:prompt_tokens_seconds 10

llamacpp:predicted_tokens_seconds 20`;

      const metrics = scraper._parsePrometheusMetrics(prometheusText);
      
      expect(metrics.tokensPerSecond).toBe(10);
      expect(metrics.predictedTokensSeconds).toBe(20);
    });

    it("should handle invalid lines gracefully", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({});
      
      const prometheusText = `invalid_line_without_value
llamacpp:prompt_tokens_seconds NaN
llamacpp:prompt_tokens_seconds 15.5`;

      const metrics = scraper._parsePrometheusMetrics(prometheusText);
      
      expect(metrics.tokensPerSecond).toBe(15.5);
    });

    it("should return empty metrics for empty input", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({});
      
      const metrics = scraper._parsePrometheusMetrics("");
      
      expect(metrics.tokensPerSecond).toBe(0);
      expect(metrics.activeModels).toBe(0);
    });
  });

  describe("caching", () => {
    it("should return cached metrics within TTL", async () => {
      const { LlamaServerMetricsScraper } = await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/metrics-scraper.js");
      
      const scraper = new LlamaServerMetricsScraper({});
      
      // Set cached data
      const cachedMetrics = { tokensPerSecond: 100 };
      scraper.cache.set("metrics", {
        data: cachedMetrics,
        timestamp: Date.now(),
      });
      
      // getMetrics should return cached data
      const result = await scraper.getMetrics();
      
      expect(result).toEqual(cachedMetrics);
      // http.request should not have been called
      expect(mockHttp.request).not.toHaveBeenCalled();
    });
  });
});
