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

    // Get the Llama service from global scope
    const globalAny = global as any;
    const llamaService = globalAny.llamaService;

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

      // Send request to llama-server to load the model
      const response = await fetch(
        `http://${llamaServerHost}:${llamaServerPort}/api/models`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: name,
            ...body,
          }),
        }
      ).catch((error) => {
        console.error(
          `[API] Failed to connect to llama-server: ${error.message}`
        );
        return null;
      });

      if (!response) {
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error(
          `[API] llama-server returned error: ${response.status}`,
          data
        );
        return NextResponse.json(
          {
            error: data.error || `Failed to load model (HTTP ${response.status})`,
            model: name,
            status: "error",
            detail: data,
          },
          { status: response.status }
        );
      }

      console.log(`[API] Model ${name} loaded successfully`);
      return NextResponse.json(
        {
          model: name,
          status: "loaded",
          message: `Model ${name} loaded successfully`,
          data,
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
