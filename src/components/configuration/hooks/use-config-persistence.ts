import { useCallback } from "react";
import { useLoggerConfig } from "@/hooks/use-logger-config";

interface FormConfig {
  basePath?: string;
  logLevel?: string;
  maxConcurrentModels?: number;
  autoUpdate?: boolean;
  notificationsEnabled?: boolean;
  llamaServerPath?: string;
  serverConfig?: {
    host?: string;
    port?: number;
    basePath?: string;
    serverPath?: string;
    ctx_size?: number;
    batch_size?: number;
    threads?: number;
    gpu_layers?: number;
  };
}

export function useConfigPersistence() {
  const { applyToLogger } = useLoggerConfig();

  const loadServerConfig = useCallback(async (
    setFormConfig: React.Dispatch<React.SetStateAction<FormConfig>>,
    setIsLoadingConfig: React.Dispatch<React.SetStateAction<boolean>>,
  ): Promise<void> => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch("/api/config");
      if (!response) {
        throw new Error("No response received from server");
      }
      if (response.ok) {
        const config = await response.json();
        const { serverConfig, appConfig } = config;

        setFormConfig({
          basePath: appConfig?.basePath,
          logLevel: appConfig?.logLevel,
          maxConcurrentModels: appConfig?.maxConcurrentModels,
          autoUpdate: appConfig?.autoUpdate,
          notificationsEnabled: appConfig?.notificationsEnabled,
          llamaServerPath: serverConfig?.serverPath,
          serverConfig: {
            host: serverConfig?.host,
            port: serverConfig?.port,
            basePath: serverConfig?.basePath,
            serverPath: serverConfig?.serverPath,
            ctx_size: serverConfig?.ctx_size,
            batch_size: serverConfig?.batch_size,
            threads: serverConfig?.threads,
            gpu_layers: serverConfig?.gpu_layers,
          },
        });
      }
    } catch (error) {
      console.error("Failed to load server config:", error);
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  const saveConfig = useCallback(async (
    formConfig: FormConfig,
    setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
    setSaveSuccess: React.Dispatch<React.SetStateAction<boolean>>,
    setValidationErrors: React.Dispatch<React.SetStateAction<string[]>>,
  ): Promise<boolean> => {
    setIsSaving(true);
    setSaveSuccess(false);
    setValidationErrors([]);

    try {
      const serverConfig = formConfig.serverConfig || {};
      const payload: Record<string, unknown> = {
        serverConfig: {
          host: serverConfig.host || "127.0.0.1",
          port: serverConfig.port || 8080,
          basePath: serverConfig.basePath || "/models",
          serverPath: serverConfig.serverPath || formConfig.llamaServerPath || "/home/bamer/llama.cpp/build/bin/llama-server",
          ctx_size: serverConfig.ctx_size || 8192,
          batch_size: serverConfig.batch_size || 512,
          threads: serverConfig.threads || -1,
          gpu_layers: serverConfig.gpu_layers || -1,
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
      return true;
    } catch (err) {
      console.error("Save error:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [applyToLogger]);

  return {
    loadServerConfig,
    saveConfig,
  };
}
