import { useState, useEffect, useEffectEvent as ReactUseEffectEvent } from "react";
import { websocketServer } from "@/lib/websocket-client";

export interface Model {
  id?: string;
  name: string;
  description?: string;
  status: "running" | "idle" | "loading";
  version?: string;
  path?: string;
  type?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface UseModelsOptions {
  enableWebSocket?: boolean;
}

export function useModels(options: UseModelsOptions = {}) {
  const { enableWebSocket = true } = options;
  const [models, setModels] = useState<Model[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Use useEffectEvent for stable WebSocket callbacks
  const handleModelsUpdate = ReactUseEffectEvent((message: unknown) => {
    if (
      message &&
      typeof message === "object" &&
      "type" in message &&
      "data" in message &&
      message.type === "models" &&
      Array.isArray(message.data)
    ) {
      console.log("📡 Models updated from WebSocket:", message.data);
      setModels(message.data as Model[]);
    }
  });

  const handleConnect = ReactUseEffectEvent(() => {
    console.log("📡 WebSocket connected, requesting models...");
    websocketServer.requestModels();
  });

  const loadModels = ReactUseEffectEvent(async () => {
    try {
      const response = await fetch("/api/models");
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error("Failed to load models:", error);
    }
  });

  const startModel = ReactUseEffectEvent(async (modelName: string) => {
    setLoadingStates((prev) => ({ ...prev, [modelName]: true }));
    try {
      const response = await fetch(`/api/models/${modelName}/start`, {
        method: "POST",
      });

      if (response.ok) {
        setModels((prev) =>
          prev.map((model) =>
            model.name === modelName
              ? { ...model, status: "running" as const }
              : model,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to start model:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [modelName]: false }));
    }
  });

  const stopModel = ReactUseEffectEvent(async (modelName: string) => {
    setLoadingStates((prev) => ({ ...prev, [modelName]: true }));
    try {
      const response = await fetch(`/api/models/${modelName}/stop`, {
        method: "POST",
      });

      if (response.ok) {
        setModels((prev) =>
          prev.map((model) =>
            model.name === modelName
              ? { ...model, status: "idle" as const }
              : model,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to stop model:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [modelName]: false }));
    }
  });

  const discoverModels = async (paths?: string[]) => {
    try {
      const configResponse = await fetch("/api/config");
      let configuredPaths = paths || ["/media/bamer/crucial MX300/llm/llama/models"];

      if (configResponse.ok) {
        const config = await configResponse.json();
        if (config.basePath) {
          configuredPaths = [config.basePath];
        }
      }

      const response = await fetch("/api/models/discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paths: configuredPaths }),
      });

      if (!response.ok) {
        throw new Error(`Failed to discover models: HTTP ${response.status}`);
      }

      const data = await response.json();
      setModels((prev) => [...prev, ...data.discovered]);
      return data;
    } catch (error) {
      console.error("Failed to discover models:", error);
      throw error;
    }
  };

  const rescanModels = async () => {
    try {
      websocketServer.rescanModels();
    } catch (error) {
      console.error("Failed to rescan models:", error);
      throw error;
    }
  };

  // Load models on mount and subscribe to real-time updates
  useEffect(() => {
    loadModels();

    if (enableWebSocket) {
      try {
        websocketServer.connect();
        websocketServer.on("message", handleModelsUpdate);
        websocketServer.on("connect", handleConnect);
      } catch (error) {
        console.error("WebSocket connection error:", error);
      }

      return () => {
        try {
          websocketServer.off("message", handleModelsUpdate);
          websocketServer.off("connect", handleConnect);
        } catch (error) {
          // Ignore cleanup errors
        }
      };
    }
  }, [loadModels, handleModelsUpdate, handleConnect, enableWebSocket]);

  return {
    models,
    loadingStates,
    startModel,
    stopModel,
    discoverModels,
    rescanModels,
    setModels,
  };
}
