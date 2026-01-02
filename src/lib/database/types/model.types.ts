// Refactored model.types.ts - now a thin wrapper re-exporting from sub-modules

import {
  MODEL_TABLES_CORE,
} from "./model-core.types";
import {
  MODEL_TABLES_STATS,
} from "./model-stats.types";
import {
  MODEL_TABLES_SAMPLING,
} from "./model-sampling.types";
import {
  MODEL_TABLES_MEMORY,
} from "./model-memory.types";
import {
  MODEL_TABLES_GPU,
} from "./model-gpu.types";
import {
  MODEL_TABLES_ADVANCED,
} from "./model-advanced.types";
import {
  MODEL_TABLES_LORA,
} from "./model-lora.types";
import {
  MODEL_TABLES_MULTIMODAL,
} from "./model-multimodal.types";

export * from "./model-core.types";
export * from "./model-stats.types";
export * from "./model-sampling.types";
export * from "./model-memory.types";
export * from "./model-gpu.types";
export * from "./model-advanced.types";
export * from "./model-lora.types";
export * from "./model-multimodal.types";

// Re-export MODEL_TABLES constant for backward compatibility
export const MODEL_TABLES = {
  ...MODEL_TABLES_CORE,
  ...MODEL_TABLES_STATS,
  ...MODEL_TABLES_SAMPLING,
  ...MODEL_TABLES_MEMORY,
  ...MODEL_TABLES_GPU,
  ...MODEL_TABLES_ADVANCED,
  ...MODEL_TABLES_LORA,
  ...MODEL_TABLES_MULTIMODAL,
} as const;
