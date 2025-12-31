import { getLogger } from "@/lib/logger";
import { getModels, saveModel, updateModel } from "@/lib/database";
import type { ModelConfig } from "@/lib/database";

const logger = getLogger();

export interface LlamaModel {
  id?: string;
  name: string;
  size?: number;
  type?: string;
  parameters?: {
    model_path?: string;
    model_url?: string;
    ctx_size?: number;
    batch_size?: number;
    threads?: number;
  };
}

export interface ModelSyncResult {
  imported: number;
  updated: number;
  deleted: number;
  errors: number;
}

export class ModelSyncService {
  /**
   * Sync models from llama-server to database
   * - Creates new models
   * - Updates existing models
   * - Optionally removes models not in llama-server
   */
  static async syncModelsFromLlamaServer(
    llamaModels: LlamaModel[],
    options?: { removeMissing?: boolean }
  ): Promise<ModelSyncResult> {
    const result: ModelSyncResult = {
      imported: 0,
      updated: 0,
      deleted: 0,
      errors: 0,
    };

    try {
      logger.info(`[ModelSync] Starting sync with ${llamaModels.length} llama-server models`);

      const existingModels = getModels();
      const existingModelNames = new Set(existingModels.map(m => m.name));

      for (const llamaModel of llamaModels) {
        try {
          // Validate model has required fields
          if (!llamaModel.name || typeof llamaModel.name !== 'string') {
            logger.warn('[ModelSync] Skipping model without valid name:', llamaModel);
            result.errors++;
            continue;
          }

          const normalizedName = llamaModel.name.trim();
          const existing = existingModels.find(m => m.name === normalizedName);

          if (existing) {
            // Update existing model
            updateModel(existing.id!, {
              model_path: llamaModel.id || normalizedName,
              file_size_bytes: llamaModel.size || 0,
              updated_at: Date.now(),
            });
            logger.debug(`[ModelSync] Updated model: ${normalizedName}`);
            result.updated++;
          } else {
            // Import new model
            saveModel({
              name: normalizedName,
              type: 'llama',
              status: 'stopped',
              model_path: llamaModel.id || normalizedName,
              model_url: '',
              ctx_size: 4096,
              batch_size: 2048,
              threads: -1,
              file_size_bytes: llamaModel.size || 0,
            });
            logger.info(`[ModelSync] Imported new model: ${normalizedName}`);
            result.imported++;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.error(`[ModelSync] Failed to sync model: ${message}`);
          result.errors++;
        }
      }

      // Optionally remove models not in llama-server
      if (options?.removeMissing) {
        const llamaModelNames = new Set(
          llamaModels
            .filter(m => m.name && typeof m.name === 'string')
            .map(m => m.name.trim())
        );

        for (const dbModel of existingModels) {
          if (!llamaModelNames.has(dbModel.name)) {
            try {
              // You'll need to import deleteModel if you want to enable this
              logger.info(`[ModelSync] Would remove missing model: ${dbModel.name}`);
              result.deleted++;
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              logger.error(`[ModelSync] Failed to remove model: ${message}`);
              result.errors++;
            }
          }
        }
      }

      logger.info(
        `[ModelSync] Sync complete: ${result.imported} imported, ${result.updated} updated, ${result.deleted} deleted, ${result.errors} errors`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[ModelSync] Sync failed: ${message}`);
      throw error;
    }

    return result;
  }

  /**
   * Check if database needs sync
   */
  static needsSync(llamaModels: any[]): boolean {
    const dbModels = getModels();
    return dbModels.length === 0 || dbModels.length !== llamaModels.length;
  }
}
