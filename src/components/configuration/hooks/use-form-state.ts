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

export interface FormConfig {
  llamaServer?: Partial<LlamaServerConfig>;
  modelDefaults?: ModelDefaultsConfig;
  general?: GeneralSettingsConfig;
  // Legacy support for direct properties
  host?: string;
  port?: number;
  serverPath?: string;
  ctx_size?: number;
  batch_size?: number;
  threads?: number;
  gpu_layers?: number;
  basePath?: string;
  logLevel?: string;
  maxConcurrentModels?: number;
  autoUpdate?: boolean;
  notificationsEnabled?: boolean;
  llamaServerPath?: string;
}

export interface FieldErrors {
  general: Record<string, string>;
  llamaServer: Record<string, string>;
  logger: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function useFormState() {
  const { applyToLogger } = useLoggerConfig();

  // State management
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
  // Track which fields were explicitly cleared by user input to avoid re-validation
  const [clearedFields, setClearedFields] = useState<Set<string>>(new Set());

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
    fieldErrors,
    isSaving,
    saveSuccess,
    isLoadingConfig,
    setActiveTab,
    setFormConfig,
    setValidationErrors,
    setFieldErrors,
    setIsSaving,
    setSaveSuccess,
    setClearedFields,
    clearedFields,
    loadServerConfig,
    handleReset,
    handleSync,
    applyToLogger,
  };
}