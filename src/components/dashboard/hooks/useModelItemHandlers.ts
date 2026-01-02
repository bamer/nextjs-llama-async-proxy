"use client";

import { useCallback } from "react";
import type { ModelType } from "../model-item-utils";

export interface ModelConfig {
  id: string;
  name: string;
  status: 'idle' | 'loading' | 'running' | 'error';
  type: ModelType;
  progress?: number;
  template?: string;
  availableTemplates?: string[];
}

export interface UseModelItemHandlersParams {
  model: ModelConfig;
  loadingModels: Record<string, boolean>;
  setLoadingModels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedTemplates: Record<string, string>;
  currentTemplate: string;
  onSaveTemplate: (modelName: string, template: string | null) => void;
  onSaveTemplateToConfig: (modelName: string, template: string) => void;
  onToggleModel: (modelId: string) => void;
  onToggleModelOptimistic?: ((modelId: string, status: string) => void) | undefined;
}

export function useModelItemHandlers({
  model,
  loadingModels,
  setLoadingModels,
  selectedTemplates,
  currentTemplate,
  onSaveTemplate,
  onSaveTemplateToConfig,
  onToggleModel,
  onToggleModelOptimistic
}: UseModelItemHandlersParams) {
  const handleStartStop = useCallback(async () => {
    if (loadingModels[model.id]) return;

    setLoadingModels((prev: Record<string, boolean>) => ({
      ...prev,
      [model.id]: true
    }));

    const optimisticNewStatus = model.status === 'running' ? 'stopped' : 'loading';
    const originalStatus = model.status;

    onToggleModelOptimistic?.(model.id, optimisticNewStatus);

    try {
      if (model.status === 'running') {
        await fetch(`/api/models/${encodeURIComponent(model.name)}/stop`, {
          method: 'POST'
        });
      } else {
        const selectedTemplate = selectedTemplates[model.name] || model.template;
        const body: Record<string, string> = {};
        if (selectedTemplate) {
          body.template = selectedTemplate;
        }

        const response = await fetch(
          `/api/models/${encodeURIComponent(model.name)}/start`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to start model');
        }
      }

      onToggleModel(model.id);
    } catch (error) {
      onToggleModelOptimistic?.(model.id, originalStatus);
      console.error('Failed to toggle model:', error);
      alert(error instanceof Error ? error.message : 'Failed to start model');
    } finally {
      setLoadingModels((prev: Record<string, boolean>) => ({
        ...prev,
        [model.id]: false
      }));
    }
  }, [
    model,
    loadingModels,
    setLoadingModels,
    onToggleModelOptimistic,
    onToggleModel,
    selectedTemplates
  ]);

  const handleTemplateChange = useCallback(
    (e: { target: { value: string } }) => {
      const template = e.target.value as string;
      onSaveTemplate(model.name, template);
    },
    [model.name, onSaveTemplate]
  );

  const handleSaveTemplate = useCallback(() => {
    onSaveTemplateToConfig(model.name, currentTemplate);
  }, [model.name, currentTemplate, onSaveTemplateToConfig]);

  return {
    handleStartStop,
    handleTemplateChange,
    handleSaveTemplate
  };
}
