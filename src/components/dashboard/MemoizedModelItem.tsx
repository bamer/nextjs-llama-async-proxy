"use client";

import { memo } from "react";
import { LinearProgress } from "@mui/material";
import { useModelItemHandlers, type ModelConfig } from "./hooks/useModelItemHandlers";
import { modelItemMemoComparison } from "./utils/modelItemMemoComparison";
import { useModelItemDisplay } from "@/hooks/useModelItemDisplay";
import { ModelActions } from "./model-item/ModelActions";
import { ModelTemplateSelect } from "./model-item/ModelTemplateSelect";
import { ModelContent } from "./model-item/ModelContent";

// Re-export utilities for backward compatibility
export { detectModelType } from "./model-item-utils";
export { getModelTypeTemplates } from "./model-utils";

export type { ModelConfig };

export interface MemoizedModelItemProps {
  model: ModelConfig;
  isDark: boolean;
  currentTemplate: string;
  loadingModels: Record<string, boolean>;
  setLoadingModels: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedTemplates: Record<string, string>;
  onSaveTemplate: (modelName: string, template: string | null) => void;
  onSaveTemplateToConfig: (modelName: string, template: string) => void;
  onToggleModel: (modelId: string) => void;
  onToggleModelOptimistic?: (modelId: string, status: string) => void;
  optimisticStatus?: string;
}

const MemoizedModelItem = memo(function ModelItem({
  model,
  isDark,
  currentTemplate,
  loadingModels,
  setLoadingModels,
  selectedTemplates,
  onSaveTemplate,
  onSaveTemplateToConfig,
  onToggleModel,
  onToggleModelOptimistic,
  optimisticStatus
}: MemoizedModelItemProps) {
  const { displayStatus, displayStatusColor, showProgress, statusValue } = useModelItemDisplay({
    model,
    ...(optimisticStatus ? { optimisticStatus } : {}),
  });

  const { handleStartStop, handleTemplateChange, handleSaveTemplate } =
    useModelItemHandlers({
      model,
      loadingModels,
      setLoadingModels,
      selectedTemplates,
      currentTemplate,
      onSaveTemplate,
      onSaveTemplateToConfig,
      onToggleModel,
      onToggleModelOptimistic,
    });

  const progressElement = showProgress ? (
    <LinearProgress
      variant="determinate"
      value={model.progress ?? 0}
      sx={{ height: 4, borderRadius: 2, mb: 1 }}
    />
  ) : undefined;

  const templateSelectElement = (
    <ModelTemplateSelect
      model={model}
      currentTemplate={currentTemplate}
      handleTemplateChange={handleTemplateChange}
      displayStatus={statusValue}
    />
  );

  const actionsElement = (
    <ModelActions
      displayStatus={statusValue}
      loadingModels={loadingModels}
      model={model}
      currentTemplate={currentTemplate}
      onStartStop={handleStartStop}
      handleSaveTemplate={handleSaveTemplate}
    />
  );

  return (
    <ModelContent
      model={model}
      isDark={isDark}
      displayStatus={displayStatus}
      displayStatusColor={displayStatusColor}
      progressElement={progressElement}
      templateSelectElement={templateSelectElement}
      actionsElement={actionsElement}
    />
  );
}, modelItemMemoComparison);

MemoizedModelItem.displayName = 'MemoizedModelItem';

export { MemoizedModelItem };
