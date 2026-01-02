"use client";
import React from "react";
import {
  Settings as SettingsIcon,
  DeveloperBoard as GpuIcon,
  Tune as TuneIcon,
  Layers as LayersIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import type { ConfigType, FieldDefinition, SectionGroup } from "@/components/ui/ModelConfigDialog/types";

// Create icon elements factory
type IconComponentType = React.ComponentType<any>;
const createIcon = (IconComponent: IconComponentType): React.ReactElement =>
  React.createElement(IconComponent);

// Section groups for advanced configuration
export const advancedSectionGroups: SectionGroup[] = [
  {
    title: "Comportement du Modèle",
    icon: createIcon(SettingsIcon),
    fields: [
      "swa_full",
      "override_tensor",
      "cpu_moe",
      "n_cpu_moe",
      "kv_unified",
      "pooling",
      "context_shift",
    ],
  },
  {
    title: "Calcul Distribué",
    icon: createIcon(GpuIcon),
    fields: ["rpc", "offline", "override_kv", "op_offload"],
  },
  {
    title: "Ajustement du Modèle",
    icon: createIcon(TuneIcon),
    fields: ["fit", "fit_target", "fit_ctx", "check_tensors"],
  },
  {
    title: "Gestion des Ressources",
    icon: createIcon(MemoryIcon),
    fields: ["sleep_idle_seconds", "polling", "polling_batch"],
  },
  {
    title: "Raisonnement",
    icon: createIcon(LayersIcon),
    fields: ["reasoning_format_value_format", "reasoning_budget", "custom_params"],
  },
];

// Validation rules for advanced fields
export const advancedValidationRules: Record<string, { min: number; max: number; required: boolean }> = {
  n_cpu_moe: { min: 0, max: 64, required: false },
  fit_target: { min: 0, max: 100, required: false },
  fit_ctx: { min: 0, max: 32768, required: false },
  sleep_idle_seconds: { min: 0, max: 3600, required: false },
  reasoning_budget: { min: 0, max: 8192, required: false },
};

// Field definitions for advanced configuration
export const advancedConfigFields: FieldDefinition[] = [
  { name: "swa_full", label: "SWA Complet", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "override_tensor", label: "Surcharger Tenseur", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "cpu_moe", label: "CPU MoE", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "n_cpu_moe", label: "N CPU MoE", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
  { name: "kv_unified", label: "KV Unifié", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "pooling", label: "Mise en Commun", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "context_shift", label: "Décalage de Contexte", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "rpc", label: "RPC", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "offline", label: "Mode Hors Ligne", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "override_kv", label: "Surcharger KV", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "op_offload", label: "Déchargement Op", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "fit", label: "Ajuster", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "fit_target", label: "Cible d'Ajustement", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
  { name: "fit_ctx", label: "Contexte d'Ajustement", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
  { name: "check_tensors", label: "Vérifier Tenseurs", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "sleep_idle_seconds", label: "Secondes de Veille", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "s", step: 1 },
  { name: "polling", label: "Interrogation", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "polling_batch", label: "Traitement par Lot", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "reasoning_format", label: "Format de Raisonnement", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "reasoning_budget", label: "Budget de Raisonnement", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "tokens", step: 1 },
  { name: "custom_params", label: "Paramètres Personnalisés", type: "text", defaultValue: "", xs: 12, sm: 6 },
];
