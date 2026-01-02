import { getModelById } from "./model-crud.service";
import { getModelSamplingConfig } from "./sampling-config.service";
import { getModelMemoryConfig } from "./memory-config.service";
import { getModelGpuConfig } from "./gpu-config.service";
import { getModelAdvancedConfig } from "./advanced-config.service";
import { getModelLoraConfig } from "./lora-config.service";
import { getModelMultimodalConfig } from "./multimodal-config.service";
import type {
  ModelConfig,
  ModelSamplingConfig,
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "../types/model-config.types";

export function getCompleteModelConfig(modelId: number): {
  model: ModelConfig;
  sampling?: ModelSamplingConfig;
  memory?: ModelMemoryConfig;
  gpu?: ModelGpuConfig;
  advanced?: ModelAdvancedConfig;
  lora?: ModelLoraConfig;
  multimodal?: ModelMultimodalConfig;
} | null {
  const model = getModelById(modelId);
  if (!model) return null;

  const sampling = getModelSamplingConfig(modelId);
  const memory = getModelMemoryConfig(modelId);
  const gpu = getModelGpuConfig(modelId);
  const advanced = getModelAdvancedConfig(modelId);
  const lora = getModelLoraConfig(modelId);
  const multimodal = getModelMultimodalConfig(modelId);

  const result: {
    model: ModelConfig;
    sampling?: ModelSamplingConfig;
    memory?: ModelMemoryConfig;
    gpu?: ModelGpuConfig;
    advanced?: ModelAdvancedConfig;
    lora?: ModelLoraConfig;
    multimodal?: ModelMultimodalConfig;
  } = {
    model,
  };

  if (sampling) result.sampling = sampling;
  if (memory) result.memory = memory;
  if (gpu) result.gpu = gpu;
  if (advanced) result.advanced = advanced;
  if (lora) result.lora = lora;
  if (multimodal) result.multimodal = multimodal;

  return result;
}
