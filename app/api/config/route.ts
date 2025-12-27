import { NextResponse, NextRequest } from "next/server";
import { loadConfig, saveConfig, loadAppConfig, saveAppConfig } from "@/lib/server-config";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const config = await request.json();

    const { appConfig, serverConfig } = config;

    if (serverConfig) {
      saveConfig(serverConfig);
    }

    if (appConfig) {
      saveAppConfig(appConfig);
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
    logger.error("[API] Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save config" },
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
