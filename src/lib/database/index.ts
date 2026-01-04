/**
 * Database module barrel export
 * Centralizes all database functionality
 */

// Types
export type {
  ModelConfig,
  ModelSamplingConfig,
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "@/types/model-config-types";
export type { ModelAdvancedConfig } from "@/types/model-inference-types";
export type { ModelFitParams, ModelServerConfig } from "@/types/model-metadata-types";

// Model CRUD Operations
export {
  saveModel,
  getModels,
  getModelById,
  getModelByName,
  updateModel,
  deleteModel,
  deleteAllModels,
} from "./services/model-crud.service";

// Fit Params Operations
export {
  saveModelFitParams,
  getModelFitParams,
  shouldReanalyzeFitParams,
} from "./services/fit-params.service";

// Server Config Operations
export { saveServerConfig, getServerConfig } from "./services/server-config.service";

// Sampling Config Operations
export {
  saveModelSamplingConfig,
  getModelSamplingConfig,
  updateModelSamplingConfig,
} from "./services/sampling-config.service";

// Memory Config Operations
export {
  saveModelMemoryConfig,
  getModelMemoryConfig,
} from "./services/memory-config.service";

// GPU Config Operations
export {
  saveModelGpuConfig,
  getModelGpuConfig,
} from "./services/gpu-config.service";

// Advanced Config Operations
export {
  saveModelAdvancedConfig,
  getModelAdvancedConfig,
} from "./services/advanced-config.service";

// LoRA Config Operations
export {
  saveModelLoraConfig,
  getModelLoraConfig,
} from "./services/lora-config.service";

// Multimodal Config Operations
export {
  saveModelMultimodalConfig,
  getModelMultimodalConfig,
} from "./services/multimodal-config.service";

// Aggregation Functions
export { getCompleteModelConfig } from "./services/model-aggregator.service";

// Database Client Functions
export * from "./database-client";
