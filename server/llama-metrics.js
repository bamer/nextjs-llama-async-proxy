/**
 * Llama Metrics - llama-server specific metrics collection
 * Simplified with minimal logging and efficient broadcasting
 */

import { LlamaServerMetricsScraper } from "./handlers/llama-router/metrics-scraper.js";
import { getServerUptime } from "./handlers/llama-router/start.js";

let llamaMetricsScraper = null;

export function initializeLlamaMetricsScraper(port, db = null) {
  if (llamaMetricsScraper) {
    llamaMetricsScraper.updatePort(port);
  } else {
    llamaMetricsScraper = new LlamaServerMetricsScraper({
      host: "127.0.0.1",
      port: port || 8080,
    });
  }
}

export async function collectLlamaMetrics(io, db = null) {
  if (!llamaMetricsScraper) return;

  try {
    const metrics = await llamaMetricsScraper.getMetrics();
    if (metrics) {
      const currentPort = llamaMetricsScraper.port || 8080;
      const url = `http://127.0.0.1:${currentPort}`;

      // Build frontend-compatible format
      const frontendMetrics = {
        promptTokensSeconds: metrics.tokensPerSecond || 0,
        predictedTokensSeconds: metrics.predictedTokensSeconds || metrics.tokensPerSecond || 0,
        promptTokensTotal: metrics.promptTokensTotal || 0,
        predictedTokensTotal: metrics.predictedTokensTotal || 0,
        vramTotal: metrics.vramTotal || 0,
        vramUsed: metrics.vramUsed || 0,
        nCtx: metrics.nCtx || 0,
        nParallel: metrics.nParallel || 0,
        nThreads: metrics.nThreads || 0,
        activeModels: metrics.activeModels || 0,
        queueSize: metrics.queueSize || 0,
        totalRequests: metrics.totalRequests || 0,
        nDecodeTotal: metrics.nDecodeTotal || 0,
        nBusySlotsPerDecode: metrics.nBusySlotsPerDecode || 0,
        nTokensMax: metrics.nTokensMax || 0,
        promptSecondsTotal: metrics.promptSecondsTotal || 0,
        predictedSecondsTotal: metrics.predictedSecondsTotal || 0,
        uptime: getServerUptime(),
      };

      // Broadcast metrics with type for filtering
      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "running",
          url: url,
          port: currentPort,
          metrics: frontendMetrics,
          rawMetrics: metrics,
        },
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    // Silently fail - metrics are optional
  }
}

export function cleanupLlamaMetrics() {
  llamaMetricsScraper = null;
}
