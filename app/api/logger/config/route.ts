import { NextResponse, NextRequest } from "next/server";
import { getLogger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation-utils";
import { loggerConfigRequestSchema } from "@/lib/validators";

const logger = getLogger();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validation = validateRequestBody(loggerConfigRequestSchema, body);
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
    logger.info("[Logger API] Logger config received (not applied server-side):", validatedData);
    return NextResponse.json({
      message: "Logger config received (client-side only)",
      note: "Server-side logging is configured in server.js",
      data: validatedData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[Logger API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process logger config", details: message },
      { status: 500 }
    );
  }
}
