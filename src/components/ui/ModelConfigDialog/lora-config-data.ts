"use client";
import React from "react";
import {
  Layers as LayersIcon,
  Tune as TuneIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import type { SectionGroup, FieldDefinition } from "@/components/ui/ModelConfigDialog/types";

// Create icon elements factory
type IconComponentType = React.ComponentType<any>;
const createIcon = (IconComponent: IconComponentType): React.ReactElement =>
  React.createElement(IconComponent);

// Section groups for LoRA configuration
export const loraSectionGroups: SectionGroup[] = [
  {
    title: "Adaptateurs LoRA",
    icon: createIcon(LayersIcon),
    fields: ["lora", "lora_scaled"],
  },
  {
    title: "Vecteurs de Contrôle",
    icon: createIcon(TuneIcon),
    fields: [
      "control_vector",
      "control_vector_scaled",
      "control_vector_layer_range",
    ],
  },
  {
    title: "Décodage Spéculatif",
    icon: createIcon(SpeedIcon),
    fields: [
      "model_draft",
      "model_url_draft",
      "ctx_size_draft",
      "threads_draft",
      "threads_batch_draft",
      "draft_max",
      "draft_min",
      "draft_p_min",
    ],
  },
  {
    title: "Cache du Modèle de Brouillon",
    icon: createIcon(MemoryIcon),
    fields: [
      "cache_type_k_draft",
      "cache_type_v_draft",
      "cpu_moe_draft",
      "n_cpu_moe_draft",
      "n_gpu_layers_draft",
      "device_draft",
    ],
  },
  {
    title: "Options de Décodage Spéculatif",
    icon: createIcon(SettingsIcon),
    fields: ["spec_replace"],
  },
];

// Validation rules for LoRA fields
export const loraValidationRules: Record<string, { min: number; max: number; required: boolean }> = {
  n_cpu_moe_draft: { min: 0, max: 32, required: false },
  n_gpu_layers_draft: { min: -1, max: 1000, required: false },
  ctx_size_draft: { min: 512, max: 16384, required: false },
  draft_max: { min: 1, max: 64, required: false },
  draft_min: { min: 1, max: 32, required: false },
  draft_p_min: { min: 0, max: 0.5, required: false },
};

// Field definitions for LoRA configuration
export const loraConfigFields: FieldDefinition[] = [
  { name: "lora", label: "LoRA", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "lora_scaled", label: "LoRA Mis à l'Échelle", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "control_vector", label: "Vecteur de Contrôle", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "control_vector_scaled", label: "Vecteur de Contrôle Mis à l'Échelle", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "control_vector_layer_range", label: "Plage de Couches Vecteur de Contrôle", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "model_draft", label: "Modèle de Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "model_url_draft", label: "URL du Modèle de Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
  {
    name: "ctx_size_draft",
    label: "Taille du Contexte de Brouillon",
    type: "number",
    defaultValue: 0,
    xs: 12,
    sm: 6,
    unit: "tokens",
    step: 1,
  },
  { name: "threads_draft", label: "Threads de Brouillon", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
  { name: "threads_batch_draft", label: "Threads par Lot de Brouillon", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 1 },
  { name: "draft_max", label: "Brouillon Maximum", type: "number", defaultValue: 16, xs: 12, sm: 6, unit: "tokens", step: 1 },
  { name: "draft_min", label: "Brouillon Minimum", type: "number", defaultValue: 5, xs: 12, sm: 6, unit: "tokens", step: 1 },
  { name: "draft_p_min", label: "P Min de Brouillon", type: "number", defaultValue: 0.05, xs: 12, sm: 6, unit: "", step: 0.01 },
  { name: "cache_type_k_draft", label: "Type de Cache K Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "cache_type_v_draft", label: "Type de Cache V Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "cpu_moe_draft", label: "CPU MoE Brouillon", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
  { name: "n_cpu_moe_draft", label: "N CPU MoE Brouillon", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
  {
    name: "n_gpu_layers_draft",
    label: "N Couches GPU Brouillon",
    type: "number",
    defaultValue: -1,
    xs: 12,
    sm: 6,
    unit: "couches",
    step: 1,
  },
  { name: "device_draft", label: "Périphérique Brouillon", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "spec_replace", label: "Remplacement Spéculatif", type: "text", defaultValue: "", xs: 12, sm: 6 },
];
