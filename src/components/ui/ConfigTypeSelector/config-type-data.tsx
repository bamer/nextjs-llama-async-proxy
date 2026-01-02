"use client";

import { Speed, Memory, DeveloperBoard, Settings, Tune, Image } from "@mui/icons-material";
import type { ConfigTypeData } from "./types";

export const configTypeData: ConfigTypeData[] = [
  {
    type: "sampling",
    label: "Sampling",
    icon: <Speed fontSize="small" />,
    color: "primary",
  },
  {
    type: "memory",
    label: "Memory",
    icon: <Memory fontSize="small" />,
    color: "success",
  },
  {
    type: "gpu",
    label: "GPU",
    icon: <DeveloperBoard fontSize="small" />,
    color: "info",
  },
  {
    type: "advanced",
    label: "Advanced",
    icon: <Settings fontSize="small" />,
    color: "warning",
  },
  {
    type: "lora",
    label: "LoRA",
    icon: <Tune fontSize="small" />,
    color: "secondary",
  },
  {
    type: "multimodal",
    label: "Multimodal",
    icon: <Image fontSize="small" />,
    color: "error",
  },
];
