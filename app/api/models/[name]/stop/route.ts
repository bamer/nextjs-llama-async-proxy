import { NextResponse, NextRequest } from "next/server";
import { getLogger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation-utils";
import { stopModelRequestSchema } from "@/lib/validators";

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
    const validation = validateRequestBody(stopModelRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const force = validation.data?.force || false;

    logger.info(`[API] Stopping model: ${name}`);

    // llama.cpp does not support dynamic model unloading
    // Models are automatically unloaded when switching to a different one
    // Return a message explaining this behavior
    logger.info(`[API] Note: llama.cpp does not support explicit model unloading`);
    logger.info(`[API] Model will be unloaded automatically when loading a different model`);

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
    logger.error("Error stopping model:", error);
    return NextResponse.json(
      { error: "Internal server error", status: "error" },
      { status: 500 }
    );
  }
}
