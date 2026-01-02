"use client";

import React from "react";
import type { SvgIconTypeMap } from "@mui/material";
import {
  Memory as MemoryIcon,
  Settings as SettingsIcon,
  DeveloperBoard as GpuIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import type { ConfigType, FieldDefinition, SectionGroup, ValidationRule } from "./types";

// Create icon elements factory
type IconComponentType = React.ComponentType<SvgIconTypeMap["props"]>;

const createIcon = (IconComponent: IconComponentType): React.ReactElement =>
  React.createElement(IconComponent);

// Section groups for memory configuration
export const memorySectionGroups: SectionGroup[] = [
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
];

// Section groups for GPU configuration
export const gpuSectionGroups: SectionGroup[] = [
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
];

// Validation rules for memory and GPU fields
export const inferenceValidationRules: Record<string, ValidationRule> = {
  cache_ram: { min: 0, max: 128, required: false },
  defrag_thold: { min: -1, max: 1, required: false },
  gpu_layers: { min: -1, max: 1000, required: false },
  main_gpu: { min: 0, max: 16, required: false },
  kv_offload: { min: 0, max: 1, required: false },
};

// Field definitions for memory configuration
export const memoryConfigFields: FieldDefinition[] = [
  { name: "cache_ram", label: "Cache RAM", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "Go", step: 0.1 },
  { name: "cache_type_k", label: "Type de Cache K", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "cache_type_v", label: "Type de Cache V", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "mmap", label: "MMap (Cartographie Mémoire)", type: "boolean", defaultValue: true, xs: 12, sm: 6 },
  { name: "mlock", label: "MLock (Verrou Mémoire)", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "numa", label: "NUMA", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "defrag_thold", label: "Seuil de Défragmentation", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "", step: 0.01 },
];

// Field definitions for GPU configuration
export const gpuConfigFields: FieldDefinition[] = [
  { name: "device", label: "Périphérique", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "list_devices", label: "Lister les Périphériques", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "gpu_layers", label: "Couches GPU", type: "number", defaultValue: -1, xs: 12, sm: 6, unit: "couches", step: 1 },
  { name: "split_mode", label: "Mode de Partage", type: "select", options: ["", "layer", "row"], defaultValue: "", xs: 12, sm: 6 },
  { name: "tensor_split", label: "Répartition Tensor", type: "text", defaultValue: "", xs: 12, sm: 6 },
  { name: "main_gpu", label: "GPU Principal", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
  { name: "kv_offload", label: "Déchargement KV", type: "number", defaultValue: 0, xs: 12, sm: 6, unit: "", step: 1 },
  { name: "repack", label: "Réempaqueter", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
  { name: "no_host", label: "Pas d'Hôte", type: "boolean", defaultValue: false, xs: 12, sm: 6 },
];
