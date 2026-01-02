"use client";

import type { ConfigType, FieldDefinition } from "../components/ui/ModelConfigDialog/types";
import { inferenceFields } from "./fields/model-inference-fields";
import { basicFields } from "./fields/model-basic-fields";
import { advancedFields } from "./fields/model-advanced-fields";
import { quantizationFields } from "./fields/model-quantization-fields";

// Re-export category field collections for direct access
export { inferenceFields } from "./fields/model-inference-fields";
export { basicFields } from "./fields/model-basic-fields";
export { advancedFields } from "./fields/model-advanced-fields";
export { quantizationFields } from "./fields/model-quantization-fields";

// Field definitions for each config type
// Maps original config types to their corresponding field categories
export const configFields: Record<ConfigType, FieldDefinition[]> = {
  sampling: inferenceFields,
  memory: basicFields.slice(0, 7),
  gpu: basicFields.slice(7),
  advanced: advancedFields.slice(0, 22),
  lora: advancedFields.slice(22, 43),
  multimodal: advancedFields.slice(43),
};