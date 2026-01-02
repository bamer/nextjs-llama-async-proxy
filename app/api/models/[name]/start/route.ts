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
  try {
    const { name } = await params;

    const body = await request.json().catch(() => ({}));

    // Validate request
    const validation = validateStartModelRequest(name, body);
    if (!validation.success && validation.errorResponse) {
      return validation.errorResponse;
    }

    const selectedTemplate = validation.selectedTemplate;

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
          model: name,
          status: "error",
        },
        { status: 503 }
      );
    }

    // Check loading constraints
    const appConfig = loadAppConfig();
    const maxConcurrent = appConfig.maxConcurrentModels || 1;
    logger.info(`[API] Max concurrent models setting: ${maxConcurrent}`);

    const constraints = checkModelLoadingConstraints(llamaService, name, maxConcurrent);
    if (!constraints.canLoad && constraints.errorResponse) {
      return NextResponse.json(constraints.errorResponse, { status: 409 });
    }

    // Find model data
    const modelData = findModelData(llamaService, name);
    if (!modelData) {
      return NextResponse.json(
        {
          error: "Model not found",
          model: name,
          status: "not_found",
          message: "This model is not in the discovered models list. Ensure the model file exists in the models directory.",
        },
        { status: 404 }
      );
    }

    const modelName = modelData.name || name;

    logger.info(`[API] Loading model: ${modelName} ${selectedTemplate ? `with template: ${selectedTemplate}` : ''}`);

    // Load model
    const loadResult = await loadModelViaServer(modelName, selectedTemplate);

    if (!loadResult) {
      const llamaServerHost = process.env.LLAMA_SERVER_HOST || "localhost";
      const llamaServerPort = process.env.LLAMA_SERVER_PORT || "8134";
      return NextResponse.json(
        {
          error: "Failed to connect to llama-server. Make sure it's running on the configured host and port.",
          model: name,
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
          model: name,
          status: "error",
          detail: loadResult.data,
        },
        { status: loadResult.status }
      );
    }

    return createLoadSuccessResponse(name, loadResult.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[API] Error loading model: ${message}`, error);
    return createLoadErrorResponse(name, `Failed to load model: ${message}`, error);
  }
}
