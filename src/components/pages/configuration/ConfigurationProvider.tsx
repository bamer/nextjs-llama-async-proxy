"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface Config {
  basePath: string;
  logLevel: string;
  maxConcurrentModels: number;
  autoUpdate: boolean;
  notificationsEnabled: boolean;
  modelDefaults: ModelDefaults;
  llamaServer?: LlamaServerConfig;
}

interface ModelDefaults {
  ctx_size: number;
  batch_size: number;
  temperature: number;
  top_p: number;
  top_k: number;
  gpu_layers: number;
  threads: number;
}

interface LlamaServerConfig {
  host: string;
  port: number;
  ctx_size: number;
  batch_size: number;
  ubatch_size: number;
  threads: number;
  gpu_layers: number;
  main_gpu: number;
  temperature: number;
  top_k: number;
  top_p: number;
}

interface ConfigurationContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  saveMessage: string;
  setSaveMessage: (message: string) => void;
  hasChanges: boolean;
  resetConfig: () => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export type TabType = "general" | "llamaServer" | "advanced" | "logger";

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

const DEFAULT_CONFIG: Config = {
  basePath: "/home/user/models",
  logLevel: "info",
  maxConcurrentModels: 5,
  autoUpdate: true,
  notificationsEnabled: true,
  modelDefaults: { ctx_size: 4096, batch_size: 2048, temperature: 0.8, top_p: 0.9, top_k: 40, gpu_layers: -1, threads: -1 },
  llamaServer: {
    host: "127.0.0.1",
    port: 8080,
    ctx_size: 4096,
    batch_size: 2048,
    ubatch_size: 512,
    threads: -1,
    gpu_layers: -1,
    main_gpu: 0,
    temperature: 0.8,
    top_k: 40,
    top_p: 0.9,
  },
};

export function ConfigurationProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(false);
    setFieldErrors({});
  }, []);

  const value: ConfigurationContextType = {
    activeTab,
    setActiveTab,
    config,
    setConfig: (newConfig) => {
      setConfig(newConfig);
      setHasChanges(true);
    },
    isSaving,
    setIsSaving,
    saveMessage,
    setSaveMessage,
    hasChanges,
    resetConfig,
    fieldErrors,
    setFieldErrors,
  };

  return <ConfigurationContext.Provider value={value}>{children}</ConfigurationContext.Provider>;
}

export function useConfiguration(): ConfigurationContextType {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error("useConfiguration must be used within a ConfigurationProvider");
  }
  return context;
}
