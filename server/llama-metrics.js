/**
 * Llama Metrics - llama-server specific metrics collection
 * Simplified with minimal logging and efficient broadcasting
 * Uses detectLlamaServer() as the single source of truth for port detection
 */

import { LlamaServerMetricsScraper } from "./handlers/llama-router/metrics-scraper.js";
import { llamaApiRequest } from "./handlers/llama-router/api.js";
import { getServerUptime } from "./handlers/llama-router/start.js";
import { getRouterConfig } from "./db/config.js";

let llamaMetricsScraper = null;

/**
 * Get the loaded model name from llama-server
 */
async function getLoadedModelName(port) {
  try {
    const url = `http://127.0.0.1:${port}`;
    const modelsResponse = await Promise.race([
      llamaApiRequest("/models", "GET", null, url),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
    ]);

    const models = modelsResponse?.data || [];
    for (const model of models) {
      if (model?.status?.value === "loaded") {
        return model.id;
      }
    }
  } catch (e) {
    console.debug("[LlamaMetrics] Could not get loaded model:", e.message);
  }
  return null;
}

/**
 * Get the correct port for llama-server metrics.
 * THE SINGLE SOURCE OF TRUTH: detect the actual running llama-server
 * Falls back to configured port only if no server is detected
 */
async function getLlamaServerPort() {
  // First, try to detect running llama-server (THE SOURCE OF TRUTH)
  try {
    const { detectLlamaServer } = await import("./handlers/llama-router/status.js");
    const detected = await detectLlamaServer();
    if (detected) {
      console.log(`[LlamaMetrics] Detected llama-server on port ${detected.port}`);
      return detected.port;
    }
  } catch (e) {
    console.debug("[LlamaMetrics] Could not detect llama-server:", e.message);
  }

  // Fallback to configured port
  try {
    const config = getRouterConfig(null);
    if (config?.port) {
      console.log(`[LlamaMetrics] Using configured port ${config.port}`);
      return config.port;
    }
  } catch (e) {
    // Ignore
  }

  console.log("[LlamaMetrics] No server detected, using default port 8080");
  return 8080;
}

/**
 * Initialize or update the metrics scraper with port and loaded model
 */
async function updateScraper(port, modelName = null) {
  if (llamaMetricsScraper) {
    llamaMetricsScraper.updatePort(port);
  } else {
    llamaMetricsScraper = new LlamaServerMetricsScraper({
      host: "127.0.0.1",
      port: port,
      modelName: modelName,
    });
  }

  // Update model name if provided
  if (modelName) {
    llamaMetricsScraper.updateModel(modelName);
  }

  console.log(`[LlamaMetrics] Scraper ready: port=${port}, model=${modelName || "none"}`);
}

export function initializeLlamaMetricsScraper(port, db = null) {
  // If port is explicitly provided, use it
  if (port) {
    updateScraper(port);
    return;
  }

  // Otherwise, detect the running server dynamically (SOURCE OF TRUTH)
  getLlamaServerPort().then((actualPort) => {
    updateScraper(actualPort);
  });
}

/**
 * Refresh the loaded model name in the scraper
 */
export async function refreshLlamaMetricsModel() {
  if (!llamaMetricsScraper) return;

  try {
    const modelName = await getLoadedModelName(llamaMetricsScraper.port);
    if (modelName) {
      llamaMetricsScraper.updateModel(modelName);
      console.log(`[LlamaMetrics] Updated model to: ${modelName}`);
    }
  } catch (e) {
    // Ignore
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

export async function collectLlamaMetrics(socket, db = null) {
  // Validate socket has emit method
  if (!socket || typeof socket.emit !== "function") {
    console.debug("[LlamaMetrics] Invalid socket, skipping metrics emission");
    return;
  }

  // Emit stopped status when server is not running
  if (!llamaMetricsScraper) {
    console.debug("[DEBUG] LlamaMetrics: Scraper not initialized, emitting stopped status");
    socket.broadcast.emit("llama-server:status", {
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

  // REFRESH: Update the model name before fetching metrics
  // This ensures we get metrics for the currently loaded model
  try {
    const loadedModel = await getLoadedModelName(llamaMetricsScraper.port);
    if (loadedModel) {
      llamaMetricsScraper.updateModel(loadedModel);
    }
  } catch (e) {
    // Ignore - will try without model name
  }

  try {
    console.debug("[DEBUG] LlamaMetrics: Fetching metrics...");
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
        uptime: metrics.uptime || getServerUptime(),
      };

      // Broadcast metrics with type for filtering
      socket.broadcast.emit("llama-server:status", {
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
      console.debug("[DEBUG] LlamaMetrics: Emitted running status with metrics");
    } else {
      // No metrics data - try to detect if server is actually running
      try {
        const { detectLlamaServer } = await import("./handlers/llama-router/status.js");
        const detected = await detectLlamaServer();

        if (detected) {
          // Server is running but metrics endpoint not responding
          console.debug("[DEBUG] LlamaMetrics: Server detected but metrics unavailable");
          socket.broadcast.emit("llama-server:status", {
            type: "broadcast",
            data: {
              status: "running",
              url: detected.url,
              port: detected.port,
              metrics: getDefaultMetrics(),
              rawMetrics: null,
            },
            timestamp: Date.now(),
          });
        } else {
          // No server detected
          console.debug("[DEBUG] LlamaMetrics: No server detected, emitting stopped");
          socket.broadcast.emit("llama-server:status", {
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
        }
      } catch (detectError) {
        // Fallback to running with zeros
        console.debug("[DEBUG] LlamaMetrics: No metrics data, emitting running with zeros");
        socket.broadcast.emit("llama-server:status", {
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
  } catch (e) {
    console.warn("[LlamaMetrics] Metrics collection failed:", e.message);

    // Try to detect if server is running
    try {
      const { detectLlamaServer } = await import("./handlers/llama-router/status.js");
      const detected = await detectLlamaServer();

      if (detected) {
        // Server is running but there's an error - emit running with zeros
        socket.broadcast.emit("llama-server:status", {
          type: "broadcast",
          data: {
            status: "running",
            url: detected.url,
            port: detected.port,
            metrics: getDefaultMetrics(),
            rawMetrics: null,
          },
          timestamp: Date.now(),
        });
      } else {
        // Server is not running - emit stopped
        socket.broadcast.emit("llama-server:status", {
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
      }
    } catch (detectError) {
      // Emit running with zeros on complete failure
      socket.broadcast.emit("llama-server:status", {
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
}

export function cleanupLlamaMetrics() {
  llamaMetricsScraper = null;
}
