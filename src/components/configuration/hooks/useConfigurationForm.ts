import { useState, useEffect } from "react";
import { useConfigPersistence } from "./use-config-persistence";
import { validateConfig } from "./use-config-validation";
import { createConfigHandlers } from "./config-form-utils";

interface FormConfig {
  llamaServer?: Record<string, unknown>;
  modelDefaults?: Record<string, unknown>;
  basePath?: string;
  logLevel?: string;
  maxConcurrentModels?: number;
  autoUpdate?: boolean;
  notificationsEnabled?: boolean;
  llamaServerPath?: string;
  serverConfig?: Record<string, unknown>;
}

interface FieldErrors {
  general: Record<string, string>;
  llamaServer: Record<string, string>;
  logger: Record<string, string>;
}

export function useConfigurationForm() {
  const [activeTab, setActiveTab] = useState(0);
  const [formConfig, setFormConfig] = useState<FormConfig>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    general: {},
    llamaServer: {},
    logger: {},
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [clearedFields, setClearedFields] = useState<Set<string>>(new Set());

  const { loadServerConfig, saveConfig } = useConfigPersistence();
  const configHandlers = createConfigHandlers(setFormConfig, setFieldErrors, setClearedFields);

  useEffect(() => {
    loadServerConfig(setFormConfig, setIsLoadingConfig);
  }, [loadServerConfig]);

  const handleSave = async () => {
    const validation = validateConfig(formConfig, clearedFields);

    if (!validation.validationResult.valid) {
      setValidationErrors(validation.validationResult.errors || []);
      return;
    }

    await saveConfig(formConfig, setIsSaving, setSaveSuccess, setValidationErrors);
    setClearedFields(new Set());
  };

  const handleReset = async () => {
    setFormConfig({});
    await loadServerConfig(setFormConfig, setIsLoadingConfig);
  };

  const handleSync = async () => {
    await loadServerConfig(setFormConfig, setIsLoadingConfig);
  };

  const handleTabChangeWrapper = (e: React.SyntheticEvent, newValue: number) => {
    setActiveTab(configHandlers.handleTabChange(e, newValue));
  };

  return {
    config: formConfig,
    loading: isLoadingConfig,
    activeTab,
    formConfig,
    validationErrors,
    fieldErrors,
    isSaving,
    saveSuccess,
    isLoadingConfig,
    handleTabChange: handleTabChangeWrapper,
    handleInputChange: configHandlers.handleInputChange,
    handleLlamaServerChange: configHandlers.handleLlamaServerChange,
    handleModelDefaultsChange: configHandlers.handleModelDefaultsChange,
    handleSave,
    handleReset,
    handleSync,
  };
}
