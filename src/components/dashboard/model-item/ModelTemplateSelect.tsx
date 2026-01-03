"use client";

import { memo } from "react";
import { MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import type { ModelConfig } from "../hooks/useModelItemHandlers";

export interface ModelTemplateSelectProps {
  model: ModelConfig;
  currentTemplate: string;
  handleTemplateChange: (e: { target: { value: string } }) => void;
  displayStatus: string;
}

export const ModelTemplateSelect = memo(({
  model,
  currentTemplate,
  handleTemplateChange,
  displayStatus,
}: ModelTemplateSelectProps) => {
  if (!model.availableTemplates || model.availableTemplates.length === 0 ||
      displayStatus === 'running') {
    return null;
  }

  const templateSelectId = `${model.name}-template-select`;

  return (
    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
      <InputLabel htmlFor={templateSelectId}>Template</InputLabel>
      <Select
        id={templateSelectId}
        value={currentTemplate}
        onChange={handleTemplateChange}
        label="Template"
        size="small"
      >
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
  );
});

ModelTemplateSelect.displayName = 'ModelTemplateSelect';
