"use client";

import { Box, Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

type ConfigType = string;

interface SectionGroup {
  title: string;
  icon: React.ReactNode;
  fields: string[];
}

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
  isExpanded,
  onToggle,
}: ConfigSectionProps) => {
  const theme = useTheme();

  const sectionFields: FieldDefinition[] = [];

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
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2 }}>
      </AccordionDetails>
    </Accordion>
  );
};
