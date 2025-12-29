"use server";

import { LlamaServerIntegration } from "@/server/services/LlamaServerIntegration";
import { getModels, saveModel } from "@/lib/database";
import type { ModelConfig } from "@/types";

/**
 * Import models from llama-server into the database
 * This creates database records for all models currently in llama-server
 *
 * @deprecated Use WebSocket rescanModels event instead
 */
export async function importModelsFromLlamaServer() {
  // This action is deprecated because LlamaServerIntegration requires io Server to be passed
  // which is not available in server actions. Use the WebSocket rescanModels event instead.
  throw new Error("importModelsFromLlamaServer() is deprecated - use WebSocket rescanModels event instead");
}
