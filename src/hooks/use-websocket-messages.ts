import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";

interface UseWebSocketMessagesOptions {
  onModelsLoaded?: (models: unknown[]) => void;
  onConfigLoaded?: (data: unknown) => void;
  onConfigSaved?: (data: unknown) => void;
  onModelDeleted?: (data: unknown) => void;
}

export function useWebSocketMessages(options?: UseWebSocketMessagesOptions) {
  const { on, off } = useWebSocket();
  const setModels = useStore((state) => state.setModels);

  // Handle WebSocket responses
  useEffect(() => {
    const handleModelsLoaded = (data: unknown) => {
      const typedData = data as { success: boolean; data?: unknown[] };
      if (typedData.success && typedData.data) {
        console.log("[useWebSocketMessages] Models loaded successfully:", typedData.data);
        setModels(typedData.data as import("@/types").ModelConfig[]);
        options?.onModelsLoaded?.(typedData.data);
      } else {
        console.error("[useWebSocketMessages] Failed to load models:", data);
      }
    };

    const handleConfigLoaded = (data: unknown) => {
      const typedData = data as {
        success: boolean;
        error?: unknown;
        data?: { id: number; type: string; config: Record<string, unknown> };
      };
      if (typedData.success && typedData.data) {
        console.log("[useWebSocketMessages] Config loaded successfully:", typedData.data);
        options?.onConfigLoaded?.(typedData.data);
      } else {
        console.error("[useWebSocketMessages] Failed to load config:", typedData.error);
      }
    };

    const handleConfigSaved = (data: unknown) => {
      const typedData = data as {
        success: boolean;
        error?: unknown;
        data?: unknown;
      };
      if (typedData.success) {
        console.log("[useWebSocketMessages] Config saved successfully:", typedData.data);
        options?.onConfigSaved?.(typedData.data);
      } else {
        console.error("[useWebSocketMessages] Failed to save config:", typedData.error);
      }
    };

    const handleModelDeleted = (data: unknown) => {
      const typedData = data as {
        success: boolean;
        error?: unknown;
        data?: { id: number };
      };
      if (typedData.success && typedData.data) {
        console.log("[useWebSocketMessages] Model deleted successfully:", typedData.data);
        useStore.getState().removeModel(typedData.data.id.toString());
        options?.onModelDeleted?.(typedData.data);
      } else {
        console.error("[useWebSocketMessages] Failed to delete model:", typedData.error);
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
  }, [on, off, options, setModels]);
}