import { NextResponse } from "next/server";
import { getModels } from "@/lib/database";
import { loadConfig } from "@/lib/server-config";

export async function GET(): Promise<NextResponse> {
  try {
    const dbModels = getModels();
    const config = loadConfig();

    return NextResponse.json({
      database_model_count: dbModels.length,
      models_directory: config.basePath,
      status: dbModels.length === 0 ? 'needs_import' : 'ok',
      timestamp: new Date().toISOString(),
      models: dbModels.map(m => ({
        id: m.id,
        name: m.name,
        type: m.type,
        status: m.status,
      })),
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: message,
      status: 'error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
