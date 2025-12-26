import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

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

const CONFIG_FILE = join(process.cwd(), 'llama-server-config.json');

const DEFAULT_CONFIG: LlamaServerConfig = {
  host: "localhost",
  port: 8134,
  basePath: "/models",
  serverPath: "/home/bamer/llama.cpp/build/bin/llama-server",
  ctx_size: 8192,
  batch_size: 512,
  threads: -1,
  gpu_layers: -1,
};

export function loadConfig(): LlamaServerConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(data) as Partial<LlamaServerConfig>;
      return { ...DEFAULT_CONFIG, ...saved };
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn("Failed to load config, using defaults:", error);
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Partial<LlamaServerConfig>): void {
  try {
    const current = loadConfig();
    const updated = { ...current, ...config };
    writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
    console.log("Configuration saved to:", CONFIG_FILE);
  } catch (error) {
    console.error("Failed to save config:", error);
    throw error;
  }
}
