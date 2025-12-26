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

    // llama.cpp does not support dynamic model unloading
    // Models are automatically unloaded when switching to a different one
    // Return a message explaining this behavior
    console.log(`[API] Note: llama.cpp does not support explicit model unloading`);
    console.log(`[API] Model will be unloaded automatically when loading a different model`);

    return NextResponse.json(
      {
        model: name,
        status: "note",
        message: `llama.cpp auto-manages model memory. The model will be unloaded when you load a different one.`,
        info: "To completely free memory, restart the llama-server process.",
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
