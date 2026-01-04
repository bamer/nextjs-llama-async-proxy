import { loadConfig } from '../src/lib/server-config';
import { getLogger } from '../src/lib/logger';
import type { LlamaServerConfig } from '../src/lib/validators';

const logger = getLogger();

export function loadLlamaConfig(): LlamaServerConfig {
  try {
    const loadedConfig = loadConfig();
    // Support both old name (basePath) and new name (baseModelsPath) for backward compatibility
    const oldBasePath = (loadedConfig as any).basePath;

    // Build config with new name, falling back to old name for compatibility
    const baseModelsPathValue = process.env.MODELS_PATH || loadedConfig.baseModelsPath || oldBasePath || "/models";

    return {
      host: process.env.LLAMA_SERVER_HOST || loadedConfig.host,
      port: parseInt(process.env.LLAMA_SERVER_PORT || String(loadedConfig.port), 10),
      baseModelsPath: baseModelsPathValue,
      serverPath: loadedConfig.serverPath,
      ctx_size: loadedConfig.ctx_size,
      batch_size: loadedConfig.batch_size,
      threads: loadedConfig.threads,
      gpu_layers: loadedConfig.gpu_layers,
    };
    logger.info('📝 [CONFIG] Configuration loaded from llama-server-config.json');
    return {
      host: process.env.LLAMA_SERVER_HOST || loadedConfig.host,
      port: parseInt(process.env.LLAMA_SERVER_PORT || String(loadedConfig.port), 10),
      baseModelsPath: process.env.MODELS_PATH || '/models',
      serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
      ctx_size: 8192,
      batch_size: 512,
      threads: -1,
      gpu_layers: -1,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(`⚠️ [CONFIG] Failed to load config file, using defaults: ${errorMessage}`);
    return {
      host: process.env.LLAMA_SERVER_HOST || 'localhost',
      port: parseInt(process.env.LLAMA_SERVER_PORT || '8134', 10),
      baseModelsPath: process.env.MODELS_PATH || '/models',
      serverPath: '/home/bamer/llama.cpp/build/bin/llama-server',
      ctx_size: 8192,
      batch_size: 512,
      threads: -1,
      gpu_layers: -1,
    };
  }
}
