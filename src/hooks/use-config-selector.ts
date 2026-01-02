import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";
import { ConfigType } from "../components/ui/ModelConfigDialog";
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  DeveloperBoard as GpuIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Layers as LayersIcon,
  Image as ImageIcon,
} from "@mui/icons-material";

export type ConfigTypeColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "info"
  | "error";

export interface ConfigTypeData {
  type: ConfigType;
  label: string;
  Icon: typeof SpeedIcon;
  color: ConfigTypeColor;
}

export const useConfigSelector = () => {
  const theme = useTheme();

  const configTypeData = useMemo<ConfigTypeData[]>(
    () => [
      {
        type: "sampling",
        label: "Sampling",
        Icon: SpeedIcon,
        color: "primary",
      },
      {
        type: "memory",
        label: "Memory",
        Icon: MemoryIcon,
        color: "success",
      },
      {
        type: "gpu",
        label: "GPU",
        Icon: GpuIcon,
        color: "info",
      },
      {
        type: "advanced",
        label: "Advanced",
        Icon: SettingsIcon,
        color: "warning",
      },
      {
        type: "lora",
        label: "LoRA",
        Icon: TuneIcon,
        color: "secondary",
      },
      {
        type: "multimodal",
        label: "Multimodal",
        Icon: ImageIcon,
        color: "error",
      },
    ],
    []
  );

  const getTabSx = () => ({
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
  });

  const getTabChipSx = (color: ConfigTypeColor) => ({
    height: 18,
    minHeight: 18,
    fontSize: "0.65rem",
    fontWeight: 600,
    backgroundColor: theme.palette[color].light,
    color: theme.palette[color].dark,
    ml: 0.5,
  });

  const getContainerSx = () => ({
    display: "flex",
    flexDirection: "column",
    gap: 1,
    p: 2,
    backgroundColor: theme.palette.mode === "dark" ? "grey.800" : "grey.100",
    borderRadius: 1,
  });

  return {
    configTypeData,
    getTabSx,
    getTabChipSx,
    getContainerSx,
  };
};
