import { NextResponse, NextRequest } from "next/server";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const config = await request.json();
    logger.info("[Logger API] Logger config received (not applied server-side):", config);
    return NextResponse.json({
      message: "Logger config received (client-side only)",
      note: "Server-side logging is configured in server.js",
    });
  } catch (error) {
    logger.error("[Logger API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process logger config" },
      { status: 500 }
    );
  }
}
