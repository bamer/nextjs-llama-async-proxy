"use client";

import { useCallback } from "react";
import type { ModelConfig } from "@/types/dashboard-model-config";

interface UseModelItemParams {
  model: ModelConfig;
  currentTemplate: string;
  loadingModels: Record<string, boolean>;
  selectedTemplates: Record<string, string>;
  setLoadingModels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onSaveTemplate: (modelName: string, template: string | null) => void;
  onSaveTemplateToConfig: (modelName: string, template: string) => void;
  onToggleModel: (modelId: string) => void;
  onToggleModelOptimistic: ((modelId: string, status: string) => void) | undefined;
}

export const getStatusColor = (
  status: string,
): "default" | "error" | "primary" | "secondary" | "info" | "success" | "warning" => {
  switch (status) {
    case "running":
      return "success";
    case "loading":
      return "warning";
    case "error":
      return "error";
    default:
      return "default";
  }
};

export const getStatusLabel = (status: string, progress?: number): string => {
  switch (status) {
    case "running":
      return "RUNNING";
    case "loading":
      return progress !== undefined ? `Loading... ${progress}%` : "LOADING";
    case "error":
      return "ERROR";
    default:
      return "STOPPED";
  }
};

export const useModelItem = ({
  model,
  currentTemplate,
  loadingModels,
  selectedTemplates,
  setLoadingModels,
  onSaveTemplate,
  onSaveTemplateToConfig,
  onToggleModel,
  onToggleModelOptimistic,
}: UseModelItemParams) => {
  // Stable start/stop handler using useCallback
  const handleStartStop = useCallback(async () => {
    if (loadingModels[model.id]) return;

    setLoadingModels((prev: Record<string, boolean>) => ({ ...prev, [model.id]: true }));

    // OPTIMISTIC: Assume success, update UI immediately
    const optimisticNewStatus = model.status === "running" ? "stopped" : "loading";
    const originalStatus = model.status;

    // Update UI immediately (will be overridden by WebSocket on actual success)
    onToggleModelOptimistic?.(model.id, optimisticNewStatus);

    try {
      if (model.status === "running") {
        await fetch(`/api/models/${encodeURIComponent(model.name)}/stop`, { method: "POST" });
      } else {
        const selectedTemplate = selectedTemplates[model.name] || model.template;
        const body: Record<string, unknown> = {};
        if (selectedTemplate) {
          body.template = selectedTemplate;
        }

        const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to start model");
      }

      // Success - WebSocket will update with actual status
      onToggleModel(model.id);
    } catch (error) {
      // REVERT: Update failed, revert to original status
      onToggleModelOptimistic?.(model.id, originalStatus);
      console.error("Failed to toggle model:", error);
      alert(error instanceof Error ? error.message : "Failed to start model");
    } finally {
      setLoadingModels((prev: Record<string, boolean>) => ({ ...prev, [model.id]: false }));
    }
  }, [model, loadingModels, selectedTemplates, setLoadingModels, onToggleModel, onToggleModelOptimistic]);

  // Stable template change handler using useCallback
  const handleTemplateChange = useCallback((e: { target: { value: string } }) => {
    const template = e.target.value as string;
    onSaveTemplate(model.name, template);
  }, [model.name, onSaveTemplate]);

  // Stable save template handler using useCallback
  const handleSaveTemplate = useCallback(() => {
    onSaveTemplateToConfig(model.name, currentTemplate);
  }, [model.name, currentTemplate, onSaveTemplateToConfig]);

  return {
    handleStartStop,
    handleTemplateChange,
    handleSaveTemplate,
  };
};
