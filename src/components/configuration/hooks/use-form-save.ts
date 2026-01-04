import type { FormConfig } from "./use-form-state";

interface UseFormSaveProps {
  formConfig: FormConfig;
  setIsSaving: (saving: boolean) => void;
  setSaveSuccess: (success: boolean) => void;
  setValidationErrors: (errors: string[]) => void;
  setClearedFields: (fields: Set<string>) => void;
  validateConfig: (config: FormConfig) => { valid: boolean; errors?: string[] };
  applyToLogger: () => void;
}

export function useFormSave({
  formConfig,
  setIsSaving,
  setSaveSuccess,
  setValidationErrors,
  setClearedFields,
  validateConfig,
  applyToLogger,
}: UseFormSaveProps) {
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
          baseModelsPath: llamaServer.baseModelsPath || formConfig.baseModelsPath || "/models",
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

  return {
    handleSave,
  };
}