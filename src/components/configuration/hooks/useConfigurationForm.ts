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

interface ModelDefaultsConfig {
  ctx_size?: number;
  batch_size?: number;
  ubatch_size?: number;
  threads?: number;
  gpu_layers?: number;
  main_gpu?: number;
  temperature?: number;
  top_k?: number;
  top_p?: number;
}

interface GeneralSettingsConfig {
  basePath?: string;
  logLevel?: string;
  maxConcurrentModels?: number;
  autoUpdate?: boolean;
  notificationsEnabled?: boolean;
  llamaServerPath?: string;
}

interface FormConfig {
  llamaServer?: Partial<LlamaServerConfig>;
  modelDefaults?: ModelDefaultsConfig;
  general?: GeneralSettingsConfig;
  // Legacy support for direct properties
  basePath?: string;
  logLevel?: string;
  maxConcurrentModels?: number;
  autoUpdate?: boolean;
  notificationsEnabled?: boolean;
  llamaServerPath?: string;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function useConfigurationForm() {
  const { applyToLogger } = useLoggerConfig();
  const [activeTab, setActiveTab] = useState(0);
  const [formConfig, setFormConfig] = useState<FormConfig>({});
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
        const config = await response.json();
        const { serverConfig, appConfig } = config;

        setFormConfig({
          llamaServer: {
            host: serverConfig?.host,
            port: serverConfig?.port,
            basePath: serverConfig?.basePath,
            serverPath: serverConfig?.serverPath,
            ctx_size: serverConfig?.ctx_size,
            batch_size: serverConfig?.batch_size,
            threads: serverConfig?.threads,
            gpu_layers: serverConfig?.gpu_layers,
          },
          basePath: serverConfig?.basePath,
          logLevel: appConfig?.logLevel,
          maxConcurrentModels: appConfig?.maxConcurrentModels,
          autoUpdate: appConfig?.autoUpdate,
          notificationsEnabled: appConfig?.notificationsEnabled,
          llamaServerPath: serverConfig?.serverPath,
        });
      }
    } catch (error) {
      console.error("Failed to load server config:", error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const validateConfig = (configToValidate: FormConfig): ValidationResult => {
    const errors: string[] = [];
    const llamaServer = configToValidate.llamaServer;

    if (!llamaServer || !llamaServer.host || llamaServer.host.trim() === "") {
      errors.push("Host is required");
    }

    if (llamaServer && llamaServer.port !== undefined) {
      if (isNaN(llamaServer.port) || llamaServer.port < 1 || llamaServer.port > 65535) {
        errors.push("Port must be a valid port number (1-65535)");
      }
    }

    if (!llamaServer || !llamaServer.serverPath || llamaServer.serverPath.trim() === "") {
      errors.push("Server path is required");
    }

    if (llamaServer && llamaServer.ctx_size !== undefined) {
      if (isNaN(llamaServer.ctx_size) || llamaServer.ctx_size < 0) {
        errors.push("Context size must be a positive number");
      }
    }

    if (llamaServer && llamaServer.batch_size !== undefined) {
      if (isNaN(llamaServer.batch_size) || llamaServer.batch_size < 0) {
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

      const llamaServer = formConfig.llamaServer || {};

      const payload: any = {
        serverConfig: {
          host: llamaServer.host || "127.0.0.1",
          port: llamaServer.port || 8080,
          basePath: llamaServer.basePath || "/models",
          serverPath: llamaServer.serverPath || "/home/bamer/llama.cpp/build/bin/llama-server",
          ctx_size: llamaServer.ctx_size || 8192,
          batch_size: llamaServer.batch_size || 512,
          threads: llamaServer.threads || -1,
          gpu_layers: llamaServer.gpu_layers || -1,
        },
        appConfig: {
          maxConcurrentModels: formConfig.maxConcurrentModels || 1,
          logLevel: formConfig.logLevel || "info",
          autoUpdate: formConfig.autoUpdate || false,
          notificationsEnabled: formConfig.notificationsEnabled !== undefined ? formConfig.notificationsEnabled : true,
        },
      };

      const serverConfigResponse = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!serverConfigResponse.ok) {
        throw new Error("Failed to save config");
      }

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
