/**
 * Model-related database schemas
 */

import { MODEL_CONFIG_SCHEMAS } from "./config-schema";
import { GGUF_SCHEMAS } from "./gguf-schema";
import { LLAMA_SCHEMAS } from "./llama-schema";

export const MODEL_SCHEMAS = {
  ...MODEL_CONFIG_SCHEMAS,
  ...GGUF_SCHEMAS,
  ...LLAMA_SCHEMAS,
} as const;
