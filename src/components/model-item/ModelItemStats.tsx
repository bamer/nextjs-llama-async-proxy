"use client";

import { LinearProgress, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import type { ModelConfig } from "@/types/dashboard-model-config";
import { getModelTemplatesSync } from "@/lib/client-model-templates";

interface ModelItemStatsProps {
  model: ModelConfig;
  displayStatus: string;
  currentTemplate: string;
  onTemplateChange: (e: { target: { value: string } }) => void;
}

export const getModelTypeTemplates = (modelType: "llama" | "mistral" | "other"): string[] => {
  const allTemplates = getModelTemplatesSync();
  const templateValues = Object.values(allTemplates) as string[];
  if (modelType === "other") {
    return templateValues;
  }
  return templateValues.filter((t) => {
    const template = t.toLowerCase();
    if (modelType === "llama") {
      return template.includes("llama") || template.includes("chat") || template.includes("instruct");
    }
    return template.includes("mistral");
  });
};

export const ModelItemStats = ({ model, displayStatus, currentTemplate, onTemplateChange }: ModelItemStatsProps) => {
  return (
    <>
      {displayStatus === "loading" && model.progress !== undefined && (
        <LinearProgress variant="determinate" value={model.progress} sx={{ height: 4, borderRadius: 2, mb: 1 }} />
      )}

      {model.availableTemplates && model.availableTemplates.length > 0 && displayStatus !== "running" && (
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>Template</InputLabel>
          <Select value={currentTemplate} onChange={onTemplateChange} size="small">
            <MenuItem value="">
              <em>Default</em>
            </MenuItem>
            {model.availableTemplates.map((template: string) => (
              <MenuItem key={template} value={template}>
                {template}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );
};
