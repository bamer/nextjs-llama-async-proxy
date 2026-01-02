// Refactored model-config.validator.ts - now a thin wrapper re-exporting from sub-modules

export * from "./model-state.validator";
export * from "./model-template.validator";

// Re-export utility functions from sub-modules
import { llamaModelSchema } from "./model-state.validator";
import type { LlamaModel } from "./model-state.validator";

export function parseLlamaModel(data: unknown): LlamaModel {
  return llamaModelSchema.parse(data);
}
