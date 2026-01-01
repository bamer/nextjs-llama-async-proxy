"use client";

import { Box, Grid, Typography, Accordion, AccordionSummary, AccordionDetails, Chip, IconButton, Slider, TextField, Switch, FormControl, FormControlLabel, Select, MenuItem, InputLabel } from "@mui/material";
import { ExpandMore, Edit } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import type { ConfigType, FieldDefinition, SectionGroup } from "./types";
import { configFields, validationRules } from "./config-data";
import { formatValue } from "./utils";
import { getTooltipContent, TooltipContent as TooltipContentType } from "@/config/tooltip-config";
import { FieldWithTooltip } from "../FormTooltip";

interface ConfigSectionProps {
  section: SectionGroup;
  configType: ConfigType;
  editedConfig: Record<string, unknown>;
  errors: Record<string, string>;
  sliderMode: Record<string, boolean>;
  isExpanded: boolean;
  onToggle: () => void;
  onFieldChange: (name: string, value: unknown) => void;
  onToggleSlider: (fieldName: string) => void;
}

export const ConfigSection = ({
  section,
  configType,
  editedConfig,
  errors,
  sliderMode,
  isExpanded,
  onToggle,
  onFieldChange,
  onToggleSlider,
}: ConfigSectionProps) => {
  const theme = useTheme();
  const sectionFields = section.fields
    .map((fieldName) => configFields[configType].find((f) => f.name === fieldName))
    .filter(Boolean) as FieldDefinition[];

  const renderField = (field: FieldDefinition) => {
    const value = editedConfig[field.name] ?? field.defaultValue;
    const error = errors[field.name];
    const tooltipContent = getTooltipContent(configType, field.name) as TooltipContentType;
    const useSlider = field.type === "number" && sliderMode[field.name];

    switch (field.type) {
      case "text":
        return (
          <FieldWithTooltip content={tooltipContent}>
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
          </FieldWithTooltip>
        );

      case "number":
        return (
          <FieldWithTooltip content={tooltipContent!}>
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
                    onChange={(_event, newValue) => onFieldChange(field.name, newValue)}
                    step={field.step}
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
              )}
            </Box>
          </FieldWithTooltip>
        );

      case "select":
        return (
          <FieldWithTooltip content={tooltipContent!}>
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
          </FieldWithTooltip>
        );

      case "boolean":
        return (
          <FieldWithTooltip content={tooltipContent!}>
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
          </FieldWithTooltip>
        );

      default:
        return null;
    }
  };

  return (
    <Accordion
      expanded={isExpanded}
      onChange={onToggle}
      elevation={0}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        mb: 1,
        "&:before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          minHeight: 56,
          "& .MuiAccordionSummary-content": {
            margin: "12px 0",
            fontWeight: 600,
          },
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              color: "primary.main",
              display: "flex",
              alignItems: "center",
            }}
          >
            {section.icon}
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {section.title}
          </Typography>
          <Chip
            label={sectionFields.length}
            size="small"
            sx={{
              ml: 1,
              height: 20,
              fontSize: "0.75rem",
              backgroundColor: "primary.main",
              color: "primary.contrastText",
            }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>
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
              {renderField(field)}
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};
