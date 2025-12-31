import fs from "fs";
import path from "path";
import gguf from "gguf";
import { getLogger } from "@/lib/logger";
import { saveModel, saveModelFitParams, getModelByName, updateModel } from "@/lib/database/models-service";
import { getServerConfig } from "@/lib/database/models-service";
import { loadConfig } from "@/lib/server-config";

const logger = getLogger();

export interface DiscoveredModel {
  name: string;
  path: string;
  size: number;
  modified_at: number;
  type: "gguf" | "bin";
}

export interface ModelWithMetadata extends DiscoveredModel {
  metadata: any;
  architecture?: string;
  parameter_count: number;
  quantization: string;
  ctx_size: number;
}

export class ModelImportService {
  private modelsDir: string | null = null;

  constructor() {
    this.loadModelsDirectory();
  }

  private loadModelsDirectory(): void {
    try {
      const serverConfig = getServerConfig();
      if (serverConfig?.models_dir) {
        this.modelsDir = serverConfig.models_dir;
        logger.info(`[ModelImport] Models directory from database: ${this.modelsDir}`);
        return;
      }

      const fileConfig = loadConfig();
      if (fileConfig?.basePath) {
        this.modelsDir = fileConfig.basePath;
        logger.info(`[ModelImport] Models directory from config file: ${this.modelsDir}`);
        return;
      }

      this.modelsDir = null;
      logger.warn("[ModelImport] No models directory configured");
    } catch (error) {
      logger.warn("[ModelImport] Failed to load models directory from config:", error);
      this.modelsDir = null;
    }
  }

  public getModelsDirectory(): string | null {
    return this.modelsDir;
  }

  public async scanModelsDirectory(): Promise<DiscoveredModel[]> {
    if (!this.modelsDir) {
      logger.warn("[ModelImport] No models directory configured");
      return [];
    }

    if (!fs.existsSync(this.modelsDir)) {
      logger.warn(`[ModelImport] Models directory not found: ${this.modelsDir}`);
      return [];
    }

    logger.info(`[ModelImport] Scanning models directory: ${this.modelsDir}`);

    const models: DiscoveredModel[] = [];

    try {
      const entries = fs.readdirSync(this.modelsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(this.modelsDir, entry.name);
          const dirFiles = fs.readdirSync(dirPath);

          for (const file of dirFiles) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile() && (file.endsWith(".gguf") || file.endsWith(".bin"))) {
              models.push({
                name: entry.name,
                path: filePath,
                size: stat.size,
                modified_at: Math.floor(stat.mtimeMs / 1000),
                type: file.endsWith(".gguf") ? "gguf" : "bin",
              });
              break;
            }
          }
        } else if (entry.isFile() && (entry.name.endsWith(".gguf") || entry.name.endsWith(".bin"))) {
          const filePath = path.join(this.modelsDir, entry.name);
          const stat = fs.statSync(filePath);
          models.push({
            name: entry.name.replace(/\.(gguf|bin)$/i, ""),
            path: filePath,
            size: stat.size,
            modified_at: Math.floor(stat.mtimeMs / 1000),
            type: entry.name.endsWith(".gguf") ? "gguf" : "bin",
          });
        }
      }

      logger.info(`[ModelImport] Found ${models.length} model(s) in directory`);
      return models;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[ModelImport] Failed to scan models directory: ${message}`);
      return [];
    }
  }

  private parseMetadataFromFilename(model: DiscoveredModel): ModelWithMetadata {
    const filename = model.path.split('/').pop() || '';
    
    const result: ModelWithMetadata = {
      ...model,
      metadata: {},
      architecture: "unknown",
      parameter_count: 7,
      quantization: "4B",
      ctx_size: 4096,
    };

    if (filename.toLowerCase().includes("llama")) {
      result.architecture = "llama";
    } else if (filename.toLowerCase().includes("mistral")) {
      result.architecture = "mistral";
    } else if (filename.toLowerCase().includes("gemma")) {
      result.architecture = "gemma";
    } else if (filename.toLowerCase().includes("qwen")) {
      result.architecture = "qwen";
    }

    const paramMatch = filename.match(/(\d+)b/i);
    if (paramMatch) {
      result.parameter_count = parseInt(paramMatch[1], 10);
    }

    const quantMatch = filename.match(/(Q\d+_[A-Z]+)/i);
    if (quantMatch) {
      result.quantization = quantMatch[1];
    }

    return result;
  }

  public async extractMetadata(model: DiscoveredModel): Promise<ModelWithMetadata> {
    logger.info(`[ModelImport] Extracting GGUF metadata for: ${model.name}`);

    try {
      if (!fs.existsSync(model.path)) {
        throw new Error(`Model file not found: ${model.path}`);
      }

      const result = await gguf(model.path);

      if (!result || !result.metadata) {
        logger.warn(`[ModelImport] Failed to parse GGUF file for ${model.name}, using filename-based metadata`);
        return this.parseMetadataFromFilename(model);
      }

      const metadata = result.metadata;
      
      const architecture = (metadata as any).general?.architecture || 
                       (metadata as any).gqa?.architecture ||
                       result.metadata?.general?.name || "unknown";

      const parameterCount = (metadata as any).general?.parameter_count || undefined;

      const contextLength = (metadata as any).llama?.context_length || 
                         (metadata as any).general?.context_length;

      const quantization = (metadata as any).quantization?.version ? String((metadata as any).quantization.version) : undefined;

      const modelWithMetadata: ModelWithMetadata = {
        ...model,
        metadata,
        architecture,
        parameter_count: parameterCount ? parameterCount : 7,
        quantization: quantization || "4B",
        ctx_size: contextLength || 4096,
      };

      logger.info(`[ModelImport] GGUF metadata extracted for ${model.name}:`, {
        architecture,
        parameters: parameterCount,
        quantization,
        contextLength,
      });

      return modelWithMetadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[ModelImport] Failed to extract GGUF metadata for ${model.name}: ${message}`);

      return this.parseMetadataFromFilename(model);
    }
  }

  public async saveModelToDatabase(model: ModelWithMetadata): Promise<number | null> {
    try {
      const existing = getModelByName(model.name);

      if (existing) {
        logger.info(`[ModelImport] Updating existing model: ${model.name}`);

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
        logger.info(`[ModelImport] Creating new model: ${model.name}`);

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
      logger.error(`[ModelImport] Failed to save model ${model.name} to database: ${message}`);
      return null;
    }
  }

  public async importModels(): Promise<{ imported: number; updated: number; errors: number }> {
    this.loadModelsDirectory();

    const discoveredModels = await this.scanModelsDirectory();

    if (discoveredModels.length === 0) {
      logger.info("[ModelImport] No models found to import");
      return { imported: 0, updated: 0, errors: 0 };
    }

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const model of discoveredModels) {
      try {
        const modelWithMetadata = await this.extractMetadata(model);
        const existing = getModelByName(model.name);
        const modelId = await this.saveModelToDatabase(modelWithMetadata);

        if (modelId) {
          if (existing) {
            updated++;
          } else {
            imported++;
          }
        }
      } catch (error) {
        errors++;
        logger.error(`[ModelImport] Failed to process model ${model.name}:`, error);
      }
    }

    logger.info(`[ModelImport] Import complete: ${imported} imported, ${updated} updated, ${errors} errors`);

    return { imported, updated, errors };
  }
}
