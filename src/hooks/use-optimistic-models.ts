"use client";

import { useState, useCallback } from "react";
import { showSuccess, showError } from "@/utils/toast-helpers";

export type OptimisticModelStatus = "running" | "idle" | "starting" | "stopping" | "loading" | "error" | "stopped";

export interface OptimisticModel {
  id: string;
  name: string;
  status: OptimisticModelStatus;
  description?: string;
  version?: string;
  path?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface UseOptimisticModelsReturn {
  models: OptimisticModel[];
  startModel: (modelId: string) => Promise<boolean>;
  stopModel: (modelId: string) => Promise<boolean>;
  deleteModel: (modelId: string) => Promise<boolean>;
  setModels: (models: OptimisticModel[]) => void;
}

export function useOptimisticModels(
  initialModels: OptimisticModel[],
): UseOptimisticModelsReturn {
  const [models, setModels] = useState<OptimisticModel[]>(initialModels);

  const startModel = useCallback(async (modelId: string): Promise<boolean> => {
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: "starting" as const } : m)),
    );

    try {
      const response = await fetch(`/api/models/${modelId}/start`, { method: "POST" });
      if (response.ok) {
        setModels((prev) =>
          prev.map((m) => (m.id === modelId ? { ...m, status: "running" as const } : m)),
        );
        showSuccess("Model Started", `${models.find((m) => m.id === modelId)?.name} is now running`);
        return true;
      }
      throw new Error("Start failed");
    } catch {
      setModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, status: "idle" as const } : m)),
      );
      showError("Start Failed", "Could not start the model");
      return false;
    }
  }, [models]);

  const stopModel = useCallback(async (modelId: string): Promise<boolean> => {
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, status: "stopping" as const } : m)),
    );

    try {
      const response = await fetch(`/api/models/${modelId}/stop`, { method: "POST" });
      if (response.ok) {
        setModels((prev) =>
          prev.map((m) => (m.id === modelId ? { ...m, status: "idle" as const } : m)),
        );
        showSuccess("Model Stopped", `${models.find((m) => m.id === modelId)?.name} has been stopped`);
        return true;
      }
      throw new Error("Stop failed");
    } catch {
      setModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, status: "running" as const } : m)),
      );
      showError("Stop Failed", "Could not stop the model");
      return false;
    }
  }, [models]);

  const deleteModel = useCallback(async (modelId: string): Promise<boolean> => {
    const modelToDelete = models.find((m) => m.id === modelId);
    setModels((prev) => prev.filter((m) => m.id !== modelId));

    try {
      const response = await fetch(`/api/models/${modelId}`, { method: "DELETE" });
      if (response.ok) {
        showSuccess("Model Deleted", `${modelToDelete?.name} has been removed`);
        return true;
      }
      throw new Error("Delete failed");
    } catch {
      setModels((prev) => [...prev, modelToDelete!]);
      showError("Delete Failed", "Could not delete the model");
      return false;
    }
  }, [models]);

  return { models, startModel, stopModel, deleteModel, setModels };
}
