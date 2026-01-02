import { useStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";

interface WebSocketEventHandlersOptions {
  onModelsLoaded?: (models: unknown[]) => void;
  onConfigLoaded?: (data: unknown) => void;
  onConfigSaved?: (data: unknown) => void;
  onModelDeleted?: (data: unknown) => void;
}

export function useWebSocketEventHandlers(
  options?: WebSocketEventHandlersOptions,
): {
  requestModels: () => void;
  sendMessage: (type: string, data: Record<string, unknown>) => void;
  cleanup: () => void;
} {
  const { requestModels, sendMessage, on, off } = useWebSocket();
  const setModels = useStore((state) => state.setModels);

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

  // Return cleanup function
  const cleanup = () => {
    off("models_loaded", handleModelsLoaded);
    off("config_loaded", handleConfigLoaded);
    off("config_saved", handleConfigSaved);
    off("model_deleted", handleModelDeleted);
  };

  return { requestModels, sendMessage, cleanup };
}
