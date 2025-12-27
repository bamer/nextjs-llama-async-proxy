import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getLogger } from './logger';

const logger = getLogger();

interface LlamaServerConfig {
  host: string;
  port: number;
  basePath: string;
  serverPath: string;
  ctx_size: number;
  batch_size: number;
  threads: number;
  gpu_layers: number;
}

interface AppConfig {
  maxConcurrentModels: number;
  logLevel: string;
  autoUpdate: boolean;
  notificationsEnabled: boolean;
}

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
      const saved = JSON.parse(data) as Partial<LlamaServerConfig>;
      return { ...DEFAULT_SERVER_CONFIG, ...saved };
    }
    return DEFAULT_SERVER_CONFIG;
  } catch (error) {
    logger.warn("Failed to load config, using defaults:", error);
    return DEFAULT_SERVER_CONFIG;
  }
}

export function loadAppConfig(): AppConfig {
  try {
    if (existsSync(APP_CONFIG_FILE)) {
      const data = readFileSync(APP_CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(data) as Partial<AppConfig>;
      return { ...DEFAULT_APP_CONFIG, ...saved };
    }
    return DEFAULT_APP_CONFIG;
  } catch (error) {
    logger.warn("Failed to load app config, using defaults:", error);
    return DEFAULT_APP_CONFIG;
  }
}

export function saveConfig(config: Partial<LlamaServerConfig>): void {
  try {
    const current = loadConfig();
    const updated = { ...current, ...config };
    writeFileSync(SERVER_CONFIG_FILE, JSON.stringify(updated, null, 2));
    logger.info("Configuration saved to:", SERVER_CONFIG_FILE);
  } catch (error) {
    logger.error("Failed to save config:", error);
    throw error;
  }
}

export function saveAppConfig(config: Partial<AppConfig>): void {
  try {
    const current = loadAppConfig();
    const updated = { ...current, ...config };
    writeFileSync(APP_CONFIG_FILE, JSON.stringify(updated, null, 2));
    logger.info("App configuration saved to:", APP_CONFIG_FILE);
  } catch (error) {
    logger.error("Failed to save app config:", error);
    throw error;
  }
}

export type { AppConfig };
