"use client";
import React from "react";
import { Image as ImageIcon, Settings as SettingsIcon } from "@mui/icons-material";
import type { SectionGroup, FieldDefinition } from "@/components/ui/ModelConfigDialog/types";

// Create icon elements factory
type IconComponentType = React.ComponentType<any>;
const createIcon = (IconComponent: IconComponentType): React.ReactElement =>
  React.createElement(IconComponent);

// Section groups for multimodal configuration
export const multimodalSectionGroups: SectionGroup[] = [
  {
    title: "Projection Visuelle",
    icon: createIcon(ImageIcon),
    fields: ["mmproj", "mmproj_url", "mmproj_auto", "mmproj_offload"],
  },
  {
    title: "Traitement d'Images",
    icon: createIcon(SettingsIcon),
    fields: ["image_min_tokens", "image_max_tokens"],
  },
];

// Validation rules for multimodal fields
export const multimodalValidationRules: Record<string, { min: number; max: number; required: boolean }> = {
  image_min_tokens: { min: 0, max: 8192, required: false },
  image_max_tokens: { min: 0, max: 8192, required: false },
};

// Field definitions for multimodal configuration
export const multimodalConfigFields: FieldDefinition[] = [
  { name: "mmproj", label: "Projecteur Multimodal", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "mmproj_url", label: "URL du Projecteur Multimodal", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "mmproj_auto", label: "Détection Auto MMPROJ", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "mmproj_offload", label: "Déchargement MMPROJ", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "image_min_tokens", label: "Tokens Min d'Image", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
  { name: "image_max_tokens", label: "Tokens Max d'Image", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
];
