import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { loadAppConfig } from "@/lib/server-config";
import { validateRequestBody } from "@/lib/validation-utils";
import { startModelRequestSchema } from "@/lib/validators";

const logger = getLogger();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
): Promise<NextResponse> {
  try {
    const { name } = await params;

    if (!name) {
      return NextResponse.json(
        { error: "Model name is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Validate request body with Zod
    const validation = validateRequestBody(startModelRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const selectedTemplate = validation.data?.template;

    logger.info(`[API] Loading model: ${name}`, body);

    const globalAny = global as unknown as { registry: any };
    const registry = globalAny.registry as {
      get: (name: string) => {
        getState: () => {
          status: string;
          models?: Array<{ id?: string; name?: string; path?: string; available?: boolean }>;
        };
        config?: { basePath?: string };
      } | null;
    };

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

    const appConfig = loadAppConfig();
    const maxConcurrent = appConfig.maxConcurrentModels || 1;
    logger.info(`[API] Max concurrent models setting: ${maxConcurrent}`);

    const state = llamaService.getState();
    logger.info(`[API] Current llama-server status: ${state.status}`);

    if (state.status !== "ready") {
      return NextResponse.json(
        {
          error: `Llama server is not ready (status: ${state.status})`,
          model: name,
          status: "error",
        },
        { status: 503 }
      );
    }

    const models = state.models || [];
    const runningModels = models.filter((m: any) =>
      m.status === 'running' || m.status === 'loaded'
    );

    logger.info(`[API] Currently running models: ${runningModels.length} (max: ${maxConcurrent})`);

    if (runningModels.length >= maxConcurrent) {
      const runningModelNames = runningModels.map((m: any) => m.name).join(", ");
      logger.warn(`[API] Max concurrent models (${maxConcurrent}) reached. Currently running: ${runningModelNames}`);
      return NextResponse.json(
        {
          error: `Maximum concurrent models (${maxConcurrent}) reached. Currently running: ${runningModelNames}`,
          model: name,
          status: "error",
          runningModels: runningModelNames,
          maxConcurrent,
          hint: maxConcurrent === 1 ? "Stop the currently running model first, or increase Max Concurrent Models in Settings." : "Increase Max Concurrent Models in Settings to run more models simultaneously.",
        },
        { status: 409 }
      );
    }

    const llamaServerHost = process.env.LLAMA_SERVER_HOST || "localhost";
    const llamaServerPort = process.env.LLAMA_SERVER_PORT || "8134";

    logger.info(
      `[API] Forwarding model load to llama-server at ${llamaServerHost}:${llamaServerPort}`
    );

    const modelsList = state.models || [];
    const modelData = modelsList.find(
      (m: { id?: string; name?: string; available?: boolean }) =>
        m.id === name || m.name === name
    );

    const modelName = modelData?.name || name;

    if (!modelData) {
      logger.warn(`[API] Model ${name} was not found in discovered models`);
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

    logger.info(`[API] Loading model: ${modelName} ${selectedTemplate ? `with template: ${selectedTemplate}` : ''}`);

    const requestBody: any = {
      model: modelName,
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 1,
    };

    if (selectedTemplate) {
      requestBody.template = selectedTemplate;
    }

    const loadResponse = await fetch(
      `http://${llamaServerHost}:${llamaServerPort}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    ).catch((error) => {
      logger.error(
        `[API] Failed to connect to llama-server: ${error.message}`
      );
      return null;
    });

    if (!loadResponse) {
      return NextResponse.json(
        {
          error:
            "Failed to connect to llama-server. Make sure it's running on the configured host and port.",
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

    const loadData = await loadResponse.json().catch(() => ({}));

    if (!loadResponse.ok) {
      logger.error(
        `[API] llama-server returned error: ${loadResponse.status}`,
        loadData
      );
      return NextResponse.json(
        {
          error: loadData.error || `Failed to load model (HTTP ${loadResponse.status})`,
          model: name,
          status: "error",
          detail: loadData,
        },
        { status: loadResponse.status }
      );
    }

    logger.info(`[API] Model ${name} loaded successfully`);
    return NextResponse.json(
      {
        model: name,
        status: "loaded",
        message: `Model ${name} loaded successfully`,
        data: loadData,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[API] Error loading model: ${message}`, error);
    return NextResponse.json(
      {
        error: `Failed to load model: ${message}`,
        model: name,
        status: "error",
      },
      { status: 500 }
    );
  }
}