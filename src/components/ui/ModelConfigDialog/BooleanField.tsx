import { FormControlLabel, Switch, Typography } from "@mui/material";
import type { FieldDefinition } from "@/components/ui/ModelConfigDialog/types";
import type { TooltipContent } from "@/config/tooltip-config";
import { FieldWithTooltip } from "@/components/ui/FormTooltip";

interface BooleanFieldProps {
  field: FieldDefinition;
  value: unknown;
  tooltipContent: TooltipContent | undefined;
  onFieldChange: (name: string, value: unknown) => void;
}

export function BooleanField({ field, value, tooltipContent, onFieldChange }: BooleanFieldProps) {
  const switchControl = (
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
  );

  if (tooltipContent) {
    return <FieldWithTooltip content={tooltipContent}>{switchControl}</FieldWithTooltip>;
  }

  return switchControl;
}
