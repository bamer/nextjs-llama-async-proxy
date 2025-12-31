"use client";

import { Box, Tab, Tabs, Chip, Typography } from "@mui/material";
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  DeveloperBoard as GpuIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Layers as LayersIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { memo } from "react";
import { ConfigType } from "./ModelConfigDialog";
import { useTheme } from "@mui/material/styles";

interface ConfigTypeSelectorProps {
  selectedType: ConfigType | null;
  onSelect: (type: ConfigType) => void;
  counts?: Record<ConfigType, number>;
  compact?: boolean;
}

const configTypeData: {
  type: ConfigType;
  label: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "success" | "warning" | "info" | "error";
}[] = [
  {
    type: "sampling",
    label: "Sampling",
    icon: <SpeedIcon fontSize="small" />,
    color: "primary",
  },
  {
    type: "memory",
    label: "Memory",
    icon: <MemoryIcon fontSize="small" />,
    color: "success",
  },
  {
    type: "gpu",
    label: "GPU",
    icon: <GpuIcon fontSize="small" />,
    color: "info",
  },
  {
    type: "advanced",
    label: "Advanced",
    icon: <SettingsIcon fontSize="small" />,
    color: "warning",
  },
  {
    type: "lora",
    label: "LoRA",
    icon: <TuneIcon fontSize="small" />,
    color: "secondary",
  },
  {
    type: "multimodal",
    label: "Multimodal",
    icon: <ImageIcon fontSize="small" />,
    color: "error",
  },
];

const ConfigTypeSelector = memo(({
  selectedType,
  onSelect,
  counts,
  compact = false,
}: ConfigTypeSelectorProps) => {
  const theme = useTheme();

  if (compact) {
    // Compact horizontal tabs for sidebar header
    return (
      <Tabs
        value={selectedType || false}
        onChange={(_e, newValue) => onSelect(newValue as ConfigType)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 48,
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
          "& .MuiTab-root": {
            minHeight: 48,
            padding: "6px 16px",
            fontSize: "0.875rem",
            fontWeight: 500,
            textTransform: "none",
          },
        }}
      >
        {configTypeData.map(({ type, label, icon, color }) => (
          <Tab
            key={type}
            value={type}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    color: (selectedType === type ? theme.palette[color].dark : theme.palette.text.secondary) + "!important",
                  }}
                >
                  {icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: selectedType === type ? 600 : 500,
                  }}
                >
                  {label}
                </Typography>
                {counts && counts[type] > 0 && (
                  <Chip
                    label={counts[type]}
                    size="small"
                    sx={{
                      height: 18,
                      minHeight: 18,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      backgroundColor: theme.palette[color].light,
                      color: theme.palette[color].dark,
                      ml: 0.5,
                    }}
                  />
                )}
              </Box>
            }
            value={type}
          />
        ))}
      </Tabs>
    );
  }

  // Full vertical layout for standalone use
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        backgroundColor: theme.palette.mode === "dark" ? "grey.800" : "grey.100",
        borderRadius: 1,
      }}
    >
      {configTypeData.map(({ type, label, icon, color }) => (
        <Box
          key={type}
          onClick={() => onSelect(type)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            p: 1.5,
            borderRadius: 1,
            cursor: "pointer",
            backgroundColor: selectedType === type ? theme.palette[color].main + "15" : "transparent",
            border: `1px solid ${
              selectedType === type
                ? theme.palette[color].main
                : theme.palette.divider
            }`,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: theme.palette[color].main + "10",
              transform: "translateX(4px)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 1,
                backgroundColor:
                  selectedType === type ? theme.palette[color].main : theme.palette.mode === "dark" ? "grey.700" : "grey.200",
                color: selectedType === type ? theme.palette[color].contrastText : theme.palette.text.primary,
                transition: "all 0.2s ease",
              }}
            >
              {icon}
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: selectedType === type ? 600 : 400,
                color: selectedType === type ? theme.palette[color].main : theme.palette.text.primary,
              }}
            >
              {label}
            </Typography>
          </Box>
          {counts && counts[type] > 0 && (
            <Chip
              label={counts[type]}
              size="small"
              sx={{
                height: 22,
                minHeight: 22,
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: theme.palette[color].light,
                color: theme.palette[color].dark,
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
});

ConfigTypeSelector.displayName = "ConfigTypeSelector";

export default ConfigTypeSelector;
