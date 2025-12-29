import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getModels, getModelFitParams, saveModelFitParams } from "@/lib/database";
import { analyzeModel } from "@/server/services/fit-params-service";

/**
 * GET /api/models/:name/analyze
 * Get fit-params analysis for a specific model by name
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
): Promise<NextResponse> {
  try {
    const { name } = await params;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MODEL_NAME_REQUIRED", message: "Model name is required" },
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    // Find model by name
    initDatabase();
    const models = getModels();
    const foundModel = models.find((m) => m.name === name);

    if (!foundModel || !foundModel.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MODEL_NOT_FOUND", message: "Model not found" },
          timestamp: Date.now(),
        },
        { status: 404 }
      );
    }

    const modelId = foundModel.id;

    // Get fit-params data
    const fitParams = getModelFitParams(modelId);

    return NextResponse.json(
      {
        success: true,
        data: {
          model: foundModel,
          fitParams: fitParams || null,
        },
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Error getting fit-params:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "GET_FIT_PARAMS_ERROR", message },
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/models/:name/analyze
 * Run fit-params analysis on a specific model by name
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
): Promise<NextResponse> {
  try {
    const { name } = await params;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MODEL_NAME_REQUIRED", message: "Model name is required" },
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    // Find model by name
    initDatabase();
    const models = getModels();
    const foundModel = models.find((m) => m.name === name);

    if (!foundModel || !foundModel.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "MODEL_NOT_FOUND", message: "Model not found" },
          timestamp: Date.now(),
        },
        { status: 404 }
      );
    }

    const modelId = foundModel.id;

    if (!foundModel.model_path) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NO_MODEL_PATH", message: "Model does not have a file path" },
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    // Run fit-params analysis
    console.log(`[API] Starting fit-params analysis for model: ${name}`);
    const analysisResult = await analyzeModel(foundModel.model_path);

    // Save results to database
    const fitParamsId = saveModelFitParams(modelId, {
      recommended_ctx_size: analysisResult.recommended_ctx_size || 0,
      recommended_gpu_layers: analysisResult.recommended_gpu_layers || 0,
      recommended_tensor_split: analysisResult.recommended_tensor_split || null,
      file_size_bytes: analysisResult.metadata.file_size_bytes || 0,
      quantization_type: analysisResult.metadata.quantization_type || null,
      parameter_count: analysisResult.metadata.parameter_count || 0,
      architecture: analysisResult.metadata.architecture || null,
      context_window: analysisResult.metadata.context_window || 0,
      fit_params_analyzed_at: Date.now(),
      fit_params_success: analysisResult.success ? 1 : 0,
      fit_params_error: analysisResult.error || null,
      fit_params_raw_output: analysisResult.raw_output || null,
      projected_cpu_memory_mb: analysisResult.projected_cpu_memory_mb || 0,
      projected_gpu_memory_mb: analysisResult.projected_gpu_memory_mb || 0,
    });

    // Note: We can't update models table file_size_bytes directly
    // because ModelConfig interface doesn't include that field
    // The fit-params table already stores this information

    console.log(`[API] Fit-params analysis complete for model: ${name}, success: ${analysisResult.success}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          model: foundModel,
          fitParams: {
            id: fitParamsId,
            model_id: modelId,
            recommended_ctx_size: analysisResult.recommended_ctx_size,
            recommended_gpu_layers: analysisResult.recommended_gpu_layers,
            recommended_tensor_split: analysisResult.recommended_tensor_split,
            file_size_bytes: analysisResult.metadata.file_size_bytes,
            quantization_type: analysisResult.metadata.quantization_type,
            parameter_count: analysisResult.metadata.parameter_count,
            architecture: analysisResult.metadata.architecture,
            context_window: analysisResult.metadata.context_window,
            fit_params_analyzed_at: Date.now(),
            fit_params_success: analysisResult.success ? 1 : 0,
            fit_params_error: analysisResult.error,
            fit_params_raw_output: analysisResult.raw_output,
            projected_cpu_memory_mb: analysisResult.projected_cpu_memory_mb,
            projected_gpu_memory_mb: analysisResult.projected_gpu_memory_mb,
          },
        },
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Error running fit-params analysis:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "ANALYSIS_ERROR", message },
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
