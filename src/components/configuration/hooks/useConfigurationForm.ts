import { useState, useEffect } from "react";
import { useLoggerConfig } from "@/hooks/use-logger-config";

interface LlamaServerConfig {
  host: string;
  port: number;
  basePath: string;
  serverPath: string;
  ctx_size: number;
  batch_size: number;
  threads: number;
  gpu_layers: number;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function useConfigurationForm() {
  const { applyToLogger } = useLoggerConfig();
  const [activeTab, setActiveTab] = useState(0);
  const [formConfig, setFormConfig] = useState<Partial<LlamaServerConfig>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Load config from API on mount
  useEffect(() => {
    loadServerConfig();
  }, []);

  const loadServerConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch("/api/config");
      if (response.ok) {
        const serverConfig = await response.json();
        // Wrap in llamaServer object for compatibility with form structure
        setFormConfig({
          llamaServer: {
            host: serverConfig.host,
            port: serverConfig.port,
            basePath: serverConfig.basePath,
            serverPath: serverConfig.serverPath,
            ctx_size: serverConfig.ctx_size,
            batch_size: serverConfig.batch_size,
            threads: serverConfig.threads,
            gpu_layers: serverConfig.gpu_layers,
          },
        });
      }
    } catch (error) {
      console.error("Failed to load server config:", error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const validateConfig = (configToValidate: Partial<LlamaServerConfig>): ValidationResult => {
    const errors: string[] = [];

    if (!configToValidate.host || configToValidate.host.trim() === "") {
      errors.push("Host is required");
    }

    if (configToValidate.port !== undefined) {
      if (isNaN(configToValidate.port) || configToValidate.port < 1 || configToValidate.port > 65535) {
        errors.push("Port must be a valid port number (1-65535)");
      }
    }

    if (!configToValidate.serverPath || configToValidate.serverPath.trim() === "") {
      errors.push("Server path is required");
    }

    if (configToValidate.ctx_size !== undefined) {
      if (isNaN(configToValidate.ctx_size) || configToValidate.ctx_size < 0) {
        errors.push("Context size must be a positive number");
      }
    }

    if (configToValidate.batch_size !== undefined) {
      if (isNaN(configToValidate.batch_size) || configToValidate.batch_size < 0) {
        errors.push("Batch size must be a positive number");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

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

      // Save llama-server config to file via API
      const serverConfigResponse = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formConfig.host || "127.0.0.1",
          port: formConfig.port || 8080,
          basePath: formConfig.basePath || "/models",
          serverPath: formConfig.serverPath || "/home/bamer/llama.cpp/build/bin/llama-server",
          ctx_size: formConfig.ctx_size || 8192,
          batch_size: formConfig.batch_size || 512,
          threads: formConfig.threads || -1,
          gpu_layers: formConfig.gpu_layers || -1,
        }),
      });

      if (!serverConfigResponse.ok) {
        throw new Error("Failed to save server config");
      }

      // Apply logger configuration to backend
      applyToLogger();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setFormConfig({});
    await loadServerConfig();
  };

  const handleSync = async () => {
    await loadServerConfig();
  };

  return {
    config: formConfig,
    loading: isLoadingConfig,
    activeTab,
    formConfig,
    validationErrors,
    isSaving,
    saveSuccess,
    isLoadingConfig,
    handleTabChange,
    handleInputChange,
    handleLlamaServerChange,
    handleModelDefaultsChange,
    handleSave,
    handleReset,
    handleSync,
  };
}
