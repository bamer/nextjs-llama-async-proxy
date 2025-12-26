import { NextResponse } from "next/server";

export async function POST(
  _request: unknown,
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

    console.log(`[API] Stopping model: ${name}`);

    // Forward to llama-server to unload the model
    const llamaServerHost = process.env.LLAMA_SERVER_HOST || "localhost";
    const llamaServerPort = process.env.LLAMA_SERVER_PORT || "8134";

    // Send request to llama-server to unload the model
    const response = await fetch(
      `http://${llamaServerHost}:${llamaServerPort}/api/models/${name}`,
      {
        method: "DELETE",
      }
    ).catch((error) => {
      console.error(`Failed to connect to llama-server: ${error.message}`);
      return null;
    });

    if (!response) {
      return NextResponse.json(
        {
          error: "Failed to connect to llama-server. Make sure it's running.",
          model: name,
          status: "error",
        },
        { status: 503 }
      );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error || "Failed to unload model",
          model: name,
          status: "error",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        model: name,
        status: "unloaded",
        message: `Model ${name} unloaded successfully`,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error stopping model:", error);
    return NextResponse.json(
      { error: "Internal server error", status: "error" },
      { status: 500 }
    );
  }
}
