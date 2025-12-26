import { useState, useEffect } from "react";
import { configService, ConfigType } from "@/lib/config-service";

export function useConfig() {
  const [config, setConfig] = useState<ConfigType>(configService.getConfig());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setConfig(configService.getConfig());
      setLoading(false);
    } catch (err) {
      setError("Failed to load configuration");
      setLoading(false);
    }
  }, []);

  const updateConfig = (updates: Partial<ConfigType>) => {
    try {
      configService.updateConfig(updates);
      setConfig(configService.getConfig());
    } catch (err) {
      setError("Failed to update configuration");
      throw err;
    }
  };

  const resetConfig = () => {
    try {
      configService.resetConfig();
      setConfig(configService.getConfig());
    } catch (err) {
      setError("Failed to reset configuration");
      throw err;
    }
  };

  const syncWithBackend = async () => {
    try {
      setLoading(true);
      await configService.syncWithBackend();
    } catch (err) {
      setError("Failed to sync configuration with backend");
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
