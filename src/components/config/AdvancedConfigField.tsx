"use client";

import { Box, Typography, IconButton, TextField, Slider } from "@mui/material";
import { Edit } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import type { FieldDefinition } from "../ui/ModelConfigDialog/types";
import { FieldWithTooltip } from "../ui/FormTooltip";
import type { TooltipContent as TooltipContentType } from "@/config/tooltip-config";

interface AdvancedConfigFieldProps {
  field: FieldDefinition;
  value: unknown;
  error: string | boolean | undefined;
  tooltipContent: TooltipContentType | undefined | null;
  useSlider: boolean;
  onFieldChange: (name: string, value: unknown) => void;
  onToggleSlider: (fieldName: string) => void;
  validationRules?: {
    min?: number;
    max?: number;
  };
  formatValue: (value: unknown, unit?: string) => string;
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

export const AdvancedConfigField = ({
  field,
  value,
  error,
  tooltipContent,
  useSlider,
  onFieldChange,
  onToggleSlider,
  validationRules,
  formatValue,
}: AdvancedConfigFieldProps) => {
  const theme = useTheme();
  const min = validationRules?.min ?? 0;
  const max = validationRules?.max ?? 100;

  const renderNumberField = () => (
    <ConditionalFieldWithTooltip tooltipContent={tooltipContent}>
      <Box>
        {useSlider && field.step !== undefined ? (
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
              step={field.step}
              min={min}
              max={max}
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
            {typeof error === "string" && error && (
              <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                {error}
              </Typography>
            )}
          </Box>
        ) : (
          <TextField
            fullWidth
            size="small"
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => onFieldChange(field.name, Number.parseFloat(e.target.value) || 0)}
            variant="outlined"
            error={Boolean(error)}
            helperText={typeof error === "string" ? error : undefined}
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
        )}
      </Box>
    </ConditionalFieldWithTooltip>
  );

  if (field.type === "number") {
    return renderNumberField();
  }

  return null;
};
