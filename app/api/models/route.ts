import { NextResponse } from "next/server";
import { LlamaService } from "@/server/services/LlamaService";

let llamaService: LlamaService | null = null;

// Get models list
export async function GET(): Promise<NextResponse> {
  try {
    // Get the service instance from global scope
    const globalAny = global as any;
    llamaService = globalAny.llamaService;

    if (!llamaService) {
      return NextResponse.json(
        { error: "Llama service not initialized", models: [] },
        { status: 503 }
      );
    }

    const state = llamaService.getState();
    const models = state.models.map((model: any) => ({
      id: model.id || model.name,
      name: model.name,
      type: model.type || "unknown",
      status: "available",
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
