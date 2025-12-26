import { useState } from "react";
import { useConfig } from "@/hooks/use-config";
import { DEFAULT_LLAMA_SERVER_CONFIG } from "@/config/llama-defaults";

export function useConfigurationForm() {
  const { config, loading, updateConfig, resetConfig, syncWithBackend, validateConfig } =
    useConfig();
  const [activeTab, setActiveTab] = useState(0);
  const [formConfig, setFormConfig] = useState<any>(() => {
    const initialConfig = { ...config };
    if (!initialConfig.llamaServer) {
      initialConfig.llamaServer = {} as any;
    }
    return initialConfig;
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormConfig((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLlamaServerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name.split(".")[1];
    setFormConfig((prev: any) => ({
      ...prev,
      llamaServer: {
        ...prev.llamaServer,
        [fieldName]: type === "number" ? parseFloat(value) : value,
      },
    }));
  };

  const handleModelDefaultsChange = (field: string, value: number) => {
    setFormConfig((prev: any) => ({
      ...prev,
      modelDefaults: {
        ...prev.modelDefaults,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setValidationErrors([]);

    try {
      const validation = validateConfig(formConfig);
      if (!validation.valid) {
        setValidationErrors(validation.errors || []);
        throw new Error("Validation failed");
      }

      await updateConfig(formConfig);
      setSaveSuccess(true);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetConfig();
    setFormConfig(config);
  };

  const handleSync = async () => {
    await syncWithBackend();
  };

  return {
    config,
    loading,
    activeTab,
    formConfig,
    validationErrors,
    isSaving,
    saveSuccess,
    handleTabChange,
    handleInputChange,
    handleLlamaServerChange,
    handleModelDefaultsChange,
    handleSave,
    handleReset,
    handleSync,
    setFormConfig,
  };
}
