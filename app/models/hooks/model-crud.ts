import { useStore } from "@/lib/store";
import { storeToDatabaseModel } from "../utils/model-utils";

export async function saveModel(
  config: Partial<import("@/types").ModelConfig>,
  updateStoreModel: (id: string, updates: Partial<import("@/types").ModelConfig>) => void,
  sendMessage: (type: string, data: Record<string, unknown>) => void,
): Promise<void> {
  const allModels = useStore.getState().models;
  const existing = allModels.find((m) => m.name === config.name);

  if (existing) {
    const updatedModel = { ...existing, ...config };
    updateStoreModel(existing.id, config);

    const dbId = parseInt(existing.id, 10);
    if (!isNaN(dbId)) {
      sendMessage("update_model", {
        id: dbId,
        updates: storeToDatabaseModel(updatedModel),
      });
      console.log("[useModels] Updating model in database:", existing.name);
    }
  } else if (config.name) {
    const newModel: import("@/types").ModelConfig = {
      id: Date.now().toString(),
      name: config.name,
      type: config.type || "llama",
      parameters: config.parameters || {},
      status: "idle",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sendMessage("save_model", {
      name: newModel.name,
      type:
        newModel.type === "mistral"
          ? "mistrall"
          : newModel.type === "other"
            ? "custom"
            : newModel.type,
      status: "stopped",
      ctx_size: (newModel.parameters?.ctx_size as number) ?? 0,
      batch_size: (newModel.parameters?.batch_size as number) ?? 2048,
      threads: (newModel.parameters?.threads as number) ?? -1,
      model_path: (newModel.parameters?.model_path as string) ?? undefined,
      model_url: (newModel.parameters?.model_url as string) ?? undefined,
    });
    console.log("[useModels] Creating new model:", newModel.name);

    useStore.getState().addModel(newModel);
  }
}

export function deleteModel(
  modelId: string,
  sendMessage: (type: string, data: Record<string, unknown>) => void,
): void {
  const model = useStore.getState().models.find((m) => m.id === modelId);
  if (!model) {
    console.error("[useModels] Model not found:", modelId);
    return;
  }

  useStore.getState().removeModel(modelId);

  const dbId = parseInt(modelId, 10);
  if (!isNaN(dbId)) {
    sendMessage("delete_model", { id: dbId });
    console.log("[useModels] Deleting model from database:", modelId);
  }
}

export function refreshModels(sendMessage: (type: string, data: Record<string, unknown>) => void): void {
  sendMessage("rescanModels", {});
}
