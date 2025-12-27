import { NextResponse, NextRequest } from "next/server";
import { loadConfig, saveConfig, loadAppConfig, saveAppConfig } from "@/lib/server-config";
import { getLogger } from "@/lib/logger";
import { validateRequestBody } from "@/lib/validation-utils";
import { configUpdateRequestSchema } from "@/lib/validators";

const logger = getLogger();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validation = validateRequestBody(configUpdateRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const { appConfig, serverConfig } = validation.data || {};
    
    if (serverConfig && Object.keys(serverConfig).length > 0) {
      saveConfig(serverConfig as any);
    }

    if (appConfig && Object.keys(appConfig).length > 0) {
      saveAppConfig(appConfig as any);
    }

    const response: any = {
      message: "Configuration saved successfully",
    };

    if (serverConfig) {
      response.serverConfig = loadConfig();
    }

    if (appConfig) {
      response.appConfig = loadAppConfig();
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[API] Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save config", details: message },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({
      serverConfig: loadConfig(),
      appConfig: loadAppConfig(),
    });
  } catch (error) {
    logger.error("[API] Error getting config:", error);
    return NextResponse.json(
      { error: "Failed to get config" },
      { status: 500 }
    );
  }
}
