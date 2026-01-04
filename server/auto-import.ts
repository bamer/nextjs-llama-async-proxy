import { getLogger } from '../src/lib/logger';
import { getModels, saveModel } from '../src/lib/database';
import type LlamaServerIntegration from '../src/server/services/LlamaServerIntegration';
import type { LlamaServerConfig } from './config-loader';
import type { LlamaServiceState } from '../src/server/services/llama/types';

const logger = getLogger();

export async function tryAutoImport(
  llamaIntegration: LlamaServerIntegration,
  llamaConfig: LlamaServerConfig,
  retries: number = 3,
): Promise<boolean> {
  // Check auto-start setting - only auto-import if enabled
  const autoStart = (llamaConfig as any).autoStart ?? false;

  if (!autoStart) {
    logger.info('⏸ [AUTO-IMPORT] Auto-start is disabled - skipping auto-import');
    return true;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const dbModels = getModels();
      logger.info(`[AUTO-IMPORT] Check ${i + 1}/${retries}: Database has ${dbModels.length} models`);

      if (dbModels.length === 0) {
        logger.info('📥 [AUTO-IMPORT] Database is empty, importing from llama-server...');

        const llamaService = llamaIntegration.getLlamaService();
        if (!llamaService) {
          logger.warn(`[AUTO-IMPORT] Retry ${i + 1}/${retries}: LlamaService not available yet, waiting...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        const llamaModels = (llamaService.getState() as LlamaServiceState).models;
        logger.info(`[AUTO-IMPORT] Found ${llamaModels.length} models from llama-server`);

        if (llamaModels.length === 0) {
          logger.warn(`[AUTO-IMPORT] Retry ${i + 1}/${retries}: No models found in llama-server`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        for (const llamaModel of llamaModels) {
          try {
            if (!llamaModel.name || typeof llamaModel.name !== 'string') {
              logger.warn(`[AUTO-IMPORT] Skipping model with invalid name:`, llamaModel);
              continue;
            }

            const modelRecord = {
              name: llamaModel.name.trim(),
              type: 'llama' as const,
              status: 'stopped' as const,
              model_path: llamaModel.id || llamaModel.name,
              model_url: '',
              ctx_size: llamaConfig.ctx_size,
              batch_size: llamaConfig.batch_size,
              threads: llamaConfig.threads,
              file_size_bytes: llamaModel.size || 0,
            };

            const dbId = saveModel(modelRecord);
            logger.info(`[AUTO-IMPORT] Imported model: ${modelRecord.name} (DB ID: ${dbId})`);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const modelName = (llamaModel as unknown as { name?: string }).name || 'unknown';
            logger.error(`[AUTO-IMPORT] Failed to import model ${modelName}: ${message}`);
          }
        }

        logger.info('✅ [AUTO-IMPORT] Models import completed');
        return true;
      } else {
        logger.info('[AUTO-IMPORT] Database already has models, skipping import');
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`[AUTO-IMPORT] Retry ${i + 1}/${retries} failed: ${message}`);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
  return false;
}
