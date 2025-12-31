"use client";

import React, { memo, useCallback } from "react";
import { Box, Grid, LinearProgress } from "@mui/material";
import { ModelStatusBadge } from "./ModelStatusBadge";
import { ModelActions } from "./ModelActions";
import { ModelTypeChip } from "./ModelTypeChip";
import { ModelTemplateSelector } from "./ModelTemplateSelector";
import { toggleModel } from "./model-utils";
import type { ModelConfig } from "@/types";

export interface ModelItemProps {
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

const getCardStyles = (isDark: boolean) => ({
  p: 2,
  borderRadius: 2,
  background: isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.8)",
  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: isDark ? "0 8px 30px rgba(0, 0, 0, 0.3)" : "0 8px 30px rgba(0, 0, 0, 0.1)"
  }
});

const ModelItem: React.FC<ModelItemProps> = ({
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
  }) => {
  const rawStatus = optimisticStatus || model.status;
  const displayStatus: "idle" | "loading" | "running" | "error" =
    rawStatus === "stopped" ? "idle" : (rawStatus as "idle" | "loading" | "running" | "error");
  const isRunning = displayStatus === "running";

  const handleToggleModel = useCallback(async () => {
    if (loadingModels[model.id]) return;

    setLoadingModels(prev => ({ ...prev, [model.id]: true }));

    const optimisticNewStatus = model.status === "running" ? "stopped" : "loading";
    const originalStatus = model.status;
    const selectedTemplate = selectedTemplates[model.name] || model.template;

    onToggleModelOptimistic?.(model.id, optimisticNewStatus);

    try {
      await toggleModel(model.name, model.status, selectedTemplate);
      onToggleModel(model.id);
    } catch (error) {
      onToggleModelOptimistic?.(model.id, originalStatus);
      console.error("Failed to toggle model:", error);
      alert(error instanceof Error ? error.message : "Failed to start model");
    } finally {
      setLoadingModels(prev => ({ ...prev, [model.id]: false }));
    }
  }, [
    model.id,
    model.name,
    model.status,
    loadingModels,
    selectedTemplates,
    setLoadingModels,
    onToggleModel,
    onToggleModelOptimistic
  ]);

  const handleTemplateChange = useCallback(
    (template: string) => {
      onSaveTemplate(model.name, template);
    },
    [model.name, onSaveTemplate]
  );

  const handleSaveTemplate = useCallback(() => {
    onSaveTemplateToConfig(model.name, currentTemplate);
  }, [model.name, currentTemplate, onSaveTemplateToConfig]);

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={model.id}>
      <Box sx={getCardStyles(isDark)}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ModelTypeChip modelType={model.type} />
            <Box component="span" sx={{ typography: "subtitle2", fontWeight: "bold" }}>
              {model.name}
            </Box>
          </Box>
          <ModelStatusBadge
            status={displayStatus}
            size="small"
            {...(model.progress !== undefined ? { progress: model.progress } : {})}
          />
        </Box>

        {displayStatus === "loading" && model.progress !== undefined && (
          <LinearProgress variant="determinate" value={model.progress} sx={{ height: 4, borderRadius: 2, mb: 1 }} />
        )}

        {model.availableTemplates && model.availableTemplates.length > 0 && !isRunning && (
          <ModelTemplateSelector
            availableTemplates={model.availableTemplates}
            currentTemplate={currentTemplate}
            onChange={handleTemplateChange}
          />
        )}

        <ModelActions
          status={displayStatus}
          loading={loadingModels[model.id] || false}
          isRunning={isRunning}
          templateAvailable={Boolean(model.availableTemplates && model.availableTemplates.length > 0)}
          currentTemplate={currentTemplate}
          onToggleModel={handleToggleModel}
          onSaveTemplate={handleSaveTemplate}
        />
      </Box>
    </Grid>
  );
};

const MemoizedModelItem = memo(ModelItem);

MemoizedModelItem.displayName = "MemoizedModelItem";

export { MemoizedModelItem };
