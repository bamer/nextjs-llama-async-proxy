import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getLogger } from './logger';
import { validateConfig, validateWithDefault } from './validation-utils';
import {
  llamaServerConfigSchema,
  appConfigSchema,
  type LlamaServerConfig,
  type AppConfig,
} from './validators';

const logger = getLogger();

const SERVER_CONFIG_FILE = join(process.cwd(), 'llama-server-config.json');
const APP_CONFIG_FILE = join(process.cwd(), 'app-config.json');

const DEFAULT_SERVER_CONFIG: LlamaServerConfig = {
  host: "localhost",
  port: 8134,
  basePath: "/models",
  serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
  ctx_size: 8192,
  batch_size: 512,
  threads: -1,
  gpu_layers: -1,
};

const DEFAULT_APP_CONFIG: AppConfig = {
  maxConcurrentModels: 1,
  logLevel: "info",
  autoUpdate: false,
  notificationsEnabled: true,
};

export function loadConfig(): LlamaServerConfig {
  try {
    if (existsSync(SERVER_CONFIG_FILE)) {
      const data = readFileSync(SERVER_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data) as unknown;

      // Validate with Zod
      const validationResult = validateConfig(llamaServerConfigSchema, parsed, "llama-server-config.json");

      if (validationResult.success && validationResult.data) {
        return validationResult.data;
      } else {
        logger.error(
          "[server-config] llama-server-config.json contains invalid data. Errors:",
          validationResult.errors
        );
        logger.info(
          "[server-config] Falling back to default configuration. Please fix the configuration file."
        );
        return DEFAULT_SERVER_CONFIG;
      }
    }
    logger.info("[server-config] llama-server-config.json not found, using defaults");
    return DEFAULT_SERVER_CONFIG;
  } catch (error) {
    logger.warn("[server-config] Failed to load config, using defaults:", error);
    return DEFAULT_SERVER_CONFIG;
  }
}

export function loadAppConfig(): AppConfig {
  try {
    if (existsSync(APP_CONFIG_FILE)) {
      const data = readFileSync(APP_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data) as unknown;

      // Validate with Zod
      const validationResult = validateConfig(appConfigSchema, parsed, "app-config.json");

      if (validationResult.success && validationResult.data) {
        return validationResult.data;
      } else {
        logger.error(
          "[server-config] app-config.json contains invalid data. Errors:",
          validationResult.errors
        );
        logger.info(
          "[server-config] Falling back to default configuration. Please fix the configuration file."
        );
        return DEFAULT_APP_CONFIG;
      }
    }
    logger.info("[server-config] app-config.json not found, using defaults");
    return DEFAULT_APP_CONFIG;
  } catch (error) {
    logger.warn("[server-config] Failed to load app config, using defaults:", error);
    return DEFAULT_APP_CONFIG;
  }
}

export function saveConfig(config: Partial<LlamaServerConfig>): void {
  try {
    const current = loadConfig();
    const updated = { ...current, ...config };

    // Validate before saving
    const validationResult = validateConfig(llamaServerConfigSchema, updated, "llama-server-config.json");

    if (validationResult.success && validationResult.data) {
      writeFileSync(SERVER_CONFIG_FILE, JSON.stringify(validationResult.data, null, 2));
      logger.info("Configuration saved to:", SERVER_CONFIG_FILE);
    } else {
      logger.error("[server-config] Validation failed while saving config. Errors:", validationResult.errors);
      throw new Error(`Invalid configuration: ${validationResult.errors?.join(", ")}`);
    }
  } catch (error) {
    logger.error("Failed to save config:", error);
    throw error;
  }
}

export function saveAppConfig(config: Partial<AppConfig>): void {
  try {
    const current = loadAppConfig();
    const updated = { ...current, ...config };

    // Validate before saving
    const validationResult = validateConfig(appConfigSchema, updated, "app-config.json");

    if (validationResult.success && validationResult.data) {
      writeFileSync(APP_CONFIG_FILE, JSON.stringify(validationResult.data, null, 2));
      logger.info("App configuration saved to:", APP_CONFIG_FILE);
    } else {
      logger.error("[server-config] Validation failed while saving app config. Errors:", validationResult.errors);
      throw new Error(`Invalid configuration: ${validationResult.errors?.join(", ")}`);
    }
  } catch (error) {
    logger.error("Failed to save app config:", error);
    throw error;
  }
}

export type { AppConfig, LlamaServerConfig };
