import { useState, useEffect } from "react";
import { useLoggerConfig } from "@/hooks/use-logger-config";
import {
  generalSettingsSchema,
  llamaServerSettingsSchema,
  loggerSettingsSchema,
  type GeneralSettings,
  type LlamaServerSettings,
  type LoggerSettings,
} from "@/lib/validators";

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

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface FieldErrors {
  general: Record<string, string>;
  llamaServer: Record<string, string>;
  logger: Record<string, string>;
}

export function useConfigurationForm() {
  const { applyToLogger } = useLoggerConfig();
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

  const validateConfig = (configToValidate: FormConfig): ValidationResult => {
    const errors: string[] = [];
    const newFieldErrors: FieldErrors = {
      general: {},
      llamaServer: {},
      logger: {},
    };

    // Validate General Settings using Zod
    const generalSettings = {
      basePath: configToValidate.basePath || "",
      logLevel: (configToValidate.logLevel || "info") as "error" | "warn" | "info" | "debug",
      maxConcurrentModels: configToValidate.maxConcurrentModels || 1,
      autoUpdate: configToValidate.autoUpdate || false,
      notificationsEnabled: configToValidate.notificationsEnabled !== undefined ? configToValidate.notificationsEnabled : true,
      llamaServerPath: configToValidate.llamaServerPath || "",
    };

    const generalResult = generalSettingsSchema.safeParse(generalSettings);
    if (!generalResult.success) {
      generalResult.error.issues.forEach((error: any) => {
        const fieldName = error.path[0] as string;
        newFieldErrors.general[fieldName] = error.message;
        errors.push(`General Settings: ${fieldName} - ${error.message}`);
      });
    }

    // Validate Llama Server Settings using Zod
    // Support both nested llamaServer object and legacy direct properties
    const llamaServer = configToValidate.llamaServer;
    // Determine which llama server fields are set directly (legacy) vs in nested object
    const llamaServerFieldNames = ["host", "port", "serverPath", "ctx_size", "batch_size", "threads", "gpu_layers"];
    const hasLegacyLlamaServerProps = llamaServerFieldNames.some(
      field => configToValidate[field as keyof FormConfig] !== undefined && field !== "basePath"
    );
    
    // Note: basePath is a general setting, not a llama server field
    const llamaServerSettings = {
      host: llamaServer?.host || configToValidate.host || "",
      port: llamaServer?.port || configToValidate.port || 8080,
      basePath: llamaServer?.basePath || "",
      serverPath: llamaServer?.serverPath || configToValidate.serverPath || "",
      ctx_size: llamaServer?.ctx_size || configToValidate.ctx_size || 0,
      batch_size: llamaServer?.batch_size || configToValidate.batch_size || 512,
      threads: llamaServer?.threads || configToValidate.threads || -1,
      gpu_layers: llamaServer?.gpu_layers || configToValidate.gpu_layers || -1,
    };

    const llamaServerResult = llamaServerSettingsSchema.safeParse(llamaServerSettings);
    if (!llamaServerResult.success) {
      llamaServerResult.error.issues.forEach((error: any) => {
        const fieldName = error.path[0] as string;
        newFieldErrors.llamaServer[fieldName] = error.message;
        errors.push(`Llama Server Settings: ${fieldName} - ${error.message}`);
      });
    }

    // Clear errors for fields that were explicitly cleared by user input to avoid re-validation
    // This allows users to clear a field error by typing without triggering re-validation
    const clearedFieldErrors = { ...newFieldErrors };
    clearedFields.forEach(field => {
      if (field in clearedFieldErrors.general) {
        delete clearedFieldErrors.general[field];
      }
      if (field in clearedFieldErrors.llamaServer) {
        delete clearedFieldErrors.llamaServer[field];
      }
    });

    setFieldErrors(clearedFieldErrors);

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
      [name]: type === "checkbox" ? checked : (type === "number" ? parseFloat(value) : value),
    }));
    // Clear field error for this field on change
    // Check if field is a llama server field
    const llamaServerFields = ["host", "port", "basePath", "serverPath", "ctx_size", "batch_size", "threads", "gpu_layers"];
    const isLlamaServerField = llamaServerFields.includes(name);

    setFieldErrors((prev) => ({
      ...prev,
      [isLlamaServerField ? "llamaServer" : "general"]: {
        ...prev[isLlamaServerField ? "llamaServer" : "general"],
        [name]: "",
      },
    }));
    // Track this field as explicitly cleared by user to avoid re-validation
    setClearedFields((prev) => new Set(prev).add(name));
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
    // Clear field error for this field on change
    setFieldErrors((prev) => ({
      ...prev,
      llamaServer: {
        ...prev.llamaServer,
        [fieldName]: "",
      },
    }));
    // Track this field as explicitly cleared by user to avoid re-validation
    setClearedFields((prev) => new Set(prev).add(fieldName));
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
    // Clear fields that were manually cleared to avoid re-validating them
    setClearedFields(new Set());

    try {
      const validation = validateConfig(formConfig);
      if (!validation.valid) {
        setValidationErrors(validation.errors || []);
        return; // Don't proceed with save if validation fails
      }

      const llamaServer = formConfig.llamaServer || {};
      // Support both nested llamaServer object and legacy direct properties
      const payload: any = {
        serverConfig: {
          host: llamaServer.host || formConfig.host || "127.0.0.1",
          port: llamaServer.port || formConfig.port || 8080,
          basePath: llamaServer.basePath || "/models",
          serverPath: llamaServer.serverPath || formConfig.serverPath || "/home/bamer/llama.cpp/build/bin/llama-server",
          ctx_size: llamaServer.ctx_size || formConfig.ctx_size || 8192,
          batch_size: llamaServer.batch_size || formConfig.batch_size || 512,
          threads: llamaServer.threads || formConfig.threads || -1,
          gpu_layers: llamaServer.gpu_layers || formConfig.gpu_layers || -1,
        },
        appConfig: {
          maxConcurrentModels: formConfig.maxConcurrentModels ||1,
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
    fieldErrors,
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
