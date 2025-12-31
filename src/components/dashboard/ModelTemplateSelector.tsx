"use client";

import React from "react";
import { FormControl, MenuItem, Select, InputLabel } from "@mui/material";

export interface ModelTemplateSelectorProps {
  availableTemplates: string[];
  currentTemplate: string;
  onChange: (template: string) => void;
}

export const ModelTemplateSelector: React.FC<ModelTemplateSelectorProps> = ({
  availableTemplates,
  currentTemplate,
  onChange
}) => {
  return (
    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
      <InputLabel>Template</InputLabel>
      <Select value={currentTemplate} onChange={e => onChange(e.target.value as string)} size="small">
        <MenuItem value="">
          <em>Default</em>
        </MenuItem>
        {availableTemplates.map(template => (
          <MenuItem key={template} value={template}>
            {template}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
