"use client";

import { Typography, TextField, Switch, FormControl, FormControlLabel, Select, MenuItem, InputLabel } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { FieldDefinition } from "../ui/ModelConfigDialog/types";
import { FieldWithTooltip } from "../ui/FormTooltip";
import type { TooltipContent as TooltipContentType } from "@/config/tooltip-config";

interface BasicConfigFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | boolean | undefined;
  tooltipContent: TooltipContentType | undefined | null;
  onFieldChange: (name: string, value: unknown) => void;
}

// Helper component to conditionally wrap with tooltip
const ConditionalFieldWithTooltip = ({
  tooltipContent,
  children,
}: {
  tooltipContent: TooltipContentType | undefined | null;
  children: React.ReactNode;
}) => {
  if (!tooltipContent) {
    return <>{children}</>;
  }
  return <FieldWithTooltip content={tooltipContent}>{children}</FieldWithTooltip>;
};

export const BasicConfigField = ({
  field,
  value,
  error,
  tooltipContent,
  onFieldChange,
}: BasicConfigFieldProps) => {
  const theme = useTheme();

  const renderTextField = () => (
    <ConditionalFieldWithTooltip tooltipContent={tooltipContent}>
      <TextField
        fullWidth
        size="small"
        label={field.label}
        value={value}
        onChange={(e) => onFieldChange(field.name, e.target.value)}
        variant="outlined"
        error={Boolean(error)}
        helperText={typeof error === "string" ? error : undefined}
        sx={{
          transition: "all 0.2s ease",
        }}
      />
    </ConditionalFieldWithTooltip>
  );

  const renderSelectField = () => (
    <ConditionalFieldWithTooltip tooltipContent={tooltipContent}>
      <FormControl fullWidth size="small" error={Boolean(error)}>
        <InputLabel>{field.label}</InputLabel>
        <Select
          label={field.label}
          value={value}
          onChange={(e) => onFieldChange(field.name, e.target.value)}
          aria-label={`Select ${field.label}`}
          sx={{
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          {field.options?.map((option: string) => (
            <MenuItem key={option} value={option}>
              {option || "None"}
            </MenuItem>
          ))}
        </Select>
        {typeof error === "string" && error && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 0.75 }}>
            {error}
          </Typography>
        )}
      </FormControl>
    </ConditionalFieldWithTooltip>
  );

  const renderBooleanField = () => (
    <ConditionalFieldWithTooltip tooltipContent={tooltipContent}>
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(value)}
            onChange={(e) => onFieldChange(field.name, e.target.checked)}
            aria-label={`Toggle ${field.label}`}
            sx={{
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {field.label}
          </Typography>
        }
      />
    </ConditionalFieldWithTooltip>
  );

  switch (field.type) {
    case "text":
      return renderTextField();
    case "select":
      return renderSelectField();
    case "boolean":
      return renderBooleanField();
    default:
      return null;
  }
};
