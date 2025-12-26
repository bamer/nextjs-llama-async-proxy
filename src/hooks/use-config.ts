import { useState, useEffect } from "react";
import { configService, ConfigType } from "@/lib/config-service";
import { useSnackbar } from "notistack";

export function useConfig() {
  const [config, setConfig] = useState<ConfigType>(configService.getConfig());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    try {
      setConfig(configService.getConfig());
      setLoading(false);
    } catch (err) {
      setError("Failed to load configuration");
      setLoading(false);
      enqueueSnackbar("Failed to load configuration", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  const updateConfig = (updates: Partial<ConfigType>) => {
    try {
      configService.updateConfig(updates);
      setConfig(configService.getConfig());
      enqueueSnackbar("Configuration updated successfully", { variant: "success" });
    } catch (err) {
      setError("Failed to update configuration");
      enqueueSnackbar("Failed to update configuration", { variant: "error" });
      throw err;
    }
  };

  const resetConfig = () => {
    try {
      configService.resetConfig();
      setConfig(configService.getConfig());
      enqueueSnackbar("Configuration reset to defaults", { variant: "info" });
    } catch (err) {
      setError("Failed to reset configuration");
      enqueueSnackbar("Failed to reset configuration", { variant: "error" });
    }
  };

  const syncWithBackend = async () => {
    try {
      setLoading(true);
      await configService.syncWithBackend();
      enqueueSnackbar("Configuration synced with backend", { variant: "success" });
    } catch (err) {
      setError("Failed to sync configuration with backend");
      enqueueSnackbar("Failed to sync configuration with backend", { variant: "error" });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateConfig = (configToValidate: any) => {
    return configService.validateConfig(configToValidate);
  };

  return {
    config,
    loading,
    error,
    updateConfig,
    resetConfig,
    syncWithBackend,
    validateConfig,
  };
}
