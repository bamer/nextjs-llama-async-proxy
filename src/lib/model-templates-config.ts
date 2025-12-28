import fs from "fs";
import path from "path";

// In-memory cache for model templates configuration
let configCache: Record<string, any> | null = null;

const MODEL_TEMPLATES_PATH = path.join(
  process.cwd(),
  "src/config/model-templates.json"
);

/**
 * Get model templates configuration from memory cache.
 * Loads from disk on first call or cache miss.
 */
export function getModelTemplatesConfig(): Record<string, any> | null {
  if (!configCache) {
    try {
      // Load from disk ONLY ONCE (server startup or cache miss)
      const content = fs.readFileSync(MODEL_TEMPLATES_PATH, "utf-8");
      configCache = JSON.parse(content);
      console.log(
        "[Model Templates Config] Loaded from file into memory cache"
      );
    } catch (error) {
      console.error(
        "[Model Templates Config] Error loading config from disk:",
        error
      );
      configCache = { model_templates: {} };
    }
  }
  return configCache;
}

/**
 * Invalidate the cache to force reload from disk.
 * Use this when models are refreshed or config is updated externally.
 */
export function invalidateModelTemplatesCache(): void {
  configCache = null;
  console.log(
    "[Model Templates Config] Cache invalidated, will reload from disk"
  );
}

/**
 * Update model templates configuration in memory and persist to disk.
 * @param updates - Partial configuration updates to merge
 */
export function updateModelTemplatesConfig(updates: any): void {
  if (configCache) {
    // Update cache in memory
    configCache = { ...configCache, ...updates };

    // Persist to disk
    try {
      fs.writeFileSync(
        MODEL_TEMPLATES_PATH,
        JSON.stringify(configCache, null, 2),
        "utf-8"
      );
      console.log("[Model Templates Config] Updated and persisted to disk");
    } catch (error) {
      console.error(
        "[Model Templates Config] Error writing config to disk:",
        error
      );
      throw error;
    }
  } else {
    // Cache not initialized, load first
    const config = getModelTemplatesConfig();
    if (config) {
      updateModelTemplatesConfig(updates);
    }
  }
}
