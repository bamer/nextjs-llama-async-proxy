import { TextField } from "@mui/material";
import type { FieldDefinition } from "@/components/ui/ModelConfigDialog/types";
import type { TooltipContent } from "@/config/tooltip-config";
import { FieldWithTooltip } from "@/components/ui/FormTooltip";

interface TextFieldWithTooltipProps {
  field: FieldDefinition;
  value: unknown;
  error: string | undefined;
  tooltipContent: TooltipContent | undefined;
  onFieldChange: (name: string, value: unknown) => void;
}

export function TextFieldWithTooltipWrapper({
  field,
  value,
  error,
  tooltipContent,
  onFieldChange,
}: TextFieldWithTooltipProps) {
  const textField = (
    <TextField
      fullWidth
      size="small"
      label={field.label}
      value={value}
      onChange={(e) => onFieldChange(field.name, e.target.value)}
      variant="outlined"
      error={Boolean(error)}
      helperText={error}
      sx={{
        transition: "all 0.2s ease",
      }}
    />
  );

  if (tooltipContent) {
    return <FieldWithTooltip content={tooltipContent}>{textField}</FieldWithTooltip>;
  }

  return textField;
}
