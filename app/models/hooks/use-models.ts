import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";
import { useWebSocketEventHandlers } from "./use-websocket-handlers";
import { startModel, stopModel } from "./model-operations";
import { saveModel, deleteModel, refreshModels } from "./model-crud";

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
  sendMessage: (type: string, data: Record<string, unknown>) => void;
}

export function useModels(options?: UseModelsOptions): UseModelsReturn {
  const models = useStore((state) => state.models);
  const { sendMessage: wsSendMessage } = useWebSocket();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateStoreModel = useStore((state) => state.updateModel);

  // Setup WebSocket handlers
  const { requestModels, cleanup } = useWebSocketEventHandlers(options);

  useEffect(() => {
    wsSendMessage("load_models", {});
    console.log("[useModels] Loading models from database");

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsSendMessage]);

  const handleStartModel = useCallback(
    async (modelId: string) => {
      await startModel(modelId, updateStoreModel, wsSendMessage, setError, setLoading);
    },
    [updateStoreModel, wsSendMessage],
  );

  const handleStopModel = useCallback(
    async (modelId: string) => {
      await stopModel(modelId, updateStoreModel, wsSendMessage, setError, setLoading);
    },
    [updateStoreModel, wsSendMessage],
  );

  const handleRefresh = useCallback(() => {
    refreshModels(wsSendMessage);
  }, [wsSendMessage]);

  const handleSaveModel = useCallback(
    async (config: Partial<import("@/types").ModelConfig>) => {
      await saveModel(config, updateStoreModel, wsSendMessage);
    },
    [updateStoreModel, wsSendMessage],
  );

  const handleDeleteModel = useCallback(
    async (modelId: string) => {
      deleteModel(modelId, wsSendMessage);
    },
    [wsSendMessage],
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
    sendMessage: wsSendMessage,
  };
}
