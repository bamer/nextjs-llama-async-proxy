import { loadConfig } from '../src/lib/server-config';
import { getLogger } from '../src/lib/logger';

const logger = getLogger();

export interface LlamaServerConfig {
  host: string;
  port: number;
  basePath: string;
  serverPath: string;
  ctx_size: number;
  batch_size: number;
  threads: number;
  gpu_layers: number;
  [key: string]: unknown;
}

export function loadLlamaConfig(): LlamaServerConfig {
  try {
    const loadedConfig = loadConfig();
    const config: LlamaServerConfig = {
      host: process.env.LLAMA_SERVER_HOST || loadedConfig.host,
      port: parseInt(process.env.LLAMA_SERVER_PORT || String(loadedConfig.port), 10),
      basePath: process.env.MODELS_PATH || loadedConfig.basePath,
      serverPath: loadedConfig.serverPath,
      ctx_size: loadedConfig.ctx_size,
      batch_size: loadedConfig.batch_size,
      threads: loadedConfig.threads,
      gpu_layers: loadedConfig.gpu_layers,
    };
    logger.info('📝 [CONFIG] Configuration loaded from llama-server-config.json');
    return config;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(`⚠️ [CONFIG] Failed to load config file, using defaults: ${errorMessage}`);
    return {
      host: process.env.LLAMA_SERVER_HOST || 'localhost',
      port: parseInt(process.env.LLAMA_SERVER_PORT || '8134', 10),
      basePath: process.env.MODELS_PATH || '/models',
      serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
      ctx_size: 8192,
      batch_size: 512,
      threads: -1,
      gpu_layers: -1,
    };
  }
}
