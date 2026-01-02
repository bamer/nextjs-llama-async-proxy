"use client";

import React from "react";
import type { SvgIconTypeMap } from "@mui/material";
import {
  Memory as MemoryIcon,
  DeveloperBoard as GpuIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import type { ConfigType, SectionGroup } from "../../components/ui/ModelConfigDialog/types";

// Create icon elements factory
type IconComponentType = React.ComponentType<SvgIconTypeMap["props"]>;

const createIcon = (IconComponent: IconComponentType): React.ReactElement =>
  React.createElement(IconComponent);

// Basic configuration sections
export const basicSectionGroups: Partial<Record<ConfigType, SectionGroup[]>> = {
  memory: [
    {
      title: "Paramètres de Cache",
      icon: createIcon(MemoryIcon),
      fields: ["cache_ram", "cache_type_k", "cache_type_v"],
    },
    {
      title: "Gestion de la Mémoire",
      icon: createIcon(SettingsIcon),
      fields: ["mmap", "mlock", "numa", "defrag_thold"],
    },
  ],
  gpu: [
    {
      title: "Sélection de Périphérique",
      icon: createIcon(GpuIcon),
      fields: ["device", "list_devices"],
    },
    {
      title: "Configuration GPU",
      icon: createIcon(SettingsIcon),
      fields: ["gpu_layers", "split_mode", "tensor_split", "main_gpu", "kv_offload"],
    },
    {
      title: "Options de Performance",
      icon: createIcon(SpeedIcon),
      fields: ["repack", "no_host"],
    },
  ],
};
