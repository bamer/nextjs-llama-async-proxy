import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";
import { ModelData } from "../types";
import { storeToDatabaseModel, storeToModelData } from "../utils/model-utils";

interface UseModelsOptions {
  onModelsLoaded?: (models: unknown[]) => void;
  onConfigLoaded?: (data: unknown) => void;
  onConfigSaved?: (data: unknown) => void;
  onModelDeleted?: (data: unknown) => void;
}

interface UseModelsReturn {
  models: import("@/types").ModelConfig[];
  loading: string | null;
  error: string | null;
  setLoading: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  handleStartModel: (modelId: string) => Promise<void>;
  handleStopModel: (modelId: string) => Promise<void>;
  handleRefresh: () => void;
  handleSaveModel: (config: Partial<import("@/types").ModelConfig>) => Promise<void>;
  handleDeleteModel: (modelId: string) => Promise<void>;
  requestModels: () => void;
  sendMessage: (
    type: string,
    data: Record<string, unknown>,
  ) => void;
}

export function useModels(options?: UseModelsOptions): UseModelsReturn {
  const models = useStore((state) => state.models);
  const { requestModels, sendMessage, on, off } = useWebSocket();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setModels = useStore((state) => state.setModels);
  const updateStoreModel = useStore((state) => state.updateModel);

  // Load models on mount
  useEffect(() => {
    sendMessage("load_models", {});
    console.log("[useModels] Loading models from database");
  }, [sendMessage]);

  // Handle WebSocket responses
  useEffect(() => {
    const handleModelsLoaded = (data: unknown) => {
      const typedData = data as { success: boolean; data?: unknown[] };
      if (typedData.success && typedData.data) {
        console.log("[useModels] Models loaded successfully:", typedData.data);
        setModels(typedData.data as import("@/types").ModelConfig[]);
        options?.onModelsLoaded?.(typedData.data);
      } else {
        console.error("[useModels] Failed to load models:", data);
      }
    };

    const handleConfigLoaded = (data: unknown) => {
      const typedData = data as {
        success: boolean;
        error?: unknown;
        data?: { id: number; type: string; config: Record<string, unknown> };
      };
      if (typedData.success && typedData.data) {
        console.log("[useModels] Config loaded successfully:", typedData.data);
        options?.onConfigLoaded?.(typedData.data);
      } else {
        console.error("[useModels] Failed to load config:", typedData.error);
      }
    };

    const handleConfigSaved = (data: unknown) => {
      const typedData = data as {
        success: boolean;
        error?: unknown;
        data?: unknown;
      };
      if (typedData.success) {
        console.log("[useModels] Config saved successfully:", typedData.data);
        options?.onConfigSaved?.(typedData.data);
      } else {
        console.error("[useModels] Failed to save config:", typedData.error);
      }
    };

    const handleModelDeleted = (data: unknown) => {
      const typedData = data as {
        success: boolean;
        error?: unknown;
        data?: { id: number };
      };
      if (typedData.success && typedData.data) {
        console.log("[useModels] Model deleted successfully:", typedData.data);
        useStore.getState().removeModel(typedData.data.id.toString());
        options?.onModelDeleted?.(typedData.data);
      } else {
        console.error("[useModels] Failed to delete model:", typedData.error);
      }
    };

    on("models_loaded", handleModelsLoaded);
    on("config_loaded", handleConfigLoaded);
    on("config_saved", handleConfigSaved);
    on("model_deleted", handleModelDeleted);

    return () => {
      off("models_loaded", handleModelsLoaded);
      off("config_loaded", handleConfigLoaded);
      off("config_saved", handleConfigSaved);
      off("model_deleted", handleModelDeleted);
    };
  }, [on, off, options]);

  // Start model
  const handleStartModel = useCallback(async (modelId: string) => {
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
  }, [updateStoreModel, sendMessage]);

  // Stop model
  const handleStopModel = useCallback(async (modelId: string) => {
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
  }, [updateStoreModel, sendMessage]);

  // Refresh models
  const handleRefresh = useCallback(() => {
    sendMessage("rescanModels", {});
  }, [sendMessage]);

  // Save model
  const handleSaveModel = useCallback(
    async (config: Partial<import("@/types").ModelConfig>) => {
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
    },
    [updateStoreModel, sendMessage],
  );

  // Delete model
  const handleDeleteModel = useCallback(
    async (modelId: string) => {
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
    },
    [sendMessage],
  );

  return {
    models,
    loading,
    error,
    setLoading,
    setError,
    handleStartModel,
    handleStopModel,
    handleRefresh,
    handleSaveModel,
    handleDeleteModel,
    requestModels,
    sendMessage,
  };
}
