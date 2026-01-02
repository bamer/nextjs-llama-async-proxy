"use client";

import { Grid } from "@mui/material";
import { ConfigFields } from "@/components/ui/ConfigFields";
import { validationRules } from "./config-data";
import type { FieldDefinition, ConfigType } from "./types";
import type { TooltipContent as TooltipContentType } from "@/config/tooltip-config";

interface ConfigFormProps {
  fields: FieldDefinition[];
  editedConfig: Record<string, unknown>;
  errors: Record<string, boolean | string | undefined>;
  sliderMode: Record<string, boolean>;
  configType: ConfigType;
  onFieldChange: (name: string, value: unknown) => void;
  onToggleSlider: (fieldName: string) => void;
  formatValue: (value: unknown, unit?: string) => string;
  getTooltipContent: (configType: ConfigType, fieldName: string) => TooltipContentType | null;
}

export const ConfigForm = ({
  fields,
  editedConfig,
  errors,
  sliderMode,
  configType,
  onFieldChange,
  onToggleSlider,
  formatValue,
  getTooltipContent,
}: ConfigFormProps) => {
  return (
    <Grid container spacing={2}>
      {fields.map((field) => (
        <Grid
          key={field.name}
          size={{
            xs: field.xs || 12,
            sm: field.sm || 6,
            md: field.md || 6,
            lg: field.lg || 4,
          }}
        >
          <ConfigFields
            field={field}
            value={editedConfig[field.name] ?? field.defaultValue}
            error={errors[field.name]}
            tooltipContent={getTooltipContent(configType, field.name)}
            useSlider={field.type === "number" && sliderMode[field.name]}
            onFieldChange={onFieldChange}
            onToggleSlider={onToggleSlider}
            validationRules={validationRules[field.name]}
            formatValue={formatValue}
          />
        </Grid>
      ))}
    </Grid>
  );
};
