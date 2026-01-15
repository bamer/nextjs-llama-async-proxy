/**
 * Server Startup Module
 * Handles server initialization and auto-start logic for llama-server
 * Single responsibility: manage server startup sequence
 */

import fs from "fs";

/**
 * Auto-start llama-server if enabled in config
 * @param {Object} options - Startup options
 * @param {Object} options.db - Database instance
 * @param {Function} options.startLlamaServerRouter - Router starter function
 * @param {Function} options.initializeLlamaMetrics - Metrics scraper initializer
 */
export async function autoStartLlamaServer({ db, startLlamaServerRouter, initializeLlamaMetrics }) {
  const config = db.getConfig();

  // Use new name or fallback to old for backward compatibility
  const autoStartEnabled = config.auto_start_on_launch ?? config.llama_server_enabled;

  if (!autoStartEnabled) {
    console.log("[SERVER] Llama-server auto-start disabled (auto_start_on_launch: false)");
    return null;
  }

  const modelsDir = config.baseModelsPath;
  if (!modelsDir) {
    console.log("[SERVER] Llama-server auto-start skipped: models directory not configured");
    return null;
  }

  if (!fs.existsSync(modelsDir)) {
    console.log(`[SERVER] Llama-server auto-start skipped: models directory not found: ${modelsDir}`);
    return null;
  }

  console.log("[SERVER] Auto-starting llama-server (auto_start_on_launch: true)...");

  try {
    const settings = db.getMeta("user_settings") || {};
    const result = await startLlamaServerRouter(modelsDir, db, {
      maxModels: settings.maxModelsLoaded || 4,
      ctxSize: config.ctx_size || 4096,
      threads: config.threads || 4,
      noAutoLoad: !settings.autoLoadModels,
    });

    if (result.success) {
      console.log(`[SERVER] Llama-server auto-started on port ${result.port}`);
      // Initialize metrics scraper for the auto-started server
      if (initializeLlamaMetrics) {
        initializeLlamaMetrics(result.port);
      }
      return result;
    } else {
      console.warn(`[SERVER] Llama-server auto-start failed: ${result.error}`);
      return null;
    }
  } catch (e) {
    console.error(`[SERVER] Llama-server auto-start error: ${e.message}`);
    return null;
  }
}

export default { autoStartLlamaServer };
