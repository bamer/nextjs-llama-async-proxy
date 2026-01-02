import { Box, Typography, IconButton, Slider } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import type { FieldDefinition } from "@/components/ui/ModelConfigDialog/types";
import { formatValue } from "@/components/ui/ModelConfigDialog/utils";

interface NumberFieldSliderProps {
  field: FieldDefinition;
  value: unknown;
  error: string | undefined;
  onFieldChange: (name: string, value: unknown) => void;
  onToggleSlider: (fieldName: string) => void;
  validationRules?: Record<string, { min?: number; max?: number }>;
}

export function NumberFieldSlider({
  field,
  value,
  error,
  onFieldChange,
  onToggleSlider,
  validationRules = {},
}: NumberFieldSliderProps) {
  const theme = useTheme();

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {field.label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: error ? theme.palette.error.main : theme.palette.primary.main,
            }}
          >
            {formatValue(value, field.unit)}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onToggleSlider(field.name)}
            aria-label={`Switch to input for ${field.label}`}
            sx={{ padding: 0.5 }}
          >
            <Edit sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
      <Slider
        value={Number(value)}
        onChange={(_event: Event, newValue: number | number[]) => onFieldChange(field.name, newValue)}
        step={field.step ?? 1}
        min={validationRules[field.name]?.min ?? 0}
        max={validationRules[field.name]?.max ?? 100}
        marks={field.marks ?? []}
        valueLabelDisplay="off"
        sx={{
          mb: 0.5,
          "& .MuiSlider-thumb": {
            "&:hover, &.Mui-focusVisible": {
              boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`,
            },
          },
        }}
      />
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
