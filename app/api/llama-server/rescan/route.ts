import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("[API] Rescanning models - restarting llama-server...");

    // Get config from request body (client sends its current config from Settings)
    const body = await request.json().catch(() => ({}));
    
    const llamaConfig = {
      host: body.host || process.env.LLAMA_SERVER_HOST || 'localhost',
      port: body.port ? parseInt(String(body.port), 10) : 
              parseInt(process.env.LLAMA_SERVER_PORT || '8134', 10),
      basePath: body.modelsPath || process.env.MODELS_PATH || '/models',
      serverPath: body.llamaServerPath || process.env.LLAMA_SERVER_PATH || '/home/bamer/llama.cpp/build/bin/llama-server',
      ctx_size: body.ctx_size || 8192,
      batch_size: body.batch_size || 512,
      threads: body.threads || -1,
      gpu_layers: body.gpu_layers || -1,
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

    console.log("[API] ✅ Models rescanned successfully with config:", llamaConfig);

    return NextResponse.json(
      { message: "Models rescanned successfully", config: llamaConfig },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Error rescanning models:", error);
    return NextResponse.json(
      { error: "Failed to rescan models" },
      { status: 500 }
    );
  }
}
