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

/**
 * Default metrics when llama-server is not running or metrics unavailable
 */
function getDefaultMetrics() {
  return {
    promptTokensSeconds: 0,
    predictedTokensSeconds: 0,
    promptTokensTotal: 0,
    predictedTokensTotal: 0,
    vramTotal: 0,
    vramUsed: 0,
    nCtx: 0,
    nParallel: 0,
    nThreads: 0,
    activeModels: 0,
    queueSize: 0,
    totalRequests: 0,
    nDecodeTotal: 0,
    nBusySlotsPerDecode: 0,
    nTokensMax: 0,
    promptSecondsTotal: 0,
    predictedSecondsTotal: 0,
    uptime: 0,
  };
}

export async function collectLlamaMetrics(io, db = null) {
  // Emit stopped status when server is not running
  if (!llamaMetricsScraper) {
    console.log("[DEBUG] LlamaMetrics: Scraper not initialized, emitting stopped status");
    io.emit("llama-server:status", {
      type: "broadcast",
      data: {
        status: "stopped",
        url: null,
        port: null,
        metrics: getDefaultMetrics(),
        rawMetrics: null,
      },
      timestamp: Date.now(),
    });
    return;
  }

  try {
    console.log("[DEBUG] LlamaMetrics: Fetching metrics from llama-server...");
    const metrics = await llamaMetricsScraper.getMetrics();
    console.log("[DEBUG] LlamaMetrics: Raw metrics received:", {
      hasData: !!metrics,
      tokensPerSecond: metrics?.tokensPerSecond,
      activeModels: metrics?.activeModels,
      uptime: metrics?.uptime,
    });

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
        uptime: metrics.uptime || getServerUptime(),
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
      console.log("[DEBUG] LlamaMetrics: Emitted running status with metrics");
    } else {
      console.log("[DEBUG] LlamaMetrics: No metrics data, emitting running with zeros");
      io.emit("llama-server:status", {
        type: "broadcast",
        data: {
          status: "running",
          url: null,
          port: null,
          metrics: getDefaultMetrics(),
          rawMetrics: null,
        },
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    console.warn("[LlamaMetrics] Metrics collection failed:", e.message);
    // Emit metrics as zero on failure instead of silent drop
    io.emit("llama-server:status", {
      type: "broadcast",
      data: {
        status: "running",
        url: null,
        port: null,
        metrics: getDefaultMetrics(),
        rawMetrics: null,
      },
      timestamp: Date.now(),
    });
  }
}

export function cleanupLlamaMetrics() {
  llamaMetricsScraper = null;
}
