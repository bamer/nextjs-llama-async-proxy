import { NextRequest, NextResponse } from "next/server";
import { ModelImportService } from "@/server/services/model-import-service";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

const modelImportService = new ModelImportService();

/**
 * GET /api/models/import
 * Get models directory and discovery status
 */
export async function GET(): Promise<NextResponse> {
  try {
    const modelsDir = modelImportService.getModelsDirectory();

    return NextResponse.json(
      {
        success: true,
        data: {
          models_dir: modelsDir,
        },
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[API] Error getting import info:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "GET_IMPORT_ERROR", message },
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/models/import
 * Scan models directory and import/update models with GGUF metadata
 */
export async function POST(): Promise<NextResponse> {
  try {
    logger.info("[API] Starting model import from directory");

    const result = await modelImportService.importModels();

    logger.info("[API] Model import complete:", result);

    return NextResponse.json(
      {
        success: true,
        data: {
          message: `Import complete: ${result.imported} new, ${result.updated} updated`,
          imported: result.imported,
          updated: result.updated,
          errors: result.errors,
        },
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[API] Error importing models:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "IMPORT_ERROR", message },
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
