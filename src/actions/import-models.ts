"use server";

import { LlamaServerIntegration } from "@/lib/llama-service";
import { getModels, saveModel } from "@/lib/database";
import type { ModelConfig } from "@/types";

/**
 * Import models from llama-server into the database
 * This creates database records for all models currently in llama-server
 */
export async function importModelsFromLlamaServer() {
  try {
    console.log("[ImportModels] Starting import from llama-server...");

    // Create llama-server integration instance
    const llamaIntegration = new LlamaServerIntegration(
      process.env.LLAMA_SERVER_PATH || "/home/bamer/llama.cpp/build/bin/llama-server",
      {
        host: process.env.LLAMA_SERVER_HOST || "localhost",
        port: parseInt(process.env.LLAMA_SERVER_PORT || "8134"),
      },
      process.env.LLAMA_SERVER_BASE_PATH || "/media/bamer/crucial MX300/llm/llama/models"
    );

    // Get all models from llama-server
    const llamaModels = await llamaIntegration.getModels();
    console.log(`[ImportModels] Found ${llamaModels.length} models in llama-server`);

    // Get existing models from database
    const existingModels = getModels();
    console.log(`[ImportModels] Found ${existingModels.length} models in database`);

    let importedCount = 0;
    let skippedCount = 0;

    // Import each model if it doesn't already exist
    for (const llamaModel of llamaModels) {
      // Check if model already exists in database (by name)
      const existingModel = existingModels.find((m) => m.name === llamaModel.name);

      if (existingModel) {
        console.log(`[ImportModels] Skipping existing model: ${llamaModel.name}`);
        skippedCount++;
        continue;
      }

      // Create model record for database
      const modelRecord: ModelConfig = {
        name: llamaModel.name,
        type: "llama", // Default to llama type
        parameters: {
          // Use llama-server parameters
          ctx_size: llamaModel.parameters?.ctx_size || 2048,
          batch_size: llamaModel.parameters?.batch_size || 512,
          threads: llamaModel.parameters?.threads || 4,
          model_path: llamaModel.parameters?.model_path || llamaModel.name,
          model_url: llamaModel.parameters?.model_url || "",
        },
        status: "idle", // Start with idle status
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to database
      const dbModel = saveModel(modelRecord);
      console.log(`[ImportModels] Imported model: ${llamaModel.name} (DB ID: ${dbModel.id})`);
      importedCount++;
    }

    return {
      success: true,
      data: {
        totalFound: llamaModels.length,
        imported: importedCount,
        skipped: skippedCount,
      },
      message: `Successfully imported ${importedCount} models from llama-server (${skippedCount} already existed)`,
    };
  } catch (error) {
    console.error("[ImportModels] Error importing models:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
