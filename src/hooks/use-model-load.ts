import { useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useStore } from "@/lib/store";
import {
  parseModelIdToDbId,
  isValidDbId,
} from "./model-operation-utils";

interface UseModelLoadOptions {
  setLoading: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseModelLoadReturn {
  handleLoadModel: (modelId: string) => Promise<void>;
}

/**
 * Hook for model load operation
 * Provides function to load/start a model with state management
 * Note: This is a specialized version focused on loading operation
 */
export function useModelLoad(
  options: UseModelLoadOptions,
): UseModelLoadReturn {
  const { sendMessage } = useWebSocket();
  const updateStoreModel = useStore((state) => state.updateModel);
  const { setLoading, setError } = options;

  /**
   * Load/start a model by its ID
   * @param modelId - Model identifier
   */
  const handleLoadModel = useCallback(async (modelId: string) => {
    const model = useStore.getState().models.find((m) => m.id === modelId);
    if (!model) {
      setError(`Model ${modelId} not found`);
      return;
    }

    setLoading(modelId);
    setError(null);

    try {
      updateStoreModel(modelId, { status: "loading" });

      if (isValidDbId(modelId)) {
        const dbId = parseModelIdToDbId(modelId);
        sendMessage("update_model", { id: dbId, updates: { status: "loading" } });
      }

      const response = await fetch(
        `/api/models/${encodeURIComponent(model.name)}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to load model (HTTP ${response.status})`);
      }

      updateStoreModel(modelId, { status: "running" });

      if (isValidDbId(modelId)) {
        const dbId = parseModelIdToDbId(modelId);
        sendMessage("update_model", { id: dbId, updates: { status: "running" } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      updateStoreModel(modelId, { status: "idle" });

      if (isValidDbId(modelId)) {
        const dbId = parseModelIdToDbId(modelId);
        sendMessage("update_model", { id: dbId, updates: { status: "stopped" } });
      }
    } finally {
      setLoading(null);
    }
  }, [updateStoreModel, sendMessage, setLoading, setError]);

  return {
    handleLoadModel,
  };
}
