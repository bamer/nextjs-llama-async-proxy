import { NextResponse, NextRequest } from "next/server";
import { getLogger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation-utils";
import { rescanRequestSchema } from "@/lib/validators";

const logger = getLogger();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info("[API] Rescanning models - restarting llama-server...");

    // Get config from request body (client sends its current config from Settings)
    const body = await request.json().catch(() => ({}));

    // Validate request body with Zod
    const validation = validateRequestBody(rescanRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data || {};

    const llamaConfig = {
      host: validatedData.host || process.env.LLAMA_SERVER_HOST || 'localhost',
      port: validatedData.port ? parseInt(String(validatedData.port), 10) :
              parseInt(process.env.LLAMA_SERVER_PORT || '8134', 10),
      basePath: validatedData.modelsPath || process.env.MODELS_PATH || '/models',
      serverPath: validatedData.llamaServerPath || process.env.LLAMA_SERVER_PATH || '/home/bamer/llama.cpp/build/bin/llama-server',
      ctx_size: validatedData.ctx_size || 8192,
      batch_size: validatedData.batch_size || 512,
      threads: validatedData.threads || -1,
      gpu_layers: validatedData.gpu_layers || -1,
    };

    // Get the Llama integration from global scope
    const globalAny = global as unknown as { llamaIntegration: unknown };
    const llamaIntegration = globalAny.llamaIntegration as {
      stop: () => Promise<void>;
      initialize: (config: unknown) => Promise<void>;
    };

    if (!llamaIntegration) {
      return NextResponse.json(
        { error: "Llama service not initialized" },
        { status: 503 }
      );
    }

    // Stop and reinitialize with new config
    await llamaIntegration.stop();
    await llamaIntegration.initialize(llamaConfig);

    logger.info("[API] ✅ Models rescanned successfully with config:", llamaConfig);

    return NextResponse.json(
      { message: "Models rescanned successfully", config: llamaConfig },
      { status: 200 }
    );
  } catch (error) {
    logger.error("[API] Error rescanning models:", error);
    return NextResponse.json(
      { error: "Failed to rescan models" },
      { status: 500 }
    );
  }
}
