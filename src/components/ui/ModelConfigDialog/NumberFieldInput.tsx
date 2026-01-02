import { TextField, IconButton, Typography } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import type { FieldDefinition } from "@/components/ui/ModelConfigDialog/types";

interface NumberFieldInputProps {
  field: FieldDefinition;
  value: unknown;
  error: string | undefined;
  onFieldChange: (name: string, value: unknown) => void;
  onToggleSlider: (fieldName: string) => void;
}

export function NumberFieldInput({ field, value, error, onFieldChange, onToggleSlider }: NumberFieldInputProps) {
  const theme = useTheme();

  return (
    <TextField
      fullWidth
      size="small"
      label={field.label}
      type="number"
      value={value}
      onChange={(e) => onFieldChange(field.name, Number.parseFloat(e.target.value) || 0)}
      variant="outlined"
      error={Boolean(error)}
      helperText={error}
      InputProps={{
        endAdornment: field.unit ? (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            {field.unit}
          </Typography>
        ) : field.step !== undefined ? (
          <IconButton
            size="small"
            onClick={() => onToggleSlider(field.name)}
            aria-label={`Switch to slider for ${field.label}`}
          >
            <Edit sx={{ fontSize: 16 }} />
          </IconButton>
        ) : undefined,
      }}
      sx={{
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: theme.palette.primary.main,
        },
      }}
    />
  );
}
