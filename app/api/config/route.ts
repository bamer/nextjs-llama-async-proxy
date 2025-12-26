import { NextResponse, NextRequest } from "next/server";
import { loadConfig, saveConfig } from "@/lib/server-config";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const config = await request.json();
    saveConfig(config);

    return NextResponse.json({
      message: "Configuration saved successfully",
      config,
    });
  } catch (error) {
    console.error("[API] Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const config = loadConfig();

    return NextResponse.json(config);
  } catch (error) {
    console.error("[API] Error getting config:", error);
    return NextResponse.json(
      { error: "Failed to get config" },
      { status: 500 }
    );
  }
}
