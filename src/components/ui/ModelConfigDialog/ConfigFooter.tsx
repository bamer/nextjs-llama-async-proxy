import { Grid } from "@mui/material";

interface FieldDefinition {
  name: string;
  type: string;
  label: string;
  defaultValue?: unknown;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
  unit?: string;
  options?: string[];
}

interface ConfigFooterProps {
  sectionFields: FieldDefinition[];
  editedConfig: Record<string, unknown>;
  errors: Record<string, string>;
  sliderMode: Record<string, boolean>;
  onFieldChange: (name: string, value: unknown) => void;
  onToggleSlider: (fieldName: string) => void;
  validationRules?: Record<string, { min?: number; max?: number }>;
}

export function ConfigFooter({
  sectionFields,
  editedConfig,
  errors,
  sliderMode,
  onFieldChange,
  onToggleSlider,
  validationRules,
}: ConfigFooterProps) {
  return (
    <Grid container spacing={2}>
      {sectionFields.map((field) => (
        <Grid
          key={field.name}
          size={{
            xs: field.xs || 12,
            sm: field.sm || 6,
            md: field.md || 6,
            lg: field.lg || 4,
          }}
        >
          <ConfigField
            field={field}
            value={editedConfig[field.name] ?? field.defaultValue}
            error={errors[field.name]}
            tooltipContent={undefined}
            useSlider={field.type === "number" && sliderMode[field.name]}
            onFieldChange={onFieldChange}
            onToggleSlider={onToggleSlider}
            validationRules={validationRules || {}}
          />
        </Grid>
      ))}
    </Grid>
  );
}

function ConfigField(_props: any) {
  return null;
}

