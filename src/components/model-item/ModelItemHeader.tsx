"use client";

import { Chip, Typography, Box } from "@mui/material";
import type { ModelConfig } from "@/types/dashboard-model-config";

interface ModelItemHeaderProps {
  model: ModelConfig;
  displayStatusLabel: string;
  displayStatusColor: "default" | "error" | "primary" | "secondary" | "info" | "success" | "warning";
}

export const detectModelType = (modelName: string): "llama" | "mistral" | "other" => {
  const nameLower = modelName.toLowerCase();
  if (
    nameLower.includes("llama") ||
    nameLower.includes("codellama") ||
    nameLower.includes("gemma") ||
    nameLower.includes("granite")
  ) {
    return "llama";
  }
  if (
    nameLower.includes("mistral") ||
    nameLower.includes("qwen") ||
    nameLower.includes("nemotron") ||
    nameLower.includes("magnus") ||
    nameLower.includes("fluently")
  ) {
    return "mistral";
  }
  return "other";
};

export const ModelItemHeader = ({ model, displayStatusLabel, displayStatusColor }: ModelItemHeaderProps) => {
  const modelType = detectModelType(model.name);

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Chip
          label={modelType.toUpperCase()}
          color={modelType === "llama" ? "success" : modelType === "mistral" ? "primary" : "default"}
          size="small"
          sx={{ fontWeight: 600 }}
        />
        <Typography variant="subtitle2" fontWeight="bold">
          {model.name}
        </Typography>
      </Box>
      <Chip label={displayStatusLabel} color={displayStatusColor} size="small" />
    </Box>
  );
};
