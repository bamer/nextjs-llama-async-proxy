import { NextResponse } from "next/server";
import { LlamaService } from "@/server/services/LlamaService";

const llamaService: LlamaService | null | undefined = null;

// Get models list
export async function GET(): Promise<NextResponse> {
  try {
    // Get service instance from registry
    const globalAny = global as unknown as { registry: any };
    const registry = globalAny.registry as {
      get: (name: string) => LlamaService | null;
    };

    const llamaService = registry?.get("llamaService");

    if (!llamaService) {
      return NextResponse.json(
        { error: "Llama service not initialized", models: [] },
        { status: 503 }
      );
    }

    const state = llamaService.getState();
    interface ModelData {
      id?: string;
      name: string;
      type?: string;
      size?: number;
      modified_at?: number;
    }
    const models = state.models.map((model: ModelData) => ({
      id: model.id || model.name,
      name: model.name,
      type: model.type || "unknown",
      available: true,
      size: model.size,
      createdAt: new Date(
        model.modified_at ? model.modified_at * 1000 : Date.now()
      ).toISOString(),
      updatedAt: new Date(
        model.modified_at ? model.modified_at * 1000 : Date.now()
      ).toISOString(),
    }));

    return NextResponse.json({ models }, { status: 200 });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models", models: [] },
      { status: 500 }
    );
  }
}
