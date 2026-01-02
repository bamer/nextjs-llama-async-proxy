import { FormControl, InputLabel, Select, MenuItem, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { FieldDefinition } from "@/components/ui/ModelConfigDialog/types";
import type { TooltipContent } from "@/config/tooltip-config";
import { FieldWithTooltip } from "@/components/ui/FormTooltip";

interface SelectFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | undefined;
  tooltipContent: TooltipContent | undefined;
  onFieldChange: (name: string, value: unknown) => void;
}

export function SelectField({ field, value, error, tooltipContent, onFieldChange }: SelectFieldProps) {
  const theme = useTheme();

  const selectField = (
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
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 0.75 }}>
          {error}
        </Typography>
      )}
    </FormControl>
  );

  if (tooltipContent) {
    return <FieldWithTooltip content={tooltipContent}>{selectField}</FieldWithTooltip>;
  }

  return selectField;
}
