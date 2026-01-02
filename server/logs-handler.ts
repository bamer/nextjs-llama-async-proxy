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

export function setupLogsHandlers(socket: Socket): void {
  socket.on('save_config', async (data) => {
    try {
      const saveData = data as any;
      logger.info(`💾 [SOCKET.IO] Saving config for model ${saveData.id}, type: ${saveData.type}`);

      const configMap: any = {
        sampling: { get: getModelSamplingConfig, save: saveModelSamplingConfig },
        memory: { get: getModelMemoryConfig, save: saveModelMemoryConfig },
        gpu: { get: getModelGpuConfig, save: saveModelGpuConfig },
        advanced: { get: getModelAdvancedConfig, save: saveModelAdvancedConfig },
        lora: { get: getModelLoraConfig, save: saveModelLoraConfig },
        multimodal: { get: getModelMultimodalConfig, save: saveModelMultimodalConfig },
      };

      const configHandler = configMap[saveData.type];
      if (!configHandler) {
        throw new Error(`Invalid config type: ${saveData.type}`);
      }

      const result = configHandler.save(saveData.id, saveData.config);
      socket.emit('config_saved', {
        success: true,
        data: { id: saveData.id, type: saveData.type, config: result },
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ [SOCKET.IO] Config saved: ${saveData.type} for model ${saveData.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [SOCKET.IO] Error saving config: ${errorMessage}`);
      socket.emit('config_saved', {
        success: false,
        error: { code: 'SAVE_CONFIG_FAILED', message: errorMessage },
        timestamp: new Date().toISOString(),
      });
    }
  });
}
