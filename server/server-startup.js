/**
 * Server Startup Module
 * Handles server initialization and auto-start logic for llama-server
 * Single responsibility: manage server startup sequence
 */

import fs from "fs";
import { getUnifiedConfig } from "./db/unified-config.js";

/**
 * Auto-start llama-server if enabled in config.
 * Checks configuration and starts the llama-server router when conditions are met.
 * @param {Object} options - Startup options
 * @param {Object} options.db - Database instance
 * @param {Function} options.startLlamaServerRouter - Router starter function
 * @param {Function} options.initializeLlamaMetrics - Metrics scraper initializer
 * @returns {Promise<Object|null>} Result object with port on success, null on failure/skip
 */
export async function autoStartLlamaServer({ db, startLlamaServerRouter, initializeLlamaMetrics }) {
  // Use unified config API
  const config = getUnifiedConfig(db);

  // Use unified config field name directly
  const autoStartEnabled = config.autoStartOnLaunch === true;

  console.log("[SERVER] Auto-start check:", {
    autoStartOnLaunch: config.autoStartOnLaunch,
    autoStartEnabled
  });

  if (!autoStartEnabled) {
    console.log("[SERVER] Llama-server auto-start disabled (autoStartOnLaunch: false)");
    return null;
  }

  const modelsDir = config.modelsPath;
  if (!modelsDir) {
    console.log("[SERVER] Llama-server auto-start skipped: models directory not configured");
    return null;
  }

  if (!fs.existsSync(modelsDir)) {
    console.log(`[SERVER] Llama-server auto-start skipped: models directory not found: ${modelsDir}`);
    return null;
  }

  console.log("[SERVER] Auto-starting llama-server (autoStartOnLaunch: true)...");

  try {
    const settings = db.getMeta("user_settings") || {};
    const result = await startLlamaServerRouter(modelsDir, db, {
      maxModels: config.maxModelsLoaded || settings.maxModelsLoaded || 4,
      ctxSize: config.ctxSize || 4096,
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
