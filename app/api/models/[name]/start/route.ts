import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { loadAppConfig } from "@/lib/server-config";
import { validateStartModelRequest } from "./validate-request";
import { checkModelLoadingConstraints, findModelData } from "./model-loading";
import { loadModelViaServer, createLoadSuccessResponse, createLoadErrorResponse } from "./response-handlers";

const logger = getLogger();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
): Promise<NextResponse> {
  let modelName = 'unknown';
  try {
    const { name } = await params;
    modelName = name;

    const body = await request.json().catch(() => ({}));

    // Validate request
    const validation = validateStartModelRequest(name, body);
    if (!validation.success && validation.errorResponse) {
      return validation.errorResponse;
    }

    const template = validation.success ? validation.selectedTemplate : undefined;

    logger.info(`[API] Loading model: ${name}${template ? ` with template: ${template}` : ''}`);

    logger.info(`[API] Loading model: ${name}`, body);

    // Get llama service from registry
    interface GlobalRegistry {
      get: (name: string) => {
        getState: () => {
          status: string;
          models?: Array<{ id?: string; name?: string; path?: string; available?: boolean }>;
        };
        config?: { basePath?: string };
      } | null;
    }

    interface GlobalWithRegistry {
      registry?: GlobalRegistry;
    }

    const globalWithRegistry = global as unknown as GlobalWithRegistry;
    const registry = globalWithRegistry.registry;

    const llamaService = registry?.get("llamaService");

    if (!llamaService) {
      logger.error("[API] LlamaService not available");
      return NextResponse.json(
        {
          error: "Llama service not initialized",
          model: modelName,
          status: "error",
        },
        { status: 503 }
      );
    }

    // Check loading constraints
    const appConfig = loadAppConfig();
    const maxConcurrent = appConfig.maxConcurrentModels || 1;
    logger.info(`[API] Max concurrent models setting: ${maxConcurrent}`);

    const constraints = checkModelLoadingConstraints(llamaService, modelName, maxConcurrent);
    if (!constraints.canLoad && constraints.errorResponse) {
      return NextResponse.json(constraints.errorResponse, { status: 409 });
    }

    // Find model data
    const modelData = findModelData(llamaService, modelName);
    if (!modelData) {
      return NextResponse.json(
        {
          error: "Model not found",
          model: modelName,
          status: "not_found",
          message: "This model is not in the discovered models list. Ensure the model file exists in the models directory.",
        },
        { status: 404 }
      );
    }

    const resolvedModelName = modelData.name || modelName;

    logger.info(`[API] Loading model: ${resolvedModelName} ${template ? `with template: ${template}` : ''}`);

    // Load model
    const loadResult = await loadModelViaServer(resolvedModelName, template);

    if (!loadResult) {
      const llamaServerHost = process.env.LLAMA_SERVER_HOST || "localhost";
      const llamaServerPort = process.env.LLAMA_SERVER_PORT || "8134";
      return NextResponse.json(
        {
          error: "Failed to connect to llama-server. Make sure it's running on the configured host and port.",
          model: modelName,
          status: "error",
          debug: {
            host: llamaServerHost,
            port: llamaServerPort,
          },
        },
        { status: 503 }
      );
    }

    if (!loadResult.ok) {
      logger.error(
        `[API] llama-server returned error: ${loadResult.status}`,
        loadResult.data
      );
      return NextResponse.json(
        {
          error: loadResult.error || `Failed to load model (HTTP ${loadResult.status})`,
          model: modelName,
          status: "error",
          detail: loadResult.data,
        },
        { status: loadResult.status }
      );
    }

    return createLoadSuccessResponse(modelName, loadResult.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[API] Error loading model: ${message}`, error);
    const errorDetail = error instanceof Error ? error : undefined;
    return createLoadErrorResponse(modelName, `Failed to load model: ${message}`, errorDetail);
  }
}
