import { NextRequest, NextResponse } from "next/server";

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

    // Get request body if provided
    const body = await request.json().catch(() => ({}));

    console.log(`[API] Loading model: ${name}`, body);

    // Get Llama service from ServiceRegistry
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
      console.error("[API] LlamaService not available");
      return NextResponse.json(
        {
          error: "Llama service not initialized",
          model: name,
          status: "error",
        },
        { status: 503 }
      );
    }

    try {
      // Get current service state
      const state = llamaService.getState();
      console.log(`[API] Current llama-server status: ${state.status}`);

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

      // Try to load the model through the llama-server HTTP API
      const llamaServerHost = process.env.LLAMA_SERVER_HOST || "localhost";
      const llamaServerPort = process.env.LLAMA_SERVER_PORT || "8134";

      console.log(
        `[API] Forwarding model load to llama-server at ${llamaServerHost}:${llamaServerPort}`
      );

      // Find the model in the discovered models to get its full path
      const models = state.models || [];
      const modelData = models.find(
        (m: { id?: string; name?: string; available?: boolean }) =>
          m.id === name || m.name === name
      );

      // Use model name/alias (not path) - llama.cpp uses the alias from models-dir
      const modelName = modelData?.name || name;

      // Check if model is available before trying to load it
      if (!modelData?.available) {
        console.warn(`[API] Model ${name} is not available for loading`);
        return NextResponse.json(
          {
            error: "Model is not available for loading",
            model: name,
            status: "unavailable",
            message:
              "This model is discovered from filesystem but not known to llama-server. Ensure llama-server is started with correct --models-dir path or restart the application.",
          },
          { status: 400 }
        );
      }

      console.log(`[API] Loading model: ${modelName}`);

      // llama.cpp auto-loads models on first request
      // Make a minimal completion request to trigger model loading
      const loadResponse = await fetch(
        `http://${llamaServerHost}:${llamaServerPort}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 1,
          }),
        }
      ).catch((error) => {
        console.error(
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
        console.error(
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

      console.log(`[API] Model ${name} loaded successfully`);
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
      console.error(`[API] Error loading model: ${message}`, error);
      return NextResponse.json(
        {
          error: `Failed to load model: ${message}`,
          model: name,
          status: "error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[API] Unexpected error: ${message}`, error);
    return NextResponse.json(
      { error: "Internal server error", status: "error", detail: message },
      { status: 500 }
    );
  }
}
