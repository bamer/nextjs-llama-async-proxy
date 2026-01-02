import { Socket } from 'socket.io';
import { getLogger } from '../src/lib/logger';
import {
  getModelSamplingConfig,
  saveModelSamplingConfig,
  getModelMemoryConfig,
  saveModelMemoryConfig,
  getModelGpuConfig,
  saveModelGpuConfig,
  getModelAdvancedConfig,
  saveModelAdvancedConfig,
  getModelLoraConfig,
  saveModelLoraConfig,
  getModelMultimodalConfig,
  saveModelMultimodalConfig,
} from '../src/lib/database';

const logger = getLogger();

export function setupMetricsHandlers(socket: Socket): void {
  socket.on('load_config', async (data) => {
    try {
      const configData = data as any;
      logger.info(`📝 [SOCKET.IO] Loading config for model ${configData.id}, type: ${configData.type}`);

      const configMap: any = {
        sampling: { get: getModelSamplingConfig, save: saveModelSamplingConfig },
        memory: { get: getModelMemoryConfig, save: saveModelMemoryConfig },
        gpu: { get: getModelGpuConfig, save: saveModelGpuConfig },
        advanced: { get: getModelAdvancedConfig, save: saveModelAdvancedConfig },
        lora: { get: getModelLoraConfig, save: saveModelLoraConfig },
        multimodal: { get: getModelMultimodalConfig, save: saveModelMultimodalConfig },
      };

      const configHandler = configMap[configData.type];
      if (!configHandler) {
        throw new Error(`Invalid config type: ${configData.type}`);
      }

      const config = configHandler.get(configData.id);
      socket.emit('config_loaded', {
        success: true,
        data: { id: configData.id, type: configData.type, config },
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ [SOCKET.IO] Config loaded: ${configData.type} for model ${configData.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [SOCKET.IO] Error loading config: ${errorMessage}`);
      socket.emit('config_loaded', {
        success: false,
        error: { code: 'LOAD_CONFIG_FAILED', message: errorMessage },
        timestamp: new Date().toISOString(),
      });
    }
  });
}
