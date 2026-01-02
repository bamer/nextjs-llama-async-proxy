import { useStore } from "@/lib/store";

export async function startModel(
  modelId: string,
  updateStoreModel: (id: string, updates: Partial<import("@/types").ModelConfig>) => void,
  sendMessage: (type: string, data: Record<string, unknown>) => void,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<string | null>>,
): Promise<void> {
  const model = useStore.getState().models.find((m) => m.id === modelId);
  if (!model) {
    setError(`Model ${modelId} not found`);
    return;
  }

  setLoading(modelId);
  setError(null);

  try {
    updateStoreModel(modelId, { status: "loading" });

    const dbId = parseInt(modelId, 10);
    if (!isNaN(dbId)) {
      sendMessage("update_model", { id: dbId, updates: { status: "loading" } });
    }

    const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Failed to load model (HTTP ${response.status})`);
    }

    updateStoreModel(modelId, { status: "running" });

    if (!isNaN(dbId)) {
      sendMessage("update_model", { id: dbId, updates: { status: "running" } });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setError(message);
    updateStoreModel(modelId, { status: "idle" });

    const dbId = parseInt(modelId, 10);
    if (!isNaN(dbId)) {
      sendMessage("update_model", { id: dbId, updates: { status: "stopped" } });
    }
  } finally {
    setLoading(null);
  }
}

export async function stopModel(
  modelId: string,
  updateStoreModel: (id: string, updates: Partial<import("@/types").ModelConfig>) => void,
  sendMessage: (type: string, data: Record<string, unknown>) => void,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<string | null>>,
): Promise<void> {
  const model = useStore.getState().models.find((m) => m.id === modelId);
  if (!model) {
    setError(`Model ${modelId} not found`);
    return;
  }

  setLoading(modelId);
  setError(null);

  try {
    updateStoreModel(modelId, { status: "loading" });

    const dbId = parseInt(modelId, 10);
    if (!isNaN(dbId)) {
      sendMessage("update_model", { id: dbId, updates: { status: "loading" } });
    }

    const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Failed to unload model (HTTP ${response.status})`);
    }

    updateStoreModel(modelId, { status: "idle" });

    if (!isNaN(dbId)) {
      sendMessage("update_model", { id: dbId, updates: { status: "stopped" } });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setError(message);
    updateStoreModel(modelId, { status: "running" });

    const dbId = parseInt(modelId, 10);
    if (!isNaN(dbId)) {
      sendMessage("update_model", { id: dbId, updates: { status: "running" } });
    }
  } finally {
    setLoading(null);
  }
}
