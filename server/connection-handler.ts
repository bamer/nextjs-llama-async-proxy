import { Socket } from 'socket.io';
import { getLogger } from '../src/lib/logger';
import LlamaServerIntegration from '../src/server/services/LlamaServerIntegration';
import {
  getModels,
  saveModel,
  updateModel,
  deleteModel,
} from '../src/lib/database';

const logger = getLogger();

export function setupConnectionHandlers(
  socket: Socket,
  llamaIntegration: LlamaServerIntegration,
): void {
  socket.on('disconnect', (reason: string) => {
    logger.info(`🔴 [SOCKET.IO] Client disconnected | Reason: ${reason}`);
  });

  socket.on('connect_error', (error: Error) => {
    logger.error(`❌ [SOCKET.IO] Connection error: ${error.message}`);
  });

  socket.on('load_models', async () => {
    try {
      logger.info('📚 [SOCKET.IO] Loading models from database...');
      const dbModels = getModels();
      const storeModels = dbModels.map((model) => ({
        id: model.id,
        name: model.name,
        path: (model as any).path,
        size: (model as any).size,
        architecture: (model as any).architecture,
        parameters: (model as any).parameters,
        quantization: (model as any).quantization,
        rope_freq_scale: (model as any).rope_freq_scale,
      }));

      socket.emit('models_loaded', {
        success: true,
        data: storeModels,
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ [SOCKET.IO] Loaded ${storeModels.length} models from database`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
      logger.error(`❌ [SOCKET.IO] Error loading models from database: ${errorMessage}`);
      socket.emit('models_loaded', {
        success: false,
        error: { code: 'LOAD_MODELS_FAILED', message: errorMessage },
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('save_model', async (data) => {
    try {
      const modelData = data as any;
      logger.info(`💾 [SOCKET.IO] Saving model: ${modelData.name}`);
      const model = saveModel(modelData) as any;
      socket.emit('model_saved', {
        success: true,
        data: model,
        timestamp: new Date().toISOString(),
      });
      logger.info(`✅ [SOCKET.IO] Model saved: ${model.name} (ID: ${model.id})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [SOCKET.IO] Error saving model: ${errorMessage}`);
      socket.emit('model_saved', {
        success: false,
        error: { code: 'SAVE_MODEL_FAILED', message: errorMessage },
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('update_model', async (data) => {
    try {
      const updateData = data as any;
      logger.info(`✏️  [SOCKET.IO] Updating model ${updateData.id}`);
      const updated = updateModel(updateData.id, updateData.updates) as any;
      socket.emit('model_updated', {
        success: true,
        data: updated,
        timestamp: new Date().toISOString(),
      });
      logger.info(`✅ [SOCKET.IO] Model updated: ${updated.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [SOCKET.IO] Error updating model: ${errorMessage}`);
      socket.emit('model_updated', {
        success: false,
        error: { code: 'UPDATE_MODEL_FAILED', message: errorMessage },
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('delete_model', async (data) => {
    try {
      const deleteData = data as any;
      logger.info(`🗑️ [SOCKET.IO] Deleting model: ${deleteData.id}`);
      deleteModel(deleteData.id);
      socket.emit('model_deleted', {
        success: true,
        data: { id: deleteData.id },
        timestamp: new Date().toISOString(),
      });
      logger.info(`✅ [SOCKET.IO] Model deleted: ${deleteData.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [SOCKET.IO] Error deleting model: ${errorMessage}`);
      socket.emit('model_deleted', {
        success: false,
        error: { code: 'DELETE_MODEL_FAILED', message: errorMessage },
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('import_models_from_llama', async () => {
    try {
      logger.info('📥 [SOCKET.IO] Importing models from llama-server into database...');
      const llamaModels = await (llamaIntegration as any).getModels();
      logger.info(`[SOCKET.IO] Found ${llamaModels.length} models in llama-server`);

      const existingModels = getModels();
      logger.info(`[SOCKET.IO] Found ${existingModels.length} models in database`);

      let importedCount = 0;
      let skippedCount = 0;
      const importedModels: any[] = [];

      for (const llamaModel of llamaModels) {
        const existingModel = existingModels.find((m: any) => m.name === (llamaModel as any).name);

        if (existingModel) {
          logger.info(`[SOCKET.IO] Skipping existing model: ${(llamaModel as any).name}`);
          skippedCount++;
          continue;
        }

        const modelRecord = {
          name: (llamaModel as any).name,
          type: (llamaModel as any).type === 'mistral' ? 'mistrall' : 'llama',
          status: 'idle',
          model_path: (llamaModel as any).parameters?.model_path || (llamaModel as any).name,
          model_url: (llamaModel as any).parameters?.model_url || '',
          ctx_size: (llamaModel as any).parameters?.ctx_size || 2048,
          batch_size: (llamaModel as any).parameters?.batch_size || 512,
          threads: (llamaModel as any).parameters?.threads || 4,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        } as any;

        const dbId = saveModel(modelRecord);
        logger.info(`[SOCKET.IO] Imported model: ${(llamaModel as any).name} (DB ID: ${dbId})`);
        importedCount++;
        importedModels.push({ ...modelRecord, id: dbId });
      }

      socket.emit('models_imported', {
        success: true,
        data: {
          totalFound: llamaModels.length,
          imported: importedCount,
          skipped: skippedCount,
          models: importedModels,
        },
        message: `Successfully imported ${importedCount} models from llama-server (${skippedCount} already existed)`,
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ [SOCKET.IO] Models import complete: ${importedCount} imported, ${skippedCount} skipped`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ [SOCKET.IO] Error importing models: ${errorMessage}`);
      socket.emit('models_imported', {
        success: false,
        error: { code: 'IMPORT_MODELS_FAILED', message: errorMessage },
        timestamp: new Date().toISOString(),
      });
    }
  });
}
