export type ConfigType = "sampling" | "memory" | "gpu" | "advanced" | "lora" | "multimodal";

export interface ModelConfigSidebarProps {
  open: boolean;
  onClose: () => void;
  modelId: number | undefined;
  configType: ConfigType | null;
  config: Record<string, unknown>;
  onSave: (config: Record<string, unknown>) => void;
  editedConfig: Record<string, unknown>;
  onFieldChange: (name: string, value: unknown) => void;
  hasChanges: boolean;
  isSaving: boolean;
  error: string | null;
  notification?: {
    open: boolean;
    message: string;
    severity: "success" | "error";
  };
  onDismissNotification: () => void;
  onReset: () => void;
  children?: React.ReactNode;
}

// Re-export for backward compatibility
export type { ConfigType as ModelConfigType };
