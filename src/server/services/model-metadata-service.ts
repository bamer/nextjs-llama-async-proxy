import fs from "fs";
import gguf from "gguf";
import { getLogger } from "@/lib/logger";
import { DiscoveredModel } from "./model-downloader";
import { ModelWithMetadata } from "./model-validator";

const logger = getLogger();

export class ModelMetadataService {
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
    logger.info(`[ModelMetadata] Extracting GGUF metadata for: ${model.name}`);

    try {
      if (!fs.existsSync(model.path)) {
        throw new Error(`Model file not found: ${model.path}`);
      }

      const result = await gguf(model.path);

      if (!result || !result.metadata) {
        logger.warn(`[ModelMetadata] Failed to parse GGUF file for ${model.name}, using filename-based metadata`);
        return this.parseMetadataFromFilename(model);
      }

      const metadata = result.metadata;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const architecture = (metadata as any).general?.architecture ||
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (metadata as any).gqa?.architecture ||
                        result.metadata?.general?.name || "unknown";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parameterCount = (metadata as any).general?.parameter_count || undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contextLength = (metadata as any).llama?.context_length ||
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (metadata as any).general?.context_length;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quantization = (metadata as any).quantization?.version ? String((metadata as any).quantization.version) : undefined;

      const modelWithMetadata: ModelWithMetadata = {
        ...model,
        metadata,
        architecture,
        parameter_count: parameterCount ? parameterCount : 7,
        quantization: quantization || "4B",
        ctx_size: contextLength || 4096,
      };

      logger.info(`[ModelMetadata] GGUF metadata extracted for ${model.name}:`, {
        architecture,
        parameters: parameterCount,
        quantization,
        contextLength,
      });

      return modelWithMetadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[ModelMetadata] Failed to extract GGUF metadata for ${model.name}: ${message}`);

      return this.parseMetadataFromFilename(model);
    }
  }
}