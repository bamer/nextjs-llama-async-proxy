import { getLogger } from "@/lib/logger";
import { saveModel, saveModelFitParams, getModelByName, updateModel } from "@/lib/database";
import { ModelWithMetadata } from "./model-import-service";

const logger = getLogger();

export class ModelDatabaseService {
  public async saveModelToDatabase(model: ModelWithMetadata): Promise<number | null> {
    try {
      const existing = getModelByName(model.name);

      if (existing) {
        logger.info(`[ModelDatabase] Updating existing model: ${model.name}`);

        updateModel(existing.id!, {
          model_path: model.path,
          file_size_bytes: model.size,
          ctx_size: model.ctx_size || 4096,
          last_fit_params_check: Date.now(),
          fit_params_available: 1,
        });

        if (existing.id) {
          saveModelFitParams(existing.id, {
            recommended_ctx_size: model.ctx_size || 4096,
            recommended_gpu_layers: null,
            recommended_tensor_split: null,
            file_size_bytes: model.size,
            quantization_type: model.quantization || null,
            parameter_count: model.parameter_count,
            architecture: model.architecture || null,
            context_window: model.ctx_size || null,
            fit_params_analyzed_at: Date.now(),
            fit_params_success: 1,
            fit_params_error: null,
            fit_params_raw_output: JSON.stringify(model.metadata, null, 2),
            projected_cpu_memory_mb: null,
            projected_gpu_memory_mb: null,
          });

          return existing.id;
        }
      } else {
        logger.info(`[ModelDatabase] Creating new model: ${model.name}`);

        const modelId = saveModel({
          name: model.name,
          type: "llama",
          status: "stopped",
          model_path: model.path,
          ctx_size: model.ctx_size || 4096,
          batch_size: 2048,
          threads: -1,
          file_size_bytes: model.size,
          fit_params_available: 1,
          last_fit_params_check: Date.now(),
        });

        saveModelFitParams(modelId, {
          recommended_ctx_size: model.ctx_size || 4096,
          recommended_gpu_layers: null,
          recommended_tensor_split: null,
          file_size_bytes: model.size,
          quantization_type: model.quantization || null,
          parameter_count: model.parameter_count,
          architecture: model.architecture || null,
          context_window: model.ctx_size || null,
          fit_params_analyzed_at: Date.now(),
          fit_params_success: 1,
          fit_params_error: null,
          fit_params_raw_output: JSON.stringify(model.metadata, null, 2),
          projected_cpu_memory_mb: null,
          projected_gpu_memory_mb: null,
        });

        return modelId;
      }

      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[ModelDatabase] Failed to save model ${model.name} to database: ${message}`);
      return null;
    }
  }
}