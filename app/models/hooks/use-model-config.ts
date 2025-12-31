import { useState, useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffectEvent } from "@/hooks/use-effect-event";
import { ModelData } from "../types";

interface Notification {
  open: boolean;
  message: string;
  severity: "error" | "success";
}

export function useModelConfig() {
  const { sendMessage } = useWebSocket();
  const [configSidebarOpen, setConfigSidebarOpen] = useState(false);
  const [editingConfigType, setEditingConfigType] = useState<string | null>(null);
  const [editedConfig, setEditedConfig] = useState<Record<string, unknown>>({});
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);
  const [sidebarConfig, setSidebarConfig] = useState<Record<string, unknown> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleConfigure = useCallback(
    async (model: ModelData) => {
      if (!model.id) return;

      setSelectedModel(model);
      setEditingConfigType("sampling");
      setNotification({ open: false, message: "", severity: "success" });

      const initialConfig: Record<string, unknown> = {};
      const params = model.parameters || {};

      if (params.sampling) initialConfig.sampling = params.sampling;
      if (params.memory) initialConfig.memory = params.memory;
      if (params.gpu) initialConfig.gpu = params.gpu;
      if (params.advanced) initialConfig.advanced = params.advanced;
      if (params.lora) initialConfig.lora = params.lora;
      if (params.multimodal) initialConfig.multimodal = params.multimodal;

      setEditedConfig(initialConfig);

      if (!params.sampling) {
        sendMessage("load_config", { id: model.id, type: "sampling" });
      }
      if (!params.memory) {
        sendMessage("load_config", { id: model.id, type: "memory" });
      }
      if (!params.gpu) {
        sendMessage("load_config", { id: model.id, type: "gpu" });
      }
      if (!params.advanced) {
        sendMessage("load_config", { id: model.id, type: "advanced" });
      }
      if (!params.lora) {
        sendMessage("load_config", { id: model.id, type: "lora" });
      }
      if (!params.multimodal) {
        sendMessage("load_config", { id: model.id, type: "multimodal" });
      }

      setConfigSidebarOpen(true);
      console.log(`[useModelConfig] Opening config sidebar for model ${model.name}`);
    },
    [sendMessage],
  );

  const handleConfigSaved = useCallback((data: unknown) => {
    const typedData = data as {
      success: boolean;
      error?: unknown;
      data?: unknown;
    };
    if (typedData.success) {
      console.log("[useModelConfig] Config saved successfully:", typedData.data);
      setConfigSidebarOpen(false);
      setHasChanges(false);
      setNotification({
        open: true,
        message: "Configuration saved successfully",
        severity: "success",
      });
    } else {
      console.error("[useModelConfig] Failed to save config:", typedData.error);
      setNotification({
        open: true,
        message: `Failed to save config: ${
          (typedData.error as { message?: string })?.message || "Unknown error"
        }`,
        severity: "error",
      });
    }
  }, []);

  const handleConfigLoaded = useCallback((data: unknown) => {
    const typedData = data as {
      success: boolean;
      error?: unknown;
      data?: { id: number; type: string; config: Record<string, unknown> };
    };
    if (typedData.success && typedData.data) {
      console.log("[useModelConfig] Config loaded successfully:", typedData.data);
      const { id, type, config } = typedData.data;

      if (type === editingConfigType && id === selectedModel?.id) {
        setSidebarConfig(config);
        setEditedConfig((prev) => ({
          ...prev,
          ...config,
        }));
      }
    } else {
      console.error("[useModelConfig] Failed to load config:", typedData.error);
    }
  }, [editingConfigType, selectedModel]);

  const handleSaveConfig = useCallback(
    (config: Record<string, unknown>) => {
      if (selectedModel && editingConfigType) {
        sendMessage("save_config", {
          id: selectedModel.id,
          type: editingConfigType,
          config,
        });
        console.log(
          `[useModelConfig] Saving ${editingConfigType} config for model ${selectedModel.name}`,
        );
      }
    },
    [selectedModel, editingConfigType, sendMessage],
  );

  const handleFieldChange = useCallback(
    (name: string, value: unknown) => {
      setEditedConfig((prev) => ({
        ...prev,
        [name]: value,
      }));
      setHasChanges(true);
    },
    [],
  );

  const handleReset = useCallback(() => {
    if (sidebarConfig) {
      setEditedConfig(sidebarConfig);
    }
    setHasChanges(false);
  }, [sidebarConfig]);

  const handleDismissNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    configSidebarOpen,
    setConfigSidebarOpen,
    editingConfigType,
    setEditingConfigType,
    editedConfig,
    selectedModel,
    sidebarConfig,
    hasChanges,
    notification,
    handleConfigure,
    handleConfigSaved,
    handleConfigLoaded,
    handleSaveConfig,
    handleFieldChange,
    handleReset,
    handleDismissNotification,
  };
}
