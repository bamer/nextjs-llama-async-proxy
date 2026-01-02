import gguf from "gguf";
import { getLogger } from "@/lib/logger";
import type { DiscoveredModel } from "./model-downloader";

const logger = getLogger();

export interface ModelWithMetadata extends DiscoveredModel {
  metadata: any;
  architecture?: string;
  parameter_count: number;
  quantization: string;
  ctx_size: number;
}

export class ModelValidator {
  public parseMetadataFromFilename(model: DiscoveredModel): ModelWithMetadata {
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
      const fs = await import("fs");
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
}
