"use client";

import { Grid } from "@mui/material";
import { ModelCard } from "./ModelCard";

interface ModelsGridProps {
  models: import("@/types").ModelConfig[];
  isDark: boolean;
  loading: string | null;
  analyzingModelId: string | null;
  onMenuClick: (event: React.MouseEvent<HTMLElement>, modelId: string) => void;
  onConfigure: (model: import("../types").ModelData) => void;
  onStart: (modelId: string) => void;
  onStop: (modelId: string) => void;
  onAnalyze: (modelName: string) => void;
}

export function ModelsGrid({
  models,
  isDark,
  loading,
  analyzingModelId,
  onMenuClick,
  onConfigure,
  onStart,
  onStop,
  onAnalyze,
}: ModelsGridProps) {
  return (
    <Grid container spacing={3}>
      {models.map((model) => (
        <Grid key={model.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <ModelCard
            model={model}
            isDark={isDark}
            loading={loading}
            analyzingModelId={analyzingModelId}
            onMenuClick={onMenuClick}
            onConfigure={onConfigure}
            onStart={onStart}
            onStop={onStop}
            onAnalyze={onAnalyze}
          />
        </Grid>
      ))}
    </Grid>
  );
}
