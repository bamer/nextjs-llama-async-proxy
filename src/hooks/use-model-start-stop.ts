import { useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useStore } from "@/lib/store";
import {
  parseModelIdToDbId,
  isValidDbId,
} from "./model-operation-utils";
import { showSuccess, showError, showProgress } from "@/utils/toast-helpers";

interface UseModelStartStopOptions {
  setLoading: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseModelStartStopReturn {
  handleStartModel: (modelId: string) => Promise<void>;
  handleStopModel: (modelId: string) => Promise<void>;
}

/**
 * Hook for model start and stop operations
 * Provides functions to start and stop models with state management
 */
export function useModelStartStop(
  options: UseModelStartStopOptions,
): UseModelStartStopReturn {
  const { sendMessage } = useWebSocket();
  const updateStoreModel = useStore((state) => state.updateModel);
  const { setLoading, setError } = options;

  /**
    * Start a model by its ID
    * @param modelId - Model identifier
    */
  const handleStartModel = useCallback(async (modelId: string) => {
    const model = useStore.getState().models.find((m) => m.id === modelId);
    if (!model) {
      setError(`Model ${modelId} not found`);
      showError("Model Not Found", `Model ${modelId} could not be found`);
      return;
    }

    setLoading(modelId);
    setError(null);

    showProgress(`Starting ${model.name}...`);

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
      showSuccess("Model Started", `${model.name} is now running`);

      if (isValidDbId(modelId)) {
        const dbId = parseModelIdToDbId(modelId);
        sendMessage("update_model", { id: dbId, updates: { status: "running" } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      showError("Failed to Start Model", message);
      updateStoreModel(modelId, { status: "idle" });

      if (isValidDbId(modelId)) {
        const dbId = parseModelIdToDbId(modelId);
        sendMessage("update_model", { id: dbId, updates: { status: "stopped" } });
      }
    } finally {
      setLoading(null);
    }
  }, [updateStoreModel, sendMessage, setLoading, setError]);

  /**
    * Stop a model by its ID
    * @param modelId - Model identifier
    */
  const handleStopModel = useCallback(async (modelId: string) => {
    const model = useStore.getState().models.find((m) => m.id === modelId);
    if (!model) {
      setError(`Model ${modelId} not found`);
      showError("Model Not Found", `Model ${modelId} could not be found`);
      return;
    }

    setLoading(modelId);
    setError(null);

    showProgress(`Stopping ${model.name}...`);

    try {
      updateStoreModel(modelId, { status: "loading" });

      if (isValidDbId(modelId)) {
        const dbId = parseModelIdToDbId(modelId);
        sendMessage("update_model", { id: dbId, updates: { status: "loading" } });
      }

      const response = await fetch(
        `/api/models/${encodeURIComponent(model.name)}/stop`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to unload model (HTTP ${response.status})`);
      }

      updateStoreModel(modelId, { status: "idle" });
      showSuccess("Model Stopped", `${model.name} has been stopped`);

      if (isValidDbId(modelId)) {
        const dbId = parseModelIdToDbId(modelId);
        sendMessage("update_model", { id: dbId, updates: { status: "stopped" } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      showError("Failed to Stop Model", message);
      updateStoreModel(modelId, { status: "running" });

      if (isValidDbId(modelId)) {
        const dbId = parseModelIdToDbId(modelId);
        sendMessage("update_model", { id: dbId, updates: { status: "running" } });
      }
    } finally {
      setLoading(null);
    }
  }, [updateStoreModel, sendMessage, setLoading, setError]);

  return {
    handleStartModel,
    handleStopModel,
  };
}
