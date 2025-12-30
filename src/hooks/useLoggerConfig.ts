"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiClient } from "@/utils/api-client";
import type { ApiResponse } from "@/types";

export interface LoggerConfig {
  level: "debug" | "info" | "warn" | "error";
  format: "json" | "text";
  maxFiles: number;
  maxSize: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: "info",
  format: "json",
  maxFiles: 14,
  maxSize: "20m",
  enableConsole: true,
  enableFile: true,
  enableRemote: false,
};

export function useLoggerConfig() {
  const [config, setConfig] = useState<LoggerConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<LoggerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { sendMessage } = useWebSocket();

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await apiClient.get<LoggerConfig>("/api/logger/config");
    if (response.success && response.data) {
      setConfig(response.data);
      setOriginalConfig(response.data);
      setHasChanges(false);
    } else {
      setError(response.error?.message || "Failed to fetch logger config");
    }
    setLoading(false);
  }, []);

  const updateConfig = useCallback((updates: Partial<LoggerConfig>) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalConfig));
      return updated;
    });
  }, [originalConfig]);

  const resetConfig = useCallback(() => {
    if (originalConfig) {
      setConfig(originalConfig);
      setHasChanges(false);
    }
  }, [originalConfig]);

  const saveConfig = useCallback(async () => {
    if (!config || !hasChanges) return;
    setLoading(true);
    setError(null);
    const response = await apiClient.put<LoggerConfig>("/api/logger/config", config);
    if (response.success) {
      setOriginalConfig(config);
      setHasChanges(false);
      sendMessage("logger_config_updated", { config });
    } else {
      setError(response.error?.message || "Failed to save logger config");
    }
    setLoading(false);
  }, [config, hasChanges, sendMessage]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    const handleConfigUpdate = (message: WebSocketMessage<unknown>) => {
      if (message.type === "logger_config_updated") {
        fetchConfig();
      }
    };
    // WebSocket listeners would be registered here via useWebSocket.on()
    // Simplified for this implementation
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    hasChanges,
    updateConfig,
    resetConfig,
    saveConfig,
  };
}
